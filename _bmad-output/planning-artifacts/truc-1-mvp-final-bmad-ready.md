---
title: "Trục 1 MVP Final - BMad Ready Requirement"
type: "planning-artifact"
created: "2026-05-23"
status: "final-draft-for-owner-signoff"
owner_edit_expected: false
canonical_update_required_after_approval: true
intended_bmad_next_steps:
  - bmad-prd
  - bmad-create-architecture
  - bmad-create-epics-and-stories
delivery_model: "Implement and accept one Trục 1 module at a time"
scope_lock: "MVP focuses on Trục 1 with 5 visible modules/workstreams only"
---

# Trục 1 MVP Final - BMad Ready Requirement

## 1. Mục Đích

Tài liệu này là bản tổng hợp cuối cho MVP đầu tiên của **Trục 1 - Phát triển & Hình thành dự án** trong GREENNEST BUILDFLOW.

Tài liệu được viết để dùng tiếp với BMad:

- `bmad-prd`: tạo PRD chính thức cho MVP Trục 1.
- `bmad-create-architecture`: thiết kế kiến trúc, data model, permission, routing, service boundary.
- `bmad-create-epics-and-stories`: tách thành epic/story triển khai theo từng module.
- `bmad-dev-story`: triển khai từng story sau khi story được duyệt.

Nguyên tắc triển khai sau này:

> Hoàn thành từng module của Trục 1, nghiệm thu với khách hàng, được duyệt xong mới chuyển sang module tiếp theo.

## 2. Quyết Định Đã Chốt

Các điểm sau được xem là quyết định baseline cho MVP:

| # | Quyết định |
| --- | --- |
| 1 | Tên chính thức: **TRỤC 1 - PHÁT TRIỂN & HÌNH THÀNH DỰ ÁN** / **Project Development / Project Formation** |
| 2 | Trục 1 MVP hiển thị 5 module chính, không hiển thị 12 bước cũ như 12 menu ngang hàng |
| 3 | Module 4 giữ tên đầy đủ: **Thiết kế - Quy hoạch - Kỹ thuật - BIM** |
| 4 | Giữ nguyên danh sách 12 bước cũ; 12 bước là workflow/checklist nằm bên trong 5 module |
| 5 | Không hardcode NƠXH; dùng khái niệm **điều kiện phát triển theo loại dự án** |
| 6 | Business record chỉ lưu scope nghiệp vụ; role/permission nằm trong assignment/policy/RBAC |
| 7 | MVP chỉ làm kiến trúc hiển thị, phân nhóm module, mapping workflow và dữ liệu nền; chưa triển khai business logic sâu toàn bộ |
| 8 | RBAC/403/server-side filtering/audit log là nguyên tắc bắt buộc |

## 3. Tầm Nhìn Tổng Thể

GREENNEST BUILDFLOW là hệ thống quản trị dự án cấp tập đoàn, có thể mở rộng cho:

- Nhiều công ty/pháp nhân.
- Nhiều dự án.
- Nhiều nhóm lãnh đạo.
- Nhiều phòng ban.
- Nhiều trục nghiệp vụ.
- Nhiều tổ chức ngoài nếu sau này Green Nest cung cấp dịch vụ phát triển/quản lý dự án thuê.

Hệ thống dài hạn có 3 trục:

| Trục | Tên | Ý nghĩa | Phạm vi trong MVP này |
| --- | --- | --- | --- |
| Trục 1 | Phát triển & Hình thành dự án | Tìm kiếm, tiếp nhận, thẩm định, phát triển và chuẩn hóa dự án trước khi triển khai | Là phạm vi chính |
| Trục 2 | Triển khai / Kiến tạo công trình | Biến dự án đủ điều kiện thành công trình thật | Chưa làm chi tiết |
| Trục 3 | Điều hành / Tài chính / Vận hành / KPI | Điều hành hiệu quả toàn hệ thống | Chưa làm chi tiết |

