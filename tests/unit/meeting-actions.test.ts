import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  convertDecisionToTask: vi.fn(),
  createDecisionRecord: vi.fn(),
  createMeeting: vi.fn(),
  getCurrentUser: vi.fn(),
  getDecision: vi.fn(),
  getMeeting: vi.fn(),
  getScopedDecision: vi.fn(),
  getScopedMeeting: vi.fn(),
  getScopedProject: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  updateMeeting: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/lib/permissions/scoped-resources", () => ({
  getScopedDecision: mocks.getScopedDecision,
  getScopedMeeting: mocks.getScopedMeeting,
  getScopedProject: mocks.getScopedProject,
}));

vi.mock("@/modules/executive/services/decision-record-service", () => ({
  createDecisionRecord: mocks.createDecisionRecord,
}));

vi.mock("@/modules/meetings/services/meeting-service", () => ({
  convertDecisionToTask: mocks.convertDecisionToTask,
  createMeeting: mocks.createMeeting,
  getDecision: mocks.getDecision,
  getMeeting: mocks.getMeeting,
  updateMeeting: mocks.updateMeeting,
}));

import { createDecisionAction } from "@/modules/meetings/actions";

function decisionFormData() {
  const formData = new FormData();

  formData.set("decisionText", "Approve follow-up action.");
  formData.set("ownerId", "owner-01");
  formData.set("dueDate", "2026-06-05");
  formData.set("status", "open");

  return formData;
}

describe("meeting actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates meeting decisions through the official decision record service", async () => {
    const currentUser = { id: "leader-01", role: "tong_giam_doc" };
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.createDecisionRecord.mockResolvedValue({
      id: "decision-01",
      meetingId: "meeting-01",
      projectId: "project-a",
      projectIds: ["project-a", "project-b"],
      decisionText: "Approve follow-up action.",
      status: "open",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    });

    await createDecisionAction("meeting-01", decisionFormData());

    expect(mocks.createDecisionRecord).toHaveBeenCalledWith(
      {
        sourceType: "meeting",
        sourceId: "meeting-01",
        decisionText: "Approve follow-up action.",
        ownerId: "owner-01",
        dueDate: "2026-06-05",
        status: "open",
      },
      currentUser,
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/meetings");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/meetings/meeting-01");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/projects/project-a");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/projects/project-b");
  });
});
