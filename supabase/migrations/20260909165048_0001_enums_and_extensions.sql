-- Extensions
create extension if not exists pgcrypto with schema extensions;

-- Enumerations for the Product Decision Operations Engine
create type public.org_role as enum ('OWNER', 'ADMIN', 'MEMBER');

create type public.opportunity_stage as enum (
  'DISCOVER',
  'RESEARCH',
  'PAIN',
  'BUYER',
  'WTP',
  'WHITESPACE',
  'GTM',
  'PRE_SALE',
  'BUILD',
  'LAUNCH',
  'REVENUE',
  'EXIT'
);

create type public.gate_name as enum (
  'OPPORTUNITY',
  'PAIN',
  'BUYER',
  'ECONOMICS',
  'WHITESPACE',
  'DISTRIBUTION',
  'COMMITMENT'
);

create type public.gate_status as enum ('OPEN', 'PASSED', 'FAILED');

create type public.commitment_type as enum ('INTEREST', 'LOI', 'PAID_PILOT', 'PREORDER', 'CUSTOMER');

create type public.verification_status as enum ('UNVERIFIED', 'VERIFIED', 'REJECTED');
