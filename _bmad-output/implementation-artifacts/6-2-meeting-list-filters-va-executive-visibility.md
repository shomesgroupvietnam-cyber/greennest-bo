# Story 6.2: Meeting List, Filters Và Executive Visibility

Status: done

Ghi chú hoàn tất: Ultimate context engine analysis completed - comprehensive developer guide created.

## Story

Là người dùng lãnh đạo / executive,
tôi muốn xem và lọc meeting trong phạm vi được cấp quyền theo loại họp, tổ chức, dự án, trục, phòng ban, visibility, người tham gia, trạng thái và thời gian,
để tôi chỉ thấy các cuộc họp liên quan và ưu tiên đúng các meeting chiến lược, high-risk hoặc quá hạn follow-up.

## Acceptance Criteria

1. Danh sách Meeting Center theo scope executive
   - Given executive user có `meeting.view` và access scope hợp lệ,
   - When user mở Meeting Center chuẩn tại `/meetings`,
   - Then danh sách chỉ render meeting được phép bởi server/service-side scope filtering, bao gồm organization-only, single-project và multi-project meeting khớp scope của user.
   - Then các meeting important/strategic, meeting có linked high-risk và meeting quá hạn follow-up phải có text badge hoặc priority signal rõ ràng, không chỉ dựa vào màu.

2. Visibility cho department workspace
   - Given user có scope department/workstream mở meeting list từ workspace hoặc Meeting Center,
   - When user không có global meeting visibility,
   - Then chỉ meeting khớp assignment, department/workstream, host hoặc participant scope được hiển thị.
   - Then meeting không có quyền không được serialize vào page props, table rows, filter options, badges hoặc empty-state counts.

3. Contract filter đầy đủ
   - Given user có nhiều meeting trong scope,
   - When áp dụng filter `meetingType`, `organizationId`, `projectId`, `axisId`, `departmentId`, `visibility`, `participantId`, `status`, `dateFrom` và `dateTo`,
   - Then repository/service trả kết quả nhất quán trong cả mock JSON và Supabase mode.
   - Then active filters hiển thị rõ và có thể remove từng filter.
   - Then filter state dùng URL/search params để refresh, share link và server rendering giữ cùng danh sách.

4. Executive priority signals
   - Given meeting có executive type/visibility, pending follow-up actions, linked tasks/approvals hoặc linked risk records,
   - When meeting list render,
   - Then row/card hiển thị signal ngắn gọn cho strategic meeting, follow-up overdue và high/critical risk nếu các signal đó có thể suy ra từ contract hiện hữu.
   - Then implementation không được bịa risk data hoặc thêm field severity giả vào Meeting domain chỉ để có badge.

5. UX states và responsive behavior
   - Given user không có quyền, không có scoped meeting, hoặc filter làm danh sách rỗng,
   - When list render,
   - Then unauthorized, scoped-empty và filtered-empty state phải khác nhau và không leak tên/count của record bị ẩn.
   - Then desktop giữ dạng operational table dày thông tin, còn mobile có compact list alternative hoặc horizontal scroll an toàn, không overlap control/text.

6. Test coverage
   - Unit tests cover meeting filter parity cho JSON và Supabase repositories.
   - Scope tests cover executive, department/workstream, organization-only, multi-project, host và participant visibility.
   - Component/route tests cover filter controls, active filter chips/removal và empty states.

## Tasks / Subtasks

- [x] Mở rộng meeting list filter contract (AC: 3, 6)
  - [x] Update `MeetingListFilters` trong `src/modules/meetings/types.ts` với `participantId`, `dateFrom` và `dateTo`; giữ các filter hiện có: `projectId`, `organizationId`, `axisId`, `departmentId`, `meetingType`, `status`, `visibility`.
  - [x] Update `JsonMeetingRepository.matchesMeetingFilters` để `participantId` match `hostId` hoặc `participants`, và date filters so sánh với `startTime` / `meetingDate`.
  - [x] Update `SupabaseMeetingRepository.listMeetings` với filter tương đương. Giữ behavior project hiện tại: `project_id.eq.<id>` OR `project_ids` contains `<id>`.
  - [x] Thêm test filter cho organization-only, multi-project, participant, status, visibility và date range trong `tests/unit/meeting-service.test.ts` hoặc repository test chuyên biệt.

- [x] Giữ server-side scope là security boundary (AC: 1, 2)
  - [x] Tiếp tục dùng `requirePermission("meeting.view", { route: "/meetings" })` trước khi đọc list trong `src/app/(dashboard)/meetings/page.tsx`.
  - [x] Tiếp tục dùng `listScopedMeetings(currentUser, filters)` từ `src/lib/permissions/scoped-resources.ts`; không thay bằng UI/client filtering.
  - [x] Preserve `canReadMeetingInScope` trong `src/lib/permissions/access-scope.ts` cho assignment-model users, organization-only meetings, multi-project meetings, host và participant access.
  - [x] Nếu filter options được derive từ meetings, chỉ derive từ meetings đã được scope hoặc từ service áp dụng cùng scope.

