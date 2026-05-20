-- External source discovery logs for Knowledge Center intake.
-- Search results are discovery candidates only; they are not authoritative RAG sources.

create table if not exists public.external_search_logs (
  id text primary key,
  user_id uuid references public.users(id) on delete set null,
  query text not null,
  provider text not null,
  result_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_external_search_logs_user on public.external_search_logs(user_id, created_at desc);
create index if not exists idx_external_search_logs_provider on public.external_search_logs(provider, created_at desc);
