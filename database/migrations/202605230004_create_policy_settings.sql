-- Policy settings for approval thresholds and configurable risk groups.

create table if not exists public.approval_threshold_policies (
  id text primary key default gen_random_uuid()::text,
  policy_key text not null unique check (policy_key ~ '^[a-z][a-z0-9_]*$'),
  label_vi text not null,
  target_type text not null check (target_type in ('proposal', 'finance', 'investment', 'contract', 'general')),
  amount_min numeric(18, 2) not null default 0 check (amount_min >= 0),
  amount_max numeric(18, 2) check (amount_max is null or amount_max >= 0),
  currency text not null default 'VND' check (currency = 'VND'),
  approval_level text not null check (approval_level in ('DEPARTMENT_HEAD', 'PROJECT_DIRECTOR', 'CEO', 'CHAIRMAN')),
  approver_role_key text not null references public.roles(key),
  required_permission_key text not null references public.permissions(key),
  escalate_on_risk_levels text[] not null default array[]::text[],
  organization_id text,
  project_id text,
  axis_id text,
  workstream_id text,
  module_id text,
  record_id text,
  is_active boolean not null default true,
  priority integer not null default 100 check (priority >= 0),
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint approval_threshold_amount_range check (
    amount_max is null
    or amount_min <= amount_max
  ),
  constraint approval_threshold_valid_risk_levels check (
    escalate_on_risk_levels <@ array['high', 'critical']::text[]
  )
);

create or replace function public.validate_approval_threshold_policy_role_permission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.roles r
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p on p.id = rp.permission_id
    where r.key = new.approver_role_key
      and p.key = new.required_permission_key
      and r.is_active = true
  ) then
    raise exception 'approval policy approver role % does not have required permission %',
      new.approver_role_key,
      new.required_permission_key
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create index if not exists idx_approval_threshold_policies_active_target
  on public.approval_threshold_policies (is_active, target_type, priority);

create index if not exists idx_approval_threshold_policies_scope_lookup
  on public.approval_threshold_policies (
    target_type,
    organization_id,
    project_id,
    axis_id,
    workstream_id,
    module_id,
    record_id,
    is_active
  );