Các năng lực nền tảng như phân quyền, audit, organization, data isolation, approval engine là tầng dùng chung, không thuộc riêng Trục 3.

## 4. Định Nghĩa Trục 1

**TRỤC 1 - PHÁT TRIỂN & HÌNH THÀNH DỰ ÁN** là bộ máy tìm kiếm, tiếp nhận, thẩm định, phát triển và chuẩn hóa dự án trước khi triển khai.

Trục 1 không chỉ dành cho dự án bắt đầu từ đầu. Hệ thống cần hỗ trợ nhiều loại đầu vào:

- Cơ hội quỹ đất.
- Ý tưởng dự án.
- Dự án do Green Nest tự tìm kiếm.
- Cơ hội từ khách hàng, chủ đất, đối tác hoặc môi giới.
- Dự án được mời đầu tư.
- Dự án đang chạy rồi Green Nest tham gia ở giữa.
- Dự án hợp tác, M&A hoặc nhận chuyển nhượng.
- Dự án quản lý phát triển thuê cho đơn vị ngoài trong tương lai.

Mục tiêu của Trục 1 là tạo đủ căn cứ để lãnh đạo quyết định:

- Tiếp tục nghiên cứu.
- Bổ sung hồ sơ.
- Đàm phán thêm.
- Tạm dừng.
- Loại bỏ.
- Phê duyệt tiếp tục đầu tư/phát triển.
- Chuyển sang Trục 2 khi đủ điều kiện.

## 5. Scope MVP

MVP Trục 1 chỉ hiển thị 5 module chính:

1. Lãnh đạo.
2. Tìm kiếm & phát triển dự án.
3. Pháp lý.
4. Thiết kế - Quy hoạch - Kỹ thuật - BIM.
5. Đề xuất - Họp - Phê duyệt nội bộ.

MVP không triển khai sâu các module enterprise sau, nhưng kiến trúc phải không chặn việc thêm sau này:

- Opportunity Pipeline chi tiết.
- Due Diligence chuyên sâu.
- Tài chính tiền khả thi nâng cao.
- Stage Gate configurable.
- Data Room production-grade.
- Stakeholder/Authority Management.
- Risk Register nâng cao.
- Handover sang Trục 2 đầy đủ.
- Project Development Service cho tổ chức ngoài.

Nguyên tắc kỹ thuật/sản phẩm:

- UI hiện tại chỉ expose 5 module.
- Bên dưới dùng mô hình mở theo `axis + workstream/module`.
- Task, document, proposal, decision, risk có thể liên kết với module bất kỳ.
- Sau này thêm module bằng config/service/module mới, không rewrite lõi.

## 6. Ban Lãnh Đạo Và Phân Quyền

Ban lãnh đạo tập đoàn là tầng điều hành xuyên suốt toàn hệ thống, không thuộc riêng Trục 1.

Ban lãnh đạo có thể gồm:

- Chủ tịch HĐQT.
- Phó Chủ tịch.
- Tổng Giám đốc.
- Phó Tổng Giám đốc.
- Ban thư ký lãnh đạo.
- Trợ lý lãnh đạo.
- Giám đốc dự án nếu được bổ nhiệm vào phạm vi điều hành.

Lưu ý:

- Không phải ai trong Ban lãnh đạo cũng là Giám đốc dự án.
- Không phải Giám đốc dự án nào cũng thuộc Ban lãnh đạo tập đoàn.
- Một lãnh đạo có thể quản lý nhiều dự án.
- Một dự án có thể có nhiều lãnh đạo phụ trách các mảng khác nhau.
- Mỗi người chỉ thấy và thao tác đúng phần được giao.

MVP cần hỗ trợ tư duy phân quyền theo assignment:

```text
User + Role + Project + Axis + Workstream/Module + Action
```

