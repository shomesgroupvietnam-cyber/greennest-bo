import React from "react";
import { redirect } from "next/navigation";

import {
  requireAuthenticatedSession,
  requireWorkspaceRoute,
} from "@/lib/permissions/guard";
import {
  canOpenCommandCenter,
  getCommandCenterLandingHref,
} from "@/lib/permissions/navigation-policy";
import { getCommandCenterAccessContext } from "@/lib/permissions/navigation-policy-context";
import { CommandCenterDashboard } from "@/modules/command-center/components/command-center-dashboard";
import { getCommandCenterData } from "@/modules/command-center/services/command-center-service";

export const dynamic = "force-dynamic";

type CommandCenterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function resolveInitialView(
  params: Record<string, string | string[] | undefined>,
) {
  const view = params.view;

  return Array.isArray(view) ? view[0] : view;
}

function withScopeId(href: string, selectedScopeId?: string) {
  if (!selectedScopeId || selectedScopeId === "all") {
    return href;
  }

  const [pathname, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("scopeId", selectedScopeId);

  return `${pathname}?${params.toString()}`;
}

export default async function CommandCenterPage({
  searchParams,
}: CommandCenterPageProps) {
  const params = searchParams ? await searchParams : {};
  const requestedView = resolveInitialView(params);
  const session =
    requestedView?.startsWith("executive-") &&
    requestedView !== "executive-private-workspace"
      ? await requireWorkspaceRoute("/executive")
      : await requireAuthenticatedSession({ route: "/command-center" });
  const selectedScopeId = Array.isArray(params.scopeId)
    ? params.scopeId[0]
    : params.scopeId;
  const hasStaticCommandCenterAccess = canOpenCommandCenter(
    session.user,
    requestedView,
  );
  const accessContext =
    !hasStaticCommandCenterAccess || !requestedView
      ? await getCommandCenterAccessContext(session.user, selectedScopeId)
      : undefined;
  const hasScopedCommandCenterAccess =
    hasStaticCommandCenterAccess ||
    canOpenCommandCenter(
      session.user,
      requestedView,
      accessContext,
    );

  if (!hasScopedCommandCenterAccess) {
    redirect(
      session.user.status !== "active" || session.user.roleActive === false
        ? "/pending-access"
        : session.defaultScreen.href,
    );
  }

  if (!requestedView) {
    const landingHref = getCommandCenterLandingHref(session.user, accessContext);

    if (landingHref && landingHref !== "/command-center") {
      redirect(withScopeId(landingHref, selectedScopeId));
    }
  }

  const data = await getCommandCenterData(session.user, { selectedScopeId });

  return (
    <CommandCenterDashboard
      data={data}
      initialView={requestedView}
      user={session.user}
    />
  );
}
