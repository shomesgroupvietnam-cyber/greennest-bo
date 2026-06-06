-- Story 6.1: harden One Meeting Engine RLS for multi-project and organization-only scope.

create index if not exists idx_meetings_project_ids
  on public.meetings using gin(project_ids);

create or replace function public.current_user_uses_assignment_scope()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = any(array[
    'pho_tong_giam_doc',
    'giam_doc_du_an',
    'quan_ly_du_an',
    'to_truong',
    'phap_ly',
    'ke_toan',
    'thiet_ke',
    'ky_thuat',
    'thi_cong',
    'mua_hang',
    'thu_ky_tro_ly'
  ])
$$;

create or replace function public.normalize_scope_axis(axis_value text)
returns text
language sql
immutable
as $$
  select case
    when axis_value in ('axis-1', 'axis1') then 'project_management'
    else axis_value
  end
$$;

create or replace function public.scope_dimension_matches(expected text, actual text, normalize_axis boolean default false)
returns boolean
language sql
immutable
as $$
  select
    expected is null
    or expected = ''
    or expected = '*'
    or (
      actual is not null
      and actual <> ''
      and case
        when normalize_axis then public.normalize_scope_axis(expected) = public.normalize_scope_axis(actual)
        else expected = actual
      end
    )
$$;

create or replace function public.current_user_has_matching_scope_assignment(
  permission_key text,
  target_organization_id text,
  target_project_id text,
  target_axis_id text,
  target_workstream_id text,
  target_module_id text,
  target_record_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.access_scope_assignments asa
    join public.roles role_record on role_record.key = asa.role_key
    join public.role_permissions role_permission on role_permission.role_id = role_record.id
    join public.permissions permission_record on permission_record.id = role_permission.permission_id
    where asa.user_id = public.current_app_user_id()
      and asa.is_active = true
      and role_record.is_active = true
      and permission_record.key = permission_key
      and permission_key = any(asa.permission_keys)
      and (asa.starts_at is null or asa.starts_at <= now())
      and (asa.ends_at is null or asa.ends_at >= now())
      and (
        (
          asa.scope_type = 'global'
          and asa.organization_id is null
          and asa.project_id is null
          and asa.axis_id is null
          and asa.workstream_id is null
          and asa.module_id is null
          and asa.record_id is null
        )
        or (
          asa.scope_type = 'scoped'
          and public.scope_dimension_matches(asa.organization_id, target_organization_id)
          and public.scope_dimension_matches(asa.project_id, target_project_id)
          and public.scope_dimension_matches(asa.axis_id, target_axis_id, true)
          and public.scope_dimension_matches(asa.workstream_id, target_workstream_id)
          and public.scope_dimension_matches(asa.module_id, target_module_id)
          and public.scope_dimension_matches(asa.record_id, target_record_id)
        )
      )
  )
$$;

