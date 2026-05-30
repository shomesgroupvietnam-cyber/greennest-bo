import type { PermissionUser } from "@/lib/permissions/can";
import { isBeforeBusinessDay } from "@/lib/date/business-day";
import { selectScopeAssignmentsForUser } from "@/lib/permissions/navigation-context";
import { getExecutiveLeadershipData } from "@/modules/executive/services/executive-service";
import type {
  ExecutiveCommandCenterSnapshotItem,
  ExecutiveDirective,
  ExecutiveLeadershipData,
  StrategicInvestmentPlan,
} from "@/modules/executive/types";
import { listActiveScopeAssignments } from "@/modules/settings/services/scope-assignment-service";
import type { ScopeAssignment } from "@/modules/settings/types";

import {
  getExecutiveDashboardData,
  type ExecutiveDashboardOptions,
} from "./executive-dashboard-service";
import { enrichExecutiveSourceItems } from "./executive-drilldown-source";
import type {
  ExecutiveApprovalItem,
  ExecutiveCommonCenterCalendarItem,
  ExecutiveCommonCenterData,
  ExecutiveCommonCenterDecisionHighlight,
  ExecutiveCommonCenterNotification,
  ExecutiveCommonCenterPriorityItem,
  ExecutiveCommonCenterStrategyItem,
  ExecutiveCommonCenterThresholdBreach,
  ExecutiveDashboardData,
  ExecutiveDashboardKpi,
  ExecutiveDashboardSourceItem,
  ExecutiveRiskItem,
} from "../types";

export type ExecutiveCommonCenterOptions = ExecutiveDashboardOptions & {
  dashboardData?: ExecutiveDashboardData;
  executiveData?: ExecutiveLeadershipData | null;
};

function isBeforeDay(value: string | undefined, today: Date) {
  return isBeforeBusinessDay(value, today);
}

function severityScore(item: ExecutiveRiskItem) {
  return {
    critical: 40,
    high: 30,
    low: 0,
    medium: 10,
  }[item.severity];
}

function toneScore(item: ExecutiveDashboardSourceItem) {
  if (item.tone === "red") {
    return 35;
  }

  if (item.tone === "amber") {
    return 20;
  }

  if (item.tone === "purple") {
    return 10;
  }

  return 0;
}

function dedupeBySource<T extends Pick<ExecutiveDashboardSourceItem, "sourceId" | "sourceType">>(
  items: T[],
) {
  const seen = new Set<string>();
  const uniqueItems: T[] = [];

  for (const item of items) {
    const sourceKey = `${item.sourceType}:${item.sourceId}`;

    if (seen.has(sourceKey)) {
      continue;
    }

    seen.add(sourceKey);
    uniqueItems.push(item);
  }

  return uniqueItems;
}

function isFinanceText(value: string | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.toLowerCase();

  return [
    "tai chinh",
    "tài chính",
    "dong tien",
    "dòng tiền",
    "ngan sach",
    "ngân sách",
    "xin chi",
    "chi phi",
    "chi phí",
    "cash",
    "budget",
    "amount",
    "vnd",
  ].some((term) => normalized.includes(term));
}

function canShowFinanceText(
  permissions: ExecutiveDashboardData["permissions"],
  ...values: Array<string | undefined>
) {
  return permissions.canViewFinance || !values.some(isFinanceText);
}

function mergePriorityItems(items: ExecutiveCommonCenterPriorityItem[]) {
  const bySource = new Map<string, ExecutiveCommonCenterPriorityItem>();

  for (const item of items) {
    const sourceKey = `${item.sourceType}:${item.sourceId}`;
    const existing = bySource.get(sourceKey);

    if (!existing || item.score > existing.score) {
      bySource.set(sourceKey, item);
    }
  }

  return Array.from(bySource.values()).sort((left, right) => right.score - left.score);
}

