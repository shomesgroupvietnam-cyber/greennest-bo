import { can, type PermissionUser } from "@/lib/permissions/can";
import {
  type AccessScope,
  canAccessScopedAction,
  canReadDocumentInScope,
  canReadDecisionInScope,
  canReadMeetingInScope,
  canReadProposalInScope,
  canReadProjectInScope,
  canReadTaskInScope,
  filterDecisionsForScope,
  filterDocumentsForScope,
  filterLegalStepsForScope,
  filterMeetingsForScope,
  filterProposalsForScope,
  filterProjectsForScope,
  filterTasksForScope,
  requiresAssignmentScopeForRole,
  resolveAccessScope,
  usesAssignmentModel
} from "@/lib/permissions/access-scope";
import { getDocument, listDocuments } from "@/modules/documents/services/document-service";
import type { DocumentListFilters } from "@/modules/documents/types";
import { riskRecordRepository, type ExecutiveRiskRecordListFilters, type RiskRecordRepository } from "@/modules/executive/services/risk-record-repository";
import type { ExecutiveRiskRecord } from "@/modules/executive/types";
import { listLegalSteps } from "@/modules/legal/services/legal-service";
import type { LegalStepListFilters } from "@/modules/legal/types";
import { getDecision, getMeeting, listDecisions, listMeetings } from "@/modules/meetings/services/meeting-service";
import type { DecisionListFilters, MeetingListFilters } from "@/modules/meetings/types";
import { getProject, listProjects } from "@/modules/projects/services/project-service";
import type { ProjectListFilters } from "@/modules/projects/types";
import { proposalRepository, type ProposalRepository } from "@/modules/proposals/services/proposal-repository";
import type { ProposalListFilters } from "@/modules/proposals/types";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import { listActiveScopeAssignments } from "@/modules/settings/services/scope-assignment-service";
import { getTask, listTasks } from "@/modules/tasks/services/task-service";
import type { TaskListFilters } from "@/modules/tasks/types";
import { listProjectMemberships } from "@/modules/users/services/user-service";

async function getScopeInputs() {
  const [memberships, tasks, documents, scopeAssignments, rolePermissionCatalog] = await Promise.all([
    listProjectMemberships(),
    listTasks(),
    listDocuments(),
    listActiveScopeAssignments(),
    listRolePermissionCatalog(),
  ]);

  return {
    memberships,
    tasks,
    documents,
    rolePermissionCatalog,
    scopeAssignments,
  };
}

function resolveScopedResourceScope(
  user: PermissionUser,
  inputs: Awaited<ReturnType<typeof getScopeInputs>>,
) {
  return resolveAccessScope(user, {
    ...inputs,
    requireScopeAssignments: requiresAssignmentScopeForRole(user.role),
  });
}

export async function listScopedProjects(user: PermissionUser, filters: ProjectListFilters = {}) {
  const [projects, inputs] = await Promise.all([listProjects(filters), getScopeInputs()]);
  const scope = resolveScopedResourceScope(user, inputs);

  return filterProjectsForScope(projects, scope);
}

export async function getScopedProject(user: PermissionUser, projectId: string) {
  const [project, inputs] = await Promise.all([getProject(projectId), getScopeInputs()]);

  if (!project) {
    return undefined;
  }

  return canReadProjectInScope(project, resolveScopedResourceScope(user, inputs)) ? project : undefined;
}

export async function listScopedTasks(user: PermissionUser, filters: TaskListFilters = {}) {
  const [tasks, inputs] = await Promise.all([listTasks(filters), getScopeInputs()]);
  const scope = resolveScopedResourceScope(user, inputs);

  return filterTasksForScope(tasks, scope);
}

export async function getScopedTask(user: PermissionUser, taskId: string) {
  const [task, inputs] = await Promise.all([getTask(taskId), getScopeInputs()]);

  if (!task) {
    return undefined;
  }

  return canReadTaskInScope(task, resolveScopedResourceScope(user, inputs)) ? task : undefined;
}

export async function listScopedDocuments(user: PermissionUser, filters: DocumentListFilters = {}) {
  const [documents, inputs] = await Promise.all([listDocuments(filters), getScopeInputs()]);
  const scope = resolveScopedResourceScope(user, inputs);

  return filterDocumentsForScope(documents, scope);
}

export async function getScopedDocument(user: PermissionUser, documentId: string) {
  const [document, inputs] = await Promise.all([getDocument(documentId), getScopeInputs()]);

  if (!document) {
    return undefined;
  }

  return canReadDocumentInScope(document, resolveScopedResourceScope(user, inputs)) ? document : undefined;
}

export async function listScopedLegalSteps(user: PermissionUser, filters: LegalStepListFilters = {}) {
  const [steps, inputs] = await Promise.all([listLegalSteps(filters), getScopeInputs()]);
  const scope = resolveScopedResourceScope(user, inputs);

  return filterLegalStepsForScope(steps, scope);
}

export async function listScopedProposals(
  user: PermissionUser,
  filters: ProposalListFilters = {},
  repository: ProposalRepository = proposalRepository,
) {
  const [proposals, inputs] = await Promise.all([
    repository.listProposals(filters),
    getScopeInputs(),
  ]);
  const scope = resolveScopedResourceScope(user, inputs);

  return filterProposalsForScope(proposals, scope);
}

