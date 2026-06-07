# Kiểm Kê Yêu Cầu

## Yêu Cầu Chức Năng

FR-001: Hệ thống phải cung cấp Dashboard Tổng Quan cho Module Lãnh đạo.
FR-002: Dashboard phải hiển thị theo phạm vi và quyền của người dùng hiện tại.
FR-003: Dashboard phải hiển thị tổng số dự án/cơ hội trong phạm vi.
FR-004: Dashboard phải hiển thị số dự án đỏ/vàng/xanh.
FR-005: Dashboard phải hiển thị KPI tổng ở mức điều hành.
FR-006: Dashboard phải hiển thị dòng tiền/chi phí tổng quan nếu người dùng có quyền xem tài chính nhạy cảm.
FR-007: Dashboard phải hiển thị tổng yêu cầu chờ duyệt và yêu cầu quá hạn.
FR-008: Dashboard phải hiển thị bản đồ rủi ro hoặc tóm tắt rủi ro.
FR-009: Dashboard phải hiển thị việc khẩn, hạn xử lý hôm nay và quyết định mới.
FR-010: Dashboard không được hiển thị việc vi mô, dữ liệu kỹ thuật chi tiết hoặc bản vẽ chi tiết mặc định.
FR-011: Dashboard phải cho phép xem chi tiết tới tóm tắt điều hành hoặc bản ghi chi tiết chỉ đọc nếu người dùng có quyền.
FR-012: Nếu người dùng có quyền vào module chuyên môn tương ứng, xem chi tiết có thể điều hướng sang module đó. Nếu không có quyền, hệ thống phải chặn bằng quyền/403.
FR-013: Hệ thống nên cung cấp Bản Tóm Tắt Đầu Ngày cho lãnh đạo.
FR-014: Bản Tóm Tắt Đầu Ngày hiển thị tóm tắt AI buổi sáng, rủi ro lớn nhất, việc cần quyết hôm nay, KPI hôm nay, phê duyệt quá hạn và dự án đỏ/vàng/xanh.
FR-015: Bản Tóm Tắt Đầu Ngày phải dùng dữ liệu trong phạm vi của người dùng.
FR-016: Hệ thống phải cung cấp Trung Tâm Điều Hành Chung cho lãnh đạo có quyền.
FR-017: Trung Tâm Điều Hành Chung phải hiển thị thông báo mới, quyết định mới, quyết định Chủ tịch, KPI chung, lịch họp, lịch sự kiện, rủi ro tổng, chiến lược, hạn xử lý hệ thống, việc vượt ngưỡng và việc quá hạn.
FR-018: Trung Tâm Điều Hành Chung là phần chung nhưng vẫn phải lọc dữ liệu theo phạm vi động và quyền.
FR-019: Rủi ro đỏ/nghiêm trọng và phê duyệt quá hạn nghiêm trọng phải xuất hiện trong Trung Tâm Điều Hành Chung nếu người dùng có quyền xem.
FR-020: Hệ thống phải cung cấp Không Gian Làm Việc Cá Nhân theo từng người dùng.
FR-021: Không được giả định hai lãnh đạo nhìn giống nhau nếu giao việc/phạm vi khác nhau.
FR-022: Không Gian Làm Việc Cá Nhân phải hiển thị dự án/cơ hội được giao, phê duyệt cần xử lý, rủi ro/điểm chặn liên quan, hạn xử lý, quyết định gần đây, cuộc họp và KPI trong phạm vi của người dùng.
FR-023: Hệ thống phải hỗ trợ không gian mẫu cho Chủ tịch, Tổng Giám đốc, Giám đốc dự án, Trưởng bộ phận và Thư ký/Trợ lý.
FR-024: Không gian của Thư ký/Trợ lý chỉ hiển thị dữ liệu và hành động được lãnh đạo ủy quyền.
FR-025: Hệ thống phải cung cấp Trung Tâm Phê Duyệt trong Module Lãnh đạo.
FR-026: Trung Tâm Phê Duyệt phải hiển thị phân vùng Trục 1, Trục 2 và Trục 3.
FR-027: Trong MVP này, Trục 1 là phần có dữ liệu/luồng chi tiết; Trục 2 và Trục 3 được phép là placeholder hoặc dữ liệu mock.
FR-028: Trung Tâm Phê Duyệt phải phân loại phê duyệt tối thiểu theo: hồ sơ/văn bản, tài chính/chi, chiến lược, kỹ thuật, pháp lý, họp.
FR-029: Trung Tâm Phê Duyệt phải hỗ trợ phê duyệt hồ sơ/văn bản trong Trục 1.
FR-030: Trung Tâm Phê Duyệt phải hỗ trợ phê duyệt chi phí/mock chi phí trong Trục 1.
FR-031: Trung Tâm Phê Duyệt phải hỗ trợ phê duyệt pháp lý/điểm chặn trong Trục 1.
FR-032: Trung Tâm Phê Duyệt phải hỗ trợ phê duyệt quy hoạch/kỹ thuật ở mức yêu cầu điều hành.
FR-033: Trung Tâm Phê Duyệt phải hỗ trợ phê duyệt chiến lược/chuyển bước gồm tiếp tục nghiên cứu, tạm dừng, loại bỏ, chuyển bước/giai đoạn.
FR-034: Trung Tâm Phê Duyệt phải hỗ trợ phê duyệt họp hoặc đề xuất họp quan trọng.
FR-035: Hệ thống phải cho phép một người duyệt trực tiếp nếu chính sách/giao việc xác định người đó đủ quyền.
FR-036: Hệ thống phải hỗ trợ quy trình duyệt tuần tự cơ bản khi chính sách yêu cầu.
FR-037: Ngưỡng duyệt tiền phải là cấu hình trong Cài Đặt BO/Chính sách, không hardcode trong nghiệp vụ.
FR-038: Phê duyệt phải hỗ trợ các kết quả: Duyệt, Từ chối, Trả lại/Yêu cầu chỉnh sửa, Chuyển tiếp/Leo thang, Yêu cầu họp, Tạm giữ/Đang chờ, Hủy.
FR-039: Từ chối và Trả lại/Yêu cầu chỉnh sửa bắt buộc nhập lý do.
FR-040: Duyệt cho phép bình luận tùy chọn.
FR-041: Tạm giữ/Đang chờ, Chuyển tiếp/Leo thang và Yêu cầu họp nên khuyến nghị bình luận.
FR-042: Lịch Sử Phê Duyệt phải lưu ai duyệt, thời gian, ghi chú, file đính kèm, trạng thái cũ/mới, phiên bản và nhật ký kiểm toán.
FR-043: Phê duyệt quá hạn phải cảnh báo người duyệt, người đề xuất, thư ký/trợ lý liên quan và leo thang theo chính sách nếu quá hạn kéo dài hoặc rủi ro cao.
FR-044: Hệ thống phải cung cấp Trung Tâm Quyết Định Và Giao Việc.
FR-045: Quyết định khác phê duyệt. Phê duyệt là hành động duyệt một yêu cầu cụ thể; quyết định là quyết định/chỉ đạo chính thức của lãnh đạo.
FR-046: Quyết định có thể được tạo sau phê duyệt, sau cuộc họp hoặc độc lập từ lãnh đạo.
FR-047: Quyết định phải hỗ trợ giao việc, đặt KPI, đặt hạn xử lý, đặt ưu tiên hoặc thay đổi hướng xử lý.
FR-048: Một quyết định có thể tạo nhiều giao việc/việc cho nhiều người, phòng ban hoặc dự án.
FR-049: MVP không yêu cầu người nhận xác nhận đã nhận việc.
FR-050: Quyết định phải có phiên bản/lịch sử khi sửa nội dung quan trọng như hạn xử lý, người phụ trách, phạm vi, mức ưu tiên, KPI hoặc chỉ đạo bổ sung.
FR-051: Trung Tâm Quyết Định Và Giao Việc phải hiển thị quyết định mới, giao việc, chỉ đạo ưu tiên, KPI giao xuống, hạn xử lý và trạng thái thực hiện.
FR-052: Hệ thống phải cung cấp Trung Tâm Rủi Ro Và Cảnh Báo.
FR-053: Mức rủi ro gồm Thấp, Trung bình, Cao, Nghiêm trọng.
FR-054: Nhóm rủi ro mặc định gồm Pháp lý, Quy hoạch/kỹ thuật, Phê duyệt, Tiến độ, Tài chính, Hồ sơ thiếu, Hệ thống/phân quyền, Vận hành/phối hợp.
FR-055: Nhóm rủi ro phải cấu hình được trong Cài Đặt BO, không hardcode cứng.
FR-056: Trạng thái đỏ/vàng/xanh của dự án dùng mô hình kết hợp: hệ thống gợi ý từ dữ liệu, người có quyền xác nhận/override.
FR-057: Override trạng thái đỏ/vàng/xanh phải có lý do và nhật ký kiểm toán.
FR-058: Điều kiện đỏ gồm điểm chặn nghiêm trọng, quá hạn quan trọng, phê duyệt quá hạn vượt ngưỡng, hồ sơ thiếu làm chặn bước, rủi ro tài chính/pháp lý/quy hoạch cao hoặc vấn đề cần lãnh đạo xử lý ngay.
FR-059: Điều kiện vàng gồm vấn đề cần theo dõi, sắp quá hạn, hồ sơ thiếu nhưng chưa chặn, rủi ro trung bình hoặc phê duyệt gần quá hạn.
FR-060: Điều kiện xanh gồm không có điểm chặn, milestone ổn, phê duyệt không quá hạn và hồ sơ/rủi ro trong tầm kiểm soát.
FR-061: Bản đồ rủi ro mặc định cho lãnh đạo phải hiển thị danh sách/bản đồ nhiệt theo màu, nhóm rủi ro, dự án, hạn xử lý và người phụ trách.
FR-062: Xem chi tiết rủi ro nên hỗ trợ ma trận khả năng xảy ra x mức ảnh hưởng.
FR-063: Hệ thống phải cho phép tạo rủi ro/điểm chặn bởi lãnh đạo trong phạm vi, giám đốc dự án, trưởng bộ phận/người phụ trách module, người phụ trách việc/hồ sơ nếu có quyền và thư ký/trợ lý nếu được ủy quyền.
FR-064: Hệ thống/AI chỉ được tạo cảnh báo hoặc gợi ý rủi ro ở trạng thái bản nháp, không tự tạo điểm chặn chính thức nếu chưa có người xác nhận.
FR-065: Đóng rủi ro/điểm chặn phải giới hạn cho người phụ trách, giám đốc dự án, lãnh đạo phụ trách hoặc người có quyền phù hợp.
FR-066: Rủi ro/điểm chặn mức Cao hoặc Nghiêm trọng nên cần người có quyền cao hơn hoặc lãnh đạo phụ trách xác nhận đóng.
FR-067: Rủi ro đỏ/nghiêm trọng phải tự động hiện ở Dashboard Tổng, Bản Tóm Tắt Đầu Ngày và Trung Tâm Rủi Ro nếu người xem có quyền.
FR-068: Rủi ro quá hạn phải nhắc và leo thang theo chính sách.
FR-069: Mỗi điểm chặn bắt buộc có tiêu đề, nhóm, mức độ, lý do/mô tả, dự án/module liên quan, người phụ trách, hạn xử lý, hành động xử lý tiếp theo, trạng thái và nhật ký kiểm toán.
FR-070: Hệ thống phải cung cấp một hệ thống cuộc họp chung theo mô hình Bộ Máy Cuộc Họp Thống Nhất + Nhiều Loại Cuộc Họp.
FR-071: Hệ thống không được tạo nhiều module họp riêng biệt cứng cho từng loại họp.
FR-072: Quản lý phòng họp/đặt phòng là placeholder trong MVP.
FR-073: Người được tạo cuộc họp gồm lãnh đạo trong phạm vi, giám đốc dự án, trưởng bộ phận/người phụ trách module nếu có quyền, thư ký/trợ lý nếu được ủy quyền và người có quyền đề xuất/tạo họp.
FR-074: Cuộc họp phải phân loại động theo meeting_type, organization_id, project_id, axis_id, department_id, visibility và participant_scope.
FR-075: Cuộc họp phải gắn được với dự án, trục, module/workstream, phòng ban, yêu cầu phê duyệt, rủi ro/điểm chặn, quyết định, việc hoặc hồ sơ liên quan nếu có.
FR-076: Tóm tắt cuộc họp bằng AI luôn là bản nháp cho tới khi được người có quyền duyệt.
FR-077: Biên bản chính thức phải được người có quyền duyệt.
FR-078: Cuộc họp phải sinh việc theo dõi nếu cần.
FR-079: Cuộc họp phải có theo dõi quyết định, bao gồm quyết định được ghi nhận trong cuộc họp, quyết định liên quan và trạng thái thực hiện sau họp.
FR-080: Hệ thống phải cung cấp Trung Tâm Lịch Sử Và Lưu Trữ.
FR-081: Trung tâm này phải hiển thị lịch sử quyết định, phê duyệt, giao việc, họp, nhật ký kiểm toán, phiên bản hồ sơ và lịch sử tìm kiếm nếu có.
FR-082: Trung tâm này cần hỗ trợ tìm kiếm, lọc, xuất dữ liệu và dòng thời gian theo quyền.
FR-083: Xuất dashboard, nhật ký kiểm toán và lịch sử phê duyệt phải giới hạn bởi quyền `Xuất dữ liệu`.
FR-084: Xuất dữ liệu nhạy cảm cần quyền riêng và phải ghi nhật ký kiểm toán.
FR-085: Trung Tâm AI Điều Hành trong MVP chỉ gồm Tóm tắt AI, Tóm tắt cuộc họp bằng AI và AI hỗ trợ phê duyệt dạng gợi ý.
FR-086: Phân tích rủi ro bằng AI, phân tích KPI bằng AI, AI hỗ trợ lãnh đạo và dự báo dự án bằng AI để giai đoạn sau hoặc mock/placeholder.
FR-087: AI bắt buộc tuân thủ quyền của người dùng hiện tại.
FR-088: AI chỉ được đọc, tóm tắt và gợi ý từ dữ liệu mà người dùng có quyền xem.
FR-089: AI không được tự phê duyệt, tự quyết định, tự tạo blocker chính thức hoặc tự publish biên bản chính thức.
FR-090: Nội dung AI tạo ra phải thể hiện là bản nháp/gợi ý cho đến khi người có quyền xác nhận.
FR-091: Hệ thống phải có mục quản trị riêng cho Chủ tịch/Super Admin.
FR-092: Cài Đặt BO MVP phải demo được cấu hình vai trò, quyền và chính sách/phạm vi cơ bản.
FR-093: Cài Đặt BO phải hỗ trợ mẫu vai trò mặc định bằng tiếng Việt.
FR-094: Cài Đặt BO phải cho phép cấu hình nhóm rủi ro.
FR-095: Cài Đặt BO phải cho phép cấu hình ngưỡng duyệt tiền ở mức mock/chính sách cơ bản.
FR-096: Cài Đặt BO phải tách quyền quản trị hệ thống khỏi quyền duyệt nghiệp vụ.
FR-097: Thư ký/trợ lý được ủy quyền theo từng lãnh đạo.
FR-098: Bên trong ủy quyền của lãnh đạo, hệ thống cần cho phép cấu hình phạm vi dự án/module/hành động nếu cần.
FR-099: Thư ký/trợ lý được tạo và submit yêu cầu thay lãnh đạo nếu lãnh đạo đó cho phép.
FR-100: MVP không cho thư ký/trợ lý duyệt thay lãnh đạo.
FR-101: Không gian của thư ký/trợ lý phải hiển thị lịch lãnh đạo, hồ sơ trình, tài liệu họp, việc hỗ trợ, nhắc việc và phê duyệt đang chờ trong phạm vi được ủy quyền.
FR-102: Hệ thống cuộc họp phải hỗ trợ loại `EXECUTIVE_MEETING` cho họp HĐQT, họp ban TGĐ, họp chiến lược, họp KPI và họp rủi ro.
FR-103: Hệ thống cuộc họp phải hỗ trợ loại `EXECUTIVE_OPERATIONAL_MEETING` cho các cuộc họp lãnh đạo với đầu tư, pháp lý, thiết kế, tài chính hoặc nhà thầu.
FR-104: Hệ thống cuộc họp phải hỗ trợ loại `DEPARTMENT_INTERNAL_MEETING` cho họp nội bộ phòng ban.
FR-105: Hệ thống cuộc họp phải hỗ trợ loại `PROJECT_MEETING` cho họp dự án, họp tiến độ, họp nghiệm thu và họp triển khai.
FR-106: Hệ thống cuộc họp phải hỗ trợ loại `EXTERNAL_PARTNER_MEETING` cho họp tư vấn, họp nhà thầu và họp đối tác.
FR-107: Hệ thống cuộc họp phải hỗ trợ loại `GOVERNMENT_MEETING` cho họp UBND, họp Sở và họp cơ quan chức năng.
FR-108: Mỗi cuộc họp phải có dữ liệu tối thiểu: id, title, meeting_type, organization_id, project_id, axis_id, department_id, visibility, host, participants, external_participants, room_id, start_time, end_time, agenda, attachments, transcript, ai_summary, meeting_minutes, decisions, follow_up_actions, related_approvals, related_tasks, status và audit_log.
FR-109: Quy trình cuộc họp phải hỗ trợ các trạng thái: SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, FOLLOW_UP_PENDING và CLOSED.
FR-110: Mức hiển thị cuộc họp phải tuân thủ RBAC, phạm vi dự án và phạm vi tổ chức.
FR-111: Lãnh đạo chỉ nhìn thấy các cuộc họp trong phạm vi gồm họp quan trọng, họp chiến lược, họp rủi ro cao và họp có follow-up quá hạn.
FR-112: Không gian phòng ban chỉ nhìn thấy các cuộc họp thuộc phạm vi của phòng ban/người dùng.
FR-113: Trung Tâm Cuộc Họp phải cho phép lọc theo meeting_type, organization, project, axis, department, visibility, participant, status và thời gian.
FR-114: Trung Tâm Cuộc Họp phải cho phép ghi nhận external_participants cho tư vấn, nhà thầu, đối tác hoặc cơ quan chức năng.
FR-115: Trung Tâm Cuộc Họp phải cho phép liên kết follow_up_actions với related_tasks khi hành động cần được theo dõi như việc.
FR-116: Trung Tâm Cuộc Họp phải cho phép liên kết decisions với Trung Tâm Quyết Định Và Giao Việc để theo dõi thực hiện sau họp.
FR-117: Trung Tâm Cuộc Họp phải ghi nhật ký kiểm toán cho tạo/sửa/hủy cuộc họp, thay đổi người tham dự, upload tài liệu, cập nhật biên bản, duyệt tóm tắt AI, tạo việc theo dõi và cập nhật theo dõi quyết định.
FR-118: Trung Tâm Cuộc Họp phải cho phép cuộc họp nằm ngoài dự án cụ thể khi đó là họp cấp tập đoàn, họp chiến lược hoặc họp nội bộ không gắn dự án.
FR-119: Trung Tâm Cuộc Họp phải cho phép cuộc họp gắn với nhiều dự án nếu cuộc họp là họp portfolio, họp chiến lược, họp rủi ro hoặc họp điều phối liên dự án.

