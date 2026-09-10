-- trg_sync_commitment_gate must be SECURITY DEFINER: it calls sync_commitment_gate()
-- internally, and without SECURITY DEFINER that call is checked against the
-- invoking client's role (which correctly has no EXECUTE on the internal helper),
-- causing every commitment insert/update/delete to fail with permission denied.
create or replace function public.trg_sync_commitment_gate()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  perform public.sync_commitment_gate(coalesce(new.opportunity_id, old.opportunity_id));
  return null;
end;
$$;
;
