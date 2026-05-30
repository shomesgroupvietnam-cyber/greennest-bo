import { randomUUID } from "node:crypto";

import { canAccessScopedAction } from "@/lib/permissions/access-scope";
import {
  BUSINESS_APPROVAL_PERMISSIONS,
  can,
  PERMISSIONS,
  type PermissionAction,
  type PermissionUser,
} from "@/lib/permissions/can";
import {
  projectRepository,
  type ProjectRepository,
} from "@/modules/projects/services/project-repository";
import {
  leadershipDelegationActiveInputSchema,
  leadershipDelegationInputSchema,
} from "@/modules/settings/validation";
import {
  rolePermissionCatalogRepository,
  type RolePermissionCatalogRepository,
} from "@/modules/settings/services/role-permission-catalog-repository";
import { listActiveScopeAssignments } from "@/modules/settings/services/scope-assignment-service";
import type { ScopeAssignmentRepository } from "@/modules/settings/services/scope-assignment-repository";
import type {
  DelegationAuditValue,
  DelegationResolution,
  LeadershipDelegation,
  LeadershipDelegationInput,
  LeadershipDelegationMutationResult,
  PermissionCatalogItem,
  RolePermissionCatalog,
  ScopeDimension,
} from "@/modules/settings/types";
import {
  userRepository,
  type UserRepository,
} from "@/modules/users/services/user-repository";

import {
  leadershipDelegationRepository,
  type LeadershipDelegationRepository,
} from "./leadership-delegation-repository";

type LeadershipDelegationServiceOptions = {
  repository?: LeadershipDelegationRepository;
  catalogRepository?: RolePermissionCatalogRepository;
  userRepository?: UserRepository;
  projectRepository?: ProjectRepository;
  scopeAssignmentRepository?: ScopeAssignmentRepository;
};

type DelegatedActionInput = {
  actor: PermissionUser;
  principalUserId: string;
  delegationId?: string;
  actionKey: PermissionAction;
  scope: ScopeDimension;
};

type ResolveDelegationOptions = {
  repository?: LeadershipDelegationRepository;
  catalogRepository?: RolePermissionCatalogRepository;
  now?: Date;
};

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

const explicitDeniedDelegationActions = new Set<PermissionAction>([
  ...BUSINESS_APPROVAL_PERMISSIONS,
  "settings.manage",
  "delegation.manage",
  "user.invite",
  "user.update_role",
  "audit.view",
  "proposal.configure_flow",
  "proposal.archive",
  "knowledge.manage_source_registry",
  "ai.configure",
  "ai.confirm_action",
  "project.archive",
  "project.assign_member",
  "document.archive",
  "legal.configure_template",
  "task.archive",
  "contract.archive",
]);

function now() {
  return new Date().toISOString();
}

async function assertManageDelegation(
  user: PermissionUser,
  options: Pick<
    LeadershipDelegationServiceOptions,
    "catalogRepository" | "scopeAssignmentRepository"
  > = {},
) {
  if (!can(user, "settings.manage") && !can(user, "delegation.manage")) {
    const [rolePermissionCatalog, scopeAssignments] = await Promise.all([
      (options.catalogRepository ?? rolePermissionCatalogRepository).listCatalog(),
      listActiveScopeAssignments(options.scopeAssignmentRepository),
    ]);
    const hasScopedManagement =
      canAccessScopedAction(user, "settings.manage", {}, {
        rolePermissionCatalog,
        scopeAssignments,
      }) ||
      canAccessScopedAction(user, "delegation.manage", {}, {
        rolePermissionCatalog,
        scopeAssignments,
      });

    if (!hasScopedManagement) {
      throw new Error("Ban khong co quyen quan ly delegation.");
    }
  }
}

function cleanScopeValue(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed || undefined;
}

function normalizeInput(input: LeadershipDelegationInput): LeadershipDelegationInput {
  return {
    ...input,
    organizationId: cleanScopeValue(input.organizationId),
    projectId: cleanScopeValue(input.projectId),
    axisId: cleanScopeValue(input.axisId),
    workstreamId: cleanScopeValue(input.workstreamId),
    moduleId: cleanScopeValue(input.moduleId),
    recordId: cleanScopeValue(input.recordId),
  };
}

function sortActionKeys(actionKeys: PermissionAction[]) {
  const order = new Map(PERMISSIONS.map((permission, index) => [permission, index]));

  return Array.from(new Set(actionKeys)).sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
}

function scopeSnapshot(source: ScopeDimension) {
  return {
    organizationId: source.organizationId,
    projectId: source.projectId,
    axisId: source.axisId,
    workstreamId: source.workstreamId,
    moduleId: source.moduleId,
    recordId: source.recordId,
  };
}

