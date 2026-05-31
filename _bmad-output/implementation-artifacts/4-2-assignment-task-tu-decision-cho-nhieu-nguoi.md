# Story 4.2: Assignment/Task Từ Decision Cho Nhiều Người

Status: in-progress

Ghi chú tạo story: Ultimate context engine analysis completed - comprehensive developer guide created. Story này phụ thuộc Story 4.1 để có official decision record. Phạm vi là service/action/persistence contract cho việc tạo nhiều assignment/task từ một decision hợp lệ, validate target theo scope, link task về decision và audit mutation. Không xây full Decision & Assignment Center UI, không làm version/history khi sửa decision và không thêm bước người nhận xác nhận đã nhận việc.

## Story

As a lãnh đạo,
I want một quyết định có thể giao nhiều việc cho nhiều người/phòng ban/dự án,
so that chỉ đạo được chuyển thành hành động theo dõi được.

## Acceptance Criteria

1. **Tạo nhiều assignment/task từ một decision hợp lệ**
   - Given official decision tồn tại, chưa bị `cancelled`, và người dùng hiện tại có quyền đọc decision trong scope
   - When lãnh đạo hoặc thư ký/trợ lý được ủy quyền submit danh sách assignments
   - Then hệ thống tạo nhiều assignment records và nhiều tasks tương ứng, mỗi item có `decisionId`, `taskId`, `projectId`, `assigneeId` hoặc `departmentId` nếu có, `deadline`/`dueDate`, `priority`, `kpi` hoặc `description`, `createdBy` và timestamps.
   - And task được link ngược về decision bằng linked entity metadata hoặc relation tương đương, không dùng `Decision.taskId` legacy cho batch nhiều task.
   - And batch validation chạy trước write; lỗi validation/permission ở bất kỳ item nào phải chặn toàn bộ batch trước khi ghi repository.

2. **Không yêu cầu acknowledge trong MVP**
   - Given MVP không yêu cầu người nhận xác nhận đã nhận việc
   - When assignment được tạo thành công
   - Then assignment status ban đầu là trạng thái đã giao/chờ xử lý, ví dụ `assigned`, và task status ban đầu dùng status hiện có phù hợp, ví dụ `todo`.
   - And không thêm flow `acknowledge`, `acknowledgedAt`, notification bắt buộc hoặc recipient confirmation action trong story này.

3. **Scope validation cho assignee/project/department**
   - Given assignee, department hoặc project target nằm ngoài scope người tạo hoặc ngoài scope decision
   - When submit assignment
   - Then service chặn mutation bằng domain error tiếng Việt rõ ràng, không ghi assignment, không tạo task, không audit thành công.
   - And user assignee nếu có phải tồn tại và active; project target phải tồn tại, chưa archived và nằm trong scope người tạo.
   - And decision cấp organization hoặc multi-project không được tự chọn project mơ hồ: assignment item phải có `projectId` hợp lệ nếu decision không có đúng một project mặc định.

4. **Audit và data-safety cho mutation**
   - Given batch assignment tạo thành công
   - When repository writes hoàn tất
   - Then ghi audit action như `decision.assignments_created` với actor, decision id, số assignment/task tạo, project ids, assignee ids/department ids an toàn và summary field.
   - And audit payload không dump raw decision content, proposal finance amount, meeting transcript/minutes, hoặc dữ liệu source nhạy cảm.

5. **Mock/file-backed và Supabase-ready parity**
   - Given app chạy mock/file-backed mode
   - When tạo decision assignments
   - Then JSON repository đọc/ghi cùng domain contract với Supabase adapter và unit test dùng dependency injection, không phụ thuộc session thật.
   - Given app chạy Supabase-ready mode
   - When mapping rows
   - Then migration/repository/RLS hỗ trợ `decision_assignments` hoặc relation tương đương, task linked entity fields, scope filters, insert/update policies và snake_case/camelCase mapping tương đương mock mode.

6. **Không phá flow meeting decision/action item hiện có**
   - Given meeting action item hiện có dùng `createDecision` và `convertDecisionToTask`
   - When Story 4.2 được triển khai
   - Then các tests hiện có cho meeting decision và convert-to-task vẫn pass.
   - And implementation không biến legacy one-task conversion thành batch assignment nếu không có migration/backward-compat rõ ràng.

