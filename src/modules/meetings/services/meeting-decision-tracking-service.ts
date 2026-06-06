import { businessDayIndex } from "@/lib/date/business-day";
import {
  canAccessScopedAction,
  requiresAssignmentScopeForRole,
} from "@/lib/permissions/access-scope";
import { can, type PermissionUser } from "@/lib/permissions/can";
import {
  getScopedDecision as defaultGetScopedDecision,
  getScopedTask as defaultGetScopedTask,
  listScopedDecisions as defaultListScopedDecisions,
} from "@/lib/permissions/scoped-resources";
import {
  meetingRepository,
  type MeetingRepository,
} from "@/modules/meetings/services/meeting-repository";
import type {
  Decision,
  DecisionAssignment,
  DecisionAssignmentListFilters,
  DecisionHistoryEvent,
  DecisionListFilters,
  DecisionVersion,
  DecisionVersionValue,
  Meeting,
} from "@/modules/meetings/types";
import type { Task } from "@/modules/tasks/types";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import { listActiveScopeAssignments } from "@/modules/settings/services/scope-assignment-service";
import { listAuditLogs } from "@/modules/users/services/user-service";
import type { AuditLog, AuditLogListFilters } from "@/modules/users/types";

export type MeetingDecisionTrackingAssignmentItem = {
  assigneeId?: string;
  assignmentId: string;
  assigneeType?: DecisionAssignment["assigneeType"];
  dueDate?: string;
  executionStatus?: Task["status"];
  hasHiddenTask?: boolean;
  kpi?: string;
  priority: DecisionAssignment["priority"];
  projectId: string;
  status: DecisionAssignment["status"];
  taskHref?: string;
  taskId?: string;
  taskTitle?: string;
  title: string;
};

export type MeetingDecisionTrackingItem = {
  assignmentCount: number;
  assignments: MeetingDecisionTrackingAssignmentItem[];
  decisionId: string;
  decisionHref: string;
  dueDate?: string;
  dueSoonAssignmentCount: number;
  history: DecisionHistoryEvent[];
  openAssignmentCount: number;
  overdueAssignmentCount: number;
  ownerId?: string;
  priority?: Decision["priority"];
  relation: "source" | "context";
  status: Decision["status"];
  title: string;
  updatedAt: string;
};

export type MeetingDecisionTrackingData = {
  generatedAt: string;
  items: MeetingDecisionTrackingItem[];
  permissions: {
    canCreateDecision: boolean;
    canLinkDecision: boolean;
    canViewAudit: boolean;
  };
};

export type MeetingDecisionTrackingServiceDependencies = {
  assignmentLoader?: (
    filters?: DecisionAssignmentListFilters,
  ) => Promise<DecisionAssignment[]>;
  auditLogLoader?: (filters?: AuditLogListFilters) => Promise<AuditLog[]>;
  canCreateDecisionForMeeting?: (
    user: PermissionUser,
    meeting: Meeting,
  ) => Promise<boolean>;
  canLinkDecisionForMeeting?: (
    user: PermissionUser,
    meeting: Meeting,
  ) => Promise<boolean>;
  decisionLoader?: (
    user: PermissionUser,
    filters?: DecisionListFilters,
  ) => Promise<Decision[]>;
  getScopedDecision?: (
    user: PermissionUser,
    decisionId: string,
  ) => Promise<Decision | undefined>;
  getScopedTask?: (
    user: PermissionUser,
    taskId: string,
  ) => Promise<Task | undefined>;
  now?: () => string;
  repository?: MeetingRepository;
  versionLoader?: (decisionId: string) => Promise<DecisionVersion[]>;
};

function now() {
  return new Date().toISOString();
}

