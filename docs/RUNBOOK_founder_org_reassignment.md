# Runbook: reassign org ownership to the real founder

**Status: not yet run.** As of 2026-09-10, `auth.users` contains only test
fixtures (`owner_a/admin_a/member_a@test.local`, `owner_b/admin_b@test.local`)
plus the seed placeholder — no real founder has signed up. Do not run this
until they have.

This is deliberately a manual runbook, not an RPC exposed to the app — it
should happen once, on purpose, by whoever has service-role access, not be
automated into `signUp()` where it could fire on any signup.

## Steps

1. Have the real founder sign up via `/login` → "Create account" in the
   deployed app (or `supabase.auth.signUp` directly).
2. Find their user id:
   ```sql
   select id, email, created_at from auth.users order by created_at desc limit 5;
   ```
3. Run, substituting their real `id` for `<FOUNDER_USER_ID>`:
   ```sql
   begin;

   -- Promote the real founder to OWNER of the real org.
   insert into public.organization_members (organization_id, user_id, role)
   values ('11111111-1111-1111-1111-111111111111', '<FOUNDER_USER_ID>', 'OWNER')
   on conflict (organization_id, user_id) do update set role = 'OWNER';

   -- Demote the seed placeholder out of OWNER so it can't authorize BUILD
   -- transitions going forward. Not deleted outright, in case anything
   -- still references it as created_by/actor on historical rows.
   update public.organization_members
   set role = 'MEMBER'
   where organization_id = '11111111-1111-1111-1111-111111111111'
     and user_id = '11111111-1111-1111-1111-111111111112'; -- seed@neuracode.internal

   commit;
   ```
4. Verify:
   ```sql
   select u.email, om.role
   from public.organization_members om
   join auth.users u on u.id = om.user_id
   where om.organization_id = '11111111-1111-1111-1111-111111111111';
   ```
   Expect the founder as `OWNER`, seed as `MEMBER` (not `OWNER`), nobody else.
5. Once confirmed, decide separately whether to fully remove the seed user
   from `auth.users` — leaving it demoted-but-present is the safer default
   for a while, since `decision_ledger`/`gate_decisions` rows from seeding
   reference it as `actor`, and those tables don't cascade-delete.
