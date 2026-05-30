---
project_name: 'green_nest_buider_web'
user_name: 'Admin'
date: '2026-05-30T09:15:02+07:00'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality_rules', 'workflow_rules', 'critical_rules']
existing_patterns_found: 7
status: 'complete'
rule_count: 63
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- Runtime/app: Next.js 15.3.2 App Router, React 19.0.0, TypeScript 5.8.3, Node/npm theo local runtime.
- Styling/UI: Tailwind CSS 3.4.17, shadcn-ready primitives, Radix Slot 1.2.2, lucide-react 0.511.0.
- Forms/validation: React Hook Form 7.56.3, Zod 3.24.4, @hookform/resolvers 5.0.1.
- Backend pattern: Next.js Server Actions for internal mutations; Route Handlers only for public/API integrations.
- Persistence: Supabase/PostgreSQL target with mock/file-backed repositories kept in parity.
- Supabase libraries: @supabase/supabase-js 2.49.4, @supabase/ssr 0.6.1.
- Testing: Vitest 3.1.3 with jsdom, Testing Library React 16.3.0, Playwright 1.52.0.
- Tooling: ESLint 9.26.0 with Next config, Prettier 3.5.3, TypeScript strict mode.
- Do not upgrade Next/React/TypeScript/Supabase or add Prisma/Drizzle/tRPC/global store unless a dedicated story explicitly requires it.

## Critical Implementation Rules

### Language-Specific Rules

- TypeScript strict mode is enabled; do not use `any` as an escape hatch unless the existing boundary already requires it and the reason is local.
- Domain DTO fields use camelCase; DB rows stay snake_case inside repository adapters only.
- Missing optional domain values should be `undefined`; repository adapters convert to/from DB `null`.
- Date/time values in TypeScript should be ISO strings; date-only business fields such as `dueDate` stay `YYYY-MM-DD`.
- Use `@/*` imports for `src/*` paths; avoid deep relative imports across modules.
- Validation belongs at boundaries with Zod: actions, form parsing, service inputs, repository row mapping where needed.
- Services return domain objects/DTOs or throw Vietnamese domain errors. Do not leak raw Supabase errors, SQL details, or sensitive source data to UI.
- Keep service dependencies injectable in tests when touching repositories, audit writers, notification writers, or external providers.

### Framework-Specific Rules

- Internal mutations should use Server Actions in `src/modules/*/actions.ts`; components and routes should not call Supabase or repositories directly.
- App Router pages should compose route shells and module components; domain logic belongs in module services.
- Call `revalidatePath` before `redirect` when a Server Action both mutates data and redirects.
- Prefer server-rendered data, URL/filter state and local component state. Do not add Redux/Zustand/global store for a page-local workflow.
- Permission-aware UI is not security. Hide/disable actions for UX, but enforce permission again in action/service.
- For UI work, follow operational app design: dense but organized, Vietnamese-first, no landing-page/hero patterns inside app surfaces.
- Use existing shared UI primitives/components before adding new ones; keep cards/panels compact and avoid nested cards.
- Use lucide-react icons where icons are needed; status badges must include text, not color only.
- AI UX must stay contextual inside modules; AI mutations go through action proposal + human confirmation, never direct domain writes.

### Testing Rules

- Unit tests live in `tests/unit/*.test.ts` or `*.test.tsx`; E2E tests live in `tests/e2e`.
- Vitest runs with jsdom and `tests/setup.ts`; use Testing Library for component behavior, not implementation details.
- Service tests should inject JSON/mock repositories, audit writers, notification writers, and external-provider fakes instead of relying on global singleton state.
- Repository parity matters: when changing a domain contract, update and test both JSON/file-backed and Supabase row mapping.
- Permission and scope changes require targeted tests in `permissions.test.ts`, `access-scope.test.ts`, scoped resource tests, or the relevant service test.
- Server Action tests should mock `getCurrentUser`, `redirect`, `revalidatePath`, and service calls rather than hitting real Next runtime behavior.
- Keep regression tests for existing flows when extending shared services, especially proposal/approval, meeting decision/action item, task linkage, audit, notification, and RLS-facing contracts.
- Minimum validation for code stories: `npm run typecheck`, `npm run lint`, `npm run test`; run `npm run test:e2e` when route/UI behavior changes.

