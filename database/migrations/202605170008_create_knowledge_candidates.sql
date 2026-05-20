-- Knowledge Candidate foundation for controlled promotion into governed Knowledge Center.
-- Apply after knowledge_items migration and role/permission seed updates.

create table if not exists public.knowledge_candidates (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (
    source_type in ('chat', 'ai_response', 'web_search', 'upload', 'meeting', 'report', 'document', 'manual')
  ),
  source_ref_id text,
  module text not null check (
    module in ('legal', 'design', 'construction', 'finance', 'documents', 'meetings', 'reports', 'project', 'general')
  ),
  title text not null,
  extracted_text text not null,
  submitted_by uuid not null references public.users(id) on delete restrict,
  status text not null default 'candidate' check (
    status in ('candidate', 'pending_review', 'approved', 'rejected', 'expired', 'superseded')
  ),
  promoted_knowledge_item_id uuid references public.knowledge_items(id) on delete set null,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_knowledge_candidates_module_status on public.knowledge_candidates(module, status);
create index if not exists idx_knowledge_candidates_source_type on public.knowledge_candidates(source_type);
create index if not exists idx_knowledge_candidates_submitted_by on public.knowledge_candidates(submitted_by);
create index if not exists idx_knowledge_candidates_promoted_item on public.knowledge_candidates(promoted_knowledge_item_id);

drop trigger if exists set_knowledge_candidates_updated_at on public.knowledge_candidates;
create trigger set_knowledge_candidates_updated_at before update on public.knowledge_candidates for each row execute function public.set_updated_at();