## Yêu Cầu Phi Chức Năng

NFR-001: Mọi dữ liệu điều hành phải được lọc ở server/service layer trước khi trả về UI.
NFR-002: Không được render dữ liệu rồi mới ẩn ở frontend.
NFR-003: Người không có quyền vào Module 1 phải nhận 403 khi truy cập trực tiếp.
NFR-004: Người không có quyền vào bản ghi/dữ liệu cụ thể phải không thấy dữ liệu đó và nhận 403 nếu truy cập trực tiếp.
NFR-005: Thay đổi dữ liệu quan trọng phải kiểm tra quyền phía server/service.
NFR-006: Phê duyệt, quyết định, rủi ro/điểm chặn, phê duyệt cuộc họp, xuất dữ liệu, override trạng thái và cập nhật quyền phải ghi nhật ký kiểm toán.
NFR-007: UI phải hỗ trợ nhiều tổ chức, nhiều dự án, nhiều vai trò và nhiều giao việc.
NFR-008: Không hardcode danh sách vai trò, người duyệt, ngưỡng tiền, nhóm rủi ro hoặc module tương lai.
NFR-009: AI phải chạy trong ngữ cảnh phân quyền của người dùng hiện tại.
NFR-010: Output AI phải được đánh dấu là bản nháp/gợi ý khi chưa được người có quyền xác nhận.
NFR-011: Dashboard và không gian làm việc phải đủ nhanh để lãnh đạo nhìn nhanh hiểu nhanh; không đẩy thông tin vi mô lên mặc định.
NFR-012: Xuất dữ liệu nhạy cảm phải có quyền riêng và nhật ký kiểm toán.
NFR-013: Mức hiển thị cuộc họp phải được kiểm tra ở server/service layer theo RBAC, phạm vi dự án, phạm vi tổ chức và participant_scope.

