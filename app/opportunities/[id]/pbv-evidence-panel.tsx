"use client";

import { useActionState, useState } from "react";
import { recordEvidence, initialSimpleState } from "./actions";
import { PBV_DIMENSIONS } from "@/lib/pbv";

export function PbvEvidencePanel({
  opportunityId,
  scoreByKey,
}: {
  opportunityId: string;
  scoreByKey: Map<string, { score: number; updated_at: string }>;
}) {
  return (
    <div className="space-y-1">
      {PBV_DIMENSIONS.map((d) => (
        <DimensionRow
          key={d.key}
          opportunityId={opportunityId}
          dimensionKey={d.key}
          label={d.label}
          weight={d.weight}
          current={scoreByKey.get(d.key)}
        />
      ))}
    </div>
  );
}

function DimensionRow({
  opportunityId,
  dimensionKey,
  label,
  weight,
  current,
}: {
  opportunityId: string;
  dimensionKey: string;
  label: string;
  weight: number;
  current?: { score: number; updated_at: string };
}) {
  const [open, setOpen] = useState(false);
  const [scoreValue, setScoreValue] = useState(current?.score ?? 5);
  const boundAction = recordEvidence.bind(null, opportunityId, dimensionKey);
  const [state, formAction, pending] = useActionState(boundAction, initialSimpleState);

  return (
    <div className="rounded-sm border border-base-3 bg-base-1 px-3 py-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-ink-secondary">
          {label}{" "}
          <span className="font-mono text-micro text-ink-tertiary">(wt {weight})</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-ink-primary">
            {current ? `${current.score}/10` : <span className="text-ink-tertiary">NO EVIDENCE</span>}
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="font-mono text-micro uppercase tracking-wide text-ink-tertiary hover:text-ink-primary"
          >
            {open ? "cancel" : current ? "update" : "add"}
          </button>
        </div>
      </div>

      {open && (
        <form action={formAction} className="mt-2 space-y-2 border-t border-base-3 pt-2">
          <div className="flex items-center gap-2">
            <input
              type="range"
              name="score"
              min={0}
              max={10}
              step={1}
              value={scoreValue}
              onChange={(e) => setScoreValue(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-6 text-right font-mono text-ink-primary">{scoreValue}</span>
          </div>
          <input
            name="evidenceText"
            placeholder="What evidence supports this score? (optional)"
            className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-sm text-ink-primary placeholder:text-ink-tertiary"
          />
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-sm bg-signal-gold py-1.5 text-sm font-medium text-base-0 transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Record evidence"}
          </button>
          {state.error && <p className="text-signal-red">{state.error}</p>}
        </form>
      )}
    </div>
  );
}
