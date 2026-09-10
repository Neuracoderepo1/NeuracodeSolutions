create or replace view public.opportunity_summary with (security_invoker = true) as
select
  id,
  organization_id,
  title,
  stage,
  problem_statement,
  buyer_description,
  price_hypothesis,
  mvp_days,
  updated_at,
  public.compute_pbv(id) as pbv,
  public.all_gates_passed(id) as gates_passed,
  public.gate_state_json(id) as gate_state,
  public.count_qualified_commitments(id) as qualified_commitments
from public.opportunities o;

revoke all on table public.opportunity_summary from anon, authenticated;
grant select on table public.opportunity_summary to authenticated;
;
