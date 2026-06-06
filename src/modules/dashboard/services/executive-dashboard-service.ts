import {
  canAccessScopedAction,
  filterDecisionsForScope,
  filterMeetingsForScope,
  filterProjectsForScope,
  filterProposalsForScope,
  hasAnyScopedActionGrant,
  requiresAssignmentScopeForRole,
  resolveAccessScope,
} from "@/lib/permissions/access-scope";
import {
  businessDayIndex,
  isBeforeBusinessDay,
  isDueOnOrBeforeBusinessDay,
  isSameBusinessDay,
} from "@/lib/date/business-day";
import { can, type PermissionAction, type PermissionUser } from "@/lib/permissions/can";
import type { NotificationRepository } from "@/lib/notifications/notification-repository";
import { queueRiskEscalationNotification } from "@/lib/notifications/notification-service";
import { selectScopeAssignmentsForUser } from "@/lib/permissions/navigation-context";
import { canAccessExecutiveModule } from "@/modules/executive/constants";
import { getExecutiveLeadershipData } from "@/modules/executive/services/executive-service";
import {
  buildExecutiveRiskItem,
  buildExecutiveRiskMap,
  buildExecutiveRiskItemFromRecord,
} from "@/modules/executive/services/risk-status-service";
import {
  filterExecutiveRiskRecordsForScope,
} from "@/modules/executive/services/risk-record-service";
import {
  resolveRiskEscalationPolicyForRecord,
  resolveRiskEscalationState,
  resolveRiskOverdueState,
} from "@/modules/executive/services/risk-alert-service";
import {
  riskRecordRepository,
  type RiskRecordRepository,
} from "@/modules/executive/services/risk-record-repository";
import type {
  ExecutiveDecisionLogItem,
  ExecutiveLeadershipActionItem,
  ExecutiveProjectRow,
  ExecutiveRiskRecord,
  ExecutiveRiskGroupMetadata,
  LeadershipApproval,
} from "@/modules/executive/types";
import {
  meetingRepository,
  type MeetingRepository,
} from "@/modules/meetings/services/meeting-repository";
import type { Decision, Meeting } from "@/modules/meetings/types";
import {
  projectRepository,
  type ProjectRepository,
} from "@/modules/projects/services/project-repository";
import { listProjects } from "@/modules/projects/services/project-service";
import type { Project } from "@/modules/projects/types";
import {
  proposalRepository,
  type ProposalRepository,
} from "@/modules/proposals/services/proposal-repository";
import {
  resolveApprovalEscalationState,
  resolveApprovalOverdueState,
} from "@/modules/proposals/services/approval-escalation-service";
import { queueApprovalEscalationNotification } from "@/modules/proposals/services/approval-escalation-notification-service";
import type { Proposal } from "@/modules/proposals/types";
import {
  findMatchingApprovalThresholdPolicy,
  listActiveApprovalThresholds,
  listActiveRiskGroups,
} from "@/modules/settings/services/policy-settings-service";
import type { PolicySettingsRepository } from "@/modules/settings/services/policy-settings-repository";
import {
  leadershipDelegationRepository,
  type LeadershipDelegationRepository,
} from "@/modules/settings/services/leadership-delegation-repository";
import {
  getLeadershipDelegationStatus,
  isDelegationActionAllowed,
} from "@/modules/settings/services/leadership-delegation-service";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import { listActiveScopeAssignments } from "@/modules/settings/services/scope-assignment-service";
import type {
  ApprovalThresholdPolicy,
  LeadershipDelegation,
  PolicyScope,
  RiskSeverity,
  RiskGroupConfig,
  RolePermissionCatalog,
  ScopeAssignment,
} from "@/modules/settings/types";
import type { AuditLog } from "@/modules/users/types";
import { listProjectMemberships } from "@/modules/users/services/user-service";

import type {
  ExecutiveApprovalItem,
  ExecutiveDashboardData,
  ExecutiveDashboardKpi,
  ExecutiveDashboardSourceItem,
  ExecutiveDashboardTone,
  ExecutiveDeadlineSummary,
  ExecutiveFinancialSummary,
  ExecutiveMeetingSnapshot,
  ExecutiveProjectPortfolio,
  ExecutiveProjectPortfolioItem,
  ExecutiveRecentDecisions,
  ExecutiveRiskItem,
  ExecutiveRiskMutationOptions,
  ExecutiveRiskSummary,
} from "../types";
import { enrichExecutiveDashboardDataSources } from "./executive-drilldown-source";

type ExecutiveDashboardRepositories = {
  projects?: ProjectRepository;
  proposals?: ProposalRepository;
  meetings?: MeetingRepository;
  riskRecords?: RiskRecordRepository;
};

export type ExecutiveDashboardOptions = {
  approvalPolicies?: ApprovalThresholdPolicy[];
  auditWriter?: (input: Omit<AuditLog, "id" | "createdAt">) => Promise<AuditLog>;
  delegationRepository?: LeadershipDelegationRepository;
  delegations?: LeadershipDelegation[];
  notificationRepository?: NotificationRepository;
  policyRepository?: PolicySettingsRepository;
  selectedScopeId?: string;
  scopeAssignments?: ScopeAssignment[];
  rolePermissionCatalog?: RolePermissionCatalog;
  repositories?: ExecutiveDashboardRepositories;
  today?: Date;
  requireScopeAssignments?: boolean;
};

const executiveScopedPermissions = [
  "project.view",
  "task.view",
  "document.view",
  "legal.view",
  "finance.view",
  "meeting.view",
  "decision.approve",
  "proposal.view",
  "proposal.approve",
  "risk.view",
  "risk.create",
  "risk.update",
  "risk.override",
  "risk.close",
  "risk.close_high",
] satisfies PermissionAction[];

const nonPendingApprovalStatuses = new Set([
  "draft",
  "approved",
  "rejected",
  "cancelled",
  "archived",
  "returned",
]);
const finalDecisionStatuses = new Set(["done", "approved", "rejected"]);
const terminalMeetingFollowUpStatuses = new Set(["done", "cancelled"]);

function isBeforeDay(value: string | undefined, today: Date) {
  return isBeforeBusinessDay(value, today);
}

function isSameDay(value: string | undefined, today: Date) {
  return isSameBusinessDay(value, today);
}

