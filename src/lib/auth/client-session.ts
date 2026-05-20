"use client";

import { getMockResolvedSession } from "@/lib/auth/mock-session";

export function getClientAuthMode() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "supabase" : "mock";
}

export function getClientSessionSnapshot() {
  return {
    ...getMockResolvedSession(),
    mode: getClientAuthMode()
  };
}