create or replace function public.current_user_can_access_meeting_scope(
  meeting_id uuid,
  meeting_project_id uuid,
  meeting_project_ids uuid[],
  meeting_host_id uuid,
  meeting_participants uuid[],
  meeting_organization_id text,
  meeting_axis_id text,
  meeting_department_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with scoped_projects as (
    select distinct meeting_project.project_id
    from unnest(
      (
        case
          when meeting_project_id is null then '{}'::uuid[]
          else array[meeting_project_id]
        end
      ) || coalesce(meeting_project_ids, '{}'::uuid[])
    ) as meeting_project(project_id)
    where meeting_project.project_id is not null
  )
  select
    (
      (
        public.current_user_has_internal_permission('meeting.view')
        and not public.current_user_uses_assignment_scope()
      )
      or (
        (
          meeting_host_id = public.current_app_user_id()
          or public.current_app_user_id() = any(coalesce(meeting_participants, '{}'::uuid[]))
        )
        and (
          public.current_user_has_permission('meeting.view')
          or public.current_user_has_matching_scope_assignment(
            'meeting.view',
            meeting_organization_id,
            null,
            meeting_axis_id,
            coalesce(nullif(meeting_department_id, ''), 'meeting'),
            'meeting',
            meeting_id::text
          )
        )
      )
      or exists (
        select 1
        from scoped_projects
        where (
          (
            not public.current_user_uses_assignment_scope()
            and public.current_user_has_permission('meeting.view')
            and public.current_user_can_read_project(project_id)
          )
          or public.current_user_has_matching_scope_assignment(
            'meeting.view',
            meeting_organization_id,
            project_id::text,
            meeting_axis_id,
            coalesce(nullif(meeting_department_id, ''), 'meeting'),
            'meeting',
            meeting_id::text
          )
        )
      )
      or (
        not exists (select 1 from scoped_projects)
        and meeting_organization_id is not null
        and (
          (
            public.current_user_has_internal_permission('meeting.view')
            and not public.current_user_uses_assignment_scope()
          )
          or public.current_user_has_matching_scope_assignment(
            'meeting.view',
            meeting_organization_id,
            null,
            meeting_axis_id,
            coalesce(nullif(meeting_department_id, ''), 'meeting'),
            'meeting',
            meeting_id::text
          )
        )
      )
    )
$$;

create or replace function public.current_user_can_create_meeting_scope(
  meeting_project_id uuid,
  meeting_project_ids uuid[],
  meeting_host_id uuid,
  meeting_organization_id text,
  meeting_axis_id text,
  meeting_department_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with scoped_projects as (
    select distinct meeting_project.project_id
    from unnest(
      (
        case
          when meeting_project_id is null then '{}'::uuid[]
          else array[meeting_project_id]
        end
      ) || coalesce(meeting_project_ids, '{}'::uuid[])
    ) as meeting_project(project_id)
    where meeting_project.project_id is not null
  )
  select
    (
      (
        exists (select 1 from scoped_projects)
        and not exists (
          select 1
          from scoped_projects
          where not exists (
            select 1
            from public.projects project_record
            where project_record.id = project_id
              and (
                (
                  public.current_user_has_internal_permission('meeting.create')
                  and not public.current_user_uses_assignment_scope()
                )
                or (
                  not public.current_user_uses_assignment_scope()
                  and public.current_user_has_permission('meeting.create')
                  and public.current_user_can_read_project(project_id)
                )
                or public.current_user_has_matching_scope_assignment(
                  'meeting.create',
                  meeting_organization_id,
                  project_id::text,
                  meeting_axis_id,
                  coalesce(nullif(meeting_department_id, ''), 'meeting'),
                  'meeting',
                  null
                )
              )
          )
        )
      )
      or (
        meeting_project_id is null
        and cardinality(coalesce(meeting_project_ids, '{}'::uuid[])) = 0
        and meeting_organization_id is not null
        and (
          (
            public.current_user_has_internal_permission('meeting.create')
            and not public.current_user_uses_assignment_scope()
          )
          or public.current_user_has_matching_scope_assignment(
            'meeting.create',
            meeting_organization_id,
            null,
            meeting_axis_id,
            coalesce(nullif(meeting_department_id, ''), 'meeting'),
            'meeting',
            null
          )
        )
      )
    )
    and (
      meeting_host_id is null
      or meeting_host_id = public.current_app_user_id()
      or (
        public.current_user_has_internal_permission('meeting.create')
        and not public.current_user_uses_assignment_scope()
      )
    )
$$;

drop policy if exists "meetings readable by permitted users" on public.meetings;
drop policy if exists "meetings readable by scoped permitted users" on public.meetings;
create policy "meetings readable by scoped permitted users" on public.meetings
  for select to authenticated
  using (
    public.current_user_can_access_meeting_scope(id, project_id, project_ids, host_id, participants, organization_id, axis_id, department_id)
  );

drop policy if exists "meetings creatable by permitted users" on public.meetings;
drop policy if exists "meetings creatable by scoped permitted users" on public.meetings;
create policy "meetings creatable by scoped permitted users" on public.meetings
  for insert to authenticated
  with check (
    public.current_user_can_create_meeting_scope(project_id, project_ids, host_id, organization_id, axis_id, department_id)
  );

drop policy if exists "meetings updatable by permitted users" on public.meetings;
drop policy if exists "meetings updatable by internal permitted users" on public.meetings;
create policy "meetings updatable by internal permitted users" on public.meetings
  for update to authenticated
  using (public.current_user_has_internal_permission('meeting.update'))
  with check (public.current_user_has_internal_permission('meeting.update'));