Chưa cần full Chairman Administration UI trong MVP, nhưng không được hardcode kiểu một chức danh luôn thấy hoặc duyệt tất cả.

## 7. Hai Vùng Hiển Thị Của Ban Lãnh Đạo

### 7.1. Executive Common Center

Vùng chung cho lãnh đạo, hiển thị theo quyền.

MVP có thể gồm:

- Lịch họp.
- Thông báo mới.
- Quyết định/chỉ đạo mới.
- Proposal đang chờ xử lý.
- Dự án có rủi ro hoặc blocker.
- Việc cần chú ý.
- Báo cáo tổng quan Trục 1.

Các nội dung như KPI năm/quý/tháng, dòng tiền tổng, risk toàn hệ thống, chiến lược cấp tập đoàn có thể để giai đoạn sau hoặc thuộc Trục 3.

### 7.2. Executive Private Workspace

Vùng riêng theo phạm vi từng người được giao.

Ví dụ:

- Chủ tịch: toàn hệ thống hoặc phạm vi cấp cao được cấu hình.
- CEO: vận hành toàn hệ thống trong phạm vi được giao.
- Phó TGĐ đầu tư: phần Trục 1 hoặc đầu tư được giao.
- Phó TGĐ pháp lý: phần pháp lý được giao.
- Giám đốc dự án: một hoặc nhiều dự án được giao.
- Thư ký/trợ lý: lịch, hồ sơ, task, báo cáo, request được ủy quyền.

MVP cần ưu tiên hiển thị:

- Dự án/cơ hội được giao.
- Việc chờ duyệt.
- Việc quá hạn.
- Hồ sơ thiếu.
- Blocker.
- Quyết định gần đây.

## 8. Cấu Trúc 5 Module Trục 1 MVP

### 8.1. Module 1 - Lãnh Đạo

Tên:

```text
Lãnh đạo / Leadership / Executive
```

Vai trò:

Trung tâm điều hành Trục 1 theo phạm vi được phân quyền.

Module này không phải nơi nhập toàn bộ hồ sơ chi tiết. Đây là nơi xem tổng quan, nhận cảnh báo, duyệt quyết định lớn, ban hành chỉ đạo và theo dõi tình trạng trình duyệt.

MVP cần có:

- Dashboard Trục 1.
- Danh sách dự án/cơ hội đang phát triển.
- Tình trạng xanh/vàng/đỏ.
- Việc chờ duyệt.
- Việc quá hạn.
- Hồ sơ thiếu.
- Blocker pháp lý.
- Blocker quy hoạch/kỹ thuật.
- Quyết định mới.
- Giao việc mới.
- Lịch họp liên quan.

Đối tượng dùng:

- Chairman.
- CEO.
- Vice CEO.
- Investment Director.
- Project Director.
- Secretary/Assistant theo quyền.

Không hiển thị mặc định:

- Hồ sơ vi mô.
- Task nhỏ không thuộc phạm vi.
- Dữ liệu chuyên môn sâu không được phân quyền.
- Khoản chi nhỏ không vượt ngưỡng.

### 8.2. Module 2 - Tìm Kiếm & Phát Triển Dự Án

Tên:

```text
Tìm kiếm & phát triển dự án / Project Sourcing & Development
```

Vai trò:

Nơi tìm kiếm, tiếp nhận, khảo sát, đánh giá và hình thành cơ hội dự án.

MVP cần có:

- Tạo cơ hội/dự án mới.
- Ghi nhận ý tưởng dự án.
- Ghi nhận nguồn cơ hội.
- Ghi nhận quỹ đất/dự án/khách hàng/đối tác.
- Ghi nhận khảo sát khu đất hoặc hiện trạng dự án.
- Đánh giá vị trí.
- Đánh giá quy mô.
- Đánh giá điều kiện phát triển theo loại dự án.
- Đánh giá sơ bộ chi phí nếu có.
- Đánh giá sơ bộ hiệu quả nếu có.
- Phân tích tiền khả thi ở mức nền.
- Hồ sơ cơ hội đầu tư.
- Đề xuất tiếp tục / tạm dừng / loại bỏ.

