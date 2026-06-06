import { randomUUID } from "node:crypto";

import type {
  AccessScope,
} from "@/lib/permissions/access-scope";
import {
  canAccessScopedAction,
  requiresAssignmentScopeForRole,
  usesAssignmentModel,
} from "@/lib/permissions/access-scope";
import {
  getScopedDecision,
  getScopedDocument,
  getScopedMeeting,
  getScopedProject,
  getScopedProposal,
  getScopedTask,
  listScopedLegalSteps,
} from "@/lib/permissions/scoped-resources";
import { can, type PermissionAction, type PermissionUser } from "@/lib/permissions/can";
import { projectRepository, type ProjectRepository } from "@/modules/projects/services/project-repository";
import { listActiveRiskGroups } from "@/modules/settings/services/policy-settings-service";
import {
  rolePermissionCatalogRepository,
  type RolePermissionCatalogRepository,
} from "@/modules/settings/services/role-permission-catalog-repository";
import {
  leadershipDelegationRepository,
  type LeadershipDelegationRepository,
} from "@/modules/settings/services/leadership-delegation-repository";
import { assertDelegatedActionAllowed } from "@/modules/settings/services/leadership-delegation-service";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import { listActiveScopeAssignments } from "@/modules/settings/services/scope-assignment-service";
import type {
  LeadershipDelegation,
  RolePermissionCatalog,
  ScopeAssignment,
  ScopeDimension,
} from "@/modules/settings/types";
import { userRepository, type UserRepository } from "@/modules/users/services/user-repository";
import { createAuditLog } from "@/modules/users/services/user-service";
import type { AuditLog, ProjectMembership, User } from "@/modules/users/types";
import {
  closeExecutiveRiskRecordInputSchema,
  createExecutiveRiskRecordInputSchema,
  overrideExecutiveRiskStatusInputSchema,
  updateExecutiveRiskRecordInputSchema,
} from "@/modules/executive/validation";
import type {
  CloseExecutiveRiskRecordInput,
  CreateExecutiveRiskRecordInput,
  ExecutiveRiskRecord,
  ExecutiveRiskRecordStatus,
  OverrideExecutiveRiskStatusInput,
  RiskStatusKey,
  RiskSignalSourceType,
  UpdateExecutiveRiskRecordInput,
} from "@/modules/executive/types";
import { buildExecutiveRiskItemFromRecord } from "@/modules/executive/services/risk-status-service";
import type { ExecutiveRiskItem } from "@/modules/dashboard/types";

import {
  riskRecordRepository,
  type ExecutiveRiskRecordListFilters,
  type RiskRecordRepository,
} from "./risk-record-repository";

type AuditWriter = (input: Omit<AuditLog, "id" | "createdAt">) => Promise<unknown>;
type RiskRecordServiceUserRepository = Pick<
  UserRepository,
  "getUser" | "listProjectMemberships"
>;
type RiskRecordServiceProjectRepository = Pick<ProjectRepository, "getProject">;
type ScopedSourceLoader = (
  actor: PermissionUser,
  sourceId: string,
) => Promise<unknown | undefined>;
type ScopedLegalLoader = (
  actor: PermissionUser,
  sourceId: string,
) => Promise<unknown | undefined>;

export type RiskRecordServiceDependencies = {
  repository?: RiskRecordRepository;
  userRepository?: RiskRecordServiceUserRepository;
  projectRepository?: RiskRecordServiceProjectRepository;
  riskGroups?: Array<{ riskKey: string; active?: boolean }>;
  scopeAssignments?: ScopeAssignment[];
  rolePermissionCatalog?: RolePermissionCatalog;
  delegationRepository?: LeadershipDelegationRepository;
  catalogRepository?: RolePermissionCatalogRepository;
  delegations?: LeadershipDelegation[];
  auditWriter?: AuditWriter;
  idGenerator?: () => string;
  now?: () => string;
  getScopedProject?: ScopedSourceLoader;
  getScopedTask?: ScopedSourceLoader;
  getScopedDocument?: ScopedSourceLoader;
  getScopedProposal?: ScopedSourceLoader;
  getScopedMeeting?: ScopedSourceLoader;
  getScopedDecision?: ScopedSourceLoader;
  getScopedLegal?: ScopedLegalLoader;
};

type MutationContext = {
  catalogRepository: RolePermissionCatalogRepository;
  rolePermissionCatalog: RolePermissionCatalog;
  scopeAssignments: ScopeAssignment[];
};

type RiskScope = ScopeDimension;