function unique(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function linkedDecisionIds(meeting: Meeting) {
  return unique(
    (meeting.relatedRecords ?? [])
      .filter((record) => record.type === "decision")
      .map((record) => record.id),
  );
}

function isDirectMeetingDecision(meeting: Meeting, decision: Decision) {
  return (
    decision.meetingId === meeting.id ||
    (decision.sourceType === "meeting" && decision.sourceId === meeting.id)
  );
}

function compact(value: string | undefined, maxLength = 180) {
  const normalized = (value ?? "").trim().replace(/\s+/g, " ");

  if (!normalized) {
    return "";
  }

  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 3)}...`
    : normalized;
}

function isOpenAssignment(assignment: Pick<DecisionAssignment, "status">) {
  return assignment.status === "assigned" || assignment.status === "in_progress";
}

function generatedAtDate(generatedAt: string) {
  const date = new Date(generatedAt);

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function isOverdueAssignment(
  assignment: Pick<DecisionAssignment, "dueDate" | "status">,
  generatedAt: string,
) {
  const dueDay = businessDayIndex(assignment.dueDate);
  const todayDay = businessDayIndex(generatedAtDate(generatedAt));

  return (
    dueDay !== undefined &&
    todayDay !== undefined &&
    dueDay < todayDay &&
    isOpenAssignment(assignment)
  );
}

function isDueSoonAssignment(
  assignment: Pick<DecisionAssignment, "dueDate" | "status">,
  generatedAt: string,
) {
  const dueDay = businessDayIndex(assignment.dueDate);
  const todayDay = businessDayIndex(generatedAtDate(generatedAt));

  return (
    dueDay !== undefined &&
    todayDay !== undefined &&
    dueDay >= todayDay &&
    dueDay <= todayDay + 7 &&
    isOpenAssignment(assignment)
  );
}

function decisionTrackingHref(decisionId: string) {
  const params = new URLSearchParams({
    decisionId,
    view: "executive-decision-log",
  });

  return `/command-center?${params.toString()}`;
}

function normalizeScopeValue(value?: string) {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
}

function meetingProjectIds(meeting: Pick<Meeting, "projectId" | "projectIds">) {
  return unique([meeting.projectId, ...(meeting.projectIds ?? [])]);
}

function meetingScopeTargets(
  meeting: Pick<
    Meeting,
    "axisId" | "departmentId" | "id" | "organizationId" | "projectId" | "projectIds"
  >,
  options: { workstreamId: string },
) {
  const projectIds = meetingProjectIds(meeting);
  const baseTarget = {
    axisId: normalizeScopeValue(meeting.axisId),
    moduleId: "meeting",
    organizationId: normalizeScopeValue(meeting.organizationId),
    recordId: meeting.id,
    workstreamId: options.workstreamId,
  };

  return projectIds.length > 0
    ? projectIds.map((projectId) => ({ ...baseTarget, projectId }))
    : [baseTarget];
}

async function canUseScopedMeetingAction(
  user: PermissionUser,
  action: "decision.create" | "meeting.update",
  meeting: Meeting,
  options: { workstreamId: string },
) {
  if (!requiresAssignmentScopeForRole(user.role)) {
    return can(user, action, meeting);
  }

  if (!can(user, action, meeting)) {
    return false;
  }

  const [scopeAssignments, rolePermissionCatalog] = await Promise.all([
    listActiveScopeAssignments(),
    listRolePermissionCatalog(),
  ]);

  return meetingScopeTargets(meeting, options).some((target) =>
    canAccessScopedAction(user, action, target, {
      rolePermissionCatalog,
      scopeAssignments,
    }),
  );
}

async function defaultCanCreateDecisionForMeeting(
  user: PermissionUser,
  meeting: Meeting,
) {
  return canUseScopedMeetingAction(user, "decision.create", meeting, {
    workstreamId: "decision",
  });
}

async function defaultCanLinkDecisionForMeeting(
  user: PermissionUser,
  meeting: Meeting,
) {
  return canUseScopedMeetingAction(user, "meeting.update", meeting, {
    workstreamId: normalizeScopeValue(meeting.departmentId) ?? "meeting",
  });
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

function auditSummary(audit: AuditLog) {
  const newValue = toRecord(audit.newValue);
  const oldValue = toRecord(audit.oldValue);
  const summary = newValue.summary;

  if (typeof summary === "string" && summary.trim()) {
    return compact(summary);
  }

  const changedFields =
    stringArray(newValue.changedFields) ?? stringArray(oldValue.changedFields);

  return changedFields?.length
    ? `Changed fields: ${changedFields.join(", ")}`
    : audit.action;
}

function auditHistoryEvent(audit: AuditLog): DecisionHistoryEvent {
  const newValue = toRecord(audit.newValue);
  const oldValue = toRecord(audit.oldValue);

  return {
    action: audit.action,
    actorId: audit.actorId,
    changedFields:
      stringArray(newValue.changedFields) ?? stringArray(oldValue.changedFields),
    createdAt: audit.createdAt,
    id: audit.id,
    summary: auditSummary(audit),
    type: "audit",
  };
}

function sanitizeVersionValues(version: DecisionVersion) {
  const hiddenFields = new Set(["decisionText", "linkedRecords"]);
  const sanitize = (value: DecisionVersionValue) =>
    Object.fromEntries(
      Object.entries(value).map(([field, fieldValue]) => [
        field,
        hiddenFields.has(field) ? "[noi dung da an]" : fieldValue,
      ]),
    );

  return {
    newValue: sanitize(version.newValue),
    previousValue: sanitize(version.previousValue),
  };
}

function versionHistoryEvent(version: DecisionVersion): DecisionHistoryEvent {
  const values = sanitizeVersionValues(version);

  return {
    actorId: version.createdBy,
    changedFields: version.changedFields,
    createdAt: version.createdAt,
    id: version.id,
    newValue: values.newValue,
    previousValue: values.previousValue,
    reason: version.reason,
    type: "version",
    versionNumber: version.versionNumber,
  };
}

async function buildAssignmentItems(
  user: PermissionUser,
  assignments: DecisionAssignment[],
  getScopedTask: MeetingDecisionTrackingServiceDependencies["getScopedTask"],
) {
  const taskEntries = await Promise.all(
    unique(assignments.map((assignment) => assignment.taskId)).map(
      async (taskId) => [
        taskId,
        taskId && getScopedTask ? await getScopedTask(user, taskId) : undefined,
      ] as const,
    ),
  );
  const taskById = new Map(taskEntries);

  return assignments.map<MeetingDecisionTrackingAssignmentItem>((assignment) => {
    const task = assignment.taskId
      ? taskById.get(assignment.taskId)
      : undefined;

    return {
      assigneeId: assignment.assigneeId,
      assignmentId: assignment.id,
      assigneeType: assignment.assigneeType,
      dueDate: assignment.dueDate,
      executionStatus: task?.status,
      hasHiddenTask: Boolean(assignment.taskId && !task),
      kpi: assignment.kpi,
      priority: assignment.priority,
      projectId: assignment.projectId,
      status: assignment.status,
      taskHref: task ? `/tasks/${task.id}` : undefined,
      taskId: task?.id,
      taskTitle: task?.title,
      title: assignment.title,
    };
  });
}

async function buildTrackingItem(input: {
  assignmentLoader: NonNullable<
    MeetingDecisionTrackingServiceDependencies["assignmentLoader"]
  >;
  auditLogLoader: NonNullable<
    MeetingDecisionTrackingServiceDependencies["auditLogLoader"]
  >;
  canViewAudit: boolean;
  decision: Decision;
  generatedAt: string;
  getScopedTask: MeetingDecisionTrackingServiceDependencies["getScopedTask"];
  relation: MeetingDecisionTrackingItem["relation"];
  user: PermissionUser;
  versionLoader: NonNullable<
    MeetingDecisionTrackingServiceDependencies["versionLoader"]
  >;
}): Promise<MeetingDecisionTrackingItem> {
  const [assignments, versions, auditLogs] = await Promise.all([
    input.assignmentLoader({ decisionId: input.decision.id }),
    input.versionLoader(input.decision.id),
    input.canViewAudit
      ? input.auditLogLoader({
          entityId: input.decision.id,
          entityType: "decision",
        })
      : Promise.resolve([]),
  ]);
  const relatedAssignments = assignments.filter(
    (assignment) => assignment.decisionId === input.decision.id,
  );
  const assignmentItems = await buildAssignmentItems(
    input.user,
    relatedAssignments,
    input.getScopedTask,
  );
  const history = [
    ...versions.map(versionHistoryEvent),
    ...auditLogs
      .filter(
        (audit) =>
          audit.entityType === "decision" &&
          audit.entityId === input.decision.id,
      )
      .map(auditHistoryEvent),
  ].sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return {
    assignmentCount: relatedAssignments.length,
    assignments: assignmentItems,
    decisionId: input.decision.id,
    decisionHref: decisionTrackingHref(input.decision.id),
    dueDate: input.decision.dueDate,
    dueSoonAssignmentCount: relatedAssignments.filter((assignment) =>
      isDueSoonAssignment(assignment, input.generatedAt),
    ).length,
    history,
    openAssignmentCount: relatedAssignments.filter(isOpenAssignment).length,
    overdueAssignmentCount: relatedAssignments.filter((assignment) =>
      isOverdueAssignment(assignment, input.generatedAt),
    ).length,
    ownerId: input.decision.ownerId,
    priority: input.decision.priority,
    relation: input.relation,
    status: input.decision.status,
    title: input.decision.title ?? `Decision ${input.decision.id}`,
    updatedAt: input.decision.updatedAt,
  };
}

export async function getMeetingDecisionTrackingData(
  user: PermissionUser,
  meeting: Meeting,
  dependencies: MeetingDecisionTrackingServiceDependencies = {},
): Promise<MeetingDecisionTrackingData> {
  const repository = dependencies.repository ?? meetingRepository;
  const generatedAt = (dependencies.now ?? now)();
  const canViewAudit = can(user, "audit.view");
  const decisionLoader =
    dependencies.decisionLoader ?? defaultListScopedDecisions;
  const getScopedDecision =
    dependencies.getScopedDecision ?? defaultGetScopedDecision;
  const getScopedTask = dependencies.getScopedTask ?? defaultGetScopedTask;
  const assignmentLoader =
    dependencies.assignmentLoader ??
    ((filters?: DecisionAssignmentListFilters) =>
      repository.listDecisionAssignments(filters));
  const versionLoader =
    dependencies.versionLoader ??
    ((decisionId: string) => repository.listDecisionVersions(decisionId));
  const auditLogLoader = dependencies.auditLogLoader ?? listAuditLogs;
  const canCreateDecisionForMeeting =
    dependencies.canCreateDecisionForMeeting ??
    defaultCanCreateDecisionForMeeting;
  const canLinkDecisionForMeeting =
    dependencies.canLinkDecisionForMeeting ?? defaultCanLinkDecisionForMeeting;
  const [canCreateDecision, canLinkDecision] = await Promise.all([
    canCreateDecisionForMeeting(user, meeting),
    canLinkDecisionForMeeting(user, meeting),
  ]);
  const directDecisions = (await decisionLoader(user)).filter((decision) =>
    isDirectMeetingDecision(meeting, decision),
  );
  const decisionById = new Map<string, Decision>();
  const relationById = new Map<string, MeetingDecisionTrackingItem["relation"]>();

  for (const decision of directDecisions) {
    decisionById.set(decision.id, decision);
    relationById.set(decision.id, "source");
  }

  for (const decisionId of linkedDecisionIds(meeting)) {
    if (decisionById.has(decisionId)) {
      continue;
    }

    const decision = await getScopedDecision(user, decisionId);

    if (!decision) {
      continue;
    }

    decisionById.set(decision.id, decision);
    relationById.set(decision.id, "context");
  }

  const items = await Promise.all(
    [...decisionById.values()].map((decision) =>
      buildTrackingItem({
        assignmentLoader,
        auditLogLoader,
        canViewAudit,
        decision,
        generatedAt,
        getScopedTask,
        relation: relationById.get(decision.id) ?? "context",
        user,
        versionLoader,
      }),
    ),
  );

  return {
    generatedAt,
    items,
    permissions: {
      canCreateDecision,
      canLinkDecision,
      canViewAudit,
    },
  };
}
