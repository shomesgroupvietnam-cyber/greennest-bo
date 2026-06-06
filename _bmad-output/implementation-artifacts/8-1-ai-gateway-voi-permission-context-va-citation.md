# Story 8.1: AI Gateway Với Permission Context Và Citation

Status: done

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a lãnh đạo,
I want AI chỉ đọc dữ liệu trong permission context và có citation,
so that tôi tin được nguồn tóm tắt mà không lộ dữ liệu ngoài scope.

## Acceptance Criteria

1. Given AI request có user context và target workspace/record, when AI Gateway chuẩn bị context, then retrieval chỉ dùng records người dùng có quyền xem.
2. Given AI answer dùng dữ liệu nội bộ, when trả kết quả, then answer có citation tới internal record/knowledge item phù hợp.
3. Given người dùng thiếu quyền với record nguồn, when AI request cố truy xuất record đó, then record bị loại khỏi context và không xuất hiện trong answer/citation.

## Tasks / Subtasks

- [x] Xác nhận implementation hiện có trước khi sửa (AC: 1, 2, 3)
  - [x] Đọc và giữ lại module hiện hữu `src/modules/ai`; không tạo gateway/coordinator thứ hai.
  - [x] Đọc `src/modules/ai/services/ai-gateway-service.ts`, `ai-permissions.ts`, `ai-coordinator-service.ts`, `ai-worker-service.ts`, `ai-prompt-builder.ts`, `ai-response-validator.ts`, `ai-repository.ts`.
  - [x] Đọc `src/modules/knowledge/services/knowledge-indexing-service.ts`, `knowledge-index-repository.ts`, `knowledge-vector-retrieval.ts`, `src/lib/permissions/access-scope.ts`, `src/lib/permissions/can.ts`.
- [x] Hoàn thiện boundary của AI request và permission snapshot (AC: 1, 3)
  - [x] `askAi` phải parse `aiAskInputSchema`, gọi `assertAiRequestPermissions`, tạo `AiScopeSnapshot`, kiểm tra rate-limit placeholder, rồi mới tạo interaction/job.
  - [x] `assertAiRequestPermissions` dùng permission key hiện có: `ai.ask`, module view permission, `ai.use_rag`, `knowledge.view`; không thêm permission string mới nếu chưa cập nhật catalog/seeds/tests.
  - [x] Worker phải re-check `canProcessAiJob` trước khi chạy coordinator; nếu quyền thay đổi thì job/interaction fail an toàn.
  - [x] `resourceRefs` từ request không được tự coi là được phép. Nếu dùng trong retrieval thì phải resolve qua scoped loaders/filter tương ứng; nếu chưa có loader an toàn thì bỏ qua khỏi context.
- [x] Hoàn thiện retrieval theo permission context và citation map (AC: 1, 2, 3)
  - [x] Structured context trong `runAiCoordinator` chỉ lấy từ records đã qua `filterProjectsForScope`, `filterTasksForScope`, `filterDocumentsForScope`, `filterLegalStepsForScope`, `filterMeetingsForScope`, `filterDecisionsForScope` và filter theo `job.projectId` khi có.
  - [x] RAG chỉ lấy `knowledge_chunks` status `approved`, còn hiệu lực, đúng module/source filter, và access level phù hợp role qua `allowedAccessLevelsForUser`.
  - [x] Citation phải được sinh bởi application từ records/chunks đã lọc, không lấy citation do model tự bịa.
  - [x] Prompt package chỉ đưa `Citation map` gồm citation hợp lệ; provider text có citation lạ phải bị validator chặn.
  - [x] Hidden record không được xuất hiện trong `contextBlocks`, `ragContext`, provider prompt, `AiCitation`, response text hoặc action proposal payload.
