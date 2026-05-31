# Story 4.1: Decision Record Từ Approval, Meeting Hoặc Độc Lập

Status: done

Ghi chú tạo story: Ultimate context engine analysis completed - comprehensive developer guide created. Story này mở Epic 4 bằng decision record chính thức, phân biệt với approval action và meeting action item hiện có. Phạm vi là data/service/action contract, persistence mock + Supabase-ready, permission và audit cho tạo decision. Chưa tạo multi-assignment/task từ decision, chưa làm version/history khi sửa, và chưa xây full Decision & Assignment Center UI; các phần đó thuộc Story 4.2-4.4.

## Story

As a lãnh đạo,
I want tạo quyết định chính thức sau approval, sau meeting hoặc độc lập,
so that chỉ đạo điều hành được ghi nhận riêng với approval.

## Acceptance Criteria

1. **Tạo decision độc lập với scope rõ ràng**
   - Given người dùng có `decision.create` trong scope phù hợp
   - When tạo decision độc lập
   - Then hệ thống lưu `title`, `content`/nội dung chỉ đạo, scope (`organizationId`, `projectId` hoặc `projectIds`, `axisId`, `workstreamId`/`moduleId` nếu có), `ownerId`, `priority`, `dueDate` nếu có, `status`, linked records nếu có, `createdBy`, `decidedBy` và timestamp.
   - And decision cấp organization hoặc portfolio không bắt buộc phải gắn một `projectId` duy nhất.

2. **Tạo decision từ approval hoặc meeting nhưng vẫn là record riêng**
   - Given approval/proposal hoặc meeting có kết quả cần ban hành quyết định
   - When tạo decision từ nguồn đó
   - Then decision lưu liên kết nguồn (`sourceType`, `sourceId`, relation/link metadata) nhưng vẫn có id, lifecycle và audit riêng.
   - And việc tạo decision không tự approve/reject/forward approval, không tự hoàn tất meeting, không tự tạo task/assignment.
   - And source phải được kiểm tra quyền đọc trong scope trước khi dùng để prefill hoặc liên kết.

3. **Permission block không leak dữ liệu**
   - Given người dùng thiếu `decision.create`, thiếu quyền source, hoặc source/scope nằm ngoài phạm vi được giao
   - When gọi service/action tạo decision
   - Then mutation bị chặn trước khi ghi repository.
   - And lỗi trả về là domain error tiếng Việt đủ rõ, không serialize title/nội dung/source nhạy cảm của record bị cấm.

4. **Audit khi tạo decision**
   - Given decision được tạo thành công
   - When repository write hoàn tất
   - Then `AuditLog` ghi action `decision.created`, actor, entity `decision`, entity id, source summary, scope summary, oldValue rỗng và newValue an toàn.
   - And audit payload không chứa finance amount hoặc raw source detail nếu không cần cho Story 4.1.

5. **Mock/file-backed và Supabase-ready parity**
   - Given app chạy mock/file-backed mode
   - When tạo/list/get decision
   - Then JSON repository lưu/đọc cùng contract với service và test được bằng dependency injection.
   - Given app chạy Supabase-ready mode
   - When mapping decision row
   - Then migration/repository/RLS hỗ trợ các field mới, source linkage và organization/project/multi-project scope tương đương mock mode.

6. **Không phá decision/action item hiện có của Meeting Engine**
   - Given meeting detail hiện có đang dùng meeting decision/action item và `convertDecisionToTask`
   - When Story 4.1 được triển khai
   - Then các flow meeting action item hiện tại vẫn pass tests và vẫn có thể chuyển thành task.
   - And dev không được tạo một module/DB table trùng lặp nếu có thể mở rộng contract `decisions` hiện có một cách an toàn.

## Tasks / Subtasks