function mergeThresholdBreaches(items: ExecutiveCommonCenterThresholdBreach[]) {
  const bySource = new Map<string, ExecutiveCommonCenterThresholdBreach>();

  for (const item of items) {
    const sourceKey = `${item.sourceType}:${item.sourceId}`;
    const existing = bySource.get(sourceKey);

    if (!existing || item.score > existing.score) {
      bySource.set(sourceKey, item);
    }
  }

  return Array.from(bySource.values()).sort((left, right) => right.score - left.score);
}

function riskPriorityLabel(item: ExecutiveRiskItem) {
  if (item.severity === "critical") {
    return "Critical";
  }

  if (item.severity === "high") {
    return "High";
  }

  if (item.tone === "red") {
    return "Do";
  }

  return "Risk";
}

function approvalPriorityLabel(item: ExecutiveApprovalItem, today: Date) {
  if (item.escalation?.required) {
    return item.escalation.trigger === "risk_policy" ? "Escalation risk" : "Escalation";
  }

  if (item.overdue?.isOverdue || isBeforeDay(item.deadline, today) || item.tone === "red") {
    return "Qua han";
  }

  if (item.riskLevel === "critical" || item.priority === "critical") {
    return "Critical";
  }

  if (item.riskLevel === "high" || item.priority === "high") {
    return "High";
  }

  return "Cho duyet";
}

function buildRiskPriority(item: ExecutiveRiskItem): ExecutiveCommonCenterPriorityItem {
  return {
    ...item,
    groupLabel: "Risk nghiem trong",
    priorityLabel: riskPriorityLabel(item),
    score: 80 + severityScore(item) + toneScore(item),
  };
}

function buildApprovalPriority(
  item: ExecutiveApprovalItem,
  today: Date,
): ExecutiveCommonCenterPriorityItem {
  const overdueScore = item.escalation?.required
    ? 60
    : item.overdue?.isOverdue || isBeforeDay(item.deadline, today)
      ? 45
      : 0;
  const criticalScore =
    item.overdue?.severity === "critical" ||
    item.riskLevel === "critical" ||
    item.priority === "critical"
      ? 25
      : item.riskLevel === "high" || item.priority === "high"
        ? 15
        : 0;

  return {
    ...item,
    amountLabel: item.financialAccess === "allowed" ? item.amountLabel : undefined,
    groupLabel: item.escalation?.required ? "Approval escalation" : "Approval qua han",
    priorityLabel: approvalPriorityLabel(item, today),
    score: 70 + overdueScore + criticalScore + toneScore(item),
  };
}

function buildDeadlinePriority(
  item: ExecutiveDashboardSourceItem,
  today: Date,
): ExecutiveCommonCenterPriorityItem {
  return {
    ...item,
    groupLabel: "Deadline he thong",
    priorityLabel: isBeforeDay(item.deadline, today) || item.tone === "red" ? "Qua han" : "Hom nay",
    score: 45 + (isBeforeDay(item.deadline, today) ? 25 : 0) + toneScore(item),
  };
}

function buildProjectPriority(
  item: ExecutiveDashboardData["projectPortfolio"]["items"][number],
): ExecutiveCommonCenterPriorityItem {
  return {
    ...item,
    amountLabel: undefined,
    groupLabel: "Du an do",
    priorityLabel: "Do",
    score: 75 + toneScore(item),
  };
}

function buildPriorityItems(data: ExecutiveDashboardData, today: Date) {
  const riskItems = data.permissions.canViewRisk
    ? data.riskSummary.items
        .filter(
          (item) =>
            item.severity === "critical" ||
            item.severity === "high" ||
            item.tone === "red",
        )
        .map(buildRiskPriority)
    : [];
  const approvalItems = data.permissions.canViewProposals
    ? data.approvalSummary.items
        .filter(
          (item) =>
            isBeforeDay(item.deadline, today) ||
            item.tone === "red" ||
            item.riskLevel === "critical" ||
            item.riskLevel === "high" ||
            item.priority === "critical" ||
            item.priority === "high",
        )
        .map((item) => buildApprovalPriority(item, today))
    : [];
  const deadlineItems =
    data.permissions.canViewProposals ||
    data.permissions.canViewMeetings ||
    data.permissions.canViewDecisions
      ? data.todayDeadlines.items
          .filter((item) => isBeforeDay(item.deadline, today) || item.tone === "red")
          .map((item) => buildDeadlinePriority(item, today))
      : [];
  const redProjects = data.permissions.canViewProjects
    ? data.projectPortfolio.items
        .filter((item) => item.health === "red")
        .map(buildProjectPriority)
    : [];

  return mergePriorityItems([
    ...riskItems,
    ...approvalItems,
    ...deadlineItems,
    ...redProjects,
  ]).slice(0, 12);
}

