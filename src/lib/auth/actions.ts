"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { resolveMockRole } from "@/lib/auth/mock-session";
import {
  createSupabaseServerClient,
  isSupabaseAuthConfigured,
} from "@/lib/auth/supabase-server";
import { resolvePostLoginHref } from "@/lib/auth/post-login-routing";
import { getCurrentSession } from "@/lib/auth/session";
import { createAuditLog } from "@/modules/users/services/user-service";

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
