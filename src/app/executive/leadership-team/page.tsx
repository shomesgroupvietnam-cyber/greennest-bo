import { LeadershipTeamPage } from "@/modules/executive/pages";

import { renderExecutivePage } from "../_lib/render-executive-page";

export const dynamic = "force-dynamic";

export default async function ExecutiveLeadershipTeamRoute() {
  return renderExecutivePage(LeadershipTeamPage);
}