function buildNotifications(
  permissions: ExecutiveDashboardData["permissions"],
  executiveData: ExecutiveLeadershipData | null,
): ExecutiveCommonCenterNotification[] {
  const canViewCommonNotifications =
    permissions.canViewProjects ||
    permissions.canViewProposals ||
    permissions.canViewMeetings ||
    permissions.canViewDecisions ||
    permissions.canViewRisk;

  if (!executiveData || !canViewCommonNotifications) {
    return [];
  }

  const notifications = executiveData.notifications
    .filter((item) => canShowFinanceText(permissions, item.title))
    .map((item) => ({
      description: item.title,
      href: "/command-center?view=executive-common-center",
      id: `notification-${item.id}`,
      projectId: item.projectId,
      timeLabel: item.time,
      title: item.title,
      tone: item.tone,
    }));
  const snapshotItems = [
    ...executiveData.commandCenterSnapshot.alerts,
    ...executiveData.commandCenterSnapshot.notes,
  ]
    .filter((item) =>
      canShowFinanceText(permissions, item.title, item.description),
    )
    .map((item) => ({
      description: item.description,
      href: item.href,
      id: `snapshot-${item.id}`,
      projectId: undefined,
      timeLabel: item.timeLabel,
      title: item.title,
      tone: item.tone,
    }));

  return [...notifications, ...snapshotItems].slice(0, 10);
}

function buildDecisionHighlights(
  data: ExecutiveDashboardData,
  executiveData: ExecutiveLeadershipData | null,
) {
  if (!data.permissions.canViewDecisions) {
    return [];
  }

  const dashboardDecisions = data.recentDecisions.items.map(
    (item): ExecutiveCommonCenterDecisionHighlight => ({
      ...item,
      highlightLabel:
        item.decidedBy?.toLowerCase().includes("chairman") ||
        item.decidedBy?.toLowerCase().includes("chu tich")
          ? "Quyet dinh Chu tich"
          : "Moi",
    }),
  );
  const leadershipDecisions =
    executiveData?.decisionLog.map(
      (item): ExecutiveCommonCenterDecisionHighlight => ({
        id: `leadership-decision-${item.id}`,
        decidedAt: item.decidedAt,
        decidedBy: item.decidedBy,
        highlightLabel:
          item.decidedBy.toLowerCase().includes("chairman") ||
          item.decidedBy.toLowerCase().includes("chu tich")
            ? "Quyet dinh Chu tich"
            : "Moi",
        projectId: item.projectId,
        reason: item.reason,
        sourceId: item.id,
        sourceType: "decision",
        status: item.status,
        title: item.decisionText,
        tone: item.status === "follow_up" ? "amber" : "blue",
      }),
    ) ?? [];
  const directiveDecisions =
    executiveData?.directives.map(
      (item): ExecutiveCommonCenterDecisionHighlight => ({
        deadline: item.dueDate,
        highlightLabel: "Chi dao",
        id: `directive-${item.id}`,
        owner: item.ownerName ?? item.assignedTo,
        projectId: item.projectId,
        reason: item.content,
        sourceId: item.id,
        sourceType: "executive_action",
        status: item.status,
        title: item.title,
        tone:
          item.status === "blocked"
            ? "red"
            : item.priority === "urgent"
              ? "amber"
              : "blue",
      }),
    ) ?? [];

  return dedupeBySource([
    ...dashboardDecisions,
    ...leadershipDecisions,
    ...directiveDecisions,
  ]).slice(0, 10);
}