- [x] Giữ AI là advisory, không mutate trực tiếp domain table (AC: 2, 3)
  - [x] AI output luôn là draft/gợi ý/proposed; mutation chỉ qua `AiActionProposal` và human confirmation ở story/flow liên quan.
  - [x] Response validator chặn unknown citation, claim dùng nguồn chưa duyệt/web search không có source được phép, và claim kiểu "AI đã cập nhật/tạo/xóa/phê duyệt".
  - [x] Nếu dữ liệu trong scope không đủ, response phải nói rõ thiếu dữ liệu thay vì suy đoán.
- [x] Giữ parity mock/Supabase và RLS-facing contract (AC: 1, 2, 3)
  - [x] Nếu đổi type/domain field AI hoặc knowledge chunk, cập nhật cả `JsonAiRepository` và `SupabaseAiRepository`, cả JSON store và row mapping snake_case/camelCase.
  - [x] Nếu đổi schema, tạo migration mới; không sửa migration cũ trừ khi có lý do story rõ ràng.
  - [x] RLS phải tiếp tục giới hạn `ai_interactions`, `ai_jobs`, `ai_citations`, `ai_action_proposals` theo requester/permission và `knowledge_chunks` theo `knowledge.view`/access level.
- [x] Bổ sung/giữ test hồi quy cho ba AC (AC: 1, 2, 3)
  - [x] Unit tests cho unauthorized ask, module permission, worker re-check, contractor/viewer không thấy hidden project/task/document/legal.
  - [x] Unit tests cho RAG approved-only, access-level filtering, expired/effective date exclusion, citation metadata.
  - [x] Unit tests cho citation required/unknown citation/unsafe mutation claim/web-search claim.
  - [x] Unit tests cho Supabase/JSON row mapping nếu đổi persistence contract.

### Review Findings

- [x] [Review][Patch] Risk proposal payload can copy an unscoped `job.projectId`, exposing an unauthorized target project despite scoped retrieval [src/modules/ai/services/ai-coordinator-service.ts:473]
- [x] [Review][Patch] Citation requirement is still heuristic, so substantive internal answers can pass without a valid citation when wording misses the keyword list [src/modules/ai/services/ai-response-validator.ts:102]
- [x] [Review][Patch] Insufficient-data phrase bypasses citation checks even when the same response also contains uncited internal facts [src/modules/ai/services/ai-response-validator.ts:92]
- [x] [Review][Patch] Action proposal titles still persist user-supplied `job.intent` in proposed payloads [src/modules/ai/services/ai-coordinator-service.ts:485]
- [x] [Review][Patch] Negated/general risk wording can create spurious `create_risk_record` proposals [src/modules/ai/services/ai-coordinator-service.ts:470]

## Dev Notes

### Current State

- `src/modules/ai` đã tồn tại với gateway, coordinator, worker, provider abstraction, prompt builder, response validator, action proposal và repository. Dev agent phải harden/hoàn thiện các contract này, không tạo module AI mới hoặc chatbot song song.
- `src/modules/knowledge` đã có Knowledge Center, approved RAG indexing, deterministic/vector retrieval, citation metadata và access-level filtering.
- Worktree hiện có nhiều thay đổi chưa commit. Không revert hoặc format lan rộng; chỉ sửa các file cần thiết cho story.

### Architecture Guardrails

- Internal flow phải là: UI/Server Action -> `askAi` -> permission/scope resolver -> coordinator retrieval -> approved Knowledge RAG -> cited answer -> optional action proposal -> human confirmation.
- Next.js App Router + Server Actions là pattern nội bộ; route/components không gọi Supabase hoặc repository trực tiếp.
- Service boundary là `src/modules/*/services/*-service.ts`; repository adapter là `services/*-repository.ts`; DTO dùng camelCase, DB row mapping dùng snake_case.
- AI Gateway/Coordinator là điểm tập trung duy nhất cho AI. Không thêm Redux/Zustand, không thêm Prisma/Drizzle/tRPC, không upgrade Next/React/Supabase.
- Web search/MCP chỉ dùng cho external discovery/intake vào Knowledge Center; kết quả phải review/approve trước khi thành RAG authoritative.

