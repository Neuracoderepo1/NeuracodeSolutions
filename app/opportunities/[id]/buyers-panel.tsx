"use client";

import { useActionState, useState, useTransition } from "react";
import { createBuyer, updateBuyerStatus, initialSimpleState } from "./actions";
import { BUYER_STATUSES } from "@/lib/types";
import type { BuyerRow, BuyerStatus } from "@/lib/types";
import { relativeDate } from "@/lib/format";

const STATUS_COLOR: Record<BuyerStatus, string> = {
  TARGET: "text-ink-tertiary",
  CONTACTED: "text-ink-secondary",
  REPLIED: "text-ink-secondary",
  INTERVIEWED: "text-signal-gold",
  TRIAL: "text-signal-gold",
  LOI: "text-signal-green",
  PAID: "text-signal-green",
  CUSTOMER: "text-signal-green",
  REJECTED: "text-signal-red",
};

export function BuyersPanel({
  opportunityId,
  buyers,
}: {
  opportunityId: string;
  buyers: BuyerRow[];
}) {
  const sorted = [...buyers].sort((a, b) => {
    if (a.next_followup && b.next_followup) {
      return new Date(a.next_followup).getTime() - new Date(b.next_followup).getTime();
    }
    if (a.next_followup) return -1;
    if (b.next_followup) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        {sorted.length === 0 && (
          <div className="rounded-sm border border-base-3 bg-base-1 px-3 py-2 text-sm text-ink-tertiary">
            No buyers logged yet.
          </div>
        )}
        {sorted.map((b) => (
          <BuyerRowItem key={b.id} opportunityId={opportunityId} buyer={b} />
        ))}
      </div>
      <AddBuyerForm opportunityId={opportunityId} />
    </div>
  );
}

function BuyerRowItem({
  opportunityId,
  buyer,
}: {
  opportunityId: string;
  buyer: BuyerRow;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  function changeStatus(status: BuyerStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateBuyerStatus(opportunityId, buyer.id, status);
      if (!result.ok) setError(result.error);
    });
  }

  const overdue =
    buyer.next_followup &&
    new Date(buyer.next_followup).getTime() < Date.now() &&
    buyer.status !== "REJECTED" &&
    buyer.status !== "CUSTOMER";

  return (
    <div className="rounded-sm border border-base-3 bg-base-1 px-3 py-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-left text-ink-primary hover:underline"
        >
          {buyer.company}
          {buyer.contact && (
            <span className="ml-2 text-ink-tertiary">{buyer.contact}</span>
          )}
        </button>
        <div className="flex items-center gap-2">
          {buyer.next_followup && (
            <span
              className={`font-mono text-micro ${overdue ? "text-signal-red" : "text-ink-tertiary"}`}
            >
              follow up {relativeDate(buyer.next_followup)}
            </span>
          )}
          <select
            value={buyer.status}
            disabled={pending}
            onChange={(e) => changeStatus(e.target.value as BuyerStatus)}
            className={`rounded-sm border border-base-3 bg-base-0 px-1.5 py-0.5 font-mono text-micro uppercase ${STATUS_COLOR[buyer.status]}`}
          >
            {BUYER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 space-y-1 border-t border-base-3 pt-2 text-ink-secondary">
          {buyer.role && <Detail label="Role" value={buyer.role} />}
          {buyer.company_size && <Detail label="Company size" value={buyer.company_size} />}
          {buyer.pain && <Detail label="Pain" value={buyer.pain} />}
          {buyer.current_solution && (
            <Detail label="Current solution" value={buyer.current_solution} />
          )}
          {buyer.estimated_wtp != null && (
            <Detail label="Est. willingness to pay" value={String(buyer.estimated_wtp)} />
          )}
          {buyer.current_spend != null && (
            <Detail label="Current spend" value={String(buyer.current_spend)} />
          )}
          {buyer.notes && <Detail label="Notes" value={buyer.notes} />}
        </div>
      )}
      {error && <p className="mt-1 text-signal-red">{error}</p>}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-mono text-micro uppercase tracking-wide text-ink-tertiary">
        {label}:
      </span>{" "}
      {value}
    </div>
  );
}

function AddBuyerForm({ opportunityId }: { opportunityId: string }) {
  const [open, setOpen] = useState(false);
  const boundAction = createBuyer.bind(null, opportunityId);
  const [state, formAction, pending] = useActionState(boundAction, initialSimpleState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-micro uppercase tracking-wide text-ink-tertiary hover:text-ink-primary"
      >
        + Log a buyer
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-2 rounded-sm border border-base-3 bg-base-1 p-3 text-sm"
    >
      <input
        name="company"
        required
        placeholder="Company (required)"
        className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary placeholder:text-ink-tertiary"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          name="contact"
          placeholder="Contact name"
          className="rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary placeholder:text-ink-tertiary"
        />
        <input
          name="role"
          placeholder="Their role"
          className="rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary placeholder:text-ink-tertiary"
        />
      </div>
      <input
        name="pain"
        placeholder="Pain (optional)"
        className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary placeholder:text-ink-tertiary"
      />
      <input
        name="currentSolution"
        placeholder="Current solution (optional)"
        className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary placeholder:text-ink-tertiary"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          name="estimatedWtp"
          type="number"
          step="any"
          placeholder="Est. willingness to pay"
          className="rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary placeholder:text-ink-tertiary"
        />
        <input
          name="currentSpend"
          type="number"
          step="any"
          placeholder="Current spend"
          className="rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary placeholder:text-ink-tertiary"
        />
      </div>
      <label className="block">
        <span className="font-mono text-micro uppercase tracking-wide text-ink-tertiary">
          Next follow-up
        </span>
        <input
          name="nextFollowup"
          type="datetime-local"
          className="mt-1 w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary"
        />
      </label>
      <textarea
        name="notes"
        placeholder="Notes (optional)"
        rows={2}
        className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary placeholder:text-ink-tertiary"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-sm bg-signal-gold py-1.5 font-medium text-base-0 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Log buyer"}
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
