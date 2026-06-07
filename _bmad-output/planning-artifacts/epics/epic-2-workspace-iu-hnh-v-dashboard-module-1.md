# Epic 2: Không Gian Điều Hành Và Dashboard Module 1

Lãnh đạo và người được ủy quyền có thể vào đúng không gian làm việc theo vai trò/phạm vi, xem Dashboard Tổng Quan, Bản Tóm Tắt Đầu Ngày, Trung Tâm Điều Hành Chung và Không Gian Làm Việc Cá Nhân với KPI, trạng thái đỏ/vàng/xanh, phê duyệt/rủi ro/hạn xử lý/quyết định/cuộc họp liên quan, dữ liệu nhạy cảm theo quyền và xem chi tiết đến nguồn hoặc 403 khi không đủ quyền.

## Story 2.1: Khung Điều Hướng Theo Quyền Và Điểm Vào Không Gian Làm Việc

**Requirements Covered:** FR-002, FR-020, FR-021, FR-023, NFR-001, NFR-002, NFR-003, NFR-007, UX-DR7, UX-DR8, UX-DR9, UX-DR19, UX-DR24.

Là người dùng sau đăng nhập,
tôi muốn được đưa vào không gian làm việc mặc định theo vai trò và phạm vi,
để tôi bắt đầu ở đúng bề mặt điều hành thay vì dashboard chung.

**Acceptance Criteria:**

AC1:
**Given** người dùng đã đăng nhập và có assignment Module 1
**When** truy cập entry route điều hành
**Then** hệ thống hiển thị khung điều hướng theo quyền với thanh điều hướng theo quyền, thanh trên, bộ chọn không gian làm việc và bộ chọn phạm vi.

AC2:
**Given** người dùng không có quyền vào Module 1
**When** truy cập URL Module 1 trực tiếp
**Then** hệ thống trả 403
**And** không fetch/render dữ liệu Module 1 trước khi chặn.

AC3:
**Given** người dùng có nhiều vai trò/phạm vi
**When** đổi không gian làm việc hoặc phạm vi
**Then** dashboard tải lại bằng service DTO tương ứng với phạm vi mới
**And** điều hướng chỉ hiển thị module/không gian làm việc có quyền.

AC4:
**Given** người dùng có quyền vào Trục 1
**When** sidebar hoặc entry point điều hành render
**Then** hệ thống phân biệt rõ `Tổng quan Trục 1` / Trung Tâm Điều Hành với `Dashboard Tổng Quan` của Module 1 - Lãnh đạo
**And** màn `Tổng quan Trục 1` chỉ đóng vai trò entry cho 5 module MVP, không thay thế dashboard 1.1 của Module Lãnh đạo.

AC5:
**Given** người dùng là Chủ tịch hoặc persona lãnh đạo có cả quyền điều hành và quyền quản trị
**When** đăng nhập hoặc mở không gian làm việc mặc định
**Then** hệ thống đưa người dùng vào không gian điều hành phù hợp theo vai trò/phạm vi
**And** `Quản trị Chủ tịch` / Thiết lập BO chỉ là mục riêng, không phải không gian làm việc điều hành hằng ngày mặc định.

**Files/Modules:** `src/app/command-center`, `src/app/executive/*`, `src/components/shared`, `src/modules/workspaces`, `src/lib/permissions`.

**Test Expectations:** Unit tests cho phân giải không gian làm việc; component tests cho trạng thái quyền của shell; e2e smoke cho direct 403 nếu route sẵn có.

**Dependencies:** Story 1.2. Story 1.5 cung cấp dữ liệu mẫu cho demo/nghiệm thu đầy đủ, nhưng không chặn phần khung điều hướng theo quyền, phân cấp điều hướng và sửa không gian làm việc mặc định.

## Story 2.2: DTO Dịch Vụ Dashboard Điều Hành Theo Phạm Vi

**Requirements Covered:** FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, NFR-001, NFR-002, NFR-007, NFR-011, UX-DR20, UX-DR35.

Là lãnh đạo,
tôi muốn dashboard lấy dữ liệu tổng hợp đã lọc quyền từ service,
để tôi chỉ thấy KPI, rủi ro, phê duyệt và hạn xử lý thuộc phạm vi của mình.

**Acceptance Criteria:**

