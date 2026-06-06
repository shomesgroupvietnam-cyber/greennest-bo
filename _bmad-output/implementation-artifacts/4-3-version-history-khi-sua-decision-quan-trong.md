# Story 4.3: Version/History Khi Sửa Decision Quan Trọng

Status: done

Ghi chú tạo story: Ultimate context engine analysis completed. Story này phụ thuộc Story 4.1 official decision record và Story 4.2 assignment/task linkage đã hoàn tất. Phạm vi là service/action/persistence/component contract để cập nhật official decision có version/history cho thay đổi quan trọng, đồng thời audit mọi mutation. Không xây full Decision & Assignment Center UI của Story 4.4 và không chỉnh sửa flow approval history của Epic 3.

## Story

As a lãnh đạo hoặc kiểm soát viên,
I want decision lưu version/history khi sửa deadline, owner, scope, priority, KPI hoặc chỉ đạo bổ sung,
so that thay đổi quan trọng có thể truy vết.

## Acceptance Criteria

1. **Version hóa khi sửa field quan trọng**
   - Given official decision đã tồn tại, actor đọc được decision trong scope và có quyền cập nhật decision trong scope đó
   - When actor sửa một hoặc nhiều field quan trọng: `decisionText`/`content`, `ownerId`, `dueDate`, `priority`, `status`, `organizationId`, `projectId`, `projectIds`, `axisId`, `workstreamId`, `moduleId`, `linkedRecords` liên quan đến chỉ đạo bổ sung, hoặc decision-level `kpi` nếu implementation bổ sung field này
   - Then hệ thống tạo `DecisionVersion`/history record bất biến với `decisionId`, `versionNumber`, `changedFields`, previous values, new values, actor, timestamp và `reason` nếu có
   - And decision hiện tại được cập nhật `updatedAt` bằng timestamp mutation, không đổi `id`, `createdAt`, `createdBy`, `sourceType`, `sourceId` trừ khi có rule migrate rõ ràng.

2. **Audit mọi mutation nhưng chỉ version hóa theo rule đã định**
   - Given actor sửa nội dung không thuộc danh sách important fields, ví dụ `title` hoặc metadata hiển thị không ảnh hưởng điều hành
   - When service cập nhật decision
   - Then hệ thống vẫn ghi audit action như `decision.updated` với payload an toàn
   - And không tạo version record nếu không có important field thực sự thay đổi
   - And nếu submit không làm thay đổi giá trị nào sau normalize, service không ghi decision, không tạo version và không ghi success audit.

3. **Timeline history dễ đọc trên decision detail**
   - Given user mở decision detail hoặc component detail nhận decision history DTO
   - When history được render
   - Then timeline hiển thị version events và audit summaries theo thứ tự thời gian rõ ràng, có actor, thời điểm, reason nếu có, danh sách field thay đổi và nhãn previous/new value an toàn
   - And timeline không render raw proposal finance amount, meeting transcript/minutes, document nội dung nhạy cảm hoặc audit payload nhạy cảm.

4. **Permission, scope và owner validation trước write**
   - Given actor không có quyền cập nhật decision trong scope, owner mới không nằm trong scope decision, hoặc scope mới không còn nằm trong quyền actor
   - When actor submit update
   - Then service chặn bằng domain error tiếng Việt, không update decision, không tạo version và không ghi success audit
   - And direct server action/API không được dựa vào UI disabled state.

5. **Mock/file-backed và Supabase-ready parity**
   - Given app chạy mock/file-backed mode
   - When decision update có hoặc không có important field
   - Then JSON repository lưu/đọc decision history cùng domain contract với Supabase adapter và unit tests dùng dependency injection
   - Given app chạy Supabase-ready mode
   - When migration/RLS/repository mapping được áp dụng
   - Then `decision_versions` hoặc relation tương đương có snake_case/camelCase parity, index theo `decision_id`, `version_number`, `created_at`, RLS SELECT theo scoped decision access, INSERT theo scoped decision write access, và không cho UPDATE/DELETE version records từ app role.

6. **Không phá Story 4.1/4.2 và legacy meeting action item**
   - Given existing official decision creation, decision assignment creation và legacy meeting decision/action item tests
   - When Story 4.3 được triển khai
   - Then các flow này vẫn pass, không tạo model decision song song và không dùng `Decision.taskId` legacy để biểu diễn version/history.

