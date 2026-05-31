import {
  hasAnyScopedActionGrant,
  requiresAssignmentScopeForRole,
} from "@/lib/permissions/access-scope";
import { can, type PermissionAction, type PermissionUser } from "@/lib/permissions/can";
import { selectScopeAssignmentsForUser } from "@/lib/permissions/navigation-context";
import type {
  ExecutiveDashboardData,
  ExecutiveDashboardKpi,
  ExecutiveDashboardSourceItem,
  ExecutiveRiskItem,
} from "@/modules/dashboard/types";
import { enrichExecutiveSourceItem } from "@/modules/dashboard/services/executive-drilldown-source";
import {
  getExecutiveDashboardData,
  type ExecutiveDashboardOptions,
} from "@/modules/dashboard/services/executive-dashboard-service";
import { canAccessExecutiveModule } from "@/modules/executive/constants";
import { getExecutiveLeadershipData } from "@/modules/executive/services/executive-service";
import type {
  ExecutiveLeadershipData,
  ExecutiveOperatingRole,
} from "@/modules/executive/types";
import {
  getLeadershipDelegationStatus,
  isDelegationActionAllowed,
  listActiveDelegationsForDelegate,
} from "@/modules/settings/services/leadership-delegation-service";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import { listActiveScopeAssignments } from "@/modules/settings/services/scope-assignment-service";
import type {
  LeadershipDelegation,
  PermissionCatalogItem,
  RolePermissionCatalog,
  ScopeAssignment,
  ScopeDimension,
} from "@/modules/settings/types";
import type {
  AssistantPrivateWorkspaceSupport,
  ExecutivePrivateWorkspaceData,
  ExecutivePrivateWorkspaceEmptyState,
  ExecutivePrivateWorkspaceVariant,
  PrivateWorkspaceAction,
  PrivateWorkspacePermissions,
  PrivateWorkspaceSectionItem,
} from "@/modules/workspaces/types";

type ExecutivePrivateWorkspaceRepositories = ExecutiveDashboardOptions["repositories"];

export type ExecutivePrivateWorkspaceOptions = {
  selectedScopeId?: string;
  scopeAssignments?: ScopeAssignment[];
  rolePermissionCatalog?: RolePermissionCatalog;
  delegations?: LeadershipDelegation[];
  repositories?: ExecutivePrivateWorkspaceRepositories;
  today?: Date;
  requireScopeAssignments?: boolean;
  dashboardData?: ExecutiveDashboardData;
  executiveData?: ExecutiveLeadershipData | null;
};

type DelegationWorkspaceState = {
  allowedActionKeys: PermissionAction[];
  canActOnBehalf: boolean;
  delegation: LeadershipDelegation;
  reason: string;
};

const delegatedCreateActions = new Set<PermissionAction>([
  "proposal.create",
  "meeting.create",
  "document.create",
  "task.create",
]);

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

const operatingRoles = new Set<string>([
  "CHAIRMAN",
  "CEO",
  "PROJECT_DIRECTOR",
  "DEPARTMENT_HEAD",
  "STAFF",
]);

function toOperatingRole(value?: string): ExecutiveOperatingRole | undefined {
  return operatingRoles.has(value ?? "")
    ? (value as ExecutiveOperatingRole)
    : undefined;
}

function effectiveScopeAssignmentsForUser(
  user: PermissionUser,
  scopeAssignments: ScopeAssignment[],
  selectedScopeId?: string,
) {
  if (selectedScopeId === undefined) {
    return scopeAssignments;
  }

  const selectedScopeAssignments = selectScopeAssignmentsForUser(
    user,
    scopeAssignments,
    selectedScopeId,
  );
  const selectedScopeActive = selectedScopeId !== "all";
  const ignoreImplicitAssignments =
    !selectedScopeActive &&
    ["chu_tich", "super_admin", "admin", "tong_giam_doc"].includes(user.role);

  return ignoreImplicitAssignments ? [] : selectedScopeAssignments;
}

function hasScopedGrant(
  user: PermissionUser,
  permission: PermissionAction,
  rolePermissionCatalog: RolePermissionCatalog,
  scopeAssignments: ScopeAssignment[],
) {
  return hasAnyScopedActionGrant(user, permission, {
    rolePermissionCatalog,
    scopeAssignments,
  });
}