AC1:
**Given** service nhận ngữ cảnh người dùng và phạm vi hiện tại
**When** tải Dashboard Tổng Quan
**Then** DTO có tổng dự án/cơ hội, trạng thái đỏ/vàng/xanh, KPI điều hành, yêu cầu chờ duyệt/quá hạn, tóm tắt rủi ro, hạn xử lý hôm nay và quyết định mới.

AC2:
**Given** người dùng không có quyền xem tài chính nhạy cảm
**When** DTO được tạo
**Then** tóm tắt tài chính trả trạng thái không có quyền hoặc bị loại bỏ từ service
**And** UI không nhận số liệu tài chính thật.

AC3:
**Given** dashboard có dữ liệu từ dự án, proposal, rủi ro, quyết định và cuộc họp
**When** repository ở mock mode hoặc Supabase mode
**Then** service contract trả cùng kiểu domain DTO.

**Files/Modules:** `src/modules/dashboard`, `src/modules/executive`, `src/modules/projects`, `src/modules/proposals`, `src/modules/meetings`, `src/modules/tasks`.

**Test Expectations:** Unit tests cho DTO filtering, financial permission, mock/Supabase repository parity bằng contract tests nếu có adapter.

**Dependencies:** Story 1.2, Story 1.5.

## Story 2.3: Giao Diện Dashboard Với Dải KPI, Hàng Đợi Ưu Tiên Và Tóm Tắt Rủi Ro

**Requirements Covered:** FR-001, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, NFR-011, UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR10, UX-DR11, UX-DR12, UX-DR21, UX-DR22, UX-DR25, UX-DR26, UX-DR27, UX-DR28, UX-DR29, UX-DR30, UX-DR31, UX-DR32, UX-DR35.

Là lãnh đạo,
tôi muốn dashboard hiển thị KPI, việc khẩn, phê duyệt, rủi ro và quyết định mới theo bố cục dễ quét,
để tôi biết nhanh vấn đề quan trọng nhất hôm nay.

**Acceptance Criteria:**

AC1:
**Given** dashboard DTO có dữ liệu hợp lệ
**When** người dùng mở Dashboard Tổng Quan
**Then** UI hiển thị Dải KPI, Hàng đợi ưu tiên, Tóm tắt/Bản đồ rủi ro, hạn xử lý hôm nay, quyết định mới và tóm tắt tài chính nếu người dùng có quyền
**And** khi người dùng không có quyền xem tài chính nhạy cảm, UI hiển thị trạng thái không có quyền bằng tiếng Việt và không render số tiền/dòng tiền/ngân sách thật
**And** không hiển thị việc vi mô hoặc bản vẽ chi tiết mặc định.

AC2:
**Given** một KPI/rủi ro/phê duyệt có nguồn dữ liệu
**When** người dùng chọn mục
**Then** hệ thống mở ngăn xem chi tiết hoặc liên kết chi tiết theo quyền.

AC3:
**Given** viewport mobile dưới 768px
**When** dashboard render
**Then** KPI/rủi ro/phê duyệt chuyển sang bố cục ưu tiên xếp chồng hoặc danh sách gọn
**And** text tiếng Việt không bị tràn/cắt xấu.

**Files/Modules:** `src/modules/dashboard/components`, `src/modules/executive/components`, `src/components/ui`, `src/components/shared`.

**Test Expectations:** Component tests cho trạng thái đang tải/chưa có dữ liệu/không có quyền; visual/e2e smoke ở desktop và mobile; kiểm tra trợ năng cho nhãn trạng thái/focus.

**Dependencies:** Story 2.1, Story 2.2.

## Story 2.4: Bản Tóm Tắt Đầu Ngày Theo Phạm Vi

**Requirements Covered:** FR-013, FR-014, FR-015, FR-085, FR-087, FR-088, FR-090, NFR-001, NFR-009, NFR-010, UX-DR16, UX-DR17, UX-DR33, UX-DR34.

Là Chủ tịch/Tổng Giám đốc,
tôi muốn bản tóm tắt đầu ngày lấy từ dữ liệu trong phạm vi,
để tôi biết rủi ro lớn, phê duyệt quá hạn, việc cần quyết và KPI hôm nay trong 1-2 phút.

**Acceptance Criteria:**

