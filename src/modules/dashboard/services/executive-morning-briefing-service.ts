import type { PermissionUser } from "@/lib/permissions/can";
import {
  isBeforeBusinessDay,
  isSameBusinessDay,
} from "@/lib/date/business-day";
import {
  buildExecutiveAiSummaryDraft,
  type ExecutiveAiSummaryBuildOptions,
} from "@/modules/ai/services/executive-ai-summary-service";

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

export type ExecutiveMorningBriefingOptions = ExecutiveDashboardOptions & {
  aiSummary?: ExecutiveAiSummaryBuildOptions;
};

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

function buildSummaryText(input: {
  criticalRiskCount: number;
  overdueApprovalCount: number;
  redProjectCount: number;
  todayDecisionCount: number;
}) {
  const parts = [
    `${input.criticalRiskCount} rủi ro cao/nghiêm trọng cần theo dõi`,
    `${input.overdueApprovalCount} phê duyệt quá hạn hoặc đang dở`,
    `${input.todayDecisionCount} việc cần quyết trong ngày`,
    `${input.redProjectCount} dự án đỏ`,
  ];

  return `Bản tóm tắt gợi ý: ${parts.join("; ")}. Vui lòng kiểm tra nguồn trích dẫn nội bộ trước khi ra quyết định.`;
}

function buildSummary(input: {
  data: ExecutiveDashboardData;
  decisionsToday: ExecutiveDashboardSourceItem[];
  generatedAt: string;
  overdueApprovals: ExecutiveApprovalItem[];
  topRisks: ExecutiveRiskItem[];
}): ExecutiveMorningBriefingSummary {
  const citationSources = dedupeBySource([
    ...input.topRisks,
    ...input.overdueApprovals,
    ...input.decisionsToday,
    ...input.data.projectPortfolio.items,
    ...input.data.todayDeadlines.items,
    ...input.data.recentDecisions.items,
    ...input.data.meetingSnapshot.items,
  ]).slice(0, 8);

  if (citationSources.length === 0) {
    return {
      citations: [],
      generatedFrom: [],
      status: "insufficient_context",
      text: "Không có dữ liệu trong phạm vi hoặc không có quyền xem dữ liệu để tạo Bản Tóm Tắt Đầu Ngày.",
      updatedAt: input.generatedAt,
    };
  }

  const redProjects = input.data.projectPortfolio.items.filter(
    (item) => item.health === "red",
  );

  return {
    citations: citationSources.map(buildCitation),
    generatedFrom: [
      "ExecutiveDashboardData.riskSummary",
      "ExecutiveDashboardData.approvalSummary",
      "ExecutiveDashboardData.todayDeadlines",
      "ExecutiveDashboardData.recentDecisions",
      "ExecutiveDashboardData.projectPortfolio",
    ],
    status: "draft",
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
  options: ExecutiveMorningBriefingOptions = {},
): Promise<ExecutiveMorningBriefingData> {
  const today = options.today ?? new Date();
  const data = await getExecutiveDashboardData(user, options);
  const topRisks = buildTopRisks(data);
  const overdueApprovals = buildOverdueApprovals(data, today);
  const decisionsToday = buildDecisionsToday(data, today);
  const generatedAt = new Date().toISOString();
  const baseSummary = buildSummary({
    data,
    decisionsToday,
    generatedAt,
    overdueApprovals,
    topRisks,
  });
  const summary = await buildExecutiveAiSummaryDraft(
    user,
    {
      citations: baseSummary.citations,
      generatedAt: baseSummary.updatedAt,
      generatedFrom: baseSummary.generatedFrom,
      sourceText:
        baseSummary.status === "insufficient_context" ? "" : baseSummary.text,
      view: "morning_briefing",
    },
    options.aiSummary,
  );

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
    summary: {
      ...summary,
      citations: summary.citations.map((citation) => ({
        ...citation,
        sourceType:
          citation.sourceType as ExecutiveMorningBriefingCitation["sourceType"],
      })),
    },
    topRisks,
  };
}
