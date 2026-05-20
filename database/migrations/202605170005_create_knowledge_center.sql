-- Knowledge Center foundation for governed source intake and future RAG.
-- Apply after MVP core schema and role/permission seed updates.

create table if not exists public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_url text,
  source_file_id text,
  source_type text not null check (
    source_type in ('law', 'standard', 'template', 'policy', 'contract', 'technical_guideline', 'market', 'internal_note')
  ),
  module text not null check (
    module in ('legal', 'design', 'construction', 'finance', 'documents', 'meetings', 'reports', 'project', 'general')
  ),
  jurisdiction text,
  effective_date date,
  expiry_date date,
  status text not null check (
    status in ('discovered', 'imported', 'pending_review', 'approved', 'rejected', 'expired', 'superseded')
  ),
  confidence text not null check (
    confidence in ('official', 'internal_approved', 'external_reference', 'unknown')
  ),
  tags text[] not null default '{}',
  summary text,
  notes text,
  reviewed_by uuid references public.users(id) on delete set null,
  approved_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  approved_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  is_rag_eligible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint knowledge_items_rag_only_when_approved check (is_rag_eligible = false or status = 'approved'),
  constraint knowledge_items_effective_before_expiry check (expiry_date is null or effective_date is null or expiry_date >= effective_date)
);

create index if not exists idx_knowledge_items_module_status on public.knowledge_items(module, status);
create index if not exists idx_knowledge_items_source_type on public.knowledge_items(source_type);
create index if not exists idx_knowledge_items_confidence on public.knowledge_items(confidence);
create index if not exists idx_knowledge_items_rag_eligible on public.knowledge_items(is_rag_eligible);
create index if not exists idx_knowledge_items_tags on public.knowledge_items using gin(tags);

drop trigger if exists set_knowledge_items_updated_at on public.knowledge_items;
create trigger set_knowledge_items_updated_at before update on public.knowledge_items for each row execute function public.set_updated_at();
