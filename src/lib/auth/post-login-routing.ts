import type { AppSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { getDefaultNavigationHref } from "@/lib/permissions/navigation-policy";
import { canAccessWorkspaceRoute } from "@/modules/workspaces/config";

const OPERATIONAL_OWNER_ROLES = [
  "chu_tich",
  "super_admin",
  "tong_giam_doc",
  "pho_tong_giam_doc",
] as const;
const EXTERNAL_WORKSPACE_ROLES = ["nha_thau", "tu_van"] as const;

export function resolvePostLoginHref(next: string, session: AppSession) {
  if (session.user.status !== "active" || session.user.roleActive === false) {
    return "/pending-access";
  }

  if (
    EXTERNAL_WORKSPACE_ROLES.includes(
      session.user.role as (typeof EXTERNAL_WORKSPACE_ROLES)[number],
    )
  ) {
    return session.defaultScreen.href;
  }

  if (next === "development") {
    return getDefaultNavigationHref(session.user);
  }

  if (next === "delivery") {
    if (canAccessWorkspaceRoute(session.user, "/project-workbench")) {
      return "/project-workbench";
    }

    if (can(session.user, "project.view")) {
      return "/dashboard";
    }
  }

  if (next === "operations") {
    if (
      OPERATIONAL_OWNER_ROLES.includes(
        session.user.role as (typeof OPERATIONAL_OWNER_ROLES)[number],
      )
    ) {
      return "/command-center?view=operations-dashboard";
    }

    if (canAccessWorkspaceRoute(session.user, "/admin")) {
      return "/admin";
    }

    if (canAccessWorkspaceRoute(session.user, "/assistant-workspace")) {
      return "/assistant-workspace";
    }

    if (can(session.user, "report.view")) {
      return "/reports";
    }
  }

  return session.defaultScreen.href;
}
