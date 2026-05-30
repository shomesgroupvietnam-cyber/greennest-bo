# Documentation Standard

## 1. Purpose

This file defines how GreenNest BuildFlow documentation is organized so future Codex/Claude work does not duplicate, contradict or scatter product decisions.

## 2. Source-of-truth Hierarchy

Use this order when documents overlap:

1. `blueprint/`  
   Long-term product, domain, architecture, data, API, AI, roles and roadmap source of truth.

2. `docs/`  
   Engineering operations: development, deployment, staging validation, repository structure, environments and production runbooks.

3. Root MVP files  
   `requirement.md`, `design.md`, `architecture.md`, `milestone.md` are MVP execution snapshots and sprint-level guidance.

4. Code-level README files  
   Local instructions for a folder/module only.

Current implementation status is owned by `docs/product/PHASE_STATUS.md`. The roadmap remains the canonical phase sequence, but the phase status file records what has actually been completed and what is still blocked.

## 2.1 BMad Compatibility Layer

GreenNest uses BMad as a workflow and traceability layer, not as a replacement for canonical documentation.

- Canonical product decisions stay in `blueprint/`.
- Canonical engineering and operations guidance stays in `docs/`.
- BMad planning outputs live in `_bmad-output/planning-artifacts/`.
- BMad implementation outputs live in `_bmad-output/implementation-artifacts/`.
- Daily customer requirement changes should become BMad artifacts first, then be promoted into canonical docs only after acceptance.

Use `docs/BMAD_DOCUMENTATION_MAP.md` to route new requirements, specs, stories and review artifacts.

## 2.2 Ownership Summary

| Question | Owning document |
| --- | --- |
| How do BMad artifacts map to canonical docs? | `docs/BMAD_DOCUMENTATION_MAP.md` |
| What is the product long-term direction? | `blueprint/00-product-vision.md` |
| What phase/sprint is completed now? | `docs/product/PHASE_STATUS.md` |
| What should be built next by phase? | `blueprint/04-roadmap.md` |
| What roles and permissions exist? | `blueprint/12-auth-roles-permissions.md` |
| What should each role workspace show? | `blueprint/13-role-workspaces.md` |
| How should AI/RAG/MCP work? | `blueprint/14-ai-assistant-strategy.md` |
| What is the current practical architecture? | `docs/architecture/ARCHITECTURE_OVERVIEW.md` |
| What UI/UX standard should new work follow? | `docs/design/DESIGN_STANDARD.md` |
| How do developers run/deploy/validate? | `docs/development/` and `docs/deployment/` |
| What did MVP sprints originally require? | Root MVP snapshot files |

## 3. Folder Responsibilities

### `_bmad-output/`

Use for BMad workflow artifacts:

- `planning-artifacts/`: PRD updates, UX plans, architecture decisions, epics, readiness reports and change proposals.
- `implementation-artifacts/`: specs, stories, checkpoints, investigations, code reviews and retrospectives.

BMad artifacts are evidence and working agreements. They do not become canonical until the accepted change is reflected in `blueprint/` or `docs/`.

### `blueprint/`

Use for strategic and scalable product decisions:

- Product vision.
- Domain model.
- Platform architecture.
- Requirements.
- Data model.
- API contract.
- Roadmap.
- Role/permission model.
- Role workspaces.
- AI Assistant and RAG strategy.
- Decision log.

### `docs/`

Use for engineering implementation and operations:

- Development guide.
- Deployment guide.
- Environment strategy.
- Supabase staging validation.
- Tech stack.
- Repository structure.
- Operations guide.
- Documentation standard.

### Root MVP Docs

Use for execution references:

- `requirement.md`: MVP requirement snapshot.
- `design.md`: MVP UI/UX snapshot.
- `architecture.md`: MVP implementation architecture snapshot.
- `milestone.md`: sprint/milestone execution plan.

These files are snapshots. Do not expand them into the current canonical roadmap, permission matrix, AI plan or production runbook. If a long-term decision changes, update `blueprint/` first, then update root MVP docs only if that sprint scope is affected or the snapshot label is misleading.

## 4. No-overlap Rules

- Do not duplicate full permission matrices outside `blueprint/12-auth-roles-permissions.md`; link to it.
- Do not duplicate role workspace specs outside `blueprint/13-role-workspaces.md`; link to it.
- Do not duplicate AI/RAG strategy outside `blueprint/14-ai-assistant-strategy.md`; link to it.
- Do not duplicate tech stack details outside `docs/architecture/TECH_STACK.md`; summarize and link.
- Do not duplicate deployment steps outside `docs/deployment/`.
- Sprint prompts should reference docs instead of copying large sections.

## 5. Update Protocol

When changing product direction:

1. Capture the change in a BMad planning or implementation artifact when it comes from a customer update, sprint change or scoped implementation request.
2. Update the relevant `blueprint/` file when the accepted change affects long-term product, domain, roadmap, data, API, roles or AI strategy.
3. Add or update a decision in `blueprint/10-decision-log.md` if the choice affects architecture/product direction.
4. Update `docs/` if development, deployment, architecture standard, design standard, operations or current status changes.
5. Update root MVP docs only if active MVP snapshot labeling is misleading. Do not expand them as current source of truth.
6. Report both the BMad artifact and source-of-truth files changed.

## 6. Agent Reading Order

For documentation/design/architecture finalization:

1. `docs/DOCS_INDEX.md`.
2. `docs/DOCUMENTATION_STANDARD.md`.
3. `docs/BMAD_DOCUMENTATION_MAP.md`.
4. `blueprint/README.md`.
5. `docs/product/PHASE_STATUS.md`.
6. `docs/architecture/ARCHITECTURE_OVERVIEW.md`.
7. `docs/design/DESIGN_STANDARD.md`.

For a normal implementation sprint:

1. `docs/DOCS_INDEX.md`.
2. `docs/BMAD_DOCUMENTATION_MAP.md`.
3. Approved BMad artifact, if one exists.
4. `blueprint/README.md`.
5. Relevant blueprint file for the domain.
6. `docs/product/PHASE_STATUS.md`.
7. `docs/STRUCTURE.md`.
8. `docs/architecture/TECH_STACK.md`.
9. Existing code for the affected module.

For AI features:

1. `blueprint/14-ai-assistant-strategy.md`.
2. `blueprint/12-auth-roles-permissions.md`.
3. Relevant module/domain blueprint.
4. Existing module code.

For deployment/security:

1. `docs/deployment/README.md`.
2. `docs/deployment/SUPABASE_STAGING_VALIDATION.md`.
3. `database/migrations/`.
4. `database/policies/`.
5. `infra/supabase/`.
