# Danh Sách Epic

## Epic 1: Thiết Lập Điều Hành, RBAC Và Ủy Quyền
Chủ tịch/Super Admin và quản trị được ủy quyền có thể cấu hình nền điều hành tối thiểu cho Module 1: role template tiếng Việt, permission/action, policy/scope, nhóm risk, ngưỡng duyệt tiền, phân quyền quản trị tách khỏi duyệt nghiệp vụ và ủy quyền thư ký/trợ lý. Epic này tạo nền an toàn để các workspace và flow sau hoạt động theo role + scope + action thay vì hardcode.

**FRs covered:** FR-091, FR-092, FR-093, FR-094, FR-095, FR-096, FR-097, FR-098, FR-099, FR-100.

**Ghi chú triển khai:** Dùng `src/modules/settings`, `src/modules/users`, `src/modules/workspaces`, `src/lib/permissions`, `src/lib/auth`, `src/lib/audit`; thay đổi dữ liệu đi qua Server Actions + service layer; repository giữ tương đương mock/Supabase; nhật ký kiểm toán cho cập nhật quyền/chính sách/ủy quyền. Epic này cũng bao gồm Story 1.6 để tách `chu_tich` khỏi `super_admin` kỹ thuật/BO.

## Epic 2: Không Gian Điều Hành Và Dashboard Module 1
Lãnh đạo và người được ủy quyền có thể vào đúng không gian làm việc theo vai trò/scope, xem Dashboard Tổng Quan, Bản tóm tắt đầu ngày, Trung tâm điều hành chung và Không gian làm việc cá nhân với KPI, trạng thái đỏ/vàng/xanh, approval/risk/deadline/decision/meeting liên quan, dữ liệu nhạy cảm theo quyền và drill-down đến nguồn hoặc 403 khi không đủ quyền.

**FRs covered:** FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, FR-016, FR-017, FR-018, FR-019, FR-020, FR-021, FR-022, FR-023, FR-024, FR-101.

**Ghi chú triển khai:** Dùng `src/app/command-center`, `src/app/executive/*`, `src/modules/command-center`, `src/modules/executive`, `src/modules/dashboard`, `src/modules/workspaces`; service DTO phải lọc phía server; UI dùng khung điều hướng theo quyền, header không gian làm việc, dải KPI, hàng đợi ưu tiên, bản đồ rủi ro và ngăn xem chi tiết nguồn dữ liệu. Module 2-5 chỉ dùng placeholder/mock tích hợp khi cần hiển thị nguồn dữ liệu. Các Story 2.8, 2.9 và 2.10 là story hardening tiếp theo cho vai trò bên ngoài, ma trận điều hướng và chính sách Chủ tịch/Super Admin.

## Epic 3: Trung Tâm Phê Duyệt Trên Nền Proposal/Approval
Lãnh đạo có thể xem và xử lý approval trong Module 1 qua một Approval Center chung, phân vùng Trục 1/2/3, phân loại request, xử lý approve/reject/return/forward/ask meeting/hold/cancel, áp dụng policy/assignment, lưu history/audit và cảnh báo/escalate quá hạn.

**FRs covered:** FR-025, FR-026, FR-027, FR-028, FR-029, FR-030, FR-031, FR-032, FR-033, FR-034, FR-035, FR-036, FR-037, FR-038, FR-039, FR-040, FR-041, FR-042, FR-043.

**Ghi chú triển khai:** Dùng `src/modules/proposals` làm nền, không tạo luồng phê duyệt riêng; Bảng Xử Lý Phê Duyệt theo UX spec; Trục 2/3 chỉ là placeholder/mock; chính sách/ngưỡng lấy từ Epic 1; mọi thay đổi dữ liệu kiểm tra quyền phía server và ghi nhật ký kiểm toán.

## Epic 4: Trung Tâm Quyết Định Và Giao Việc
Lãnh đạo có thể ban hành quyết định/chỉ đạo khác biệt với approval, tạo assignment/task từ decision, gán deadline/KPI/ưu tiên, theo dõi trạng thái thực hiện và giữ version/history khi sửa nội dung quan trọng.

