import { can, PERMISSIONS, type PermissionAction, type PermissionUser } from "@/lib/permissions/can";
import {
  projectRepository,
  type ProjectRepository,
} from "@/modules/projects/services/project-repository";
import {
  rolePermissionCatalogRepository,
  type RolePermissionCatalogRepository,
} from "@/modules/settings/services/role-permission-catalog-repository";
import {
  scopeAssignmentCreateInputSchema,
  scopeAssignmentUpdateInputSchema,
} from "@/modules/settings/validation";
import type {
  ScopeAssignment,
  ScopeAssignmentInput,
  ScopeAssignmentMutationResult,
  RolePermissionCatalog,
} from "@/modules/settings/types";
import { listUsers } from "@/modules/users/services/user-service";
import {
  userRepository,
  type UserRepository,
} from "@/modules/users/services/user-repository";

import {
  scopeAssignmentRepository,
  type ScopeAssignmentRepository,
} from "./scope-assignment-repository";

type ScopeAssignmentServiceOptions = {
  repository?: ScopeAssignmentRepository;
  catalogRepository?: RolePermissionCatalogRepository;
  userRepository?: UserRepository;
  projectRepository?: ProjectRepository;
};

const scopeDimensionKeys = [
  "organizationId",
  "projectId",
  "axisId",
  "workstreamId",
  "moduleId",
  "recordId",
] as const;

function createId() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

function assertManageScopeAssignment(user: PermissionUser) {
  if (!can(user, "settings.manage")) {
    throw new Error("Ban khong co quyen quan ly scope assignment.");
  }
}

function sortPermissionKeys(permissionKeys: PermissionAction[]) {
  const order = new Map(PERMISSIONS.map((permission, index) => [permission, index]));

  return Array.from(new Set(permissionKeys)).sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
}

function cleanScopeValue(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed || undefined;
}

