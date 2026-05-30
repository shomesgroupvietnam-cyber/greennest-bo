---
title: "Trục 1 MVP - BMad Requirement"
type: "planning-artifact"
created: "2026-05-23"
status: "draft-for-owner-approval"
owner_edit_expected: true
canonical_update_required_after_approval: true
intended_bmad_next_steps:
  - bmad-prd
  - bmad-create-architecture
  - bmad-create-epics-and-stories
scope_lock: "MVP focuses on Trục 1 with 5 visible workstreams only"
---

# Trục 1 MVP - BMad Requirement

## 1. Mục Đích

Tài liệu này chốt lại yêu cầu MVP đầu tiên cho **Trục 1 - Phát triển và hình thành dự án** của GREENNEST BUILDFLOW.

Mục tiêu là tạo một bản requirement đủ rõ để sau này dùng tiếp với BMad, gồm:

- `bmad-prd` để tạo hoặc cập nhật PRD.
- `bmad-create-architecture` để thiết kế kiến trúc/data model.
- `bmad-create-epics-and-stories` để tách thành epic/story triển khai.

Tài liệu này cố ý khóa phạm vi MVP để tránh mở rộng vô hạn. Các ý tưởng enterprise vẫn được ghi nhận, nhưng chỉ thiết kế nền để sau này mở rộng, chưa triển khai sâu trong MVP.

## 2. Tầm Nhìn Sản Phẩm

GREENNEST BUILDFLOW là hệ thống quản trị dự án cấp tập đoàn, có thể mở rộng cho nhiều dự án, nhiều lãnh đạo, nhiều phòng ban, nhiều công ty/pháp nhân và trong tương lai có thể hỗ trợ quản lý dự án thuê cho đơn vị ngoài.

Hệ thống dài hạn gồm 3 trục:

| Trục | Ý nghĩa | Trạng thái trong MVP này |
| --- | --- | --- |
| Trục 1 | Phát triển và hình thành dự án | Là phạm vi chính của MVP |
| Trục 2 | Triển khai, xây dựng, kiến tạo công trình | Chỉ giữ định hướng, chưa làm sâu |
| Trục 3 | Tài chính, vận hành, KPI, báo cáo, hiệu quả | Chỉ giữ định hướng, chưa làm sâu |

MVP đầu tiên tập trung vào Trục 1. Tuy nhiên, cách thiết kế không được khóa cứng vào một dự án, một role hoặc đúng 5 menu cố định. Hệ thống cần chuẩn bị nền để scale thành enterprise.

## 3. Định Nghĩa Trục 1

Trục 1 là bộ máy **tìm kiếm, tiếp nhận, thẩm định, phát triển và chuẩn hóa dự án trước khi triển khai**.

Trục 1 không chỉ áp dụng cho dự án bắt đầu từ số 0. Hệ thống phải hỗ trợ các loại đầu vào khác nhau:

- Dự án do Green Nest tự tìm kiếm và phát triển từ đầu.
- Cơ hội quỹ đất.
- Cơ hội từ khách hàng, chủ đất, đối tác hoặc môi giới.
- Dự án được mời đầu tư.
- Dự án đang chạy rồi Green Nest tham gia ở giữa.
- Dự án hợp tác, M&A hoặc nhận chuyển nhượng.
- Dự án quản lý phát triển thuê cho đơn vị ngoài trong tương lai.

Mục tiêu của Trục 1 là tạo đủ căn cứ để lãnh đạo quyết định:

- Tiếp tục nghiên cứu.
- Yêu cầu bổ sung hồ sơ.
- Đàm phán thêm.
- Phê duyệt tiếp tục đầu tư/phát triển.
- Chuyển sang Trục 2.
- Tạm dừng hoặc loại bỏ cơ hội.

## 4. Nguyên Tắc Scope MVP

MVP Trục 1 chỉ hiển thị và triển khai xoay quanh 5 nhóm nghiệp vụ chính:

1. Ban lãnh đạo.
2. Tìm kiếm và phát triển dự án.
3. Pháp lý.
4. Thiết kế - Quy hoạch - Kỹ thuật - BIM.
5. Đề xuất - Họp - Phê duyệt nội bộ.

Các năng lực enterprise sau **chưa triển khai sâu trong MVP**, nhưng kiến trúc phải không chặn việc bổ sung sau này:

