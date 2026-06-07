import {
  hasAnyScopedActionGrant,
  requiresAssignmentScopeForRole,
} from "@/lib/permissions/access-scope";
import { businessDayIndex } from "@/lib/date/business-day";
import {
  can,
  type PermissionAction,
  type PermissionUser,
} from "@/lib/permissions/can";
import { selectScopeAssignmentsForUser } from "@/lib/permissions/navigation-context";
import {
  buildExecutiveAiSummaryDraft,
  type ExecutiveAiSummaryBuildOptions,
} from "@/modules/ai/services/executive-ai-summary-service";
import type {
  ExecutiveDashboardData,
  ExecutiveDashboardKpi,
  ExecutiveDashboardSourceItem,
  ExecutiveFinancialSummary,
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
  PrivateWorkspacePermissionOverview,
  PrivateWorkspaceProfessionalApprovals,
  PrivateWorkspaceProjectCost,
  PrivateWorkspaceResourceProgress,
  PrivateWorkspaceSectionItem,
  PrivateWorkspaceWorkflowChecklist,
} from "@/modules/workspaces/types";

type ExecutivePrivateWorkspaceRepositories =
  ExecutiveDashboardOptions["repositories"];

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
  aiSummary?: ExecutiveAiSummaryBuildOptions;
};

type DelegationWorkspaceState = {
  allowedActionKeys: PermissionAction[];
  canActOnBehalf: boolean;
  delegation: LeadershipDelegation;
  reason: string;
};

type NoPermissionFinancialSummary = Extract<
  ExecutiveFinancialSummary,
  { state: "no_permission" }
>;

const delegatedCreateActions = new Set<PermissionAction>([
  "proposal.create",
  "meeting.create",
  "document.create",
  "task.create",
  "risk.create",
  "risk.update",
  "risk.override",
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
      [
        "project.view",
        "proposal.view",
        "meeting.view",
        "decision.approve",
      ].some((permission) =>
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

function dimensionsCompatible(
  assignmentValue?: string,
  delegationValue?: string,
) {
  if (
    !assignmentValue ||
    assignmentValue === "*" ||
    !delegationValue ||
    delegationValue === "*"
  ) {
    return true;
  }

  return (
    normalizeDimension(assignmentValue) === normalizeDimension(delegationValue)
  );
}

function delegationMatchesAssignment(
  delegation: LeadershipDelegation,
  assignment: ScopeAssignment,
) {
  return (
    dimensionsCompatible(
      assignment.organizationId,
      delegation.organizationId,
    ) &&
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
    return "Chỉ xem trong phạm vi hiện tại.";
  }

  if (permissions.mutationMode === "none") {
    return "Không có quyền thao tác trong phạm vi hiện tại.";
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
    return "Đỏ";
  }

  if (status === "yellow") {
    return "Vàng";
  }

  if (status === "green") {
    return "Xanh";
  }

  return status;
}

function priorityLabelForRisk(item: ExecutiveRiskItem) {
  return item.severityLabel;
}

function priorityLabelForItem(item: ExecutiveDashboardSourceItem) {
  if (item.tone === "red") {
    return item.status === "overdue" ? "Quá hạn" : "Cao";
  }

  if (item.tone === "amber") {
    return "Cần chú ý";
  }

  return "Thông tin";
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
    "Dự án được giao",
    permissions,
    scopeLabel,
    healthLabel(item.status),
  );
}

function scoreItem(item: PrivateWorkspaceSectionItem, today: Date) {
  if (
    item.priorityLabel === "Critical" ||
    item.priorityLabel === "Nghiêm trọng"
  ) {
    return 100;
  }

  if (item.priorityLabel === "High" || item.priorityLabel === "Cao") {
    return 90;
  }

  if (item.sourceType === "risk") {
    if (
      item.priorityLabel === "Medium" ||
      item.priorityLabel === "Trung bình"
    ) {
      return 60;
    }

    return 30;
  }

  if (item.deadline) {
    const deadline = businessDayIndex(item.deadline);
    const current = businessDayIndex(today);

    if (deadline !== undefined && current !== undefined && deadline < current) {
      return 85;
    }

    if (
      deadline !== undefined &&
      current !== undefined &&
      deadline === current
    ) {
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

    return Boolean(
      permission && isDelegationActionAllowed(actionKey, permission),
    );
  });
}

function reasonForDelegationStatus(status: string) {
  if (status === "expired") {
    return "Ủy quyền đã hết hiệu lực.";
  }

  if (status === "scheduled") {
    return "Ủy quyền chưa đến thời gian hiệu lực.";
  }

  if (status === "inactive") {
    return "Ủy quyền đang tạm ngưng.";
  }

  return "Ủy quyền không hợp lệ.";
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
        reason: "Ủy quyền đang hiệu lực nhưng nằm ngoài phạm vi đã chọn.",
      };
    }

    if (allowedActionKeys.length === 0) {
      return {
        allowedActionKeys,
        canActOnBehalf: false,
        delegation,
        reason:
          "Không có thao tác được phép ủy quyền trong danh mục quyền hiện tại.",
      };
    }

    return {
      allowedActionKeys,
      canActOnBehalf: true,
      delegation,
      reason: "Ủy quyền đang hiệu lực và khớp phạm vi.",
    };
  });
}

