import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppSession } from "@/lib/auth/session";

const calls: string[] = [];
const mocks = vi.hoisted(() => ({
  getNavigationShellData: vi.fn(),
  headers: vi.fn(),
  requireAnyPermission: vi.fn(),
  requireAuthenticatedSession: vi.fn(),
  requireBoRoute: vi.fn(),
  requirePermission: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("@/components/layout/app-header", () => ({
  AppHeader: () => null,
}));

vi.mock("@/components/layout/app-sidebar", () => ({
  AppSidebar: () => null,
}));

vi.mock("@/components/layout/logout-form", () => ({
  LogoutForm: () => null,
}));

vi.mock("@/lib/permissions/guard", () => ({
  requireAnyPermission: mocks.requireAnyPermission,
  requireAuthenticatedSession: mocks.requireAuthenticatedSession,
  requireBoRoute: mocks.requireBoRoute,
  requirePermission: mocks.requirePermission,
}));

vi.mock("@/lib/permissions/navigation-context", () => ({
  getNavigationShellData: mocks.getNavigationShellData,
}));

vi.mock("@/modules/settings/services/leadership-delegation-service", () => ({
  listActiveDelegationsForDelegate: vi.fn(),
}));

import DashboardLayout from "@/app/(dashboard)/layout";

function session(): AppSession {
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
      email: "super-admin@example.test",
      fullName: "Super Admin",
      id: "super-admin-01",
      role: "super_admin",
      status: "active",
    },
  };
}

function headerStore(pathname: string) {
  return {
    get: (key: string) => {
      if (key === "x-greennest-pathname") {
        return pathname;
      }

      if (key === "x-greennest-search") {
        return "";
      }

      return null;
    },
  };
}

describe("DashboardLayout BO route policy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("React", React);
    calls.length = 0;
    const appSession = session();

    mocks.headers.mockResolvedValue(headerStore("/dashboard"));
    mocks.requireAuthenticatedSession.mockImplementation(async () => {
      calls.push("auth");
      return appSession;
    });
    mocks.requireBoRoute.mockImplementation(async () => {
      calls.push("bo");
      return appSession;
    });
    mocks.getNavigationShellData.mockImplementation(async () => {
      calls.push("shell");
      return {
        navItems: [],
        shellContext: {
          currentScopeLabel: "Tat ca pham vi duoc cap",
          currentWorkspaceLabel: "Tong quan Truc 1",
          scopeOptions: [],
          workspaceOptions: [],
        },
      };
    });
  });

  it.each(["/admin", "/settings", "/users"])(
    "calls requireBoRoute before shell data for %s",
    async (pathname) => {
      const appSession = session();
      mocks.headers.mockResolvedValue(headerStore(pathname));
      mocks.requireAuthenticatedSession.mockResolvedValue(appSession);
      mocks.requireAuthenticatedSession.mockImplementation(async () => {
        calls.push("auth");
        return appSession;
      });

      await DashboardLayout({ children: "content" });

      expect(mocks.requireBoRoute).toHaveBeenCalledWith(pathname, appSession);
      expect(calls).toEqual(["auth", "bo", "shell"]);
    },
  );
});
