# Nguyên Tắc Làm Việc Dự Án Green Nest BuildFlow - BMAD V1

## 1. Mục Tiêu Chung

Mục tiêu của nhóm là xây dựng một nền tảng quản lý đầu tư, phát triển dự án và quản lý xây dựng có giá trị thực tế, dễ sử dụng và có khả năng phát triển lâu dài.

Trong giai đoạn hiện tại, ưu tiên:

- Hoàn thiện nền tảng cốt lõi.
- Xây dựng quy trình làm việc hiệu quả.
- Tích lũy tri thức dự án trong BMAD artifacts.
- Không phụ thuộc vào một cá nhân duy nhất.
- Tạo sản phẩm có thể nghiệm thu theo từng phần rõ ràng.

## 2. Vai Trò Và Trách Nhiệm

### Anh Sơn - Product Owner

Vai trò:

- Định hướng sản phẩm.
- Đưa ý tưởng và nhu cầu nghiệp vụ.
- Ưu tiên công việc.
- Chốt scope trước khi triển khai.
- Nghiệm thu cuối ngày hoặc theo từng gate.
- Quyết định cuối cùng về sản phẩm.

Không tham gia lập trình.

Trách nhiệm trong BMAD:

- Chốt input cho PRD, WBS, story và acceptance criteria.
- Xác nhận thay đổi scope qua BMAD artifact hoặc correct-course.
- Không yêu cầu dev làm feature ngoài story/scope đã chốt nếu chưa cập nhật artifact.

### Anh Duy - Technical Lead

Thời gian tham gia:

- Buổi tối các ngày thường, khoảng 2-3 giờ/ngày.
- Thứ Bảy, Chủ Nhật có thể tham gia nhiều hơn.

Nhiệm vụ:

- Định hướng kỹ thuật.
- Kiểm tra chất lượng code.
- Đề xuất giải pháp kỹ thuật.
- Hỗ trợ xử lý lỗi khó.
- Hướng dẫn quy trình phát triển.

Trách nhiệm trong BMAD:

- Review architecture decisions, story readiness và code review findings.
- Kiểm tra các điểm rủi ro: permission, audit, data model, repository parity, tests.
- Chốt các deferred technical issues vào đúng artifact thay vì để trong trao đổi miệng.

### Anh Quang - Developer

Thời gian tham gia:

- Toàn thời gian.

Nhiệm vụ:

- Thực hiện task được giao.
- Viết code.
- Báo cáo tiến độ.
- Phối hợp với Technical Lead.
- Cập nhật tài liệu và BMAD artifacts liên quan.

Trách nhiệm trong BMAD:

- Làm theo story đã được chốt.
- Không tự mở rộng scope nếu chưa có approval.
- Cập nhật trạng thái story, test result, blocker và deferred work.
- Commit định kỳ với message rõ ràng.

## 3. Nguyên Tắc Làm Việc

### Ưu Tiên Hiệu Quả

Không chạy theo số lượng tính năng.

Ưu tiên:

- Đúng hướng.
- Dễ sử dụng.
- Chất lượng.
- Có thể mở rộng.
- Có thể nghiệm thu.

### Không Phụ Thuộc Cá Nhân

Mọi kiến thức quan trọng phải được lưu lại:

- Quy trình.
- Cấu trúc hệ thống.
- Ý tưởng.
- Quyết định.
- Lý do thay đổi.
- Bài học sau review/UAT.

Nếu chỉ trao đổi miệng hoặc qua chat mà chưa đưa vào BMAD artifact/docs phù hợp, xem như chưa hoàn tất.

### Làm Ít Nhưng Làm Tới Nơi

Một chức năng hoàn thiện có giá trị hơn nhiều chức năng dở dang.

Mỗi chức năng cần có:

- Scope rõ.
- Acceptance criteria rõ.
- Code chạy được.
- Test hoặc kiểm tra phù hợp.
- Review.
- Ghi nhận trạng thái trong BMAD.

## 4. Quy Trình Làm Việc Hằng Ngày

### Buổi Sáng

Anh Sơn:

- Giao việc.
- Chốt mục tiêu trong ngày.
- Chỉ định story/task ưu tiên từ sprint status hoặc WBS hiện hành.

