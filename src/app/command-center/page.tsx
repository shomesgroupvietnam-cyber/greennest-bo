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
import type { HistoryArchiveFilters } from "@/modules/reports/types";
import { historyArchiveFilterSchema } from "@/modules/reports/validation";

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

function resolveStringParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];

  return Array.isArray(value) ? value[0] : value;
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

function resolveHistoryArchiveFilters(
  params: Record<string, string | string[] | undefined>,
): HistoryArchiveFilters {
  return historyArchiveFilterSchema.parse({
    actorId: resolveStringParam(params, "actorId"),
    dateFrom: resolveStringParam(params, "dateFrom"),
    dateTo: resolveStringParam(params, "dateTo"),
    limit: resolveStringParam(params, "limit"),
    module: resolveStringParam(params, "module"),
    projectId: resolveStringParam(params, "projectId"),
    query: resolveStringParam(params, "query"),
    severity: resolveStringParam(params, "severity"),
    status: resolveStringParam(params, "status"),
    type: resolveStringParam(params, "type"),
  });
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
  const decisionCenterFilters =
    requestedView === "executive-decision-log"
      ? {
          assigneeId: resolveStringParam(params, "assigneeId"),
          ownerId: resolveStringParam(params, "ownerId"),
          priority: resolveStringParam(params, "priority") as
            | "all"
            | "low"
            | "medium"
            | "high"
            | "urgent"
            | undefined,
          projectId: resolveStringParam(params, "projectId"),
          search: resolveStringParam(params, "search"),
          selectedDecisionId:
            resolveStringParam(params, "decisionId") ??
            resolveStringParam(params, "selectedDecisionId"),
          status: resolveStringParam(params, "status") as
            | "all"
            | "open"
            | "in_progress"
            | "done"
            | "cancelled"
            | undefined,
        }
      : undefined;
  const historyArchiveFilters: HistoryArchiveFilters | undefined =
    requestedView === "executive-history"
      ? resolveHistoryArchiveFilters(params)
      : undefined;
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

  const data = await getCommandCenterData(session.user, {
    ...(decisionCenterFilters ? { decisionCenterFilters } : {}),
    ...(historyArchiveFilters ? { historyArchiveFilters } : {}),
    selectedScopeId,
  });

  return (
    <CommandCenterDashboard
      data={data}
      initialView={requestedView}
      user={session.user}
    />
  );
}
