-- Reconstructed from supabase_migrations.schema_migrations.statements on
-- 2026-09-10 — applied live but never committed. Companion to
-- 0029_reassign_founder_org_owner: that migration only updated
-- organization_members.user_id, which doesn't touch created_by on
-- existing opportunities rows. This backfills those.
--
-- Independently verified live during this audit: all 17 real opportunities
-- now show created_by = the founder's user id, none still reference the
-- seed user.

update opportunities
set created_by = 'e78c721f-82cc-4210-b560-de3814093ef4'
where organization_id = '11111111-1111-1111-1111-111111111111'
  and created_by = '11111111-1111-1111-1111-111111111112';
