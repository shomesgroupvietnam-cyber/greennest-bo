import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createDecisionRecord: vi.fn(),
  getCurrentUser: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/modules/executive/services/decision-record-service", () => ({
  createDecisionRecord: mocks.createDecisionRecord,
}));

import { createDecisionRecordAction } from "@/modules/executive/actions";

describe("executive actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects malformed linked records JSON before calling the service", async () => {
    const formData = new FormData();

    formData.set("decisionText", "Approve portfolio instruction.");
    formData.set("organizationId", "org-green-nest");
    formData.set("linkedRecordsJson", "{not-json");
    mocks.getCurrentUser.mockResolvedValue({ id: "leader-01", role: "tong_giam_doc" });

    await expect(createDecisionRecordAction(formData)).rejects.toThrow(
      /linked records khong hop le/i,
    );
    expect(mocks.createDecisionRecord).not.toHaveBeenCalled();
  });
});