AC1:
**Given** ngữ cảnh người dùng có phạm vi hợp lệ
**When** mở bản tóm tắt đầu ngày
**Then** hệ thống hiển thị tóm tắt AI dạng bản nháp hoặc placeholder tóm tắt, rủi ro lớn nhất, việc cần quyết hôm nay, KPI hôm nay, phê duyệt quá hạn và trạng thái dự án đỏ/vàng/xanh.

AC2:
**Given** người dùng không có quyền xem một dự án/rủi ro/phê duyệt
**When** Bản Tóm Tắt Đầu Ngày được tạo
**Then** dữ liệu đó không xuất hiện trong briefing.

AC3:
**Given** AI summary chưa được người có quyền xác nhận
**When** hiển thị trên briefing
**Then** nội dung được đánh dấu bản nháp/gợi ý.

**Files/Modules:** `src/modules/executive`, `src/modules/dashboard`, `src/modules/ai`, `src/modules/workspaces`.

**Test Expectations:** Unit tests cho DTO bản tóm tắt theo phạm vi; component tests cho nhãn AI bản nháp và trạng thái chưa có dữ liệu.

**Dependencies:** Story 2.2, Story 2.3.

## Story 2.5: Trung Tâm Điều Hành Chung

**Requirements Covered:** FR-016, FR-017, FR-018, FR-019, NFR-001, NFR-002, NFR-011, UX-DR10, UX-DR11, UX-DR12, UX-DR20, UX-DR22.

Là lãnh đạo có quyền,
tôi muốn xem Trung Tâm Điều Hành Chung với thông tin chung đã lọc theo quyền,
để các vấn đề nghiêm trọng và thông tin điều hành chung không bị bỏ sót.

**Acceptance Criteria:**

AC1:
**Given** người dùng có quyền vào Trung Tâm Điều Hành Chung
**When** mở Trung tâm điều hành chung
**Then** hệ thống hiển thị thông báo mới, quyết định mới, KPI chung, lịch họp, rủi ro tổng, hạn xử lý hệ thống, việc vượt ngưỡng và việc quá hạn trong phạm vi.

AC2:
**Given** có rủi ro đỏ/nghiêm trọng hoặc phê duyệt quá hạn nghiêm trọng trong phạm vi
**When** Trung Tâm Điều Hành Chung render
**Then** mục đó xuất hiện trong vùng ưu tiên với lý do, người phụ trách, hạn xử lý và hành động/xem chi tiết theo quyền.

AC3:
**Given** người dùng thiếu quyền xem một thông tin chung
**When** Trung Tâm Điều Hành Chung tải dữ liệu
**Then** service loại bỏ dữ liệu đó trước khi trả UI.

**Files/Modules:** `src/modules/executive`, `src/modules/dashboard`, `src/modules/meetings`, `src/modules/proposals`, `src/modules/tasks`.

**Test Expectations:** Unit tests cho lọc Trung Tâm Điều Hành Chung; component tests cho mục ưu tiên, không có quyền và xem chi tiết.

**Dependencies:** Story 2.1, Story 2.2.

## Story 2.6: Không Gian Làm Việc Cá Nhân Theo Vai Trò

**Requirements Covered:** FR-020, FR-021, FR-022, FR-023, FR-024, FR-101, NFR-001, NFR-002, NFR-007, UX-DR9, UX-DR18, UX-DR19, UX-DR24, UX-DR33.

Là người dùng Module 1,
tôi muốn Không Gian Làm Việc Cá Nhân phản ánh giao việc/phạm vi của riêng tôi,
để Chủ tịch, Tổng Giám đốc, Giám đốc dự án, Trưởng bộ phận, Thư ký/Trợ lý và Người xem không nhìn cùng một dashboard.

**Acceptance Criteria:**

AC1:
**Given** các user demo có assignment khác nhau
**When** từng user mở Không gian làm việc cá nhân
**Then** không gian làm việc hiển thị dự án/cơ hội được giao, phê duyệt cần xử lý, rủi ro/điểm chặn, hạn xử lý, quyết định gần đây, cuộc họp và KPI trong phạm vi tương ứng.

AC2:
**Given** Thư ký/Trợ lý chỉ được ủy quyền một phần
**When** mở không gian làm việc
**Then** họ chỉ thấy lịch lãnh đạo, hồ sơ trình, tài liệu họp, việc hỗ trợ, nhắc việc và phê duyệt đang chờ trong phạm vi được ủy quyền.

