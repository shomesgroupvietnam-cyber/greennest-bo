# Story 4.4: Decision & Assignment Center UI

Status: done

Ghi chú tạo story: Ultimate context engine analysis completed. Story này là lớp UI/DTO cho Epic 4 sau khi official decision record, multi-assignment và version/history đã có ở Story 4.1-4.3. Trọng tâm là Decision & Assignment Center được lọc quyền ở server, hiển thị decision/assignment thật, linked source và timeline/history; không tiếp tục mở rộng mock `decisionLog` như nguồn dữ liệu chính.

## Story

As a lãnh đạo,
I want xem quyết định mới, giao việc, chỉ đạo ưu tiên, KPI giao xuống, deadline và trạng thái thực hiện,
so that tôi theo dõi được việc đã giao sau quyết định.

## Acceptance Criteria

1. **Danh sách decision/assignment theo scope**
   - Given user có decision/assignment trong scope
   - When mở Decision & Assignment Center
   - Then UI hiển thị danh sách quyết định, assignments, owner, deadline, priority, KPI và trạng thái thực hiện
   - And dữ liệu phải đến từ official `Decision` / `DecisionAssignment` contract, đã lọc ở service/server trước khi render.

2. **Detail có linked source và timeline/history**
   - Given một decision liên quan approval hoặc meeting
   - When mở detail
   - Then UI hiển thị linked source an toàn, assignment list, owner/scope metadata và timeline/version/audit summary
   - And timeline không render raw proposal finance payload, meeting transcript/minutes, document body hoặc audit payload nhạy cảm.

3. **Responsive list/detail**
   - Given mobile viewport
   - When xem danh sách decision/assignment
   - Then table chuyển sang compact list hoặc controlled horizontal scroll, không tạo horizontal page overflow
   - And detail panel trở thành stacked/full-width layout phù hợp mobile.

4. **Permission and route guard**
   - Given user không có quyền executive/decision scope
   - When mở `/executive/decisions`, legacy `/executive/decision-log`, hoặc `/command-center?view=executive-decision-log`
   - Then route guard hoặc service trả no-access/403 trước khi admin/decision data bị fetch/render trái scope
   - And user có quyền scoped decision chỉ thấy records trong scope của họ.

5. **Action entry points reuse existing services**
   - Given user có quyền tạo decision/assignment/update decision trong scope
   - When user dùng action trong Center
   - Then UI gọi existing Server Actions/services (`createDecisionRecordAction`, `createDecisionAssignmentsAction`, `updateDecisionRecordAction`) và hiển thị kết quả sau revalidate
   - And disabled button/client state không được là permission gate duy nhất.

6. **Không phá legacy và command center**
   - Given existing executive command center, approval center, meeting decision list và legacy `/executive/decision-log`
   - When Story 4.4 được triển khai
   - Then các route/view cũ vẫn mở được hoặc redirect tương thích, không đổi semantics của `Decision.taskId` legacy và không duplicate decision model.

## Tasks / Subtasks

- [x] Xác nhận route/view contract trước khi code (AC: 3, 4, 6)
  - [x] Thêm canonical route `src/app/executive/decisions/page.tsx` theo pattern executive route hiện tại: guard `/executive` và redirect vào Command Center view, hoặc render server page nếu toàn bộ project đã chuyển sang direct route.
  - [x] Giữ `/executive/decision-log` là legacy alias để không gãy link cũ; nếu redirect qua `renderExecutivePage`, thêm map `"/executive/decisions": "executive-decision-log"`.
  - [x] Trong `EXECUTIVE_PAGE_NAV_ITEMS`, đổi label/href sang Decision & Assignment Center nhưng có thể giữ key `"decision-log"` để tránh churn type nếu không cần view key mới.
  - [x] Trong `CommandCenterDashboard`, replace block `activeView === "executive-decision-log"` bằng component Center mới, không tiếp tục render list mock `data.executiveWorkspace.decisionLog` làm nguồn chính.

