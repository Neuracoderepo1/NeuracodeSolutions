drop policy if exists exit_scores_select on public.exit_scores;
create policy exit_scores_select on public.exit_scores
  for select to authenticated
  using (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));

drop policy if exists exit_scores_update on public.exit_scores;
create policy exit_scores_update on public.exit_scores
  for update to authenticated
  using (public.is_org_admin_for_opportunity(opportunity_id))
  with check (public.is_org_admin_for_opportunity(opportunity_id));

drop policy if exists exit_scores_upsert on public.exit_scores;
create policy exit_scores_upsert on public.exit_scores
  for insert to authenticated
  with check (public.is_org_admin_for_opportunity(opportunity_id));
;