Điều kiện phát triển theo loại dự án không hardcode NƠXH. Hệ thống cần chuẩn bị để hỗ trợ:

- NƠXH.
- Nhà ở thương mại.
- Khu đô thị.
- Hỗn hợp.
- Dự án nhận chuyển nhượng/hợp tác.
- Các loại dự án khác sau này.

Dữ liệu đầu vào:

- Địa điểm.
- Diện tích đất.
- Hiện trạng đất/dự án.
- Hình ảnh khảo sát.
- Bản đồ vị trí.
- Thông tin chủ đất/chủ đầu tư/đối tác/nguồn cơ hội.
- Chi phí dự kiến nếu có.
- Tiềm năng phát triển.
- Ghi chú khảo sát.

Dữ liệu đầu ra:

- Hồ sơ cơ hội dự án.
- Hồ sơ quỹ đất/dự án.
- Báo cáo khảo sát.
- Đánh giá sơ bộ.
- Đề xuất phát triển dự án.
- Request trình lãnh đạo nếu cần.

### 8.3. Module 3 - Pháp Lý

Tên:

```text
Pháp lý / Legal
```

Vai trò:

Quản lý hồ sơ pháp lý, thủ tục, phản hồi cơ quan và điều kiện pháp lý dự án trong Trục 1.

MVP cần có:

- Checklist pháp lý 12 bước.
- Hồ sơ pháp lý.
- Trạng thái từng bước.
- Người phụ trách.
- Deadline.
- Hồ sơ thiếu.
- Văn bản/công văn/quyết định liên quan.
- Phản hồi cơ quan nếu có.
- Cảnh báo vướng mắc pháp lý.
- Request trình lãnh đạo nếu cần.

Dữ liệu đầu vào:

- Giấy đăng ký doanh nghiệp nếu có.
- Hồ sơ năng lực nếu có.
- Văn bản pháp lý đất.
- Văn bản quy hoạch liên quan.
- Hồ sơ đề xuất dự án.
- Quyết định/công văn nhà nước.
- Văn bản giải trình.
- Hồ sơ pháp lý khác.

Dữ liệu đầu ra:

- Checklist pháp lý.
- Trạng thái pháp lý.
- Hồ sơ pháp lý hoàn chỉnh hoặc danh sách thiếu.
- Danh sách bước đang chờ cơ quan.
- Danh sách blocker pháp lý.
- Request trình lãnh đạo nếu cần.

### 8.4. Module 4 - Thiết Kế - Quy Hoạch - Kỹ Thuật - BIM

Tên:

```text
Thiết kế - Quy hoạch - Kỹ thuật - BIM
Design - Planning - Technical - BIM
```

Vai trò:

Quản lý quy hoạch, thiết kế cơ sở, chỉ tiêu kỹ thuật, bản vẽ, dữ liệu BIM và các điều kiện kỹ thuật giai đoạn đầu.

MVP cần có:

- Phân tích quy hoạch.
- Chỉ tiêu quy hoạch.
- Quy hoạch chi tiết 1/500 nếu có.
- Thiết kế cơ sở nếu có.
- Concept kiến trúc nếu có.
- Bản vẽ CAD/PDF nếu có.
- Mô hình BIM nếu có.
- Phiên bản thiết kế.
- Hồ sơ thẩm định thiết kế nếu có.
- Ghi nhận vấn đề kỹ thuật.
- Quản lý thay đổi thiết kế ở mức nền.
- Request trình lãnh đạo nếu cần.

Dữ liệu đầu vào:

- Chỉ tiêu quy hoạch.
- Nhiệm vụ thiết kế.
- Bản vẽ CAD/PDF.
- Mô hình BIM.
- Tiêu chuẩn thiết kế.
- Phương án kiến trúc.
- Phương án kết cấu/MEP sơ bộ.
- Ghi chú kỹ thuật.

