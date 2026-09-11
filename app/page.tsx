import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const GATES = ["Opportunity", "Pain", "Buyer", "Economics", "Whitespace", "Distribution", "Commitment"];

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-2 font-mono text-micro uppercase tracking-wide text-signal-gold">
        NeuraCode Tech Studios
      </div>
      <h1 className="mb-4 text-3xl font-medium leading-tight text-ink-primary sm:text-4xl">
        No validation → no build.
      </h1>
      <p className="mb-10 max-w-xl text-base leading-relaxed text-ink-secondary">
        A decision-control layer for product operations. Every opportunity moves through seven
        validation gates, a weighted evidence score, and a real buyer-commitment threshold before
        engineering time is authorized — and the database, not a spreadsheet or a person's
        judgment call, makes that final call.
      </p>

      <div className="mb-14 flex gap-3">
        <Link
          href="/login"
          className="rounded-sm bg-signal-gold px-5 py-2.5 text-sm font-medium text-base-0 transition-opacity hover:opacity-90"
        >
          Sign in
        </Link>
        <Link
          href="/login"
          className="rounded-sm border border-base-3 px-5 py-2.5 text-sm text-ink-secondary transition-colors hover:border-base-3/80 hover:text-ink-primary"
        >
          Create account
        </Link>
      </div>

      <div className="mb-14 grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "Seven validation gates",
            body: "Opportunity, Pain, Buyer, Economics, Whitespace, Distribution, and Commitment — each one has to actually clear before a build request can succeed.",
          },
          {
            title: "Evidence-weighted PBV score",
            body: "A 0–100 score built from ten weighted dimensions. Every point traces back to evidence someone recorded — not a founder's gut feel.",
          },
          {
            title: "Commitments, not conversations",
            body: "Interest doesn't count. Only verified LOIs, paid pilots, preorders, or customers count toward the three required to unlock BUILD.",
          },
        ].map((f) => (
          <div key={f.title} className="rounded-sm border border-base-3 bg-base-1 p-4">
            <div className="mb-2 text-sm font-medium text-ink-primary">{f.title}</div>
            <p className="text-sm leading-relaxed text-ink-tertiary">{f.body}</p>
          </div>
        ))}
      </div>

      <div className="rounded-sm border border-base-3 bg-base-1 p-5">
        <div className="mb-3 font-mono text-micro uppercase tracking-wide text-ink-tertiary">
          The gate track
        </div>
        <div className="flex flex-wrap gap-2">
          {GATES.map((g) => (
            <span
              key={g}
              className="rounded-sm border border-base-3 px-2.5 py-1 font-mono text-micro uppercase tracking-wide text-ink-secondary"
            >
              {g}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink-tertiary">
          The decision is a database function, not a UI toggle — the frontend can request a
          transition, but it can never grant one. Every attempt, allowed or blocked, is written to
          an append-only decision ledger.
        </p>
      </div>
    </main>
  );
}
