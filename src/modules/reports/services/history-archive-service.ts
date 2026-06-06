import { can, type PermissionAction, type PermissionUser } from "@/lib/permissions/can";
import { hasAnyScopedActionGrant } from "@/lib/permissions/access-scope";
import {
  listScopedDecisions,
  listScopedDocuments,
  listScopedMeetings,
  listScopedProjects,
  listScopedProposals,
  listScopedTasks,
} from "@/lib/permissions/scoped-resources";
import { listDocumentVersions } from "@/modules/documents/services/document-service";
import type { Document, DocumentListFilters, DocumentVersion } from "@/modules/documents/types";
import { listExternalSearchLogs, type ExternalSearchLogListFilters } from "@/modules/knowledge/services/knowledge-intake-service";
import type { ExternalSearchLog } from "@/modules/knowledge/types";
import { meetingRepository } from "@/modules/meetings/services/meeting-repository";
import type {
  Decision,
  DecisionAssignment,
  DecisionAssignmentListFilters,
  DecisionListFilters,
  DecisionVersion,
  Meeting,
  MeetingListFilters,
} from "@/modules/meetings/types";
import type { Project, ProjectListFilters } from "@/modules/projects/types";
import { proposalRepository } from "@/modules/proposals/services/proposal-repository";
import type { Proposal, ProposalDetail, ProposalListFilters } from "@/modules/proposals/types";
import type {
  HistoryArchiveData,
  HistoryArchiveEvent,
  HistoryArchiveEventType,
  HistoryArchiveFilters,
  HistoryArchiveSeverity,
  HistoryArchiveScope,
  ReportExportTarget,
} from "@/modules/reports/types";
import { historyArchiveFilterSchema } from "@/modules/reports/validation";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import { listActiveScopeAssignments } from "@/modules/settings/services/scope-assignment-service";
import type { RolePermissionCatalog, ScopeAssignment } from "@/modules/settings/types";
import type { Task, TaskListFilters } from "@/modules/tasks/types";
import { listAuditLogs } from "@/modules/users/services/user-service";
import type { AuditLog, AuditLogListFilters } from "@/modules/users/types";

type NormalizedHistoryArchiveFilters = HistoryArchiveFilters & { limit: number };

export type HistoryArchiveServiceDependencies = {
  assignmentLoader?: (filters?: DecisionAssignmentListFilters) => Promise<DecisionAssignment[]>;
  auditLogLoader?: (filters?: AuditLogListFilters) => Promise<AuditLog[]>;
  decisionLoader?: (user: PermissionUser, filters?: DecisionListFilters) => Promise<Decision[]>;
  documentLoader?: (user: PermissionUser, filters?: DocumentListFilters) => Promise<Document[]>;
  documentVersionLoader?: (documentId: string) => Promise<DocumentVersion[]>;
  meetingLoader?: (user: PermissionUser, filters?: MeetingListFilters) => Promise<Meeting[]>;
  now?: () => string;
  projectLoader?: (user: PermissionUser, filters?: ProjectListFilters) => Promise<Project[]>;
  proposalDetailLoader?: (user: PermissionUser, proposalId: string) => Promise<ProposalDetail | undefined>;
  proposalLoader?: (user: PermissionUser, filters?: ProposalListFilters) => Promise<Proposal[]>;
  rolePermissionCatalog?: RolePermissionCatalog;
  scopeAssignments?: ScopeAssignment[];
  searchLogLoader?: (filters?: ExternalSearchLogListFilters) => Promise<ExternalSearchLog[]>;
  taskLoader?: (user: PermissionUser, filters?: TaskListFilters) => Promise<Task[]>;
  versionLoader?: (decisionId: string) => Promise<DecisionVersion[]>;
};

type VisibleEntitySets = Map<string, Map<string, HistoryArchiveScope>>;
type ScopedPermissionContext = {
  rolePermissionCatalog?: RolePermissionCatalog;
  scopeAssignments: ScopeAssignment[];
};

const decisionHrefView = "executive-decision-log";
const typeRank: Record<HistoryArchiveEventType, number> = {
  audit: 0,
  document_version: 1,
  meeting: 2,
  approval: 3,
  decision: 4,
  assignment: 5,
  search: 6,
};
const adminAuditEntityTypes = new Set([
  "audit",
  "permission",
  "project_membership",
  "role",
  "role_permission",
  "scope_assignment",
  "settings",
  "system",
  "user",
]);
const safeAuditKeys = [
  "changedFields",
  "count",
  "nextStatus",
  "previousStatus",
  "reasonProvided",
  "scope",
  "status",
  "versionNumber",
];
const scopeDimensionKeys = [
  "organizationId",
  "projectId",
  "axisId",
  "workstreamId",
  "moduleId",
  "recordId",
] as const;
const axisAliases = new Map([
  ["axis-1", "project_management"],
  ["axis1", "project_management"],
  ["project_management", "project_management"],
]);

function timestampNow() {
  return new Date().toISOString();
}

function hasAnyPermission(user: PermissionUser, permissions: PermissionAction[]) {
  return permissions.some((permission) => can(user, permission));
}