create table if not exists public.risk_group_configs (
  id text primary key default gen_random_uuid()::text,
  risk_key text not null unique check (risk_key ~ '^[a-z][a-z0-9_]*$'),
  label_vi text not null,
  description text,
  default_severity text not null check (default_severity in ('low', 'medium', 'high', 'critical')),
  module_id text,
  sort_order integer not null default 100 check (sort_order >= 0),
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_risk_group_configs_active_sort
  on public.risk_group_configs (is_active, sort_order);

create index if not exists idx_risk_group_configs_module_active
  on public.risk_group_configs (module_id, is_active);

drop trigger if exists validate_approval_threshold_policy_role_permission on public.approval_threshold_policies;
create trigger validate_approval_threshold_policy_role_permission
before insert or update of approver_role_key, required_permission_key on public.approval_threshold_policies
for each row execute function public.validate_approval_threshold_policy_role_permission();

drop trigger if exists set_approval_threshold_policies_updated_at on public.approval_threshold_policies;
create trigger set_approval_threshold_policies_updated_at
before update on public.approval_threshold_policies
for each row execute function public.set_updated_at();

drop trigger if exists set_risk_group_configs_updated_at on public.risk_group_configs;
create trigger set_risk_group_configs_updated_at
before update on public.risk_group_configs
for each row execute function public.set_updated_at();

alter table public.approval_threshold_policies enable row level security;
alter table public.risk_group_configs enable row level security;

drop policy if exists "approval policies readable by settings managers" on public.approval_threshold_policies;
drop policy if exists "approval policies readable by authenticated users" on public.approval_threshold_policies;
create policy "approval policies readable by authenticated users" on public.approval_threshold_policies
  for select to authenticated
  using (
    is_active = true
    or public.current_user_has_internal_permission('settings.manage')
    or public.current_user_has_scope_assignment_permission('settings.manage')
  );

drop policy if exists "approval policies insertable by settings managers" on public.approval_threshold_policies;
create policy "approval policies insertable by settings managers" on public.approval_threshold_policies
  for insert to authenticated
  with check (
    public.current_user_has_internal_permission('settings.manage')
    or public.current_user_has_scope_assignment_permission('settings.manage')
  );

drop policy if exists "approval policies updatable by settings managers" on public.approval_threshold_policies;
create policy "approval policies updatable by settings managers" on public.approval_threshold_policies
  for update to authenticated
  using (
    public.current_user_has_internal_permission('settings.manage')
    or public.current_user_has_scope_assignment_permission('settings.manage')
  )
  with check (
    public.current_user_has_internal_permission('settings.manage')
    or public.current_user_has_scope_assignment_permission('settings.manage')
  );

drop policy if exists "risk groups readable by settings managers" on public.risk_group_configs;
drop policy if exists "risk groups readable by authenticated users" on public.risk_group_configs;
create policy "risk groups readable by authenticated users" on public.risk_group_configs
  for select to authenticated
  using (
    is_active = true
    or public.current_user_has_internal_permission('settings.manage')
    or public.current_user_has_scope_assignment_permission('settings.manage')
  );

drop policy if exists "risk groups insertable by settings managers" on public.risk_group_configs;
create policy "risk groups insertable by settings managers" on public.risk_group_configs
  for insert to authenticated
  with check (
    public.current_user_has_internal_permission('settings.manage')
    or public.current_user_has_scope_assignment_permission('settings.manage')
  );

drop policy if exists "risk groups updatable by settings managers" on public.risk_group_configs;
create policy "risk groups updatable by settings managers" on public.risk_group_configs
  for update to authenticated
  using (
    public.current_user_has_internal_permission('settings.manage')
    or public.current_user_has_scope_assignment_permission('settings.manage')
  )
  with check (
    public.current_user_has_internal_permission('settings.manage')
    or public.current_user_has_scope_assignment_permission('settings.manage')
  );

insert into public.approval_threshold_policies (
  id,
  policy_key,
  label_vi,
  target_type,
  amount_min,
  amount_max,
  currency,
  approval_level,
  approver_role_key,
  required_permission_key,
  escalate_on_risk_levels,
  is_active,
  priority
)
select
  seed.id,
  seed.policy_key,
  seed.label_vi,
  seed.target_type,
  seed.amount_min,
  seed.amount_max,
  seed.currency,
  seed.approval_level,
  seed.approver_role_key,
  seed.required_permission_key,
  seed.escalate_on_risk_levels,
  seed.is_active,
  seed.priority
from (
  values
    ('policy-approval-under-20m', 'approval_under_20m', 'Duoi 20 trieu', 'general', 0::numeric(18, 2), 19999999.99::numeric(18, 2), 'VND', 'DEPARTMENT_HEAD', 'dau_tu_phat_trien', 'proposal.review', array['high', 'critical']::text[], true, 100),
    ('policy-approval-20m-200m', 'approval_20m_200m', '20 trieu den 200 trieu', 'general', 20000000::numeric(18, 2), 199999999.99::numeric(18, 2), 'VND', 'PROJECT_DIRECTOR', 'quan_ly_tai_chinh', 'proposal.approve', array['high', 'critical']::text[], true, 110),
    ('policy-approval-200m-2b', 'approval_200m_2b', '200 trieu den 2 ty', 'general', 200000000::numeric(18, 2), 1999999999.99::numeric(18, 2), 'VND', 'CEO', 'tong_giam_doc', 'proposal.approve', array['critical']::text[], true, 120),
    ('policy-approval-over-2b', 'approval_over_2b', 'Tren 2 ty hoac quyet dinh chien luoc', 'general', 2000000000::numeric(18, 2), null::numeric(18, 2), 'VND', 'CHAIRMAN', 'super_admin', 'proposal.approve', array['high', 'critical']::text[], true, 130)
) as seed(
  id,
  policy_key,
  label_vi,
  target_type,
  amount_min,
  amount_max,
  currency,
  approval_level,
  approver_role_key,
  required_permission_key,
  escalate_on_risk_levels,
  is_active,
  priority
)
where exists (
  select 1
  from public.roles r
  join public.role_permissions rp on rp.role_id = r.id
  join public.permissions p on p.id = rp.permission_id
  where r.key = seed.approver_role_key
    and p.key = seed.required_permission_key
    and r.is_active = true
)
on conflict (policy_key) do nothing;

insert into public.risk_group_configs (
  id,
  risk_key,
  label_vi,
  description,
  default_severity,
  module_id,
  sort_order,
  is_default,
  is_active
) values
  ('risk-group-legal', 'legal', 'Phap ly', 'Rui ro phap ly, ho so dat, chap thuan va tranh chap.', 'high', 'legal', 10, true, true),
  ('risk-group-planning-technical', 'planning_technical', 'Quy hoach / ky thuat', 'Rui ro quy hoach, thiet ke, ky thuat va dieu kien trien khai.', 'medium', 'project', 20, true, true),
  ('risk-group-approval', 'approval', 'Approval', 'Rui ro cham hoac vuot nguong phe duyet.', 'medium', 'proposal', 30, true, true),
  ('risk-group-schedule', 'schedule', 'Tien do', 'Rui ro cham moc cong viec, ho so hoac thi cong.', 'medium', 'task', 40, true, true),
  ('risk-group-finance', 'finance', 'Tai chinh', 'Rui ro dong tien, ngan sach, thanh toan hoac vuot chi phi.', 'high', 'finance', 50, true, true),
  ('risk-group-missing-document', 'missing_document', 'Ho so thieu', 'Rui ro thieu ho so, tai lieu hoac bang chung bat buoc.', 'medium', 'document', 60, true, true),
  ('risk-group-system-permission', 'system_permission', 'He thong / phan quyen', 'Rui ro cau hinh he thong, phan quyen hoac audit.', 'medium', 'settings', 70, true, true),
  ('risk-group-operation', 'operation', 'Van hanh / phoi hop', 'Rui ro phoi hop, nguoi phu trach, quy trinh va handoff.', 'low', 'project', 80, true, true)
on conflict (risk_key) do nothing;
