import { randomUUID } from "node:crypto";

import {
  hasAnyScopedActionGrant,
  requiresAssignmentScopeForRole,
} from "@/lib/permissions/access-scope";
import { can, type PermissionAction, type PermissionUser } from "@/lib/permissions/can";
import { selectScopeAssignmentsForUser } from "@/lib/permissions/navigation-context";
import {
  getExecutiveDashboardData,
  type ExecutiveDashboardOptions,
} from "@/modules/dashboard/services/executive-dashboard-service";
import type { ExecutiveDashboardData } from "@/modules/dashboard/types";
import {
  getHistoryArchiveData,
  type HistoryArchiveServiceDependencies,
} from "@/modules/reports/services/history-archive-service";
import type {
  HistoryArchiveData,
  HistoryArchiveEvent,
  HistoryArchiveFilters,
  ReportExportFormat,
  ReportExportRequest,
  ReportExportResult,
  ReportExportSummary,
  ReportExportTarget,
} from "@/modules/reports/types";
import { reportExportRequestSchema } from "@/modules/reports/validation";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import { listActiveScopeAssignments } from "@/modules/settings/services/scope-assignment-service";
import type { RolePermissionCatalog, ScopeAssignment } from "@/modules/settings/types";
import { createAuditLog } from "@/modules/users/services/user-service";
import type { AuditLog } from "@/modules/users/types";

type ExportAuditWriter = (input: Omit<AuditLog, "id" | "createdAt">) => Promise<AuditLog>;
type DashboardLoader = (
  user: PermissionUser,
  options?: ExecutiveDashboardOptions,
) => Promise<ExecutiveDashboardData>;
type HistoryArchiveLoader = (
  user: PermissionUser,
  filters?: HistoryArchiveFilters,
  dependencies?: HistoryArchiveServiceDependencies,
) => Promise<HistoryArchiveData>;

export type ReportExportServiceOptions = {
  auditWriter?: ExportAuditWriter;
  dashboardLoader?: DashboardLoader;
  historyArchiveDependencies?: HistoryArchiveServiceDependencies;
  historyArchiveLoader?: HistoryArchiveLoader;
  idGenerator?: () => string;
  now?: () => string;
  rolePermissionCatalog?: RolePermissionCatalog;
  scopeAssignments?: ScopeAssignment[];
};

type ExportSource =
  | {
      data: unknown;
      itemCount: number;
      redactedFields: string[];
      sensitiveIncluded: boolean;
      total?: number;
    }
  | {
      items: Array<Record<string, unknown>>;
      itemCount: number;
      redactedFields: string[];
      sensitiveIncluded: boolean;
      total?: number;
    };

type DashboardExportItem = {
  categoryKey?: string;
  categoryLabel?: string;
  deadline?: string;
  decidedAt?: string;
  decidedBy?: string;
  id?: string;
  owner?: string;
  ownerId?: string;
  priority?: string;
  projectId?: string;
  reason?: string;
  riskLevel?: string;
  severity?: string;
  sourceId?: string;
  sourceType?: string;
  status?: string;
  title?: string;
  tone?: string;
};
type DashboardExportEntry = {
  item: DashboardExportItem;
  key: string;
};

const safeHistoryMetadataKeys = new Set([
  "action",
  "approvalLevel",
  "assigneeType",
  "changedFields",
  "count",
  "documentVersion",
  "linkedEntityType",
  "nextStatus",
  "previousStatus",
  "priority",
  "reasonProvided",
  "relationType",
  "scope",
  "status",
  "stepOrder",
  "version",
  "versionNumber",
]);
const forbiddenExportKeys = new Set([
  "aiOutput",
  "aiSummary",
  "aiText",
  "documentUrl",
  "documentURL",
  "downloadUrl",
  "fileUrl",
  "meetingMinutes",
  "newValue",
  "oldValue",
  "provider",
  "providerMetadata",
  "rawProviderMetadata",
  "url",
]);
const financeDeniedKeys = new Set(["amount", "amountLabel", "cashFlowLabel"]);

function timestampNow() {
  return new Date().toISOString();
}

async function resolveScopeContext(options: ReportExportServiceOptions) {
  const [scopeAssignments, rolePermissionCatalog] = await Promise.all([
    options.scopeAssignments ?? listActiveScopeAssignments(),
    options.rolePermissionCatalog ?? listRolePermissionCatalog(),
  ]);

  return { rolePermissionCatalog, scopeAssignments };
}

