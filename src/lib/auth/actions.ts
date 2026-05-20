"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient, isSupabaseAuthConfigured } from "@/lib/auth/supabase-server";
import { getCurrentSession } from "@/lib/auth/session";

export async function loginAction(formData: FormData) {
  if (!isSupabaseAuthConfigured()) {
    const session = await getCurrentSession();
    redirect(session.defaultScreen.href);
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=1");
  }

  const session = await getCurrentSession();
  redirect(session.defaultScreen.href);
}

export async function logoutAction() {
  if (isSupabaseAuthConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/login?loggedOut=1");
}