## Tasks / Subtasks

- [ ] Xác nhận dependency Story 4.1 trước khi code (AC: 1, 3, 6)
  - [ ] Kiểm tra code đã có official decision record/service từ Story 4.1 chưa; nếu chưa có, không xây Story 4.2 trên legacy meeting-only `Decision`.
  - [ ] Nếu Story 4.1 đã tạo `src/modules/executive/services/decision-service.ts` hoặc repository riêng, đặt assignment service cạnh contract đó.
  - [ ] Nếu Story 4.1 mở rộng `src/modules/meetings` để làm official decision repository, thêm thin executive-facing service cho assignment thay vì tạo repository song song.
  - [ ] Giữ `src/modules/meetings/services/meeting-service.ts#convertDecisionToTask` backward compatible cho action item một task.

- [ ] Thiết kế domain contract cho decision assignment (AC: 1, 2, 5)
  - [ ] Thêm type như `DecisionAssignment`, `DecisionAssignmentInput`, `CreateDecisionAssignmentsInput`, `DecisionAssignmentStatus`.
  - [ ] Field tối thiểu: `id`, `decisionId`, `taskId?`, `projectId`, `assigneeType`, `assigneeId?`, `departmentId?`, `title`, `description?`, `kpi?`, `dueDate?`, `priority`, `status`, `createdBy`, `createdAt`, `updatedAt`.
  - [ ] Không lưu assignment chỉ bằng array nhúng trong decision nếu cần list/filter ở Story 4.4; dùng child repository/table hoặc relation có thể query theo `decisionId`, `projectId`, `assigneeId`, `status`.
  - [ ] Nếu `departmentId` chưa có entity/table rõ, chỉ lưu như metadata trên assignment; không invent module phòng ban mới trong story này.
  - [ ] Nếu assignee là department/project-only, task có thể để `assigneeId` undefined nhưng assignment metadata phải đủ để UI Story 4.4 hiển thị.

- [ ] Mở rộng Task linkage contract an toàn (AC: 1, 5, 6)
  - [ ] `database/migrations/202605160001_create_mvp_core_schema.sql` đã có `tasks.linked_entity_type` và `linked_entity_id`; thêm domain fields tương ứng vào `src/modules/tasks/types.ts` nếu chưa có.
  - [ ] Update `TaskInput`, `taskInputSchema`, JSON/Supabase task repository mapping để preserve `linkedEntityType: "decision"` và `linkedEntityId: decision.id`.
  - [ ] Không đổi ý nghĩa `Task.status`; task tạo từ decision dùng `todo` mặc định trừ khi input hợp lệ chỉ định status khác.
  - [ ] Category nên dùng key ổn định như `decision`, không dùng label tiếng Việt làm machine key nếu service cần filter.

- [ ] Persistence và migration parity (AC: 1, 5)
  - [ ] Thêm migration incremental mới sau `202605290003_*`; không sửa migration cũ.
  - [ ] Tạo bảng/contract `decision_assignments` hoặc relation tương đương với FK tới `decisions`, `tasks`, `projects`, `users` khi có.
  - [ ] Index theo `decision_id`, `task_id`, `project_id`, `assignee_id`, `status`, `due_date`.
  - [ ] Thêm JSON repository hoặc mở rộng repository official decision từ Story 4.1; tránh ghi trực tiếp vào nhiều file khi có thể validate trước.
  - [ ] Nếu JSON write dùng file mới hoặc `.mock-data/meetings-decisions.json`, cân nhắc temp-file + retry như `JsonUserRepository` để tránh race trên Windows khi Vitest chạy song song.
  - [ ] Supabase adapter phải map snake_case/camelCase đầy đủ: `decision_id` -> `decisionId`, `task_id` -> `taskId`, `assignee_id` -> `assigneeId`, `due_date` -> `dueDate`.

