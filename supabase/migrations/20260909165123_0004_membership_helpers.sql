-- Membership check. SECURITY DEFINER to break RLS recursion on organization_members,
-- but tightly scoped: STABLE, fixed search_path, uses auth.uid() only (never a client-supplied actor id).
create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql
security definer
stable
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
  );
$$;

revoke all on function public.is_org_member(uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;

-- Role lookup, same hardening rationale as is_org_member.
create or replace function public.get_org_role(p_organization_id uuid)
returns public.org_role
language sql
security definer
stable
set search_path = pg_catalog, public
as $$
  select m.role
  from public.organization_members m
  where m.organization_id = p_organization_id
    and m.user_id = auth.uid();
$$;

revoke all on function public.get_org_role(uuid) from public;
grant execute on function public.get_org_role(uuid) to authenticated;

-- Derive an opportunity's organization_id server-side (never trust a client-supplied org id).
create or replace function public.org_id_for_opportunity(p_opportunity_id uuid)
returns uuid
language sql
security definer
stable
set search_path = pg_catalog, public
as $$
  select o.organization_id
  from public.opportunities o
  where o.id = p_opportunity_id;
$$;

revoke all on function public.org_id_for_opportunity(uuid) from public;
grant execute on function public.org_id_for_opportunity(uuid) to authenticated;

-- Is the calling user OWNER/ADMIN of the org that owns this opportunity?
create or replace function public.is_org_admin_for_opportunity(p_opportunity_id uuid)
returns boolean
language sql
security definer
stable
set search_path = pg_catalog, public
as $$
  select coalesce(
    public.get_org_role(public.org_id_for_opportunity(p_opportunity_id)) in ('OWNER','ADMIN'),
    false
  );
$$;

revoke all on function public.is_org_admin_for_opportunity(uuid) from public;
grant execute on function public.is_org_admin_for_opportunity(uuid) to authenticated;
