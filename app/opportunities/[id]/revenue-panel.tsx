"use client";

import { useActionState, useState } from "react";
import { logRevenueSnapshot, initialSimpleState } from "./actions";
import type { RevenueSnapshotRow } from "@/lib/types";
import { relativeDate } from "@/lib/format";

export function RevenuePanel({
  opportunityId,
  snapshots,
  canEdit,
}: {
  opportunityId: string;
  snapshots: RevenueSnapshotRow[];
  canEdit: boolean;
}) {
  const chronological = [...snapshots].reverse();
  const latest = snapshots[0];
  const maxMrr = Math.max(...chronological.map((s) => s.mrr), 1);

  return (
    <div className="space-y-3">
      {!latest ? (
        <div className="rounded-sm border border-base-3 bg-base-1 px-3 py-2 text-sm text-ink-tertiary">
          No revenue snapshots logged yet.
        </div>
      ) : (
        <div className="rounded-sm border border-base-3 bg-base-1 p-3">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-mono text-micro uppercase tracking-wide text-ink-tertiary">
              Latest · {relativeDate(latest.snapshot_date)}
            </span>
            <span className="font-mono text-ink-primary">
              MRR ${latest.mrr.toLocaleString()} · ARR ${latest.arr.toLocaleString()}
            </span>
          </div>

          {chronological.length > 1 && (
            <div className="flex h-16 items-end gap-1">
              {chronological.map((s) => (
                <div
                  key={s.id}
                  title={`${new Date(s.snapshot_date).toLocaleDateString()} · $${s.mrr.toLocaleString()} MRR`}
                  className="flex-1 rounded-t-sm bg-signal-gold"
                  style={{ height: `${Math.max(4, (s.mrr / maxMrr) * 100)}%` }}
                />
              ))}
            </div>
          )}

          <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-1 font-mono text-micro text-ink-tertiary">
            <span>Customers: {latest.customers}</span>
            <span>New: {latest.new_customers}</span>
            {latest.churn_pct != null && <span>Churn: {latest.churn_pct}%</span>}
            {latest.cac != null && <span>CAC: ${latest.cac}</span>}
            {latest.ltv != null && <span>LTV: ${latest.ltv}</span>}
            {latest.gross_margin != null && <span>Margin: {latest.gross_margin}%</span>}
          </div>
        </div>
      )}

      {canEdit ? (
        <LogSnapshotForm opportunityId={opportunityId} />
      ) : (
        <p className="font-mono text-micro text-ink-tertiary">
          Only org OWNER/ADMIN can log revenue snapshots.
        </p>
      )}
    </div>
  );
}

function LogSnapshotForm({ opportunityId }: { opportunityId: string }) {
  const [open, setOpen] = useState(false);
  const boundAction = logRevenueSnapshot.bind(null, opportunityId);
  const [state, formAction, pending] = useActionState(boundAction, initialSimpleState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-micro uppercase tracking-wide text-ink-tertiary hover:text-ink-primary"
      >
        + Log a revenue snapshot
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-2 rounded-sm border border-base-3 bg-base-1 p-3 text-sm"
    >
      <div className="grid grid-cols-2 gap-2">
        <NumField name="mrr" label="MRR" required />
        <NumField name="arr" label="ARR" required />
        <NumField name="customers" label="Customers" />
        <NumField name="newCustomers" label="New customers" />
        <NumField name="expansionMrr" label="Expansion MRR" />
        <NumField name="churnPct" label="Churn %" />
        <NumField name="netNewMrr" label="Net new MRR" />
        <NumField name="cac" label="CAC" />
        <NumField name="ltv" label="LTV" />
        <NumField name="grossMargin" label="Gross margin %" />
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
      <p className="font-mono text-micro text-ink-tertiary">
        Snapshots are permanent once logged — there's no edit.
      </p>
      {state.error && <p className="text-signal-red">{state.error}</p>}
    </form>
  );
}

function NumField({
  name,
  label,
  required,
}: {
  name: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-mono text-micro uppercase tracking-wide text-ink-tertiary">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        name={name}
        type="number"
        step="any"
        required={required}
        defaultValue={required ? 0 : undefined}
        className="mt-1 w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary"
      />
    </label>
  );
}