function scopedPermission(input: {
  action: PermissionAction;
  rolePermissionCatalog: RolePermissionCatalog;
  scopeAssignments: ScopeAssignment[];
  user: PermissionUser;
}) {
  return hasAnyScopedActionGrant(input.user, input.action, {
    rolePermissionCatalog: input.rolePermissionCatalog,
    scopeAssignments: input.scopeAssignments,
  });
}

function scopeAssignmentsForRequest(input: {
  directGrant: boolean;
  scopeAssignments: ScopeAssignment[];
  scopeId?: string;
  user: PermissionUser;
}) {
  const selectedScopeActive = Boolean(input.scopeId) && input.scopeId !== "all";
  const selectedScopeAssignments = selectScopeAssignmentsForUser(
    input.user,
    input.scopeAssignments,
    input.scopeId,
  );

  if (selectedScopeActive && selectedScopeAssignments.length === 0) {
    throw new Error("Scope xuat du lieu khong hop le hoac khong thuoc nguoi dung.");
  }

  if (!selectedScopeActive && input.directGrant && !requiresAssignmentScopeForRole(input.user.role)) {
    return [];
  }

  return selectedScopeAssignments;
}

function extension(format: ReportExportFormat) {
  return format === "csv" ? "csv" : "json";
}

function mimeType(format: ReportExportFormat) {
  return format === "csv" ? "text/csv; charset=utf-8" : "application/json";
}

function filename(target: ReportExportTarget, generatedAt: string, format: ReportExportFormat) {
  const timestamp = generatedAt.replace(/[.:]/g, "-");

  return `${target}-${timestamp}.${extension(format)}`;
}

function compactFilters(filters?: HistoryArchiveFilters) {
  if (!filters) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ""),
  ) as HistoryArchiveFilters;
}

function exportFilters(target: ReportExportTarget, filters?: HistoryArchiveFilters) {
  const base = compactFilters(filters) ?? {};

  if (target === "approval_history") {
    return {
      ...base,
      module: "approvals" as const,
      type: "approval" as const,
    };
  }

  if (target === "audit_log") {
    return {
      ...base,
      module: "audit" as const,
      type: "audit" as const,
    };
  }

  return base;
}

function safeEventSummary(event: HistoryArchiveEvent, redactedFields: Set<string>) {
  if (event.type === "audit") {
    redactedFields.add("summary");

    return `Audit ${event.source.sourceType}: ${event.status ?? event.source.sourceId}.`;
  }

  if (event.id.startsWith("meeting-audit:")) {
    redactedFields.add("summary");

    return `Meeting ${event.source.sourceLabel ?? event.source.sourceId}: ${event.status ?? "updated"}.`;
  }

  return event.summary;
}

function sanitizeMetadata(
  metadata: HistoryArchiveEvent["source"]["metadata"],
  redactedFields: Set<string>,
) {
  if (!metadata) {
    return undefined;
  }

  const entries = Object.entries(metadata).filter(([key]) => {
    if (safeHistoryMetadataKeys.has(key)) {
      return true;
    }

    redactedFields.add(key);
    return false;
  });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function sanitizeHistoryEvent(event: HistoryArchiveEvent, redactedFields: Set<string>) {
  return {
    actorId: event.actorId,
    id: event.id,
    module: event.module,
    occurredAt: event.occurredAt,
    scope: event.scope,
    severity: event.severity,
    source: {
      metadata: sanitizeMetadata(event.source.metadata, redactedFields),
      sourceId: event.source.sourceId,
      sourceLabel: event.source.sourceLabel,
      sourceType: event.source.sourceType,
    },
    status: event.status,
    summary: safeEventSummary(event, redactedFields),
    type: event.type,
  };
}

function sanitizeDashboardValue(
  value: unknown,
  redactedFields: Set<string>,
  financeDenied = false,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) =>
      sanitizeDashboardValue(item, redactedFields, financeDenied),
    );
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;
  const nestedFinanceDenied =
    financeDenied ||
    record.financialAccess === "no_permission" ||
    record.state === "no_permission";
  const sanitized: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(record)) {
    if (forbiddenExportKeys.has(key)) {
      redactedFields.add(key);
      continue;
    }

    if (nestedFinanceDenied && financeDeniedKeys.has(key)) {
      redactedFields.add(key);
      continue;
    }

    if (key === "financialSummary" && typeof nestedValue === "object" && nestedValue) {
      const summary = nestedValue as Record<string, unknown>;

      if (summary.state === "no_permission") {
        redactedFields.add("financialSummary");
        sanitized[key] = {
          reason: summary.reason,
          state: "no_permission",
        };
        continue;
      }
    }

    sanitized[key] = sanitizeDashboardValue(
      nestedValue,
      redactedFields,
      nestedFinanceDenied,
    );
  }

  return sanitized;
}

