import { can, type PermissionAction, type PermissionUser } from "./can";
import {
  canAccessWorkspaceRoute,
  WORKSPACE_DEFINITIONS,
  type WorkspaceRoute,
} from "@/modules/workspaces/config";

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
  common?: boolean;
  permission?: PermissionAction;
  permissions?: PermissionAction[];
  roles?: string[];
};

export type NavigationAccessContext = {
  scopedPermissions?: readonly PermissionAction[];
  scopedWorkspaceRoutes?: readonly string[];
};

export type ShellOption = {
  href: string;
  id?: string;
  label: string;
};

export type ShellContext = {
  currentScopeLabel: string;
  currentWorkspaceLabel: string;
  scopeOptions: ShellOption[];
  workspaceOptions: ShellOption[];
};

const externalRoles: string[] = ["nha_thau", "tu_van"];
const workspaceRoutes = new Set(
  Object.keys(WORKSPACE_DEFINITIONS),
) as Set<WorkspaceRoute>;

function workspaceRouteForNavItem(item: NavigationItem) {
  if (item.href === "/command-center?view=executive-dashboard") {
    return "/executive" satisfies WorkspaceRoute;
  }

  const path = item.href.split("?")[0] as WorkspaceRoute;

  return workspaceRoutes.has(path) ? path : undefined;
}

export const NAV_ITEMS: readonly NavigationItem[] = [
  {
    href: "/admin",
    label: "Quan tri Chu tich",
    icon: "users",
    roles: ["super_admin", "admin"],
    permissions: ["settings.manage", "delegation.manage", "user.view", "audit.view"],
  },
  {
    href: "/command-center",
    label: "Tong quan Truc 1",
    icon: "dashboard",
    common: true,
  },
  {
    href: "/command-center?view=executive-dashboard",
    label: "Lanh dao",
    icon: "briefcase",
    permissions: [
      "project.view",
      "task.view",
      "document.view",
      "legal.view",
      "finance.view",
      "meeting.view",
      "proposal.view",
      "proposal.approve",
      "decision.approve",
    ],
    roles: [
      "super_admin",
      "admin",
      "tong_giam_doc",
      "pho_tong_giam_doc",
      "giam_doc_du_an",
      "dau_tu_phat_trien",
      "quan_ly_tai_chinh",
      "quan_ly_hop_dong",
      "phap_ly",
      "thiet_ke",
      "ky_thuat",
      "thi_cong",
      "qa_qc_chat_luong",
      "an_toan_lao_dong",
    ],
  },
  {
    href: "/audit-workspace",
    label: "Kiem toan",
    icon: "shield",
    roles: ["kiem_soat_noi_bo", "kiem_toan_noi_bo"],
    permissions: ["audit.view", "internal_audit.view", "compliance.view"],
  },
  {
    href: "/axis-1",
    label: "Trục 1 - Dự án",
    icon: "building",
    roles: [],
    permission: "axis1.view",
  },
  {
    href: "/project-workbench",
    label: "Ban du an",
    icon: "briefcase",
    roles: ["giam_doc_du_an", "quan_ly_du_an", "mua_hang"],
    permissions: ["project.view", "task.view", "document.view", "legal.view"],
  },
  {
    href: "/team-workbench",
    label: "To doi",
    icon: "clipboard",
    roles: ["to_truong"],
  },
  {
    href: "/legal-workspace",
    label: "Phap ly",
    icon: "gavel",
    roles: ["phap_ly"],
    permission: "legal.view",
  },
  {
    href: "/finance-workspace",
    label: "Tai chinh",
    icon: "briefcase",
    roles: ["ke_toan"],
    permission: "finance.view",
  },
  {
    href: "/finance-management-workspace",
    label: "QL tai chinh",
    icon: "briefcase",
    roles: ["quan_ly_tai_chinh"],
    permissions: ["finance.view", "finance.approve"],
  },
  {
    href: "/contract-workspace",
    label: "Hop dong",
    icon: "file",
    roles: ["quan_ly_hop_dong"],
    permission: "contract.view",
  },
  {
    href: "/investment-workspace",
    label: "Dau tu",
    icon: "building",
    roles: ["dau_tu_phat_trien"],
    permission: "investment.view",
  },
  {
    href: "/hr-workspace",
    label: "Nhan su",
    icon: "users",
    roles: ["hanh_chinh_nhan_su"],
    permission: "hr.view",
  },
  {
    href: "/quality-workspace",
    label: "QA/QC",
    icon: "shield",
    roles: ["qa_qc_chat_luong"],
    permission: "qa.view",
  },
  {
    href: "/safety-workspace",
    label: "An toan",
    icon: "construction",
    roles: ["an_toan_lao_dong"],
    permission: "safety.view",
  },
  {
    href: "/design-workspace",
    label: "Thiet ke",
    icon: "file",
    roles: ["thiet_ke"],
    permission: "design.view",
  },
  {
    href: "/technical-workspace",
    label: "Ky thuat",
    icon: "settings",
    roles: ["ky_thuat"],
    permissions: ["design.view", "construction.view"],
  },
  {
    href: "/construction-workspace",
    label: "Thi cong",
    icon: "construction",
    roles: ["thi_cong"],
    permission: "construction.view",
  },
  {
    href: "/assistant-workspace",
    label: "Tro ly",
    icon: "sparkles",
    roles: ["thu_ky_tro_ly"],
    permissions: ["task.view", "meeting.view", "document.view"],
  },
  {
    href: "/contractor",
    label: "Nha thau",
    icon: "construction",
    roles: ["nha_thau"],
  },
  { href: "/consultant", label: "Tu van", icon: "file", roles: ["tu_van"] },
  { href: "/viewer", label: "Chi xem", icon: "dashboard", roles: ["viewer"] },
  {
    href: "/dashboard",
    label: "Vùng chung",
    icon: "dashboard",
    roles: [],
  },
  {
    href: "/projects",
    label: "Du an",
    icon: "building",
    permission: "project.view",
  },
  {
    href: "/tasks",
    label: "Cong viec",
    icon: "clipboard",
    permission: "task.view",
  },
  {
    href: "/documents",
    label: "Ho so",
    icon: "file",
    permission: "document.view",
  },
  { href: "/legal", label: "Phap ly", icon: "gavel", permission: "legal.view" },
  {
    href: "/meetings",
    label: "Cuoc hop",
    icon: "video",
    permission: "meeting.view",
  },
  {
    href: "/knowledge",
    label: "Tri thuc",
    icon: "sparkles",
    permission: "knowledge.view",
  },
  { href: "/ai", label: "AI Gateway", icon: "sparkles", permission: "ai.ask" },
  {
    href: "/reports",
    label: "Bao cao",
    icon: "file",
    permission: "report.view",
  },
  {
    href: "/proposals",
    label: "De xuat",
    icon: "clipboard",
    permission: "proposal.view",
  },
  {
    href: "/users",
    label: "Nguoi dung",
    icon: "users",
    permission: "user.view",
  },
  {
    href: "/settings",
    label: "BO Settings",
    icon: "settings",
    permissions: ["settings.manage", "delegation.manage"],
  },
];