- [x] Tạo service DTO cho Decision & Assignment Center (AC: 1, 2, 4)
  - [x] Thêm service như `src/modules/executive/services/decision-assignment-center-service.ts`.
  - [x] Service nhận `PermissionUser`, filters/search params và dependencies injectable; không gọi repository trực tiếp từ component.
  - [x] Load decisions qua `listScopedDecisions(user, filters)` hoặc helper tương đương; assignment query phải intersect với scoped decision ids/project scope trước khi trả DTO.
  - [x] Load `repository.listDecisionAssignments`, `repository.listDecisionVersions`, và audit summaries từ `listAuditLogs` nếu cần; filter audit theo `entityType: "decision"` và `entityId` server-side.
  - [x] Nếu cần trạng thái thực thi từ linked task, load tasks qua `listScopedTasks` hoặc `TaskRepository` dependency; không suy diễn multi-assignment từ legacy `Decision.taskId`.
  - [x] Trả DTO compact, đã sanitize, ví dụ `DecisionAssignmentCenterData` với `summary`, `filters`, `items`, `selectedDecision`, `permissions`, `generatedAt`.

- [x] Định nghĩa/exports types cần thiết (AC: 1, 2, 5)
  - [x] Thêm types ở `src/modules/executive/types/index.ts` hoặc file module-specific nếu phù hợp: `DecisionAssignmentCenterData`, `DecisionAssignmentCenterItem`, `DecisionAssignmentCenterDetail`, `DecisionAssignmentCenterAssignmentItem`, `DecisionAssignmentCenterPermissionState`.
  - [x] Assignment status dùng labels riêng cho `"assigned" | "in_progress" | "done" | "cancelled"`; không truyền thẳng vào `TaskStatusBadge` vì task status union khác.
  - [x] Priority có thể reuse `TaskPriorityBadge` khi type tương thích (`low`/`medium`/`high`/`urgent`), hoặc map rõ ràng nếu decision priority khác.
  - [x] DTO không chứa full raw source object; linked source chỉ gồm type, id/code/title an toàn, href nếu user có quyền mở.

- [x] Nối DTO vào command center data flow (AC: 1, 4, 6)
  - [x] Update `src/modules/command-center/types.ts` để thêm `decisionAssignmentCenter: DecisionAssignmentCenterData | null`.
  - [x] Update `getCommandCenterData` để load Center DTO khi user có executive decision-center access; với no-access, trả `null` hoặc DTO no-access, không fetch raw records cho client.
  - [x] Update `knownExecutiveViewKeys` / `executiveCommandCenterViews` only if adding a new view key. Khuyến nghị giữ `executive-decision-log` làm view key và đổi nội dung/label để giảm policy churn.
  - [x] Update e2e route smoke nếu thêm `/executive/decisions`.

- [x] Build UI components (AC: 1, 2, 3, 5)
  - [x] Thêm component chính `src/modules/executive/components/decision-assignment-center.tsx`.
  - [x] Split nhỏ nếu cần: list/table, compact card, filter bar, detail panel, assignment list, action forms.
  - [x] Desktop: dùng table/list + detail panel hoặc drilldown panel; mobile: compact cards và stacked detail. Không tạo page horizontal overflow.
  - [x] Reuse `DecisionStatusBadge` từ `src/modules/meetings/components/decision-status-badge.tsx`, `TaskPriorityBadge` từ `src/modules/tasks/components/task-badges.tsx` khi type phù hợp, và `DecisionHistoryTimeline` từ Story 4.3.
  - [x] UI phải có empty, loading/skeleton nếu route dùng suspense/loading, error và no-access state rõ ràng.
  - [x] Không thêm card lồng card; giữ layout enterprise/dense theo UX docs.

