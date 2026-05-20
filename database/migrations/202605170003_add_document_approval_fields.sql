alter table public.documents
  add column if not exists approval_status text not null default 'not_submitted',
  add column if not exists reviewer_id uuid references public.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists approval_notes text;

create index if not exists idx_documents_approval_status on public.documents(approval_status);
create index if not exists idx_documents_reviewer on public.documents(reviewer_id);

update public.documents
set approval_status = case
  when status = 'complete' then 'approved'
  when status = 'in_review' then 'pending'
  when status = 'needs_update' then 'rejected'
  else approval_status
end
where approval_status = 'not_submitted';