Developer:

- Xác nhận hiểu scope.
- Nêu blocker nếu story thiếu input.
- Không bắt đầu task mơ hồ nếu thiếu acceptance criteria.

### Trong Ngày

Developer:

- Thực hiện task.
- Commit định kỳ.
- Chạy kiểm tra phù hợp.
- Báo cáo nếu gặp khó khăn hoặc scope không rõ.
- Cập nhật artifact nếu có thay đổi đáng kể.

### Buổi Tối

Technical Lead:

- Kiểm tra code/diff.
- Đánh giá kiến trúc, permission, audit, data flow, tests.
- Góp ý hoặc yêu cầu sửa.
- Chốt vấn đề deferred nếu không cần sửa ngay.

### Cuối Ngày

Báo cáo ngắn theo mẫu:

```text
Đã làm
- ...

Đang làm
- ...

Vướng mắc
- ...

Kế hoạch ngày mai
- ...

BMAD cập nhật
- Story/status/artifact đã cập nhật: ...
```

## 5. Quy Trình Phát Triển Phần Mềm

Mỗi tính năng đi theo luồng:

```text
Ý tưởng
-> BMAD artifact / requirement note
-> Thiết kế / architecture decision nếu cần
-> Story có acceptance criteria
-> Code
-> Kiểm tra
-> Code review
-> Nghiệm thu
-> Cập nhật BMAD project memory
```

Không bỏ qua các bước sau:

- Scope/acceptance criteria.
- Server-side permission check cho action nhạy cảm.
- Audit cho mutation quan trọng.
- Test hoặc manual verification rõ ràng.
- Cập nhật story/status sau khi làm xong.

## 6. GitHub Và Mã Nguồn

Mọi thay đổi phải được:

- Lưu trên GitHub.
- Có lịch sử commit.
- Có commit message rõ nghĩa.
- Không trộn nhiều scope không liên quan trong cùng một commit lớn nếu có thể tách.

Ví dụ commit message:

- `add executive dashboard provider contract`
- `fix private workspace permission guard`
- `update approval escalation audit`
- `add module 1 gap closure artifact`

Nguyên tắc:

- Không commit secrets, token, password hoặc dữ liệu nhạy cảm.
- Không xóa hoặc revert thay đổi của người khác nếu chưa thống nhất.
- Code chưa xong nhưng cần lưu tiến độ phải ghi rõ trạng thái trong commit hoặc báo cáo.

## 7. BMAD Project Memory

BMAD Project Memory thay thế cho khái niệm `NEST_MEMORY` riêng lẻ. Dự án không duy trì một bộ nhớ song song nếu thông tin đó đã thuộc BMAD artifacts hoặc docs canonical.

### 7.1 Nguồn Bộ Nhớ Chính

| Loại thông tin | Nơi lưu chính |
| --- | --- |
| Product vision, domain, roadmap dài hạn | `blueprint/` |
| Quy chuẩn tài liệu | `docs/DOCUMENTATION_STANDARD.md` |
| Mapping BMAD với docs | `docs/BMAD_DOCUMENTATION_MAP.md` |
| Context cho AI/dev | `_bmad-output/project-context.md`, `docs/context/` |
| PRD, WBS, architecture, epics | `_bmad-output/planning-artifacts/` |
| Story, sprint status, review, deferred work | `_bmad-output/implementation-artifacts/` |
| Trạng thái phase hiện tại | `docs/product/PHASE_STATUS.md` |
| Kiến trúc và kỹ thuật chính thức | `docs/architecture/` |
| UX/design standard | `docs/design/` |

### 7.2 Mapping Từ NEST_MEMORY Sang BMAD

| NEST_MEMORY cũ | BMAD/Docs tương ứng |
| --- | --- |
| `NEST_CORE_THINKING.md` | `blueprint/00-product-vision.md`, `blueprint/01-domain-blueprint.md`, `_bmad-output/project-context.md` |
| `MAJOR_DECISIONS.md` | `blueprint/10-decision-log.md`, architecture decision artifacts, sprint change proposals |
| `IDEAS.md` | Product brief, PRD update, WBS/backlog artifacts, correct-course notes |
| `DAILY_LOG.md` | Daily report + story Dev Agent Record + `sprint-status.yaml` |
| `WEEKLY_SUMMARY.md` | Sprint status summary, retrospective, phase status update |
| `NEXT_TASK.md` | `sprint-status.yaml`, next story, `deferred-work.md` |

