"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TransitionResult } from "@/lib/types";

export type BuildActionState = {
  result: TransitionResult | null;
  error: string | null;
};

/**
 * Calls transition_opportunity(opportunity_id, 'BUILD') — the ONLY function
 * in this codebase allowed to move an opportunity into BUILD. This action
 * does not check PBV, gates, or commitments itself; it renders whatever the
 * RPC returns, verbatim. There is deliberately no client-side authorization
 * logic to keep in sync with the database — see HANDOFF.md.
 */
export async function requestBuild(
  opportunityId: string,
  _prevState: BuildActionState,
  _formData: FormData
): Promise<BuildActionState> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("transition_opportunity", {
      p_opportunity_id: opportunityId,
      p_requested_stage: "BUILD",
    })
    .single<TransitionResult>();

  if (error) {
    // A thrown exception from the RPC (not authorized/not a member/opportunity
    // not found) lands here — distinct from an ALLOWED:false response, which
    // is a normal, expected outcome logged to decision_ledger, not an error.
    return { result: null, error: error.message };
  }

  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/");

  return { result: data, error: null };
}
