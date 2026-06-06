import type {
  ExecutiveDashboardData,
  ExecutiveDashboardPermissions,
  ExecutiveDashboardSourceItem,
  ExecutiveDrilldownAction,
  ExecutiveDrilldownLinkedRecord,
  ExecutiveDrilldownPermissionState,
  ExecutiveDrilldownTimelineItem,
} from "@/modules/dashboard/types";

type EnrichContext = {
  permissions: ExecutiveDashboardPermissions;
  scopeLabel?: string;
  canViewFinance?: boolean;
};

const financeKeys = [
  "amount",
  "amountLabel",
  "cashFlowLabel",
  "budgetRange",
  "budgetLabel",
  "allocatedBudget",
  "committedBudget",
  "visibleAmountTotal",
  "visibleRecordCount",
];

export function safeInternalHref(href?: string) {
  if (!href || !href.startsWith("/") || href.startsWith("//")) {
    return undefined;
  }

  return href;
}

function stripFinanceFields<T extends ExecutiveDashboardSourceItem>(item: T): T {
  const clone = { ...item } as T & Record<string, unknown>;

  for (const key of financeKeys) {
    delete clone[key];
  }

  return clone as T;
}

function shouldStripFinance<T extends ExecutiveDashboardSourceItem>(
  item: T,
  canViewFinance: boolean,
) {
  const maybeFinanceItem = item as T & {
    financialAccess?: "allowed" | "no_permission";
  };

  return !canViewFinance || maybeFinanceItem.financialAccess === "no_permission";
}

function canViewSource(
  item: ExecutiveDashboardSourceItem,
  permissions: ExecutiveDashboardPermissions,
) {
  if (!permissions.canDrillDown) {
    return false;
  }

  if (item.sourceType === "project") {
    return permissions.canViewProjects;
  }

  if (item.sourceType === "proposal" || item.sourceType === "leadership_approval") {
    return permissions.canViewProposals;
  }

  if (item.sourceType === "meeting") {
    return permissions.canViewMeetings;
  }

  if (item.sourceType === "decision") {
    return permissions.canViewDecisions;
  }

  if (item.sourceType === "risk") {
    return permissions.canViewRisk;
  }

  return (
    permissions.canViewProjects ||
    permissions.canViewProposals ||
    permissions.canViewMeetings ||
    permissions.canViewDecisions ||
    permissions.canViewRisk
  );
}

function sourceDeniedReason(
  item: ExecutiveDashboardSourceItem,
  permissions: ExecutiveDashboardPermissions,
) {
  if (!permissions.canDrillDown) {
    return "Khong co quyen drill-down nguon dieu hanh trong scope hien tai.";
  }

  return `Khong co quyen xem ${item.sourceType} trong scope hien tai.`;
}

function sourceRouteForItem(
  item: ExecutiveDashboardSourceItem,
  permissions: ExecutiveDashboardPermissions,
) {
  if (!canViewSource(item, permissions)) {
    return undefined;
  }

  const providedHref = safeInternalHref(item.href);

  if (providedHref) {
    return providedHref;
  }

  if (item.href) {
    return undefined;
  }

  const sourceId = encodeURIComponent(item.sourceId);

  if (item.sourceType === "project" && permissions.canViewProjects) {
    return `/projects/${sourceId}`;
  }

  if (item.sourceType === "proposal" && permissions.canViewProposals) {
    return `/proposals/${sourceId}`;
  }

  if (
    item.sourceType === "meeting" &&
    permissions.canViewMeetings &&
    item.id.startsWith("meeting-") &&
    !item.id.startsWith("meeting-follow-up-")
  ) {
    return `/meetings/${sourceId}`;
  }

  return undefined;
}

function permissionStateForItem(
  item: ExecutiveDashboardSourceItem,
  permissions: ExecutiveDashboardPermissions,
): ExecutiveDrilldownPermissionState {
  if (!canViewSource(item, permissions)) {
    return "denied";
  }

  return sourceRouteForItem(item, permissions) ? "allowed" : "read_only";
}

function sanitizeLinkedRecord(
  record: ExecutiveDrilldownLinkedRecord,
): ExecutiveDrilldownLinkedRecord {
  return {
    ...record,
    href:
      record.permissionState === "allowed"
        ? safeInternalHref(record.href)
        : undefined,
  };
}

