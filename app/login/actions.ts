"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * RECONSTRUCTED — not recovered from the original Claude Code session.
 * Only app/login/page.tsx was available to copy verbatim; this file
 * exists to satisfy the `signIn`, `signUp`, `AuthState` contract that
 * page.tsx imports, so the scaffold actually builds and runs. Replace
 * with the original if/when it's recovered — the contract below
 * should match, since the page component that calls it was untouched.
 */

export type AuthState = {
  error: string | null;
};

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

export async function signIn(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  // NOTE: this account is NOT automatically an org member. Per
  // HANDOFF.md, the first real task after someone signs up as the
  // founder is to reassign the seed org owner (organization_members
  // row for org 11111111-1111-1111-1111-111111111111, currently
  // owned by the seed@neuracode.internal placeholder) to this new
  // user — that step is deliberately NOT automated here, since it
  // should happen once, deliberately, not on every signup.
  revalidatePath("/", "layout");
  redirect("/login?check-email=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