## Yêu Cầu Bổ Sung

- Tiếp tục trên nền brownfield hiện có: Next.js App Router + TypeScript modular monolith; không scaffold lại project và không tạo story khởi tạo project.
- Giữ kiến trúc modular monolith, không tách microservices trong scope này.
- Giữ ranh giới service/repository ổn định để hỗ trợ chế độ mock/file-backed và chế độ Supabase cùng một service contract.
- PostgreSQL/Supabase là persistence target; Supabase RLS là lớp defense-in-depth trước production rollout.
- Thay đổi dữ liệu từ UI nội bộ dùng Server Actions qua service layer; Route Handlers chỉ dùng khi có tích hợp/callback external/public.
- Kiểm tra quyền theo mặc định từ chối theo vai trò + phạm vi + hành động ở route/server action/service trước khi trả UI hoặc thay đổi dữ liệu.
- Direct URL không đủ quyền phải trả 403; UI không được render dữ liệu rồi mới ẩn.
- Proposal/Internal Approval là backbone quy trình dùng chung cho phê duyệt, yêu cầu trình lãnh đạo, follow-up cuộc họp và nhật ký kiểm toán; không tạo luồng phê duyệt riêng cho từng module.
- Bộ máy cuộc họp thống nhất phải dùng một engine chung với nhiều loại cuộc họp, mức hiển thị, phạm vi người tham gia và liên kết tới dự án/trục/module/rủi ro/việc/quyết định/phê duyệt.
- AI phải đi qua AI Gateway/Coordinator, có nguồn trích dẫn khi dùng dữ liệu nhạy cảm, chỉ đọc dữ liệu trong ngữ cảnh phân quyền và chỉ tạo đề xuất hành động cần người dùng xác nhận.
- AI không được thay đổi trực tiếp bảng domain; mọi thay đổi dữ liệu từ AI phải qua đề xuất hành động, xem trước, xác nhận người dùng và kiểm tra lại quyền domain.
- Data model project-centric nhưng phải hỗ trợ record cấp organization, không gắn project cụ thể hoặc gắn nhiều project khi nghiệp vụ meeting/decision/proposal cần.
- Business records lưu scope nghiệp vụ (`organization_id`, `project_id`, `axis_id`, `workstream_id/module_id`, `owner_id`); role/permission nằm ở assignment/policy/RBAC layer.
- Module 1 phải nằm trong bối cảnh Trục 1 chỉ expose 5 module/workstream chính; không hiển thị 12 bước cũ như 12 menu ngang hàng.
- 12 bước pháp lý cũ được giữ như checklist/workflow bên trong các module, không bị xóa hoặc đổi tên.
- Module 2-5 chưa triển khai sâu trong đợt này; chỉ tạo integration point/gap story khi cần cho Dashboard, Approval, Risk, Meeting, Decision hoặc dữ liệu mock nghiệm thu Module 1.
- Entity nền tối thiểu cần tính tới: organization, project, axis, workstream/module, project_workstream, task, document, legal_step, proposal/request, meeting, decision, approval, audit_log, assignment.
- Dashboard/KPI/rủi ro/mức sẵn sàng phải lấy từ bản ghi có cấu trúc qua service DTO đã lọc quyền, không hardcode số liệu trong UI.
- Zod dùng ở boundary form/action/service input; DB snake_case map sang domain camelCase trong repository.
- Domain module nằm dưới `src/modules/{module}` với `types.ts`, `validation.ts`, `actions.ts`, `services/*`, `components/*`; cross-cutting auth/permissions/db/storage/audit nằm dưới `src/lib/*`.
- Repository implementation đặt trong `services/*-repository.ts`; service orchestration đặt trong `services/*-service.ts`.
- Module không gọi repository của module khác trực tiếp; cross-module business flow đi qua service contracts.
- Audit/history/versioning áp dụng cho approval, decision, risk, meeting, export, permission và AI-confirmed mutations.
- Route/module mapping chính cho Module 1 dùng `src/app/command-center`, `src/app/executive/*`, `src/modules/command-center`, `src/modules/executive`, `src/modules/dashboard`, `src/modules/proposals`, `src/modules/meetings`, `src/modules/tasks`, `src/modules/documents`, `src/modules/legal`, `src/modules/ai`, `src/modules/settings`, `src/modules/users`, `src/modules/workspaces` khi liên quan.
- UI phải ưu tiên tiếng Việt, ưu tiên vai trò, dày thông tin nhưng dễ đọc, responsive, đạt WCAG 2.1 AA và không dùng một dashboard chung cho mọi vai trò.
- Feature mới phải kèm test phù hợp: unit tests cho service/quyền/truy cập dữ liệu, hành vi component khi cần, e2e smoke cho luồng chính nếu có route UI mới.
- Baseline kiểm chứng: `npm run typecheck`, `npm run lint`, `npm run test`; e2e hoặc script validation Supabase khi story chạm route/quyền/RLS/sẵn sàng production.
- Gap/hardening cần story riêng nếu nằm trong scope: kiểm chứng Supabase RLS live, validation Supabase repository cho proposal, định tuyến phê duyệt cấu hình được, upload/download storage production, UI nhật ký kiểm toán và thông báo.