async function scopedPermissionContext(
  dependencies: HistoryArchiveServiceDependencies,
): Promise<ScopedPermissionContext> {
  const [scopeAssignments, rolePermissionCatalog] = await Promise.all([
    dependencies.scopeAssignments ?? listActiveScopeAssignments(),
    dependencies.rolePermissionCatalog ?? listRolePermissionCatalog(),
  ]);

  return { rolePermissionCatalog, scopeAssignments };
}

function permissionSnapshot(
  user: PermissionUser,
  hasScopedGrant: (permission: PermissionAction) => boolean,
) {
  const canViewAudit = can(user, "audit.view") || hasScopedGrant("audit.view");
  const canExport = can(user, "report.export") || hasScopedGrant("report.export");
  const canViewSearchHistory =
    can(user, "knowledge.create_candidate") ||
    can(user, "knowledge.review") ||
    can(user, "knowledge.view") ||
    hasScopedGrant("knowledge.create_candidate") ||
    hasScopedGrant("knowledge.review") ||
    hasScopedGrant("knowledge.view");
  const canViewApprovals =
    hasAnyPermission(user, [
      "proposal.view",
      "proposal.review",
      "proposal.approve",
      "proposal.reject",
      "proposal.request_change",
    ]) ||
    hasScopedGrant("proposal.view") ||
    hasScopedGrant("proposal.review") ||
    hasScopedGrant("proposal.approve") ||
    hasScopedGrant("proposal.reject") ||
    hasScopedGrant("proposal.request_change");
  const canViewDecisionRecords =
    hasAnyPermission(user, ["decision.approve", "decision.create"]) ||
    hasScopedGrant("decision.approve") ||
    hasScopedGrant("decision.create");
  const canViewMeetings = can(user, "meeting.view") || hasScopedGrant("meeting.view");
  const canViewTasks = can(user, "task.view") || hasScopedGrant("task.view");
  const canViewDecisions = canViewDecisionRecords || canViewMeetings;
  const canViewAssignments = canViewDecisionRecords || canViewTasks;
  const canViewDocuments = can(user, "document.view") || hasScopedGrant("document.view");
  const canView =
    user.roleActive !== false &&
    (can(user, "report.view") ||
      hasScopedGrant("report.view") ||
      canViewAudit ||
      canViewSearchHistory ||
      canViewApprovals ||
      canViewDecisions ||
      canViewAssignments ||
      canViewMeetings ||
      canViewDocuments);
  const exportTargets: ReportExportTarget[] = canExport
    ? [
        "dashboard",
        "approval_history",
        ...(canViewAudit ? (["audit_log"] as ReportExportTarget[]) : []),
      ]
    : [];

  return {
    canExport,
    canView,
    canViewAssignments,
    canViewApprovals,
    canViewAudit,
    canViewDecisionRecords,
    canViewDecisions,
    canViewDocuments,
    canViewMeetings,
    canViewSearchHistory,
    canViewTasks,
    exportTargets,
    canReviewSearchHistory: can(user, "knowledge.review"),
  };
}

function emptyData(
  generatedAt: string,
  filters: NormalizedHistoryArchiveFilters,
  permissions: ReturnType<typeof permissionSnapshot>,
): HistoryArchiveData {
  return {
    filters,
    generatedAt,
    items: [],
    permissions: {
      canExport: permissions.canExport,
      canView: permissions.canView,
      canViewAudit: permissions.canViewAudit,
      canViewSearchHistory: permissions.canViewSearchHistory,
      exportTargets: [...permissions.exportTargets],
    },
    sourceCounts: {},
    total: 0,
  };
}

function projectFilter(filters: NormalizedHistoryArchiveFilters) {
  return filters.projectId && filters.projectId !== "all"
    ? filters.projectId
    : undefined;
}

function statusFilter(filters: NormalizedHistoryArchiveFilters) {
  return filters.status && filters.status !== "all" ? filters.status : undefined;
}

async function loadOrEmpty<T>(loader: () => Promise<T[]>) {
  try {
    return await loader();
  } catch {
    return [];
  }
}

