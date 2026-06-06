-- Add minutes approval metadata without changing existing meeting_minutes text.

alter table public.meetings
  add column if not exists meeting_minutes_approval jsonb not null default '{"status":"DRAFT"}'::jsonb;

update public.meetings
set meeting_minutes_approval = '{"status":"DRAFT"}'::jsonb
where meeting_minutes_approval is null;
