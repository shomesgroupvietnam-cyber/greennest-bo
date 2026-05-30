# Context Pack: Permissions And Audit

Use this when a story touches RBAC, scope filtering, 403 behavior, mutation guards, audit logs, RLS, settings, proposal approval, decisions, tasks, meetings, AI actions or exports.

## Read First

- `src/lib/permissions/can.ts` - canonical permission keys, role defaults, `can`, `assertCan`.
- `src/lib/permissions/access-scope.ts` - scope resolution and resource filtering.
- `src/lib/permissions/scoped-resources.ts` - safe resource loaders for routes/actions/services.
- `src/lib/permissions/guard.ts` and `api-guard.ts` - route/API guard patterns.
- `src/modules/settings/services/scope-assignment-service.ts` - assignment model and validation.
- `src/modules/users/services/user-service.ts` - `createAuditLog`, users, project memberships.
- `src/modules/users/services/user-repository.ts` - JSON/Supabase user, membership and audit persistence.
- `database/policies/001_mvp_rls.sql` - baseline RLS functions and policies.
- `database/migrations/202605230003_create_scope_assignments.sql` - scope assignment schema.

## Rules

- Permission checks must happen before repository writes and before sensitive DTO serialization.
- UI hiding is not security. Server Actions and services must still reject direct calls.
- Use centralized permission keys from `can.ts`; do not invent string permissions without updating catalog, seeds, UI and tests.
- For scoped reads, prefer `getScoped*`/`listScoped*` helpers instead of manual filtering in components.
- Business records keep scope fields (`organizationId`, `projectId`, `axisId`, `workstreamId`, `moduleId`, owner/assignee). Role/permission logic stays in permission/scope layers.
- For assignment-model users, project membership alone may not be enough. Use scope assignments when the role requires them.
- RLS mirrors app-level checks; it is not a replacement for action/service permission checks.
- Mutation audit payloads must be compact and safe. Do not dump raw proposal finance data, meeting transcript/minutes, raw AI output, source records or unauthorized details.
- Do not write success audit logs for failed validation/permission unless a dedicated security-audit pattern exists.

## Common Test Targets

- `tests/unit/permissions.test.ts` - role permission behavior.
- `tests/unit/access-scope.test.ts` - scope resolution and filtering.
- `tests/unit/scope-assignment-settings.test.ts` - scope assignment lifecycle.
- `tests/unit/settings-actions.test.ts` - audited settings actions.
- Feature service tests should inject `auditWriter` or mock `createAuditLog` when audit behavior matters.

## Gotchas

- External roles and viewers must not see data and then have it hidden by UI.
- Multi-organization, multi-project, multi-role and multi-assignment are core requirements.
- Permission-sensitive routes need both navigation gating and direct URL/server guard behavior.
