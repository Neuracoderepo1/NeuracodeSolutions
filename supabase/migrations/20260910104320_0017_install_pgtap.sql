-- pgTAP for a real, repeatable regression suite. Installed in its own schema, not
-- exposed to PostgREST/API roles -- it's a dev/CI tool, not part of the product surface.
create schema if not exists tests;
create extension if not exists pgtap with schema tests;
revoke all on schema tests from anon, authenticated;
;
