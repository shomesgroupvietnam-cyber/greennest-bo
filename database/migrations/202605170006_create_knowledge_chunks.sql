-- Knowledge Center RAG indexing foundation.
-- Vector-ready fields are stored as JSONB until pgvector is enabled in a later migration.

create table if not exists public.knowledge_chunks (
  id text primary key,
  knowledge_item_id uuid not null references public.knowledge_items(id) on delete cascade,
  module text not null,
  chunk_text text not null,
  chunk_order integer not null default 0,
  source_type text not null,
  status text not null default 'approved',
  effective_date date,
  expires_at date,
  access_level text not null default 'internal',
  citation jsonb not null default '{}'::jsonb,
  embedding jsonb,
  embedding_model text,
  embedded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint knowledge_chunks_module_check check (module in ('legal', 'design', 'construction', 'finance', 'documents', 'meetings', 'reports', 'project', 'general')),
  constraint knowledge_chunks_source_type_check check (source_type in ('law', 'standard', 'template', 'policy', 'contract', 'technical_guideline', 'market', 'internal_note')),
  constraint knowledge_chunks_status_check check (status in ('discovered', 'imported', 'pending_review', 'approved', 'rejected', 'expired', 'superseded')),
  constraint knowledge_chunks_access_level_check check (access_level in ('internal', 'external_limited', 'public_read')),
  constraint knowledge_chunks_expiry_check check (expires_at is null or effective_date is null or expires_at >= effective_date),
  constraint knowledge_chunks_unique_order unique (knowledge_item_id, chunk_order)
);

create index if not exists idx_knowledge_chunks_item_order on public.knowledge_chunks(knowledge_item_id, chunk_order);
create index if not exists idx_knowledge_chunks_module_status on public.knowledge_chunks(module, status);
create index if not exists idx_knowledge_chunks_access_level on public.knowledge_chunks(access_level);
create index if not exists idx_knowledge_chunks_source_type on public.knowledge_chunks(source_type);
create index if not exists idx_knowledge_chunks_embedding_model on public.knowledge_chunks(embedding_model);
create index if not exists idx_knowledge_chunks_citation on public.knowledge_chunks using gin(citation);

drop trigger if exists set_knowledge_chunks_updated_at on public.knowledge_chunks;
create trigger set_knowledge_chunks_updated_at before update on public.knowledge_chunks for each row execute function public.set_updated_at();

comment on column public.knowledge_chunks.embedding is
  'Vector-ready embedding placeholder stored as JSONB. Replace with pgvector vector(n) after selecting embedding model/dimension.';
comment on column public.knowledge_chunks.embedding_model is
  'Embedding model identifier used when embedding was produced.';
comment on column public.knowledge_chunks.embedded_at is
  'Timestamp when embedding was produced.';

-- Future pgvector production migration shape:
-- create extension if not exists vector;
-- alter table public.knowledge_chunks add column embedding_vector vector(1536);
-- create index idx_knowledge_chunks_embedding_vector
--   on public.knowledge_chunks using ivfflat (embedding_vector vector_cosine_ops);
