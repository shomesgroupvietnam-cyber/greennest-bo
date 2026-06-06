# Story 8.2: Executive AI Summary Draft Trong Workspace

Status: done

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a Chairman/CEO,  
I want AI Summary trong Morning Briefing va workspace o trang thai draft/goi y,  
so that toi co ho tro doc nhanh nhung van biet day khong phai quyet dinh chinh thuc.

## Acceptance Criteria

1. Given workspace co AI summary enabled, when nguoi dung mo Morning Briefing hoac Executive AI Center, then AI Summary hien thi nhu draft/goi y voi timestamp va citation.
2. Given AI khong co du du lieu trong scope, when tao summary, then UI hien thi empty/insufficient-context state thay vi bia du lieu.
3. Given AI summary co de xuat hanh dong, when nguoi dung xem de xuat, then de xuat chi la advisory/action proposal, chua mutate business record.

## Tasks / Subtasks

- [x] Xac nhan implementation hien co truoc khi sua (AC: 1, 2, 3)
  - [x] Doc `src/modules/ai/README.md`, `src/modules/ai/services/ai-gateway-service.ts`, `ai-coordinator-service.ts`, `ai-worker-service.ts`, `ai-response-validator.ts`, `ai-action-proposal-service.ts`, `src/modules/ai/types.ts`.
  - [x] Doc Morning Briefing: `src/modules/dashboard/types.ts`, `services/executive-morning-briefing-service.ts`, `components/executive-morning-briefing.tsx`.
  - [x] Doc workspace/Command Center: `src/modules/workspaces/types.ts`, `services/executive-private-workspace-service.ts`, `components/executive-private-workspace.tsx`, `src/modules/command-center/services/command-center-service.ts`, `components/command-center-dashboard.tsx`.
  - [x] Khong tao AI Gateway, Coordinator, provider, repository hoac chatbot song song.
- [x] Tao shared Executive AI Summary DTO/service adapter (AC: 1, 2, 3)
  - [x] Reuse Story 8.1 pipeline `askAi`/`processAiJob`/`runAiCoordinator`; neu can tao thin adapter thi dat trong `src/modules/ai/services`, vi day la AI boundary hien huu.
  - [x] Dinh nghia "AI summary enabled" ro rang: user co AI permission phu hop (`ai.ask` hoac `ai.view_insight`/`ai.create_draft` theo contract hien huu), view dang yeu cau AI summary, va service option/config khong disable provider path.
  - [x] Khong tao AI job/provider request moi cho moi Command Center load neu khong can. Neu persist job thi reuse latest valid summary theo user/scope/view trong khoang thoi gian hop ly; neu khong persist thi adapter phai co disabled/fallback mode va injection cho test.
  - [x] DTO phai co toi thieu: `status` (`draft` | `insufficient_context` | `unavailable`/tuong duong), `text`, `updatedAt`/`generatedAt`, `citations`, `generatedFrom`/source metadata, optional `jobId`/`interactionId`, optional `actionProposals`.
  - [x] Prompt summary phai duoc tao tu scoped DTO/source items da sanitize; khong dua raw hidden records, raw prompt nguoi dung, finance field bi cam, hoac unscoped ids vao prompt.
  - [x] Map citation tu `AiCitation` hoac source item da loc quyen sang UI citation; khong tin citation do model tu viet neu khong co trong application citation map.
  - [x] Neu khong co context/citation hop le, provider bi block, user thieu `ai.ask`/module view, hoac selected scope invalid, tra `insufficient_context`/safe empty state; khong sinh summary suy doan.
- [x] Nang Morning Briefing tu placeholder sang AI summary draft an toan (AC: 1, 2)
  - [x] `getExecutiveMorningBriefingData` dang tao `summary.status: "placeholder"` tu `ExecutiveDashboardData`; giu scoped dashboard data lam nguon context va chi chuyen sang `draft` khi AI job co response/citation hop le.
  - [x] Khong goi provider trong React component. Moi AI call phai nam o service/server action boundary va dung repository/provider injection de test.
  - [x] `ExecutiveMorningBriefing` hien thi label draft/goi y, timestamp, citation gan voi noi dung, va insufficient-context state ro rang.
  - [x] Khong lam lo finance/hidden data trong summary text, citations, serialized DTO, prompt, action proposal payload.