function isActiveFilter(value: unknown) {
  return value !== undefined && value !== "" && value !== "all";
}

function dashboardModuleForSource(sourceType?: string): HistoryArchiveFilters["module"] {
  if (sourceType === "proposal" || sourceType === "leadership_approval" || sourceType === "executive_action") {
    return "approvals";
  }

  if (sourceType === "meeting") {
    return "meetings";
  }

  if (sourceType === "decision") {
    return "decisions";
  }

  if (sourceType === "project" || sourceType === "risk") {
    return "reports";
  }

  return undefined;
}

function dashboardTypeForSource(sourceType?: string): HistoryArchiveFilters["type"] {
  if (sourceType === "proposal" || sourceType === "leadership_approval" || sourceType === "executive_action") {
    return "approval";
  }

  if (sourceType === "meeting") {
    return "meeting";
  }

  if (sourceType === "decision") {
    return "decision";
  }

  return undefined;
}

function dashboardSeverity(item: DashboardExportItem): HistoryArchiveFilters["severity"] {
  const severity = item.severity ?? item.riskLevel;

  if (severity === "critical" || severity === "high") {
    return "critical";
  }

  if (severity === "medium" || item.tone === "amber" || item.tone === "purple") {
    return "warning";
  }

  if (item.tone === "red") {
    return "critical";
  }

  return "info";
}

function dashboardItemDate(item: DashboardExportItem) {
  return item.decidedAt ?? item.deadline;
}

function dateBefore(value: string | undefined, boundary: string) {
  if (!value) {
    return true;
  }

  return new Date(value).getTime() < new Date(boundary).getTime();
}

function dateAfter(value: string | undefined, boundary: string) {
  if (!value) {
    return true;
  }

  return new Date(value).getTime() > new Date(boundary).getTime();
}

function dashboardQueryText(item: DashboardExportItem) {
  return [
    item.categoryKey,
    item.categoryLabel,
    item.id,
    item.owner,
    item.ownerId,
    item.priority,
    item.projectId,
    item.reason,
    item.riskLevel,
    item.severity,
    item.sourceId,
    item.sourceType,
    item.status,
    item.title,
    item.tone,
  ]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ")
    .toLowerCase();
}

function dashboardItemMatchesFilters(
  item: DashboardExportItem,
  filters: HistoryArchiveFilters,
  options: {
    ignoreActor?: boolean;
    ignoreDate?: boolean;
    ignoreProject?: boolean;
    ignoreStatus?: boolean;
  } = {},
) {
  if (
    !options.ignoreProject &&
    isActiveFilter(filters.projectId) &&
    item.projectId !== filters.projectId
  ) {
    return false;
  }

  if (isActiveFilter(filters.module) && dashboardModuleForSource(item.sourceType) !== filters.module) {
    return false;
  }

  if (isActiveFilter(filters.type) && dashboardTypeForSource(item.sourceType) !== filters.type) {
    return false;
  }

  if (
    !options.ignoreActor &&
    isActiveFilter(filters.actorId) &&
    ![item.owner, item.ownerId, item.decidedBy].includes(filters.actorId)
  ) {
    return false;
  }

  if (
    !options.ignoreStatus &&
    isActiveFilter(filters.status) &&
    item.status !== filters.status &&
    item.tone !== filters.status
  ) {
    return false;
  }

  if (isActiveFilter(filters.severity) && dashboardSeverity(item) !== filters.severity) {
    return false;
  }

  const itemDate = dashboardItemDate(item);

  if (!options.ignoreDate && filters.dateFrom && dateBefore(itemDate, filters.dateFrom)) {
    return false;
  }

  if (!options.ignoreDate && filters.dateTo && dateAfter(itemDate, filters.dateTo)) {
    return false;
  }

  if (filters.query && !dashboardQueryText(item).includes(filters.query.toLowerCase())) {
    return false;
  }

  return true;
}

