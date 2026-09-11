# Runbook: reassign org ownership to the real founder

**Status: DONE**, as of 2026-09-10 (migrations `0029_reassign_founder_org_owner`
and `0030_backfill_founder_opportunity_ownership`). Kept here for the record
and because the pattern (direct `organization_members`/`opportunities`
mutation via migration, not through the app) is the right template if this
ever needs to happen again for another org.

## What actually happened (differs from the original plan below)

The founder signed up as `neuracodestudios@gmail.com`
(`e78c721f-82cc-4210-b560-de3814093ef4`). Rather than inserting a new `OWNER`
row and demoting the seed user to `MEMBER` (the original plan further down),
the reassignment **transplanted ownership in place**:

```sql
update organization_members
set user_id = 'e78c721f-82cc-4210-b560-de3814093ef4'
where organization_id = '11111111-1111-1111-1111-111111111111'
  and user_id = '11111111-1111-1111-1111-111111111112'; -- seed@neuracode.internal
```

followed by a backfill of `opportunities.created_by` for the same reason
(the org membership swap doesn't touch `created_by` on existing rows):

```sql
update opportunities
set created_by = 'e78c721f-82cc-4210-b560-de3814093ef4'
where organization_id = '11111111-1111-1111-1111-111111111111'
  and created_by = '11111111-1111-1111-1111-111111111112';
```

Net effect, verified live 2026-09-10: `seed@neuracode.internal` now has
**no** row in `organization_members` at all (not demoted-and-present, fully
disassociated from the org), the founder is the sole `OWNER`, and all 17 real
opportunities show the founder as `created_by`. The seed user's
`auth.users` row itself is untouched — historical `decision_ledger`/
`gate_decisions` rows from the original seeding still correctly attribute to
it as `actor`, since those don't go through `organization_members`.

This is arguably simpler than the original plan (no leftover demoted-owner
membership row to reason about later) — noted here as the actual precedent,
not a correction.

## What was originally planned (superseded, kept for context)

<details>
<summary>Original plan: insert-new-OWNER + demote-seed-to-MEMBER</summary>

1. Have the real founder sign up via `/login` → "Create account".
2. Find their user id via `select id, email from auth.users order by
   created_at desc limit 5;`.
3. Run:
   ```sql
   insert into public.organization_members (organization_id, user_id, role)
   values ('11111111-1111-1111-1111-111111111111', '<FOUNDER_USER_ID>', 'OWNER')
   on conflict (organization_id, user_id) do update set role = 'OWNER';

   update public.organization_members
   set role = 'MEMBER'
   where organization_id = '11111111-1111-1111-1111-111111111111'
     and user_id = '11111111-1111-1111-1111-111111111112';
   ```
4. Verify roles.

</details>
