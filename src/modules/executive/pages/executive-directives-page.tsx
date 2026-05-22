import type { AppSessionUser } from "@/lib/auth/session";
import { ExecutiveLeadershipDashboard } from "@/modules/executive/components/executive-leadership-dashboard";
import type { ExecutiveLeadershipData } from "@/modules/executive/types";

export function ExecutiveDirectivesPage({
  data,
  user,
}: {
  data: ExecutiveLeadershipData;
  user: AppSessionUser;
}) {
  return (
    <ExecutiveLeadershipDashboard
      activePage="directives"
      data={data}
      user={user}
    />
  );
}
