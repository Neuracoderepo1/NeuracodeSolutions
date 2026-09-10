-- Organizations
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.org_role not null default 'MEMBER',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index idx_org_members_user on public.organization_members(user_id);

-- Opportunities (the lifecycle-bearing entity)
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  created_by uuid not null references auth.users(id),
  title text not null,
  stage public.opportunity_stage not null default 'DISCOVER',
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_opportunities_org on public.opportunities(organization_id);
create index idx_opportunities_stage on public.opportunities(stage);

-- PBV canonical dimension weights (must total exactly 100)
create table public.pbv_dimensions (
  key text primary key,
  weight numeric(5,2) not null check (weight > 0)
);

-- PBV evidence: append-only log of scoring submissions
create table public.pbv_evidence (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  dimension_key text not null references public.pbv_dimensions(key),
  score numeric(4,2) not null check (score >= 0 and score <= 10),
  evidence_text text,
  submitted_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_pbv_evidence_opp on public.pbv_evidence(opportunity_id, dimension_key);

-- PBV current score per dimension (derived, upserted by record_pbv_evidence)
create table public.pbv_scores (
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  dimension_key text not null references public.pbv_dimensions(key),
  score numeric(4,2) not null check (score >= 0 and score <= 10),
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (opportunity_id, dimension_key)
);

-- Validation gates: one row per opportunity per canonical gate
create table public.validation_gates (
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  gate public.gate_name not null,
  status public.gate_status not null default 'OPEN',
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (opportunity_id, gate)
);

-- Gate decision audit trail (append-only)
create table public.gate_decisions (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  gate public.gate_name not null,
  previous_status public.gate_status not null,
  new_status public.gate_status not null,
  actor uuid not null references auth.users(id),
  reason text,
  created_at timestamptz not null default now()
);

-- Commitments (buyer commitments with verification provenance)
create table public.commitments (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  type public.commitment_type not null,
  buyer_reference text,
  source text,
  verification_status public.verification_status not null default 'UNVERIFIED',
  verified_at timestamptz,
  verified_by uuid references auth.users(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_commitments_opp on public.commitments(opportunity_id);
create index idx_commitments_opp_qualified
  on public.commitments(opportunity_id)
  where type in ('LOI','PAID_PILOT','PREORDER','CUSTOMER') and verification_status = 'VERIFIED';

-- Decision ledger: immutable record of every transition attempt/outcome
create table public.decision_ledger (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  decision text not null,
  previous_stage public.opportunity_stage not null,
  requested_stage public.opportunity_stage not null,
  result text not null,
  pbv numeric(5,2),
  gate_state jsonb,
  qualified_commitments int,
  blocking_reasons jsonb,
  actor uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_ledger_opp on public.decision_ledger(opportunity_id, created_at);