- [x] Action entry points tối thiểu trong Center (AC: 5)
  - [x] Với user có quyền, expose compact action để tạo independent decision nếu chưa có UI entry point nào ở Center; form dùng `createDecisionRecordAction`.
  - [x] Với selected decision assignable, expose "Giao việc" form/dialog dùng `createDecisionAssignmentsAction`; hỗ trợ nhiều assignments hoặc ít nhất một assignment/lần submit nhưng không làm mất khả năng service xử lý batch.
  - [x] Với selected decision, expose update form cho field quan trọng cần theo dõi (`ownerId`, `dueDate`, `priority`, `status`, `kpi`, `reason`) bằng `updateDecisionRecordAction` nếu action hiện có sau Story 4.3.
  - [x] Action UI phải hiển thị lỗi domain tiếng Việt từ service và revalidate Center/Command Center sau submit.

- [x] Linked source and timeline detail (AC: 2)
  - [x] Detail hiển thị `sourceType`, `sourceId`, `meetingId`, `linkedRecords` đã sanitize; nếu href target thiếu quyền, hiển thị label không link.
  - [x] Timeline hợp nhất version events và audit summaries theo thứ tự thời gian; raw previous/new values nhạy cảm phải dùng summary/redaction giống `DecisionHistoryTimeline`.
  - [x] Assignment list trong detail hiển thị assignee/project/department, deadline, priority, KPI, task link và execution status.

- [x] Permission, scope and data-safety tests (AC: 1, 2, 4, 5, 6)
  - [x] Unit test service: scoped user chỉ nhận scoped decisions/assignments; out-of-scope assignment không leak qua decision id/project id.
  - [x] Unit test service: linked source/audit payload sanitized; no-access không gọi loader raw audit/assignment không cần thiết.
  - [x] Unit test service: selected decision detail trả assignments, versions, safe audit events đúng thứ tự.
  - [x] Component tests: list/detail/empty/no-access/action-disabled/mobile-friendly class/state.
  - [x] Server Action or integration tests: action forms call existing actions and do not bypass service permission.
  - [x] E2E smoke: `chu_tich`/leadership mở Decision & Assignment Center; mobile viewport không overflow; nếu form được thêm, create decision -> add assignment -> assignment visible.
  - [x] Regression: `/command-center?view=executive-approvals`, `/command-center?view=executive-dashboard`, legacy `/executive/decision-log`, meeting decision list vẫn pass.

- [x] Verification (AC: 1-6)
  - [x] Run targeted tests cho service/component mới.
  - [x] Run `npm run typecheck`.
  - [x] Run `npm run lint`.
  - [x] Run `npm run test`.
  - [x] Run `npm run test:e2e` hoặc targeted Playwright nếu route/navigation/responsive/action path thay đổi.

### Review Findings

- [x] [Review][Patch] Decision Assignment Center ignores selected Command Center scope [src/modules/command-center/services/command-center-service.ts:816]
- [x] [Review][Patch] Scoped-out task IDs still produce clickable task links [src/modules/executive/services/decision-assignment-center-service.ts:414]
- [x] [Review][Patch] Linked source hrefs are emitted without per-record read checks [src/modules/executive/services/decision-assignment-center-service.ts:242]
- [x] [Review][Patch] Users cannot open detail for non-default decisions [src/modules/executive/components/decision-assignment-center.tsx:562]
- [x] [Review][Patch] Assignment and audit loaders fetch broad data before scoped filtering [src/modules/executive/services/decision-assignment-center-service.ts:489]
- [x] [Review][Patch] Assignment/update forms are not individually permission-gated and update omits owner [src/modules/executive/components/decision-assignment-center.tsx:486]
- [x] [Review][Patch] Action forms have no domain error/result state [src/modules/executive/components/decision-assignment-center.tsx:228]

## Dev Notes

### Bối Cảnh Nghiệp Vụ

