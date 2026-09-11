// Display-only helpers. NEVER used to decide whether BUILD is allowed —
// that determination comes exclusively from calling transition_opportunity()
// and rendering its response. This file just turns numbers into labels/colors.

import type { GateName } from "./types";

export function pbvBand(pbv: number): { label: string; colorClass: string } {
  if (pbv >= 85) return { label: "BUILD CANDIDATE", colorClass: "text-signal-green" };
  if (pbv >= 75) return { label: "MORE VALIDATION", colorClass: "text-signal-gold" };
  if (pbv >= 60) return { label: "PIVOT", colorClass: "text-ink-secondary" };
  return { label: "KILL", colorClass: "text-signal-red" };
}

export const GATE_LABELS: Record<GateName, string> = {
  OPPORTUNITY: "Opportunity",
  PAIN: "Pain",
  BUYER: "Buyer",
  ECONOMICS: "Economics",
  WHITESPACE: "Whitespace",
  DISTRIBUTION: "Distribution",
  COMMITMENT: "Commitment",
};

export const GATE_ORDER: GateName[] = [
  "OPPORTUNITY",
  "PAIN",
  "BUYER",
  "ECONOMICS",
  "WHITESPACE",
  "DISTRIBUTION",
  "COMMITMENT",
];

// Matches the real seeded rows in public.pbv_dimensions (migration 0003) —
// pbv_dimensions itself only stores key+weight, no display label, so the
// label mapping lives here rather than in the DB.
export const PBV_DIMENSIONS: { key: string; label: string; weight: number }[] = [
  { key: "pain", label: "Pain severity", weight: 15 },
  { key: "frequency", label: "Frequency", weight: 10 },
  { key: "buyerClarity", label: "Buyer clarity", weight: 10 },
  { key: "existingSpend", label: "Existing spend", weight: 10 },
  { key: "roi", label: "Economic ROI", weight: 10 },
  { key: "wtp", label: "Willingness to pay", weight: 15 },
  { key: "whitespace", label: "Competitive whitespace", weight: 10 },
  { key: "distribution", label: "Distribution", weight: 10 },
  { key: "feasibility", label: "MVP feasibility", weight: 5 },
  { key: "exit", label: "Exit potential", weight: 5 },
];
