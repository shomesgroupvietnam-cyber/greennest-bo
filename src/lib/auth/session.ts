import {
  ROLE_DEFAULT_SCREENS,
  getDefaultScreenForRole,
  isKnownRole,
  type Role,
} from "@/constants/roles";
import {
  getMockResolvedSession,
  resolveMockRole,
} from "@/lib/auth/mock-session";
import {
  createSupabaseServerClient,
  isSupabaseAuthConfigured,
} from "@/lib/auth/supabase-server";
import { getRolePermissions } from "@/lib/permissions/can";
import type { PermissionAction } from "@/lib/permissions/can";
import { getUserByEmail } from "@/modules/users/services/user-service";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import { cookies } from "next/headers";

export type AuthMode = "mock" | "supabase";

export type AppSessionUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: "pending" | "active" | "suspended";
  avatarUrl?: string;
  permissions?: PermissionAction[];
  permissionsMode?: "additive" | "replace";
  roleActive?: boolean;
};

export type AppSession = {
  mode: AuthMode;
  user: AppSessionUser;
  permissions: PermissionAction[];
  defaultScreen: { label: string; href: string };
  isAuthenticated: boolean;
  isFallback: boolean;
};

export function getAuthMode(): AuthMode {
  return isSupabaseAuthConfigured() ? "supabase" : "mock";
}

async function resolveCatalogRole(role: string, status: AppSessionUser["status"]) {
  const fallbackDefaultScreen = getDefaultScreenForRole(role);

  if (status !== "active") {
    return {
      permissions: [] as PermissionAction[],
      defaultScreen: fallbackDefaultScreen,
      roleActive: false,
    };
  }

  try {
    const catalog = await listRolePermissionCatalog();
    const roleTemplate = catalog.roles.find((item) => item.key === role);

    if (!roleTemplate?.active) {
      return {
        permissions: [] as PermissionAction[],
        defaultScreen: fallbackDefaultScreen,
        roleActive: false,
      };
    }

    return {
      permissions: roleTemplate.permissionKeys,
      defaultScreen:
        roleTemplate.defaultScreenHref && roleTemplate.defaultScreenLabel
          ? {
              label: roleTemplate.defaultScreenLabel,
              href: roleTemplate.defaultScreenHref,
            }
          : fallbackDefaultScreen,
      roleActive: true,
    };
  } catch {
    const roleActive = isKnownRole(role);

    return {
      permissions: roleActive ? getRolePermissions(role) : ([] as PermissionAction[]),
      defaultScreen: fallbackDefaultScreen,
      roleActive,
    };
  }
}

async function fromMockSession(mode: AuthMode = "mock", role?: Role): Promise<AppSession> {
  const session = getMockResolvedSession(role);
  const status: AppSessionUser["status"] = session.user.role === "pending" ? "pending" : "active";
  const resolvedRole = await resolveCatalogRole(session.user.role, status);
  const user = {
    ...session.user,
    status,
    permissions: resolvedRole.permissions,
    permissionsMode: "replace" as const,
    roleActive: resolvedRole.roleActive,
  };

  return {
    mode,
    user,
    permissions: resolvedRole.permissions,
    defaultScreen: resolvedRole.defaultScreen,
    isAuthenticated: true,
    isFallback: true,
  };
}

async function getMockRoleCookie() {
  try {
    const cookieStore = await cookies();

    return cookieStore.get("greennest_mock_role")?.value;
  } catch {
    return undefined;
  }
}

function anonymousSupabaseSession(): AppSession {
  const role: Role = "pending";

  return {
    mode: "supabase",
    user: {
      id: "anonymous",
      fullName: "Chưa đăng nhập",
      email: "",
      role,
      status: "pending",
    },
    permissions: [],
    defaultScreen: ROLE_DEFAULT_SCREENS[role],
    isAuthenticated: false,
    isFallback: false,
  };
}

export async function getCurrentSession(): Promise<AppSession> {
  if (!isSupabaseAuthConfigured()) {
    const cookieRole = await getMockRoleCookie();

    return await fromMockSession(
      "mock",
      cookieRole ? resolveMockRole(cookieRole) : undefined,
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return anonymousSupabaseSession();
  }

  const appUser = await getUserByEmail(user.email);
  const role = appUser?.role ?? "pending";
  const status = appUser?.status ?? "pending";
  const resolvedRole = await resolveCatalogRole(role, status);
  const sessionUser: AppSessionUser = {
    id: appUser?.id ?? user.id,
    fullName:
      appUser?.fullName ?? String(user.user_metadata?.full_name ?? user.email),
    email: user.email,
    role,
    status,
    avatarUrl: appUser?.avatarUrl,
    permissions: resolvedRole.permissions,
    permissionsMode: "replace",
    roleActive: resolvedRole.roleActive,
  };

  return {
    mode: "supabase",
    user: sessionUser,
    permissions: resolvedRole.permissions,
    defaultScreen: resolvedRole.defaultScreen,
    isAuthenticated: true,
    isFallback: false,
  };
}

export async function getCurrentUser() {
  const session = await getCurrentSession();

  return session.user;
}

export function getClientFallbackSession() {
  const session = getMockResolvedSession();

  return {
    mode: getAuthMode(),
    permissions: session.permissions,
    defaultScreen: session.defaultScreen,
    user: {
      ...session.user,
      status: "active" as const,
      permissions: session.permissions,
      permissionsMode: "replace" as const,
      roleActive: true,
    },
    isAuthenticated: true,
    isFallback: true,
  };
}
