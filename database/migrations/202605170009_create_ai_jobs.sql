-- AI Job Foundation: interactions, jobs, citations, and proposed actions.
-- The app still uses mock mode locally; these tables make Supabase mode ready.

create table if not exists public.ai_interactions (
  id uuid primary key,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  module text not null check (module in ('project', 'tasks', 'documents', 'legal', 'meetings', 'reports', 'design', 'construction', 'finance', 'general')),
  intent text not null,
  mode text not null check (mode in ('fast', 'queued')),
  prompt_summary text not null,
  response_text text,
  response_summary text,
  model_provider text not null default 'mock',
  model_name text not null default 'mock-greennest-ai',
  status text not null check (status in ('pending', 'queued', 'running', 'succeeded', 'failed', 'cancelled')),
  scope_snapshot jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_jobs (
  id uuid primary key,
  interaction_id uuid not null references public.ai_interactions(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  module text not null check (module in ('project', 'tasks', 'documents', 'legal', 'meetings', 'reports', 'design', 'construction', 'finance', 'general')),
  intent text not null,
  mode text not null check (mode in ('fast', 'queued')),
  priority text not null check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled', 'expired')),
  scope_snapshot jsonb not null default '{}'::jsonb,
  rate_limit_key text not null,
  payload jsonb not null default '{}'::jsonb,
  result_summary text,
  error_code text,
  error_message text,
  locked_by text,
  locked_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_citations (
  id uuid primary key,
  interaction_id uuid not null references public.ai_interactions(id) on delete cascade,
  job_id uuid references public.ai_jobs(id) on delete cascade,
  citation_type text not null check (citation_type in ('knowledge_chunk', 'knowledge_item', 'internal_record', 'external_candidate_review_only')),
  entity_type text,
  entity_id uuid,
  knowledge_item_id uuid references public.knowledge_items(id) on delete set null,
  knowledge_chunk_id uuid references public.knowledge_chunks(id) on delete set null,
  title text not null,
  source_url text,
  module text not null,
  project_id uuid references public.projects(id) on delete set null,
  access_level text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_action_proposals (
  id uuid primary key,
  interaction_id uuid not null references public.ai_interactions(id) on delete cascade,
  job_id uuid references public.ai_jobs(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  module text not null check (module in ('project', 'tasks', 'documents', 'legal', 'meetings', 'reports', 'design', 'construction', 'finance', 'general')),
  action_key text not null,
  target_entity_type text not null,
  target_entity_id uuid,
  proposed_payload jsonb not null default '{}'::jsonb,
  rationale text,
  required_permission text not null,
  status text not null default 'proposed' check (status in ('proposed', 'accepted', 'rejected', 'expired', 'executed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_interactions_requested_by on public.ai_interactions(requested_by);
create index if not exists idx_ai_interactions_project on public.ai_interactions(project_id);
create index if not exists idx_ai_jobs_interaction on public.ai_jobs(interaction_id);
create index if not exists idx_ai_jobs_requested_by_status on public.ai_jobs(requested_by, status);
create index if not exists idx_ai_citations_interaction on public.ai_citations(interaction_id);
create index if not exists idx_ai_action_proposals_interaction on public.ai_action_proposals(interaction_id);
create index if not exists idx_ai_action_proposals_status on public.ai_action_proposals(status);

drop trigger if exists set_ai_interactions_updated_at on public.ai_interactions;
create trigger set_ai_interactions_updated_at
before update on public.ai_interactions
for each row execute function public.set_updated_at();

drop trigger if exists set_ai_jobs_updated_at on public.ai_jobs;
create trigger set_ai_jobs_updated_at
before update on public.ai_jobs
for each row execute function public.set_updated_at();

drop trigger if exists set_ai_action_proposals_updated_at on public.ai_action_proposals;
create trigger set_ai_action_proposals_updated_at
before update on public.ai_action_proposals
for each row execute function public.set_updated_at();

