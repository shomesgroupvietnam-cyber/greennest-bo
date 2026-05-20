import type { Role } from "@/constants/roles";
import type { Document } from "@/modules/documents/types";
import type { LegalStep } from "@/modules/legal/types";
import type { Decision, Meeting } from "@/modules/meetings/types";
import type { Project } from "@/modules/projects/types";
import type { Task } from "@/modules/tasks/types";
import type { ProjectMembership } from "@/modules/users/types";

import type { PermissionUser } from "./can";

export type AccessScopeKind = "internal_full" | "internal_assigned" | "external_limited" | "read_only_allowed";

export type AccessScopeInput = {
  memberships?: ProjectMembership[];
  tasks?: Task[];
  documents?: Document[];
};

export type AccessScope = {
  kind: AccessScopeKind;
  userId: string;
  role: Role;
  assignedProjectIds: Set<string>;
  assignedTaskIds: Set<string>;
  assignedDocumentIds: Set<string>;
};

const externalRoles: Role[] = ["nha_thau", "tu_van"];
const internalAssignedRoles: Role[] = [
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
  "thu_ky_tro_ly"
];

export function isExternalRole(role: Role) {
  return externalRoles.includes(role);
}

function resolveScopeKind(role: Role): AccessScopeKind {
  if (isExternalRole(role)) {
    return "external_limited";
  }

  if (role === "viewer") {
    return "read_only_allowed";
  }

  if (internalAssignedRoles.includes(role)) {
    return "internal_assigned";
  }

  return "internal_full";
}

export function resolveAccessScope(user: PermissionUser, input: AccessScopeInput = {}): AccessScope {
  const memberships = input.memberships ?? [];
  const tasks = input.tasks ?? [];
  const documents = input.documents ?? [];
  const assignedProjectIds = new Set<string>();
  const assignedTaskIds = new Set<string>();
  const assignedDocumentIds = new Set<string>();

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

  return {
    kind: resolveScopeKind(user.role),
    userId: user.id,
    role: user.role,
    assignedProjectIds,
    assignedTaskIds,
    assignedDocumentIds
  };
}

function hasLimitedScope(scope: AccessScope) {
  return scope.kind === "external_limited" || scope.kind === "read_only_allowed";
}

export function canReadProjectInScope(project: Pick<Project, "id">, scope: AccessScope) {
  if (!hasLimitedScope(scope)) {
    return true;
  }

  return scope.assignedProjectIds.has(project.id);
}

export function canReadTaskInScope(task: Pick<Task, "id" | "projectId" | "assigneeId">, scope: AccessScope) {
  if (!hasLimitedScope(scope)) {
    return true;
  }

  if (scope.kind === "external_limited") {
    return task.assigneeId === scope.userId;
  }

  return scope.assignedProjectIds.has(task.projectId);
}

export function canReadDocumentInScope(document: Pick<Document, "id" | "projectId" | "ownerId">, scope: AccessScope) {
  if (!hasLimitedScope(scope)) {
    return true;
  }

  if (scope.kind === "external_limited") {
    return document.ownerId === scope.userId;
  }

  return scope.assignedProjectIds.has(document.projectId);
}

export function canReadLegalStepInScope(step: Pick<LegalStep, "projectId">, scope: AccessScope) {
  if (!hasLimitedScope(scope)) {
    return true;
  }

  if (scope.role === "nha_thau") {
    return false;
  }

  return scope.assignedProjectIds.has(step.projectId);
}

export function canReadMeetingInScope(meeting: Pick<Meeting, "projectId">, scope: AccessScope) {
  if (!hasLimitedScope(scope)) {
    return true;
  }

  return scope.assignedProjectIds.has(meeting.projectId);
}

export function canReadDecisionInScope(decision: Pick<Decision, "projectId">, scope: AccessScope) {
  return canReadMeetingInScope(decision, scope);
}

export function filterProjectsForScope(projects: Project[], scope: AccessScope) {
  return projects.filter((project) => canReadProjectInScope(project, scope));
}

export function filterTasksForScope(tasks: Task[], scope: AccessScope) {
  return tasks.filter((task) => canReadTaskInScope(task, scope));
}

export function filterDocumentsForScope(documents: Document[], scope: AccessScope) {
  return documents.filter((document) => canReadDocumentInScope(document, scope));
}

export function filterLegalStepsForScope(steps: LegalStep[], scope: AccessScope) {
  return steps.filter((step) => canReadLegalStepInScope(step, scope));
}

export function filterMeetingsForScope(meetings: Meeting[], scope: AccessScope) {
  return meetings.filter((meeting) => canReadMeetingInScope(meeting, scope));
}

export function filterDecisionsForScope(decisions: Decision[], scope: AccessScope) {
  return decisions.filter((decision) => canReadDecisionInScope(decision, scope));
}