function hasAnyScopeDimension(source: ScopeDimension) {
  return scopeDimensionKeys.some((key) => Boolean(source[key]));
}

async function assertKnownActiveUser(userId: string, repository: UserRepository) {
  const user = await repository.getUser(userId);

  if (!user || user.status !== "active") {
    throw new Error("User khong ton tai hoac chua duoc kich hoat.");
  }
}

async function assertKnownProject(projectId: string | undefined, repository: ProjectRepository) {
  if (!projectId || projectId === "*") {
    return;
  }

  const project = await repository.getProject(projectId);

  if (!project) {
    throw new Error("Project scope khong ton tai.");
  }
}

function assertKnownModule(moduleId: string | undefined, catalog: RolePermissionCatalog) {
  if (!moduleId || moduleId === "*") {
    return;
  }

  const knownModules = new Set([
    "axis1",
    ...catalog.permissions.map((permission) => permission.module),
  ]);

  if (!knownModules.has(moduleId)) {
    throw new Error("Module scope khong ton tai trong permission catalog.");
  }
}

function findPermission(catalog: RolePermissionCatalog, key: PermissionAction) {
  return catalog.permissions.find((permission) => permission.key === key);
}

export function isDelegationActionAllowed(
  actionKey: PermissionAction,
  permission?: PermissionCatalogItem,
) {
  if (explicitDeniedDelegationActions.has(actionKey)) {
    return false;
  }

  if (permission?.sensitive) {
    return false;
  }

  return !["approve", "admin", "audit", "export"].includes(permission?.actionType ?? "");
}

export function listDelegatablePermissionCatalogItems(catalog: RolePermissionCatalog) {
  return catalog.permissions.filter((permission) =>
    isDelegationActionAllowed(permission.key, permission),
  );
}

function assertDelegatableActions(
  actionKeys: PermissionAction[],
  catalog: RolePermissionCatalog,
) {
  const unsupportedAction = actionKeys.find((actionKey) => {
    const permission = findPermission(catalog, actionKey);

    return !permission || !isDelegationActionAllowed(actionKey, permission);
  });

  if (unsupportedAction) {
    throw new Error(`Action ${unsupportedAction} khong duoc uy quyen qua delegation vi la approval/admin/export nhay cam.`);
  }
}

function delegationStatus(delegation: LeadershipDelegation, date = new Date()) {
  if (!delegation.active) {
    return "inactive" as const;
  }

  const nowMs = date.getTime();

  if (delegation.startsAt && new Date(delegation.startsAt).getTime() > nowMs) {
    return "scheduled" as const;
  }

  if (delegation.endsAt && new Date(delegation.endsAt).getTime() < nowMs) {
    return "expired" as const;
  }

  return "active" as const;
}

