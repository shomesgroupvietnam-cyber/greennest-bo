import type {
  ExecutiveRiskItem,
  ExecutiveRiskLikelihood,
  ExecutiveRiskMap,
  ExecutiveRiskMapCategorySummary,
  ExecutiveRiskMatrixCell,
} from "@/modules/dashboard/types";
import { createDefaultPolicySettings } from "@/modules/settings/services/policy-settings-repository";
import type { RiskGroupConfig } from "@/modules/settings/types";

import type {
  ApprovalEscalationState,
  ApprovalOverdueState,
  ExecutiveLeadershipActionItem,
  ExecutiveRiskRecord,
  ExecutiveRiskCategory,
  ExecutiveRiskGroupMetadata,
  ExecutiveRiskLevel,
  NormalizedRiskLevel,
  RiskCategoryMetadata,
  RiskSignalPermissionState,
  RiskSignalSourceType,
  RiskStatusKey,
  RiskStatusSourceData,
  RiskStatusSuggestion,
} from "../types";

type RiskGroupInput = RiskGroupConfig | ExecutiveRiskGroupMetadata;

type RiskStatusSignal = {
  sourceType: RiskSignalSourceType;
  sourceId: string;
  projectId?: string;
  status?: string;
  severity?: string;
  title?: string;
  reason?: string;
  href?: string;
  permissionState?: RiskSignalPermissionState;
  tone?: string;
  dueGroup?: string;
};

type BuildRiskStatusSuggestionInput = {
  riskLevel?: string;
  categoryKey?: string;
  generatedAt?: string;
  sources?: RiskStatusSignal[];
  status?: string;
  tone?: string;
  dueGroup?: string;
};

type BuildExecutiveRiskItemInput = {
  action: ExecutiveLeadershipActionItem;
  generatedAt?: string;
  riskGroups?: readonly RiskGroupInput[];
};

type BuildExecutiveRiskItemFromRecordInput = {
  escalation?: ApprovalEscalationState;
  overdue?: ApprovalOverdueState;
  record: ExecutiveRiskRecord;
  generatedAt?: string;
  riskGroups?: readonly RiskGroupInput[];
};

const riskLevelLabels = {
  critical: "Nghiêm trọng",
  high: "Cao",
  low: "Thấp",
  medium: "Trung bình",
} satisfies Record<ExecutiveRiskLevel, string>;

const riskLevelTones = {
  critical: "red",
  high: "red",
  low: "emerald",
  medium: "amber",
} satisfies Record<ExecutiveRiskLevel, NormalizedRiskLevel["tone"]>;

const riskStatusLabels = {
  green: "Xanh",
  red: "Đỏ",
  yellow: "Vàng",
} satisfies Record<RiskStatusKey, string>;

const riskLikelihoodLabels = {
  high: "Khả năng cao",
  low: "Khả năng thấp",
  medium: "Khả năng trung bình",
} satisfies Record<ExecutiveRiskLikelihood, string>;

const riskLevelKeys = new Set<ExecutiveRiskLevel>([
  "critical",
  "high",
  "low",
  "medium",
]);

const likelihoodOrder: ExecutiveRiskLikelihood[] = ["high", "medium", "low"];
const impactOrder: ExecutiveRiskLevel[] = ["critical", "high", "medium", "low"];

const legacyCategoryGroupMap = {
  approval_risk: "approval",
  cashflow_risk: "finance",
  compliance_risk: "system_permission",
  contractor_risk: "operation",
  cost_overrun_risk: "finance",
  delay_risk: "schedule",
  land_risk: "planning_technical",
  legal_risk: "legal",
  material_risk: "finance",
  operational_risk: "operation",
  permission_risk: "system_permission",
  planning_risk: "planning_technical",
  quality_risk: "planning_technical",
  safety_risk: "operation",
  schedule_risk: "schedule",
  system_risk: "system_permission",
} satisfies Record<ExecutiveRiskCategory, string>;

const defaultAsciiCategoryLabels: Record<string, string> = {
  approval: "Approval",
  finance: "Tai chinh",
  legal: "Phap ly",
  missing_document: "Ho so thieu",
  operation: "Van hanh / phoi hop",
  planning_technical: "Quy hoach / ky thuat",
  schedule: "Tien do",
  system_permission: "He thong / phan quyen",
};

