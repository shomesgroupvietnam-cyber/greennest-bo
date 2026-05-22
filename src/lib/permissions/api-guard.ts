import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/session";
import {
  can,
  type PermissionInput,
  type PermissionResource,
} from "@/lib/permissions/can";
import { createAuditLog } from "@/modules/users/services/user-service";

const ACCESS_AUDIT_ENTITY_ID = "00000000-0000-0000-0000-000000000000";

export async function requireApiPermission(
  action: PermissionInput,
  options: {
    resource?: PermissionResource;
    route?: string;
  } = {},
) {
  const session = await getCurrentSession();

  if (!session.isAuthenticated) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session,
    };
  }

  if (
    session.user.status !== "active" ||
    !can(session.user, action, options.resource)
  ) {
    try {
      await createAuditLog({
        actorId: session.user.id,
        entityType: "access",
        entityId: ACCESS_AUDIT_ENTITY_ID,
        action: "access.denied",
        newValue: {
          permission: action,
          route: options.route,
          role: session.user.role,
          status: session.user.status,
        },
      });
    } catch {
      // API authorization must keep returning the intended 403 response.
    }

    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session,
    };
  }

  return { error: undefined, session };
}