function isDueTodayOrOverdue(value: string | undefined, today: Date) {
  return isDueOnOrBeforeBusinessDay(value, today);
}

function isOpenMeetingFollowUp(action: Pick<Meeting["followUpActions"][number], "status">) {
  return !terminalMeetingFollowUpStatuses.has(String(action.status ?? "open"));
}

function formatVnd(amount: number) {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} VND`;
}

type DashboardEscalationContext = {
  delegations: LeadershipDelegation[];
  now: Date;
  options: Pick<ExecutiveDashboardOptions, "auditWriter" | "notificationRepository">;
  policies: ApprovalThresholdPolicy[];
  user: PermissionUser;
};

type RiskAlertDashboardContext = DashboardEscalationContext & {
  generatedAt: string;
  riskGroups: RiskMutationGroup[];
};

function toEscalationPolicy(policy: ApprovalThresholdPolicy | undefined, fallbackLabel?: string) {
  return {
    id: policy?.id,
    label: policy?.labelVi ?? fallbackLabel,
    roleKey: policy?.approverRoleKey,
    escalateAfterDays: policy?.escalateAfterDays,
    escalateOnRiskLevels: policy?.escalateOnRiskLevels,
  };
}

function proposalPolicy(proposal: Proposal, policies: ApprovalThresholdPolicy[]) {
  return toEscalationPolicy(
    findMatchingApprovalThresholdPolicy(policies, {
      amount: proposal.amount,
      moduleId: proposal.module,
      scope: {
        projectId: proposal.projectId,
        moduleId: proposal.module,
        recordId: proposal.id,
      },
      targetType: proposal.type,
    }),
  );
}

function approvalPolicy(
  approval: LeadershipApproval,
  policies: ApprovalThresholdPolicy[],
) {
  const levelMatches = policies.filter(
    (policy) =>
      policy.approvalLevel === approval.approvalLevel ||
      policy.labelVi === approval.approvalLevel ||
      policy.approverRoleKey === approval.approvalLevel,
  );

  return toEscalationPolicy(
    findMatchingApprovalThresholdPolicy(levelMatches, {
      amount: approval.amount,
      riskLevel: approval.riskLevel,
      scope: {
        organizationId: approval.organizationId,
        projectId: approval.projectId,
        recordId: approval.id,
      },
      targetType: approval.type,
    }),
    approval.approvalLevel,
  );
}

function actionPolicy(
  action: ExecutiveLeadershipActionItem,
  policies: ApprovalThresholdPolicy[],
) {
  const levelMatches = policies.filter(
    (policy) =>
      policy.approvalLevel === action.approvalLevel ||
      policy.labelVi === action.approvalLevel ||
      policy.approverRoleKey === action.approvalLevel,
  );
  const scope: PolicyScope = {
    axisId: action.scope.axisId,
    moduleId: action.scope.moduleId,
    organizationId: action.scope.organizationId,
    projectId: action.scope.projectId,
    recordId: action.id,
  };

  return toEscalationPolicy(
    findMatchingApprovalThresholdPolicy(levelMatches, {
      amount: action.amount,
      riskLevel: action.riskLevel as RiskSeverity,
      scope,
      targetType: action.approvalType,
    }),
    action.approvalLevel,
  );
}

async function riskRecordToDashboardItem(
  record: ExecutiveRiskRecord,
  context: RiskAlertDashboardContext,
): Promise<ExecutiveRiskItem> {
  const policy = resolveRiskEscalationPolicyForRecord(record, context.policies);
  const scope: PolicyScope = {
    axisId: record.axisId,
    moduleId: record.moduleId ?? "risk",
    organizationId: record.organizationId,
    projectId: record.projectId,
    recordId: record.id,
    workstreamId: record.workstreamId,
  };
  const overdue = resolveRiskOverdueState({
    deadline: record.deadline,
    nextAction: record.nextAction,
    now: context.now,
    ownerLabel: record.ownerName ?? record.ownerId,
    policyLabel: policy?.labelVi,
    recordStatus: record.status,
    thresholdDays: policy?.escalateAfterDays,
  });
  const escalation = resolveRiskEscalationState({
    delegations: context.delegations,
    now: context.now,
    overdue,
    policy,
    record,
    scope,
  });
  const notificationResult = await queueRiskEscalationNotification(
    {
      escalation,
      overdue,
      source: {
        ownerId: record.ownerId,
        ownerLabel: record.ownerName ?? record.ownerId,
        scope,
        sourceId: record.id,
        title: record.title,
      },
      user: context.user,
    },
    {
      auditWriter: context.options.auditWriter,
      notificationRepository: context.options.notificationRepository,
      now: context.now,
    },
  );

  return buildExecutiveRiskItemFromRecord({
    escalation: notificationResult.escalation,
    generatedAt: context.generatedAt,
    overdue,
    record,
    riskGroups: context.riskGroups,
  });
}

async function resolveDashboardPolicies(options: ExecutiveDashboardOptions) {
  if (options.approvalPolicies) {
    return options.approvalPolicies;
  }

  return listActiveApprovalThresholds(options.policyRepository);
}

async function resolveDashboardDelegations(options: ExecutiveDashboardOptions) {
  if (options.delegations) {
    return options.delegations;
  }

  return (options.delegationRepository ?? leadershipDelegationRepository).listDelegations({
    active: true,
  });
}

function permissionCatalogItem(
  rolePermissionCatalog: RolePermissionCatalog,
  actionKey: PermissionAction,
) {
  return rolePermissionCatalog.permissions.find(
    (permission) => permission.key === actionKey,
  );
}

function delegatedRiskActionKeys(input: {
  delegation: LeadershipDelegation;
  now: Date;
  rolePermissionCatalog: RolePermissionCatalog;
  user: PermissionUser;
}) {
  if (
    input.delegation.delegateUserId !== input.user.id ||
    getLeadershipDelegationStatus(input.delegation, input.now) !== "active"
  ) {
    return [];
  }

  return (["risk.create", "risk.update", "risk.override"] as PermissionAction[]).filter((actionKey) => {
    if (!input.delegation.actionKeys.includes(actionKey)) {
      return false;
    }

    const permission = permissionCatalogItem(
      input.rolePermissionCatalog,
      actionKey,
    );

    return Boolean(permission && isDelegationActionAllowed(actionKey, permission));
  });
}

type RiskMutationGroup = RiskGroupConfig | ExecutiveRiskGroupMetadata;

function normalizeScopeDimension(value?: string) {
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

  return normalizeScopeDimension(assignmentValue) === normalizeScopeDimension(delegationValue);
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

function delegationMatchesSelectedScope(input: {
  delegation: LeadershipDelegation;
  scopeAssignments: ScopeAssignment[];
  selectedScopeActive: boolean;
}) {
  if (!input.selectedScopeActive) {
    return true;
  }

  return input.scopeAssignments.some((assignment) =>
    delegationMatchesAssignment(input.delegation, assignment),
  );
}

function riskGroupKey(group: RiskMutationGroup) {
  return "riskKey" in group ? group.riskKey : group.key;
}

function riskGroupLabel(group: RiskMutationGroup) {
  return "labelVi" in group ? group.labelVi : group.label;
}

function buildRiskMutationOptions(input: {
  delegations: LeadershipDelegation[];
  projects: Project[];
  riskGroups: RiskMutationGroup[];
  rolePermissionCatalog: RolePermissionCatalog;
  scopeAssignments: ScopeAssignment[];
  selectedScopeActive: boolean;
  today: Date;
  user: PermissionUser;
}): ExecutiveRiskMutationOptions {
  const delegationOptions = input.delegations
    .filter((delegation) =>
      delegationMatchesSelectedScope({
        delegation,
        scopeAssignments: input.scopeAssignments,
        selectedScopeActive: input.selectedScopeActive,
      }),
    )
    .map((delegation) => ({
      actionKeys: delegatedRiskActionKeys({
        delegation,
        now: input.today,
        rolePermissionCatalog: input.rolePermissionCatalog,
        user: input.user,
      }),
      delegation,
    }))
    .filter((entry) => entry.actionKeys.length > 0)
    .map(({ actionKeys, delegation }) => ({
      actionKeys,
      axisId: delegation.axisId,
      delegationId: delegation.id,
      label: `${delegation.principalUserId} (${actionKeys.join(", ")})`,
      moduleId: delegation.moduleId,
      organizationId: delegation.organizationId,
      principalUserId: delegation.principalUserId,
      projectId: delegation.projectId,
      workstreamId: delegation.workstreamId,
    }));

  return {
    categories: input.riskGroups
      .map((group) => ({
        id: riskGroupKey(group),
        label: riskGroupLabel(group),
      }))
      .sort((left, right) => left.label.localeCompare(right.label)),
    delegations: delegationOptions,
    owners: [],
    projects: input.projects
      .filter((project) => !project.archivedAt && project.status !== "archived")
      .map((project) => ({
        id: project.id,
        label: project.name,
      }))
      .sort((left, right) => left.label.localeCompare(right.label)),
  };
}

function toneForHealth(health: "green" | "yellow" | "red"): ExecutiveDashboardTone {
  if (health === "green") {
    return "emerald";
  }

  if (health === "yellow") {
    return "amber";
  }

  return "red";
}

function toneForStatus(status: string): ExecutiveDashboardTone {
  if (["overdue", "blocked", "high_risk", "rejected"].includes(status)) {
    return "red";
  }

  if (["pending", "revision_required", "in_review"].includes(status)) {
    return "amber";
  }

  if (["approved", "done", "completed", "effective"].includes(status)) {
    return "emerald";
  }

  return "blue";
}

function resolveEffectiveScopeAssignments(
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

function hasExecutiveAccessFromScope(
  user: PermissionUser,
  scopeAssignments: ScopeAssignment[],
  rolePermissionCatalog: RolePermissionCatalog,
) {
  return scopeAssignments.some((assignment) => {
    if (!canAccessExecutiveModule(assignment.roleKey)) {
      return false;
    }

    return executiveScopedPermissions.some((permission) =>
      hasAnyScopedActionGrant(user, permission, {
        rolePermissionCatalog,
        scopeAssignments: [assignment],
      }),
    );
  });
}

function targetForRecord(record: { id?: string; projectId?: string }) {
  return {
    projectId: record.projectId,
    recordId: record.id,
  };
}

function buildFinancialAccess(
  user: PermissionUser,
  scopeAssignments: ScopeAssignment[],
  rolePermissionCatalog: RolePermissionCatalog,
) {
  const fullFinanceAccess = can(user, "finance.view");
  const anyScopedFinanceAccess = hasAnyScopedActionGrant(user, "finance.view", {
    rolePermissionCatalog,
    scopeAssignments,
  });

  return {
    canViewAnyFinance: fullFinanceAccess || anyScopedFinanceAccess,
    hasFullFinanceAccess: fullFinanceAccess,
    canViewRecordFinance(record: { id?: string; projectId?: string }) {
      if (fullFinanceAccess) {
        return true;
      }

      return canAccessScopedAction(user, "finance.view", targetForRecord(record), {
        rolePermissionCatalog,
        scopeAssignments,
      });
    },
  };
}

function buildExecutiveProjectItems(
  projects: ExecutiveProjectRow[],
  canViewRecordFinance: (record: { id?: string; projectId?: string }) => boolean,
): ExecutiveProjectPortfolioItem[] {
  return projects.map((project) => {
    const financeAllowed = canViewRecordFinance({
      id: project.id,
      projectId: project.projectId,
    });
    const item: ExecutiveProjectPortfolioItem = {
      id: `project-${project.projectId}`,
      sourceType: "project",
      sourceId: project.projectId,
      projectId: project.projectId,
      title: project.name,
      status: project.health,
      tone: toneForHealth(project.health),
      health: project.health,
      progress: project.progress,
      phase: project.phase,
      investor: project.investor,
      financialAccess: financeAllowed ? "allowed" : "no_permission",
    };

    if (financeAllowed) {
      item.cashFlowLabel = project.cashFlowLabel;
    }

    return item;
  });
}

function buildRepositoryProjectItems(
  projects: Project[],
  canViewRecordFinance: (record: { id?: string; projectId?: string }) => boolean,
): ExecutiveProjectPortfolioItem[] {
  return projects.map((project) => {
    const health = project.status === "active" ? "green" : "yellow";

    return {
      id: `project-${project.id}`,
      sourceType: "project",
      sourceId: project.id,
      projectId: project.id,
      title: project.name,
      status: project.status,
      tone: toneForHealth(health),
      health,
      investor: project.investor ?? project.ownerName,
      financialAccess: canViewRecordFinance({ id: project.id, projectId: project.id })
        ? "allowed"
        : "no_permission",
    };
  });
}

function summarizePortfolio(items: ExecutiveProjectPortfolioItem[]): ExecutiveProjectPortfolio {
  return {
    total: items.length,
    active: items.filter((item) => item.status === "active" || item.health !== "red").length,
    red: items.filter((item) => item.health === "red").length,
    yellow: items.filter((item) => item.health === "yellow").length,
    green: items.filter((item) => item.health === "green").length,
    items,
  };
}

async function proposalToApprovalItem(
  proposal: Proposal,
  today: Date,
  canViewRecordFinance: (record: { id?: string; projectId?: string }) => boolean,
  escalationContext: DashboardEscalationContext,
): Promise<ExecutiveApprovalItem> {
  const financeAllowed = canViewRecordFinance(proposal);
  const isOpen = !nonPendingApprovalStatuses.has(proposal.status);
  const policy = proposalPolicy(proposal, escalationContext.policies);
  const overdue = isOpen
    ? resolveApprovalOverdueState({
        dueDate: proposal.dueDate,
        now: today,
        ownerLabel: proposal.ownerId ?? proposal.requestedBy,
        policyLabel: policy.label,
        thresholdDays: policy.escalateAfterDays,
      })
    : undefined;
  const escalationResult = overdue
    ? await queueApprovalEscalationNotification(
        {
          escalation: resolveApprovalEscalationState({
            delegationPrincipalIds: [
              proposal.submittedBy,
              proposal.onBehalfOf,
            ].filter((principalId): principalId is string => Boolean(principalId)),
            delegations: escalationContext.delegations,
            now: escalationContext.now,
            overdue,
            ownerId: proposal.ownerId,
            policy,
            proposerId: proposal.requestedBy,
            scope: {
              projectId: proposal.projectId,
              moduleId: proposal.module,
              recordId: proposal.id,
            },
          }),
          overdue,
          source: {
            code: proposal.code,
            scope: {
              projectId: proposal.projectId,
              moduleId: proposal.module,
              recordId: proposal.id,
            },
            sourceId: proposal.id,
            sourceType: "proposal",
            title: proposal.title,
          },
          user: escalationContext.user,
        },
        {
          auditWriter: escalationContext.options.auditWriter,
          notificationRepository: escalationContext.options.notificationRepository,
          now: escalationContext.now,
        },
      )
    : undefined;
  const item: ExecutiveApprovalItem = {
    id: `proposal-${proposal.id}`,
    sourceType: "proposal",
    sourceId: proposal.id,
    projectId: proposal.projectId,
    title: proposal.title,
    status: proposal.status,
    tone: isOpen && isBeforeDay(proposal.dueDate, today) ? "red" : toneForStatus(proposal.status),
    owner: proposal.ownerId ?? proposal.requestedBy,
    deadline: proposal.dueDate,
    escalation: escalationResult?.escalation,
    reason: proposal.summary,
    overdue,
    priority: proposal.priority,
    financialAccess: financeAllowed ? "allowed" : "no_permission",
  };

  if (financeAllowed && proposal.amount !== undefined) {
    item.amount = proposal.amount;
    item.amountLabel = formatVnd(proposal.amount);
  }

  return item;
}

async function leadershipApprovalToItem(
  approval: LeadershipApproval,
  today: Date,
  canViewRecordFinance: (record: { id?: string; projectId?: string }) => boolean,
  escalationContext: DashboardEscalationContext,
): Promise<ExecutiveApprovalItem> {
  const financeAllowed = canViewRecordFinance(approval);
  const isOpen = !nonPendingApprovalStatuses.has(approval.status);
  const policy = approvalPolicy(approval, escalationContext.policies);
  const overdue = isOpen
    ? resolveApprovalOverdueState({
        dueDate: approval.dueDate,
        now: today,
        ownerLabel: approval.requester,
        policyLabel: policy.label,
        thresholdDays: policy.escalateAfterDays,
      })
    : undefined;
  const escalationResult = overdue
    ? await queueApprovalEscalationNotification(
        {
          escalation: resolveApprovalEscalationState({
            currentApprover: {
              label: policy.roleKey ?? approval.approvalLevel,
              roleKey: policy.roleKey ?? approval.approvalLevel,
              userId: approval.approverId,
            },
            delegations: escalationContext.delegations,
            now: escalationContext.now,
            overdue,
            policy,
            proposerId: approval.requestedBy,
            riskLevel: approval.riskLevel,
            scope: {
              organizationId: approval.organizationId,
              projectId: approval.projectId,
              recordId: approval.id,
            },
          }),
          overdue,
          source: {
            code: approval.proposalCode,
            scope: {
              organizationId: approval.organizationId,
              projectId: approval.projectId,
              recordId: approval.id,
            },
            sourceId: approval.id,
            sourceType: "leadership_approval",
            title: approval.title,
          },
          user: escalationContext.user,
        },
        {
          auditWriter: escalationContext.options.auditWriter,
          notificationRepository: escalationContext.options.notificationRepository,
          now: escalationContext.now,
        },
      )
    : undefined;
  const item: ExecutiveApprovalItem = {
    id: `leadership-approval-${approval.id}`,
    sourceType: "leadership_approval",
    sourceId: approval.id,
    projectId: approval.projectId,
    title: approval.title,
    status: approval.status,
    tone: isOpen && isBeforeDay(approval.dueDate, today) ? "red" : toneForStatus(approval.status),
    owner: approval.requester,
    deadline: approval.dueDate,
    escalation: escalationResult?.escalation,
    reason: approval.reason,
    overdue,
    riskLevel: approval.riskLevel,
    approvalLevel: approval.approvalLevel,
    financialAccess: financeAllowed ? "allowed" : "no_permission",
  };

  if (financeAllowed && approval.amount !== undefined) {
    item.amount = approval.amount;
    item.amountLabel = approval.amountLabel ?? formatVnd(approval.amount);
  }

  return item;
}

async function actionToApprovalItem(
  action: ExecutiveLeadershipActionItem,
  today: Date,
  canViewRecordFinance: (record: { id?: string; projectId?: string }) => boolean,
  escalationContext: DashboardEscalationContext,
): Promise<ExecutiveApprovalItem> {
  const financeAllowed = canViewRecordFinance(action);
  const isOpen = !nonPendingApprovalStatuses.has(action.status);
  const policy = actionPolicy(action, escalationContext.policies);
  const overdue = isOpen
    ? resolveApprovalOverdueState({
        dueDate: action.deadline,
        now: today,
        ownerLabel: action.ownerName,
        policyLabel: policy.label,
        thresholdDays: policy.escalateAfterDays,
      })
    : undefined;
  const escalationResult = overdue
    ? await queueApprovalEscalationNotification(
        {
          escalation: resolveApprovalEscalationState({
            currentApprover: {
              label: policy.roleKey ?? action.approvalLevel,
              roleKey: policy.roleKey,
            },
            delegations: escalationContext.delegations,
            now: escalationContext.now,
            overdue,
            policy,
            proposerId: action.ownerName,
            riskLevel: action.riskLevel as RiskSeverity,
            scope: {
              axisId: action.scope.axisId,
              moduleId: action.scope.moduleId,
              organizationId: action.scope.organizationId,
              projectId: action.projectId,
              recordId: action.id,
            },
          }),
          overdue,
          source: {
            code: action.id,
            scope: {
              axisId: action.scope.axisId,
              moduleId: action.scope.moduleId,
              organizationId: action.scope.organizationId,
              projectId: action.projectId,
              recordId: action.id,
            },
            sourceId: action.id,
            sourceType: "executive_action",
            title: action.title,
          },
          user: escalationContext.user,
        },
        {
          auditWriter: escalationContext.options.auditWriter,
          notificationRepository: escalationContext.options.notificationRepository,
          now: escalationContext.now,
        },
      )
    : undefined;
  const item: ExecutiveApprovalItem = {
    id: `executive-action-${action.id}`,
    sourceType: "executive_action",
    sourceId: action.id,
    projectId: action.projectId,
    href: action.href,
    title: action.title,
    status: action.status,
    tone: isOpen && isBeforeDay(action.deadline, today) ? "red" : action.tone,
    owner: action.ownerName,
    deadline: action.deadline,
    escalation: escalationResult?.escalation,
    reason: action.escalationReason,
    overdue,
    priority: action.priority,
    riskLevel: action.riskLevel,
    approvalLevel: action.approvalLevel,
    financialAccess: financeAllowed ? "allowed" : "no_permission",
  };

  if (financeAllowed && action.amount !== undefined) {
    item.amount = action.amount;
    item.amountLabel = action.amountLabel ?? formatVnd(action.amount);
  }

  return item;
}

function buildApprovalSummary(items: ExecutiveApprovalItem[], today: Date) {
  const openItems = items.filter((item) => !nonPendingApprovalStatuses.has(item.status));

  return {
    pending: openItems.length,
    overdue: openItems.filter((item) => isBeforeDay(item.deadline, today)).length,
    highRisk: openItems.filter((item) =>
      item.riskLevel === "high" || item.riskLevel === "critical" || item.priority === "high",
    ).length,
    items: openItems
      .sort((a, b) => {
        const aOverdue = isBeforeDay(a.deadline, today) ? 0 : 1;
        const bOverdue = isBeforeDay(b.deadline, today) ? 0 : 1;

        return aOverdue - bOverdue || (a.deadline ?? "").localeCompare(b.deadline ?? "");
      })
      .slice(0, 10),
  };
}

function buildRiskSummary(
  actions: ExecutiveLeadershipActionItem[],
  riskGroups: RiskMutationGroup[],
  generatedAt: string,
  officialRiskItems: ExecutiveRiskItem[] = [],
): ExecutiveRiskSummary {
  const derivedRiskItems: ExecutiveRiskItem[] = actions
    .filter(
      (action) =>
        action.type === "risk" ||
        action.riskLevel === "high" ||
        action.riskLevel === "critical",
    )
    .map((action) => buildExecutiveRiskItem({ action, generatedAt, riskGroups }));
  const riskItems = [...officialRiskItems, ...derivedRiskItems];
  const byCategory = riskItems.reduce<Record<string, number>>((result, item) => {
    const category = item.categoryLabel;
    result[category] = (result[category] ?? 0) + 1;

    return result;
  }, {});

  return {
    critical: riskItems.filter((item) => item.severity === "critical").length,
    high: riskItems.filter((item) => item.severity === "high").length,
    byCategory,
    riskMap: buildExecutiveRiskMap(riskItems),
    items: riskItems.slice(0, 10),
  };
}

function emptyRiskSummary(): ExecutiveRiskSummary {
  return {
    byCategory: {},
    critical: 0,
    high: 0,
    riskMap: {
      affectedProjectCount: 0,
      categories: [],
      matrix: [],
      total: 0,
    },
    items: [],
  };
}

function decisionToSourceItem(decision: Decision): ExecutiveDashboardSourceItem {
  return {
    id: `decision-${decision.id}`,
    sourceType: "decision",
    sourceId: decision.id,
    projectId: decision.projectId,
    title: decision.decisionText,
    status: decision.status,
    tone: toneForStatus(decision.status),
    owner: decision.ownerId,
    deadline: decision.dueDate,
  };
}

function buildDeadlineSummary(
  today: Date,
  approvals: ExecutiveApprovalItem[],
  actions: ExecutiveLeadershipActionItem[],
  decisions: Decision[],
  meetings: Meeting[],
  riskItems: ExecutiveRiskItem[] = [],
): ExecutiveDeadlineSummary {
  const items: ExecutiveDashboardSourceItem[] = [
    ...approvals
      .filter((item) => isDueTodayOrOverdue(item.deadline, today))
      .map((item) => ({
        ...item,
        tone: isBeforeDay(item.deadline, today) ? "red" : item.tone,
      })),
    ...actions
      .filter(
        (action) =>
          action.dueGroup === "overdue" ||
          action.dueGroup === "today" ||
          isDueTodayOrOverdue(action.deadline, today),
      )
      .map((action) => ({
        id: `deadline-action-${action.id}`,
        sourceType: "executive_action" as const,
        sourceId: action.id,
        projectId: action.projectId,
        href: action.href,
        title: action.title,
        status: action.status,
        tone: isBeforeDay(action.deadline, today) ? "red" : action.tone,
        owner: action.ownerName,
        deadline: action.deadline,
        reason: action.decisionRequired,
      })),
    ...riskItems
      .filter((item) => isDueTodayOrOverdue(item.deadline, today))
      .map((item) => ({
        ...item,
        tone: isBeforeDay(item.deadline, today) ? ("red" as const) : item.tone,
      })),
    ...decisions
      .filter(
        (decision) =>
          isDueTodayOrOverdue(decision.dueDate, today) &&
          !finalDecisionStatuses.has(decision.status),
      )
      .map(decisionToSourceItem),
    ...meetings.flatMap((meeting) =>
      meeting.followUpActions
        .filter(
          (action) =>
            isOpenMeetingFollowUp(action) &&
            isDueTodayOrOverdue(action.dueDate, today),
        )
        .map((action) => ({
          id: `meeting-follow-up-${action.id}`,
          sourceType: "meeting" as const,
          sourceId: action.id,
          projectId: meeting.projectId,
          title: action.title,
          status: action.status ?? "pending",
          tone: isBeforeDay(action.dueDate, today)
            ? ("red" as const)
            : ("amber" as const),
          owner: action.ownerId,
          deadline: action.dueDate,
          reason: meeting.title,
        })),
    ),
  ];

  return {
    overdue: items.filter((item) => isBeforeDay(item.deadline, today)).length,
    today: items.filter((item) => isSameDay(item.deadline, today)).length,
    items: items
      .sort((a, b) => {
        const aAlertPriority =
          a.overdue?.isOverdue || a.escalation?.required
            ? 0
            : isBeforeDay(a.deadline, today) ? 1 : 2;
        const bAlertPriority =
          b.overdue?.isOverdue || b.escalation?.required
            ? 0
            : isBeforeDay(b.deadline, today) ? 1 : 2;

        return (
          aAlertPriority - bAlertPriority ||
          (a.deadline ?? "").localeCompare(b.deadline ?? "") ||
          a.title.localeCompare(b.title) ||
          a.sourceId.localeCompare(b.sourceId)
        );
      })
      .slice(0, 12),
  };
}

function buildRecentDecisions(
  executiveDecisions: ExecutiveDecisionLogItem[],
  repositoryDecisions: Decision[],
): ExecutiveRecentDecisions {
  const items = [
    ...executiveDecisions.map((decision) => ({
      id: `executive-decision-${decision.id}`,
      sourceType: "decision" as const,
      sourceId: decision.id,
      projectId: decision.projectId,
      title: decision.decisionText,
      status: decision.status,
      tone: toneForStatus(decision.status),
      owner: decision.decidedBy,
      reason: decision.reason,
      decidedAt: decision.decidedAt,
      decidedBy: decision.decidedBy,
    })),
    ...repositoryDecisions.map((decision) => ({
      ...decisionToSourceItem(decision),
      decidedAt: decision.updatedAt,
      decidedBy: decision.ownerId,
    })),
  ].sort((a, b) => (b.decidedAt ?? "").localeCompare(a.decidedAt ?? ""));

  return {
    items: items.slice(0, 10),
  };
}

function buildMeetingSnapshot(
  executiveMeetings: Array<{ id: string; projectId?: string; title: string; meetingDate: string; status: string }>,
  repositoryMeetings: Meeting[],
  today: Date,
): ExecutiveMeetingSnapshot {
  const items = [
    ...executiveMeetings.map((meeting) => ({
      id: `leadership-meeting-${meeting.id}`,
      sourceType: "meeting" as const,
      sourceId: meeting.id,
      projectId: meeting.projectId,
      title: meeting.title,
      status: meeting.status,
      tone: isSameDay(meeting.meetingDate, today)
        ? ("amber" as const)
        : ("blue" as const),
      deadline: meeting.meetingDate,
    })),
    ...repositoryMeetings.map((meeting) => ({
      id: `meeting-${meeting.id}`,
      sourceType: "meeting" as const,
      sourceId: meeting.id,
      projectId: meeting.projectId,
      title: meeting.title,
      status: meeting.status,
      tone: isSameDay(meeting.meetingDate, today)
        ? ("amber" as const)
        : ("blue" as const),
      deadline: meeting.meetingDate,
    })),
  ];
  const allMeetingDates = [...executiveMeetings, ...repositoryMeetings].map(
    (meeting) => meeting.meetingDate,
  );
  const todayIndex = businessDayIndex(today);
  const followUpsOverdue = repositoryMeetings.reduce(
    (total, meeting) =>
      total +
      meeting.followUpActions.filter(
        (action) =>
          isOpenMeetingFollowUp(action) &&
          isBeforeDay(action.dueDate, today),
      ).length,
    0,
  );

  return {
    total: items.length,
    today: allMeetingDates.filter((date) => isSameDay(date, today)).length,
    upcoming: allMeetingDates.filter((date) => {
      const dateIndex = businessDayIndex(date);

      return dateIndex !== undefined && todayIndex !== undefined && dateIndex > todayIndex;
    }).length,
    followUpsOverdue,
    items: items.slice(0, 8),
  };
}

function buildFinancialSummary(
  approvalItems: ExecutiveApprovalItem[],
  hasFullFinanceAccess: boolean,
  canViewAnyFinance: boolean,
): ExecutiveFinancialSummary {
  const visibleItems = approvalItems
    .filter((item) => item.financialAccess === "allowed" && item.amount !== undefined)
    .map((item) => ({
      id: item.id,
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      projectId: item.projectId,
      amount: item.amount as number,
      amountLabel: item.amountLabel ?? formatVnd(item.amount as number),
    }));

  if (!canViewAnyFinance || (!hasFullFinanceAccess && visibleItems.length === 0)) {
    return {
      state: "no_permission",
      reason: "User does not have finance.view in the active executive scope.",
    };
  }

  return {
    state: "allowed",
    access: hasFullFinanceAccess ? "full" : "partial",
    visibleAmountTotal: visibleItems.reduce((total, item) => total + item.amount, 0),
    visibleRecordCount: visibleItems.length,
    currency: "VND",
    items: visibleItems,
  };
}

function buildKpis(
  portfolio: ExecutiveProjectPortfolio,
  approvals: ReturnType<typeof buildApprovalSummary>,
  risks: ExecutiveRiskSummary,
  deadlines: ExecutiveDeadlineSummary,
): ExecutiveDashboardKpi[] {
  return [
    {
      id: "project-portfolio",
      label: "Dự án trong scope",
      value: portfolio.total,
      tone: portfolio.red > 0 ? "red" : "blue",
      sourceType: "project",
    },
    {
      id: "project-health-red",
      label: "Dự án đỏ",
      value: portfolio.red,
      tone: portfolio.red > 0 ? "red" : "emerald",
      sourceType: "project",
    },
    {
      id: "pending-approvals",
      label: "Chờ duyệt",
      value: approvals.pending,
      tone: approvals.overdue > 0 ? "red" : "amber",
      sourceType: "leadership_approval",
    },
    {
      id: "high-risks",
      label: "Rủi ro cao",
      value: risks.high + risks.critical,
      tone: risks.critical > 0 ? "red" : "amber",
      sourceType: "risk",
    },
    {
      id: "today-deadlines",
      label: "Deadline hôm nay",
      value: deadlines.today + deadlines.overdue,
      tone: deadlines.overdue > 0 ? "red" : "purple",
    },
  ];
}

export async function getExecutiveDashboardData(
  user: PermissionUser,
  options: ExecutiveDashboardOptions = {},
): Promise<ExecutiveDashboardData> {
  const repositories = {
    projects: options.repositories?.projects ?? projectRepository,
    proposals: options.repositories?.proposals ?? proposalRepository,
    meetings: options.repositories?.meetings ?? meetingRepository,
    riskRecords: options.repositories?.riskRecords ?? riskRecordRepository,
  };
  const today = options.today ?? new Date();
  const [allScopeAssignments, rolePermissionCatalog] = await Promise.all([
    options.scopeAssignments ?? listActiveScopeAssignments(),
    options.rolePermissionCatalog ?? listRolePermissionCatalog(),
  ]);
  const effectiveScopeAssignments = resolveEffectiveScopeAssignments(
    user,
    allScopeAssignments,
    options.selectedScopeId,
  );
  const selectedScopeActive =
    Boolean(options.selectedScopeId) && options.selectedScopeId !== "all";
  const selectedScopeInvalid =
    selectedScopeActive && effectiveScopeAssignments.length === 0;
  const requireScopeAssignments =
    options.requireScopeAssignments ??
    (selectedScopeActive || requiresAssignmentScopeForRole(user.role));
  const hasScopedGrant = (permission: PermissionAction) =>
    hasAnyScopedActionGrant(user, permission, {
      rolePermissionCatalog,
      scopeAssignments: effectiveScopeAssignments,
    });
  const canViewOfficialRisk = can(user, "risk.view") || hasScopedGrant("risk.view");
  const canViewRiskSignals =
    canViewOfficialRisk ||
    can(user, "project.view") ||
    can(user, "proposal.view") ||
    hasScopedGrant("project.view") ||
    hasScopedGrant("proposal.view");
  const permissions = {
    canViewProjects: can(user, "project.view") || hasScopedGrant("project.view"),
    canViewProposals: can(user, "proposal.view") || hasScopedGrant("proposal.view"),
    canViewMeetings: can(user, "meeting.view") || hasScopedGrant("meeting.view"),
    canViewDecisions:
      can(user, "meeting.view") ||
      can(user, "decision.approve") ||
      hasScopedGrant("meeting.view") ||
      hasScopedGrant("decision.approve"),
    canViewRisk: canViewRiskSignals,
    canCreateRisk: can(user, "risk.create") || hasScopedGrant("risk.create"),
    canUpdateRisk: can(user, "risk.update") || hasScopedGrant("risk.update"),
    canOverrideRisk: can(user, "risk.override") || hasScopedGrant("risk.override"),
    canCloseRisk: can(user, "risk.close") || hasScopedGrant("risk.close"),
    canCloseHighRisk: can(user, "risk.close_high") || hasScopedGrant("risk.close_high"),
    canViewFinance: can(user, "finance.view") || hasScopedGrant("finance.view"),
    canDrillDown:
      can(user, "project.view") ||
      can(user, "proposal.view") ||
      can(user, "meeting.view") ||
      hasScopedGrant("project.view") ||
      hasScopedGrant("proposal.view") ||
      hasScopedGrant("meeting.view"),
  };
  const canViewExecutive =
    !selectedScopeInvalid &&
    (canAccessExecutiveModule(user.role) ||
      hasExecutiveAccessFromScope(user, effectiveScopeAssignments, rolePermissionCatalog));
  const [
    rawProjects,
    rawProposals,
    rawMeetings,
    rawDecisions,
    memberships,
    executiveData,
    approvalPolicies,
    delegations,
    rawRiskRecords,
    activeRiskGroups,
  ] =
    await Promise.all([
      permissions.canViewProjects ? listProjects({}, repositories.projects) : [],
      permissions.canViewProposals ? repositories.proposals.listProposals({}) : [],
      permissions.canViewMeetings ? repositories.meetings.listMeetings({}) : [],
      permissions.canViewDecisions ? repositories.meetings.listDecisions({}) : [],
      listProjectMemberships(),
      canViewExecutive
        ? getExecutiveLeadershipData(user, {
            rolePermissionCatalog,
            selectedScopeId: options.selectedScopeId,
            scopeAssignments: effectiveScopeAssignments,
          })
        : null,
      permissions.canViewProposals || canViewExecutive || permissions.canViewRisk
        ? resolveDashboardPolicies(options)
        : [],
      permissions.canViewProposals || canViewExecutive || permissions.canViewRisk
        ? resolveDashboardDelegations(options)
        : [],
      canViewOfficialRisk ? repositories.riskRecords.listRiskRecords({}) : [],
      permissions.canViewRisk || permissions.canCreateRisk || permissions.canUpdateRisk
        ? listActiveRiskGroups(options.policyRepository)
        : [],
    ]);
  const accessScope = resolveAccessScope(user, {
    memberships,
    requireScopeAssignments,
    rolePermissionCatalog,
    scopeAssignments: effectiveScopeAssignments,
  });
  const scopedProjects = filterProjectsForScope(rawProjects, accessScope);
  const scopedProposals = filterProposalsForScope(rawProposals, accessScope);
  const scopedMeetings = filterMeetingsForScope(rawMeetings, accessScope);
  const scopedDecisions = filterDecisionsForScope(rawDecisions, accessScope);
  const scopedRiskRecords = canViewOfficialRisk
    ? filterExecutiveRiskRecordsForScope(rawRiskRecords, accessScope)
    : [];
  const riskGroupsForDisplay =
    activeRiskGroups.length > 0 ? activeRiskGroups : executiveData?.riskGroups ?? [];
  const riskMutationOptions = buildRiskMutationOptions({
    delegations,
    projects: scopedProjects,
    riskGroups: riskGroupsForDisplay,
    rolePermissionCatalog,
    scopeAssignments: effectiveScopeAssignments,
    selectedScopeActive,
    today,
    user,
  });

  permissions.canCreateRisk =
    permissions.canCreateRisk ||
    riskMutationOptions.delegations.some((delegation) =>
      delegation.actionKeys.includes("risk.create"),
    );
  permissions.canUpdateRisk =
    permissions.canUpdateRisk ||
    riskMutationOptions.delegations.some((delegation) =>
      delegation.actionKeys.includes("risk.update"),
    );
  permissions.canOverrideRisk =
    permissions.canOverrideRisk ||
    riskMutationOptions.delegations.some((delegation) =>
      delegation.actionKeys.includes("risk.override"),
    );
  const finance = buildFinancialAccess(
    user,
    effectiveScopeAssignments,
    rolePermissionCatalog,
  );
  const executiveProjectItems = executiveData
    ? buildExecutiveProjectItems(
        executiveData.projects,
        finance.canViewRecordFinance.bind(finance),
      )
    : [];
  const repositoryProjectItems = buildRepositoryProjectItems(
    scopedProjects,
    finance.canViewRecordFinance.bind(finance),
  );
  const portfolio = summarizePortfolio(
    executiveProjectItems.length > 0 ? executiveProjectItems : repositoryProjectItems,
  );
  const escalationContext: DashboardEscalationContext = {
    delegations,
    now: today,
    options,
    policies: approvalPolicies,
    user,
  };
  const proposalApprovalItems = await Promise.all(scopedProposals.map((proposal) =>
    proposalToApprovalItem(
      proposal,
      today,
      finance.canViewRecordFinance.bind(finance),
      escalationContext,
    ),
  ));
  const leadershipApprovalItems =
    executiveData
      ? await Promise.all(executiveData.approvals.map((approval) =>
        leadershipApprovalToItem(
          approval,
          today,
          finance.canViewRecordFinance.bind(finance),
          escalationContext,
        ),
      ))
      : [];
  const executiveActionApprovalItems =
    executiveData
      ? await Promise.all(executiveData.leadershipActionItems
        .filter((action) =>
          ["approval", "payment", "proposal"].includes(action.type),
        )
        .map((action) =>
          actionToApprovalItem(
            action,
            today,
            finance.canViewRecordFinance.bind(finance),
            escalationContext,
          ),
        ))
      : [];
  const allApprovalItems = [
    ...proposalApprovalItems,
    ...leadershipApprovalItems,
    ...executiveActionApprovalItems,
  ];
  const openApprovalItems = allApprovalItems.filter(
    (item) => !nonPendingApprovalStatuses.has(item.status),
  );
  const approvalSummary = buildApprovalSummary(allApprovalItems, today);
  const generatedAt = new Date().toISOString();
  const officialRiskItems = canViewOfficialRisk
    ? await Promise.all(
        scopedRiskRecords.map((record) =>
          riskRecordToDashboardItem(record, {
            delegations,
            generatedAt,
            now: today,
            options,
            policies: approvalPolicies,
            riskGroups: riskGroupsForDisplay,
            user,
          }),
        ),
      )
    : [];
  const riskSummary = permissions.canViewRisk
    ? buildRiskSummary(
        executiveData?.leadershipActionItems ?? [],
        riskGroupsForDisplay,
        generatedAt,
        officialRiskItems,
      )
    : emptyRiskSummary();
  const todayDeadlines = buildDeadlineSummary(
    today,
    openApprovalItems,
    executiveData?.leadershipActionItems ?? [],
    scopedDecisions,
    scopedMeetings,
    officialRiskItems,
  );
  const recentDecisions = buildRecentDecisions(
    executiveData?.decisionLog ?? [],
    scopedDecisions,
  );
  const meetingSnapshot = buildMeetingSnapshot(
    executiveData?.meetings ?? [],
    scopedMeetings,
    today,
  );
  const financialSummary = buildFinancialSummary(
    allApprovalItems,
    finance.hasFullFinanceAccess,
    finance.canViewAnyFinance,
  );

  const dashboardData: ExecutiveDashboardData = {
    generatedAt,
    scope: {
      selectedScopeId: options.selectedScopeId ?? "all",
      scopeLabel: executiveData?.scopeLabel ?? "Scoped executive dashboard",
      organizationIds: executiveData?.accessibleScope.organizationIds ?? [],
      projectIds:
        executiveData?.accessibleScope.projectIds ??
        Array.from(accessScope.assignedProjectIds),
      axisIds: executiveData?.accessibleScope.axisIds ?? [],
      moduleIds: executiveData?.accessibleScope.moduleIds ?? [],
      operatingRole: executiveData?.accessibleScope.operatingRole,
    },
    permissions,
    projectPortfolio: portfolio,
    kpis: buildKpis(portfolio, approvalSummary, riskSummary, todayDeadlines),
    financialSummary,
    approvalSummary,
    riskSummary,
    riskMutationOptions,
    todayDeadlines,
    recentDecisions,
    meetingSnapshot,
    sourceCounts: {
      projects: portfolio.total,
      proposals: scopedProposals.length,
      leadershipApprovals: executiveData?.approvals.length ?? 0,
      executiveActions: executiveData?.leadershipActionItems.length ?? 0,
      meetings: (executiveData?.meetings.length ?? 0) + scopedMeetings.length,
      decisions: (executiveData?.decisionLog.length ?? 0) + scopedDecisions.length,
    },
  };

  return enrichExecutiveDashboardDataSources(dashboardData);
}
