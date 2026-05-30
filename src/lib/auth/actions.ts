"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { resolveMockRole } from "@/lib/auth/mock-session";
import {
  createSupabaseServerClient,
  isSupabaseAuthConfigured,
} from "@/lib/auth/supabase-server";
import { getCurrentSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { canAccessWorkspaceRoute } from "@/modules/workspaces/config";
import { createAuditLog } from "@/modules/users/services/user-service";

const COMMAND_CENTER_ROLES = ["super_admin", "admin"] as const;
const EXECUTIVE_LANDING_ROLES = [
  "tong_giam_doc",
  "pho_tong_giam_doc",
] as const;
const OPERATIONAL_OWNER_ROLES = [
  "super_admin",
  "tong_giam_doc",
  "pho_tong_giam_doc",
] as const;
const MOCK_ROLE_COOKIE_NAME = "greennest_mock_role";

async function auditAuthEvent(
  session: Awaited<ReturnType<typeof getCurrentSession>>,
  action: string,
) {
  if (!session.isAuthenticated || session.user.id === "anonymous") {
    return;
  }

  try {
    await createAuditLog({
      actorId: session.user.id,
      entityType: "auth",
      entityId: "00000000-0000-0000-0000-000000000000",
      action,
      newValue: {
        email: session.user.email,
        role: session.user.role,
        status: session.user.status,
      },
    });
  } catch {
    // Auth flow must not fail because audit persistence is unavailable.
  }
}

function resolvePostLoginHref(
  next: string,
  session: Awaited<ReturnType<typeof getCurrentSession>>,
) {
  if (session.user.status !== "active") {
    return "/pending-access";
  }

  if (next === "development") {
    if (
      EXECUTIVE_LANDING_ROLES.includes(
        session.user.role as (typeof EXECUTIVE_LANDING_ROLES)[number],
      )
    ) {
      return "/command-center?view=executive-dashboard";
    }

    if (
      COMMAND_CENTER_ROLES.includes(
        session.user.role as (typeof COMMAND_CENTER_ROLES)[number],
      )
    ) {
      return "/command-center";
    }

    if (canAccessWorkspaceRoute(session.user, "/executive")) {
      return "/command-center?view=executive-dashboard";
    }

    if (canAccessWorkspaceRoute(session.user, "/investment-workspace")) {
      return "/investment-workspace";
    }

    if (canAccessWorkspaceRoute(session.user, "/legal-workspace")) {
      return "/legal-workspace";
    }

    if (canAccessWorkspaceRoute(session.user, "/design-workspace")) {
      return "/design-workspace";
    }

    if (canAccessWorkspaceRoute(session.user, "/technical-workspace")) {
      return "/technical-workspace";
    }

    if (can(session.user, "proposal.view")) {
      return "/proposals";
    }

    if (can(session.user, "project.view")) {
      return "/dashboard";
    }
  }

  if (next === "delivery") {
    if (canAccessWorkspaceRoute(session.user, "/project-workbench")) {
      return "/project-workbench";
    }

    if (can(session.user, "project.view")) {
      return "/dashboard";
    }
  }

  if (next === "operations") {
    if (
      OPERATIONAL_OWNER_ROLES.includes(
        session.user.role as (typeof OPERATIONAL_OWNER_ROLES)[number],
      )
    ) {
      return "/command-center?view=operations-dashboard";
    }

    if (canAccessWorkspaceRoute(session.user, "/admin")) {
      return "/admin";
    }

    if (canAccessWorkspaceRoute(session.user, "/assistant-workspace")) {
      return "/assistant-workspace";
    }

    if (can(session.user, "report.view")) {
      return "/reports";
    }
  }

  return session.defaultScreen.href;
}

function loginErrorHref(next: string) {
  const nextParam = next ? `&next=${encodeURIComponent(next)}` : "";

  return `/login?entry=1${nextParam}&error=1`;
}

export async function loginAction(formData: FormData) {
  const next = String(formData.get("next") ?? "");

  if (!isSupabaseAuthConfigured()) {
    const mockRole = formData.get("mockRole");

    if (typeof mockRole === "string" && mockRole) {
      const cookieStore = await cookies();

      cookieStore.set(MOCK_ROLE_COOKIE_NAME, resolveMockRole(mockRole), {
        path: "/",
        sameSite: "lax",
      });
    }

    const session = await getCurrentSession();
    await auditAuthEvent(session, "auth.login");
    redirect(resolvePostLoginHref(next, session));
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(loginErrorHref(next));
  }

  const session = await getCurrentSession();
  await auditAuthEvent(session, "auth.login");
  redirect(resolvePostLoginHref(next, session));
}

export async function logoutAction() {
  const session = await getCurrentSession();
  await auditAuthEvent(session, "auth.logout");

  const cookieStore = await cookies();
  cookieStore.delete(MOCK_ROLE_COOKIE_NAME);

  if (isSupabaseAuthConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/?loggedOut=1");
}