function dashboardEntries(data: ExecutiveDashboardData): DashboardExportEntry[] {
  return [
    ...data.projectPortfolio.items.map((item) => ({
      item,
      key: `projectPortfolio:${item.id}`,
    })),
    ...data.approvalSummary.items.map((item) => ({
      item,
      key: `approvalSummary:${item.id}`,
    })),
    ...data.riskSummary.items.map((item) => ({
      item,
      key: `riskSummary:${item.id}`,
    })),
    ...data.todayDeadlines.items.map((item) => ({
      item,
      key: `todayDeadlines:${item.id}`,
    })),
    ...data.recentDecisions.items.map((item) => ({
      item,
      key: `recentDecisions:${item.id}`,
    })),
    ...data.meetingSnapshot.items.map((item) => ({
      item,
      key: `meetingSnapshot:${item.id}`,
    })),
  ];
}

function includedDashboardKeys(data: ExecutiveDashboardData, filters?: HistoryArchiveFilters) {
  if (!filters) {
    return undefined;
  }

  const matchedEntries = dashboardEntries(data).filter(({ item }) =>
    dashboardItemMatchesFilters(item, filters),
  );
  const limitedEntries = filters.limit ? matchedEntries.slice(0, filters.limit) : matchedEntries;

  return new Set(limitedEntries.map((entry) => entry.key));
}

function filterDashboardSection<TItem extends DashboardExportItem>(
  section: string,
  items: TItem[],
  keys?: Set<string>,
) {
  if (!keys) {
    return items;
  }

  return items.filter((item) => keys.has(`${section}:${item.id}`));
}

function countDeadlineItems(items: DashboardExportItem[], generatedAt: string, mode: "overdue" | "today") {
  const generatedDate = new Date(generatedAt);

  return items.filter((item) => {
    if (!item.deadline) {
      return false;
    }

    const itemDate = new Date(item.deadline);

    if (Number.isNaN(itemDate.getTime()) || Number.isNaN(generatedDate.getTime())) {
      return false;
    }

    if (mode === "overdue") {
      return itemDate.getTime() < generatedDate.getTime();
    }

    return itemDate.toISOString().slice(0, 10) === generatedDate.toISOString().slice(0, 10);
  });
}

function dashboardProjectPortfolio(
  portfolio: ExecutiveDashboardData["projectPortfolio"],
  items: ExecutiveDashboardData["projectPortfolio"]["items"],
) {
  return {
    ...portfolio,
    active: items.filter((item) => item.status !== "archived").length,
    green: items.filter((item) => item.health === "green").length,
    items,
    red: items.filter((item) => item.health === "red").length,
    total: items.length,
    yellow: items.filter((item) => item.health === "yellow").length,
  };
}

function dashboardApprovalSummary(
  summary: ExecutiveDashboardData["approvalSummary"],
  items: ExecutiveDashboardData["approvalSummary"]["items"],
) {
  return {
    ...summary,
    highRisk: items.filter((item) =>
      item.riskLevel === "high" || item.riskLevel === "critical" || item.priority === "high",
    ).length,
    items,
    overdue: items.filter((item) => item.overdue?.isOverdue).length,
    pending: items.length,
  };
}

function dashboardRiskSummary(
  summary: ExecutiveDashboardData["riskSummary"],
  items: ExecutiveDashboardData["riskSummary"]["items"],
) {
  const byCategory = items.reduce<Record<string, number>>((result, item) => {
    result[item.categoryLabel] = (result[item.categoryLabel] ?? 0) + 1;

    return result;
  }, {});
  const itemIds = new Set(items.map((item) => item.sourceId));
  const categoryKeys = new Set(items.map((item) => item.categoryKey));
  const categories = summary.riskMap.categories
    .filter((category) => categoryKeys.has(category.categoryKey))
    .map((category) => {
      const categoryItems = items.filter((item) => item.categoryKey === category.categoryKey);

      return {
        ...category,
        affectedProjectCount: new Set(categoryItems.map((item) => item.projectId).filter(Boolean)).size,
        count: categoryItems.length,
      };
    });
  const matrix = summary.riskMap.matrix
    .map((cell) => {
      const riskIds = cell.riskIds.filter((riskId) => itemIds.has(riskId));

      return {
        ...cell,
        count: riskIds.length,
        riskIds,
      };
    })
    .filter((cell) => cell.count > 0);

  return {
    ...summary,
    byCategory,
    critical: items.filter((item) => item.severity === "critical").length,
    high: items.filter((item) => item.severity === "high").length,
    items,
    riskMap: {
      ...summary.riskMap,
      affectedProjectCount: new Set(items.map((item) => item.projectId).filter(Boolean)).size,
      categories,
      matrix,
      total: items.length,
    },
  };
}

