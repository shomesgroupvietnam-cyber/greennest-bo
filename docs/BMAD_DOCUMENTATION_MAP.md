# BMad Documentation Map

## 1. Purpose

This document defines how GreenNest BuildFlow uses BMad without replacing the existing source-of-truth structure.

The project receives frequent customer requirement changes. BMad should be used as the working system for intake, clarification, planning, stories and implementation evidence. The canonical product and engineering documents stay in `blueprint/` and `docs/`.

## 2. Operating Model

GreenNest uses a BMad-compatible model, not a BMad-only model.

| Layer | Folder | Purpose |
| --- | --- | --- |
| Product truth | `blueprint/` | Long-term product, domain, roadmap, API, data, roles and AI decisions |
| Engineering truth | `docs/` | Development, deployment, operations, architecture/design standards and current status |
| Planning artifacts | `_bmad-output/planning-artifacts/` | PRD updates, UX plans, architecture decisions, epics, readiness reports and change proposals |
| Implementation artifacts | `_bmad-output/implementation-artifacts/` | Approved specs, story execution notes, checkpoints, investigations and reviews |
| Historical snapshots | Root `*.md` files | MVP history only; do not expand as current source of truth |
| Local code notes | `README.md` near code | Folder-specific implementation guidance |

## 3. Daily Requirement Intake

When a customer adds or changes requirements:

1. Capture the request as a BMad artifact first.
2. Classify it as one of:
   - clarification
   - change proposal
   - PRD update
   - UX update
   - architecture decision
   - epic/story work
   - implementation spec
3. Compare it against the current canonical documents.
4. Update canonical documents only when the change affects long-term direction, architecture, permissions, UX standard, data model, roadmap or production behavior.
5. Implement only from an approved artifact or a clear user instruction.
6. Preserve the artifact as traceability for why the change happened.

## 4. Artifact Routing

| Work type | Preferred BMad skill | Output location | Canonical update needed? |
| --- | --- | --- | --- |
| New product concept or major scope | `bmad-product-brief` or `bmad-prfaq` | `_bmad-output/planning-artifacts/` | Usually `blueprint/00-product-vision.md` or `blueprint/04-roadmap.md` |
| PRD creation/update/validation | `bmad-prd` | `_bmad-output/planning-artifacts/` | `blueprint/07-platform-requirements.md` if accepted |
| UX planning | `bmad-create-ux-design` | `_bmad-output/planning-artifacts/` | `docs/design/DESIGN_STANDARD.md` or `blueprint/13-role-workspaces.md` if accepted |
| Architecture planning | `bmad-create-architecture` | `_bmad-output/planning-artifacts/` | `docs/architecture/ARCHITECTURE_OVERVIEW.md`, `blueprint/02-scalable-architecture.md` or `blueprint/10-decision-log.md` if accepted |
| Epics and stories | `bmad-create-epics-and-stories` | `_bmad-output/planning-artifacts/` | `blueprint/04-roadmap.md` or `blueprint/11-task-backlog.md` if accepted |
| Sprint planning/status | `bmad-sprint-planning`, `bmad-sprint-status` | `_bmad-output/implementation-artifacts/` | `docs/product/PHASE_STATUS.md` after meaningful completion |
| Narrow implementation request | `bmad-quick-dev` | `_bmad-output/implementation-artifacts/` | Only if behavior changes the canonical docs |
| Story execution | `bmad-create-story`, `bmad-dev-story`, `bmad-code-review` | `_bmad-output/implementation-artifacts/` | Status update after acceptance |
| Major scope correction | `bmad-correct-course` | `_bmad-output/planning-artifacts/` | Usually roadmap, requirements, architecture or decision log |

## 5. Current Canonical Documents

| Question | Canonical document |
| --- | --- |
| What is the current implementation status? | `docs/product/PHASE_STATUS.md` |
| What is the product direction? | `blueprint/00-product-vision.md` |
| What should be built by phase? | `blueprint/04-roadmap.md` |
| What are platform requirements? | `blueprint/07-platform-requirements.md` |
| What is the data model? | `blueprint/09-data-model.md` |
| What are major decisions? | `blueprint/10-decision-log.md` |
| What are roles and permissions? | `blueprint/12-auth-roles-permissions.md` |
| What should each workspace show? | `blueprint/13-role-workspaces.md` |
| How should AI/RAG/MCP work? | `blueprint/14-ai-assistant-strategy.md` |
| What architecture should implementation follow? | `docs/architecture/ARCHITECTURE_OVERVIEW.md` |
| What design standard should UI follow? | `docs/design/DESIGN_STANDARD.md` |
| How do developers run and verify locally? | `docs/development/README.md` |

## 6. Root Snapshot Policy

The root files below are historical MVP execution snapshots:

- `requirement.md`
- `design.md`
- `architecture.md`
- `milestone.md`

Do not use them as the first source for new work. Use them only when investigating MVP history or when a task explicitly references MVP sprint scope.

If a future cleanup moves them, move them as a single reviewed migration to `docs/archive/mvp-snapshots/` and leave root stubs or update all references in the same change.

## 7. Agent Reading Order

For normal implementation:

1. User request or approved BMad artifact.
2. `docs/DOCS_INDEX.md`.
3. `docs/BMAD_DOCUMENTATION_MAP.md`.
4. `docs/product/PHASE_STATUS.md`.
5. Relevant `blueprint/` document.
6. Relevant `docs/` standard.
7. Existing code and local README files.

For requirement changes:

1. User change request.
2. Existing artifact or create a new BMad planning artifact.
3. Relevant canonical document.
4. Decision log if the change affects long-term product or architecture.
5. Implementation story/spec.

## 8. Migration Rules

- Do not move all Markdown files at once.
- Do not move local code README files into BMad output folders.
- Do not duplicate full canonical content into BMad artifacts.
- Link from artifacts to canonical docs instead of copying large sections.
- When a BMad artifact is accepted, update the relevant canonical document in the same or next documentation pass.
- Run a link/reference audit after any move or rename.