- Epic 4 yêu cầu lãnh đạo ban hành decision/chỉ đạo khác approval, tạo assignment/task từ decision, gán deadline/KPI/priority, theo dõi execution status và giữ version/history khi sửa nội dung quan trọng. [Source: `_bmad-output/planning-artifacts/epics/epic-4-decision-assignment-center.md`]
- Story 4.4 cover FR-051: Center hiển thị decision mới, assigned work, priority directives, assigned KPI, deadlines và execution status. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md`]
- NFR-001/NFR-011 yêu cầu service/server filtering trước UI và đủ nhanh cho lãnh đạo scan nhanh. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md`]

### Architecture Guardrails

- Next.js App Router + Server Actions + service/repository boundary; internal mutations đi qua action -> service -> repository, không gọi Supabase/repository từ component. [Source: `_bmad-output/project-context.md`]
- Dashboard/workspace data phải đến từ service DTO đã lọc permission; không render rồi hide unauthorized data. [Source: `_bmad-output/project-context.md`; `docs/context/permissions-audit.md`]
- Domain DTO dùng camelCase; DB/repository mapping snake_case đã nằm trong repositories. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`]
- State ưu tiên server-rendered data, URL query state và local component state; không thêm global store cho một page/panel. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`]
- UI theo design standard: dense operational layout, responsive table-to-list, detail/drilldown panel, loading/empty/error/unauthorized states, badge text không chỉ dựa vào màu. [Source: `_bmad-output/planning-artifacts/ux-design/component-strategy.md`; `_bmad-output/planning-artifacts/ux-design/responsiveness-strategy.md`]

### Current Code State (Read Before Editing)

- `src/app/executive/_lib/render-executive-page.tsx` hiện redirect `/executive/decision-log` sang `/command-center?view=executive-decision-log`; chưa có `/executive/decisions`.
- `src/modules/command-center/components/command-center-dashboard.tsx` hiện có block `activeView === "executive-decision-log"` render mock `data.decisionLog` và audit mock. Đây là vùng cần thay bằng Center thật.
- `src/modules/command-center/services/command-center-service.ts` hiện đưa `executiveWorkspace.decisionLog` từ `getExecutiveLeadershipData`; chưa có `decisionAssignmentCenter` DTO thật.
- `src/modules/executive/components/executive-leadership-dashboard.tsx` là component lớn và vẫn có section `decision-log` dựa trên mock. Tránh nhồi thêm logic mới vào đây nếu command-center view là surface chính.
- `src/modules/executive/constants/index.ts` có `EXECUTIVE_PAGE_NAV_ITEMS` với key `"decision-log"`, label "Nhật ký quyết định", href `/executive/decision-log`.
- `src/modules/meetings/types.ts` đã có `Decision`, `DecisionAssignment`, `DecisionVersion`, `DecisionHistoryEvent`, filter types cho decisions/assignments.
- `src/modules/meetings/services/meeting-repository.ts` đã có JSON/Supabase methods `listDecisions`, `getDecision`, `listDecisionAssignments`, `listDecisionVersions`.
- `src/lib/permissions/scoped-resources.ts` đã có `listScopedDecisions`, `getScopedDecision`, `listScopedTasks`; `canReadDecisionInScope` dựa vào decision scope, `decision.approve` scoped grant hoặc `meeting.view`.
- `src/modules/executive/actions.ts` đã có decision create/assignment/update actions và revalidate `/executive/decision-log`, `/command-center`.
- `src/modules/executive/components/decision-history-timeline.tsx` render timeline version/audit compact và redact sensitive field values.
- `src/modules/meetings/components/decision-status-badge.tsx` và `src/modules/tasks/components/task-badges.tsx` là badge reuse candidates.

### Suggested DTO Contract

