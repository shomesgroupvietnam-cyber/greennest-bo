-- Proposal on-behalf metadata and meeting approval links.

alter table public.proposals
  add column if not exists submitted_by uuid references public.users(id) on delete set null,
  add column if not exists on_behalf_of uuid references public.users(id) on delete set null,
  add column if not exists delegation_id text;

update public.proposals
set submitted_by = coalesce(submitted_by, requested_by)
where submitted_by is null;

create index if not exists idx_proposals_submitted_by
  on public.proposals(submitted_by);

create index if not exists idx_proposals_on_behalf_of
  on public.proposals(on_behalf_of);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'meetings'
      and column_name = 'related_approvals'
  ) then
    alter table public.meetings
      alter column related_approvals drop default,
      alter column related_approvals type text[] using coalesce(related_approvals::text[], array[]::text[]),
      alter column related_approvals set default array[]::text[],
      alter column related_approvals set not null;
  else
    alter table public.meetings
      add column related_approvals text[] not null default array[]::text[];
  end if;
end $$;
