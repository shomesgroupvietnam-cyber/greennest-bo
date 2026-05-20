-- Reporting Lite snapshot storage.
-- Apply after the MVP core schema and document/meeting migrations.

create table if not exists public.report_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  report_type text not null check (
    report_type in ('weekly_project_summary', 'document_readiness_report', 'legal_status_report')
  ),
  title text not null,
  generated_by uuid references public.users(id) on delete set null,
  generated_at timestamptz not null default now(),
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_report_runs_project on public.report_runs(project_id);
create index if not exists idx_report_runs_type_generated_at on public.report_runs(report_type, generated_at desc);