function hasExecutiveAccessFromScope(
  user: PermissionUser,
  rolePermissionCatalog: RolePermissionCatalog,
  scopeAssignments: ScopeAssignment[],
) {
  return scopeAssignments.some(
    (assignment) =>
      canAccessExecutiveModule(assignment.roleKey) &&
      ["project.view", "proposal.view", "meeting.view", "decision.approve"].some(
        (permission) =>
          hasScopedGrant(
            user,
            permission as PermissionAction,
            rolePermissionCatalog,
            [assignment],
          ),
      ),
  );
}

function scopeSnapshot(source: ScopeDimension) {
  return {
    axisId: source.axisId,
    moduleId: source.moduleId,
    organizationId: source.organizationId,
    projectId: source.projectId,
    recordId: source.recordId,
    workstreamId: source.workstreamId,
  };
}

function normalizeDimension(value?: string) {
  if (value === "axis-1" || value === "axis1") {
    return "project_management";
  }

  return value;
}

function dimensionsCompatible(assignmentValue?: string, delegationValue?: string) {
  if (
    !assignmentValue ||
    assignmentValue === "*" ||
    !delegationValue ||
    delegationValue === "*"
  ) {
    return true;
  }

  return normalizeDimension(assignmentValue) === normalizeDimension(delegationValue);
}

function delegationMatchesAssignment(
  delegation: LeadershipDelegation,
  assignment: ScopeAssignment,
) {
  return (
    dimensionsCompatible(assignment.organizationId, delegation.organizationId) &&
    dimensionsCompatible(assignment.projectId, delegation.projectId) &&
    dimensionsCompatible(assignment.axisId, delegation.axisId) &&
    dimensionsCompatible(assignment.workstreamId, delegation.workstreamId) &&
    dimensionsCompatible(assignment.moduleId, delegation.moduleId) &&
    dimensionsCompatible(assignment.recordId, delegation.recordId)
  );
}

function delegationInScope(
  delegation: LeadershipDelegation,
  scopeAssignments: ScopeAssignment[],
  selectedScopeActive: boolean,
) {
  if (!selectedScopeActive) {
    return true;
  }

  return scopeAssignments.some((assignment) =>
    delegationMatchesAssignment(delegation, assignment),
  );
}

function resolveVariant(
  user: PermissionUser,
  operatingRole?: ExecutiveOperatingRole,
): ExecutivePrivateWorkspaceVariant {
  if (user.role === "thu_ky_tro_ly") {
    return "secretary_assistant";
  }

  if (operatingRole === "CHAIRMAN") {
    return "chairman";
  }

  if (operatingRole === "PROJECT_DIRECTOR") {
    return "project_director";
  }

  if (operatingRole === "DEPARTMENT_HEAD") {
    return "department_head";
  }

  if (operatingRole === "STAFF") {
    return "viewer";
  }

  if (user.role === "viewer") {
    return "viewer";
  }

  return "ceo";
}

function readOnlyReason(permissions: PrivateWorkspacePermissions) {
  if (permissions.mutationMode === "read_only") {
    return "Read-only trong scope hien tai.";
  }

  if (permissions.mutationMode === "none") {
    return "Khong co quyen thao tac trong scope hien tai.";
  }

  return undefined;
}

function stripFinanceFields<T extends Record<string, unknown>>(item: T): T {
  const clone = { ...item };

  for (const key of financeKeys) {
    delete clone[key];
  }

  return clone as T;
}

function sanitizeItemFinance<T extends Record<string, unknown>>(
  item: T,
  canViewFinance: boolean,
): T {
  if (!canViewFinance || item.financialAccess === "no_permission") {
    return stripFinanceFields(item);
  }

  return item;
}

function healthLabel(status: string) {
  if (status === "red") {
    return "Do";
  }

  if (status === "yellow") {
    return "Vang";
  }

  if (status === "green") {
    return "Xanh";
  }

  return status;
}

function priorityLabelForRisk(item: ExecutiveRiskItem) {
  if (item.severity === "critical") {
    return "Critical";
  }

  if (item.severity === "high") {
    return "High";
  }

  if (item.severity === "medium") {
    return "Medium";
  }

  return "Low";
}

function priorityLabelForItem(item: ExecutiveDashboardSourceItem) {
  if (item.tone === "red") {
    return item.status === "overdue" ? "Qua han" : "High";
  }

  if (item.tone === "amber") {
    return "Can chu y";
  }

  return "Thong tin";
}