- [x] Build validated URL filter parsing cho `/meetings` (AC: 3, 5)
  - [x] Thay raw enum casts trong `src/app/(dashboard)/meetings/page.tsx` bằng parser nhỏ chỉ nhận value thuộc `MEETING_TYPES`, `MEETING_STATUSES`, `MEETING_VISIBILITIES` hoặc `"all"`.
  - [x] Parse `organizationId`, `axisId`, `departmentId`, `participantId`, `dateFrom`, `dateTo` với normalization cho empty/`all`.
  - [x] Giữ state trong GET search params; page này không cần global store.
  - [x] Có reset path về `/meetings` và link remove từng active filter.

- [x] Nâng cấp Meeting Center filter UI (AC: 3, 5)
  - [x] Extend filter form hiện tại hoặc tách `src/modules/meetings/components/meeting-list-filters.tsx`.
  - [x] Có control cho meeting type, organization, project, axis, department, visibility, participant, status và time range.
  - [x] Dùng data source hiện hữu khi có: `listScopedProjects` cho project, `listUsers` cho participant labels, và scoped/current meeting values cho organization/axis/department labels nếu chưa có catalog chuẩn.
  - [x] Display active filters thành text badges/chips có thể remove. Đây là controls, không phải hidden state.
  - [x] Giữ UI dày thông tin và operational; tránh nested cards và layout kiểu marketing.

- [x] Nâng cấp list rendering và priority signals (AC: 1, 4, 5)
  - [x] Extend `MeetingListTable` hoặc tách reusable list/table component dưới `src/modules/meetings/components`.
  - [x] Giữ action hiện có (`Xem`, `Sửa`) gated bởi `canUpdate`; không show create/update action khi permission checks deny.
  - [x] Show meeting type, status, visibility, scope, participant count/host và time bằng stable columns hoặc compact mobile rows.
  - [x] Thêm text badges cho strategic/executive meetings dựa trên `meetingType` / `visibility` hiện có.
  - [x] Thêm follow-up overdue signal bằng cách check `followUpActions[].dueDate` so với current date và loại terminal statuses như `done`, `cancelled`, `closed` khi có.
  - [x] Nếu show high/critical risk signals, derive từ existing risk records (`sourceType: "meeting"`, `sourceId: meeting.id`, `level: "high" | "critical"`, non-terminal status) và enforce risk scope trước khi serialize. Nếu chưa làm an toàn trong story này, omit badge và ghi rõ limitation trong completion notes, không hardcode fake data.

- [x] Đồng bộ executive entry points (AC: 1, 2)
  - [x] Xem `/meetings` là Meeting Center chuẩn cho story này.
  - [x] Lưu ý `src/app/executive/meetings/page.tsx` hiện redirect qua `renderExecutivePage` tới `/command-center?view=executive-meetings`; không build filter surface độc lập thứ hai ở đó nếu không reuse cùng scoped Meeting Center DTO/service.
  - [x] Nếu đụng executive command-center meeting summaries, đảm bảo chúng không bypass `meeting.view` scope hoặc show meeting không có trong `/meetings`.

- [x] Thêm tests tập trung (AC: 6)
  - [x] Repository/service: JSON và Supabase filters cho participant/date/projectIds/org/department/status/visibility.
  - [x] Permission/scope: extend `tests/unit/access-scope.test.ts` cho department/workstream assignment, org-only access, participant-only access và denied records.
  - [x] Component tests: filter controls submit đúng query params, active chips chỉ remove filter tương ứng, empty states phân biệt no scoped data vs filtered data.
  - [x] Route/page smoke hoặc e2e chỉ khi thay đổi navigation/route behavior vượt ngoài server-rendered filter form.

### Review Findings

- [x] [Review][Patch] Assignment-scoped host/participant meeting visibility is missing [src/lib/permissions/access-scope.ts:513]
- [x] [Review][Patch] Validate or escape Supabase project/participant filter IDs before `.or()` interpolation [src/modules/meetings/services/meeting-repository.ts:729]
- [x] [Review][Patch] Validate calendar dates and align date-only filter boundaries with Vietnam business day [src/modules/meetings/services/meeting-list-filter-service.ts:86]
- [x] [Review][Patch] Normalize JSON date filtering fallback when `startTime` is empty [src/modules/meetings/services/meeting-repository.ts:1085]
- [x] [Review][Patch] Multi-project-only meetings render as unassigned in the project column [src/modules/meetings/components/meeting-list-table.tsx:118]
- [x] [Review][Patch] Follow-up overdue badge uses UTC today instead of Vietnam business day [src/modules/meetings/components/meeting-list-table.tsx:29]
- [x] [Review][Patch] Filtered URLs mask the true scoped-empty state [src/app/(dashboard)/meetings/page.tsx:65]
- [x] [Review][Patch] Repository parity tests do not cover the full required filter contract [tests/unit/meeting-service.test.ts:294]
- [x] [Review][Defer] Decision scope immutability was removed in JSON updates [src/modules/meetings/services/meeting-repository.ts:193] — deferred, outside Story 6.2 meeting-list/filter scope in current dirty diff.