function unique(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function scopeAssignmentHasDimension(assignment: ScopeAssignment) {
  return scopeDimensionKeys.some((key) => Boolean(assignment[key]));
}

function normalizeScopeDimensionValue(
  key: (typeof scopeDimensionKeys)[number],
  value: string,
) {
  return key === "axisId" ? (axisAliases.get(value) ?? value) : value;
}

function scopeDimensionMatches(
  key: (typeof scopeDimensionKeys)[number],
  expected: string | undefined,
  actualValues: Array<string | undefined>,
) {
  if (!expected || expected === "*") {
    return true;
  }

  const expectedValue = normalizeScopeDimensionValue(key, expected);

  return actualValues.some(
    (actual) =>
      Boolean(actual) &&
      normalizeScopeDimensionValue(key, actual!) === expectedValue,
  );
}

function eventScopeDimensionValues(
  event: HistoryArchiveEvent,
  key: (typeof scopeDimensionKeys)[number],
) {
  if (key === "projectId") {
    return [event.scope.projectId, ...(event.scope.projectIds ?? [])];
  }

  return [event.scope[key]];
}

function scopeAssignmentMatchesEvent(
  assignment: ScopeAssignment,
  event: HistoryArchiveEvent,
) {
  if (assignment.scopeType === "global" && !scopeAssignmentHasDimension(assignment)) {
    return true;
  }

  if (!scopeAssignmentHasDimension(assignment)) {
    return false;
  }

  return scopeDimensionKeys.every((key) =>
    scopeDimensionMatches(
      key,
      assignment[key],
      eventScopeDimensionValues(event, key),
    ),
  );
}

function filterEventsByScopeAssignments(
  events: HistoryArchiveEvent[],
  scopeAssignments?: ScopeAssignment[],
) {
  if (!scopeAssignments?.length) {
    return events;
  }

  return events.filter((event) =>
    scopeAssignments.some((assignment) =>
      scopeAssignmentMatchesEvent(assignment, event),
    ),
  );
}

function compact(value: string | undefined, maxLength = 160) {
  const normalized = (value ?? "")
    .trim()
    .replace(/https?:\/\/\S+/gi, "[link hidden]")
    .replace(/\s+/g, " ");

  if (!normalized) {
    return "";
  }

  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 3)}...`
    : normalized;
}

function severityFromPriority(priority?: string | null): HistoryArchiveSeverity {
  if (priority === "urgent" || priority === "high") {
    return "critical";
  }

  if (priority === "medium") {
    return "warning";
  }

  return "info";
}

function safeLabel(value: string | undefined, fallback: string) {
  return compact(value, 90) || fallback;
}

function safeMetadata(
  values: Record<string, string | number | boolean | null | undefined>,
): HistoryArchiveEvent["source"]["metadata"] | undefined {
  const entries = Object.entries(values).filter(([, value]) => value !== undefined);

  return entries.length > 0
    ? Object.fromEntries(entries) as HistoryArchiveEvent["source"]["metadata"]
    : undefined;
}

function decisionLabel(decision: Decision) {
  return safeLabel(decision.title, `Decision ${decision.id}`);
}

function proposalLabel(proposal: Proposal) {
  return safeLabel(`${proposal.code} - ${proposal.title}`, `Proposal ${proposal.id}`);
}

function meetingLabel(meeting: Meeting) {
  return safeLabel(meeting.title, `Meeting ${meeting.id}`);
}

function documentLabel(document: Document) {
  return safeLabel(document.title, `Document ${document.id}`);
}

function decisionHref(decisionId: string) {
  const params = new URLSearchParams({
    decisionId,
    view: decisionHrefView,
  });

  return `/command-center?${params.toString()}`;
}

function entityHref(entityType: string, entityId: string) {
  switch (entityType) {
    case "approval":
    case "proposal":
      return `/approvals/proposal/${entityId}`;
    case "decision":
      return decisionHref(entityId);
    case "document":
      return `/documents/${entityId}`;
    case "meeting":
      return `/meetings/${entityId}`;
    case "report":
      return `/reports/${entityId}`;
    case "task":
      return `/tasks/${entityId}`;
    default:
      return undefined;
  }
}

function proposalScope(proposal: Proposal): HistoryArchiveScope {
  return {
    moduleId: proposal.module,
    projectId: proposal.projectId,
    recordId: proposal.id,
    workstreamId: proposal.module,
  };
}

function decisionScope(decision: Decision): HistoryArchiveScope {
  return {
    axisId: decision.axisId,
    moduleId: decision.moduleId ?? "meeting",
    organizationId: decision.organizationId,
    projectId: decision.projectId,
    projectIds: decision.projectIds,
    recordId: decision.id,
    workstreamId: decision.workstreamId,
  };
}

function assignmentScope(assignment: DecisionAssignment): HistoryArchiveScope {
  return {
    moduleId: "decision_assignment",
    organizationId: assignment.organizationId,
    projectId: assignment.projectId,
    recordId: assignment.id,
    workstreamId: "decision",
  };
}

function meetingScope(meeting: Meeting): HistoryArchiveScope {
  return {
    axisId: meeting.axisId,
    moduleId: "meeting",
    organizationId: meeting.organizationId,
    projectId: meeting.projectId,
    projectIds: meeting.projectIds,
    recordId: meeting.id,
    workstreamId: meeting.departmentId ?? "meeting",
  };
}

function documentScope(document: Document, recordId = document.id): HistoryArchiveScope {
  return {
    moduleId: "document",
    projectId: document.projectId,
    recordId,
    workstreamId: "document",
  };
}

function searchScope(log: ExternalSearchLog): HistoryArchiveScope {
  return {
    moduleId: "knowledge",
    recordId: log.id,
    workstreamId: "knowledge",
  };
}

function taskScope(task: Task): HistoryArchiveScope {
  return {
    moduleId: "task",
    projectId: task.projectId,
    recordId: task.id,
    workstreamId: "task",
  };
}

function fallbackAuditScope(entityType: string, entityId: string): HistoryArchiveScope {
  return {
    moduleId: entityType,
    recordId: entityId,
    workstreamId: entityType,
  };
}

function addVisibleEntity(
  sets: VisibleEntitySets,
  entityType: string,
  entityId: string | undefined,
  scope: HistoryArchiveScope,
) {
  if (!entityId) {
    return;
  }

  const key = entityType.toLowerCase();
  const values = sets.get(key) ?? new Map<string, HistoryArchiveScope>();
  values.set(entityId, scope);
  sets.set(key, values);
}

function entityVisibleScope(sets: VisibleEntitySets, entityType: string, entityId: string) {
  return sets.get(entityType.toLowerCase())?.get(entityId);
}

function buildVisibleEntitySets(input: {
  assignments: DecisionAssignment[];
  decisions: Decision[];
  documents: Document[];
  meetings: Meeting[];
  proposals: Proposal[];
  tasks: Task[];
}) {
  const sets: VisibleEntitySets = new Map();

  for (const proposal of input.proposals) {
    const scope = proposalScope(proposal);

    addVisibleEntity(sets, "proposal", proposal.id, scope);
    addVisibleEntity(sets, "approval", proposal.id, scope);
  }

  for (const decision of input.decisions) {
    addVisibleEntity(sets, "decision", decision.id, decisionScope(decision));
  }

  for (const meeting of input.meetings) {
    addVisibleEntity(sets, "meeting", meeting.id, meetingScope(meeting));
  }

  for (const document of input.documents) {
    addVisibleEntity(sets, "document", document.id, documentScope(document));
  }

  for (const assignment of input.assignments) {
    const scope = assignmentScope(assignment);

    addVisibleEntity(sets, "assignment", assignment.id, scope);
    addVisibleEntity(sets, "decision_assignment", assignment.id, scope);
    addVisibleEntity(sets, "task", assignment.taskId, {
      ...scope,
      recordId: assignment.taskId ?? assignment.id,
    });
  }

  for (const task of input.tasks) {
    addVisibleEntity(sets, "task", task.id, taskScope(task));
  }

  return sets;
}

function proposalDecisionSummary(proposal: Proposal, decision: ProposalDetail["decisions"][number]) {
  const labels: Record<ProposalDetail["decisions"][number]["decision"], string> = {
    approved: "da duyet",
    archived: "da luu tru",
    cancelled: "da huy",
    change_requested: "yeu cau chinh sua",
    forwarded: "da chuyen tiep",
    held: "tam giu",
    meeting_requested: "yeu cau hop",
    rejected: "tu choi",
    submitted: "da trinh",
  };

  return `De xuat ${proposalLabel(proposal)} ${labels[decision.decision]}.`;
}

function proposalDecisionEvent(
  proposal: Proposal,
  decision: ProposalDetail["decisions"][number],
): HistoryArchiveEvent {
  return {
    actorId: decision.decidedBy,
    href: entityHref("proposal", proposal.id),
    id: `approval:${decision.id}`,
    module: "approvals",
    occurredAt: decision.decidedAt,
    scope: proposalScope(proposal),
    source: {
      metadata: safeMetadata({
        version: decision.version,
      }),
      sourceId: proposal.id,
      sourceLabel: proposalLabel(proposal),
      sourceType: "proposal",
    },
    severity: severityFromPriority(proposal.priority),
    status: decision.nextStatus ?? proposal.status,
    summary: proposalDecisionSummary(proposal, decision),
    type: "approval",
  };
}

function proposalStepEvent(
  proposal: Proposal,
  step: ProposalDetail["steps"][number],
): HistoryArchiveEvent {
  const occurredAt = step.decidedAt ?? step.updatedAt ?? step.createdAt;

  return {
    actorId: step.decidedBy ?? step.approverUserId,
    href: entityHref("proposal", proposal.id),
    id: `approval-step:${step.id}:${occurredAt}`,
    module: "approvals",
    occurredAt,
    scope: proposalScope(proposal),
    source: {
      metadata: safeMetadata({
        approvalLevel: step.approvalLevel,
        stepOrder: step.stepOrder,
      }),
      sourceId: proposal.id,
      sourceLabel: proposalLabel(proposal),
      sourceType: "proposal_step",
    },
    severity: severityFromPriority(proposal.priority),
    status: step.status,
    summary: `Buoc phe duyet ${step.stepOrder} cua de xuat ${proposalLabel(proposal)} o trang thai ${step.status}.`,
    type: "approval",
  };
}

function proposalLinkEvent(
  proposal: Proposal,
  link: ProposalDetail["links"][number],
): HistoryArchiveEvent {
  return {
    href: entityHref("proposal", proposal.id),
    id: `approval-link:${link.id}`,
    module: "approvals",
    occurredAt: link.createdAt,
    scope: proposalScope(proposal),
    source: {
      metadata: safeMetadata({
        linkedEntityType: link.entityType,
        relationType: link.relationType,
      }),
      sourceId: proposal.id,
      sourceLabel: proposalLabel(proposal),
      sourceType: "proposal_link",
    },
    severity: severityFromPriority(proposal.priority),
    status: proposal.status,
    summary: `De xuat ${proposalLabel(proposal)} lien ket ${link.entityType} (${link.relationType}).`,
    type: "approval",
  };
}

function decisionEvent(decision: Decision): HistoryArchiveEvent {
  const label = decisionLabel(decision);

  return {
    actorId: decision.decidedBy ?? decision.createdBy,
    href: entityHref("decision", decision.id),
    id: `decision:${decision.id}`,
    module: "decisions",
    occurredAt: decision.updatedAt ?? decision.decidedAt ?? decision.createdAt,
    scope: decisionScope(decision),
    source: {
      metadata: safeMetadata({
        priority: decision.priority,
      }),
      sourceId: decision.id,
      sourceLabel: label,
      sourceType: "decision",
    },
    severity: severityFromPriority(decision.priority),
    status: decision.status,
    summary: `Quyet dinh ${label} duoc cap nhat.`,
    type: "decision",
  };
}

function decisionVersionEvent(decision: Decision, version: DecisionVersion): HistoryArchiveEvent {
  const label = decisionLabel(decision);
  const changedFields = unique(version.changedFields);
  const changedLabel = changedFields.length > 0 ? changedFields.join(", ") : "truong du lieu";

  return {
    actorId: version.createdBy,
    href: entityHref("decision", decision.id),
    id: `decision-version:${version.id}`,
    module: "decisions",
    occurredAt: version.createdAt,
    scope: decisionScope(decision),
    source: {
      metadata: safeMetadata({
        changedFields: changedLabel,
        versionNumber: version.versionNumber,
      }),
      sourceId: decision.id,
      sourceLabel: label,
      sourceType: "decision",
    },
    severity: severityFromPriority(decision.priority),
    status: decision.status,
    summary: `Quyet dinh ${label} cap nhat phien ban ${version.versionNumber}: ${changedLabel}.`,
    type: "decision",
  };
}

function assignmentBelongsToDecision(assignment: DecisionAssignment, decision: Decision) {
  const projectIds = unique([decision.projectId, ...(decision.projectIds ?? [])]);

  return (
    assignment.decisionId === decision.id &&
    (projectIds.length === 0 || projectIds.includes(assignment.projectId))
  );
}

function assignmentHasReadableScope(
  assignment: DecisionAssignment,
  visibleTaskById: Map<string, Task>,
  visibleProjectIds: Set<string>,
) {
  if (assignment.taskId) {
    const task = visibleTaskById.get(assignment.taskId);

    return Boolean(task && task.projectId === assignment.projectId);
  }

  return visibleProjectIds.has(assignment.projectId);
}

function assignmentEvent(assignment: DecisionAssignment, decision?: Decision): HistoryArchiveEvent {
  const label = decision ? decisionLabel(decision) : "quyet dinh bi gioi han quyen";

  return {
    actorId: assignment.createdBy,
    href: decision ? entityHref("decision", decision.id) : undefined,
    id: `assignment:${assignment.id}`,
    module: "decisions",
    occurredAt: assignment.createdAt,
    scope: assignmentScope(assignment),
    source: {
      metadata: safeMetadata({
        assigneeType: assignment.assigneeType,
        priority: assignment.priority,
      }),
      sourceId: assignment.id,
      sourceLabel: safeLabel(assignment.title, `Assignment ${assignment.id}`),
      sourceType: "decision_assignment",
    },
    severity: severityFromPriority(assignment.priority),
    status: assignment.status,
    summary: `Giao viec tu quyet dinh ${label}: ${safeLabel(assignment.title, assignment.id)}.`,
    type: "assignment",
  };
}

function meetingStateEvent(meeting: Meeting): HistoryArchiveEvent {
  const label = meetingLabel(meeting);

  return {
    actorId: meeting.createdBy ?? meeting.hostId,
    href: entityHref("meeting", meeting.id),
    id: `meeting:${meeting.id}:state`,
    module: "meetings",
    occurredAt: meeting.updatedAt ?? meeting.startTime ?? meeting.createdAt,
    scope: meetingScope(meeting),
    source: {
      sourceId: meeting.id,
      sourceLabel: label,
      sourceType: "meeting",
    },
    severity: "info",
    status: meeting.status,
    summary: `Cuoc hop ${label} o trang thai ${meeting.status}.`,
    type: "meeting",
  };
}

function meetingAuditEvent(meeting: Meeting, entry: Meeting["auditLog"][number]): HistoryArchiveEvent {
  const label = meetingLabel(meeting);

  return {
    actorId: entry.actorId,
    href: entityHref("meeting", meeting.id),
    id: `meeting-audit:${entry.id}`,
    module: "meetings",
    occurredAt: entry.createdAt,
    scope: meetingScope(meeting),
    source: {
      metadata: safeMetadata({
        action: entry.action,
      }),
      sourceId: meeting.id,
      sourceLabel: label,
      sourceType: "meeting",
    },
    severity: "info",
    status: meeting.status,
    summary: `Cuoc hop ${label}: ${compact(entry.note) || entry.action}.`,
    type: "meeting",
  };
}

function meetingApprovalEvents(meeting: Meeting): HistoryArchiveEvent[] {
  const label = meetingLabel(meeting);
  const events: HistoryArchiveEvent[] = [];

  if (meeting.meetingMinutesApproval?.status === "APPROVED" && meeting.meetingMinutesApproval.approvedAt) {
    events.push({
      actorId: meeting.meetingMinutesApproval.approvedBy,
      href: entityHref("meeting", meeting.id),
      id: `meeting-minutes:${meeting.id}:${meeting.meetingMinutesApproval.approvedAt}`,
      module: "meetings",
      occurredAt: meeting.meetingMinutesApproval.approvedAt,
      scope: meetingScope(meeting),
      source: {
        sourceId: meeting.id,
        sourceLabel: label,
        sourceType: "meeting",
      },
      severity: "info",
      status: "APPROVED",
      summary: `Bien ban cuoc hop ${label} da duoc duyet.`,
      type: "meeting",
    });
  }

  if (meeting.aiSummary.status === "APPROVED" && meeting.aiSummary.approvedAt) {
    events.push({
      actorId: meeting.aiSummary.approvedBy,
      href: entityHref("meeting", meeting.id),
      id: `meeting-ai-summary:${meeting.id}:${meeting.aiSummary.approvedAt}`,
      module: "meetings",
      occurredAt: meeting.aiSummary.approvedAt,
      scope: meetingScope(meeting),
      source: {
        sourceId: meeting.id,
        sourceLabel: label,
        sourceType: "meeting",
      },
      severity: "info",
      status: "APPROVED",
      summary: `AI summary cua cuoc hop ${label} da duoc duyet.`,
      type: "meeting",
    });
  }

  return events;
}

function documentVersionEvent(document: Document, version: DocumentVersion): HistoryArchiveEvent {
  const label = documentLabel(document);

  return {
    actorId: version.uploadedBy,
    href: entityHref("document", document.id),
    id: `document-version:${version.id}`,
    module: "documents",
    occurredAt: version.uploadedAt,
    scope: documentScope(document, version.id),
    source: {
      metadata: safeMetadata({
        documentVersion: version.version,
      }),
      sourceId: document.id,
      sourceLabel: label,
      sourceType: "document",
    },
    severity: "info",
    status: document.approvalStatus ?? document.status,
    summary: `Ho so ${label} cap nhat phien ban ${version.version}.`,
    type: "document_version",
  };
}

function searchEvent(log: ExternalSearchLog): HistoryArchiveEvent {
  return {
    actorId: log.userId,
    id: `search:${log.id}`,
    module: "knowledge",
    occurredAt: log.createdAt,
    scope: searchScope(log),
    source: {
      metadata: safeMetadata({
        provider: log.provider,
        resultCount: log.resultCount,
      }),
      sourceId: log.id,
      sourceType: "external_search",
    },
    severity: "info",
    status: "completed",
    summary: `Tra cuu nguon tri thuc: ${compact(log.query, 80)} (${log.resultCount} ket qua).`,
    type: "search",
  };
}

function toRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;
}

function safeAuditValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string").join(", ");
  }

  if (typeof value === "string") {
    return compact(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return undefined;
}

function safeAuditDetails(audit: AuditLog) {
  const oldValue = toRecord(audit.oldValue);
  const newValue = toRecord(audit.newValue);
  const details: string[] = [];

  for (const key of safeAuditKeys) {
    const value = safeAuditValue(newValue[key] ?? oldValue[key]);

    if (value) {
      details.push(`${key}: ${value}`);
    }
  }

  return details;
}

function auditStatus(audit: AuditLog) {
  const oldValue = toRecord(audit.oldValue);
  const newValue = toRecord(audit.newValue);
  const status = newValue.nextStatus ?? newValue.status ?? oldValue.status;

  return typeof status === "string" ? status : undefined;
}

function auditSummary(audit: AuditLog) {
  const details = safeAuditDetails(audit);

  if (details.length > 0) {
    return `Audit ${audit.entityType}: ${details.join("; ")}.`;
  }

  return `Audit ${audit.entityType}: ${audit.action}.`;
}

function auditEvent(audit: AuditLog, scope: HistoryArchiveScope): HistoryArchiveEvent {
  const sourceType = audit.entityType.toLowerCase();

  return {
    actorId: audit.actorId,
    href: entityHref(sourceType, audit.entityId),
    id: `audit:${audit.id}`,
    module: "audit",
    occurredAt: audit.createdAt,
    scope,
    source: {
      metadata: safeMetadata({
        changedFields: stringArray(toRecord(audit.newValue).changedFields)?.join(", "),
      }),
      sourceId: audit.entityId,
      sourceType,
    },
    severity: "warning",
    status: auditStatus(audit),
    summary: compact(auditSummary(audit)),
    type: "audit",
  };
}

function auditVisibleScope(audit: AuditLog, sets: VisibleEntitySets, user: PermissionUser) {
  const entityType = audit.entityType.toLowerCase();
  const scope = entityVisibleScope(sets, entityType, audit.entityId);

  if (scope) {
    return scope;
  }

  if (!adminAuditEntityTypes.has(entityType)) {
    return undefined;
  }

  return can(user, "user.view") || can(user, "settings.manage")
    ? fallbackAuditScope(entityType, audit.entityId)
    : undefined;
}

function eventProjectIds(event: HistoryArchiveEvent) {
  return unique([event.scope.projectId, ...(event.scope.projectIds ?? [])]);
}

function eventMatchesFilters(
  event: HistoryArchiveEvent,
  filters: NormalizedHistoryArchiveFilters,
  projectLabelsById: Map<string, string> = new Map(),
) {
  const projectId = projectFilter(filters);
  const status = statusFilter(filters);

  if (filters.type && filters.type !== "all" && event.type !== filters.type) {
    return false;
  }

  if (filters.module && filters.module !== "all" && event.module !== filters.module) {
    return false;
  }

  if (filters.actorId && filters.actorId !== "all" && event.actorId !== filters.actorId) {
    return false;
  }

  if (filters.severity && filters.severity !== "all" && event.severity !== filters.severity) {
    return false;
  }

  if (status && event.status?.toLowerCase() !== status.toLowerCase()) {
    return false;
  }

  if (projectId && !eventProjectIds(event).includes(projectId)) {
    return false;
  }

  if (filters.dateFrom && event.occurredAt < filters.dateFrom) {
    return false;
  }

  if (filters.dateTo && event.occurredAt > filters.dateTo) {
    return false;
  }

  if (filters.query) {
    const needle = filters.query.toLowerCase();
    const haystack = [
      event.id,
      event.actorId,
      event.summary,
      event.status,
      event.source.sourceId,
      event.source.sourceLabel,
      event.source.sourceType,
      ...eventProjectIds(event).map((id) => projectLabelsById.get(id)),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(needle);
  }

  return true;
}

function normalizedEvents(events: HistoryArchiveEvent[]) {
  const byId = new Map<string, HistoryArchiveEvent>();

  for (const event of events) {
    if (!event.occurredAt || !event.summary.trim()) {
      continue;
    }

    byId.set(event.id, event);
  }

  return [...byId.values()].sort((left, right) => {
    const timeRank = right.occurredAt.localeCompare(left.occurredAt);

    if (timeRank !== 0) {
      return timeRank;
    }

    const eventTypeRank = typeRank[left.type] - typeRank[right.type];

    if (eventTypeRank !== 0) {
      return eventTypeRank;
    }

    return left.id.localeCompare(right.id);
  });
}

function sourceCounts(items: HistoryArchiveEvent[]) {
  return items.reduce<HistoryArchiveData["sourceCounts"]>((counts, item) => {
    counts[item.type] = (counts[item.type] ?? 0) + 1;

    return counts;
  }, {});
}

async function proposalEvents(
  user: PermissionUser,
  proposals: Proposal[],
  loader: NonNullable<HistoryArchiveServiceDependencies["proposalDetailLoader"]>,
) {
  const details = await Promise.all(
    proposals.map(async (proposal) => {
      try {
        return await loader(user, proposal.id);
      } catch {
        return undefined;
      }
    }),
  );
  const proposalById = new Map(proposals.map((proposal) => [proposal.id, proposal]));

  return details.flatMap((detail) => {
    if (!detail) {
      return [];
    }

    const proposal = proposalById.get(detail.proposal.id);

    if (!proposal) {
      return [];
    }

    return [
      ...detail.decisions.map((decision) =>
        proposalDecisionEvent(proposal, decision),
      ),
      ...detail.steps.map((step) => proposalStepEvent(proposal, step)),
      ...detail.links.map((link) => proposalLinkEvent(proposal, link)),
    ];
  });
}

async function decisionEvents(
  decisions: Decision[],
  assignments: DecisionAssignment[],
  visibleTasks: Task[],
  visibleProjects: Project[],
  versionLoader: NonNullable<HistoryArchiveServiceDependencies["versionLoader"]>,
) {
  const versionsByDecision = new Map(
    await Promise.all(
      decisions.map(async (decision) => [
        decision.id,
        await loadOrEmpty(() => versionLoader(decision.id)),
      ] as const),
    ),
  );
  const decisionById = new Map(decisions.map((decision) => [decision.id, decision]));
  const visibleTaskById = new Map(visibleTasks.map((task) => [task.id, task]));
  const visibleProjectIds = new Set(visibleProjects.map((project) => project.id));
  const visibleAssignments = assignments.filter((assignment) => {
    const decision = decisionById.get(assignment.decisionId);
    const belongsToDecision = decision
      ? assignmentBelongsToDecision(assignment, decision)
      : true;

    return (
      belongsToDecision &&
      assignmentHasReadableScope(assignment, visibleTaskById, visibleProjectIds)
    );
  });

  return {
    assignments: visibleAssignments,
    events: [
      ...decisions.map(decisionEvent),
      ...decisions.flatMap((decision) =>
        (versionsByDecision.get(decision.id) ?? []).map((version) =>
          decisionVersionEvent(decision, version),
        ),
      ),
      ...visibleAssignments.map((assignment) =>
        assignmentEvent(assignment, decisionById.get(assignment.decisionId)),
      ),
    ],
  };
}

async function documentEvents(
  documents: Document[],
  loader: NonNullable<HistoryArchiveServiceDependencies["documentVersionLoader"]>,
) {
  const versionEntries = await Promise.all(
    documents.map(async (document) => [
      document,
      await loadOrEmpty(() => loader(document.id)),
    ] as const),
  );

  return versionEntries.flatMap(([document, versions]) =>
    versions.map((version) => documentVersionEvent(document, version)),
  );
}

export async function getHistoryArchiveData(
  user: PermissionUser,
  filters: HistoryArchiveFilters = {},
  dependencies: HistoryArchiveServiceDependencies = {},
): Promise<HistoryArchiveData> {
  const generatedAt = (dependencies.now ?? timestampNow)();
  const normalizedFilters = historyArchiveFilterSchema.parse(filters) as NormalizedHistoryArchiveFilters;
  const scopedContext = await scopedPermissionContext(dependencies);
  const hasScopedGrant = (permission: PermissionAction) =>
    hasAnyScopedActionGrant(user, permission, {
      rolePermissionCatalog: scopedContext.rolePermissionCatalog,
      scopeAssignments: scopedContext.scopeAssignments,
    });
  const permissions = permissionSnapshot(user, hasScopedGrant);

  if (!permissions.canView) {
    return emptyData(generatedAt, normalizedFilters, permissions);
  }

  const projectId = projectFilter(normalizedFilters);
  const proposalLoader = dependencies.proposalLoader ?? listScopedProposals;
  const proposalDetailLoader =
    dependencies.proposalDetailLoader ??
    ((_user: PermissionUser, proposalId: string) =>
      proposalRepository.getProposalDetail(proposalId));
  const decisionLoader = dependencies.decisionLoader ?? listScopedDecisions;
  const assignmentLoader =
    dependencies.assignmentLoader ??
    ((assignmentFilters?: DecisionAssignmentListFilters) =>
      meetingRepository.listDecisionAssignments(assignmentFilters));
  const versionLoader =
    dependencies.versionLoader ??
    ((decisionId: string) => meetingRepository.listDecisionVersions(decisionId));
  const meetingLoader = dependencies.meetingLoader ?? listScopedMeetings;
  const documentLoader = dependencies.documentLoader ?? listScopedDocuments;
  const documentVersionLoader = dependencies.documentVersionLoader ?? listDocumentVersions;
  const projectLoader = dependencies.projectLoader ?? listScopedProjects;
  const searchLogLoader = dependencies.searchLogLoader ?? listExternalSearchLogs;
  const taskLoader = dependencies.taskLoader ?? listScopedTasks;

  const [
    proposals,
    rawDecisions,
    meetings,
    documents,
    searchLogs,
    visibleTasks,
    rawVisibleProjects,
  ] = await Promise.all([
    permissions.canViewApprovals
      ? loadOrEmpty(() => proposalLoader(user, { projectId }))
      : Promise.resolve([]),
    permissions.canViewDecisions
      ? loadOrEmpty(() => decisionLoader(user, { projectId }))
      : Promise.resolve([]),
    permissions.canViewMeetings
      ? loadOrEmpty(() => meetingLoader(user, { projectId }))
      : Promise.resolve([]),
    permissions.canViewDocuments
      ? loadOrEmpty(() => documentLoader(user, { projectId }))
      : Promise.resolve([]),
    permissions.canViewSearchHistory
      ? loadOrEmpty(() =>
          searchLogLoader(permissions.canReviewSearchHistory ? undefined : { userId: user.id }),
        )
      : Promise.resolve([]),
    permissions.canViewAssignments
      ? loadOrEmpty(() => taskLoader(user, { projectId }))
      : Promise.resolve([]),
    permissions.canView
      ? loadOrEmpty(() => projectLoader(user))
      : Promise.resolve([]),
  ]);
  const visibleProjects = projectId
    ? rawVisibleProjects.filter((project) => project.id === projectId)
    : rawVisibleProjects;
  const projectLabelsById = new Map(
    visibleProjects.map((project) => [
      project.id,
      `${project.code ?? ""} ${project.name ?? ""}`.trim(),
    ]),
  );
  const visibleMeetingIds = new Set(meetings.map((meeting) => meeting.id));
  const decisions = rawDecisions.filter(
    (decision) =>
      permissions.canViewDecisionRecords ||
      (decision.meetingId ? visibleMeetingIds.has(decision.meetingId) : false),
  );
  const assignments = permissions.canViewAssignments
    ? await loadOrEmpty(() => assignmentLoader({ projectId }))
    : [];
  const [
    approvalEvents,
    decisionResult,
    meetingEvents,
    docEvents,
  ] = await Promise.all([
    proposalEvents(user, proposals, proposalDetailLoader),
    decisionEvents(decisions, assignments, visibleTasks, visibleProjects, versionLoader),
    Promise.resolve(
      meetings.flatMap((meeting) => [
        meetingStateEvent(meeting),
        ...meeting.auditLog.map((entry) => meetingAuditEvent(meeting, entry)),
        ...meetingApprovalEvents(meeting),
      ]),
    ),
    documentEvents(documents, documentVersionLoader),
  ]);
  const visibleEntitySets = buildVisibleEntitySets({
    assignments: decisionResult.assignments,
    decisions,
    documents,
    meetings,
    proposals,
    tasks: visibleTasks,
  });
  const auditEvents =
    permissions.canViewAudit
      ? (await loadOrEmpty(() =>
          (dependencies.auditLogLoader ?? listAuditLogs)(),
        ))
          .flatMap((audit) => {
            const scope = auditVisibleScope(audit, visibleEntitySets, user);

            return scope ? [auditEvent(audit, scope)] : [];
          })
      : [];
  const filteredSearchEvents = searchLogs
    .filter(
      (log) => permissions.canReviewSearchHistory || log.userId === user.id,
    )
    .map(searchEvent);
  const scopedEvents = filterEventsByScopeAssignments(normalizedEvents([
    ...approvalEvents,
    ...decisionResult.events,
    ...meetingEvents,
    ...docEvents,
    ...auditEvents,
    ...filteredSearchEvents,
  ]), dependencies.scopeAssignments);
  const filteredItems = scopedEvents.filter((event) =>
    eventMatchesFilters(event, normalizedFilters, projectLabelsById),
  );
  const items = filteredItems.slice(0, normalizedFilters.limit);

  return {
    filters: normalizedFilters,
    generatedAt,
    items,
    permissions: {
      canExport: permissions.canExport,
      canView: permissions.canView,
      canViewAudit: permissions.canViewAudit,
      canViewSearchHistory: permissions.canViewSearchHistory,
      exportTargets: [...permissions.exportTargets],
    },
    sourceCounts: sourceCounts(filteredItems),
    total: filteredItems.length,
  };
}