## Tasks / Subtasks

- [x] Xác nhận dependency và rule versioning trước khi code (AC: 1, 2, 6)
  - [x] Verify Story 4.1/4.2 code hiện có: `createDecisionRecord`, `createDecisionAssignments`, scoped decision helpers, JSON/Supabase decision repository.
  - [x] Định nghĩa hằng số important fields cho decision update trong service, không rải rule ở UI/component.
  - [x] Chốt `kpi`: nếu decision domain chưa có field `kpi`, chỉ thêm decision-level `kpi` khi cần cho FR-050; không sửa assignment `kpi` trong story này nếu không có assignment update flow.
  - [x] Non-important fields phải audit-only, important fields phải version + audit.

- [x] Mở rộng domain contract và validation (AC: 1, 2, 4, 5)
  - [x] Thêm type như `DecisionVersion`, `DecisionVersionValue`, `DecisionHistoryEvent`, `UpdateDecisionRecordInput`.
  - [x] Thêm schema như `updateDecisionRecordInputSchema` trong `src/modules/meetings/validation.ts`.
  - [x] Enforce `dueDate` date-only `YYYY-MM-DD`; timestamps vẫn ISO string.
  - [x] Normalize arrays/strings trước diff để tránh version giả do thứ tự/trailing whitespace không đổi nghĩa.
  - [x] Không cho client mutate protected fields: `id`, `createdAt`, `createdBy`, `sourceType`, `sourceId`, `taskId`.

- [x] Thêm persistence version/history parity (AC: 1, 2, 5)
  - [x] Mở rộng `MeetingRepository` với các method tối thiểu: `listDecisionVersions(decisionId)`, `createDecisionVersion(version)`, và update decision theo contract hiện có.
  - [x] JSON store `.mock-data/meetings-decisions.json` thêm `decisionVersions: DecisionVersion[]` với normalize/sort ổn định.
  - [x] Supabase adapter thêm row mapping cho `decision_versions` hoặc relation tương đương.
  - [x] Thêm migration incremental sau `202605310001_create_decision_assignments.sql`, ví dụ `202605310002_create_decision_versions.sql`.
  - [x] Version table fields đề xuất: `id`, `decision_id`, `version_number`, `changed_fields text[]`, `previous_value jsonb`, `new_value jsonb`, `reason text`, `created_by`, `created_at`.
  - [x] Unique constraint `(decision_id, version_number)` và index `decision_id`, `created_at desc`.
  - [x] RLS/policies mirror `current_user_can_access_decision_scope` và `current_user_can_write_decision_scope`; không có app-level update/delete policy cho version rows.

- [x] Implement service update có all-or-nothing behavior (AC: 1, 2, 4, 6)
  - [x] Thêm service như `updateDecisionRecord(input, actor, dependencies)` trong `src/modules/executive/services/decision-record-service.ts`.
  - [x] Load decision qua `getScopedDecision`; actor không đọc được thì trả lỗi "Bạn không có quyền đọc decision hoặc decision không tồn tại."
  - [x] Check write permission server-side bằng rule đang dùng cho official decision mutation (`decision.create`/scoped helper hiện có hoặc helper rõ ràng mới nếu cập nhật catalog đầy đủ).
  - [x] Validate owner mới tồn tại/active và thuộc project scope tương tự create decision.
  - [x] Validate scope mới không vượt source scope và không vượt quyền actor.
  - [x] Compute diff sau normalize; important diff tạo version, non-important diff audit-only.
  - [x] Nếu repository write/audit/version fail sau một phần write trong mock mode, rollback/compensate tương tự bài học Story 4.2 hoặc dùng method repository atomic rõ ràng.
  - [x] Supabase path nên dùng RPC/transactional repository method nếu cần để decision update + version insert + audit không lệch nhau.