const mutableRiskFields = [
  "recordType",
  "title",
  "categoryKey",
  "level",
  "reason",
  "description",
  "organizationId",
  "projectId",
  "axisId",
  "workstreamId",
  "moduleId",
  "ownerId",
  "ownerName",
  "deadline",
  "nextAction",
  "status",
  "statusOverride",
  "statusOverrideReason",
  "statusOverrideBy",
  "statusOverrideAt",
  "statusOverrideSourceStatus",
  "closedReason",
  "closedBy",
  "closedAt",
  "sourceType",
  "sourceId",
  "onBehalfOf",
  "delegationId",
] satisfies Array<keyof ExecutiveRiskRecord>;

const terminalRiskStatuses = new Set<ExecutiveRiskRecordStatus>([
  "closed",
  "resolved",
]);
const highCloseLevels = new Set<ExecutiveRiskRecord["level"]>([
  "critical",
  "high",
]);
const responsibleLeaderRoles = new Set([
  "chu_tich",
  "tong_giam_doc",
  "pho_tong_giam_doc",
  "giam_doc_du_an",
]);

function isTerminalRiskStatus(status: ExecutiveRiskRecordStatus) {
  return terminalRiskStatuses.has(status);
}

function assertRiskRecordActive(record: ExecutiveRiskRecord) {
  if (isTerminalRiskStatus(record.status)) {
    throw new Error("Risk/blocker da dong hoac da resolved, khong the tiep tuc cap nhat.");
  }
}

function createId() {
  return randomUUID();
}

function now() {
  return new Date().toISOString();
}

