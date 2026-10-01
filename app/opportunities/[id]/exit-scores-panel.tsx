"use client";

import { useActionState, useState } from "react";
import { upsertExitScores, initialSimpleState } from "./actions";
import { EXIT_SCORE_DIMENSIONS } from "@/lib/types";
import type { ExitScoresRow } from "@/lib/types";

export function ExitScoresPanel({
  opportunityId,
  scores,
  canEdit,
}: {
  opportunityId: string;
  scores: ExitScoresRow | null;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const boundAction = upsertExitScores.bind(null, opportunityId);
  const [state, formAction, pending] = useActionState(boundAction, initialSimpleState);

  const hasAnyScore =
    scores != null && EXIT_SCORE_DIMENSIONS.some((d) => scores[d.key] != null);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        {!hasAnyScore && (
          <div className="rounded-sm border border-base-3 bg-base-1 px-3 py-2 text-sm text-ink-tertiary">
            No exit scores recorded yet.
          </div>
        )}
        {EXIT_SCORE_DIMENSIONS.map((d) => {
          const value = scores?.[d.key] ?? null;
          return (
            <div
              key={d.key}
              className="flex items-center justify-between rounded-sm border border-base-3 bg-base-1 px-3 py-1.5 text-sm"
            >
              <span className="text-ink-secondary">{d.label}</span>
              {value != null ? (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-sm bg-base-0">
                    <div
                      className="h-full bg-signal-gold"
                      style={{ width: `${(value / 10) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-ink-primary">{value}/10</span>
                </div>
              ) : (
                <span className="font-mono text-micro text-ink-tertiary">—</span>
              )}
            </div>
          );
        })}
      </div>

      {!canEdit && (
        <p className="font-mono text-micro text-ink-tertiary">
          Only org OWNER/ADMIN can record exit scores.
        </p>
      )}

      {canEdit && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-mono text-micro uppercase tracking-wide text-ink-tertiary hover:text-ink-primary"
        >
          {hasAnyScore ? "Update scores" : "+ Score for exit"}
        </button>
      )}

      {canEdit && open && (
        <form
          action={formAction}
          className="space-y-2 rounded-sm border border-base-3 bg-base-1 p-3 text-sm"
        >
          {EXIT_SCORE_DIMENSIONS.map((d) => (
            <ScoreField
              key={d.key}
              name={d.key}
              label={d.label}
              defaultValue={scores?.[d.key] ?? undefined}
            />
          ))}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-sm bg-signal-gold py-1.5 font-medium text-base-0 transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save scores"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-sm border border-base-3 px-3 font-mono text-micro uppercase text-ink-tertiary"
            >
              Cancel
            </button>
          </div>
          {state.error && <p className="text-signal-red">{state.error}</p>}
        </form>
      )}
    </div>
  );
}

function ScoreField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: number;
}) {
  const [value, setValue] = useState(defaultValue ?? 5);
  return (
    <div className="flex items-center gap-2">
      <span className="w-40 shrink-0 text-ink-secondary">{label}</span>
      <input
        type="range"
        name={name}
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="flex-1"
      />
      <span className="w-6 text-right font-mono text-ink-primary">{value}</span>
    </div>
  );
}
