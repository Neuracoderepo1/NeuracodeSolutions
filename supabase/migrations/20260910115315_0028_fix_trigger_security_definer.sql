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
