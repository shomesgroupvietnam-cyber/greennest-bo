# 14 - AI Assistant Strategy

## 1. Purpose

GreenNest BuildFlow AI Assistant is not a generic chatbot. It is a permission-aware decision support layer embedded into each business module.

The assistant combines:

- Internal structured data.
- Approved knowledge library.
- Module-specific retrieval policy.
- Citations.
- Human review and confirmation before mutations.

## 2. Core Principle

AI must not use raw external search results as official answers.

LLMs do not automatically learn from GreenNest chat messages, web searches, uploaded files, meeting notes, document metadata or user prompts. These inputs may be used as temporary working context for the current request only when the user has permission to access them.

Information becomes governed product knowledge only after it is explicitly submitted or promoted into the Knowledge Center, reviewed, approved and indexed. Conversation history, search results and uploads are not authoritative knowledge by default.

External sources must pass through a governance pipeline:

```text
External Source
-> Intake
-> Normalize
-> Classify
-> Knowledge Candidate
-> Manual Review
-> Approve
-> Index/RAG
-> Module AI Assistant
-> Human-confirmed action
```

This applies to every module, not only Legal.

## 3. Knowledge Center

Create a shared `Knowledge Center` instead of separate one-off libraries.

Responsibilities:

- Source registry.
- Source intake.
- Review queue.
- Approved library.
- RAG index.
- Citations.
- Module knowledge packs.
- Expiry/superseded tracking.

Knowledge item model:

```ts
type KnowledgeItem = {
  id: string;
  title: string;
  sourceUrl?: string;
  sourceFileId?: string;
  sourceType:
    | "law"
    | "standard"
    | "template"
    | "policy"
    | "contract"
    | "technical_guideline"
    | "market"
    | "internal_note";
  module:
    | "legal"
    | "design"
    | "construction"
    | "finance"
    | "documents"
    | "meetings"
    | "reports"
    | "project"
    | "general";
  jurisdiction?: string;
  effectiveDate?: string;
  expiryDate?: string;
  status:
    | "discovered"
    | "imported"
    | "pending_review"
    | "approved"
    | "rejected"
    | "expired"
    | "superseded";
  reviewedBy?: string;
  approvedBy?: string;
  confidence: "official" | "internal_approved" | "external_reference" | "unknown";
  tags: string[];
};
```

Only reviewed and `approved` Knowledge Center items should enter the main authoritative RAG index.

### Knowledge Candidate and Promotion Workflow

A Knowledge Candidate is a proposed source or insight that is not yet authoritative.

Candidate sources can come from:

- User chat or AI draft output.
- MCP Web Search intake.
- Uploaded files.
- Document Center records.
- Meeting notes and decisions.
- Manual source entry.

Promotion workflow:

```text
Working context or external source
-> Submit as Knowledge Candidate
-> Store source, module, provenance, confidence and tags
-> Reviewer checks source quality and business relevance
-> Promote to Knowledge
-> Knowledge item enters pending_review
-> Domain reviewer approves or rejects
-> Approved item becomes eligible for indexing
-> Indexed chunks become available to authoritative RAG
```

Rules:

- Candidates are not authoritative.
- Candidates are not RAG-eligible until approved.
- Rejected, pending, expired and superseded items must not be used for normal authoritative answers.
- Review-mode screens may display candidates and unapproved sources, but they must be clearly labeled as unapproved.
- Promoting a candidate records provenance so citations can show the original source.

## 4. External Source Intake

External intake can come from:

- MCP Web Search.
- Government/legal portals.
- Ministry/province websites.
- Google Drive/SharePoint.
- Uploaded files.
- Manual source entry.
- Internal SOP/template uploads.
- Future ERP/accounting/CAD/BIM integrations.

MCP Web Search should be treated as a discovery source, not an authority by itself.

Scheduled Web Discovery Jobs use the same governed intake boundary. A discovery topic stores module, query, enabled state, intended frequency, owner/reviewer, retry metadata, soft-lock metadata and last-run metadata. The current implementation supports manual Run Now plus a manual scheduler runner for due enabled daily/weekly topics; hosted cron wiring remains a deployment step.

