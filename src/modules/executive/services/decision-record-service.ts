import { can, type PermissionUser } from "@/lib/permissions/can";
import {
  canAccessScopedAction,
  requiresAssignmentScopeForRole
} from "@/lib/permissions/access-scope";
import {
  getScopedDecision as defaultGetScopedDecision,
  getScopedDocument as defaultGetScopedDocument,
  getScopedMeeting as defaultGetScopedMeeting,
  getScopedProject as defaultGetScopedProject,
  getScopedProposal as defaultGetScopedProposal,
  getScopedTask as defaultGetScopedTask
} from "@/lib/permissions/scoped-resources";
import type { Document } from "@/modules/documents/types";
import { createAuditLog } from "@/modules/users/services/user-service";
import { userRepository, type UserRepository } from "@/modules/users/services/user-repository";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import { listActiveScopeAssignments } from "@/modules/settings/services/scope-assignment-service";
import type { ProposalDetail } from "@/modules/proposals/types";
import type {
  CreateDecisionRecordInput,
  Decision,
  DecisionVersion,
  DecisionVersionField,
  DecisionVersionValue,
  DecisionLinkedRecord,
  DecisionScopeInput,
  DecisionSourceType,
  UpdateDecisionRecordInput,
  Meeting
} from "@/modules/meetings/types";
import { createDecisionRecordInputSchema, updateDecisionRecordInputSchema } from "@/modules/meetings/validation";
import { meetingRepository, type MeetingRepository } from "@/modules/meetings/services/meeting-repository";
import type { Project } from "@/modules/projects/types";
import type { Task } from "@/modules/tasks/types";
import type { AuditLog } from "@/modules/users/types";

type AuditWriter = (input: Omit<AuditLog, "id" | "createdAt">) => Promise<unknown>;
type ScopePermissionChecker = (actor: PermissionUser, scope: DecisionScopeInput) => Promise<boolean>;
type ScopedDecisionLoader = (actor: PermissionUser, decisionId: string) => Promise<Decision | undefined>;

