-- Proposal approval attachments are metadata-only in MVP.
-- Binary storage/upload is intentionally outside this migration.

alter table if exists public.proposal_decisions
  add column if not exists attachment_ids text[] not null default array[]::text[];

create table if not exists public.proposal_attachments (
  id text primary key,
  proposal_id text not null references public.proposals(id) on delete cascade,
  name text not null,
  url text,
  external_url text,
  document_id uuid references public.documents(id) on delete restrict,
  source text not null check (source in ('document', 'external_url')),
  uploaded_by uuid references public.users(id) on delete set null,
  uploaded_at timestamptz,
  created_at timestamptz not null default now(),
  constraint proposal_attachments_name_check
    check (length(btrim(name)) > 0),
  constraint proposal_attachments_reference_by_source_check
    check (
      (
        source = 'document'
        and document_id is not null
        and nullif(btrim(coalesce(url, '')), '') is null
        and nullif(btrim(coalesce(external_url, '')), '') is null
      )
      or (
        source = 'external_url'
        and document_id is null
        and (
          nullif(btrim(coalesce(url, '')), '') is not null
          or nullif(btrim(coalesce(external_url, '')), '') is not null
        )
      )
    ),
  constraint proposal_attachments_url_check
    check (
      url is null
      or url ~* '^https?://'
    ),
  constraint proposal_attachments_external_url_check
    check (
      external_url is null
      or external_url ~* '^https?://'
    )
);

create index if not exists idx_proposal_attachments_proposal
  on public.proposal_attachments(proposal_id);

create index if not exists idx_proposal_attachments_document
  on public.proposal_attachments(document_id)
  where document_id is not null;

alter table public.proposal_attachments enable row level security;

create or replace function public.current_user_can_read_proposal_attachment(
  attachment_proposal_id text,
  attachment_source text,
  attachment_document_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.proposals proposal
    where proposal.id = attachment_proposal_id
      and public.current_user_has_permission('proposal.view')
      and (proposal.project_id is null or public.current_user_can_read_project(proposal.project_id))
      and (
        attachment_source <> 'document'
        or exists (
          select 1
          from public.documents document
          where document.id = attachment_document_id
            and document.project_id = proposal.project_id
            and public.current_user_has_permission('document.view')
            and public.current_user_can_read_project(document.project_id)
        )
      )
  )
$$;

create or replace function public.current_user_can_write_proposal_attachment(
  attachment_proposal_id text,
  attachment_source text,
  attachment_document_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.proposals proposal
    where proposal.id = attachment_proposal_id
      and (
        public.current_user_has_permission('proposal.create')
        or public.current_user_has_permission('proposal.update')
        or public.current_user_has_permission('proposal.review')
        or public.current_user_has_permission('proposal.approve')
      )
      and (proposal.project_id is null or public.current_user_can_read_project(proposal.project_id))
      and (
        attachment_source <> 'document'
        or exists (
          select 1
          from public.documents document
          where document.id = attachment_document_id
            and document.project_id = proposal.project_id
            and public.current_user_has_permission('document.view')
            and public.current_user_can_read_project(document.project_id)
        )
      )
  )
$$;

drop policy if exists "proposal attachments readable by permitted users" on public.proposal_attachments;
create policy "proposal attachments readable by permitted users" on public.proposal_attachments
  for select to authenticated
  using (public.current_user_can_read_proposal_attachment(proposal_id, source, document_id));

drop policy if exists "proposal attachments insertable by permitted users" on public.proposal_attachments;
create policy "proposal attachments insertable by permitted users" on public.proposal_attachments
  for insert to authenticated
  with check (public.current_user_can_write_proposal_attachment(proposal_id, source, document_id));

drop policy if exists "proposal attachments updatable by permitted users" on public.proposal_attachments;
create policy "proposal attachments updatable by permitted users" on public.proposal_attachments
  for update to authenticated
  using (public.current_user_can_write_proposal_attachment(proposal_id, source, document_id))
  with check (public.current_user_can_write_proposal_attachment(proposal_id, source, document_id));

drop policy if exists "proposal attachments deletable by permitted users" on public.proposal_attachments;
create policy "proposal attachments deletable by permitted users" on public.proposal_attachments
  for delete to authenticated
  using (public.current_user_can_write_proposal_attachment(proposal_id, source, document_id));
