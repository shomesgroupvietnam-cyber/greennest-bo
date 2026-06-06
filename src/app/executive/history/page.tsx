import type { ReactNode } from "react";

import { renderExecutivePage } from "../_lib/render-executive-page";

export const dynamic = "force-dynamic";

function ExecutiveHistoryRedirectPage(): ReactNode {
  return null;
}

export default async function ExecutiveHistoryRoute() {
  return renderExecutivePage(ExecutiveHistoryRedirectPage);
}
