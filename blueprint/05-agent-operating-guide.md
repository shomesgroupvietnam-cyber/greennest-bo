# 05 - Agent Operating Guide

## 1. Purpose

This guide tells Codex, Claude and other AI engineering agents how to work on GreenNest BuildFlow without drifting from the product direction.

## 2. Required Reading Order

For high-level planning:

1. `blueprint/README.md`.
2. `blueprint/00-product-vision.md`.
3. `blueprint/01-domain-blueprint.md`.
4. `blueprint/02-scalable-architecture.md`.

For implementation:

1. Current sprint request.
2. `requirement.md`.
3. `design.md`.
4. `architecture.md`.
5. `milestone.md`.
6. Relevant file in `blueprint/`.

## 3. Non-negotiable Rules

- Do not rename GreenNest BuildFlow.
- Do not change core module names without explicit instruction.
- Build project-centric data: most operational entities need `project_id`.
- Keep UI Vietnamese-first.
- Use TypeScript.
- Keep status/role labels in constants or configuration.
- Follow `blueprint/12-auth-roles-permissions.md` for auth, roles, permission keys, role-specific screens and navigation.
- Do not hardcode authorization with scattered role-name checks; use centralized permission helpers.
- Do not hardcode dashboard numbers in UI components.
- Do not implement large future modules before the current phase is accepted.
- Preserve clean module boundaries.
- Use soft delete/archive for main business records.
- Add or preserve audit hooks for important mutations.

## 4. Preferred Engineering Style

- Modular monolith first.
- Service layer before database access.
- Typed DTOs.
- Zod validation for input.
- Server-side permission checks.
- UI components should remain mostly presentational.
- Reusable layout and table/form patterns.

## 5. Before Starting Any Task

Agent should identify:

- Current phase/sprint.
- Module being changed.
- Data entities involved.
- Permission impact.
- Role-specific screen/navigation impact.
- Dashboard/reporting impact.
- Tests or verification needed.

If unclear, make a reasonable assumption and state it in the implementation report.

## 6. Implementation Report Format

At the end of a task, report:

- What was implemented.
- Files created/changed.
- How to run locally.
- Tests/verification run.
- Acceptance criteria covered.
- Known gaps or follow-up work.

## 7. Scalable Design Checklist

When adding a feature, check:

- Does it belong to a project?
- Does it need owner/assignee?
- Does it need status?
- Does it need due date?
- Does it affect dashboard metrics?
- Does it need audit log?
- Does permission differ by role?
- Does it need document links?
- Does it need future reporting?

## 8. UI Checklist

- Vietnamese labels.
- Responsive layout.
- Empty/loading/error states.
- Search/filter for growing lists.
- Clear status badges.
- No nested cards.
- No landing-page treatment for app screens.
- Destructive actions require confirmation.

## 9. Data Checklist

- Stable IDs.
- Created/updated timestamps.
- Project foreign key where relevant.
- Central constants for statuses.
- No free-text-only state where structured status is needed.
- Archive instead of destructive delete.

## 10. AI Feature Rules

When implementing AI features:

- AI can only access data the user can access.
- AI recommendations should cite source data.
- AI should not make final legal, financial or project decisions.
- AI must ask for confirmation before creating/updating records.
- Long AI document processing should be async/background.

## 11. Recommended Startup Prompt

```text
Read the GreenNest BuildFlow blueprint folder and the root MVP docs.
Implement only the requested phase/sprint.
Keep TypeScript, Vietnamese UI, project-centric data, centralized constants and clean module boundaries.
Do not hardcode dashboard metrics.
After implementation, report changed files, how to run, verification, acceptance criteria and remaining gaps.
```