- Opportunity Pipeline chi tiết.
- Due Diligence chuyên sâu.
- Tài chính tiền khả thi nâng cao.
- Stage Gate configurable.
- Data Room chuyên sâu.
- Stakeholder/Authority Management.
- Risk Register nâng cao.
- Handover sang Trục 2 đầy đủ.
- Quản lý dịch vụ phát triển dự án thuê cho tổ chức ngoài.

Nguyên tắc chốt:

- UI MVP chỉ có 5 nhóm nghiệp vụ.
- Data model và permission phải mở theo `axis` + `workstream`.
- Sau này thêm nhóm nghiệp vụ mới bằng config/module, không rewrite lõi.

## 5. Tầng Ban Lãnh Đạo Và Phân Quyền

Ban lãnh đạo tập đoàn là tầng điều hành xuyên suốt toàn hệ thống, không thuộc riêng Trục 1.

Ban lãnh đạo có thể gồm:

- Chủ tịch.
- Phó Chủ tịch.
- Tổng Giám đốc.
- Phó Tổng Giám đốc.
- Ban thư ký lãnh đạo.
- Trợ lý lãnh đạo.
- Giám đốc dự án nếu được bổ nhiệm vào phạm vi điều hành.

Lưu ý nghiệp vụ:

- Không phải ai trong Ban lãnh đạo cũng là Giám đốc dự án.
- Không phải Giám đốc dự án nào cũng thuộc Ban lãnh đạo tập đoàn.
- Một lãnh đạo có thể quản lý nhiều dự án.
- Một dự án có thể có nhiều lãnh đạo phụ trách các mảng khác nhau.
- Mỗi người chỉ được thấy và thao tác phần được giao.

Trong MVP, cần có khái niệm phân quyền theo assignment:

```text
User + Role + Project + Axis + Workstream + Action
```

Chủ tịch hoặc người có quyền quản trị có thể gán phạm vi cho lãnh đạo. MVP chưa cần làm full UI phân quyền enterprise phức tạp, nhưng hệ thống không được hardcode kiểu một chức danh luôn thấy hoặc duyệt tất cả.

## 6. Hai Vùng Hiển Thị Của Ban Lãnh Đạo

### 6.1. Executive Common Center

Đây là vùng chung cho lãnh đạo, hiển thị theo quyền.

MVP có thể hiển thị ở mức cơ bản:

- Lịch họp.
- Thông báo.
- Việc cần chú ý.
- Proposal đang chờ xử lý.
- Dự án có rủi ro hoặc blocker.
- Báo cáo tổng quan Trục 1.

Các nội dung như KPI năm/quý/tháng, chiến lược, risk toàn hệ thống, dòng tiền tổng có thể để giai đoạn sau hoặc thuộc Trục 3.

### 6.2. Executive Private Workspace

Đây là vùng riêng theo phạm vi từng người được giao.

Ví dụ:

- Chủ tịch: xem toàn bộ dữ liệu và phê duyệt cấp cao.
- Tổng Giám đốc: xem vận hành toàn bộ trong phạm vi được giao.
- Phó TGĐ đầu tư: xem/duyệt phần tìm kiếm và phát triển dự án được giao.
- Phó TGĐ pháp lý: xem/duyệt phần pháp lý được giao.
- Giám đốc dự án: xem dự án được giao.
- Trợ lý/thư ký: xem lịch, hồ sơ, task, báo cáo được ủy quyền.

Trong MVP, mỗi workspace cần ưu tiên:

- Dự án được giao.
- Việc cần duyệt.
- Việc quá hạn.
- Hồ sơ thiếu.
- Blocker.
- Quyết định gần đây.

## 7. Chi Tiết 5 Nhóm Nghiệp Vụ MVP Trục 1

### 7.1. Ban Lãnh Đạo Trong Phạm Vi Trục 1

Mục tiêu:

Ban lãnh đạo xem, kiểm tra, chỉ đạo và phê duyệt các nội dung liên quan đến Trục 1 theo phạm vi được giao.

MVP cần hỗ trợ:

- Xem danh sách dự án/cơ hội thuộc phạm vi.
- Xem trạng thái Trục 1 của từng dự án.
- Xem việc đang chờ duyệt.
- Xem blocker pháp lý, hồ sơ thiếu, công việc quá hạn.
- Duyệt, từ chối hoặc yêu cầu chỉnh sửa proposal.
- Ghi nhận quyết định/chỉ đạo.

Đầu ra:

- Quyết định tiếp tục nghiên cứu.
- Quyết định yêu cầu bổ sung.
- Quyết định duyệt/từ chối proposal.
- Chỉ đạo xử lý blocker.