- [x] Them AI Summary vao Private Workspace/Executive AI Center context (AC: 1, 2, 3)
  - [x] Treat Command Center view `executive-private-workspace` la workspace target hien huu; neu can "Executive AI Center" trong MVP, reuse `/ai` hoac contextual AI panel trong workspace, khong tao landing page moi.
  - [x] Extend `ExecutivePrivateWorkspaceData` voi AI summary DTO hoac dung shared DTO field tu `src/modules/ai/types.ts`/workspace types; update component render mot panel operational, not decorative.
  - [x] Panel phai show draft/goi y, timestamp, citations, insufficient-context, va action proposals neu co.
  - [x] Viewer/read-only/assistant variants van ton trong workspace; AI summary khong duoc mo rong mutation mode.
- [x] Giu action proposal la advisory only (AC: 3)
  - [x] Summary generation mac dinh khong can tao proposal; chi set `wantsActionProposal` khi product/UI thuc su yeu cau de xuat hanh dong va user co `ai.propose_action`.
  - [x] Summary co the include `AiActionProposal[]` o `status: "proposed"`/`workflowStatus: "DRAFT"` nhung khong goi domain mutation service.
  - [x] Accept/reject van di qua `src/modules/ai/services/ai-action-proposal-service.ts`, re-check `ai.confirm_action`, required domain permission va target scope.
  - [x] UI copy phai phan biet "de xuat" voi "da thuc hien"; khong hien thi nhu task/risk/decision chinh thuc.
  - [x] Khong dua raw prompt, raw hidden source, unscoped `projectId`, hoac user intent thieu sanitize vao proposal title/payload/audit.
- [x] Giu permission/scope/RLS parity (AC: 1, 2, 3)
  - [x] AI retrieval phai chay trong permission context user hien tai, dung `src/lib/permissions/can.ts` va `src/lib/permissions/access-scope.ts`.
  - [x] `resourceRefs`, selected scope va `projectId` chi la request hints; phai duoc scoped loader/filter xac nhan truoc khi vao prompt/citation/proposal.
  - [x] Neu them persistence field, update ca JSON repository, Supabase repository/row mapping, migration/policies va tests. Prefer khong doi DB contract trong story nay neu service DTO du dap ung.