- [x] Server action và revalidation (AC: 2, 3, 4)
  - [x] Thêm action trong `src/modules/executive/actions.ts` để parse FormData bằng Zod và gọi service update.
  - [x] FormData hỗ trợ `decisionId`, fields được phép cập nhật và `reason`.
  - [x] Revalidate tối thiểu `/executive/decision-log`, `/command-center`, decision detail route nếu tồn tại, meeting/project routes liên quan khi scope/source có link.
  - [x] Không expose raw `previousValue`/`newValue` nhạy cảm từ action response cho client không cần thiết.

- [x] History timeline component contract (AC: 3)
  - [x] Thêm component nhỏ như `src/modules/executive/components/decision-history-timeline.tsx`.
  - [x] Props nhận DTO đã sanitize, không tự gọi repository trong component.
  - [x] Render compact timeline tiếng Việt: loại event, actor label/id fallback, timestamp, changed fields, reason, previous/new summary.
  - [x] Empty state gọn cho decision chưa có history.
  - [x] Không xây full Decision & Assignment Center list/table của Story 4.4.

- [x] Audit và data-safety (AC: 2, 3, 4)
  - [x] Audit success action đề xuất `decision.updated`.
  - [x] Audit `oldValue`/`newValue` chỉ chứa safe summary: `decisionId`, `changedFields`, `versionNumber?`, `scope`, `ownerId`, `priority`, `status`, `dueDate`, `reasonProvided`.
  - [x] Không dump raw `decisionText` dài, proposal amount, finance payload, meeting transcript/minutes, document body hoặc full linked source.
  - [x] Permission/validation fail không ghi success audit.

- [x] Tests (AC: 1-6)
  - [x] Unit test important field update tạo version với previous/new, actor, timestamp, reason và audit.
  - [x] Unit test non-important update chỉ audit, không tạo version.
  - [x] Unit test no-op update không write/audit/version.
  - [x] Unit test permission denied, owner out-of-scope và scope escalation fail all-or-nothing.
  - [x] Repository tests cho JSON/Supabase row mapping `decision_versions`.
  - [x] RLS policy text test trong `tests/unit/decision-rls-policy.test.ts` cho SELECT/INSERT và immutability của version rows.
  - [x] Component test cho timeline ordering, empty state và sanitize previous/new value.
  - [x] Regression tests cho `decision-record-service`, `decision-assignment-service`, `meeting-service`.
  - [x] Run tối thiểu `npm run typecheck`, `npm run lint`, `npm run test`; chỉ run e2e nếu thêm route/form visible.

### Review Findings

- [x] [Review][Patch] Add transactional Supabase update/version/audit path for immutable decision versions [src/modules/executive/services/decision-record-service.ts:775]
- [x] [Review][Patch] Update permission only checks the destination scope [src/modules/executive/services/decision-record-service.ts:721]
- [x] [Review][Patch] JSON repository drops project scope edits during decision update [src/modules/meetings/services/meeting-repository.ts:159]

## Dev Notes

### Bối Cảnh Nghiệp Vụ

- Epic 4 yêu cầu decision/chỉ đạo khác approval, có assignment/task, KPI/deadline/priority và giữ version/history khi sửa nội dung quan trọng. [Source: `_bmad-output/planning-artifacts/epics/epic-4-decision-assignment-center.md`]
- Story 4.3 cover FR-050, NFR-006 và UX-DR15: sửa deadline, owner, scope, priority, KPI hoặc chỉ đạo bổ sung phải truy vết; approval/decision/risk/meeting/export/permission mutations đều phải audit. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md`]
- AC nghiệm thu Module 1 có demo sửa deadline tạo version/history. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md`]

### Architecture Guardrails

- Giữ modular monolith Next.js + TypeScript; service orchestration trong `src/modules/*/services`, repository mapping trong `services/*-repository.ts`, migrations trong `database/migrations`, RLS trong `database/policies`. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`]
- Mutation flow chuẩn: request -> session/scope -> service validation -> repository -> audit/history -> revalidate. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`]
- Permission enforce deny-by-default ở action/service; RLS chỉ là defense-in-depth. [Source: `_bmad-output/project-context.md`; `docs/context/permissions-audit.md`]
- Domain DTO dùng camelCase, DB/repository adapter map snake_case. [Source: `_bmad-output/project-context.md`]
- Không tạo model decision song song; reuse `Decision` contract trong `src/modules/meetings/types.ts` và executive-facing service trong `src/modules/executive/services`. [Source: `docs/context/decision-assignment.md`]

