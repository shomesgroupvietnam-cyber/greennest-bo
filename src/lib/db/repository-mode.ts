import { isSupabaseAuthConfigured } from "@/lib/auth/supabase-server";

export type RepositoryMode = "mock" | "supabase";

export function getRepositoryMode(): RepositoryMode {
  const explicitMode = process.env.GREENNEST_REPOSITORY_MODE ?? process.env.SUPABASE_REPOSITORY_MODE;

  if (explicitMode === "mock" || explicitMode === "supabase") {
    return explicitMode;
  }

  return isSupabaseAuthConfigured() ? "supabase" : "mock";
}

export function selectRepository<T>(repositories: { mock: T; supabase: T }) {
  return getRepositoryMode() === "supabase" ? repositories.supabase : repositories.mock;
}
