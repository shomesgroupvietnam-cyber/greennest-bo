alter table public.documents
  add column if not exists classification text not null default 'INTERNAL'
  check (classification in ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'));

create index if not exists idx_documents_classification
  on public.documents(classification);

update public.documents
set classification = 'INTERNAL'
where classification is null;