function toSectionItem(
  item: ExecutiveDashboardSourceItem,
  groupLabel: string,
  permissions: PrivateWorkspacePermissions,
  scopeLabel: string,
  priorityLabel = priorityLabelForItem(item),
): PrivateWorkspaceSectionItem {
  const sanitized = sanitizeItemFinance(
    item as unknown as Record<string, unknown>,
    permissions.canViewFinance,
  ) as unknown as ExecutiveDashboardSourceItem;
  const enriched = enrichExecutiveSourceItem(sanitized, {
    canViewFinance: permissions.canViewFinance,
    permissions,
    scopeLabel,
  });

  return {
    ...enriched,
    groupLabel,
    priorityLabel,
    readOnlyReason: readOnlyReason(permissions),
  };
}

function toProjectItem(
  item: ExecutiveDashboardSourceItem,
  permissions: PrivateWorkspacePermissions,
  scopeLabel: string,
): PrivateWorkspaceSectionItem {
  return toSectionItem(
    item,
    "Du an duoc giao",
    permissions,
    scopeLabel,
    healthLabel(item.status),
  );
}

function toUtcDay(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return Number.NaN;
  }

  return Date.UTC(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth(),
    parsed.getUTCDate(),
  );
}

function scoreItem(item: PrivateWorkspaceSectionItem, today: Date) {
  if (item.priorityLabel === "Critical") {
    return 100;
  }

  if (item.priorityLabel === "High") {
    return 90;
  }

  if (item.sourceType === "risk") {
    if (item.priorityLabel === "Medium") {
      return 60;
    }

    return 30;
  }

  if (item.deadline) {
    const deadline = toUtcDay(item.deadline);
    const current = Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
    );

    if (!Number.isNaN(deadline) && deadline < current) {
      return 85;
    }

    if (!Number.isNaN(deadline) && deadline === current) {
      return 75;
    }
  }

  if (item.tone === "red") {
    return 80;
  }

  if (item.tone === "amber") {
    return 55;
  }

  if (item.sourceType === "decision") {
    return item.status === "follow_up" ? 50 : 35;
  }

  if (item.sourceType === "meeting") {
    return 30;
  }

  return 20;
}

function dedupeAndSortPriorityItems(
  items: PrivateWorkspaceSectionItem[],
  today: Date,
) {
  const bestBySource = new Map<
    string,
    { item: PrivateWorkspaceSectionItem; score: number }
  >();

  for (const item of items) {
    const key = `${item.sourceType}:${item.sourceId}`;
    const score = scoreItem(item, today);
    const existing = bestBySource.get(key);

    if (!existing || score > existing.score) {
      bestBySource.set(key, { item, score });
    }
  }

  return [...bestBySource.values()]
    .sort(
      (a, b) =>
        b.score - a.score ||
        (a.item.deadline ?? "").localeCompare(b.item.deadline ?? "") ||
        a.item.title.localeCompare(b.item.title),
    )
    .map(({ item }) => item)
    .slice(0, 12);
}

function permissionByKey(
  rolePermissionCatalog: RolePermissionCatalog,
  actionKey: PermissionAction,
): PermissionCatalogItem | undefined {
  return rolePermissionCatalog.permissions.find(
    (permission) => permission.key === actionKey,
  );
}

function delegatedActionKeysForCatalog(
  delegation: LeadershipDelegation,
  rolePermissionCatalog: RolePermissionCatalog,
) {
  return delegation.actionKeys.filter((actionKey) => {
    if (!delegatedCreateActions.has(actionKey)) {
      return false;
    }

    const permission = permissionByKey(rolePermissionCatalog, actionKey);

    return Boolean(permission && isDelegationActionAllowed(actionKey, permission));
  });
}

function reasonForDelegationStatus(status: string) {
  if (status === "expired") {
    return "Delegation da het hieu luc.";
  }

  if (status === "scheduled") {
    return "Delegation chua den thoi gian hieu luc.";
  }

  if (status === "inactive") {
    return "Delegation dang inactive.";
  }

  return "Delegation khong hop le.";
}

