alter table public.ai_interactions
  add column if not exists workflow_status text not null default 'DRAFT'
  check (workflow_status in ('DRAFT', 'REVIEWING', 'APPROVED', 'REJECTED'));

alter table public.ai_action_proposals
  add column if not exists workflow_status text not null default 'REVIEWING'
  check (workflow_status in ('DRAFT', 'REVIEWING', 'APPROVED', 'REJECTED'));

create index if not exists idx_ai_interactions_workflow_status
  on public.ai_interactions(workflow_status);

create index if not exists idx_ai_action_proposals_workflow_status
  on public.ai_action_proposals(workflow_status);