- [x] Chốt decision domain contract và boundaries (AC: 1, 2, 6)
  - [x] Reconcile `Decision` hiện ở `src/modules/meetings/types.ts` với official decision record: giữ backward compatibility cho meeting action item, nhưng bổ sung field chính thức thay vì tạo bảng/flow song song.
  - [x] Thêm/chuẩn hóa input type cho `CreateDecisionRecordInput`: title, content/decisionText, source, scope, owner, priority, dueDate, linkedRecords.
  - [x] Status ban đầu nên dùng key ổn định đang có trong `DECISION_STATUSES` nếu đủ; nếu cần status mới, update constants, validation, DB check/RLS/test cùng lúc.
  - [x] Không đưa assignment/task creation vào Story 4.1 ngoài việc bảo toàn `taskId` hiện có cho convert-to-task.

- [x] Repository và migration parity (AC: 1, 2, 5, 6)
  - [x] Update `src/modules/meetings/services/meeting-repository.ts` hoặc tách thin executive decision repository nếu cần, nhưng vẫn dùng cùng persistence contract cho `decisions`.
  - [x] JSON repository map đủ field mới; nếu đổi write path của `.mock-data/meetings-decisions.json`, cân nhắc temp-file + retry như các JSON repo vừa được harden để tránh race khi Vitest chạy song song.
  - [x] Supabase repository map snake_case/camelCase đầy đủ: `title`, `content`/`decision_text`, `organization_id`, `project_ids`, `axis_id`, `workstream_id`, `module_id`, `source_type`, `source_id`, `linked_records`, `priority`, `created_by`, `decided_by`.
  - [x] Thêm migration incremental mới sau `202605290003_*`; không sửa migration cũ. Migration phải nới `decisions.project_id` nếu cần organization/portfolio decision và thêm index theo source/scope/status.
  - [x] Update RLS/policy assets để read/create quyết định theo `decision.create`/`meeting.view`/scope đúng, không chỉ dựa vào `project_id` bắt buộc.

- [x] Service orchestration có permission và source resolution (AC: 1, 2, 3, 4)
  - [x] Tạo service chính trong `src/modules/executive/services` hoặc mở rộng service hiện có với tên rõ như `createDecisionRecord`, nhưng không để route/component gọi repository trực tiếp.
  - [x] Service nhận `actor`/current user và repository dependencies để unit test không cần session thật.
  - [x] Dùng `assertCan`/`can` cho `decision.create` và dùng scoped resource helpers để kiểm tra source: `getScopedProposal` cho proposal/approval, `getScopedMeeting` cho meeting, project/scope helper cho independent decision.
  - [x] Với source proposal/approval, chỉ liên kết record được phép đọc; không mutate proposal status/step/history.
  - [x] Với source meeting, không phụ thuộc meeting phải có `projectId`; organization/portfolio meeting vẫn tạo decision được nếu scope hợp lệ.
  - [x] Validate owner/project/source linkage: owner ngoài scope hoặc source ngoài scope phải bị chặn bằng domain error.

- [x] Server Actions và route integration tối thiểu (AC: 1, 2, 3)
  - [x] Thêm/điều chỉnh action trong module phù hợp (`src/modules/executive/actions.ts` nếu tạo mới, hoặc `src/modules/meetings/actions.ts` chỉ cho meeting context) để parse FormData bằng Zod và gọi service.
  - [x] Meeting detail hiện có có thể dùng service mới cho create-from-meeting, nhưng không làm lại toàn bộ UI nếu không cần.
  - [x] Nếu thêm entry point độc lập, dùng route hiện có hoặc route tối thiểu theo App Router; không xây full list/detail center của Story 4.4.
  - [x] Revalidate các route liên quan: decision log/meeting detail/project detail/command center nếu có dữ liệu decision mới.

- [x] Audit write an toàn (AC: 4)
  - [x] Dùng `createAuditLog` pattern hiện có từ `src/modules/users/services/user-service.ts` hoặc injection `auditWriter`.
  - [x] Audit action: `decision.created`.
  - [x] `newValue` chỉ chứa decision id/title/status/source/scope/owner/priority/dueDate/link summary; không dump nguyên source record hoặc finance data.
  - [x] Không tạo audit cho permission-denied mutation vì không có entity được tạo, trừ khi đã có local security-audit pattern rõ ràng.

