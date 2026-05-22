import { headers } from "next/headers";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { LogoutForm } from "@/components/layout/logout-form";
import type { PermissionAction } from "@/lib/permissions/can";
import {
  requireAuthenticatedSession,
  requirePermission,
} from "@/lib/permissions/guard";

export const dynamic = "force-dynamic";

type DashboardRoutePolicy = {
  path: string;
  match: "exact" | "prefix";
  permission?: PermissionAction;
};

const dashboardRoutePolicies: DashboardRoutePolicy[] = [
  { path: "/axis-1", match: "prefix", permission: "axis1.view" },
  { path: "/users", match: "prefix", permission: "user.view" },
  { path: "/ai", match: "prefix", permission: "ai.ask" },
  { path: "/settings", match: "prefix", permission: "settings.manage" },
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
  { path: "/proposals/new", match: "exact", permission: "proposal.create" },
  { path: "/proposals", match: "prefix", permission: "proposal.view" },
];

function routeMatches(pathname: string, policy: DashboardRoutePolicy) {
  if (policy.match === "exact") {
    return pathname === policy.path;
  }

  return pathname === policy.path || pathname.startsWith(`${policy.path}/`);
}

async function enforceDashboardRoutePolicy(pathname?: string | null) {
  if (!pathname) {
    return;
  }

  const policy = dashboardRoutePolicies.find((item) =>
    routeMatches(pathname, item),
  );

  if (!policy) {
    return;
  }

  if (policy.permission) {
    await requirePermission(policy.permission, { route: pathname });
  }
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-greennest-pathname");
  const session = await requireAuthenticatedSession({
    route: pathname ?? "/dashboard-shell",
  });
  await enforceDashboardRoutePolicy(pathname);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppSidebar session={session} />
      <div className="min-h-screen lg:pl-64">
        <AppHeader logoutSlot={<LogoutForm />} session={session} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
