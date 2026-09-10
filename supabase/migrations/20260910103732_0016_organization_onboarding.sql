-- Onboarding: the only sanctioned way for a user to create an organization and become
-- its first member. Same pattern as everywhere else in this system: no client-supplied
-- actor id, SECURITY DEFINER only to do what RLS otherwise correctly forbids, and the
-- creator is unconditionally auth.uid() -- never trusted from the request body.
create or replace function public.create_organization(p_name text)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_org_id uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'organization name is required' using errcode = '22023';
  end if;

  insert into public.organizations (name) values (btrim(p_name))
  returning id into v_org_id;

  -- Creator becomes OWNER. This is the only place OWNER is ever assigned other than
  -- an existing OWNER/ADMIN inviting someone (see invite_organization_member below).
  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, v_uid, 'OWNER');

  return v_org_id;
end;
$$;

revoke all on function public.create_organization(text) from public, anon;
grant execute on function public.create_organization(text) to authenticated;

-- Invitation: lets an existing OWNER/ADMIN add another already-registered user to their
-- org. This is a minimal, functional v1 -- it takes a user_id, not an email, because
-- there is no email-invite/lookup infrastructure (e.g. a Resend flow) in scope yet.
-- That gap is called out explicitly in the engineering report, not silently patched over.
create or replace function public.invite_organization_member(
  p_organization_id uuid,
  p_user_id uuid,
  p_role public.org_role default 'MEMBER'
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_role public.org_role;
begin
  v_role := public.get_org_role(p_organization_id);
  if v_role is null then
    raise exception 'not authorized: not a member of this organization' using errcode = '42501';
  end if;
  if v_role not in ('OWNER','ADMIN') then
    raise exception 'not authorized: role % cannot invite members', v_role using errcode = '42501';
  end if;

  if p_role = 'OWNER' and v_role <> 'OWNER' then
    raise exception 'not authorized: only an OWNER can grant OWNER role' using errcode = '42501';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (p_organization_id, p_user_id, p_role)
  on conflict (organization_id, user_id) do update set role = excluded.role;
end;
$$;

revoke all on function public.invite_organization_member(uuid, uuid, public.org_role) from public, anon;
grant execute on function public.invite_organization_member(uuid, uuid, public.org_role) to authenticated;
;