function buildLinkedRecords(
  item: ExecutiveDashboardSourceItem,
  permissions: ExecutiveDashboardPermissions,
) {
  const records = (item.linkedRecords ?? []).map(sanitizeLinkedRecord);

  if (
    item.projectId &&
    item.sourceType !== "project" &&
    !records.some((record) => record.type === "project" && record.id === item.projectId)
  ) {
    const canOpenProject = permissions.canDrillDown && permissions.canViewProjects;

    records.push({
      href: canOpenProject ? `/projects/${encodeURIComponent(item.projectId)}` : undefined,
      id: item.projectId,
      permissionState: canOpenProject ? "allowed" : "denied",
      reason: canOpenProject
        ? undefined
        : "Khong co quyen xem project lien quan trong scope hien tai.",
      status: "linked",
      title: `Project ${item.projectId}`,
      type: "project",
    });
  }

  if (
    item.moduleId &&
    !records.some((record) => record.type === "module" && record.id === item.moduleId)
  ) {
    records.push({
      id: item.moduleId,
      permissionState: "read_only",
      reason: "Module lien quan duoc cung cap nhu metadata read-only.",
      status: "linked",
      title: `Module ${item.moduleId}`,
      type: "module",
    });
  }

  return records;
}

function sanitizeAction(action: ExecutiveDrilldownAction): ExecutiveDrilldownAction {
  const href = safeInternalHref(action.href);

  return {
    ...action,
    enabled: action.enabled && (!action.href || Boolean(href)),
    href,
  };
}

function buildAvailableActions(
  item: ExecutiveDashboardSourceItem,
  href: string | undefined,
) {
  if (item.availableActions?.length) {
    return item.availableActions.map(sanitizeAction);
  }

  if (href) {
    return [
      {
        enabled: true,
        href,
        id: "open-source",
        label: "Mo nguon",
      },
    ];
  }

  return [
    {
      enabled: false,
      id: "read-only-source",
      label: "Read-only",
      reason:
        "DTO chua cung cap route an toan, nen panel khong tu tao URL tu raw id.",
    },
  ];
}

function buildTimeline(item: ExecutiveDashboardSourceItem) {
  if (item.timeline?.length) {
    return item.timeline;
  }

  const timeline: ExecutiveDrilldownTimelineItem[] = [
    {
      id: `${item.id}-status`,
      label: "Trang thai hien tai",
      status: item.status,
    },
  ];

  if (item.deadline) {
    timeline.push({
      id: `${item.id}-deadline`,
      label: "Deadline",
      timestamp: item.deadline,
    });
  }

  return timeline;
}

export function enrichExecutiveSourceItem<T extends ExecutiveDashboardSourceItem>(
  item: T,
  context: EnrichContext,
): T & ExecutiveDashboardSourceItem {
  const canViewFinance = context.canViewFinance ?? context.permissions.canViewFinance;
  const financeSafeItem = shouldStripFinance(item, canViewFinance)
    ? stripFinanceFields(item)
    : item;
  const href = sourceRouteForItem(financeSafeItem, context.permissions);
  const permissionState = permissionStateForItem(
    financeSafeItem,
    context.permissions,
  );
  const deniedReason =
    permissionState === "denied"
      ? financeSafeItem.deniedReason ??
        sourceDeniedReason(financeSafeItem, context.permissions)
      : financeSafeItem.deniedReason;

  return {
    ...financeSafeItem,
    availableActions: buildAvailableActions(financeSafeItem, href),
    auditTrail: financeSafeItem.auditTrail ?? [],
    deniedReason,
    href,
    linkedRecords: buildLinkedRecords(financeSafeItem, context.permissions),
    permissionState,
    scopeLabel: financeSafeItem.scopeLabel ?? context.scopeLabel,
    timeline: buildTimeline(financeSafeItem),
  };
}

export function enrichExecutiveSourceItems<T extends ExecutiveDashboardSourceItem>(
  items: T[],
  context: EnrichContext,
): Array<T & ExecutiveDashboardSourceItem> {
  return items.map((item) => enrichExecutiveSourceItem(item, context));
}

export function enrichExecutiveDashboardDataSources(
  data: ExecutiveDashboardData,
): ExecutiveDashboardData {
  const context = {
    permissions: data.permissions,
    scopeLabel: data.scope.scopeLabel,
  };

  return {
    ...data,
    approvalSummary: {
      ...data.approvalSummary,
      items: enrichExecutiveSourceItems(data.approvalSummary.items, context),
    },
    meetingSnapshot: {
      ...data.meetingSnapshot,
      items: enrichExecutiveSourceItems(data.meetingSnapshot.items, context),
    },
    projectPortfolio: {
      ...data.projectPortfolio,
      items: enrichExecutiveSourceItems(data.projectPortfolio.items, context),
    },
    recentDecisions: {
      ...data.recentDecisions,
      items: enrichExecutiveSourceItems(data.recentDecisions.items, context),
    },
    riskSummary: {
      ...data.riskSummary,
      items: enrichExecutiveSourceItems(data.riskSummary.items, context),
    },
    todayDeadlines: {
      ...data.todayDeadlines,
      items: enrichExecutiveSourceItems(data.todayDeadlines.items, context),
    },
  };
}
