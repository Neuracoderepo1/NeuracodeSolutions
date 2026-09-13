"use client";

import { useActionState, useState } from "react";
import { setGate, initialSimpleState } from "./actions";
import { GATE_LABELS, GATE_ORDER } from "@/lib/pbv";
import type { GateName, GateStatus } from "@/lib/types";

// COMMITMENT is derived from verified qualified commitments —
// set_validation_gate() itself refuses to touch it (see the RPC body).
// It's excluded here rather than shown disabled, since there's nothing a
// user could ever do with it.
const EDITABLE_GATES = GATE_ORDER.filter((g) => g !== "COMMITMENT");

export function GatePanel({
  opportunityId,
  gateState,
  canEdit,
}: {
  opportunityId: string;
  gateState: Partial<Record<GateName, GateStatus>>;
  canEdit: boolean;
}) {
  return (
    <div className="space-y-1">
      {EDITABLE_GATES.map((gate) => (
        <GateRow
          key={gate}
          opportunityId={opportunityId}
          gate={gate}
          status={gateState[gate] ?? "OPEN"}
          canEdit={canEdit}
        />
      ))}
      {!canEdit && (
        <p className="pt-1 font-mono text-micro text-ink-tertiary">
          Only org OWNER/ADMIN can record gate decisions.
        </p>
      )}
    </div>
  );
}

function GateRow({
  opportunityId,
  gate,
  status,
  canEdit,
}: {
  opportunityId: string;
  gate: GateName;
  status: GateStatus;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const boundAction = setGate.bind(null, opportunityId);
  const [state, formAction, pending] = useActionState(boundAction, initialSimpleState);

  const color =
    status === "PASSED"
      ? "text-signal-green"
      : status === "FAILED"
        ? "text-signal-red"
        : "text-ink-tertiary";

  return (
    <div className="rounded-sm border border-base-3 bg-base-1 px-3 py-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-ink-primary">{GATE_LABELS[gate]}</span>
        <div className="flex items-center gap-3">
          <span className={`font-mono ${color}`}>{status}</span>
          {canEdit && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="font-mono text-micro uppercase tracking-wide text-ink-tertiary hover:text-ink-primary"
            >
              {open ? "cancel" : "change"}
            </button>
          )}
        </div>
      </div>

      {open && canEdit && (
        <form action={formAction} className="mt-2 space-y-2 border-t border-base-3 pt-2">
          <input type="hidden" name="gate" value={gate} />
          <div className="flex gap-1">
            {(["OPEN", "PASSED", "FAILED"] as GateStatus[]).map((s) => (
              <label
                key={s}
                className="flex-1 cursor-pointer rounded-sm border border-base-3 text-center font-mono text-micro uppercase tracking-wide text-ink-secondary has-[:checked]:border-signal-gold has-[:checked]:text-signal-gold"
              >
                <input type="radio" name="status" value={s} defaultChecked={s === status} className="sr-only" />
                <span className="block py-1">{s}</span>
              </label>
            ))}
          </div>
          <input
            name="reason"
            required
            placeholder="Reason for this decision (required)"
            className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1 text-sm text-ink-primary placeholder:text-ink-tertiary"
          />
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-sm bg-signal-gold py-1.5 text-sm font-medium text-base-0 transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save decision"}
          </button>
          {state.error && <p className="text-signal-red">{state.error}</p>}
        </form>
      )}
    </div>
  );
}
