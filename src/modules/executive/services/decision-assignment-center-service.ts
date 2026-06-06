import {
  can,
  type PermissionAction,
  type PermissionUser,
} from "@/lib/permissions/can";
import {
  canAccessScopedAction,
  canReadDocumentInScope,
  canReadMeetingInScope,
  canReadProjectInScope,
  canReadProposalInScope,
  canReadTaskInScope,
  filterDecisionsForScope,
  filterTasksForScope,
  hasAnyScopedActionGrant,
  requiresAssignmentScopeForRole,
  resolveAccessScope,
} from "@/lib/permissions/access-scope";
import { selectScopeAssignmentsForUser } from "@/lib/permissions/navigation-context";
import { listDocuments } from "@/modules/documents/services/document-service";
import type { Document } from "@/modules/documents/types";
import type {
  DecisionAssignmentCenterAssignmentItem,
  DecisionAssignmentCenterData,
  DecisionAssignmentCenterDetail,
  DecisionAssignmentCenterFilters,
  DecisionAssignmentCenterItem,
  DecisionAssignmentCenterLinkedSource,
  DecisionAssignmentCenterSource,
} from "@/modules/executive/types";
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
} from "@/modules/meetings/types";
import { listActiveScopeAssignments } from "@/modules/settings/services/scope-assignment-service";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import type {
  RolePermissionCatalog,
  ScopeAssignment,
} from "@/modules/settings/types";
import { listTasks } from "@/modules/tasks/services/task-service";
import type { Task } from "@/modules/tasks/types";
import {
  listAuditLogs,
  listProjectMemberships,
} from "@/modules/users/services/user-service";
import type {
  AuditLog,
  AuditLogListFilters,
  ProjectMembership,
} from "@/modules/users/types";

export type DecisionAssignmentCenterServiceDependencies = {
  auditLogLoader?: (filters?: AuditLogListFilters) => Promise<AuditLog[]>;
  assignmentLoader?: (
    filters?: DecisionAssignmentListFilters,
  ) => Promise<DecisionAssignment[]>;
  documentLoader?: () => Promise<Document[]>;
  decisionLoader?: (
    user: PermissionUser,
    filters?: DecisionListFilters,
  ) => Promise<Decision[]>;
  membershipLoader?: () => Promise<ProjectMembership[]>;
  now?: () => string;
  rawTaskLoader?: () => Promise<Task[]>;
  requireScopeAssignments?: boolean;
  repository?: MeetingRepository;
  rolePermissionCatalog?: RolePermissionCatalog;
  scopeAssignments?: ScopeAssignment[];
  selectedScopeId?: string;
  taskLoader?: (user: PermissionUser) => Promise<Task[]>;
  versionLoader?: (decisionId: string) => Promise<DecisionVersion[]>;
};

function timestampNow() {
  return new Date().toISOString();
}

function noAccessData(generatedAt: string): DecisionAssignmentCenterData {
  return {
    generatedAt,
    scopeLabel: "Khong co quyen",
    summary: {
      dueSoonAssignments: 0,
      highPriorityDecisions: 0,
      openAssignments: 0,
      overdueAssignments: 0,
      totalDecisions: 0,
    },
    permissions: {
      canAssignDecision: false,
      canCreateDecision: false,
      canUpdateDecision: false,
      canView: false,
      canViewAudit: false,
    },
    filters: {},
    items: [],
  };
}

function hasCenterReadAccess(
  user: PermissionUser,
  hasScopedGrant: (permission: PermissionAction) => boolean,
) {
  return (
    user.roleActive !== false &&
    (can(user, "decision.create") ||
      can(user, "decision.approve") ||
      can(user, "meeting.view") ||
      can(user, "task.view") ||
      hasScopedGrant("decision.create") ||
      hasScopedGrant("decision.approve") ||
      hasScopedGrant("meeting.view") ||
      hasScopedGrant("task.view"))
  );
}

