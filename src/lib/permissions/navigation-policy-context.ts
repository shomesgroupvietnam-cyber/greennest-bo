import {
  PERMISSIONS,
  type PermissionAction,
  type PermissionUser,
} from "@/lib/permissions/can";
import { hasAnyScopedActionGrant } from "@/lib/permissions/access-scope";
import type { CommandCenterAccessContext } from "@/lib/permissions/navigation-policy";
import { listActiveDelegationsForDelegate } from "@/modules/settings/services/leadership-delegation-service";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import { listActiveScopeAssignments } from "@/modules/settings/services/scope-assignment-service";
import type {
  LeadershipDelegation,
  RolePermissionCatalog,
  ScopeAssignment,
} from "@/modules/settings/types";

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

function selectScopeAssignmentsForPolicy(
  user: PermissionUser,
  scopeAssignments: ScopeAssignment[],
  selectedScopeId?: string,
) {
  const userAssignments = scopeAssignments.filter(
    (assignment) => assignment.userId === user.id,
  );

  if (!selectedScopeId || selectedScopeId === "all") {
    return userAssignments;
  }

  return userAssignments.filter((assignment) => assignment.id === selectedScopeId);
}

function buildScopedPermissionsForPolicy(
  user: PermissionUser,
  scopeAssignments: ScopeAssignment[],
  rolePermissionCatalog: RolePermissionCatalog,
) {
  return PERMISSIONS.filter((permission): permission is PermissionAction =>
    hasAnyScopedActionGrant(user, permission, {
      rolePermissionCatalog,
      scopeAssignments,
    }),
  );
}

function normalizeScopeDimension(
  key: (typeof scopeDimensionKeys)[number],
  value: string,
) {
  return key === "axisId" ? (axisAliases.get(value) ?? value) : value;
}

function scopeDimensionMatches(
  key: (typeof scopeDimensionKeys)[number],
  delegationValue?: string,
  assignmentValue?: string,
) {
  if (!delegationValue) {
    return true;
  }

  if (!assignmentValue) {
    return false;
  }

  if (delegationValue === "*" || assignmentValue === "*") {
    return true;
  }

  return (
    normalizeScopeDimension(key, delegationValue) ===
    normalizeScopeDimension(key, assignmentValue)
  );
}

function delegationHasScopeDimension(delegation: LeadershipDelegation) {
  return scopeDimensionKeys.some((key) => Boolean(delegation[key]));
}

function delegationMatchesSelectedAssignment(
  delegation: LeadershipDelegation,
  assignment: ScopeAssignment,
) {
  if (!delegationHasScopeDimension(delegation)) {
    return false;
  }

  return scopeDimensionKeys.every((key) =>
    scopeDimensionMatches(key, delegation[key], assignment[key]),
  );
}

function selectDelegationsForPolicy(
  delegations: LeadershipDelegation[],
  selectedScopeAssignments: ScopeAssignment[],
  selectedScopeId?: string,
) {
  if (!selectedScopeId || selectedScopeId === "all") {
    return delegations;
  }

  return delegations.filter((delegation) =>
    selectedScopeAssignments.some((assignment) =>
      delegationMatchesSelectedAssignment(delegation, assignment),
    ),
  );
}

export function buildDelegatedPermissionsForPolicy(
  delegations: LeadershipDelegation[],
  selectedScopeAssignments: ScopeAssignment[],
  selectedScopeId?: string,
) {
  const relevantDelegations = selectDelegationsForPolicy(
    delegations,
    selectedScopeAssignments,
    selectedScopeId,
  );

  return [...new Set(relevantDelegations.flatMap((delegation) => delegation.actionKeys))];
}

export function buildDelegatedScopeAssignmentsForPolicy(
  user: PermissionUser,
  delegations: LeadershipDelegation[],
  selectedScopeAssignments: ScopeAssignment[] = [],
  selectedScopeId?: string,
) {
  return selectDelegationsForPolicy(
    delegations,
    selectedScopeAssignments,
    selectedScopeId,
  ).map(
    (delegation): ScopeAssignment => ({
      active: true,
      createdAt: delegation.createdAt,
      endsAt: delegation.endsAt,
      id: `delegation-${delegation.id}`,
      organizationId: delegation.organizationId,
      permissionKeys: delegation.actionKeys,
      projectId: delegation.projectId,
      axisId: delegation.axisId,
      workstreamId: delegation.workstreamId,
      moduleId: delegation.moduleId,
      recordId: delegation.recordId,
      roleKey: "giam_doc_du_an",
      scopeType: "scoped",
      startsAt: delegation.startsAt,
      updatedAt: delegation.updatedAt,
      userId: user.id,
    }),
  );
}

export async function getCommandCenterAccessContext(
  user: PermissionUser,
  selectedScopeId?: string,
): Promise<CommandCenterAccessContext> {
  const [scopeAssignments, rolePermissionCatalog, delegations] = await Promise.all([
    listActiveScopeAssignments(),
    listRolePermissionCatalog(),
    listActiveDelegationsForDelegate(user.id),
  ]);
  const selectedScopeAssignments = selectScopeAssignmentsForPolicy(
    user,
    scopeAssignments,
    selectedScopeId,
  );

  return {
    delegatedPermissions: buildDelegatedPermissionsForPolicy(
      delegations,
      selectedScopeAssignments,
      selectedScopeId,
    ),
    delegatedScopeAssignments: buildDelegatedScopeAssignmentsForPolicy(
      user,
      delegations,
      selectedScopeAssignments,
      selectedScopeId,
    ),
    scopedPermissions: buildScopedPermissionsForPolicy(
      user,
      selectedScopeAssignments,
      rolePermissionCatalog,
    ),
  };
}
