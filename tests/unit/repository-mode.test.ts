import { describe, expect, it, vi } from "vitest";

import { getRepositoryMode, selectRepository } from "@/lib/db/repository-mode";

describe("repository mode", () => {
  it("uses mock repositories when Supabase public env vars are missing", () => {
    vi.stubEnv("GREENNEST_REPOSITORY_MODE", "");
    vi.stubEnv("SUPABASE_REPOSITORY_MODE", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    expect(getRepositoryMode()).toBe("mock");
    expect(selectRepository({ mock: "mock-repo", supabase: "supabase-repo" })).toBe("mock-repo");

    vi.unstubAllEnvs();
  });

  it("uses Supabase repositories when Supabase public env vars are configured", () => {
    vi.stubEnv("GREENNEST_REPOSITORY_MODE", "");
    vi.stubEnv("SUPABASE_REPOSITORY_MODE", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    expect(getRepositoryMode()).toBe("supabase");
    expect(selectRepository({ mock: "mock-repo", supabase: "supabase-repo" })).toBe("supabase-repo");

    vi.unstubAllEnvs();
  });

  it("lets explicit repository mode override automatic selection", () => {
    vi.stubEnv("GREENNEST_REPOSITORY_MODE", "mock");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    expect(getRepositoryMode()).toBe("mock");

    vi.stubEnv("GREENNEST_REPOSITORY_MODE", "supabase");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    expect(getRepositoryMode()).toBe("supabase");

    vi.unstubAllEnvs();
  });
});
