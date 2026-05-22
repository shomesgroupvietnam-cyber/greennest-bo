import type { ReactNode } from "react";

import type { AppSessionUser } from "@/lib/auth/session";
import { requireWorkspaceRoute } from "@/lib/permissions/guard";
import { getExecutiveLeadershipData } from "@/modules/executive/services/executive-service";
import type { ExecutiveLeadershipData } from "@/modules/executive/types";

type ExecutivePageComponent = (props: {
  data: ExecutiveLeadershipData;
  user: AppSessionUser;
}) => ReactNode;

export async function renderExecutivePage(
  PageComponent: ExecutivePageComponent,
) {
  const session = await requireWorkspaceRoute("/executive");

  const data = await getExecutiveLeadershipData(session.user);

  return <PageComponent data={data} user={session.user} />;
}