export async function getScopedProposal(
  user: PermissionUser,
  proposalId: string,
  repository: ProposalRepository = proposalRepository,
) {
  const [detail, inputs] = await Promise.all([
    repository.getProposalDetail(proposalId),
    getScopeInputs(),
  ]);

  if (!detail) {
    return undefined;
  }

  return canReadProposalInScope(detail.proposal, resolveScopedResourceScope(user, inputs))
    ? detail
    : undefined;
}

export async function listScopedMeetings(user: PermissionUser, filters: MeetingListFilters = {}) {
  const [meetings, inputs] = await Promise.all([listMeetings(filters), getScopeInputs()]);
  const scope = resolveScopedResourceScope(user, inputs);

  return filterMeetingsForScope(meetings, scope);
}

export async function getScopedMeeting(user: PermissionUser, meetingId: string) {
  const [meeting, inputs] = await Promise.all([getMeeting(meetingId), getScopeInputs()]);

  if (!meeting) {
    return undefined;
  }

  return canReadMeetingInScope(meeting, resolveScopedResourceScope(user, inputs)) ? meeting : undefined;
}

function canReadRiskRecordInScope(
  record: Pick<ExecutiveRiskRecord, "createdBy" | "id" | "moduleId" | "organizationId" | "ownerId" | "projectId">,
  scope: AccessScope,
) {
  const user = { id: scope.userId, role: scope.role };

  if (usesAssignmentModel(scope)) {
    return canAccessScopedAction(
      user,
      "risk.view",
      {
        moduleId: record.moduleId ?? "risk",
        organizationId: record.organizationId,
        projectId: record.projectId,
        recordId: record.id,
      },
      {
        now: scope.evaluatedAt,
        rolePermissionCatalog: scope.rolePermissionCatalog,
        scopeAssignments: scope.scopeAssignments,
      },
    );
  }

  if (!can(user, "risk.view")) {
    return false;
  }

  if (scope.kind === "internal_full") {
    return true;
  }

  if (record.ownerId === scope.userId || record.createdBy === scope.userId) {
    return true;
  }

  return record.projectId ? scope.assignedProjectIds.has(record.projectId) : false;
}

export async function listScopedExecutiveRiskRecords(
  user: PermissionUser,
  filters: ExecutiveRiskRecordListFilters = {},
  repository: RiskRecordRepository = riskRecordRepository,
) {
  const [records, inputs] = await Promise.all([repository.listRiskRecords(filters), getScopeInputs()]);
  const scope = resolveScopedResourceScope(user, inputs);

  return records.filter((record) => canReadRiskRecordInScope(record, scope));
}

export async function getScopedExecutiveRiskRecord(
  user: PermissionUser,
  riskId: string,
  repository: RiskRecordRepository = riskRecordRepository,
) {
  const [record, inputs] = await Promise.all([repository.getRiskRecord(riskId), getScopeInputs()]);

  if (!record) {
    return undefined;
  }

  return canReadRiskRecordInScope(record, resolveScopedResourceScope(user, inputs)) ? record : undefined;
}

function normalizeScopeValue(value?: string) {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
}

export async function canCreateProjectMeeting(
  user: PermissionUser,
  target: { organizationId?: string; projectId: string; axisId?: string; departmentId?: string },
) {
  if (!requiresAssignmentScopeForRole(user.role)) {
    return true;
  }

  const inputs = await getScopeInputs();

  return canAccessScopedAction(
    user,
    "meeting.create",
    {
      organizationId: normalizeScopeValue(target.organizationId),
      projectId: target.projectId,
      axisId: normalizeScopeValue(target.axisId),
      workstreamId: normalizeScopeValue(target.departmentId) ?? "meeting",
      moduleId: "meeting",
    },
    {
      rolePermissionCatalog: inputs.rolePermissionCatalog,
      scopeAssignments: inputs.scopeAssignments,
    },
  );
}

export async function canCreateOrganizationMeeting(
  user: PermissionUser,
  target: { organizationId?: string; axisId?: string; departmentId?: string } = {},
) {
  const organizationId = normalizeScopeValue(target.organizationId);

  if (!organizationId) {
    return false;
  }

  if (!requiresAssignmentScopeForRole(user.role)) {
    return true;
  }

  const inputs = await getScopeInputs();

  return canAccessScopedAction(
    user,
    "meeting.create",
    {
      organizationId,
      axisId: normalizeScopeValue(target.axisId),
      workstreamId: normalizeScopeValue(target.departmentId) ?? "meeting",
      moduleId: "meeting",
    },
    {
      rolePermissionCatalog: inputs.rolePermissionCatalog,
      scopeAssignments: inputs.scopeAssignments,
    },
  );
}

export async function listScopedDecisions(user: PermissionUser, filters: DecisionListFilters = {}) {
  const [decisions, inputs] = await Promise.all([listDecisions(filters), getScopeInputs()]);
  const scope = resolveScopedResourceScope(user, inputs);

  return filterDecisionsForScope(decisions, scope);
}

export async function getScopedDecision(user: PermissionUser, decisionId: string) {
  const [decision, inputs] = await Promise.all([getDecision(decisionId), getScopeInputs()]);

  if (!decision) {
    return undefined;
  }

  return canReadDecisionInScope(decision, resolveScopedResourceScope(user, inputs)) ? decision : undefined;
}