function calendarFromSnapshotItem(
  item: ExecutiveCommandCenterSnapshotItem,
  eventType: ExecutiveCommonCenterCalendarItem["eventType"],
): ExecutiveCommonCenterCalendarItem {
  return {
    eventType,
    href: item.href,
    id: `calendar-${item.id}`,
    owner: item.ownerName,
    reason: item.description,
    sourceId: item.id,
    sourceType: "meeting",
    status: item.timeLabel ?? "scheduled",
    timeLabel: item.timeLabel,
    title: item.title,
    tone: item.tone,
  };
}

function buildCalendarItems(
  data: ExecutiveDashboardData,
  executiveData: ExecutiveLeadershipData | null,
): ExecutiveCommonCenterCalendarItem[] {
  if (!data.permissions.canViewMeetings) {
    return [];
  }

  const dashboardMeetings = data.meetingSnapshot.items.map((item) => ({
    ...item,
    eventType: "meeting" as const,
    timeLabel: item.deadline,
  }));
  const leadershipMeetings =
    executiveData?.meetings.map(
      (item): ExecutiveCommonCenterCalendarItem => ({
        deadline: item.meetingDate,
        eventType: "meeting",
        id: `leadership-meeting-${item.id}`,
        reason: item.summary || item.agenda.join(", "),
        sourceId: item.id,
        sourceType: "meeting",
        status: item.status,
        timeLabel: item.meetingDate,
        title: item.title,
        tone: item.status === "scheduled" ? "blue" : "emerald",
      }),
    ) ?? [];
  const scheduleItems =
    executiveData?.schedule.map(
      (item): ExecutiveCommonCenterCalendarItem => ({
        deadline: item.time,
        eventType: "schedule",
        id: `schedule-${item.id}`,
        projectId: item.projectId,
        reason: item.location,
        sourceId: item.id,
        sourceType: "meeting",
        status: item.time,
        timeLabel: item.time,
        title: item.title,
        tone: item.tone,
      }),
    ) ?? [];
  const snapshotItems = executiveData
    ? [
        ...executiveData.commandCenterSnapshot.meetings.map((item) =>
          calendarFromSnapshotItem(item, "meeting"),
        ),
        ...executiveData.commandCenterSnapshot.workCalendar.map((item) =>
          calendarFromSnapshotItem(item, "event"),
        ),
      ]
    : [];

  return dedupeBySource([
    ...dashboardMeetings,
    ...leadershipMeetings,
    ...scheduleItems,
    ...snapshotItems,
  ]).slice(0, 12);
}

function buildStrategyDescription(
  item: StrategicInvestmentPlan,
  canViewFinance: boolean,
) {
  const parts = [
    item.period,
    item.regionFocus,
    item.segmentFocus,
    item.priorities.slice(0, 2).join(", "),
  ].filter(Boolean);

  if (canViewFinance) {
    parts.push(item.budgetLabel);
  }

  return parts.filter(Boolean).join(" - ");
}

function buildStrategyItems(
  data: ExecutiveDashboardData,
  executiveData: ExecutiveLeadershipData | null,
): ExecutiveCommonCenterStrategyItem[] {
  if (!executiveData || !data.permissions.canViewProjects) {
    return [];
  }

  const planItems = executiveData.strategicPlans
    .filter((item) =>
      canShowFinanceText(
        data.permissions,
        item.title,
        item.period,
        item.regionFocus,
        item.segmentFocus,
        item.budgetLabel,
      ),
    )
    .map((item) => ({
      description: buildStrategyDescription(item, data.permissions.canViewFinance),
      href: "/command-center?view=executive-common-center",
      id: `strategy-plan-${item.id}`,
      owner: item.ownerName,
      projectId: item.projectId,
      status: item.status,
      title: item.title,
      tone:
        item.priority === "strategic" || item.priority === "high"
          ? ("purple" as const)
          : ("blue" as const),
    }));
  const directiveItems = executiveData.directives
    .filter(
      (item) =>
        data.permissions.canViewDecisions &&
        (item.priority === "urgent" || item.priority === "high") &&
        canShowFinanceText(data.permissions, item.title, item.content),
    )
    .map((item: ExecutiveDirective) => ({
      description: item.content,
      href: "/command-center?view=executive-common-center",
      id: `strategy-directive-${item.id}`,
      owner: item.ownerName ?? item.assignedTo,
      projectId: item.projectId,
      status: item.status,
      title: item.title,
      tone: item.priority === "urgent" ? ("red" as const) : ("amber" as const),
    }));

  return [...planItems, ...directiveItems].slice(0, 8);
}

