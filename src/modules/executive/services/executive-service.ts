import type { PermissionUser } from "@/lib/permissions/can";
import { can } from "@/lib/permissions/can";
import {
  canAccessScopedAction,
  hasAnyScopedActionGrant,
} from "@/lib/permissions/access-scope";
import { resolveExecutiveAccess } from "@/modules/executive/constants";
import {
  aiLeadershipSummary,
  aiInsights,
  approvals,
  auditLog,
  authorityMatrix,
  commandCenterSnapshot,
  dashboardLayers,
  decisionLog,
  directives,
  executiveAxisDefinitions,
  executiveRoleDefinitions,
  executiveScopeRules,
  globalStatusItems,
  leadershipActionItems,
  leadershipTeam,
  meetings,
  notifications,
  organizations,
  overviewCards,
  progressSegments,
  projects,
  quickActions,
  schedule,
  strategicPlans,
  urgentItems,
  workspaceSwitchItems,
} from "@/modules/executive/mock-data/executive-mock-data";
import type {
  ExecutiveAccessibleScope,
  ExecutiveAiLeadershipSummary,
  ExecutiveCommandCenterAxisKey,
  ExecutiveCommandCenterSnapshot,
  ExecutiveConfigResource,
  ExecutiveDataScope,
  ExecutiveDashboardLayer,
  ExecutiveDashboardMetric,
  ExecutiveLeadershipActionItem,
  ExecutiveLeadershipData,
  ExecutiveOperatingRole,
  ExecutiveOverviewCard,
  ExecutiveProjectRow,
  ExecutiveRiskGroupMetadata,
  ExecutiveEscalationRule,
  ExecutiveRoleDefinition,
  ExecutiveScopeRule,
} from "@/modules/executive/types";
import {
  listActiveApprovalThresholds,
  listActiveRiskGroups,
} from "@/modules/settings/services/policy-settings-service";
import type { PolicySettingsRepository } from "@/modules/settings/services/policy-settings-repository";
import type {
  ApprovalThresholdPolicy,
  RolePermissionCatalog,
  RiskGroupConfig,
  ScopeAssignment,
} from "@/modules/settings/types";

type ScopableExecutiveItem = {
  id: string;
  organizationId?: string;
  projectId?: string;
  projectName?: string;
  axis?: ExecutiveCommandCenterAxisKey;
  axisId?: ExecutiveCommandCenterAxisKey;
  moduleId?: string;
  scope?: ExecutiveDataScope;
};

type ExecutiveServiceOptions = {
  policyRepository?: PolicySettingsRepository;
  rolePermissionCatalog?: RolePermissionCatalog;
  selectedScopeId?: string;
  scopeAssignments?: ScopeAssignment[];
};

const scopedExecutivePermissions = [
  "project.view",
  "task.view",
  "document.view",
  "legal.view",
  "finance.view",
  "meeting.view",
  "decision.approve",
  "proposal.view",
  "proposal.approve",
] as const;

const ALL_AXIS_IDS = executiveAxisDefinitions.map(
  (axis) => axis.id,
) satisfies ExecutiveCommandCenterAxisKey[];
const ALL_MODULE_IDS = ["*"];
const roleDefinitionByRole = new Map<ExecutiveOperatingRole, ExecutiveRoleDefinition>(
  executiveRoleDefinitions.map((roleDefinition) => [
    roleDefinition.role,
    roleDefinition,
  ]),
);

const projectOrganizationById = new Map(
  projects.map((project) => [project.projectId, project.organizationId]),
);
const projectIdByName = new Map(
  projects.map((project) => [project.name, project.projectId]),
);

function resolveItemProjectId(item: ScopableExecutiveItem) {
  return (
    item.projectId ??
    item.scope?.projectId ??
    (item.projectName ? projectIdByName.get(item.projectName) : undefined)
  );
}

function projectIdsForOrganization(organizationIds: string[]) {
  const organizationSet = new Set(organizationIds);

  return projects
    .filter((project) => organizationSet.has(project.organizationId))
    .map((project) => project.projectId);
}

function matchesScopeRule(
  rule: ExecutiveScopeRule,
  user: PermissionUser,
  access: NonNullable<ReturnType<typeof resolveExecutiveAccess>>,
) {
  if (rule.roles && !rule.roles.includes(user.role)) {
    return false;
  }

  if (rule.accessLevels && !rule.accessLevels.includes(access.level)) {
    return false;
  }

  if (
    rule.userIdIncludes &&
    !user.id.toLowerCase().includes(rule.userIdIncludes.toLowerCase())
  ) {
    return false;
  }

  return true;
}

