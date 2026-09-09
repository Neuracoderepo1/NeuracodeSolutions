import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client bound to the current request's cookies.
 * Use this in Server Components, Route Handlers, and Server Actions —
 * never import lib/supabase/client.ts (browser client) on the server.
 *
 * This client uses the publishable/anon key and is subject to RLS.
 * It intentionally has no path to the service role key — the service
 * role key must never be imported into any file under app/ or lib/
 * that ships to (or is reachable from) the client bundle.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component (no response to write
            // cookies to). Safe to ignore as long as middleware.ts is
            // refreshing the session on every request.
          }
        },
      },
    }
  );
}