### Permission And Scope Requirements

- Permission keys canonical ở `src/lib/permissions/can.ts`: `ai.ask`, `ai.use_rag`, `ai.view_insight`, `ai.create_draft`, `ai.propose_action`, `ai.confirm_action`, `knowledge.view` và module view permissions.
- `ai.use` suy ra `ai.ask`; `ai.view_insight` suy ra `ai.use_rag` và `ai.create_draft`; `ai.confirm_action` suy ra `ai.propose_action`. Không hardcode vai trò để bỏ qua `can/assertCan`.
- Scope resolution ở `src/lib/permissions/access-scope.ts` hỗ trợ internal full, internal assigned, external limited, read-only, project membership, task/document ownership và scope assignment. AI retrieval phải dùng cùng logic này.
- External roles và viewer không được render/đưa vào prompt dữ liệu rồi mới ẩn ở UI. Filter phải xảy ra trước khi context/citation/prompt được tạo.

### Files To Update Or Preserve

- Update/harden likely files: `src/modules/ai/services/ai-gateway-service.ts`, `ai-permissions.ts`, `ai-coordinator-service.ts`, `ai-worker-service.ts`, `ai-prompt-builder.ts`, `ai-response-validator.ts`, `ai-repository.ts`, `src/modules/knowledge/services/knowledge-indexing-service.ts`, `src/modules/knowledge/services/knowledge-index-repository.ts`.
- Preserve existing behavior in `src/modules/ai/actions.ts`: get current user, call service, revalidate `/ai`, `/command-center`, `/executive`, redirect to job detail.
- Preserve action proposal safety in `src/modules/ai/services/ai-action-proposal-service.ts`: accept/reject path must re-check `ai.confirm_action`, required domain permission and target scope before mutation.
- If `database/policies/001_mvp_rls.sql` or AI/knowledge migrations are touched, add targeted SQL policy tests or verification coverage.

### Data Contracts

- `AiInteraction`, `AiJob`, `AiCitation`, `AiActionProposal`, `AiScopeSnapshot` live in `src/modules/ai/types.ts`.
- Citation types are `knowledge_chunk`, `knowledge_item`, `internal_record`, `external_candidate_review_only`; Story 8.1 should only return authoritative citations from filtered internal records or approved knowledge chunks.
- `KnowledgeChunk` stores `accessLevel`, `status`, `effectiveDate`, `expiresAt`, `citation`, optional embedding metadata. RAG retrieval must exclude non-approved, expired, future-effective or access-disallowed chunks.
- Provider calls are behind `src/modules/ai/services/ai-provider.ts`; local/test default is mock. OpenAI-compatible mode is opt-in through env and should not be required for unit tests.

### Testing Requirements

- Minimum validation after implementation: `npm run typecheck`, `npm run lint`, `npm run test`.
- Targeted tests to run while iterating: `npm run test -- tests/unit/ai-job-service.test.ts tests/unit/ai-coordinator-service.test.ts tests/unit/ai-response-validator.test.ts tests/unit/knowledge-indexing.test.ts tests/unit/access-scope.test.ts`.
- If route/UI behavior changes, add component/e2e coverage; otherwise Story 8.1 can remain service/repository focused.
- Tests should inject temp JSON repositories and fake providers; do not require live OpenAI, live embeddings, live Supabase, or global mock-data state.

### Anti-Patterns To Avoid

- Do not trust model-provided citations or model claims of source use.
- Do not include raw prompt/source data in audit payloads or action proposal payloads when a compact safe summary is enough.
- Do not use unapproved external search results as RAG.
- Do not add a broad chatbot that can answer across modules without scoped retrieval.
- Do not let `job.projectId`, `resourceRefs` or `knowledgeModule` expand access beyond the current user permission/scope.
- Do not treat AI action proposals as completed domain mutations before human confirmation and domain service re-check.