function actionLabel(actionKey: PermissionAction) {
  if (actionKey === "proposal.create") {
    return "Tạo đề xuất thay lãnh đạo";
  }

  if (actionKey === "meeting.create") {
    return "Tạo lịch họp thay lãnh đạo";
  }

  if (actionKey === "document.create") {
    return "Tạo hồ sơ hỗ trợ";
  }

  if (actionKey === "task.create") {
    return "Tạo việc hỗ trợ";
  }

  if (actionKey === "risk.create") {
    return "Tạo rủi ro/vướng mắc thay lãnh đạo";
  }

  if (actionKey === "risk.update") {
    return "Cập nhật rủi ro/vướng mắc thay lãnh đạo";
  }

  if (actionKey === "risk.override") {
    return "Xác nhận/điều chỉnh rủi ro thay lãnh đạo";
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
  const canCreateRisk =
    dashboard.permissions.canCreateRisk ||
    can(user, "risk.create") ||
    scoped("risk.create") ||
    delegatedActions.some((action) => action.actionKey === "risk.create");
  const canUpdateRisk =
    dashboard.permissions.canUpdateRisk ||
    can(user, "risk.update") ||
    scoped("risk.update") ||
    delegatedActions.some((action) => action.actionKey === "risk.update");
  const canOverrideRisk =
    dashboard.permissions.canOverrideRisk ||
    can(user, "risk.override") ||
    scoped("risk.override") ||
    delegatedActions.some((action) => action.actionKey === "risk.override");
  const canCloseRisk =
    dashboard.permissions.canCloseRisk ||
    can(user, "risk.close") ||
    scoped("risk.close");
  const canCloseHighRisk =
    dashboard.permissions.canCloseHighRisk ||
    can(user, "risk.close_high") ||
    scoped("risk.close_high");
  const directMutation =
    can(user, "proposal.create") ||
    can(user, "meeting.create") ||
    can(user, "risk.create") ||
    can(user, "risk.update") ||
    can(user, "risk.override") ||
    can(user, "risk.close") ||
    can(user, "risk.close_high") ||
    scoped("proposal.create") ||
    scoped("meeting.create") ||
    scoped("risk.create") ||
    scoped("risk.update") ||
    scoped("risk.override") ||
    scoped("risk.close") ||
    scoped("risk.close_high");
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
    canCreateRisk,
    canUpdateRisk,
    canOverrideRisk,
    canCloseRisk,
    canCloseHighRisk,
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
    delegations: input.delegationStates.map((state) => ({
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
      description:
        "Phạm vi đã chọn không khớp với phân quyền đang hiệu lực của người dùng.",
      kind: "invalid_scope",
      title: "Phạm vi đã chọn không hợp lệ",
    };
  }

  if (input.permissions.mutationMode === "none") {
    return {
      description:
        "Người dùng không có quyền vào Module 1 trong phạm vi hiện tại.",
      kind: "no_permission",
      title: "Không có quyền xem Không Gian Làm Việc Cá Nhân",
    };
  }

  if (
    input.variant === "secretary_assistant" &&
    input.assistantDelegations.length === 0
  ) {
    return {
      description:
        "Không có ủy quyền đang hiệu lực và khớp phạm vi cho trợ lý.",
      kind: "delegation_invalid",
      title: "Ủy quyền không hợp lệ",
    };
  }

  if (input.assignedProjects.length === 0 && input.priorityItems.length === 0) {
    return {
      description: "Không có dữ liệu trong phạm vi đã chọn.",
      kind: "no_data",
      title: "Không có dữ liệu trong phạm vi",
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
      reason: "Không có dữ liệu tài chính cho không gian làm việc trống.",
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
      canCreateRisk: false,
      canUpdateRisk: false,
      canOverrideRisk: false,
      canCloseRisk: false,
      canCloseHighRisk: false,
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
      riskMap: {
        affectedProjectCount: 0,
        categories: [],
        matrix: [],
        total: 0,
      },
    },
    riskMutationOptions: {
      categories: [],
      delegations: [],
      owners: [],
      projects: [],
    },
    scope: {
      axisIds: [],
      moduleIds: [],
      organizationIds: [],
      projectIds: [],
      scopeLabel: "Phạm vi đã chọn không hợp lệ",
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

function noPermissionFinancialSummary(
  reason: string,
): NoPermissionFinancialSummary {
  return {
    reason,
    state: "no_permission",
  };
}

function resolveWorkspaceFinancialSummary(
  dashboard: ExecutiveDashboardData,
  permissions: PrivateWorkspacePermissions,
): ExecutiveFinancialSummary {
  if (!permissions.canViewFinance) {
    return noPermissionFinancialSummary(
      "Không có quyền xem tài chính trong phạm vi Private Workspace hiện tại.",
    );
  }

  return dashboard.financialSummary;
}

function buildPermissionOverview(
  user: PermissionUser,
  permissions: PrivateWorkspacePermissions,
): PrivateWorkspacePermissionOverview {
  const boAdminEnabled = can(user, "settings.manage");
  const items: PrivateWorkspacePermissionOverview["items"] = [
    {
      actionKey: "project.view",
      enabled: permissions.canViewProjects,
      id: "project-view",
      label: "Dữ liệu dự án",
      reason: permissions.canViewProjects
        ? "Được xem dự án trong dynamic scope hiện tại."
        : "Không có project.view trong dynamic scope hiện tại.",
      tone: permissions.canViewProjects ? "emerald" : "slate",
    },
    {
      actionKey: "finance.view",
      enabled: permissions.canViewFinance,
      id: "finance-view",
      label: "Dữ liệu tài chính",
      reason: permissions.canViewFinance
        ? "Được xem dòng tiền/chi phí trong phạm vi được cấp quyền."
        : "Không có finance.view trong dynamic scope hiện tại.",
      tone: permissions.canViewFinance ? "emerald" : "slate",
    },
    {
      actionKey: "risk.override",
      enabled: permissions.canOverrideRisk,
      id: "risk-governance",
      label: "Quản trị rủi ro",
      reason: permissions.canOverrideRisk
        ? "Có quyền override/quản trị rủi ro trong dynamic scope hiện tại."
        : "Không có risk.override trong dynamic scope hiện tại.",
      tone: permissions.canOverrideRisk ? "emerald" : "slate",
    },
    {
      enabled: permissions.canDrillDown,
      id: "source-drilldown",
      label: "Drilldown nguồn",
      reason: permissions.canDrillDown
        ? "Được mở chi tiết nguồn nghiệp vụ đã lọc theo permission."
        : "Không có quyền mở chi tiết nguồn trong scope hiện tại.",
      tone: permissions.canDrillDown ? "emerald" : "slate",
    },
    {
      actionKey: "settings.manage",
      enabled: boAdminEnabled,
      id: "bo-admin",
      label: "BO/Admin",
      reason: boAdminEnabled
        ? "Có quyền quản trị hệ thống theo role hoặc permission trực tiếp."
        : "Không tự động có quyền BO/Admin từ Private Workspace.",
      tone: boAdminEnabled ? "amber" : "slate",
    },
  ];

  return {
    items,
    state: "available",
  };
}

function formatPercentage(value: number) {
  return `${Math.round(value)}%`;
}

function buildResourceProgress(
  dashboard: ExecutiveDashboardData,
  assignedProjects: PrivateWorkspaceSectionItem[],
  deadlineItems: PrivateWorkspaceSectionItem[],
): PrivateWorkspaceResourceProgress {
  const progressValues = dashboard.projectPortfolio.items
    .map((item) => item.progress)
    .filter(
      (value): value is number =>
        typeof value === "number" &&
        Number.isFinite(value) &&
        value >= 0 &&
        value <= 100,
    );
  const averageProgress =
    progressValues.length > 0
      ? progressValues.reduce((total, value) => total + value, 0) /
        progressValues.length
      : undefined;
  const owners = new Set(
    [...assignedProjects, ...deadlineItems]
      .map((item) => item.owner)
      .filter((owner): owner is string => Boolean(owner)),
  );
  const deadlinePressure = deadlineItems.filter(
    (item) => item.tone === "red" || item.status === "overdue",
  ).length;
  const hasProjectData = dashboard.projectPortfolio.items.length > 0;
  const hasProgressMetadata = progressValues.length > 0;
  const hasResourceMetadata = owners.size > 0;

  if (!hasProjectData || !hasProgressMetadata || !hasResourceMetadata) {
    return {
      items: [],
      reason:
        "Chưa đủ progress và owner/resource metadata trong scope Private Workspace hiện tại.",
      state: "empty",
    };
  }

  return {
    items: [
      {
        helper: `${dashboard.projectPortfolio.total} dự án trong scope vận hành.`,
        id: "project-progress",
        label: "Tiến độ trung bình",
        tone:
          averageProgress === undefined
            ? "slate"
            : averageProgress < 60
              ? "red"
              : averageProgress < 80
                ? "amber"
                : "emerald",
        value:
          averageProgress === undefined
            ? "Chưa có"
            : formatPercentage(averageProgress),
      },
      {
        helper: "Đỏ / Vàng / Xanh theo danh mục dự án được thấy.",
        id: "project-health-mix",
        label: "Dự án đỏ/vàng/xanh",
        tone:
          dashboard.projectPortfolio.red > 0
            ? "red"
            : dashboard.projectPortfolio.yellow > 0
              ? "amber"
              : "emerald",
        value: `${dashboard.projectPortfolio.red}/${dashboard.projectPortfolio.yellow}/${dashboard.projectPortfolio.green}`,
      },
      {
        helper:
          owners.size > 0
            ? "Owner/resource xuất hiện trong việc và dự án."
            : undefined,
        id: "resource-load",
        label: "Resource/owner active",
        tone: owners.size > 0 ? "blue" : "slate",
        value: owners.size,
      },
      {
        helper: `${deadlineItems.length} việc có hạn trong scope.`,
        id: "deadline-pressure",
        label: "Áp lực deadline",
        tone:
          deadlinePressure > 0
            ? "red"
            : deadlineItems.length > 0
              ? "amber"
              : "slate",
        value: deadlinePressure,
      },
    ],
    state: "available",
  };
}

function buildProjectCost(
  permissions: PrivateWorkspacePermissions,
  financialSummary: ExecutiveFinancialSummary,
  assignedProjects: PrivateWorkspaceSectionItem[],
): PrivateWorkspaceProjectCost {
  if (
    !permissions.canViewFinance &&
    financialSummary.state === "no_permission"
  ) {
    return {
      financialSummary,
      items: [],
      reason: financialSummary.reason,
      state: "no_permission",
    };
  }

  if (!permissions.canViewFinance) {
    const deniedSummary = noPermissionFinancialSummary(
      "Không có quyền xem tài chính trong phạm vi Private Workspace hiện tại.",
    );

    return {
      financialSummary: deniedSummary,
      items: [],
      reason: deniedSummary.reason,
      state: "no_permission",
    };
  }

  if (financialSummary.state === "no_permission") {
    return {
      financialSummary,
      items: [],
      reason: financialSummary.reason,
      state: "no_permission",
    };
  }

  const assignedProjectIds = new Set(
    assignedProjects
      .map((item) => item.projectId)
      .filter((projectId): projectId is string => Boolean(projectId)),
  );
  const scopedFinanceItems = financialSummary.items.filter(
    (item) =>
      item.projectId !== undefined && assignedProjectIds.has(item.projectId),
  );
  const scopedFinanceProjectIds = new Set(
    scopedFinanceItems
      .map((item) => item.projectId)
      .filter((projectId): projectId is string => Boolean(projectId)),
  );
  const scopedFinancialSummary: ExecutiveFinancialSummary = {
    ...financialSummary,
    access:
      scopedFinanceItems.length === financialSummary.items.length
        ? financialSummary.access
        : "partial",
    items: scopedFinanceItems,
    visibleAmountTotal: scopedFinanceItems.reduce(
      (total, item) => total + item.amount,
      0,
    ),
    visibleRecordCount: scopedFinanceItems.length,
  };
  const items = assignedProjects.filter(
    (item) =>
      item.projectId !== undefined &&
      scopedFinanceProjectIds.has(item.projectId) &&
      (!("financialAccess" in item) ||
        (item as PrivateWorkspaceSectionItem & { financialAccess?: string })
          .financialAccess === "allowed"),
  );

  return {
    financialSummary: scopedFinancialSummary,
    items,
    reason:
      items.length > 0
        ? undefined
        : "Không có dự án có dữ liệu chi phí/dòng tiền trong scope hiện tại.",
    state:
      items.length > 0 && scopedFinancialSummary.visibleRecordCount > 0
        ? "available"
        : "empty",
  };
}

function withGroupLabel(
  items: PrivateWorkspaceSectionItem[],
  groupLabel: string,
) {
  return items.map((item) => ({
    ...item,
    groupLabel,
  }));
}

function dedupeSectionItems(items: PrivateWorkspaceSectionItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.sourceType}:${item.sourceId}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function isWorkflowChecklistCandidate(item: PrivateWorkspaceSectionItem) {
  const text = [item.title, item.reason, item.moduleId, item.groupLabel]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return [
    "workflow",
    "checklist",
    "hồ sơ",
    "ho so",
    "pháp lý",
    "phap ly",
    "quy hoạch",
    "quy hoach",
  ].some((keyword) => text.includes(keyword));
}

function isProfessionalApprovalCandidate(item: PrivateWorkspaceSectionItem) {
  const text = [item.title, item.reason, item.moduleId, item.groupLabel]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const professionalModule = [
    "compliance",
    "contract",
    "document",
    "documents",
    "legal",
    "permit",
    "planning",
    "quality",
  ].some((moduleId) => item.moduleId?.toLowerCase() === moduleId);

  if (professionalModule) {
    return true;
  }

  return [
    "chuyên môn",
    "chuyen mon",
    "hồ sơ",
    "ho so",
    "hợp đồng",
    "hop dong",
    "legal",
    "permit",
    "pháp lý",
    "phap ly",
    "quy hoạch",
    "quy hoach",
    "thiết kế",
    "thiet ke",
    "workflow",
  ].some((keyword) => text.includes(keyword));
}

function buildWorkflowChecklist(
  approvalItems: PrivateWorkspaceSectionItem[],
  deadlineItems: PrivateWorkspaceSectionItem[],
  assignedProjects: PrivateWorkspaceSectionItem[],
  excludedItems: PrivateWorkspaceSectionItem[] = [],
): PrivateWorkspaceWorkflowChecklist {
  const excludedKeys = new Set(
    excludedItems.map((item) => `${item.sourceType}:${item.sourceId}`),
  );
  const candidates = [
    ...deadlineItems,
    ...approvalItems,
    ...assignedProjects,
  ].filter(
    (item) =>
      isWorkflowChecklistCandidate(item) &&
      !excludedKeys.has(`${item.sourceType}:${item.sourceId}`),
  );
  const items = withGroupLabel(
    dedupeSectionItems(candidates).slice(0, 8),
    "Workflow/checklist chuyên môn",
  );

  return {
    items,
    reason:
      items.length > 0
        ? undefined
        : "Chưa có workflow/checklist trong scope chuyên môn.",
    state: items.length > 0 ? "available" : "empty",
  };
}

function buildProfessionalApprovals(
  approvalItems: PrivateWorkspaceSectionItem[],
): PrivateWorkspaceProfessionalApprovals {
  const items = withGroupLabel(
    approvalItems.filter(isProfessionalApprovalCandidate).slice(0, 8),
    "Phê duyệt chuyên môn",
  );

  return {
    items,
    reason:
      items.length > 0
        ? undefined
        : "Chưa có phê duyệt chuyên môn trong scope hiện tại.",
    state: items.length > 0 ? "available" : "empty",
  };
}

function sourceKey(
  item: Pick<ExecutiveDashboardSourceItem, "sourceId" | "sourceType">,
) {
  return `${item.sourceType}:${item.sourceId}`;
}

function buildWorkspaceAiCitation(item: PrivateWorkspaceSectionItem) {
  return {
    href: item.href,
    id: `workspace-ai-citation-${item.sourceType}-${item.sourceId}`,
    projectId: item.projectId,
    sourceId: item.sourceId,
    sourceType: item.sourceType,
    title: item.title,
  };
}

function buildWorkspaceAiSource(input: {
  approvalItems: PrivateWorkspaceSectionItem[];
  assignedProjects: PrivateWorkspaceSectionItem[];
  deadlineItems: PrivateWorkspaceSectionItem[];
  decisionItems: PrivateWorkspaceSectionItem[];
  meetingItems: PrivateWorkspaceSectionItem[];
  priorityItems: PrivateWorkspaceSectionItem[];
  riskItems: PrivateWorkspaceSectionItem[];
  scopeLabel: string;
  variant: ExecutivePrivateWorkspaceVariant;
}) {
  const candidates = [
    ...input.priorityItems,
    ...input.riskItems,
    ...input.approvalItems,
    ...input.deadlineItems,
    ...input.decisionItems,
    ...input.meetingItems,
    ...input.assignedProjects,
  ];
  const seen = new Set<string>();
  const visibleItems = candidates.filter((item) => {
    const key = sourceKey(item);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  return {
    citations: visibleItems.slice(0, 8).map(buildWorkspaceAiCitation),
    generatedFrom: [
      "ExecutivePrivateWorkspaceData.priorityItems",
      "ExecutivePrivateWorkspaceData.riskItems",
      "ExecutivePrivateWorkspaceData.approvalItems",
      "ExecutivePrivateWorkspaceData.deadlineItems",
      "ExecutivePrivateWorkspaceData.decisionItems",
      "ExecutivePrivateWorkspaceData.meetingItems",
      "ExecutivePrivateWorkspaceData.assignedProjects",
    ],
    sourceText: visibleItems.length
      ? [
          `Không Gian Làm Việc Cá Nhân ${input.variant} trong ${input.scopeLabel}.`,
          `Ưu tiên: ${input.priorityItems.length}; phê duyệt: ${input.approvalItems.length}; rủi ro: ${input.riskItems.length}; hạn xử lý: ${input.deadlineItems.length}; quyết định: ${input.decisionItems.length}; cuộc họp: ${input.meetingItems.length}.`,
          ...visibleItems
            .slice(0, 8)
            .map((item) =>
              [
                item.groupLabel,
                item.priorityLabel,
                item.title,
                item.status,
                item.deadline ? `hạn xử lý ${item.deadline}` : undefined,
                item.reason,
              ]
                .filter(Boolean)
                .join(" | "),
            ),
        ].join("\n")
      : "",
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
      label: "Thao tác được ủy quyền",
      reason: "Thao tác thay mặt đang hiệu lực trong phạm vi hiện tại",
      sourceType: "executive_action" as const,
      value: delegatedActions.length,
      tone:
        delegatedActions.length > 0 ? ("emerald" as const) : ("amber" as const),
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
  const delegatedActions = buildDelegatedActions(assistantDelegationStates);
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
      canCreateRisk: false,
      canUpdateRisk: false,
      canOverrideRisk: false,
      canCloseRisk: false,
      canCloseHighRisk: false,
      canDrillDown: false,
      mutationMode: "none",
    };
    const aiSummary = await buildExecutiveAiSummaryDraft(
      user,
      {
        citations: [],
        generatedAt: dashboard.generatedAt,
        generatedFrom: [],
        sourceText: "",
        view: "private_workspace",
      },
      options.aiSummary,
    );
    const financialSummary = resolveWorkspaceFinancialSummary(
      dashboard,
      invalidScopePermissions,
    );

    return {
      approvalItems: [],
      assignedProjects: [],
      assistantSupport: emptyAssistantSupport(),
      aiSummary,
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
      financialSummary,
      generatedAt: dashboard.generatedAt,
      kpis: [],
      meetingItems: [],
      permissionOverview: buildPermissionOverview(
        user,
        invalidScopePermissions,
      ),
      permissions: invalidScopePermissions,
      professionalApprovals: buildProfessionalApprovals([]),
      projectCost: buildProjectCost(
        invalidScopePermissions,
        financialSummary,
        [],
      ),
      priorityItems: [],
      resourceProgress: buildResourceProgress(dashboard, [], []),
      riskItems: [],
      riskMap: dashboard.riskSummary.riskMap,
      scope: dashboard.scope,
      sourceCounts: buildSourceCounts(dashboard, [], scopedDelegations),
      variant,
      workflowChecklist: buildWorkflowChecklist([], [], []),
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
      variant === "secretary_assistant" ? "Hồ sơ trình" : "Phê duyệt cần xử lý",
      permissions,
      scopeLabel,
      item.priority === "critical" || item.riskLevel === "critical"
        ? "Nghiêm trọng"
        : item.priority === "high" || item.riskLevel === "high"
          ? "Cao"
          : priorityLabelForItem(item),
    ),
  );
  const riskItems = dashboard.riskSummary.items.map((item) =>
    toSectionItem(
      item,
      "Rủi ro/vướng mắc",
      permissions,
      scopeLabel,
      priorityLabelForRisk(item),
    ),
  );
  const deadlineItems = dashboard.todayDeadlines.items.map((item) =>
    toSectionItem(item, "Hạn xử lý", permissions, scopeLabel),
  );
  const decisionItems = dashboard.recentDecisions.items.map((item) =>
    toSectionItem(item, "Quyết định", permissions, scopeLabel),
  );
  const meetingItems = dashboard.meetingSnapshot.items.map((item) =>
    toSectionItem(
      item,
      variant === "secretary_assistant" ? "Lịch lãnh đạo" : "Cuộc họp",
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
  const financialSummary = resolveWorkspaceFinancialSummary(
    dashboard,
    permissions,
  );
  const resourceProgress =
    variant === "ceo"
      ? buildResourceProgress(dashboard, assignedProjects, deadlineItems)
      : undefined;
  const projectCost =
    variant === "project_director"
      ? buildProjectCost(permissions, financialSummary, assignedProjects)
      : undefined;
  const professionalApprovals =
    variant === "department_head"
      ? buildProfessionalApprovals(approvalItems)
      : undefined;
  const workflowChecklist =
    variant === "department_head"
      ? buildWorkflowChecklist(
          approvalItems,
          deadlineItems,
          assignedProjects,
          professionalApprovals?.items,
        )
      : undefined;
  const workspaceAiSource = buildWorkspaceAiSource({
    approvalItems,
    assignedProjects,
    deadlineItems,
    decisionItems,
    meetingItems,
    priorityItems,
    riskItems,
    scopeLabel,
    variant,
  });
  const aiSummary = await buildExecutiveAiSummaryDraft(
    user,
    {
      ...workspaceAiSource,
      generatedAt: dashboard.generatedAt,
      view: "private_workspace",
    },
    options.aiSummary,
  );

  return {
    approvalItems,
    assignedProjects,
    assistantSupport,
    aiSummary,
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
    financialSummary: variant === "chairman" ? financialSummary : undefined,
    generatedAt: dashboard.generatedAt,
    kpis: buildKpis(dashboard.kpis, variant, delegatedActions),
    meetingItems,
    permissionOverview:
      variant === "chairman"
        ? buildPermissionOverview(user, permissions)
        : undefined,
    permissions,
    professionalApprovals,
    projectCost,
    priorityItems,
    resourceProgress,
    riskItems,
    riskMap: variant === "chairman" ? dashboard.riskSummary.riskMap : undefined,
    scope: dashboard.scope,
    sourceCounts: buildSourceCounts(
      dashboard,
      priorityItems,
      scopedDelegations,
    ),
    variant,
    workflowChecklist,
  };
}
