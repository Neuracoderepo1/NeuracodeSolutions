-- Read-only summary view for the opportunity board: joins each opportunity
-- to its PBV/gate/commitment state via the canonical read-only helper
-- functions (compute_pbv, all_gates_passed, gate_state_json,
-- count_qualified_commitments) rather than reimplementing that math here
-- or in the frontend. One round trip instead of N+1 RPC calls per page.
--
-- security_invoker = true is load-bearing, not cosmetic: without it, a
-- view's underlying-table permission checks run as the VIEW OWNER, not the
-- querying user. If the owner is a role that bypasses RLS, that silently
-- leaks every organization's data to any authenticated caller. Verified
-- live before this migration was written (not just reasoned about):
--   - owner_a (Org A) via opportunity_summary -> sees only Org A's 2 rows
--   - seed org owner (NeuraCode) -> sees only NeuraCode's 17 rows
--   - anon -> hard "permission denied for view", not an empty result

create or replace view public.opportunity_summary
with (security_invoker = true) as
select
  o.id,
  o.organization_id,
  o.title,
  o.stage,
  o.problem_statement,
  o.buyer_description,
  o.price_hypothesis,
  o.mvp_days,
  o.updated_at,
  public.compute_pbv(o.id) as pbv,
  public.all_gates_passed(o.id) as gates_passed,
  public.gate_state_json(o.id) as gate_state,
  public.count_qualified_commitments(o.id) as qualified_commitments
from public.opportunities o;

grant select on public.opportunity_summary to authenticated;
revoke all on public.opportunity_summary from anon, public;
