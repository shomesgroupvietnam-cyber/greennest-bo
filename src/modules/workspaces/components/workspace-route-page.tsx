import { requireWorkspaceRoute } from "@/lib/permissions/guard";
import type { WorkspaceRoute } from "@/modules/workspaces/config";
import { getRoleWorkspaceData } from "@/modules/workspaces/services/workspace-service";

import { RoleWorkspaceShell } from "./role-workspace-shell";

export async function WorkspaceRoutePage({ route }: { route: WorkspaceRoute }) {
  const session = await requireWorkspaceRoute(route);

  const data = await getRoleWorkspaceData(session.user, route);

  return <RoleWorkspaceShell data={data} />;
}
