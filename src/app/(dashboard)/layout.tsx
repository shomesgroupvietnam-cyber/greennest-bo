import { headers } from "next/headers";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { LogoutForm } from "@/components/layout/logout-form";
import type { AppSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import type { PermissionAction } from "@/lib/permissions/can";
import {
  requireAuthenticatedSession,
  requireAnyPermission,
  requireBoRoute,
  requirePermission,
} from "@/lib/permissions/guard";
import { isBoPolicyHref } from "@/lib/permissions/navigation-policy";
import { getNavigationShellData } from "@/lib/permissions/navigation-context";
import { listActiveDelegationsForDelegate } from "@/modules/settings/services/leadership-delegation-service";

export const dynamic = "force-dynamic";

type DashboardRoutePolicy = {
  path: string;
  match: "exact" | "prefix";
  custom?: "proposal-create-or-delegated";
  permission?: PermissionAction;
  permissions?: PermissionAction[];
};

const dashboardRoutePolicies: DashboardRoutePolicy[] = [
  { path: "/axis-1", match: "prefix", permission: "axis1.view" },
  { path: "/ai", match: "prefix", permission: "ai.ask" },
  { path: "/projects/new", match: "exact", permission: "project.create" },
  { path: "/projects", match: "prefix", permission: "project.view" },
  { path: "/tasks/new", match: "exact", permission: "task.create" },
  { path: "/tasks", match: "prefix", permission: "task.view" },
  { path: "/documents/new", match: "exact", permission: "document.create" },
  { path: "/documents", match: "prefix", permission: "document.view" },
  { path: "/meetings/new", match: "exact", permission: "meeting.create" },
  { path: "/meetings", match: "prefix", permission: "meeting.view" },
  { path: "/knowledge", match: "prefix", permission: "knowledge.view" },
  { path: "/reports/new", match: "exact", permission: "report.create" },
  { path: "/reports", match: "prefix", permission: "report.view" },
  { path: "/proposals/new", match: "exact", custom: "proposal-create-or-delegated" },
  { path: "/proposals", match: "prefix", permission: "proposal.view" },
];

function routeMatches(pathname: string, policy: DashboardRoutePolicy) {
  if (policy.match === "exact") {
    return pathname === policy.path;
  }

  return pathname === policy.path || pathname.startsWith(`${policy.path}/`);
}

async function canCreateProposalViaDelegation(session: AppSession) {
  const delegations = await listActiveDelegationsForDelegate(session.user.id);

  return delegations.some((delegation) =>
    delegation.actionKeys.includes("proposal.create"),
  );
}

async function enforceDashboardRoutePolicy(
  session: AppSession,
  pathname?: string | null,
) {
  if (!pathname) {
    return;
  }

  if (isBoPolicyHref(pathname)) {
    await requireBoRoute(pathname, session);
    return;
  }

  const policy = dashboardRoutePolicies.find((item) =>
    routeMatches(pathname, item),
  );

  if (!policy) {
    return;
  }

  if (policy.custom === "proposal-create-or-delegated") {
    if (
      can(session.user, "proposal.create") ||
      (await canCreateProposalViaDelegation(session))
    ) {
      return;
    }

    await requirePermission("proposal.create", { route: pathname });
    return;
  }

  if (policy.permission) {
    await requirePermission(policy.permission, { route: pathname });
  }

  if (policy.permissions) {
    await requireAnyPermission(policy.permissions, { route: pathname });
  }
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-greennest-pathname");
  const search = headerStore.get("x-greennest-search") ?? "";
  const selectedScopeId = headerStore.get("x-greennest-scope-id") ?? undefined;
  const session = await requireAuthenticatedSession({
    route: pathname ?? "/dashboard-shell",
  });
  await enforceDashboardRoutePolicy(session, pathname);
  const { navItems, shellContext } = await getNavigationShellData({
    defaultWorkspaceLabel: session.defaultScreen.label,
    pathname: pathname ?? session.defaultScreen.href.split("?")[0],
    search,
    selectedScopeId,
    user: session.user,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <AppSidebar navItems={navItems} session={session} shellContext={shellContext} />
      <div className="min-h-screen lg:pl-64">
        <AppHeader
          logoutSlot={<LogoutForm />}
          navItems={navItems}
          session={session}
          shellContext={shellContext}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
