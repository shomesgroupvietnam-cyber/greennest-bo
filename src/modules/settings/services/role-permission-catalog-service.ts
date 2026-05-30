import {
  BUSINESS_APPROVAL_PERMISSIONS,
  can,
  PERMISSIONS,
  type PermissionAction,
  type PermissionUser,
} from "@/lib/permissions/can";
import {
  rolePermissionMappingInputSchema,
  roleTemplateInputSchema,
  roleTemplateRenameInputSchema,
} from "@/modules/settings/validation";
import type {
  PermissionCatalogItem,
  RolePermissionCatalog,
  RolePermissionMappingInput,
  RoleTemplate,
  RoleTemplateInput,
  RoleTemplateMutationResult,
  RoleTemplateRenameInput,
} from "@/modules/settings/types";

import {
  rolePermissionCatalogRepository,
  type RolePermissionCatalogRepository,
} from "./role-permission-catalog-repository";

function now() {
  return new Date().toISOString();
}

function assertManageCatalog(user: PermissionUser) {
  if (!can(user, "settings.manage")) {
    throw new Error("Ban khong co quyen quan ly role va permission catalog.");
  }
}

function assertKnownPermissions(permissionKeys: PermissionAction[]) {
  const unknownPermission = permissionKeys.find((permissionKey) => !PERMISSIONS.includes(permissionKey));

  if (unknownPermission) {
    throw new Error(`Permission khong hop le: ${unknownPermission}`);
  }
}

function sortPermissionKeys(permissionKeys: PermissionAction[]) {
  const order = new Map(PERMISSIONS.map((permission, index) => [permission, index]));

  return Array.from(new Set(permissionKeys)).sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
}

function hasSettingsManage(permissionKeys: readonly PermissionAction[]) {
  return permissionKeys.includes("settings.manage");
}

function hasBusinessApprovalPermission(permissionKeys: readonly PermissionAction[]) {
  return permissionKeys.some((permissionKey) =>
    (BUSINESS_APPROVAL_PERMISSIONS as readonly PermissionAction[]).includes(permissionKey),
  );
}

function assertBusinessApprovalMappingAllowed(
  roleKey: string,
  previousPermissionKeys: readonly PermissionAction[],
  nextPermissionKeys: readonly PermissionAction[],
  user: PermissionUser,
) {
  if (roleKey === "admin" && hasBusinessApprovalPermission(nextPermissionKeys)) {
    throw new Error("Role quan tri khong duoc gan quyen duyet nghiep vu.");
  }

  if (
    user.role !== "super_admin" &&
    (hasBusinessApprovalPermission(previousPermissionKeys) || hasBusinessApprovalPermission(nextPermissionKeys))
  ) {
    throw new Error("Chi super_admin duoc thay doi mapping quyen duyet nghiep vu.");
  }
}

function assertSettingsManageMappingSafe(
  roleKey: string,
  nextPermissionKeys: readonly PermissionAction[],
  user: PermissionUser,
  catalog: RolePermissionCatalog,
) {
  if (roleKey === user.role && !hasSettingsManage(nextPermissionKeys)) {
    throw new Error("Khong duoc go bo settings.manage khoi role cua phien hien tai.");
  }

  const activeManagerRoles = catalog.roles.filter((role) => {
    const permissionKeys = role.key === roleKey ? nextPermissionKeys : role.permissionKeys;

    return role.active && hasSettingsManage(permissionKeys);
  });

  if (activeManagerRoles.length === 0) {
    throw new Error("Phai giu it nhat mot role dang bat co quyen settings.manage.");
  }
}

export async function listRolePermissionCatalog(
  repository: RolePermissionCatalogRepository = rolePermissionCatalogRepository,
): Promise<RolePermissionCatalog> {
  return repository.listCatalog();
}

export function groupPermissionCatalogByModule(permissions: PermissionCatalogItem[]) {
  return permissions.reduce<Record<string, PermissionCatalogItem[]>>((groups, permission) => {
    groups[permission.module] = groups[permission.module] ?? [];
    groups[permission.module].push(permission);

    return groups;
  }, {});
}

