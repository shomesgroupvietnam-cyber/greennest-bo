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

vi.mock("next/navigation", () => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
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

  it("allows chairman top-level command center before data fetch", async () => {
    const user = { id: "chairman-01", role: "chu_tich" };
    vi.mocked(requireAuthenticatedSession).mockResolvedValueOnce({
      defaultScreen: {
        href: "/command-center",
        label: "Tong quan Truc 1",
      },
      isAuthenticated: true,
      isFallback: false,
      mode: "mock",
      permissions: [],
      user: {
        ...user,
        email: "chairman@greennest.vn",
        fullName: "Chairman",
        status: "active",
      },
    });
    vi.mocked(getCommandCenterData).mockResolvedValueOnce(
      {} as Awaited<ReturnType<typeof getCommandCenterData>>,
    );

    await CommandCenterPage({
      searchParams: Promise.resolve({}),
    });

    expect(requireWorkspaceRoute).not.toHaveBeenCalled();
    expect(getCommandCenterData).toHaveBeenCalledWith(
      expect.objectContaining(user),
      { selectedScopeId: undefined },
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

  it.each([
    {
      defaultHref: "/viewer",
      email: "viewer@greennest.vn",
      fullName: "Viewer",
      id: "viewer-01",
      role: "viewer",
    },
    {
      defaultHref: "/assistant-workspace",
      email: "assistant@greennest.vn",
      fullName: "Assistant",
      id: "assistant-01",
      role: "thu_ky_tro_ly",
    },
    {
      defaultHref: "/legal-workspace",
      email: "legal@greennest.vn",
      fullName: "Legal",
      id: "legal-01",
      role: "phap_ly",
    },
    {
      defaultHref: "/design-workspace",
      email: "design@greennest.vn",
      fullName: "Design",
      id: "design-01",
      role: "thiet_ke",
    },
    {
      defaultHref: "/technical-workspace",
      email: "technical@greennest.vn",
      fullName: "Technical",
      id: "technical-01",
      role: "ky_thuat",
    },
  ])(
    "redirects $role away from top-level command center before data fetch",
    async ({ defaultHref, email, fullName, id, role }) => {
      vi.mocked(requireAuthenticatedSession).mockResolvedValueOnce({
        defaultScreen: {
          href: defaultHref,
          label: fullName,
        },
        isAuthenticated: true,
        isFallback: false,
        mode: "mock",
        permissions: [],
        user: {
          email,
          fullName,
          id,
          role,
          status: "active",
        },
      });

      await expect(
        CommandCenterPage({
          searchParams: Promise.resolve({}),
        }),
      ).rejects.toThrow(`NEXT_REDIRECT:${defaultHref}`);

      expect(requireWorkspaceRoute).not.toHaveBeenCalled();
      expect(getCommandCenterData).not.toHaveBeenCalled();
    },
  );

  it.each([
    {
      defaultHref: "/legal-workspace",
      email: "legal@greennest.vn",
      fullName: "Legal",
      id: "legal-01",
      role: "phap_ly",
    },
    {
      defaultHref: "/design-workspace",
      email: "design@greennest.vn",
      fullName: "Design",
      id: "design-01",
      role: "thiet_ke",
    },
    {
      defaultHref: "/technical-workspace",
      email: "technical@greennest.vn",
      fullName: "Technical",
      id: "technical-01",
      role: "ky_thuat",
    },
  ])(
    "does not let broad executive workspace access expose command center for $role",
    async ({ defaultHref, email, fullName, id, role }) => {
      vi.mocked(requireWorkspaceRoute).mockResolvedValueOnce({
        defaultScreen: {
          href: defaultHref,
          label: fullName,
        },
        isAuthenticated: true,
        isFallback: false,
        mode: "mock",
        permissions: [],
        user: {
          email,
          fullName,
          id,
          role,
          status: "active",
        },
      });

      await expect(
        CommandCenterPage({
          searchParams: Promise.resolve({ view: "executive-dashboard" }),
        }),
      ).rejects.toThrow(`NEXT_REDIRECT:${defaultHref}`);

      expect(requireAuthenticatedSession).not.toHaveBeenCalled();
      expect(getCommandCenterData).not.toHaveBeenCalled();
    },
  );

  it("redirects Axis 1 overview roles to the Axis 1 command-center view before data fetch", async () => {
    vi.mocked(requireAuthenticatedSession).mockResolvedValueOnce({
      defaultScreen: {
        href: "/project-workbench",
        label: "Ban du an",
      },
      isAuthenticated: true,
      isFallback: false,
      mode: "mock",
      permissions: [],
      user: {
        email: "project-director@greennest.vn",
        fullName: "Project Director",
        id: "project-director-01",
        role: "giam_doc_du_an",
        status: "active",
      },
    });

    await expect(
      CommandCenterPage({
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/command-center?view=axis1-search-development",
    );

    expect(requireWorkspaceRoute).not.toHaveBeenCalled();
    expect(getCommandCenterData).not.toHaveBeenCalled();
  });

  it.each([
    {
      defaultHref: "/contractor",
      email: "contractor@greennest.vn",
      fullName: "Contractor",
      id: "contractor-01",
      role: "nha_thau",
    },
    {
      defaultHref: "/consultant",
      email: "consultant@greennest.vn",
      fullName: "Consultant",
      id: "consultant-01",
      role: "tu_van",
    },
  ])(
    "redirects $role away from top-level command center before data fetch",
    async ({ defaultHref, email, fullName, id, role }) => {
      vi.mocked(requireAuthenticatedSession).mockResolvedValueOnce({
        defaultScreen: {
          href: defaultHref,
          label: fullName,
        },
        isAuthenticated: true,
        isFallback: false,
        mode: "mock",
        permissions: [],
        user: {
          email,
          fullName,
          id,
          role,
          status: "active",
        },
      });

      await expect(
        CommandCenterPage({
          searchParams: Promise.resolve({}),
        }),
      ).rejects.toThrow(`NEXT_REDIRECT:${defaultHref}`);

      expect(requireWorkspaceRoute).not.toHaveBeenCalled();
      expect(getCommandCenterData).not.toHaveBeenCalled();
    },
  );
});