## Dev Notes

### Current Implementation Snapshot

- `src/app/(dashboard)/meetings/page.tsx` đã dùng `requirePermission("meeting.view")`, `listScopedProjects`, `listScopedMeetings` và filter form dạng GET. Hiện page chỉ support `projectId`, `meetingType`, `status`, `visibility`, và đang cast raw search params vào enum types. Story này mở rộng page đó; không được bỏ server permission guard.
- `src/modules/meetings/components/meeting-list-table.tsx` hiện render desktop table với empty state biết `canCreate`/`canUpdate` và row actions. Component chưa own filter state và hiện show raw org/axis/department IDs.
- `src/modules/meetings/types.ts` hiện định nghĩa `MeetingListFilters` chưa có participant/time filters.
- `src/modules/meetings/services/meeting-repository.ts` hiện giữ parity JSON/Supabase cho project, organization, axis, department, meeting type, status và visibility.
- `src/lib/permissions/scoped-resources.ts` expose `listScopedMeetings(user, filters)` bằng cách load repository results rồi apply `filterMeetingsForScope`.
- `src/lib/permissions/access-scope.ts` đã xử lý meeting read cho assignment-model users, organization-only meetings, multi-project meetings, host/createdBy/participants và project assignments.
- `src/app/executive/meetings/page.tsx` hiện redirect sang command center view qua `src/app/executive/_lib/render-executive-page.tsx`; đây không phải canonical filter page.

### Architecture And Security Guardrails

- Route compose data và components; domain behavior nằm trong modules/services/repositories. Không đưa meeting business logic vào React component.
- Permission checks phải chạy trước khi serialize DTO nhạy cảm. UI hiding không phải security.
- Mock JSON và Supabase repository phải có behavior tương đương.
- Không thêm state management library hoặc package mới. Project đang dùng Next.js 15 App Router, React 19, TypeScript 5.8, Tailwind 3 và Vitest.
- Không tạo parallel decision/risk model dưới meetings. Existing official decision/risk services vẫn là source of truth.
- Không hardcode copy tiếng Việt nói rằng có hidden meeting. Empty states phải safe theo scope.

### UX Guardrails

- Meeting Center cần là operational tool: compact filters, table/list dễ scan, text badges, active filters rõ, actions predictable.
- Badges phải có text label; không dùng màu làm tín hiệu duy nhất.
- Table cần responsive alternative hoặc horizontal scroll an toàn. Text không được overlap trong action buttons, chips hoặc table cells.
- Dùng UI primitives hiện có và lucide icons khi cần; tránh hero/decorative marketing patterns.

### Previous Story Intelligence

- Story 6.1 đã done và thiết lập Meeting Engine contract: meeting types/statuses, organization-only và multi-project meetings, repository parity, scoped create permissions và RLS parity.
- Các patch review của 6.1 đã tighten:
  - `createMeetingAction` enforce scoped `meeting.create`.
  - FormData preserve repeated `projectIds`.
  - organization-only create require organization scope.
  - legacy decision-to-task conversion chỉ cho đúng một project.
  - meeting RLS mirror `project_ids`, organization-only và assignment-scope behavior.
- Validation của 6.1 đã pass `npm run typecheck`, `npm run lint` và full `npm run test` (82 files, 549 tests). Work mới không được làm regression các guarantee đó.

### Testing Requirements