function expandOrganizationIds(resource: ExecutiveConfigResource) {
  if (resource === "all") {
    return organizations.map((organization) => organization.id);
  }

  if (resource === "by_organization") {
    return [];
  }

  return resource;
}

function expandProjectIds(
  resource: ExecutiveConfigResource,
  organizationIds: string[],
) {
  if (resource === "all") {
    return projects.map((project) => project.projectId);
  }

  if (resource === "by_organization") {
    return projectIdsForOrganization(organizationIds);
  }

  return resource;
}

function expandAxisIds(resource: ExecutiveConfigResource) {
  if (resource === "all" || resource === "by_organization") {
    return ALL_AXIS_IDS;
  }

  return resource.filter((axisId): axisId is ExecutiveCommandCenterAxisKey =>
    ALL_AXIS_IDS.includes(axisId as ExecutiveCommandCenterAxisKey),
  );
}

function expandModuleIds(resource: ExecutiveConfigResource) {
  if (resource === "all" || resource === "by_organization") {
    return ALL_MODULE_IDS;
  }

  return resource;
}

function normalizeExecutiveAxisId(axisId: string) {
  return axisId === "axis-1" || axisId === "axis1"
    ? "project_management"
    : axisId;
}

function applyAssignmentScope(
  scope: ExecutiveAccessibleScope,
  assignment?: ScopeAssignment,
): ExecutiveAccessibleScope {
  if (!assignment) {
    return scope;
  }

  const organizationIds =
    assignment.organizationId && assignment.organizationId !== "*"
      ? [assignment.organizationId]
      : scope.organizationIds;
  const projectIds =
    assignment.projectId && assignment.projectId !== "*"
      ? [assignment.projectId]
      : scope.projectIds;
  const axisIds =
    assignment.axisId && assignment.axisId !== "*"
      ? [normalizeExecutiveAxisId(assignment.axisId) as ExecutiveCommandCenterAxisKey]
      : scope.axisIds;
  const moduleIds =
    assignment.moduleId && assignment.moduleId !== "*"
      ? [assignment.moduleId]
      : scope.moduleIds;

  return {
    ...scope,
    axisIds,
    canViewAllOrganizations:
      !assignment.organizationId || assignment.organizationId === "*"
        ? scope.canViewAllOrganizations
        : false,
    canViewAllProjects:
      !assignment.projectId || assignment.projectId === "*"
        ? scope.canViewAllProjects
        : false,
    moduleIds,
    organizationIds,
    projectIds,
  };
}

function resolveAccessibleScope(
  user: PermissionUser,
  effectiveRole = user.role,
  assignment?: ScopeAssignment,
): ExecutiveAccessibleScope {
  const effectiveUser = { ...user, role: effectiveRole };
  const access = resolveExecutiveAccess(effectiveRole);

  if (!access) {
    return {
      operatingRole: "STAFF",
      scopeType: "task",
      organizationIds: [],
      projectIds: [],
      axisIds: [],
      moduleIds: [],
      permission: "executive.none",
      canViewAllOrganizations: false,
      canViewAllProjects: false,
    };
  }

  const scopeRule = executiveScopeRules.find((rule) =>
    matchesScopeRule(rule, effectiveUser, access),
  );

  if (!scopeRule) {
    return {
      operatingRole: access.operatingRole,
      scopeType: access.scopeType,
      organizationIds: [],
      projectIds: [],
      axisIds: [],
      moduleIds: [],
      permission: "executive.none",
      canViewAllOrganizations: false,
      canViewAllProjects: false,
    };
  }

  const organizationIds = expandOrganizationIds(scopeRule.organizationIds);

  return applyAssignmentScope({
    operatingRole: scopeRule.operatingRole,
    scopeType: scopeRule.scopeType,
    organizationIds,
    projectIds: expandProjectIds(scopeRule.projectIds, organizationIds),
    axisIds: expandAxisIds(scopeRule.axisIds),
    moduleIds: expandModuleIds(scopeRule.moduleIds),
    permission: scopeRule.permission,
    canViewAllOrganizations:
      scopeRule.canViewAllOrganizations ??
      (scopeRule.organizationIds === "all"),
    canViewAllProjects:
      scopeRule.canViewAllProjects ?? (scopeRule.projectIds === "all"),
  }, assignment);
}