### Current Code State (Read Before Editing)

- `src/modules/meetings/types.ts` đã có official `Decision` mở rộng bởi Story 4.1: `organizationId`, `projectIds`, `axisId`, `workstreamId`, `moduleId`, `sourceType`, `sourceId`, `linkedRecords`, `priority`, `decidedBy`, `decidedAt`.
- `src/modules/executive/services/decision-record-service.ts` hiện chỉ có `createDecisionRecord`; có helper scope/source/owner/linked-record validation nên Story 4.3 nên reuse hoặc extract, không copy rule mới lệch.
- `src/modules/meetings/services/meeting-repository.ts` đã có `createDecision`, `updateDecision`, `listDecisionAssignments`, `createDecisionAssignments`, `deleteDecisionAssignments`; chưa có decision version repository contract.
- `src/modules/executive/actions.ts` hiện có `createDecisionRecordAction` và `createDecisionAssignmentsAction`; update action nên nằm cùng boundary này.
- `database/migrations/202605300001_extend_decision_records.sql` đã mở rộng `decisions` và thêm `current_user_can_access_decision_scope` / `current_user_can_write_decision_scope`.
- `database/migrations/202605310001_create_decision_assignments.sql` là migration mới nhất cho Epic 4 trước story này; migration mới phải incremental sau file này.
- `database/policies/001_mvp_rls.sql` đã mirror decision và decision assignment policies; cần thêm policy cho decision versions vào cả migration mới và consolidated policy file nếu project đang duy trì parity.
- `src/lib/audit/README.md` chỉ là hướng dẫn ngắn; audit implementation thực tế là `createAuditLog` trong `src/modules/users/services/user-service.ts`.

### Suggested Data Contract

```ts
export type DecisionVersionField =
  | "decisionText"
  | "ownerId"
  | "dueDate"
  | "priority"
  | "status"
  | "organizationId"
  | "projectId"
  | "projectIds"
  | "axisId"
  | "workstreamId"
  | "moduleId"
  | "linkedRecords"
  | "kpi";

export type DecisionVersion = TimestampFields & {
  id: EntityId;
  decisionId: EntityId;
  versionNumber: number;
  changedFields: DecisionVersionField[];
  previousValue: Partial<Record<DecisionVersionField, unknown>>;
  newValue: Partial<Record<DecisionVersionField, unknown>>;
  reason?: string;
  createdBy: EntityId;
};

export type UpdateDecisionRecordInput = {
  decisionId: EntityId;
  title?: string;
  content?: string;
  decisionText?: string;
  ownerId?: EntityId;
  dueDate?: string;
  priority?: TaskPriority;
  status?: DecisionStatus;
  organizationId?: EntityId;
  projectId?: EntityId;
  projectIds?: EntityId[];
  axisId?: string;
  workstreamId?: string;
  moduleId?: string;
  linkedRecords?: DecisionLinkedRecord[];
  kpi?: string;
  reason?: string;
};
```

If `kpi` is added to `Decision`, update type, schema, JSON mapping, Supabase row/migration and audit/version sanitizers together. If not added, document that assignment-level KPI updates are out of scope until an assignment update story exists.

### Versioning Rules

- Important fields create one version record per successful update call, not one row per field.
- `versionNumber` should be `max(existing.versionNumber) + 1` per decision.
- Previous/new values should be field-scoped and sanitized; do not store entire decision snapshots unless explicitly redacted.
- Normalize before diff:
  - trim text fields;
  - sort/de-duplicate `projectIds` if business order is irrelevant;
  - normalize empty strings to `undefined`;
  - compare `linkedRecords` structurally after removing transient UI-only fields.
- `reason` is optional per AC, but should be preserved when provided.

### Previous Story Intelligence

- Story 4.1 established official decision records and review patches around source scope, source validation, audit safety, multi-project permission and malformed JSON parsing.
- Story 4.2 established assignment/task linkage, child `decision_assignments`, rollback expectations, assignee visibility checks, immutable task linkage and date-only due dates.
- Use the 4.2 rollback lesson for update + version + audit consistency; do not leave a version row if the decision update fails, and do not update the decision if version insert is required but fails.

