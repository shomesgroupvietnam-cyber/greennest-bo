import { PERMISSIONS, type PermissionAction, type PermissionUser } from "@/lib/permissions/can";
import { hasAnyScopedActionGrant } from "@/lib/permissions/access-scope";
import { buildDelegatedPermissionsForPolicy } from "@/lib/permissions/navigation-policy-context";
import { isPolicyWorkspaceHref } from "@/lib/permissions/navigation-policy";
import {
  getPermittedNavItems,
  type NavigationAccessContext,
  type NavigationItem,
  type ShellContext,
} from "@/lib/permissions/navigation";
import { listActiveDelegationsForDelegate } from "@/modules/settings/services/leadership-delegation-service";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import { listActiveScopeAssignments } from "@/modules/settings/services/scope-assignment-service";
import type {
  LeadershipDelegation,
  RolePermissionCatalog,
  ScopeAssignment,
} from "@/modules/settings/types";
import {
  WORKSPACE_DEFINITIONS,
  type WorkspaceRoute,
} from "@/modules/workspaces/config";

function stripQuery(href: string) {
  return href.split("?")[0];
}

function currentHref(pathname: string, search: string) {
  return `${pathname}${search}`;
}

function withQuery(
  pathname: string,
  search: string,
  updates: Record<string, string | undefined>,
) {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  for (const [key, value] of Object.entries(updates)) {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  }

  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname;
}

function hrefWithCurrentScope(href: string, search: string) {
  const currentParams = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const scopeId = currentParams.get("scopeId");

  if (!scopeId) {
    return href;
  }

  const [pathname, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("scopeId", scopeId);

  return `${pathname}?${params.toString()}`;
}

function findCurrentWorkspace(
  workspaceOptions: Array<{ href: string; label: string }>,
  pathname: string,
  search: string,
) {
  const current = currentHref(pathname, search);
  const exactMatch = workspaceOptions.find((item) => item.href === current);

  if (exactMatch) {
    return exactMatch.label;
  }

  return workspaceOptions.find(
    (item) => !item.href.includes("?") && stripQuery(item.href) === pathname,
  )?.label;
}

function formatScopeAssignment(assignment: ScopeAssignment) {
  const dimensions = [
    assignment.organizationId ? `org:${assignment.organizationId}` : undefined,
    assignment.projectId ? `project:${assignment.projectId}` : undefined,
    assignment.axisId ? `axis:${assignment.axisId}` : undefined,
    assignment.workstreamId ? `workstream:${assignment.workstreamId}` : undefined,
    assignment.moduleId ? `module:${assignment.moduleId}` : undefined,
  ].filter(Boolean);

  return dimensions.length > 0
    ? `${assignment.roleKey} - ${dimensions.join(" / ")}`
    : `${assignment.roleKey} - toan he thong`;
}

function buildScopedPermissions(
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

function buildScopedWorkspaceRoutes(
  user: PermissionUser,
  scopeAssignments: ScopeAssignment[],
  rolePermissionCatalog: RolePermissionCatalog,
) {
  return Object.values(WORKSPACE_DEFINITIONS)
    .filter((definition) =>
      scopeAssignments.some(
        (assignment) =>
          assignment.userId === user.id &&
          definition.roles.includes(assignment.roleKey) &&
          definition.permissions.some((permission) =>
            hasAnyScopedActionGrant(user, permission, {
              rolePermissionCatalog,
              scopeAssignments: [assignment],
            }),
          ),
      ),
    )
    .map((definition) => definition.route satisfies WorkspaceRoute);
}

function buildDelegatedPermissions(
  delegations: LeadershipDelegation[],
  selectedScopeAssignments: ScopeAssignment[],
  selectedScopeId?: string,
) {
  return buildDelegatedPermissionsForPolicy(
    delegations,
    selectedScopeAssignments,
    selectedScopeId,
  );
}

export function selectScopeAssignmentsForUser(
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

  return scopeAssignments.filter(
    (assignment) =>
      assignment.userId === user.id && assignment.id === selectedScopeId,
  );
}

function buildShellContext(input: {
  defaultWorkspaceLabel: string;
  navItems: NavigationItem[];
  pathname: string;
  scopeAssignments: ScopeAssignment[];
  search: string;
  selectedScopeId?: string;
  user: PermissionUser;
}): ShellContext {
  const workspaceOptions = input.navItems
    .filter((item) => isPolicyWorkspaceHref(item.href))
    .map((item) => ({
      href: hrefWithCurrentScope(item.href, input.search),
      label: item.label,
    }));
  const currentWorkspace =
    findCurrentWorkspace(workspaceOptions, input.pathname, input.search) ??
    input.defaultWorkspaceLabel;
  const userScopeAssignments = input.scopeAssignments.filter(
    (assignment) => assignment.userId === input.user.id,
  );
  const scopeOptions = [
    {
      href: withQuery(input.pathname, input.search, { scopeId: undefined }),
      id: "all",
      label: "Tat ca pham vi duoc cap",
    },
    ...userScopeAssignments.map((assignment) => ({
      href: withQuery(input.pathname, input.search, { scopeId: assignment.id }),
      id: assignment.id,
      label: formatScopeAssignment(assignment),
    })),
  ];
  const selectedScope = userScopeAssignments.find(
    (assignment) => assignment.id === input.selectedScopeId,
  );

  return {
    currentScopeLabel: selectedScope
      ? formatScopeAssignment(selectedScope)
      : "Tat ca pham vi duoc cap",
    currentWorkspaceLabel: currentWorkspace,
    scopeOptions,
    workspaceOptions,
  };
}

export async function getNavigationShellData(input: {
  defaultWorkspaceLabel: string;
  pathname: string;
  search?: string | null;
  selectedScopeId?: string;
  user: PermissionUser;
}) {
  const [scopeAssignments, rolePermissionCatalog, delegations] = await Promise.all([
    listActiveScopeAssignments(),
    listRolePermissionCatalog(),
    listActiveDelegationsForDelegate(input.user.id),
  ]);
  const selectedScopeAssignments = selectScopeAssignmentsForUser(
    input.user,
    scopeAssignments,
    input.selectedScopeId,
  );
  const accessContext: NavigationAccessContext = {
    delegatedPermissions: buildDelegatedPermissions(
      delegations,
      selectedScopeAssignments,
      input.selectedScopeId,
    ),
    scopedPermissions: buildScopedPermissions(
      input.user,
      selectedScopeAssignments,
      rolePermissionCatalog,
    ),
    scopedWorkspaceRoutes: buildScopedWorkspaceRoutes(
      input.user,
      selectedScopeAssignments,
      rolePermissionCatalog,
    ),
  };
  const navItems = getPermittedNavItems(input.user, accessContext);
  const search = input.search ?? "";

  return {
    navItems,
    rolePermissionCatalog,
    scopeAssignments,
    selectedScopeAssignments,
    shellContext: buildShellContext({
      defaultWorkspaceLabel: input.defaultWorkspaceLabel,
      navItems,
      pathname: input.pathname,
      scopeAssignments,
      search,
      selectedScopeId: input.selectedScopeId,
      user: input.user,
    }),
  };
}
