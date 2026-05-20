-- Phase 2 Sprint 1: link meeting decisions/action items to generated tasks.

alter table public.decisions
  add column if not exists task_id uuid references public.tasks(id) on delete set null;

create index if not exists idx_decisions_task on public.decisions(task_id);
