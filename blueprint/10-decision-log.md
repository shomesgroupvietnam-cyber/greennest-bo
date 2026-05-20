# 10 - Decision Log

This document records product and architecture decisions. Add new decisions as the project evolves.

## Decision Format

```text
ID:
Date:
Status:
Decision:
Context:
Consequences:
```

## DEC-001 - Product Name

Date: 2026-05-16  
Status: Accepted  
Decision: Use `GreenNest BuildFlow` as the product name.  
Context: The master blueprint defines this name as the platform identity.  
Consequences: Code, UI, docs and prompts should not rename the product without explicit owner approval.

## DEC-002 - Build As Web App First

Date: 2026-05-16  
Status: Accepted  
Decision: Build as a responsive web app first, not native mobile apps.  
Context: Primary users operate from desktop/laptop, while mobile is needed for quick review and updates.  
Consequences: Use responsive web layout. Native mobile remains future scope.

## DEC-003 - Use TypeScript As Primary Language

Date: 2026-05-16  
Status: Accepted  
Decision: Use TypeScript for frontend and backend application code.  
Context: The project benefits from shared types, Next.js ecosystem and fast MVP delivery.  
Consequences: Backend starts with Next.js Server Actions/API routes. Future dedicated backend should prefer NestJS + TypeScript.

## DEC-004 - Start With Modular Monolith

Date: 2026-05-16  
Status: Accepted  
Decision: Start as a modular monolith with clear module boundaries.  
Context: The system has many domains but does not need microservices complexity early.  
Consequences: Keep modules separated by domain and use service contracts. Extract services only when scaling triggers appear.

## DEC-005 - Project Is The Central Entity

Date: 2026-05-16  
Status: Accepted  
Decision: Project is the central container for operational data.  
Context: The product manages housing development projects through legal, documents, tasks, design, construction and finance.  
Consequences: Most operational tables need `project_id`.

## DEC-006 - PostgreSQL As Core Database

Date: 2026-05-16  
Status: Accepted  
Decision: Use PostgreSQL as the core relational database.  
Context: The domain is relational and requires consistency across projects, tasks, documents, legal steps and finance.  
Consequences: Supabase PostgreSQL is recommended for MVP; Prisma or SQL migrations may be used depending on implementation.

## DEC-007 - Supabase Recommended For MVP Infrastructure

Date: 2026-05-16  
Status: Accepted  
Decision: Use Supabase for Auth, PostgreSQL and Storage in MVP unless owner chooses another stack.  
Context: Supabase reduces backend setup time and supports MVP needs.  
Consequences: Architecture must keep service layer clean so Supabase can be replaced or supplemented later.

## DEC-008 - Vietnamese-first UI

Date: 2026-05-16  
Status: Accepted  
Decision: Build UI in Vietnamese first.  
Context: Initial users are Vietnamese project/founder teams.  
Consequences: Internal enum keys should stay language-neutral for future localization.

## DEC-009 - AI Is Advisory

Date: 2026-05-16  
Status: Accepted  
Decision: AI can recommend and draft, but cannot make final legal, financial or project decisions.  
Context: Project/legal/finance decisions are high-impact and require human accountability.  
Consequences: AI mutations require user confirmation and source context where possible.

## DEC-010 - Soft Delete Main Business Records

Date: 2026-05-16  
Status: Accepted  
Decision: Use archive/soft delete for main business records.  
Context: Project data, documents, decisions and audit records may be needed later.  
Consequences: Add `archived_at` where appropriate and filter archived records by default.

## DEC-011 - Scalable Role-based Access Control

Date: 2026-05-16  
Status: Accepted  
Decision: Use scalable RBAC with system roles, workspace membership, project membership and centralized permission keys.  
Context: The product must support Admin, Tổng giám đốc, Phó tổng giám đốc, Giám đốc dự án, Quản lý dự án, Tổ trưởng, Kế toán, Thiết kế, Pháp lý, Thi công, external collaborators and future roles without rewriting authorization logic.  
Consequences: Implement `can(user, action, resource)` and avoid scattered role-name checks in UI/components. Role-specific dashboards and navigation are derived from resolved permissions. See `12-auth-roles-permissions.md`.

## DEC-012 - Documentation Source-of-truth Standard

Date: 2026-05-17  
Status: Accepted  
Decision: Use `blueprint/` as the long-term product/platform source of truth, `docs/` for engineering operations and root-level MVP files as sprint execution snapshots.  
Context: The repo now has blueprint, docs and root execution documents that can overlap if ownership is unclear.  
Consequences: New strategic product, AI, role, data and architecture decisions go into `blueprint/`. Development/deployment instructions go into `docs/`. Root files should stay concise and link to source documents. See `docs/DOCUMENTATION_STANDARD.md`.

## DEC-013 - AI Knowledge Governance Before RAG

