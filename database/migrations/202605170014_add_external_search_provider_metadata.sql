-- Real MCP/Web Search Provider Integration.
-- Search results remain discovery-only candidates; provider metadata is logged for audit.

alter table public.external_search_logs
  add column if not exists provider_metadata jsonb;

comment on column public.external_search_logs.provider_metadata is
  'Provider diagnostic metadata such as provider key, max results and timeout. Search result content is not stored here.';
