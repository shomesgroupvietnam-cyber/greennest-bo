import type { PermissionUser } from "@/lib/permissions/can";
import {
  isBeforeBusinessDay,
  isSameBusinessDay,
} from "@/lib/date/business-day";

import {
  getExecutiveDashboardData,
  type ExecutiveDashboardOptions,
} from "./executive-dashboard-service";
import type {
  ExecutiveApprovalItem,
  ExecutiveDashboardData,
  ExecutiveDashboardSourceItem,
  ExecutiveMorningBriefingCitation,
  ExecutiveMorningBriefingData,
  ExecutiveMorningBriefingSummary,
  ExecutiveRiskItem,
} from "../types";

function isBeforeDay(value: string | undefined, today: Date) {
  return isBeforeBusinessDay(value, today);
}

function isSameDay(value: string | undefined, today: Date) {
  return isSameBusinessDay(value, today);
}

function severityRank(item: ExecutiveRiskItem) {
  return {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }[item.severity];
}

function isDecisionSource(item: Pick<ExecutiveDashboardSourceItem, "sourceType">) {
  return item.sourceType === "decision" || item.sourceType === "executive_action";
}

function dedupeBySource<T extends Pick<ExecutiveDashboardSourceItem, "sourceId" | "sourceType">>(
  items: T[],
) {
  const seen = new Set<string>();
  const uniqueItems: T[] = [];

  for (const item of items) {
    const key = `${item.sourceType}:${item.sourceId}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueItems.push(item);
  }

  return uniqueItems;
}

function buildCitation(item: ExecutiveDashboardSourceItem): ExecutiveMorningBriefingCitation {
  return {
    href: item.href,
    id: `citation-${item.sourceType}-${item.sourceId}`,
    projectId: item.projectId,
    sourceId: item.sourceId,
    sourceType: item.sourceType,
    title: item.title,
  };
}

function buildTopRisks(data: ExecutiveDashboardData) {
  return [...data.riskSummary.items]
    .sort(
      (left, right) =>
        severityRank(left) - severityRank(right) ||
        (left.deadline ?? "").localeCompare(right.deadline ?? ""),
    )
    .slice(0, 5);
}

function buildOverdueApprovals(
  data: ExecutiveDashboardData,
  today: Date,
): ExecutiveApprovalItem[] {
  return data.approvalSummary.items
    .filter(
      (item) =>
        item.escalation?.required ||
        item.overdue?.isOverdue ||
        item.tone === "red" ||
        isBeforeDay(item.deadline, today),
    )
    .sort((left, right) => {
      const escalationRank = Number(Boolean(right.escalation?.required)) -
        Number(Boolean(left.escalation?.required));

      if (escalationRank !== 0) {
        return escalationRank;
      }

      const criticalRank =
        Number(right.overdue?.severity === "critical") -
        Number(left.overdue?.severity === "critical");

      if (criticalRank !== 0) {
        return criticalRank;
      }

      return (left.deadline ?? "").localeCompare(right.deadline ?? "");
    })
    .slice(0, 5);
}

function buildDecisionsToday(
  data: ExecutiveDashboardData,
  today: Date,
): ExecutiveDashboardSourceItem[] {
  const dueDecisionItems = data.todayDeadlines.items.filter(
    (item) =>
      isDecisionSource(item) &&
      (isBeforeDay(item.deadline, today) || isSameDay(item.deadline, today)),
  );
  const recentDecisionItems = data.recentDecisions.items.filter(
    (item) =>
      isDecisionSource(item) && isSameDay(item.decidedAt ?? item.deadline, today),
  );

  return dedupeBySource([
    ...dueDecisionItems,
    ...recentDecisionItems,
  ]).slice(0, 6);
}

function sourceHasContext(data: ExecutiveDashboardData) {
  return (
    data.projectPortfolio.items.length > 0 ||
    data.riskSummary.items.length > 0 ||
    data.approvalSummary.items.length > 0 ||
    data.todayDeadlines.items.length > 0 ||
    data.recentDecisions.items.length > 0 ||
    data.meetingSnapshot.items.length > 0
  );
}

function buildSummaryText(input: {
  criticalRiskCount: number;
  overdueApprovalCount: number;
  redProjectCount: number;
  todayDecisionCount: number;
}) {
  const parts = [
    `${input.criticalRiskCount} risk high/critical can theo doi`,
    `${input.overdueApprovalCount} approval qua han hoac dang do`,
    `${input.todayDecisionCount} viec can quyet/decision trong ngay`,
    `${input.redProjectCount} du an do`,
  ];

  return `Ban tom tat goi y: ${parts.join("; ")}. Vui long kiem tra citation noi bo truoc khi ra quyet dinh.`;
}

function buildSummary(input: {
  data: ExecutiveDashboardData;
  decisionsToday: ExecutiveDashboardSourceItem[];
  generatedAt: string;
  overdueApprovals: ExecutiveApprovalItem[];
  today: Date;
  topRisks: ExecutiveRiskItem[];
}): ExecutiveMorningBriefingSummary {
  if (!sourceHasContext(input.data)) {
    return {
      citations: [],
      generatedFrom: [],
      status: "insufficient_context",
      text: "Khong co du lieu trong scope hoac khong co quyen xem du lieu de tao Morning Briefing.",
      updatedAt: input.generatedAt,
    };
  }

  const redProjects = input.data.projectPortfolio.items.filter(
    (item) => item.health === "red",
  );
  const citationSources = dedupeBySource([
    ...input.topRisks,
    ...input.overdueApprovals,
    ...input.decisionsToday,
    ...input.data.projectPortfolio.items,
    ...input.data.meetingSnapshot.items.filter((item) =>
      isSameDay(item.deadline, input.today),
    ),
  ]).slice(0, 8);

  return {
    citations: citationSources.map(buildCitation),
    generatedFrom: [
      "ExecutiveDashboardData.riskSummary",
      "ExecutiveDashboardData.approvalSummary",
      "ExecutiveDashboardData.todayDeadlines",
      "ExecutiveDashboardData.recentDecisions",
      "ExecutiveDashboardData.projectPortfolio",
    ],
    status: "placeholder",
    text: buildSummaryText({
      criticalRiskCount: input.topRisks.filter((risk) =>
        risk.severity === "critical" || risk.severity === "high",
      ).length,
      overdueApprovalCount: input.overdueApprovals.length,
      redProjectCount: redProjects.length,
      todayDecisionCount: input.decisionsToday.length,
    }),
    updatedAt: input.generatedAt,
  };
}

export async function getExecutiveMorningBriefingData(
  user: PermissionUser,
  options: ExecutiveDashboardOptions = {},
): Promise<ExecutiveMorningBriefingData> {
  const today = options.today ?? new Date();
  const data = await getExecutiveDashboardData(user, options);
  const topRisks = buildTopRisks(data);
  const overdueApprovals = buildOverdueApprovals(data, today);
  const decisionsToday = buildDecisionsToday(data, today);
  const generatedAt = new Date().toISOString();

  return {
    decisionsToday,
    generatedAt,
    kpisToday: data.kpis,
    meetingSnapshot: data.meetingSnapshot,
    overdueApprovals,
    permissions: data.permissions,
    projectHealth: {
      green: data.projectPortfolio.green,
      items: data.projectPortfolio.items,
      red: data.projectPortfolio.red,
      total: data.projectPortfolio.total,
      yellow: data.projectPortfolio.yellow,
    },
    scope: data.scope,
    sourceCounts: data.sourceCounts,
    summary: buildSummary({
      data,
      decisionsToday,
      generatedAt,
      overdueApprovals,
      today,
      topRisks,
    }),
    topRisks,
  };
}