### Testing Guidance

Recommended targeted tests while implementing:

```bash
npm run test -- tests/unit/decision-record-service.test.ts tests/unit/decision-assignment-service.test.ts tests/unit/meeting-service.test.ts tests/unit/decision-rls-policy.test.ts
```

Then run:

```bash
npm run typecheck
npm run lint
npm run test
```

Run e2e only if this story introduces a visible route/form:

```bash
npm run test:e2e
```

### Checklist Validation Notes

- Story maps each AC to tasks and explicit tests.
- Scope boundaries are clear: update/version/history component only; full Decision & Assignment Center remains Story 4.4.
- Current code state identifies service, repository, action, migration and RLS touchpoints before implementation.
- Permission, audit, RLS, mock/Supabase parity, no-op behavior and sensitive-data safety are explicit.
- No web research required because this story uses existing project stack, internal contracts and local architecture docs.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -- tests/unit/decision-record-service.test.ts tests/unit/executive-actions.test.ts tests/unit/meeting-repository-decision-version.test.ts tests/unit/decision-history-timeline.test.tsx tests/unit/decision-rls-policy.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run test -- tests/unit/decision-record-service.test.ts tests/unit/decision-assignment-service.test.ts tests/unit/meeting-service.test.ts tests/unit/decision-rls-policy.test.ts tests/unit/executive-actions.test.ts tests/unit/meeting-repository-decision-version.test.ts tests/unit/decision-history-timeline.test.tsx`
- `npm run test`
- Review patch validation: `npm run test -- tests/unit/decision-record-service.test.ts tests/unit/meeting-repository-decision-version.test.ts tests/unit/decision-rls-policy.test.ts`
- Review patch validation: `npm run test -- tests/unit/meeting-service.test.ts tests/unit/decision-record-service.test.ts`
- Review patch validation: `npm run test`
- Review patch validation: `npm run typecheck`
- Review patch validation: `npm run lint`

### Implementation Plan

- Thêm contract `DecisionVersion`/`UpdateDecisionRecordInput`, schema update và `kpi` decision-level để cover FR-050.
- Mở rộng `MeetingRepository` cho JSON/Supabase decision version parity, migration/RLS immutable version rows.
- Implement `updateDecisionRecord` với permission/owner/scope validation, diff normalize, audit-only/no-op behavior, version creation và rollback best-effort trong mock mode.
- Thêm server action update và timeline component nhận DTO đã sanitize.

### Completion Notes List

- Implemented decision update/version history for important fields with safe audit summaries and no-op detection.
- Added `decision_versions` persistence across JSON/Supabase mappings plus migration/RLS policy coverage.
- Added compact `DecisionHistoryTimeline` component that hides raw instruction body values while showing safe field changes.
- Added service/action/repository/RLS/component tests and regression coverage for decision assignment and meeting flows.
- E2E was not run because this story adds service/action/data/component contracts only, without a new visible route/form flow.
- Applied review patches: current and destination scope permission checks, JSON-backed scope update persistence, and Supabase RPC transaction path for decision update/version/audit.

### File List

- `_bmad-output/implementation-artifacts/4-3-version-history-khi-sua-decision-quan-trong.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `database/migrations/202605310002_create_decision_versions.sql`
- `database/policies/001_mvp_rls.sql`
- `src/modules/executive/actions.ts`
- `src/modules/executive/components/decision-history-timeline.tsx`
- `src/modules/executive/services/decision-record-service.ts`
- `src/modules/meetings/services/meeting-repository.ts`
- `src/modules/meetings/types.ts`
- `src/modules/meetings/validation.ts`
- `tests/unit/decision-assignment-service.test.ts`
- `tests/unit/decision-history-timeline.test.tsx`
- `tests/unit/decision-record-service.test.ts`
- `tests/unit/decision-rls-policy.test.ts`
- `tests/unit/executive-actions.test.ts`
- `tests/unit/meeting-repository-decision-version.test.ts`

### Change Log

- 2026-05-31: Implemented Story 4.3 decision version/history update contract, persistence, audit safety, timeline component, RLS, and tests; moved story to review.
- 2026-05-31: Applied code review patches and moved Story 4.3 to done.
