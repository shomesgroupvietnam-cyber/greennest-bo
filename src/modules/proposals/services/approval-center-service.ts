import {
  BUSINESS_APPROVAL_PERMISSIONS,
  can,
  normalizePermissionAction,
  type PermissionAction,
  type PermissionInput,
  type PermissionUser,
} from "@/lib/permissions/can";
import {
  canAccessScopedAction,
  canReadProposalInScope,
  hasAnyScopedActionGrant,
  resolveAccessScope,
} from "@/lib/permissions/access-scope";
import { selectScopeAssignmentsForUser } from "@/lib/permissions/navigation-context";
import {
  approvals as defaultLeadershipApprovals,
  projects as defaultExecutiveProjects,
} from "@/modules/executive/mock-data/executive-mock-data";
import type {
  ApprovalCenterAxisTab,
  ApprovalCenterCategorySummary,
  ApprovalCenterData,
  ApprovalCenterDetailAction,
  ApprovalCenterDetailData,
  ApprovalCenterDetailHistoryItem,
  ApprovalCenterDetailPolicy,
  ApprovalCenterDetailSource,
  ApprovalCenterDueGroup,
  ApprovalCenterPriority,
  ApprovalCenterQueueCategory,
  ApprovalCenterQueueItem,
  ApprovalCenterSourceType,
  ExecutiveRiskLevel,
  LeadershipApproval,
} from "@/modules/executive/types";
import { businessDaysBetween } from "@/lib/date/business-day";
import type { NotificationRepository } from "@/lib/notifications/notification-repository";
import type {
  Proposal,
  ProposalApprovalAction,
  ProposalDecision,
  ProposalDetail,
  ProposalLink,
  ProposalPriority,
  ProposalStep,
  ProposalStatus,
  ProposalType,
} from "@/modules/proposals/types";
import type {
  ApprovalThresholdPolicy,
  LeadershipDelegation,
  RolePermissionCatalog,
  ScopeAssignment,
} from "@/modules/settings/types";
import {
  findMatchingApprovalThresholdPolicy,
  listActiveApprovalThresholds,
} from "@/modules/settings/services/policy-settings-service";
import {
  policySettingsRepository,
  type PolicySettingsRepository,
} from "@/modules/settings/services/policy-settings-repository";
import {
  leadershipDelegationRepository,
  type LeadershipDelegationRepository,
} from "@/modules/settings/services/leadership-delegation-repository";
import type { AuditLog } from "@/modules/users/types";

import {
  resolveApprovalEscalationState,
  resolveApprovalOverdueState,
} from "./approval-escalation-service";
import { queueApprovalEscalationNotification } from "./approval-escalation-notification-service";
import { proposalRepository, type ProposalRepository } from "./proposal-repository";

export type ApprovalCenterServiceOptions = {
  auditLogLoader?: () => Promise<AuditLog[]>;
  auditLogs?: AuditLog[];
  approvalPolicies?: ApprovalThresholdPolicy[];
  auditWriter?: (input: Omit<AuditLog, "id" | "createdAt">) => Promise<AuditLog>;
  delegationRepository?: LeadershipDelegationRepository;
  delegations?: LeadershipDelegation[];
  leadershipApprovals?: LeadershipApproval[];
  now?: Date;
  notificationRepository?: NotificationRepository;
  policyRepository?: PolicySettingsRepository;
  queueEscalationNotifications?: boolean;
  repository?: ProposalRepository;
  requireScopeAssignments?: boolean;
  rolePermissionCatalog?: RolePermissionCatalog;
  scopeAssignments?: ScopeAssignment[];
  scopeLabel?: string;
  selectedScopeId?: string;
};

type CategoryDefinition = {
  key: ApprovalCenterQueueCategory;
  label: string;
};

export const APPROVAL_CENTER_CATEGORIES: readonly CategoryDefinition[] = [
  { key: "ho_so_van_ban", label: "Ho so / Van ban" },
  { key: "tai_chinh_chi", label: "Tai chinh / Chi" },
  { key: "chien_luoc", label: "Chien luoc" },
  { key: "ky_thuat", label: "Ky thuat" },
  { key: "phap_ly", label: "Phap ly" },
  { key: "hop", label: "Hop" },
];

const queueProposalStatuses = new Set<ProposalStatus>([
  "submitted",
  "in_review",
  "change_requested",
  "on_hold",
]);

const detailProposalStatuses = new Set<ProposalStatus>([
  ...queueProposalStatuses,
  "approved",
  "cancelled",
  "rejected",
]);

const queueLeadershipStatuses = new Set<LeadershipApproval["status"]>([
  "pending",
  "revision_required",
]);

const globalApprovalCenterRoles = new Set(["chu_tich", "super_admin", "tong_giam_doc"]);

const proposalCategoryByType: Partial<Record<ProposalType, ApprovalCenterQueueCategory>> = {
  construction: "ky_thuat",
  contract: "tai_chinh_chi",
  design: "ky_thuat",
  document: "ho_so_van_ban",
  finance: "tai_chinh_chi",
  investment: "chien_luoc",
  legal: "phap_ly",
  procurement: "tai_chinh_chi",
  quality: "ky_thuat",
  safety: "ky_thuat",
};

const leadershipCategoryByType: Record<
  LeadershipApproval["type"],
  ApprovalCenterQueueCategory
> = {
  design: "ky_thuat",
  finance: "tai_chinh_chi",
  investment: "chien_luoc",
  legal: "phap_ly",
  operation: "hop",
};

const proposalStatusLabels: Record<ProposalStatus, string> = {
  approved: "Approved",
  archived: "Archived",
  cancelled: "Cancelled",
  change_requested: "Change requested",
  draft: "Draft",
  in_review: "In review",
  on_hold: "On hold",
  rejected: "Rejected",
  submitted: "Submitted",
};

