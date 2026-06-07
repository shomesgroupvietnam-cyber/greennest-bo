alter table public.notification_outbox
  drop constraint if exists notification_outbox_source_type_check;

alter table public.notification_outbox
  add constraint notification_outbox_source_type_check
  check (source_type in ('proposal', 'leadership_approval', 'executive_action', 'risk'));

create or replace function public.current_user_can_access_notification_outbox_item(
  item_source_type text,
  item_source_id text,
  item_project_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when item_source_type = 'proposal' then exists (
      select 1
      from public.proposals proposal
      where proposal.id = item_source_id
        and public.current_user_has_permission('proposal.view')
        and (proposal.project_id is null or public.current_user_can_read_project(proposal.project_id))
    )
    when item_source_type = 'risk' then exists (
      select 1
      from public.executive_risk_records risk
      where risk.id::text = item_source_id
        and public.current_user_has_permission('risk.view')
        and (risk.project_id is null or public.current_user_can_read_project(risk.project_id))
    )
    when item_project_id is not null then exists (
      select 1
      from public.projects project
      where project.id::text = item_project_id
        and public.current_user_can_read_project(project.id)
        and (
          (
            item_source_type = 'leadership_approval'
            and (
              public.current_user_has_permission('proposal.view')
              or public.current_user_has_permission('proposal.approve')
            )
          )
          or (
            item_source_type = 'executive_action'
            and (
              public.current_user_has_permission('proposal.view')
              or public.current_user_has_permission('decision.create')
            )
          )
        )
    )
    else
      (
        item_source_type = 'leadership_approval'
        and (
          public.current_user_has_internal_permission('proposal.view')
          or public.current_user_has_internal_permission('proposal.approve')
        )
      )
      or (
        item_source_type = 'executive_action'
        and (
          public.current_user_has_internal_permission('proposal.view')
          or public.current_user_has_internal_permission('decision.create')
        )
      )
  end
$$;
