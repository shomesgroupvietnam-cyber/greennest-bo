# Context Pack: Testing

Use this before implementing or reviewing stories that change service logic, repositories, permissions, Server Actions, UI behavior, migrations or RLS-facing contracts.

## Test Stack

- Unit/component: Vitest 3.1.3, jsdom, Testing Library.
- E2E: Playwright 1.52.0, `tests/e2e`, single worker, base URL `http://localhost:3100`.
- Setup: `tests/setup.ts`.
- Path alias: `@` -> `src`.

## Commands

- `npm run typecheck` - TypeScript compile check.
- `npm run lint` - ESLint with Next/TypeScript config.
- `npm run test` - all Vitest tests.
- `npm run test -- tests/unit/<file>.test.ts` - targeted unit test.
- `npm run test:e2e` - Playwright smoke runner.
- `npm run smoke:supabase` - staging Supabase smoke when persistence/RLS changes require it.

## Rules

- Service tests should inject temp JSON repositories and fake side-effect writers.
- Avoid global singleton state in tests when a service accepts repository dependencies.
- When changing a domain field, test both service behavior and repository row mapping.
- Permission/scope changes need tests in `permissions.test.ts`, `access-scope.test.ts` or relevant feature tests.
- Server Action tests should mock auth/session, `redirect`, `revalidatePath` and called services.
- Component tests should assert user-visible behavior and states, not private implementation details.
- If a story changes route, form, navigation, responsive behavior or permission denial UI, consider e2e or component smoke coverage.
- Keep regression coverage for old behavior when extending shared services.

## Common Files

- `tests/unit/task-service.test.ts`
- `tests/unit/meeting-service.test.ts`
- `tests/unit/proposal-service.test.ts`
- `tests/unit/proposal-actions.test.ts`
- `tests/unit/approval-center-service.test.ts`
- `tests/unit/permissions.test.ts`
- `tests/unit/access-scope.test.ts`
- `tests/unit/settings-actions.test.ts`
- `tests/e2e/mvp-smoke.spec.ts`