AC3:
**Given** người dùng là Người xem
**When** mở không gian làm việc
**Then** hành động thay đổi dữ liệu bị ẩn hoặc bị khóa theo pattern UX phân quyền
**And** direct mutation vẫn bị chặn ở server/service.

**Files/Modules:** `src/modules/workspaces`, `src/modules/executive`, `src/modules/dashboard`, `src/modules/meetings`, `src/modules/proposals`.

**Test Expectations:** Unit tests cho tổ hợp không gian làm việc theo vai trò; component/e2e smoke cho các user demo chính.

**Dependencies:** Story 1.4, Story 1.5, Story 2.2, Story 2.3.

## Story 2.7: Xem Chi Tiết, Trạng Thái Không Có Quyền Và QA Responsive Cho Không Gian Làm Việc

**Requirements Covered:** FR-011, FR-012, NFR-003, NFR-004, NFR-011, UX-DR14, UX-DR20, UX-DR22, UX-DR24, UX-DR26, UX-DR27, UX-DR28, UX-DR29, UX-DR30, UX-DR31, UX-DR32.

Là lãnh đạo,
tôi muốn xem chi tiết từ KPI/rủi ro/phê duyệt đến nguồn dữ liệu hoặc bị chặn rõ ràng khi thiếu quyền,
để tôi có thể kiểm chứng số liệu mà không bị lộ dữ liệu ngoài phạm vi.

**Acceptance Criteria:**

AC1:
**Given** mục dashboard có bản ghi liên quan
**When** người dùng mở xem chi tiết
**Then** panel hiển thị tiêu đề, loại, phạm vi, người phụ trách, hạn xử lý, trạng thái, lý do, bản ghi liên quan, hành động theo quyền và dòng thời gian/nhật ký nếu có.

AC2:
**Given** người dùng không có quyền vào bản ghi nguồn
**When** truy cập xem chi tiết hoặc URL trực tiếp
**Then** hệ thống trả unauthorized/403 rõ ràng
**And** không trả payload chứa dữ liệu nhạy cảm.

AC3:
**Given** viewport mobile/tablet/desktop
**When** kiểm tra các không gian làm việc chính
**Then** ngăn bên chuyển thành ngăn trượt trên mobile, bảng chuyển thành danh sách gọn khi cần, thứ tự focus và tên truy cập đạt yêu cầu.

**Files/Modules:** `src/modules/executive/components`, `src/components/shared`, `src/lib/permissions`, `tests/e2e`.

**Test Expectations:** E2E smoke cho xem chi tiết/403; kiểm tra responsive ở 360/390/768/1280; kiểm tra trợ năng cho focus/hộp thoại/ngăn trượt.

**Dependencies:** Story 2.3, Story 2.5, Story 2.6.

## Story 2.8: Cô Lập Không Gian Làm Việc Vai Trò Bên Ngoài Và Guard Trung Tâm Điều Hành

**Requirements Covered:** NFR-001, NFR-002, NFR-003, NFR-004, NFR-007, UX-DR22, UX-DR24, UX-DR26.

Là quản trị điều hành,
tôi muốn vai trò bên ngoài như nhà thầu/tư vấn không vào được Trung Tâm Điều Hành nội bộ,
để dữ liệu lãnh đạo không bị lộ qua thanh điều hướng, route mặc định hoặc URL trực tiếp.

**Acceptance Criteria:**

AC1:
**Given** người dùng có vai trò bên ngoài như `nha_thau` hoặc `tu_van`
**When** thanh điều hướng hoặc bộ chọn không gian làm việc render
**Then** hệ thống không hiển thị `Tổng quan Trục 1`, `Lãnh đạo` hoặc bất kỳ điểm vào Trung Tâm Điều Hành nội bộ nào.

AC2:
**Given** người dùng vai trò bên ngoài truy cập trực tiếp `/command-center`
**When** route guard chạy
**Then** hệ thống từ chối/redirect trước khi fetch DTO nội bộ.

AC3:
**Given** người dùng vai trò bên ngoài có route theo phạm vi hoặc quyền liên quan dự án
**When** điều hướng được phân giải
**Then** grant theo phạm vi không tự mở Trung Tâm Điều Hành nội bộ.

**Files/Modules:** `src/lib/permissions/navigation-policy.ts`, `src/lib/permissions/navigation.ts`, `src/app/command-center/page.tsx`, `tests/unit`, `tests/e2e`.