function breachReasonForPriority(
  item: ExecutiveCommonCenterPriorityItem,
  today: Date,
) {
  if (item.sourceType === "risk") {
    return item.priorityLabel === "Critical"
      ? "risk critical"
      : "risk critical/high";
  }

  if (item.sourceType === "project") {
    return "project red";
  }

  if (
    item.sourceType === "proposal" ||
    item.sourceType === "leadership_approval"
  ) {
    if (item.escalation?.required) {
      return `approval escalation ${item.escalation.trigger}`;
    }

    if (item.overdue?.isOverdue) {
      return item.overdue.severity === "critical"
        ? "approval escalation overdue"
        : "approval overdue";
    }

    if (item.riskLevel === "critical" || item.priority === "critical") {
      return "approval critical";
    }

    if (item.riskLevel === "high" || item.priority === "high") {
      return "approval high risk";
    }

    if (item.tone === "red") {
      return "approval red";
    }
  }

  if (isBeforeDay(item.deadline, today)) {
    return item.sourceType === "proposal" ||
      item.sourceType === "leadership_approval"
      ? "approval overdue"
      : "deadline overdue";
  }

  return item.tone === "red" ? "red status" : "threshold breach";
}

function buildThresholdBreaches(
  data: ExecutiveDashboardData,
  priorityItems: ExecutiveCommonCenterPriorityItem[],
  today: Date,
): ExecutiveCommonCenterThresholdBreach[] {
  const projectBreaches = data.projectPortfolio.items
    .filter((item) => item.health === "red")
    .map(
      (item): ExecutiveCommonCenterThresholdBreach => ({
        ...buildProjectPriority(item),
        breachReason: "project red",
      }),
    );
  const priorityBreaches = priorityItems.map((item) => ({
    ...item,
    breachReason: breachReasonForPriority(item, today),
  }));

  return mergeThresholdBreaches([...priorityBreaches, ...projectBreaches]).slice(0, 10);
}

function buildCommonKpis(
  data: ExecutiveDashboardData,
  executiveData: ExecutiveLeadershipData | null,
): ExecutiveDashboardKpi[] {
  const dashboardKpis = data.kpis.slice(0, 5);
  const statusKpis =
    executiveData?.globalStatusItems.slice(0, 3).map((item) => ({
      id: `status-${item.id}`,
      label: item.label,
      reason: item.helper,
      tone: item.tone,
      value: item.value,
    })) ?? [];

  return [...dashboardKpis, ...statusKpis].filter(
    (item) => data.permissions.canViewFinance || !/tai chinh|dong tien|cash/i.test(item.label),
  );
}

async function resolveLeadershipScopeAssignments(
  user: PermissionUser,
  options: ExecutiveCommonCenterOptions,
): Promise<ScopeAssignment[]> {
  const allScopeAssignments =
    options.scopeAssignments ?? (await listActiveScopeAssignments());
  const selectedScopeActive =
    Boolean(options.selectedScopeId) && options.selectedScopeId !== "all";

  if (!selectedScopeActive) {
    return options.selectedScopeId === "all" &&
      ["super_admin", "admin", "tong_giam_doc"].includes(user.role)
      ? []
      : allScopeAssignments;
  }

  return selectScopeAssignmentsForUser(
    user,
    allScopeAssignments,
    options.selectedScopeId,
  );
}

