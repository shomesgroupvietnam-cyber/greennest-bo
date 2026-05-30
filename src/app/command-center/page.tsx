import React from "react";

import {
  requireAuthenticatedSession,
  requireWorkspaceRoute,
} from "@/lib/permissions/guard";
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
  const data = await getCommandCenterData(session.user, { selectedScopeId });

  return (
    <CommandCenterDashboard
      data={data}
      initialView={requestedView}
      user={session.user}
    />
  );
}
