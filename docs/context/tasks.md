# Context Pack: Tasks

Use this when a story touches task creation, task lists, task priority/status, task assignment, overdue/upcoming logic, task linkage or task RLS.

## Current Contract

- `src/modules/tasks/types.ts` defines `Task` and `TaskInput`.
- Current domain fields: `projectId`, `title`, `description`, `assigneeId`, `dueDate`, `status`, `priority`, `category`, timestamps.
- `src/modules/tasks/services/task-service.ts` owns `createTask`, `updateTask`, `listTasks`, `getOverdueTasks`, `getUpcomingTasks`.
- `createTask` validates project existence/archival state. It does not enforce caller permission; action/service caller must do that.
- `src/modules/tasks/services/task-repository.ts` owns JSON and Supabase mapping.
- DB `tasks` already has `linked_entity_type`, `linked_entity_id`, `created_by`, `archived_at`; domain/repository may need extension before features can rely on those fields.

## Rules

- Keep status and priority machine keys aligned with `src/constants/statuses.ts`.
- Use date-only `YYYY-MM-DD` for `dueDate`; do not use arbitrary localized date strings.
- When creating tasks from another record, prefer explicit linkage fields over title/description-only linkage.
- Do not treat `category` as a source-of-truth relation. It is a classification key/label unless extended by a story.
- Permission-sensitive task creation must check `task.create` and target project scope before `createTask`.
- External users may see only assigned/scoped tasks; keep service DTO filtering before UI render.
- If adding fields to `Task`, update type, validation, JSON repository, Supabase repository, migrations/RLS if needed, and tests together.

## Files To Inspect Before Editing

- `src/modules/tasks/types.ts`
- `src/modules/tasks/validation.ts`
- `src/modules/tasks/services/task-service.ts`
- `src/modules/tasks/services/task-repository.ts`
- `src/modules/tasks/actions.ts`
- `src/modules/tasks/components/task-list-table.tsx`
- `src/modules/tasks/components/task-form.tsx`
- `src/lib/permissions/access-scope.ts`
- `database/migrations/202605160001_create_mvp_core_schema.sql`
- `database/policies/001_mvp_rls.sql`

## Test Focus

- `tests/unit/task-service.test.ts`
- `tests/unit/access-scope.test.ts`
- Repository mapping tests when fields change.
- Regression tests for overdue/upcoming calculations.
