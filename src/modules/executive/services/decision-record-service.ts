import { can, type PermissionUser } from "@/lib/permissions/can";
import {
  canAccessScopedAction,
  requiresAssignmentScopeForRole
} from "@/lib/permissions/access-scope";
import {
  getScopedMeeting as defaultGetScopedMeeting,
  getScopedProject as defaultGetScopedProject,
  getScopedProposal as defaultGetScopedProposal
} from "@/lib/permissions/scoped-resources";
import { createAuditLog } from "@/modules/users/services/user-service";
import { userRepository, type UserRepository } from "@/modules/users/services/user-repository";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import { listActiveScopeAssignments } from "@/modules/settings/services/scope-assignment-service";
import type { ProposalDetail } from "@/modules/proposals/types";
import type {
  CreateDecisionRecordInput,
  Decision,
  DecisionLinkedRecord,
  DecisionScopeInput,
  DecisionSourceType,
  Meeting
} from "@/modules/meetings/types";
import { createDecisionRecordInputSchema } from "@/modules/meetings/validation";
import { meetingRepository, type MeetingRepository } from "@/modules/meetings/services/meeting-repository";
import type { Project } from "@/modules/projects/types";
import type { AuditLog } from "@/modules/users/types";

type AuditWriter = (input: Omit<AuditLog, "id" | "createdAt">) => Promise<unknown>;
type ScopePermissionChecker = (actor: PermissionUser, scope: DecisionScopeInput) => Promise<boolean>;

export type DecisionRecordServiceDependencies = {
  repository?: MeetingRepository;
  userRepository?: Pick<UserRepository, "listProjectMemberships">;
  getScopedMeeting?: (actor: PermissionUser, meetingId: string) => Promise<Meeting | undefined>;
  getScopedProposal?: (actor: PermissionUser, proposalId: string) => Promise<ProposalDetail | undefined>;
  getScopedProject?: (actor: PermissionUser, projectId: string) => Promise<Project | undefined>;
  canCreateDecisionInScope?: ScopePermissionChecker;
  auditWriter?: AuditWriter;
  idGenerator?: () => string;
  now?: () => string;
};

type SourceResolution = {
  scope: DecisionScopeInput;
  meetingId?: string;
  linkedRecord?: DecisionLinkedRecord;
};

function createId() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

function compactText(value: string, maxLength = 120) {
  const normalized = value.trim().replace(/\s+/g, " ");

  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
}

