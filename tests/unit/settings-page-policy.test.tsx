import { describe, expect, it, vi } from "vitest";

import SettingsPage from "@/app/(dashboard)/settings/page";
import { requireAnyPermission } from "@/lib/permissions/guard";
import { listProjects } from "@/modules/projects/services/project-service";
import { listLeadershipDelegations } from "@/modules/settings/services/leadership-delegation-service";
import { listPolicySettings } from "@/modules/settings/services/policy-settings-service";
import { checkAllProviderHealth } from "@/modules/settings/services/provider-health-service";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import {
  listActiveScopeAssignments,
  listScopeAssignments,
} from "@/modules/settings/services/scope-assignment-service";
import { listSourceRegistryEntries } from "@/modules/settings/services/source-registry-settings-service";
import { listUsers } from "@/modules/users/services/user-service";

vi.mock("@/lib/permissions/guard", () => ({
  requireAnyPermission: vi.fn(),
}));

vi.mock("@/modules/projects/services/project-service", () => ({
  listProjects: vi.fn(),
}));

vi.mock("@/modules/settings/services/leadership-delegation-service", () => ({
  listLeadershipDelegations: vi.fn(),
}));

vi.mock("@/modules/settings/services/policy-settings-service", () => ({
  listPolicySettings: vi.fn(),
}));

vi.mock("@/modules/settings/services/provider-health-service", () => ({
  checkAllProviderHealth: vi.fn(),
}));

vi.mock("@/modules/settings/services/role-permission-catalog-service", () => ({
  listRolePermissionCatalog: vi.fn(),
}));

vi.mock("@/modules/settings/services/scope-assignment-service", () => ({
  listActiveScopeAssignments: vi.fn(),
  listScopeAssignments: vi.fn(),
}));

vi.mock("@/modules/settings/services/source-registry-settings-service", () => ({
  listSourceRegistryEntries: vi.fn(),
}));

vi.mock("@/modules/users/services/user-service", () => ({
  listUsers: vi.fn(),
}));

describe("SettingsPage BO policy", () => {
  it("runs the route guard before loading settings data", async () => {
    vi.mocked(requireAnyPermission).mockRejectedValueOnce(
      new Error("forbidden"),
    );

    await expect(
      SettingsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("forbidden");

    expect(listRolePermissionCatalog).not.toHaveBeenCalled();
    expect(listUsers).not.toHaveBeenCalled();
    expect(listProjects).not.toHaveBeenCalled();
    expect(listLeadershipDelegations).not.toHaveBeenCalled();
    expect(listActiveScopeAssignments).not.toHaveBeenCalled();
    expect(listSourceRegistryEntries).not.toHaveBeenCalled();
    expect(checkAllProviderHealth).not.toHaveBeenCalled();
    expect(listScopeAssignments).not.toHaveBeenCalled();
    expect(listPolicySettings).not.toHaveBeenCalled();
  });
});
