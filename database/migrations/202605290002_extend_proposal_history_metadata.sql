-- Story 3.4: preserve approval history version and transition metadata.

alter table if exists public.proposal_decisions
  add column if not exists version integer,
  add column if not exists previous_status text,
  add column if not exists next_status text,
  add column if not exists previous_step_status text,
  add column if not exists next_step_status text;

with ranked_decisions as (
  select
    id,
    row_number() over (
      partition by proposal_id
      order by decided_at asc, id asc
    ) as chronological_version
  from public.proposal_decisions
)
update public.proposal_decisions as decision
set version = ranked_decisions.chronological_version
from ranked_decisions
where decision.id = ranked_decisions.id
  and decision.version is distinct from ranked_decisions.chronological_version;

alter table if exists public.proposal_decisions
  alter column version set default 1,
  alter column version set not null;

alter table if exists public.proposal_decisions
  drop constraint if exists proposal_decisions_version_check;

alter table if exists public.proposal_decisions
  add constraint proposal_decisions_version_check
  check (version > 0);

alter table if exists public.proposal_decisions
  drop constraint if exists proposal_decisions_proposal_version_key;

alter table if exists public.proposal_decisions
  add constraint proposal_decisions_proposal_version_key
  unique (proposal_id, version);

alter table if exists public.proposal_decisions
  drop constraint if exists proposal_decisions_previous_status_check;

alter table if exists public.proposal_decisions
  add constraint proposal_decisions_previous_status_check
  check (
    previous_status is null
    or previous_status in (
      'draft',
      'submitted',
      'in_review',
      'change_requested',
      'on_hold',
      'cancelled',
      'approved',
      'rejected',
      'archived'
    )
  );

alter table if exists public.proposal_decisions
  drop constraint if exists proposal_decisions_next_status_check;

alter table if exists public.proposal_decisions
  add constraint proposal_decisions_next_status_check
  check (
    next_status is null
    or next_status in (
      'draft',
      'submitted',
      'in_review',
      'change_requested',
      'on_hold',
      'cancelled',
      'approved',
      'rejected',
      'archived'
    )
  );

alter table if exists public.proposal_decisions
  drop constraint if exists proposal_decisions_previous_step_status_check;

alter table if exists public.proposal_decisions
  add constraint proposal_decisions_previous_step_status_check
  check (
    previous_step_status is null
    or previous_step_status in (
      'pending',
      'in_review',
      'approved',
      'rejected',
      'change_requested',
      'forwarded',
      'meeting_requested',
      'held',
      'cancelled',
      'skipped'
    )
  );

alter table if exists public.proposal_decisions
  drop constraint if exists proposal_decisions_next_step_status_check;

alter table if exists public.proposal_decisions
  add constraint proposal_decisions_next_step_status_check
  check (
    next_step_status is null
    or next_step_status in (
      'pending',
      'in_review',
      'approved',
      'rejected',
      'change_requested',
      'forwarded',
      'meeting_requested',
      'held',
      'cancelled',
      'skipped'
    )
  );
