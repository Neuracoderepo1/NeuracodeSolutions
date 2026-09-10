
-- The MVP workspace lets founders document the problem, solution
-- hypothesis, buyer, pricing, and MVP target. These are descriptive
-- fields, not authorization-relevant, but the previous migrations
-- (correctly) granted no UPDATE at all on opportunities to
-- authenticated. Add a narrowly column-scoped grant + RLS policy so
-- only these specific columns are ever updatable directly by a client,
-- and only by a member of the owning organization.
--
-- stage, version, organization_id, created_by remain fully protected:
-- there is no column grant for them here, so any attempt to include
-- them in an UPDATE statement is rejected at the grant level before
-- RLS is even evaluated — the same defense-in-depth pattern already
-- used elsewhere in this schema (e.g. pbv_scores, validation_gates
-- have no direct UPDATE grant at all).

grant update (
  title,
  description,
  problem_statement,
  solution_hypothesis,
  buyer_description,
  price_hypothesis,
  mvp_days
) on public.opportunities to authenticated;

create policy opportunities_update_details
on public.opportunities
for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));
;
