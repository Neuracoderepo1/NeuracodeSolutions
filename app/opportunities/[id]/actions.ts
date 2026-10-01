"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  TransitionResult,
  GateName,
  GateStatus,
  CommitmentType,
  BuyerStatus,
  ExperimentVerdict,
} from "@/lib/types";
import { EXIT_SCORE_DIMENSIONS } from "@/lib/types";

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

// ----------------------------------------------------------------------------
// Buyers, evidence, experiments, landing tests, revenue snapshots, exit
// scores — the six tables added in migration 0012 with RLS enabled and no
// app code prior to this. buyers/evidence/experiments/landing_tests are
// member-writable; revenue_snapshots/exit_scores are OWNER/ADMIN-only
// writes (revenue_insert / exit_scores_upsert / exit_scores_update
// policies) — this file does not duplicate that check, it just relays
// whatever Postgres decides, same pattern as everything above.
// ----------------------------------------------------------------------------

export async function createBuyer(
  opportunityId: string,
  _prevState: SimpleActionState,
  formData: FormData
): Promise<SimpleActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const company = String(formData.get("company") ?? "").trim();
  if (!company) return { ok: false, error: "Company is required" };

  const numeric = (name: string) => {
    const raw = String(formData.get(name) ?? "").trim();
    if (!raw) return null;
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
  };
  const text = (name: string) => String(formData.get(name) ?? "").trim() || null;

  const { error } = await supabase.from("buyers").insert({
    opportunity_id: opportunityId,
    company,
    contact: text("contact"),
    role: text("role"),
    company_size: text("companySize"),
    estimated_revenue: numeric("estimatedRevenue"),
    pain: text("pain"),
    current_solution: text("currentSolution"),
    current_spend: numeric("currentSpend"),
    estimated_wtp: numeric("estimatedWtp"),
    next_followup: text("nextFollowup"),
    notes: text("notes"),
    created_by: user.id,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true, error: null };
}

export async function updateBuyerStatus(
  opportunityId: string,
  buyerId: string,
  status: BuyerStatus
): Promise<SimpleActionState> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("buyers")
    .update({
      status,
      last_contact: status === "TARGET" ? null : new Date().toISOString(),
    })
    .eq("id", buyerId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true, error: null };
}

export async function logLandingTest(
  opportunityId: string,
  _prevState: SimpleActionState,
  formData: FormData
): Promise<SimpleActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const count = (name: string) => {
    const n = Number(formData.get(name) ?? 0);
    return Number.isNaN(n) || n < 0 ? 0 : Math.floor(n);
  };

  const { error } = await supabase.from("landing_tests").insert({
    opportunity_id: opportunityId,
    visitors: count("visitors"),
    cta_clicks: count("ctaClicks"),
    leads: count("leads"),
    qualified_leads: count("qualifiedLeads"),
    demos: count("demos"),
    trial_requests: count("trialRequests"),
    lois: count("lois"),
    preorders: count("preorders"),
    created_by: user.id,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true, error: null };
}

export async function addEvidence(
  opportunityId: string,
  _prevState: SimpleActionState,
  formData: FormData
): Promise<SimpleActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const claim = String(formData.get("claim") ?? "").trim();
  if (!claim) return { ok: false, error: "Claim is required" };

  const evidenceLevel = Number(formData.get("evidenceLevel") ?? 0);
  if (Number.isNaN(evidenceLevel) || evidenceLevel < 0 || evidenceLevel > 10) {
    return { ok: false, error: "Evidence level must be 0–10" };
  }

  const confidenceRaw = String(formData.get("confidence") ?? "").trim();
  let confidence: number | null = null;
  if (confidenceRaw) {
    confidence = Number(confidenceRaw);
    if (Number.isNaN(confidence) || confidence < 0 || confidence > 1) {
      return { ok: false, error: "Confidence must be between 0 and 1" };
    }
  }

  const text = (name: string) => String(formData.get(name) ?? "").trim() || null;

  const { error } = await supabase.from("evidence").insert({
    opportunity_id: opportunityId,
    claim,
    evidence_type: text("evidenceType"),
    evidence_level: evidenceLevel,
    source: text("source"),
    source_url: text("sourceUrl"),
    source_date: text("sourceDate"),
    confidence,
    notes: text("notes"),
    created_by: user.id,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true, error: null };
}

