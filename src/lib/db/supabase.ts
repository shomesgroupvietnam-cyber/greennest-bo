import { createBrowserClient } from "@supabase/ssr";

import { getClientEnv } from "@/lib/validation/env";

export function createSupabaseBrowserClient() {
  const env = getClientEnv();

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Thiếu cấu hình Supabase client.");
  }

  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
