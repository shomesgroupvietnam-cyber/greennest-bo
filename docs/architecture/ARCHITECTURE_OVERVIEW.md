# Architecture Overview

## 1. Purpose

This document summarizes the finalized architecture direction for GreenNest BuildFlow.

Detailed platform architecture remains in `blueprint/02-scalable-architecture.md`. This file is the practical engineering overview.

## 2. Architecture Style

Current approach:

```text
Next.js full-stack modular monolith
-> clean domain modules
-> shared governance/proposal workflow
-> service/repository boundaries
-> Supabase-ready persistence
-> permission-aware access layer
-> future AI/Knowledge Center layer
```

Do not move to microservices yet.

## 3. Core Layers

```text
UI Layer
  Next.js routes, role workspaces, module pages, forms, tables

Application Layer
  Server actions, use cases, guards, workflow orchestration

Domain Module Layer
  projects, tasks, documents, legal, meetings, reports, workspaces, proposals

Permission and Scope Layer
  auth session, role permissions, project membership, external scoping

Data Access Layer
  repository mode switch, mock repositories, Supabase repositories

Database/Storage Layer
  PostgreSQL/Supabase, RLS policies, Supabase Storage

Knowledge/AI Layer
  Knowledge Center, approved RAG, MCP Web Search intake, AI Gateway, AI jobs, worker pool
```

Enterprise governance layer:

```text
Department module UI
  -> Proposal service
  -> Approval route/step engine
  -> Linked records and evidence
  -> Comments, attachments and decisions
  -> Audit log
  -> Optional AI preliminary review
```

Internal Proposal and Approval is the shared workflow backbone for investment, finance, contract, legal, design, construction, HR, QA/QC, safety and executive decisions. Domain modules should create or consume proposals rather than each inventing a separate approval pattern.

AI Coordinator sub-layer:

```text
Module UI / API
  -> AI Gateway
  -> Coordinator AI
      -> Intent router
      -> Module context builders
      -> Permission-aware structured retrievers
      -> Approved Knowledge retrievers
      -> Cross-module reasoning
      -> Action proposal planner
  -> Cited response / proposed action
```

There is one Coordinator AI agent initially. Module AIs such as Legal AI, Document AI, Task AI, Report AI, Design AI, Construction AI and Finance AI are tool modes and context-building strategies behind the Coordinator, not separate autonomous agents.

## 4. Module Boundary Rule

Each module should own:

- Types.
- Validation.
- Services.
- Repository adapters.
- Server actions.
- Components.
- Tests.

Shared code goes into:

- `src/lib/auth`
- `src/lib/permissions`
- `src/lib/db`
- `src/lib/storage`
- `src/lib/audit`
- `src/constants`
- `src/types`

## 5. Repository Mode

The app supports:

- Mock/file-backed mode for local/demo.
- Supabase mode for production/staging.

Rule:

- Service contracts should stay stable.
- Repository implementation can switch by environment.
- New features must keep both modes unless the feature is explicitly production-only.

## 6. Permission Architecture

Canonical source:

- `blueprint/12-auth-roles-permissions.md`
- `blueprint/13-role-workspaces.md`

Principles:

- Deny by default.
- Permission checks are centralized.
- UI hiding is not security.
- Server actions enforce permissions.
- External roles are scoped to assigned resources.
- Supabase RLS must mirror app-level scope before production rollout.

## 7. Data Architecture

Canonical source:

- `blueprint/03-data-blueprint.md`
- `blueprint/09-data-model.md`

Principles:

- Project is the central business entity.
- Proposal is the central internal decision entity.
- Operational records should have `project_id` where relevant.
- Early investment, HR/admin and company-level proposals may exist without `project_id`.
- Main records should be archived, not hard-deleted.
- Important mutations should be auditable.
- Reports store snapshots, not live-only recalculation.

## 8. AI Architecture

Canonical source:

- `blueprint/14-ai-assistant-strategy.md`

Principles:

- AI is module-embedded, not only a generic chat box.
- AI uses one Coordinator agent initially, with many permission-aware tools and retrievers.
- Module AIs are modes/tool configurations under the Coordinator, not separate autonomous agents for now.
- Web Search MCP is source intake/discovery only.
- BO Settings owns source registry domain allowlist; provider secrets stay in environment variables.
- External sources go through review and approval before authoritative RAG.
- AI uses permission-aware retrieval.
- AI answers cite internal records and approved knowledge.
- AI mutations require human confirmation.
- AI can review proposals and suggest approval routes, but cannot approve or reject proposals.

