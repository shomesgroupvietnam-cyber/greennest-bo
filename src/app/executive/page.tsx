import { ExecutiveDashboardPage } from "@/modules/executive/pages";

import { renderExecutivePage } from "./_lib/render-executive-page";

export const dynamic = "force-dynamic";

export default async function ExecutiveWorkspacePage() {
  return renderExecutivePage(ExecutiveDashboardPage);
}
