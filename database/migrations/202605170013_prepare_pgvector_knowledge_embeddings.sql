-- Real Embeddings + pgvector foundation.
-- This migration enables pgvector where available and documents the production column/index shape.
-- The app keeps the existing JSONB `embedding` column as a portable fallback for mock/local mode.

create extension if not exists vector;

comment on column public.knowledge_chunks.embedding is
  'Portable embedding fallback stored as JSONB for mock/local mode. Production semantic retrieval should migrate to pgvector once dimension is fixed.';

comment on column public.knowledge_chunks.embedding_model is
  'Embedding model identifier, for example text-embedding-3-small.';

comment on column public.knowledge_chunks.embedded_at is
  'Timestamp when the chunk embedding was generated.';

-- Production pgvector apply notes:
-- 1. Choose one fixed dimension from AI_EMBEDDING_DIMENSIONS for the deployed model.
-- 2. Add a vector column with that dimension. Example for text-embedding-3-small:
--      alter table public.knowledge_chunks add column if not exists embedding_vector vector(1536);
-- 3. Backfill embedding_vector from the application embedding generation job.
-- 4. Create an ANN index after enough rows exist:
--      create index if not exists idx_knowledge_chunks_embedding_vector
--        on public.knowledge_chunks using ivfflat (embedding_vector vector_cosine_ops)
--        with (lists = 100);
-- 5. Keep metadata filters (module/status/access/source/effective/expiry) before vector ranking.
