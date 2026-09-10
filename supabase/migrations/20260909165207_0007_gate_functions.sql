-- Role-gated gate authorization. MEMBER cannot pass gates; ADMIN/OWNER can.
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

-- All 7 canonical gates must have an explicit PASSED row. Missing rows count as OPEN
-- (fail closed) -- we check for the presence of all 7 canonical gate names, each PASSED.
create or replace function public.all_gates_passed(p_opportunity_id uuid)
returns boolean
language sql
stable
set search_path = pg_catalog, public
as $$
  select (
    select count(*)
    from public.validation_gates g
    where g.opportunity_id = p_opportunity_id
      and g.status = 'PASSED'
  ) = (select count(*) from unnest(enum_range(null::public.gate_name)));
$$;

create or replace function public.gate_state_json(p_opportunity_id uuid)
returns jsonb
language sql
stable
set search_path = pg_catalog, public
as $$
  select coalesce(
    jsonb_object_agg(gn.gate_name, coalesce(g.status::text, 'OPEN')),
    '{}'::jsonb
  )
  from unnest(enum_range(null::public.gate_name)) as gn(gate_name)
  left join public.validation_gates g
    on g.opportunity_id = p_opportunity_id and g.gate = gn.gate_name;
$$;
