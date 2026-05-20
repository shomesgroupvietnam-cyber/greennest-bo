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

## 2.1 Ownership Summary

| Question | Owning document |
| --- | --- |
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

1. Update the relevant `blueprint/` file.
2. Add or update a decision in `blueprint/10-decision-log.md` if the choice affects architecture/product direction.
3. Update root MVP docs only if active sprint scope changes.
4. Update `docs/` only if development/deployment/operations behavior changes.
5. Report which source-of-truth files changed.

## 6. Agent Reading Order

For documentation/design/architecture finalization:

1. `docs/DOCS_INDEX.md`.
2. `docs/DOCUMENTATION_STANDARD.md`.
3. `blueprint/README.md`.
4. `docs/product/PHASE_STATUS.md`.
5. `docs/architecture/ARCHITECTURE_OVERVIEW.md`.
6. `docs/design/DESIGN_STANDARD.md`.

For a normal implementation sprint:

1. `docs/DOCS_INDEX.md`.
2. `blueprint/README.md`.
3. Relevant blueprint file for the domain.
4. `milestone.md` if the work maps to an existing sprint.
5. `docs/STRUCTURE.md`.
6. `docs/architecture/TECH_STACK.md`.
7. Existing code for the affected module.

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
