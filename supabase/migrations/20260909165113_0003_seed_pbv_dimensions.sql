insert into public.pbv_dimensions (key, weight) values
  ('pain', 15),
  ('frequency', 10),
  ('buyerClarity', 10),
  ('existingSpend', 10),
  ('roi', 10),
  ('wtp', 15),
  ('whitespace', 10),
  ('distribution', 10),
  ('feasibility', 5),
  ('exit', 5);

-- Consistency guard: dimension weights must always total exactly 100.
-- This trigger fires on any future change to pbv_dimensions.
create or replace function public.enforce_pbv_weight_total()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_total numeric;
begin
  select coalesce(sum(weight), 0) into v_total from public.pbv_dimensions;
  if v_total <> 100 then
    raise exception 'pbv_dimensions weights must total exactly 100 (currently %)', v_total;
  end if;
  return null;
end;
$$;

create constraint trigger trg_pbv_weight_total
  after insert or update or delete on public.pbv_dimensions
  deferrable initially deferred
  for each row execute function public.enforce_pbv_weight_total();