const leadershipStatusLabels: Record<LeadershipApproval["status"], string> = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
  revision_required: "Revision required",
};

const dueGroupRank: Record<ApprovalCenterDueGroup, number> = {
  overdue: 0,
  today: 1,
  this_week: 2,
  later: 3,
  none: 4,
};

const priorityRank: Record<ApprovalCenterPriority, number> = {
  critical: 0,
  urgent: 1,
  high: 2,
  normal: 3,
  low: 4,
};

function categoryLabel(category: ApprovalCenterQueueCategory) {
  return (
    APPROVAL_CENTER_CATEGORIES.find((definition) => definition.key === category)
      ?.label ?? category
  );
}

function userHasScopedQueueGrant(
  user: PermissionUser,
  options: ApprovalCenterServiceOptions,
) {
  const scopedActions: PermissionAction[] = [
    "proposal.view",
    "proposal.review",
    "proposal.approve",
    "proposal.reject",
    "proposal.request_change",
  ];

  return scopedActions.some((action) =>
    hasAnyScopedActionGrant(user, action, {
      rolePermissionCatalog: options.rolePermissionCatalog,
      scopeAssignments: options.scopeAssignments,
    }),
  );
}

function withSelectedScopeAssignments(
  user: PermissionUser,
  options: ApprovalCenterServiceOptions,
): ApprovalCenterServiceOptions {
  if (!options.selectedScopeId || options.selectedScopeId === "all") {
    return options;
  }

  return {
    ...options,
    requireScopeAssignments: true,
    scopeAssignments: selectScopeAssignmentsForUser(
      user,
      options.scopeAssignments ?? [],
      options.selectedScopeId,
    ),
  };
}

function userHasGlobalApprovalCenterGrant(user: PermissionUser) {
  if (!globalApprovalCenterRoles.has(user.role)) {
    return false;
  }

  return (
    BUSINESS_APPROVAL_PERMISSIONS.some((permission) => can(user, permission)) ||
    can(user, "proposal.review")
  );
}

function canViewApprovalCenter(
  user: PermissionUser,
  options: ApprovalCenterServiceOptions,
) {
  return (
    userHasGlobalApprovalCenterGrant(user) ||
    userHasScopedQueueGrant(user, options)
  );
}

function canViewFinanceForRecord(
  user: PermissionUser,
  target: { projectId?: string; recordId?: string },
  options: ApprovalCenterServiceOptions,
) {
  if (can(user, "finance.view")) {
    return true;
  }

  return canAccessScopedAction(
    user,
    "finance.view",
    {
      axisId: "project_management",
      moduleId: "finance",
      projectId: target.projectId,
      recordId: target.recordId,
      workstreamId: "finance",
    },
    {
      rolePermissionCatalog: options.rolePermissionCatalog,
      scopeAssignments: options.scopeAssignments,
    },
  );
}

function canViewAuditForRecord(
  user: PermissionUser,
  proposal: Proposal,
  options: ApprovalCenterServiceOptions,
) {
  if (can(user, "audit.view")) {
    return true;
  }

  return canAccessScopedAction(
    user,
    "audit.view",
    proposalActionTarget(proposal),
    {
      rolePermissionCatalog: options.rolePermissionCatalog,
      scopeAssignments: options.scopeAssignments,
    },
  );
}

function resolveDueGroup(
  dueDate: string | undefined,
  now: Date,
): { dueGroup: ApprovalCenterDueGroup; dueLabel: string } {
  const daysOverdue = businessDaysBetween(dueDate, now);

  if (daysOverdue === undefined) {
    return { dueGroup: "none", dueLabel: "No due date" };
  }

  const daysUntilDue = -daysOverdue;

  if (daysUntilDue < 0) {
    return { dueGroup: "overdue", dueLabel: `Overdue ${Math.abs(daysUntilDue)}d` };
  }

  if (daysUntilDue === 0) {
    return { dueGroup: "today", dueLabel: "Due today" };
  }

  if (daysUntilDue <= 7) {
    return { dueGroup: "this_week", dueLabel: `Due in ${daysUntilDue}d` };
  }

  return { dueGroup: "later", dueLabel: dueDate ?? "Later" };
}

function proposalCategory(proposal: Proposal, links: ProposalLink[]) {
  if (
    proposal.module === "meeting" ||
    links.some((link) => link.entityType === "meeting")
  ) {
    return "hop";
  }

  return proposalCategoryByType[proposal.type] ?? "chien_luoc";
}

function proposalPriority(
  priority: ProposalPriority,
  dueGroup: ApprovalCenterDueGroup,
): ApprovalCenterPriority {
  if (dueGroup === "overdue" && priority !== "urgent") {
    return "urgent";
  }

  return priority;
}

function leadershipPriority(
  riskLevel: ExecutiveRiskLevel,
  dueGroup: ApprovalCenterDueGroup,
): ApprovalCenterPriority {
  if (riskLevel === "critical") {
    return "critical";
  }

  if (dueGroup === "overdue") {
    return "urgent";
  }

  if (riskLevel === "high") {
    return "high";
  }

  return riskLevel === "low" ? "low" : "normal";
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}

