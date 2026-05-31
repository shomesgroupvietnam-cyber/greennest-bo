import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Role } from "@/constants/roles";
import type { PermissionUser } from "@/lib/permissions/can";
import { getNavigationShellData } from "@/lib/permissions/navigation-context";
import { createDefaultRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-repository";

const mocks = vi.hoisted(() => ({
  listActiveDelegationsForDelegate: vi.fn(),
  listActiveScopeAssignments: vi.fn(),
  listRolePermissionCatalog: vi.fn(),
}));

vi.mock("@/modules/settings/services/leadership-delegation-service", () => ({
  listActiveDelegationsForDelegate: mocks.listActiveDelegationsForDelegate,
}));

vi.mock("@/modules/settings/services/role-permission-catalog-service", () => ({
  listRolePermissionCatalog: mocks.listRolePermissionCatalog,
}));

vi.mock("@/modules/settings/services/scope-assignment-service", () => ({
  listActiveScopeAssignments: mocks.listActiveScopeAssignments,
}));

function user(role: Role, id = `${role}-user`): PermissionUser {
  return { id, role };
}

describe("navigation shell BO policy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listActiveDelegationsForDelegate.mockResolvedValue([]);
    mocks.listActiveScopeAssignments.mockResolvedValue([]);
    mocks.listRolePermissionCatalog.mockResolvedValue(
      createDefaultRolePermissionCatalog(),
    );
  });

  it("keeps chairman sidebar and workspace selector free of BO routes", async () => {
    const shell = await getNavigationShellData({
      defaultWorkspaceLabel: "Tong quan Truc 1",
      pathname: "/command-center",
      user: user("chu_tich", "chairman-01"),
    });
    const navHrefs = shell.navItems.map((item) => item.href);
    const workspaceHrefs = shell.shellContext.workspaceOptions.map(
      (item) => item.href,
    );

    expect(navHrefs).toEqual(
      expect.arrayContaining([
        "/command-center",
        "/command-center?view=executive-dashboard",
      ]),
    );
    expect(navHrefs).not.toEqual(expect.arrayContaining(["/admin"]));
    expect(navHrefs).not.toEqual(expect.arrayContaining(["/settings"]));
    expect(navHrefs).not.toEqual(expect.arrayContaining(["/users"]));
    expect(workspaceHrefs).not.toEqual(expect.arrayContaining(["/admin"]));
    expect(workspaceHrefs).not.toEqual(expect.arrayContaining(["/settings"]));
    expect(workspaceHrefs).not.toEqual(expect.arrayContaining(["/users"]));
  });

  it("shows super admin chairman surfaces plus BO navigation", async () => {
    const shell = await getNavigationShellData({
      defaultWorkspaceLabel: "Tong quan Truc 1",
      pathname: "/command-center",
      user: user("super_admin", "super-admin-01"),
    });
    const navHrefs = shell.navItems.map((item) => item.href);
    const workspaceHrefs = shell.shellContext.workspaceOptions.map(
      (item) => item.href,
    );

    expect(navHrefs).toEqual(
      expect.arrayContaining([
        "/command-center",
        "/command-center?view=executive-dashboard",
        "/admin",
        "/settings",
        "/users",
      ]),
    );
    expect(workspaceHrefs).toEqual(expect.arrayContaining(["/admin"]));
  });
});
