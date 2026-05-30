-- Atomic catalog writes for roles and role-permission mappings.

create or replace function public.is_business_approval_permission(permission_key text)
returns boolean
language sql
immutable
as $$
  select permission_key = any(array[
    'document.approve',
    'legal.approve',
    'decision.approve',
    'knowledge.approve',
    'design.approve_change',
    'acceptance.approve',
    'finance.approve',
    'payment.approve',
    'proposal.approve',
    'proposal.reject',
    'proposal.request_change',
    'investment.approve',
    'contract.approve',
    'hr.approve',
    'qa.approve',
    'safety.approve'
  ])
$$;

create or replace function public.upsert_role_template_with_permissions(
  target_key text,
  target_label_vi text,
  target_description text,
  target_scope text,
  target_is_active boolean,
  target_permission_keys text[]
)
returns table (
  id uuid,
  key text,
  label_vi text,
  description text,
  scope text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  role_uuid uuid;
  missing_permission text;
  actor_role text;
  normalized_permission_keys text[] := coalesce(target_permission_keys, array[]::text[]);
begin
  if not public.current_user_has_internal_permission('settings.manage') then
    raise exception 'missing settings.manage' using errcode = '42501';
  end if;

  actor_role := public.current_app_role();

  if target_key = 'admin' and exists (
    select 1
    from unnest(normalized_permission_keys) permission_key
    where public.is_business_approval_permission(permission_key)
  ) then
    raise exception 'admin cannot receive business approval permissions' using errcode = '42501';
  end if;

  if actor_role <> 'super_admin' and exists (
    select 1
    from unnest(normalized_permission_keys) permission_key
    where public.is_business_approval_permission(permission_key)
  ) then
    raise exception 'only super_admin can assign business approval permissions' using errcode = '42501';
  end if;

  select permission_key into missing_permission
  from unnest(normalized_permission_keys) permission_key
  where not exists (
    select 1
    from public.permissions
    where permissions.key = permission_key
  )
  limit 1;

  if missing_permission is not null then
    raise exception 'permission does not exist: %', missing_permission using errcode = '23503';
  end if;

  insert into public.roles (key, label_vi, description, scope, is_active)
  values (target_key, target_label_vi, target_description, target_scope, target_is_active)
  on conflict (key) do update
  set label_vi = excluded.label_vi,
      description = excluded.description,
      scope = excluded.scope,
      is_active = excluded.is_active,
      updated_at = now()
  returning roles.id into role_uuid;

  if actor_role <> 'super_admin' and exists (
    select 1
    from public.role_permissions rp
    join public.permissions p on p.id = rp.permission_id
    where rp.role_id = role_uuid
      and public.is_business_approval_permission(p.key)
  ) then
    raise exception 'only super_admin can change business approval mappings' using errcode = '42501';
  end if;

  delete from public.role_permissions
  where role_id = role_uuid;

  insert into public.role_permissions (role_id, permission_id)
  select role_uuid, permissions.id
  from public.permissions
  where permissions.key = any(normalized_permission_keys)
  on conflict (role_id, permission_id) do nothing;

  return query
  select r.id, r.key, r.label_vi, r.description, r.scope, r.is_active, r.created_at, r.updated_at
  from public.roles r
  where r.id = role_uuid;
end;
$$;

grant execute on function public.upsert_role_template_with_permissions(text, text, text, text, boolean, text[]) to authenticated;
