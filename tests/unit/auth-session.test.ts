import { describe, expect, it, vi } from "vitest";

import { getAuthMode, getCurrentSession } from "@/lib/auth/session";

describe("auth session", () => {
  it("uses mock fallback when Supabase public env vars are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    const session = await getCurrentSession();

    expect(getAuthMode()).toBe("mock");
    expect(session.mode).toBe("mock");
    expect(session.isFallback).toBe(true);
    expect(session.user.role).toBe("admin");

    vi.unstubAllEnvs();
  });

  it("resolves mock role from development env", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("MOCK_CURRENT_ROLE", "viewer");

    const session = await getCurrentSession();

    expect(session.user.role).toBe("viewer");
    expect(session.defaultScreen.href).toBe("/viewer");

    vi.unstubAllEnvs();
  });

  it("keeps pending mock users unauthorised until admin grants access", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("MOCK_CURRENT_ROLE", "pending");

    const session = await getCurrentSession();

    expect(session.user.role).toBe("pending");
    expect(session.user.status).toBe("pending");
    expect(session.permissions).toEqual([]);
    expect(session.defaultScreen.href).toBe("/pending-access");

    vi.unstubAllEnvs();
  });
});