export async function addRoleTemplate(
  input: RoleTemplateInput,
  user: PermissionUser,
  repository: RolePermissionCatalogRepository = rolePermissionCatalogRepository,
): Promise<RoleTemplateMutationResult> {
  assertManageCatalog(user);
  const parsed = roleTemplateInputSchema.parse(input);
  const existing = await repository.getRole(parsed.key);

  if (existing) {
    throw new Error("Role key da ton tai.");
  }

  assertKnownPermissions(parsed.permissionKeys);
  assertBusinessApprovalMappingAllowed(parsed.key, [], parsed.permissionKeys, user);
  const timestamp = now();
  const role: RoleTemplate = {
    key: parsed.key,
    labelVi: parsed.labelVi,
    description: parsed.description,
    scope: parsed.scope,
    active: true,
    permissionKeys: sortPermissionKeys(parsed.permissionKeys),
    createdAt: timestamp,
    updatedAt: timestamp,
    updatedBy: user.id,
  };

  return { role: await repository.upsertRole(role) };
}

export async function renameRoleTemplate(
  input: RoleTemplateRenameInput,
  user: PermissionUser,
  repository: RolePermissionCatalogRepository = rolePermissionCatalogRepository,
): Promise<RoleTemplateMutationResult> {
  assertManageCatalog(user);
  const parsed = roleTemplateRenameInputSchema.parse(input);
  const previousRole = await repository.getRole(parsed.roleKey);

  if (!previousRole) {
    throw new Error("Khong tim thay role template.");
  }

  const role = await repository.upsertRole({
    ...previousRole,
    labelVi: parsed.labelVi,
    description: parsed.description,
    updatedAt: now(),
    updatedBy: user.id,
  });

  return { role, previousRole };
}

export async function setRoleTemplateActive(
  roleKey: string,
  active: boolean,
  user: PermissionUser,
  repository: RolePermissionCatalogRepository = rolePermissionCatalogRepository,
): Promise<RoleTemplateMutationResult> {
  assertManageCatalog(user);
  const previousRole = await repository.getRole(roleKey);

  if (!previousRole) {
    throw new Error("Khong tim thay role template.");
  }

  if (!active && roleKey === user.role) {
    throw new Error("Khong duoc vo hieu hoa role quan ly cua chinh phien hien tai.");
  }

  if (!active && hasSettingsManage(previousRole.permissionKeys)) {
    const catalog = await repository.listCatalog();
    const hasOtherManagerRole = catalog.roles.some(
      (role) => role.key !== roleKey && role.active && hasSettingsManage(role.permissionKeys),
    );

    if (!hasOtherManagerRole) {
      throw new Error("Phai giu it nhat mot role dang bat co quyen settings.manage.");
    }
  }

  const role = await repository.setRoleActive(roleKey, active, user.id, now());

  return { role, previousRole };
}

export async function disableRoleTemplate(
  roleKey: string,
  user: PermissionUser,
  repository: RolePermissionCatalogRepository = rolePermissionCatalogRepository,
) {
  return setRoleTemplateActive(roleKey, false, user, repository);
}

export async function updateRolePermissionMapping(
  input: RolePermissionMappingInput,
  user: PermissionUser,
  repository: RolePermissionCatalogRepository = rolePermissionCatalogRepository,
): Promise<RoleTemplateMutationResult> {
  assertManageCatalog(user);
  const parsed = rolePermissionMappingInputSchema.parse(input);
  const previousRole = await repository.getRole(parsed.roleKey);

  if (!previousRole) {
    throw new Error("Khong tim thay role template.");
  }

  assertKnownPermissions(parsed.permissionKeys);
  const permissionKeys = sortPermissionKeys(parsed.permissionKeys);
  const catalog = await repository.listCatalog();
  assertBusinessApprovalMappingAllowed(parsed.roleKey, previousRole.permissionKeys, permissionKeys, user);
  assertSettingsManageMappingSafe(parsed.roleKey, permissionKeys, user, catalog);
  const role = await repository.replaceRolePermissions(parsed.roleKey, permissionKeys, user.id, now());

  return {
    role,
    previousRole,
    previousPermissionKeys: previousRole.permissionKeys,
  };
}