const defaultVietnameseCategoryLabels: Record<string, string> = {
  approval: "Phê duyệt",
  finance: "Tài chính",
  legal: "Pháp lý",
  missing_document: "Hồ sơ thiếu",
  operation: "Vận hành / phối hợp",
  planning_technical: "Quy hoạch / kỹ thuật",
  schedule: "Tiến độ",
  system_permission: "Hệ thống / phân quyền",
};

const urgentHighRiskCategories = new Set(["finance", "legal", "planning_technical"]);

function isRiskLevel(value: string | undefined): value is ExecutiveRiskLevel {
  return Boolean(value && riskLevelKeys.has(value as ExecutiveRiskLevel));
}

function groupKey(group: RiskGroupInput) {
  return "riskKey" in group ? group.riskKey : group.key;
}

function groupLabel(group: RiskGroupInput) {
  const key = groupKey(group);
  const label = "labelVi" in group ? group.labelVi : group.label;

  return label === defaultAsciiCategoryLabels[key]
    ? defaultVietnameseCategoryLabels[key] ?? label
    : label;
}

function groupIsActive(group: RiskGroupInput) {
  return "active" in group ? group.active : true;
}

function toCategoryMetadata(group: RiskGroupInput): RiskCategoryMetadata {
  return {
    defaultSeverity: group.defaultSeverity,
    description: group.description,
    id: group.id,
    isDefault: group.isDefault,
    key: groupKey(group),
    label: groupLabel(group),
    moduleId: group.moduleId,
    sortOrder: group.sortOrder,
  };
}

function fallbackGroups(): RiskCategoryMetadata[] {
  return createDefaultPolicySettings().riskGroups
    .filter((group) => group.active)
    .map(toCategoryMetadata);
}

function resolveGroups(groups: readonly RiskGroupInput[] | undefined) {
  const configured = (groups ?? [])
    .filter(groupIsActive)
    .map(toCategoryMetadata)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.key.localeCompare(right.key));

  return configured.length > 0 ? configured : fallbackGroups();
}

function safeText(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const sanitized = value
    .replace(/\b\d[\d\s.,_]*(?:VND|VNĐ|vnd|vnđ)?\b/g, "[ẩn số liệu]")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized.length > 0 ? sanitized : undefined;
}

function safeInternalHref(href: string | undefined) {
  if (!href || !href.startsWith("/") || href.startsWith("//")) {
    return undefined;
  }

  return href;
}

function sanitizeSourceData(source: RiskStatusSignal): RiskStatusSourceData {
  const severity = isRiskLevel(source.severity) ? source.severity : "medium";

  return {
    href: safeInternalHref(source.href),
    permissionState: source.permissionState,
    projectId: source.projectId,
    reason: safeText(source.reason) ?? "Khong co ly do nguon an toan.",
    severity,
    sourceId: source.sourceId,
    sourceType: source.sourceType,
    status: source.status,
    title: safeText(source.title) ?? source.sourceId,
  };
}

function sourceHasRedSignal(source: RiskStatusSignal) {
  return (
    source.severity === "critical" ||
    source.status === "blocked" ||
    source.status === "overdue" ||
    source.tone === "red" ||
    source.dueGroup === "overdue"
  );
}

function sourceHasYellowSignal(source: RiskStatusSignal) {
  return (
    source.severity === "high" ||
    source.severity === "medium" ||
    source.status === "pending" ||
    source.status === "in_progress" ||
    source.tone === "amber" ||
    source.dueGroup === "today"
  );
}

function statusReason(status: RiskStatusKey, riskLevel: ExecutiveRiskLevel) {
  if (status === "red") {
    return `Gợi ý đỏ vì risk level ${riskLevel} hoặc nguồn đang quá hạn/bị chặn.`;
  }

  if (status === "yellow") {
    return `Gợi ý vàng vì risk level ${riskLevel} cần theo dõi.`;
  }

  return `Gợi ý xanh vì risk level ${riskLevel} chưa có tín hiệu quá hạn hoặc bị chặn.`;
}

function toneFromRiskStatus(status: RiskStatusKey) {
  if (status === "red") {
    return "red";
  }

  if (status === "yellow") {
    return "amber";
  }

  return "emerald";
}

