alter table public.notification_outbox
  drop constraint if exists notification_outbox_source_type_check;

alter table public.notification_outbox
  add constraint notification_outbox_source_type_check
  check (source_type in ('proposal', 'leadership_approval', 'executive_action', 'risk'));

create index if not exists idx_notification_outbox_source
  on public.notification_outbox (source_type, source_id, status);
