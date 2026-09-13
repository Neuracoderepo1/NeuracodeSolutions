"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateOpportunityState = { error: string | null };
export const initialCreateState: CreateOpportunityState = { error: null };

/**
 * Inserts directly into `opportunities` rather than calling an RPC —
 * there's no create_opportunity() function; the table's own RLS and
 * column-level grants are the authorization boundary here. The
 * opportunities_insert policy requires:
 *   is_org_member(organization_id) AND created_by = auth.uid()
 *   AND stage = 'DISCOVER' AND version = 1
 * We satisfy created_by explicitly and let stage/version fall through to
 * their column defaults (also DISCOVER/1) rather than hardcoding values
 * that would silently drift from the policy if either default ever
 * changed — if they ever disagree, the insert fails loudly instead of
 * quietly creating something in the wrong state.
 */
export async function createOpportunity(
  _prevState: CreateOpportunityState,
  formData: FormData
): Promise<CreateOpportunityState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  if (!organizationId) return { error: "Choose an organization" };
  if (!title) return { error: "Title is required" };

  const mvpDaysRaw = String(formData.get("mvpDays") ?? "").trim();
  const mvpDays = mvpDaysRaw ? Number(mvpDaysRaw) : null;
  if (mvpDaysRaw && (Number.isNaN(mvpDays) || mvpDays! < 0)) {
    return { error: "MVP estimate must be a non-negative number of days" };
  }

  const optional = (key: string) => String(formData.get(key) ?? "").trim() || null;

  const { data, error } = await supabase
    .from("opportunities")
    .insert({
      organization_id: organizationId,
      created_by: user.id,
      title,
      description: optional("description"),
      problem_statement: optional("problemStatement"),
      solution_hypothesis: optional("solutionHypothesis"),
      buyer_description: optional("buyerDescription"),
      price_hypothesis: optional("priceHypothesis"),
      mvp_days: mvpDays,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/opportunities");
  revalidatePath("/dashboard");
  redirect(`/opportunities/${data.id}`);
}
