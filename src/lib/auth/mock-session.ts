import { ROLE_DEFAULT_SCREENS, ROLES, type Role } from "@/constants/roles";
import { getRolePermissions } from "@/lib/permissions/can";

export type MockCurrentUser = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
};

const MOCK_ROLE_USERS: Record<Role, Omit<MockCurrentUser, "role">> = {
  chu_tich: {
    id: "chairman-01",
    fullName: "Nguyen Thanh Binh",
    email: "chairman@greennest.vn",
  },
  super_admin: {
    id: "super-admin-01",
    fullName: "Tran Quan Tri He Thong",
    email: "super.admin@greennest.vn",
  },
  admin: {
    id: "mock-founder",
    fullName: "Nguyễn Minh Anh",
    email: "admin@greennest.vn",
  },
  tong_giam_doc: {
    id: "ceo-01",
    fullName: "Đặng Quốc Bảo",
    email: "ceo@greennest.vn",
  },
  pho_tong_giam_doc: {
    id: "executive-01",
    fullName: "Trần Hoàng Nam",
    email: "pho.tgd@greennest.vn",
  },
  giam_doc_du_an: {
    id: "project-director-01",
    fullName: "Hoàng Gia Khánh",
    email: "director@greennest.vn",
  },
  quan_ly_du_an: {
    id: "pm-01",
    fullName: "Ngô Thanh Tâm",
    email: "pm@greennest.vn",
  },
  to_truong: {
    id: "department-head-01",
    fullName: "Lê Quang Huy",
    email: "department.head@greennest.vn",
  },
  phap_ly: {
    id: "legal-manager",
    fullName: "Phạm Thu Hà",
    email: "legal@greennest.vn",
  },
  ke_toan: {
    id: "accountant",
    fullName: "Vũ Lan Chi",
    email: "accounting@greennest.vn",
  },
  thiet_ke: {
    id: "designer",
    fullName: "Đỗ Hải Yến",
    email: "design@greennest.vn",
  },
  ky_thuat: {
    id: "technical-01",
    fullName: "Bùi Minh Khoa",
    email: "technical@greennest.vn",
  },
  thi_cong: {
    id: "construction-01",
    fullName: "Phan Đức Long",
    email: "construction@greennest.vn",
  },
  mua_hang: {
    id: "procurement-01",
    fullName: "Mai Hồng Phúc",
    email: "procurement@greennest.vn",
  },
  dau_tu_phat_trien: {
    id: "investment-01",
    fullName: "Lâm Đầu Tư",
    email: "investment@greennest.vn",
  },
  quan_ly_tai_chinh: {
    id: "finance-manager-01",
    fullName: "Đinh Tài Chính",
    email: "finance.manager@greennest.vn",
  },
  hanh_chinh_nhan_su: {
    id: "hr-admin-01",
    fullName: "Nguyễn Nhân Sự",
    email: "hr@greennest.vn",
  },
  qa_qc_chat_luong: {
    id: "qa-qc-01",
    fullName: "Trần Chất Lượng",
    email: "qa.qc@greennest.vn",
  },
  an_toan_lao_dong: {
    id: "safety-01",
    fullName: "Phạm An Toàn",
    email: "safety@greennest.vn",
  },
  kiem_toan_noi_bo: {
    id: "internal-audit-01",
    fullName: "Võ Kiểm Toán",
    email: "internal.audit@greennest.vn",
  },
  quan_ly_hop_dong: {
    id: "contract-manager-01",
    fullName: "Hồ Hợp Đồng",
    email: "contract.manager@greennest.vn",
  },
  thu_ky_tro_ly: {
    id: "assistant-01",
    fullName: "Trịnh Mai Anh",
    email: "assistant@greennest.vn",
  },
  kiem_soat_noi_bo: {
    id: "internal-control-01",
    fullName: "Tạ Minh Châu",
    email: "audit@greennest.vn",
  },
  nha_thau: {
    id: "contractor-01",
    fullName: "Nguyễn Văn Nhà Thầu",
    email: "contractor@greennest.vn",
  },
  tu_van: {
    id: "consultant-01",
    fullName: "Lê Minh Tư Vấn",
    email: "consultant@greennest.vn",
  },
  viewer: {
    id: "viewer-01",
    fullName: "Người xem demo",
    email: "viewer@greennest.vn",
  },
  pending: {
    id: "pending-user",
    fullName: "Người dùng chờ cấp quyền",
    email: "pending@greennest.vn",
  },
};

function isRole(value: string | undefined): value is Role {
  return Boolean(value && value in ROLES);
}

export function resolveMockRole(value?: string): Role {
  return isRole(value) ? value : "admin";
}

export function getConfiguredMockRole(): Role {
  return resolveMockRole(
    process.env.MOCK_CURRENT_ROLE ?? process.env.NEXT_PUBLIC_MOCK_ROLE,
  );
}

export function getMockCurrentUser(
  role: Role = getConfiguredMockRole(),
): MockCurrentUser {
  return {
    ...MOCK_ROLE_USERS[role],
    role,
  };
}

export function getMockResolvedSession(role: Role = getConfiguredMockRole()) {
  const user = getMockCurrentUser(role);

  return {
    user,
    permissions: getRolePermissions(user.role),
    defaultScreen: ROLE_DEFAULT_SCREENS[user.role],
  };
}