function buildDelegationWorkspaceStates(input: {
  delegations: LeadershipDelegation[];
  rolePermissionCatalog: RolePermissionCatalog;
  scopeAssignments: ScopeAssignment[];
  selectedScopeActive: boolean;
  today: Date;
}): DelegationWorkspaceState[] {
  return input.delegations.map((delegation) => {
    const allowedActionKeys = delegatedActionKeysForCatalog(
      delegation,
      input.rolePermissionCatalog,
    );
    const status = getLeadershipDelegationStatus(delegation, input.today);

    if (status !== "active") {
      return {
        allowedActionKeys,
        canActOnBehalf: false,
        delegation,
        reason: reasonForDelegationStatus(status),
      };
    }

    if (
      !delegationInScope(
        delegation,
        input.scopeAssignments,
        input.selectedScopeActive,
      )
    ) {
      return {
        allowedActionKeys,
        canActOnBehalf: false,
        delegation,
        reason: "Delegation active nhung ngoai selected scope.",
      };
    }

    if (allowedActionKeys.length === 0) {
      return {
        allowedActionKeys,
        canActOnBehalf: false,
        delegation,
        reason: "Khong co action delegatable trong permission catalog hien tai.",
      };
    }

    return {
      allowedActionKeys,
      canActOnBehalf: true,
      delegation,
      reason: "Delegation active va match scope.",
    };
  });
}

function actionLabel(actionKey: PermissionAction) {
  if (actionKey === "proposal.create") {
    return "Tao de xuat thay lanh dao";
  }

  if (actionKey === "meeting.create") {
    return "Tao lich hop thay lanh dao";
  }

  if (actionKey === "document.create") {
    return "Tao ho so ho tro";
  }

  if (actionKey === "task.create") {
    return "Tao viec ho tro";
  }

  return actionKey;
}

function buildDelegatedActions(states: DelegationWorkspaceState[]) {
  return states
    .filter((state) => state.canActOnBehalf)
    .flatMap((state) =>
      state.allowedActionKeys.map(
        (actionKey): PrivateWorkspaceAction => ({
          actionKey,
          delegationId: state.delegation.id,
          enabled: true,
          id: `${state.delegation.id}:${actionKey}`,
          label: actionLabel(actionKey),
          principalUserId: state.delegation.principalUserId,
          reason: state.reason,
          scope: scopeSnapshot(state.delegation),
        }),
      ),
    );
}

function buildPermissions(
  user: PermissionUser,
  dashboard: ExecutiveDashboardData,
  rolePermissionCatalog: RolePermissionCatalog,
  scopeAssignments: ScopeAssignment[],
  delegatedActions: PrivateWorkspaceAction[],
  variant: ExecutivePrivateWorkspaceVariant,
): PrivateWorkspacePermissions {
  const scoped = (permission: PermissionAction) =>
    hasScopedGrant(user, permission, rolePermissionCatalog, scopeAssignments);
  const canCreateProposal =
    can(user, "proposal.create") ||
    scoped("proposal.create") ||
    delegatedActions.some((action) => action.actionKey === "proposal.create");
  const canCreateMeeting =
    can(user, "meeting.create") ||
    scoped("meeting.create") ||
    delegatedActions.some((action) => action.actionKey === "meeting.create");
  const directMutation =
    can(user, "proposal.create") ||
    can(user, "meeting.create") ||
    scoped("proposal.create") ||
    scoped("meeting.create");
  const hasAnyView =
    dashboard.permissions.canViewProjects ||
    dashboard.permissions.canViewProposals ||
    dashboard.permissions.canViewMeetings ||
    dashboard.permissions.canViewDecisions ||
    dashboard.permissions.canViewRisk;
  const mutationMode =
    variant === "viewer"
      ? "read_only"
      : directMutation
        ? "allowed"
        : delegatedActions.length > 0
          ? "delegated_only"
          : hasAnyView
            ? "read_only"
            : "none";

  return {
    canCreateMeeting,
    canCreateProposal,
    canDrillDown: dashboard.permissions.canDrillDown,
    canViewDecisions: dashboard.permissions.canViewDecisions,
    canViewFinance: dashboard.permissions.canViewFinance,
    canViewMeetings: dashboard.permissions.canViewMeetings,
    canViewProjects: dashboard.permissions.canViewProjects,
    canViewProposals: dashboard.permissions.canViewProposals,
    canViewRisk: dashboard.permissions.canViewRisk,
    mutationMode,
  };
}

