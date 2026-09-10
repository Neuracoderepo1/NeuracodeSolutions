-- Authoritative PBV computation: normalized 0-10 score * dimension weight, summed.
-- Never uses least(score, weight) -- that was the bug this replaces.
create or replace function public.compute_pbv(p_opportunity_id uuid)
returns numeric
language sql
stable
set search_path = pg_catalog, public
as $$
  select coalesce(
    sum((s.score / 10.0) * w.weight),
    0
  )::numeric(5,2)
  from public.pbv_scores s
  join public.pbv_dimensions w on w.key = s.dimension_key
  where s.opportunity_id = p_opportunity_id;
$$;

-- The only sanctioned way to create score-bearing PBV evidence.
-- SECURITY DEFINER so it can write to pbv_evidence/pbv_scores despite clients
-- having no direct INSERT/UPDATE grant on those tables.
create or replace function public.record_pbv_evidence(
  p_opportunity_id uuid,
  p_dimension_key text,
  p_score numeric,
  p_evidence_text text default null
)
returns numeric
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_org_id uuid;
  v_new_pbv numeric;
begin
  if p_score < 0 or p_score > 10 then
    raise exception 'score must be between 0 and 10 (got %)', p_score using errcode = '22003';
  end if;

  select organization_id into v_org_id
  from public.opportunities
  where id = p_opportunity_id;

  if v_org_id is null then
    raise exception 'opportunity not found' using errcode = 'P0002';
  end if;

  if not public.is_org_member(v_org_id) then
    raise exception 'not authorized: not a member of this organization' using errcode = '42501';
  end if;

  if not exists (select 1 from public.pbv_dimensions where key = p_dimension_key) then
    raise exception 'unknown pbv dimension: %', p_dimension_key using errcode = '22023';
  end if;

  insert into public.pbv_evidence (opportunity_id, dimension_key, score, evidence_text, submitted_by)
  values (p_opportunity_id, p_dimension_key, p_score, p_evidence_text, auth.uid());

  insert into public.pbv_scores (opportunity_id, dimension_key, score, updated_by, updated_at)
  values (p_opportunity_id, p_dimension_key, p_score, auth.uid(), now())
  on conflict (opportunity_id, dimension_key)
  do update set score = excluded.score, updated_by = excluded.updated_by, updated_at = now();

  select public.compute_pbv(p_opportunity_id) into v_new_pbv;
  return v_new_pbv;
end;
$$;

revoke all on function public.record_pbv_evidence(uuid, text, numeric, text) from public;
grant execute on function public.record_pbv_evidence(uuid, text, numeric, text) to authenticated;

-- No direct client INSERT/UPDATE grants exist on pbv_evidence or pbv_scores (see 0005),
-- so record_pbv_evidence() is the only write path. Nothing further to revoke.
