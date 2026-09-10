-- Harden the gate/commitment controls introduced for the validation workflow.
-- COMMITMENT remains derived and cannot be manually set.
-- Manual gate changes require a meaningful reason.
-- Commitment verification is limited to the two actionable states.
-- gate_decisions is append-only to authenticated clients.

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
    raise exception 'COMMITMENT gate is derived and cannot be manually set' using errcode = '42501';
  end if;

  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'a reason is required for manual gate decisions' using errcode = '22023';
  end if;

  select organization_id into v_org_id
  from public.opportunities
  where id = p_opportunity_id;

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

  insert into public.gate_decisions
    (opportunity_id, gate, previous_status, new_status, actor, reason)
  values
    (p_opportunity_id, p_gate, v_previous, p_status, auth.uid(), btrim(p_reason));

  return p_status;
end;
$$;

create or replace function public.verify_commitment(
  p_commitment_id uuid,
  p_status public.verification_status
)
returns public.verification_status
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_opportunity_id uuid;
  v_org_id uuid;
  v_role public.org_role;
begin
  if p_status not in ('VERIFIED','REJECTED') then
    raise exception 'commitment verification must be VERIFIED or REJECTED' using errcode = '22023';
  end if;

  select opportunity_id into v_opportunity_id
  from public.commitments
  where id = p_commitment_id;

  if v_opportunity_id is null then
    raise exception 'commitment not found' using errcode = 'P0002';
  end if;

  v_org_id := public.org_id_for_opportunity(v_opportunity_id);
  v_role := public.get_org_role(v_org_id);

  if v_role is null then
    raise exception 'not authorized: not a member of this organization' using errcode = '42501';
  end if;
  if v_role not in ('OWNER','ADMIN') then
    raise exception 'not authorized: role % cannot verify commitments', v_role using errcode = '42501';
  end if;

  update public.commitments
  set verification_status = p_status,
      verified_at = now(),
      verified_by = auth.uid()
  where id = p_commitment_id
    and verification_status = 'UNVERIFIED';

  if not found then
    raise exception 'commitment is already resolved' using errcode = '55000';
  end if;

  return p_status;
end;
$$;

-- gate_decisions is an audit log: clients may read it, but never mutate/delete history.
revoke insert, update, delete, truncate on table public.gate_decisions from anon, authenticated;
revoke all on table public.gate_decisions from public;
grant select on table public.gate_decisions to authenticated;

-- Keep the RPCs callable by signed-in users; the functions themselves enforce org membership/role.
grant execute on function public.record_pbv_evidence(uuid, text, numeric, text) to authenticated;
grant execute on function public.set_validation_gate(uuid, public.gate_name, public.gate_status, text) to authenticated;
grant execute on function public.transition_opportunity(uuid, public.opportunity_stage) to authenticated;
grant execute on function public.verify_commitment(uuid, public.verification_status) to authenticated;
;
