import { beforeEach, describe, expect, it, vi } from "vitest";

import CommandCenterPage from "@/app/command-center/page";
import {
  requireAuthenticatedSession,
  requireWorkspaceRoute,
} from "@/lib/permissions/guard";
import { getCommandCenterData } from "@/modules/command-center/services/command-center-service";

vi.mock("@/lib/permissions/guard", () => ({
  requireAuthenticatedSession: vi.fn(),
  requireWorkspaceRoute: vi.fn(),
}));

vi.mock("@/modules/command-center/services/command-center-service", () => ({
  getCommandCenterData: vi.fn(),
}));

vi.mock("@/modules/command-center/components/command-center-dashboard", () => ({
  CommandCenterDashboard: () => null,
}));

describe("CommandCenterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders command center data with selected scope without wrapping a second app shell", async () => {
    const user = { id: "ceo-01", role: "tong_giam_doc" };
    vi.mocked(requireWorkspaceRoute).mockResolvedValueOnce({
      defaultScreen: {
        href: "/command-center?view=executive-dashboard",
        label: "Lanh dao",
      },
      isAuthenticated: true,
      isFallback: false,
      mode: "mock",
      permissions: [],
      user: {
        ...user,
        email: "ceo@greennest.vn",
        fullName: "CEO",
        status: "active",
      },
    });
    vi.mocked(getCommandCenterData).mockResolvedValueOnce(
      {} as Awaited<ReturnType<typeof getCommandCenterData>>,
    );

    await CommandCenterPage({
      searchParams: Promise.resolve({
        scopeId: "scope-a",
        view: "executive-dashboard",
      }),
    });

    expect(getCommandCenterData).toHaveBeenCalledWith(
      expect.objectContaining(user),
      { selectedScopeId: "scope-a" },
    );
  });

  it("guards executive deep links before fetching command-center data", async () => {
    vi.mocked(requireWorkspaceRoute).mockRejectedValueOnce(
      new Error("forbidden"),
    );

    await expect(
      CommandCenterPage({
        searchParams: Promise.resolve({ view: "executive-dashboard" }),
      }),
    ).rejects.toThrow("forbidden");
    expect(requireAuthenticatedSession).not.toHaveBeenCalled();
    expect(getCommandCenterData).not.toHaveBeenCalled();
  });

  it("lets private workspace deep links use the authenticated command-center guard", async () => {
    const user = { id: "viewer-01", role: "viewer" };
    vi.mocked(requireAuthenticatedSession).mockResolvedValueOnce({
      defaultScreen: {
        href: "/viewer",
        label: "Viewer",
      },
      isAuthenticated: true,
      isFallback: false,
      mode: "mock",
      permissions: [],
      user: {
        ...user,
        email: "viewer@greennest.vn",
        fullName: "Viewer",
        status: "active",
      },
    });
    vi.mocked(getCommandCenterData).mockResolvedValueOnce(
      {} as Awaited<ReturnType<typeof getCommandCenterData>>,
    );

    await CommandCenterPage({
      searchParams: Promise.resolve({
        view: "executive-private-workspace",
      }),
    });

    expect(requireWorkspaceRoute).not.toHaveBeenCalled();
    expect(requireAuthenticatedSession).toHaveBeenCalledWith({
      route: "/command-center",
    });
    expect(getCommandCenterData).toHaveBeenCalledWith(
      expect.objectContaining(user),
      { selectedScopeId: undefined },
    );
  });
});
