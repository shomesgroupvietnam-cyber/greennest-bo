import { ROLE_DEFAULT_SCREENS, type Role } from "@/constants/roles";
import { getMockResolvedSession, resolveMockRole } from "@/lib/auth/mock-session";
import { createSupabaseServerClient, isSupabaseAuthConfigured } from "@/lib/auth/supabase-server";
import { getRolePermissions } from "@/lib/permissions/can";
import { getUserByEmail } from "@/modules/users/services/user-service";
import { cookies } from "next/headers";

export type AuthMode = "mock" | "supabase";

export type AppSessionUser = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl?: string;
};

export type AppSession = {
  mode: AuthMode;
  user: AppSessionUser;
  permissions: ReturnType<typeof getRolePermissions>;
  defaultScreen: (typeof ROLE_DEFAULT_SCREENS)[Role];
  isAuthenticated: boolean;
  isFallback: boolean;
};

export function getAuthMode(): AuthMode {
  return isSupabaseAuthConfigured() ? "supabase" : "mock";
}

function fromMockSession(mode: AuthMode = "mock", role?: Role): AppSession {
  const session = getMockResolvedSession(role);

  return {
    mode,
    user: session.user,
    permissions: session.permissions,
    defaultScreen: session.defaultScreen,
    isAuthenticated: true,
    isFallback: true
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
  const role: Role = "viewer";

  return {
    mode: "supabase",
    user: {
      id: "anonymous",
      fullName: "Chưa đăng nhập",
      email: "",
      role
    },
    permissions: getRolePermissions(role),
    defaultScreen: ROLE_DEFAULT_SCREENS[role],
    isAuthenticated: false,
    isFallback: false
  };
}

export async function getCurrentSession(): Promise<AppSession> {
  if (!isSupabaseAuthConfigured()) {
    const cookieRole = await getMockRoleCookie();

    return fromMockSession("mock", cookieRole ? resolveMockRole(cookieRole) : undefined);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return anonymousSupabaseSession();
  }

  const appUser = await getUserByEmail(user.email);
  const role = appUser?.role ?? resolveMockRole(String(user.user_metadata?.role ?? user.app_metadata?.role ?? "viewer"));
  const sessionUser: AppSessionUser = {
    id: appUser?.id ?? user.id,
    fullName: appUser?.fullName ?? String(user.user_metadata?.full_name ?? user.email),
    email: user.email,
    role,
    avatarUrl: appUser?.avatarUrl
  };

  return {
    mode: "supabase",
    user: sessionUser,
    permissions: getRolePermissions(role),
    defaultScreen: ROLE_DEFAULT_SCREENS[role],
    isAuthenticated: true,
    isFallback: false
  };
}

export async function getCurrentUser() {
  const session = await getCurrentSession();

  return session.user;
}

export function getClientFallbackSession() {
  return fromMockSession(getAuthMode());
}