function normalizeRiskLikelihood(input: {
  dueGroup?: string;
  status?: string;
  statusSuggestion: RiskStatusSuggestion;
  tone?: string;
}): { key: ExecutiveRiskLikelihood; label: string } {
  const highSignal =
    input.statusSuggestion.status === "red" ||
    input.status === "blocked" ||
    input.status === "overdue" ||
    input.dueGroup === "overdue" ||
    input.tone === "red";

  if (highSignal) {
    return {
      key: "high",
      label: riskLikelihoodLabels.high,
    };
  }

  const mediumSignal =
    input.statusSuggestion.status === "yellow" ||
    input.dueGroup === "today" ||
    input.dueGroup === "this_week" ||
    input.status === "pending" ||
    input.status === "in_progress" ||
    input.status === "high_risk" ||
    input.tone === "amber";

  if (mediumSignal) {
    return {
      key: "medium",
      label: riskLikelihoodLabels.medium,
    };
  }

  return {
    key: "low",
    label: riskLikelihoodLabels.low,
  };
}

function createEmptyStatusCounts(): Record<RiskStatusKey, number> {
  return {
    green: 0,
    red: 0,
    yellow: 0,
  };
}

function createEmptyRiskMap(): ExecutiveRiskMap {
  return {
    affectedProjectCount: 0,
    categories: [],
    matrix: [],
    total: 0,
  };
}

function addUnique(target: string[], value: string | undefined) {
  if (value && !target.includes(value)) {
    target.push(value);
  }
}

function nearestDeadline(
  current: string | undefined,
  candidate: string | undefined,
) {
  if (!candidate) {
    return current;
  }

  if (!current || candidate.localeCompare(current) < 0) {
    return candidate;
  }

  return current;
}

function compareMatrixCells(
  left: ExecutiveRiskMatrixCell,
  right: ExecutiveRiskMatrixCell,
) {
  return (
    likelihoodOrder.indexOf(left.likelihood) -
      likelihoodOrder.indexOf(right.likelihood) ||
    impactOrder.indexOf(left.impact) - impactOrder.indexOf(right.impact)
  );
}

export function normalizeRiskLevel(
  value: string | undefined,
  fallback: ExecutiveRiskLevel = "medium",
): NormalizedRiskLevel {
  const key = isRiskLevel(value) ? value : fallback;

  return {
    key,
    labelVi: riskLevelLabels[key],
    tone: riskLevelTones[key],
  };
}

export function mapRiskCategoryToConfiguredGroup(
  category: ExecutiveRiskCategory | string | undefined,
  riskGroups?: readonly RiskGroupInput[],
): RiskCategoryMetadata {
  const groups = resolveGroups(riskGroups);
  const mappedKey = category
    ? legacyCategoryGroupMap[category as ExecutiveRiskCategory] ?? category
    : "operation";
  const directMatch = groups.find((group) => group.key === mappedKey);

  if (directMatch) {
    return directMatch;
  }

  return (
    groups.find((group) => group.key === "operation") ??
    groups[0] ?? {
      defaultSeverity: "medium",
      id: "risk-group-operation",
      isDefault: true,
      key: "operation",
      label: defaultVietnameseCategoryLabels.operation,
      moduleId: "project",
      sortOrder: 100,
    }
  );
}

export function buildRiskStatusSuggestion(
  input: BuildRiskStatusSuggestionInput,
): RiskStatusSuggestion {
  const normalizedLevel = normalizeRiskLevel(input.riskLevel);
  const sources = input.sources ?? [];
  const isUrgentHighCategory =
    normalizedLevel.key === "high" &&
    Boolean(input.categoryKey && urgentHighRiskCategories.has(input.categoryKey));
  const redSignal =
    normalizedLevel.key === "critical" ||
    isUrgentHighCategory ||
    input.status === "blocked" ||
    input.status === "overdue" ||
    input.tone === "red" ||
    input.dueGroup === "overdue" ||
    sources.some(sourceHasRedSignal);
  const yellowSignal =
    normalizedLevel.key === "high" ||
    normalizedLevel.key === "medium" ||
    input.tone === "amber" ||
    input.dueGroup === "today" ||
    sources.some(sourceHasYellowSignal);
  const status: RiskStatusKey = redSignal ? "red" : yellowSignal ? "yellow" : "green";

  return {
    confirmationState: "suggested",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    labelVi: riskStatusLabels[status],
    reason: statusReason(status, normalizedLevel.key),
    sourceData: sources.map(sanitizeSourceData),
    status,
  };
}

