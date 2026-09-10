-- P0 hardening: COMMITMENT gate is derived exclusively from verified commitments.
-- It must never be manually authored through the generic gate RPC.
create or replace function public.set_validation_gate(
  p_opportunity_id uuid,
  p_gate public.gate_name,
  p_status public.gate_status,
  p_reason text default null
)
returns public.gate_status
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_org_id uuid;
  v_role public.org_role;
  v_previous public.gate_status;
begin
  if p_gate = 'COMMITMENT' then
    raise exception 'COMMITMENT gate is derived from verified qualified commitments and cannot be manually changed' using errcode = '42501';
  end if;

  select organization_id into v_org_id from public.opportunities where id = p_opportunity_id;
  if v_org_id is null then
    raise exception 'opportunity not found' using errcode = 'P0002';
  end if;

  v_role := public.get_org_role(v_org_id);
  if v_role is null then
    raise exception 'not authorized: not a member of this organization' using errcode = '42501';
  end if;
  if v_role not in ('OWNER','ADMIN') then
    raise exception 'not authorized: role % cannot authorize gates', v_role using errcode = '42501';
  end if;

  select status into v_previous
  from public.validation_gates
  where opportunity_id = p_opportunity_id and gate = p_gate;

  if v_previous is null then
    v_previous := 'OPEN';
  end if;

  insert into public.validation_gates (opportunity_id, gate, status, updated_by, updated_at)
  values (p_opportunity_id, p_gate, p_status, auth.uid(), now())
  on conflict (opportunity_id, gate)
  do update set status = excluded.status, updated_by = excluded.updated_by, updated_at = now();

  insert into public.gate_decisions (opportunity_id, gate, previous_status, new_status, actor, reason)
  values (p_opportunity_id, p_gate, v_previous, p_status, auth.uid(), p_reason);

  return p_status;
end;
$$;

revoke all on function public.set_validation_gate(uuid, public.gate_name, public.gate_status, text) from public;
grant execute on function public.set_validation_gate(uuid, public.gate_name, public.gate_status, text) to authenticated;

-- P0 hardening: BUILD is a governance authorization decision. Membership alone is
-- insufficient; only OWNER/ADMIN may authorize the transition after all evidence gates pass.
create or replace function public.transition_opportunity(
  p_opportunity_id uuid,
  p_requested_stage public.opportunity_stage
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_opp record;
  v_org_id uuid;
  v_role public.org_role;
  v_pbv numeric;
  v_gates_ok boolean;
  v_qualified int;
  v_gate_state jsonb;
  v_blocking jsonb := '[]'::jsonb;
  v_result text;
  v_allowed boolean := false;
begin
  select * into v_opp
  from public.opportunities
  where id = p_opportunity_id
  for update;

  if not found then
    raise exception 'opportunity not found' using errcode = 'P0002';
  end if;

  v_org_id := v_opp.organization_id;

  if not public.is_org_member(v_org_id) then
    raise exception 'not authorized: not a member of this organization' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.lifecycle_transitions
    where from_stage = v_opp.stage and to_stage = p_requested_stage
  ) then
    v_result := 'TRANSITION_REJECTED';
    insert into public.decision_ledger
      (opportunity_id, decision, previous_stage, requested_stage, result,
       pbv, gate_state, qualified_commitments, blocking_reasons, actor)
    values
      (p_opportunity_id, v_result, v_opp.stage, p_requested_stage, v_result,
       null, null, null, jsonb_build_array('invalid transition: ' || v_opp.stage || ' -> ' || p_requested_stage),
       auth.uid());
    return jsonb_build_object(
      'allowed', false,
      'decision', v_result,
      'stage', v_opp.stage,
      'blockingReasons', jsonb_build_array('invalid transition: ' || v_opp.stage || ' -> ' || p_requested_stage)
    );
  end if;

  if p_requested_stage = 'BUILD' then
    v_role := public.get_org_role(v_org_id);
    if v_role not in ('OWNER','ADMIN') then
      raise exception 'not authorized: role % cannot authorize BUILD', coalesce(v_role::text, 'NONE') using errcode = '42501';
    end if;

    if v_opp.stage <> 'PRE_SALE' then
      v_blocking := v_blocking || jsonb_build_array('current stage is not PRE_SALE');
    end if;

    select public.compute_pbv(p_opportunity_id) into v_pbv;
    if v_pbv < 85 then
      v_blocking := v_blocking || jsonb_build_array(format('PBV %s is below required 85', v_pbv));
    end if;

    select public.all_gates_passed(p_opportunity_id) into v_gates_ok;
    if not v_gates_ok then
      v_blocking := v_blocking || jsonb_build_array('not all 7 canonical gates are PASSED');
    end if;

    select public.count_qualified_commitments(p_opportunity_id) into v_qualified;
    if v_qualified < 3 then
      v_blocking := v_blocking || jsonb_build_array(format('only %s verified qualified commitments (need 3)', v_qualified));
    end if;

    select public.gate_state_json(p_opportunity_id) into v_gate_state;

    if jsonb_array_length(v_blocking) = 0 then
      v_allowed := true;
      v_result := 'BUILD_AUTHORIZED';
    else
      v_allowed := false;
      v_result := 'BUILD_BLOCKED';
    end if;
  else
    select public.compute_pbv(p_opportunity_id) into v_pbv;
    select public.gate_state_json(p_opportunity_id) into v_gate_state;
    select public.count_qualified_commitments(p_opportunity_id) into v_qualified;
    v_allowed := true;
    v_result := 'TRANSITION_AUTHORIZED';
  end if;

  if v_allowed then
    update public.opportunities
    set stage = p_requested_stage,
        version = version + 1,
        updated_at = now()
    where id = p_opportunity_id;
  end if;

  insert into public.decision_ledger
    (opportunity_id, decision, previous_stage, requested_stage, result,
     pbv, gate_state, qualified_commitments, blocking_reasons, actor)
  values
    (p_opportunity_id, v_result, v_opp.stage,
     case when v_allowed then p_requested_stage else v_opp.stage end,
     v_result, v_pbv, v_gate_state, v_qualified, v_blocking, auth.uid());

  return jsonb_build_object(
    'allowed', v_allowed,
    'decision', v_result,
    'stage', case when v_allowed then p_requested_stage else v_opp.stage end,
    'pbv', v_pbv,
    'qualifiedCommitments', v_qualified,
    'gateState', v_gate_state,
    'blockingReasons', v_blocking
  );
end;
$$;

revoke all on function public.transition_opportunity(uuid, public.opportunity_stage) from public;
grant execute on function public.transition_opportunity(uuid, public.opportunity_stage) to authenticated;;
