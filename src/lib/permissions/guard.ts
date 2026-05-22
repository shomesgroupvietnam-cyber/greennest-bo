import { redirect, forbidden } from "next/navigation";

import type { AppSession } from "@/lib/auth/session";
import type { Role } from "@/constants/roles";
import { getCurrentSession } from "@/lib/auth/session";
import {
  can,
  type PermissionInput,
  type PermissionResource,
} from "@/lib/permissions/can";
import { createAuditLog } from "@/modules/users/services/user-service";
import {
  canAccessWorkspaceRoute,
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

export async function requirePermission(
  action: PermissionInput,
  options: {
    resource?: PermissionResource;
    route?: string;
  } = {},
) {
  const session = await requireAuthenticatedSession({ route: options.route });

  if (!can(session.user, action, options.resource)) {
    await denyWithAudit({
      action: "access.denied",
      reason: `missing_permission:${action}`,
      route: options.route,
      session,
    });
  }

  return session;
}

export async function requireWorkspaceRoute(route: WorkspaceRoute) {
  const session = await requireAuthenticatedSession({ route });

  if (!canAccessWorkspaceRoute(session.user, route)) {
    await denyWithAudit({
      action: "access.denied",
      reason: `workspace_forbidden:${route}`,
      route,
      session,
    });
  }

  return session;
}

export async function requireAnyRole(roles: readonly Role[], route: string) {
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
