import type { Role } from "@/constants/roles";

import { can, type PermissionAction, type PermissionUser } from "./can";

export type NavigationIconKey =
  | "audit"
  | "briefcase"
  | "building"
  | "clipboard"
  | "construction"
  | "dashboard"
  | "file"
  | "gavel"
  | "shield"
  | "settings"
  | "sparkles"
  | "users"
  | "video";

export type NavigationItem = {
  href: string;
  label: string;
  icon: NavigationIconKey;
  permission?: PermissionAction;
  roles?: Role[];
};

const externalRoles: Role[] = ["nha_thau", "tu_van"];

export const NAV_ITEMS: readonly NavigationItem[] = [
  { href: "/admin", label: "Quan tri", icon: "users", roles: ["super_admin", "admin"] },
  { href: "/audit-workspace", label: "Kiem toan", icon: "shield", roles: ["kiem_soat_noi_bo", "kiem_toan_noi_bo"] },
  { href: "/executive", label: "Dieu hanh", icon: "dashboard", roles: ["tong_giam_doc", "pho_tong_giam_doc"] },
  {
    href: "/project-workbench",
    label: "Ban du an",
    icon: "briefcase",
    roles: ["giam_doc_du_an", "quan_ly_du_an", "mua_hang"]
  },
  { href: "/team-workbench", label: "To doi", icon: "clipboard", roles: ["to_truong"] },
  { href: "/legal-workspace", label: "Phap ly", icon: "gavel", roles: ["phap_ly"] },
  { href: "/finance-workspace", label: "Tai chinh", icon: "briefcase", roles: ["ke_toan"] },
  { href: "/finance-management-workspace", label: "QL tai chinh", icon: "briefcase", roles: ["quan_ly_tai_chinh"] },
  { href: "/contract-workspace", label: "Hop dong", icon: "file", roles: ["quan_ly_hop_dong"] },
  { href: "/investment-workspace", label: "Dau tu", icon: "building", roles: ["dau_tu_phat_trien"] },
  { href: "/hr-workspace", label: "Nhan su", icon: "users", roles: ["hanh_chinh_nhan_su"] },
  { href: "/quality-workspace", label: "QA/QC", icon: "shield", roles: ["qa_qc_chat_luong"] },
  { href: "/safety-workspace", label: "An toan", icon: "construction", roles: ["an_toan_lao_dong"] },
  { href: "/design-workspace", label: "Thiet ke", icon: "file", roles: ["thiet_ke"] },
  { href: "/technical-workspace", label: "Ky thuat", icon: "settings", roles: ["ky_thuat"] },
  { href: "/construction-workspace", label: "Thi cong", icon: "construction", roles: ["thi_cong"] },
  { href: "/assistant-workspace", label: "Tro ly", icon: "sparkles", roles: ["thu_ky_tro_ly"] },
  { href: "/contractor", label: "Nha thau", icon: "construction", roles: ["nha_thau"] },
  { href: "/consultant", label: "Tu van", icon: "file", roles: ["tu_van"] },
  { href: "/viewer", label: "Chi xem", icon: "dashboard", roles: ["viewer"] },
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", permission: "project.view" },
  { href: "/projects", label: "Du an", icon: "building", permission: "project.view" },
  { href: "/tasks", label: "Cong viec", icon: "clipboard", permission: "task.view" },
  { href: "/documents", label: "Ho so", icon: "file", permission: "document.view" },
  { href: "/legal", label: "Phap ly", icon: "gavel", permission: "legal.view" },
  { href: "/meetings", label: "Cuoc hop", icon: "video", permission: "meeting.view" },
  { href: "/knowledge", label: "Tri thuc", icon: "sparkles", permission: "knowledge.view" },
  { href: "/ai", label: "AI Gateway", icon: "sparkles", permission: "ai.ask" },
  { href: "/reports", label: "Bao cao", icon: "file", permission: "report.view" },
  { href: "/proposals", label: "De xuat", icon: "clipboard", permission: "proposal.view" },
  { href: "/users", label: "Nguoi dung", icon: "users", permission: "user.view" },
  { href: "/settings", label: "Cai dat", icon: "settings", permission: "settings.manage" }
];

export function getPermittedNavItems(user: PermissionUser) {
  return NAV_ITEMS.filter((item) => {
    if (externalRoles.includes(user.role)) {
      return item.roles?.includes(user.role) ?? false;
    }

    if (item.roles?.includes(user.role)) {
      return true;
    }

    if (item.permission) {
      return can(user, item.permission);
    }

    return false;
  });
}