### Code Quality & Style Rules

- Domain modules belong in `src/modules/{module}` with `types.ts`, `validation.ts`, `actions.ts`, `services/*`, and `components/*` as applicable.
- Shared cross-cutting code belongs in `src/lib/auth`, `src/lib/permissions`, `src/lib/db`, `src/lib/storage`, `src/lib/audit`, `src/constants`, or `src/types`.
- Repository implementations live in `services/*-repository.ts`; business orchestration lives in `services/*-service.ts`.
- New SQL migrations use `database/migrations/YYYYMMDDNNNN_description.sql`; do not edit old migrations unless explicitly instructed.
- RLS policy assets belong in `database/policies`; migration/schema changes must keep app-level permission assumptions aligned.
- Use stable lowercase machine keys for statuses/categories; Vietnamese labels belong in constants/UI, not as service keys unless already established.
- Do not hardcode role names, approver names, KPI numbers, risk groups, or future module lists inside UI/services when config/catalog/scope data exists.
- Add comments only for non-obvious business logic, security assumptions, RLS parity, or tricky concurrency behavior.

### Development Workflow Rules

- Prefer focused story-sized diffs; avoid unrelated refactors, formatting churn, or metadata edits outside the task.
- The worktree may be dirty. Never revert user changes unless explicitly requested.
- Use existing scripts as validation gates: `typecheck`, `lint`, `test`, `test:e2e`, `smoke:supabase` when relevant.
- For story implementation, follow the cycle: create-story -> dev-story -> code-review -> next create-story. Do not pre-create far-future stories unless the dependency risk is acceptable.
- When adding production persistence, update migration, repository adapter, policy/RLS assets, seeds/verification if applicable, and tests together.
- When adding permission-sensitive routes/actions, update navigation/403 states and server-side guards together.
- New project patterns should update architecture/docs or this `project-context.md` before relying on future agents to follow them.
- Do not introduce new libraries or major architecture shifts without an explicit architecture/story decision.

### Critical Don't-Miss Rules

- Do not bypass `src/lib/permissions` or scoped resource helpers. Permission checks must happen before repository writes and before sensitive DTO serialization.
- Do not render unauthorized data and hide it later. Filter at service/server layer first.
- Do not create a parallel approval flow. Internal approvals must use the Proposal/Approval backbone unless a story explicitly replaces it.
- Do not create a second competing decision/meeting/task model. Extend/reuse the established service contracts with backward compatibility.
- Do not trust AI output as source of truth. AI may draft or propose; domain mutations require human confirmation and normal domain permission re-checks.
- Do not store raw sensitive source data in audit payloads. Audit should keep compact safe summaries.
- Do not let mock/file-backed mode drift from Supabase mode. Any contract field added to one adapter must be mapped in the other or explicitly deferred.
- Do not rely only on UI disabled states for security. Direct Server Action calls and direct URLs must still fail safely.
- Be careful with JSON file repositories on Windows and parallel Vitest. Prefer injected temp repositories and robust writes for tests touching shared mock files.
- Multi-organization, multi-project, multi-role, and multi-assignment are core requirements; avoid assumptions that one user, leader, decision, or meeting maps to one project or one role.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing code.
- Follow all rules unless the current story explicitly overrides them.
- When in doubt, choose the stricter permission, audit, validation, and repository-parity option.
- Update this file when a new durable project pattern is introduced.

**For Humans:**

- Keep this file lean and focused on implementation rules agents often miss.
- Update when stack versions, module boundaries, permission rules, or testing conventions change.
- Remove rules that become obsolete or are superseded by architecture docs.

Last Updated: 2026-05-30T09:15:02+07:00
