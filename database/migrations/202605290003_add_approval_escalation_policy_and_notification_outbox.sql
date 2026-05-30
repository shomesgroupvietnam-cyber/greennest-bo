-- Story 3.5: configurable approval escalation and mock notification outbox.

alter table if exists public.approval_threshold_policies
  add column if not exists escalate_after_days integer not null default 3;

alter table if exists public.approval_threshold_policies
  drop constraint if exists approval_threshold_escalate_after_days_check;

alter table if exists public.approval_threshold_policies
  add constraint approval_threshold_escalate_after_days_check
  check (escalate_after_days between 1 and 30);

create table if not exists public.notification_outbox (
  id text primary key,
  dedupe_key text not null unique,
  channel text not null default 'mock' check (channel in ('mock')),
  source_type text not null check (
    source_type in ('proposal', 'leadership_approval', 'executive_action')
  ),
  source_id text not null,
  title text not null,
  reason text not null,
  next_action text not null,
  severity text not null check (severity in ('overdue', 'critical')),
  trigger text not null check (
    trigger in ('long_overdue', 'risk_policy', 'critical_overdue')
  ),
  status text not null default 'queued' check (
    status in ('queued', 'updated', 'acknowledged')
  ),
  policy_id text references public.approval_threshold_policies(id) on delete set null,
  policy_label text,
  recipients jsonb not null default '[]'::jsonb,
  organization_id text,
  project_id text,
  axis_id text,
  workstream_id text,
  module_id text,
  record_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_outbox
  add column if not exists organization_id text,
  add column if not exists project_id text,
  add column if not exists axis_id text,
  add column if not exists workstream_id text,
  add column if not exists module_id text,
  add column if not exists record_id text;

create index if not exists idx_notification_outbox_source
  on public.notification_outbox (source_type, source_id, status);

create index if not exists idx_notification_outbox_scope
  on public.notification_outbox (project_id, module_id, record_id, status);

create index if not exists idx_notification_outbox_updated_at
  on public.notification_outbox (updated_at desc);

drop trigger if exists set_notification_outbox_updated_at on public.notification_outbox;
create trigger set_notification_outbox_updated_at
before update on public.notification_outbox
for each row execute function public.set_updated_at();

alter table public.notification_outbox enable row level security;

create or replace function public.current_user_can_access_notification_outbox_item(
  item_source_type text,
  item_source_id text,
  item_project_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when item_source_type = 'proposal' then exists (
      select 1
      from public.proposals p
      where p.id = item_source_id
        and public.current_user_has_permission('proposal.view')
        and (p.project_id is null or public.current_user_can_read_project(p.project_id))
    )
    when item_project_id is not null then
      public.current_user_has_permission('proposal.view')
      and exists (
        select 1
        from public.projects project
        where project.id::text = item_project_id
          and public.current_user_can_read_project(project.id)
      )
    else
      public.current_user_has_internal_permission('proposal.view')
      or public.current_user_has_internal_permission('proposal.approve')
  end
$$;

drop policy if exists "notification outbox readable by approval viewers" on public.notification_outbox;
create policy "notification outbox readable by approval viewers" on public.notification_outbox
  for select to authenticated
  using (public.current_user_can_access_notification_outbox_item(source_type, source_id, project_id));

drop policy if exists "notification outbox insertable by approval viewers" on public.notification_outbox;
create policy "notification outbox insertable by approval viewers" on public.notification_outbox
  for insert to authenticated
  with check (public.current_user_can_access_notification_outbox_item(source_type, source_id, project_id));

drop policy if exists "notification outbox updatable by approval viewers" on public.notification_outbox;
create policy "notification outbox updatable by approval viewers" on public.notification_outbox
  for update to authenticated
  using (public.current_user_can_access_notification_outbox_item(source_type, source_id, project_id))
  with check (public.current_user_can_access_notification_outbox_item(source_type, source_id, project_id));