- [x] Test va validation (AC: 1, 2, 3)
  - [x] Unit tests cho summary DTO: `draft` khi co AI response + citation, `insufficient_context` khi no scope/no citation/provider blocked, va khong mutate business record khi co proposal.
  - [x] Service regression cho Morning Briefing: scoped citations, hidden finance strip, selected-scope invalid/no visible data, placeholder fallback hoac draft transition.
  - [x] Service regression cho Private Workspace: role variants, read-only/viewer, assistant delegation, hidden finance strip, AI summary field khong doi mutation mode.
  - [x] Component tests cho draft label, timestamp, citation rendering, insufficient-context state, advisory proposal UI trong Morning Briefing va Private Workspace.
  - [x] Targeted test command khi lap trinh: `npm run test -- tests/unit/ai-job-service.test.ts tests/unit/ai-coordinator-service.test.ts tests/unit/executive-morning-briefing-service.test.ts tests/unit/executive-private-workspace-service.test.ts tests/unit/command-center-dashboard.test.tsx`.
  - [x] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`.

### Review Findings

- [x] [Review][Patch] Provider summary path is not bound to the selected briefing/workspace source scope [`src/modules/ai/services/executive-ai-summary-service.ts:75`]
- [x] [Review][Patch] Provider citations are accepted without intersecting the app-approved source citation map [`src/modules/ai/services/executive-ai-summary-service.ts:97`]
- [x] [Review][Patch] Deterministic fallback text is labeled as `draft` without a provider-backed AI response [`src/modules/ai/services/executive-ai-summary-service.ts:61`]
- [x] [Review][Patch] Morning Briefing can show `insufficient_context` even when visible but uncited data exists [`src/modules/dashboard/services/executive-morning-briefing-service.ts:144`]
- [x] [Review][Patch] Advisory proposal panels render non-proposed statuses with "no business mutation" copy [`src/modules/workspaces/components/executive-private-workspace.tsx:276`]
- [x] [Review][Patch] Provider failures are collapsed into `insufficient_context` instead of an unavailable/error state [`src/modules/ai/services/executive-ai-summary-service.ts:86`]
- [x] [Review][Patch] Summary provider requests omit citation-derived `resourceRefs` and safe project hints for audit/proposal scoping [`src/modules/ai/services/executive-ai-summary-service.ts:75`]

## Dev Notes

### Current State

- Story 8.1 is done. AI Gateway, Coordinator, Worker, Prompt Builder, Validator, Provider abstraction, `AiCitation`, `AiActionProposal`, and AI repositories already exist under `src/modules/ai`.
- `askAi` creates interactions/jobs, builds `AiScopeSnapshot`, checks permissions/rate-limit placeholder, and fast mode can process immediately through the worker.
- `runAiCoordinator` already builds scoped context blocks, approved Knowledge RAG citations, provider answers, response validation, and proposed-only action proposals. Do not bypass it with a custom summarizer.
- 8.1 review patches already removed high-risk leaks: hidden `projectId` is sanitized before prompt/proposal, citation requirement is stricter, raw prompt/intent are removed from proposal payload/title, and negated risk wording should not create false risk proposals.
- Morning Briefing already has `ExecutiveMorningBriefingSummary` with `status: "draft" | "placeholder" | "insufficient_context"`, `text`, `citations`, `generatedFrom`, `updatedAt`. It currently builds deterministic placeholder text/citations from `ExecutiveDashboardData`.
- Private Workspace currently has no AI summary field. It builds `ExecutivePrivateWorkspaceData` from `ExecutiveDashboardData`, role/scope assignments, delegation state, and finance-safe section items.
- `CommandCenterDashboard` already routes `executive-morning-briefing` to `ExecutiveMorningBriefing` and `executive-private-workspace` to `ExecutivePrivateWorkspace`. There is also a legacy overview "AI tro ly ao" suggestion card; do not treat that as the new AI summary contract.

### Architecture Guardrails

- Internal AI flow must remain: UI/server action -> `askAi` -> permission/scope resolver -> Coordinator retrieval -> approved Knowledge RAG -> cited answer -> optional `AiActionProposal` -> human confirmation.
- Components/routes must not call repositories or provider directly. Use service functions and dependency injection for tests.
- AI Summary is advisory. It must never become an official Morning Briefing, decision, risk, task, meeting minute, approval, or audit conclusion unless a separate confirmed domain flow does that.
- Advanced AI Risk Analysis, KPI Analysis, Copilot, and Project Prediction are out of scope for this story except safe placeholder/unavailable states.
- Keep current package stack: Next 15.3, React 19, TypeScript 5.8, Vitest 3.1, lucide-react. No new state manager, ORM, AI SDK, or DB layer.

### Permission And Scope Requirements

- Canonical AI permissions are in `src/lib/permissions/can.ts`: `ai.ask`, `ai.use_rag`, `ai.view_insight`, `ai.create_draft`, `ai.propose_action`, `ai.confirm_action`, `knowledge.view`, plus module view permissions.
- `ai.confirm_action` implies proposal confirmation power only after domain permission/scope checks in `ai-action-proposal-service`.
- External/viewer/read-only users may see permitted summaries only if `ai.ask`/view permissions and scoped data allow it. They must not get hidden prompt context or mutation controls.
- Finance-sensitive fields are already stripped in dashboard/workspace services when `canViewFinance` is false. Summary text, citations and proposals must preserve that behavior.

### File Map

- Likely AI additions: `src/modules/ai/services/executive-ai-summary-service.ts` or equivalent thin service adapter; reuse `src/modules/ai/types.ts` where useful.
- Likely Morning Briefing updates: `src/modules/dashboard/types.ts`, `src/modules/dashboard/services/executive-morning-briefing-service.ts`, `src/modules/dashboard/components/executive-morning-briefing.tsx`.
- Likely workspace updates: `src/modules/workspaces/types.ts`, `src/modules/workspaces/services/executive-private-workspace-service.ts`, `src/modules/workspaces/components/executive-private-workspace.tsx`.
- Likely Command Center updates: `src/modules/command-center/services/command-center-service.ts`, `src/modules/command-center/components/command-center-dashboard.tsx`, `src/modules/command-center/types.ts` if DTO shape changes.
- Existing tests to extend: `tests/unit/executive-morning-briefing-service.test.ts`, `tests/unit/executive-private-workspace-service.test.ts`, `tests/unit/command-center-dashboard.test.tsx`, `tests/unit/ai-job-service.test.ts`, `tests/unit/ai-coordinator-service.test.ts`, `tests/unit/ai-response-validator.test.ts`.

### Data Contract Guidance

- For Morning Briefing, prefer evolving the existing `ExecutiveMorningBriefingSummary` rather than introducing a second summary object. If a shared summary type is needed, keep field names compatible with the current UI where possible.
- For Private Workspace, add one explicit field such as `aiSummary` with the same citation/status semantics as Morning Briefing.
- AI citations from `src/modules/ai/types.ts` use `entityType`, `entityId`, `knowledgeItemId`, `knowledgeChunkId`, `title`, `module`, `projectId`, `sourceUrl`. UI citations can project these to source labels/hrefs, but must not fabricate source links.
- Action proposal statuses are `proposed`, `accepted`, `rejected`, `expired`, `executed`, `failed`; summary UI in this story should primarily show `proposed` advisory proposals.
- Do not persist AI summary as an approved official record in this story. If persisting AI interactions/jobs only, use existing AI repository contract.

### UX Requirements

- The panel must feel like an operational workspace element: compact, scannable, visible in context, no landing-page or marketing layout.
- Required visible states: draft/goi y label, generated timestamp, citations near answer, insufficient-context/empty state, and advisory proposal state if proposals exist.
- UI must not rely on color alone. Keep text labels for status and source type.
- Keep text inside buttons/cards from overflowing on mobile. Use existing Tailwind utility style and lucide icons.
- Copy should not claim certainty. Use language equivalent to "Ban tom tat nay la goi y noi bo, can kiem tra citation truoc khi quyet dinh."

### Anti-Patterns To Avoid

- Do not run AI provider calls from client components or during uncontrolled render loops.
- Do not let model text provide the only citation evidence.
- Do not transform placeholder/mock advanced AI into real prediction/copilot.
- Do not create domain tasks, risks, decisions, approvals, meeting minutes, or audit conclusions directly from summary generation.
- Do not broaden Command Center data access just because the AI summary panel is present.
- Do not hide insufficient data behind a cheerful generic summary.
- Do not overwrite existing user changes or format unrelated files; worktree is dirty.

### Latest Technical Information

- No web research is required for this story. Use repo-local docs, `package.json`, and Story 8.1 implementation.
- Provider behavior must remain testable with injected mock providers and temp JSON repositories; no live OpenAI/Supabase dependency for unit tests.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-8-executive-ai-advisory.md` - Story 8.2]
- [Source: `_bmad-output/implementation-artifacts/8-1-ai-gateway-voi-permission-context-va-citation.md`]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` - FR-085, FR-086, FR-087, FR-088, FR-090, NFR-009, NFR-010, UX-DR16, UX-DR34]
- [Source: `src/modules/ai/README.md`]
- [Source: `docs/architecture/ARCHITECTURE_OVERVIEW.md` - AI boundary and action proposal flow]
- [Source: `docs/design/DESIGN_STANDARD.md` - AI UX pattern]
- [Source: `docs/context/permissions-audit.md`]
- [Source: `docs/context/testing.md`]
- [Source: `docs/context/tasks.md`]
- [Source: `docs/context/meetings.md`]
- [Source: `docs/context/decision-assignment.md`]
- [Source: `src/modules/dashboard/services/executive-morning-briefing-service.ts`]
- [Source: `src/modules/workspaces/services/executive-private-workspace-service.ts`]
- [Source: `src/modules/command-center/components/command-center-dashboard.tsx`]
- [Source: `tests/unit/executive-morning-briefing-service.test.ts`]
- [Source: `tests/unit/executive-private-workspace-service.test.ts`]
- [Source: `tests/unit/command-center-dashboard.test.tsx`]

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- 2026-06-04T10:29:22+07:00 - Story 8.2 created as ready-for-dev from Epic 8 backlog after Story 8.1 done.
- 2026-06-04T10:33:32+07:00 - Chuyen story va sprint status sang in-progress.
- 2026-06-04T10:38:00+07:00 - RED targeted tests failed against missing Executive AI summary adapter/workspace panel/status transition.
- 2026-06-04T10:43:00+07:00 - GREEN targeted AI/executive regression suite passed for AI job/coordinator, Morning Briefing, Private Workspace, and Command Center.
- 2026-06-04T10:49:03+07:00 - Added and passed proposal-permission regression for `ai.propose_action` gating.
- 2026-06-04T10:49:49+07:00 - Final validation passed: `npm run typecheck`, `npm run lint`, `npm run test` (93 files, 675 tests).
- 2026-06-04T11:10:50+07:00 - Applied all 7 code-review patches and passed final validation: `npm run typecheck`, `npm run lint`, `npm run test` (93 files, 679 tests).

### Implementation Plan

- Add shared Executive AI Summary DTO/types and a thin service adapter at the AI boundary, with deterministic fallback and injected provider path for tests.
- Wire Morning Briefing summary through the shared adapter so scoped/cited context becomes draft and missing/blocked context becomes safe empty/unavailable state.
- Add Private Workspace AI Summary field and panel with timestamp, citations, insufficient-context, and advisory-only action proposal rendering.
- Extend unit/component regressions before final repo validation.

### Completion Notes List

- ready-for-dev story context created by BMAD create-story workflow.
- Implemented shared Executive AI summary draft contract with citation dedupe, AI permission gate, provider injection, and safe action proposal projection.
- Morning Briefing now uses scoped dashboard context as a draft summary source and keeps citation/timestamp rendering plus advisory proposal copy.
- Private Workspace now returns and renders `aiSummary` without changing mutation mode, including insufficient-context/unavailable behavior for invalid scope or missing AI permissions.
- Action proposal requests are gated by `ai.propose_action`; users with draft-only AI access do not request or see proposed actions from the summary adapter.
- Code review patches bind provider requests to citation-derived resource refs/project hints, require provider citations to match the app-approved source map, keep deterministic fallback as `placeholder`, and show only proposed/DRAFT advisory proposals.
- No DB/repository contract change was needed; summary remains a service DTO/view concern.

### File List

- `_bmad-output/implementation-artifacts/8-2-executive-ai-summary-draft-trong-workspace.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/index.md`
- `src/modules/ai/types.ts`
- `src/modules/ai/services/executive-ai-summary-service.ts`
- `src/modules/dashboard/types.ts`
- `src/modules/dashboard/services/executive-morning-briefing-service.ts`
- `src/modules/dashboard/components/executive-morning-briefing.tsx`
- `src/modules/workspaces/types.ts`
- `src/modules/workspaces/services/executive-private-workspace-service.ts`
- `src/modules/workspaces/components/executive-private-workspace.tsx`
- `tests/unit/executive-ai-summary-service.test.ts`
- `tests/unit/executive-morning-briefing-service.test.ts`
- `tests/unit/executive-private-workspace-service.test.ts`
- `tests/unit/command-center-dashboard.test.tsx`

## Change Log

- 2026-06-04: Created Story 8.2 implementation context and marked ready for dev.
- 2026-06-04: Implemented Executive AI Summary draft for Morning Briefing and Private Workspace with citations, insufficient-context/unavailable states, and advisory-only proposals; marked ready for review.
- 2026-06-04: Applied all code-review patches and marked Story 8.2 done.
