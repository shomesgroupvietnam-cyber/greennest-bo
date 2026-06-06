import {
  ROLE_DEFAULT_SCREENS,
  isKnownRole,
  type Role,
} from "@/constants/roles";
import { can, type PermissionAction, type PermissionUser } from "@/lib/permissions/can";
import type { ScopeAssignment } from "@/modules/settings/types";

export const POLICY_WORKSPACE_HREFS = [
  "/admin",
  "/command-center",
  "/command-center?view=axis1-search-development",
  "/command-center?view=executive-dashboard",
  "/audit-workspace",
  "/axis-1",
  "/project-workbench",
  "/team-workbench",
  "/legal-workspace",
  "/finance-workspace",
  "/finance-management-workspace",
  "/contract-workspace",
  "/investment-workspace",
  "/hr-workspace",
  "/quality-workspace",
  "/safety-workspace",
  "/design-workspace",
  "/technical-workspace",
  "/construction-workspace",
  "/assistant-workspace",
  "/contractor",
  "/consultant",
  "/viewer",
  "/pending-access",
] as const;

export type PolicyWorkspaceHref = (typeof POLICY_WORKSPACE_HREFS)[number];

export const BO_POLICY_HREFS = ["/admin", "/settings", "/users"] as const;

export type BoPolicyHref = (typeof BO_POLICY_HREFS)[number];

export type CommandCenterAccess =
  | "none"
  | "axis1Overview"
  | "executiveDashboard"
  | "privateWorkspace"
  | "scopedOnly";

export type NavigationRolePolicy = {
  allowedWorkspaceHrefs: readonly PolicyWorkspaceHref[];
  businessNavigation: "byPermission" | "none";
  commandCenterAccess: CommandCenterAccess;
  defaultHref: PolicyWorkspaceHref;
};

export type ResolvedNavigationRolePolicy = NavigationRolePolicy & {
  allPolicyWorkspaceHrefs: readonly PolicyWorkspaceHref[];
};

export type CommandCenterAccessContext = {
  delegatedPermissions?: readonly PermissionAction[];
  delegatedScopeAssignments?: readonly ScopeAssignment[];
  scopedPermissions?: readonly PermissionAction[];
  scopedWorkspaceRoutes?: readonly string[];
};

export const AXIS_ONE_COMMAND_CENTER_VIEW = "axis1-search-development";
export const AXIS_ONE_COMMAND_CENTER_HREF =
  "/command-center?view=axis1-search-development";

const commandCenterRoles = [
  "chu_tich",
  "super_admin",
  "admin",
  "tong_giam_doc",
  "pho_tong_giam_doc",
] as const;

const leadershipWorkspaceHrefs = [
  "/command-center",
  "/command-center?view=executive-dashboard",
] as const satisfies readonly PolicyWorkspaceHref[];

const axisOneOverviewHrefs = [
  AXIS_ONE_COMMAND_CENTER_HREF,
  "/axis-1",
] as const satisfies readonly PolicyWorkspaceHref[];

function roleDefaultHref(role: Role): PolicyWorkspaceHref {
  return ROLE_DEFAULT_SCREENS[role].href as PolicyWorkspaceHref;
}

function workspacePolicy(input: {
  businessNavigation?: NavigationRolePolicy["businessNavigation"];
  commandCenterAccess?: CommandCenterAccess;
  defaultHref: PolicyWorkspaceHref;
  hrefs: readonly PolicyWorkspaceHref[];
}): NavigationRolePolicy {
  return {
    allowedWorkspaceHrefs: input.hrefs,
    businessNavigation: input.businessNavigation ?? "byPermission",
    commandCenterAccess: input.commandCenterAccess ?? "none",
    defaultHref: input.defaultHref,
  };
}

