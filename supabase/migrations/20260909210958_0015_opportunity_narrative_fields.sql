alter table public.opportunities
  add column description text,
  add column problem_statement text,
  add column solution_hypothesis text,
  add column buyer_description text,
  add column price_hypothesis text,
  add column mvp_days int;
