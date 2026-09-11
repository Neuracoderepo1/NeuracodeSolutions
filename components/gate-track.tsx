import { GATE_ORDER } from "@/lib/pbv";
import type { GateName, GateStatus } from "@/lib/types";

const STATUS_CLASS: Record<GateStatus, string> = {
  PASSED: "bg-signal-green",
  FAILED: "bg-signal-red",
  OPEN: "bg-base-3",
};

export function GateTrack({
  statuses,
  labeled = false,
}: {
  statuses: Partial<Record<GateName, GateStatus>>;
  labeled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {GATE_ORDER.map((gate) => {
        const status = statuses[gate] ?? "OPEN";
        return (
          <div key={gate} className="group relative">
            <div
              className={`h-1.5 w-4 rounded-sm ${STATUS_CLASS[status]}`}
              title={`${gate}: ${status}`}
            />
            {labeled && (
              <div className="mt-1 hidden text-center font-mono text-[9px] text-ink-tertiary sm:block">
                {gate.slice(0, 3)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