Recommended flow:

```text
Scheduled or manual Web Search MCP
-> Candidate source
-> Normalize metadata
-> Apply source registry allowlist and duplicate URL detection
-> Knowledge Center: pending_review
-> Domain reviewer approves/rejects
-> Approved source indexed
-> Module AI uses approved RAG
```

## 5. Review and Approval

| Module | Reviewer |
| --- | --- |
| Legal | Legal Manager / Admin |
| Design | Design Lead / Technical Manager |
| Construction | Construction Manager / Technical Manager |
| Finance | Chief Accountant / Finance Manager |
| Documents | PM / Document Controller / Legal where relevant |
| Meetings/Reports | PM / Assistant / Executive |
| Contractor guidance | PM / Construction / Procurement |

Review checks:

- Source is trusted.
- Source is current/effective.
- Summary is accurate.
- Applicable project type/jurisdiction is tagged.
- Expired/superseded status is known.
- Sensitive/internal access level is set.

## 6. RAG Architecture

Recommended implementation:

```text
Module AI UI
-> AI Assistant service
-> intent classifier
-> permission and scope resolver
-> structured data retriever
-> approved knowledge retriever
-> context builder
-> model provider
-> cited response
-> optional human-confirmed action
```

Permission-aware AI flow:

```text
User request
-> Resolve session, role, project memberships and external scope
-> Check ai.use and module permission
-> Check resource access before retrieval
-> Retrieve allowed structured records
-> Retrieve approved knowledge chunks only
-> Build cited context within scope
-> Call model provider
-> Return answer with citations and caveats
-> If mutation is proposed, require human confirmation
-> Re-check domain mutation permission on server
-> Execute mutation and audit accepted action
```

AI must never receive records or knowledge chunks the current user could not view directly through the app. AI cannot bypass role permissions, project membership, resource ownership or external-user scope.

### User-Facing AI Assistant UX

The default `/ai` experience should be labeled `Trợ lý AI`, not `AI Gateway`.

For non-technical roles such as kế toán, pháp lý, trợ lý, tổ trưởng and nhà thầu:

- Use role/module presets instead of exposing intent routing, job mode, priority or raw `projectId`.
- Select projects by code and name from the user's scoped project list.
- Default to fast processing for normal questions.
- Enable approved RAG by default only when the current role has `ai.use_rag`.
- Create action proposals only when the user explicitly chooses `Đề xuất việc cần làm`.
- Show answer pages with business labels: `Câu hỏi`, `Kết quả`, `Nguồn tham chiếu`, `Đề xuất cần duyệt`, `Trạng thái xử lý`.
- If background processing is still pending, show `Đang xử lý` and a friendly retry action, not worker/job language.
- Keep technical details such as rate-limit key, mode, priority and raw payload behind an admin/super_admin-only disclosure.

The gateway, interaction, job and worker architecture remains the internal implementation boundary.

Data tables to prepare:

```text
knowledge_items
knowledge_chunks
knowledge_reviews
knowledge_citations
ai_interactions
ai_jobs
ai_citations
ai_action_proposals
external_search_logs
```

Chunk table option:

```text
knowledge_chunks
- id
- knowledge_item_id
- module
- project_id nullable
- source_type
- chunk_text
- embedding
- status
- effective_date
- expires_at
- access_level
```

## 7. Retrieval Policy

Every AI request must follow:

```text
1. Identify module intent.
2. Check user permission.
3. Resolve project/resource scope.
4. Select allowed knowledge modules.
5. Retrieve approved knowledge chunks.
6. Retrieve internal structured data.
7. Generate answer with citations.
8. Require confirmation for mutations.
```

No answer should cite sources outside the user's access scope.

Conversation, search and upload data remain non-persistent working context unless a permitted user explicitly submits them as a Knowledge Candidate. They do not become training data, product knowledge or authoritative RAG context automatically.

## 8. Distributed AI Job Architecture

AI should be exposed through an AI Gateway, not by allowing UI components or module services to call model providers directly.

### Coordinator AI Layer

GreenNest BuildFlow starts with one Coordinator AI agent, not many autonomous module agents.

