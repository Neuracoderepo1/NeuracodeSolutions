import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";
import BuildAuthorizationPanel from "./build-authorization-panel";
import { GatePanel } from "./gate-panel";
import { PbvEvidencePanel } from "./pbv-evidence-panel";
import { CommitmentsPanel } from "./commitments-panel";
import type {
  CommitmentRow,
  DecisionLedgerRow,
  OpportunitySummary,
  PbvScoreRow,
} from "@/lib/types";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [
    { data: opportunity, error: oppError },
    { data: pbvScores },
    { data: commitments },
    { data: ledger },
    { data: canEdit },
  ] = await Promise.all([
    supabase
      .from("opportunity_summary")
      .select("*")
      .eq("id", id)
      .maybeSingle<OpportunitySummary>(),
    supabase
      .from("pbv_scores")
      .select("dimension_key, score, updated_at")
      .eq("opportunity_id", id)
      .returns<PbvScoreRow[]>(),
    supabase
      .from("commitments")
      .select("id, opportunity_id, type, buyer_reference, source, verification_status, created_at")
      .eq("opportunity_id", id)
      .order("created_at", { ascending: false })
      .returns<CommitmentRow[]>(),
    supabase
      .from("decision_ledger")
      .select(
        "id, opportunity_id, decision, previous_stage, requested_stage, result, pbv, qualified_commitments, blocking_reasons, actor, created_at"
      )
      .eq("opportunity_id", id)
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<DecisionLedgerRow[]>(),
    // Same check the RPCs enforce server-side (is_org_admin_for_opportunity)
    // — used here only to decide whether to show edit controls at all. It
    // changes nothing about authorization: an unauthorized attempt would be
    // rejected by set_validation_gate()/verify_commitment() regardless of
    // what this renders.
    supabase.rpc("is_org_admin_for_opportunity", { p_opportunity_id: id }),
  ]);

  if (oppError) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <AppNav email={user.email ?? ""} active="opportunities" />
        <div className="rounded-sm border border-signal-red bg-base-1 p-4 text-sm text-signal-red">
          Query failed: {oppError.message}
        </div>
      </main>
    );
  }

  if (!opportunity) {
    notFound();
  }

  const scoreByKey = new Map((pbvScores ?? []).map((s) => [s.dimension_key, s]));

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <AppNav email={user.email ?? ""} active="opportunities" />

      <Link
        href="/opportunities"
        className="mb-6 inline-block font-mono text-micro uppercase tracking-wide text-ink-tertiary hover:text-ink-primary"
      >
        ← Board
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-micro uppercase tracking-wide text-signal-gold">
            {opportunity.stage.replace("_", " ")}
          </div>
          <h1 className="mt-1 text-2xl font-medium text-ink-primary">
            {opportunity.title}
          </h1>
        </div>
        <span className="font-mono text-2xl text-ink-primary">
          {Math.round(opportunity.pbv)}
        </span>
      </div>

      {opportunity.problem_statement && (
        <Field label="Problem" value={opportunity.problem_statement} />
      )}
      {opportunity.buyer_description && (
        <Field label="Buyer" value={opportunity.buyer_description} />
      )}
      {opportunity.price_hypothesis && (
        <Field label="Price hypothesis" value={opportunity.price_hypothesis} />
      )}
      {opportunity.mvp_days != null && (
        <Field label="MVP estimate" value={`${opportunity.mvp_days} days`} />
      )}

      <Section title="Validation gates">
        <GatePanel
          opportunityId={id}
          gateState={opportunity.gate_state ?? {}}
          canEdit={canEdit ?? false}
        />
      </Section>

      <Section title="PBV breakdown">
        <PbvEvidencePanel opportunityId={id} scoreByKey={scoreByKey} />
      </Section>

      <Section title={`Commitments (${commitments?.length ?? 0})`}>
        <CommitmentsPanel
          opportunityId={id}
          commitments={commitments ?? []}
          canVerify={canEdit ?? false}
        />
      </Section>

      <Section title="Decision ledger">
        {!ledger || ledger.length === 0 ? (
          <Empty>No transitions attempted yet.</Empty>
        ) : (
          <div className="space-y-1">
            {ledger.map((entry) => (
              <div
                key={entry.id}
                className="rounded-sm border border-base-3 bg-base-1 px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono ${
                      entry.result === "ALLOWED" || entry.decision.endsWith("AUTHORIZED")
                        ? "text-signal-green"
                        : "text-signal-red"
                    }`}
                  >
                    {entry.decision}
                  </span>
                  <span className="font-mono text-micro text-ink-tertiary">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 text-ink-tertiary">
                  {entry.previous_stage} → {entry.requested_stage}
                  {entry.pbv != null && ` · PBV ${entry.pbv}`}
                  {entry.qualified_commitments != null &&
                    ` · ${entry.qualified_commitments}/3 commitments`}
                </div>
                {entry.blocking_reasons && entry.blocking_reasons.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {entry.blocking_reasons.map((r, i) => (
                      <div key={i} className="pl-2 text-ink-tertiary">
                        ○ {r}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="">
        <BuildAuthorizationPanel opportunity={opportunity} />
      </Section>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3">
      <div className="font-mono text-micro uppercase tracking-wide text-ink-tertiary">
        {label}
      </div>
      <div className="mt-0.5 text-sm text-ink-secondary">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      {title && (
        <h2 className="mb-2 font-mono text-micro uppercase tracking-wide text-ink-tertiary">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-base-3 bg-base-1 px-3 py-2 text-sm text-ink-tertiary">
      {children}
    </div>
  );
}