function resolveItemOrganizationId(item: ScopableExecutiveItem) {
  const projectId = resolveItemProjectId(item);

  return (
    item.organizationId ??
    item.scope?.organizationId ??
    (projectId ? projectOrganizationById.get(projectId) : undefined)
  );
}

function forExecutiveScope<T extends ScopableExecutiveItem>(
  items: T[],
  scope: ExecutiveAccessibleScope,
) {
  const organizationIds = new Set(scope.organizationIds);
  const projectIds = new Set(scope.projectIds);
  const axisIds = new Set(scope.axisIds);
  const moduleIds = new Set(scope.moduleIds);
  const canViewAllModules = moduleIds.has("*");

  return items.filter((item) => {
    const organizationId = resolveItemOrganizationId(item);
    const projectId = resolveItemProjectId(item);
    const axisId = item.axisId ?? item.axis ?? item.scope?.axisId;
    const moduleId = item.moduleId ?? item.scope?.moduleId;

    if (organizationId && !organizationIds.has(organizationId)) {
      return false;
    }

    if (projectId && !scope.canViewAllProjects && !projectIds.has(projectId)) {
      return false;
    }

    if (axisId && !axisIds.has(axisId)) {
      return false;
    }

    if (moduleId && !canViewAllModules && !moduleIds.has(moduleId)) {
      return false;
    }

    return true;
  });
}

function isVisibleForOperatingRole(
  item: ExecutiveLeadershipActionItem,
  scope: ExecutiveAccessibleScope,
) {
  const roleDefinition = roleDefinitionByRole.get(scope.operatingRole);

  if (!roleDefinition) {
    return false;
  }

  const visibility = roleDefinition.decisionVisibility;

  if (scope.operatingRole === "DEPARTMENT_HEAD") {
    return (
      item.approvalLevel === "DEPARTMENT_HEAD" ||
      item.role === "DEPARTMENT_HEAD" ||
      item.scope.role === "DEPARTMENT_HEAD"
    );
  }

  if (visibility.approvalLevels.includes(item.approvalLevel)) {
    return true;
  }

  if (visibility.riskLevels.includes(item.riskLevel)) {
    return true;
  }

  if (visibility.projectImportances.includes(item.projectImportance)) {
    return true;
  }

  if (visibility.includeLegalImpact && item.legalImpact) {
    return true;
  }

  if (visibility.includeScheduleImpact && item.scheduleImpact) {
    return true;
  }

  return (
    visibility.includeTodayDecisions &&
    item.requiresTodayDecision &&
    (item.riskLevel === "critical" ||
      visibility.approvalLevels.includes(item.approvalLevel))
  );
}

function forLeadershipDecisionScope(
  items: ExecutiveLeadershipActionItem[],
  scope: ExecutiveAccessibleScope,
) {
  return forExecutiveScope(items, scope).filter((item) =>
    isVisibleForOperatingRole(item, scope),
  );
}

function filterOrganizations(scope: ExecutiveAccessibleScope) {
  const organizationIds = new Set(scope.organizationIds);

  return organizations.filter((organization) =>
    organizationIds.has(organization.id),
  );
}

function scopeAiLeadershipSummary(
  summary: ExecutiveAiLeadershipSummary,
  scope: ExecutiveAccessibleScope,
): ExecutiveAiLeadershipSummary {
  return {
    attentionPoints: forExecutiveScope(summary.attentionPoints, scope),
    risks: forExecutiveScope(summary.risks, scope),
    weeklyPriorities: forExecutiveScope(summary.weeklyPriorities, scope),
  };
}

function scopeCommandCenterSnapshot(
  snapshot: ExecutiveCommandCenterSnapshot,
  scope: ExecutiveAccessibleScope,
): ExecutiveCommandCenterSnapshot {
  return {
    notes: forExecutiveScope(snapshot.notes, scope),
    meetings: forExecutiveScope(snapshot.meetings, scope),
    workCalendar: forExecutiveScope(snapshot.workCalendar, scope),
    approvalQueue: forExecutiveScope(snapshot.approvalQueue, scope),
    alerts: forExecutiveScope(snapshot.alerts, scope),
    quickReports: snapshot.quickReports,
  };
}