### 7.2. Tìm Kiếm Và Phát Triển Dự Án

Mục tiêu:

Ban đầu tư/phát triển dự án ghi nhận cơ hội, tìm kiếm dự án, khách hàng, quỹ đất, đối tác hoặc dự án được mời đầu tư để trình lãnh đạo xem xét.

MVP cần hỗ trợ:

- Tạo cơ hội/dự án mới.
- Ghi nhận nguồn cơ hội.
- Ghi nhận thông tin quỹ đất hoặc dự án.
- Ghi nhận khách hàng, chủ đất, đối tác, môi giới nếu có.
- Ghi nhận khảo sát ban đầu.
- Ghi nhận đánh giá sơ bộ.
- Chuẩn bị hồ sơ đề xuất đầu tư/phát triển.
- Theo dõi trạng thái từ cơ hội đến trình duyệt.

Dữ liệu tối thiểu:

- Mã dự án/cơ hội.
- Tên dự án/cơ hội.
- Loại dự án.
- Nguồn cơ hội.
- Địa điểm.
- Diện tích.
- Chủ đất/chủ đầu tư/đối tác nếu có.
- Người phụ trách.
- Trạng thái.
- Ghi chú đánh giá sơ bộ.
- Hồ sơ liên quan.

Đầu ra:

- Hồ sơ cơ hội.
- Hồ sơ quỹ đất/dự án.
- Nhận định sơ bộ.
- Proposal trình lãnh đạo.

### 7.3. Pháp Lý

Mục tiêu:

Theo dõi tình trạng pháp lý, hồ sơ, thủ tục, phản hồi cơ quan và blocker pháp lý của dự án trong Trục 1.

MVP cần giữ checklist 12 bước cũ làm workflow pháp lý, không tách thành 12 menu độc lập:

| # | Bước |
| --- | --- |
| 1 | Khảo sát quỹ đất |
| 2 | Phân tích quy hoạch |
| 3 | Hồ sơ đề xuất đầu tư |
| 4 | Chủ trương đầu tư |
| 5 | Quy hoạch chi tiết 1/500 |
| 6 | Thiết kế cơ sở |
| 7 | Báo cáo nghiên cứu khả thi |
| 8 | Đánh giá môi trường |
| 9 | PCCC |
| 10 | Giao đất / thuê đất |
| 11 | Chấp nhận chủ đầu tư |
| 12 | Giấy phép xây dựng |

Mỗi bước pháp lý cần có:

- Trạng thái.
- Người phụ trách.
- Hạn xử lý.
- Ngày hoàn thành.
- Ghi chú.
- Hồ sơ liên quan.
- Lý do bị chặn nếu có.

Trạng thái tối thiểu:

- Chưa bắt đầu.
- Đang xử lý.
- Đang chờ cơ quan nhà nước.
- Hoàn thành.
- Bị chặn.
- Không áp dụng.
- Đã hoàn thành trước khi nhập hệ thống.
- Cần kiểm tra lại.

Nếu trạng thái là `bị chặn`, bắt buộc nhập lý do.

Đầu ra:

- Checklist pháp lý theo dự án.
- Danh sách hồ sơ thiếu.
- Danh sách bước đang chờ cơ quan.
- Danh sách blocker pháp lý.
- Cảnh báo cho lãnh đạo.

### 7.4. Thiết Kế - Quy Hoạch - Kỹ Thuật - BIM

Mục tiêu:

Đánh giá khả năng phát triển dự án về quy hoạch, thiết kế, kỹ thuật và BIM giai đoạn đầu.

MVP cần hỗ trợ:

- Ghi nhận chỉ tiêu quy hoạch chính.
- Ghi nhận nhận định quy hoạch sơ bộ.
- Theo dõi hồ sơ quy hoạch 1/500 nếu có.
- Theo dõi thiết kế cơ sở nếu có.
- Ghi nhận vấn đề kỹ thuật ảnh hưởng đến khả năng triển khai.
- Gắn hồ sơ kỹ thuật với dự án, bước pháp lý hoặc proposal.

Dữ liệu tối thiểu:

- Chức năng sử dụng đất.
- Mật độ xây dựng nếu có.
- Hệ số sử dụng đất nếu có.
- Tầng cao nếu có.
- Quy mô sản phẩm/dân số nếu có.
- Ghi chú quy hoạch.
- Ghi chú kỹ thuật.
- Hồ sơ thiết kế/quy hoạch liên quan.
- Người phụ trách.

