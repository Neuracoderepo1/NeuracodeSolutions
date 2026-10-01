"use client";

import { useActionState, useState } from "react";
import { logLandingTest, initialSimpleState } from "./actions";
import type { LandingTestRow } from "@/lib/types";
import { relativeDate } from "@/lib/format";

const FUNNEL_STEPS: { key: keyof LandingTestRow; label: string }[] = [
  { key: "visitors", label: "Visitors" },
  { key: "cta_clicks", label: "CTA clicks" },
  { key: "leads", label: "Leads" },
  { key: "qualified_leads", label: "Qualified leads" },
  { key: "demos", label: "Demos" },
  { key: "trial_requests", label: "Trial requests" },
  { key: "lois", label: "LOIs" },
  { key: "preorders", label: "Preorders" },
];

export function LandingTestsPanel({
  opportunityId,
  tests,
}: {
  opportunityId: string;
  tests: LandingTestRow[];
}) {
  const latest = tests[0];

  return (
    <div className="space-y-3">
      {!latest ? (
        <div className="rounded-sm border border-base-3 bg-base-1 px-3 py-2 text-sm text-ink-tertiary">
          No landing test snapshots logged yet.
        </div>
      ) : (
        <div className="rounded-sm border border-base-3 bg-base-1 p-3">
          <div className="mb-2 font-mono text-micro uppercase tracking-wide text-ink-tertiary">
            Latest snapshot · {relativeDate(latest.recorded_at)}
          </div>
          <Funnel test={latest} />
        </div>
      )}

      {tests.length > 1 && (
        <div className="space-y-1">
          {tests.slice(1).map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-sm border border-base-3 bg-base-1 px-3 py-1.5 text-sm text-ink-tertiary"
            >
              <span>{relativeDate(t.recorded_at)}</span>
              <span className="font-mono text-micro">
                {t.visitors} visitors → {t.leads} leads → {t.lois + t.preorders} LOIs/preorders
              </span>
            </div>
          ))}
        </div>
      )}

      <LogSnapshotForm opportunityId={opportunityId} />
    </div>
  );
}

function Funnel({ test }: { test: LandingTestRow }) {
  const max = Math.max(test.visitors, 1);
  return (
    <div className="space-y-1.5">
      {FUNNEL_STEPS.map((step) => {
        const value = Number(test[step.key]);
        const pct = Math.min(100, (value / max) * 100);
        return (
          <div key={step.key} className="flex items-center gap-2 text-sm">
            <span className="w-32 shrink-0 text-ink-tertiary">{step.label}</span>
            <div className="h-4 flex-1 overflow-hidden rounded-sm bg-base-0">
              <div className="h-full bg-signal-gold" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-10 shrink-0 text-right font-mono text-ink-primary">
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LogSnapshotForm({ opportunityId }: { opportunityId: string }) {
  const [open, setOpen] = useState(false);
  const boundAction = logLandingTest.bind(null, opportunityId);
  const [state, formAction, pending] = useActionState(boundAction, initialSimpleState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-micro uppercase tracking-wide text-ink-tertiary hover:text-ink-primary"
      >
        + Log a snapshot
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-2 rounded-sm border border-base-3 bg-base-1 p-3 text-sm"
    >
      <div className="grid grid-cols-2 gap-2">
        {[
          { name: "visitors", label: "Visitors" },
          { name: "ctaClicks", label: "CTA clicks" },
          { name: "leads", label: "Leads" },
          { name: "qualifiedLeads", label: "Qualified leads" },
          { name: "demos", label: "Demos" },
          { name: "trialRequests", label: "Trial requests" },
          { name: "lois", label: "LOIs" },
          { name: "preorders", label: "Preorders" },
        ].map((f) => (
          <label key={f.name} className="block">
            <span className="font-mono text-micro uppercase tracking-wide text-ink-tertiary">
              {f.label}
            </span>
            <input
              name={f.name}
              type="number"
              min={0}
              defaultValue={0}
              className="mt-1 w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary"
            />
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-sm bg-signal-gold py-1.5 font-medium text-base-0 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Log snapshot"}
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
