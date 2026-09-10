-- Direct detail edits (0012) don't go through transition_opportunity(),
-- which is the only place updated_at was previously being maintained.
-- Add a standard trigger so updated_at reflects ANY row update,
-- consistent with what the opportunity board's "updated date" column
-- implies.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_opportunities_updated_at on public.opportunities;
create trigger trg_opportunities_updated_at
before update on public.opportunities
for each row
execute function public.set_updated_at();