function unique(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function projectIdsForScope(scope: DecisionScopeInput) {
  return unique([scope.projectId, ...(scope.projectIds ?? [])]);
}

function normalizeScope(scope: DecisionScopeInput = {}): DecisionScopeInput {
  const projectIds = projectIdsForScope(scope);

  return {
    organizationId: scope.organizationId,
    projectId: scope.projectId ?? projectIds[0],
    projectIds,
    axisId: scope.axisId,
    workstreamId: scope.workstreamId,
    moduleId: scope.moduleId
  };
}

function hasAnyScope(scope: DecisionScopeInput) {
  return Boolean(
    scope.organizationId ||
      scope.projectId ||
      scope.projectIds?.length ||
      scope.axisId ||
      scope.workstreamId ||
      scope.moduleId
  );
}

function scopeFromInput(input: ReturnType<typeof createDecisionRecordInputSchema.parse>) {
  return normalizeScope({
    organizationId: input.scope?.organizationId ?? input.organizationId,
    projectId: input.scope?.projectId ?? input.projectId,
    projectIds: input.scope?.projectIds?.length ? input.scope.projectIds : input.projectIds,
    axisId: input.scope?.axisId ?? input.axisId,
    workstreamId: input.scope?.workstreamId ?? input.workstreamId,
    moduleId: input.scope?.moduleId ?? input.moduleId
  });
}

function assertCompatibleScope(sourceScope: DecisionScopeInput, requestedScope: DecisionScopeInput) {
  const sourceProjectIds = projectIdsForScope(sourceScope);
  const requestedProjectIds = projectIdsForScope(requestedScope);

  if (
    sourceProjectIds.length > 0 &&
    requestedProjectIds.length > 0 &&
    requestedProjectIds.some((projectId) => !sourceProjectIds.includes(projectId))
  ) {
    throw new Error("Pham vi decision khong khop voi nguon da chon.");
  }

  if (
    sourceScope.organizationId &&
    requestedScope.organizationId &&
    sourceScope.organizationId !== requestedScope.organizationId
  ) {
    throw new Error("Pham vi decision khong khop voi nguon da chon.");
  }

  if (sourceScope.axisId && requestedScope.axisId && sourceScope.axisId !== requestedScope.axisId) {
    throw new Error("Pham vi decision khong khop voi nguon da chon.");
  }
}

function mergeSourceAndRequestedScope(sourceScope: DecisionScopeInput, requestedScope: DecisionScopeInput) {
  assertCompatibleScope(sourceScope, requestedScope);

  const sourceProjectIds = projectIdsForScope(sourceScope);
  const requestedProjectIds = projectIdsForScope(requestedScope);
  const projectIds = requestedProjectIds.length > 0 ? requestedProjectIds : sourceProjectIds;

  return normalizeScope({
    organizationId: requestedScope.organizationId ?? sourceScope.organizationId,
    projectId: requestedScope.projectId ?? sourceScope.projectId ?? projectIds[0],
    projectIds,
    axisId: requestedScope.axisId ?? sourceScope.axisId,
    workstreamId: requestedScope.workstreamId ?? sourceScope.workstreamId,
    moduleId: requestedScope.moduleId ?? sourceScope.moduleId
  });
}

function sourceFromInput(input: ReturnType<typeof createDecisionRecordInputSchema.parse>) {
  const sourceType = input.source?.type ?? input.sourceType ?? "independent";
  const sourceId = input.source?.id ?? input.sourceId;

  return { sourceType, sourceId };
}

async function resolveSource(
  actor: PermissionUser,
  sourceType: DecisionSourceType,
  sourceId: string | undefined,
  dependencies: Required<
    Pick<DecisionRecordServiceDependencies, "getScopedMeeting" | "getScopedProposal">
  >
): Promise<SourceResolution> {
  if (sourceType === "independent") {
    return { scope: {} };
  }

  if (!sourceId) {
    throw new Error("Nguon decision thieu ma tham chieu.");
  }

  if (sourceType === "meeting") {
    const meeting = await dependencies.getScopedMeeting(actor, sourceId);

    if (!meeting) {
      throw new Error("Ban khong co quyen doc nguon decision hoac nguon khong ton tai.");
    }

    return {
      scope: normalizeScope({
        organizationId: meeting.organizationId,
        projectId: meeting.projectId,
        projectIds: meeting.projectIds,
        axisId: meeting.axisId,
        workstreamId: meeting.departmentId ?? "decision",
        moduleId: "meeting"
      }),
      meetingId: meeting.id,
      linkedRecord: {
        type: "meeting",
        id: meeting.id,
        relationType: "source",
        title: meeting.title
      }
    };
  }

  const detail = await dependencies.getScopedProposal(actor, sourceId);

  if (!detail) {
    throw new Error("Ban khong co quyen doc nguon decision hoac nguon khong ton tai.");
  }

  return {
    scope: normalizeScope({
      projectId: detail.proposal.projectId,
      workstreamId: detail.proposal.module,
      moduleId: "proposal"
    }),
    linkedRecord: {
      type: sourceType,
      id: detail.proposal.id,
      relationType: "source",
      title: detail.proposal.title
    }
  };
}

function scopeTargets(scope: DecisionScopeInput) {
  const projectIds = projectIdsForScope(scope);
  const baseTarget = {
    organizationId: scope.organizationId,
    axisId: scope.axisId,
    workstreamId: scope.workstreamId ?? "decision",
    moduleId: scope.moduleId ?? "meeting"
  };

  if (projectIds.length === 0) {
    return [baseTarget];
  }

  return projectIds.map((projectId) => ({
    ...baseTarget,
    projectId
  }));
}

async function defaultCanCreateDecisionInScope(
  actor: PermissionUser,
  scope: DecisionScopeInput,
  getScopedProject: (actor: PermissionUser, projectId: string) => Promise<Project | undefined>
) {
  const projectIds = projectIdsForScope(scope);

  if (can(actor, "decision.create") && !requiresAssignmentScopeForRole(actor.role)) {
    if (projectIds.length === 0) {
      return true;
    }

    const scopedProjects = await Promise.all(projectIds.map((projectId) => getScopedProject(actor, projectId)));

    return scopedProjects.some(Boolean);
  }

  const [scopeAssignments, rolePermissionCatalog] = await Promise.all([
    listActiveScopeAssignments(),
    listRolePermissionCatalog()
  ]);

  return scopeTargets(scope).some((target) =>
    canAccessScopedAction(actor, "decision.create", target, {
      rolePermissionCatalog,
      scopeAssignments
    })
  );
}

async function assertOwnerWithinScope(
  ownerId: string | undefined,
  actor: PermissionUser,
  scope: DecisionScopeInput,
  users: Pick<UserRepository, "listProjectMemberships">
) {
  if (!ownerId || ownerId === actor.id) {
    return;
  }

  const projectIds = projectIdsForScope(scope);

  if (projectIds.length === 0) {
    return;
  }

  const memberships = await users.listProjectMemberships();
  const ownerMemberships = memberships.filter((membership) => membership.userId === ownerId);

  if (ownerMemberships.length > 0 && !ownerMemberships.some((membership) => projectIds.includes(membership.projectId))) {
    throw new Error("Nguoi phu trach khong thuoc pham vi decision.");
  }
}

function auditNewValue(decision: Decision) {
  return {
    title: decision.title,
    status: decision.status,
    priority: decision.priority,
    ownerId: decision.ownerId,
    dueDate: decision.dueDate,
    source: {
      type: decision.sourceType,
      id: decision.sourceId
    },
    scope: {
      organizationId: decision.organizationId,
      projectId: decision.projectId,
      projectIds: decision.projectIds,
      axisId: decision.axisId,
      workstreamId: decision.workstreamId,
      moduleId: decision.moduleId
    },
    linkedRecordCount: decision.linkedRecords?.length ?? 0
  };
}

export async function createDecisionRecord(
  input: CreateDecisionRecordInput,
  actor: PermissionUser,
  dependencies: DecisionRecordServiceDependencies = {}
) {
  const repository = dependencies.repository ?? meetingRepository;
  const users = dependencies.userRepository ?? userRepository;
  const getScopedMeeting = dependencies.getScopedMeeting ?? defaultGetScopedMeeting;
  const getScopedProposal = dependencies.getScopedProposal ?? defaultGetScopedProposal;
  const getScopedProject = dependencies.getScopedProject ?? defaultGetScopedProject;
  const auditWriter = dependencies.auditWriter ?? createAuditLog;
  const idGenerator = dependencies.idGenerator ?? createId;
  const timestamp = (dependencies.now ?? now)();
  const parsedInput = createDecisionRecordInputSchema.parse(input);
  const { sourceType, sourceId } = sourceFromInput(parsedInput);
  const requestedScope = scopeFromInput(parsedInput);
  const sourceResolution = await resolveSource(actor, sourceType, sourceId, {
    getScopedMeeting,
    getScopedProposal
  });
  const scope = mergeSourceAndRequestedScope(sourceResolution.scope, requestedScope);

  if (!hasAnyScope(scope)) {
    throw new Error("Pham vi decision la bat buoc.");
  }

  const canCreate = dependencies.canCreateDecisionInScope
    ? await dependencies.canCreateDecisionInScope(actor, scope)
    : await defaultCanCreateDecisionInScope(actor, scope, getScopedProject);

  if (!canCreate) {
    throw new Error("Ban khong co quyen tao decision trong pham vi nay.");
  }

  await assertOwnerWithinScope(parsedInput.ownerId, actor, scope, users);

  const decisionText = parsedInput.content ?? parsedInput.decisionText ?? "";
  const title = parsedInput.title ?? compactText(decisionText);
  const linkedRecords = [
    ...(sourceResolution.linkedRecord ? [sourceResolution.linkedRecord] : []),
    ...parsedInput.linkedRecords
  ];
  const decision: Decision = {
    id: idGenerator(),
    title,
    organizationId: scope.organizationId,
    meetingId: sourceResolution.meetingId,
    projectId: scope.projectId,
    projectIds: projectIdsForScope(scope),
    axisId: scope.axisId,
    workstreamId: scope.workstreamId,
    moduleId: scope.moduleId,
    decisionText,
    sourceType,
    sourceId,
    linkedRecords,
    ownerId: parsedInput.ownerId,
    priority: parsedInput.priority,
    dueDate: parsedInput.dueDate,
    status: parsedInput.status,
    createdBy: actor.id,
    decidedBy: parsedInput.decidedBy ?? actor.id,
    decidedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const createdDecision = await repository.createDecision(decision);

  await auditWriter({
    actorId: actor.id,
    entityType: "decision",
    entityId: createdDecision.id,
    action: "decision.created",
    oldValue: {},
    newValue: auditNewValue(createdDecision)
  });

  return createdDecision;
}
