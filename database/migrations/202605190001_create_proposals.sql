-- Enterprise Governance: Internal Proposal and Approval foundation.

create table if not exists public.proposals (
  id text primary key,
  code text not null unique,
  title text not null,
  type text not null check (type in ('investment', 'legal', 'document', 'finance', 'contract', 'procurement', 'design', 'construction', 'hr', 'quality', 'safety', 'general')),
  project_id uuid references public.projects(id) on delete set null,
  module text not null,
  requested_by uuid references public.users(id) on delete set null,
  owner_id uuid references public.users(id) on delete set null,
  current_step_id text,
  status text not null check (status in ('draft', 'submitted', 'in_review', 'change_requested', 'approved', 'rejected', 'archived')),
  priority text not null check (priority in ('low', 'normal', 'high', 'urgent')),
  amount numeric,
  due_date date,
  summary text,
  ai_review_status text not null default 'not_checked' check (ai_review_status in ('not_checked', 'checked', 'warning', 'blocked')),
  ai_review_summary text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.proposal_steps (
  id text primary key,
  proposal_id text not null references public.proposals(id) on delete cascade,
  step_order integer not null,
  approver_role text,
  approver_user_id uuid references public.users(id) on delete set null,
  status text not null check (status in ('pending', 'in_review', 'approved', 'rejected', 'change_requested', 'skipped')),
  decided_by uuid references public.users(id) on delete set null,
  decided_at timestamptz,
  decision_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.proposal_links (
  id text primary key,
  proposal_id text not null references public.proposals(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  relation_type text not null check (relation_type in ('evidence', 'source', 'output', 'dependency', 'generated_action')),
  created_at timestamptz not null default now()
);

create table if not exists public.proposal_decisions (
  id text primary key,
  proposal_id text not null references public.proposals(id) on delete cascade,
  step_id text references public.proposal_steps(id) on delete set null,
  decision text not null check (decision in ('submitted', 'approved', 'rejected', 'change_requested', 'archived')),
  decided_by uuid references public.users(id) on delete set null,
  decided_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_proposals_project_status on public.proposals(project_id, status);
create index if not exists idx_proposals_type_status on public.proposals(type, status);
create index if not exists idx_proposal_steps_proposal on public.proposal_steps(proposal_id, step_order);
create index if not exists idx_proposal_links_proposal on public.proposal_links(proposal_id);
create index if not exists idx_proposal_decisions_proposal on public.proposal_decisions(proposal_id, decided_at desc);

drop trigger if exists set_proposals_updated_at on public.proposals;
create trigger set_proposals_updated_at before update on public.proposals for each row execute function public.set_updated_at();

drop trigger if exists set_proposal_steps_updated_at on public.proposal_steps;
create trigger set_proposal_steps_updated_at before update on public.proposal_steps for each row execute function public.set_updated_at();
