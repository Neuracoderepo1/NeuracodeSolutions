import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";
import { GATE_LABELS, GATE_ORDER, pbvBand } from "@/lib/pbv";
import type { OpportunitySummary } from "@/lib/types";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null; // middleware already redirects; this is defense in depth
  }

  const { data: opportunities, error } = await supabase
    .from("opportunity_summary")
    .select("*")
    .order("stage")
    .returns<OpportunitySummary[]>();

  const byStage = new Map<string, OpportunitySummary[]>();
  for (const opp of opportunities ?? []) {
    const list = byStage.get(opp.stage) ?? [];
    list.push(opp);
    byStage.set(opp.stage, list);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <AppNav email={user.email ?? ""} active="opportunities" />

      <div className="mb-8">
        <h1 className="text-xl font-medium text-ink-primary">Opportunity board</h1>
        <p className="mt-1 text-sm text-ink-tertiary">No validation, no build.</p>
      </div>

      {error && (
        <div className="rounded-sm border border-signal-red bg-base-1 p-4 text-sm text-signal-red">
          Query failed: {error.message}
          {error.message.includes("permission denied") && (
            <p className="mt-2 text-ink-tertiary">
              This account isn&apos;t a member of any organization yet — see{" "}
              <code className="font-mono">
                docs/RUNBOOK_founder_org_reassignment.md
              </code>
              .
            </p>
          )}
        </div>
      )}

      {!error && (opportunities?.length ?? 0) === 0 && (
        <div className="rounded-sm border border-base-3 bg-base-1 p-4 text-sm text-ink-tertiary">
          No opportunities visible to this account.
        </div>
      )}

      <div className="space-y-8">
        {Array.from(byStage.entries()).map(([stage, opps]) => (
          <section key={stage}>
            <div className="mb-3 flex items-baseline gap-2 border-b border-base-3 pb-2">
              <h2 className="font-mono text-micro uppercase tracking-wide text-ink-secondary">
                {stage.replace("_", " ")}
              </h2>
              <span className="font-mono text-micro text-ink-tertiary">
                ({opps.length})
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {opps.map((opp) => {
                const band = pbvBand(opp.pbv);
                return (
                  <Link
                    key={opp.id}
                    href={`/opportunities/${opp.id}`}
                    className="block rounded-sm border border-base-3 bg-base-1 p-3 transition-colors hover:border-base-3/80 hover:bg-base-2"
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-ink-primary">
                        {opp.title}
                      </span>
                      <span
                        className={`shrink-0 font-mono text-sm ${band.colorClass}`}
                      >
                        {Math.round(opp.pbv)}
                      </span>
                    </div>
                    {opp.problem_statement && (
                      <p className="mb-2 line-clamp-2 text-xs text-ink-tertiary">
                        {opp.problem_statement}
                      </p>
                    )}
                    <div className="mb-2 flex flex-wrap gap-1">
                      {GATE_ORDER.map((g) => {
                        // Fixed: gate_state values are the actual status
                        // STRING, not a boolean — verified live 2026-09-11.
                        // `=== true` here always evaluated false.
                        const status = opp.gate_state?.[g] ?? "OPEN";
                        const passed = status === "PASSED";
                        const failed = status === "FAILED";
                        return (
                          <span
                            key={g}
                            title={`${GATE_LABELS[g]}: ${status}`}
                            className={`inline-block h-2 w-2 rounded-full ${
                              passed
                                ? "bg-signal-green"
                                : failed
                                  ? "bg-signal-red"
                                  : "border border-base-3"
                            }`}
                          />
                        );
                      })}
                    </div>
                    <div className="font-mono text-micro text-ink-tertiary">
                      {opp.qualified_commitments}/3 commitments ·{" "}
                      {band.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