The Coordinator AI is responsible for:

- Receiving authorized AI requests from the AI Gateway.
- Classifying user intent.
- Selecting the correct module mode.
- Assembling permission-aware context from structured data and approved Knowledge Center chunks.
- Reasoning across modules when the user is allowed to view all referenced records.
- Producing cited answers, draft content or action proposals.
- Never executing mutations directly.

The initial architecture is:

```text
User / Module UI
-> AI Gateway
-> Coordinator AI
   -> Intent router
   -> Permission and scope resolver
   -> Module context builders
   -> Structured-data retrievers
   -> Approved Knowledge retrievers
   -> Action proposal planner
-> Cited answer or proposed action
-> Human confirmation path
```

There can be many module-specific tools and retrieval modes, but they are not separate autonomous agents for now.

Examples:

- Project mode retrieves project profile, tasks, documents, legal steps, meetings and reports.
- Legal mode retrieves legal checklist, legal documents and approved legal knowledge.
- Document mode retrieves document metadata, approval history, requirement templates and approved document SOP.
- Meeting mode retrieves meetings, decisions, existing tasks and templates.
- Report mode retrieves report snapshots, dashboard metrics and approved report templates.
- Design, Construction and Finance modes are future tool modes using the same Coordinator AI boundary.

Intent routing should choose a primary module mode and optional supporting modules. For example, "Why is this project blocked?" may route to Project mode with Legal, Documents, Tasks and Meetings as supporting retrievers. The Coordinator can reason across modules only after each retriever has applied the current user's permission, project membership, ownership and external-user scope.

Module context assembly must be deterministic before the LLM call:

```text
Intent
-> Primary module
-> Supporting modules
-> Permission/scope filter per module
-> Structured records
-> Approved knowledge chunks
-> Citation metadata
-> Bounded prompt/context package
```

Action proposal planning is also centralized. The Coordinator may draft a proposed task, document update request, meeting action item, report outline or legal follow-up, but it stores the proposal as `ai_action_proposals` only. Accepting the proposal must call the normal domain service and re-check the domain permission server-side.

Future versions may introduce specialized autonomous agents if operational complexity requires it, but the current product decision is one Coordinator AI with permission-aware tools/retrievers. This keeps RBAC, scope filtering, citations, audit logs and action confirmation consistent while the platform is still a modular monolith.

### AI Gateway

Responsibilities:

- Accept AI requests from module UIs and APIs.
- Resolve current session, workspace, project, module and resource scope.
- Check `ai.use`, module permissions and resource access before creating work.
- Decide whether the request can use fast streaming mode or must be queued.
- Create `ai_interactions` and, when needed, `ai_jobs`.
- Apply rate limits by user, role, workspace, project and external role.
- Persist final response metadata, citations and action proposals.
- Never persist chat/search/upload content as Knowledge unless the user submits it as Knowledge Candidate.

### `ai_jobs` Queue Model

`ai_jobs` is the durable work queue for background AI tasks.

Each job stores:

- `id`.
- `interaction_id`.
- `requested_by`.
- `workspace_id`.
- `project_id` nullable.
- `module`.
- `intent`.
- `mode`: `streaming` or `background`.
- `priority`: `low`, `normal`, `high`, `urgent`.
- `status`: `queued`, `running`, `succeeded`, `failed`, `cancelled`, `expired`.
- `scope_snapshot`: user role, permissions, workspace/project memberships, external scope, resource ids and module access at request time.
- `rate_limit_key`: normalized key for user/role/workspace/project/external-role throttling.
- `payload_ref` or sanitized request payload.
- `result_ref` or persisted result summary.
- `error_code`, `error_message`.
- `locked_by`, `locked_at`.
- `started_at`, `finished_at`.
- `created_at`, `updated_at`.

The scope snapshot is not authorization by itself. It is an audit and reproducibility record. Workers must re-check live permissions before retrieving data or executing proposals.

### AI Worker Pool

Workers process queued jobs and may run in Vercel background functions, Supabase Edge Functions, a Node worker process, or a future dedicated queue worker.

