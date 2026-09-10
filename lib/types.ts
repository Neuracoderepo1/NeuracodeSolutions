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

export type GateStatus = "OPEN" | "PASSED";

export type CommitmentType = "INTEREST" | "LOI" | "PAID_PILOT" | "PREORDER" | "CUSTOMER";
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
  gateState: Record<GateName, boolean> | null;
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
  gate_state: Record<GateName, boolean>;
  qualified_commitments: number;
};
