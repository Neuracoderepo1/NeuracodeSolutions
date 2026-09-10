-- Defense-in-depth: authenticated/anon API roles must not retain
-- destructive or DDL-adjacent table privileges.
do $$
declare
  r record;
begin
  for r in
    select c.oid::regclass as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r','p')
  loop
    execute format(
      'revoke delete, truncate, references, trigger on table %s from authenticated',
      r.table_name
    );

    execute format(
      'revoke delete, truncate, references, trigger on table %s from anon',
      r.table_name
    );
  end loop;
end $$;
