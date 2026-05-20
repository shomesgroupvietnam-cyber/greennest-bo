# 04 - Roadmap

## 1. Roadmap Philosophy

GreenNest BuildFlow should be delivered in controlled phases. Each phase must produce usable value while strengthening the foundation for the next phase.

Do not build every module at once. Build the project spine first, then add domain depth.

Current priority as of 2026-05-19:

```text
Knowledge Center, AI Coordinator, provider MVP, governed Web Search intake and Discovery Scheduler foundation are implemented at foundation level.
The next strategic product direction is Enterprise Governance: RBAC expansion plus Internal Proposal and Approval as the operating backbone.
```

## 2. Phase 0 - Foundation

Status: Completed.

Goal:

- Establish repository, architecture, UI shell, auth skeleton and core module boundaries.

Deliverables:

- Next.js + TypeScript setup.
- Tailwind + shadcn/ui.
- App layout.
- Route skeleton.
- Constants for roles and statuses.
- Mock service structure.
- Documentation and README.

Exit criteria:

- App runs locally.
- Main routes exist.
- Agent can start Sprint 1 without restructuring.

## 3. Phase 1 - MVP V1: Project Operating Core

Status: Completed.

Goal:

- Make the product usable for project, task, document, legal checklist and dashboard tracking.

Modules:

- Project Core.
- Task Management.
- Document Center.
- Legal Checklist Lite.
- Dashboard.
- Users & Roles Basic.
- Role Permissions & Workspaces.
- Sprint 8B external scope hardening.

Exit criteria:

- Real users can create projects and track key work.
- Dashboard shows real project-derived metrics.
- Data persists.
- Basic access control exists.
- Role-specific screens and permission-aware navigation exist for internal and external roles.

## 4. Phase 1.5 - Production Foundation

Status: Foundation assets completed; live staging validation still required.

Goal:

- Prepare MVP for Supabase-backed production architecture while preserving mock/local development.

Completed:

- Supabase schema migrations.
- Role and permission seed SQL.
- Initial RLS policy assets.
- Repository mode switch.
- Supabase repository adapters.
- Sprint 8A Supabase staging validation assets.
- Sprint 8C external isolation RLS validation assets.

Remaining:

- Apply and test against live staging Supabase.
- Validate real authenticated users and project memberships.
- Validate storage upload/download policies when real upload is implemented.

## 5. Phase 2 - Operational Depth

Status: Sprint 1-4 completed; remaining operational depth work is below.

Goal:

- Turn MVP into a daily operating tool for PM, legal and assistant teams.

Completed:

- Sprint 1 - Meeting notes, decisions and action-item to task conversion.
- Sprint 2 - Document requirements by project type and project document readiness.
- Sprint 3 - Document approval metadata, workflow and storage readiness.
- Sprint 4 - Reporting Lite with stored snapshots.
- Knowledge Center Foundation - governed source intake, review/approval workflow and RAG eligibility metadata.
- Knowledge Center RAG Indexing Foundation - approved-only text chunks, citations and permission-aware retrieval boundary.
- Knowledge Embeddings/Vector Retrieval Adapter - provider interfaces, mock embeddings, topK retrieval and context boundary.
- MCP Web Search Intake Foundation - mock provider, candidate normalization, pending-review imports and search logs.
- Real Web Search Provider Integration - config-gated Tavily adapter, provider metadata, provider error classification and duplicate URL detection.
- BO-managed Web Search Source Registry - `/settings` UI, mock persistence, Supabase-ready `source_registry_entries` table and RLS.
- Discovery Scheduler / Queue Automation Foundation - due-topic selection, soft locks, retry metadata, manual scheduler script, allowlist/duplicate filtering, pending-review Knowledge Candidate imports and run logs.

Remaining:

- Hosted cron wiring through Vercel Cron, GitHub Actions or server cron.
- Operational notifications.
- Legal submissions and authority responses.
- Audit log UI.
- Report export hardening.
- Report templates and portfolio-level reporting.

Exit criteria:

- Weekly project meeting can be run through the system.
- Decisions become tracked actions.
- Legal/document readiness is clearer.
- Reports can be generated as snapshots.

## 6. Documentation Finalization Checkpoint

Status: Current active priority.

Goal:

- Stabilize product, design and architecture docs before continuing feature work.

Required documents:

- `docs/DOCS_INDEX.md`.
- `docs/DOCUMENTATION_STANDARD.md`.
- `docs/product/PHASE_STATUS.md`.
- `docs/architecture/ARCHITECTURE_OVERVIEW.md`.
- `docs/design/DESIGN_STANDARD.md`.
- `blueprint/14-ai-assistant-strategy.md`.

Exit criteria:

- Source-of-truth hierarchy is clear.
- Root MVP docs are marked as snapshots.
- Blueprint owns long-term direction.
- Design and architecture standards are clear enough for future implementation agents.
- AI/RAG/MCP strategy is standardized.

## 7. Enterprise Governance Checkpoint - RBAC Expansion and Internal Proposal Approval

Goal:

- Expand GreenNest from a project operating tool into an AI ERP operating system with company-level governance.
- Add the missing business blocks from the new authorization blueprint before deep module implementation.
- Establish Internal Proposal and Approval as the shared workflow for investment, finance, contracts, legal, design, construction, HR and executive decisions.

Implementation order:

1. Documentation and RBAC expansion. Completed.
2. Role constants, permission keys, workspace definitions and tests. Completed.
3. Proposal and Approval module foundation. Completed at mock/Supabase-schema foundation level.
4. AI-assisted proposal review. Next.
5. Finance/contract split. Future.
6. Investment development. Future.
7. HR/admin. Future.
8. QA/QC and safety. Future.

Roles added in code first:

