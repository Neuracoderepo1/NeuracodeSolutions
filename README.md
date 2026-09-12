# Armadillon — Product Decision Engine

**Product name: Armadillon.** Built and operated by Neuracode; the
Supabase project (`ivcweujfzdwmkztjczln`, "Neuracode Product Solutions"),
GitHub repo name, and internal seed identifiers (e.g.
`seed@neuracode.internal`) intentionally still carry the Neuracode name —
renaming the product's public identity doesn't require renaming
infrastructure that isn't user-facing. See the rename commit on
2026-09-10 for exactly what changed and what was deliberately left alone.

**Status: provisional scaffold, committed 2026-09-09.** This is NOT the
Phase 3 build from the Claude Code session referenced in `HANDOFF.md` —
that session became unavailable before its work was pushed anywhere,
so this exists to (a) stop the repo being empty and (b) prove the
Supabase wiring works end to end, with real, tested code rather than
a description of what should exist.

## What's real here

- Full Next.js App Router + Tailwind scaffold, builds and typechecks.
- `lib/supabase/{client,server,middleware}.ts` — standard `@supabase/ssr`
  wiring, session refresh in `middleware.ts`, RLS-respecting (uses the
  publishable/anon key only, never the service role key).
- `app/login/page.tsx` — copied **verbatim** from the pasted output of
  the other Claude Code session. This is the one piece of real,
  recovered UI code.
- `app/login/actions.ts` — **reconstructed**, not recovered. Only
  `page.tsx` was available; this implements the `signIn`/`signUp`/
  `AuthState` contract it imports, backed by real Supabase Auth calls.
- `app/page.tsx` — a placeholder home page, not the real dashboard. It
  queries `organizations` as a live smoke test of RLS + auth, nothing
  more.
- `lib/types.ts` — types matching the live schema (confirmed by direct
  DB audit on 2026-09-09), for reuse when the real board gets built.

## What's guessed, and needs reconciling

- `tailwind.config.ts` — the color tokens (`base-*`, `ink-*`,
  `signal-*`) are a **reconstruction**, inferred from the class names
  used in `login/page.tsx` plus this project's established amber/gold-
  on-near-black terminal aesthetic. They are very likely *not*
  byte-identical to whatever the original session's config had.
  Everything else only references these token names, so swapping this
  one file for the recovered original should be a clean drop-in.
- Any shared lib/types/UI components from the other session
  ("format helpers and small UI components (stage pill, gate track)")
  were never recovered and are not represented here at all.

## What's missing entirely (see HANDOFF.md §"Suggested next steps")

- The real opportunity board (`opportunities` + `pbv_scores` +
  `validation_gates` + `commitments`).
- Opportunity detail page + live Build Authorization panel calling
  `transition_opportunity(opportunity_id, requested_stage)` — this is
  the RPC that does all authorization; nothing in the frontend should
  ever reimplement PBV/gate/commitment math. It was independently
  audited on 2026-09-09 and is correct: atomic, row-locked, logs every
  attempt (allowed or blocked) to `decision_ledger`, and — notably —
  `opportunities` has no client-reachable `UPDATE` RLS policy, so a
  buggy or malicious frontend literally cannot write `stage` directly.
- Founder account setup + reassigning the seed org owner
  (`seed@neuracode.internal`, org `11111111-1111-1111-1111-111111111111`)
  to the real account — deliberately NOT automated in `signUp()`,
  since it should happen once, on purpose, not on every signup.
- Everything past that: buyers, evidence ledger, experiments, revenue,
  exit UI.

## Running it

```bash
cp .env.example .env.local   # then fill in the publishable key
npm install
npm run dev
```

## Known non-secret data in this scaffold

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
are committed in `.env.example` as real values. This is intentional —
publishable/anon keys are designed to be public and are meaningless
without RLS-approved org membership behind them. The service role key
is not in this repo anywhere and must never be added to it.
