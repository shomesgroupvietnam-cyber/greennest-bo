import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppSession } from "@/lib/auth/session";
import { requireBoRoute } from "@/lib/permissions/guard";
import { BO_POLICY_HREFS } from "@/lib/permissions/navigation-policy";

const mocks = vi.hoisted(() => ({
  createAuditLog: vi.fn(),
  forbidden: vi.fn(() => {
    throw new Error("NEXT_FORBIDDEN");
  }),
  getCurrentSession: vi.fn(),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
}));

vi.mock("next/navigation", () => ({
  forbidden: mocks.forbidden,
  redirect: mocks.redirect,
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentSession: mocks.getCurrentSession,
}));

vi.mock("@/modules/users/services/user-service", () => ({
  createAuditLog: mocks.createAuditLog,
}));

function session(role: AppSession["user"]["role"]): AppSession {
  return {
    defaultScreen: {
      href: "/command-center",
      label: "Tong quan Truc 1",
    },
    isAuthenticated: true,
    isFallback: false,
    mode: "mock",
    permissions: [],
    user: {
      email: `${role}@example.test`,
      fullName: role,
      id: `${role}-user`,
      role,
      status: "active",
    },
  };
}

describe("BO route guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createAuditLog.mockResolvedValue(undefined);
  });

  it.each(BO_POLICY_HREFS)(
    "allows and audits super admin BO route access for %s",
    async (route) => {
      const superAdminSession = session("super_admin");
      mocks.getCurrentSession.mockResolvedValue(superAdminSession);

      await expect(requireBoRoute(route)).resolves.toBe(superAdminSession);

      expect(mocks.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "access.allowed",
          actorId: "super_admin-user",
          entityType: "access",
          newValue: expect.objectContaining({
            reason: "bo_route_allowed",
            role: "super_admin",
            route,
            status: "active",
          }),
        }),
      );
    },
  );

  it.each([
    "/admin/",
    "/admin/audit?tab=access",
    "/settings/",
    "/settings/policy?checkProviders=1",
    "/users/",
    "/users/invite?source=smoke",
  ])("allows and audits super admin BO route variant %s", async (route) => {
    const superAdminSession = session("super_admin");
    mocks.getCurrentSession.mockResolvedValue(superAdminSession);

    await expect(requireBoRoute(route)).resolves.toBe(superAdminSession);

    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "access.allowed",
        actorId: "super_admin-user",
        entityType: "access",
        newValue: expect.objectContaining({
          reason: "bo_route_allowed",
          role: "super_admin",
          route,
          status: "active",
        }),
      }),
    );
  });

  it("does not block super admin BO route access when audit write fails", async () => {
    const superAdminSession = session("super_admin");
    mocks.getCurrentSession.mockResolvedValue(superAdminSession);
    mocks.createAuditLog.mockRejectedValueOnce(new Error("audit unavailable"));

    await expect(requireBoRoute("/users")).resolves.toBe(superAdminSession);
  });

  it("forbids chairman BO route access through the same guard", async () => {
    mocks.getCurrentSession.mockResolvedValue(session("chu_tich"));

    await expect(requireBoRoute("/settings")).rejects.toThrow("NEXT_FORBIDDEN");

    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "access.denied",
        actorId: "chu_tich-user",
        entityType: "access",
        newValue: expect.objectContaining({
          reason: "bo_route_forbidden:/settings",
          role: "chu_tich",
          route: "/settings",
        }),
      }),
    );
  });
});