function compactSafeText(value: string | undefined, maxLength = 160) {
  if (!value) {
    return undefined;
  }

  const normalized = value
    .replace(/\b\d[\d\s.,_]*(?:VND|VNĐ|vnd|vnđ)?\b/g, "[an so lieu]")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return undefined;
  }

  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 3)}...`
    : normalized;
}

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

function valuesEqual(left: unknown, right: unknown) {
  return stableJson(left) === stableJson(right);
}

function scopeFromRecord(record: ExecutiveRiskRecord): RiskScope {
  return {
    axisId: record.axisId,
    moduleId: record.moduleId,
    organizationId: record.organizationId,
    projectId: record.projectId,
    recordId: record.id,
    workstreamId: record.workstreamId,
  };
}

function scopeFromParsedInput(input: {
  organizationId?: string;
  projectId?: string;
  axisId?: string;
  workstreamId?: string;
  moduleId?: string;
  riskId?: string;
}): RiskScope {
  return {
    axisId: input.axisId ?? "project_management",
    moduleId: input.moduleId ?? "risk",
    organizationId: input.organizationId,
    projectId: input.projectId,
    recordId: input.riskId,
    workstreamId: input.workstreamId ?? input.moduleId ?? "risk",
  };
}

function targetForScope(scope: RiskScope): ScopeDimension {
  return {
    axisId: scope.axisId ?? "project_management",
    moduleId: scope.moduleId ?? "risk",
    organizationId: scope.organizationId,
    projectId: scope.projectId,
    recordId: scope.recordId,
    workstreamId: scope.workstreamId ?? scope.moduleId ?? "risk",
  };
}

function hasAnyScope(scope: RiskScope) {
  return Boolean(scope.organizationId || scope.projectId || scope.moduleId);
}

function hasProjectOrOrganizationModule(scope: RiskScope) {
  return Boolean(scope.projectId || (scope.organizationId && scope.moduleId));
}

function catalogRepositoryFromCatalog(
  catalog: RolePermissionCatalog,
): RolePermissionCatalogRepository {
  return {
    getRole: async (roleKey: string) =>
      catalog.roles.find((role) => role.key === roleKey),
    listCatalog: async () => catalog,
    replaceRolePermissions: async () => {
      throw new Error("Readonly risk record catalog.");
    },
    setRoleActive: async () => {
      throw new Error("Readonly risk record catalog.");
    },
    upsertRole: async () => {
      throw new Error("Readonly risk record catalog.");
    },
  };
}

async function resolveMutationContext(
  dependencies: RiskRecordServiceDependencies,
): Promise<MutationContext> {
  const [rolePermissionCatalog, scopeAssignments] = await Promise.all([
    dependencies.rolePermissionCatalog ?? listRolePermissionCatalog(),
    dependencies.scopeAssignments ?? listActiveScopeAssignments(),
  ]);

  return {
    catalogRepository:
      dependencies.catalogRepository ??
      (dependencies.rolePermissionCatalog
        ? catalogRepositoryFromCatalog(rolePermissionCatalog)
        : rolePermissionCatalogRepository),
    rolePermissionCatalog,
    scopeAssignments,
  };
}

function canMutateDirectOrScoped(
  actor: PermissionUser,
  action: PermissionAction,
  scope: RiskScope,
  context: MutationContext,
) {
  if (can(actor, action) && !requiresAssignmentScopeForRole(actor.role)) {
    return true;
  }

  return canAccessScopedAction(actor, action, targetForScope(scope), {
    rolePermissionCatalog: context.rolePermissionCatalog,
    scopeAssignments: context.scopeAssignments,
  });
}

async function assertMutationAllowed(input: {
  action: PermissionAction;
  actor: PermissionUser;
  context: MutationContext;
  delegationId?: string;
  onBehalfOf?: string;
  scope: RiskScope;
  dependencies: RiskRecordServiceDependencies;
}) {
  if (input.onBehalfOf) {
    const resolution = await assertDelegatedActionAllowed(
      {
        actionKey: input.action,
        actor: input.actor,
        delegationId: input.delegationId,
        principalUserId: input.onBehalfOf,
        scope: targetForScope(input.scope),
      },
      {
        catalogRepository: input.context.catalogRepository,
        now: new Date((input.dependencies.now ?? now)()),
        repository:
          input.dependencies.delegationRepository ??
          (input.dependencies.delegations
            ? {
                getDelegation: async (delegationId: string) =>
                  input.dependencies.delegations?.find(
                    (delegation) => delegation.id === delegationId,
                  ),
                listDelegations: async () => input.dependencies.delegations ?? [],
                setDelegationActive: async () => {
                  throw new Error("Readonly risk delegation repository.");
                },
                upsertDelegation: async () => {
                  throw new Error("Readonly risk delegation repository.");
                },
              }
            : leadershipDelegationRepository),
      },
    );

    return {
      delegationId: resolution.delegationId,
      onBehalfOf: resolution.principalUserId,
    };
  }

  if (!canMutateDirectOrScoped(input.actor, input.action, input.scope, input.context)) {
    throw new Error("Ban khong co quyen tao/cap nhat risk trong pham vi nay.");
  }

  return {};
}

async function assertKnownActiveCategory(
  categoryKey: string,
  dependencies: RiskRecordServiceDependencies,
) {
  const groups =
    dependencies.riskGroups ??
    (await listActiveRiskGroups()).map((group) => ({
      active: group.active,
      riskKey: group.riskKey,
    }));
  const matched = groups.some(
    (group) => group.active !== false && group.riskKey === categoryKey,
  );

  if (!matched) {
    throw new Error("Nhom risk khong ton tai hoac da bi vo hieu hoa.");
  }
}

async function assertKnownProject(
  projectId: string | undefined,
  projects: RiskRecordServiceProjectRepository,
) {
  if (!projectId) {
    return;
  }

  const project = await projects.getProject(projectId);

  if (!project || project.archivedAt || project.status === "archived") {
    throw new Error("Du an lien quan khong ton tai hoac da duoc luu tru.");
  }
}

function ownerCanReadProject(
  owner: User,
  projectId: string,
  memberships: ProjectMembership[],
  context: MutationContext,
) {
  if (memberships.some((membership) => membership.userId === owner.id && membership.projectId === projectId)) {
    return true;
  }

  const target = targetForScope({ projectId, moduleId: "risk" });

  return (
    canAccessScopedAction(owner, "project.view", target, {
      rolePermissionCatalog: context.rolePermissionCatalog,
      scopeAssignments: context.scopeAssignments,
    }) ||
    canAccessScopedAction(owner, "risk.view", target, {
      rolePermissionCatalog: context.rolePermissionCatalog,
      scopeAssignments: context.scopeAssignments,
    })
  );
}

async function assertOwnerValid(input: {
  context: MutationContext;
  ownerId: string;
  projectId?: string;
  users: RiskRecordServiceUserRepository;
}) {
  const owner = await input.users.getUser(input.ownerId);

  if (!owner || owner.status !== "active") {
    throw new Error("Nguoi phu trach khong ton tai hoac khong active.");
  }

  if (!input.projectId) {
    return owner;
  }

  const memberships = await input.users.listProjectMemberships();

  if (!ownerCanReadProject(owner, input.projectId, memberships, input.context)) {
    throw new Error("Nguoi phu trach khong thuoc pham vi du an.");
  }

  return owner;
}

async function defaultGetScopedLegal(actor: PermissionUser, sourceId: string) {
  const steps = await listScopedLegalSteps(actor);

  return steps.find((step) => step.id === sourceId);
}

async function assertSourceReadable(input: {
  actor: PermissionUser;
  dependencies: RiskRecordServiceDependencies;
  sourceId?: string;
  sourceType?: RiskSignalSourceType;
}) {
  if (!input.sourceType && !input.sourceId) {
    return;
  }

  if (!input.sourceType || !input.sourceId) {
    throw new Error("Source risk/blocker thieu loai hoac ma tham chieu.");
  }

  const loaders: Partial<Record<RiskSignalSourceType, ScopedSourceLoader>> = {
    decision: input.dependencies.getScopedDecision ?? getScopedDecision,
    document: input.dependencies.getScopedDocument ?? getScopedDocument,
    meeting: input.dependencies.getScopedMeeting ?? getScopedMeeting,
    project: input.dependencies.getScopedProject ?? getScopedProject,
    proposal: input.dependencies.getScopedProposal ?? getScopedProposal,
    task: input.dependencies.getScopedTask ?? getScopedTask,
  };
  const loader =
    input.sourceType === "legal"
      ? input.dependencies.getScopedLegal ?? defaultGetScopedLegal
      : loaders[input.sourceType];

  if (!loader) {
    throw new Error("Loai source risk/blocker chua duoc ho tro kiem tra quyen doc.");
  }

  const readable = await loader(input.actor, input.sourceId);

  if (!readable) {
    throw new Error("Ban khong co quyen doc source risk/blocker hoac source khong ton tai.");
  }
}

export function riskRecordAuditValue(
  record: ExecutiveRiskRecord,
  changedFields?: Array<keyof ExecutiveRiskRecord>,
) {
  return {
    categoryKey: record.categoryKey,
    changedFields,
    closedAt: record.closedAt,
    closedBy: record.closedBy,
    closedReason: compactSafeText(record.closedReason),
    deadline: record.deadline,
    delegationId: record.delegationId,
    level: record.level,
    moduleId: record.moduleId,
    nextAction: compactSafeText(record.nextAction),
    onBehalfOf: record.onBehalfOf,
    ownerId: record.ownerId,
    projectId: record.projectId,
    recordType: record.recordType,
    sourceId: record.sourceId,
    sourceType: record.sourceType,
    status: record.status,
    statusOverride: record.statusOverride,
    statusOverrideReason: compactSafeText(record.statusOverrideReason),
    statusOverrideSourceStatus: record.statusOverrideSourceStatus,
    title: compactSafeText(record.title),
  };
}

function changedRiskFields(
  before: ExecutiveRiskRecord,
  after: ExecutiveRiskRecord,
) {
  return mutableRiskFields.filter((field) => !valuesEqual(before[field], after[field]));
}

function patchFromUpdateInput(
  input: ReturnType<typeof updateExecutiveRiskRecordInputSchema.parse>,
  existing: ExecutiveRiskRecord,
  ownerName?: string,
): Partial<ExecutiveRiskRecord> {
  return {
    ...(input.recordType !== undefined ? { recordType: input.recordType } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.categoryKey !== undefined ? { categoryKey: input.categoryKey } : {}),
    ...(input.level !== undefined ? { level: input.level } : {}),
    ...(input.reason !== undefined ? { reason: input.reason } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.organizationId !== undefined ? { organizationId: input.organizationId } : {}),
    ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
    ...(input.axisId !== undefined ? { axisId: input.axisId } : {}),
    ...(input.workstreamId !== undefined ? { workstreamId: input.workstreamId } : {}),
    ...(input.moduleId !== undefined ? { moduleId: input.moduleId } : {}),
    ...(input.ownerId !== undefined ? { ownerId: input.ownerId } : {}),
    ...(ownerName !== undefined ? { ownerName } : {}),
    ...(input.deadline !== undefined ? { deadline: input.deadline } : {}),
    ...(input.nextAction !== undefined ? { nextAction: input.nextAction } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.sourceType !== undefined ? { sourceType: input.sourceType } : {}),
    ...(input.sourceId !== undefined ? { sourceId: input.sourceId } : {}),
    ...(input.onBehalfOf !== undefined
      ? { onBehalfOf: input.onBehalfOf }
      : existing.onBehalfOf
        ? { onBehalfOf: existing.onBehalfOf }
        : {}),
    ...(input.delegationId !== undefined
      ? { delegationId: input.delegationId }
      : existing.delegationId
        ? { delegationId: existing.delegationId }
        : {}),
  };
}

function restorePatch(record: ExecutiveRiskRecord): Partial<ExecutiveRiskRecord> {
  return {
    axisId: record.axisId,
    categoryKey: record.categoryKey,
    closedAt: record.closedAt,
    closedBy: record.closedBy,
    closedReason: record.closedReason,
    deadline: record.deadline,
    delegationId: record.delegationId,
    description: record.description,
    level: record.level,
    moduleId: record.moduleId,
    nextAction: record.nextAction,
    onBehalfOf: record.onBehalfOf,
    organizationId: record.organizationId,
    ownerId: record.ownerId,
    ownerName: record.ownerName,
    projectId: record.projectId,
    reason: record.reason,
    recordType: record.recordType,
    sourceId: record.sourceId,
    sourceType: record.sourceType,
    status: record.status,
    statusOverride: record.statusOverride,
    statusOverrideAt: record.statusOverrideAt,
    statusOverrideBy: record.statusOverrideBy,
    statusOverrideReason: record.statusOverrideReason,
    statusOverrideSourceStatus: record.statusOverrideSourceStatus,
    title: record.title,
    updatedAt: record.updatedAt,
    updatedBy: record.updatedBy,
    workstreamId: record.workstreamId,
  };
}

function sameScope(left: RiskScope, right: RiskScope) {
  return valuesEqual(targetForScope(left), targetForScope(right));
}

export function canReadExecutiveRiskRecordInScope(
  record: Pick<ExecutiveRiskRecord, "createdBy" | "id" | "moduleId" | "organizationId" | "ownerId" | "projectId">,
  scope: AccessScope,
) {
  const user = { id: scope.userId, role: scope.role };
  const target = targetForScope({
    moduleId: record.moduleId ?? "risk",
    organizationId: record.organizationId,
    projectId: record.projectId,
    recordId: record.id,
  });

  if (usesAssignmentModel(scope)) {
    return canAccessScopedAction(user, "risk.view", target, {
      now: scope.evaluatedAt,
      rolePermissionCatalog: scope.rolePermissionCatalog,
      scopeAssignments: scope.scopeAssignments,
    });
  }

  const canViewRisk = can(user, "risk.view");

  if (!canViewRisk) {
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

export function filterExecutiveRiskRecordsForScope(
  records: ExecutiveRiskRecord[],
  scope: AccessScope,
) {
  return records.filter((record) => canReadExecutiveRiskRecordInScope(record, scope));
}

export async function listExecutiveRiskRecordsForDashboard(
  filters: ExecutiveRiskRecordListFilters = {},
  dependencies: RiskRecordServiceDependencies = {},
) {
  const repository = dependencies.repository ?? riskRecordRepository;

  return repository.listRiskRecords(filters);
}

export { buildExecutiveRiskItemFromRecord };

export function buildExecutiveRiskItemsFromRecords(input: {
  generatedAt: string;
  records: ExecutiveRiskRecord[];
  riskGroups: Parameters<typeof buildExecutiveRiskItemFromRecord>[0]["riskGroups"];
}): ExecutiveRiskItem[] {
  return input.records.map((record) =>
    buildExecutiveRiskItemFromRecord({
      generatedAt: input.generatedAt,
      record,
      riskGroups: input.riskGroups,
    }),
  );
}

export async function createExecutiveRiskRecord(
  input: CreateExecutiveRiskRecordInput,
  actor: PermissionUser,
  dependencies: RiskRecordServiceDependencies = {},
) {
  const repository = dependencies.repository ?? riskRecordRepository;
  const users = dependencies.userRepository ?? userRepository;
  const projects = dependencies.projectRepository ?? projectRepository;
  const auditWriter = dependencies.auditWriter ?? createAuditLog;
  const idGenerator = dependencies.idGenerator ?? createId;
  const timestamp = (dependencies.now ?? now)();
  const parsed = createExecutiveRiskRecordInputSchema.parse(input);
  const context = await resolveMutationContext(dependencies);
  const scope = scopeFromParsedInput(parsed);

  if (!hasAnyScope(scope) || !hasProjectOrOrganizationModule(scope)) {
    throw new Error("Pham vi risk/blocker la bat buoc.");
  }

  await Promise.all([
    assertKnownActiveCategory(parsed.categoryKey, dependencies),
    assertKnownProject(parsed.projectId, projects),
    assertSourceReadable({
      actor,
      dependencies,
      sourceId: parsed.sourceId,
      sourceType: parsed.sourceType,
    }),
  ]);
  const delegation = await assertMutationAllowed({
    action: "risk.create",
    actor,
    context,
    delegationId: parsed.delegationId,
    dependencies,
    onBehalfOf: parsed.onBehalfOf,
    scope,
  });
  const owner = await assertOwnerValid({
    context,
    ownerId: parsed.ownerId,
    projectId: parsed.projectId,
    users,
  });
  const record: ExecutiveRiskRecord = {
    axisId: parsed.axisId,
    categoryKey: parsed.categoryKey,
    createdAt: timestamp,
    createdBy: actor.id,
    deadline: parsed.deadline,
    delegationId: delegation.delegationId,
    description: parsed.description,
    id: idGenerator(),
    level: parsed.level,
    moduleId: parsed.moduleId,
    nextAction: parsed.nextAction,
    onBehalfOf: delegation.onBehalfOf,
    organizationId: parsed.organizationId,
    ownerId: parsed.ownerId,
    ownerName: owner.fullName,
    projectId: parsed.projectId,
    reason: parsed.reason,
    recordType: parsed.recordType,
    sourceId: parsed.sourceId,
    sourceType: parsed.sourceType,
    status: parsed.status,
    title: parsed.title,
    updatedAt: timestamp,
    updatedBy: actor.id,
    workstreamId: parsed.workstreamId,
  };
  const createdRecord = await repository.createRiskRecord(record);

  try {
    await auditWriter({
      action: "risk.created",
      actorId: actor.id,
      entityId: createdRecord.id,
      entityType: "risk",
      newValue: riskRecordAuditValue(createdRecord),
      oldValue: {},
    });

    return createdRecord;
  } catch (error) {
    try {
      await repository.deleteRiskRecord(createdRecord.id);
    } catch (rollbackError) {
      const originalMessage = error instanceof Error ? error.message : String(error);
      const rollbackMessage =
        rollbackError instanceof Error ? rollbackError.message : String(rollbackError);

      throw new Error(`${originalMessage} Rollback risk create failed: ${rollbackMessage}`);
    }

    throw error;
  }
}

export async function updateExecutiveRiskRecord(
  input: UpdateExecutiveRiskRecordInput,
  actor: PermissionUser,
  dependencies: RiskRecordServiceDependencies = {},
) {
  const repository = dependencies.repository ?? riskRecordRepository;
  const users = dependencies.userRepository ?? userRepository;
  const projects = dependencies.projectRepository ?? projectRepository;
  const auditWriter = dependencies.auditWriter ?? createAuditLog;
  const timestamp = (dependencies.now ?? now)();
  const parsed = updateExecutiveRiskRecordInputSchema.parse(input);
  const existing = await repository.getRiskRecord(parsed.riskId);

  if (!existing) {
    throw new Error("Khong tim thay risk/blocker can cap nhat.");
  }

  assertRiskRecordActive(existing);

  const context = await resolveMutationContext(dependencies);
  const nextScope = scopeFromParsedInput({
    axisId: parsed.axisId ?? existing.axisId,
    moduleId: parsed.moduleId ?? existing.moduleId,
    organizationId: parsed.organizationId ?? existing.organizationId,
    projectId: parsed.projectId ?? existing.projectId,
    riskId: existing.id,
    workstreamId: parsed.workstreamId ?? existing.workstreamId,
  });
  const currentScope = scopeFromRecord(existing);

  if (!hasProjectOrOrganizationModule(nextScope)) {
    throw new Error("Pham vi risk/blocker la bat buoc.");
  }

  await Promise.all([
    parsed.categoryKey
      ? assertKnownActiveCategory(parsed.categoryKey, dependencies)
      : Promise.resolve(),
    assertKnownProject(parsed.projectId ?? existing.projectId, projects),
    assertSourceReadable({
      actor,
      dependencies,
      sourceId: parsed.sourceId ?? existing.sourceId,
      sourceType: parsed.sourceType ?? existing.sourceType,
    }),
  ]);

  const currentDelegation = await assertMutationAllowed({
    action: "risk.update",
    actor,
    context,
    delegationId: parsed.delegationId,
    dependencies,
    onBehalfOf: parsed.onBehalfOf,
    scope: currentScope,
  });
  const nextDelegation = sameScope(currentScope, nextScope)
    ? currentDelegation
    : await assertMutationAllowed({
        action: "risk.update",
        actor,
        context,
        delegationId: parsed.delegationId,
        dependencies,
        onBehalfOf: parsed.onBehalfOf,
        scope: nextScope,
      });
  const owner = await assertOwnerValid({
    context,
    ownerId: parsed.ownerId ?? existing.ownerId,
    projectId: parsed.projectId ?? existing.projectId,
    users,
  });
  const normalizedPatch = patchFromUpdateInput(parsed, existing, owner.fullName);
  const proposedRecord: ExecutiveRiskRecord = {
    ...existing,
    ...normalizedPatch,
    delegationId: nextDelegation.delegationId ?? normalizedPatch.delegationId,
    onBehalfOf: nextDelegation.onBehalfOf ?? normalizedPatch.onBehalfOf,
    updatedAt: timestamp,
    updatedBy: actor.id,
  };
  const changedFields = changedRiskFields(existing, proposedRecord);

  if (changedFields.length === 0) {
    return existing;
  }

  const updatedRecord = await repository.updateRiskRecord(existing.id, {
    ...normalizedPatch,
    delegationId: proposedRecord.delegationId,
    onBehalfOf: proposedRecord.onBehalfOf,
    updatedAt: timestamp,
    updatedBy: actor.id,
  });

  try {
    await auditWriter({
      action: "risk.updated",
      actorId: actor.id,
      entityId: updatedRecord.id,
      entityType: "risk",
      newValue: riskRecordAuditValue(updatedRecord, changedFields),
      oldValue: riskRecordAuditValue(existing, changedFields),
    });

    return updatedRecord;
  } catch (error) {
    try {
      await repository.updateRiskRecord(existing.id, restorePatch(existing));
    } catch (rollbackError) {
      const originalMessage = error instanceof Error ? error.message : String(error);
      const rollbackMessage =
        rollbackError instanceof Error ? rollbackError.message : String(rollbackError);

      throw new Error(`${originalMessage} Rollback risk update failed: ${rollbackMessage}`);
    }

    throw error;
  }
}

function sourceStatusForRecord(record: ExecutiveRiskRecord, generatedAt: string): RiskStatusKey {
  return buildExecutiveRiskItemFromRecord({
    generatedAt,
    record: {
      ...record,
      statusOverride: undefined,
      statusOverrideAt: undefined,
      statusOverrideBy: undefined,
      statusOverrideReason: undefined,
      statusOverrideSourceStatus: undefined,
    },
  }).statusSuggestion.status;
}

function requiresHighClosePolicy(record: ExecutiveRiskRecord) {
  return record.recordType === "blocker" || highCloseLevels.has(record.level);
}

function canResponsibleLeaderClose(
  actor: PermissionUser,
  scope: RiskScope,
  context: MutationContext,
) {
  const scopedLeaderAssignments = context.scopeAssignments.filter(
    (assignment) =>
      assignment.userId === actor.id && responsibleLeaderRoles.has(assignment.roleKey),
  );
  const canCloseAsScopedResponsibleLeader = canAccessScopedAction(
    actor,
    "risk.close",
    targetForScope(scope),
    {
      rolePermissionCatalog: context.rolePermissionCatalog,
      scopeAssignments: scopedLeaderAssignments,
    },
  );

  return (
    canCloseAsScopedResponsibleLeader ||
    (responsibleLeaderRoles.has(actor.role) &&
      canMutateDirectOrScoped(actor, "risk.close", scope, context))
  );
}

async function assertCloseAllowed(input: {
  actor: PermissionUser;
  context: MutationContext;
  dependencies: RiskRecordServiceDependencies;
  delegationId?: string;
  onBehalfOf?: string;
  record: ExecutiveRiskRecord;
  scope: RiskScope;
}) {
  const needsHighClose = requiresHighClosePolicy(input.record);

  if (!needsHighClose) {
    return assertMutationAllowed({
      action: "risk.close",
      actor: input.actor,
      context: input.context,
      delegationId: input.delegationId,
      dependencies: input.dependencies,
      onBehalfOf: input.onBehalfOf,
      scope: input.scope,
    });
  }

  const canCloseHigh = canMutateDirectOrScoped(
    input.actor,
    "risk.close_high",
    input.scope,
    input.context,
  );
  const canResponsibleClose = canResponsibleLeaderClose(
    input.actor,
    input.scope,
    input.context,
  );

  if (canCloseHigh) {
    return assertMutationAllowed({
      action: "risk.close_high",
      actor: input.actor,
      context: input.context,
      delegationId: input.delegationId,
      dependencies: input.dependencies,
      onBehalfOf: input.onBehalfOf,
      scope: input.scope,
    });
  }

  if (canResponsibleClose) {
    return assertMutationAllowed({
      action: "risk.close",
      actor: input.actor,
      context: input.context,
      delegationId: input.delegationId,
      dependencies: input.dependencies,
      onBehalfOf: input.onBehalfOf,
      scope: input.scope,
    });
  }

  throw new Error("Can quyen risk.close_high hoac responsible leader co quyen risk.close de dong high/critical risk.");
}

export async function overrideExecutiveRiskStatus(
  input: OverrideExecutiveRiskStatusInput,
  actor: PermissionUser,
  dependencies: RiskRecordServiceDependencies = {},
) {
  const repository = dependencies.repository ?? riskRecordRepository;
  const auditWriter = dependencies.auditWriter ?? createAuditLog;
  const timestamp = (dependencies.now ?? now)();
  const parsed = overrideExecutiveRiskStatusInputSchema.parse(input);
  const existing = await repository.getRiskRecord(parsed.riskId);

  if (!existing) {
    throw new Error("Khong tim thay risk/blocker can override.");
  }

  assertRiskRecordActive(existing);

  const context = await resolveMutationContext(dependencies);
  const scope = scopeFromRecord(existing);
  const delegation = await assertMutationAllowed({
    action: "risk.override",
    actor,
    context,
    delegationId: parsed.delegationId,
    dependencies,
    onBehalfOf: parsed.onBehalfOf,
    scope,
  });
  const sourceStatus = sourceStatusForRecord(existing, timestamp);
  const normalizedPatch: Partial<ExecutiveRiskRecord> = {
    delegationId: delegation.delegationId ?? existing.delegationId,
    onBehalfOf: delegation.onBehalfOf ?? existing.onBehalfOf,
    statusOverride: parsed.statusOverride,
    statusOverrideAt: timestamp,
    statusOverrideBy: actor.id,
    statusOverrideReason: parsed.reason,
    statusOverrideSourceStatus: sourceStatus,
    updatedAt: timestamp,
    updatedBy: actor.id,
  };
  const proposedRecord: ExecutiveRiskRecord = {
    ...existing,
    ...normalizedPatch,
  };
  const changedFields = changedRiskFields(existing, proposedRecord);

  if (changedFields.length === 0) {
    return existing;
  }

  const updatedRecord = await repository.updateRiskRecord(existing.id, normalizedPatch);

  try {
    await auditWriter({
      action:
        parsed.statusOverride === sourceStatus
          ? "risk.status_confirmed"
          : "risk.status_overridden",
      actorId: actor.id,
      entityId: updatedRecord.id,
      entityType: "risk",
      newValue: riskRecordAuditValue(updatedRecord, changedFields),
      oldValue: riskRecordAuditValue(existing, changedFields),
    });

    return updatedRecord;
  } catch (error) {
    try {
      await repository.updateRiskRecord(existing.id, restorePatch(existing));
    } catch (rollbackError) {
      const originalMessage = error instanceof Error ? error.message : String(error);
      const rollbackMessage =
        rollbackError instanceof Error ? rollbackError.message : String(rollbackError);

      throw new Error(`${originalMessage} Rollback risk override failed: ${rollbackMessage}`);
    }

    throw error;
  }
}

export async function closeExecutiveRiskRecord(
  input: CloseExecutiveRiskRecordInput,
  actor: PermissionUser,
  dependencies: RiskRecordServiceDependencies = {},
) {
  const repository = dependencies.repository ?? riskRecordRepository;
  const auditWriter = dependencies.auditWriter ?? createAuditLog;
  const timestamp = (dependencies.now ?? now)();
  const parsed = closeExecutiveRiskRecordInputSchema.parse(input);
  const existing = await repository.getRiskRecord(parsed.riskId);

  if (!existing) {
    throw new Error("Khong tim thay risk/blocker can dong.");
  }

  assertRiskRecordActive(existing);

  const context = await resolveMutationContext(dependencies);
  const scope = scopeFromRecord(existing);
  const delegation = await assertCloseAllowed({
    actor,
    context,
    delegationId: parsed.delegationId,
    dependencies,
    onBehalfOf: parsed.onBehalfOf,
    record: existing,
    scope,
  });
  const normalizedPatch: Partial<ExecutiveRiskRecord> = {
    closedAt: timestamp,
    closedBy: actor.id,
    closedReason: parsed.reason,
    delegationId: delegation.delegationId ?? existing.delegationId,
    onBehalfOf: delegation.onBehalfOf ?? existing.onBehalfOf,
    status: parsed.status,
    updatedAt: timestamp,
    updatedBy: actor.id,
  };
  const proposedRecord: ExecutiveRiskRecord = {
    ...existing,
    ...normalizedPatch,
  };
  const changedFields = changedRiskFields(existing, proposedRecord);
  const updatedRecord = await repository.updateRiskRecord(existing.id, normalizedPatch);

  try {
    await auditWriter({
      action: "risk.closed",
      actorId: actor.id,
      entityId: updatedRecord.id,
      entityType: "risk",
      newValue: riskRecordAuditValue(updatedRecord, changedFields),
      oldValue: riskRecordAuditValue(existing, changedFields),
    });

    return updatedRecord;
  } catch (error) {
    try {
      await repository.updateRiskRecord(existing.id, restorePatch(existing));
    } catch (rollbackError) {
      const originalMessage = error instanceof Error ? error.message : String(error);
      const rollbackMessage =
        rollbackError instanceof Error ? rollbackError.message : String(rollbackError);

      throw new Error(`${originalMessage} Rollback risk close failed: ${rollbackMessage}`);
    }

    throw error;
  }
}
