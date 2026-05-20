# Product Phase Status

## 1. Purpose

This document records what has been implemented and what remains as design/architecture or production hardening work.

It is not a sprint plan. It is a status register to prevent teams and agents from accidentally rebuilding completed work or assuming production readiness where only mock/staging assets exist.

## 2. Completed Implementation Areas

### Phase 0 - Foundation

Status: Completed.

Completed:

- Next.js + TypeScript foundation.
- Tailwind/shadcn-ready structure.
- App layout and route skeleton.
- Module folder structure.
- Mock session foundation.
- Test setup.

### Phase 1 - Project Operating Core

Status: Completed as MVP/core implementation.

Completed:

- Sprint 1 - Project Core.
- Sprint 2 - Task Management.
- Sprint 2.5 - Auth/RBAC alignment.
- Sprint 3 - Document Center.
- Sprint 4 - Legal Checklist Lite.
- Sprint 5 - Dashboard.
- Sprint 6 - Auth/Users/Roles Basic.
- Sprint 7 - QA & Polish.
- Sprint 8 - Role Permissions & Workspaces.
- Sprint 8B - External Scope Hardening.

### Phase 1.5 - Supabase Production Foundation

Status: Foundation and validation assets completed; live staging validation still required.

Completed:

- Supabase production foundation assets.
- Sprint 8A - Supabase Staging Validation assets.
- Sprint 8C - Supabase RLS External Isolation Validation assets.

Important note:

- Auth/RBAC and external scoping exist in app-level implementation and SQL assets, but live Supabase staging validation is still required before production external-user rollout.

### Phase 2 - Operational Depth

Status: Partially completed.

Completed:

- Sprint 1 - Meetings & Decisions.
- Sprint 2 - Document Requirements by Project Type.
- Sprint 3 - Document Approval & Storage Readiness.
- Sprint 4 - Reporting Lite.
- Knowledge Center Foundation.
- Knowledge Center RAG Indexing foundation.
- Knowledge Center embeddings/vector retrieval adapter foundation.
- MCP Web Search Intake Foundation.
- Real Web Search provider integration with config-gated Tavily adapter.
- BO-managed Web Search Source Registry settings.
- Discovery Scheduler / Queue Automation foundation with due-topic selection, soft locks, retry metadata, manual runner script, run logs and pending-review candidate imports.
- AI Assistant UX Simplification for business roles.
- Enterprise Governance RBAC Expansion for the first 7 business-block roles.
- Internal Proposal/Approval Module foundation.

Known gaps:

- Report export is print-friendly/placeholder, not PDF/DOCX.
- Notifications are not implemented.
- Legal submissions/authority responses are not yet a full workflow.
- Audit log UI is not complete.
- Knowledge Center has approved-only text chunk indexing/retrieval, vector adapter boundaries, controlled external-source intake with mock fallback/config-gated Tavily, duplicate URL detection, BO-managed source registry settings and Discovery Scheduler foundation. Hosted cron wiring, pgvector DB-side semantic indexing and live provider/staging validation still require hardening.

## 3. Production Readiness Status

Ready for local/internal review:

- Project/task/document/legal/dashboard.
- Role workspaces.
- Meetings/decisions.
- Document requirements/readiness.
- Document approval metadata.
- Reporting Lite.
- Knowledge Center source governance and review workflow.
- Knowledge Center approved-only text chunk indexing and retrieval boundary.
- Knowledge Center mock embedding/vector retrieval adapter for local tests.
- Knowledge Center external source intake with mock fallback/config-gated Tavily into manual review.
- Config-gated Tavily provider adapter for real Web Search.
- BO settings UI for Web Search source registry allowlist.
- Knowledge Discovery topic UI, manual Run Now, manual due-topic scheduler script, mock/Supabase-ready persistence, soft locks, retry metadata and run logs.
- `/ai` user-facing Trợ lý AI screen with business presets, project dropdown, fast default mode, friendly result labels and admin-only technical details.
- AI action proposal accept/reject execution path with domain-service execution, permission re-check and business-friendly proposal review UI.
- First-wave Enterprise Governance workspaces for investment development, finance management, HR/admin, QA/QC, safety, internal audit and contract management.
- `/proposals` shared internal proposal workflow with create/list/detail, submit, request-change, approve and reject actions using file-backed mock persistence and Supabase schema/RLS assets.

Not production-ready yet:

- Live Supabase RLS validation.
- Real Supabase Storage upload/download.
- Production invitation email flow.
- External contractor/consultant rollout.
- PDF/DOCX report export.
- Hosted cron wiring for Scheduled Web Discovery, production pgvector DB-side semantic search and live provider/staging validation.
- Proposal workflow Supabase repository/live RLS validation and configurable approval-flow routing are not complete yet.

## 4. Current Documentation Priority

Current priority:

```text
Harden the Enterprise Governance proposal workflow before deep finance, investment, contract, HR, QA/QC and safety modules.
```

Before deep module implementation, keep these docs current:

- `docs/DOCS_INDEX.md` is current.
- `docs/DOCUMENTATION_STANDARD.md` is followed.
- `docs/design/DESIGN_STANDARD.md` reflects intended UI direction.
- `docs/architecture/ARCHITECTURE_OVERVIEW.md` reflects intended technical architecture.
- `blueprint/04-roadmap.md` reflects completed and future phases.
- `blueprint/14-ai-assistant-strategy.md` reflects AI/RAG governance.
- `blueprint/12-auth-roles-permissions.md` reflects the proposed business-block RBAC expansion.
- Internal Proposal and Approval remains the shared workflow backbone for cross-department requests.

## 5. Recommended Next Work After Documentation Finalization

Choose one:

1. Proposal approval-flow configuration and Supabase repository validation.
2. AI-assisted proposal review summary and risk checklist.
3. Hosted cron wiring for Scheduled Web Discovery.
4. Live Supabase staging validation.
5. Operational Notifications.
6. Report Export Hardening.
7. Legal Intelligence Center V2.

Recommendation:

- If continuing Enterprise Governance: harden Proposal/Approval first, then split finance/contract/investment modules.
- If preparing for internal use without the ERP expansion: Operational Notifications.
- If preparing for executive/board reporting: Report Export Hardening.
- If preparing for AI/legal intelligence: hosted cron wiring for Scheduled Web Discovery, production embedding/pgvector rollout, then Legal Intelligence Center V2.