Dữ liệu đầu ra:

- Hồ sơ 1/500.
- Hồ sơ thiết kế cơ sở.
- Bản vẽ trình thẩm định nếu có.
- Nhận định quy hoạch/kỹ thuật.
- Báo cáo thay đổi thiết kế nếu có.
- Request trình lãnh đạo nếu cần.

### 8.5. Module 5 - Đề Xuất - Họp - Phê Duyệt Nội Bộ

Tên:

```text
Đề xuất - Họp - Phê duyệt nội bộ
Internal Proposal - Meeting - Approval
```

Vai trò:

Nơi tạo request chính thức để trình lãnh đạo hoặc tổ chức họp. Đây là module kết nối các module chuyên môn với Approval Engine / Executive Approval Center.

MVP cần có:

- Tạo proposal/request.
- Gắn request với dự án.
- Gắn request với trục/module liên quan.
- Gắn hồ sơ đính kèm.
- Ghi nhận lý do đề xuất.
- Ghi nhận số tiền nếu có.
- Ghi nhận người đề xuất.
- Ghi nhận người cần duyệt hoặc nhóm duyệt.
- Ghi nhận deadline mong muốn.
- Theo dõi trạng thái.
- Duyệt, từ chối, trả lại/yêu cầu chỉnh sửa.
- Tạo task tiếp theo nếu được duyệt.
- Audit log.

Loại request MVP có thể hỗ trợ:

- Xin họp.
- Xin khảo sát.
- Xin chi khảo sát.
- Xin thuê tư vấn.
- Xin duyệt phương án.
- Xin ký hồ sơ.
- Xin phê duyệt hồ sơ.
- Xin trình cơ quan nhà nước.
- Xin duyệt báo cáo khả thi.
- Xin điều chỉnh phạm vi công việc.

Nguồn request:

- Tìm kiếm & phát triển dự án.
- Pháp lý.
- Thiết kế - Quy hoạch - Kỹ thuật - BIM.
- Lãnh đạo.
- Nhân sự được phân quyền.

Trạng thái:

- Draft.
- Submitted.
- Reviewing.
- Approved.
- Rejected.
- Returned / Change Requested.
- Cancelled.
- Overdue.

Dữ liệu đầu ra:

- Approval request.
- Quyết định duyệt/từ chối/trả lại.
- Task tiếp theo nếu được duyệt.
- Audit log.

## 9. Mapping 12 Bước Cũ Vào 5 Module

12 bước cũ được giữ nguyên, không xóa, không đổi tên thành danh sách mới, không hiển thị như 12 menu ngang hàng.

