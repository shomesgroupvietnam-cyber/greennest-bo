import { describe, expect, it, vi } from "vitest";

import { requireWorkspaceRoute } from "@/lib/permissions/guard";
import { getRoleWorkspaceData } from "@/modules/workspaces/services/workspace-service";
import { WorkspaceRoutePage } from "@/modules/workspaces/components/workspace-route-page";

vi.mock("@/lib/permissions/guard", () => ({
  requireWorkspaceRoute: vi.fn(),
}));

vi.mock("@/modules/workspaces/services/workspace-service", () => ({
  getRoleWorkspaceData: vi.fn(),
}));

vi.mock("@/modules/workspaces/components/role-workspace-shell", () => ({
  RoleWorkspaceShell: () => null,
}));

describe("WorkspaceRoutePage", () => {
  it("does not fetch workspace data when the route guard denies access", async () => {
    vi.mocked(requireWorkspaceRoute).mockRejectedValueOnce(
      new Error("forbidden"),
    );

    await expect(WorkspaceRoutePage({ route: "/admin" })).rejects.toThrow(
      "forbidden",
    );
    expect(getRoleWorkspaceData).not.toHaveBeenCalled();
  });
});
