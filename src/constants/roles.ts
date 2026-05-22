export const ROLES = {
  super_admin: {
    label: "Super Admin",
    description: "Chủ hệ thống kỹ thuật và quản trị khẩn cấp",
  },
  admin: {
    label: "Admin",
    description: "Cấu hình hệ thống, người dùng, vai trò và dữ liệu nền",
  },
  tong_giam_doc: {
    label: "Tổng giám đốc",
    description: "Điều hành danh mục dự án và phê duyệt cấp công ty",
  },
  pho_tong_giam_doc: {
    label: "Phó tổng giám đốc",
    description: "Giám sát các miền nghiệp vụ hoặc dự án được giao",
  },
  giam_doc_du_an: {
    label: "Giám đốc dự án",
    description: "Chịu trách nhiệm toàn diện việc triển khai dự án",
  },
  quan_ly_du_an: {
    label: "Quản lý dự án",
    description: "Điều phối công việc hằng ngày của dự án",
  },
  to_truong: {
    label: "Tổ trưởng",
    description: "Dẫn dắt nhóm hoặc gói công việc thực thi",
  },
  phap_ly: {
    label: "Pháp lý",
    description: "Quản lý checklist, hồ sơ và phản hồi cơ quan pháp lý",
  },
  ke_toan: {
    label: "Kế toán",
    description: "Quản lý tài chính, thanh toán, chi phí và hợp đồng",
  },
  thiet_ke: {
    label: "Thiết kế",
    description: "Quản lý gói thiết kế, bản vẽ, review và thay đổi thiết kế",
  },
  ky_thuat: {
    label: "Kỹ thuật",
    description: "Điều phối kỹ thuật, chất lượng và hồ sơ kỹ thuật",
  },
  thi_cong: {
    label: "Thi công",
    description: "Quản lý hiện trường, nhật ký, chất lượng và nghiệm thu",
  },
  mua_hang: {
    label: "Mua hàng",
    description: "Điều phối mua sắm, vật tư và nhà cung cấp",
  },
  dau_tu_phat_trien: {
    label: "Đầu tư phát triển",
    description: "Tìm kiếm, phân tích cơ hội đầu tư và quỹ đất mới",
  },
  quan_ly_tai_chinh: {
    label: "Quản lý tài chính",
    description: "Điều phối dòng tiền, ngân sách và hiệu quả đầu tư",
  },
  hanh_chinh_nhan_su: {
    label: "Hành chính nhân sự",
    description: "Quản lý nhân sự, hành chính, tuyển dụng và KPI",
  },
  qa_qc_chat_luong: {
    label: "QA/QC chất lượng",
    description: "Kiểm soát chất lượng, checklist và nghiệm thu chất lượng",
  },
  an_toan_lao_dong: {
    label: "An toàn lao động",
    description: "Giám sát an toàn công trường, sự cố và hành động khắc phục",
  },
  kiem_toan_noi_bo: {
    label: "Kiểm toán nội bộ",
    description: "Rà soát tài chính, tuân thủ và ngoại lệ kiểm soát",
  },
  quan_ly_hop_dong: {
    label: "Quản lý hợp đồng",
    description: "Quản lý hợp đồng, phụ lục và nghĩa vụ thương mại",
  },
  thu_ky_tro_ly: {
    label: "Thư ký/Trợ lý",
    description: "Nhập liệu, họp, hồ sơ và hỗ trợ báo cáo",
  },
  kiem_soat_noi_bo: {
    label: "Kiểm soát nội bộ",
    description: "Kiểm toán, tuân thủ và rà soát dữ liệu",
  },
  nha_thau: {
    label: "Nhà thầu",
    description: "Truy cập giới hạn cho gói việc hoặc dự án được giao",
  },
  tu_van: {
    label: "Tư vấn",
    description: "Truy cập giới hạn cho hồ sơ và phần review được giao",
  },
  viewer: { label: "Chỉ xem", description: "Chỉ đọc dữ liệu được cấp quyền" },
  pending: {
    label: "Chờ cấp quyền",
    description:
      "Đã đăng nhập nhưng chưa được Admin cấp vùng làm việc hoặc quyền truy cập",
  },
} as const;

export type Role = keyof typeof ROLES;

export const BASIC_ROLE_GROUPS = {
  SUPER_ADMIN: ["super_admin"],
  COMPANY_ADMIN: ["admin"],
  LEADER: ["tong_giam_doc", "pho_tong_giam_doc"],
  LEGAL: ["phap_ly"],
  DESIGN: ["thiet_ke", "ky_thuat"],
  CONSTRUCTION: ["thi_cong", "qa_qc_chat_luong", "an_toan_lao_dong"],
  FINANCE: ["ke_toan", "quan_ly_tai_chinh"],
  VIEWER: ["viewer"],
} as const satisfies Record<string, readonly Role[]>;

export const ROLE_DEFAULT_SCREENS: Record<
  Role,
  { label: string; href: string }
> = {
  super_admin: { label: "Không gian quản trị hệ thống", href: "/admin" },
  admin: { label: "Không gian quản trị hệ thống", href: "/admin" },
  tong_giam_doc: { label: "Tổng quan điều hành", href: "/command-center" },
  pho_tong_giam_doc: {
    label: "Ban lãnh đạo - danh mục được giao",
    href: "/command-center?view=executive-dashboard",
  },
  giam_doc_du_an: { label: "Bàn điều hành dự án", href: "/project-workbench" },
  quan_ly_du_an: {
    label: "Bàn làm việc quản lý dự án",
    href: "/project-workbench",
  },
  to_truong: { label: "Bảng điều phối tổ đội", href: "/team-workbench" },
  phap_ly: { label: "Không gian pháp lý", href: "/legal-workspace" },
  ke_toan: { label: "Không gian tài chính", href: "/finance-workspace" },
  thiet_ke: { label: "Không gian thiết kế", href: "/design-workspace" },
  ky_thuat: { label: "Không gian kỹ thuật", href: "/technical-workspace" },
  thi_cong: { label: "Không gian thi công", href: "/construction-workspace" },
  mua_hang: { label: "Bàn làm việc mua hàng", href: "/project-workbench" },
  dau_tu_phat_trien: {
    label: "Không gian đầu tư phát triển",
    href: "/investment-workspace",
  },
  quan_ly_tai_chinh: {
    label: "Không gian quản lý tài chính",
    href: "/finance-management-workspace",
  },
  hanh_chinh_nhan_su: {
    label: "Không gian hành chính nhân sự",
    href: "/hr-workspace",
  },
  qa_qc_chat_luong: {
    label: "Không gian QA/QC chất lượng",
    href: "/quality-workspace",
  },
  an_toan_lao_dong: {
    label: "Không gian an toàn lao động",
    href: "/safety-workspace",
  },
  kiem_toan_noi_bo: {
    label: "Không gian kiểm toán nội bộ",
    href: "/audit-workspace",
  },
  quan_ly_hop_dong: {
    label: "Không gian quản lý hợp đồng",
    href: "/contract-workspace",
  },
  thu_ky_tro_ly: { label: "Không gian trợ lý", href: "/assistant-workspace" },
  kiem_soat_noi_bo: { label: "Không gian kiểm soát", href: "/admin" },
  nha_thau: { label: "Cổng nhà thầu", href: "/contractor" },
  tu_van: { label: "Cổng tư vấn", href: "/consultant" },
  viewer: { label: "Dashboard chỉ xem", href: "/viewer" },
  pending: { label: "Chờ cấp quyền", href: "/pending-access" },
};