function scopeDashboardLayers(
  layers: ExecutiveDashboardLayer[],
  scope: ExecutiveAccessibleScope,
) {
  const roleDefinition = roleDefinitionByRole.get(scope.operatingRole);

  if (!roleDefinition) {
    return [];
  }

  return layers.filter((layer) => {
    return roleDefinition.dashboardLayers.includes(layer.layer);
  });
}

function buildMetrics(
  scopedProjects: ExecutiveProjectRow[],
  scopedItems: ExecutiveLeadershipActionItem[],
): ExecutiveDashboardMetric[] {
  const redProjects = scopedProjects.filter(
    (project) => project.health === "red",
  ).length;
  const pendingDecisions = scopedItems.filter(
    (item) => item.status === "pending" || item.requiresTodayDecision,
  ).length;
  const highRisks = scopedItems.filter(
    (item) => item.riskLevel === "high" || item.riskLevel === "critical",
  ).length;

  return [
    {
      label: "Du an trong scope",
      value: scopedProjects.length,
      helper: "Da loc theo organization/project",
      delta: `${redProjects} du an canh bao do`,
      tone: redProjects ? "red" : "blue",
    },
    {
      label: "Quyet dinh cho xu ly",
      value: pendingDecisions,
      helper: "Chi gom viec can lanh dao quyet dinh",
      delta: `${scopedItems.length} viec trong hang dieu hanh`,
      tone: "purple",
    },
    {
      label: "Rui ro lon",
      value: highRisks,
      helper: "HIGH/CRITICAL",
      delta: "Tu dong nang cap theo nguong",
      tone: highRisks ? "red" : "emerald",
    },
    {
      label: "Dong tien tong",
      value: "186 ty",
      helper: "Mock dashboard layer",
      delta: "Chi hien thi cap dieu hanh",
      tone: "emerald",
    },
    {
      label: "Approval escalation",
      value: scopedItems.filter((item) => item.approvalLevel === "CEO").length,
      helper: "So viec len cap CEO",
      delta: "Theo amount/risk/impact",
      tone: "amber",
    },
  ];
}

function buildOverviewCards(
  scopedProjects: ExecutiveProjectRow[],
  scopedItems: ExecutiveLeadershipActionItem[],
): ExecutiveOverviewCard[] {
  const overdueCount = scopedItems.filter(
    (item) => item.status === "overdue" || item.dueGroup === "overdue",
  ).length;
  const legalBlockers = scopedItems.filter((item) => item.legalImpact).length;
  const pendingProposals = scopedItems.filter(
    (item) => item.status === "pending",
  ).length;
  const highRisks = scopedItems.filter(
    (item) => item.riskLevel === "high" || item.riskLevel === "critical",
  ).length;

  return overviewCards.map((card) => {
    switch (card.key) {
      case "tracked_projects":
        return { ...card, value: scopedProjects.length };
      case "overdue_directives":
        return { ...card, value: overdueCount };
      case "legal_blockers":
        return { ...card, value: legalBlockers };
      case "pending_proposals":
        return { ...card, value: pendingProposals };
      case "high_risks":
        return { ...card, value: highRisks };
      default:
        return card;
    }
  });
}

function buildScopeLabel(scope: ExecutiveAccessibleScope) {
  if (scope.scopeType === "project") {
    return "Pham vi du an duoc giao";
  }

  if (scope.scopeType === "department") {
    return "Pham vi bo phan chuyen mon";
  }

  if (scope.scopeType === "portfolio") {
    return "Pham vi danh muc duoc giao";
  }

  return "Toan danh muc cong ty duoc cap quyen";
}

function buildEscalationRulesFromPolicies(
  policies: ApprovalThresholdPolicy[],
): ExecutiveEscalationRule[] {
  return policies.map((policy) => ({
    id: policy.policyKey,
    thresholdPolicyId: policy.id,
    approvalLevel: policy.approvalLevel,
    thresholdLabel: policy.labelVi,
    amountMin: policy.amountMin,
    amountMax: policy.amountMax,
    approverRole: policy.approverRoleKey,
    requiredPermission: policy.requiredPermissionKey,
    riskLevels: policy.escalateOnRiskLevels ?? [],
    autoEscalationSignals:
      policy.escalateOnRiskLevels && policy.escalateOnRiskLevels.length > 0
        ? policy.escalateOnRiskLevels.map((riskLevel) => `Risk ${riskLevel.toUpperCase()}`)
        : ["Theo amount range"],
  }));
}