- [ ] Service orchestration và batch validation (AC: 1, 2, 3, 4)
  - [ ] Tạo service như `createDecisionAssignments(input, actor, options)` với repository dependencies inject được trong tests.
  - [ ] Service phải load decision qua scoped helper/service từ Story 4.1; decision `cancelled` bị chặn, decision `done` chỉ được tạo thêm assignment nếu nghiệp vụ đã cho phép rõ.
  - [ ] Permission check: actor phải có quyền phù hợp cho decision assignment mutation và `task.create` trong từng target project; không chỉ dựa vào UI disabled state.
  - [ ] Validate toàn bộ batch trước write: item rỗng, trùng lặp vô nghĩa, project missing/archived/out-of-scope, assignee missing/inactive/out-of-scope, priority/date invalid đều fail cả batch.
  - [ ] Với decision có một `projectId`, assignment có thể default project đó; với multi-project hoặc organization-only decision, mỗi item phải chỉ định `projectId` hợp lệ.
  - [ ] Khi tạo task, dùng `createTask` hoặc task repository/service contract hiện có; caller phải chịu trách nhiệm permission vì `createTask` hiện chỉ validate project tồn tại.
  - [ ] Sau khi tasks tạo xong, persist assignment records với `taskId`; nếu persistence fail, không được cập nhật decision là đã assigned hoàn chỉnh.

- [ ] Server action và revalidation tối thiểu (AC: 1, 3, 4)
  - [ ] Thêm action trong `src/modules/executive/actions.ts` nếu official decision actions nằm ở executive; nếu 4.1 đặt action trong meetings, giữ boundary nhất quán.
  - [ ] Parse FormData/batch payload bằng Zod; không parse JSON tự do từ client mà không schema.
  - [ ] Action gọi `getCurrentUser`, assert permission server-side, gọi service, ghi audit hoặc để service gọi injected audit writer theo pattern đã chọn.
  - [ ] Revalidate các route liên quan: `/tasks`, decision detail/log route, `/command-center`, project detail nếu có task mới.
  - [ ] Nếu redirect sau mutation, gọi `revalidatePath` trước `redirect`.

- [ ] Audit và RLS/security (AC: 3, 4, 5)
  - [ ] Dùng `createAuditLog` hoặc injected `auditWriter`; audit action đề xuất `decision.assignments_created`.
  - [ ] Audit `newValue` chỉ chứa safe summary: `decisionId`, `assignmentCount`, `taskIds`, `projectIds`, `assigneeIds`, `departmentIds`, `status`.
  - [ ] Không audit thành công cho permission-denied/validation fail trừ khi đã có security-audit pattern riêng.
  - [ ] RLS cho `decision_assignments` phải bật trên public table; SELECT dùng scoped decision/project permission, INSERT dùng `with check` tương ứng `decision.create`/`task.create` và project scope.
  - [ ] Nếu task linked fields được thêm vào domain, task RLS hiện có vẫn phải enforce `task.create` theo `project_id`.

- [ ] Tests (AC: 1-6)
  - [ ] Unit test tạo nhiều assignments từ một decision project-bound, sinh nhiều tasks và link đúng `decisionId`.
  - [ ] Unit test initial assignment status `assigned` và task status `todo`; không có acknowledge fields/action.
  - [ ] Unit test batch validation all-or-nothing: một item out-of-scope hoặc invalid assignee thì không tạo assignment/task nào.
  - [ ] Unit test decision multi-project/organization-only yêu cầu `projectId` explicit và chỉ cho project hợp lệ trong scope.
  - [ ] Unit test audit chỉ ghi sau successful batch và payload không chứa raw decision/source content.
  - [ ] Repository mapping tests cho JSON và Supabase row parity, bao gồm task linked entity fields.
  - [ ] Regression tests cho `tests/unit/meeting-service.test.ts` hiện có: create decision under meeting và convert decision/action item to task.
  - [ ] Run tối thiểu `npm run typecheck`, `npm run lint`, `npm run test`; chạy `npm run test:e2e` nếu thêm route/form UI có thể tương tác.

## Dev Notes

### Bối Cảnh Nghiệp Vụ

