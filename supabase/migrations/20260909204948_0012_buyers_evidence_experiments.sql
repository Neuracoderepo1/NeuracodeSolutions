
create type public.buyer_status as enum (
  'TARGET','CONTACTED','REPLIED','INTERVIEWED','TRIAL','LOI','PAID','CUSTOMER','REJECTED'
);

create type public.experiment_verdict as enum (
  'PASS','FAIL','EXTEND','PIVOT','KILL'
);

create table public.buyers (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id),
  company text not null,
  contact text,
  role text,
  company_size text,
  estimated_revenue numeric,
  pain text,
  current_solution text,
  current_spend numeric,
  estimated_wtp numeric,
  status public.buyer_status not null default 'TARGET',
  last_contact timestamptz,
  next_followup timestamptz,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id),
  claim text not null,
  evidence_type text,
  evidence_level smallint not null check (evidence_level between 0 and 10),
  source text,
  source_url text,
  source_date date,
  confidence numeric check (confidence between 0 and 1),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id),
  hypothesis text not null,
  test text,
  success_criteria text,
  start_date date,
  end_date date,
  result text,
  verdict public.experiment_verdict,
  evidence text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.landing_tests (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id),
  visitors int not null default 0,
  cta_clicks int not null default 0,
  leads int not null default 0,
  qualified_leads int not null default 0,
  demos int not null default 0,
  trial_requests int not null default 0,
  lois int not null default 0,
  preorders int not null default 0,
  recorded_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table public.revenue_snapshots (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id),
  mrr numeric not null default 0,
  arr numeric not null default 0,
  customers int not null default 0,
  new_customers int not null default 0,
  expansion_mrr numeric not null default 0,
  churn_pct numeric,
  net_new_mrr numeric,
  cac numeric,
  ltv numeric,
  gross_margin numeric,
  snapshot_date date not null default current_date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.exit_scores (
  opportunity_id uuid primary key references public.opportunities(id),
  revenue_score smallint check (revenue_score between 0 and 10),
  growth_score smallint check (growth_score between 0 and 10),
  retention_score smallint check (retention_score between 0 and 10),
  technology_score smallint check (technology_score between 0 and 10),
  ip_score smallint check (ip_score between 0 and 10),
  customer_quality_score smallint check (customer_quality_score between 0 and 10),
  strategic_relevance_score smallint check (strategic_relevance_score between 0 and 10),
  documentation_score smallint check (documentation_score between 0 and 10),
  security_score smallint check (security_score between 0 and 10),
  operational_independence_score smallint check (operational_independence_score between 0 and 10),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create index on public.buyers (opportunity_id);
create index on public.evidence (opportunity_id);
create index on public.experiments (opportunity_id);
create index on public.landing_tests (opportunity_id);
create index on public.revenue_snapshots (opportunity_id);
;