**Test Expectations:** Unit/e2e tests cho thanh điều hướng, bộ chọn không gian làm việc, direct URL guard-before-fetch và không regress vai trò nội bộ.

**Dependencies:** Story 2.1, Story 2.7.

## Story 2.9: Ma Trận Chính Sách Điều Hướng Theo Vai Trò Và Điều Kiện Vào Trung Tâm Điều Hành

**Requirements Covered:** NFR-001, NFR-002, NFR-003, NFR-004, NFR-007, UX-DR19, UX-DR22, UX-DR24.

Là người quản lý Module 1,
tôi muốn điều hướng theo vai trò và điều kiện vào Trung Tâm Điều Hành được điều khiển bởi một ma trận chính sách tập trung,
để mỗi vai trò chỉ thấy đúng không gian làm việc và truy cập trực tiếp `/command-center` không lộ dashboard nội bộ.

**Acceptance Criteria:**

AC1:
**Given** mỗi vai trò trong `ROLES`
**When** thanh điều hướng render
**Then** vai trò chỉ thấy các entry cấp cao được ma trận chính sách cho phép
**And** tests fail nếu thêm vai trò mới nhưng chưa có dòng chính sách tương ứng.

AC2:
**Given** vai trò là `viewer`
**When** mở `/command-center`
**Then** hệ thống redirect tới `/viewer` hoặc trả 403 trừ khi có grant theo phạm vi rõ ràng
**And** không fetch/render DTO Trung Tâm Điều Hành trước khi guard quyết định.

AC3:
**Given** vai trò `thu_ky_tro_ly` không có ủy quyền/phạm vi đang hiệu lực
**When** mở app hoặc truy cập `/command-center`
**Then** entry mặc định là `/assistant-workspace`, Trung Tâm Điều Hành bị ẩn hoặc bị từ chối.

AC4:
**Given** vai trò chuyên môn như `ky_thuat`, `thiet_ke`, `phap_ly`
**When** đăng nhập hoặc mở app
**Then** không gian mặc định là không gian chuyên môn tương ứng
**And** `/command-center` chỉ mở nếu ma trận chính sách hoặc grant theo phạm vi cho phép.

AC5:
**Given** vai trò lãnh đạo/admin nội bộ
**When** thanh điều hướng và `/command-center` render
**Then** hành vi Trung Tâm Điều Hành hiện có vẫn hoạt động qua cùng một ma trận chính sách.

**Files/Modules:** `src/lib/permissions/navigation-policy.ts`, `src/lib/permissions/navigation.ts`, `src/lib/auth/post-login-routing.ts`, `src/app/command-center/page.tsx`, `tests/unit`, `tests/e2e`.

**Test Expectations:** Matrix tests đầy đủ theo vai trò, guard-before-fetch tests, default route tests và e2e smoke cho viewer/assistant/specialist/external roles.

**Dependencies:** Story 2.1, Story 2.8.

## Story 2.10: Thiết Lập Chính Sách Điều Hướng Chủ Tịch Và Super Admin

**Requirements Covered:** FR-091, FR-092, FR-096, NFR-001, NFR-003, NFR-004, NFR-005, NFR-006, UX-DR22, UX-DR24.

Là người quản lý RBAC và điều hướng Module 1,
tôi muốn chính sách điều hướng Chủ tịch/Super Admin được kiểm tra tập trung,
để Chủ tịch chỉ thấy bề mặt lãnh đạo, Super Admin thấy thêm BO/system, và truy cập BO route trực tiếp bị từ chối/ghi nhật ký đúng trước khi fetch dữ liệu quản trị.

**Acceptance Criteria:**

AC1:
**Given** vai trò người dùng = `chu_tich`
**When** thanh điều hướng render
**Then** người dùng thấy Trung Tâm Điều Hành / bề mặt lãnh đạo như `/command-center` và `/command-center?view=executive-dashboard`
**And** không thấy Cài Đặt BO, Người dùng, Admin hoặc Thiết Lập Vai Trò/Quyền.

AC2:
**Given** vai trò người dùng = `super_admin`
**When** thanh điều hướng render
**Then** người dùng thấy toàn bộ bề mặt lãnh đạo của `chu_tich` cộng thêm Cài Đặt BO, Người dùng và cấu hình Admin/system.

