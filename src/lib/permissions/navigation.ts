import { can, type PermissionAction, type PermissionUser } from "./can";
import {
  canOpenBoRoute,
  canOpenCommandCenter,
  commandCenterViewForHref,
  getCommandCenterLandingHref,
  getNavigationPolicyForRole,
  isBoPolicyHref,
  isCommandCenterHref,
  isPolicyWorkspaceHref,
} from "@/lib/permissions/navigation-policy";
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
  delegatedPermissions?: readonly PermissionAction[];
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

const workspaceRoutes = new Set(
  Object.keys(WORKSPACE_DEFINITIONS),
) as Set<WorkspaceRoute>;

function workspaceRouteForNavItem(item: NavigationItem) {
  const path = item.href.split("?")[0] as WorkspaceRoute;

  return workspaceRoutes.has(path) ? path : undefined;
}

export const NAV_ITEMS: readonly NavigationItem[] = [
  {
    href: "/admin",
    label: "Quản trị hệ thống",
    icon: "users",
    roles: ["super_admin", "admin"],
    permissions: ["settings.manage", "delegation.manage", "user.view", "audit.view"],
  },
  {
    href: "/command-center",
    label: "Tổng quan Trục 1",
    icon: "dashboard",
    common: true,
  },
  {
    href: "/command-center?view=executive-dashboard",
    label: "Lãnh đạo",
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
      "chu_tich",
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
    label: "Kiểm toán",
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
    label: "Ban dự án",
    icon: "briefcase",
    roles: ["giam_doc_du_an", "quan_ly_du_an", "mua_hang"],
    permissions: ["project.view", "task.view", "document.view", "legal.view"],
  },
  {
    href: "/team-workbench",
    label: "Tổ đội",
    icon: "clipboard",
    roles: ["to_truong"],
  },
  {
    href: "/legal-workspace",
    label: "Pháp lý",
    icon: "gavel",
    roles: ["phap_ly"],
    permission: "legal.view",
  },
  {
    href: "/finance-workspace",
    label: "Tài chính",
    icon: "briefcase",
    roles: ["ke_toan"],
    permission: "finance.view",
  },
  {
    href: "/finance-management-workspace",
    label: "QL tài chính",
    icon: "briefcase",
    roles: ["quan_ly_tai_chinh"],
    permissions: ["finance.view", "finance.approve"],
  },
  {
    href: "/contract-workspace",
    label: "Hợp đồng",
    icon: "file",
    roles: ["quan_ly_hop_dong"],
    permission: "contract.view",
  },
  {
    href: "/investment-workspace",
    label: "Đầu tư",
    icon: "building",
    roles: ["dau_tu_phat_trien"],
    permission: "investment.view",
  },
  {
    href: "/hr-workspace",
    label: "Nhân sự",
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
    label: "An toàn",
    icon: "construction",
    roles: ["an_toan_lao_dong"],
    permission: "safety.view",
  },
  {
    href: "/design-workspace",
    label: "Thiết kế",
    icon: "file",
    roles: ["thiet_ke"],
    permission: "design.view",
  },
  {
    href: "/technical-workspace",
    label: "Kỹ thuật",
    icon: "settings",
    roles: ["ky_thuat"],
    permissions: ["design.view", "construction.view"],
  },
  {
    href: "/construction-workspace",
    label: "Thi công",
    icon: "construction",
    roles: ["thi_cong"],
    permission: "construction.view",
  },
  {
    href: "/assistant-workspace",
    label: "Trợ lý",
    icon: "sparkles",
    roles: ["thu_ky_tro_ly"],
    permissions: ["task.view", "meeting.view", "document.view"],
  },
  {
    href: "/contractor",
    label: "Nhà thầu",
    icon: "construction",
    roles: ["nha_thau"],
  },
  { href: "/consultant", label: "Tư vấn", icon: "file", roles: ["tu_van"] },
  { href: "/viewer", label: "Chỉ xem", icon: "dashboard", roles: ["viewer"] },
  {
    href: "/dashboard",
    label: "Vùng chung",
    icon: "dashboard",
    roles: [],
  },
  {
    href: "/projects",
    label: "Dự án",
    icon: "building",
    permission: "project.view",
  },
  {
    href: "/tasks",
    label: "Công việc",
    icon: "clipboard",
    permission: "task.view",
  },
  {
    href: "/documents",
    label: "Hồ sơ",
    icon: "file",
    permission: "document.view",
  },
  { href: "/legal", label: "Pháp lý", icon: "gavel", permission: "legal.view" },
  {
    href: "/meetings",
    label: "Cuộc họp",
    icon: "video",
    permission: "meeting.view",
  },
  {
    href: "/knowledge",
    label: "Tri thức",
    icon: "sparkles",
    permission: "knowledge.view",
  },
  { href: "/ai", label: "Cổng AI", icon: "sparkles", permission: "ai.ask" },
  {
    href: "/reports",
    label: "Báo cáo",
    icon: "file",
    permission: "report.view",
  },
  {
    href: "/proposals",
    label: "Đề xuất",
    icon: "clipboard",
    permission: "proposal.view",
  },
  {
    href: "/users",
    label: "Người dùng",
    icon: "users",
    permission: "user.view",
  },
  {
    href: "/settings",
    label: "Cài đặt BO",
    icon: "settings",
    permissions: ["settings.manage", "delegation.manage"],
  },
];

