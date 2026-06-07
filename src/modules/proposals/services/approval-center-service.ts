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
  canReadDocumentInScope,
  canReadProposalInScope,
  hasAnyScopedActionGrant,
  resolveAccessScope,
} from "@/lib/permissions/access-scope";
import { selectScopeAssignmentsForUser } from "@/lib/permissions/navigation-context";
import {
  projects as defaultExecutiveProjects,
} from "@/modules/executive/mock-data/executive-mock-data";
import type {
  ApprovalCenterAxisTab,
  ApprovalCenterCategorySummary,
  ApprovalCenterData,
  ApprovalCenterDetailAction,
  ApprovalCenterDetailAttachment,
  ApprovalCenterDetailData,
  ApprovalCenterDetailHistoryItem,
  ApprovalCenterDetailPolicy,
  ApprovalCenterDetailSource,
  ApprovalDecisionEntryPoint,
  ApprovalCenterDueGroup,
  ApprovalCenterPriority,
  ApprovalCenterQueueCategory,
  ApprovalCenterQueueItem,
  ApprovalCenterSourceType,
  ApprovalDeadlineCompliance,
} from "@/modules/executive/types";
import { businessDaysBetween } from "@/lib/date/business-day";
import type { NotificationRepository } from "@/lib/notifications/notification-repository";
import {
  documentRepository,
  type DocumentRepository,
} from "@/modules/documents/services/document-repository";
import type { Document } from "@/modules/documents/types";
import type {
  Proposal,
  ProposalAttachment,
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
  now?: Date;
  notificationRepository?: NotificationRepository;
  policyRepository?: PolicySettingsRepository;
  queueEscalationNotifications?: boolean;
  repository?: ProposalRepository;
  documentRepository?: DocumentRepository;
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
  "archived",
  "cancelled",
  "rejected",
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

const proposalStatusLabels: Record<ProposalStatus, string> = {
  approved: "Đã duyệt",
  archived: "Đã lưu trữ",
  cancelled: "Đã hủy",
  change_requested: "Yêu cầu chỉnh sửa",
  draft: "Bản nháp",
  in_review: "Đang xem xét",
  on_hold: "Tạm dừng",
  rejected: "Không duyệt",
  submitted: "Đã trình",
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
    return { dueGroup: "none", dueLabel: "Thieu deadline" };
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

function hasValidRequiredDeadline(dueDate?: string) {
  if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return false;
  }

  const date = new Date(`${dueDate}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dueDate;
}

function deadlineComplianceForProposal(proposal: Proposal): ApprovalDeadlineCompliance {
  if (!proposal.dueDate) {
    return "missing_required";
  }

  return hasValidRequiredDeadline(proposal.dueDate) ? "valid" : "invalid";
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

function safeExternalAttachmentHref(value?: string) {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = new URL(value);

    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}

function safeAttachmentHref(attachment: ProposalAttachment) {
  if (attachment.documentId) {
    return `/documents/${encodeURIComponent(attachment.documentId)}`;
  }

  return safeExternalAttachmentHref(attachment.externalUrl ?? attachment.url);
}

function canReadDocumentAttachment(
  attachment: ProposalAttachment,
  proposal: Proposal,
  document: Document | undefined,
  user: PermissionUser,
  scope: ReturnType<typeof resolveAccessScope>,
  options: ApprovalCenterServiceOptions,
) {
  if (!attachment.documentId) {
    return true;
  }

  if (!document || !proposal.projectId || document.projectId !== proposal.projectId) {
    return false;
  }

  if (!canReadDocumentInScope(document, scope)) {
    return false;
  }

  if (can(user, "document.view")) {
    return true;
  }

  return canAccessScopedAction(
    user,
    "document.view",
    {
      axisId: "project_management",
      moduleId: "document",
      projectId: document.projectId,
      recordId: document.id,
      workstreamId: "document",
    },
    {
      rolePermissionCatalog: options.rolePermissionCatalog,
      scopeAssignments: options.scopeAssignments,
    },
  );
}

function buildAttachments(
  attachments: ProposalAttachment[],
  proposal: Proposal,
  attachmentDocuments: Map<string, Document>,
  user: PermissionUser,
  scope: ReturnType<typeof resolveAccessScope>,
  options: ApprovalCenterServiceOptions,
): ApprovalCenterDetailAttachment[] {
  return attachments.map((attachment) => {
    const document = attachment.documentId
      ? attachmentDocuments.get(attachment.documentId)
      : undefined;

    if (!canReadDocumentAttachment(attachment, proposal, document, user, scope, options)) {
      return {
        documentId: undefined,
        href: undefined,
        helper: "Khong co quyen xem file dinh kem nay trong scope hien tai",
        id: attachment.id,
        name: "File bi gioi han quyen",
        source: attachment.source,
        state: "no_permission",
      };
    }

    const href = safeAttachmentHref(attachment);

    return {
      documentId: attachment.documentId,
      createdAt: attachment.createdAt,
      externalUrl: attachment.externalUrl,
      helper: attachment.documentId
        ? "Document attachment"
        : href
          ? "External attachment URL"
          : "Lien ket file khong hop le hoac bi an",
      href,
      id: attachment.id,
      name: attachment.name,
      source: attachment.source,
      state: "linked",
      uploadedAt: attachment.uploadedAt,
      uploadedBy: attachment.uploadedBy,
      url: attachment.url,
    };
  });
}

async function resolveAttachmentDocumentMap(
  attachments: ProposalAttachment[],
  documents: DocumentRepository,
) {
  const documentIds = [
    ...new Set(attachments.map((attachment) => attachment.documentId).filter((documentId): documentId is string => Boolean(documentId))),
  ];
  const entries = await Promise.all(
    documentIds.map(async (documentId) => [documentId, await documents.getDocument(documentId)] as const),
  );

  return new Map(
    entries.filter((entry): entry is readonly [string, Document] => Boolean(entry[1])),
  );
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

function canCreateDecisionFromApproval(
  user: PermissionUser,
  proposal: Proposal,
  options: ApprovalCenterServiceOptions,
) {
  if (can(user, "decision.create")) {
    return true;
  }

  return canAccessScopedAction(
    user,
    "decision.create",
    proposalActionTarget(proposal),
    {
      rolePermissionCatalog: options.rolePermissionCatalog,
      scopeAssignments: options.scopeAssignments,
    },
  );
}

function buildDecisionEntryPoint(
  detail: ProposalDetail,
  user: PermissionUser,
  options: ApprovalCenterServiceOptions,
): ApprovalDecisionEntryPoint | undefined {
  if (!canCreateDecisionFromApproval(user, detail.proposal, options)) {
    return undefined;
  }

  return {
    canCreate: true,
    projectId: detail.proposal.projectId,
    selectedScopeId: options.selectedScopeId,
    sourceId: detail.proposal.id,
    sourceType: "approval",
    titleSuggestion: `Quyet dinh sau approval: ${detail.proposal.title}`,
  };
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
    attachment: 1,
    link: 2,
    step: 3,
    decision: 4,
    version: 5,
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
  attachments: ApprovalCenterDetailAttachment[] = [],
): ApprovalCenterDetailHistoryItem[] {
  const decisionVersions = fallbackDecisionVersions(decisions);
  const decisionItems = decisions.map(
    (decision): ApprovalCenterDetailHistoryItem => ({
      actorId: decision.decidedBy,
      attachmentIds: decision.attachmentIds,
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
  const attachmentItems = attachments.map(
    (attachment): ApprovalCenterDetailHistoryItem => ({
      actorId: attachment.uploadedBy,
      attachmentIds: [attachment.id],
      id: `attachment:${attachment.id}`,
      kind: "attachment",
      label: attachment.name,
      notes: attachment.helper,
      occurredAt: attachment.uploadedAt ?? attachment.createdAt ?? new Date(0).toISOString(),
      status: attachment.state,
    }),
  );

  return sortHistoryItems([
    ...decisionItems,
    ...stepItems,
    ...auditItems,
    ...linkItems,
    ...attachmentItems,
  ]);
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
    const attachmentCount = detail?.attachments.length ?? 0;
    const step = currentApprovalStep(proposal, detail?.steps ?? []);
    const policy = escalationPolicyForStep(step, policiesById);
    const category = proposalCategory(proposal, links);
    const { dueGroup, dueLabel } = resolveDueGroup(proposal.dueDate, now);
    const deadlineCompliance = deadlineComplianceForProposal(proposal);
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
      attachmentCount,
      axisKey: "axis_1",
      category,
      categoryLabel: categoryLabel(category),
      code: proposal.code,
      deadlineCompliance,
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
      helper: "Phê duyệt trong phạm vi theo nhóm.",
      items: axisOneItems,
      key: "axis_1",
      label: "Trục 1",
      state: "available",
      total: axisOneItems.length,
    },
    {
      categories: summarizeCategories([]),
      helper: "Chưa có luồng chi tiết cho Trục 2.",
      items: [],
      key: "axis_2",
      label: "Trục 2",
      state: "placeholder",
      total: 0,
    },
    {
      categories: summarizeCategories([]),
      helper: "Chưa có luồng chi tiết cho Trục 3.",
      items: [],
      key: "axis_3",
      label: "Trục 3",
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

  const proposalItems = await buildProposalItems(user, scopedOptions, now);
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
    tabs: buildTabs(proposalItems),
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
  const attachmentDocuments = await resolveAttachmentDocumentMap(
    detail.attachments,
    scopedOptions.documentRepository ?? documentRepository,
  );
  const attachments = buildAttachments(
    detail.attachments,
    detail.proposal,
    attachmentDocuments,
    user,
    scope,
    scopedOptions,
  );
  const deadlineCompliance = deadlineComplianceForProposal(detail.proposal);
  const historyLinks = detail.links.filter((link) =>
    linkedSources.some((source) => source.id === link.id && source.state === "linked"),
  );
  const decisionEntryPoint = buildDecisionEntryPoint(
    detail,
    user,
    scopedOptions,
  );

  return {
    attachments,
    backHref: buildBackHref(scopedOptions.selectedScopeId),
    decisionEntryPoint,
    escalation: escalationResult?.escalation,
    generatedAt: now.toISOString(),
    history: buildHistory(
      detail.decisions,
      detail.steps,
      visibleAuditLogs,
      historyLinks,
      attachments,
    ),
    linkedSources,
    overdue,
    permissions: {
      availableActions: buildAvailableActions(detail, user, scopedOptions),
      canCreateDecisionFromApproval: Boolean(decisionEntryPoint),
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
      attachmentCount: detail.attachments.length,
      deadlineCompliance,
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