- `dau_tu_phat_trien`.
- `quan_ly_tai_chinh`.
- `hanh_chinh_nhan_su`.
- `qa_qc_chat_luong`.
- `an_toan_lao_dong`.
- `kiem_toan_noi_bo`.
- `quan_ly_hop_dong`.

Roles to keep as planned/pending decision until the related module is clearer:

- `quy_hoach`.
- `quan_he_doi_ngoai`.
- `van_thu_luu_tru`.
- `compliance`.
- `doi_tac`.

Proposal module scope:

- Create proposal. Implemented.
- AI preliminary check. Future.
- Internal review. Implemented.
- Request changes. Implemented.
- Route to approval level. Foundation implemented with one default review step; configurable routing is future work.
- Approve/reject. Implemented.
- Link to project, document, task, legal step, meeting, report, contract, payment or investment opportunity. Foundation implemented through generic proposal links.
- Persist decisions and audit trail. Decision persistence implemented; audit integration remains basic.

Exit criteria:

- New roles and permissions are documented and covered by tests.
- Each new role has a default workspace direction, even if the module is placeholder.
- Proposal workflow can handle at least project, document, legal and finance/contract-related proposal types.
- AI can review and summarize a proposal but cannot approve it.

## 7.1 Phase 3 - Legal Intelligence Center V2

Status: Future phase. Must follow or run alongside the Enterprise Governance checkpoint when approval workflows are needed.

Goal:

- Expand Legal from checklist tracking into a governed legal intelligence center.

Modules:

- Legal source registry.
- Legal knowledge library.
- Legal source intake and review.
- Legal approval workflow for knowledge.
- Legal submissions and authority responses.
- Legal requirement mapping by project type/jurisdiction.
- AI legal assistant foundation through approved RAG.

Exit criteria:

- Legal knowledge is reviewed and approved before use.
- Legal steps can link to requirements, documents, sources and submissions.
- AI legal answers cite approved sources and project records.

## 8. Phase 4 - Design and Pre-construction

Goal:

- Manage design readiness before construction.

Modules:

- Design packages.
- Drawing register.
- Design review.
- Design issues.
- Design changes.
- Review/approval workflow.

Exit criteria:

- Design packages can be tracked by status.
- Issues and changes are visible to PM/founder.
- Drawings/documents have version control.

## 9. Phase 5 - Construction Execution

Goal:

- Track project execution on site.

Modules:

- Construction packages.
- Contractor management.
- Master schedule and schedule items.
- Site diary.
- Quality checklists.
- Inspection records.
- Acceptance records.
- Change orders.
- Safety observations.

Exit criteria:

- Construction progress can be monitored.
- Quality and acceptance records are structured.
- Contractor responsibilities are visible.

## 10. Phase 6 - Finance and Commercial Control

Goal:

- Add financial visibility and commercial control.

Modules:

- Budget.
- Budget lines.
- Contracts.
- Commitments.
- Payment requests.
- Invoices.
- Actual costs.
- Cash flow plan.
- Budget variance dashboard.

Exit criteria:

- Founder can see budget vs actual.
- Payment requests can be linked to contracts/acceptance.
- Financial risks are visible.

## 11. Phase 7 - Reporting and Executive Intelligence

Goal:

- Build a real management reporting layer.

Current state:

- Reporting Lite is complete in Phase 2 Sprint 4.
- This phase is for advanced reporting beyond the current snapshot generator.

Modules:

- Report templates.
- Weekly/monthly report generation.
- Metric snapshots.
- Portfolio dashboard.
- Risk dashboard.
- Historical comparison.

Exit criteria:

- Reports can be generated from data.
- Historical snapshots are preserved.
- Executives can compare projects.

## 12. Phase 8 - AI Assistance and Knowledge Center

Goal:

- Add AI features on top of structured and permissioned project data.

Current state:

- AI/RAG/MCP strategy is documented in `blueprint/14-ai-assistant-strategy.md`.
- AI job foundation, Coordinator service boundary, model provider MVP, prompt hardening and response citation guard are implemented.
- Knowledge Center Foundation has been pulled forward as governed source and RAG control.
- Approved-only text chunk indexing and retrieval boundary exist.
- Embedding provider/vector retrieval adapter interfaces and OpenAI-compatible embedding boundary exist.
- Controlled MCP/Web Search intake exists with mock fallback and config-gated Tavily adapter.
- Discovery Scheduler foundation exists; hosted cron wiring, pgvector DB-side ANN search and live provider/staging validation are not complete yet.

Capabilities:

- Knowledge Center.
- MCP Web Search intake.
- Manual review and approval.
- Approved RAG index.
- Draft weekly reports.
- Summarize meetings.
- Extract action items.
- Suggest missing documents.
- Detect legal/project risks.
- Recommend priority work.
- Ask questions about project state.

Exit criteria:

- AI cites source project data.
- AI cites approved knowledge sources.
- AI does not mutate data without confirmation.
- AI respects permissions.

## 13. Phase 9 - Enterprise and Integrations

Goal:

- Prepare for larger organizations and external systems.

Capabilities:

- Advanced RBAC.
- Workspace/team structure.
- External collaborator portal.
- Calendar/email integration.
- Accounting integration.
- E-signature integration.
- Document OCR pipeline.
- Advanced audit/compliance.

Exit criteria:

- Larger teams can safely use the system.
- External systems can sync through adapters.
- Security and audit controls are mature.

## 14. Milestone Gate Checklist

Before moving to the next phase:

- Current phase acceptance criteria pass.
- Data model supports next phase without large rewrite.
- UI is stable on desktop and mobile.
- Permission model covers new actions.
- Tests cover critical flows.
- Documentation is updated.
- Known gaps are listed explicitly.
