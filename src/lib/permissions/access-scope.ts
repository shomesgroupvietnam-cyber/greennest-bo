import type { Document } from "@/modules/documents/types";
import type { LegalStep } from "@/modules/legal/types";
import type { Decision, Meeting } from "@/modules/meetings/types";
import type { Project } from "@/modules/projects/types";
import type { Proposal } from "@/modules/proposals/types";
import type {
  RolePermissionCatalog,
  ScopeAssignment,
  ScopeDimension,
} from "@/modules/settings/types";
import type { Task } from "@/modules/tasks/types";
import type { ProjectMembership } from "@/modules/users/types";

import { can, type PermissionAction, type PermissionUser } from "./can";

export type AccessScopeKind =
  | "internal_full"
  | "internal_assigned"
  | "external_limited"
  | "read_only_allowed";

export type AccessScopeInput = {
  memberships?: ProjectMembership[];
  tasks?: Task[];
  documents?: Document[];
  scopeAssignments?: ScopeAssignment[];
  rolePermissionCatalog?: RolePermissionCatalog;
  requireScopeAssignments?: boolean;
};

export type AccessScope = {
  kind: AccessScopeKind;
  userId: string;
  role: string;
  assignedProjectIds: Set<string>;
  assignedTaskIds: Set<string>;
  assignedDocumentIds: Set<string>;
  scopeAssignments: ScopeAssignment[];
  rolePermissionCatalog?: RolePermissionCatalog;
  scopeAssignmentsRequired: boolean;
  evaluatedAt: Date;
};

