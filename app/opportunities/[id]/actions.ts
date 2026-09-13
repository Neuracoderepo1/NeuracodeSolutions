"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TransitionResult, GateName, GateStatus, CommitmentType } from "@/lib/types";

export type BuildActionState = {
  result: TransitionResult | null;
  error: string | null;
};

/**
 * Calls transition_opportunity(opportunity_id, 'BUILD') — the ONLY function
 * in this codebase allowed to move an opportunity into BUILD. This action
 * does not check PBV, gates, or commitments itself; it renders whatever the
 * RPC returns, verbatim. There is deliberately no client-side authorization
 * logic to keep in sync with the database — see HANDOFF.md.
 */
export async function requestBuild(
  opportunityId: string,
  _prevState: BuildActionState,
  _formData: FormData
): Promise<BuildActionState> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("transition_opportunity", {
      p_opportunity_id: opportunityId,
      p_requested_stage: "BUILD",
    })
    .single<TransitionResult>();

  if (error) {
    // A thrown exception from the RPC (not authorized/not a member/opportunity
    // not found) lands here — distinct from an ALLOWED:false response, which
    // is a normal, expected outcome logged to decision_ledger, not an error.
    return { result: null, error: error.message };
  }

  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/");

  return { result: data, error: null };
}

// ----------------------------------------------------------------------------
// Gate control, PBV evidence, and commitment logging/verification.
//
// None of these decide anything — set_validation_gate(), record_pbv_evidence(),
// and verify_commitment() do, inside the database. Each raises on the same
// conditions the RPC bodies enforce (role, membership, COMMITMENT being
// derived-only, a reason being required for gate decisions, score range,
// re-verifying an already-resolved commitment) — this file just relays
// whatever they say, same pattern as requestBuild above.
// ----------------------------------------------------------------------------

export type SimpleActionState = { ok: boolean; error: string | null };
export const initialSimpleState: SimpleActionState = { ok: false, error: null };

export async function setGate(
  opportunityId: string,
  _prevState: SimpleActionState,
  formData: FormData
): Promise<SimpleActionState> {
  const supabase = await createClient();

  const gate = String(formData.get("gate")) as GateName;
  const status = String(formData.get("status")) as GateStatus;
  const reason = String(formData.get("reason") ?? "").trim();

  const { error } = await supabase.rpc("set_validation_gate", {
    p_opportunity_id: opportunityId,
    p_gate: gate,
    p_status: status,
    p_reason: reason,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/");
  return { ok: true, error: null };
}

export async function recordEvidence(
  opportunityId: string,
  dimensionKey: string,
  _prevState: SimpleActionState,
  formData: FormData
): Promise<SimpleActionState> {
  const supabase = await createClient();

  const score = Number(formData.get("score"));
  const evidenceText = String(formData.get("evidenceText") ?? "").trim() || undefined;

  if (Number.isNaN(score)) {
    return { ok: false, error: "Score must be a number" };
  }

  const { error } = await supabase.rpc("record_pbv_evidence", {
    p_opportunity_id: opportunityId,
    p_dimension_key: dimensionKey,
    p_score: score,
    p_evidence_text: evidenceText,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/");
  return { ok: true, error: null };
}

export async function logCommitment(
  opportunityId: string,
  _prevState: SimpleActionState,
  formData: FormData
): Promise<SimpleActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const type = String(formData.get("type")) as CommitmentType;
  const buyerReference = String(formData.get("buyerReference") ?? "").trim() || null;
  const source = String(formData.get("source") ?? "").trim() || null;

  // verification_status/verified_at/verified_by are intentionally omitted —
  // the commitments_insert RLS policy requires verification_status =
  // 'UNVERIFIED' and both verified fields NULL at insert time. Only
  // verify_commitment() (OWNER/ADMIN only) can move it to VERIFIED/REJECTED.
  const { error } = await supabase.from("commitments").insert({
    opportunity_id: opportunityId,
    type,
    buyer_reference: buyerReference,
    source,
    created_by: user.id,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/");
  return { ok: true, error: null };
}

export async function verifyCommitment(
  opportunityId: string,
  commitmentId: string,
  status: "VERIFIED" | "REJECTED"
): Promise<SimpleActionState> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("verify_commitment", {
    p_commitment_id: commitmentId,
    p_status: status,
  });

  if (error) return { ok: false, error: error.message };

  // No manual sync call needed here — trg_commitments_sync_gate fires on
  // this UPDATE automatically and recomputes the COMMITMENT gate.
  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/");
  return { ok: true, error: null };
}