function buildRiskGroupMetadata(
  riskGroups: RiskGroupConfig[],
): ExecutiveRiskGroupMetadata[] {
  return riskGroups.map((riskGroup) => ({
    id: riskGroup.id,
    key: riskGroup.riskKey,
    label: riskGroup.labelVi,
    description: riskGroup.description,
    defaultSeverity: riskGroup.defaultSeverity,
    moduleId: riskGroup.moduleId,
    sortOrder: riskGroup.sortOrder,
    isDefault: riskGroup.isDefault,
  }));
}

function resolveExecutiveAccessContext(
  user: PermissionUser,
  options: ExecutiveServiceOptions,
) {
  const directAccess = resolveExecutiveAccess(user.role);
  const selectedAssignment =
    options.selectedScopeId && options.selectedScopeId !== "all"
      ? options.scopeAssignments?.find(
          (assignment) => assignment.id === options.selectedScopeId,
        ) ?? options.scopeAssignments?.[0]
      : undefined;

  if (directAccess) {
    return {
      access: directAccess,
      assignment: selectedAssignment,
      effectiveRole: user.role,
    };
  }

  const assignment = options.scopeAssignments?.find((candidate) => {
    const assignmentAccess = resolveExecutiveAccess(candidate.roleKey);

    if (!assignmentAccess) {
      return false;
    }

    return scopedExecutivePermissions.some((permission) =>
      hasAnyScopedActionGrant(user, permission, {
        rolePermissionCatalog: options.rolePermissionCatalog,
        scopeAssignments: [candidate],
      }),
    );
  });

  return {
    access: assignment ? resolveExecutiveAccess(assignment.roleKey) : null,
    assignment,
    effectiveRole: assignment?.roleKey ?? user.role,
  };
}

function canViewFinanceForTarget(
  user: PermissionUser,
  options: ExecutiveServiceOptions,
  target: { id?: string; projectId?: string },
) {
  if (can(user, "finance.view")) {
    return true;
  }

  return canAccessScopedAction(
    user,
    "finance.view",
    {
      projectId: target.projectId,
      recordId: target.id,
    },
    {
      rolePermissionCatalog: options.rolePermissionCatalog,
      scopeAssignments: options.scopeAssignments,
    },
  );
}

function canViewGlobalFinance(user: PermissionUser, options: ExecutiveServiceOptions) {
  if (can(user, "finance.view")) {
    return true;
  }

  return canAccessScopedAction(user, "finance.view", {}, {
    rolePermissionCatalog: options.rolePermissionCatalog,
    scopeAssignments: options.scopeAssignments,
  });
}

function withoutFinanceFields<T extends Record<string, unknown>>(item: T): T {
  const clone = { ...item };

  delete clone.amount;
  delete clone.amountLabel;
  delete clone.cashFlowLabel;
  delete clone.budgetRange;
  delete clone.budgetLabel;
  delete clone.allocatedBudget;
  delete clone.committedBudget;
  delete clone.amountMin;
  delete clone.amountMax;

  return clone as T;
}

function isFinanceCopy(value: string) {
  const normalized = value.toLowerCase();

  return (
    normalized.includes("dong tien") ||
    normalized.includes("ngan sach") ||
    normalized.includes("xin chi") ||
    normalized.includes("cash") ||
    normalized.includes("budget")
  );
}

