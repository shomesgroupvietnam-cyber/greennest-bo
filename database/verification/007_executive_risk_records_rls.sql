do $$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'executive_risk_records'
  ) then
    raise exception 'Missing executive_risk_records table';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'executive_risk_records'
      and policyname = 'executive risk records readable by scoped risk users'
  ) then
    raise exception 'Missing executive risk record read policy';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'executive_risk_records'
      and policyname = 'executive risk records creatable by scoped risk users'
  ) then
    raise exception 'Missing executive risk record create policy';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'executive_risk_records'
      and policyname = 'executive risk records updatable by scoped risk users'
  ) then
    raise exception 'Missing executive risk record update policy';
  end if;

  if not exists (
    select 1
    from public.permissions
    where key in ('risk.create', 'risk.update', 'risk.override', 'risk.close', 'risk.close_high')
    group by true
    having count(*) = 5
  ) then
    raise exception 'Missing risk.create/risk.update/risk.override/risk.close/risk.close_high permissions';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'executive_risk_records_status_override_audit_check'
  ) then
    raise exception 'Missing executive risk record override audit constraint';
  end if;

  if not exists (
    select 1
    from information_schema.triggers
    where event_object_schema = 'public'
      and event_object_table = 'executive_risk_records'
      and trigger_name = 'guard_executive_risk_record_lifecycle_permissions'
  ) then
    raise exception 'Missing executive risk record lifecycle permission trigger';
  end if;
end $$;