export function getLeadershipDelegationStatus(delegation: LeadershipDelegation, date = new Date()) {
  return delegationStatus(delegation, date);
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

function delegationMatchesScope(delegation: LeadershipDelegation, target: ScopeDimension) {
  if (!hasAnyScopeDimension(delegation)) {
    return false;
  }

  return scopeDimensionKeys.every((key) =>
    dimensionMatches(key, delegation[key], target[key]),
  );
}

function toResolution(
  delegation: LeadershipDelegation,
  actionKey: PermissionAction,
): DelegationResolution {
  return {
    delegationId: delegation.id,
    principalUserId: delegation.principalUserId,
    delegateUserId: delegation.delegateUserId,
    actionKey,
    scope: scopeSnapshot(delegation),
  };
}

export function leadershipDelegationAuditValue(
  delegation: LeadershipDelegation,
): DelegationAuditValue {
  return {
    id: delegation.id,
    principalUserId: delegation.principalUserId,
    delegateUserId: delegation.delegateUserId,
    actionKeys: delegation.actionKeys,
    active: delegation.active,
    startsAt: delegation.startsAt,
    endsAt: delegation.endsAt,
    note: delegation.note,
    ...scopeSnapshot(delegation),
  };
}

export async function listLeadershipDelegations(
  repository: LeadershipDelegationRepository = leadershipDelegationRepository,
) {
  return repository.listDelegations();
}

export async function listActiveDelegationsForDelegate(
  delegateUserId: string,
  repository: LeadershipDelegationRepository = leadershipDelegationRepository,
  date = new Date(),
) {
  const delegations = await repository.listDelegations({
    delegateUserId,
    active: true,
  });

  return delegations.filter((delegation) => delegationStatus(delegation, date) === "active");
}

export async function listActiveDelegationsForPrincipal(
  principalUserId: string,
  repository: LeadershipDelegationRepository = leadershipDelegationRepository,
  date = new Date(),
) {
  const delegations = await repository.listDelegations({
    principalUserId,
    active: true,
  });

  return delegations.filter((delegation) => delegationStatus(delegation, date) === "active");
}

export async function upsertLeadershipDelegation(
  input: LeadershipDelegationInput,
  actor: PermissionUser,
  options: LeadershipDelegationServiceOptions = {},
): Promise<LeadershipDelegationMutationResult> {
  const repository = options.repository ?? leadershipDelegationRepository;
  const catalogRepository = options.catalogRepository ?? rolePermissionCatalogRepository;
  const users = options.userRepository ?? userRepository;
  const projects = options.projectRepository ?? projectRepository;
  await assertManageDelegation(actor, {
    catalogRepository,
    scopeAssignmentRepository: options.scopeAssignmentRepository,
  });
  const parsed = leadershipDelegationInputSchema.parse(normalizeInput(input));

  if (parsed.principalUserId === parsed.delegateUserId) {
    throw new Error("Nguoi duoc uy quyen phai khac lanh dao principal.");
  }

  const catalog = await catalogRepository.listCatalog();
  assertDelegatableActions(parsed.actionKeys, catalog);

  await Promise.all([
    assertKnownActiveUser(parsed.principalUserId, users),
    assertKnownActiveUser(parsed.delegateUserId, users),
    assertKnownProject(parsed.projectId, projects),
  ]);
  assertKnownModule(parsed.moduleId, catalog);

  const previousDelegation = parsed.id
    ? await repository.getDelegation(parsed.id)
    : undefined;
  const timestamp = now();
  const delegation: LeadershipDelegation = {
    id: parsed.id ?? randomUUID(),
    principalUserId: parsed.principalUserId,
    delegateUserId: parsed.delegateUserId,
    actionKeys: sortActionKeys(parsed.actionKeys),
    organizationId: parsed.organizationId,
    projectId: parsed.projectId,
    axisId: parsed.axisId,
    workstreamId: parsed.workstreamId,
    moduleId: parsed.moduleId,
    recordId: parsed.recordId,
    active: parsed.active,
    startsAt: parsed.startsAt,
    endsAt: parsed.endsAt,
    note: parsed.note,
    createdBy: previousDelegation?.createdBy ?? actor.id,
    updatedBy: actor.id,
    createdAt: previousDelegation?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  return {
    delegation: await repository.upsertDelegation(delegation),
    previousDelegation,
  };
}

export async function setLeadershipDelegationActive(
  delegationId: string,
  active: boolean,
  actor: PermissionUser,
  options: Pick<
    LeadershipDelegationServiceOptions,
    "repository" | "catalogRepository" | "scopeAssignmentRepository"
  > = {},
): Promise<LeadershipDelegationMutationResult> {
  await assertManageDelegation(actor, options);
  leadershipDelegationActiveInputSchema.parse({ delegationId, active });
  const repository = options.repository ?? leadershipDelegationRepository;
  const previousDelegation = await repository.getDelegation(delegationId);

  if (!previousDelegation) {
    throw new Error("Khong tim thay delegation.");
  }

  return {
    delegation: await repository.setDelegationActive(delegationId, active, actor.id, now()),
    previousDelegation,
  };
}

export async function resolveDelegatedAction(
  input: DelegatedActionInput,
  options: ResolveDelegationOptions = {},
) {
  const repository = options.repository ?? leadershipDelegationRepository;
  const catalogRepository = options.catalogRepository ?? rolePermissionCatalogRepository;
  const catalog = await catalogRepository.listCatalog();
  const permission = findPermission(catalog, input.actionKey);

  if (!permission || !isDelegationActionAllowed(input.actionKey, permission)) {
    return undefined;
  }

  const delegations = await repository.listDelegations({
    delegateUserId: input.actor.id,
    principalUserId: input.principalUserId,
    active: true,
  });
  const nowDate = options.now ?? new Date();
  const matchedDelegation = delegations.find((delegation) => {
    if (input.delegationId && delegation.id !== input.delegationId) {
      return false;
    }

    return (
      delegationStatus(delegation, nowDate) === "active" &&
      delegation.actionKeys.includes(input.actionKey) &&
      delegationMatchesScope(delegation, input.scope)
    );
  });

  return matchedDelegation ? toResolution(matchedDelegation, input.actionKey) : undefined;
}

export async function assertDelegatedActionAllowed(
  input: DelegatedActionInput,
  options: ResolveDelegationOptions = {},
) {
  const resolution = await resolveDelegatedAction(input, options);

  if (!resolution) {
    throw new Error("Khong co delegation hop le cho thao tac thay mat trong scope nay.");
  }

  return resolution;
}
