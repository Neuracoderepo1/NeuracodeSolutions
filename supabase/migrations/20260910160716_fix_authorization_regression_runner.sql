-- Reconstructed from supabase_migrations.schema_migrations.statements on
-- 2026-09-10 — applied live but never committed. Fixes the previous
-- migration: pgTAP needs plan()/finish() to produce a real TAP summary,
-- not just a stream of ok()/not ok() lines. Superseded by the next
-- migration, which corrects the plan count from 20 to 21 — kept as its
-- own file rather than squashed, for an accurate history.

create or replace function tests.authorization_regression()
returns setof text
language plpgsql
security invoker
set search_path = pg_catalog, public, tests
as $$
begin
  perform plan(20);
  return next ok((select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='organizations'), 'organizations has RLS enabled');
  return next ok((select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='opportunities'), 'opportunities has RLS enabled');
  return next ok((select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='commitments'), 'commitments has RLS enabled');
  return next ok((select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='validation_gates'), 'validation_gates has RLS enabled');
  return next ok((select relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='organizations'), 'organizations has FORCE RLS');
  return next ok((select relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='opportunities'), 'opportunities has FORCE RLS');
  return next ok((select relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='commitments'), 'commitments has FORCE RLS');
  return next ok(has_table_privilege('anon','public.organizations','SELECT') = false, 'anon cannot select organizations');
  return next ok(has_table_privilege('anon','public.opportunities','SELECT') = false, 'anon cannot select opportunities');
  return next ok(has_table_privilege('anon','public.commitments','SELECT') = false, 'anon cannot select commitments');
  return next ok(has_table_privilege('authenticated','public.opportunities','DELETE') = false, 'authenticated cannot delete opportunities');
  return next ok(has_table_privilege('authenticated','public.opportunities','TRUNCATE') = false, 'authenticated cannot truncate opportunities');
  return next ok(has_table_privilege('authenticated','public.opportunities','TRIGGER') = false, 'authenticated cannot create triggers on opportunities');
  return next ok(has_table_privilege('anon','public.opportunities','DELETE') = false, 'anon cannot delete opportunities');
  return next ok(has_function_privilege('anon','public.create_organization(text)','EXECUTE') = false, 'anon cannot execute create_organization');
  return next ok(has_function_privilege('anon','public.compute_pbv(uuid)','EXECUTE') = false, 'anon cannot execute compute_pbv');
  return next ok(has_function_privilege('anon','public.transition_opportunity(uuid,public.opportunity_stage)','EXECUTE') = false, 'anon cannot execute transition_opportunity');
  return next ok(has_function_privilege('authenticated','public.enforce_pbv_weight_total()','EXECUTE') = false, 'authenticated cannot execute enforce_pbv_weight_total');
  return next ok(has_function_privilege('authenticated','public.reject_ledger_mutation()','EXECUTE') = false, 'authenticated cannot execute reject_ledger_mutation');
  return next ok(not exists (select 1 from information_schema.columns where table_schema='public' and table_name='lifecycle_transitions' and column_name in ('organization_id','opportunity_id')), 'lifecycle_transitions has no tenant ownership columns');
  return next ok((select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='lifecycle_transitions'), 'lifecycle_transitions keeps RLS enabled');
  return next finish();
end;
$$;
revoke all on function tests.authorization_regression() from public, anon, authenticated;
