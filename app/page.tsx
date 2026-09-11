import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LandingPage from "./LandingPage";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Preserve the existing behavior: signed-in visitors skip the marketing
  // page and land straight on the dashboard. This check has to happen in
  // a server component — LandingPage itself is a client component (it
  // needs interactive state for the pipeline hover/gate-simulator demo)
  // and can't do an authoritative auth check.
  if (user) redirect("/dashboard");

  return <LandingPage />;
}