function dashboardDeadlineSummary(
  summary: ExecutiveDashboardData["todayDeadlines"],
  items: ExecutiveDashboardData["todayDeadlines"]["items"],
  generatedAt: string,
) {
  return {
    ...summary,
    items,
    overdue: countDeadlineItems(items, generatedAt, "overdue").length,
    today: countDeadlineItems(items, generatedAt, "today").length,
  };
}

function dashboardMeetingSnapshot(
  summary: ExecutiveDashboardData["meetingSnapshot"],
  items: ExecutiveDashboardData["meetingSnapshot"]["items"],
  generatedAt: string,
) {
  return {
    ...summary,
    followUpsOverdue: countDeadlineItems(items, generatedAt, "overdue").length,
    items,
    today: countDeadlineItems(items, generatedAt, "today").length,
    total: items.length,
    upcoming: items.filter((item) => item.deadline && dateAfter(item.deadline, generatedAt)).length,
  };
}

function dashboardSourceCounts(data: ExecutiveDashboardData): ExecutiveDashboardData["sourceCounts"] {
  const executiveActionIds = new Set(
    [
      ...data.approvalSummary.items,
      ...data.todayDeadlines.items,
    ]
      .filter((item) => item.sourceType === "executive_action")
      .map((item) => item.sourceId),
  );

  return {
    decisions: data.recentDecisions.items.length,
    executiveActions: executiveActionIds.size,
    leadershipApprovals: data.approvalSummary.items.filter(
      (item) => item.sourceType === "leadership_approval",
    ).length,
    meetings: data.meetingSnapshot.items.length,
    projects: data.projectPortfolio.items.length,
    proposals: data.approvalSummary.items.filter((item) => item.sourceType === "proposal").length,
  };
}

function dashboardKpis(data: ExecutiveDashboardData, filters?: HistoryArchiveFilters) {
  const valuesById = new Map<string, number | string>([
    ["project-portfolio", data.projectPortfolio.total],
    ["project-health-red", data.projectPortfolio.red],
    ["pending-approvals", data.approvalSummary.pending],
    ["high-risks", data.riskSummary.high + data.riskSummary.critical],
    ["today-deadlines", data.todayDeadlines.today + data.todayDeadlines.overdue],
  ]);
  const kpis = data.kpis.map((item) => ({
    ...item,
    value: valuesById.get(item.id) ?? item.value,
  }));

  if (!filters) {
    return kpis;
  }

  return kpis.filter((item) =>
    dashboardItemMatchesFilters(item, filters, {
      ignoreActor: true,
      ignoreDate: true,
      ignoreProject: true,
      ignoreStatus: true,
    }),
  );
}

function applyDashboardFilters(
  data: ExecutiveDashboardData,
  filters: HistoryArchiveFilters | undefined,
) {
  const keys = includedDashboardKeys(data, filters);
  const projectPortfolio = dashboardProjectPortfolio(
    data.projectPortfolio,
    filterDashboardSection("projectPortfolio", data.projectPortfolio.items, keys),
  );
  const approvalSummary = dashboardApprovalSummary(
    data.approvalSummary,
    filterDashboardSection("approvalSummary", data.approvalSummary.items, keys),
  );
  const riskSummary = dashboardRiskSummary(
    data.riskSummary,
    filterDashboardSection("riskSummary", data.riskSummary.items, keys),
  );
  const todayDeadlines = dashboardDeadlineSummary(
    data.todayDeadlines,
    filterDashboardSection("todayDeadlines", data.todayDeadlines.items, keys),
    data.generatedAt,
  );
  const recentDecisions = {
    ...data.recentDecisions,
    items: filterDashboardSection("recentDecisions", data.recentDecisions.items, keys),
  };
  const meetingSnapshot = dashboardMeetingSnapshot(
    data.meetingSnapshot,
    filterDashboardSection("meetingSnapshot", data.meetingSnapshot.items, keys),
    data.generatedAt,
  );
  const filteredData: ExecutiveDashboardData = {
    ...data,
    approvalSummary,
    meetingSnapshot,
    projectPortfolio,
    recentDecisions,
    riskSummary,
    todayDeadlines,
  };

  filteredData.sourceCounts = dashboardSourceCounts(filteredData);
  filteredData.kpis = dashboardKpis(filteredData, filters);

  return filteredData;
}

