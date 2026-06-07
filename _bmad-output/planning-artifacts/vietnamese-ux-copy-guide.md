# Quy Ước Copy Tiếng Việt Cho UI Và Story

Ngày cập nhật: 2026-06-06

## Mục Tiêu

Tất cả nhãn người dùng nhìn thấy phải dễ hiểu bằng tiếng Việt. Tên kỹ thuật, key, route, permission và type trong code có thể giữ tiếng Anh khi cần trace hoặc không nên đổi để tránh phá logic.

## Thuật Ngữ Chuẩn

| Không dùng trong UI | Dùng trong UI |
| --- | --- |
| Command Center | Trung Tâm Điều Hành |
| Dashboard Tong Quan / Executive Dashboard | Dashboard Tổng Quan |
| Morning Briefing | Bản Tóm Tắt Đầu Ngày |
| Executive Common Center | Trung Tâm Điều Hành Chung |
| Private Workspace | Không Gian Làm Việc Cá Nhân |
| Approval Center | Trung Tâm Phê Duyệt |
| Decision & Assignment Center | Trung Tâm Quyết Định Và Giao Việc |
| Meeting Center | Trung Tâm Họp |
| Priority Queue | Việc ưu tiên |
| KPI Strip | Dải KPI |
| Risk / Blocker | Rủi ro / Vướng mắc |
| Owner | Người phụ trách |
| Deadline | Hạn xử lý |
| Project | Dự án |
| Scope | Phạm vi |
| Approval | Phê duyệt |
| Assignment | Việc được giao |
| Audit log / Audit trail | Nhật ký kiểm toán |
| Read-only | Chỉ xem |
| Drill-down | Xem chi tiết |
| Linked sources | Nguồn liên quan |
| AI Summary draft | Bản tóm tắt AI nháp |

## Ranh Giới Màn Hình

- Dashboard Tổng Quan: màn tổng hợp điều hành, đọc nhanh KPI/rủi ro/phê duyệt/hạn xử lý/quyết định, chỉ mở chi tiết hoặc dẫn sang center chuyên trách.
- Bản Tóm Tắt Đầu Ngày: bản nháp đầu ngày có AI hỗ trợ, dùng nguồn trích dẫn, không thay thế dashboard tổng hợp.
- Trung Tâm Điều Hành Chung: feed chung cho lãnh đạo, gom việc ưu tiên, thông báo, lịch họp, quyết định và rủi ro theo phạm vi.
- Trung Tâm Phê Duyệt: nơi xử lý phê duyệt và policy, không để Dashboard tự sở hữu mutation phê duyệt.
- Trung Tâm Quyết Định Và Giao Việc: nơi theo dõi quyết định, giao việc, KPI, hạn xử lý và trạng thái thực hiện.

## Quy Tắc Wording

- Viết có dấu đầy đủ: `Không`, `Đang`, `Chưa`, `Cập nhật`, `Tạo`, `Lưu`.
- Ưu tiên động từ rõ hành động: `Mở chi tiết`, `Tạo cuộc họp`, `Cập nhật quyết định`, `Giao việc`.
- Empty state phải nói rõ lý do và phạm vi: `Không có rủi ro trong phạm vi hiện tại`.
- Khi không có quyền, nói theo hành động người dùng: `Không có quyền xem tài chính trong phạm vi này`.
- AI luôn ghi là nháp/gợi ý/tham khảo nếu chưa có human approval.
- Không dùng text kỹ thuật như DTO, provider, sourceType, mutation, mock trong UI thường ngày; chỉ dùng khi màn đó dành cho quản trị kỹ thuật.

## Ghi Chú Cho Story

Trong story/AC, có thể giữ tên component hoặc key trong backtick nếu cần trace code. Phần title, mô tả giá trị người dùng, acceptance criteria và UI label nên dùng tiếng Việt trước.
