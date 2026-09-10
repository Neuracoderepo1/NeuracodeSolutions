-- Enable + force RLS everywhere. FORCE means even the table owner is subject to RLS
-- (functions that need to bypass it do so explicitly via SECURITY DEFINER).
alter table public.organizations enable row level security;
alter table public.organizations force row level security;
alter table public.organization_members enable row level security;
alter table public.organization_members force row level security;
alter table public.opportunities enable row level security;
alter table public.opportunities force row level security;
alter table public.pbv_dimensions enable row level security;
alter table public.pbv_evidence enable row level security;
alter table public.pbv_evidence force row level security;
alter table public.pbv_scores enable row level security;
alter table public.pbv_scores force row level security;
alter table public.validation_gates enable row level security;
alter table public.validation_gates force row level security;
alter table public.gate_decisions enable row level security;
alter table public.gate_decisions force row level security;
alter table public.commitments enable row level security;
alter table public.commitments force row level security;
alter table public.decision_ledger enable row level security;
alter table public.decision_ledger force row level security;

-- organizations: members can read their own org
create policy org_select_member on public.organizations
  for select to authenticated
  using (public.is_org_member(id));

-- organization_members: members can see their own org's roster
create policy org_members_select on public.organization_members
  for select to authenticated
  using (public.is_org_member(organization_id));

-- pbv_dimensions: canonical reference data, readable by any authenticated user
create policy pbv_dimensions_select on public.pbv_dimensions
  for select to authenticated
  using (true);

-- opportunities: members can read their org's opportunities
create policy opportunities_select on public.opportunities
  for select to authenticated
  using (public.is_org_member(organization_id));

-- opportunities: a member may create an opportunity in their own org, as themselves,
-- and only in the initial DISCOVER stage. No client can create directly into a later stage.
create policy opportunities_insert on public.opportunities
  for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and stage = 'DISCOVER'
    and version = 1
  );

-- No direct UPDATE/DELETE policy on opportunities for any client role.
-- Stage/version mutation happens exclusively through transition_opportunity().

-- pbv_evidence / pbv_scores: readable by org members, but NOT directly insertable/updatable
-- by clients — only through record_pbv_evidence(). See grants at the end of this migration.
create policy pbv_evidence_select on public.pbv_evidence
  for select to authenticated
  using (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));

create policy pbv_scores_select on public.pbv_scores
  for select to authenticated
  using (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));

-- validation_gates: readable by org members; mutation only via set_validation_gate().
create policy validation_gates_select on public.validation_gates
  for select to authenticated
  using (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));

create policy gate_decisions_select on public.gate_decisions
  for select to authenticated
  using (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));

-- commitments: members can read their org's commitments and create UNVERIFIED ones
-- (as themselves). Verification is only via verify_commitment() (ADMIN/OWNER only).
create policy commitments_select on public.commitments
  for select to authenticated
  using (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));

create policy commitments_insert on public.commitments
  for insert to authenticated
  with check (
    public.is_org_member(public.org_id_for_opportunity(opportunity_id))
    and created_by = auth.uid()
    and verification_status = 'UNVERIFIED'
    and verified_at is null
    and verified_by is null
  );

-- decision_ledger: readable by org members; append-only via transition_opportunity().
create policy decision_ledger_select on public.decision_ledger
  for select to authenticated
  using (public.is_org_member(public.org_id_for_opportunity(opportunity_id)));

-- Tighten grants: authenticated gets SELECT/INSERT only where explicitly intended above.
-- No blanket UPDATE/DELETE grants to authenticated on any business table.
revoke all on public.organizations, public.organization_members, public.opportunities,
  public.pbv_dimensions, public.pbv_evidence, public.pbv_scores,
  public.validation_gates, public.gate_decisions, public.commitments, public.decision_ledger
  from authenticated, anon, public;

grant select on public.organizations, public.organization_members, public.pbv_dimensions,
  public.opportunities, public.pbv_evidence, public.pbv_scores,
  public.validation_gates, public.gate_decisions, public.commitments, public.decision_ledger
  to authenticated;

grant insert on public.opportunities to authenticated;
grant insert on public.commitments to authenticated;
