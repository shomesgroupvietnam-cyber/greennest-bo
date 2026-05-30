-- Extend proposal workflow outcomes for Approval Detail actions.

alter table if exists public.proposals
  drop constraint if exists proposals_status_check;

alter table if exists public.proposals
  add constraint proposals_status_check
  check (status in (
    'draft',
    'submitted',
    'in_review',
    'change_requested',
    'on_hold',
    'cancelled',
    'approved',
    'rejected',
    'archived'
  ));

alter table if exists public.proposal_steps
  drop constraint if exists proposal_steps_status_check;

alter table if exists public.proposal_steps
  add constraint proposal_steps_status_check
  check (status in (
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
  ));

alter table if exists public.proposal_steps
  add column if not exists required_permission text references public.permissions(key),
  add column if not exists threshold_policy_id text references public.approval_threshold_policies(id) on delete set null,
  add column if not exists threshold_label text,
  add column if not exists approval_level text;

alter table if exists public.proposal_decisions
  drop constraint if exists proposal_decisions_decision_check;

alter table if exists public.proposal_decisions
  add constraint proposal_decisions_decision_check
  check (decision in (
    'submitted',
    'approved',
    'rejected',
    'change_requested',
    'forwarded',
    'meeting_requested',
    'held',
    'cancelled',
    'archived'
  ));