function normalizeInput(input: ScopeAssignmentInput) {
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

async function assertKnownUser(userId: string, repository: UserRepository) {
  const users = await listUsers(repository);
  const user = users.find((item) => item.id === userId);

  if (!user) {
    throw new Error("User khong ton tai hoac chua duoc kich hoat.");
  }
}

async function assertKnownRoleAndPermissions(
  roleKey: string,
  permissionKeys: PermissionAction[],
  repository: RolePermissionCatalogRepository,
) {
  const catalog = await repository.listCatalog();
  const role = catalog.roles.find((item) => item.key === roleKey);

  if (!role?.active) {
    throw new Error("Role khong ton tai hoac da bi vo hieu hoa.");
  }

  const unsupportedPermission = permissionKeys.find(
    (permissionKey) =>
      !can(
        {
          id: "",
          role: String(role.key),
          permissions: role.permissionKeys,
          permissionsMode: "replace",
        },
        permissionKey,
      ),
  );

  if (unsupportedPermission) {
    throw new Error(
      `Permission ${unsupportedPermission} khong thuoc role ${roleKey}.`,
    );
  }

  return catalog;
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

function assignmentScopeSnapshot(assignment: ScopeAssignment) {
  return {
    scopeType: assignment.scopeType,
    organizationId: assignment.organizationId,
    projectId: assignment.projectId,
    axisId: assignment.axisId,
    workstreamId: assignment.workstreamId,
    moduleId: assignment.moduleId,
    recordId: assignment.recordId,
  };
}

export function getScopeAssignmentStatus(assignment: ScopeAssignment, date = new Date()) {
  if (!assignment.active) {
    return "inactive" as const;
  }

  const nowMs = date.getTime();

  if (assignment.startsAt && new Date(assignment.startsAt).getTime() > nowMs) {
    return "scheduled" as const;
  }

  if (assignment.endsAt && new Date(assignment.endsAt).getTime() < nowMs) {
    return "expired" as const;
  }

  return "active" as const;
}

export function scopeAssignmentAuditValue(assignment: ScopeAssignment) {
  return {
    id: assignment.id,
    userId: assignment.userId,
    roleKey: assignment.roleKey,
    permissionKeys: assignment.permissionKeys,
    active: assignment.active,
    startsAt: assignment.startsAt,
    endsAt: assignment.endsAt,
    ...assignmentScopeSnapshot(assignment),
  };
}

export async function listScopeAssignments(
  repository: ScopeAssignmentRepository = scopeAssignmentRepository,
) {
  return repository.listAssignments();
}

export async function listActiveScopeAssignments(
  repository: ScopeAssignmentRepository = scopeAssignmentRepository,
) {
  return repository.listAssignments({ active: true });
}

export async function createScopeAssignment(
  input: ScopeAssignmentInput,
  actor: PermissionUser,
  options: ScopeAssignmentServiceOptions = {},
): Promise<ScopeAssignmentMutationResult> {
  assertManageScopeAssignment(actor);
  const repository = options.repository ?? scopeAssignmentRepository;
  const catalogRepository = options.catalogRepository ?? rolePermissionCatalogRepository;
  const users = options.userRepository ?? userRepository;
  const projects = options.projectRepository ?? projectRepository;
  const parsed = scopeAssignmentCreateInputSchema.parse(normalizeInput(input));

  const [, catalog] = await Promise.all([
    assertKnownUser(parsed.userId, users),
    assertKnownRoleAndPermissions(parsed.roleKey, parsed.permissionKeys, catalogRepository),
    assertKnownProject(parsed.projectId, projects),
  ]);
  assertKnownModule(parsed.moduleId, catalog);

  const timestamp = now();
  const assignment: ScopeAssignment = {
    id: createId(),
    userId: parsed.userId,
    roleKey: parsed.roleKey,
    permissionKeys: sortPermissionKeys(parsed.permissionKeys),
    scopeType: parsed.scopeType,
    organizationId: parsed.organizationId,
    projectId: parsed.projectId,
    axisId: parsed.axisId,
    workstreamId: parsed.workstreamId,
    moduleId: parsed.moduleId,
    recordId: parsed.recordId,
    active: parsed.active,
    startsAt: parsed.startsAt,
    endsAt: parsed.endsAt,
    createdBy: actor.id,
    updatedBy: actor.id,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return {
    assignment: await repository.upsertAssignment(assignment),
  };
}

export async function updateScopeAssignment(
  assignmentId: string,
  input: ScopeAssignmentInput,
  actor: PermissionUser,
  options: ScopeAssignmentServiceOptions = {},
): Promise<ScopeAssignmentMutationResult> {
  assertManageScopeAssignment(actor);
  const repository = options.repository ?? scopeAssignmentRepository;
  const catalogRepository = options.catalogRepository ?? rolePermissionCatalogRepository;
  const users = options.userRepository ?? userRepository;
  const projects = options.projectRepository ?? projectRepository;
  const previousAssignment = await repository.getAssignment(assignmentId);

  if (!previousAssignment) {
    throw new Error("Khong tim thay scope assignment.");
  }

  const parsed = scopeAssignmentUpdateInputSchema.parse(normalizeInput(input));

  const [, catalog] = await Promise.all([
    assertKnownUser(parsed.userId, users),
    assertKnownRoleAndPermissions(parsed.roleKey, parsed.permissionKeys, catalogRepository),
    assertKnownProject(parsed.projectId, projects),
  ]);
  assertKnownModule(parsed.moduleId, catalog);

  const assignment: ScopeAssignment = {
    ...previousAssignment,
    userId: parsed.userId,
    roleKey: parsed.roleKey,
    permissionKeys: sortPermissionKeys(parsed.permissionKeys),
    scopeType: parsed.scopeType,
    organizationId: parsed.organizationId,
    projectId: parsed.projectId,
    axisId: parsed.axisId,
    workstreamId: parsed.workstreamId,
    moduleId: parsed.moduleId,
    recordId: parsed.recordId,
    active: parsed.active,
    startsAt: parsed.startsAt,
    endsAt: parsed.endsAt,
    updatedBy: actor.id,
    updatedAt: now(),
  };

  if (isCurrentManagementAssignment(previousAssignment, actor) && !isCurrentManagementAssignment(assignment, actor)) {
    throw new Error("Khong duoc cap nhat assignment settings.manage lam mat quyen quan tri phien hien tai.");
  }

  return {
    assignment: await repository.upsertAssignment(assignment),
    previousAssignment,
  };
}

function isCurrentManagementAssignment(assignment: ScopeAssignment, actor: PermissionUser) {
  return (
    assignment.userId === actor.id &&
    assignment.active &&
    assignment.permissionKeys.includes("settings.manage")
  );
}

export async function disableScopeAssignment(
  assignmentId: string,
  actor: PermissionUser,
  options: Pick<ScopeAssignmentServiceOptions, "repository"> = {},
): Promise<ScopeAssignmentMutationResult> {
  assertManageScopeAssignment(actor);
  const repository = options.repository ?? scopeAssignmentRepository;
  const previousAssignment = await repository.getAssignment(assignmentId);

  if (!previousAssignment) {
    throw new Error("Khong tim thay scope assignment.");
  }

  if (isCurrentManagementAssignment(previousAssignment, actor)) {
    throw new Error("Khong duoc vo hieu hoa assignment settings.manage cua phien quan tri hien tai.");
  }

  return {
    assignment: await repository.disableAssignment(assignmentId, actor.id, now()),
    previousAssignment,
  };
}

export function scopeAssignmentHasAnyDimension(assignment: ScopeAssignment) {
  return scopeDimensionKeys.some((key) => Boolean(assignment[key]));
}