export function buildExecutiveRiskItem({
  action,
  generatedAt,
  riskGroups,
}: BuildExecutiveRiskItemInput): ExecutiveRiskItem {
  const severity = normalizeRiskLevel(action.riskLevel);
  const category = mapRiskCategoryToConfiguredGroup(action.riskCategory, riskGroups);
  const statusSuggestion = buildRiskStatusSuggestion({
    categoryKey: category.key,
    dueGroup: action.dueGroup,
    generatedAt,
    riskLevel: severity.key,
    sources: [
      {
        dueGroup: action.dueGroup,
        href: action.href,
        permissionState: "allowed",
        projectId: action.projectId,
        reason: action.impactSummary,
        severity: severity.key,
        sourceId: action.id,
        sourceType: "risk",
        status: action.status,
        title: action.title,
        tone: action.tone,
      },
    ],
    status: action.status,
    tone: action.tone,
  });
  const likelihood = normalizeRiskLikelihood({
    dueGroup: action.dueGroup,
    status: action.status,
    statusSuggestion,
    tone: action.tone,
  });
  const safeReason = safeText(action.impactSummary);
  const safeTitle = safeText(action.title) ?? action.id;
  const nextAction = safeText(action.decisionRequired) ?? statusSuggestion.reason;

  return {
    category: category.key,
    categoryKey: category.key,
    categoryLabel: category.label,
    deadline: action.deadline,
    href: action.href,
    id: `risk-${action.id}`,
    impact: severity.key,
    impactLabel: severity.labelVi,
    likelihood: likelihood.key,
    likelihoodLabel: likelihood.label,
    matrixCellLabel: `${likelihood.label} x ${severity.labelVi}`,
    moduleId: action.moduleId,
    nextAction,
    owner: action.ownerName,
    ownerId: action.ownerName,
    projectId: action.projectId,
    reason: safeReason,
    severity: severity.key,
    severityLabel: severity.labelVi,
    sourceId: action.id,
    sourceType: "risk",
    status: action.status,
    statusSuggestion,
    title: safeTitle,
    tone: statusSuggestion.status === "red" ? "red" : action.tone,
  };
}

export function buildExecutiveRiskItemFromRecord({
  escalation,
  generatedAt,
  overdue,
  record,
  riskGroups,
}: BuildExecutiveRiskItemFromRecordInput): ExecutiveRiskItem {
  const severity = normalizeRiskLevel(record.level);
  const category = mapRiskCategoryToConfiguredGroup(record.categoryKey, riskGroups);
  const sourceTone = record.status === "blocked" ? "red" : undefined;
  const overdueSignal: RiskStatusSignal[] =
    overdue?.isOverdue
      ? [
          {
            dueGroup: "overdue",
            permissionState: "allowed",
            projectId: record.projectId,
            reason: overdue.reason,
            severity: overdue.severity === "critical" ? "critical" : severity.key,
            sourceId: record.id,
            sourceType: "risk",
            status: "overdue",
            title: record.title,
            tone: "red",
          },
        ]
      : [];
  const sourceSignals: RiskStatusSignal[] = [
    ...overdueSignal,
    {
      permissionState: "allowed",
      projectId: record.projectId,
      reason: record.reason,
      severity: severity.key,
      sourceId: record.sourceId ?? record.id,
      sourceType: record.sourceType ?? "risk",
      status: record.status,
      title: record.title,
      tone: sourceTone,
    },
  ];
  const suggestedStatus = buildRiskStatusSuggestion({
    categoryKey: category.key,
    generatedAt,
    riskLevel: severity.key,
    sources: sourceSignals,
    status: record.status,
    tone: sourceTone,
  });
  const manualStatus = record.statusOverride;
  const statusSuggestion: RiskStatusSuggestion = manualStatus
    ? {
        ...suggestedStatus,
        confirmationState:
          manualStatus === (record.statusOverrideSourceStatus ?? suggestedStatus.status)
            ? "confirmed"
            : "overridden",
        generatedAt: record.statusOverrideAt ?? suggestedStatus.generatedAt,
        labelVi: riskStatusLabels[manualStatus],
        reason: safeText(record.statusOverrideReason) ?? suggestedStatus.reason,
        status: manualStatus,
      }
    : suggestedStatus;
  const likelihood = normalizeRiskLikelihood({
    status: manualStatus ? undefined : record.status,
    statusSuggestion,
    tone: manualStatus ? undefined : sourceTone,
  });
  const safeReason = safeText(record.reason);
  const safeTitle = safeText(record.title) ?? record.id;
  const nextAction = safeText(record.nextAction) ?? statusSuggestion.reason;

  return {
    category: category.key,
    categoryKey: category.key,
    categoryLabel: category.label,
    deadline: record.deadline,
    escalation,
    id: `risk-record-${record.id}`,
    impact: severity.key,
    impactLabel: severity.labelVi,
    likelihood: likelihood.key,
    likelihoodLabel: likelihood.label,
    matrixCellLabel: `${likelihood.label} x ${severity.labelVi}`,
    moduleId: record.moduleId,
    nextAction,
    owner: record.ownerName ?? record.ownerId,
    ownerId: record.ownerId,
    overdue,
    projectId: record.projectId,
    reason: safeReason,
    severity: severity.key,
    severityLabel: severity.labelVi,
    sourceId: record.id,
    sourceType: "risk",
    status: record.status,
    statusSuggestion,
    title: safeTitle,
    tone: manualStatus
      ? toneFromRiskStatus(statusSuggestion.status)
      : statusSuggestion.status === "red" ? "red" : "amber",
  };
}