```ts
export type DecisionAssignmentCenterData = {
  generatedAt: string;
  scopeLabel: string;
  summary: {
    totalDecisions: number;
    openAssignments: number;
    overdueAssignments: number;
    highPriorityDecisions: number;
    dueSoonAssignments: number;
  };
  permissions: {
    canView: boolean;
    canCreateDecision: boolean;
    canAssignDecision: boolean;
    canUpdateDecision: boolean;
    canViewAudit: boolean;
  };
  filters: {
    search?: string;
    status?: string;
    priority?: string;
    projectId?: string;
    ownerId?: string;
    assigneeId?: string;
  };
  items: DecisionAssignmentCenterItem[];
  selectedDecision?: DecisionAssignmentCenterDetail;
};

export type DecisionAssignmentCenterItem = {
  decisionId: string;
  title: string;
  summary: string;
  status: Decision["status"];
  priority?: Decision["priority"];
  ownerId?: string;
  dueDate?: string;
  kpi?: string;
  source: { type: Decision["sourceType"]; label: string; href?: string };
  assignmentCount: number;
  openAssignmentCount: number;
  latestVersionNumber?: number;
  updatedAt: string;
};
```

Names can change, but keep the same boundary: server-filtered, sanitized DTO into UI.

### Permission and Data Rules

- Read path: use `listScopedDecisions`/`getScopedDecision`; for assignments, filter by scoped decision ids and scoped project access before returning.
- Write path: reuse existing Server Actions/services from Story 4.1-4.3. UI permissions are display hints only.
- For `chu_tich` and `super_admin`, both can see executive decision surfaces; BO/admin navigation separation from Story 1.6/2.10 must remain unchanged.
- Do not expose `/admin`, `/settings`, `/users` in this story. Those policies are already owned by Story 2.10.
- Do not expose raw source payloads. Linked source display should be safe summary with optional href.
- Audit summary can show action, actor, timestamp, reason/summary; do not dump `oldValue`/`newValue` raw JSON into UI.

### Previous Story Intelligence

- Story 4.1 established official `Decision` records and review fixes for source validation, multi-project permission, safe audit and source scope.
- Story 4.2 established `decision_assignments` child records, linked tasks, rollback behavior, assignee visibility checks and date-only due dates. Do not use legacy `Decision.taskId` for multi-assignment display.
- Story 4.3 established `DecisionVersion`, update/version/audit service and `DecisionHistoryTimeline`. Reuse it; do not build another timeline contract.
- Current `ExecutiveLeadershipDashboard`/`CommandCenterDashboard` decision-log content is mock executive data; Story 4.4 must migrate the visible Center to official repository-backed data.

### UX Requirements

- First screen must be the usable Center, not a marketing/intro page.
- Desktop should support fast scan: summary strip, filters, list/table, selected detail/drilldown.
- Mobile should use compact cards or controlled scroll; verify `document.documentElement.scrollWidth <= window.innerWidth + 8` in Playwright for mobile viewports.
- Use labels/text with color badges; color alone is not status communication.
- Keep cards radius <= 8px, no nested cards, no decorative gradients/orbs.
- Buttons for actions should include lucide icons where appropriate and clear Vietnamese labels.

### Testing Guidance

- Use Vitest + Testing Library for service/component tests; inject JSON/temp repositories or fake loaders instead of global singleton state where possible. [Source: `docs/context/testing.md`]
- Add e2e only because this story changes route/navigation/responsive behavior and likely form actions. Base URL is Playwright config `http://localhost:3100`. [Source: `docs/context/testing.md`]
- Minimum expected commands before review: `npm run typecheck`, `npm run lint`, `npm run test`; plus `npm run test:e2e` or targeted e2e for new Center route.

### Project Structure Notes

- New route: `src/app/executive/decisions/page.tsx`.
- New service: `src/modules/executive/services/decision-assignment-center-service.ts`.
- New UI: `src/modules/executive/components/decision-assignment-center.tsx` plus small sibling components if useful.
- Types: prefer `src/modules/executive/types/index.ts` unless the file becomes too noisy; keep exports stable for command-center types.
- Tests: `tests/unit/decision-assignment-center-service.test.ts`, `tests/unit/decision-assignment-center.test.tsx`, and updates to `tests/e2e/mvp-smoke.spec.ts` or a focused e2e spec.

