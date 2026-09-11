import { formatStage } from "@/lib/format";
import { STAGES, stageIndex, type OpportunityStage } from "@/lib/types";

const BAND_COLOR: Record<string, string> = {
  early: "text-ink-secondary border-base-3",
  late: "text-signal-gold border-signal-gold/50",
  post: "text-signal-green border-signal-green/40",
};

function bandFor(stage: OpportunityStage): string {
  const i = stageIndex(stage);
  if (i <= 6) return "early"; // DISCOVER..GTM
  if (i <= 8) return "late"; // PRE_SALE, BUILD
  return "post"; // LAUNCH, REVENUE, EXIT
}

export function StagePill({ stage }: { stage: OpportunityStage }) {
  const band = bandFor(stage);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-micro uppercase tracking-wide ${BAND_COLOR[band]}`}
    >
      <span className="text-ink-tertiary">
        {String(stageIndex(stage) + 1).padStart(2, "0")}/{STAGES.length}
      </span>
      {formatStage(stage)}
    </span>
  );
}
