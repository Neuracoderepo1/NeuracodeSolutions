"use client";

import { useActionState, useState } from "react";
import { createExperiment, recordExperimentResult, initialSimpleState } from "./actions";
import { EXPERIMENT_VERDICTS } from "@/lib/types";
import type { ExperimentRow, ExperimentVerdict } from "@/lib/types";
import { relativeDate } from "@/lib/format";

const VERDICT_COLOR: Record<ExperimentVerdict, string> = {
  PASS: "text-signal-green",
  FAIL: "text-signal-red",
  EXTEND: "text-signal-gold",
  PIVOT: "text-signal-gold",
  KILL: "text-signal-red",
};

export function ExperimentsPanel({
  opportunityId,
  experiments,
}: {
  opportunityId: string;
  experiments: ExperimentRow[];
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        {experiments.length === 0 && (
          <div className="rounded-sm border border-base-3 bg-base-1 px-3 py-2 text-sm text-ink-tertiary">
            No experiments logged yet.
          </div>
        )}
        {experiments.map((e) => (
          <ExperimentRowItem key={e.id} opportunityId={opportunityId} experiment={e} />
        ))}
      </div>
      <NewExperimentForm opportunityId={opportunityId} />
    </div>
  );
}

function ExperimentRowItem({
  opportunityId,
  experiment,
}: {
  opportunityId: string;
  experiment: ExperimentRow;
}) {
  const [open, setOpen] = useState(false);
  const boundAction = recordExperimentResult.bind(null, opportunityId, experiment.id);
  const [state, formAction, pending] = useActionState(boundAction, initialSimpleState);

  return (
    <div className="rounded-sm border border-base-3 bg-base-1 px-3 py-2 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-ink-primary">{experiment.hypothesis}</div>
          {experiment.test && <div className="mt-0.5 text-ink-tertiary">{experiment.test}</div>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {experiment.verdict ? (
            <span className={`font-mono text-micro ${VERDICT_COLOR[experiment.verdict]}`}>
              {experiment.verdict}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="font-mono text-micro uppercase tracking-wide text-ink-tertiary hover:text-ink-primary"
            >
              {open ? "cancel" : "record result"}
            </button>
          )}
        </div>
      </div>

      {experiment.success_criteria && (
        <div className="mt-1 font-mono text-micro text-ink-tertiary">
          Success: {experiment.success_criteria}
        </div>
      )}
      {experiment.result && (
        <div className="mt-1 text-ink-secondary">{experiment.result}</div>
      )}
      <div className="mt-1 font-mono text-micro text-ink-tertiary">
        {relativeDate(experiment.created_at)}
      </div>

      {open && !experiment.verdict && (
        <form action={formAction} className="mt-2 space-y-2 border-t border-base-3 pt-2">
          <select
            name="verdict"
            required
            defaultValue=""
            className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary"
          >
            <option value="" disabled>
              Verdict…
            </option>
            {EXPERIMENT_VERDICTS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <textarea
            name="result"
            rows={2}
            placeholder="What happened?"
            className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary placeholder:text-ink-tertiary"
          />
          <input
            name="evidence"
            placeholder="Supporting evidence (optional)"
            className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary placeholder:text-ink-tertiary"
          />
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-sm bg-signal-gold py-1.5 font-medium text-base-0 transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save verdict"}
          </button>
          {state.error && <p className="text-signal-red">{state.error}</p>}
        </form>
      )}
    </div>
  );
}

function NewExperimentForm({ opportunityId }: { opportunityId: string }) {
  const [open, setOpen] = useState(false);
  const boundAction = createExperiment.bind(null, opportunityId);
  const [state, formAction, pending] = useActionState(boundAction, initialSimpleState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-micro uppercase tracking-wide text-ink-tertiary hover:text-ink-primary"
      >
        + New experiment
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-2 rounded-sm border border-base-3 bg-base-1 p-3 text-sm"
    >
      <textarea
        name="hypothesis"
        required
        rows={2}
        placeholder="Hypothesis (required)"
        className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary placeholder:text-ink-tertiary"
      />
      <input
        name="test"
        placeholder="Test — what are we doing?"
        className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary placeholder:text-ink-tertiary"
      />
      <input
        name="successCriteria"
        placeholder="Success criteria"
        className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary placeholder:text-ink-tertiary"
      />
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="font-mono text-micro uppercase tracking-wide text-ink-tertiary">
            Start date
          </span>
          <input
            name="startDate"
            type="date"
            className="mt-1 w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary"
          />
        </label>
        <label className="block">
          <span className="font-mono text-micro uppercase tracking-wide text-ink-tertiary">
            End date
          </span>
          <input
            name="endDate"
            type="date"
            className="mt-1 w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary"
          />
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-sm bg-signal-gold py-1.5 font-medium text-base-0 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Start experiment"}
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
  );
}
