-- Supabase's default privileges auto-grant EXECUTE on new public-schema functions to
-- anon and authenticated. We explicitly revoke from anon on every authorization-sensitive
-- function: unauthenticated callers must be rejected outright, not merely fail auth.uid()
-- checks inside the function body.
revoke execute on function public.is_org_member(uuid) from anon;
revoke execute on function public.get_org_role(uuid) from anon;
revoke execute on function public.org_id_for_opportunity(uuid) from anon;
revoke execute on function public.is_org_admin_for_opportunity(uuid) from anon;
revoke execute on function public.record_pbv_evidence(uuid, text, numeric, text) from anon;
revoke execute on function public.set_validation_gate(uuid, public.gate_name, public.gate_status, text) from anon;
revoke execute on function public.verify_commitment(uuid, public.verification_status) from anon;
revoke execute on function public.transition_opportunity(uuid, public.opportunity_stage) from anon;

-- Also close the same hole on table grants: anon must have zero access to business tables.
revoke all on public.organizations, public.organization_members, public.opportunities,
  public.pbv_dimensions, public.pbv_evidence, public.pbv_scores,
  public.validation_gates, public.gate_decisions, public.commitments, public.decision_ledger,
  public.lifecycle_transitions
  from anon;

-- Alter default privileges going forward for this schema so future functions/tables
-- don't silently reopen this hole.
alter default privileges in schema public revoke execute on functions from anon;
alter default privileges in schema public revoke all on tables from anon;
