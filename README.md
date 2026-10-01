# Armadillon — Product Decision Engine

**Product name: Armadillon.** Built and operated by Neuracode; the
Supabase project (`ivcweujfzdwmkztjczln`, "Neuracode Product Solutions"),
GitHub repo name, and internal seed identifiers (e.g.
`seed@neuracode.internal`) intentionally still carry the Neuracode name —
renaming the product's public identity doesn't require renaming
infrastructure that isn't user-facing. See the rename commit on
2026-09-10 for exactly what changed and what was deliberately left alone.

**Status: feature-complete core product.** Every table in the schema now
has working UI backed by real, tested Supabase calls — RLS does the
authorization, nothing here reimplements it. The founder account is the
sole OWNER (see `docs/RUNBOOK_founder_org_reassignment.md`).

## What's real here

- Full Next.js App Router + Tailwind, builds and typechecks clean.
- `lib/supabase/{client,server,middleware}.ts` — `@supabase/ssr` wiring,
  session refresh in `middleware.ts`, RLS-respecting (publishable/anon
  key only, never the service role key).
- Auth: `app/login/page.tsx` + `app/login/actions.ts` (`signIn`/`signUp`).
- Dashboard (`app/dashboard`) and opportunity board (`app/opportunities`).
- Opportunity detail page (`app/opportunities/[id]`) with, in the order
  they render: validation gates, PBV breakdown, buyers, evidence log,
  experiments, landing tests, commitments, decision ledger, **Build
  Authorization panel** (calls `transition_opportunity`, the sole
  authorization RPC — row-locked, logs every attempt to
  `decision_ledger`; `opportunities` has no client-reachable `UPDATE`
  policy, so the frontend cannot bypass it), revenue snapshots, exit
  scores.
- Opportunity creation form (`app/opportunities/new`).
- `lib/types.ts` — types matching the live schema for every table below.

**Two panels both called "evidence" on purpose mean different things:**
`pbv-evidence-panel.tsx` scores the 6 PBV dimensions; `evidence-log-panel.tsx`
is a general claims log against the separate `evidence` table. Don't merge
them.

| Table | Panel | Write access |
|---|---|---|
| `buyers` | `buyers-panel.tsx` | any member |
| `evidence` | `evidence-log-panel.tsx` | any member, insert-only |
| `experiments` | `experiments-panel.tsx` | any member |
| `landing_tests` | `landing-tests-panel.tsx` | any member, insert-only |
| `revenue_snapshots` | `revenue-panel.tsx` | OWNER/ADMIN only, insert-only |
| `exit_scores` | `exit-scores-panel.tsx` | OWNER/ADMIN only, upsert |

## What's guessed, and needs reconciling

- `tailwind.config.ts` — the color tokens (`base-*`, `ink-*`,
  `signal-*`) are a **reconstruction**, inferred from `login/page.tsx`
  (the one piece of verbatim-recovered UI) plus this project's
  established amber/gold-on-near-black terminal aesthetic. Worth a
  visual pass against that one file before calling the design final.

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