async function resolveExecutiveData(
  user: PermissionUser,
  options: ExecutiveCommonCenterOptions,
) {
  if (options.executiveData !== undefined) {
    return options.executiveData;
  }

  const selectedScopeActive =
    Boolean(options.selectedScopeId) && options.selectedScopeId !== "all";
  const scopeAssignments = await resolveLeadershipScopeAssignments(user, options);

  if (selectedScopeActive && scopeAssignments.length === 0) {
    return null;
  }

  return getExecutiveLeadershipData(user, {
    rolePermissionCatalog: options.rolePermissionCatalog,
    selectedScopeId: options.selectedScopeId,
    scopeAssignments,
  });
}

export async function getExecutiveCommonCenterData(
  user: PermissionUser,
  options: ExecutiveCommonCenterOptions = {},
): Promise<ExecutiveCommonCenterData> {
  const today = options.today ?? new Date();
  const dashboardData =
    options.dashboardData ?? (await getExecutiveDashboardData(user, options));
  const executiveData = await resolveExecutiveData(user, options);
  const priorityItems = buildPriorityItems(dashboardData, today);
  const notifications = buildNotifications(dashboardData.permissions, executiveData);
  const decisionHighlights = buildDecisionHighlights(dashboardData, executiveData);
  const calendarItems = buildCalendarItems(dashboardData, executiveData);
  const strategyItems = buildStrategyItems(dashboardData, executiveData);
  const thresholdBreaches = buildThresholdBreaches(
    dashboardData,
    priorityItems,
    today,
  );
  const sourceContext = {
    permissions: dashboardData.permissions,
    scopeLabel: dashboardData.scope.scopeLabel,
  };
  const enrichedPriorityItems = enrichExecutiveSourceItems(
    priorityItems,
    sourceContext,
  );
  const enrichedDecisionHighlights = enrichExecutiveSourceItems(
    decisionHighlights,
    sourceContext,
  );
  const enrichedCalendarItems = enrichExecutiveSourceItems(
    calendarItems,
    sourceContext,
  );
  const enrichedRiskItems = dashboardData.permissions.canViewRisk
    ? enrichExecutiveSourceItems(
        dashboardData.riskSummary.items.slice(0, 8),
        sourceContext,
      )
    : [];
  const enrichedSystemDeadlines =
    dashboardData.permissions.canViewProposals ||
    dashboardData.permissions.canViewMeetings ||
    dashboardData.permissions.canViewDecisions
      ? enrichExecutiveSourceItems(
          dashboardData.todayDeadlines.items.slice(0, 12),
          sourceContext,
        )
      : [];
  const enrichedThresholdBreaches = enrichExecutiveSourceItems(
    thresholdBreaches,
    sourceContext,
  );

  return {
    calendarItems: enrichedCalendarItems,
    commonKpis: buildCommonKpis(dashboardData, executiveData),
    decisionHighlights: enrichedDecisionHighlights,
    generatedAt: new Date().toISOString(),
    notifications,
    permissions: dashboardData.permissions,
    priorityItems: enrichedPriorityItems,
    riskOverview: {
      byCategory: dashboardData.permissions.canViewRisk
        ? dashboardData.riskSummary.byCategory
        : {},
      critical: dashboardData.permissions.canViewRisk
        ? dashboardData.riskSummary.critical
        : 0,
      high: dashboardData.permissions.canViewRisk ? dashboardData.riskSummary.high : 0,
      items: enrichedRiskItems,
    },
    scope: dashboardData.scope,
    sourceCounts: {
      ...dashboardData.sourceCounts,
      calendarItems: enrichedCalendarItems.length,
      notifications: notifications.length,
      strategyItems: strategyItems.length,
      thresholdBreaches: enrichedThresholdBreaches.length,
    },
    strategyItems,
    systemDeadlines: enrichedSystemDeadlines,
    thresholdBreaches: enrichedThresholdBreaches,
  };
}
