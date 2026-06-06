import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  closeExecutiveRiskRecord: vi.fn(),
  createDecisionAssignments: vi.fn(),
  createDecisionRecord: vi.fn(),
  createExecutiveRiskRecord: vi.fn(),
  getCurrentUser: vi.fn(),
  overrideExecutiveRiskStatus: vi.fn(),
  revalidatePath: vi.fn(),
  updateDecisionRecord: vi.fn(),
  updateExecutiveRiskRecord: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/modules/executive/services/decision-record-service", () => ({
  createDecisionRecord: mocks.createDecisionRecord,
  updateDecisionRecord: mocks.updateDecisionRecord,
}));

vi.mock("@/modules/executive/services/decision-assignment-service", () => ({
  createDecisionAssignments: mocks.createDecisionAssignments,
}));

vi.mock("@/modules/executive/services/risk-record-service", () => ({
  closeExecutiveRiskRecord: mocks.closeExecutiveRiskRecord,
  createExecutiveRiskRecord: mocks.createExecutiveRiskRecord,
  overrideExecutiveRiskStatus: mocks.overrideExecutiveRiskStatus,
  updateExecutiveRiskRecord: mocks.updateExecutiveRiskRecord,
}));

import {
  closeExecutiveRiskRecordStateAction,
  createDecisionAssignmentsAction,
  createDecisionRecordAction,
  createExecutiveRiskRecordStateAction,
  overrideExecutiveRiskStatusStateAction,
  updateDecisionRecordAction,
  updateExecutiveRiskRecordAction,
} from "@/modules/executive/actions";

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

  it("rejects malformed assignments JSON before calling the assignment service", async () => {
    const formData = new FormData();

    formData.set("decisionId", "decision-01");
    formData.set("assignmentsJson", "{not-json");
    mocks.getCurrentUser.mockResolvedValue({ id: "leader-01", role: "tong_giam_doc" });

    await expect(createDecisionAssignmentsAction(formData)).rejects.toThrow(
      /assignments khong hop le/i,
    );
    expect(mocks.createDecisionAssignments).not.toHaveBeenCalled();
  });

  it("creates decision assignments through the service and revalidates related routes", async () => {
    const currentUser = { id: "leader-01", role: "tong_giam_doc" };
    const formData = new FormData();

    formData.set("decisionId", "decision-01");
    formData.set(
      "assignmentsJson",
      JSON.stringify([
        {
          projectId: "project-a",
          assigneeType: "user",
          assigneeId: "legal-manager",
          title: "Prepare instruction",
        },
      ]),
    );
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.createDecisionAssignments.mockResolvedValue({
      decision: { id: "decision-01" },
      tasks: [{ id: "task-01", projectId: "project-a" }],
      assignments: [{ id: "assignment-01", projectId: "project-a", taskId: "task-01" }],
    });

    await createDecisionAssignmentsAction(formData);

    expect(mocks.createDecisionAssignments).toHaveBeenCalledWith(
      {
        decisionId: "decision-01",
        assignments: [
          {
            projectId: "project-a",
            assigneeType: "user",
            assigneeId: "legal-manager",
            title: "Prepare instruction",
            priority: "medium",
          },
        ],
      },
      currentUser,
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/tasks");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/command-center");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/executive/decision-log");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/executive/decisions");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/projects/project-a");
  });

  it("creates a single decision assignment from center form fields", async () => {
    const currentUser = { id: "leader-01", role: "tong_giam_doc" };
    const formData = new FormData();

    formData.set("decisionId", "decision-01");
    formData.set("assignmentTitle", "Follow up from center");
    formData.set("assignmentProjectId", "project-a");
    formData.set("assignmentAssigneeType", "project");
    formData.set("assignmentDueDate", "2026-06-05");
    formData.set("assignmentPriority", "high");
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.createDecisionAssignments.mockResolvedValue({
      decision: { id: "decision-01" },
      tasks: [{ id: "task-01", projectId: "project-a" }],
      assignments: [{ id: "assignment-01", projectId: "project-a", taskId: "task-01" }],
    });

    await createDecisionAssignmentsAction(formData);

    expect(mocks.createDecisionAssignments).toHaveBeenCalledWith(
      {
        decisionId: "decision-01",
        assignments: [
          {
            assigneeType: "project",
            dueDate: "2026-06-05",
            priority: "high",
            projectId: "project-a",
            title: "Follow up from center",
          },
        ],
      },
      currentUser,
    );
  });

  it("updates a decision record through the service and revalidates related routes", async () => {
    const currentUser = { id: "leader-01", role: "tong_giam_doc" };
    const formData = new FormData();

    formData.set("decisionId", "decision-01");
    formData.set("title", "Updated title");
    formData.set("dueDate", "2026-06-10");
    formData.set("projectIds", "project-a,project-b");
    formData.set("reason", "Gia han theo chi dao.");
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.updateDecisionRecord.mockResolvedValue({
      id: "decision-01",
      projectId: "project-a",
      projectIds: ["project-a", "project-b"],
      meetingId: "meeting-01",
    });

    await updateDecisionRecordAction(formData);

    expect(mocks.updateDecisionRecord).toHaveBeenCalledWith(
      {
        decisionId: "decision-01",
        title: "Updated title",
        dueDate: "2026-06-10",
        projectIds: ["project-a", "project-b"],
        reason: "Gia han theo chi dao.",
      },
      currentUser,
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/executive/decision-log");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/executive/decisions");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/command-center");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/meetings/meeting-01");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/projects/project-a");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/projects/project-b");
  });

  it("creates a risk record from FormData and revalidates executive surfaces", async () => {
    const currentUser = { id: "leader-01", role: "tong_giam_doc" };
    const formData = new FormData();

    formData.set("recordType", "risk");
    formData.set("title", "Official risk");
    formData.set("categoryKey", "legal");
    formData.set("level", "high");
    formData.set("reason", "Can xu ly source");
    formData.set("projectId", "project-a");
    formData.set("moduleId", "risk");
    formData.set("ownerId", "owner-01");
    formData.set("deadline", "2026-06-10");
    formData.set("nextAction", "Follow up");
    formData.set("status", "open");
    formData.set("sourceType", "decision");
    formData.set("sourceId", "decision-01");
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.createExecutiveRiskRecord.mockResolvedValue({
      id: "risk-01",
      projectId: "project-a",
      sourceType: "decision",
    });

    const state = await createExecutiveRiskRecordStateAction(
      { status: "idle" },
      formData,
    );

    expect(state).toMatchObject({ status: "success" });
    expect(mocks.createExecutiveRiskRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryKey: "legal",
        projectId: "project-a",
        sourceType: "decision",
      }),
      currentUser,
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/command-center");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/executive");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/executive/decision-log");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/projects/project-a");
  });

  it("preserves risk form fields when the service rejects validation or permission", async () => {
    const formData = new FormData();

    formData.set("title", "Draft risk");
    formData.set("projectId", "project-a");
    mocks.getCurrentUser.mockResolvedValue({ id: "viewer-01", role: "viewer" });
    mocks.createExecutiveRiskRecord.mockRejectedValue(new Error("Ban khong co quyen tao risk."));

    const state = await createExecutiveRiskRecordStateAction(
      { status: "idle" },
      formData,
    );

    expect(state).toMatchObject({
      fields: expect.objectContaining({
        projectId: "project-a",
        title: "Draft risk",
      }),
      message: "Ban khong co quyen tao risk.",
      status: "error",
    });
  });

  it("updates a risk record through the service and revalidates project scope", async () => {
    const currentUser = { id: "leader-01", role: "tong_giam_doc" };
    const formData = new FormData();

    formData.set("riskId", "risk-01");
    formData.set("title", "Updated official risk");
    formData.set("projectId", "project-a");
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.updateExecutiveRiskRecord.mockResolvedValue({
      id: "risk-01",
      projectId: "project-a",
    });

    await updateExecutiveRiskRecordAction(formData);

    expect(mocks.updateExecutiveRiskRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        riskId: "risk-01",
        title: "Updated official risk",
      }),
      currentUser,
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/projects/project-a");
  });

  it("overrides a risk status through the dedicated service and revalidates scope", async () => {
    const currentUser = { id: "leader-01", role: "tong_giam_doc" };
    const formData = new FormData();

    formData.set("riskId", "risk-01");
    formData.set("statusOverride", "green");
    formData.set("reason", "CEO da xac nhan bien phap kiem soat.");
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.overrideExecutiveRiskStatus.mockResolvedValue({
      id: "risk-01",
      projectId: "project-a",
      statusOverride: "green",
    });

    const state = await overrideExecutiveRiskStatusStateAction(
      { status: "idle" },
      formData,
    );

    expect(state).toMatchObject({ status: "success" });
    expect(mocks.overrideExecutiveRiskStatus).toHaveBeenCalledWith(
      {
        reason: "CEO da xac nhan bien phap kiem soat.",
        riskId: "risk-01",
        statusOverride: "green",
      },
      currentUser,
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/command-center");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/projects/project-a");
  });

  it("closes a risk through the dedicated service and preserves fields on error", async () => {
    const formData = new FormData();

    formData.set("riskId", "risk-01");
    formData.set("status", "closed");
    formData.set("reason", "Da dong sau khi co bien phap.");
    mocks.getCurrentUser.mockResolvedValue({ id: "viewer-01", role: "viewer" });
    mocks.closeExecutiveRiskRecord.mockRejectedValue(new Error("Ban khong co quyen dong risk."));

    const state = await closeExecutiveRiskRecordStateAction(
      { status: "idle" },
      formData,
    );

    expect(state).toMatchObject({
      fields: {
        reason: "Da dong sau khi co bien phap.",
        riskId: "risk-01",
        status: "closed",
      },
      message: "Ban khong co quyen dong risk.",
      status: "error",
    });
    expect(mocks.closeExecutiveRiskRecord).toHaveBeenCalledWith(
      {
        reason: "Da dong sau khi co bien phap.",
        riskId: "risk-01",
        status: "closed",
      },
      { id: "viewer-01", role: "viewer" },
    );
  });
});
