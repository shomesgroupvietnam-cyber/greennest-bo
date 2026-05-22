import { redirect } from "next/navigation";

import { requireAnyRole } from "@/lib/permissions/guard";
import { EXECUTIVE_ROUTE_ROLES } from "@/modules/executive/constants";

export const dynamic = "force-dynamic";

export default async function ExecutiveDecisionLogRoute() {
  await requireAnyRole(EXECUTIVE_ROUTE_ROLES, "/executive");
  redirect("/command-center?view=executive-dashboard");
}
