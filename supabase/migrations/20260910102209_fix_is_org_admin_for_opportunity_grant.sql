
-- Restores EXECUTE that revenue_insert / exit_scores_upsert / exit_scores_update RLS
-- policies depend on (see supabase/migrations/README.md for root cause). Same class
-- of "must stay grantee because RLS calls it" as is_org_member/get_org_role/
-- org_id_for_opportunity — does not reopen the original over-exposure since the
-- function only returns a boolean derived from the caller's own role.
grant execute on function public.is_org_admin_for_opportunity(uuid) to authenticated;
;
