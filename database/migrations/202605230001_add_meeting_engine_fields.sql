-- One Meeting Engine + Multiple Meeting Types.
-- Additive structure only: no video call, real transcript, real AI summary, or deep workflow automation.

alter table public.meetings
  alter column project_id drop not null,
  add column if not exists organization_id text,
  add column if not exists project_ids uuid[] not null default '{}',
  add column if not exists axis_id text,
  add column if not exists department_id text,
  add column if not exists meeting_type text not null default 'PROJECT_MEETING',
  add column if not exists visibility text not null default 'project',
  add column if not exists participant_scope text not null default 'project_team',
  add column if not exists status text not null default 'SCHEDULED',
  add column if not exists start_time timestamptz,
  add column if not exists end_time timestamptz,
  add column if not exists host_id uuid references public.users(id) on delete set null,
  add column if not exists participants uuid[] not null default '{}',
  add column if not exists external_participants text[] not null default '{}',
  add column if not exists room_id text,
  add column if not exists agenda text,
  add column if not exists attachments jsonb not null default '[]'::jsonb,
  add column if not exists transcript text,
  add column if not exists ai_summary jsonb not null default '{"status":"DRAFT"}'::jsonb,
  add column if not exists meeting_minutes text,
  add column if not exists decisions jsonb not null default '[]'::jsonb,
  add column if not exists follow_up_actions jsonb not null default '[]'::jsonb,
  add column if not exists related_approvals uuid[] not null default '{}',
  add column if not exists related_tasks uuid[] not null default '{}',
  add column if not exists audit_log jsonb not null default '[]'::jsonb;

update public.meetings
set
  start_time = coalesce(start_time, meeting_date),
  project_ids = case
    when project_id is not null and cardinality(project_ids) = 0 then array[project_id]
    else project_ids
  end,
  host_id = coalesce(host_id, created_by)
where start_time is null
   or (project_id is not null and cardinality(project_ids) = 0)
   or host_id is null;

alter table public.meetings
  alter column start_time set not null;

create index if not exists idx_meetings_meeting_type on public.meetings(meeting_type);
create index if not exists idx_meetings_status on public.meetings(status);
create index if not exists idx_meetings_visibility on public.meetings(visibility);
create index if not exists idx_meetings_organization on public.meetings(organization_id);
create index if not exists idx_meetings_axis_department on public.meetings(axis_id, department_id);
create index if not exists idx_meetings_start_time on public.meetings(start_time);

drop policy if exists "meetings readable by scoped permitted users" on public.meetings;
create policy "meetings readable by scoped permitted users" on public.meetings
  for select to authenticated
  using (
    public.current_user_has_permission('meeting.view')
    and (
      public.current_user_has_internal_permission('meeting.view')
      or host_id = public.current_app_user_id()
      or public.current_app_user_id() = any(participants)
      or (
        project_id is not null
        and public.current_user_can_read_project(project_id)
      )
    )
  );

drop policy if exists "meetings creatable by scoped permitted users" on public.meetings;
create policy "meetings creatable by scoped permitted users" on public.meetings
  for insert to authenticated
  with check (
    public.current_user_has_permission('meeting.create')
    and (
      public.current_user_has_internal_permission('meeting.create')
      or host_id = public.current_app_user_id()
      or (
        project_id is not null
        and public.current_user_can_read_project(project_id)
      )
    )
  );