function normalizedFilters(
  filters: DecisionAssignmentCenterFilters,
): DecisionAssignmentCenterFilters {
  return {
    ...filters,
    assigneeId: filters.assigneeId === "all" ? undefined : filters.assigneeId,
    ownerId: filters.ownerId === "all" ? undefined : filters.ownerId,
    priority: filters.priority === "all" ? undefined : filters.priority,
    projectId: filters.projectId === "all" ? undefined : filters.projectId,
    search: filters.search?.trim() || undefined,
    status: filters.status === "all" ? undefined : filters.status,
  };
}

function decisionProjectIds(decision: Decision) {
  return [
    ...new Set(
      [decision.projectId, ...(decision.projectIds ?? [])].filter(
        (projectId): projectId is string => Boolean(projectId),
      ),
    ),
  ];
}

type DecisionAssignmentCenterScopeContext = {
  rolePermissionCatalog?: RolePermissionCatalog;
  scope: ReturnType<typeof resolveAccessScope>;
  selectedScopeId?: string;
  tasks: Task[];
};

async function resolveCenterScopeContext(
  user: PermissionUser,
  dependencies: DecisionAssignmentCenterServiceDependencies,
): Promise<DecisionAssignmentCenterScopeContext> {
  const [
    allScopeAssignments,
    rolePermissionCatalog,
    memberships,
    tasks,
    documents,
  ] = await Promise.all([
    dependencies.scopeAssignments ?? listActiveScopeAssignments(),
    dependencies.rolePermissionCatalog ?? listRolePermissionCatalog(),
    dependencies.membershipLoader?.() ?? listProjectMemberships(),
    dependencies.rawTaskLoader?.() ?? listTasks(),
    dependencies.documentLoader?.() ?? listDocuments(),
  ]);
  const selectedScopeActive =
    Boolean(dependencies.selectedScopeId) &&
    dependencies.selectedScopeId !== "all";
  const selectedScopeAssignments = selectedScopeActive
    ? selectScopeAssignmentsForUser(
        user,
        allScopeAssignments,
        dependencies.selectedScopeId,
      )
    : allScopeAssignments;
  const scope = resolveAccessScope(user, {
    documents,
    memberships,
    requireScopeAssignments:
      dependencies.requireScopeAssignments ??
      (selectedScopeActive || requiresAssignmentScopeForRole(user.role)),
    rolePermissionCatalog,
    scopeAssignments: selectedScopeAssignments,
    tasks,
  });

  return { rolePermissionCatalog, scope, selectedScopeId: dependencies.selectedScopeId, tasks };
}

function hasScopedPermission(
  user: PermissionUser,
  permission: PermissionAction,
  context: DecisionAssignmentCenterScopeContext,
) {
  return hasAnyScopedActionGrant(user, permission, {
    rolePermissionCatalog: context.rolePermissionCatalog,
    scopeAssignments: context.scope.scopeAssignments,
  });
}

function assignmentBelongsToDecision(
  assignment: DecisionAssignment,
  decision: Decision,
) {
  const projectIds = decisionProjectIds(decision);

  return (
    assignment.decisionId === decision.id &&
    (projectIds.length === 0 || projectIds.includes(assignment.projectId))
  );
}

function dueDateTime(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(`${value}T00:00:00`);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed.getTime();
}

function isAssignmentOpen(assignment: Pick<DecisionAssignment, "status">) {
  return assignment.status === "assigned" || assignment.status === "in_progress";
}

function isAssignmentOverdue(
  assignment: Pick<DecisionAssignment, "dueDate" | "status">,
  today: string,
) {
  const dueTime = dueDateTime(assignment.dueDate);
  const todayTime = dueDateTime(today.slice(0, 10));

  return (
    dueTime !== undefined &&
    todayTime !== undefined &&
    dueTime < todayTime &&
    isAssignmentOpen(assignment)
  );
}

function isAssignmentDueSoon(
  assignment: Pick<DecisionAssignment, "dueDate" | "status">,
  today: string,
) {
  const dueTime = dueDateTime(assignment.dueDate);
  const todayTime = dueDateTime(today.slice(0, 10));

  if (
    dueTime === undefined ||
    todayTime === undefined ||
    !isAssignmentOpen(assignment)
  ) {
    return false;
  }

  return dueTime >= todayTime && dueTime <= todayTime + 7 * 86_400_000;
}

