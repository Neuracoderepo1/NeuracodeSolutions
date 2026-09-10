-- is_org_admin_for_opportunity is not referenced by any RLS policy or any other
-- function in this database (verified against pg_policies and routine_definition).
-- It is currently reachable as a public RPC (/rest/v1/rpc/is_org_admin_for_opportunity)
-- for zero functional reason. Lock it to internal roles only.
revoke execute on function public.is_org_admin_for_opportunity(uuid) from authenticated;