export const NAVIGATION_POLICY_BY_ROLE = {
  chu_tich: workspacePolicy({
    commandCenterAccess: "executiveDashboard",
    defaultHref: "/command-center",
    hrefs: leadershipWorkspaceHrefs,
  }),
  super_admin: workspacePolicy({
    commandCenterAccess: "executiveDashboard",
    defaultHref: "/command-center",
    hrefs: ["/admin", ...leadershipWorkspaceHrefs],
  }),
  admin: workspacePolicy({
    commandCenterAccess: "executiveDashboard",
    defaultHref: "/command-center",
    hrefs: ["/admin", ...leadershipWorkspaceHrefs],
  }),
  tong_giam_doc: workspacePolicy({
    commandCenterAccess: "executiveDashboard",
    defaultHref: "/command-center?view=executive-dashboard",
    hrefs: leadershipWorkspaceHrefs,
  }),
  pho_tong_giam_doc: workspacePolicy({
    commandCenterAccess: "executiveDashboard",
    defaultHref: "/command-center?view=executive-dashboard",
    hrefs: leadershipWorkspaceHrefs,
  }),
  giam_doc_du_an: workspacePolicy({
    commandCenterAccess: "axis1Overview",
    defaultHref: roleDefaultHref("giam_doc_du_an"),
    hrefs: [...axisOneOverviewHrefs, "/project-workbench"],
  }),
  quan_ly_du_an: workspacePolicy({
    commandCenterAccess: "axis1Overview",
    defaultHref: roleDefaultHref("quan_ly_du_an"),
    hrefs: [...axisOneOverviewHrefs, "/project-workbench"],
  }),
  to_truong: workspacePolicy({
    defaultHref: roleDefaultHref("to_truong"),
    hrefs: ["/team-workbench"],
  }),
  phap_ly: workspacePolicy({
    commandCenterAccess: "scopedOnly",
    defaultHref: roleDefaultHref("phap_ly"),
    hrefs: ["/legal-workspace"],
  }),
  ke_toan: workspacePolicy({
    defaultHref: roleDefaultHref("ke_toan"),
    hrefs: ["/finance-workspace"],
  }),
  thiet_ke: workspacePolicy({
    commandCenterAccess: "scopedOnly",
    defaultHref: roleDefaultHref("thiet_ke"),
    hrefs: ["/design-workspace"],
  }),
  ky_thuat: workspacePolicy({
    commandCenterAccess: "scopedOnly",
    defaultHref: roleDefaultHref("ky_thuat"),
    hrefs: ["/technical-workspace"],
  }),
  thi_cong: workspacePolicy({
    defaultHref: roleDefaultHref("thi_cong"),
    hrefs: ["/construction-workspace"],
  }),
  mua_hang: workspacePolicy({
    defaultHref: roleDefaultHref("mua_hang"),
    hrefs: ["/project-workbench"],
  }),
  dau_tu_phat_trien: workspacePolicy({
    commandCenterAccess: "axis1Overview",
    defaultHref: roleDefaultHref("dau_tu_phat_trien"),
    hrefs: [...axisOneOverviewHrefs, "/investment-workspace"],
  }),
  quan_ly_tai_chinh: workspacePolicy({
    defaultHref: roleDefaultHref("quan_ly_tai_chinh"),
    hrefs: ["/finance-management-workspace"],
  }),
  hanh_chinh_nhan_su: workspacePolicy({
    defaultHref: roleDefaultHref("hanh_chinh_nhan_su"),
    hrefs: ["/hr-workspace"],
  }),
  qa_qc_chat_luong: workspacePolicy({
    defaultHref: roleDefaultHref("qa_qc_chat_luong"),
    hrefs: ["/quality-workspace"],
  }),
  an_toan_lao_dong: workspacePolicy({
    defaultHref: roleDefaultHref("an_toan_lao_dong"),
    hrefs: ["/safety-workspace"],
  }),
  kiem_toan_noi_bo: workspacePolicy({
    defaultHref: roleDefaultHref("kiem_toan_noi_bo"),
    hrefs: ["/audit-workspace"],
  }),
  quan_ly_hop_dong: workspacePolicy({
    defaultHref: roleDefaultHref("quan_ly_hop_dong"),
    hrefs: ["/contract-workspace"],
  }),
  thu_ky_tro_ly: workspacePolicy({
    commandCenterAccess: "scopedOnly",
    defaultHref: roleDefaultHref("thu_ky_tro_ly"),
    hrefs: ["/assistant-workspace"],
  }),
  kiem_soat_noi_bo: workspacePolicy({
    defaultHref: roleDefaultHref("kiem_soat_noi_bo"),
    hrefs: ["/admin", "/audit-workspace"],
  }),
  nha_thau: workspacePolicy({
    businessNavigation: "none",
    defaultHref: roleDefaultHref("nha_thau"),
    hrefs: ["/contractor"],
  }),
  tu_van: workspacePolicy({
    businessNavigation: "none",
    defaultHref: roleDefaultHref("tu_van"),
    hrefs: ["/consultant"],
  }),
  viewer: workspacePolicy({
    commandCenterAccess: "privateWorkspace",
    defaultHref: roleDefaultHref("viewer"),
    hrefs: ["/viewer"],
  }),
  pending: workspacePolicy({
    businessNavigation: "none",
    defaultHref: roleDefaultHref("pending"),
    hrefs: ["/pending-access"],
  }),
} as const satisfies Record<Role, NavigationRolePolicy>;

