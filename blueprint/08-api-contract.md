# 08 - API Contract

## 1. Purpose

This document defines the initial API/resource contract for GreenNest BuildFlow. It can be implemented with Next.js Server Actions, API routes, Supabase functions or a future NestJS backend.

The contract is resource-oriented so frontend and backend can evolve without changing product behavior.

## 2. Conventions

Base path if REST API is used:

```text
/api/v1
```

Response envelope:

```ts
type ApiSuccess<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

Pagination:

```ts
type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
};
```

Common errors:

- `UNAUTHORIZED`.
- `FORBIDDEN`.
- `VALIDATION_ERROR`.
- `NOT_FOUND`.
- `CONFLICT`.
- `INTERNAL_ERROR`.

## 3. Auth and Current User

### GET `/me`

Returns current user profile and permissions.

Response:

```ts
type CurrentUserResponse = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  systemRole:
    | "super_admin"
    | "admin"
    | "tong_giam_doc"
    | "pho_tong_giam_doc"
    | "giam_doc_du_an"
    | "quan_ly_du_an"
    | "to_truong"
    | "phap_ly"
    | "ke_toan"
    | "thiet_ke"
    | "ky_thuat"
    | "thi_cong"
    | "mua_hang"
    | "dau_tu_phat_trien"
    | "quan_ly_tai_chinh"
    | "hanh_chinh_nhan_su"
    | "qa_qc_chat_luong"
    | "an_toan_lao_dong"
    | "kiem_toan_noi_bo"
    | "quan_ly_hop_dong"
    | "thu_ky_tro_ly"
    | "kiem_soat_noi_bo"
    | "nha_thau"
    | "tu_van"
    | "viewer";
  defaultScreen: string;
  permissions: string[];
};
```

## 4. Projects

### GET `/projects`

Query:

```ts
type ProjectListQuery = {
  search?: string;
  status?: string;
  ownerId?: string;
  page?: number;
  pageSize?: number;
};
```

Response:

```ts
type ProjectListItem = {
  id: string;
  code: string;
  name: string;
  location?: string;
  area?: number;
  projectType?: string;
  investor?: string;
  status: string;
  ownerId?: string;
  updatedAt: string;
};
```

### POST `/projects`

Request:

```ts
type CreateProjectRequest = {
  code?: string;
  name: string;
  location?: string;
  area?: number;
  projectType?: string;
  investor?: string;
  ownerId?: string;
  status: string;
};
```

Behavior:

- Create project.
- Generate code if missing.
- Initialize default legal checklist.
- Audit project creation.

### GET `/projects/:projectId`

Returns project detail.

### PATCH `/projects/:projectId`

Updates project fields.

### POST `/projects/:projectId/archive`

Soft archives project.

## 5. Tasks

### GET `/tasks`

Query:

```ts
type TaskListQuery = {
  projectId?: string;
  assigneeId?: string;
  status?: string;
  priority?: string;
  overdue?: boolean;
  upcomingDays?: number;
  page?: number;
  pageSize?: number;
};
```

### POST `/tasks`

Request:

```ts
type CreateTaskRequest = {
  projectId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;
  status: string;
  priority: string;
  category?: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
};
```

### GET `/tasks/:taskId`

Returns task detail.

### PATCH `/tasks/:taskId`

Updates task.

### POST `/tasks/:taskId/comments`

Adds task comment.

## 6. Documents

### GET `/documents`

Query:

```ts
type DocumentListQuery = {
  projectId?: string;
  docType?: string;
  status?: string;
  ownerId?: string;
  page?: number;
  pageSize?: number;
};
```

### POST `/documents`

Request:

```ts
type CreateDocumentRequest = {
  projectId: string;
  title: string;
  docType: string;
  fileUrl?: string;
  externalUrl?: string;
  version: string;
  status: string;
  ownerId?: string;
};
```

Rule:

- Either `fileUrl` or `externalUrl` is required.

### POST `/documents/:documentId/versions`

Adds a document version.

### PATCH `/documents/:documentId`

Updates metadata/status.

## 7. Legal

### GET `/projects/:projectId/legal-steps`

Returns legal checklist for project.

### PATCH `/legal-steps/:stepId`

Request:

```ts
type UpdateLegalStepRequest = {
  status?: string;
  assigneeId?: string;
  dueDate?: string;
  completedDate?: string;
  notes?: string;
  relatedDocumentIds?: string[];
};
```

Rule:

- If `status` is `blocked`, `notes` is required.

### POST `/projects/:projectId/legal-steps/reinitialize`

Admin-only action to initialize missing default legal steps. Must not duplicate existing steps.

## 8. Internal Proposals and Approvals

These contracts define the shared approval backbone for enterprise workflows. The first implementation may use Server Actions, but the business contract should remain stable.

### GET `/proposals`

Query:

```ts
type ProposalListQuery = {
  projectId?: string;
  type?: "investment" | "legal" | "document" | "finance" | "contract" | "procurement" | "design" | "construction" | "hr" | "quality" | "safety" | "general";
  status?: "draft" | "submitted" | "in_review" | "change_requested" | "approved" | "rejected" | "archived";
  ownerId?: string;
  requestedBy?: string;
  page?: number;
  pageSize?: number;
};
```

Rules:

- Requires `proposal.view`.
- Results must be scoped by project membership, department permission and external-user limitations.

### POST `/proposals`

Request:

```ts
type CreateProposalRequest = {
  title: string;
  type: string;
  projectId?: string;
  module: string;
  ownerId?: string;
  priority?: string;
  amount?: number;
  dueDate?: string;
  summary?: string;
  linkedRecords?: Array<{
    entityType: string;
    entityId: string;
    relationType?: "evidence" | "source" | "output" | "dependency" | "generated_action";
  }>;
};
```

Rules:

- Requires `proposal.create` plus relevant domain permission when creating a domain-specific proposal.
- Created status is `draft` unless submitted in the same action.
- Creation must be audited.

### GET `/proposals/:proposalId`

Returns proposal detail with steps, comments, attachments, links and decisions.

### PATCH `/proposals/:proposalId`

Updates draft or change-requested proposal fields.

Rules:

- Requires `proposal.update`.
- Approved/rejected proposals cannot be edited except by explicit admin/audit correction workflow.

### POST `/proposals/:proposalId/submit`

Submits a draft proposal to review.

Rules:

- Requires `proposal.create` or ownership plus module permission.
- Creates or activates approval steps according to proposal type/config.

### POST `/proposals/:proposalId/request-change`

Requests clarification or correction.

Rules:

- Requires `proposal.request_change` or `proposal.review`.
- Must record decision/comment and return status to `change_requested`.

### POST `/proposals/:proposalId/approve`

Approves the current step or final proposal.

Rules:

- Requires `proposal.approve`.
- May also require domain permission, such as `finance.approve`, `contract.approve`, `investment.approve`, `qa.approve` or `safety.approve`.
- Must not let AI approve.
- Must create proposal decision and audit log.

### POST `/proposals/:proposalId/reject`

Rejects the proposal.

Rules:

- Requires `proposal.reject` or `proposal.approve` depending on approval policy.
- Must record reason and audit log.

### POST `/proposals/:proposalId/ai-review`

Runs AI preliminary review on a proposal.

Rules:

- Requires `ai.use`, `ai.view_insight` or a future `ai.review_proposal`.
- AI can identify missing fields, missing evidence, risk and suggested approval route.
- AI output is advisory and cannot change proposal approval status.

## 9. Knowledge and Web Search Intake

These contracts may be implemented as Server Actions in the current Next.js app. The same behavior should be preserved if they move to REST/API routes later.

### GET `/settings/source-registry`

Returns BO-managed source registry entries.

Required permission:

- `settings.manage` or `knowledge.manage_source_registry`.

Response:

```ts
type SourceRegistryEntry = {
  id: string;
  domain: string;
  sourceCategory: "government" | "standards" | "internal" | "market" | "reference";
  module: "legal" | "design" | "construction" | "finance" | "documents" | "meetings" | "reports" | "project" | "general";
  sourceType: string;
  confidence: "official" | "internal_approved" | "external_reference" | "unknown";
  tags: string[];
  enabled: boolean;
  notes?: string;
};
```

### POST `/settings/source-registry`

Creates or updates a source registry domain.

Rules:

- Normalize domain to hostname.
- Upsert by domain.
- Audit the change.
- Does not auto-import, auto-approve or auto-index any source.

### POST `/settings/source-registry/:entryId/enabled`

Enables or disables an entry.

Rules:

- Disabled entries cannot be imported from Web Search.
- Existing approved Knowledge Items remain governed by their own lifecycle status.

### POST `/knowledge/intake/search`

Runs configured Web Search provider for discovery.

Request:

```ts
type WebSearchRequest = {
  query: string;
  limit?: number;
};
```

Behavior:

- Uses mock provider locally unless a real provider is configured.
- Current real provider adapter: Tavily.
- Records provider metadata and result count.
- Normalizes result metadata using source registry where possible.
- Does not write Knowledge Items and does not index RAG.

### POST `/knowledge/intake/import`

Imports one normalized search result into Knowledge Candidate queue.

Rules:

- User needs `knowledge.create_candidate` or `knowledge.review`.
- URL hostname must match an enabled source registry entry.
- Duplicate normalized URLs are rejected.
- Created candidate status is `pending_review`.
- Imported source is not RAG-eligible until promoted, reviewed, approved and indexed.

### GET `/knowledge/discovery/topics`

Returns managed discovery topics.

Required permission:

- `settings.manage` or `knowledge.manage_source_registry`.

### POST `/knowledge/discovery/topics`

Creates a manual-first discovery topic.

Request:

```ts
type KnowledgeDiscoveryTopicRequest = {
  module: "legal" | "design" | "construction" | "finance" | "documents" | "meetings" | "reports" | "project" | "general";
  query: string;
  enabled?: boolean;
  frequency?: "manual" | "daily" | "weekly";
  ownerId?: string;
  reviewerId?: string;
  maxRetries?: number;
};
```

Rules:

- `frequency` records intended cadence only; cron execution is not part of the current foundation.
- Creating or updating a topic does not run Web Search.

### PATCH `/knowledge/discovery/topics/:topicId`

Updates query, module, enabled state, frequency, owner or reviewer.

Required permission:

- `settings.manage` or `knowledge.manage_source_registry`.

### POST `/knowledge/discovery/topics/:topicId/run-now`

Runs the configured Web Search provider immediately for one enabled topic.

Behavior:

- Uses the same provider abstraction as `/knowledge/intake/search`.
- Applies source registry allowlist before import.
- Detects duplicate normalized URLs before import.
- Creates `knowledge_candidates` only with status `pending_review`.
- Does not approve, promote or index imported candidates.
- Creates a discovery run log with result, imported, duplicate-skipped and disallowed-skipped counts.

### POST `/knowledge/discovery/run-due`

Scheduler entrypoint contract for hosted cron providers.

Current implementation:

- Exposed as the local/manual script `npm run discovery:run-due`.
- Hosted HTTP route, Vercel Cron, GitHub Actions or server cron wiring is deployment work, not product behavior.

Behavior:

- Finds enabled daily/weekly topics due by `frequency`, `lastRunAt` and retry metadata.
- Skips `manual` topics.
- Acquires a soft lock with `lockedAt` and `lockedBy` before running each topic.
- Treats stale locks as retryable after the app-level lock timeout.
- Runs each topic through the same Discovery service as Run Now.
- Preserves source registry allowlist, duplicate URL detection and pending-review candidate creation.
- Records retry metadata for failed runs: `retryCount`, `maxRetries`, `nextRetryAt`, `errorCode`, `errorMessage`.

### GET `/knowledge/discovery/run-logs`

Returns discovery run logs, optionally filtered by topic.

Query:

```ts
type KnowledgeDiscoveryRunLogQuery = {
  topicId?: string;
};
```

## 10. Meetings and Decisions

### GET `/meetings`

Query by project/date.

### POST `/meetings`

Creates meeting note.

### POST `/meetings/:meetingId/decisions`

Creates decision.

### POST `/decisions/:decisionId/create-task`

Creates task from decision/action item.

## 11. Dashboard

### GET `/dashboard/summary`

Response:

```ts
type DashboardSummary = {
  totalProjects: number;
  activeProjects: number;
  overdueTasks: number;
  upcomingTasks: number;
  missingDocuments: number;
  blockedLegalSteps: number;
  overallProgress: number;
};
```

### GET `/projects/:projectId/dashboard`

Returns project-level metrics.

## 12. Users and Roles

### GET `/users`

Returns users visible to current user.

### PATCH `/users/:userId/role`

Admin-only or authorized executive role update.

Request:

```ts
type UpdateUserRoleRequest = {
  systemRole: string;
};
```

### GET `/roles`

Returns roles available to the current admin user.

### GET `/permissions/me`

Returns resolved permissions for current user, including workspace and active project context.

## 13. AI Gateway

AI APIs are handled through an AI Gateway. The gateway enforces permissions, scope, rate limits and persistence before any model provider or worker is called.

### POST `/ai/ask`

Creates an AI interaction. Depending on request size and expected runtime, the gateway either returns a streaming response or queues a background job.

Request:

```ts
type AiAskRequest = {
  module:
    | "project"
    | "tasks"
    | "documents"
    | "legal"
    | "meetings"
    | "reports"
    | "design"
    | "construction"
    | "finance"
    | "general";
  projectId?: string;
  resourceRefs?: Array<{
    entityType: string;
    entityId: string;
  }>;
  intent: string;
  prompt: string;
  mode?: "auto" | "streaming" | "background";
  priority?: "low" | "normal" | "high" | "urgent";
  wantsActionProposal?: boolean;
};
```

Response:

```ts
type AiAskResponse = {
  interactionId: string;
  mode: "streaming" | "background";
  jobId?: string;
  status: "streaming" | "queued" | "running" | "succeeded" | "failed";
  streamUrl?: string;
  pollUrl?: string;
};
```

Rules:

- Requires `ai.use` and the relevant module read permission.
- RAG retrieval requires `ai.use_rag` and `knowledge.view`.
- The gateway snapshots user, role, workspace, project, module and resource scope into the interaction/job.
- Background jobs must be re-authorized by the worker before processing.
- Rate limits are enforced by user, role, workspace, project and external role.

### GET `/ai/jobs/:jobId/status`

Returns async job status.

Response:

```ts
type AiJobStatusResponse = {
  jobId: string;
  interactionId: string;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled" | "expired";
  priority: "low" | "normal" | "high" | "urgent";
  queuedAt: string;
  startedAt?: string;
  finishedAt?: string;
  errorCode?: string;
  errorMessage?: string;
};
```

Rules:

- The caller must be the requester or have an admin/audit permission that allows reading the interaction.
- External users can only see their own jobs.

### GET `/ai/interactions/:interactionId/result`

Returns the final AI response with citations and action proposals.

Response:

```ts
type AiResultResponse = {
  interactionId: string;
  status: "succeeded" | "failed" | "cancelled" | "expired";
  responseText?: string;
  responseSummary?: string;
  citations: Array<{
    id: string;
    citationType: "internal_record" | "knowledge_item" | "knowledge_chunk" | "external_candidate_review_only";
    entityType?: string;
    entityId?: string;
    title: string;
    sourceUrl?: string;
    module: string;
    projectId?: string;
  }>;
  actionProposals: Array<{
    id: string;
    actionKey: string;
    targetEntityType: string;
    targetEntityId?: string;
    proposedPayload: unknown;
    rationale?: string;
    requiredPermission: string;
    status: "proposed" | "accepted" | "rejected" | "expired" | "executed" | "failed";
  }>;
};
```

Rules:

- Results are visible only if the user still has permission to view the interaction scope.
- Citations are persisted records, not only UI text.
- Unapproved external candidates may appear only in review-mode outputs and must be labeled unapproved.

### POST `/ai/action-proposals/:proposalId/accept`

Accepts an AI action proposal and executes it through the normal domain mutation path.

Request:

```ts
type AcceptAiActionProposalRequest = {
  confirmationNote?: string;
};
```

Response:

```ts
type AcceptAiActionProposalResponse = {
  proposalId: string;
  status: "accepted" | "executed" | "failed";
  executedEntityType?: string;
  executedEntityId?: string;
  executionResult?: unknown;
  errorMessage?: string;
};
```

Rules:

- Requires `ai.confirm_action`.
- Requires the proposal's `requiredPermission`.
- Must re-check target resource scope server-side.
- Must create audit log and update proposal status.
- Must execute only through the target domain service/action.
- Must reject unsupported `actionKey` values.
- Must not execute proposals that are no longer `proposed`.
- Supported first implementation action keys: `create_task`, `request_document_update`, `create_legal_followup_task`, `update_legal_note`, `create_meeting_action_item`.

### POST `/ai/action-proposals/:proposalId/reject`

Rejects an AI action proposal.

Request:

```ts
type RejectAiActionProposalRequest = {
  reason?: string;
};
```

Response:

```ts
type RejectAiActionProposalResponse = {
  proposalId: string;
  status: "rejected";
  rejectedAt: string;
};
```

Rules:

- The requester, an authorized reviewer or admin can reject.
- Rejection does not mutate the target domain record.
- Rejected proposal remains auditable.
- Must not reject proposals already accepted, executed, failed or expired unless an admin audit workflow is explicitly added later.

## 14. Future API Areas

Future routes should follow the same contract style:

- `/proposals`.
- `/investment-opportunities`.
- `/hr-requests`.
- `/quality-checks`.
- `/safety-observations`.
- `/design-packages`.
- `/drawings`.
- `/construction-packages`.
- `/contractors`.
- `/contracts`.
- `/budgets`.
- `/payment-requests`.
- `/reports`.
- Dedicated module AI shortcuts, such as `/ai/project-summary`, should call the AI Gateway contract above instead of bypassing it.