- Epic 4 objective: lãnh đạo ban hành quyết định/chỉ đạo khác với approval, tạo assignment/task từ decision, gán deadline/KPI/ưu tiên, theo dõi trạng thái và giữ version/history khi sửa nội dung quan trọng. [Source: `_bmad-output/planning-artifacts/epics.md:989`]
- Story 4.2 cover FR-047, FR-048, FR-049, NFR-005 và NFR-007: một decision tạo nhiều assignment/task, MVP không cần người nhận xác nhận, mutation phải kiểm tra quyền server/service và UI/data model phải hỗ trợ multi-assignment. [Source: `_bmad-output/planning-artifacts/epics.md:1024`; `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md:267`; `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md:269`; `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md:271`; `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md:489`; `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md:493`]
- FR-045/FR-046 vẫn quan trọng: assignment tạo từ official decision, không lẫn với approval action hay meeting action item. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md:263`; `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md:265`]
- Story 4.4 sẽ làm full Decision & Assignment Center UI; Story 4.2 chỉ cần service/action/data contract và test đủ để UI sau này list/filter được. [Source: `_bmad-output/planning-artifacts/epics.md:1086`]

### Architecture Guardrails

- Stack/boundary đã chốt: Next.js App Router + TypeScript modular monolith, Tailwind/shadcn-ready UI, Supabase-ready persistence, Vitest, Testing Library, Playwright; không scaffold lại, không thêm ORM/tRPC/global store. [Source: `_bmad-output/planning-artifacts/architecture.md:44`; `_bmad-output/planning-artifacts/architecture.md:434`]
- Server Actions dùng cho mutation nội bộ; route/component không gọi Supabase hoặc repository trực tiếp. [Source: `_bmad-output/planning-artifacts/architecture.md:160`; `_bmad-output/planning-artifacts/architecture.md:365`; `_bmad-output/planning-artifacts/architecture.md:367`]
- Service orchestration nằm ở `services/*-service.ts`, persistence mapping ở `services/*-repository.ts`, DB snake_case chỉ ở repository adapter, migrations trong `database/migrations`, RLS trong `database/policies`. [Source: `_bmad-output/planning-artifacts/architecture.md:375`; `_bmad-output/planning-artifacts/architecture.md:376`; `_bmad-output/planning-artifacts/architecture.md:380`; `_bmad-output/planning-artifacts/architecture.md:382`]
- Permission enforce deny-by-default ở action/service trước mutation; RLS mirror app-level scope như defense-in-depth. [Source: `_bmad-output/planning-artifacts/architecture.md:126`; `_bmad-output/planning-artifacts/architecture.md:152`; `_bmad-output/planning-artifacts/architecture.md:155`]
- Mutation flow chuẩn: request -> session + permission scope -> service validation -> repository -> audit/history -> revalidate route. [Source: `_bmad-output/planning-artifacts/architecture.md:420`]
- Không nâng cấp Next/React/TypeScript hoặc dependency trong story này; dùng versions pin trong `package.json` (`next` 15.3.2, `react` 19.0.0, `typescript` 5.8.3, `zod` 3.24.4, `@supabase/supabase-js` 2.49.4).

### Current Code State (Read Before Editing)

- `src/modules/meetings/types.ts:84`
  - `Decision` hiện là meeting/action-item style: `meetingId?`, `projectId` bắt buộc, `decisionText`, `ownerId`, `dueDate`, `status`, `taskId?`.
  - `DecisionInput` ở `src/modules/meetings/types.ts:119` bắt buộc `meetingId`; chưa đủ cho official decision hoặc multi-assignment.
  - Story 4.2 không được dùng `Decision.taskId` để đại diện nhiều tasks.

- `src/modules/meetings/services/meeting-service.ts:141`
  - `createDecision(input)` load meeting, bắt buộc meeting có `projectId`, rồi tạo một decision/action item.
  - `convertDecisionToTask(decisionId)` ở `src/modules/meetings/services/meeting-service.ts:172` tạo một task từ một decision và set `decision.taskId`.
  - Giữ flow này để regression tests hiện có pass; batch assignment nên là service riêng hoặc official decision service từ Story 4.1.

- `src/modules/meetings/services/meeting-repository.ts:200`
  - Supabase `DecisionRow` hiện chỉ có `meeting_id`, `project_id`, `decision_text`, `owner_id`, `due_date`, `status`, `task_id`, timestamps.
  - `decisionToRow` ở `src/modules/meetings/services/meeting-repository.ts:302` chưa map source/scope/assignment fields.
  - Nếu Story 4.1 đã mở rộng decision row, Story 4.2 phải reuse contract đó.

- `src/modules/tasks/types.ts:4` và `src/modules/tasks/services/task-service.ts:86`
  - `Task` hiện có `projectId`, `title`, `description`, `assigneeId`, `dueDate`, `status`, `priority`, `category`; chưa có domain fields cho `linkedEntityType`/`linkedEntityId`.
  - `createTask` chỉ validate project tồn tại/chưa archived; permission check phải nằm ở caller/action/service của Story 4.2.

- `database/migrations/202605160001_create_mvp_core_schema.sql:104`
  - DB `tasks` đã có `linked_entity_type`, `linked_entity_id`, `created_by`, `archived_at`, nhưng domain/repository chưa expose đủ.
  - Story 4.2 có thể tận dụng các column này thay vì tạo linkage song song trong JSON-only data.

- `database/migrations/202605160001_create_mvp_core_schema.sql:195`
  - DB `decisions.project_id` hiện `not null` và `decisions.task_id` là single link; Story 4.1 có thể nới contract, Story 4.2 không được phụ thuộc vào single `task_id` để biểu diễn nhiều assignments.

- `src/lib/permissions/access-scope.ts:562`
  - `canReadDecisionInScope` hiện check decision theo `projectId` và module target `"meeting"`/workstream `"decision"`.
  - Nếu Story 4.1 mở rộng decision multi-project/organization-only, Story 4.2 phải dùng helper đã mở rộng đó. Nếu chưa, phải mở rộng cùng dependency, không bypass bằng filter thủ công.

- `src/lib/permissions/scoped-resources.ts:171`
  - Có `listScopedDecisions` và `getScopedDecision`; dùng scoped load trước khi mutate.
  - `getScopedProject` đã có để validate target project trước khi tạo task.

- `src/lib/permissions/can.ts`
  - Permission keys hiện có `decision.create`, `decision.approve`, `task.create`; chưa có `decision.assign`.
  - Không thêm permission key mới trừ khi update catalog, seed/migration, tests và settings UI parity. Với scope hiện tại, dùng `decision.create` + `task.create` cho mutation này.

- `src/modules/users/services/user-service.ts:195` và `src/modules/users/types.ts:31`
  - `createAuditLog` là audit writer hiện có; audit log gồm actor, entity type/id, action, old/new value và timestamp.
  - `listUsers` có thể validate assignee active qua repository injection; tránh gọi Supabase trực tiếp.

- `database/policies/001_mvp_rls.sql:634`
  - Task insert RLS đã yêu cầu `task.create` và project scope qua `current_user_can_read_project(project_id)`.
  - Decision policies ở `database/policies/001_mvp_rls.sql:874` và `database/policies/001_mvp_rls.sql:890` hiện project-bound; cần policy mới nếu `decision_assignments` hoặc decision scope mở rộng.

### Suggested Data Contract

Use a child assignment entity rather than overloading legacy decision `taskId`:

```ts
export type DecisionAssignmentStatus = "assigned" | "in_progress" | "done" | "cancelled";

export type DecisionAssignment = TimestampFields & {
  id: EntityId;
  decisionId: EntityId;
  taskId?: EntityId;
  organizationId?: EntityId;
  projectId: EntityId;
  assigneeType: "user" | "department" | "project";
  assigneeId?: EntityId;
  departmentId?: EntityId;
  title: string;
  description?: string;
  kpi?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: DecisionAssignmentStatus;
  createdBy: EntityId;
};

export type CreateDecisionAssignmentsInput = {
  decisionId: EntityId;
  assignments: Array<{
    projectId?: EntityId;
    assigneeType: "user" | "department" | "project";
    assigneeId?: EntityId;
    departmentId?: EntityId;
    title: string;
    description?: string;
    kpi?: string;
    dueDate?: string;
    priority?: TaskPriority;
  }>;
};
```

If 4.1 created an official `Decision` type with `projectIds`, `organizationId`, `linkedRecords` or source fields, reuse those names. Do not create a second incompatible decision model.

### Scope And Validation Rules

- Actor must be able to read the source decision via `getScopedDecision` or Story 4.1 equivalent.
- Actor must have `task.create` in every target project. For scoped-assignment users, use existing scope assignment helpers rather than role-name checks.
- Assignment target project defaults only when the decision has exactly one project. For multi-project or organization-level decisions, require explicit `projectId`.
- Target project must be within decision scope:
  - decision has `projectId`: target must equal it.
  - decision has `projectIds`: target must be included.
  - decision has linked project records: target must be linked or explicitly allowed by Story 4.1 scope contract.
  - organization-only decision: target must be in actor scope and within decision organization.
- Assignee user must exist and `status === "active"`. If assignee user has explicit scope assignments, they should be able to see the target project/task; otherwise avoid creating a hidden task they cannot access.
- Department-only assignment is allowed only as metadata plus project task; do not invent a department repository/table unless the codebase already has one when implementing.
- Dates should stay date-only `YYYY-MM-DD` for due dates; timestamps remain ISO strings.

### Audit Payload Guidance

`AuditLog.newValue` should be compact and safe:

```ts
{
  decisionId,
  assignmentCount,
  taskIds,
  projectIds,
  assigneeIds,
  departmentIds,
  status: "assigned"
}
```

Do not include raw decision text beyond a safe title/summary, proposal amount, finance amount, raw meeting transcript/minutes, raw source notes or full previous/new values from unrelated records.

### UX / Future UI Notes

- Story 4.2 may expose only action/service-level integration, but generated DTOs must support Story 4.4 list/detail UI with owner, deadline, priority, KPI and status. [Source: `_bmad-output/planning-artifacts/epics.md:1097`]
- If any minimal form is added, use Vietnamese labels, inline validation, one primary submit, clear permission-denied state and pending state. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md:887`]
- Do not build full Center/list/detail/table in this story unless needed for testing; avoid UI scope creep.

### Previous Story Intelligence

- Sprint status currently marks Story 4.1 as `ready-for-dev`, not `done`; Story 4.2 is contexted ahead of implementation. Before coding, dev must verify 4.1 implementation exists or implement 4.1 first.
- Story 4.1 explicitly excluded multi-assignment/task creation and full center UI. Story 4.2 owns assignment/task creation, while Story 4.3 owns version/history and Story 4.4 owns full UI. [Source: `_bmad-output/implementation-artifacts/4-1-decision-record-tu-approval-meeting-hoac-doc-lap.md:5`; `_bmad-output/implementation-artifacts/4-1-decision-record-tu-approval-meeting-hoac-doc-lap.md:60`]
- Story 4.1 warned that existing meeting `Decision` must be extended/reused safely rather than duplicated. Story 4.2 should continue that direction and avoid a parallel "executive decision assignment" model that cannot link to official decisions.
- Story 4.1 captured a prior JSON write race lesson: if changing JSON repositories touched by parallel Vitest, prefer robust temp-file writes or isolated test repositories. [Source: `_bmad-output/implementation-artifacts/4-1-decision-record-tu-approval-meeting-hoac-doc-lap.md:233`]

### Latest Technical Notes

- Next.js Server Functions can receive `FormData` from forms; after mutation, `revalidatePath` should run before `redirect` if both are used. Use the current project pattern in `src/modules/*/actions.ts`; do not introduce client-only mutation state for server data. [Source: https://nextjs.org/docs/app/getting-started/updating-data]
- Supabase RLS should be enabled on public tables, SELECT policies use `using`, INSERT policies use `with check`, and UPDATE policies generally need both `using` and `with check`. Apply this to any `decision_assignments` table and keep app-level permission checks as the first gate. [Source: https://supabase.com/docs/guides/database/postgres/row-level-security]

### Git / Repo State Notes

- Recent commits are sparse (`484589a 2205`, `a8162e3 first fcm`); do not infer implementation patterns from commit history alone.
- Worktree may already contain user/BMad changes. Do not revert unrelated files.

### Testing Guidance

Recommended targeted tests before full validation:

```bash
npm run test -- tests/unit/meeting-service.test.ts tests/unit/task-service.test.ts tests/unit/access-scope.test.ts
```

Add new tests for decision assignment service/repository, then run:

```bash
npm run typecheck
npm run lint
npm run test
```

Run e2e only if this story adds visible route/form behavior:

```bash
npm run test:e2e
```

### Checklist Validation Notes

- Story maps each AC to implementation tasks and explicitly blocks scope creep into Story 4.3/4.4.
- Current code state documents risky update targets before editing.
- Dependency on Story 4.1 is explicit because sprint status shows 4.1 is not done yet.
- Permission, RLS, audit, mock/Supabase parity, task linkage and regression requirements are explicit.
- Major ambiguity resolved: multi-assignment must use child assignment/task linkage, not legacy `Decision.taskId`.
- No unresolved clarification required before dev-story, but implementation order should respect Story 4.1 dependency.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