| # | 12 bước cũ | Module chính | Ghi chú |
| --- | --- | --- | --- |
| 1 | Khảo sát quỹ đất | Tìm kiếm & phát triển dự án | Gắn hồ sơ khảo sát, hiện trạng, hình ảnh, bản đồ |
| 2 | Phân tích quy hoạch | Thiết kế - Quy hoạch - Kỹ thuật - BIM | Có thể có kiểm tra sơ bộ từ Module 2, nhưng source chính là Module 4 |
| 3 | Hồ sơ đề xuất đầu tư | Tìm kiếm & phát triển dự án; Đề xuất - Họp - Phê duyệt nội bộ | Hồ sơ chuyên môn nằm ở Module 2, trình duyệt nằm ở Module 5 |
| 4 | Chủ trương đầu tư | Pháp lý; Đề xuất - Họp - Phê duyệt nội bộ | External legal procedure tách với internal approval |
| 5 | Quy hoạch chi tiết 1/500 | Thiết kế - Quy hoạch - Kỹ thuật - BIM; Pháp lý | Hồ sơ kỹ thuật ở Module 4, nộp/phản hồi cơ quan liên kết Module 3 |
| 6 | Thiết kế cơ sở | Thiết kế - Quy hoạch - Kỹ thuật - BIM | Gói thiết kế nền cho khả thi/thẩm định |
| 7 | Báo cáo nghiên cứu khả thi | Tìm kiếm & phát triển dự án; Pháp lý; Thiết kế - Quy hoạch - Kỹ thuật - BIM | Hiệu quả/đầu tư ở Module 2, pháp lý ở Module 3, kỹ thuật ở Module 4 |
| 8 | Đánh giá môi trường | Pháp lý | Có thể liên kết hồ sơ kỹ thuật nếu cần |
| 9 | PCCC | Pháp lý; Thiết kế - Quy hoạch - Kỹ thuật - BIM | Legal procedure ở Module 3, evidence kỹ thuật ở Module 4 |
| 10 | Giao đất / thuê đất | Pháp lý | Theo dõi thủ tục đất đai và nghĩa vụ liên quan |
| 11 | Chấp nhận chủ đầu tư | Pháp lý | Theo dõi hồ sơ năng lực và quyết định chấp thuận |
| 12 | Giấy phép xây dựng | Pháp lý | Điều kiện chốt trước khi chuyển triển khai/thi công |

Các mục mới như ý tưởng dự án, điều kiện phát triển theo loại dự án, tiền khả thi, hồ sơ năng lực chủ đầu tư được xem là sub-stage/sub-workflow bổ sung, không thay thế danh sách 12 bước cũ.

## 10. Nguyên Tắc UI

Route hoặc entry point Trục 1 chỉ hiển thị 5 module chính:

```text
[ Lãnh đạo ]
[ Tìm kiếm & phát triển dự án ]
[ Pháp lý ]
[ Thiết kế - Quy hoạch - Kỹ thuật - BIM ]
[ Đề xuất - Họp - Phê duyệt nội bộ ]
```

Không hiển thị 12 bước cũ như 12 menu ngang hàng.

Trong từng module cần có:

- Checklist/workflow.
- Hồ sơ.
- Request trình duyệt.
- Trạng thái.
- Người phụ trách.
- Deadline.
- Risk/blocker.
- Audit log.

Nếu giữ kiến trúc hiện tại, `/axis-1` có thể là entry route hoặc redirect vào Command Center view của Trục 1. Không bắt buộc tạo surface độc lập mới nếu Command Center đã là bề mặt điều hành chính.

Không đặt nhãn entry point Trục 1 là `Tổng quan` đơn lẻ nếu trong cùng sản phẩm có `Dashboard Tổng Quan` của Module 1 - Lãnh đạo. Nhãn phải phân biệt rõ `Tổng quan Trục 1` / `Command Center Trục 1` với `Dashboard Tổng Quan` của Module Lãnh đạo.

## 11. Khởi Tạo Dự Án Linh Hoạt

MVP cần hỗ trợ dự án không bắt đầu từ đầu.

Khi tạo dự án/cơ hội, cần ghi nhận entry point:

- Bắt đầu từ đầu Trục 1.
- Đang ở giữa Trục 1.
- Dự án đã có một số hồ sơ trước khi nhập hệ thống.
- Dự án đang chạy và Green Nest tham gia ở giữa.
- Dự án được mời đầu tư.
- Dự án hợp tác/M&A/nhận chuyển nhượng.

Các bước/hồ sơ trước khi nhập hệ thống cần trạng thái rõ:

- Chưa bắt đầu.
- Đang xử lý.
- Hoàn thành.
- Bị chặn.
- Không áp dụng.
- Đã hoàn thành trước khi nhập hệ thống.
- Có hồ sơ chứng minh.
- Cần kiểm tra lại.
- Thiếu dữ liệu.

Không được tự động coi toàn bộ bước trước đó là hoàn thành nếu không có hồ sơ hoặc xác nhận.