Worker responsibilities:

- Claim jobs safely using status/lock fields.
- Re-load current user, role, permissions and project/resource scope.
- Compare current scope with the stored scope snapshot and deny if access has been revoked or narrowed.
- Retrieve only permitted structured records.
- Retrieve only approved, in-scope Knowledge chunks.
- Call the configured model provider or deterministic placeholder.
- Persist response, citations and action proposals.
- Mark job status and errors.
- Respect retry limits, cancellation and expiry.

Permission re-check is mandatory inside the worker because queued jobs may run after a user's role, project membership or external assignment changes.

### Rate Limiting and Isolation

Rate limits must be enforced before job creation and before worker execution.

Recommended buckets:

- Per user: prevents a single user from saturating AI capacity.
- Per role: lower ceilings for external roles and viewers; higher ceilings for admin/executive/PM roles.
- Per workspace: protects company-level quota.
- Per project: prevents one busy project from blocking all others.
- Per external role: stricter limits for `nha_thau` and `tu_van`.

Multiple users are isolated by permission and scope, not only by queue partition. A worker must never reuse retrieved context across users unless the same context is re-authorized for the new user.

### Job Priority

Priority is business-driven:

- `urgent`: human-confirmed operational blocker, executive/legal deadline or safety/compliance-critical request.
- `high`: project risk summary, pending decision support, deadline-sensitive report draft.
- `normal`: normal assistant answer, document/task/legal explanation.
- `low`: batch summaries, re-index assistance, non-urgent draft generation.

External-user requests default to `normal` or `low` unless explicitly escalated by an internal permitted user.

### Streaming vs Background Mode

Use fast streaming mode when:

- The request is read-only.
- Expected context and output are small.
- It does not require long batch processing, report generation or multi-step retrieval.
- The user is waiting in the UI for a conversational answer.

Use async background mode when:

- The request may take longer than an interactive response budget.
- It generates report drafts, large summaries or multi-project analysis.
- It needs heavy retrieval, document processing, OCR, embedding, or external API calls.
- It creates action proposals that require review later.
- It runs on a schedule or batch.

Streaming requests still create an `ai_interactions` record and citations. Background requests create both `ai_interactions` and `ai_jobs`.

### Persistence

AI outputs must be persisted in structured tables:

- `ai_interactions`: request, mode, module, scope summary, status, response summary and model metadata.
- `ai_jobs`: async queue state, scope snapshot, priority, retry/lock/error state.
- `ai_citations`: internal records and approved knowledge chunks used in a response.
- `ai_action_proposals`: proposed mutations awaiting human accept/reject.

Action proposals are not executed by the worker. Accepting a proposal must call the normal domain mutation path and re-check domain permissions server-side.

## 9. Module RAG Strategies

### Project AI

Sources: project profile, milestones, tasks, documents, legal steps, meetings/decisions, reports and approved internal SOP.

Use cases: project summary, risk overview, next action suggestions and executive brief.

Guardrails: do not change project status or declare final readiness without confirmation.

### Legal AI

Sources: approved legal knowledge, legal checklist, legal document requirements, submissions, authority responses, project legal documents and legal meeting decisions.

Use cases: missing legal document suggestions, legal text summary, checklist guidance, new source impact warning and draft letters/checklists.

Guardrails: no final legal conclusions, no legal step approval and no unapproved sources as official basis.

### Document AI

Sources: document metadata, versions, requirement templates, approval history, linked requirements and approved templates/SOP.

Use cases: detect missing documents, match documents to requirements, suggest updates and draft correction requests.

Guardrails: do not approve documents or replace reviewer.

### Task AI

Sources: tasks, project timeline, legal/document blockers, meeting decisions, workload and SOP.

Use cases: late task cause analysis, priority suggestions, suggested owner/next action and task generation from decisions.

Guardrails: require confirmation before creating/assigning tasks or changing deadline/status.

### Meeting AI

Sources: meeting notes, decisions, existing tasks, project context, role/user list and meeting templates.

Use cases: meeting summary, action item extraction, suggested owner/deadline and draft minutes.

