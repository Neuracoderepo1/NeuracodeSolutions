"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "./actions";

const initialState: AuthState = { error: null };

export default function LoginPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [signInState, signInAction, signInPending] = useActionState(
    signIn,
    initialState
  );
  const [signUpState, signUpAction, signUpPending] = useActionState(
    signUp,
    initialState
  );

  const action = mode === "in" ? signInAction : signUpAction;
  const state = mode === "in" ? signInState : signUpState;
  const pending = mode === "in" ? signInPending : signUpPending;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="font-mono text-micro uppercase tracking-wide text-signal-gold">
            NeuraCode Tech Studios
          </div>
          <h1 className="mt-2 text-2xl font-medium text-ink-primary">
            Command Center
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            No validation, no build.
          </p>
        </div>

        <div className="mb-6 flex gap-4 border-b border-base-3 font-mono text-micro uppercase tracking-wide">
          <button
            onClick={() => setMode("in")}
            className={`-mb-px border-b py-2 ${
              mode === "in"
                ? "border-signal-gold text-ink-primary"
                : "border-transparent text-ink-tertiary hover:text-ink-secondary"
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => setMode("up")}
            className={`-mb-px border-b py-2 ${
              mode === "up"
                ? "border-signal-gold text-ink-primary"
                : "border-transparent text-ink-tertiary hover:text-ink-secondary"
            }`}
          >
            Create account
          </button>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label className="mb-1.5 block font-mono text-micro uppercase tracking-wide text-ink-tertiary">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-sm border border-base-3 bg-base-1 px-3 py-2 text-sm text-ink-primary outline-none focus:border-signal-gold"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-micro uppercase tracking-wide text-ink-tertiary">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              className="w-full rounded-sm border border-base-3 bg-base-1 px-3 py-2 text-sm text-ink-primary outline-none focus:border-signal-gold"
            />
          </div>

          {state.error && (
            <p className="text-sm text-signal-red">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-sm bg-signal-gold py-2 text-sm font-medium text-base-0 transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending
              ? "Working…"
              : mode === "in"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