- Chạy tối thiểu sau implementation:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test -- tests/unit/meeting-service.test.ts tests/unit/access-scope.test.ts`
- Chạy rộng hơn `npm run test` nếu repository, permission hoặc shared UI changes chạm nhiều hơn focused files.
- Chạy `npm run test:e2e` chỉ khi navigation/route behavior thay đổi theo cách unit/component tests không cover được.

### Boundary / Out Of Scope

- Story 6.3 xử lý tạo/sửa meetings với related records; không mở rộng story này sang mutation flows cho related records.
- Story 6.4 xử lý transcript/AI/minutes workflow.
- Story 6.5 xử lý follow-up lifecycle mutation.
- Story 6.6 xử lý decision tracking panel depth.
- Story này có thể display existing follow-up/decision/risk signals, nhưng không create hoặc mutate chúng.

### Web Research

- Không cần web research. Đây là internal product story dùng current repo contracts và package versions từ `package.json`.

### Git Intelligence

- Recent git history không trực tiếp liên quan Epic 6 list/filter work (`4.1 done`, `Module 1: story 4.1`, ...). Precedent liên quan nhất là Story 6.1 đã done và các meeting module files hiện tại.

### References

- `_bmad-output/planning-artifacts/epics/epic-6-one-meeting-engine-cho-iu-hnh.md` - yêu cầu và acceptance criteria Story 6.2.
- `_bmad-output/planning-artifacts/epics/requirements-inventory.md` - FR-110, FR-111, FR-112, FR-113, UX-DR24, UX-DR25, UX-DR29.
- `_bmad-output/project-context.md` - architecture, security, UI và validation rules.
- `docs/context/meetings.md` - meeting module contracts, permission boundaries và test focus.
- `docs/context/permissions-audit.md` - service-side permission checks và assignment-scope guardrails.
- `docs/context/testing.md` - Vitest, Testing Library và Playwright guidance.
- `_bmad-output/implementation-artifacts/6-1-meeting-engine-types-scope-va-repository-contract.md` - previous story implementation/review learnings.
- `src/app/(dashboard)/meetings/page.tsx` - canonical Meeting Center route hiện tại.
- `src/modules/meetings/types.ts` - `Meeting`, `MeetingListFilters`.
- `src/modules/meetings/services/meeting-repository.ts` - JSON/Supabase list filter parity.
- `src/lib/permissions/scoped-resources.ts` và `src/lib/permissions/access-scope.ts` - scoped meeting visibility.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -- tests/unit/meeting-service.test.ts` - pass sau khi thêm participant/date filters cho JSON và Supabase repository.
- `npm run test -- tests/unit/access-scope.test.ts` - pass sau regression test department/workstream meeting scope.
- `npm run test -- tests/unit/meeting-service.test.ts tests/unit/access-scope.test.ts tests/unit/meeting-list-filters.test.tsx` - pass cho repository, scope và UI/filter regression.
- `npm run test -- tests/unit/meeting-service.test.ts` - pass sau code-review patches cho full filter contract, Supabase UUID guard và business-day date range.
- `npm run test -- tests/unit/access-scope.test.ts` - pass sau code-review patch cho assignment-model host/participant visibility.
- `npm run test -- tests/unit/meeting-list-filters.test.tsx` - pass sau code-review patches cho empty state, multi-project render và overdue business day.
- `npm run typecheck` - pass.
- `npm run lint` - pass.
- `npm run test` - pass full suite: 83 test files, 565 tests.

### Completion Notes List

- Mở rộng `MeetingListFilters` với participant/date filters và giữ JSON/Supabase repository parity.
- Tách parser/filter helper và component `MeetingListFilters` để `/meetings` dùng URL search params, active removable chips và scoped filter options.
- Cập nhật `MeetingListTable` với filtered/scoped empty states, participant/host metadata, executive/strategic badge và follow-up overdue badge.
- Applied code-review patches: assignment-model host/participant visibility, Supabase UUID guard for `.or()` filters, Vietnam business-day date filters/overdue badges, scoped-empty state resolution and multi-project table rendering.
- Không hiển thị high/critical risk badge trong story này vì chưa có scoped risk DTO an toàn nối vào Meeting Center; không hardcode hoặc thêm fake meeting severity field.
- `/executive/meetings` không bị đổi thành filter surface thứ hai; `/meetings` vẫn là canonical Meeting Center route.

### File List

- `_bmad-output/implementation-artifacts/6-2-meeting-list-filters-va-executive-visibility.md`
- `_bmad-output/implementation-artifacts/deferred-work.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/app/(dashboard)/meetings/page.tsx`
- `src/components/shared/empty-state.tsx`
- `src/lib/date/business-day.ts`
- `src/lib/permissions/access-scope.ts`
- `src/modules/meetings/components/meeting-badges.tsx`
- `src/modules/meetings/components/meeting-list-filters.tsx`
- `src/modules/meetings/components/meeting-list-table.tsx`
- `src/modules/meetings/services/meeting-list-filter-service.ts`
- `src/modules/meetings/services/meeting-repository.ts`
- `src/modules/meetings/types.ts`
- `tests/unit/access-scope.test.ts`
- `tests/unit/meeting-list-filters.test.tsx`
- `tests/unit/meeting-service.test.ts`

### Change Log

- 2026-06-02: Implemented Story 6.2 meeting list filters, scoped options, active chips, list signals, empty states and regression tests.
- 2026-06-02: Applied code-review patches for scope visibility, Supabase filter safety, Vietnam business-day date handling, multi-project rendering, empty-state correctness and parity tests.
