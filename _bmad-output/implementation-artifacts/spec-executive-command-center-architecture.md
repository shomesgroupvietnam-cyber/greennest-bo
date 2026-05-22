---
title: "Điều chỉnh Ban lãnh đạo thành Executive Command Center"
type: "feature"
created: "2026-05-22"
status: "done"
baseline_commit: "a8162e367b446b5c29fa06f2fa965943cf27c71d"
context: []
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Cấu trúc Ban lãnh đạo cũ đang đi theo nhiều subpage chi tiết, dễ biến thành dashboard phòng ban và sai hướng trước khi hoàn thiện mục 7.

**Approach:** Điều chỉnh Ban lãnh đạo thành Executive Command Center trong `/command-center?view=executive-dashboard`, chỉ hiển thị thông tin cần lãnh đạo xem, duyệt, phản hồi hoặc ra quyết định trên 3 trục; `/executive` được guard theo nhóm LEADER/COMPANY_ADMIN/SUPER_ADMIN và ghi audit khi bị từ chối.

## Boundaries & Constraints

**Always:** Giữ RBAC/403 hiện có; dữ liệu đi qua type/service/mock data có cấu trúc; Ban lãnh đạo là trung tâm tổng hợp cho Dự án, Kiến tạo và Điều hành; action approve/reject/return chỉ là mock client state.

**Ask First:** Tích hợp AI thật, thay đổi schema database, hoặc mở rộng sang module phòng ban khác.

**Never:** Không triển khai lan rộng; không đưa toàn bộ dữ liệu chi tiết của từng phòng ban vào Executive Command Center; không tiếp tục 7 subpage executive cũ trong Command Center.

</frozen-after-approval>

## Code Map

- `src/modules/executive/types/index.ts` -- contract Executive Command Center, snapshot trang đầu, action queue theo trục và filter metadata.
- `src/modules/executive/mock-data/executive-mock-data.ts` -- mock data cho ghi chú, lịch họp, lịch làm việc, duyệt, cảnh báo, báo cáo nhanh và danh sách quyết định.
- `src/modules/executive/services/executive-service.ts` -- trả snapshot và decision queue theo scope executive.
- `src/modules/command-center/types.ts` -- expose dữ liệu Executive Command Center vào aggregate Command Center.
- `src/modules/command-center/services/command-center-service.ts` -- bỏ children 7 subpage cũ khỏi menu Ban lãnh đạo.
- `src/modules/command-center/components/command-center-dashboard.tsx` -- UI Executive Command Center với snapshot, 3 tab trục và bộ lọc.
- `src/app/executive/*/page.tsx` -- redirect legacy executive subroute về view Executive Command Center thống nhất.
- `src/lib/permissions/guard.ts` -- cơ chế dùng lại để trả 403 và ghi audit log khi truy cập bị từ chối.
- `tests/unit/executive-service.test.ts` -- coverage cho snapshot, action queue và 3 trục.
- `tests/unit/command-center-service.test.ts` -- coverage cho menu Ban lãnh đạo không còn subpage cũ và aggregate data mới.

## Tasks & Acceptance

**Execution:**

- [x] `src/modules/executive/types/index.ts` -- thêm type snapshot, axis key, category, priority, due group và decision action.
- [x] `src/modules/executive/mock-data/executive-mock-data.ts` -- thêm mock data trang đầu và action queue theo 3 trục.
- [x] `src/modules/executive/services/executive-service.ts` -- scope snapshot/action queue theo executive service hiện có.
- [x] `src/modules/command-center/services/command-center-service.ts` -- chuyển menu Ban lãnh đạo thành một điểm vào Executive Command Center.
- [x] `src/modules/command-center/components/command-center-dashboard.tsx` -- thay dashboard cũ bằng snapshot, 3 tab, filter và bảng quyết định.
- [x] `src/modules/command-center/components/command-center-dashboard.tsx` -- thêm chi tiết một trình duyệt và hành động approve/reject/return mock.
- [x] `src/app/executive/*/page.tsx` -- guard role trước redirect subroute cũ về `executive-dashboard`.
- [x] `tests/unit/executive-service.test.ts` và `tests/unit/command-center-service.test.ts` -- cập nhật test theo kiến trúc mới.

**Acceptance Criteria:**

- Given executive user, when opening `/command-center?view=executive-dashboard`, then the page shows notes, meetings, work calendar, approval queue, alerts and quick reports.
- Given executive user, when switching between 3 axis tabs, then each tab shows only leadership decision items for that axis.
- Given executive user, when applying project/status/priority/due filters, then the decision queue narrows without loading department-level detail.
- Given old `/executive/*` routes, when opened, then they redirect to `/command-center?view=executive-dashboard`.
- Given non-leadership employee opens `/executive`, when route guard runs, then response is 403 and an access denied audit event is recorded.
- Given existing RBAC tests, when the suite runs, then permissions and workspace route guards still pass.

## Spec Change Log

## Verification

**Commands:**

- `npm run typecheck` -- pass.
- `npm test -- executive-service command-center-service permissions workspaces` -- pass.
- `npm test` -- pass.
- Runtime Playwright check on `/command-center?view=executive-dashboard` -- finds snapshot, 3 tabs, filters, decision categories and legacy redirect behavior.
- Runtime Playwright check on `/executive` with `greennest_mock_role=ke_toan` -- returns 403 and audit file contains `access.denied` with `role_forbidden:/executive`.
