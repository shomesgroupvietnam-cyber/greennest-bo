alter table public.executive_risk_records
  add column if not exists status_override text,
  add column if not exists status_override_reason text,
  add column if not exists status_override_by uuid references public.users(id),
  add column if not exists status_override_at timestamptz,
  add column if not exists status_override_source_status text,
  add column if not exists closed_reason text,
  add column if not exists closed_by uuid references public.users(id),
  add column if not exists closed_at timestamptz;

alter table public.executive_risk_records
  drop constraint if exists executive_risk_records_status_check;

alter table public.executive_risk_records
  add constraint executive_risk_records_status_check
    check (status in ('open', 'monitoring', 'in_progress', 'blocked', 'closed', 'resolved'));

alter table public.executive_risk_records
  drop constraint if exists executive_risk_records_status_override_check;

alter table public.executive_risk_records
  add constraint executive_risk_records_status_override_check
    check (
      status_override is null
      or status_override in ('green', 'yellow', 'red')
    );

alter table public.executive_risk_records
  drop constraint if exists executive_risk_records_status_override_source_check;

alter table public.executive_risk_records
  add constraint executive_risk_records_status_override_source_check
    check (
      status_override_source_status is null
      or status_override_source_status in ('green', 'yellow', 'red')
    );

alter table public.executive_risk_records
  drop constraint if exists executive_risk_records_status_override_audit_check;

alter table public.executive_risk_records
  add constraint executive_risk_records_status_override_audit_check
    check (
      (
        status_override is null
        and status_override_reason is null
        and status_override_by is null
        and status_override_at is null
      )
      or (
        status_override is not null
        and length(btrim(coalesce(status_override_reason, ''))) > 0
        and status_override_by is not null
        and status_override_at is not null
      )
    );

alter table public.executive_risk_records
  drop constraint if exists executive_risk_records_terminal_close_check;

alter table public.executive_risk_records
  add constraint executive_risk_records_terminal_close_check
    check (
      status not in ('closed', 'resolved')
      or (
        closed_at is not null
        and closed_by is not null
        and length(btrim(coalesce(closed_reason, ''))) > 0
      )
    );

create index if not exists idx_executive_risk_records_active
  on public.executive_risk_records(project_id, deadline, updated_at)
  where status not in ('closed', 'resolved');

create index if not exists idx_executive_risk_records_status_override
  on public.executive_risk_records(status_override)
  where status_override is not null;