- [x] Permission scope helper updates (AC: 1, 2, 3, 5)
  - [x] Update `canReadDecisionInScope`, `filterDecisionsForScope`, `listScopedDecisions`, `getScopedDecision` để hỗ trợ decision không có `projectId` đơn lẻ.
  - [x] Nếu decision có `projectIds`, allow khi ít nhất một project trong scope; nếu chỉ organization/axis/module, dùng scope assignment matcher thay vì cho global read mặc định.
  - [x] Preserve existing limited-scope behavior for contractors/viewers and existing project-bound decisions.

- [x] Tests (AC: 1-6)
  - [x] Unit tests cho create independent decision thành công với project scope và organization-only scope.
  - [x] Unit tests cho create decision từ meeting có `projectId`, meeting không có `projectId`, và unauthorized meeting source.
  - [x] Unit tests cho create decision từ proposal/approval source được phép và unauthorized proposal source bị chặn.
  - [x] Unit tests cho permission block: thiếu `decision.create`, owner/source/scope ngoài phạm vi, không ghi repository/audit.
  - [x] Unit tests cho audit `decision.created` chỉ sau successful write và payload an toàn.
  - [x] Repository tests cho JSON/Supabase mapping field mới nếu repository adapter được mở rộng.
  - [x] Regression tests cho existing meeting decision/action item và `convertDecisionToTask`.
  - [x] Run at minimum `npm run typecheck`, `npm run lint`, `npm run test`; run `npm run test:e2e` nếu route/UI behavior thay đổi.

### Review Findings (Chunk 1: Core service/permission/action)

- [x] [Review][Patch] Multi-project decision creation authorizes when any project matches instead of every project in scope [src/modules/executive/services/decision-record-service.ts:250]
- [x] [Review][Patch] Project-scoped decision can assign an unknown or unscoped owner because zero memberships pass validation [src/modules/executive/services/decision-record-service.ts:287]
- [x] [Review][Patch] Meeting decision action still writes through the legacy service, bypassing official `decision.created` audit and current-actor metadata [src/modules/meetings/actions.ts:114]
- [x] [Review][Patch] User-supplied `sourceId`/`linkedRecords` can be stored without source/read-scope validation [src/modules/executive/services/decision-record-service.ts:353]
- [x] [Review][Patch] Source-linked decisions can override `workstreamId`/`moduleId` away from the source scope [src/modules/executive/services/decision-record-service.ts:127]
- [x] [Review][Patch] Executive decision FormData parsing throws raw JSON errors for malformed `linkedRecordsJson` [src/modules/executive/actions.ts:29]

### Review Findings (Chunk 2-3: Persistence/RLS/tests/spec tracking)

- [x] [Review][Patch] Supabase `listDecisions({ projectId })` ignores `project_ids`, so multi-project decisions disappear in Supabase while JSON mode returns them [src/modules/meetings/services/meeting-repository.ts:545]
- [x] [Review][Patch] Decision RLS write policies reuse the read-scope helper, allowing multi-project create/update when the user can access only one project [database/policies/001_mvp_rls.sql:951]
- [x] [Review][Patch] Decision RLS does not validate proposal/approval source read access, so direct Supabase inserts can link arbitrary proposal/approval sources when project scope is omitted [database/policies/001_mvp_rls.sql:291]

## Dev Notes

### Bối Cảnh Nghiệp Vụ