### 7.3 Nguyên Tắc Cập Nhật

Nếu chưa được ghi vào BMAD artifact hoặc docs phù hợp, xem như chưa hoàn thành.

Các trường hợp bắt buộc phải ghi lại:

- Quyết định sản phẩm quan trọng.
- Thay đổi scope.
- Thay đổi kiến trúc hoặc data model.
- Quy tắc permission/audit mới.
- Lý do defer một issue.
- Kết quả code review quan trọng.
- Kết quả nghiệm thu hoặc UAT.
- Gap/future enhancement đã thống nhất.

### 7.4 Không Ghi Trùng

Không tạo thêm tài liệu mới nếu đã có nơi phù hợp.

Ví dụ:

- Story implementation status ghi vào story file và `sprint-status.yaml`.
- Technical decision ghi vào architecture/decision artifact.
- Product requirement lớn ghi vào PRD/WBS/correct-course.
- Knowledge cho AI/dev ghi vào `project-context.md` hoặc `docs/context/`.

## 8. Quyền Sở Hữu Trí Tuệ

Toàn bộ tài sản tạo ra trong quá trình làm dự án thuộc sở hữu của dự án Green Nest, bao gồm:

- Source code.
- Database.
- Thiết kế giao diện.
- Logo.
- Tài liệu.
- BMAD artifacts.
- Project memory.
- Ý tưởng phát triển trong quá trình làm việc.

## 9. Bảo Mật

Không chia sẻ ra bên ngoài nếu chưa được thống nhất:

- Source code.
- Tài khoản.
- Token/API key.
- Dữ liệu nội bộ.
- Tài liệu dự án.
- BMAD artifacts có thông tin nhạy cảm.

Nguyên tắc kỹ thuật:

- Không commit secrets.
- Không gửi dữ liệu thật vào công cụ AI nếu chưa được phép.
- Không chia sẻ repo hoặc production credentials cho người ngoài dự án.

## 10. Bàn Giao

Khi nghỉ việc hoặc tạm dừng tham gia dự án, thành viên phải bàn giao:

- Mã nguồn đã làm.
- Branch/commit liên quan.
- Tài liệu hoặc BMAD artifacts đang phụ trách.
- Tài khoản hoặc quyền truy cập liên quan.
- Tiến độ công việc.
- Blocker và việc còn dang dở.

Bàn giao chưa ghi vào artifact hoặc báo cáo rõ ràng thì chưa được xem là hoàn tất.

## 11. Quyền Lợi

Quyền lợi gồm:

- Lương chính: ...
- Thưởng theo tiến độ: ...
- Thưởng dự án: ...

Trong tương lai, thành viên tiếp tục đồng hành và tham gia vận hành có thể được xem xét:

- Thưởng lợi nhuận.
- Thưởng cổ phần.
- Thưởng theo mức độ đóng góp.

Tỷ lệ cụ thể sẽ được thống nhất sau.

## 12. Tinh Thần Hợp Tác

Dự án được xây dựng trên:

- Trung thực.
- Tôn trọng.
- Học hỏi.
- Chia sẻ.
- Cùng phát triển.

Mục tiêu cuối cùng là tạo ra sản phẩm có giá trị thực cho người sử dụng và cho chính đội ngũ Green Nest.

## 13. Nguyên Tắc Chốt

Team làm việc theo BMAD, nghĩa là:

- Không làm việc ngoài scope đã chốt.
- Không để tri thức chỉ nằm trong đầu một người.
- Không coi feature là xong nếu chưa có nghiệm thu và cập nhật artifact.
- Không ưu tiên tốc độ ngắn hạn bằng cách phá kiến trúc, permission, audit hoặc khả năng mở rộng.
- Mọi thay đổi quan trọng phải có dấu vết.
