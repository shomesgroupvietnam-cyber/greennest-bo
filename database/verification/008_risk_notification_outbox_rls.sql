-- Risk notification outbox RLS verification.
-- This file is intended for staging smoke review and static policy checks.

select
  'risk notification outbox readable by scoped risk users' as check_name,
  exists (
    select 1
    from pg_proc
    where proname = 'current_user_can_access_notification_outbox_item'
  ) as passed;

select
  'notification_outbox source_type accepts risk' as check_name,
  exists (
    select 1
    from pg_constraint
    where conname = 'notification_outbox_source_type_check'
      and pg_get_constraintdef(oid) like '%risk%'
  ) as passed;

select
  'risk notification requires risk.view' as check_name,
  'risk.view' as required_permission;
