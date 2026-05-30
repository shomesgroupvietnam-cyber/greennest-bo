# 05 - Agent Operating Guide

## 1. Purpose

This guide tells Codex, Claude and other AI engineering agents how to work on GreenNest BuildFlow without drifting from the product direction.

## 2. Required Reading Order

For high-level planning:

1. `docs/DOCS_INDEX.md`.
2. `docs/BMAD_DOCUMENTATION_MAP.md`.
3. `blueprint/README.md`.
4. `blueprint/00-product-vision.md`.
5. `blueprint/01-domain-blueprint.md`.
6. `blueprint/02-scalable-architecture.md`.
7. Existing BMad planning artifact, if the request is a customer change.

For implementation:

1. Current sprint request.
2. Approved BMad artifact or implementation spec, if one exists.
3. `docs/DOCS_INDEX.md`.
4. `docs/BMAD_DOCUMENTATION_MAP.md`.
5. `docs/product/PHASE_STATUS.md`.
6. Relevant file in `blueprint/`.
7. Relevant standard in `docs/`.
8. Root MVP snapshot docs only when the task explicitly concerns MVP sprint history.

## 2.1 Daily Requirement Change Intake

When a customer updates or adds requirements:

1. Capture the change as a BMad planning artifact or scoped implementation spec.
2. Compare the change against the relevant canonical `blueprint/` and `docs/` files.
3. Update canonical docs only when the change is accepted and affects long-term behavior, architecture, permissions, UX, data, roadmap or production operations.
4. Implement from the accepted artifact or explicit user instruction.
5. Report both the artifact and canonical docs that changed.

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
Read docs/DOCS_INDEX.md, docs/BMAD_DOCUMENTATION_MAP.md, docs/product/PHASE_STATUS.md and the relevant GreenNest BuildFlow blueprint files.
If there is an approved BMad artifact, use it as the working request and keep canonical docs aligned only when the accepted change affects product, architecture, UX, data, roadmap or operations.
Implement only the requested phase/sprint/story.
Keep TypeScript, Vietnamese UI, project-centric data, centralized constants and clean module boundaries.
Do not hardcode dashboard metrics.
After implementation, report changed files, how to run, verification, acceptance criteria and remaining gaps.
```