function hasScopedPermission(
  context: NavigationAccessContext | undefined,
  permission: PermissionAction,
) {
  return context?.scopedPermissions?.includes(permission) ?? false;
}

function hasPermissionOrGrant(
  user: PermissionUser,
  permission: PermissionAction,
  context?: NavigationAccessContext,
) {
  return can(user, permission) || hasScopedPermission(context, permission);
}

function hasWorkspaceRouteAccess(
  user: PermissionUser,
  route: WorkspaceRoute,
  context?: NavigationAccessContext,
) {
  return (
    canAccessWorkspaceRoute(user, route) ||
    (context?.scopedWorkspaceRoutes?.includes(route) ?? false)
  );
}

export function getPermittedNavItems(
  user: PermissionUser,
  context?: NavigationAccessContext,
) {
  return NAV_ITEMS.filter((item) => {
    if (user.role === "pending") {
      return item.href === "/pending-access";
    }

    if (item.common) {
      return true;
    }

    const workspaceRoute = workspaceRouteForNavItem(item);

    if (workspaceRoute) {
      return hasWorkspaceRouteAccess(user, workspaceRoute, context);
    }

    if (
      externalRoles.includes(user.role) &&
      !context?.scopedPermissions?.length
    ) {
      return item.roles?.includes(user.role) ?? false;
    }

    if (item.roles?.includes(user.role)) {
      return true;
    }

    if (item.permission) {
      return hasPermissionOrGrant(user, item.permission, context);
    }

    if (item.permissions) {
      return item.permissions.some((permission) =>
        hasPermissionOrGrant(user, permission, context),
      );
    }

    return false;
  });
}