Guardrails: no official decisions or responsibility assignment without confirmation.

### Report AI

Sources: report snapshots, dashboard metrics, tasks, document readiness, legal status, meetings/decisions and report templates.

Use cases: weekly/monthly report draft, risk highlight, executive decision requests and period comparison.

Guardrails: do not change metrics, hide risks or release official reports without review.

### Design AI

Sources: planning indicators, design packages, drawings, approved standards, legal planning requirements and project constraints.

Use cases: FAR/mật độ/tầng cao checks, option comparison, design feasibility notes and warnings when indicators exceed limits.

Guardrails: deterministic calculations run outside LLM first; AI cannot replace architect/engineer approval.

### Construction AI

Sources: construction packages, schedule, site diary, quality checklist, inspection records, acceptance records, approved standards/SOP and contractor submissions.

Use cases: inspection checklist suggestions, delay warnings, site diary summary and missing acceptance document detection.

Guardrails: do not approve nghiệm thu or certify quality.

### Finance AI

Sources: budget, contracts, payment requests, invoices, acceptance records, approved finance/tax/internal policies and cash flow plan.

Use cases: payment condition checks, budget variance warning, missing payment document suggestions and payment memo draft.

Guardrails: do not approve payments or make final tax/legal conclusions.

### Proposal Approval AI

Sources: proposal fields, linked project/task/document/legal/meeting/report/contract/payment/investment records, approval steps, comments, attachments, audit history and approved Knowledge Center policies.

Use cases: proposal completeness checks, missing evidence detection, risk summary, suggested approval route, draft review notes and request-change wording.

Guardrails: AI must not approve, reject, skip approval steps or change proposal status. Final approval requires human `proposal.approve` plus the relevant domain approval permission. Finance, legal, investment, QA/QC and safety conclusions require citations or an insufficient-data answer.

### Contractor AI

Sources: assigned tasks only, assigned package only, contractor-submitted documents, required documents for assigned package and approved contractor instructions/SOP.

Use cases: explain assigned work, list missing submissions, explain rejected submissions and deadline reminders.

Guardrails: no access to other contractors, finance/legal/internal portfolio data or broad project-wide answers.

## 10. AI Actions

AI can safely:

- Summarize.
- Draft.
- Suggest.
- Compare.
- Highlight risk.
- Create action proposals.

AI needs human confirmation before:

- Creating tasks.
- Changing status.
- Approving/rejecting documents.
- Sending reports.
- Sending notifications to external users.
- Updating legal/design/construction/finance records.

Human confirmation requirements:

- Show the proposed change before execution.
- Show affected records and permissions used.
- Require an explicit confirm action from the user.
- Re-check domain permission server-side after confirmation.
- Audit the accepted action and original AI proposal.

### Action Proposal Review and Confirm Path

AI action proposals are the only allowed bridge from AI reasoning to business mutations.

Lifecycle:

```text
proposed
-> accepted | rejected | expired
-> executed | failed
```

Rules:

- AI workers and the Coordinator can create proposals only in `proposed` status.
- A proposal is not a domain mutation.
- Accepting a proposal must re-check `ai.confirm_action`, the proposal's `required_permission`, current project/resource scope and current external-user assignment scope.
- Accepted proposals must execute through existing domain services/server actions, not by writing target tables directly.
- Rejected proposals must not mutate business records.
- Failed proposals must preserve the error reason and remain auditable.
- The original proposed payload must remain available for audit; execution metadata should be stored separately.

Supported proposal types for the first implementation:

| Action key | Domain path | Required domain permission | Expected result |
| --- | --- | --- | --- |
| `create_task` | Task service/action | `task.create` | Creates a project-linked task |
| `request_document_update` | Document service/action | `document.update` | Adds or updates a request for document correction where supported |
| `create_legal_followup_task` | Task service/action with legal context | `task.create` plus legal read scope | Creates a follow-up task linked to a legal issue |
| `update_legal_note` | Legal service/action | `legal.update` | Appends or updates a legal step note where supported |
| `create_meeting_action_item` | Meeting/decision service/action | `decision.create` or `meeting.update` | Creates a meeting decision/action item |