Date: 2026-05-17  
Status: Accepted  
Decision: External AI sources, including MCP Web Search, must pass through Knowledge Center intake, manual review and approval before becoming authoritative RAG context.  
Context: GreenNest BuildFlow AI Assistant will support legal, design, construction, finance, document, meeting, report and contractor workflows. Raw external search results are not safe enough for official business answers.  
Consequences: AI modules use approved knowledge, internal structured data, permission-aware retrieval, citations and human confirmation before mutations. See `14-ai-assistant-strategy.md`.

## DEC-014 - AI RBAC and Knowledge Promotion

Date: 2026-05-17  
Status: Accepted  
Decision: AI requests must obey the same RBAC and access-scope model as normal app screens, and chat/search/upload content can become authoritative knowledge only through Knowledge Candidate submission, promotion, review, approval and indexing.  
Context: The platform is adding AI/RAG, web search intake and Knowledge Center workflows across legal, documents, meetings, reports, design, construction and finance. Users may assume that LLM chat, search results or uploads are automatically learned by the system unless the governance rule is explicit.  
Consequences: AI cannot bypass role, project, ownership or external-user scope. LLMs do not automatically learn from user conversations, search results or uploads. Only approved Knowledge Center items can enter authoritative RAG, and AI-proposed mutations require human confirmation plus the normal server-side domain permission check. See `12-auth-roles-permissions.md` and `14-ai-assistant-strategy.md`.

## DEC-015 - AI Gateway and Distributed Job Processing

Date: 2026-05-17  
Status: Accepted  
Decision: AI requests must enter through an AI Gateway that can either stream small read-only answers or create durable `ai_jobs` for background worker processing.  
Context: Future AI features will include module assistants, report drafts, long-running retrieval, document processing, citations and human-confirmed action proposals. Direct model calls from UI or module services would make permission checks, rate limits, auditing and multi-user isolation inconsistent.  
Consequences: AI Gateway owns request authorization, rate limiting, interaction creation and streaming-vs-background routing. AI workers must re-check live permission and scope before retrieving data or producing results, because queued jobs may run after role/project membership changes. AI responses, citations and action proposals are persisted in `ai_interactions`, `ai_jobs`, `ai_citations` and `ai_action_proposals`; proposed mutations still execute only through normal domain APIs after human confirmation. See `14-ai-assistant-strategy.md`, `09-data-model.md` and `08-api-contract.md`.

## DEC-016 - One Coordinator AI Agent Initially

Date: 2026-05-17  
Status: Accepted  
Decision: Start with one Coordinator AI agent that uses many permission-aware module tools, retrievers and context builders, instead of separate autonomous agents per module.  
Context: GreenNest BuildFlow needs AI support across projects, legal, documents, tasks, meetings, reports, design, construction and finance. Separate autonomous agents would add coordination, authorization, audit and consistency complexity before the product has proven the need for that distribution.  
Consequences: Module AIs are implemented as Coordinator modes/tool configurations for now. The Coordinator handles intent routing, module context assembly, cross-module reasoning and action proposal planning, while each retriever still enforces the current user's permission and resource scope before any context reaches the model. Future specialized autonomous agents remain possible after clear scale or operational triggers. See `14-ai-assistant-strategy.md` and `docs/architecture/ARCHITECTURE_OVERVIEW.md`.

## DEC-017 - AI Action Proposals Execute Only Through Domain Services

Date: 2026-05-17  
Status: Accepted  
Decision: AI action proposals may be accepted or rejected by users, but accepted proposals must execute only through normal domain services/actions with fresh permission and scope checks.  
Context: The AI Coordinator can propose tasks, document update requests, legal follow-ups or meeting action items. Direct AI writes to business tables would bypass domain validation, audit expectations and RBAC.  
Consequences: `ai_action_proposals` store proposed payloads and lifecycle status. Accepting a proposal requires `ai.confirm_action`, the proposal's required domain permission and current resource scope. Rejection creates no business mutation. Execution metadata and audit records link back to the original AI interaction/proposal.

## DEC-018 - Enterprise Governance Through Internal Proposal and Approval

Date: 2026-05-19  
Status: Accepted  
Decision: Treat Internal Proposal and Approval as the next shared enterprise workflow backbone before building deep finance, investment, HR, contract, QA/QC or safety modules.  
Context: The updated authorization blueprint expands GreenNest BuildFlow from a project operating system toward an AI ERP operating system for investment, construction and real-estate development. Adding isolated department modules without a shared approval model would create duplicated workflows and inconsistent audit behavior.  
Consequences: The next strategic implementation should expand RBAC with first-wave enterprise roles, add proposal/approval permission keys and build a proposal module that can link to project, document, legal, finance, contract, investment, HR, quality and safety records. AI may review proposals and suggest approval routes, but human approval remains mandatory.
