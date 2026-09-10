# Migration chain — reconstructed from live database, 2026-09-10

These files are a byte-faithful reconstruction of every migration actually
applied to the live Supabase project (`ivcweujfzdwmkztjczln`), pulled
directly from `supabase_migrations.schema_migrations.statements`. Before
this, the repository had **zero** migration files — all of this history
existed only inside the live database. If that project were ever lost or
reset, none of this hardening could have been reproduced.

## Ordering

Filenames are `<version>_<sequence>_<name>.sql`. The `<version>` prefix is
the real applied timestamp (what Postgres/Supabase CLI actually use for
ordering) and is unchanged from what's live. The `<sequence>` number
(0001-0024) was cleaned up on 2026-09-10: two different sessions had
applied migrations somewhat independently, producing three separate
migrations each originally labeled `0012`, three labeled `0013`, and two
labeled `0014`. That was cosmetic, not a correctness bug -- real ordering
was never ambiguous -- but confusing to audit. Renaming only touched the
human-readable sequence number; no timestamp, and therefore no behavior,
changed. A fresh `supabase db reset` or `supabase migration up` against
these files reproduces live state in the exact order it was actually
built.

## Fixed: 0024 -- is_org_admin_for_opportunity grant

Found while reconstructing the chain, then confirmed and fixed live on
2026-09-10:

`0014_rls_new_tables` (originally applied as `"0013_rls_new_tables"`)
added RLS policies on `revenue_snapshots`/`exit_scores` calling
`is_org_admin_for_opportunity()`, but `0012_revoke_unused_admin_check_rpc_exposure`
had already revoked `authenticated`'s EXECUTE on that function one
migration earlier -- correct when applied, since nothing referenced the
function at the time. Net effect until the fix: an OWNER/ADMIN inserting
a revenue snapshot or updating exit scores got
`permission denied for function is_org_admin_for_opportunity`, a hard
error, not a normal RLS rejection.

Verified both directions live (transactions rolled back, no data
persisted):
- Before the fix: real OWNER insert -> `permission denied for function ...`
- After the fix: same OWNER insert -> succeeds
- Same MEMBER insert -> correctly blocked with a normal RLS policy
  violation (not a function-permission error), confirming the fix
  restored the *intended* admin-only behavior rather than over-opening it

`0024` is the exact fix applied live: re-grants EXECUTE on
`is_org_admin_for_opportunity(uuid)` to `authenticated`. This doesn't
reopen the function's original over-exposure -- it only returns a boolean
derived from the caller's own role -- it's the same class of "must stay
grantee because RLS calls it" function as
`is_org_member`/`get_org_role`/`org_id_for_opportunity`.

## Superseded functions, kept for audit fidelity

`0007_gate_functions.sql` and `0008_commitment_functions.sql` contain the
*original* `set_validation_gate` and `verify_commitment` -- these allowed
manually setting the `COMMITMENT` gate and allowed re-verifying an
already-resolved commitment. Both are superseded later in the chain
(`0016_harden_gate_commitment_controls_and_audit`, then
`0020_derive_commitment_gate`). They're kept as their own files rather
than edited in place, per migration discipline: never rewrite history,
only add forward migrations that change behavior.

## Checked and found correct: lifecycle_transitions RLS

The hardening directive specifically flags `lifecycle_transitions_select`
as worth checking for unrestricted cross-tenant SELECT. Verified: this
table stores the abstract state-machine definition (12 fixed
`from_stage -> to_stage` rows -- e.g. `PRE_SALE -> BUILD`), not any
per-tenant history. It's global reference data, structurally identical to
`pbv_dimensions` (also `using (true)`), not a leak of one org's data to
another. No fix needed here -- per-opportunity transition history lives in
`decision_ledger`, which is already org-scoped.