## Yêu Cầu Thiết Kế UX

UX-DR1: Xây design system theo Tailwind CSS + shadcn/ui + Radix primitives + lucide-react, không đưa Ant Design/MUI làm nền chính.
UX-DR2: Chuẩn hóa design tokens cho màu semantic, typography, spacing 4/8/12/16/24px, radius tối đa 8px, border/divider, focus state và text tiếng Việt.
UX-DR3: Dùng nền sáng chuyên nghiệp, surface trắng, text rõ, GreenNest green cho primary action vừa phải, các màu info/warning/danger/success/neutral theo semantic state.
UX-DR4: Nhãn trạng thái luôn có chữ; rủi ro đỏ/vàng/xanh phải có nhãn, lý do và xem chi tiết, không chỉ dựa vào màu.
UX-DR5: Typography dashboard phải nhỏ gọn: title 24-28px, section 18-20px, panel 15-16px, body 14px, metadata 12-13px; không dùng hero-scale type trong dashboard/panel.
UX-DR6: Bố cục phải dày thông tin nhưng dễ đọc, không lồng thẻ trong thẻ, không dùng section nổi như thẻ lớn nếu không cần, dashboard ưu tiên grid/căn chỉnh/phân nhóm hơn trang trí.
UX-DR7: Bổ sung hoặc chuẩn hóa UI nền: nhãn trạng thái, thẻ/khung, bảng, thẻ chuyển nội dung, hộp thoại/hộp thoại cảnh báo, ngăn trượt/ngăn kéo, menu thả xuống, ô chọn, ô nhập/tìm kiếm, gợi ý, phân tách, vùng cuộn, khung chờ/tải dữ liệu, thông báo nhanh/phản hồi tại chỗ.
UX-DR8: Xây khung điều hướng theo quyền với thanh điều hướng theo quyền, thanh trên, breadcrumb/ngữ cảnh, bộ chọn không gian làm việc, bộ chọn phạm vi và vùng chứa nội dung; hỗ trợ desktop, ngăn kéo mobile, thu gọn, không có quyền và đang tải phiên đăng nhập.
UX-DR9: Xây header không gian làm việc hiển thị không gian làm việc, vai trò, phạm vi, thời gian cập nhật và hành động chính theo quyền; hỗ trợ biến thể Chủ tịch, Tổng Giám đốc, Giám đốc dự án, Trưởng bộ phận, Thư ký/Trợ lý.
UX-DR10: Xây dải KPI hiển thị KPI trọng yếu theo phạm vi với nhãn, giá trị, xu hướng, trạng thái, quyền dữ liệu và liên kết xem chi tiết; có trạng thái bình thường, cảnh báo, nguy hiểm, không có quyền, đang tải, chưa có dữ liệu.
UX-DR11: Xây hàng đợi ưu tiên cho phê duyệt, rủi ro, leo thang và việc ưu tiên với tiêu đề, loại, mức độ nghiêm trọng, người phụ trách, hạn xử lý, lý do, hành động tiếp theo, lọc/sắp xếp và thao tác nhanh theo quyền.
UX-DR12: Xây Bản Đồ Rủi Ro/Bản Đồ Áp Lực Hạn Xử Lý với nhóm, số lượng, mức độ nghiêm trọng, dự án bị ảnh hưởng, xem chi tiết, nhãn rõ và trợ năng không phụ thuộc màu.
UX-DR13: Xây Bảng Xử Lý Phê Duyệt có tóm tắt yêu cầu, chính sách, số tiền, tệp đính kèm, lịch sử và hành động duyệt/từ chối/trả lại/chuyển tiếp/yêu cầu họp/tạm giữ; từ chối/trả lại bắt buộc lý do.
UX-DR14: Xây Ngăn Chi Tiết Dữ Liệu Nguồn để mở dữ liệu nguồn từ KPI/rủi ro/phê duyệt, hiển thị tóm tắt, bản ghi liên quan, người phụ trách, trạng thái, hạn xử lý, dòng thời gian, nhật ký kiểm toán; desktop dùng ngăn bên, mobile dùng ngăn toàn màn hình.
UX-DR15: Xây Dòng Thời Gian Hoạt Động/Nhật Ký Kiểm Toán hiển thị người thao tác, hành động, thời điểm, trạng thái cũ/mới, bình luận, tệp đính kèm cho phê duyệt, quyết định, rủi ro, cuộc họp và thay đổi phân quyền.
UX-DR16: Xây Bảng AI Theo Ngữ Cảnh theo không gian làm việc/ngữ cảnh bản ghi, không thay quy trình; output là bản nháp/gợi ý/đề xuất, có nguồn trích dẫn và trạng thái đề xuất/đã chấp nhận/đã từ chối/đã thực thi/thất bại nếu sinh hành động.
UX-DR17: Tạo pattern Trung Tâm Điều Hành Lãnh Đạo gồm dải KPI, rủi ro/vấn đề nổi bật, hàng đợi phê duyệt, bản đồ rủi ro, dòng thời gian điều hành và bảng AI hỗ trợ.
UX-DR18: Tạo tổ hợp không gian làm việc theo vai trò từ cùng bộ pattern: Không gian Chủ tịch, Không gian Tổng Giám đốc, Không gian Giám đốc dự án, Không gian Trưởng bộ phận, Không gian Thư ký/Trợ lý; không hardcode từng không gian thành trang riêng rời rạc.
UX-DR19: Điểm vào sau đăng nhập phải đưa người dùng vào không gian làm việc mặc định theo vai trò chính; nếu có nhiều vai trò/phạm vi, UI phải cho đổi không gian làm việc/phạm vi rõ ràng.
UX-DR20: Mọi KPI, rủi ro, phê duyệt, hạn xử lý hoặc cảnh báo quan trọng phải xem chi tiết được và hiển thị tiêu đề, loại, phạm vi, người phụ trách, hạn xử lý, trạng thái, lý do, dữ liệu nguồn/bản ghi liên quan, hành động theo quyền và dòng thời gian/nhật ký nếu có.
UX-DR21: Phân cấp nút phải phân biệt hành động chính, phụ, nguy hiểm và bị khóa/không có quyền; thay đổi dữ liệu nguy hiểm/quan trọng cần xác nhận; hành động không đủ quyền không được làm lộ dữ liệu.
UX-DR22: Trạng thái phản hồi phải rõ: thành công nêu bản ghi và bước tiếp theo, cảnh báo cho sắp quá hạn/thiếu dữ liệu, lỗi có ngữ cảnh và cách khắc phục, không có quyền/403 không render dữ liệu rồi mới ẩn.
UX-DR23: Pattern form phải có nhãn tiếng Việt, dấu hiệu bắt buộc, kiểm tra hợp lệ tại chỗ, giữ input khi kiểm tra thất bại, vùng hành động cố định nếu form dài; form phê duyệt và form đề xuất hành động AI phải có kiểm tra/xem trước rõ.
UX-DR24: Điều hướng phải theo quyền và ưu tiên vai trò: thanh điều hướng chỉ hiện module/không gian làm việc có quyền, thanh trên có bộ chọn không gian làm việc/phạm vi, mobile dùng ngăn kéo, breadcrumb/ngữ cảnh chi tiết chỉ rõ tổ chức/dự án/trục/module.
UX-DR25: Tìm kiếm/lọc phải hỗ trợ tên dự án, phê duyệt, hồ sơ, người phụ trách, mã bản ghi; lọc theo trạng thái, mức độ nghiêm trọng, dự án, người phụ trách, hạn xử lý, module, phạm vi; danh sách/bảng quan trọng có sắp xếp và bộ lọc đang áp dụng có thể xóa.
UX-DR26: Trạng thái đang tải/chưa có dữ liệu/lỗi/không có quyền phải có nội dung rõ; khung chờ giữ bố cục ổn định; chưa có dữ liệu phân biệt không có dữ liệu trong phạm vi hay do bộ lọc; không có quyền không lộ dữ liệu nhạy cảm.
UX-DR27: Chiến lược responsive phải ưu tiên desktop cho quy trình phức tạp, tablet giảm cột/thu gọn điều hướng, mobile hỗ trợ review nhanh KPI/rủi ro/phê duyệt/lịch họp/tài liệu và hành động đơn giản.
UX-DR28: Dùng Tailwind breakpoints `sm`, `md`, `lg`, `xl`, `2xl`; `<768px` xếp chồng/ngăn kéo/danh sách gọn, `>=1280px` dashboard 3-4 cột, `>=1536px` có thể hiển thị KPI/hàng đợi/bản đồ rủi ro/dòng thời gian cùng lúc; không scale font theo chiều rộng viewport.
UX-DR29: Bảng rộng phải có phương án responsive: cuộn ngang có kiểm soát hoặc danh sách gọn; không ép bảng rộng trên mobile.
UX-DR30: Mục tiêu trợ năng là WCAG 2.1 AA: tương phản 4.5:1, focus dễ thấy, tên truy cập cho nút/nút icon, header bảng semantic, hộp thoại/ngăn trượt có tiêu đề/mô tả/giữ focus/nút đóng, vùng chạm mobile khoảng 44x44px.
UX-DR31: Kiểm tra responsive ở 360/390/430/768/820/1024/1280/1440/1536px cho các không gian làm việc và panel chính.
UX-DR32: Kiểm tra trợ năng bằng điều hướng chỉ bàn phím, thứ tự focus, kiểm tra trợ năng tự động nếu stack hỗ trợ, review tương phản thủ công và text tiếng Việt không tràn/cắt xấu.
UX-DR33: Các journey phải được hỗ trợ: vòng điều hành đầu ngày của Chủ tịch/Tổng Giám đốc, phê duyệt vượt ngưỡng, luồng rủi ro/hạn xử lý của Giám đốc dự án, luồng checklist/quy trình của Trưởng bộ phận, luồng chuẩn bị họp của Thư ký/Trợ lý.
UX-DR34: UX AI phải là trợ lý theo ngữ cảnh: nằm trong không gian làm việc/ngữ cảnh bản ghi, có nguồn trích dẫn, không tự duyệt/từ chối/tạo blocker/xuất bản biên bản, thay đổi dữ liệu qua xem trước và xác nhận của người dùng.
UX-DR35: Chuyển giao diện cũ sang cấu trúc pattern có thể hành động, loại bỏ thẻ tĩnh không có xem chi tiết/hành động; mỗi KPI/rủi ro/phê duyệt/quyết định cần người phụ trách, trạng thái, lý do, hạn xử lý, hành động tiếp theo và lịch sử/nhật ký khi phù hợp.

