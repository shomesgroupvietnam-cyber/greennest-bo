# GreenNest BuildFlow - Documentation Index

> Primary documentation entrypoint. Start here before reading blueprint, product status, architecture, design or sprint snapshot files.

## 1. Purpose

This is the starting point for reading GreenNest BuildFlow documentation.

The project has moved beyond a simple MVP checklist. Documentation is now separated into:

- Product/platform blueprint.
- Engineering docs.
- Design standards.
- Architecture standards.
- Sprint execution snapshots.
- Code/module notes.

## 2. Read This First

1. [DOCUMENTATION_STANDARD.md](./DOCUMENTATION_STANDARD.md)  
   Defines source-of-truth rules and prevents overlapping docs.

2. [BMAD_DOCUMENTATION_MAP.md](./BMAD_DOCUMENTATION_MAP.md)
   Defines how BMad artifacts map to canonical product and engineering documents.

3. [../blueprint/README.md](../blueprint/README.md)
   Index for product, domain, architecture, data, API, roles, AI and roadmap.

4. [product/PHASE_STATUS.md](./product/PHASE_STATUS.md)
   Current implementation status, completed phases and known production blockers.

5. [architecture/ARCHITECTURE_OVERVIEW.md](./architecture/ARCHITECTURE_OVERVIEW.md)
   Finalized technical architecture overview.

6. [design/DESIGN_STANDARD.md](./design/DESIGN_STANDARD.md)
   Finalized product UI/UX and role workspace design rules.

7. [context/README.md](./context/README.md)
   Lean AI-agent context packs for implementation hot spots.

## 3. Current Status Snapshot

For completed work, current production blockers and recommended next work, use:

- [product/PHASE_STATUS.md](./product/PHASE_STATUS.md)

This status register is the canonical current-state summary. The roadmap explains intended phase sequencing; root MVP files preserve execution history.

## 4. Canonical Documents by Topic

| Topic | Canonical Document |
| --- | --- |
| Documentation ownership | `docs/DOCUMENTATION_STANDARD.md` |
| BMad artifact routing | `docs/BMAD_DOCUMENTATION_MAP.md` |
| Current phase status | `docs/product/PHASE_STATUS.md` |
| Product vision | `blueprint/00-product-vision.md` |
| Domain model | `blueprint/01-domain-blueprint.md` |
| Scalable architecture | `blueprint/02-scalable-architecture.md` |
| Data strategy | `blueprint/03-data-blueprint.md` |
| Roadmap | `blueprint/04-roadmap.md` |
| Agent rules | `blueprint/05-agent-operating-guide.md` |
| Product brief | `blueprint/06-product-brief.md` |
| Platform requirements | `blueprint/07-platform-requirements.md` |
| API contract | `blueprint/08-api-contract.md` |
| Data model | `blueprint/09-data-model.md` |
| Decision log | `blueprint/10-decision-log.md` |
| Task backlog | `blueprint/11-task-backlog.md` |
| Auth/roles/permissions | `blueprint/12-auth-roles-permissions.md` |
| Role workspaces | `blueprint/13-role-workspaces.md` |
| AI/RAG/MCP strategy | `blueprint/14-ai-assistant-strategy.md` |
| Tech stack | `docs/architecture/TECH_STACK.md` |
| Architecture overview | `docs/architecture/ARCHITECTURE_OVERVIEW.md` |
| Design standard | `docs/design/DESIGN_STANDARD.md` |
| AI agent context packs | `docs/context/README.md` |
| Team working principles | `docs/operations/WORKING_PRINCIPLES_BMAD.md` |
| Deployment | `docs/deployment/README.md` |
| Supabase validation | `docs/deployment/SUPABASE_STAGING_VALIDATION.md` |

## 5. Root Files

The root files are retained for sprint history and MVP execution reference. They are snapshots, not current long-term source-of-truth files:

- `requirement.md`
- `design.md`
- `architecture.md`
- `milestone.md`

Do not treat them as the long-term source of truth when they conflict with `blueprint/` or `docs/`. If they disagree, follow `docs/DOCUMENTATION_STANDARD.md`, `docs/product/PHASE_STATUS.md` and the relevant `blueprint/` document.

## 6. BMad Workflow

BMad artifacts live under `_bmad-output/`:

- `_bmad-output/planning-artifacts/` for requirement intake, PRD/UX/architecture planning, epics and readiness checks.
- `_bmad-output/implementation-artifacts/` for implementation specs, story work, checkpoints, investigations and reviews.

Use [BMAD_DOCUMENTATION_MAP.md](./BMAD_DOCUMENTATION_MAP.md) before creating or moving documentation.

## 7. Current Strategic Direction

GreenNest BuildFlow is not only a management app. It is being shaped as:

```text
AI ERP operating system for real-estate investment and construction delivery
-> company governance and internal approvals
-> structured project lifecycle data
-> role-based department workspaces
-> governed knowledge center
-> AI-assisted decision support
```

Any next implementation phase should keep product/design/architecture docs consistent with this direction.

Current strategic expansion:

- Keep the existing project operating core.
- Expand RBAC by business blocks: investment, project delivery, design/technical/construction, finance/accounting/contracts, HR/admin, audit/compliance and external collaborators.
- Make Internal Proposal and Approval the next central workflow before building deep finance, HR, investment or QA/safety modules.
