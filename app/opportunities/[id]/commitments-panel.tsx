"use client";

import { useActionState, useState, useTransition } from "react";
import { logCommitment, verifyCommitment, initialSimpleState } from "./actions";
import type { CommitmentRow, CommitmentType } from "@/lib/types";
import { QUALIFYING_COMMITMENT_TYPES } from "@/lib/types";

export function CommitmentsPanel({
  opportunityId,
  commitments,
  canVerify,
}: {
  opportunityId: string;
  commitments: CommitmentRow[];
  canVerify: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        {commitments.length === 0 && (
          <div className="rounded-sm border border-base-3 bg-base-1 px-3 py-2 text-sm text-ink-tertiary">
            No commitments recorded.
          </div>
        )}
        {commitments.map((c) => (
          <CommitmentRowItem
            key={c.id}
            opportunityId={opportunityId}
            commitment={c}
            canVerify={canVerify}
          />
        ))}
      </div>
      <LogCommitmentForm opportunityId={opportunityId} />
    </div>
  );
}

function CommitmentRowItem({
  opportunityId,
  commitment,
  canVerify,
}: {
  opportunityId: string;
  commitment: CommitmentRow;
  canVerify: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const qualifies = QUALIFYING_COMMITMENT_TYPES.includes(commitment.type);
  const color =
    commitment.verification_status === "VERIFIED"
      ? "text-signal-green"
      : commitment.verification_status === "REJECTED"
        ? "text-signal-red"
        : "text-ink-tertiary";

  function resolve(status: "VERIFIED" | "REJECTED") {
    setError(null);
    startTransition(async () => {
      const result = await verifyCommitment(opportunityId, commitment.id, status);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="rounded-sm border border-base-3 bg-base-1 px-3 py-2 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-ink-primary">{commitment.type}</span>
          {!qualifies && (
            <span className="ml-2 font-mono text-micro text-ink-tertiary">
              (doesn't count toward BUILD)
            </span>
          )}
          {commitment.source && (
            <div className="text-ink-tertiary">{commitment.source}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-mono text-micro ${color}`}>{commitment.verification_status}</span>
          {canVerify && commitment.verification_status === "UNVERIFIED" && (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => resolve("VERIFIED")}
                className="rounded-sm border border-base-3 px-2 py-0.5 font-mono text-micro uppercase text-signal-green disabled:opacity-40"
              >
                Verify
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => resolve("REJECTED")}
                className="rounded-sm border border-base-3 px-2 py-0.5 font-mono text-micro uppercase text-signal-red disabled:opacity-40"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
      {error && <p className="mt-1 text-signal-red">{error}</p>}
    </div>
  );
}

const COMMITMENT_TYPES: CommitmentType[] = ["INTEREST", "LOI", "PAID_PILOT", "PREORDER", "CUSTOMER"];

function LogCommitmentForm({ opportunityId }: { opportunityId: string }) {
  const [open, setOpen] = useState(false);
  const boundAction = logCommitment.bind(null, opportunityId);
  const [state, formAction, pending] = useActionState(boundAction, initialSimpleState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-micro uppercase tracking-wide text-ink-tertiary hover:text-ink-primary"
      >
        + Log a commitment
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-2 rounded-sm border border-base-3 bg-base-1 p-3 text-sm"
    >
      <select
        name="type"
        className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary"
      >
        {COMMITMENT_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
            {!QUALIFYING_COMMITMENT_TYPES.includes(t) ? " (doesn't count toward BUILD)" : ""}
          </option>
        ))}
      </select>
      <input
        name="buyerReference"
        placeholder="Buyer reference (optional)"
        className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary placeholder:text-ink-tertiary"
      />
      <input
        name="source"
        placeholder="Source — email, call notes, contract link (optional)"
        className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-ink-primary placeholder:text-ink-tertiary"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-sm bg-signal-gold py-1.5 font-medium text-base-0 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Log commitment"}
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
        New commitments start UNVERIFIED — an OWNER/ADMIN has to verify it before it counts.
      </p>
      {state.error && <p className="text-signal-red">{state.error}</p>}
    </form>
  );
}