## 12. Permission Và Security

Nguyên tắc bắt buộc:

- Không có quyền vào Trục 1 thì trả `403`.
- Không có quyền vào module nào thì không thấy module đó.
- Truy cập URL trực tiếp không có quyền thì trả `403`.
- Không render dữ liệu rồi mới ẩn ở frontend.
- Filter dữ liệu từ server/service layer.
- Mutation phải kiểm tra quyền phía server/service.
- Mọi request/approval quan trọng phải có audit log.

Permission nên kiểm tra theo scope:

```text
user_id
role_id
organization_id
project_id
axis_id
workstream_id/module_id
action
```

Business record chỉ nên lưu scope nghiệp vụ:

```text
organization_id
project_id
axis_id
workstream_id/module_id
owner_id
```

`role` và `permission` không nên nhét vào mọi business record. Role/permission thuộc assignment, policy hoặc RBAC layer.

## 13. Data Model Nghiệp Vụ Tối Thiểu

MVP nên chuẩn bị các entity nền:

```text
organization
project
axis
workstream/module
project_workstream
task
document
legal_step
proposal/request
meeting
decision
approval
audit_log
assignment
```

Các record quan trọng cần có:

```text
id
organization_id
project_id
axis_id
workstream_id/module_id
owner_id
status
created_by
updated_by
created_at
updated_at
```

Trong MVP có thể dùng mock/local repository nếu cần, nhưng code/service không được giả định:

- Chỉ có một dự án.
- Chỉ có một organization.
- Chỉ có một role.
- Chỉ tồn tại đúng 5 module mãi mãi.

## 14. Approval Và Decision Flow

Không dùng một flow cố định cho mọi việc.

MVP có thể dùng flow đơn giản, nhưng model phải mở để sau này hỗ trợ:

- Theo dự án.
- Theo trục.
- Theo module/workstream.
- Theo loại proposal/request.
- Theo giá trị/ngưỡng tiền.
- Theo mức rủi ro.
- Theo người được phân quyền.
- Theo ủy quyền tạm thời.
- Duyệt tuần tự hoặc song song.

Mọi approval phải có:

- Người đề xuất.
- Người duyệt.
- Trạng thái.
- Deadline.
- Comment.
- File/hồ sơ liên quan.
- Kết quả quyết định.
- Audit log.
- Workflow tiếp theo nếu được duyệt.

## 15. Dashboard MVP Trục 1

Dashboard MVP Trục 1 cần hiển thị theo quyền:

- Tổng số dự án/cơ hội trong phạm vi.
- Dự án theo trạng thái.
- Dự án xanh/vàng/đỏ.
- Hồ sơ thiếu.
- Task đang mở.
- Task quá hạn.
- Bước pháp lý bị chặn.
- Bước pháp lý đang chờ cơ quan.
- Proposal/request đang chờ duyệt.
- Risk/blocker nổi bật.
- Quyết định gần đây.

Dashboard phải lấy dữ liệu từ record có cấu trúc. Không hardcode số liệu trong component.

## 16. Delivery Plan Và Nghiệm Thu Theo Module

Triển khai theo nguyên tắc một module một lần:

```text
Implement Module 1
-> Internal check
-> Customer acceptance
-> Approved
-> Implement Module 2
-> Customer acceptance
-> ...
```

Thứ tự đề xuất:

| Giai đoạn | Module | Điều kiện sang bước tiếp theo |
| --- | --- | --- |
| 1 | Lãnh đạo | Khách hàng duyệt dashboard, workspace, quyền xem, việc chờ duyệt |
| 2 | Tìm kiếm & phát triển dự án | Khách hàng duyệt form/dữ liệu cơ hội, quỹ đất, khảo sát, đề xuất |
| 3 | Pháp lý | Khách hàng duyệt checklist 12 bước, trạng thái, hồ sơ, blocker |
| 4 | Thiết kế - Quy hoạch - Kỹ thuật - BIM | Khách hàng duyệt dữ liệu quy hoạch, thiết kế, kỹ thuật, hồ sơ liên quan |
| 5 | Đề xuất - Họp - Phê duyệt nội bộ | Khách hàng duyệt request/proposal, approval states, audit, task follow-up |
| 6 | Integration pass | Khách hàng duyệt toàn bộ flow Trục 1 end-to-end |