const fallbackPolicy = workspacePolicy({
  businessNavigation: "none",
  commandCenterAccess: "none",
  defaultHref: "/pending-access",
  hrefs: ["/pending-access"],
});

const executiveCommandCenterViews = new Set([
  "executive-dashboard",
  "executive-morning-briefing",
  "executive-common-center",
  "executive-approvals",
  "executive-investment-plans",
  "executive-leadership-team",
  "executive-directives",
  "executive-meetings",
  "executive-decision-log",
  "executive-history",
]);

const operationsCommandCenterViews = new Set(["operations-dashboard"]);
const approvalCenterScopedPermissions: PermissionAction[] = [
  "proposal.review",
  "proposal.approve",
  "proposal.reject",
  "proposal.request_change",
];

function hasPermissionInContext(
  context: CommandCenterAccessContext | undefined,
  permission: PermissionAction,
) {
  return (
    context?.scopedPermissions?.includes(permission) ||
    context?.delegatedPermissions?.includes(permission) ||
    false
  );
}

function isExecutiveCommandCenterView(requestedView?: string) {
  return requestedView
    ? executiveCommandCenterViews.has(requestedView)
    : false;
}

function isPrivateWorkspaceView(requestedView?: string) {
  return requestedView === "executive-private-workspace";
}

function isOperationsCommandCenterView(requestedView?: string) {
  return requestedView ? operationsCommandCenterViews.has(requestedView) : false;
}

function isAxisOneCommandCenterView(requestedView?: string) {
  return requestedView === AXIS_ONE_COMMAND_CENTER_VIEW;
}

function hasApprovalCenterScopedAccess(
  context: CommandCenterAccessContext | undefined,
) {
  return approvalCenterScopedPermissions.some((permission) =>
    hasPermissionInContext(context, permission),
  );
}

export function getNavigationPolicyForRole(
  role: string,
): ResolvedNavigationRolePolicy {
  const policy = isKnownRole(role)
    ? NAVIGATION_POLICY_BY_ROLE[role]
    : fallbackPolicy;

  return {
    ...policy,
    allPolicyWorkspaceHrefs: POLICY_WORKSPACE_HREFS,
  };
}

export function getDefaultNavigationHref(user: PermissionUser) {
  return getNavigationPolicyForRole(user.role).defaultHref;
}

export function isCommandCenterHref(href: string) {
  return href === "/command-center" || href.startsWith("/command-center?");
}