export async function createExperiment(
  opportunityId: string,
  _prevState: SimpleActionState,
  formData: FormData
): Promise<SimpleActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const hypothesis = String(formData.get("hypothesis") ?? "").trim();
  if (!hypothesis) return { ok: false, error: "Hypothesis is required" };

  const text = (name: string) => String(formData.get(name) ?? "").trim() || null;

  const { error } = await supabase.from("experiments").insert({
    opportunity_id: opportunityId,
    hypothesis,
    test: text("test"),
    success_criteria: text("successCriteria"),
    start_date: text("startDate"),
    end_date: text("endDate"),
    created_by: user.id,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true, error: null };
}

export async function recordExperimentResult(
  opportunityId: string,
  experimentId: string,
  _prevState: SimpleActionState,
  formData: FormData
): Promise<SimpleActionState> {
  const supabase = await createClient();

  const verdict = String(formData.get("verdict") ?? "") as ExperimentVerdict;
  const result = String(formData.get("result") ?? "").trim() || null;
  const evidence = String(formData.get("evidence") ?? "").trim() || null;

  const { error } = await supabase
    .from("experiments")
    .update({ verdict, result, evidence })
    .eq("id", experimentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true, error: null };
}

export async function logRevenueSnapshot(
  opportunityId: string,
  _prevState: SimpleActionState,
  formData: FormData
): Promise<SimpleActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const num = (name: string, fallback = 0) => {
    const raw = String(formData.get(name) ?? "").trim();
    if (!raw) return fallback;
    const n = Number(raw);
    return Number.isNaN(n) ? fallback : n;
  };
  const numOrNull = (name: string) => {
    const raw = String(formData.get(name) ?? "").trim();
    if (!raw) return null;
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
  };

  // RLS (revenue_insert) restricts this insert to OWNER/ADMIN — a non-admin
  // submitting this form gets Postgres's permission-denied error back
  // verbatim, same as every other admin-gated action in this file.
  const { error } = await supabase.from("revenue_snapshots").insert({
    opportunity_id: opportunityId,
    mrr: num("mrr"),
    arr: num("arr"),
    customers: Math.floor(num("customers")),
    new_customers: Math.floor(num("newCustomers")),
    expansion_mrr: num("expansionMrr"),
    churn_pct: numOrNull("churnPct"),
    net_new_mrr: numOrNull("netNewMrr"),
    cac: numOrNull("cac"),
    ltv: numOrNull("ltv"),
    gross_margin: numOrNull("grossMargin"),
    created_by: user.id,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true, error: null };
}

export async function upsertExitScores(
  opportunityId: string,
  _prevState: SimpleActionState,
  formData: FormData
): Promise<SimpleActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const scores: Record<string, number | null> = {};
  for (const dim of EXIT_SCORE_DIMENSIONS) {
    const raw = String(formData.get(dim.key) ?? "").trim();
    if (!raw) {
      scores[dim.key] = null;
      continue;
    }
    const n = Number(raw);
    if (Number.isNaN(n) || n < 0 || n > 10) {
      return { ok: false, error: `${dim.label} score must be 0–10` };
    }
    scores[dim.key] = n;
  }

  // exit_scores is keyed by opportunity_id — one row per opportunity, so
  // this is always an upsert, never a plain insert.
  const { error } = await supabase.from("exit_scores").upsert({
    opportunity_id: opportunityId,
    ...scores,
    updated_by: user.id,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true, error: null };
}
