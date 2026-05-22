---
title: "Executive Dashboard trong Command Center"
type: "feature"
created: "2026-05-22"
status: "done"
baseline_commit: "a8162e367b446b5c29fa06f2fa965943cf27c71d"
context: []
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** View executive hiện đã được gom vào Command Center nhưng nội dung dashboard lãnh đạo chưa khớp yêu cầu mới: thiếu bảng việc cần lãnh đạo xử lý và AI summary theo nhóm.

**Approach:** Triển khai `executive-dashboard` như một view trong `/command-center`, dùng mock service có cấu trúc trong module executive để sau này thay bằng API thật.

## Boundaries & Constraints

**Always:** `/command-center?view=executive-dashboard` là màn hình chính; dữ liệu đi qua service/type rõ ràng; UI phải có 5 card tổng quan, bảng việc cần xử lý, và khu vực AI hỗ trợ lãnh đạo.

**Ask First:** Mọi thay đổi điều hướng lớn ngoài Command Center, thay đổi database schema, hoặc tích hợp AI thật.

**Never:** Không phục hồi `/executive` thành màn hình độc lập; không hard-code dữ liệu dashboard trực tiếp trong component.

## I/O & Edge-Case Matrix

| Scenario       | Input / State                                      | Expected Output / Behavior                                 | Error Handling                                              |
| -------------- | -------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------- |
| Executive view | User mở `/command-center?view=executive-dashboard` | Hiển thị 5 card, bảng việc lãnh đạo xử lý, AI summary mock | Nếu không có executive data thì dùng mảng rỗng, không crash |
| Legacy route   | User mở `/executive`                               | Redirect về `/command-center?view=executive-dashboard`     | Giữ nguyên redirect hiện có                                 |

</frozen-after-approval>

## Code Map

- `src/modules/executive/types/index.ts` -- định nghĩa contract dữ liệu executive dashboard.
- `src/modules/executive/mock-data/executive-mock-data.ts` -- mock data có cấu trúc cho dashboard.
- `src/modules/executive/services/executive-service.ts` -- service trả dữ liệu mock theo scope người dùng.
- `src/modules/command-center/types.ts` -- expose executive dashboard data cho Command Center.
- `src/modules/command-center/services/command-center-service.ts` -- map dữ liệu executive vào aggregate Command Center.
- `src/modules/command-center/components/command-center-dashboard.tsx` -- render view executive-dashboard.
- `tests/unit/executive-service.test.ts` -- kiểm tra dữ liệu dashboard mới.
- `tests/unit/command-center-service.test.ts` -- kiểm tra aggregate Command Center có dữ liệu dashboard.

## Tasks & Acceptance

**Execution:**

- [x] `src/modules/executive/types/index.ts` -- thêm type cho overview cards, leadership action table và AI leadership summary.
- [x] `src/modules/executive/mock-data/executive-mock-data.ts` -- thêm mock data có cấu trúc theo yêu cầu UI.
- [x] `src/modules/executive/services/executive-service.ts` -- trả dữ liệu mới qua `getExecutiveLeadershipData`.
- [x] `src/modules/command-center/types.ts` và `src/modules/command-center/services/command-center-service.ts` -- truyền dữ liệu executive dashboard qua Command Center.
- [x] `src/modules/command-center/components/command-center-dashboard.tsx` -- render đúng 3 khu vực UI trong view `executive-dashboard`.
- [x] `tests/unit/executive-service.test.ts` và `tests/unit/command-center-service.test.ts` -- bổ sung coverage cho dữ liệu mới.

**Acceptance Criteria:**

- Given executive user, when service loads Command Center data, then executive workspace includes 5 overview cards, action items, and AI summary groups.
- Given `/command-center?view=executive-dashboard`, when the view renders, then UI is driven by structured service data instead of inline mock arrays.
- Given no executive access, when aggregate data builds empty workspace, then the new dashboard arrays are empty and the UI remains safe.

## Spec Change Log

## Verification

**Commands:**

- `npm run typecheck` -- expected: pass.
- `npm test -- executive-service command-center-service` -- expected: pass.
- `npm test` -- expected: pass.
- Runtime Playwright check on `http://localhost:3000/command-center?view=executive-dashboard` -- expected: finds overview cards, leadership action table columns, and AI summary groups.
