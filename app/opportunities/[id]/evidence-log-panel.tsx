"use client";

import { useActionState, useState } from "react";
import { addEvidence, initialSimpleState } from "./actions";
import type { EvidenceRow } from "@/lib/types";
import { relativeDate } from "@/lib/format";

export function EvidenceLogPanel({
  opportunityId,
  entries,
}: {
  opportunityId: string;
  entries: EvidenceRow[];
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        {entries.length === 0 && (
          <div className="rounded-sm border border-base-3 bg-base-1 px-3 py-2 text-sm text-ink-tertiary">
            No evidence logged yet.
          </div>
        )}
        {entries.map((e) => (
          <EvidenceRowItem key={e.id} entry={e} />
        ))}
      </div>
      <AddEvidenceForm opportunityId={opportunityId} />
    </div>
  );
}

function EvidenceRowItem({ entry }: { entry: EvidenceRow }) {
  const color =
    entry.evidence_level >= 7
      ? "text-signal-green"
      : entry.evidence_level >= 4
        ? "text-signal-gold"
        : "text-ink-tertiary";

  return (
    <div className="rounded-sm border border-base-3 bg-base-1 px-3 py-2 text-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="text-ink-primary">{entry.claim}</span>
        <span className={`shrink-0 font-mono text-micro ${color}`}>
          {entry.evidence_level}/10
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-micro text-ink-tertiary">
        {entry.evidence_type && <span>{entry.evidence_type}</span>}
        {entry.source_url ? (
          <a href={entry.source_url} target="_blank" rel="noreferrer" className="underline">
            {entry.source ?? entry.source_url}
          </a>
        ) : (
          entry.source && <span>{entry.source}</span>
        )}
        {entry.confidence != null && <span>confidence {entry.confidence.toFixed(2)}</span>}
        <span>{relativeDate(entry.created_at)}</span>
      </div>
      {entry.notes && <div className="mt-1 text-ink-secondary">{entry.notes}</div>}
    </div>
  );
}

function AddEvidenceForm({ opportunityId }: { opportunityId: string }) {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState(5);
  const boundAction = addEvidence.bind(null, opportunityId);
  const [state, formAction, pending] = useActionState(boundAction, initialSimpleState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-micro uppercase tracking-wide text-ink-tertiary hover:text-ink-primary"
      >
        + Add evidence
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-2 rounded-sm border border-base-3 bg-base-1 p-3 text-sm"
    >
      <textarea
        name="claim"
        required
        rows={2}
        placeholder="Claim (required)"
        className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary placeholder:text-ink-tertiary"
      />
      <div className="flex items-center gap-2">
        <span className="font-mono text-micro uppercase tracking-wide text-ink-tertiary">
          Evidence level
        </span>
        <input
          type="range"
          name="evidenceLevel"
          min={0}
          max={10}
          step={1}
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          className="flex-1"
        />
        <span className="w-6 text-right font-mono text-ink-primary">{level}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          name="evidenceType"
          placeholder="Type (interview, survey, data…)"
          className="rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary placeholder:text-ink-tertiary"
        />
        <input
          name="confidence"
          type="number"
          min={0}
          max={1}
          step="0.05"
          placeholder="Confidence (0–1)"
          className="rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary placeholder:text-ink-tertiary"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          name="source"
          placeholder="Source"
          className="rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary placeholder:text-ink-tertiary"
        />
        <input
          name="sourceUrl"
          type="url"
          placeholder="Source URL (optional)"
          className="rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary placeholder:text-ink-tertiary"
        />
      </div>
      <input
        name="sourceDate"
        type="date"
        className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary"
      />
      <textarea
        name="notes"
        rows={2}
        placeholder="Notes (optional)"
        className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary placeholder:text-ink-tertiary"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-sm bg-signal-gold py-1.5 font-medium text-base-0 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Add evidence"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-sm border border-base-3 px-3 font-mono text-micro uppercase text-ink-tertiary"
        >
          Cancel
        </button>
      </div>
      <p className="font-mono text-micro text-ink-tertiary">
        Evidence entries are permanent once added — there's no edit or delete.
      </p>
      {state.error && <p className="text-signal-red">{state.error}</p>}
    </form>
  );
}
