import { redirect, forbidden } from "next/navigation";

import type { AppSession } from "@/lib/auth/session";
import { getCurrentSession } from "@/lib/auth/session";
import {
  can,
  normalizePermissionAction,
  type PermissionInput,
  type PermissionResource,
} from "@/lib/permissions/can";
import { canOpenBoRoute } from "@/lib/permissions/navigation-policy";
import {
  canAccessScopedAction,
  hasAnyScopedActionGrant,
} from "@/lib/permissions/access-scope";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import { listActiveScopeAssignments } from "@/modules/settings/services/scope-assignment-service";
import { createAuditLog } from "@/modules/users/services/user-service";
import {
  canAccessWorkspaceRoute,
  WORKSPACE_DEFINITIONS,
  type WorkspaceRoute,
} from "@/modules/workspaces/config";

const ACCESS_AUDIT_ENTITY_ID = "00000000-0000-0000-0000-000000000000";

type AuditAccessInput = {
  action: string;
  reason: string;
  route?: string;
  session?: AppSession;
};

async function auditAccessEvent({
  action,
  reason,
  route,
  session,
}: AuditAccessInput) {
  if (!session?.isAuthenticated || session.user.id === "anonymous") {
    return;
  }

  try {
    await createAuditLog({
      actorId: session.user.id,
      entityType: "access",
      entityId: ACCESS_AUDIT_ENTITY_ID,
      action,
      newValue: {
        route,
        reason,
        role: session.user.role,
        status: session.user.status,
      },
    });
  } catch {
    // Permission audit must never mask the original access decision.
  }
}

async function denyWithAudit(input: AuditAccessInput): Promise<never> {
  await auditAccessEvent(input);
  forbidden();
}

async function canAccessByScopeAssignment(
  session: AppSession,
  action: PermissionInput,
  resource?: PermissionResource,
) {
  const normalizedAction = normalizePermissionAction(action);

  if (!normalizedAction) {
    return false;
  }

  const [scopeAssignments, rolePermissionCatalog] = await Promise.all([
    listActiveScopeAssignments(),
    listRolePermissionCatalog(),
  ]);

  if (!resource) {
    return hasAnyScopedActionGrant(session.user, normalizedAction, {
      rolePermissionCatalog,
      scopeAssignments,
    });
  }

  const target = {
    projectId: resource?.projectId,
    recordId: resource?.id,
  };

  return canAccessScopedAction(session.user, normalizedAction, target, {
    rolePermissionCatalog,
    scopeAssignments,
  });
}

async function canAccessWorkspaceRouteByScope(
  session: AppSession,
  route: WorkspaceRoute,
) {
  const definition = WORKSPACE_DEFINITIONS[route];
  const [scopeAssignments, rolePermissionCatalog] = await Promise.all([
    listActiveScopeAssignments(),
    listRolePermissionCatalog(),
  ]);
  const routeAssignments = scopeAssignments.filter(
    (assignment) =>
      assignment.userId === session.user.id &&
      definition.roles.includes(assignment.roleKey),
  );

  return routeAssignments.some((assignment) =>
    definition.permissions.some((permission) =>
      hasAnyScopedActionGrant(session.user, permission, {
        rolePermissionCatalog,
        scopeAssignments: [assignment],
      }),
    ),
  );
}

export async function requireAuthenticatedSession(
  options: {
    allowPending?: boolean;
    route?: string;
  } = {},
) {
  const session = await getCurrentSession();

  if (!session.isAuthenticated) {
    redirect("/login?entry=1");
  }

  if (!options.allowPending && session.user.status !== "active") {
    await denyWithAudit({
      action: "access.denied",
      reason: `user_status:${session.user.status}`,
      route: options.route,
      session,
    });
  }

  return session;
}

export async function requireBoRoute(route: string, existingSession?: AppSession) {
  const session =
    existingSession ?? (await requireAuthenticatedSession({ route }));

  if (!canOpenBoRoute(session.user, route)) {
    await denyWithAudit({
      action: "access.denied",
      reason: `bo_route_forbidden:${route}`,
      route,
      session,
    });
  }

  await auditAccessEvent({
    action: "access.allowed",
    reason: "bo_route_allowed",
    route,
    session,
  });

  return session;
}

export async function requirePermission(
  action: PermissionInput,
  options: {
    resource?: PermissionResource;
    route?: string;
  } = {},
) {
  const session = await requireAuthenticatedSession({ route: options.route });

  if (
    !can(session.user, action, options.resource) &&
    !(await canAccessByScopeAssignment(session, action, options.resource))
  ) {
    await denyWithAudit({
      action: "access.denied",
      reason: `missing_permission:${action}`,
      route: options.route,
      session,
    });
  }

  return session;
}

export async function requireAnyPermission(
  actions: readonly PermissionInput[],
  options: {
    resource?: PermissionResource;
    route?: string;
  } = {},
) {
  const session = await requireAuthenticatedSession({ route: options.route });

  for (const action of actions) {
    if (
      can(session.user, action, options.resource) ||
      (await canAccessByScopeAssignment(session, action, options.resource))
    ) {
      return session;
    }
  }

  return denyWithAudit({
    action: "access.denied",
    reason: `missing_any_permission:${actions.join(",")}`,
    route: options.route,
    session,
  });
}

export async function requireWorkspaceRoute(route: WorkspaceRoute) {
  const session = await requireAuthenticatedSession({ route });

  if (
    !canAccessWorkspaceRoute(session.user, route) &&
    !(await canAccessWorkspaceRouteByScope(session, route))
  ) {
    await denyWithAudit({
      action: "access.denied",
      reason: `workspace_forbidden:${route}`,
      route,
      session,
    });
  }

  return session;
}

export async function requireAnyRole(roles: readonly string[], route: string) {
  const session = await requireAuthenticatedSession({ route });

  if (!roles.includes(session.user.role)) {
    await denyWithAudit({
      action: "access.denied",
      reason: `role_forbidden:${route}`,
      route,
      session,
    });
  }

  return session;
}

export async function recordSensitiveAccess(input: {
  action: string;
  entityId: string;
  entityType: string;
  route?: string;
}) {
  const session = await requireAuthenticatedSession({ route: input.route });

  await auditAccessEvent({
    action: input.action,
    reason: `${input.entityType}:${input.entityId}`,
    route: input.route,
    session,
  });

  return session;
}