export function commandCenterViewForHref(href: string) {
  const [, query = ""] = href.split("?");
  const params = new URLSearchParams(query);

  return params.get("view") ?? undefined;
}

export function isPolicyWorkspaceHref(
  href: string,
): href is PolicyWorkspaceHref {
  return POLICY_WORKSPACE_HREFS.includes(href as PolicyWorkspaceHref);
}

function normalizedRoutePath(href: string) {
  const [path = ""] = href.split("?");

  if (path === "/") {
    return path;
  }

  return path.replace(/\/+$/, "") || "/";
}

export function resolveBoPolicyHref(href: string): BoPolicyHref | undefined {
  const path = normalizedRoutePath(href);

  return BO_POLICY_HREFS.find(
    (boHref) => path === boHref || path.startsWith(`${boHref}/`),
  );
}

export function isBoPolicyHref(href: string) {
  return Boolean(resolveBoPolicyHref(href));
}

export function canOpenBoRoute(user: PermissionUser, href: string) {
  if (user.roleActive === false) {
    return false;
  }

  if (user.role === "chu_tich") {
    return false;
  }

  const boHref = resolveBoPolicyHref(href);

  if (!boHref) {
    return false;
  }

  const policy = getNavigationPolicyForRole(user.role);

  if (boHref === "/admin") {
    return (
      policy.allowedWorkspaceHrefs.includes("/admin") &&
      (can(user, "settings.manage") ||
        can(user, "delegation.manage") ||
        can(user, "user.view") ||
        can(user, "audit.view"))
    );
  }

  if (boHref === "/settings") {
    return can(user, "settings.manage") || can(user, "delegation.manage");
  }

  return can(user, "user.view");
}

export function canOpenCommandCenter(
  user: PermissionUser,
  requestedView?: string,
  context?: CommandCenterAccessContext,
) {
  if (user.roleActive === false) {
    return false;
  }

  const policy = getNavigationPolicyForRole(user.role);
  const access = policy.commandCenterAccess;
  const hasScopedAxisOne = hasPermissionInContext(context, "axis1.view");
  const hasScopedApprovalCenter = hasApprovalCenterScopedAccess(context);

  if (access === "none") {
    return false;
  }

  if (
    hasScopedAxisOne &&
    (!requestedView || isAxisOneCommandCenterView(requestedView))
  ) {
    return true;
  }

  if (
    hasScopedApprovalCenter &&
    (!requestedView || requestedView === "executive-approvals")
  ) {
    return true;
  }

  if (isPrivateWorkspaceView(requestedView)) {
    return access === "executiveDashboard" || access === "privateWorkspace";
  }

  if (isExecutiveCommandCenterView(requestedView)) {
    return access === "executiveDashboard";
  }

  if (isOperationsCommandCenterView(requestedView)) {
    return access === "executiveDashboard";
  }

  if (!requestedView || isAxisOneCommandCenterView(requestedView)) {
    return access === "executiveDashboard" || access === "axis1Overview";
  }

  return false;
}

export function getCommandCenterLandingHref(
  user: PermissionUser,
  context?: CommandCenterAccessContext,
) {
  if (user.roleActive === false) {
    return undefined;
  }

  const policy = getNavigationPolicyForRole(user.role);
  const hasScopedAxisOne = hasPermissionInContext(context, "axis1.view");

  if (policy.commandCenterAccess === "executiveDashboard") {
    return policy.defaultHref.startsWith("/command-center")
      ? policy.defaultHref
      : "/command-center";
  }

  if (policy.commandCenterAccess === "axis1Overview" || hasScopedAxisOne) {
    return AXIS_ONE_COMMAND_CENTER_HREF;
  }

  if (hasApprovalCenterScopedAccess(context)) {
    return "/command-center?view=executive-approvals";
  }

  return undefined;
}

export function roleHasStaticCommandCenterAccess(role: Role) {
  return commandCenterRoles.includes(role as (typeof commandCenterRoles)[number]);
}
