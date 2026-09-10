-- Completes the concurrent hardening that made the COMMITMENT gate non-manual:
-- automatically derive it from count_qualified_commitments() whenever commitments change.
create or replace function public.sync_commitment_gate(p_opportunity_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_qualified int;
  v_new_status public.gate_status;
  v_previous public.gate_status;
begin
  select public.count_qualified_commitments(p_opportunity_id) into v_qualified;
  v_new_status := case when v_qualified >= 3 then 'PASSED' else 'OPEN' end;

  select status into v_previous
  from public.validation_gates
  where opportunity_id = p_opportunity_id and gate = 'COMMITMENT';

  if v_previous is null then
    v_previous := 'OPEN';
  end if;

  if v_previous = v_new_status then
    return;
  end if;

  insert into public.validation_gates (opportunity_id, gate, status, updated_by, updated_at)
  values (p_opportunity_id, 'COMMITMENT', v_new_status, auth.uid(), now())
  on conflict (opportunity_id, gate)
  do update set status = excluded.status, updated_by = excluded.updated_by, updated_at = now();

  insert into public.gate_decisions (opportunity_id, gate, previous_status, new_status, actor, reason)
  values (p_opportunity_id, 'COMMITMENT', v_previous, v_new_status, auth.uid(),
          format('auto-derived: %s verified qualified commitment(s)', v_qualified));
end;
$$;

create or replace function public.trg_sync_commitment_gate()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  perform public.sync_commitment_gate(coalesce(new.opportunity_id, old.opportunity_id));
  return null;
end;
$$;

create trigger trg_commitments_sync_gate
  after insert or update or delete on public.commitments
  for each row execute function public.trg_sync_commitment_gate();
;