Đầu ra:

- Nhận định quy hoạch/kỹ thuật sơ bộ.
- Hồ sơ thiết kế/quy hoạch liên quan.
- Danh sách vấn đề kỹ thuật.
- Đầu vào cho proposal hoặc báo cáo khả thi.

### 7.5. Đề Xuất - Họp - Phê Duyệt Nội Bộ

Mục tiêu:

Quản lý quá trình trình duyệt, họp, lấy ý kiến và ra quyết định nội bộ trong Trục 1.

MVP cần hỗ trợ:

- Tạo proposal.
- Gắn proposal với dự án.
- Gắn hồ sơ/tài liệu liên quan.
- Ghi nhận comment/ý kiến.
- Ghi nhận cuộc họp hoặc biên bản họp cơ bản.
- Duyệt, từ chối hoặc yêu cầu chỉnh sửa.
- Lưu lịch sử quyết định.
- Tạo follow-up task sau quyết định nếu cần.

Trạng thái proposal tối thiểu:

- Bản nháp.
- Đã trình.
- Đang xem xét.
- Yêu cầu chỉnh sửa.
- Đã duyệt.
- Từ chối.
- Lưu trữ.

Đầu ra:

- Proposal đã trình.
- Quyết định duyệt/từ chối/yêu cầu chỉnh sửa.
- Comment và lịch sử xử lý.
- Task follow-up.

## 8. Khởi Tạo Dự Án Linh Hoạt

MVP cần hỗ trợ dự án không bắt đầu từ đầu.

Khi tạo dự án/cơ hội, người dùng cần chọn hoặc ghi nhận `entry point`:

- Bắt đầu từ đầu Trục 1.
- Đang ở giữa Trục 1.
- Dự án đã có một số hồ sơ trước khi nhập hệ thống.
- Dự án đang chạy và Green Nest tham gia ở giữa.
- Dự án được mời đầu tư.

Các bước/hồ sơ trước khi nhập hệ thống cần có trạng thái rõ:

- Đã hoàn thành trước khi nhập hệ thống.
- Có hồ sơ chứng minh.
- Cần kiểm tra lại.
- Không áp dụng.
- Thiếu dữ liệu.

Không được tự động coi toàn bộ bước trước đó là hoàn thành nếu không có hồ sơ hoặc xác nhận.

## 9. Data Model Nghiệp Vụ Tối Thiểu

MVP nên chuẩn bị mô hình mở như sau:

```text
organization
project
axis
workstream
project_workstream
task
document
legal_step
proposal
meeting
decision
approval
audit_log
assignment
```

Các bản ghi nghiệp vụ quan trọng nên có scope:

```text
organization_id
project_id
axis_id
workstream_id
owner_id
status
created_by
updated_by
```

Trong MVP có thể dùng mock/local repository nếu cần, nhưng code/service không được giả định chỉ có một dự án hoặc một role.

## 10. Thiết Kế Workstream Mở Rộng

Hiện tại Trục 1 chỉ hiển thị 5 workstream:

```text
leadership
investment_development
legal
planning_design_technical_bim
proposal_meeting_approval
```

Sau này có thể thêm:

```text
opportunity_pipeline
due_diligence
pre_feasibility_finance
stage_gate
data_room
stakeholder_management
risk_register
handover_to_axis_2
```

Requirement quan trọng:

- UI render workstream từ config hoặc service.
- Permission kiểm tra theo `project_id + axis_id + workstream_id + action`.
- Task/document/proposal/risk phải gắn được vào workstream bất kỳ.
- Không viết UI hoặc logic theo kiểu chỉ tồn tại đúng 5 mục mãi mãi.

## 11. Dashboard MVP Trục 1

Dashboard Trục 1 cần hiển thị:

- Tổng số dự án/cơ hội trong phạm vi người dùng.
- Dự án theo trạng thái.
- Dự án có rủi ro hoặc blocker.
- Hồ sơ thiếu.
- Công việc đang mở.
- Công việc quá hạn.
- Bước pháp lý bị chặn.
- Bước pháp lý đang chờ cơ quan.
- Proposal đang chờ duyệt.
- Quyết định gần đây.

Dashboard phải lấy dữ liệu từ record có cấu trúc. Không hardcode số liệu trong component.

## 12. Permission Và Approval MVP

MVP cần có nguyên tắc:

