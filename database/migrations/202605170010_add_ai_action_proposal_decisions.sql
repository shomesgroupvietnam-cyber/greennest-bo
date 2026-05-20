-- AI Action Proposal Review/Confirm path.
-- Proposals remain non-mutating until a permitted user accepts them.

alter table public.ai_action_proposals
  add column if not exists decided_by uuid references public.profiles(id) on delete set null,
  add column if not exists decided_at timestamptz,
  add column if not exists decision_notes text,
  add column if not exists execution_result jsonb;

create index if not exists idx_ai_action_proposals_decided_by on public.ai_action_proposals(decided_by);
create index if not exists idx_ai_action_proposals_decided_at on public.ai_action_proposals(decided_at);