function truncate(value: string, maxLength = 160) {
  const normalized = value.trim().replace(/\s+/g, " ");

  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 3)}...`
    : normalized;
}

function sourceHref(type: DecisionAssignmentCenterSource["type"], id?: string) {
  if (!type || !id) {
    return undefined;
  }

  if (type === "meeting") {
    return `/meetings/${id}`;
  }

  if (type === "proposal" || type === "approval") {
    return `/approvals/proposal/${id}`;
  }

  return undefined;
}

function withScopeId(href: string, selectedScopeId?: string) {
  if (!selectedScopeId || selectedScopeId === "all") {
    return href;
  }

  const separator = href.includes("?") ? "&" : "?";

  return `${href}${separator}scopeId=${encodeURIComponent(selectedScopeId)}`;
}

function linkedRecordHref(
  type: DecisionAssignmentCenterLinkedSource["type"],
  id: string,
) {
  switch (type) {
    case "meeting":
      return `/meetings/${id}`;
    case "proposal":
    case "approval":
      return `/approvals/proposal/${id}`;
    case "project":
      return `/projects/${id}`;
    case "task":
      return `/tasks/${id}`;
    case "document":
      return `/documents/${id}`;
    default:
      return undefined;
  }
}

function linkedSourcePermission(
  type: DecisionAssignmentCenterLinkedSource["type"],
): PermissionAction | undefined {
  switch (type) {
    case "project":
      return "project.view";
    case "proposal":
    case "approval":
      return "proposal.view";
    case "meeting":
      return "meeting.view";
    case "task":
      return "task.view";
    case "document":
      return "document.view";
    default:
      return undefined;
  }
}

function linkedSourceProjectId(
  type: DecisionAssignmentCenterLinkedSource["type"],
  id: string,
  decision: Decision,
  taskById: Map<string, Task>,
) {
  if (type === "project") {
    return id;
  }

  if (type === "task") {
    return taskById.get(id)?.projectId;
  }

  return decision.projectId ?? decision.projectIds?.[0];
}

function canReadLinkedSource(input: {
  decision: Decision;
  id: string;
  scopeContext: DecisionAssignmentCenterScopeContext;
  taskById: Map<string, Task>;
  type: DecisionAssignmentCenterLinkedSource["type"];
  user: PermissionUser;
}) {
  const permission = linkedSourcePermission(input.type);

  if (!permission) {
    return false;
  }

  const projectId = linkedSourceProjectId(
    input.type,
    input.id,
    input.decision,
    input.taskById,
  );

  switch (input.type) {
    case "project":
      return canReadProjectInScope({ id: input.id }, input.scopeContext.scope);
    case "task": {
      const task = input.taskById.get(input.id);

      return task ? canReadTaskInScope(task, input.scopeContext.scope) : false;
    }
    case "document":
      return canReadDocumentInScope(
        { id: input.id, ownerId: undefined, projectId: projectId ?? "" },
        input.scopeContext.scope,
      );
    case "meeting":
      return canReadMeetingInScope(
        {
          axisId: input.decision.axisId,
          createdBy: undefined,
          departmentId: input.decision.workstreamId,
          hostId: undefined,
          id: input.id,
          organizationId: input.decision.organizationId,
          participants: [],
          projectId,
          projectIds: input.decision.projectIds,
        },
        input.scopeContext.scope,
      );
    case "proposal":
    case "approval":
      return canReadProposalInScope(
        {
          id: input.id,
          ownerId: undefined,
          projectId,
          requestedBy: "",
          submittedBy: "",
        },
        input.scopeContext.scope,
      );
    default:
      return canAccessScopedAction(
        input.user,
        permission,
        {
          moduleId: input.type,
          projectId,
          recordId: input.id,
          workstreamId: input.type,
        },
        {
          rolePermissionCatalog: input.scopeContext.rolePermissionCatalog,
          scopeAssignments: input.scopeContext.scope.scopeAssignments,
        },
      );
  }
}

function guardedHref(input: {
  decision: Decision;
  href?: string;
  id?: string;
  scopeContext: DecisionAssignmentCenterScopeContext;
  taskById: Map<string, Task>;
  type: DecisionAssignmentCenterLinkedSource["type"] | undefined;
  user: PermissionUser;
}) {
  if (!input.href || !input.type || !input.id) {
    return undefined;
  }

  return canReadLinkedSource({
    decision: input.decision,
    id: input.id,
    scopeContext: input.scopeContext,
    taskById: input.taskById,
    type: input.type,
    user: input.user,
  })
    ? withScopeId(input.href, input.scopeContext.selectedScopeId)
    : undefined;
}

function sourceLabel(decision: Decision) {
  const sourceRecord = decision.linkedRecords?.find(
    (record) => record.relationType === "source",
  );

  if (sourceRecord?.title) {
    return sourceRecord.title;
  }

  if (decision.sourceType && decision.sourceType !== "independent") {
    return `${decision.sourceType} ${decision.sourceId ?? ""}`.trim();
  }

  return "Decision doc lap";
}

function buildSource(
  decision: Decision,
  context: {
    scopeContext: DecisionAssignmentCenterScopeContext;
    taskById: Map<string, Task>;
    user: PermissionUser;
  },
): DecisionAssignmentCenterSource {
  const href = sourceHref(decision.sourceType, decision.sourceId);

  return {
    href: guardedHref({
      decision,
      href,
      id: decision.sourceId,
      scopeContext: context.scopeContext,
      taskById: context.taskById,
      type: decision.sourceType,
      user: context.user,
    }),
    id: decision.sourceId,
    label: sourceLabel(decision),
    type: decision.sourceType,
  };
}

function buildLinkedSources(
  decision: Decision,
  context: {
    scopeContext: DecisionAssignmentCenterScopeContext;
    taskById: Map<string, Task>;
    user: PermissionUser;
  },
): DecisionAssignmentCenterLinkedSource[] {
  const records = decision.linkedRecords ?? [];
  const sources = records.map((record) => {
    const href = guardedHref({
      decision,
      href: linkedRecordHref(record.type, record.id),
      id: record.id,
      scopeContext: context.scopeContext,
      taskById: context.taskById,
      type: record.type,
      user: context.user,
    });

    return {
      entityId: record.id,
      href,
      id: `${record.type}-${record.id}-${record.relationType}`,
      label: href
        ? record.title ?? `${record.type} ${record.id}`
        : `${record.type} bi gioi han quyen`,
      relationType: record.relationType,
      state: href ? ("linked" as const) : ("no_permission" as const),
      type: record.type,
    };
  });

  if (
    decision.sourceType &&
    decision.sourceType !== "independent" &&
    decision.sourceId &&
    !sources.some((source) => source.entityId === decision.sourceId)
  ) {
    const href = guardedHref({
      decision,
      href: sourceHref(decision.sourceType, decision.sourceId),
      id: decision.sourceId,
      scopeContext: context.scopeContext,
      taskById: context.taskById,
      type: decision.sourceType,
      user: context.user,
    });

    sources.unshift({
      entityId: decision.sourceId,
      href,
      id: `${decision.sourceType}-${decision.sourceId}-source`,
      label: href ? sourceLabel(decision) : `${decision.sourceType} bi gioi han quyen`,
      relationType: "source",
      state: href ? "linked" : "no_permission",
      type: decision.sourceType,
    });
  }

  return sources;
}

function matchesSearch(decision: Decision, search: string | undefined) {
  if (!search) {
    return true;
  }

  const haystack = [
    decision.title,
    decision.decisionText,
    decision.kpi,
    decision.ownerId,
    decision.sourceId,
    ...(decision.linkedRecords?.map((record) => record.title ?? record.id) ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(search.toLowerCase());
}

function buildItem(
  decision: Decision,
  assignments: DecisionAssignment[],
  versions: DecisionVersion[],
  context: {
    scopeContext: DecisionAssignmentCenterScopeContext;
    taskById: Map<string, Task>;
    user: PermissionUser;
  },
): DecisionAssignmentCenterItem {
  return {
    assignmentCount: assignments.length,
    decisionId: decision.id,
    dueDate: decision.dueDate,
    kpi: decision.kpi,
    latestVersionNumber:
      versions.length > 0
        ? Math.max(...versions.map((version) => version.versionNumber))
        : undefined,
    openAssignmentCount: assignments.filter(isAssignmentOpen).length,
    ownerId: decision.ownerId,
    priority: decision.priority,
    projectId: decision.projectId,
    projectIds: decisionProjectIds(decision),
    source: buildSource(decision, context),
    status: decision.status,
    summary: truncate(decision.decisionText),
    title: decision.title ?? truncate(decision.decisionText, 80),
    updatedAt: decision.updatedAt,
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

function auditSummary(audit: AuditLog) {
  const newValue = toRecord(audit.newValue);
  const oldValue = toRecord(audit.oldValue);
  const summary = newValue.summary;

  if (typeof summary === "string" && summary.trim()) {
    return summary;
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
  const sanitize = (value: DecisionVersion["previousValue"]) =>
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

function buildAssignmentItem(
  assignment: DecisionAssignment,
  taskById: Map<string, Task>,
): DecisionAssignmentCenterAssignmentItem {
  const task = assignment.taskId ? taskById.get(assignment.taskId) : undefined;

  return {
    assigneeId: assignment.assigneeId,
    assigneeType: assignment.assigneeType,
    assignmentId: assignment.id,
    createdAt: assignment.createdAt,
    decisionId: assignment.decisionId,
    departmentId: assignment.departmentId,
    description: assignment.description,
    dueDate: assignment.dueDate,
    executionStatus: task?.status,
    kpi: assignment.kpi,
    priority: assignment.priority,
    projectId: assignment.projectId,
    status: assignment.status,
    taskHref: task ? `/tasks/${task.id}` : undefined,
    taskId: task?.id,
    title: assignment.title,
    updatedAt: assignment.updatedAt,
  };
}

function buildDetail(input: {
  assignments: DecisionAssignment[];
  auditLogs: AuditLog[];
  decision: Decision;
  item: DecisionAssignmentCenterItem;
  scopeContext: DecisionAssignmentCenterScopeContext;
  taskById: Map<string, Task>;
  user: PermissionUser;
  versions: DecisionVersion[];
}): DecisionAssignmentCenterDetail {
  const history = [
    ...input.versions.map(versionHistoryEvent),
    ...input.auditLogs.map(auditHistoryEvent),
  ].sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return {
    ...input.item,
    assignments: input.assignments.map((assignment) =>
      buildAssignmentItem(assignment, input.taskById),
    ),
    createdBy: input.decision.createdBy,
    decidedAt: input.decision.decidedAt,
    decidedBy: input.decision.decidedBy,
    decisionText: input.decision.decisionText,
    history,
    linkedSources: buildLinkedSources(input.decision, {
      scopeContext: input.scopeContext,
      taskById: input.taskById,
      user: input.user,
    }),
  };
}

export async function getDecisionAssignmentCenterData(
  user: PermissionUser,
  filters: DecisionAssignmentCenterFilters = {},
  dependencies: DecisionAssignmentCenterServiceDependencies = {},
): Promise<DecisionAssignmentCenterData> {
  const generatedAt = (dependencies.now ?? timestampNow)();
  const normalized = normalizedFilters(filters);
  const scopeContext = await resolveCenterScopeContext(user, dependencies);
  const hasScopedGrant = (permission: PermissionAction) =>
    hasScopedPermission(user, permission, scopeContext);
  const permissions = {
    canAssignDecision:
      (can(user, "decision.create") || hasScopedGrant("decision.create")) &&
      (can(user, "task.create") || hasScopedGrant("task.create")),
    canCreateDecision: can(user, "decision.create") || hasScopedGrant("decision.create"),
    canUpdateDecision: can(user, "decision.create") || hasScopedGrant("decision.create"),
    canView: hasCenterReadAccess(user, hasScopedGrant),
    canViewAudit: can(user, "audit.view") || hasScopedGrant("audit.view"),
  };

  if (!permissions.canView) {
    return noAccessData(generatedAt);
  }

  const repository = dependencies.repository ?? meetingRepository;
  const decisionLoader =
    dependencies.decisionLoader ??
    (async (_user: PermissionUser, decisionFilters?: DecisionListFilters) =>
      repository.listDecisions(decisionFilters));
  const assignmentLoader =
    dependencies.assignmentLoader ??
    ((assignmentFilters?: DecisionAssignmentListFilters) =>
      repository.listDecisionAssignments(assignmentFilters));
  const versionLoader =
    dependencies.versionLoader ??
    ((decisionId: string) => repository.listDecisionVersions(decisionId));
  const decisionFilters: DecisionListFilters = {
    ownerId: normalized.ownerId,
    projectId: normalized.projectId,
    status: normalized.status,
  };
  const decisions = filterDecisionsForScope(
    await decisionLoader(user, decisionFilters),
    scopeContext.scope,
  ).filter(
    (decision) =>
      (!normalized.priority || decision.priority === normalized.priority) &&
      matchesSearch(decision, normalized.search),
  );
  const decisionById = new Map(decisions.map((decision) => [decision.id, decision]));
  const assignmentLists = await Promise.all(
    decisions.map((decision) =>
      assignmentLoader({
        assigneeId: normalized.assigneeId,
        decisionId: decision.id,
        projectId: normalized.projectId,
      }),
    ),
  );
  const assignmentsById = new Map<string, DecisionAssignment>();

  for (const assignment of assignmentLists.flat()) {
    const decision = decisionById.get(assignment.decisionId);

    if (decision && assignmentBelongsToDecision(assignment, decision)) {
      assignmentsById.set(assignment.id, assignment);
    }
  }

  const assignments = [...assignmentsById.values()];
  const tasks = dependencies.taskLoader
    ? await dependencies.taskLoader(user)
    : filterTasksForScope(scopeContext.tasks, scopeContext.scope);
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const versionEntries = await Promise.all(
    decisions.map(async (decision) => [
      decision.id,
      await versionLoader(decision.id),
    ] as const),
  );
  const versionsByDecision = new Map(versionEntries);
  const assignmentsByDecision = new Map<string, DecisionAssignment[]>();

  for (const assignment of assignments) {
    const current = assignmentsByDecision.get(assignment.decisionId) ?? [];
    current.push(assignment);
    assignmentsByDecision.set(assignment.decisionId, current);
  }

  const items = decisions
    .map((decision) =>
      buildItem(
        decision,
        assignmentsByDecision.get(decision.id) ?? [],
        versionsByDecision.get(decision.id) ?? [],
        {
          scopeContext,
          taskById,
          user,
        },
      ),
    )
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const selectedDecisionId =
    normalized.selectedDecisionId && decisionById.has(normalized.selectedDecisionId)
      ? normalized.selectedDecisionId
      : items[0]?.decisionId;
  const selectedDecision = selectedDecisionId
    ? decisionById.get(selectedDecisionId)
    : undefined;
  const auditLogs =
    permissions.canViewAudit && selectedDecision
      ? (await (dependencies.auditLogLoader ?? listAuditLogs)({
          entityId: selectedDecision.id,
          entityType: "decision",
        })).filter(
          (audit) =>
            audit.entityType === "decision" &&
            audit.entityId === selectedDecision.id,
        )
      : [];
  const selectedItem = selectedDecision
    ? items.find((item) => item.decisionId === selectedDecision.id)
    : undefined;
  const selectedDetail =
    selectedDecision && selectedItem
      ? buildDetail({
          assignments: assignmentsByDecision.get(selectedDecision.id) ?? [],
          auditLogs,
          decision: selectedDecision,
          item: selectedItem,
          scopeContext,
          taskById,
          user,
          versions: versionsByDecision.get(selectedDecision.id) ?? [],
        })
      : undefined;

  return {
    generatedAt,
    scopeLabel: "Decision & Assignment Center",
    summary: {
      dueSoonAssignments: assignments.filter((assignment) =>
        isAssignmentDueSoon(assignment, generatedAt),
      ).length,
      highPriorityDecisions: decisions.filter((decision) =>
        ["high", "urgent"].includes(decision.priority ?? ""),
      ).length,
      openAssignments: assignments.filter(isAssignmentOpen).length,
      overdueAssignments: assignments.filter((assignment) =>
        isAssignmentOverdue(assignment, generatedAt),
      ).length,
      totalDecisions: decisions.length,
    },
    permissions,
    filters: normalized,
    items,
    selectedDecision: selectedDetail,
  };
}