- Epic 4 objective: lãnh đạo ban hành quyết định/chỉ đạo khác biệt với approval, tạo assignment/task từ decision, gán deadline/KPI/ưu tiên, theo dõi trạng thái và giữ version/history khi sửa nội dung quan trọng. Story 4.1 chỉ tạo decision record nền tảng. [Source: `_bmad-output/planning-artifacts/epics.md:989`]
- FR-045 phân biệt rõ Approval và Decision: approval là hành động duyệt một request cụ thể; decision là quyết định/chỉ đạo chính thức của lãnh đạo. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md:263`]
- FR-046 yêu cầu decision có thể tạo sau approval, sau meeting hoặc độc lập. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md:265`]
- FR-047/FR-048/FR-050/FR-051 thuộc các story sau trong Epic 4; Story 4.1 không nên triển khai sâu assignment, version/history UI hoặc full center. [Source: `_bmad-output/planning-artifacts/epics.md:1024`]
- NFR-005/NFR-006 yêu cầu mutation quan trọng kiểm tra quyền server/service và decision mutation phải ghi audit log. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md:481`]

### Architecture Guardrails

- Stack hiện tại là Next.js App Router + TypeScript strict modular monolith, Tailwind/shadcn-ready UI, Supabase-ready persistence, Vitest, Testing Library và Playwright. Không scaffold lại, không thêm ORM/tRPC/global state. [Source: `_bmad-output/planning-artifacts/architecture.md:44`]
- Domain modules nằm trong `src/modules/{module}`; repository trong `services/*-repository.ts`; orchestration trong `services/*-service.ts`; migrations trong `database/migrations`. [Source: `_bmad-output/planning-artifacts/architecture.md:226`]
- Internal UI mutations dùng Server Actions + service layer; routes/components không gọi Supabase hoặc repository trực tiếp. [Source: `_bmad-output/planning-artifacts/architecture.md:160`]
- Permission enforce deny-by-default ở server/service trước UI; RLS là defense-in-depth cho Supabase. [Source: `_bmad-output/planning-artifacts/architecture.md:152`]
- Data model project-centric nhưng phải cho phép decision cấp organization hoặc multi-project khi nghiệp vụ cần. [Source: `_bmad-output/planning-artifacts/architecture.md:131`]
- Không hardcode role name/người duyệt/KPI/module future trong UI/service; dùng permission keys và scope assignments. [Source: `_bmad-output/planning-artifacts/architecture.md:277`]
- Không nâng cấp Next/React/TypeScript hoặc thêm thư viện mới trong story này; dùng versions đang pin trong `package.json`.

### Current Code State (Read Before Editing)

- `src/modules/meetings/types.ts`
  - Hiện có `Decision` với `meetingId?`, `projectId` bắt buộc, `decisionText`, `ownerId`, `dueDate`, `status`, `taskId`, timestamps.
  - `DecisionInput` hiện bắt buộc `meetingId`, phù hợp action item sau họp nhưng chưa đủ cho decision độc lập hoặc source approval.
  - Story này cần mở rộng contract mà không làm mất type compatibility cho `DecisionList` và `convertDecisionToTask`.

- `src/modules/meetings/services/meeting-service.ts`
  - `createDecision(input)` parse `decisionInputSchema`, load meeting, bắt buộc meeting tồn tại và có `projectId`, rồi ghi decision.
  - `convertDecisionToTask(decisionId)` đang dựa vào `decision.projectId`, `decision.decisionText`, `ownerId`, `dueDate`, `taskId`.
  - Nếu nới decision không có `projectId`, convert-to-task phải vẫn chặn rõ hoặc yêu cầu project-bound decision.

- `src/modules/meetings/services/meeting-repository.ts`
  - JSON/Supabase repository hiện map `decisions` với columns: `meeting_id`, `project_id`, `decision_text`, `owner_id`, `due_date`, `status`, `task_id`, timestamps.
  - Supabase adapter chưa có source/scope/priority/title/createdBy/decidedBy/linkedRecords.
  - JSON repo đang ghi trực tiếp `.mock-data/meetings-decisions.json`; nếu dev thêm nhiều tests ghi song song, cần harden để tránh race như đã xảy ra với notification/user repos ở Story 3.5.

- `src/modules/meetings/actions.ts`
  - `createDecisionAction(meetingId, formData)` chỉ cho meeting context: `assertCan(currentUser, "decision.create")`, `getScopedMeeting`, rồi gọi `createDecision`.
  - `convertDecisionToTaskAction` check `task.create`, `getScopedDecision`, `getScopedProject`.
  - Story này có thể giữ action hiện có và thêm action mới cho official decision record, hoặc migrate action hiện có qua service mới miễn regression tests pass.

- `src/lib/permissions/access-scope.ts` và `src/lib/permissions/scoped-resources.ts`
  - `canReadDecisionInScope` hiện chỉ nhận `id` + `projectId`; assignment-model target đang dùng module `"meeting"` với workstream `"decision"`.
  - `listScopedDecisions`/`getScopedDecision` phụ thuộc `listDecisions`/`getDecision` từ meeting service.
  - Cần mở rộng để xử lý decision organization-only/multi-project/source-linked mà không default leak cho limited-scope roles.

- `database/migrations/202605160001_create_mvp_core_schema.sql`, `202605170001_add_decision_task_link.sql`, `database/policies/001_mvp_rls.sql`
  - `public.decisions.project_id` hiện `not null`; RLS read/create dựa vào `project_id` và `meeting.view`/`decision.create`.
  - Story này cần migration incremental để support source/scope mới và RLS tương ứng. Không sửa migration cũ.

- `src/modules/proposals`
  - Proposal/approval history dùng `proposal_decisions` cho approval actions, không phải official executive decision.
  - `getScopedProposal` đã có trong `src/lib/permissions/scoped-resources.ts`; dùng để kiểm tra source proposal trước khi tạo decision từ approval/proposal.
  - Không mutate proposal status hoặc proposal_decisions khi tạo official decision ở Story 4.1.

- `src/modules/executive`
  - `DecisionLog`/`ExecutiveDecisionLogItem` hiện là mock leadership dashboard data; chưa phải persistence service chính thức.
  - `src/app/executive/decision-log/page.tsx` render legacy/mock decision log. Không cần rebuild full UI center trong Story 4.1.

### Suggested Data Contract

Use one serializable domain type that remains compatible with existing meeting action items:

```ts
export type DecisionSourceType = "independent" | "proposal" | "approval" | "meeting";

export type DecisionLinkedRecord = {
  type: "project" | "proposal" | "approval" | "meeting" | "task" | "document" | "risk" | "custom";
  id: string;
  relationType: "source" | "context" | "generated_action" | "dependency";
  title?: string;
};

export type Decision = TimestampFields & {
  id: EntityId;
  title: string;
  decisionText: string;
  organizationId?: EntityId;
  projectId?: EntityId;
  projectIds?: EntityId[];
  axisId?: string;
  workstreamId?: string;
  moduleId?: string;
  meetingId?: EntityId;
  sourceType: DecisionSourceType;
  sourceId?: EntityId;
  linkedRecords: DecisionLinkedRecord[];
  ownerId?: EntityId;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  status: DecisionStatus;
  taskId?: EntityId;
  createdBy: EntityId;
  decidedBy: EntityId;
  decidedAt: string;
};
```

If dev chooses a slightly different shape, it must still satisfy AC fields, preserve current `DecisionList`, and keep JSON/Supabase mapping equivalent.

### Source Linking Rules

- `sourceType: "independent"`: no source permission lookup, but scope must be explicitly provided and permitted.
- `sourceType: "meeting"`: load via `getScopedMeeting`; derive default scope from meeting (`organizationId`, `projectId`, `projectIds`, `axisId`, `departmentId`) but allow explicit narrower scope only if still permitted.
- `sourceType: "proposal"` or `"approval"`: load via `getScopedProposal`; derive project/scope from proposal and linked approval detail. Do not use raw proposal repository without scope guard.
- Store source as metadata on decision; linked records can include source plus project. Do not duplicate source content beyond title/id/type needed for audit/display.

### Audit Payload Guidance

`AuditLog.newValue` should be compact and safe:

```ts
{
  title,
  status,
  priority,
  ownerId,
  dueDate,
  source: { type: sourceType, id: sourceId },
  scope: { organizationId, projectId, projectIds, axisId, workstreamId, moduleId },
  linkedRecordCount: linkedRecords.length
}
```

Do not include proposal amount, finance amount, raw meeting transcript/minutes, raw approval notes, or raw audit old/new values from source.

### Previous Story Intelligence

- Story 3.5 added shared notification/audit side-effect handling and uncovered JSON repo write races during parallel Vitest on Windows. If Story 4.1 adds/changes JSON writes for `meetings-decisions.json`, use robust writes or isolated temp repos in tests.
- Story 3.5 kept finance redaction and audit permission gates as service-layer concerns before DTO serialization. Decision source linking must follow the same no-leak rule.
- Story 3.5 validation passed `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run test:e2e`; use the same quality bar if routes/UI change.

### Git / Repo State Notes

- Recent commits are sparse (`484589a 2205`, `a8162e3 first fcm`), and the worktree contains many pre-existing modified/untracked files from prior BMAD work. Do not revert unrelated files.
- This story should be implemented with focused diffs around decision types/repository/service/actions/permissions/migration/tests.

### Testing Guidance

Recommended targeted tests before full validation:

```bash
npm run test -- tests/unit/meeting-service.test.ts tests/unit/permissions.test.ts tests/unit/access-scope.test.ts
```

Full validation before marking complete:

```bash
npm run typecheck
npm run lint
npm run test
```

Run e2e if any route/form behavior changes:

```bash
npm run test:e2e
```

### Checklist Validation Notes

- Story maps ACs to tasks and keeps Story 4.1 scope separate from Stories 4.2-4.4.
- Current code state documents every risky update target.
- Architecture, permission, audit, mock/Supabase parity and testing constraints are explicit.
- Major ambiguity resolved: existing meeting `Decision` is not enough for official decision record, but should be extended/reused rather than duplicated.
- No unresolved clarification required before dev-story.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -- tests/unit/decision-record-service.test.ts tests/unit/meeting-service.test.ts tests/unit/access-scope.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run test`

### Completion Notes List

- Extended the existing meeting `Decision` contract for official decision records while preserving meeting action item and `convertDecisionToTask` compatibility.
- Added `createDecisionRecord` service with actor/dependency injection, scoped source resolution for meeting/proposal/approval, independent scope validation, owner scope checks, and safe `decision.created` audit writes after repository success.
- Added minimal executive Server Action for official decision creation and route revalidation without building the full Decision Center UI.
- Updated JSON and Supabase repository mapping for title/content, source linkage, organization/project/multi-project scope, priority, creator/decider fields, linked records, and robust JSON writes.
- Added Supabase migration/RLS helper/policy updates for nullable `project_id`, source/scope indexes, and create/read/update checks beyond single-project decisions.
- Updated decision scope filtering for multi-project and organization-only decisions without leaking to limited roles.
- Covered independent, meeting, proposal/approval, permission denial, owner out-of-scope, audit safety, repository mapping, and meeting action item regression tests.

### File List

- `_bmad-output/implementation-artifacts/4-1-decision-record-tu-approval-meeting-hoac-doc-lap.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `database/migrations/202605300001_extend_decision_records.sql`
- `database/policies/001_mvp_rls.sql`
- `src/lib/permissions/access-scope.ts`
- `src/modules/executive/actions.ts`
- `src/modules/executive/services/decision-record-service.ts`
- `src/modules/meetings/actions.ts`
- `src/modules/meetings/services/meeting-repository.ts`
- `src/modules/meetings/services/meeting-service.ts`
- `src/modules/meetings/types.ts`
- `src/modules/meetings/validation.ts`
- `tests/unit/access-scope.test.ts`
- `tests/unit/decision-record-service.test.ts`
- `tests/unit/meeting-service.test.ts`

### Change Log

- 2026-05-30: Implemented Story 4.1 official decision record contract, service/action integration, persistence/RLS parity, permission updates, and tests. Status moved to review.
