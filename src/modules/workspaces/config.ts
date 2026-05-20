import type { Role } from "@/constants/roles";
import type { PermissionAction, PermissionUser } from "@/lib/permissions/can";

export type WorkspaceRoute =
  | "/admin"
  | "/executive"
  | "/project-workbench"
  | "/team-workbench"
  | "/legal-workspace"
  | "/finance-workspace"
  | "/finance-management-workspace"
  | "/contract-workspace"
  | "/investment-workspace"
  | "/hr-workspace"
  | "/quality-workspace"
  | "/safety-workspace"
  | "/audit-workspace"
  | "/design-workspace"
  | "/technical-workspace"
  | "/construction-workspace"
  | "/assistant-workspace"
  | "/contractor"
  | "/consultant"
  | "/viewer";

export type WorkspaceDefinition = {
  route: WorkspaceRoute;
  title: string;
  description: string;
  roles: Role[];
  permissions: PermissionAction[];
  futureNote?: string;
};

export const WORKSPACE_DEFINITIONS: Record<WorkspaceRoute, WorkspaceDefinition> = {
  "/admin": {
    route: "/admin",
    title: "Không gian quản trị",
    description: "Người dùng, vai trò, thiết lập hệ thống và nhật ký kiểm soát.",
    roles: ["super_admin", "admin", "kiem_soat_noi_bo"],
    permissions: ["user.view", "settings.manage", "audit.view"]
  },
  "/executive": {
    route: "/executive",
    title: "Điều hành danh mục",
    description: "Sức khỏe danh mục, việc quá hạn, pháp lý vướng và hồ sơ cần chú ý.",
    roles: ["tong_giam_doc", "pho_tong_giam_doc"],
    permissions: ["project.view", "task.view", "document.view", "legal.view", "finance.view"]
  },
  "/project-workbench": {
    route: "/project-workbench",
    title: "Bàn điều hành dự án",
    description: "Theo dõi dự án được giao, công việc, hồ sơ và điểm nghẽn pháp lý.",
    roles: ["giam_doc_du_an", "quan_ly_du_an", "mua_hang"],
    permissions: ["project.view", "task.view", "document.view", "legal.view"]
  },
  "/team-workbench": {
    route: "/team-workbench",
    title: "Bảng điều phối tổ đội",
    description: "Công việc tổ đội, deadline gần nhất và hồ sơ cần nộp.",
    roles: ["to_truong"],
    permissions: ["task.view", "task.update_own", "document.view"]
  },
  "/legal-workspace": {
    route: "/legal-workspace",
    title: "Không gian pháp lý",
    description: "Checklist pháp lý, bước chờ cơ quan, bước bị vướng và hồ sơ pháp lý.",
    roles: ["phap_ly"],
    permissions: ["legal.view", "legal.update", "document.view", "task.view"]
  },
  "/finance-workspace": {
    route: "/finance-workspace",
    title: "Không gian tài chính",
    description: "Màn hình sẵn sàng cho ngân sách, thanh toán, hợp đồng và việc tài chính.",
    roles: ["ke_toan"],
    permissions: ["finance.view", "document.view", "task.view"],
    futureNote: "Module tài chính đầy đủ sẽ được triển khai sau MVP; hiện tại hiển thị việc và hồ sơ liên quan."
  },
  "/finance-management-workspace": {
    route: "/finance-management-workspace",
    title: "Không gian quản lý tài chính",
    description: "Dòng tiền, ngân sách, phê duyệt tài chính và hiệu quả đầu tư.",
    roles: ["quan_ly_tai_chinh"],
    permissions: ["finance.view", "finance.approve", "proposal.approve", "payment.approve"],
    futureNote: "Module tài chính sâu sẽ mở rộng sau Proposal/Approval foundation."
  },
  "/contract-workspace": {
    route: "/contract-workspace",
    title: "Không gian quản lý hợp đồng",
    description: "Hợp đồng, phụ lục, nghĩa vụ thương mại và đề xuất liên quan.",
    roles: ["quan_ly_hop_dong"],
    permissions: ["contract.view", "contract.update", "proposal.review", "document.view"],
    futureNote: "Module hợp đồng đầy đủ sẽ được triển khai sau nền proposal."
  },
  "/investment-workspace": {
    route: "/investment-workspace",
    title: "Không gian đầu tư phát triển",
    description: "Cơ hội đầu tư, quỹ đất, phân tích sơ bộ và đề xuất đầu tư.",
    roles: ["dau_tu_phat_trien"],
    permissions: ["investment.view", "investment.update", "proposal.create", "document.view"],
    futureNote: "Opportunity pipeline sẽ được triển khai sau Proposal/Approval foundation."
  },
  "/hr-workspace": {
    route: "/hr-workspace",
    title: "Không gian hành chính nhân sự",
    description: "Yêu cầu nhân sự, hành chính nội bộ, tuyển dụng/KPI và đề xuất HR.",
    roles: ["hanh_chinh_nhan_su"],
    permissions: ["hr.view", "hr.update", "proposal.review", "document.view"],
    futureNote: "Module HR/admin sẽ mở rộng sau nền proposal."
  },
  "/quality-workspace": {
    route: "/quality-workspace",
    title: "Không gian QA/QC chất lượng",
    description: "Checklist chất lượng, kiểm tra, NCR và cổng nghiệm thu chất lượng.",
    roles: ["qa_qc_chat_luong"],
    permissions: ["qa.view", "qa.update", "construction.view", "proposal.review"],
    futureNote: "Quality checks sâu sẽ được triển khai trong phase QA/QC."
  },
  "/safety-workspace": {
    route: "/safety-workspace",
    title: "Không gian an toàn lao động",
    description: "Quan sát an toàn, sự cố, hành động khắc phục và tuân thủ công trường.",
    roles: ["an_toan_lao_dong"],
    permissions: ["safety.view", "safety.update", "construction.view", "proposal.review"],
    futureNote: "Safety module sâu sẽ được triển khai trong phase Safety."
  },
  "/audit-workspace": {
    route: "/audit-workspace",
    title: "Không gian kiểm toán nội bộ",
    description: "Rà soát tài chính, quy trình, compliance và ngoại lệ kiểm soát.",
    roles: ["kiem_toan_noi_bo", "kiem_soat_noi_bo"],
    permissions: ["audit.view", "internal_audit.view", "compliance.view", "proposal.review"]
  },
  "/design-workspace": {
    route: "/design-workspace",
    title: "Không gian thiết kế",
    description: "Bản vẽ, hồ sơ thiết kế, việc review và các điểm cần cập nhật.",
    roles: ["thiet_ke"],
    permissions: ["design.view", "document.view", "task.view"],
    futureNote: "Module thiết kế đầy đủ sẽ mở rộng từ hồ sơ, task và quy trình review hiện có."
  },
  "/technical-workspace": {
    route: "/technical-workspace",
    title: "Không gian kỹ thuật",
    description: "Việc kỹ thuật, phối hợp thiết kế/thi công và hồ sơ cần rà soát.",
    roles: ["ky_thuat"],
    permissions: ["task.view", "document.view", "design.view", "construction.view"]
  },
  "/construction-workspace": {
    route: "/construction-workspace",
    title: "Không gian thi công",
    description: "Việc hiện trường, nhật ký, chất lượng và nghiệm thu tương lai.",
    roles: ["thi_cong"],
    permissions: ["construction.view", "task.view", "document.view"],
    futureNote: "Nhật ký công trường và nghiệm thu là module tương lai; màn hình này dùng dữ liệu task/document hiện có."
  },
  "/assistant-workspace": {
    route: "/assistant-workspace",
    title: "Không gian trợ lý",
    description: "Hàng chờ nhập liệu, hồ sơ thiếu, meeting note và báo cáo nháp.",
    roles: ["thu_ky_tro_ly"],
    permissions: ["task.view", "document.view", "meeting.view", "project.view"]
  },
  "/contractor": {
    route: "/contractor",
    title: "Cổng nhà thầu",
    description: "Chỉ hiển thị gói việc, task và hồ sơ được giao cho nhà thầu hiện tại.",
    roles: ["nha_thau"],
    permissions: ["task.view", "task.update_own", "document.view"]
  },
  "/consultant": {
    route: "/consultant",
    title: "Cổng tư vấn",
    description: "Hồ sơ, review và task được giao cho tư vấn.",
    roles: ["tu_van"],
    permissions: ["task.view", "task.update_own", "document.view", "design.review"]
  },
  "/viewer": {
    route: "/viewer",
    title: "Dashboard chỉ xem",
    description: "Tổng quan đọc-only theo quyền được cấp, không có thao tác chỉnh sửa.",
    roles: ["viewer"],
    permissions: ["project.view", "task.view", "document.view", "legal.view"]
  }
};

export function canAccessWorkspaceRoute(user: PermissionUser, route: WorkspaceRoute) {
  const definition = WORKSPACE_DEFINITIONS[route];

  return user.role === "super_admin" || definition.roles.includes(user.role);
}
