-- Story 6.3: generic related-record links for One Meeting Engine.
-- Existing related_approvals and related_tasks stay for backward compatibility.

alter table public.meetings
  add column if not exists related_records jsonb not null default '[]'::jsonb;

alter table public.meetings
  alter column related_records set default '[]'::jsonb;

update public.meetings
set related_records = '[]'::jsonb
where related_records is null
  or jsonb_typeof(related_records) <> 'array';

update public.meetings
set related_records = (
  select coalesce(jsonb_agg(record), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'type', 'approval',
      'id', approval_id::text,
      'relationType', 'context'
    ) as record
    from unnest(coalesce(related_approvals::text[], '{}'::text[])) as approval_id
    union all
    select jsonb_build_object(
      'type', 'task',
      'id', task_id::text,
      'relationType', 'context'
    ) as record
    from unnest(coalesce(related_tasks::text[], '{}'::text[])) as task_id
  ) records
)
where related_records = '[]'::jsonb
  and (
    cardinality(coalesce(related_approvals::text[], '{}'::text[])) > 0
    or cardinality(coalesce(related_tasks::text[], '{}'::text[])) > 0
  );

alter table public.meetings
  drop constraint if exists meetings_related_records_is_array;

alter table public.meetings
  add constraint meetings_related_records_is_array
  check (jsonb_typeof(related_records) = 'array');

alter table public.meetings
  alter column related_records set not null;

create index if not exists idx_meetings_related_records
  on public.meetings using gin(related_records);
