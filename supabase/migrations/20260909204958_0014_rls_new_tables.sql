alter table public.buyers enable row level security;
alter table public.evidence enable row level security;
alter table public.experiments enable row level security;
alter table public.landing_tests enable row level security;
alter table public.revenue_snapshots enable row level security;
alter table public.exit_scores enable row level security;

-- Members can read and contribute working data (buyers, evidence, experiments, landing tests)
create policy buyers_select on public.buyers for select
  using (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));
create policy buyers_insert on public.buyers for insert
  with check (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));
create policy buyers_update on public.buyers for update
  using (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));

create policy evidence_select on public.evidence for select
  using (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));
create policy evidence_insert on public.evidence for insert
  with check (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));

create policy experiments_select on public.experiments for select
  using (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));
create policy experiments_insert on public.experiments for insert
  with check (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));
create policy experiments_update on public.experiments for update
  using (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));

create policy landing_tests_select on public.landing_tests for select
  using (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));
create policy landing_tests_insert on public.landing_tests for insert
  with check (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));

-- Revenue and exit readiness are commercially sensitive: members can read,
-- only OWNER/ADMIN can write (mirrors "only OWNER/ADMIN can authorize builds" in spec section 25).
create policy revenue_select on public.revenue_snapshots for select
  using (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));
create policy revenue_insert on public.revenue_snapshots for insert
  with check (public.is_org_admin_for_opportunity(opportunity_id));

create policy exit_scores_select on public.exit_scores for select
  using (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));
create policy exit_scores_upsert on public.exit_scores for insert
  with check (public.is_org_admin_for_opportunity(opportunity_id));
create policy exit_scores_update on public.exit_scores for update
  using (public.is_org_admin_for_opportunity(opportunity_id));
