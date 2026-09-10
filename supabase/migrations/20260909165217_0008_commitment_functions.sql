-- Only VERIFIED commitments of qualifying types count toward BUILD.
create or replace function public.count_qualified_commitments(p_opportunity_id uuid)
returns int
language sql
stable
set search_path = pg_catalog, public
as $$
  select count(*)::int
  from public.commitments c
  where c.opportunity_id = p_opportunity_id
    and c.type in ('LOI','PAID_PILOT','PREORDER','CUSTOMER')
    and c.verification_status = 'VERIFIED';
$$;

-- Verification is an ADMIN/OWNER-only action. A MEMBER cannot self-verify.
-- Cross-org verification is impossible because org membership is derived from
-- the commitment's opportunity, never from client input.
create or replace function public.verify_commitment(
  p_commitment_id uuid,
  p_status public.verification_status
)
returns public.verification_status
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_opportunity_id uuid;
  v_org_id uuid;
  v_role public.org_role;
begin
  select opportunity_id into v_opportunity_id
  from public.commitments
  where id = p_commitment_id;

  if v_opportunity_id is null then
    raise exception 'commitment not found' using errcode = 'P0002';
  end if;

  v_org_id := public.org_id_for_opportunity(v_opportunity_id);
  v_role := public.get_org_role(v_org_id);

  if v_role is null then
    raise exception 'not authorized: not a member of this organization' using errcode = '42501';
  end if;
  if v_role not in ('OWNER','ADMIN') then
    raise exception 'not authorized: role % cannot verify commitments', v_role using errcode = '42501';
  end if;

  update public.commitments
  set verification_status = p_status,
      verified_at = now(),
      verified_by = auth.uid()
  where id = p_commitment_id;

  return p_status;
end;
$$;

revoke all on function public.verify_commitment(uuid, public.verification_status) from public;
grant execute on function public.verify_commitment(uuid, public.verification_status) to authenticated;