Mỗi module khi nghiệm thu cần có:

- Scope đã làm.
- Demo UI.
- Dữ liệu mẫu.
- Test permission cơ bản.
- Test 403 khi không có quyền.
- Test audit log nếu có mutation quan trọng.
- Danh sách gap chuyển sang giai đoạn sau.

## 17. Acceptance Criteria MVP

| # | Tiêu chí |
| --- | --- |
| 1 | UI Trục 1 chỉ hiển thị 5 module chính |
| 2 | 12 bước cũ được giữ nguyên và map vào 5 module |
| 3 | Không hiển thị 12 bước như 12 menu ngang hàng |
| 4 | Module 4 hiển thị đúng tên Thiết kế - Quy hoạch - Kỹ thuật - BIM |
| 5 | Điều kiện phát triển theo loại dự án không hardcode NƠXH |
| 6 | Người có quyền tạo được dự án/cơ hội Trục 1 |
| 7 | Khi tạo dự án, hệ thống khởi tạo checklist pháp lý 12 bước |
| 8 | Dự án ghi nhận được entry point linh hoạt |
| 9 | Hồ sơ/task/proposal liên kết được với project, axis, module/workstream |
| 10 | Pháp lý cập nhật được trạng thái từng bước |
| 11 | Bước pháp lý bị chặn bắt buộc có lý do |
| 12 | Proposal/request có thể submit, approve, reject, return/change request |
| 13 | Approval tạo decision history/audit log |
| 14 | Dashboard hiển thị dự án, blocker, hồ sơ thiếu, task mở/quá hạn, proposal chờ duyệt |
| 15 | Không có quyền thì không thấy module/dữ liệu và truy cập trực tiếp trả 403 |
| 16 | Business record dùng scope; role/permission nằm ở assignment/policy/RBAC |
| 17 | Code/service không giả định chỉ có một dự án, một role hoặc đúng 5 module vĩnh viễn |

## 18. Out Of Scope MVP

Không làm trong MVP:

- Trục 2 chi tiết.
- Trục 3 chi tiết.
- Full configurable approval engine.
- Full Chairman Administration UI.
- Full project development service cho organization ngoài.
- Due Diligence chuyên sâu.
- Tài chính tiền khả thi nâng cao.
- Data Room production-grade.
- Risk Register nâng cao.
- Stage Gate configurable đầy đủ.
- Handover sang Trục 2 đầy đủ.
- Full BIM/CAD viewer/editor.
- Supabase storage/versioning production-grade nếu chưa có scope riêng.

## 19. BMad Next Steps

Sau khi chủ dự án duyệt tài liệu này:

1. Chạy `bmad-prd` để tạo PRD chính thức cho MVP Trục 1.
2. Chạy `bmad-create-architecture` để thiết kế data model, service boundary, permission model, route strategy và module config.
3. Chạy `bmad-create-epics-and-stories` để tách thành epic/story theo từng module.
4. Dùng `bmad-dev-story` để triển khai từng story.
5. Nghiệm thu từng module với khách hàng trước khi sang module tiếp theo.
6. Sau khi duyệt, promote phần đã chốt vào canonical docs:
   - `blueprint/01-domain-blueprint.md`
   - `blueprint/07-platform-requirements.md`
   - `blueprint/08-api-contract.md`
   - `blueprint/09-data-model.md`
   - `docs/product/PHASE_STATUS.md`
   - `docs/architecture/ARCHITECTURE_OVERVIEW.md`