**FRs covered:** FR-044, FR-045, FR-046, FR-047, FR-048, FR-049, FR-050, FR-051.

**Implementation notes:** Dùng `src/modules/executive`, `src/modules/tasks`, `src/modules/meetings` khi liên kết sau họp, `src/lib/audit`; decision có thể tạo từ approval, meeting hoặc độc lập nhưng không phụ thuộc future epic để dùng chức năng cơ bản.

## Epic 5: Trung Tâm Rủi Ro Và Cảnh Báo Điều Hành
Lãnh đạo có thể xem risk/blocker theo nhóm, mức độ, màu đỏ/vàng/xanh, lý do, deadline và owner; tạo/cập nhật/đóng risk theo quyền; nhận cảnh báo risk quá hạn/escalation; hệ thống chỉ đưa gợi ý/draft cho risk do AI hoặc rule phát hiện cho tới khi người có quyền xác nhận.

**FRs covered:** FR-052, FR-053, FR-054, FR-055, FR-056, FR-057, FR-058, FR-059, FR-060, FR-061, FR-062, FR-063, FR-064, FR-065, FR-066, FR-067, FR-068, FR-069.

**Ghi chú triển khai:** Dùng `src/modules/executive`, `src/modules/dashboard`, `src/modules/settings`, `src/lib/audit`; nhóm rủi ro cấu hình từ Epic 1; Bản Đồ Rủi Ro/Bản Đồ Áp Lực Hạn Xử Lý và xem chi tiết không được phụ thuộc màu; AI chỉ tạo bản nháp tư vấn/đề xuất hành động.

## Epic 6: Bộ Máy Cuộc Họp Thống Nhất Cho Điều Hành
Người có quyền có thể tạo, xem, lọc và theo dõi cuộc họp qua một Meeting System chung với nhiều meeting type, visibility/scope động, external participants, attachments, agenda, minutes, AI summary draft, follow-up actions, related tasks, related approvals, decision tracking và audit.

**FRs covered:** FR-070, FR-071, FR-072, FR-073, FR-074, FR-075, FR-076, FR-077, FR-078, FR-079, FR-102, FR-103, FR-104, FR-105, FR-106, FR-107, FR-108, FR-109, FR-110, FR-111, FR-112, FR-113, FR-114, FR-115, FR-116, FR-117, FR-118, FR-119.

**Implementation notes:** Dùng `src/modules/meetings` và route meeting hiện có; không tách nhiều module họp riêng; phòng họp/booking là placeholder; liên kết với proposals, risks, tasks, decisions qua service contracts; meeting visibility enforce server/service.

## Epic 7: Lịch Sử, Lưu Trữ, Xuất Dữ Liệu Và Hiển Thị Nhật Ký
Người có quyền có thể tra cứu lịch sử điều hành, approval, decision, assignment, meeting, audit log, version hồ sơ, timeline và export theo permission; dữ liệu nhạy cảm hoặc export quan trọng luôn bị kiểm soát và ghi audit.

**FRs covered:** FR-080, FR-081, FR-082, FR-083, FR-084.

**Implementation notes:** Dùng `src/lib/audit`, `src/modules/reports`, `src/modules/executive`, `src/modules/proposals`, `src/modules/meetings`; export permission là `Xuất dữ liệu`; không render dữ liệu nhạy cảm trước khi kiểm tra quyền.

## Epic 8: AI Tư Vấn Điều Hành
Lãnh đạo có thể dùng AI Summary, AI Meeting Summary và AI Approval Assistant ở mức advisory trong đúng context và permission; AI chỉ đọc/tóm tắt/gợi ý từ dữ liệu được phép, output là draft/gợi ý, các năng lực AI nâng cao để phase sau hoặc mock/placeholder.

**FRs covered:** FR-085, FR-086, FR-087, FR-088, FR-089, FR-090.

**Implementation notes:** Dùng `src/modules/ai`, `src/modules/knowledge`, contextual AI panel trong executive/approval/meeting context; mọi đề xuất mutation đi qua action proposal preview, human confirmation và domain permission re-check; không cho AI tự approve, quyết định, tạo blocker chính thức hoặc publish biên bản.