- Người dùng phải đăng nhập mới vào được app.
- Người dùng chỉ thấy dự án và dữ liệu trong phạm vi được giao.
- Mutation phải kiểm tra quyền phía server/service.
- Người có quyền duyệt mới được approve/reject/request change.
- Mọi approval quan trọng phải lưu audit log.

Approval không dùng một flow cố định cho mọi việc. MVP có thể dùng flow đơn giản, nhưng model phải mở cho:

- Theo dự án.
- Theo trục.
- Theo workstream.
- Theo loại proposal.
- Theo người được phân quyền.
- Theo ủy quyền tạm thời trong tương lai.

## 13. AI Trong MVP

AI chỉ là advisory.

AI được phép:

- Tóm tắt trạng thái dự án.
- Cảnh báo hồ sơ thiếu.
- Gợi ý việc cần làm.
- Gợi ý rủi ro dựa trên dữ liệu có quyền xem.

AI không được:

- Tự duyệt hoặc từ chối.
- Tự thay đổi dữ liệu nếu chưa có xác nhận.
- Vượt quyền của người dùng hiện tại.
- Đưa kết luận pháp lý/tài chính/kỹ thuật cuối cùng.

AI có thể để sau MVP nếu chưa đủ dữ liệu.

## 14. Out Of Scope MVP

Không làm trong MVP:

- Trục 2 chi tiết.
- Trục 3 chi tiết.
- Full configurable approval engine.
- Full Chairman Administration UI.
- Full project development service cho organization ngoài.
- Due diligence chuyên sâu.
- Tài chính tiền khả thi nâng cao.
- Data Room production-grade.
- Risk Register nâng cao.
- Stage Gate configurable đầy đủ.
- Handover sang Trục 2 đầy đủ.
- Supabase storage/versioning production-grade nếu chưa có scope riêng.

## 15. Acceptance Criteria MVP

| # | Tiêu chí |
| --- | --- |
| 1 | Người có quyền tạo được dự án/cơ hội Trục 1 |
| 2 | Khi tạo dự án, hệ thống khởi tạo checklist pháp lý 12 bước |
| 3 | Dự án có thể ghi nhận entry point linh hoạt |
| 4 | UI Trục 1 hiển thị 5 nhóm nghiệp vụ MVP |
| 5 | 5 nhóm nghiệp vụ được render theo config/service, không hardcode chết trong component |
| 6 | Hồ sơ, task, proposal có thể liên kết với project, axis và workstream |
| 7 | Pháp lý cập nhật được trạng thái từng bước |
| 8 | Bước pháp lý bị chặn bắt buộc có lý do |
| 9 | Proposal có thể submit, approve, reject, request change |
| 10 | Approval tạo decision history/audit log |
| 11 | Dashboard hiển thị dự án, blocker, hồ sơ thiếu, task mở/quá hạn, proposal chờ duyệt |
| 12 | Người không có quyền không xem hoặc mutate được dữ liệu ngoài phạm vi |
| 13 | Code/service không giả định chỉ có một dự án, một role hoặc đúng 5 workstream vĩnh viễn |

## 16. BMad Next Steps

Sau khi chủ dự án chốt tài liệu này:

1. Chạy `bmad-prd` để tạo PRD chính thức cho MVP Trục 1.
2. Chạy `bmad-create-architecture` để thiết kế data model, service boundary, permission model và routing.
3. Chạy `bmad-create-epics-and-stories` để tách MVP thành epic/story.
4. Sau khi duyệt, promote phần đã chốt vào canonical docs:
   - `blueprint/01-domain-blueprint.md`
   - `blueprint/07-platform-requirements.md`
   - `blueprint/08-api-contract.md`
   - `blueprint/09-data-model.md`
   - `docs/product/PHASE_STATUS.md`
   - `docs/architecture/ARCHITECTURE_OVERVIEW.md`

## 17. Quyết Định Cần Chủ Dự Án Chốt

| # | Câu hỏi |
| --- | --- |
| 1 | Tên chính thức của Trục 1 là "Phát triển và hình thành dự án" hay tên khác? |
| 2 | MVP có giữ đúng 5 nhóm nghiệp vụ như tài liệu này không? |
| 3 | 12 bước pháp lý có giữ nguyên tên hiện tại không? |
| 4 | MVP có cần làm UI phân quyền Chủ tịch ở mức tối thiểu không, hay để giai đoạn sau? |
| 5 | AI có đưa vào MVP không, hay chỉ chuẩn bị nền dữ liệu? |
| 6 | Có cần xuất Word/PDF cho chủ đầu tư từ bản này không? |
