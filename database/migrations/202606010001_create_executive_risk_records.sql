create table if not exists public.executive_risk_records (
  id uuid primary key default gen_random_uuid(),
  record_type text not null,
  title text not null,
  category_key text not null,
  level text not null,
  reason text not null,
  description text,
  organization_id text,
  project_id uuid references public.projects(id) on delete set null,
  axis_id text,
  workstream_id text,
  module_id text,
  owner_id uuid not null references public.users(id),
  owner_name text,
  deadline date not null,
  next_action text not null,
  status text not null default 'open',
  source_type text,
  source_id text,
  created_by uuid not null references public.users(id),
  updated_by uuid not null references public.users(id),
  on_behalf_of uuid references public.users(id),
  delegation_id uuid references public.leadership_delegations(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint executive_risk_records_type_check
    check (record_type in ('risk', 'blocker')),
  constraint executive_risk_records_level_check
    check (level in ('low', 'medium', 'high', 'critical')),
  constraint executive_risk_records_status_check
    check (status in ('open', 'monitoring', 'in_progress', 'blocked')),
  constraint executive_risk_records_required_text_check
    check (
      length(btrim(title)) > 0
      and length(btrim(reason)) > 0
      and length(btrim(next_action)) > 0
      and length(btrim(category_key)) > 0
    ),
  constraint executive_risk_records_scope_check
    check (
      project_id is not null
      or nullif(btrim(coalesce(module_id, '')), '') is not null
      or nullif(btrim(coalesce(organization_id, '')), '') is not null
    )
);

create index if not exists idx_executive_risk_records_project
  on public.executive_risk_records(project_id);

create index if not exists idx_executive_risk_records_status
  on public.executive_risk_records(status);

create index if not exists idx_executive_risk_records_level
  on public.executive_risk_records(level);

create index if not exists idx_executive_risk_records_category
  on public.executive_risk_records(category_key);

create index if not exists idx_executive_risk_records_deadline
  on public.executive_risk_records(deadline);

create index if not exists idx_executive_risk_records_owner
  on public.executive_risk_records(owner_id);

drop trigger if exists set_executive_risk_records_updated_at on public.executive_risk_records;
create trigger set_executive_risk_records_updated_at
  before update on public.executive_risk_records
  for each row execute function public.set_updated_at();

alter table public.executive_risk_records enable row level security;