## Bản Đồ Bao Phủ FR

FR-001: Epic 2 - Dashboard Tổng Quan cho Module Lãnh đạo.
FR-002: Epic 2 - Dashboard lọc theo phạm vi và quyền.
FR-003: Epic 2 - Tổng số dự án/cơ hội trong phạm vi.
FR-004: Epic 2 - Trạng thái dự án đỏ/vàng/xanh.
FR-005: Epic 2 - KPI điều hành tổng.
FR-006: Epic 2 - KPI tài chính nhạy cảm theo quyền.
FR-007: Epic 2 - Tổng yêu cầu chờ duyệt và quá hạn.
FR-008: Epic 2 - Bản đồ rủi ro hoặc tóm tắt rủi ro.
FR-009: Epic 2 - Việc khẩn, hạn xử lý hôm nay và quyết định mới.
FR-010: Epic 2 - Không hiển thị việc vi mô hoặc dữ liệu chuyên môn sâu mặc định.
FR-011: Epic 2 - Xem chi tiết tới tóm tắt điều hành hoặc bản ghi chỉ đọc.
FR-012: Epic 2 - Xem chi tiết sang module chuyên môn theo quyền hoặc chặn 403.
FR-013: Epic 2 - Bản Tóm Tắt Đầu Ngày cho lãnh đạo.
FR-014: Epic 2 - Bản Tóm Tắt Đầu Ngày gồm tóm tắt AI, rủi ro, việc cần quyết, KPI, phê duyệt quá hạn và trạng thái dự án.
FR-015: Epic 2 - Bản Tóm Tắt Đầu Ngày dùng dữ liệu trong phạm vi.
FR-016: Epic 2 - Trung tâm điều hành chung.
FR-017: Epic 2 - Trung tâm điều hành chung hiển thị thông báo, quyết định, KPI, lịch, rủi ro, hạn xử lý và việc quá hạn.
FR-018: Epic 2 - Trung tâm điều hành chung lọc theo phạm vi động và quyền.
FR-019: Epic 2 - Rủi ro nghiêm trọng và phê duyệt quá hạn xuất hiện trong Trung tâm điều hành chung theo quyền.
FR-020: Epic 2 - Không gian làm việc cá nhân theo từng người dùng.
FR-021: Epic 2 - Không gian làm việc khác nhau theo giao việc/phạm vi.
FR-022: Epic 2 - Không gian làm việc cá nhân hiển thị dự án, phê duyệt, rủi ro, hạn xử lý, quyết định, cuộc họp và KPI trong phạm vi.
FR-023: Epic 2 - Không gian mẫu cho Chủ tịch, Tổng Giám đốc, Giám đốc dự án, Trưởng bộ phận và Thư ký/Trợ lý.
FR-024: Epic 2 - Không gian làm việc Thư ký/Trợ lý chỉ hiển thị dữ liệu và hành động được ủy quyền.
FR-025: Epic 3 - Trung tâm phê duyệt trong Module Lãnh đạo.
FR-026: Epic 3 - Trung tâm phê duyệt phân vùng Trục 1, Trục 2 và Trục 3.
FR-027: Epic 3 - Trục 1 có luồng chi tiết; Trục 2/3 là placeholder/mock.
FR-028: Epic 3 - Phân loại phê duyệt theo hồ sơ, tài chính, chiến lược, kỹ thuật, pháp lý và họp.
FR-029: Epic 3 - Phê duyệt hồ sơ/văn bản Trục 1.
FR-030: Epic 3 - Phê duyệt chi phí/mock chi phí Trục 1.
FR-031: Epic 3 - Phê duyệt pháp lý/điểm chặn Trục 1.
FR-032: Epic 3 - Phê duyệt quy hoạch/kỹ thuật ở mức yêu cầu điều hành.
FR-033: Epic 3 - Phê duyệt chiến lược/chuyển bước.
FR-034: Epic 3 - Phê duyệt họp hoặc đề xuất họp quan trọng.
FR-035: Epic 3 - Duyệt trực tiếp theo chính sách/giao việc.
FR-036: Epic 3 - Quy trình duyệt tuần tự cơ bản.
FR-037: Epic 3 - Ngưỡng duyệt tiền cấu hình qua Cài Đặt BO/Chính sách.
FR-038: Epic 3 - Kết quả phê duyệt: duyệt, từ chối, trả lại, chuyển tiếp, yêu cầu họp, tạm giữ, hủy.
FR-039: Epic 3 - Từ chối và trả lại bắt buộc lý do.
FR-040: Epic 3 - Duyệt có bình luận tùy chọn.
FR-041: Epic 3 - Tạm giữ, chuyển tiếp/leo thang và yêu cầu họp khuyến nghị bình luận.
FR-042: Epic 3 - Lịch sử phê duyệt gồm người thao tác, thời gian, ghi chú, tệp đính kèm, trạng thái/phiên bản và nhật ký kiểm toán.
FR-043: Epic 3 - Cảnh báo/leo thang phê duyệt quá hạn.
FR-044: Epic 4 - Trung tâm quyết định và giao việc.
FR-045: Epic 4 - Phân biệt quyết định với phê duyệt.
FR-046: Epic 4 - Quyết định tạo sau phê duyệt, sau cuộc họp hoặc độc lập.
FR-047: Epic 4 - Quyết định hỗ trợ giao việc, KPI, hạn xử lý, ưu tiên và hướng xử lý.
FR-048: Epic 4 - Một quyết định tạo nhiều giao việc/việc.
FR-049: Epic 4 - MVP không yêu cầu người nhận xác nhận đã nhận việc.
FR-050: Epic 4 - Quyết định có phiên bản/lịch sử khi sửa nội dung quan trọng.
FR-051: Epic 4 - Trung tâm quyết định hiển thị quyết định, giao việc, KPI, hạn xử lý và trạng thái thực hiện.
FR-052: Epic 5 - Trung tâm rủi ro và cảnh báo.
FR-053: Epic 5 - Mức rủi ro: Thấp, Trung bình, Cao, Nghiêm trọng.
FR-054: Epic 5 - Nhóm rủi ro mặc định.
FR-055: Epic 5 - Nhóm rủi ro cấu hình được trong Cài Đặt BO.
FR-056: Epic 5 - Trạng thái đỏ/vàng/xanh do hệ thống gợi ý và người có quyền xác nhận/override.
FR-057: Epic 5 - Override trạng thái cần lý do và nhật ký kiểm toán.
FR-058: Epic 5 - Điều kiện đỏ.
FR-059: Epic 5 - Điều kiện vàng.
FR-060: Epic 5 - Điều kiện xanh.
FR-061: Epic 5 - Bản đồ rủi ro theo màu, nhóm rủi ro, dự án, hạn xử lý và người phụ trách.
FR-062: Epic 5 - Xem chi tiết rủi ro với ma trận khả năng xảy ra x mức ảnh hưởng.
FR-063: Epic 5 - Tạo rủi ro/điểm chặn theo quyền và ủy quyền.
FR-064: Epic 5 - Hệ thống/AI chỉ tạo cảnh báo/gợi ý rủi ro ở bản nháp.
FR-065: Epic 5 - Đóng rủi ro/điểm chặn theo quyền.
FR-066: Epic 5 - Rủi ro cao/nghiêm trọng cần xác nhận đóng bởi quyền cao hơn khi phù hợp.
FR-067: Epic 5 - Rủi ro đỏ/nghiêm trọng hiện ở Dashboard, Bản Tóm Tắt Đầu Ngày và Trung Tâm Rủi Ro theo quyền.
FR-068: Epic 5 - Rủi ro quá hạn nhắc và leo thang theo chính sách.
FR-069: Epic 5 - Điểm chặn có đủ trường bắt buộc và nhật ký kiểm toán.
FR-070: Epic 6 - Bộ máy cuộc họp thống nhất + nhiều loại cuộc họp.
FR-071: Epic 6 - Không tạo nhiều module họp riêng cứng.
FR-072: Epic 6 - Quản lý phòng/đặt phòng là placeholder MVP.
FR-073: Epic 6 - Người tạo họp theo quyền/phạm vi/ủy quyền.
FR-074: Epic 6 - Phân loại cuộc họp động theo loại, tổ chức, dự án, trục, phòng ban, mức hiển thị, phạm vi người tham gia.
FR-075: Epic 6 - Cuộc họp liên kết dự án, trục, module, phòng ban, phê duyệt, rủi ro, quyết định, việc hoặc hồ sơ.
FR-076: Epic 6 - Tóm tắt cuộc họp bằng AI là bản nháp đến khi được duyệt.
FR-077: Epic 6 - Biên bản chính thức cần người có quyền duyệt.
FR-078: Epic 6 - Cuộc họp sinh việc theo dõi khi cần.
FR-079: Epic 6 - Cuộc họp có theo dõi quyết định.
FR-080: Epic 7 - Trung tâm lịch sử và lưu trữ.
FR-081: Epic 7 - Hiển thị lịch sử quyết định, phê duyệt, giao việc, cuộc họp, nhật ký kiểm toán, phiên bản và lịch sử tìm kiếm nếu có.
FR-082: Epic 7 - Tìm kiếm, lọc, xuất dữ liệu và dòng thời gian theo quyền.
FR-083: Epic 7 - Xuất dashboard, nhật ký kiểm toán và lịch sử phê duyệt theo quyền `Xuất dữ liệu`.
FR-084: Epic 7 - Xuất dữ liệu nhạy cảm cần quyền riêng và nhật ký kiểm toán.
FR-085: Epic 8 - Trung tâm AI điều hành MVP.
FR-086: Epic 8 - AI nâng cao để giai đoạn sau hoặc placeholder/mock.
FR-087: Epic 8 - AI tuân thủ permission người dùng hiện tại.
FR-088: Epic 8 - AI chỉ đọc, tóm tắt và gợi ý từ dữ liệu được phép.
FR-089: Epic 8 - AI không tự phê duyệt, quyết định, tạo blocker chính thức hoặc publish biên bản.
FR-090: Epic 8 - Output AI là bản nháp/gợi ý đến khi được xác nhận.
FR-091: Epic 1 - Khu quản trị riêng cho Chủ tịch/Super Admin.
FR-092: Epic 1 - Cài Đặt BO cấu hình vai trò, quyền và chính sách/phạm vi cơ bản.
FR-093: Epic 1 - Mẫu vai trò mặc định bằng tiếng Việt.
FR-094: Epic 1 - Cấu hình nhóm rủi ro.
FR-095: Epic 1 - Cấu hình ngưỡng duyệt tiền ở mức mock/chính sách cơ bản.
FR-096: Epic 1 - Tách quyền quản trị hệ thống khỏi quyền duyệt nghiệp vụ.
FR-097: Epic 1 - Thư ký/trợ lý được ủy quyền theo từng lãnh đạo.
FR-098: Epic 1 - Cấu hình phạm vi ủy quyền theo dự án/module/hành động.
FR-099: Epic 1 - Thư ký/trợ lý tạo và submit yêu cầu thay lãnh đạo khi được phép.
FR-100: Epic 1 - MVP không cho thư ký/trợ lý duyệt thay lãnh đạo.
FR-101: Epic 2 - Không gian Thư ký/Trợ lý hiển thị lịch, hồ sơ trình, tài liệu họp, việc, nhắc việc và phê duyệt đang chờ trong phạm vi.
FR-102: Epic 6 - Loại cuộc họp `EXECUTIVE_MEETING`.
FR-103: Epic 6 - Loại cuộc họp `EXECUTIVE_OPERATIONAL_MEETING`.
FR-104: Epic 6 - Loại cuộc họp `DEPARTMENT_INTERNAL_MEETING`.
FR-105: Epic 6 - Loại cuộc họp `PROJECT_MEETING`.
FR-106: Epic 6 - Loại cuộc họp `EXTERNAL_PARTNER_MEETING`.
FR-107: Epic 6 - Loại cuộc họp `GOVERNMENT_MEETING`.
FR-108: Epic 6 - Dữ liệu tối thiểu của cuộc họp.
FR-109: Epic 6 - Trạng thái quy trình cuộc họp.
FR-110: Epic 6 - Mức hiển thị cuộc họp theo RBAC, phạm vi dự án và phạm vi tổ chức.
FR-111: Epic 6 - Lãnh đạo chỉ thấy cuộc họp quan trọng trong phạm vi.
FR-112: Epic 6 - Không gian phòng ban chỉ thấy cuộc họp theo phạm vi phòng ban/người dùng.
FR-113: Epic 6 - Bộ lọc Trung Tâm Cuộc Họp.
FR-114: Epic 6 - Người tham gia bên ngoài.
FR-115: Epic 6 - Hành động theo dõi liên kết `related_tasks`.
FR-116: Epic 6 - Quyết định liên kết Trung Tâm Quyết Định Và Giao Việc.
FR-117: Epic 6 - Nhật ký kiểm toán cho thao tác cuộc họp.
FR-118: Epic 6 - Cuộc họp ngoài dự án cụ thể.
FR-119: Epic 6 - Cuộc họp gắn nhiều dự án.
