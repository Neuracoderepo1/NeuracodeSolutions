-- gate_decisions rows can be system-derived (e.g. the COMMITMENT gate auto-sync trigger
-- firing from a service-role job with no authenticated session), so actor must be nullable
-- there. A null actor unambiguously means "system-derived", never a human decision.
alter table public.gate_decisions alter column actor drop not null;

comment on column public.gate_decisions.actor is
  'The authenticated user who made this gate decision. NULL means the decision was system-derived (e.g. COMMITMENT gate auto-sync), never a human authorization.';
