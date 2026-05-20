-- Scheduled Web Discovery Jobs foundation.
-- These tables support manual Run Now first; no cron infrastructure is created here.

create table if not exists public.knowledge_discovery_topics (
  id text primary key,
  module text not null check (module in ('legal', 'design', 'construction', 'finance', 'documents', 'meetings', 'reports', 'project', 'general')),
  query text not null,
  enabled boolean not null default true,
  frequency text not null default 'manual' check (frequency in ('manual', 'daily', 'weekly')),
  owner_id uuid references public.users(id) on delete set null,
  reviewer_id uuid references public.users(id) on delete set null,
  last_run_at timestamptz,
  last_run_status text not null default 'never_run' check (last_run_status in ('never_run', 'succeeded', 'partial', 'failed')),
  retry_count integer not null default 0,
  max_retries integer not null default 3,
  next_retry_at timestamptz,
  error_code text check (error_code in ('missing_config', 'timeout', 'rate_limited', 'provider_error', 'invalid_response', 'unknown')),
  error_message text,
  locked_at timestamptz,
  locked_by text,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_discovery_run_logs (
  id text primary key,
  topic_id text not null references public.knowledge_discovery_topics(id) on delete cascade,
  run_by uuid references public.users(id) on delete set null,
  query text not null,
  provider text not null,
  provider_metadata jsonb,
  status text not null check (status in ('succeeded', 'partial', 'failed')),
  result_count integer not null default 0,
  imported_count integer not null default 0,
  skipped_duplicate_count integer not null default 0,
  skipped_disallowed_count integer not null default 0,
  retry_count integer,
  max_retries integer,
  next_retry_at timestamptz,
  error_code text check (error_code in ('missing_config', 'timeout', 'rate_limited', 'provider_error', 'invalid_response', 'unknown')),
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz not null default now()
);

create index if not exists idx_knowledge_discovery_topics_enabled on public.knowledge_discovery_topics(enabled);
create index if not exists idx_knowledge_discovery_topics_module on public.knowledge_discovery_topics(module);
create index if not exists idx_knowledge_discovery_topics_due on public.knowledge_discovery_topics(enabled, frequency, last_run_at, next_retry_at);
create index if not exists idx_knowledge_discovery_topics_lock on public.knowledge_discovery_topics(locked_at, locked_by);
create index if not exists idx_knowledge_discovery_run_logs_topic on public.knowledge_discovery_run_logs(topic_id, started_at desc);
create index if not exists idx_knowledge_discovery_run_logs_status on public.knowledge_discovery_run_logs(status, started_at desc);

drop trigger if exists set_knowledge_discovery_topics_updated_at on public.knowledge_discovery_topics;
create trigger set_knowledge_discovery_topics_updated_at
before update on public.knowledge_discovery_topics
for each row execute function public.set_updated_at();

comment on table public.knowledge_discovery_topics is
  'Manual-first web discovery topic configuration. Scheduler runners can select enabled daily/weekly due topics.';

comment on table public.knowledge_discovery_run_logs is
  'Run Now and scheduler audit records for web discovery, including imported, skipped and retry metadata.';