function emptyAssistantSupport(
  allowedActions: PrivateWorkspaceAction[] = [],
): AssistantPrivateWorkspaceSupport {
  return {
    allowedActions,
    delegations: [],
    meetingDocuments: [],
    pendingApprovals: [],
    reminders: [],
    scheduleItems: [],
    submissionDossiers: [],
    supportTasks: [],
  };
}

function buildAssistantSupport(input: {
  delegationStates: DelegationWorkspaceState[];
  allowedActions: PrivateWorkspaceAction[];
  approvalItems: PrivateWorkspaceSectionItem[];
  deadlineItems: PrivateWorkspaceSectionItem[];
  meetingItems: PrivateWorkspaceSectionItem[];
}) {
  return {
    allowedActions: input.allowedActions,
    delegations: input.delegationStates
      .map((state) => ({
        actionKeys: state.allowedActionKeys,
        canActOnBehalf: state.canActOnBehalf,
        delegationId: state.delegation.id,
        endsAt: state.delegation.endsAt,
        principalUserId: state.delegation.principalUserId,
        reason: state.reason,
        scope: scopeSnapshot(state.delegation),
        startsAt: state.delegation.startsAt,
      })),
    meetingDocuments: input.meetingItems,
    pendingApprovals: input.approvalItems,
    reminders: input.deadlineItems,
    scheduleItems: input.meetingItems,
    submissionDossiers: input.approvalItems,
    supportTasks: input.deadlineItems,
  } satisfies AssistantPrivateWorkspaceSupport;
}

function deriveEmptyState(input: {
  assignedProjects: PrivateWorkspaceSectionItem[];
  assistantDelegations: LeadershipDelegation[];
  permissions: PrivateWorkspacePermissions;
  priorityItems: PrivateWorkspaceSectionItem[];
  selectedScopeInvalid: boolean;
  variant: ExecutivePrivateWorkspaceVariant;
}): ExecutivePrivateWorkspaceEmptyState | undefined {
  if (input.selectedScopeInvalid) {
    return {
      description: "Selected scope khong match assignment active cua user.",
      kind: "invalid_scope",
      title: "Selected scope khong hop le",
    };
  }

  if (input.permissions.mutationMode === "none") {
    return {
      description: "User khong co permission Module 1 trong scope hien tai.",
      kind: "no_permission",
      title: "Khong co quyen xem Private Workspace",
    };
  }

  if (
    input.variant === "secretary_assistant" &&
    input.assistantDelegations.length === 0
  ) {
    return {
      description: "Khong co delegation active va match scope cho tro ly.",
      kind: "delegation_invalid",
      title: "Delegation khong hop le",
    };
  }

  if (
    input.assignedProjects.length === 0 &&
    input.priorityItems.length === 0
  ) {
    return {
      description: "Khong co du lieu trong scope da chon.",
      kind: "no_data",
      title: "Khong co du lieu trong scope",
    };
  }

  return undefined;
}

function emptyDashboard(
  selectedScopeId: string,
  generatedAt: string,
): ExecutiveDashboardData {
  return {
    approvalSummary: {
      highRisk: 0,
      items: [],
      overdue: 0,
      pending: 0,
    },
    financialSummary: {
      reason: "No finance data for empty private workspace.",
      state: "no_permission",
    },
    generatedAt,
    kpis: [],
    meetingSnapshot: {
      followUpsOverdue: 0,
      items: [],
      today: 0,
      total: 0,
      upcoming: 0,
    },
    permissions: {
      canDrillDown: false,
      canViewDecisions: false,
      canViewFinance: false,
      canViewMeetings: false,
      canViewProjects: false,
      canViewProposals: false,
      canViewRisk: false,
    },
    projectPortfolio: {
      active: 0,
      green: 0,
      items: [],
      red: 0,
      total: 0,
      yellow: 0,
    },
    recentDecisions: {
      items: [],
    },
    riskSummary: {
      byCategory: {},
      critical: 0,
      high: 0,
      items: [],
    },
    scope: {
      axisIds: [],
      moduleIds: [],
      organizationIds: [],
      projectIds: [],
      scopeLabel: "Selected scope khong hop le",
      selectedScopeId,
    },
    sourceCounts: {
      decisions: 0,
      executiveActions: 0,
      leadershipApprovals: 0,
      meetings: 0,
      projects: 0,
      proposals: 0,
    },
    todayDeadlines: {
      items: [],
      overdue: 0,
      today: 0,
    },
  };
}

