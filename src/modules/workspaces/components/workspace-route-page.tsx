import { getCurrentSession } from "@/lib/auth/session";
import { canAccessWorkspaceRoute, type WorkspaceRoute } from "@/modules/workspaces/config";
import { getRoleWorkspaceData } from "@/modules/workspaces/services/workspace-service";

import { RoleWorkspaceShell, UnauthorizedWorkspace } from "./role-workspace-shell";

export async function WorkspaceRoutePage({ route }: { route: WorkspaceRoute }) {
  const session = await getCurrentSession();

  if (!canAccessWorkspaceRoute(session.user, route)) {
    return <UnauthorizedWorkspace defaultHref={session.defaultScreen.href} />;
  }

  const data = await getRoleWorkspaceData(session.user, route);

  return <RoleWorkspaceShell data={data} />;
}