AC3:
**Given** vai trò người dùng = `chu_tich`
**When** truy cập trực tiếp `/admin`, `/settings`, `/users`
**Then** hệ thống trả 403 hoặc redirect trước khi fetch dữ liệu admin
**And** không render nhãn/nội dung chỉ dành cho BO.

AC4:
**Given** vai trò người dùng = `super_admin`
**When** truy cập `/admin`, `/settings`, `/users`
**Then** quyền truy cập được cho phép và sự kiện nhật ký được ghi với payload an toàn, gọn.

AC5:
**Given** điều hướng/thanh bên, bộ chọn không gian làm việc, chính sách route dashboard và direct route guard
**When** chính sách vai trò thay đổi trong tương lai
**Then** khả năng hiển thị BO và điều kiện vào route vẫn đi qua một helper/lớp chính sách tập trung.

**Files/Modules:** `src/lib/permissions/navigation-policy.ts`, `src/lib/permissions/navigation.ts`, `src/lib/permissions/guard.ts`, `src/app/(dashboard)/layout.tsx`, `tests/unit`, `tests/e2e`.

**Test Expectations:** Unit/page/e2e tests cho chính sách điều hướng chính xác của Chủ tịch/Admin, direct BO route guard-before-fetch, nhật ký truy cập thành công cho `super_admin` và không regress Story 2.8/2.9.

**Dependencies:** Story 1.6, Story 2.9.

## Story 2.11: Căn Chỉnh Dashboard Tổng Quan Theo Yêu Cầu 1.1

**Requirements Covered:** FR-003, FR-006, FR-010, FR-011, NFR-001, NFR-002, NFR-011.

Là lãnh đạo,
tôi muốn Dashboard Tổng Quan hiển thị đúng tổng dự án/cơ hội, dòng tiền/chi phí tổng quan theo quyền và chỉ mở chi tiết/chuyển trung tâm chuyên trách khi cần,
để dashboard vẫn là màn tổng hợp điều hành, không trở thành nơi thao tác chuyên sâu.

**Acceptance Criteria:**

AC1:
**Given** Dashboard Tổng Quan render từ `ExecutiveDashboardData`
**When** người dùng mở dashboard
**Then** UI hiển thị tổng dự án và tổng cơ hội/request/proposal trong phạm vi bằng nhãn tiếng Việt rõ ràng
**And** metric này lấy từ DTO đã lọc scope/permission, không hardcode.

AC2:
**Given** người dùng có quyền xem tài chính nhạy cảm
**When** dashboard render
**Then** UI hiển thị dòng tiền/chi phí tổng quan ở mức executive summary, tối thiểu gồm tổng giá trị được phép xem, số bản ghi tài chính được xem và nhãn phân biệt dữ liệu chi phí/dòng tiền nếu DTO có nguồn
**And** khi không có quyền, UI hiển thị trạng thái không có quyền và không render số tiền/cashflow/budget thật.

AC3:
**Given** dashboard có risk map/risk summary
**When** người dùng có quyền risk mutation
**Then** dashboard không render form tạo/cập nhật/override/đóng risk trực tiếp
**And** chỉ hiển thị liên kết hoặc hành động theo quyền để mở Trung Tâm Rủi Ro / bản ghi rủi ro nếu có route an toàn.

AC4:
**Given** dashboard có KPI/risk/approval/deadline/decision item
**When** người dùng chọn item
**Then** dashboard mở drill-down/read-only metadata hoặc link sang record/center chuyên trách theo quyền
**And** không sở hữu mutation của Approval/Risk/Decision/Meeting center.

AC5:
**Given** operations dashboard có task vi mô, dữ liệu kỹ thuật hoặc bản vẽ chi tiết
**When** Dashboard Tổng Quan render
**Then** những dữ liệu này không xuất hiện mặc định trong Dashboard Tổng Quan.

**Files/Modules:** `src/modules/dashboard/components`, `src/modules/dashboard/services`, `src/modules/dashboard/types`, `src/modules/command-center/components`, `tests/unit`, `tests/e2e`.

**Test Expectations:** Unit/component tests cho hiển thị dự án/cơ hội, tài chính permission-safe, không render risk mutation form trong Dashboard Tổng Quan, không leak task vi mô; giữ focused regression `executive-dashboard-service.test.ts` và `command-center-dashboard.test.tsx`; chạy e2e nếu thay đổi route/responsive.

**Dependencies:** Story 2.3, Story 5.3, Story 5.4, Story 5.5.
