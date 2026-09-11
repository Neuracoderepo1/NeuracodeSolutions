// Minimal types matching the live schema in Supabase project
// ivcweujfzdwmkztjczln, confirmed by direct audit on 2026-09-09.
// Not generated via `supabase gen types` yet — do that once the CLI
// is available and replace this file wholesale.

export type OpportunityStage =
  | "DISCOVER"
  | "RESEARCH"
  | "PAIN"
  | "BUYER"
  | "WTP"
  | "WHITESPACE"
  | "GTM"
  | "PRE_SALE"
  | "BUILD"
  | "LAUNCH"
  | "REVENUE"
  | "EXIT";

export const GATE_TYPES = [
  "OPPORTUNITY",
  "PAIN",
  "BUYER",
  "ECONOMICS",
  "WHITESPACE",
  "DISTRIBUTION",
  "COMMITMENT",
] as const;
export type GateName = (typeof GATE_TYPES)[number];

// Verified live 2026-09-11 against pg_enum: gate_status has THREE values,
// not two. Previously missing "FAILED" here — a gate that's been
// explicitly rejected is different from one that's simply never been
// reviewed, and the type couldn't represent that distinction at all.
export type GateStatus = "OPEN" | "PASSED" | "FAILED";

export type CommitmentType = "INTEREST" | "LOI" | "PAID_PILOT" | "PREORDER" | "CUSTOMER";

export type CommitmentRow = {
  id: string;
  opportunity_id: string;
  type: CommitmentType;
  buyer_reference: string | null;
  source: string | null;
  verification_status: VerificationStatus;
  created_at: string;
};

export type DecisionLedgerRow = {
  id: string;
  opportunity_id: string;
  decision: string;
  previous_stage: OpportunityStage;
  requested_stage: OpportunityStage;
  result: string;
  pbv: number | null;
  qualified_commitments: number | null;
  blocking_reasons: string[] | null;
  actor: string;
  created_at: string;
};

export type PbvScoreRow = {
  dimension_key: string;
  score: number;
  updated_at: string;
};
export type VerificationStatus = "UNVERIFIED" | "VERIFIED" | "REJECTED";

export const QUALIFYING_COMMITMENT_TYPES: CommitmentType[] = [
  "LOI",
  "PAID_PILOT",
  "PREORDER",
  "CUSTOMER",
];

export const PBV_THRESHOLD = 85;
export const REQUIRED_QUALIFIED_COMMITMENTS = 3;

export type Opportunity = {
  id: string;
  organization_id: string;
  created_by: string;
  title: string;
  stage: OpportunityStage;
  version: number;
  description: string | null;
  problem_statement: string | null;
  solution_hypothesis: string | null;
  buyer_description: string | null;
  price_hypothesis: string | null;
  mvp_days: number | null;
  created_at: string;
  updated_at: string;
};

/**
 * Return type of transition_opportunity() — call the RPC, never
 * reimplement this logic client-side. See HANDOFF.md.
 */
export type TransitionResult = {
  allowed: boolean;
  decision:
    | "BUILD_AUTHORIZED"
    | "BUILD_BLOCKED"
    | "TRANSITION_AUTHORIZED"
    | "TRANSITION_REJECTED";
  stage: OpportunityStage;
  pbv: number | null;
  qualifiedCommitments: number | null;
  // gate_state_json() returns each gate's actual status STRING
  // ("OPEN"|"PASSED"|"FAILED") — verified live 2026-09-11 by querying
  // opportunity_summary directly (e.g. {"PAIN":"PASSED",...}). Fixed from
  // the previous Record<GateName, boolean>, which made every
  // `=== true` comparison against this field silently always false.
  gateState: Record<GateName, GateStatus> | null;
  blockingReasons: string[];
};

/**
 * Row shape of the public.opportunity_summary view (migration 0025).
 * Read-only display data — pbv/gatesPassed/qualifiedCommitments here are
 * for showing the board, not for deciding BUILD authorization.
 */
export type OpportunitySummary = {
  id: string;
  organization_id: string;
  title: string;
  stage: OpportunityStage;
  problem_statement: string | null;
  buyer_description: string | null;
  price_hypothesis: string | null;
  mvp_days: number | null;
  updated_at: string;
  pbv: number;
  gates_passed: boolean;
  // Verified live 2026-09-11: this is Record<GateName, GateStatus>
  // ("OPEN"|"PASSED"|"FAILED" strings), not booleans — confirmed by
  // querying opportunity_summary directly and by pg_get_viewdef showing
  // this column is gate_state_json(id), the same function
  // transition_opportunity() uses. app/page.tsx and
  // build-authorization-panel.tsx both compared this against `=== true`,
  // which is always false for a string — every gate rendered as
  // "not passed" regardless of its real status, even for opportunities
  // with all 7 gates PASSED (e.g. Test Opp A).
  gate_state: Record<GateName, GateStatus>;
  qualified_commitments: number;
};
