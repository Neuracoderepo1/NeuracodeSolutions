drop policy if exists buyers_insert on public.buyers;
create policy buyers_insert on public.buyers
  for insert to authenticated
  with check (
    public.is_org_member(public.org_id_for_opportunity(opportunity_id))
    and created_by = (select auth.uid())
  );

 drop policy if exists buyers_select on public.buyers;
create policy buyers_select on public.buyers
  for select to authenticated
  using (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));

 drop policy if exists buyers_update on public.buyers;
create policy buyers_update on public.buyers
  for update to authenticated
  using (public.is_org_member(public.org_id_for_opportunity(opportunity_id)))
  with check (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));

 drop policy if exists evidence_insert on public.evidence;
create policy evidence_insert on public.evidence
  for insert to authenticated
  with check (
    public.is_org_member(public.org_id_for_opportunity(opportunity_id))
    and created_by = (select auth.uid())
  );

 drop policy if exists evidence_select on public.evidence;
create policy evidence_select on public.evidence
  for select to authenticated
  using (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));

 drop policy if exists experiments_insert on public.experiments;
create policy experiments_insert on public.experiments
  for insert to authenticated
  with check (
    public.is_org_member(public.org_id_for_opportunity(opportunity_id))
    and created_by = (select auth.uid())
  );

 drop policy if exists experiments_select on public.experiments;
create policy experiments_select on public.experiments
  for select to authenticated
  using (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));

 drop policy if exists experiments_update on public.experiments;
create policy experiments_update on public.experiments
  for update to authenticated
  using (public.is_org_member(public.org_id_for_opportunity(opportunity_id)))
  with check (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));

 drop policy if exists landing_tests_insert on public.landing_tests;
create policy landing_tests_insert on public.landing_tests
  for insert to authenticated
  with check (
    public.is_org_member(public.org_id_for_opportunity(opportunity_id))
    and created_by = (select auth.uid())
  );

 drop policy if exists landing_tests_select on public.landing_tests;
create policy landing_tests_select on public.landing_tests
  for select to authenticated
  using (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));

 drop policy if exists revenue_insert on public.revenue_snapshots;
create policy revenue_insert on public.revenue_snapshots
  for insert to authenticated
  with check (
    public.is_org_admin_for_opportunity(opportunity_id)
    and created_by = (select auth.uid())
  );

 drop policy if exists revenue_select on public.revenue_snapshots;
create policy revenue_select on public.revenue_snapshots
  for select to authenticated
  using (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));
;
