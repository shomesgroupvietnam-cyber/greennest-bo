import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { AppSessionUser } from "@/lib/auth/session";
import { requireWorkspaceRoute } from "@/lib/permissions/guard";
import type { ExecutiveLeadershipData } from "@/modules/executive/types";

type ExecutivePageComponent = (props: {
  data: ExecutiveLeadershipData;
  user: AppSessionUser;
}) => ReactNode;

export async function renderExecutivePage(
  PageComponent: ExecutivePageComponent,
) {
  void PageComponent;
  const headerStore = await headers();
  const pathname = headerStore.get("x-greennest-pathname") ?? "/executive";
  const search = headerStore.get("x-greennest-search") ?? "";
  const viewByPath: Record<string, string> = {
    "/executive": "executive-dashboard",
    "/executive/approvals": "executive-approvals",
    "/executive/decisions": "executive-decision-log",
    "/executive/decision-log": "executive-decision-log",
    "/executive/directives": "executive-directives",
    "/executive/history": "executive-history",
    "/executive/investment-plans": "executive-investment-plans",
    "/executive/leadership-team": "executive-leadership-team",
    "/executive/meetings": "executive-meetings",
  };
  await requireWorkspaceRoute("/executive");
  const view = viewByPath[pathname] ?? "executive-dashboard";
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  params.set("view", view);

  redirect(`/command-center?${params.toString()}`);
}
