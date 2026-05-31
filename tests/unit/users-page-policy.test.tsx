import { describe, expect, it, vi } from "vitest";

import UsersPage from "@/app/(dashboard)/users/page";
import { requirePermission } from "@/lib/permissions/guard";
import { listProjects } from "@/modules/projects/services/project-service";
import {
  listAuditLogs,
  listProjectMemberships,
  listRoles,
  listUsers,
} from "@/modules/users/services/user-service";

vi.mock("@/lib/permissions/guard", () => ({
  requirePermission: vi.fn(),
}));

vi.mock("@/modules/projects/services/project-service", () => ({
  listProjects: vi.fn(),
}));

vi.mock("@/modules/users/actions", () => ({
  inviteUserAction: vi.fn(),
  updateUserRoleAction: vi.fn(),
  upsertProjectMembershipAction: vi.fn(),
}));

vi.mock("@/modules/users/services/user-service", () => ({
  listAuditLogs: vi.fn(),
  listProjectMemberships: vi.fn(),
  listRoles: vi.fn(),
  listUsers: vi.fn(),
}));

describe("UsersPage BO policy", () => {
  it("runs the route guard before loading user administration data", async () => {
    vi.mocked(requirePermission).mockRejectedValueOnce(new Error("forbidden"));

    await expect(UsersPage()).rejects.toThrow("forbidden");

    expect(listUsers).not.toHaveBeenCalled();
    expect(listRoles).not.toHaveBeenCalled();
    expect(listProjects).not.toHaveBeenCalled();
    expect(listProjectMemberships).not.toHaveBeenCalled();
    expect(listAuditLogs).not.toHaveBeenCalled();
  });
});
