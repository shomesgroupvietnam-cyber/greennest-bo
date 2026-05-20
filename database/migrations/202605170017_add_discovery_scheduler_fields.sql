-- Discovery Scheduler / Queue Automation foundation.
-- Apply after 202605170016_create_knowledge_discovery_jobs.sql.

alter table public.knowledge_discovery_topics
  add column if not exists retry_count integer not null default 0,
  add column if not exists max_retries integer not null default 3,
  add column if not exists next_retry_at timestamptz,
  add column if not exists error_code text,
  add column if not exists error_message text,
  add column if not exists locked_at timestamptz,
  add column if not exists locked_by text;

alter table public.knowledge_discovery_topics
  drop constraint if exists knowledge_discovery_topics_error_code_check;

alter table public.knowledge_discovery_topics
  add constraint knowledge_discovery_topics_error_code_check
  check (error_code is null or error_code in ('missing_config', 'timeout', 'rate_limited', 'provider_error', 'invalid_response', 'unknown'));

alter table public.knowledge_discovery_run_logs
  add column if not exists retry_count integer,
  add column if not exists max_retries integer,
  add column if not exists next_retry_at timestamptz,
  add column if not exists error_code text;

alter table public.knowledge_discovery_run_logs
  drop constraint if exists knowledge_discovery_run_logs_error_code_check;

alter table public.knowledge_discovery_run_logs
  add constraint knowledge_discovery_run_logs_error_code_check
  check (error_code is null or error_code in ('missing_config', 'timeout', 'rate_limited', 'provider_error', 'invalid_response', 'unknown'));

create index if not exists idx_knowledge_discovery_topics_due
  on public.knowledge_discovery_topics(enabled, frequency, last_run_at, next_retry_at);

create index if not exists idx_knowledge_discovery_topics_lock
  on public.knowledge_discovery_topics(locked_at, locked_by);

comment on column public.knowledge_discovery_topics.locked_at is
  'Soft scheduler lock timestamp. Runners should treat stale locks as expired after the app-level lock timeout.';

comment on column public.knowledge_discovery_topics.next_retry_at is
  'Next eligible retry time after a failed scheduled discovery run.';