### Checklist Validation Notes

- Reinvention prevention: story explicitly reuses official `Decision`, `DecisionAssignment`, `DecisionVersion`, existing actions, badges and timeline.
- Wrong source prevention: story blocks using mock `decisionLog` as primary data source.
- Permission prevention: server/service filtering is required before UI render; direct view route must guard before sensitive fetch.
- Regression prevention: legacy `/executive/decision-log`, command center, approval center and meeting decision list must stay compatible.
- Scope boundary: no new persistence/migration is expected unless implementation discovers an actual missing read index; Story 4.1-4.3 own persistence.

## Dev Agent Record

### Agent Model Used
GPT-5 Codex

### Debug Log References
- `npm run test -- tests/unit/decision-assignment-center-service.test.ts` - red first for missing service, then passed.
- `npm run test -- tests/unit/decision-assignment-center.test.tsx` - red first for missing component/React badge imports, then passed.
- `npm run test -- tests/unit/executive-actions.test.ts` - passed.
- `npm run typecheck` - passed after form-action return typing fix.
- `npm run lint` - passed.
- `npm run test` - passed, 75 test files / 473 tests.
- `npm run test:e2e` - first run timed out at 120s, second exposed responsive matrix timeout, final run passed 60/60 after local test timeout update.
- Review patch validation: `npm run test -- tests/unit/decision-assignment-center-service.test.ts tests/unit/decision-assignment-center.test.tsx tests/unit/executive-actions.test.ts` - passed, 3 files / 10 tests.
- Review patch validation: `npm run typecheck` - passed.
- Review patch validation: `npm run lint` - passed after moving the `useActionState` hook before the create-form early return.
- Review patch validation: `npm run test` - passed, 75 test files / 473 tests.
- Review patch validation: `npm run test:e2e` - passed, 60/60 tests.

### Completion Notes List
- Added repository-backed Decision & Assignment Center DTO/service with scoped decision filtering, assignment/task joins, linked source summaries, version/audit timeline, and sensitive value redaction.
- Wired the Center into Command Center view `executive-decision-log`, added `/executive/decisions` alias, updated executive nav label, and kept legacy decision-log route compatibility.
- Built the Center UI with summary metrics, decision list, selected detail, linked sources, assignments, timeline, no-access/empty states, and forms that reuse existing decision create/assignment/update server actions.
- Added service/component/action/e2e coverage, including unauthorized direct access and responsive QA coverage for the new Center.
- Applied code review patches for selected Command Center scope propagation, deep-link decision selection, scoped assignment/audit loading, safe task/source links, individual action permission gates, owner updates, and form result/error states.

### File List
- `_bmad-output/implementation-artifacts/4-4-decision-assignment-center-ui.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/app/command-center/page.tsx`
- `src/app/executive/_lib/render-executive-page.tsx`
- `src/app/executive/decisions/page.tsx`
- `src/modules/command-center/components/command-center-dashboard.tsx`
- `src/modules/command-center/services/command-center-service.ts`
- `src/modules/command-center/types.ts`
- `src/modules/executive/actions.ts`
- `src/modules/executive/components/decision-assignment-center.tsx`
- `src/modules/executive/constants/index.ts`
- `src/modules/executive/services/decision-assignment-center-service.ts`
- `src/modules/executive/types/index.ts`
- `src/modules/meetings/components/decision-status-badge.tsx`
- `src/modules/tasks/components/task-badges.tsx`
- `src/modules/users/services/user-repository.ts`
- `src/modules/users/services/user-service.ts`
- `src/modules/users/types.ts`
- `tests/e2e/mvp-smoke.spec.ts`
- `tests/unit/decision-assignment-center-service.test.ts`
- `tests/unit/decision-assignment-center.test.tsx`
- `tests/unit/executive-actions.test.ts`