function dashboardItemCount(data: ExecutiveDashboardData) {
  return Object.values(data.sourceCounts).reduce((total, count) => total + count, 0);
}

function dashboardSensitiveIncluded(data: ExecutiveDashboardData) {
  return data.financialSummary.state === "allowed" && data.financialSummary.visibleRecordCount > 0;
}

function serializeJson(input: {
  data?: unknown;
  exportId: string;
  filters?: HistoryArchiveFilters;
  format: ReportExportFormat;
  generatedAt: string;
  items?: Array<Record<string, unknown>>;
  scopeId?: string;
  target: ReportExportTarget;
}) {
  return JSON.stringify({
    data: input.data,
    exportId: input.exportId,
    filters: input.filters,
    format: input.format,
    generatedAt: input.generatedAt,
    items: input.items,
    scopeId: input.scopeId,
    target: input.target,
  });
}

function csvEscape(value: unknown) {
  if (value === undefined || value === null) {
    return "";
  }

  const rawText =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  const text = /^[\s]*[=+\-@]/.test(rawText) ? `'${rawText}` : rawText;

  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function rowsFromDashboard(data: unknown) {
  const record = data as ExecutiveDashboardData;
  const rows: Array<Record<string, unknown>> = [
    ...record.kpis.map((item) => ({
      id: item.id,
      label: item.label,
      sourceType: item.sourceType ?? "kpi",
      status: item.tone,
      value: item.value,
    })),
    ...record.projectPortfolio.items.map((item) => ({
      id: item.id,
      projectId: item.projectId,
      sourceId: item.sourceId,
      sourceType: item.sourceType,
      status: item.status,
      title: item.title,
    })),
    ...record.approvalSummary.items.map((item) => ({
      id: item.id,
      projectId: item.projectId,
      sourceId: item.sourceId,
      sourceType: item.sourceType,
      status: item.status,
      title: item.title,
    })),
    ...record.riskSummary.items.map((item) => ({
      id: item.id,
      projectId: item.projectId,
      severity: item.severity,
      sourceId: item.sourceId,
      sourceType: item.sourceType,
      status: item.status,
      title: item.title,
    })),
    ...record.todayDeadlines.items.map((item) => ({
      deadline: item.deadline,
      id: item.id,
      projectId: item.projectId,
      sourceId: item.sourceId,
      sourceType: item.sourceType,
      status: item.status,
      title: item.title,
    })),
    ...record.recentDecisions.items.map((item) => ({
      decidedAt: item.decidedAt,
      id: item.id,
      projectId: item.projectId,
      sourceId: item.sourceId,
      sourceType: item.sourceType,
      status: item.status,
      title: item.title,
    })),
    ...record.meetingSnapshot.items.map((item) => ({
      deadline: item.deadline,
      id: item.id,
      projectId: item.projectId,
      sourceId: item.sourceId,
      sourceType: item.sourceType,
      status: item.status,
      title: item.title,
    })),
  ];

  return rows;
}

function serializeCsv(target: ReportExportTarget, source: ExportSource) {
  const rows = "items" in source
    ? source.items
    : rowsFromDashboard(source.data);
  const headers = [
    ...new Set(rows.flatMap((row) => Object.keys(row))),
  ];

  if (headers.length === 0) {
    return "";
  }

  return [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
}

async function loadExportSource(input: {
  generatedAt: string;
  options: ReportExportServiceOptions;
  redactedFields: Set<string>;
  request: ReportExportRequest;
  rolePermissionCatalog: RolePermissionCatalog;
  scopeAssignments: ScopeAssignment[];
  user: PermissionUser;
}): Promise<ExportSource> {
  if (input.request.target === "dashboard") {
    const loader = input.options.dashboardLoader ?? getExecutiveDashboardData;
    const rawData = await loader(input.user, {
      rolePermissionCatalog: input.rolePermissionCatalog,
      scopeAssignments: input.scopeAssignments,
      selectedScopeId: input.request.scopeId,
    });
    const sanitizedData = sanitizeDashboardValue(rawData, input.redactedFields) as ExecutiveDashboardData;
    const data = applyDashboardFilters(sanitizedData, input.request.filters);
    const itemCount = dashboardItemCount(data);

    return {
      data,
      itemCount,
      redactedFields: [...input.redactedFields],
      sensitiveIncluded: dashboardSensitiveIncluded(data),
      total: itemCount,
    };
  }

  const loader = input.options.historyArchiveLoader ?? getHistoryArchiveData;
  const filters = exportFilters(input.request.target, input.request.filters);
  const archive = await loader(input.user, filters, {
    ...input.options.historyArchiveDependencies,
    now: () => input.generatedAt,
    rolePermissionCatalog: input.rolePermissionCatalog,
    scopeAssignments: input.scopeAssignments,
  });
  const items = archive.items.map((item) =>
    sanitizeHistoryEvent(item, input.redactedFields),
  );

  return {
    itemCount: items.length,
    items,
    redactedFields: [...input.redactedFields],
    sensitiveIncluded: false,
    total: archive.total,
  };
}

function buildContent(input: {
  exportId: string;
  filters?: HistoryArchiveFilters;
  format: ReportExportFormat;
  generatedAt: string;
  request: ReportExportRequest;
  source: ExportSource;
}) {
  if (input.format === "csv") {
    return serializeCsv(input.request.target, input.source);
  }

  return serializeJson({
    data: "data" in input.source ? input.source.data : undefined,
    exportId: input.exportId,
    filters: input.filters,
    format: input.format,
    generatedAt: input.generatedAt,
    items: "items" in input.source ? input.source.items : undefined,
    scopeId: input.request.scopeId,
    target: input.request.target,
  });
}

export async function exportReportData(
  user: PermissionUser,
  request: ReportExportRequest,
  options: ReportExportServiceOptions = {},
): Promise<ReportExportResult> {
  const parsedRequest = reportExportRequestSchema.parse(request) as ReportExportRequest;
  const scopeContext = await resolveScopeContext(options);
  const hasDirectExport = can(user, "report.export");
  const exportScopeAssignments = scopeAssignmentsForRequest({
    directGrant: hasDirectExport,
    scopeAssignments: scopeContext.scopeAssignments,
    scopeId: parsedRequest.scopeId,
    user,
  });
  const canExport =
    hasDirectExport ||
    scopedPermission({
      action: "report.export",
      rolePermissionCatalog: scopeContext.rolePermissionCatalog,
      scopeAssignments: exportScopeAssignments,
      user,
    });

  if (!canExport) {
    throw new Error("Ban khong co quyen xuat du lieu.");
  }

  if (
    parsedRequest.target === "audit_log" &&
    !(
      can(user, "audit.view") ||
      scopedPermission({
        action: "audit.view",
        rolePermissionCatalog: scopeContext.rolePermissionCatalog,
        scopeAssignments: exportScopeAssignments,
        user,
      })
    )
  ) {
    throw new Error("Ban khong co quyen xuat audit log.");
  }

  const generatedAt = (options.now ?? timestampNow)();
  const exportId = (options.idGenerator ?? randomUUID)();
  const redactedFields = new Set<string>();
  const filters = parsedRequest.target === "dashboard"
    ? compactFilters(parsedRequest.filters)
    : exportFilters(parsedRequest.target, parsedRequest.filters);
  const source = await loadExportSource({
    generatedAt,
    options,
    redactedFields,
    request: parsedRequest,
    rolePermissionCatalog: scopeContext.rolePermissionCatalog,
    scopeAssignments: exportScopeAssignments,
    user,
  });
  const summary: ReportExportSummary = {
    exportId,
    filters,
    format: parsedRequest.format,
    itemCount: source.itemCount,
    redactedFields: [...redactedFields].sort(),
    scopeId: parsedRequest.scopeId,
    sensitiveIncluded: source.sensitiveIncluded,
    target: parsedRequest.target,
    total: source.total,
  };
  const result: ReportExportResult = {
    content: buildContent({
      exportId,
      filters,
      format: parsedRequest.format,
      generatedAt,
      request: parsedRequest,
      source,
    }),
    exportId,
    filename: filename(parsedRequest.target, generatedAt, parsedRequest.format),
    format: parsedRequest.format,
    generatedAt,
    mimeType: mimeType(parsedRequest.format),
    summary,
    target: parsedRequest.target,
  };

  await (options.auditWriter ?? createAuditLog)({
    actorId: user.id,
    entityId: exportId,
    entityType: "report_export",
    action: "report.export",
    newValue: summary,
  });

  return result;
}