function sanitizeExecutiveFinance(
  data: ExecutiveLeadershipData,
  user: PermissionUser,
  options: ExecutiveServiceOptions,
): ExecutiveLeadershipData {
  const globalFinanceAllowed = canViewGlobalFinance(user, options);
  const canViewRecord = (target: { id?: string; projectId?: string }) =>
    canViewFinanceForTarget(user, options, target);

  return {
    ...data,
    dashboardLayers: data.dashboardLayers.map((layer) => ({
      ...layer,
      kpis: globalFinanceAllowed
        ? layer.kpis
        : layer.kpis.filter((kpi) => !isFinanceCopy(kpi.label) && !isFinanceCopy(kpi.helper)),
    })),
    escalationRules: globalFinanceAllowed
      ? data.escalationRules
      : data.escalationRules.map((rule) => withoutFinanceFields(rule)),
    metrics: globalFinanceAllowed
      ? data.metrics
      : data.metrics.filter(
          (metric) => !isFinanceCopy(metric.label) && !isFinanceCopy(metric.helper),
        ),
    commandCenterSnapshot: {
      ...data.commandCenterSnapshot,
      quickReports: globalFinanceAllowed
        ? data.commandCenterSnapshot.quickReports
        : data.commandCenterSnapshot.quickReports.filter(
            (report) => !isFinanceCopy(report.title) && !isFinanceCopy(report.helper),
          ),
    },
    leadershipActionItems: data.leadershipActionItems.map((item) =>
      canViewRecord(item) ? item : withoutFinanceFields(item),
    ),
    projects: data.projects.map((project) =>
      canViewRecord({ id: project.id, projectId: project.projectId })
        ? project
        : withoutFinanceFields(project),
    ),
    strategicPlans: data.strategicPlans.map((plan) =>
      canViewRecord(plan) ? plan : withoutFinanceFields(plan),
    ),
    approvals: data.approvals.map((approval) =>
      canViewRecord(approval) ? approval : withoutFinanceFields(approval),
    ),
  };
}

export async function getExecutiveLeadershipData(
  user: PermissionUser,
  options: ExecutiveServiceOptions = {},
): Promise<ExecutiveLeadershipData> {
  const { access, assignment, effectiveRole } = resolveExecutiveAccessContext(
    user,
    options,
  );

  if (!access) {
    throw new Error("Executive access policy is not configured.");
  }

  const accessibleScope = resolveAccessibleScope(user, effectiveRole, assignment);
  const scopedProjects = forExecutiveScope(projects, accessibleScope);
  const scopedLeadershipActionItems = forLeadershipDecisionScope(
    leadershipActionItems,
    accessibleScope,
  );
  const scopedPlans = forExecutiveScope(strategicPlans, accessibleScope);
  const scopedDirectives = forExecutiveScope(directives, accessibleScope);
  const scopedApprovals = forExecutiveScope(approvals, accessibleScope);
  const scopedMeetings = forExecutiveScope(meetings, accessibleScope);
  const scopedDecisionLog = forExecutiveScope(decisionLog, accessibleScope);
  const [policyThresholds, configuredRiskGroups] = options.policyRepository
    ? await Promise.all([
        listActiveApprovalThresholds(options.policyRepository),
        listActiveRiskGroups(options.policyRepository),
      ])
    : await Promise.all([
        listActiveApprovalThresholds(),
        listActiveRiskGroups(),
      ]);

  const data: ExecutiveLeadershipData = {
    scopeLabel: buildScopeLabel(accessibleScope),
    generatedAt: new Date().toISOString(),
    access,
    accessibleScope,
    organizations: filterOrganizations(accessibleScope),
    roleDefinitions: executiveRoleDefinitions,
    axisDefinitions: executiveAxisDefinitions,
    dashboardLayers: scopeDashboardLayers(dashboardLayers, accessibleScope),
    escalationRules: buildEscalationRulesFromPolicies(policyThresholds),
    riskGroups: buildRiskGroupMetadata(configuredRiskGroups),
    globalStatusItems,
    workspaceSwitchItems,
    metrics: buildMetrics(scopedProjects, scopedLeadershipActionItems),
    overviewCards: buildOverviewCards(
      scopedProjects,
      scopedLeadershipActionItems,
    ),
    commandCenterSnapshot: scopeCommandCenterSnapshot(
      commandCenterSnapshot,
      accessibleScope,
    ),
    progressSegments,
    urgentItems: forExecutiveScope(urgentItems, accessibleScope),
    leadershipActionItems: scopedLeadershipActionItems,
    projects: scopedProjects,
    schedule: forExecutiveScope(schedule, accessibleScope),
    quickActions,
    notifications: forExecutiveScope(notifications, accessibleScope),
    strategicPlans: scopedPlans,
    leadershipTeam,
    authorityMatrix,
    directives: scopedDirectives,
    meetings: scopedMeetings,
    approvals: scopedApprovals,
    decisionLog: scopedDecisionLog,
    auditLog: forExecutiveScope(auditLog, accessibleScope),
    aiInsights: forExecutiveScope(aiInsights, accessibleScope),
    aiLeadershipSummary: scopeAiLeadershipSummary(
      aiLeadershipSummary,
      accessibleScope,
    ),
  };

  return sanitizeExecutiveFinance(data, user, options);
}