export type DecisionRecordServiceDependencies = {
  repository?: MeetingRepository;
  userRepository?: Pick<UserRepository, "getUser" | "listProjectMemberships">;
  getScopedDocument?: (actor: PermissionUser, documentId: string) => Promise<Document | undefined>;
  getScopedDecision?: ScopedDecisionLoader;
  getScopedMeeting?: (actor: PermissionUser, meetingId: string) => Promise<Meeting | undefined>;
  getScopedProposal?: (actor: PermissionUser, proposalId: string) => Promise<ProposalDetail | undefined>;
  getScopedProject?: (actor: PermissionUser, projectId: string) => Promise<Project | undefined>;
  getScopedTask?: (actor: PermissionUser, taskId: string) => Promise<Task | undefined>;
  canCreateDecisionInScope?: ScopePermissionChecker;
  canUpdateDecisionInScope?: ScopePermissionChecker;
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

function uniqueSorted(values: Array<string | undefined>) {
  return unique(values).sort((left, right) => left.localeCompare(right));
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

function normalizeAxisId(axisId: string | undefined) {
  if (!axisId) {
    return axisId;
  }

  if (axisId === "axis-1" || axisId === "axis1") {
    return "project_management";
  }

  return axisId;
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

function scopeFromDecision(decision: Decision): DecisionScopeInput {
  return normalizeScope({
    organizationId: decision.organizationId,
    projectId: decision.projectId,
    projectIds: decision.projectIds,
    axisId: decision.axisId,
    workstreamId: decision.workstreamId,
    moduleId: decision.moduleId
  });
}

function scopeFromUpdateInput(
  input: ReturnType<typeof updateDecisionRecordInputSchema.parse>,
  decision: Decision
) {
  const projectIds = input.scope?.projectIds !== undefined ? input.scope.projectIds : input.projectIds;

  return normalizeScope({
    organizationId: input.scope?.organizationId ?? input.organizationId ?? decision.organizationId,
    projectId: input.scope?.projectId ?? input.projectId ?? decision.projectId,
    projectIds: projectIds ?? decision.projectIds,
    axisId: input.scope?.axisId ?? input.axisId ?? decision.axisId,
    workstreamId: input.scope?.workstreamId ?? input.workstreamId ?? decision.workstreamId,
    moduleId: input.scope?.moduleId ?? input.moduleId ?? decision.moduleId
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

  if (
    sourceScope.axisId &&
    requestedScope.axisId &&
    normalizeAxisId(sourceScope.axisId) !== normalizeAxisId(requestedScope.axisId)
  ) {
    throw new Error("Pham vi decision khong khop voi nguon da chon.");
  }

  for (const key of ["workstreamId", "moduleId"] as const) {
    if (
      sourceScope[key] &&
      requestedScope[key] &&
      sourceScope[key] !== requestedScope[key]
    ) {
      throw new Error("Pham vi decision khong khop voi nguon da chon.");
    }
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

  if (sourceType === "independent" && sourceId) {
    throw new Error("Nguon decision thieu loai tham chieu.");
  }

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

    return scopedProjects.every(Boolean);
  }

  const [scopeAssignments, rolePermissionCatalog] = await Promise.all([
    listActiveScopeAssignments(),
    listRolePermissionCatalog()
  ]);

  return scopeTargets(scope).every((target) =>
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
  users: Pick<UserRepository, "getUser" | "listProjectMemberships">
) {
  if (!ownerId || ownerId === actor.id) {
    return;
  }

  const owner = await users.getUser(ownerId);

  if (!owner) {
    throw new Error("Nguoi phu trach khong ton tai.");
  }

  const projectIds = projectIdsForScope(scope);

  if (projectIds.length === 0) {
    return;
  }

  const memberships = await users.listProjectMemberships();
  const ownerMemberships = memberships.filter((membership) => membership.userId === ownerId);

  if (!ownerMemberships.some((membership) => projectIds.includes(membership.projectId))) {
    throw new Error("Nguoi phu trach khong thuoc pham vi decision.");
  }
}

async function assertLinkedRecordsReadable(
  actor: PermissionUser,
  linkedRecords: DecisionLinkedRecord[],
  dependencies: Required<
    Pick<
      DecisionRecordServiceDependencies,
      | "getScopedDocument"
      | "getScopedMeeting"
      | "getScopedProject"
      | "getScopedProposal"
      | "getScopedTask"
    >
  >
) {
  for (const record of linkedRecords) {
    if (record.relationType === "source") {
      throw new Error("Lien ket source phai duoc tao tu nguon decision da xac thuc.");
    }

    if (
      record.type === "risk" ||
      record.type === "custom"
    ) {
      throw new Error("Loai linked record chua duoc ho tro kiem tra quyen doc.");
    }

    let readable: unknown;

    switch (record.type) {
      case "project":
        readable = await dependencies.getScopedProject(actor, record.id);
        break;
      case "meeting":
        readable = await dependencies.getScopedMeeting(actor, record.id);
        break;
      case "proposal":
      case "approval":
        readable = await dependencies.getScopedProposal(actor, record.id);
        break;
      case "task":
        readable = await dependencies.getScopedTask(actor, record.id);
        break;
      case "document":
        readable = await dependencies.getScopedDocument(actor, record.id);
        break;
    }

    if (!readable) {
      throw new Error("Ban khong co quyen lien ket record nay vao decision.");
    }
  }
}

function auditNewValue(decision: Decision) {
  return {
    title: decision.title,
    status: decision.status,
    priority: decision.priority,
    kpi: decision.kpi,
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

const versionedDecisionFields: DecisionVersionField[] = [
  "decisionText",
  "ownerId",
  "priority",
  "kpi",
  "dueDate",
  "status",
  "organizationId",
  "projectId",
  "projectIds",
  "axisId",
  "workstreamId",
  "moduleId",
  "linkedRecords"
];

const mutableDecisionFields: DecisionVersionField[] = ["title", ...versionedDecisionFields];

function stableJson(value: unknown) {
  return JSON.stringify(value, (_key, item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return item;
    }

    return Object.keys(item)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = (item as Record<string, unknown>)[key];

        return result;
      }, {});
  });
}

function normalizeLinkedRecords(records: DecisionLinkedRecord[] | undefined) {
  return (records ?? []).map((record) => ({
    type: record.type,
    id: record.id.trim(),
    relationType: record.relationType,
    title: record.title?.trim() || undefined
  }));
}

function normalizedDecisionValue(field: DecisionVersionField, decision: Decision) {
  switch (field) {
    case "title":
      return decision.title?.trim() || undefined;
    case "decisionText":
      return decision.decisionText.trim();
    case "projectIds":
      return uniqueSorted(decision.projectIds ?? []);
    case "linkedRecords":
      return normalizeLinkedRecords(decision.linkedRecords);
    default:
      return decision[field] ?? undefined;
  }
}

function valuesEqual(left: unknown, right: unknown) {
  return stableJson(left) === stableJson(right);
}

function changedDecisionFields(before: Decision, after: Decision) {
  return mutableDecisionFields.filter(
    (field) => !valuesEqual(normalizedDecisionValue(field, before), normalizedDecisionValue(field, after))
  );
}

function pickVersionValues(decision: Decision, fields: DecisionVersionField[]): DecisionVersionValue {
  return fields.reduce<DecisionVersionValue>((result, field) => {
    result[field] = normalizedDecisionValue(field, decision);

    return result;
  }, {});
}

function auditUpdateValue(
  decision: Decision,
  changedFields: DecisionVersionField[],
  versionNumber: number | undefined,
  reason: string | undefined
) {
  return {
    decisionId: decision.id,
    changedFields,
    versionNumber,
    scope: {
      organizationId: decision.organizationId,
      projectId: decision.projectId,
      projectIds: decision.projectIds,
      axisId: decision.axisId,
      workstreamId: decision.workstreamId,
      moduleId: decision.moduleId
    },
    ownerId: decision.ownerId,
    priority: decision.priority,
    status: decision.status,
    dueDate: decision.dueDate,
    reasonProvided: Boolean(reason)
  };
}

function decisionPatchFromUpdate(
  input: ReturnType<typeof updateDecisionRecordInputSchema.parse>,
  decision: Decision
): Partial<Decision> {
  const scope = scopeFromUpdateInput(input, decision);
  const decisionText = input.content ?? input.decisionText;

  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(decisionText !== undefined ? { decisionText } : {}),
    organizationId: scope.organizationId,
    projectId: scope.projectId,
    projectIds: projectIdsForScope(scope),
    axisId: scope.axisId,
    workstreamId: scope.workstreamId,
    moduleId: scope.moduleId,
    ...(input.linkedRecords !== undefined ? { linkedRecords: normalizeLinkedRecords(input.linkedRecords) } : {}),
    ...(input.ownerId !== undefined ? { ownerId: input.ownerId } : {}),
    ...(input.priority !== undefined ? { priority: input.priority } : {}),
    ...(input.kpi !== undefined ? { kpi: input.kpi } : {}),
    ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
    ...(input.status !== undefined ? { status: input.status } : {})
  };
}

function restoreDecisionPatch(decision: Decision): Partial<Decision> {
  return {
    title: decision.title,
    organizationId: decision.organizationId,
    projectId: decision.projectId,
    projectIds: decision.projectIds,
    axisId: decision.axisId,
    workstreamId: decision.workstreamId,
    moduleId: decision.moduleId,
    decisionText: decision.decisionText,
    linkedRecords: decision.linkedRecords,
    ownerId: decision.ownerId,
    priority: decision.priority,
    kpi: decision.kpi,
    dueDate: decision.dueDate,
    status: decision.status,
    updatedAt: decision.updatedAt
  };
}

async function canUpdateDecisionScope(
  actor: PermissionUser,
  scope: DecisionScopeInput,
  dependencies: DecisionRecordServiceDependencies,
  getScopedProject: (actor: PermissionUser, projectId: string) => Promise<Project | undefined>
) {
  if (dependencies.canUpdateDecisionInScope) {
    return dependencies.canUpdateDecisionInScope(actor, scope);
  }

  if (dependencies.canCreateDecisionInScope) {
    return dependencies.canCreateDecisionInScope(actor, scope);
  }

  return defaultCanCreateDecisionInScope(actor, scope, getScopedProject);
}

function sameDecisionScope(left: DecisionScopeInput, right: DecisionScopeInput) {
  return valuesEqual(normalizeScope(left), normalizeScope(right));
}

export async function createDecisionRecord(
  input: CreateDecisionRecordInput,
  actor: PermissionUser,
  dependencies: DecisionRecordServiceDependencies = {}
) {
  const repository = dependencies.repository ?? meetingRepository;
  const users = dependencies.userRepository ?? userRepository;
  const getScopedDocument = dependencies.getScopedDocument ?? defaultGetScopedDocument;
  const getScopedMeeting = dependencies.getScopedMeeting ?? defaultGetScopedMeeting;
  const getScopedProposal = dependencies.getScopedProposal ?? defaultGetScopedProposal;
  const getScopedProject = dependencies.getScopedProject ?? defaultGetScopedProject;
  const getScopedTask = dependencies.getScopedTask ?? defaultGetScopedTask;
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
  await assertLinkedRecordsReadable(actor, parsedInput.linkedRecords, {
    getScopedDocument,
    getScopedMeeting,
    getScopedProject,
    getScopedProposal,
    getScopedTask
  });

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
    kpi: parsedInput.kpi,
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

export async function updateDecisionRecord(
  input: UpdateDecisionRecordInput,
  actor: PermissionUser,
  dependencies: DecisionRecordServiceDependencies = {}
) {
  const repository = dependencies.repository ?? meetingRepository;
  const users = dependencies.userRepository ?? userRepository;
  const getScopedDecision =
    dependencies.getScopedDecision ??
    (dependencies.repository
      ? async (_actor: PermissionUser, decisionId: string) => repository.getDecision(decisionId)
      : defaultGetScopedDecision);
  const getScopedDocument = dependencies.getScopedDocument ?? defaultGetScopedDocument;
  const getScopedMeeting = dependencies.getScopedMeeting ?? defaultGetScopedMeeting;
  const getScopedProposal = dependencies.getScopedProposal ?? defaultGetScopedProposal;
  const getScopedProject = dependencies.getScopedProject ?? defaultGetScopedProject;
  const getScopedTask = dependencies.getScopedTask ?? defaultGetScopedTask;
  const auditWriter = dependencies.auditWriter ?? createAuditLog;
  const idGenerator = dependencies.idGenerator ?? createId;
  const timestamp = (dependencies.now ?? now)();
  const parsedInput = updateDecisionRecordInputSchema.parse(input);
  const decision = await getScopedDecision(actor, parsedInput.decisionId);

  if (!decision) {
    throw new Error("Ban khong co quyen doc decision hoac decision khong ton tai.");
  }

  const currentScope = scopeFromDecision(decision);
  const nextScope = scopeFromUpdateInput(parsedInput, decision);

  if (decision.sourceType && decision.sourceType !== "independent") {
    assertCompatibleScope(currentScope, nextScope);
  }

  const canUpdateCurrent = await canUpdateDecisionScope(actor, currentScope, dependencies, getScopedProject);
  const canUpdateNext = sameDecisionScope(currentScope, nextScope)
    ? canUpdateCurrent
    : await canUpdateDecisionScope(actor, nextScope, dependencies, getScopedProject);

  if (!canUpdateCurrent || !canUpdateNext) {
    throw new Error("Ban khong co quyen cap nhat decision trong pham vi nay.");
  }

  await assertOwnerWithinScope(
    parsedInput.ownerId ?? decision.ownerId,
    actor,
    nextScope,
    users
  );

  if (parsedInput.linkedRecords) {
    await assertLinkedRecordsReadable(actor, parsedInput.linkedRecords, {
      getScopedDocument,
      getScopedMeeting,
      getScopedProject,
      getScopedProposal,
      getScopedTask
    });
  }

  const normalizedPatch = decisionPatchFromUpdate(parsedInput, decision);
  const proposedDecision: Decision = {
    ...decision,
    ...normalizedPatch,
    id: decision.id,
    createdAt: decision.createdAt,
    createdBy: decision.createdBy,
    sourceType: decision.sourceType,
    sourceId: decision.sourceId,
    taskId: decision.taskId,
    updatedAt: timestamp
  };
  const changedFields = changedDecisionFields(decision, proposedDecision);

  if (changedFields.length === 0) {
    return decision;
  }

  const versionedChangedFields = versionedDecisionFields.filter((field) => changedFields.includes(field));
  const existingVersions = await repository.listDecisionVersions(decision.id);
  const versionNumber =
    versionedChangedFields.length > 0
      ? Math.max(0, ...existingVersions.map((version) => version.versionNumber)) + 1
      : undefined;
  const version = versionNumber
    ? {
        id: idGenerator(),
        decisionId: decision.id,
        versionNumber,
        changedFields: versionedChangedFields,
        previousValue: pickVersionValues(decision, versionedChangedFields),
        newValue: pickVersionValues(proposedDecision, versionedChangedFields),
        reason: parsedInput.reason,
        createdBy: actor.id,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    : undefined;
  const auditOldValue = auditUpdateValue(decision, changedFields, versionNumber, parsedInput.reason);
  const auditNewValue = auditUpdateValue(proposedDecision, changedFields, versionNumber, parsedInput.reason);

  if (repository.updateDecisionWithVersionAndAudit) {
    return repository.updateDecisionWithVersionAndAudit({
      decisionId: decision.id,
      patch: {
        ...normalizedPatch,
        updatedAt: timestamp
      },
      version,
      auditLog: {
        actorId: actor.id,
        entityType: "decision",
        entityId: decision.id,
        action: "decision.updated",
        oldValue: auditOldValue,
        newValue: auditNewValue
      }
    });
  }

  let createdVersion: DecisionVersion | undefined;
  let updatedDecision: Decision | undefined;

  try {
    if (version) {
      createdVersion = await repository.createDecisionVersion(version);
    }

    updatedDecision = await repository.updateDecision(decision.id, {
      ...normalizedPatch,
      updatedAt: timestamp
    });

    await auditWriter({
      actorId: actor.id,
      entityType: "decision",
      entityId: decision.id,
      action: "decision.updated",
      oldValue: auditOldValue,
      newValue: auditUpdateValue(updatedDecision, changedFields, versionNumber, parsedInput.reason)
    });

    return updatedDecision;
  } catch (error) {
    const rollbackErrors: string[] = [];

    if (updatedDecision) {
      try {
        await repository.updateDecision(decision.id, restoreDecisionPatch(decision));
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError instanceof Error ? rollbackError.message : String(rollbackError));
      }
    }

    if (createdVersion) {
      try {
        await repository.deleteDecisionVersions([createdVersion.id]);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError instanceof Error ? rollbackError.message : String(rollbackError));
      }
    }

    if (rollbackErrors.length > 0) {
      const originalMessage = error instanceof Error ? error.message : String(error);

      throw new Error(`${originalMessage} Rollback decision update failed: ${rollbackErrors.join("; ")}`);
    }

    throw error;
  }
}