Out of scope for the first implementation:

- Arbitrary database mutations.
- Approval of legal, finance, construction or document records without the matching domain approval workflow.
- Bulk changes.
- External-user notifications unless explicitly confirmed through a later notification workflow.

Audit requirements:

- Record proposal id.
- Record accepting/rejecting user.
- Record decision note.
- Record target entity created/updated if execution succeeds.
- Record failure reason if execution fails.
- Link audit entry to the original `ai_interaction`.

## 11. Citation Rules

AI answers must show source references when they rely on knowledge or project records.

Citation types:

- Internal record: project/task/document/legal step/meeting/report.
- Approved knowledge item.
- External source candidate in review mode only.

For legal, finance, design standards and construction quality, citations are required.

## 12. MCP Web Search Strategy

MCP Web Search is for external discovery.

It should support:

- BO-managed configured source domains.
- Query templates by module.
- Retrieved timestamp.
- Source type classification.
- Result normalization.
- Search logs.
- Provider metadata and error classification.
- Duplicate normalized URL detection.
- Discovery topics with manual Run Now and future daily/weekly cadence metadata.
- Discovery run logs with result, imported, duplicate-skipped and disallowed-skipped counts.
- Due-topic scheduler selection by frequency, last run, retry window and soft lock.
- Retry metadata for failed runs: retry count, max retries, next retry time, error code and error message.

It should not:

- Mutate project data.
- Bypass permissions.
- Feed unreviewed legal/technical/finance sources into authoritative answers.
- Cause the LLM or Knowledge Center to learn automatically from results.
- Auto-approve, auto-promote or auto-index Scheduled Web Discovery results.
- Run the same topic concurrently when a fresh scheduler lock is present.

Normalized result:

```ts
type ExternalSource = {
  title: string;
  url: string;
  provider: string;
  publishedAt?: string;
  retrievedAt: string;
  snippet: string;
  sourceType: "law" | "standard" | "template" | "policy" | "contract" | "technical_guideline" | "market" | "internal_note";
  confidence: "official" | "internal_approved" | "external_reference" | "unknown";
  module: "legal" | "design" | "construction" | "finance" | "documents" | "meetings" | "reports" | "project" | "general";
  tags: string[];
};
```

Current provider model:

- Local/test fallback: mock provider.
- Config-gated real provider: Tavily.
- Provider API keys remain environment configuration, not BO database settings.
- BO settings manage business allowlist domains, not secret keys.

## 13. Implementation Sprints

These are AI/Knowledge Center implementation sprints. They are intentionally not numbered as product roadmap phases; the canonical product phase order remains in `blueprint/04-roadmap.md`.

### AI Sprint 1 - Knowledge Center Foundation

- Knowledge item model.
- Review queue.
- Approve/reject workflow.
- Manual upload/source entry.
- Citation model.

### AI Sprint 2 - MCP Web Search Intake

- Web Search provider adapter with mock fallback and config-gated Tavily.
- Source normalization.
- Search logs.
- Candidate source review.
- BO-managed source registry.
- Duplicate URL detection.
- Provider error classification.

### AI Sprint 3 - RAG Index and Retrieval

- Chunking.
- Embeddings/vector search or retrieval adapter.
- Module filters.
- Permission-aware context builder.
- Citation output.

### AI Sprint 4 - Module AI Assistants

- Legal AI.
- Document AI.
- Task AI.
- Meeting AI.
- Report AI.
- Project AI.
- Proposal approval AI.

### AI Sprint 5 - Design/Construction/Finance AI

- Design feasibility assistant.
- Construction checklist assistant.
- Finance/payment assistant.

## 14. Production Guardrails

- Deny by default.
- Permission-aware retrieval.
- AI Gateway for request authorization, rate limiting and job creation.
- Worker-side permission/scope re-check for every queued job.
- Approved knowledge only for authoritative answers.
- Citation required for high-impact modules.
- Persist AI responses, citations and action proposals for audit.
- Human confirmation for mutations.
- Audit AI interactions and accepted actions.
- External users are scoped to assigned resources.
- AI failure must not block core project operations.
