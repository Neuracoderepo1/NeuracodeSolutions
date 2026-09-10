-- Defense-in-depth for objects created by postgres (including local/CI migrations).
-- New public tables/functions/sequences remain inaccessible to Data API roles
-- until a migration explicitly grants the required capability.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete, truncate, references, trigger on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke usage, select, update on sequences from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke execute on functions from public;;