### Latest Technical Information

- No new external API detail is required for this story. Use existing package versions and provider abstraction from `package.json` and `src/modules/ai/README.md`.
- Do not change model defaults, embedding model defaults, retry behavior, or provider endpoints unless implementation discovers a direct failing test or documented project decision.

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-8-executive-ai-advisory.md#Story-8.1]
- [Source: _bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#7.10-Executive-AI-Center]
- [Source: _bmad-output/planning-artifacts/epics/requirements-inventory.md#UX-Design-Requirements]
- [Source: _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#Decision-Priority-Analysis]
- [Source: _bmad-output/planning-artifacts/architecture/project-structure-boundaries.md#AI-Knowledge]
- [Source: _bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#Process-Patterns]
- [Source: docs/context/permissions-audit.md]
- [Source: docs/context/testing.md]
- [Source: src/modules/ai/README.md]
- [Source: src/modules/ai/services/ai-coordinator-service.ts]
- [Source: src/modules/knowledge/services/knowledge-indexing-service.ts]
- [Source: src/lib/permissions/can.ts]
- [Source: src/lib/permissions/access-scope.ts]

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- 2026-06-04T09:56:50+07:00 - Chuyển story và sprint status sang in-progress.
- 2026-06-04T10:00:00+07:00 - Xác nhận implementation hiện hữu: AI gateway/coordinator/worker/prompt/validator/repository và Knowledge indexing/retrieval đã tồn tại; tập trung harden citation requirement và proposal payload.
- 2026-06-04T10:00:35+07:00 - RED targeted tests failed as expected for internal citation requirement, mock answer citation id, and raw prompt in action proposal payload.
- 2026-06-04T10:01:31+07:00 - GREEN targeted AI tests passed after hardening validator/provider/proposal payload.
- 2026-06-04T10:03:27+07:00 - Full validation passed: typecheck, lint, full unit test suite.
- 2026-06-04T10:24:19+07:00 - Applied all code-review patch findings; targeted tests, typecheck, lint, and full unit test suite passed.

### Implementation Plan

- Thêm regression tests trước cho citation bắt buộc với internal context, mock provider phải trả citation id, và action proposal không chứa prompt thô.
- Siết validator để answer có citable internal context phải dùng citation hợp lệ, trừ khi nói rõ thiếu dữ liệu.
- Giữ proposal ở trạng thái draft/proposed và thay prompt thô bằng mô tả an toàn.

### Completion Notes List

- ready-for-dev story context created by BMAD create-story workflow.
- Hardened response validation so factual answers using citable internal context require a valid application-generated citation, while insufficient-data answers remain allowed.
- Updated mock provider output to include prompt-package citation ids such as `[CIT-001]` when citations are attached.
- Removed raw prompt/sourcePrompt from fallback AI action proposal payloads; proposals remain draft/proposed and require human confirmation.
- Verified existing gateway permission checks, worker permission re-check, scoped structured retrieval, approved RAG filtering, and no schema/persistence contract changes.
- Code review patches resolved: sanitized hidden projectId before prompt/proposal, hardened citation requirement, removed intent from proposal titles, and guarded negated risk wording.

### File List

- `_bmad-output/implementation-artifacts/8-1-ai-gateway-voi-permission-context-va-citation.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/modules/ai/services/ai-coordinator-service.ts`
- `src/modules/ai/services/ai-provider.ts`
- `src/modules/ai/services/ai-response-validator.ts`
- `tests/unit/ai-coordinator-service.test.ts`
- `tests/unit/ai-job-service.test.ts`
- `tests/unit/ai-response-validator.test.ts`

## Change Log

- 2026-06-04: Hardened AI citation validation, mock provider citation output, safe proposal payloads, and regression coverage for Story 8.1.
- 2026-06-04: Applied code-review fixes and marked Story 8.1 done after full validation.
