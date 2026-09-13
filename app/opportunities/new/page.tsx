import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";
import { NewOpportunityForm } from "./opportunity-form";

export default async function NewOpportunityPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id);

  const orgIds = (memberships ?? []).map((m) => m.organization_id);

  const { data: organizations, error: orgError } = orgIds.length
    ? await supabase.from("organizations").select("id, name").in("id", orgIds)
    : { data: [], error: null };

  const error = membershipError ?? orgError;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <AppNav email={user.email ?? ""} active="opportunities" />

      <div className="mb-6">
        <h1 className="text-xl font-medium text-ink-primary">New opportunity</h1>
        <p className="mt-1 text-sm text-ink-tertiary">
          No validation, no build — this just opens the file at DISCOVER.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-sm border border-signal-red bg-base-1 p-4 text-sm text-signal-red">
          Failed to load your organizations: {error.message}
        </div>
      )}

      {!error && (organizations ?? []).length === 0 && (
        <div className="rounded-sm border border-base-3 bg-base-1 p-4 text-sm text-ink-tertiary">
          You aren&apos;t a member of any organization yet, so there&apos;s
          nowhere to create this under.
        </div>
      )}

      {(organizations ?? []).length > 0 && (
        <NewOpportunityForm organizations={organizations ?? []} />
      )}
    </main>
  );
}
