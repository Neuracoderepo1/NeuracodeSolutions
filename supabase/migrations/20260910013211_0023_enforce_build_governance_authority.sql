-- CRITICAL FIX: transition_opportunity() checked org membership but never
-- checked governance role for the BUILD transition. Per the BUILD
-- Authorization Contract, "actor has sufficient governance authority" is a
-- mandatory AND condition alongside PBV/gates/commitments. As written, any
-- MEMBER (not just OWNER/ADMIN) could trigger BUILD once the other three
-- conditions happened to be satisfied. This adds the missing check and logs
-- a blocking reason (not a hard exception) so it fits the existing
-- allowed/blocked decision-ledger pattern rather than throwing.

create or replace function public.transition_opportunity(p_opportunity_id uuid, p_requested_stage opportunity_stage)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_opp record;
  v_org_id uuid;
  v_pbv numeric;
  v_gates_ok boolean;
  v_qualified int;
  v_gate_state jsonb;
  v_blocking jsonb := '[]'::jsonb;
  v_result text;
  v_allowed boolean := false;
  v_role public.org_role;
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

  v_role := public.get_org_role(v_org_id);

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
    if v_opp.stage <> 'PRE_SALE' then
      v_blocking := v_blocking || jsonb_build_array('current stage is not PRE_SALE');
    end if;

    if v_role is null or v_role not in ('OWNER','ADMIN') then
      v_blocking := v_blocking || jsonb_build_array('actor lacks governance authority to authorize BUILD (requires OWNER or ADMIN)');
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
$function$;