function withScopeId(path: string, selectedScopeId?: string) {
  if (!selectedScopeId || selectedScopeId === "all") {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}scopeId=${encodeURIComponent(selectedScopeId)}`;
}

function buildApprovalDetailHref(
  sourceType: "proposal",
  sourceId: string,
  selectedScopeId?: string,
) {
  return withScopeId(
    `/approvals/${sourceType}/${encodeURIComponent(sourceId)}`,
    selectedScopeId,
  );
}

function buildBackHref(selectedScopeId?: string) {
  return withScopeId("/command-center?view=executive-approvals", selectedScopeId);
}

type LinkedSourceAccess = {
  entityId: string;
  helper: string;
  href?: string;
  label: string;
  state: ApprovalCenterDetailSource["state"];
};

function safeEntityHref(link: ProposalLink, selectedScopeId?: string) {
  const encodedId = encodeURIComponent(link.entityId);

  switch (link.entityType.toLowerCase()) {
    case "project":
    case "projects":
      return `/projects/${encodedId}`;
    case "document":
    case "documents":
      return `/documents/${encodedId}`;
    case "meeting":
    case "meetings":
      return `/meetings/${encodedId}`;
    case "task":
    case "tasks":
      return `/tasks/${encodedId}`;
    case "proposal":
    case "proposals":
      return buildApprovalDetailHref("proposal", link.entityId, selectedScopeId);
    default:
      return undefined;
  }
}

function linkedSourcePermission(
  link: ProposalLink,
): PermissionAction | undefined {
  switch (link.entityType.toLowerCase()) {
    case "project":
    case "projects":
      return "project.view";
    case "document":
    case "documents":
      return "document.view";
    case "meeting":
    case "meetings":
      return "meeting.view";
    case "task":
    case "tasks":
      return "task.view";
    case "proposal":
    case "proposals":
      return "proposal.view";
    default:
      return undefined;
  }
}

function linkedSourceTarget(
  link: ProposalLink,
  proposal: Proposal,
) {
  const normalized = link.entityType.toLowerCase();
  const moduleId = normalized.endsWith("s")
    ? normalized.slice(0, -1)
    : normalized;
  const projectId =
    moduleId === "project" ? link.entityId : proposal.projectId;

  return {
    axisId: "project_management",
    moduleId,
    projectId,
    recordId: link.entityId,
    workstreamId: moduleId,
  };
}

function canReadLinkedSource(
  link: ProposalLink,
  proposal: Proposal,
  user: PermissionUser,
  scope: ReturnType<typeof resolveAccessScope>,
  options: ApprovalCenterServiceOptions,
) {
  const permission = linkedSourcePermission(link);

  if (!permission) {
    return false;
  }

  if (
    !scope.scopeAssignmentsRequired &&
    scope.scopeAssignments.length === 0 &&
    can(user, permission)
  ) {
    return true;
  }

  return canAccessScopedAction(
    user,
    permission,
    linkedSourceTarget(link, proposal),
    {
      rolePermissionCatalog: options.rolePermissionCatalog,
      scopeAssignments: options.scopeAssignments,
    },
  );
}

function linkedSourceAccess(
  link: ProposalLink,
  proposal: Proposal,
  user: PermissionUser,
  scope: ReturnType<typeof resolveAccessScope>,
  options: ApprovalCenterServiceOptions,
): LinkedSourceAccess {
  const href = safeEntityHref(link, options.selectedScopeId);

  if (!href) {
    return {
      entityId: "placeholder",
      helper: "Source type chua duoc ho tro trong MVP",
      label: `${entityLabel(link.entityType)} source`,
      state: "placeholder",
    };
  }

  if (!canReadLinkedSource(link, proposal, user, scope, options)) {
    return {
      entityId: "restricted",
      helper: "Khong co quyen xem source nay trong scope hien tai",
      label: `${entityLabel(link.entityType)} bi gioi han quyen`,
      state: "no_permission",
    };
  }

  return {
    entityId: link.entityId,
    helper: "Source record",
    href,
    label: `${entityLabel(link.entityType)} ${link.entityId}`,
    state: "linked",
  };
}

function entityLabel(entityType: string) {
  const normalized = entityType.toLowerCase();

  if (normalized === "project" || normalized === "projects") {
    return "Project";
  }

  if (normalized === "document" || normalized === "documents") {
    return "Document";
  }

  if (normalized === "meeting" || normalized === "meetings") {
    return "Meeting";
  }

  if (normalized === "task" || normalized === "tasks") {
    return "Task";
  }

  if (normalized === "proposal" || normalized === "proposals") {
    return "Proposal";
  }

  return entityType;
}

function buildLinkedSources(
  links: ProposalLink[],
  proposal: Proposal,
  user: PermissionUser,
  scope: ReturnType<typeof resolveAccessScope>,
  options: ApprovalCenterServiceOptions,
): ApprovalCenterDetailSource[] {
  return links.map((link) => {
    const access = linkedSourceAccess(link, proposal, user, scope, options);

    return {
      entityId: access.entityId,
      entityType: link.entityType,
      helper: access.helper,
      href: access.href,
      id: link.id,
      label: access.label,
      relationType: link.relationType,
      state: access.state,
    };
  });
}

function buildPolicy(
  proposal: Proposal,
  steps: ProposalStep[],
): ApprovalCenterDetailPolicy | null {
  const step =
    steps.find((item) => item.id === proposal.currentStepId) ??
    steps.find((item) => ["pending", "in_review"].includes(item.status)) ??
    steps[0];

  if (!step) {
    return null;
  }

  return {
    approvalLevel: step.approvalLevel,
    approverRole: step.approverRole,
    currentStepId: step.id,
    decidedAt: step.decidedAt,
    decidedBy: step.decidedBy,
    requiredPermission: step.requiredPermission,
    status: step.status,
    stepOrder: step.stepOrder,
    thresholdLabel: step.thresholdLabel,
    thresholdPolicyId: step.thresholdPolicyId,
  };
}

const detailActionDefinitions: Array<
  Omit<ApprovalCenterDetailAction, "disabledReason" | "enabled">
> = [
  {
    action: "approve",
    helper: "Phe duyet request va dong approval.",
    label: "Duyet approval",
  },
  {
    action: "reject",
    destructive: true,
    helper: "Tu choi request voi ly do bat buoc.",
    label: "Tu choi",
    requiresConfirmation: true,
    requiresReason: true,
  },
  {
    action: "request_change",
    helper: "Tra lai request de bo sung thong tin.",
    label: "Tra lai",
    requiresReason: true,
  },
  {
    action: "forward",
    helper: "Chuyen approval den vai tro hoac user khac.",
    label: "Chuyen cap",
  },
  {
    action: "ask_meeting",
    helper: "Tao placeholder yeu cau hop lien quan den approval.",
    label: "Yeu cau hop",
  },
  {
    action: "hold",
    helper: "Tam giu approval trong queue.",
    label: "Tam giu",
  },
  {
    action: "cancel",
    destructive: true,
    helper: "Huy approval va loai khoi queue.",
    label: "Huy approval",
    requiresConfirmation: true,
    requiresReason: true,
  },
];

const detailActionStatuses = new Set<ProposalStatus>([
  "submitted",
  "in_review",
  "on_hold",
]);

function normalizeActionPermission(action?: string) {
  return action
    ? normalizePermissionAction(action as PermissionInput)
    : undefined;
}

function proposalActionTarget(proposal: Proposal) {
  return {
    axisId: "project_management",
    moduleId: "proposal",
    projectId: proposal.projectId,
    recordId: proposal.id,
    workstreamId: "proposal",
  };
}

function actionPermissionCandidates(
  action: ProposalApprovalAction,
  step: ProposalStep,
): PermissionAction[] {
  const stepPermission = normalizeActionPermission(step?.requiredPermission);
  const candidates: Array<PermissionAction | undefined> = (() => {
    if (action === "request_change") {
      return ["proposal.request_change"];
    }

    if (action === "reject" || action === "cancel") {
      return ["proposal.reject", stepPermission];
    }

    if (action === "approve") {
      return [stepPermission ?? "proposal.approve"];
    }

    return [stepPermission, "proposal.approve"];
  })();

  return [...new Set(candidates.filter((permission): permission is PermissionAction => Boolean(permission)))];
}

function hasScopedApproverRole(
  user: PermissionUser,
  proposal: Proposal,
  step: ProposalStep,
  action: ProposalApprovalAction,
  options: ApprovalCenterServiceOptions,
) {
  if (!step.approverRole) {
    return true;
  }

  if (step.approverRole === user.role) {
    return true;
  }

  const roleScopedAssignments = options.scopeAssignments?.filter(
    (assignment) => assignment.roleKey === step.approverRole,
  );

  if (!roleScopedAssignments?.length) {
    return false;
  }

  return actionPermissionCandidates(action, step).some((permission) =>
    canAccessScopedAction(user, permission, proposalActionTarget(proposal), {
      rolePermissionCatalog: options.rolePermissionCatalog,
      scopeAssignments: roleScopedAssignments,
    }),
  );
}

function canUseDetailAction(
  user: PermissionUser,
  proposal: Proposal,
  step: ProposalStep,
  action: ProposalApprovalAction,
  options: ApprovalCenterServiceOptions,
) {
  if (step.approverUserId && step.approverUserId !== user.id) {
    return false;
  }

  if (!hasScopedApproverRole(user, proposal, step, action, options)) {
    return false;
  }

  return actionPermissionCandidates(action, step).some((permission) => {
    if (can(user, permission)) {
      return true;
    }

    return canAccessScopedAction(user, permission, proposalActionTarget(proposal), {
      rolePermissionCatalog: options.rolePermissionCatalog,
      scopeAssignments: options.scopeAssignments,
    });
  });
}

function buildAvailableActions(
  detail: ProposalDetail,
  user: PermissionUser,
  options: ApprovalCenterServiceOptions,
): ApprovalCenterDetailAction[] {
  const step =
    detail.proposal.currentStepId
      ? detail.steps.find((item) => item.id === detail.proposal.currentStepId)
      : undefined;
  const statusAllowsAction = detailActionStatuses.has(detail.proposal.status);

  return detailActionDefinitions.map((definition) => {
    const enabled = statusAllowsAction && step
      ? canUseDetailAction(
        user,
        detail.proposal,
        step,
        definition.action,
        options,
      )
      : false;

    return {
      ...definition,
      disabledReason: enabled
        ? undefined
        : statusAllowsAction
          ? step
            ? "Khong co quyen thao tac approval nay."
            : "Khong tim thay buoc duyet hien tai."
          : "Trang thai hien tai khong cho phep thao tac.",
      enabled,
    };
  });
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringField(
  value: Record<string, unknown> | undefined,
  key: string,
) {
  const field = value?.[key];

  return typeof field === "string" ? field : undefined;
}

function fallbackDecisionVersions(decisions: ProposalDecision[]) {
  const chronological = [...decisions].sort((a, b) => {
    const timeRank = a.decidedAt.localeCompare(b.decidedAt);

    return timeRank !== 0 ? timeRank : a.id.localeCompare(b.id);
  });

  return new Map(chronological.map((decision, index) => [decision.id, index + 1]));
}

function linkHistoryItem(link: ProposalLink): ApprovalCenterDetailHistoryItem {
  return {
    id: `link-${link.id}`,
    kind: "link",
    label: `Linked source: ${entityLabel(link.entityType)} ${link.entityId}`,
    notes: `Relation: ${link.relationType}`,
    occurredAt: link.createdAt,
    status: link.relationType,
  };
}

function auditHistoryItem(auditLog: AuditLog): ApprovalCenterDetailHistoryItem {
  const oldValue = asRecord(auditLog.oldValue);
  const newValue = asRecord(auditLog.newValue);

  return {
    actorId: auditLog.actorId,
    auditAction: auditLog.action,
    auditLogId: auditLog.id,
    id: auditLog.id,
    kind: "audit",
    label: auditLog.action,
    nextStatus: stringField(newValue, "status"),
    nextStepStatus: stringField(newValue, "stepStatus"),
    notes: stringField(newValue, "notes") ?? stringField(oldValue, "notes"),
    occurredAt: auditLog.createdAt,
    previousStatus: stringField(oldValue, "status"),
    previousStepStatus: stringField(oldValue, "stepStatus"),
    status: stringField(newValue, "status") ?? auditLog.action,
  };
}

function sortHistoryItems(items: ApprovalCenterDetailHistoryItem[]) {
  const kindRank: Record<ApprovalCenterDetailHistoryItem["kind"], number> = {
    audit: 0,
    link: 1,
    step: 2,
    decision: 3,
    version: 4,
  };

  return [...items].sort((a, b) => {
    const timeRank = b.occurredAt.localeCompare(a.occurredAt);

    if (timeRank !== 0) {
      return timeRank;
    }

    const kindRankDelta = kindRank[a.kind] - kindRank[b.kind];

    if (kindRankDelta !== 0) {
      return kindRankDelta;
    }

    return a.id.localeCompare(b.id);
  });
}

function buildHistory(
  decisions: ProposalDecision[],
  steps: ProposalStep[],
  auditLogs: AuditLog[] = [],
  links: ProposalLink[] = [],
): ApprovalCenterDetailHistoryItem[] {
  const decisionVersions = fallbackDecisionVersions(decisions);
  const decisionItems = decisions.map(
    (decision): ApprovalCenterDetailHistoryItem => ({
      actorId: decision.decidedBy,
      id: decision.id,
      kind: "decision",
      label: decision.decision,
      nextStatus: decision.nextStatus,
      nextStepStatus: decision.nextStepStatus,
      notes: decision.notes,
      occurredAt: decision.decidedAt,
      previousStatus: decision.previousStatus,
      previousStepStatus: decision.previousStepStatus,
      status: decision.nextStatus ?? decision.decision,
      version: decision.version ?? decisionVersions.get(decision.id),
    }),
  );
  const stepItems = steps
    .filter((step) => step.decidedAt)
    .map(
      (step): ApprovalCenterDetailHistoryItem => ({
        actorId: step.decidedBy,
        id: step.id,
        kind: "step",
        label: `Step ${step.stepOrder}: ${step.status}`,
        nextStepStatus: step.status,
        notes: step.decisionNotes,
        occurredAt: step.decidedAt ?? step.updatedAt,
        status: step.status,
      }),
    );
  const auditItems = auditLogs.map(auditHistoryItem);
  const linkItems = links.map(linkHistoryItem);

  return sortHistoryItems([...decisionItems, ...stepItems, ...auditItems, ...linkItems]);
}

function buildProjectNameMap() {
  return new Map(
    defaultExecutiveProjects.map((project) => [project.projectId, project.name]),
  );
}

async function resolveProposalAuditLogs(
  proposalId: string,
  canViewAudit: boolean,
  options: ApprovalCenterServiceOptions,
) {
  if (!canViewAudit) {
    return [];
  }

  const auditLogs = options.auditLogs ?? (options.auditLogLoader
    ? await options.auditLogLoader()
    : []);

  return auditLogs.filter(
    (auditLog) =>
      auditLog.entityType === "proposal" && auditLog.entityId === proposalId,
  );
}

function proposalScopeLabel(proposal: Proposal, projectName?: string) {
  return projectName ?? proposal.projectId ?? "Organization";
}

function policyById(policies: ApprovalThresholdPolicy[]) {
  return new Map(policies.map((policy) => [policy.id, policy]));
}

async function resolveApprovalPolicies(options: ApprovalCenterServiceOptions) {
  if (options.approvalPolicies) {
    return options.approvalPolicies;
  }

  return listActiveApprovalThresholds(
    options.policyRepository ?? policySettingsRepository,
  );
}

async function resolveDelegations(options: ApprovalCenterServiceOptions) {
  if (options.delegations) {
    return options.delegations;
  }

  return (options.delegationRepository ?? leadershipDelegationRepository).listDelegations({
    active: true,
  });
}

function escalationPolicyForStep(
  step: ProposalStep | undefined,
  policies: Map<string, ApprovalThresholdPolicy>,
) {
  const policy = step?.thresholdPolicyId
    ? policies.get(step.thresholdPolicyId)
    : undefined;

  return {
    id: policy?.id ?? step?.thresholdPolicyId,
    label: policy?.labelVi ?? step?.thresholdLabel,
    roleKey: policy?.approverRoleKey ?? step?.approverRole,
    escalateAfterDays: policy?.escalateAfterDays,
    escalateOnRiskLevels: policy?.escalateOnRiskLevels,
  };
}

function escalationPolicyForLeadership(
  approval: LeadershipApproval,
  policies: ApprovalThresholdPolicy[],
) {
  const scope = {
    organizationId: approval.organizationId,
    projectId: approval.projectId,
    recordId: approval.id,
  };
  const levelMatches = policies.filter(
    (item) =>
      item.approvalLevel === approval.approvalLevel ||
      item.labelVi === approval.approvalLevel ||
      item.approverRoleKey === approval.approvalLevel,
  );
  const policy = findMatchingApprovalThresholdPolicy(levelMatches, {
    amount: approval.amount,
    riskLevel: approval.riskLevel,
    scope,
    targetType: approval.type,
  });

  return {
    id: policy?.id,
    label: policy?.labelVi ?? approval.approvalLevel,
    roleKey: policy?.approverRoleKey,
    escalateAfterDays: policy?.escalateAfterDays,
    escalateOnRiskLevels: policy?.escalateOnRiskLevels,
  };
}

function currentApprovalStep(proposal: Proposal, steps: ProposalStep[]) {
  return proposal.currentStepId
    ? steps.find((step) => step.id === proposal.currentStepId)
    : steps.find((step) => ["pending", "in_review"].includes(step.status));
}

async function maybeQueueEscalationNotification(
  input: Parameters<typeof queueApprovalEscalationNotification>[0],
  options: ApprovalCenterServiceOptions,
): Promise<{
  auditLog?: AuditLog;
  escalation: ReturnType<typeof resolveApprovalEscalationState>;
}> {
  if (!options.queueEscalationNotifications) {
    return { escalation: input.escalation };
  }

  return queueApprovalEscalationNotification(input, {
    auditWriter: options.auditWriter,
    notificationRepository: options.notificationRepository,
    now: options.now,
  });
}

async function buildProposalItems(
  user: PermissionUser,
  options: ApprovalCenterServiceOptions,
  now: Date,
) {
  const repository = options.repository ?? proposalRepository;
  const scope = resolveAccessScope(user, {
    requireScopeAssignments: options.requireScopeAssignments,
    rolePermissionCatalog: options.rolePermissionCatalog,
    scopeAssignments: options.scopeAssignments,
  });
  const projectNames = buildProjectNameMap();
  const [policies, delegations] = await Promise.all([
    resolveApprovalPolicies(options),
    resolveDelegations(options),
  ]);
  const policiesById = policyById(policies);
  const proposals = (await repository.listProposals())
    .filter((proposal) => queueProposalStatuses.has(proposal.status))
    .filter((proposal) => canReadProposalInScope(proposal, scope));
  const details = await Promise.all(
    proposals.map(async (proposal) => [
      proposal.id,
      await repository.getProposalDetail(proposal.id),
    ] as const),
  );
  const detailByProposalId = new Map(details);

  return Promise.all(proposals.map(async (proposal): Promise<ApprovalCenterQueueItem> => {
    const detail = detailByProposalId.get(proposal.id);
    const links = detail?.links ?? [];
    const step = currentApprovalStep(proposal, detail?.steps ?? []);
    const policy = escalationPolicyForStep(step, policiesById);
    const category = proposalCategory(proposal, links);
    const { dueGroup, dueLabel } = resolveDueGroup(proposal.dueDate, now);
    const overdue = resolveApprovalOverdueState({
      dueDate: proposal.dueDate,
      now,
      ownerLabel: proposal.ownerId ?? proposal.requestedBy,
      policyLabel: policy.label,
      thresholdDays: policy.escalateAfterDays,
    });
    const escalationResult = await maybeQueueEscalationNotification(
      {
        escalation: resolveApprovalEscalationState({
          currentApprover: {
            label: step?.approverUserId ?? step?.approverRole,
            roleKey: step?.approverRole,
            userId: step?.approverUserId,
          },
          delegationPrincipalIds: [
            detail?.proposal.submittedBy,
            detail?.proposal.onBehalfOf,
          ].filter((principalId): principalId is string => Boolean(principalId)),
          delegations,
          now,
          ownerId: proposal.ownerId,
          overdue,
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
        user,
      },
      options,
    );
    const canViewFinance = canViewFinanceForRecord(
      user,
      { projectId: proposal.projectId, recordId: proposal.id },
      options,
    );
    const projectName = proposal.projectId
      ? projectNames.get(proposal.projectId) ?? proposal.projectId
      : undefined;
    const financialAccess =
      category === "tai_chinh_chi" || proposal.amount !== undefined
        ? canViewFinance
          ? "allowed"
          : "no_permission"
        : "not_applicable";

    return {
      amountLabel:
        financialAccess === "allowed" && proposal.amount !== undefined
          ? formatAmount(proposal.amount)
          : undefined,
      axisKey: "axis_1",
      category,
      categoryLabel: categoryLabel(category),
      code: proposal.code,
      dueDate: proposal.dueDate,
      dueGroup,
      dueLabel,
      escalation: escalationResult.escalation,
      financialAccess,
      href: buildApprovalDetailHref("proposal", proposal.id, options.selectedScopeId),
      id: `proposal-${proposal.id}`,
      ownerName: proposal.ownerId,
      overdue,
      policyLabel: policy.label ?? step?.thresholdLabel,
      priority: proposalPriority(proposal.priority, dueGroup),
      projectId: proposal.projectId,
      projectName,
      reason: proposal.summary,
      requester: proposal.requestedBy,
      reviewerLabel: step?.approverUserId ?? step?.approverRole ?? step?.approvalLevel,
      scopeLabel: proposalScopeLabel(proposal, projectName),
      sourceId: proposal.id,
      sourceType: "proposal",
      status: proposal.status,
      statusLabel: proposalStatusLabels[proposal.status],
      title: proposal.title,
      updatedAt: proposal.updatedAt,
    };
  }));
}

async function buildLeadershipItems(
  user: PermissionUser,
  options: ApprovalCenterServiceOptions,
  now: Date,
) {
  const scope = resolveAccessScope(user, {
    requireScopeAssignments: options.requireScopeAssignments,
    rolePermissionCatalog: options.rolePermissionCatalog,
    scopeAssignments: options.scopeAssignments,
  });
  const projectNames = buildProjectNameMap();
  const leadershipApprovals =
    options.leadershipApprovals ?? defaultLeadershipApprovals;
  const [policies, delegations] = await Promise.all([
    resolveApprovalPolicies(options),
    resolveDelegations(options),
  ]);

  return Promise.all(leadershipApprovals
    .filter((approval) => queueLeadershipStatuses.has(approval.status))
    .filter((approval) =>
      canReadProposalInScope(
        {
          id: approval.id,
          projectId: approval.projectId,
          requestedBy: approval.requestedBy,
          submittedBy: approval.requestedBy,
        },
        scope,
      ),
    )
    .map(async (approval): Promise<ApprovalCenterQueueItem> => {
      const category = leadershipCategoryByType[approval.type];
      const { dueGroup, dueLabel } = resolveDueGroup(approval.dueDate, now);
      const policy = escalationPolicyForLeadership(approval, policies);
      const overdue = resolveApprovalOverdueState({
        dueDate: approval.dueDate,
        now,
        ownerLabel: approval.requester,
        policyLabel: policy.label,
        thresholdDays: policy.escalateAfterDays,
      });
      const escalationResult = await maybeQueueEscalationNotification(
        {
          escalation: resolveApprovalEscalationState({
            currentApprover: {
              label: policy.roleKey ?? approval.approvalLevel,
              roleKey: policy.roleKey ?? approval.approvalLevel,
              userId: approval.approverId,
            },
            delegations,
            now,
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
          user,
        },
        options,
      );
      const canViewFinance = canViewFinanceForRecord(
        user,
        { projectId: approval.projectId, recordId: approval.id },
        options,
      );
      const projectName = approval.projectId
        ? projectNames.get(approval.projectId) ?? approval.projectId
        : undefined;
      const financialAccess =
        category === "tai_chinh_chi" || approval.amount !== undefined
          ? canViewFinance
            ? "allowed"
            : "no_permission"
          : "not_applicable";

      return {
        amountLabel: financialAccess === "allowed" ? approval.amountLabel : undefined,
        axisKey: "axis_1",
        category,
        categoryLabel: categoryLabel(category),
        code: approval.proposalCode,
        dueDate: approval.dueDate,
        dueGroup,
        dueLabel,
        escalation: escalationResult.escalation,
        financialAccess,
        id: `leadership-${approval.id}`,
        overdue,
        policyLabel: policy.label,
        priority: leadershipPriority(approval.riskLevel, dueGroup),
        projectId: approval.projectId,
        projectName,
        reason: approval.reason,
        requester: approval.requester,
        reviewerLabel: approval.approvalLevel,
        riskLevel: approval.riskLevel,
        scopeLabel: projectName ?? approval.projectId ?? "Organization",
        sourceId: approval.id,
        sourceType: "leadership_approval",
        status: approval.status,
        statusLabel: leadershipStatusLabels[approval.status],
        title: approval.title,
      };
    }));
}

function sortItems(items: ApprovalCenterQueueItem[]) {
  return [...items].sort((a, b) => {
    const dueRank = dueGroupRank[a.dueGroup] - dueGroupRank[b.dueGroup];

    if (dueRank !== 0) {
      return dueRank;
    }

    const itemPriorityRank = priorityRank[a.priority] - priorityRank[b.priority];

    if (itemPriorityRank !== 0) {
      return itemPriorityRank;
    }

    const dueDateRank = (a.dueDate ?? "9999-12-31").localeCompare(
      b.dueDate ?? "9999-12-31",
    );

    if (dueDateRank !== 0) {
      return dueDateRank;
    }

    const updatedAtRank = (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");

    if (updatedAtRank !== 0) {
      return updatedAtRank;
    }

    return `${a.code} ${a.title}`.localeCompare(`${b.code} ${b.title}`);
  });
}

function summarizeCategories(
  items: ApprovalCenterQueueItem[],
): ApprovalCenterCategorySummary[] {
  return APPROVAL_CENTER_CATEGORIES.map((definition) => ({
    key: definition.key,
    label: definition.label,
    total: items.filter((item) => item.category === definition.key).length,
  }));
}

function buildTabs(items: ApprovalCenterQueueItem[]): ApprovalCenterAxisTab[] {
  const axisOneItems = sortItems(items.filter((item) => item.axisKey === "axis_1"));
  const axisOneCategories = summarizeCategories(axisOneItems);

  return [
    {
      categories: axisOneCategories,
      helper: "Scoped approvals by category.",
      items: axisOneItems,
      key: "axis_1",
      label: "Truc 1",
      state: "available",
      total: axisOneItems.length,
    },
    {
      categories: summarizeCategories([]),
      helper: "Placeholder MVP. Chua co flow chi tiet cho Truc 2.",
      items: [],
      key: "axis_2",
      label: "Truc 2",
      state: "placeholder",
      total: 0,
    },
    {
      categories: summarizeCategories([]),
      helper: "Placeholder MVP. Chua co flow chi tiet cho Truc 3.",
      items: [],
      key: "axis_3",
      label: "Truc 3",
      state: "placeholder",
      total: 0,
    },
  ];
}

function emptyApprovalCenterData(
  user: PermissionUser,
  options: ApprovalCenterServiceOptions,
  now: Date,
): ApprovalCenterData {
  return {
    generatedAt: now.toISOString(),
    permissions: {
      canView: false,
      canViewFinance:
        can(user, "finance.view") ||
        hasAnyScopedActionGrant(user, "finance.view", {
          rolePermissionCatalog: options.rolePermissionCatalog,
          scopeAssignments: options.scopeAssignments,
        }),
    },
    scopeLabel: options.scopeLabel ?? "No approval scope",
    tabs: buildTabs([]),
  };
}

export async function getApprovalCenterData(
  user: PermissionUser,
  options: ApprovalCenterServiceOptions = {},
): Promise<ApprovalCenterData> {
  const scopedOptions = withSelectedScopeAssignments(user, options);
  const now = options.now ?? new Date();

  if (!canViewApprovalCenter(user, scopedOptions)) {
    return emptyApprovalCenterData(user, scopedOptions, now);
  }

  const [proposalItems, leadershipItems] = await Promise.all([
    buildProposalItems(user, scopedOptions, now),
    Promise.resolve(buildLeadershipItems(user, scopedOptions, now)),
  ]);
  const canViewFinance =
    can(user, "finance.view") ||
    hasAnyScopedActionGrant(user, "finance.view", {
      rolePermissionCatalog: scopedOptions.rolePermissionCatalog,
      scopeAssignments: scopedOptions.scopeAssignments,
    });

  return {
    generatedAt: now.toISOString(),
    permissions: {
      canView: true,
      canViewFinance,
    },
    scopeLabel: scopedOptions.scopeLabel ?? "Approval scope",
    tabs: buildTabs([...proposalItems, ...leadershipItems]),
  };
}

export async function getApprovalCenterDetailData(
  source: { sourceType: ApprovalCenterSourceType; sourceId: string },
  user: PermissionUser,
  options: ApprovalCenterServiceOptions = {},
): Promise<ApprovalCenterDetailData | undefined> {
  const scopedOptions = withSelectedScopeAssignments(user, options);

  if (source.sourceType !== "proposal" || !canViewApprovalCenter(user, scopedOptions)) {
    return undefined;
  }

  const repository = scopedOptions.repository ?? proposalRepository;
  const detail = await repository.getProposalDetail(source.sourceId);

  if (!detail) {
    return undefined;
  }

  if (!detailProposalStatuses.has(detail.proposal.status)) {
    return undefined;
  }

  const scope = resolveAccessScope(user, {
    requireScopeAssignments: scopedOptions.requireScopeAssignments,
    rolePermissionCatalog: scopedOptions.rolePermissionCatalog,
    scopeAssignments: scopedOptions.scopeAssignments,
  });

  if (!canReadProposalInScope(detail.proposal, scope)) {
    return undefined;
  }

  const projectNames = buildProjectNameMap();
  const projectName = detail.proposal.projectId
    ? projectNames.get(detail.proposal.projectId) ?? detail.proposal.projectId
    : undefined;
  const category = proposalCategory(detail.proposal, detail.links);
  const canViewFinance = canViewFinanceForRecord(
    user,
    { projectId: detail.proposal.projectId, recordId: detail.proposal.id },
    scopedOptions,
  );
  const canViewAudit = canViewAuditForRecord(user, detail.proposal, scopedOptions);
  const now = scopedOptions.now ?? new Date();
  const step = currentApprovalStep(detail.proposal, detail.steps);
  let overdue: ReturnType<typeof resolveApprovalOverdueState> | undefined;
  let escalationResult: Awaited<ReturnType<typeof maybeQueueEscalationNotification>> | undefined;

  if (queueProposalStatuses.has(detail.proposal.status)) {
    const [policies, delegations] = await Promise.all([
      resolveApprovalPolicies(scopedOptions),
      resolveDelegations(scopedOptions),
    ]);
    const policy = escalationPolicyForStep(step, policyById(policies));

    overdue = resolveApprovalOverdueState({
      dueDate: detail.proposal.dueDate,
      now,
      ownerLabel: detail.proposal.ownerId ?? detail.proposal.requestedBy,
      policyLabel: policy.label,
      thresholdDays: policy.escalateAfterDays,
    });
    escalationResult = await maybeQueueEscalationNotification(
      {
        escalation: resolveApprovalEscalationState({
          currentApprover: {
            label: step?.approverUserId ?? step?.approverRole,
            roleKey: step?.approverRole,
            userId: step?.approverUserId,
          },
          delegationPrincipalIds: [
            detail.proposal.submittedBy,
            detail.proposal.onBehalfOf,
          ].filter((principalId): principalId is string => Boolean(principalId)),
          delegations,
          now,
          ownerId: detail.proposal.ownerId,
          overdue,
          policy,
          proposerId: detail.proposal.requestedBy,
          scope: {
            projectId: detail.proposal.projectId,
            moduleId: detail.proposal.module,
            recordId: detail.proposal.id,
          },
        }),
        overdue,
        source: {
          code: detail.proposal.code,
          scope: {
            projectId: detail.proposal.projectId,
            moduleId: detail.proposal.module,
            recordId: detail.proposal.id,
          },
          sourceId: detail.proposal.id,
          sourceType: "proposal",
          title: detail.proposal.title,
        },
        user,
      },
      scopedOptions,
    );
  }
  const auditLogs = await resolveProposalAuditLogs(
    detail.proposal.id,
    canViewAudit,
    scopedOptions,
  );
  const visibleAuditLogs =
    canViewAudit && escalationResult?.auditLog
      ? [escalationResult.auditLog, ...auditLogs]
      : auditLogs;
  const financialAccess =
    category === "tai_chinh_chi" || detail.proposal.amount !== undefined
      ? canViewFinance
        ? "allowed"
        : "no_permission"
      : "not_applicable";
  const linkedSources = buildLinkedSources(
    detail.links,
    detail.proposal,
    user,
    scope,
    scopedOptions,
  );
  const historyLinks = detail.links.filter((link) =>
    linkedSources.some((source) => source.id === link.id && source.state === "linked"),
  );

  return {
    backHref: buildBackHref(scopedOptions.selectedScopeId),
    escalation: escalationResult?.escalation,
    generatedAt: now.toISOString(),
    history: buildHistory(detail.decisions, detail.steps, visibleAuditLogs, historyLinks),
    linkedSources,
    overdue,
    permissions: {
      availableActions: buildAvailableActions(detail, user, scopedOptions),
      canView: true,
      canViewAudit,
      canViewFinance,
    },
    policy: buildPolicy(detail.proposal, detail.steps),
    requestSummary: {
      amountLabel:
        financialAccess === "allowed" && detail.proposal.amount !== undefined
          ? formatAmount(detail.proposal.amount)
          : undefined,
      dueDate: detail.proposal.dueDate,
      financialAccess,
      module: detail.proposal.module,
      ownerName: detail.proposal.ownerId,
      priority: detail.proposal.priority,
      projectId: detail.proposal.projectId,
      projectName,
      proposer: detail.proposal.requestedBy,
      scopeLabel: proposalScopeLabel(detail.proposal, projectName),
      submittedBy: detail.proposal.submittedBy,
      summary: detail.proposal.summary,
    },
    selectedScopeId: scopedOptions.selectedScopeId,
    source: {
      axisKey: "axis_1",
      category,
      categoryLabel: categoryLabel(category),
      code: detail.proposal.code,
      sourceId: detail.proposal.id,
      sourceType: "proposal",
      status: detail.proposal.status,
      statusLabel: proposalStatusLabels[detail.proposal.status],
      title: detail.proposal.title,
    },
  };
}