Action proposal execution flow:

```text
AI Coordinator
  -> creates ai_action_proposals in proposed status
User review UI
  -> accept/reject
Accept path
  -> re-check ai.confirm_action
  -> re-check required domain permission
  -> re-check project/resource/external scope
  -> call normal domain service/action
  -> persist execution metadata
  -> audit accepted action
Reject path
  -> persist rejection note
  -> no domain mutation
```

AI action proposals must never write target domain tables directly.
- Chat/search/upload content is not persisted knowledge unless explicitly promoted, reviewed, approved and indexed.

Web Search intake flow:

```text
BO Settings
  -> manage enabled source registry domains
Knowledge Intake
  -> call configured search provider
  -> normalize result metadata
  -> enforce enabled source registry on import
  -> reject duplicate normalized source URLs
  -> create pending_review Knowledge Candidate
Human review
  -> promote/approve to Knowledge Item
  -> index approved item/chunks for RAG
```

Permission-aware AI request flow:

```text
User request
  -> Session and role resolution
  -> Workspace/project/resource scope resolution
  -> Check ai.use and target module permission
  -> Coordinator intent routing
  -> Primary module mode and supporting module selection
  -> Retrieve only allowed structured records
  -> Retrieve only approved, in-scope Knowledge chunks
  -> Build context with citation metadata
  -> Call LLM/model provider
  -> Return cited answer or action proposal
  -> Human confirmation for mutations
  -> Server-side domain permission re-check
  -> Mutation execution and audit log
```

Distributed AI job flow:

```text
Module UI or API
  -> AI Gateway
  -> Session, permission and scope resolution
  -> Rate limit check by user/role/workspace/project/external role
  -> ai_interactions record
  -> Fast streaming path
       -> Coordinator intent routing and context assembly
       -> scoped retrieval
       -> model provider
       -> response + citations + optional action proposals
  -> Async background path
       -> ai_jobs queued with scope_snapshot and priority
       -> AI worker claims job
       -> worker re-checks current permissions and resource scope
       -> Coordinator intent routing and context assembly
       -> scoped retrieval and model provider
       -> persist result, ai_citations and ai_action_proposals
       -> user polls status/result or receives notification later
```

Architecture rules:

- AI services must call the same permission/scope layer used by normal module routes.
- Retrieval filters run before any prompt or context is sent to an LLM provider.
- The AI Gateway is the only application boundary allowed to create AI interactions or jobs.
- The Coordinator AI is the only reasoning boundary that selects module tools, assembles context and plans action proposals.
- Module-specific AI behavior should be implemented as Coordinator modes/retrievers until a separate-agent need is proven.
- AI workers must re-check live permissions and scope before retrieving data, even if the gateway already checked the request.
- Every queued job stores a user/project/module scope snapshot for audit and reproducibility, but the snapshot does not grant access.
- Fast streaming mode is for small read-only answers; async background mode is for long-running, batch, report, document-processing or action-proposal work.
- Rate limits must isolate users by user id, role, workspace, project and external-user role.
- External users receive only assigned/limited records and approved knowledge allowed for their scope.
- Knowledge Candidates, unreviewed web results and uploads may be displayed in review workflows, but not used as authoritative RAG.
- LLM output is never a source of truth by itself; responses, citations and action proposals are persisted, while accepted actions and approved knowledge go through normal domain services.

## 9. Deployment Architecture

Canonical source:

- `docs/deployment/README.md`
- `docs/deployment/SUPABASE_STAGING_VALIDATION.md`

Target:

```text
Vercel
  Next.js app

Supabase
  Auth
  PostgreSQL
  RLS
  Storage
```

Before production:

- Apply migrations.
- Seed roles/permissions.
- Validate RLS with real users.
- Configure private storage bucket.
- Validate external user scoping.

## 10. Future Extraction Points

Extract only when needed:

- AI/Knowledge processing worker.
- Report export worker.
- Document OCR/file processing worker.
- Integration sync worker.
- Search/indexing service.

Until then, keep modular monolith boundaries clean.