function hasContextPermission(
  context: NavigationAccessContext | undefined,
  permission: PermissionAction,
) {
  return (
    context?.scopedPermissions?.includes(permission) ||
    context?.delegatedPermissions?.includes(permission) ||
    false
  );
}

function hasPermissionOrGrant(
  user: PermissionUser,
  permission: PermissionAction,
  context?: NavigationAccessContext,
) {
  return can(user, permission) || hasContextPermission(context, permission);
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

function withResolvedCommandCenterHref(
  item: NavigationItem,
  user: PermissionUser,
  context?: NavigationAccessContext,
) {
  if (item.href !== "/command-center") {
    return item;
  }

  const landingHref = getCommandCenterLandingHref(user, context);

  return {
    ...item,
    href:
      landingHref === "/command-center?view=axis1-search-development" ||
      landingHref === "/command-center?view=executive-approvals"
        ? landingHref
        : item.href,
  };
}

export function getPermittedNavItems(
  user: PermissionUser,
  context?: NavigationAccessContext,
) {
  return NAV_ITEMS.flatMap((item) => {
    const policy = getNavigationPolicyForRole(user.role);
    const include = (navItem: NavigationItem) => [
      withResolvedCommandCenterHref(navItem, user, context),
    ];

    if (user.role === "pending") {
      return item.href === "/pending-access" ? include(item) : [];
    }

    if (isBoPolicyHref(item.href)) {
      return canOpenBoRoute(user, item.href) ? include(item) : [];
    }

    if (isCommandCenterHref(item.href)) {
      return canOpenCommandCenter(
        user,
        commandCenterViewForHref(item.href),
        context,
      )
        ? include(item)
        : [];
    }

    if (
      isPolicyWorkspaceHref(item.href) &&
      policy.allowedWorkspaceHrefs.includes(item.href)
    ) {
      const workspaceRoute = workspaceRouteForNavItem(item);

      return workspaceRoute
        ? hasWorkspaceRouteAccess(user, workspaceRoute, context)
          ? include(item)
          : []
        : include(item);
    }

    const workspaceRoute = workspaceRouteForNavItem(item);

    if (
      isPolicyWorkspaceHref(item.href) &&
      workspaceRoute &&
      (context?.scopedWorkspaceRoutes?.includes(workspaceRoute) ?? false)
    ) {
      return include(item);
    }

    if (
      item.href === "/axis-1" &&
      policy.businessNavigation !== "none" &&
      hasContextPermission(context, "axis1.view")
    ) {
      return include(item);
    }

    if (isPolicyWorkspaceHref(item.href)) {
      return [];
    }

    if (policy.businessNavigation === "none") {
      if (item.permission) {
        return hasContextPermission(context, item.permission) ? include(item) : [];
      }

      if (item.permissions) {
        return item.permissions.some((permission) =>
          hasContextPermission(context, permission),
        )
          ? include(item)
          : [];
      }

      return [];
    }

    if (item.roles?.includes(user.role)) {
      return include(item);
    }

    if (item.permission) {
      return hasPermissionOrGrant(user, item.permission, context)
        ? include(item)
        : [];
    }

    if (item.permissions) {
      return item.permissions.some((permission) =>
        hasPermissionOrGrant(user, permission, context),
      )
        ? include(item)
        : [];
    }

    return [];
  });
}