const externalRoles: string[] = ["nha_thau", "tu_van"];
const internalAssignedRoles: string[] = [
  "pho_tong_giam_doc",
  "giam_doc_du_an",
  "quan_ly_du_an",
  "to_truong",
  "phap_ly",
  "ke_toan",
  "thiet_ke",
  "ky_thuat",
  "thi_cong",
  "mua_hang",
  "thu_ky_tro_ly",
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

export function isExternalRole(role: string) {
  return externalRoles.includes(role);
}

export function requiresAssignmentScopeForRole(role: string) {
  return internalAssignedRoles.includes(role);
}

function resolveScopeKind(role: string): AccessScopeKind {
  if (isExternalRole(role)) {
    return "external_limited";
  }

  if (role === "viewer" || role === "pending") {
    return "read_only_allowed";
  }

  if (internalAssignedRoles.includes(role)) {
    return "internal_assigned";
  }

  return "internal_full";
}

export function resolveAccessScope(
  user: PermissionUser,
  input: AccessScopeInput = {},
): AccessScope {
  const memberships = input.memberships ?? [];
  const tasks = input.tasks ?? [];
  const documents = input.documents ?? [];
  const assignedProjectIds = new Set<string>();
  const assignedTaskIds = new Set<string>();
  const assignedDocumentIds = new Set<string>();
  const evaluatedAt = new Date();
  const scopeAssignmentsRequired =
    input.requireScopeAssignments ?? input.scopeAssignments !== undefined;
  const scopeAssignments = activeAssignmentsForUser(
    input.scopeAssignments ?? [],
    user.id,
    evaluatedAt,
  );

  for (const membership of memberships) {
    if (membership.userId === user.id) {
      assignedProjectIds.add(membership.projectId);
    }
  }

  for (const task of tasks) {
    if (task.assigneeId === user.id) {
      assignedTaskIds.add(task.id);
      assignedProjectIds.add(task.projectId);
    }
  }

  for (const document of documents) {
    if (document.ownerId === user.id) {
      assignedDocumentIds.add(document.id);
      assignedProjectIds.add(document.projectId);
    }
  }

  for (const assignment of scopeAssignments) {
    if (assignment.projectId && assignment.projectId !== "*") {
      assignedProjectIds.add(assignment.projectId);
    }

    if (assignment.recordId && assignment.recordId !== "*") {
      assignedTaskIds.add(assignment.recordId);
      assignedDocumentIds.add(assignment.recordId);
    }
  }

  return {
    kind: resolveScopeKind(user.role),
    userId: user.id,
    role: user.role,
    assignedProjectIds,
    assignedTaskIds,
    assignedDocumentIds,
    scopeAssignments,
    rolePermissionCatalog: input.rolePermissionCatalog,
    scopeAssignmentsRequired,
    evaluatedAt,
  };
}

function hasLimitedScope(scope: AccessScope) {
  if (usesAssignmentModel(scope)) {
    return true;
  }

  return (
    scope.kind === "external_limited" || scope.kind === "read_only_allowed"
  );
}

export function usesAssignmentModel(scope: AccessScope) {
  if (scope.scopeAssignments.length > 0) {
    return true;
  }

  if (!scope.scopeAssignmentsRequired) {
    return false;
  }

  return (
    scope.kind !== "external_limited" &&
    scope.kind !== "read_only_allowed"
  );
}

function assignmentIsActive(assignment: ScopeAssignment, now: Date) {
  if (!assignment.active) {
    return false;
  }

  const nowMs = now.getTime();

  if (assignment.startsAt && new Date(assignment.startsAt).getTime() > nowMs) {
    return false;
  }

  if (assignment.endsAt && new Date(assignment.endsAt).getTime() < nowMs) {
    return false;
  }

  return true;
}

function activeAssignmentsForUser(
  assignments: ScopeAssignment[],
  userId: string,
  now: Date,
) {
  return assignments.filter(
    (assignment) =>
      assignment.userId === userId && assignmentIsActive(assignment, now),
  );
}

function assignmentHasAnyDimension(assignment: ScopeAssignment) {
  return scopeDimensionKeys.some((key) => Boolean(assignment[key]));
}

function normalizeDimensionValue(
  key: (typeof scopeDimensionKeys)[number],
  value: string,
) {
  if (key === "axisId") {
    return axisAliases.get(value) ?? value;
  }

  return value;
}

function dimensionMatches(
  key: (typeof scopeDimensionKeys)[number],
  expected: string | undefined,
  actual: string | undefined,
) {
  if (!expected) {
    return true;
  }

  if (!actual) {
    return false;
  }

  if (expected === "*") {
    return true;
  }

  return normalizeDimensionValue(key, expected) === normalizeDimensionValue(key, actual);
}

function assignmentMatchesTarget(assignment: ScopeAssignment, target: ScopeDimension) {
  if (assignment.scopeType === "global") {
    return !assignmentHasAnyDimension(assignment);
  }

  if (!assignmentHasAnyDimension(assignment)) {
    return false;
  }

  return scopeDimensionKeys.every((key) =>
    dimensionMatches(key, assignment[key], target[key]),
  );
}

function assignmentGrantsAction(
  user: PermissionUser,
  assignment: ScopeAssignment,
  action: PermissionAction,
  rolePermissionCatalog?: RolePermissionCatalog,
) {
  const assignmentGrants = can(
    {
      id: user.id,
      role: assignment.roleKey,
      permissions: assignment.permissionKeys,
      permissionsMode: "replace",
      roleActive: user.roleActive,
    },
    action,
  );

  if (!assignmentGrants) {
    return false;
  }

  if (rolePermissionCatalog) {
    const role = rolePermissionCatalog.roles.find(
      (item) => item.key === assignment.roleKey,
    );

    return Boolean(
      role?.active &&
        can(
          {
            id: user.id,
            role: String(role.key),
            permissions: role.permissionKeys,
            permissionsMode: "replace",
            roleActive: user.roleActive,
          },
          action,
        ),
    );
  }

  return can({ id: user.id, role: assignment.roleKey, roleActive: user.roleActive }, action);
}

export function canAccessScopedAction(
  user: PermissionUser,
  action: PermissionAction,
  target: ScopeDimension,
  input: {
    scopeAssignments?: ScopeAssignment[];
    rolePermissionCatalog?: RolePermissionCatalog;
    now?: Date;
  } = {},
) {
  const now = input.now ?? new Date();
  const assignments = activeAssignmentsForUser(
    input.scopeAssignments ?? [],
    user.id,
    now,
  );

  return assignments.some(
    (assignment) =>
      assignmentMatchesTarget(assignment, target) &&
      assignmentGrantsAction(
        user,
        assignment,
        action,
        input.rolePermissionCatalog,
      ),
  );
}

export function hasAnyScopedActionGrant(
  user: PermissionUser,
  action: PermissionAction,
  input: {
    scopeAssignments?: ScopeAssignment[];
    rolePermissionCatalog?: RolePermissionCatalog;
    now?: Date;
  } = {},
) {
  const now = input.now ?? new Date();
  const assignments = activeAssignmentsForUser(
    input.scopeAssignments ?? [],
    user.id,
    now,
  );

  return assignments.some((assignment) =>
    assignmentGrantsAction(
      user,
      assignment,
      action,
      input.rolePermissionCatalog,
    ),
  );
}

function canAccessActionInResolvedScope(
  scope: AccessScope,
  action: PermissionAction,
  target: ScopeDimension,
) {
  return canAccessScopedAction(
    { id: scope.userId, role: scope.role },
    action,
    target,
    {
      now: scope.evaluatedAt,
      rolePermissionCatalog: scope.rolePermissionCatalog,
      scopeAssignments: scope.scopeAssignments,
    },
  );
}

function moduleTarget(moduleId: string, target: ScopeDimension = {}): ScopeDimension {
  return {
    axisId: "project_management",
    workstreamId: moduleId,
    moduleId,
    ...target,
  };
}

export function canReadProjectInScope(
  project: Pick<Project, "id">,
  scope: AccessScope,
) {
  if (usesAssignmentModel(scope)) {
    return canAccessActionInResolvedScope(scope, "project.view", moduleTarget("project", {
      projectId: project.id,
      recordId: project.id,
    }));
  }

  if (!hasLimitedScope(scope)) {
    return true;
  }

  return scope.assignedProjectIds.has(project.id);
}

export function canReadTaskInScope(
  task: Pick<Task, "id" | "projectId" | "assigneeId">,
  scope: AccessScope,
) {
  if (usesAssignmentModel(scope)) {
    return canAccessActionInResolvedScope(scope, "task.view", moduleTarget("task", {
      projectId: task.projectId,
      recordId: task.id,
    }));
  }

  if (!hasLimitedScope(scope)) {
    return true;
  }

  if (scope.kind === "external_limited") {
    return task.assigneeId === scope.userId;
  }

  return scope.assignedProjectIds.has(task.projectId);
}

export function canReadDocumentInScope(
  document: Pick<Document, "id" | "projectId" | "ownerId">,
  scope: AccessScope,
) {
  if (usesAssignmentModel(scope)) {
    return canAccessActionInResolvedScope(scope, "document.view", moduleTarget("document", {
      projectId: document.projectId,
      recordId: document.id,
    }));
  }

  if (!hasLimitedScope(scope)) {
    return true;
  }

  if (scope.kind === "external_limited") {
    return document.ownerId === scope.userId;
  }

  return scope.assignedProjectIds.has(document.projectId);
}

export function canReadLegalStepInScope(
  step: Pick<LegalStep, "projectId">,
  scope: AccessScope,
) {
  if (usesAssignmentModel(scope)) {
    return canAccessActionInResolvedScope(scope, "legal.view", moduleTarget("legal", {
      projectId: step.projectId,
    }));
  }

  if (!hasLimitedScope(scope)) {
    return true;
  }

  if (scope.role === "nha_thau") {
    return false;
  }

  return scope.assignedProjectIds.has(step.projectId);
}

export function canReadProposalInScope(
  proposal: Pick<
    Proposal,
    "id" | "projectId" | "ownerId" | "requestedBy" | "submittedBy"
  >,
  scope: AccessScope,
) {
  if (usesAssignmentModel(scope)) {
    return canAccessActionInResolvedScope(scope, "proposal.view", moduleTarget("proposal", {
      projectId: proposal.projectId,
      recordId: proposal.id,
    }));
  }

  if (!hasLimitedScope(scope)) {
    return true;
  }

  if (
    proposal.ownerId === scope.userId ||
    proposal.requestedBy === scope.userId ||
    proposal.submittedBy === scope.userId
  ) {
    return true;
  }

  return proposal.projectId ? scope.assignedProjectIds.has(proposal.projectId) : false;
}

export function canReadMeetingInScope(
  meeting: Pick<
    Meeting,
    | "id"
    | "organizationId"
    | "projectId"
    | "projectIds"
    | "axisId"
    | "departmentId"
    | "hostId"
    | "participants"
    | "createdBy"
  >,
  scope: AccessScope,
) {
  if (meeting.hostId === scope.userId || meeting.createdBy === scope.userId || meeting.participants?.includes(scope.userId)) {
    return true;
  }

  if (usesAssignmentModel(scope)) {
    const projectIds = [
      meeting.projectId,
      ...(meeting.projectIds ?? []),
    ].filter((projectId): projectId is string => Boolean(projectId));

    if (projectIds.length === 0) {
      return canAccessActionInResolvedScope(
        scope,
        "meeting.view",
        moduleTarget("meeting", {
          organizationId: meeting.organizationId,
          axisId: meeting.axisId,
          workstreamId: meeting.departmentId ?? "meeting",
          recordId: meeting.id,
        }),
      );
    }

    return projectIds.some((projectId) =>
      canAccessActionInResolvedScope(
        scope,
        "meeting.view",
        moduleTarget("meeting", {
          organizationId: meeting.organizationId,
          projectId,
          axisId: meeting.axisId,
          workstreamId: meeting.departmentId ?? "meeting",
          recordId: meeting.id,
        }),
      ),
    );
  }

  if (!hasLimitedScope(scope)) {
    return true;
  }

  if (meeting.projectId && scope.assignedProjectIds.has(meeting.projectId)) {
    return true;
  }

  return meeting.projectIds?.some((projectId) => scope.assignedProjectIds.has(projectId)) ?? false;
}

export function canReadDecisionInScope(
  decision: Pick<
    Decision,
    | "id"
    | "organizationId"
    | "projectId"
    | "projectIds"
    | "axisId"
    | "workstreamId"
    | "moduleId"
    | "ownerId"
    | "createdBy"
    | "decidedBy"
  >,
  scope: AccessScope,
) {
  const projectIds = [
    decision.projectId,
    ...(decision.projectIds ?? []),
  ].filter((projectId): projectId is string => Boolean(projectId));
  const uniqueProjectIds = [...new Set(projectIds)];

  if (usesAssignmentModel(scope)) {
    const targets =
      uniqueProjectIds.length > 0
        ? uniqueProjectIds.map((projectId) =>
            moduleTarget("meeting", {
              organizationId: decision.organizationId,
              projectId,
              axisId: decision.axisId,
              workstreamId: decision.workstreamId ?? "decision",
              moduleId: decision.moduleId ?? "meeting",
              recordId: decision.id,
            }),
          )
        : [
            moduleTarget("meeting", {
              organizationId: decision.organizationId,
              axisId: decision.axisId,
              workstreamId: decision.workstreamId ?? "decision",
              moduleId: decision.moduleId ?? "meeting",
              recordId: decision.id,
            }),
          ];

    return targets.some(
      (target) =>
        canAccessActionInResolvedScope(scope, "decision.approve", target) ||
        canAccessActionInResolvedScope(scope, "meeting.view", target),
    );
  }

  if (!hasLimitedScope(scope)) {
    return true;
  }

  if (
    decision.ownerId === scope.userId ||
    decision.createdBy === scope.userId ||
    decision.decidedBy === scope.userId
  ) {
    return true;
  }

  return uniqueProjectIds.some((projectId) =>
    scope.assignedProjectIds.has(projectId),
  );
}

export function filterProjectsForScope(
  projects: Project[],
  scope: AccessScope,
) {
  return projects.filter((project) => canReadProjectInScope(project, scope));
}

export function filterTasksForScope(tasks: Task[], scope: AccessScope) {
  return tasks.filter((task) => canReadTaskInScope(task, scope));
}

export function filterDocumentsForScope(
  documents: Document[],
  scope: AccessScope,
) {
  return documents.filter((document) =>
    canReadDocumentInScope(document, scope),
  );
}

export function filterLegalStepsForScope(
  steps: LegalStep[],
  scope: AccessScope,
) {
  return steps.filter((step) => canReadLegalStepInScope(step, scope));
}

export function filterProposalsForScope(
  proposals: Proposal[],
  scope: AccessScope,
) {
  return proposals.filter((proposal) => canReadProposalInScope(proposal, scope));
}

export function filterMeetingsForScope(
  meetings: Meeting[],
  scope: AccessScope,
) {
  return meetings.filter((meeting) => canReadMeetingInScope(meeting, scope));
}

export function filterDecisionsForScope(
  decisions: Decision[],
  scope: AccessScope,
) {
  return decisions.filter((decision) =>
    canReadDecisionInScope(decision, scope),
  );
}
