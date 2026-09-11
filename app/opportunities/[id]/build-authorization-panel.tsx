"use client";

import { useActionState } from "react";
import { requestBuild, type BuildActionState } from "./actions";
import { GATE_LABELS, GATE_ORDER } from "@/lib/pbv";
import type { OpportunitySummary } from "@/lib/types";

const initialState: BuildActionState = { result: null, error: null };

export default function BuildAuthorizationPanel({
  opportunity,
}: {
  opportunity: OpportunitySummary;
}) {
  const boundAction = requestBuild.bind(null, opportunity.id);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  // Once a request has been made, show its result instead of the
  // pre-request summary — the RPC response is authoritative and may
  // reflect a stage change the props (captured at page load) don't know
  // about yet, until revalidation re-renders the server component.
  const showingResult = state.result !== null;
  const allowed = state.result?.allowed ?? false;
  const blockingReasons = state.result?.blockingReasons ?? [];

  const canRequest = opportunity.stage === "PRE_SALE";

  return (
    <div
      className={`rounded-sm border bg-base-1 p-4 ${
        showingResult
          ? allowed
            ? "border-signal-green"
            : "border-signal-red"
          : "border-base-3"
      }`}
    >
      <div className="mb-3 font-mono text-micro uppercase tracking-wide text-ink-tertiary">
        Build authorization
      </div>

      {!showingResult && (
        <>
          <Row label="PBV" value={`${Math.round(opportunity.pbv)} / 85`} ok={opportunity.pbv >= 85} />
          {GATE_ORDER.map((g) => (
            <Row
              key={g}
              label={GATE_LABELS[g]}
              value={opportunity.gate_state?.[g] ? "PASSED" : "OPEN"}
              ok={opportunity.gate_state?.[g] === true}
            />
          ))}
          <Row
            label="Commitments"
            value={`${opportunity.qualified_commitments} / 3`}
            ok={opportunity.qualified_commitments >= 3}
          />
        </>
      )}

      {showingResult && state.result && (
        <>
          <div
            className={`mb-2 font-mono text-sm ${
              allowed ? "text-signal-green" : "text-signal-red"
            }`}
          >
            {state.result.decision}
          </div>
          {!allowed && blockingReasons.length > 0 && (
            <div className="space-y-1">
              <div className="font-mono text-micro text-ink-tertiary">
                BLOCKING REASONS
              </div>
              {blockingReasons.map((r, i) => (
                <div key={i} className="pl-3 text-sm text-ink-secondary">
                  ○ {r}
                </div>
              ))}
            </div>
          )}
          {allowed && (
            <p className="text-sm text-ink-secondary">
              Stage moved to {state.result.stage}. Refresh to see it reflected
              across the board.
            </p>
          )}
        </>
      )}

      {state.error && (
        <p className="mt-2 text-sm text-signal-red">
          Request failed: {state.error}
        </p>
      )}

      <div className="mt-4 border-t border-base-3 pt-3">
        {canRequest ? (
          <form action={formAction}>
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-sm bg-signal-gold py-2 text-sm font-medium text-base-0 transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Requesting…" : "Request BUILD"}
            </button>
          </form>
        ) : (
          <p className="text-center font-mono text-micro text-ink-tertiary">
            BUILD can only be requested from PRE_SALE (currently{" "}
            {opportunity.stage})
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-ink-secondary">{label}</span>
      <span className={`font-mono ${ok ? "text-signal-green" : "text-ink-tertiary"}`}>
        {value}
      </span>
    </div>
  );
}
