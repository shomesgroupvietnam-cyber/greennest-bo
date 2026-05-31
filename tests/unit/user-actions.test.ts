import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  inviteUser: vi.fn(),
  revalidatePath: vi.fn(),
  updateUserRole: vi.fn(),
  upsertProjectMembership: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/modules/users/services/user-service", () => ({
  inviteUser: mocks.inviteUser,
  updateUserRole: mocks.updateUserRole,
  upsertProjectMembership: mocks.upsertProjectMembership,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { inviteUserAction, updateUserRoleAction } from "@/modules/users/actions";

function formData(values: Record<string, string>) {
  const data = new FormData();

  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }

  return data;
}

describe("user BO actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks chairman from direct user BO mutations", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "chairman-01",
      role: "chu_tich",
    });

    await expect(
      inviteUserAction(
        formData({
          fullName: "Blocked User",
          email: "blocked@greennest.vn",
          role: "viewer",
        }),
      ),
    ).rejects.toThrow(/quy.n|permission/i);

    await expect(
      updateUserRoleAction(
        "viewer-01",
        formData({
          role: "admin",
        }),
      ),
    ).rejects.toThrow(/quy.n|permission/i);

    expect(mocks.inviteUser).not.toHaveBeenCalled();
    expect(mocks.updateUserRole).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
