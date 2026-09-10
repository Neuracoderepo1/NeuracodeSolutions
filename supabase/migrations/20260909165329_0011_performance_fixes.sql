-- Cover foreign keys flagged by the performance advisor.
create index if not exists idx_commitments_created_by on public.commitments(created_by);
create index if not exists idx_commitments_verified_by on public.commitments(verified_by);
create index if not exists idx_ledger_actor on public.decision_ledger(actor);
create index if not exists idx_gate_decisions_actor on public.gate_decisions(actor);
create index if not exists idx_gate_decisions_opp on public.gate_decisions(opportunity_id);
create index if not exists idx_opportunities_created_by on public.opportunities(created_by);
create index if not exists idx_pbv_evidence_dimension on public.pbv_evidence(dimension_key);
create index if not exists idx_pbv_evidence_submitted_by on public.pbv_evidence(submitted_by);
create index if not exists idx_pbv_scores_dimension on public.pbv_scores(dimension_key);
create index if not exists idx_pbv_scores_updated_by on public.pbv_scores(updated_by);
create index if not exists idx_validation_gates_updated_by on public.validation_gates(updated_by);

-- RLS initplan optimization: wrap auth.uid() so it's evaluated once, not per-row.
drop policy opportunities_insert on public.opportunities;
create policy opportunities_insert on public.opportunities
  for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = (select auth.uid())
    and stage = 'DISCOVER'
    and version = 1
  );

drop policy commitments_insert on public.commitments;
create policy commitments_insert on public.commitments
  for insert to authenticated
  with check (
    public.is_org_member(public.org_id_for_opportunity(opportunity_id))
    and created_by = (select auth.uid())
    and verification_status = 'UNVERIFIED'
    and verified_at is null
    and verified_by is null
  );
