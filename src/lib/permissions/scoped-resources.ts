import type { PermissionUser } from "@/lib/permissions/can";
import {
  canReadDocumentInScope,
  canReadDecisionInScope,
  canReadMeetingInScope,
  canReadProjectInScope,
  canReadTaskInScope,
  filterDecisionsForScope,
  filterDocumentsForScope,
  filterLegalStepsForScope,
  filterMeetingsForScope,
  filterProjectsForScope,
  filterTasksForScope,
  resolveAccessScope
} from "@/lib/permissions/access-scope";
import { getDocument, listDocuments } from "@/modules/documents/services/document-service";
import type { DocumentListFilters } from "@/modules/documents/types";
import { listLegalSteps } from "@/modules/legal/services/legal-service";
import type { LegalStepListFilters } from "@/modules/legal/types";
import { getDecision, getMeeting, listDecisions, listMeetings } from "@/modules/meetings/services/meeting-service";
import type { DecisionListFilters, MeetingListFilters } from "@/modules/meetings/types";
import { getProject, listProjects } from "@/modules/projects/services/project-service";
import type { ProjectListFilters } from "@/modules/projects/types";
import { getTask, listTasks } from "@/modules/tasks/services/task-service";
import type { TaskListFilters } from "@/modules/tasks/types";
import { listProjectMemberships } from "@/modules/users/services/user-service";

async function getScopeInputs() {
  const [memberships, tasks, documents] = await Promise.all([listProjectMemberships(), listTasks(), listDocuments()]);

  return { memberships, tasks, documents };
}

export async function listScopedProjects(user: PermissionUser, filters: ProjectListFilters = {}) {
  const [projects, inputs] = await Promise.all([listProjects(filters), getScopeInputs()]);
  const scope = resolveAccessScope(user, inputs);

  return filterProjectsForScope(projects, scope);
}

export async function getScopedProject(user: PermissionUser, projectId: string) {
  const [project, inputs] = await Promise.all([getProject(projectId), getScopeInputs()]);

  if (!project) {
    return undefined;
  }

  return canReadProjectInScope(project, resolveAccessScope(user, inputs)) ? project : undefined;
}

export async function listScopedTasks(user: PermissionUser, filters: TaskListFilters = {}) {
  const [tasks, inputs] = await Promise.all([listTasks(filters), getScopeInputs()]);
  const scope = resolveAccessScope(user, inputs);

  return filterTasksForScope(tasks, scope);
}

export async function getScopedTask(user: PermissionUser, taskId: string) {
  const [task, inputs] = await Promise.all([getTask(taskId), getScopeInputs()]);

  if (!task) {
    return undefined;
  }

  return canReadTaskInScope(task, resolveAccessScope(user, inputs)) ? task : undefined;
}

export async function listScopedDocuments(user: PermissionUser, filters: DocumentListFilters = {}) {
  const [documents, inputs] = await Promise.all([listDocuments(filters), getScopeInputs()]);
  const scope = resolveAccessScope(user, inputs);

  return filterDocumentsForScope(documents, scope);
}

export async function getScopedDocument(user: PermissionUser, documentId: string) {
  const [document, inputs] = await Promise.all([getDocument(documentId), getScopeInputs()]);

  if (!document) {
    return undefined;
  }

  return canReadDocumentInScope(document, resolveAccessScope(user, inputs)) ? document : undefined;
}

export async function listScopedLegalSteps(user: PermissionUser, filters: LegalStepListFilters = {}) {
  const [steps, inputs] = await Promise.all([listLegalSteps(filters), getScopeInputs()]);
  const scope = resolveAccessScope(user, inputs);

  return filterLegalStepsForScope(steps, scope);
}

export async function listScopedMeetings(user: PermissionUser, filters: MeetingListFilters = {}) {
  const [meetings, inputs] = await Promise.all([listMeetings(filters), getScopeInputs()]);
  const scope = resolveAccessScope(user, inputs);

  return filterMeetingsForScope(meetings, scope);
}

export async function getScopedMeeting(user: PermissionUser, meetingId: string) {
  const [meeting, inputs] = await Promise.all([getMeeting(meetingId), getScopeInputs()]);

  if (!meeting) {
    return undefined;
  }

  return canReadMeetingInScope(meeting, resolveAccessScope(user, inputs)) ? meeting : undefined;
}

export async function listScopedDecisions(user: PermissionUser, filters: DecisionListFilters = {}) {
  const [decisions, inputs] = await Promise.all([listDecisions(filters), getScopeInputs()]);
  const scope = resolveAccessScope(user, inputs);

  return filterDecisionsForScope(decisions, scope);
}

export async function getScopedDecision(user: PermissionUser, decisionId: string) {
  const [decision, inputs] = await Promise.all([getDecision(decisionId), getScopeInputs()]);

  if (!decision) {
    return undefined;
  }

  return canReadDecisionInScope(decision, resolveAccessScope(user, inputs)) ? decision : undefined;
}
