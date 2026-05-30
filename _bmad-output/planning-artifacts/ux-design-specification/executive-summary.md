# Executive Summary

## Project Vision

GREENNEST BUILDFLOW là hệ thống vận hành dự án cấp tập đoàn, bắt đầu với Trục 1 - Phát triển & Hình thành dự án. UX của Module Lãnh đạo cần giúp lãnh đạo xem nhanh tình trạng danh mục dự án, nhận diện rủi ro, xử lý phê duyệt, ban hành quyết định, giao việc, theo dõi họp và kiểm tra lịch sử điều hành theo đúng phạm vi được phân quyền.

## Target Users

Người dùng chính gồm Chủ tịch / Super Admin, CEO, Phó TGĐ, Giám đốc dự án, Trưởng bộ phận, Thư ký / Trợ lý, Quản trị hệ thống, Quản trị điều hành và Người xem. Trải nghiệm cần role-first, scope-aware và không giả định mọi lãnh đạo nhìn thấy cùng một dữ liệu.

## Key Design Challenges

Thiết kế phải đủ dày cho vận hành hằng ngày nhưng không biến dashboard lãnh đạo thành nơi nhập liệu vi mô. Mọi dữ liệu, module và hành động phải tuân thủ phân quyền role + scope + action. UX cũng cần phân biệt rõ approval, decision, assignment, risk, meeting và audit/history để tránh lẫn lộn nghiệp vụ.

## Design Opportunities

Cơ hội UX chính là tạo một executive operating layer rõ ràng: Morning Briefing để nắm việc đầu ngày, Common Center cho thông tin chung đã lọc quyền, Private Workspace cho phạm vi cá nhân, và drill-down từ KPI/risk/approval tới dữ liệu nguồn. AI nên xuất hiện như hành động ngữ cảnh có citation, trạng thái draft/gợi ý và human confirmation trước mọi thay đổi dữ liệu.
