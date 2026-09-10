-- Keep the pgTAP test schema outside the PostgREST/application role surface.
-- The schema is for CI/development only; authenticated and anon must not have access.
revoke all on schema tests from anon, authenticated;