export function buildExecutiveRiskMap(items: ExecutiveRiskItem[]): ExecutiveRiskMap {
  if (!items.length) {
    return createEmptyRiskMap();
  }

  const affectedProjectIds: string[] = [];
  const categoriesByKey = new Map<
    string,
    ExecutiveRiskMapCategorySummary
  >();
  const matrixByKey = new Map<string, ExecutiveRiskMatrixCell>();

  for (const item of items) {
    addUnique(affectedProjectIds, item.projectId);

    const existingCategory = categoriesByKey.get(item.categoryKey);
    const category =
      existingCategory ??
      {
        affectedProjectCount: 0,
        affectedProjectIds: [],
        categoryKey: item.categoryKey,
        categoryLabel: item.categoryLabel,
        count: 0,
        critical: 0,
        high: 0,
        low: 0,
        medium: 0,
        owners: [],
        statusCounts: createEmptyStatusCounts(),
      };

    category.count += 1;
    category[item.severity] += 1;
    category.statusCounts[item.statusSuggestion.status] += 1;
    category.nearestDeadline = nearestDeadline(
      category.nearestDeadline,
      item.deadline,
    );
    addUnique(category.affectedProjectIds, item.projectId);
    addUnique(category.owners, item.owner);
    category.affectedProjectCount = category.affectedProjectIds.length;
    categoriesByKey.set(item.categoryKey, category);

    const matrixKey = `${item.likelihood}:${item.impact}`;
    const matrixCell =
      matrixByKey.get(matrixKey) ??
      {
        count: 0,
        impact: item.impact,
        impactLabel: item.impactLabel,
        likelihood: item.likelihood,
        likelihoodLabel: item.likelihoodLabel,
        riskIds: [],
      };

    matrixCell.count += 1;
    addUnique(matrixCell.riskIds, item.id);
    matrixByKey.set(matrixKey, matrixCell);
  }

  return {
    affectedProjectCount: affectedProjectIds.length,
    categories: Array.from(categoriesByKey.values())
      .map((category) => ({
        ...category,
        affectedProjectIds: category.affectedProjectIds.sort(),
        owners: category.owners.sort(),
      }))
      .sort(
        (left, right) =>
          right.count - left.count ||
          left.categoryLabel.localeCompare(right.categoryLabel),
      ),
    matrix: Array.from(matrixByKey.values())
      .map((cell) => ({
        ...cell,
        riskIds: cell.riskIds.sort(),
      }))
      .sort(compareMatrixCells),
    total: items.length,
  };
}
