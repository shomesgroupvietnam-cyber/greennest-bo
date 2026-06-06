-- Story 4.2: child assignments/tasks created from official decisions.

create table if not exists public.decision_assignments (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  organization_id text,
  project_id uuid not null references public.projects(id) on delete cascade,
  assignee_type text not null default 'user',
  assignee_id uuid references public.users(id) on delete set null,
  department_id text,
  title text not null,
  description text,
  kpi text,
  due_date date,
  priority text not null default 'medium',
  status text not null default 'assigned',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint decision_assignments_assignee_type_check
    check (assignee_type in ('user', 'department', 'project')),
  constraint decision_assignments_priority_check
    check (priority in ('low', 'medium', 'high', 'urgent')),
  constraint decision_assignments_status_check
    check (status in ('assigned', 'in_progress', 'done', 'cancelled')),
  constraint decision_assignments_user_target_check
    check (assignee_type <> 'user' or assignee_id is not null),
  constraint decision_assignments_department_target_check
    check (assignee_type <> 'department' or department_id is not null)
);

create index if not exists idx_decision_assignments_decision
  on public.decision_assignments(decision_id);

create index if not exists idx_decision_assignments_task
  on public.decision_assignments(task_id);

create index if not exists idx_decision_assignments_project
  on public.decision_assignments(project_id);

create index if not exists idx_decision_assignments_assignee
  on public.decision_assignments(assignee_id);

create index if not exists idx_decision_assignments_status_due
  on public.decision_assignments(status, due_date);

drop trigger if exists set_decision_assignments_updated_at on public.decision_assignments;
create trigger set_decision_assignments_updated_at
  before update on public.decision_assignments
  for each row execute function public.set_updated_at();

create or replace function public.prevent_decision_assignment_relink()
returns trigger
language plpgsql
as $$
begin
  if new.decision_id is distinct from old.decision_id
    or new.task_id is distinct from old.task_id
    or new.project_id is distinct from old.project_id
    or new.organization_id is distinct from old.organization_id
    or new.created_by is distinct from old.created_by then
    raise exception 'decision assignment linkage fields are immutable';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_decision_assignment_relink on public.decision_assignments;
create trigger prevent_decision_assignment_relink
  before update on public.decision_assignments
  for each row execute function public.prevent_decision_assignment_relink();

alter table public.decision_assignments enable row level security;

drop policy if exists "decision assignment tasks rollback deletable by creators" on public.tasks;
create policy "decision assignment tasks rollback deletable by creators" on public.tasks
  for delete to authenticated
  using (
    linked_entity_type = 'decision'
    and linked_entity_id is not null
    and created_by = public.current_app_user_id()
    and public.current_user_has_permission('task.create')
    and public.current_user_can_read_project(project_id)
    and exists (
      select 1
      from public.decisions decision_record
      where decision_record.id = tasks.linked_entity_id
        and public.current_user_can_write_decision_scope(
          tasks.project_id,
          array[tasks.project_id],
          decision_record.source_type,
          decision_record.source_id
        )
    )
  );

drop policy if exists "decision assignments readable by scoped decision users" on public.decision_assignments;
create policy "decision assignments readable by scoped decision users" on public.decision_assignments
  for select to authenticated
  using (
    exists (
      select 1
      from public.decisions decision_record
      where decision_record.id = decision_assignments.decision_id
        and public.current_user_has_permission('meeting.view')
        and public.current_user_can_read_project(decision_assignments.project_id)
        and public.current_user_can_access_decision_scope(
          decision_record.project_id,
          decision_record.project_ids,
          decision_record.source_type,
          decision_record.source_id
        )
    )
  );

drop policy if exists "decision assignments creatable by scoped task users" on public.decision_assignments;
create policy "decision assignments creatable by scoped task users" on public.decision_assignments
  for insert to authenticated
  with check (
    public.current_user_has_permission('decision.create')
    and public.current_user_has_permission('task.create')
    and public.current_user_can_read_project(project_id)
    and created_by = public.current_app_user_id()
    and exists (
      select 1
      from public.decisions decision_record
      where decision_record.id = decision_assignments.decision_id
        and public.current_user_can_write_decision_scope(
          decision_assignments.project_id,
          array[decision_assignments.project_id],
          decision_record.source_type,
          decision_record.source_id
        )
        and decision_assignments.organization_id is not distinct from decision_record.organization_id
        and (
          (
            decision_record.project_id is null
            and cardinality(coalesce(decision_record.project_ids, '{}'::uuid[])) = 0
          )
          or decision_assignments.project_id = decision_record.project_id
          or decision_assignments.project_id = any(decision_record.project_ids)
        )
    )
    and task_id is not null
    and exists (
        select 1
        from public.tasks task_record
        where task_record.id = decision_assignments.task_id
          and task_record.project_id = decision_assignments.project_id
          and task_record.linked_entity_type = 'decision'
          and task_record.linked_entity_id = decision_assignments.decision_id
    )
  );

drop policy if exists "decision assignments rollback deletable by creators" on public.decision_assignments;
create policy "decision assignments rollback deletable by creators" on public.decision_assignments
  for delete to authenticated
  using (
    created_by = public.current_app_user_id()
    and public.current_user_has_permission('decision.create')
    and public.current_user_has_permission('task.create')
    and public.current_user_can_read_project(project_id)
    and exists (
      select 1
      from public.decisions decision_record
      where decision_record.id = decision_assignments.decision_id
        and public.current_user_can_write_decision_scope(
          decision_assignments.project_id,
          array[decision_assignments.project_id],
          decision_record.source_type,
          decision_record.source_id
        )
        and decision_assignments.organization_id is not distinct from decision_record.organization_id
    )
    and exists (
      select 1
      from public.tasks task_record
      where task_record.id = decision_assignments.task_id
        and task_record.project_id = decision_assignments.project_id
        and task_record.linked_entity_type = 'decision'
        and task_record.linked_entity_id = decision_assignments.decision_id
    )
  );

drop policy if exists "decision assignments updatable by scoped task users" on public.decision_assignments;
create policy "decision assignments updatable by scoped task users" on public.decision_assignments
  for update to authenticated
  using (
    public.current_user_has_permission('task.update')
    and public.current_user_can_read_project(project_id)
    and exists (
      select 1
      from public.decisions decision_record
      where decision_record.id = decision_assignments.decision_id
        and public.current_user_can_write_decision_scope(
          decision_assignments.project_id,
          array[decision_assignments.project_id],
          decision_record.source_type,
          decision_record.source_id
        )
        and decision_assignments.organization_id is not distinct from decision_record.organization_id
    )
    and exists (
      select 1
      from public.tasks task_record
      where task_record.id = decision_assignments.task_id
        and task_record.project_id = decision_assignments.project_id
        and task_record.linked_entity_type = 'decision'
        and task_record.linked_entity_id = decision_assignments.decision_id
    )
  )
  with check (
    public.current_user_has_permission('task.update')
    and public.current_user_can_read_project(project_id)
    and exists (
      select 1
      from public.decisions decision_record
      where decision_record.id = decision_assignments.decision_id
        and public.current_user_can_write_decision_scope(
          decision_assignments.project_id,
          array[decision_assignments.project_id],
          decision_record.source_type,
          decision_record.source_id
        )
        and decision_assignments.organization_id is not distinct from decision_record.organization_id
    )
    and exists (
      select 1
      from public.tasks task_record
      where task_record.id = decision_assignments.task_id
        and task_record.project_id = decision_assignments.project_id
        and task_record.linked_entity_type = 'decision'
        and task_record.linked_entity_id = decision_assignments.decision_id
    )
  );
