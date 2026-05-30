-- Verify Module 1 acceptance demo seed after applying:
-- database/seeds/003_module1_acceptance_demo.sql
--
-- Read-only checks for staging SQL editor or psql.

select
  'module1_acceptance_personas_present' as check_name,
  count(*) = 7 as passed,
  array_agg(role order by role) as seeded_roles
from public.users
where email in (
  'chairman@greennest.vn',
  'ceo@greennest.vn',
  'director@greennest.vn',
  'department.head@greennest.vn',
  'assistant@greennest.vn',
  'viewer@greennest.vn',
  'admin@greennest.vn'
);

select
  'module1_projects_cover_status_signals' as check_name,
  count(*) = 4 as passed,
  array_agg(status order by code) as project_statuses
from public.projects
where code in ('GN-2026-001', 'GN-2026-002', 'GN-2026-003', 'GN-2026-004');

select
  'module1_scope_assignments_present' as check_name,
  count(*) >= 6 as passed,
  array_agg(role_key order by role_key) as scoped_roles
from public.access_scope_assignments
where id in (
  '32000000-0000-4000-8000-000000000101',
  '32000000-0000-4000-8000-000000000102',
  '32000000-0000-4000-8000-000000000103',
  '32000000-0000-4000-8000-000000000104',
  '32000000-0000-4000-8000-000000000105',
  '32000000-0000-4000-8000-000000000106'
);

select
  'assistant_scope_has_no_finance_view' as check_name,
  count(*) = 0 as passed,
  coalesce(array_to_string(array_agg(id::text), ', '), '<none>') as violating_assignment_ids
from public.access_scope_assignments
where user_id = '20000000-0000-4000-8000-000000000106'
  and 'finance.view' = any(permission_keys);

select
  'module1_policy_and_risk_seed_present' as check_name,
  exists (
    select 1
    from public.approval_threshold_policies
    where policy_key = 'approval_over_2b'
      and approver_role_key = 'super_admin'
      and required_permission_key = 'proposal.approve'
      and is_active = true
  )
  and exists (
    select 1
    from public.risk_group_configs
    where risk_key = 'legal'
      and default_severity = 'high'
      and is_active = true
  )
  and exists (
    select 1
    from public.risk_group_configs
    where risk_key = 'missing_document'
      and is_active = true
  ) as passed;

select
  'assistant_delegation_positive_and_negative_present' as check_name,
  count(*) = 2
  and count(*) filter (
    where project_id = '30000000-0000-4000-8000-000000000101'
      and is_active = true
      and starts_at <= now()
      and (ends_at is null or ends_at >= now())
  ) = 1
  and count(*) filter (
    where project_id = '30000000-0000-4000-8000-000000000102'
      and ends_at < now()
  ) = 1 as passed,
  array_agg(note order by ends_at) as delegation_notes
from public.leadership_delegations
where principal_user_id = '20000000-0000-4000-8000-000000000103'
  and delegate_user_id = '20000000-0000-4000-8000-000000000106'
  and action_keys = array['proposal.create']::text[];

select
  'assistant_has_no_approval_or_delegation_management_permissions' as check_name,
  count(*) = 0 as passed,
  coalesce(array_to_string(array_agg(p.key order by p.key), ', '), '<none>') as forbidden_permissions
from public.roles r
join public.role_permissions rp on rp.role_id = r.id
join public.permissions p on p.id = rp.permission_id
where r.key = 'thu_ky_tro_ly'
  and p.key in ('proposal.approve', 'proposal.reject', 'proposal.request_change', 'delegation.manage');

select
  'module1_domain_acceptance_markers_present' as check_name,
  exists (
    select 1 from public.tasks
    where id = '40000000-0000-4000-8000-000000000101'
      and status = 'blocked'
      and due_date < date '2026-05-24'
  )
  and exists (
    select 1 from public.documents
    where id = '50000000-0000-4000-8000-000000000102'
      and status = 'missing'
  )
  and exists (
    select 1 from public.documents
    where id = '50000000-0000-4000-8000-000000000103'
      and classification = 'CONFIDENTIAL'
      and approval_status = 'approved'
  )
  and exists (
    select 1 from public.proposals
    where id = 'proposal-demo-overdue-approval'
      and status = 'in_review'
      and amount = 2100000000
      and due_date < date '2026-05-24'
  )
  and exists (
    select 1 from public.proposals
    where id = 'proposal-demo-on-behalf-ceo'
      and requested_by = '20000000-0000-4000-8000-000000000103'
      and submitted_by = '20000000-0000-4000-8000-000000000106'
      and on_behalf_of = '20000000-0000-4000-8000-000000000103'
      and delegation_id = '33000000-0000-4000-8000-000000000101'
  ) as passed;

select
  'axis2_axis3_placeholders_present' as check_name,
  coalesce(array_agg(module order by module), array[]::text[]) = array['axis-2', 'axis-3']::text[] as passed,
  coalesce(array_to_string(array_agg(id order by module), ', '), '<none>') as placeholder_proposals
from public.proposals
where id in ('proposal-axis-2-placeholder', 'proposal-axis-3-placeholder');

select
  'meeting_minutes_ai_summary_followup_present' as check_name,
  exists (
    select 1
    from public.meetings
    where id = '70000000-0000-4000-8000-000000000101'
      and ai_summary ->> 'status' = 'DRAFT'
      and meeting_minutes is not null
      and jsonb_array_length(follow_up_actions) > 0
      and jsonb_array_length(decisions) > 0
      and 'proposal-demo-overdue-approval' = any(related_approvals)
  )
  and exists (
    select 1
    from public.decisions
    where id = '71000000-0000-4000-8000-000000000101'
      and task_id = '40000000-0000-4000-8000-000000000102'
  ) as passed;
