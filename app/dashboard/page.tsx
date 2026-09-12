import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";
import { pbvBand, GATE_ORDER } from "@/lib/pbv";
import type { GateName, GateStatus, OpportunitySummary, OpportunityStage } from "@/lib/types";

const STAGE_ORDER: OpportunityStage[] = [
  "DISCOVER", "RESEARCH", "PAIN", "BUYER", "WTP", "WHITESPACE",
  "GTM", "PRE_SALE", "BUILD", "LAUNCH", "REVENUE", "EXIT",
]; // verified live against pg_enum ordering, 2026-09-10

const REQUIRED_COMMITMENTS = 3;
const PBV_THRESHOLD = 85;

function allGatesPassed(gateState: Record<GateName, GateStatus>): boolean {
  return GATE_ORDER.every((g) => gateState?.[g] === "PASSED");
}

// "Paper-ready" = clears PBV/gates/commitments on the same figures shown
// on the board. This is explicitly NOT the same thing as authorized —
// only transition_opportunity() (called from the detail page) actually
// authorizes a BUILD. Labeled this way so it's never mistaken for a
// decision that hasn't been made.
function paperReady(o: OpportunitySummary): boolean {
  return o.pbv >= PBV_THRESHOLD && allGatesPassed(o.gate_state) && o.qualified_commitments >= REQUIRED_COMMITMENTS;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.from("opportunity_summary").select("*").returns<OpportunitySummary[]>();
  const opportunities = data ?? [];

  const total = opportunities.length;
  const inValidation = opportunities.filter((o) => STAGE_ORDER.indexOf(o.stage) < STAGE_ORDER.indexOf("PRE_SALE")).length;
  const preSale = opportunities.filter((o) => o.stage === "PRE_SALE").length;
  const building = opportunities.filter((o) => o.stage === "BUILD").length;
  const live = opportunities.filter((o) => o.stage === "LAUNCH" || o.stage === "REVENUE").length;
  const paperReadyCount = opportunities.filter((o) => o.stage === "PRE_SALE" && paperReady(o)).length;

  const stageCounts = STAGE_ORDER.map((stage) => ({
    stage,
    count: opportunities.filter((o) => o.stage === stage).length,
  }));

  const candidates = opportunities
    .filter((o) => o.stage === "PRE_SALE")
    .map((o) => ({ o, ready: paperReady(o) }))
    .sort((a, b) => {
      if (a.ready !== b.ready) return a.ready ? -1 : 1;
      if (b.o.pbv !== a.o.pbv) return b.o.pbv - a.o.pbv;
      return b.o.qualified_commitments - a.o.qualified_commitments;
    });

  type Alert = { level: "warn" | "ok"; text: string };
  const alerts: Alert[] = [];

  opportunities
    .filter((o) => o.stage === "PRE_SALE" && paperReady(o))
    .forEach((o) => alerts.push({ level: "ok", text: `${o.title} clears PBV, gates, and commitments — ready to request BUILD.` }));

  opportunities
    .filter(
      (o) =>
        o.stage === "PRE_SALE" &&
        o.qualified_commitments === REQUIRED_COMMITMENTS - 1 &&
        allGatesPassed(o.gate_state) &&
        o.pbv >= PBV_THRESHOLD
    )
    .forEach((o) => alerts.push({ level: "ok", text: `${o.title} needs exactly one more qualified commitment.` }));

  opportunities
    .filter((o) => o.stage === "PRE_SALE" && o.qualified_commitments === 0)
    .forEach((o) => alerts.push({ level: "warn", text: `${o.title} has zero qualified commitments.` }));

  opportunities
    .filter(
      (o) =>
        o.stage === "PRE_SALE" &&
        o.pbv < PBV_THRESHOLD &&
        o.qualified_commitments >= REQUIRED_COMMITMENTS &&
        allGatesPassed(o.gate_state)
    )
    .forEach((o) => alerts.push({ level: "warn", text: `${o.title} has gates and commitments but PBV ${Math.round(o.pbv)} is below ${PBV_THRESHOLD}.` }));

  const order = { warn: 0, ok: 1 } as const;
  alerts.sort((a, b) => order[a.level] - order[b.level]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <AppNav email={user.email ?? ""} active="dashboard" />

      <div className="mb-8">
        <div className="font-mono text-micro uppercase tracking-wide text-signal-gold">
          Armadillon · Product Decision Engine
        </div>
        <h1 className="mt-2 text-xl font-medium text-ink-primary">Portfolio dashboard</h1>
        <p className="mt-1 text-sm text-ink-tertiary">
          No validation → no build. Every figure below is a live count from the database.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-sm border border-signal-red bg-base-1 p-4 text-sm text-signal-red">
          Query failed: {error.message}
        </div>
      )}

      {!error && total === 0 && (
        <div className="rounded-sm border border-base-3 bg-base-1 p-4 text-sm text-ink-tertiary">
          No opportunities visible to this account yet.
        </div>
      )}

      {!error && total > 0 && (
        <>
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "OPPORTUNITIES", value: total },
              { label: "VALIDATING", value: inValidation },
              { label: "PRE-SALE", value: preSale },
              { label: "READY (PAPER)", value: paperReadyCount },
              { label: "BUILDING/LIVE", value: building + live },
            ].map((k) => (
              <div key={k.label} className="rounded-sm border border-base-3 bg-base-1 p-3">
                <div className="font-mono text-micro uppercase tracking-wide text-ink-tertiary">{k.label}</div>
                <div className="mt-1 font-mono text-xl text-ink-primary">{k.value}</div>
              </div>
            ))}
          </div>

          <div className="mb-8">
            <div className="mb-2 font-mono text-micro uppercase tracking-wide text-ink-tertiary">Alerts</div>
            {alerts.length === 0 ? (
              <p className="text-sm text-ink-tertiary">No alerts.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {alerts.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className={a.level === "warn" ? "text-signal-gold" : "text-signal-green"}>
                      {a.level === "warn" ? "▲" : "✓"}
                    </span>
                    <span className="text-ink-secondary">{a.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-8">
            <div className="mb-2 font-mono text-micro uppercase tracking-wide text-ink-tertiary">Pipeline</div>
            <div className="flex gap-1 overflow-x-auto pb-2">
              {stageCounts.map((s) => (
                <div key={s.stage} className="min-w-[76px] shrink-0 rounded-sm border border-base-3 bg-base-1 px-2 py-2 text-center">
                  <div className="font-mono text-lg text-ink-primary">{s.count}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-wide text-ink-tertiary">
                    {s.stage.replace("_", " ")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 font-mono text-micro uppercase tracking-wide text-ink-tertiary">
              Capital allocation — where to spend engineering time next
            </div>
            {candidates.length === 0 ? (
              <p className="text-sm text-ink-tertiary">No PRE_SALE opportunities to rank.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {candidates.map(({ o, ready }, i) => {
                  const band = pbvBand(o.pbv);
                  return (
                    <Link
                      key={o.id}
                      href={`/opportunities/${o.id}`}
                      className="flex items-center justify-between rounded-sm border border-base-3 bg-base-1 p-3 transition-colors hover:border-base-3/80 hover:bg-base-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-ink-tertiary">#{i + 1}</span>
                        <span className="text-sm font-medium text-ink-primary">{o.title}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-micro">
                        <span className={ready ? "text-signal-green" : band.colorClass}>{ready ? "READY" : band.label}</span>
                        <span className="text-ink-tertiary">
                          PBV {Math.round(o.pbv)} · {o.qualified_commitments}/{REQUIRED_COMMITMENTS}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