function buildSourceCounts(
  dashboard: ExecutiveDashboardData,
  priorityItems: PrivateWorkspaceSectionItem[],
  delegations: LeadershipDelegation[],
) {
  return {
    ...dashboard.sourceCounts,
    delegations: delegations.length,
    priorityItems: priorityItems.length,
  };
}

function buildKpis(
  dashboardKpis: ExecutiveDashboardKpi[],
  variant: ExecutivePrivateWorkspaceVariant,
  delegatedActions: PrivateWorkspaceAction[],
) {
  if (variant !== "secretary_assistant") {
    return dashboardKpis;
  }

  return [
    ...dashboardKpis,
    {
      id: "assistant-delegated-actions",
      label: "Delegated actions",
      reason: "Active on-behalf actions in current scope",
      sourceType: "executive_action" as const,
      value: delegatedActions.length,
      tone: delegatedActions.length > 0 ? ("emerald" as const) : ("amber" as const),
    },
  ];
}

export async function getExecutivePrivateWorkspaceData(
  user: PermissionUser,
  options: ExecutivePrivateWorkspaceOptions = {},
): Promise<ExecutivePrivateWorkspaceData | null> {
  const today = options.today ?? new Date();
  const generatedAt = new Date().toISOString();
  const [allScopeAssignments, rolePermissionCatalog] = await Promise.all([
    options.scopeAssignments ?? listActiveScopeAssignments(),
    options.rolePermissionCatalog ?? listRolePermissionCatalog(),
  ]);
  const selectedScopeActive =
    Boolean(options.selectedScopeId) && options.selectedScopeId !== "all";
  const selectedScopeAssignments = selectScopeAssignmentsForUser(
    user,
    allScopeAssignments,
    options.selectedScopeId,
  );
  const selectedScopeInvalid =
    selectedScopeActive && selectedScopeAssignments.length === 0;
  const effectiveScopeAssignments = effectiveScopeAssignmentsForUser(
    user,
    allScopeAssignments,
    options.selectedScopeId,
  );
  const requireScopeAssignments =
    options.requireScopeAssignments ??
    (selectedScopeActive || requiresAssignmentScopeForRole(user.role));
  const rawDelegations =
    options.delegations ??
    (await listActiveDelegationsForDelegate(user.id, undefined, today));
  const userDelegations = rawDelegations.filter(
    (delegation) => delegation.delegateUserId === user.id,
  );
  const assistantDelegationStates =
    user.role === "thu_ky_tro_ly"
      ? buildDelegationWorkspaceStates({
          delegations: userDelegations,
          rolePermissionCatalog,
          scopeAssignments: effectiveScopeAssignments,
          selectedScopeActive,
          today,
        })
      : [];
  const scopedDelegations = assistantDelegationStates
    .filter((state) => state.canActOnBehalf)
    .map((state) => state.delegation);
  const delegatedActions = buildDelegatedActions(
    assistantDelegationStates,
  );
  const canUsePrivateWorkspace =
    !selectedScopeInvalid &&
    (canAccessExecutiveModule(user.role) ||
      hasExecutiveAccessFromScope(
        user,
        rolePermissionCatalog,
        effectiveScopeAssignments,
      ) ||
      user.role === "viewer" ||
      user.role === "thu_ky_tro_ly");

  if (!canUsePrivateWorkspace && !selectedScopeInvalid) {
    return null;
  }

  if (selectedScopeInvalid) {
    const dashboard = emptyDashboard(
      options.selectedScopeId ?? "invalid",
      generatedAt,
    );
    const variant = resolveVariant(
      user,
      toOperatingRole(dashboard.scope.operatingRole),
    );
    const permissions = buildPermissions(
      user,
      dashboard,
      rolePermissionCatalog,
      effectiveScopeAssignments,
      delegatedActions,
      variant,
    );
    const invalidScopePermissions: PrivateWorkspacePermissions = {
      ...permissions,
      canCreateMeeting: false,
      canCreateProposal: false,
      canDrillDown: false,
      mutationMode: "none",
    };

    return {
      approvalItems: [],
      assignedProjects: [],
      assistantSupport: emptyAssistantSupport(),
      deadlineItems: [],
      decisionItems: [],
      emptyState: deriveEmptyState({
        assignedProjects: [],
        assistantDelegations: scopedDelegations,
        permissions: invalidScopePermissions,
        priorityItems: [],
        selectedScopeInvalid,
        variant,
      }),
      generatedAt: dashboard.generatedAt,
      kpis: [],
      meetingItems: [],
      permissions: invalidScopePermissions,
      priorityItems: [],
      riskItems: [],
      scope: dashboard.scope,
      sourceCounts: buildSourceCounts(dashboard, [], scopedDelegations),
      variant,
    };
  }

  const dashboard =
    options.dashboardData ??
    (await getExecutiveDashboardData(user, {
      repositories: options.repositories,
      requireScopeAssignments,
      rolePermissionCatalog,
      scopeAssignments: allScopeAssignments,
      selectedScopeId: options.selectedScopeId,
      today,
    }));
  const canLoadExecutiveData =
    canAccessExecutiveModule(user.role) ||
    hasExecutiveAccessFromScope(
      user,
      rolePermissionCatalog,
      effectiveScopeAssignments,
    );
  const executiveData =
    options.executiveData !== undefined
      ? options.executiveData
      : canLoadExecutiveData
        ? await getExecutiveLeadershipData(user, {
            rolePermissionCatalog,
            scopeAssignments: effectiveScopeAssignments,
            selectedScopeId: options.selectedScopeId,
          })
        : null;
  const variant = resolveVariant(
    user,
    executiveData?.accessibleScope.operatingRole ??
      toOperatingRole(dashboard.scope.operatingRole),
  );
  const permissions = buildPermissions(
    user,
    dashboard,
    rolePermissionCatalog,
    effectiveScopeAssignments,
    delegatedActions,
    variant,
  );
  const scopeLabel = dashboard.scope.scopeLabel;
  const assignedProjects = dashboard.projectPortfolio.items.map((item) =>
    toProjectItem(item, permissions, scopeLabel),
  );
  const approvalItems = dashboard.approvalSummary.items.map((item) =>
    toSectionItem(
      item,
      variant === "secretary_assistant" ? "Ho so trinh" : "Approval can xu ly",
      permissions,
      scopeLabel,
      item.priority === "critical" || item.riskLevel === "critical"
        ? "Critical"
        : item.priority === "high" || item.riskLevel === "high"
          ? "High"
          : priorityLabelForItem(item),
    ),
  );
  const riskItems = dashboard.riskSummary.items.map((item) =>
    toSectionItem(
      item,
      "Risk/blocker",
      permissions,
      scopeLabel,
      priorityLabelForRisk(item),
    ),
  );
  const deadlineItems = dashboard.todayDeadlines.items.map((item) =>
    toSectionItem(item, "Deadline", permissions, scopeLabel),
  );
  const decisionItems = dashboard.recentDecisions.items.map((item) =>
    toSectionItem(item, "Quyet dinh", permissions, scopeLabel),
  );
  const meetingItems = dashboard.meetingSnapshot.items.map((item) =>
    toSectionItem(
      item,
      variant === "secretary_assistant" ? "Lich lanh dao" : "Cuoc hop",
      permissions,
      scopeLabel,
    ),
  );
  const prioritySource =
    variant === "secretary_assistant"
      ? [...meetingItems, ...approvalItems, ...deadlineItems]
      : [
          ...riskItems,
          ...approvalItems,
          ...deadlineItems,
          ...decisionItems,
          ...meetingItems,
        ];
  const priorityItems = dedupeAndSortPriorityItems(prioritySource, today);
  const assistantSupport =
    variant === "secretary_assistant"
      ? buildAssistantSupport({
          allowedActions: delegatedActions,
          approvalItems,
          deadlineItems,
          delegationStates: assistantDelegationStates,
          meetingItems,
        })
      : emptyAssistantSupport();

  return {
    approvalItems,
    assignedProjects,
    assistantSupport,
    deadlineItems,
    decisionItems,
    emptyState: deriveEmptyState({
      assignedProjects,
      assistantDelegations: scopedDelegations,
      permissions,
      priorityItems,
      selectedScopeInvalid,
      variant,
    }),
    generatedAt: dashboard.generatedAt,
    kpis: buildKpis(dashboard.kpis, variant, delegatedActions),
    meetingItems,
    permissions,
    priorityItems,
    riskItems,
    scope: dashboard.scope,
    sourceCounts: buildSourceCounts(dashboard, priorityItems, scopedDelegations),
    variant,
  };
}
