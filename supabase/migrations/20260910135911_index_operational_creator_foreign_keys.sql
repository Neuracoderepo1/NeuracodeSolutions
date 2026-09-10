create index if not exists idx_buyers_created_by on public.buyers(created_by);
create index if not exists idx_evidence_created_by on public.evidence(created_by);
create index if not exists idx_exit_scores_updated_by on public.exit_scores(updated_by);
create index if not exists idx_experiments_created_by on public.experiments(created_by);
create index if not exists idx_landing_tests_created_by on public.landing_tests(created_by);
create index if not exists idx_revenue_snapshots_created_by on public.revenue_snapshots(created_by);
;
