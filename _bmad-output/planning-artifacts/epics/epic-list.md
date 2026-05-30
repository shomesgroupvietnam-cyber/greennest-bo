# Epic List

## Epic 1: Thiết Lập Điều Hành, RBAC Và Ủy Quyền
Chủ tịch/Super Admin và quản trị được ủy quyền có thể cấu hình nền điều hành tối thiểu cho Module 1: role template tiếng Việt, permission/action, policy/scope, nhóm risk, ngưỡng duyệt tiền, phân quyền quản trị tách khỏi duyệt nghiệp vụ và ủy quyền thư ký/trợ lý. Epic này tạo nền an toàn để các workspace và flow sau hoạt động theo role + scope + action thay vì hardcode.

**FRs covered:** FR-091, FR-092, FR-093, FR-094, FR-095, FR-096, FR-097, FR-098, FR-099, FR-100.

**Implementation notes:** Dùng `src/modules/settings`, `src/modules/users`, `src/modules/workspaces`, `src/lib/permissions`, `src/lib/auth`, `src/lib/audit`; mutation qua Server Actions + service layer; repository giữ mock/Supabase parity; audit log cho cập nhật permission/policy/delegation.

## Epic 2: Workspace Điều Hành Và Dashboard Module 1
Lãnh đạo và người được ủy quyền có thể vào đúng workspace theo vai trò/scope, xem Dashboard Tổng Quan, Morning Briefing, Executive Common Center và Private Workspace với KPI, trạng thái đỏ/vàng/xanh, approval/risk/deadline/decision/meeting liên quan, dữ liệu nhạy cảm theo quyền và drill-down đến nguồn hoặc 403 khi không đủ quyền.

**FRs covered:** FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, FR-016, FR-017, FR-018, FR-019, FR-020, FR-021, FR-022, FR-023, FR-024, FR-101.

**Implementation notes:** Dùng `src/app/command-center`, `src/app/executive/*`, `src/modules/command-center`, `src/modules/executive`, `src/modules/dashboard`, `src/modules/workspaces`; service DTO phải filter server-side; UI dùng PermissionAwareShell, WorkspaceHeader, KPI Strip, Priority Queue, Risk Map và Record Drilldown; Module 2-5 chỉ dùng integration placeholders/mock khi cần hiển thị nguồn dữ liệu.

## Epic 3: Approval Center Trên Proposal/Approval Backbone
Lãnh đạo có thể xem và xử lý approval trong Module 1 qua một Approval Center chung, phân vùng Trục 1/2/3, phân loại request, xử lý approve/reject/return/forward/ask meeting/hold/cancel, áp dụng policy/assignment, lưu history/audit và cảnh báo/escalate quá hạn.

**FRs covered:** FR-025, FR-026, FR-027, FR-028, FR-029, FR-030, FR-031, FR-032, FR-033, FR-034, FR-035, FR-036, FR-037, FR-038, FR-039, FR-040, FR-041, FR-042, FR-043.

**Implementation notes:** Dùng `src/modules/proposals` làm backbone, không tạo approval flow riêng; Approval Action Panel theo UX spec; Trục 2/3 chỉ là placeholder/mock; policy/threshold lấy từ Epic 1; mọi mutation check permission server-side và audit.

## Epic 4: Decision & Assignment Center
Lãnh đạo có thể ban hành quyết định/chỉ đạo khác biệt với approval, tạo assignment/task từ decision, gán deadline/KPI/ưu tiên, theo dõi trạng thái thực hiện và giữ version/history khi sửa nội dung quan trọng.

**FRs covered:** FR-044, FR-045, FR-046, FR-047, FR-048, FR-049, FR-050, FR-051.

**Implementation notes:** Dùng `src/modules/executive`, `src/modules/tasks`, `src/modules/meetings` khi liên kết sau họp, `src/lib/audit`; decision có thể tạo từ approval, meeting hoặc độc lập nhưng không phụ thuộc future epic để dùng chức năng cơ bản.

## Epic 5: Risk & Alert Center Cho Điều Hành
Lãnh đạo có thể xem risk/blocker theo nhóm, mức độ, màu đỏ/vàng/xanh, lý do, deadline và owner; tạo/cập nhật/đóng risk theo quyền; nhận cảnh báo risk quá hạn/escalation; hệ thống chỉ đưa gợi ý/draft cho risk do AI hoặc rule phát hiện cho tới khi người có quyền xác nhận.

**FRs covered:** FR-052, FR-053, FR-054, FR-055, FR-056, FR-057, FR-058, FR-059, FR-060, FR-061, FR-062, FR-063, FR-064, FR-065, FR-066, FR-067, FR-068, FR-069.

**Implementation notes:** Dùng `src/modules/executive`, `src/modules/dashboard`, `src/modules/settings`, `src/lib/audit`; risk groups cấu hình từ Epic 1; Risk Map/Deadline Heatmap và drill-down phải không phụ thuộc màu; AI chỉ tạo advisory draft/action proposal.

## Epic 6: One Meeting Engine Cho Điều Hành
Người có quyền có thể tạo, xem, lọc và theo dõi cuộc họp qua một Meeting System chung với nhiều meeting type, visibility/scope động, external participants, attachments, agenda, minutes, AI summary draft, follow-up actions, related tasks, related approvals, decision tracking và audit.

**FRs covered:** FR-070, FR-071, FR-072, FR-073, FR-074, FR-075, FR-076, FR-077, FR-078, FR-079, FR-102, FR-103, FR-104, FR-105, FR-106, FR-107, FR-108, FR-109, FR-110, FR-111, FR-112, FR-113, FR-114, FR-115, FR-116, FR-117, FR-118, FR-119.

**Implementation notes:** Dùng `src/modules/meetings` và route meeting hiện có; không tách nhiều module họp riêng; phòng họp/booking là placeholder; liên kết với proposals, risks, tasks, decisions qua service contracts; meeting visibility enforce server/service.

## Epic 7: History, Archive, Export Và Audit Visibility
Người có quyền có thể tra cứu lịch sử điều hành, approval, decision, assignment, meeting, audit log, version hồ sơ, timeline và export theo permission; dữ liệu nhạy cảm hoặc export quan trọng luôn bị kiểm soát và ghi audit.

**FRs covered:** FR-080, FR-081, FR-082, FR-083, FR-084.

**Implementation notes:** Dùng `src/lib/audit`, `src/modules/reports`, `src/modules/executive`, `src/modules/proposals`, `src/modules/meetings`; export permission là `Xuất dữ liệu`; không render dữ liệu nhạy cảm trước khi kiểm tra quyền.

## Epic 8: Executive AI Advisory
Lãnh đạo có thể dùng AI Summary, AI Meeting Summary và AI Approval Assistant ở mức advisory trong đúng context và permission; AI chỉ đọc/tóm tắt/gợi ý từ dữ liệu được phép, output là draft/gợi ý, các năng lực AI nâng cao để phase sau hoặc mock/placeholder.

**FRs covered:** FR-085, FR-086, FR-087, FR-088, FR-089, FR-090.

**Implementation notes:** Dùng `src/modules/ai`, `src/modules/knowledge`, contextual AI panel trong executive/approval/meeting context; mọi đề xuất mutation đi qua action proposal preview, human confirmation và domain permission re-check; không cho AI tự approve, quyết định, tạo blocker chính thức hoặc publish biên bản.
