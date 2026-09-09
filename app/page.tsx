import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already redirects unauthenticated requests to /login,
  // but a server component should never assume that ran correctly.
  if (!user) {
    return null;
  }

  const { data: orgs, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, opportunities(count)");

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="font-mono text-micro uppercase tracking-wide text-signal-gold">
            NeuraCode · Product Operations
          </div>
          <h1 className="mt-2 text-xl font-medium text-ink-primary">
            Signed in as {user.email}
          </h1>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-sm border border-base-3 px-3 py-1.5 font-mono text-micro uppercase tracking-wide text-ink-secondary hover:text-ink-primary"
          >
            Sign out
          </button>
        </form>
      </div>

      <div className="rounded-sm border border-base-3 bg-base-1 p-4">
        <div className="mb-2 font-mono text-micro uppercase tracking-wide text-ink-tertiary">
          Provisional scaffold — not the Phase 3 UI
        </div>
        <p className="mb-4 text-sm text-ink-secondary">
          This page only exists to prove the Supabase session and RLS are
          wired correctly end to end. The real opportunity board, detail
          view, and Build Authorization panel (wired to{" "}
          <code className="font-mono text-ink-primary">
            transition_opportunity
          </code>
          ) still need to be built or recovered. See README.md.
        </p>

        {orgError && (
          <p className="text-sm text-signal-red">
            Query failed: {orgError.message}
          </p>
        )}

        {!orgError && (!orgs || orgs.length === 0) && (
          <p className="text-sm text-ink-tertiary">
            No organizations visible to this account yet — if this is the
            founder account, the seed org owner still needs to be
            reassigned (see HANDOFF.md).
          </p>
        )}

        {!orgError && orgs && orgs.length > 0 && (
          <ul className="space-y-1 font-mono text-sm text-ink-primary">
            {orgs.map((o: any) => (
              <li key={o.id}>
                {o.name} — {o.opportunities?.[0]?.count ?? 0} opportunities
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
