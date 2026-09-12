import Link from "next/link";
import { signOut } from "@/app/login/actions";

export function AppNav({ email, active }: { email: string; active: "dashboard" | "opportunities" }) {
  return (
    <div className="mb-8 flex items-center justify-between border-b border-base-3 pb-4">
      <div className="flex items-center gap-6">
        <div className="font-mono text-micro uppercase tracking-wide text-signal-gold">Armadillon</div>
        <nav className="flex gap-4 text-sm">
          <Link
            href="/dashboard"
            className={active === "dashboard" ? "text-ink-primary" : "text-ink-tertiary hover:text-ink-secondary"}
          >
            Dashboard
          </Link>
          <Link
            href="/opportunities"
            className={active === "opportunities" ? "text-ink-primary" : "text-ink-tertiary hover:text-ink-secondary"}
          >
            Opportunities
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-ink-tertiary sm:inline">{email}</span>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-sm border border-base-3 px-3 py-1.5 font-mono text-micro uppercase tracking-wide text-ink-secondary hover:text-ink-primary"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
