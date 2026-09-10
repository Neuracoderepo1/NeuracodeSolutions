-- Prevent ADMIN actors from changing an existing OWNER's role.
-- OWNER remains the only role authorized to modify OWNER membership.
-- This closes a privilege-escalation / governance-downgrade path in
-- invite_organization_member(), which uses an upsert for existing members.
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
  v_actor_role public.org_role;
  v_target_role public.org_role;
begin
  v_actor_role := public.get_org_role(p_organization_id);

  if v_actor_role is null then
    raise exception 'not authorized: not a member of this organization'
      using errcode = '42501';
  end if;

  if v_actor_role not in ('OWNER','ADMIN') then
    raise exception 'not authorized: role % cannot invite members', v_actor_role
      using errcode = '42501';
  end if;

  select role into v_target_role
  from public.organization_members
  where organization_id = p_organization_id
    and user_id = p_user_id;

  -- An ADMIN may manage members, but cannot change an OWNER's role.
  if v_target_role = 'OWNER' and v_actor_role <> 'OWNER' then
    raise exception 'not authorized: only an OWNER can modify an OWNER membership'
      using errcode = '42501';
  end if;

  -- Only an OWNER may grant OWNER.
  if p_role = 'OWNER' and v_actor_role <> 'OWNER' then
    raise exception 'not authorized: only an OWNER can grant OWNER role'
      using errcode = '42501';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (p_organization_id, p_user_id, p_role)
  on conflict (organization_id, user_id)
  do update set role = excluded.role;
end;
$$;

revoke all on function public.invite_organization_member(uuid, uuid, public.org_role) from public;
grant execute on function public.invite_organization_member(uuid, uuid, public.org_role) to authenticated;;
