import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addMeetingAttachment: vi.fn(),
  addMeetingFollowUpAction: vi.fn(),
  approveMeetingAiSummary: vi.fn(),
  approveMeetingMinutes: vi.fn(),
  buildAiMeetingSummaryDraft: vi.fn(),
  canCreateOrganizationMeeting: vi.fn(),
  canCreateProjectMeeting: vi.fn(),
  convertDecisionToTask: vi.fn(),
  createMeetingFollowUpTask: vi.fn(),
  createDecisionRecord: vi.fn(),
  createMeeting: vi.fn(),
  getAiActionProposal: vi.fn(),
  getCurrentUser: vi.fn(),
  getDecision: vi.fn(),
  getMeeting: vi.fn(),
  getScopedDocument: vi.fn(),
  getScopedDecision: vi.fn(),
  getScopedExecutiveRiskRecord: vi.fn(),
  getScopedMeeting: vi.fn(),
  getScopedProposal: vi.fn(),
  getScopedProject: vi.fn(),
  getScopedTask: vi.fn(),
  linkMeetingDecisionTracking: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  removeMeetingAttachment: vi.fn(),
  updateMeetingFollowUpActionStatus: vi.fn(),
  updateMeetingAiSummaryDraft: vi.fn(),
  updateAiActionProposal: vi.fn(),
  updateMeeting: vi.fn(),
  updateMeetingMinutes: vi.fn(),
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
  canCreateOrganizationMeeting: mocks.canCreateOrganizationMeeting,
  canCreateProjectMeeting: mocks.canCreateProjectMeeting,
  getScopedDocument: mocks.getScopedDocument,
  getScopedDecision: mocks.getScopedDecision,
  getScopedExecutiveRiskRecord: mocks.getScopedExecutiveRiskRecord,
  getScopedMeeting: mocks.getScopedMeeting,
  getScopedProposal: mocks.getScopedProposal,
  getScopedProject: mocks.getScopedProject,
  getScopedTask: mocks.getScopedTask,
}));

vi.mock("@/modules/executive/services/decision-record-service", () => ({
  createDecisionRecord: mocks.createDecisionRecord,
}));

vi.mock("@/modules/meetings/services/meeting-service", () => ({
  addMeetingAttachment: mocks.addMeetingAttachment,
  addMeetingFollowUpAction: mocks.addMeetingFollowUpAction,
  approveMeetingAiSummary: mocks.approveMeetingAiSummary,
  approveMeetingMinutes: mocks.approveMeetingMinutes,
  convertDecisionToTask: mocks.convertDecisionToTask,
  createMeetingFollowUpTask: mocks.createMeetingFollowUpTask,
  createMeeting: mocks.createMeeting,
  getDecision: mocks.getDecision,
  getMeeting: mocks.getMeeting,
  linkMeetingDecisionTracking: mocks.linkMeetingDecisionTracking,
  removeMeetingAttachment: mocks.removeMeetingAttachment,
  updateMeetingFollowUpActionStatus: mocks.updateMeetingFollowUpActionStatus,
  updateMeetingAiSummaryDraft: mocks.updateMeetingAiSummaryDraft,
  updateMeeting: mocks.updateMeeting,
  updateMeetingMinutes: mocks.updateMeetingMinutes,
}));

vi.mock("@/modules/ai/services/ai-meeting-summary-service", () => ({
  buildAiMeetingSummaryDraft: mocks.buildAiMeetingSummaryDraft,
}));

vi.mock("@/modules/ai/services/ai-repository", () => ({
  aiRepository: {
    getActionProposal: mocks.getAiActionProposal,
    updateActionProposal: mocks.updateAiActionProposal,
  },
}));

import {
  addMeetingAttachmentAction,
  addMeetingFollowUpActionAction,
  approveMeetingAiSummaryAction,
  approveMeetingMinutesAction,
  createMeetingFollowUpTaskAction,
  createDecisionAction,
  createMeetingAction,
  generateMeetingAiSummaryDraftAction,
  linkMeetingDecisionTrackingAction,
  removeMeetingAttachmentAction,
  updateMeetingFollowUpActionStatusAction,
  updateMeetingAiSummaryDraftAction,
  updateMeetingAction,
  updateMeetingMinutesAction,
} from "@/modules/meetings/actions";

function decisionFormData() {
  const formData = new FormData();

  formData.set("decisionText", "Approve follow-up action.");
  formData.set("ownerId", "owner-01");
  formData.set("dueDate", "2026-06-05");
  formData.set("status", "open");

  return formData;
}

function meetingFormData() {
  const formData = new FormData();

  formData.set("organizationId", "org-green-nest");
  formData.set("projectIds", "project-a, project-b");
  formData.set("title", "Multi-project meeting");
  formData.set("meetingType", "PROJECT_MEETING");
  formData.set("visibility", "project");
  formData.set("participantScope", "project_team");
  formData.set("status", "SCHEDULED");
  formData.set("meetingDate", "2026-06-05T09:00:00.000Z");

  return formData;
}

function minutesFormData() {
  const formData = new FormData();

  formData.set("meetingMinutes", "Updated minutes");
  formData.set("summary", "Safe summary");

  return formData;
}

function attachmentFormData() {
  const formData = new FormData();

  formData.set("name", "Deck.pdf");
  formData.set("url", "https://example.com/deck.pdf");

  return formData;
}

function aiSummaryFormData() {
  const formData = new FormData();

  formData.set("content", "AI draft summary");

  return formData;
}

function followUpFormData() {
  const formData = new FormData();

  formData.set("title", "Confirm contractor action item");
  formData.set("ownerId", "owner-01");
  formData.set("dueDate", "2026-06-10");
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
    mocks.getScopedMeeting.mockResolvedValue({
      id: "meeting-01",
      organizationId: "org-green-nest",
      projectIds: ["project-a", "project-b"],
      title: "Meeting",
    });
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

    const result = await createDecisionAction("meeting-01", decisionFormData());

    expect(result.status).toBe("idle");
    expect(mocks.getScopedMeeting).toHaveBeenCalledWith(currentUser, "meeting-01");
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

  it("returns action-state errors for create decision from out-of-scope meeting", async () => {
    const currentUser = { id: "leader-01", role: "tong_giam_doc" };
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.getScopedMeeting.mockResolvedValue(undefined);

    const result = await createDecisionAction("meeting-01", decisionFormData());

    expect(result.status).toBe("error");
    expect(result.values?.decisionText).toBe("Approve follow-up action.");
    expect(mocks.createDecisionRecord).not.toHaveBeenCalled();
  });

  it("links an existing scoped decision into meeting tracking and revalidates related surfaces", async () => {
    const currentUser = { id: "leader-01", role: "tong_giam_doc" };
    const formData = new FormData();
    formData.set("decisionId", "decision-01");
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.getScopedMeeting.mockResolvedValue({
      id: "meeting-01",
      organizationId: "org-green-nest",
      projectIds: ["project-a", "project-b"],
      title: "Meeting",
    });
    mocks.getScopedDecision.mockResolvedValue({
      id: "decision-01",
      organizationId: "org-green-nest",
      projectId: "project-b",
      projectIds: ["project-b"],
      title: "Visible decision",
    });
    mocks.linkMeetingDecisionTracking.mockResolvedValue({
      id: "meeting-01",
      projectIds: ["project-a", "project-b"],
    });

    const result = await linkMeetingDecisionTrackingAction(
      "meeting-01",
      formData,
    );

    expect(result.status).toBe("idle");
    expect(mocks.linkMeetingDecisionTracking).toHaveBeenCalledWith(
      "meeting-01",
      { decisionId: "decision-01" },
      currentUser.id,
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/meetings");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/meetings/meeting-01");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/executive/decision-log");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/executive/decisions");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/command-center");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/projects/project-a");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/projects/project-b");
  });

  it("rejects linking unrelated out-of-scope decision before meeting mutation", async () => {
    const currentUser = { id: "leader-01", role: "tong_giam_doc" };
    const formData = new FormData();
    formData.set("decisionId", "decision-foreign");
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.getScopedMeeting.mockResolvedValue({
      id: "meeting-01",
      organizationId: "org-green-nest",
      projectIds: ["project-a"],
      title: "Meeting",
    });
    mocks.getScopedDecision.mockResolvedValue({
      id: "decision-foreign",
      organizationId: "org-other",
      projectId: "project-z",
      projectIds: ["project-z"],
    });

    const result = await linkMeetingDecisionTrackingAction(
      "meeting-01",
      formData,
    );

    expect(result.status).toBe("error");
    expect(result.values?.decisionId).toBe("decision-foreign");
    expect(mocks.linkMeetingDecisionTracking).not.toHaveBeenCalled();
  });

  it("rejects linking sparse-scope decisions without meeting source or matching scope", async () => {
    const currentUser = { id: "leader-01", role: "tong_giam_doc" };
    const formData = new FormData();
    formData.set("decisionId", "decision-sparse");
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.getScopedMeeting.mockResolvedValue({
      id: "meeting-01",
      organizationId: "org-green-nest",
      projectIds: ["project-a"],
      title: "Meeting",
    });
    mocks.getScopedDecision.mockResolvedValue({
      id: "decision-sparse",
      sourceType: "independent",
      sourceId: undefined,
    });

    const result = await linkMeetingDecisionTrackingAction(
      "meeting-01",
      formData,
    );

    expect(result.status).toBe("error");
    expect(result.values?.decisionId).toBe("decision-sparse");
    expect(mocks.linkMeetingDecisionTracking).not.toHaveBeenCalled();
  });

  it("checks every selected project before creating a multi-project meeting", async () => {
    const currentUser = { id: "assistant-01", role: "thu_ky_tro_ly" };
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.canCreateProjectMeeting.mockImplementation(
      async (_user, { projectId }: { projectId: string }) =>
        projectId === "project-a" ? { id: "project-a" } : undefined,
    );

    const result = await createMeetingAction(meetingFormData());

    expect(result.status).toBe("error");
    expect(result.message).toBe(
      "Bạn không có quyền tạo biên bản họp cho dự án này.",
    );

    expect(mocks.canCreateProjectMeeting).toHaveBeenCalledWith(currentUser, {
      organizationId: "org-green-nest",
      projectId: "project-a",
      axisId: "",
      departmentId: "",
    });
    expect(mocks.canCreateProjectMeeting).toHaveBeenCalledWith(currentUser, {
      organizationId: "org-green-nest",
      projectId: "project-b",
      axisId: "",
      departmentId: "",
    });
    expect(mocks.createMeeting).not.toHaveBeenCalled();
  });

  it("preserves repeated projectIds entries from multi-select form submissions", async () => {
    const currentUser = { id: "assistant-01", role: "thu_ky_tro_ly" };
    const formData = meetingFormData();
    formData.delete("projectIds");
    formData.append("projectIds", "project-a");
    formData.append("projectIds", "project-b");
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.canCreateProjectMeeting.mockResolvedValue(true);
    mocks.createMeeting.mockResolvedValue({
      id: "meeting-01",
      projectIds: ["project-a", "project-b"],
    });

    await createMeetingAction(formData);

    expect(mocks.createMeeting).toHaveBeenCalledWith(
      expect.objectContaining({
        projectIds: ["project-a", "project-b"],
      }),
      currentUser.id,
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/projects/project-a");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/projects/project-b");
  });

  it("validates scoped related records before creating a meeting and preserves repeated ids", async () => {
    const currentUser = { id: "assistant-01", role: "thu_ky_tro_ly" };
    const formData = meetingFormData();
    formData.append("relatedApprovals", "proposal-a");
    formData.append("relatedApprovals", "proposal-b");
    formData.append("relatedTasks", "task-a");
    formData.append("relatedDocuments", "document-a");
    formData.append("relatedRisks", "risk-a");
    formData.append("relatedDecisions", "decision-a");
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.canCreateProjectMeeting.mockResolvedValue(true);
    mocks.getScopedProposal.mockResolvedValue({
      proposal: { id: "proposal-a" },
    });
    mocks.getScopedTask.mockResolvedValue({ id: "task-a" });
    mocks.getScopedDocument.mockResolvedValue({ id: "document-a" });
    mocks.getScopedExecutiveRiskRecord.mockResolvedValue({ id: "risk-a" });
    mocks.getScopedDecision.mockResolvedValue({ id: "decision-a" });
    mocks.createMeeting.mockResolvedValue({
      id: "meeting-01",
      projectIds: ["project-a", "project-b"],
    });

    await createMeetingAction(formData);

    expect(mocks.getScopedProposal).toHaveBeenCalledWith(
      currentUser,
      "proposal-a",
    );
    expect(mocks.getScopedProposal).toHaveBeenCalledWith(
      currentUser,
      "proposal-b",
    );
    expect(mocks.getScopedTask).toHaveBeenCalledWith(currentUser, "task-a");
    expect(mocks.getScopedDocument).toHaveBeenCalledWith(
      currentUser,
      "document-a",
    );
    expect(mocks.getScopedExecutiveRiskRecord).toHaveBeenCalledWith(
      currentUser,
      "risk-a",
    );
    expect(mocks.getScopedDecision).toHaveBeenCalledWith(
      currentUser,
      "decision-a",
    );
    expect(mocks.createMeeting).toHaveBeenCalledWith(
      expect.objectContaining({
        relatedApprovals: ["proposal-a", "proposal-b"],
        relatedTasks: ["task-a"],
        relatedDocuments: ["document-a"],
        relatedRisks: ["risk-a"],
        relatedDecisions: ["decision-a"],
      }),
      currentUser.id,
    );
  });

  it("returns an action-state error and skips create when a related record is out of scope", async () => {
    const currentUser = { id: "assistant-01", role: "thu_ky_tro_ly" };
    const formData = meetingFormData();
    formData.append("relatedRisks", "risk-out-of-scope");
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.canCreateProjectMeeting.mockResolvedValue(true);
    mocks.getScopedExecutiveRiskRecord.mockResolvedValue(undefined);

    const result = await createMeetingAction(formData);

    expect(result.status).toBe("error");
    expect(result.message).toBe(
      "Lien ket risk/blocker khong nam trong pham vi cua ban.",
    );
    expect(result.values?.relatedRisks).toEqual(["risk-out-of-scope"]);
    expect(mocks.createMeeting).not.toHaveBeenCalled();
  });

  it("returns an action-state error and skips update when an edited related record is out of scope", async () => {
    const currentUser = { id: "assistant-01", role: "tong_giam_doc" };
    const formData = meetingFormData();
    formData.append("relatedTasks", "task-out-of-scope");
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.getScopedMeeting.mockResolvedValue({
      id: "meeting-01",
      title: "Meeting",
    });
    mocks.getScopedTask.mockResolvedValue(undefined);

    const result = await updateMeetingAction("meeting-01", formData);

    expect(result.status).toBe("error");
    expect(result.message).toBe(
      "Lien ket task khong nam trong pham vi cua ban.",
    );
    expect(result.values?.relatedTasks).toEqual(["task-out-of-scope"]);
    expect(mocks.updateMeeting).not.toHaveBeenCalled();
  });

  it("submits full mutable edit fields without accepting scope mutation fields", async () => {
    const currentUser = { id: "assistant-01", role: "tong_giam_doc" };
    const formData = meetingFormData();
    formData.set("organizationId", "org-hijack");
    formData.set("axisId", "axis-hijack");
    formData.set("departmentId", "department-hijack");
    formData.set("hostId", "leader-01");
    formData.set("participants", "leader-01, assistant-01");
    formData.set("externalParticipants", "UBND");
    formData.set("roomId", "online-placeholder");
    formData.set("agenda", "Review related records");
    formData.set("meetingMinutes", "Draft minutes");
    formData.append("relatedApprovals", "proposal-a");
    formData.append("relatedTasks", "task-a");
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.getMeeting.mockResolvedValue({ id: "meeting-01", title: "Meeting" });
    mocks.getScopedMeeting.mockResolvedValue({
      id: "meeting-01",
      title: "Meeting",
    });
    mocks.getScopedProposal.mockResolvedValue({
      proposal: { id: "proposal-a" },
    });
    mocks.getScopedTask.mockResolvedValue({ id: "task-a" });
    mocks.updateMeeting.mockResolvedValue({
      id: "meeting-01",
      projectId: "project-a",
      projectIds: ["project-a"],
    });

    await updateMeetingAction("meeting-01", formData);

    expect(mocks.updateMeeting).toHaveBeenCalledWith(
      "meeting-01",
      expect.objectContaining({
        title: "Multi-project meeting",
        meetingType: "PROJECT_MEETING",
        visibility: "project",
        participantScope: "project_team",
        status: "SCHEDULED",
        meetingDate: "2026-06-05T09:00:00.000Z",
        hostId: "leader-01",
        participants: ["leader-01", "assistant-01"],
        externalParticipants: ["UBND"],
        roomId: "online-placeholder",
        agenda: "Review related records",
        meetingMinutes: "Draft minutes",
        relatedApprovals: ["proposal-a"],
        relatedTasks: ["task-a"],
      }),
      currentUser.id,
    );
    expect(mocks.getMeeting).not.toHaveBeenCalled();
    expect(mocks.updateMeeting.mock.calls[0][1]).not.toHaveProperty(
      "organizationId",
    );
    expect(mocks.updateMeeting.mock.calls[0][1]).not.toHaveProperty("axisId");
    expect(mocks.updateMeeting.mock.calls[0][1]).not.toHaveProperty(
      "departmentId",
    );
  });

  it("requires organization-scope create permission when no project scope is selected", async () => {
    const currentUser = { id: "assistant-01", role: "thu_ky_tro_ly" };
    const formData = meetingFormData();
    formData.delete("projectIds");
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.canCreateOrganizationMeeting.mockResolvedValue(false);

    const result = await createMeetingAction(formData);

    expect(result.status).toBe("error");
    expect(result.message).toBe(
      "Bạn không có quyền tạo biên bản họp cấp tổ chức.",
    );

    expect(mocks.getScopedProject).not.toHaveBeenCalled();
    expect(mocks.canCreateProjectMeeting).not.toHaveBeenCalled();
    expect(mocks.canCreateOrganizationMeeting).toHaveBeenCalledWith(
      currentUser,
      {
        organizationId: "org-green-nest",
        axisId: "",
        departmentId: "",
      },
    );
    expect(mocks.createMeeting).not.toHaveBeenCalled();
  });

  it("updates meeting minutes only after scoped meeting and update permission pass", async () => {
    const currentUser = { id: "assistant-01", role: "tong_giam_doc" };
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.getScopedMeeting.mockResolvedValue({
      id: "meeting-01",
      projectId: "project-a",
      projectIds: ["project-a", "project-b"],
      title: "Meeting",
    });
    mocks.updateMeetingMinutes.mockResolvedValue({
      id: "meeting-01",
      projectId: "project-a",
      projectIds: ["project-a", "project-b"],
    });

    const result = await updateMeetingMinutesAction(
      "meeting-01",
      minutesFormData(),
    );

    expect(result.status).toBe("idle");
    expect(mocks.updateMeetingMinutes).toHaveBeenCalledWith(
      "meeting-01",
      { meetingMinutes: "Updated minutes", summary: "Safe summary" },
      currentUser.id,
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/meetings");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/meetings/meeting-01");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/projects/project-a");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/projects/project-b");
  });

  it("returns an action-state error when minutes update targets an out-of-scope meeting", async () => {
    const currentUser = { id: "assistant-01", role: "tong_giam_doc" };
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.getScopedMeeting.mockResolvedValue(undefined);

    const result = await updateMeetingMinutesAction(
      "meeting-01",
      minutesFormData(),
    );

    expect(result.status).toBe("error");
    expect(result.message).toBe("Ban khong co quyen cap nhat cuoc hop nay.");
    expect(result.values?.meetingMinutes).toBe("Updated minutes");
    expect(mocks.updateMeetingMinutes).not.toHaveBeenCalled();
  });

  it("rejects out-of-scope document attachments before mutating the meeting", async () => {
    const currentUser = { id: "assistant-01", role: "tong_giam_doc" };
    const formData = attachmentFormData();
    formData.delete("url");
    formData.set("documentId", "document-out-of-scope");
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.getScopedMeeting.mockResolvedValue({
      id: "meeting-01",
      title: "Meeting",
    });
    mocks.getScopedDocument.mockResolvedValue(undefined);

    const result = await addMeetingAttachmentAction("meeting-01", formData);

    expect(result.status).toBe("error");
    expect(result.values?.documentId).toBe("document-out-of-scope");
    expect(mocks.addMeetingAttachment).not.toHaveBeenCalled();
  });

  it("rejects binary attachment upload because storage upload is not implemented", async () => {
    const currentUser = { id: "assistant-01", role: "tong_giam_doc" };
    const formData = attachmentFormData();
    formData.append(
      "attachmentFile",
      new Blob(["file"], { type: "application/pdf" }),
      "deck.pdf",
    );
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.getScopedMeeting.mockResolvedValue({
      id: "meeting-01",
      title: "Meeting",
    });

    const result = await addMeetingAttachmentAction("meeting-01", formData);

    expect(result.status).toBe("error");
    expect(result.message).toContain("Storage upload");
    expect(mocks.addMeetingAttachment).not.toHaveBeenCalled();
  });

  it("rejects zero-byte binary attachment upload before mutating the meeting", async () => {
    const currentUser = { id: "assistant-01", role: "tong_giam_doc" };
    const formData = attachmentFormData();
    formData.append(
      "attachmentFile",
      new Blob([], { type: "application/pdf" }),
      "empty.pdf",
    );
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.getScopedMeeting.mockResolvedValue({
      id: "meeting-01",
      title: "Meeting",
    });

    const result = await addMeetingAttachmentAction("meeting-01", formData);

    expect(result.status).toBe("error");
    expect(result.message).toContain("Storage upload");
    expect(mocks.addMeetingAttachment).not.toHaveBeenCalled();
  });

  it("adds and removes attachments through scoped meeting actions", async () => {
    const currentUser = { id: "assistant-01", role: "tong_giam_doc" };
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.getScopedMeeting.mockResolvedValue({
      attachments: [
        {
          id: "attachment-01",
          name: "Deck.pdf",
          url: "https://example.com/deck.pdf",
        },
      ],
      id: "meeting-01",
      projectId: "project-a",
      projectIds: ["project-a"],
      title: "Meeting",
    });
    mocks.addMeetingAttachment.mockResolvedValue({
      id: "meeting-01",
      projectId: "project-a",
      projectIds: ["project-a"],
    });
    mocks.removeMeetingAttachment.mockResolvedValue({
      id: "meeting-01",
      projectId: "project-a",
      projectIds: ["project-a"],
    });
    const removeFormData = new FormData();
    removeFormData.set("attachmentId", "attachment-01");

    await addMeetingAttachmentAction("meeting-01", attachmentFormData());
    await removeMeetingAttachmentAction("meeting-01", removeFormData);

    expect(mocks.addMeetingAttachment).toHaveBeenCalledWith(
      "meeting-01",
      { name: "Deck.pdf", url: "https://example.com/deck.pdf" },
      currentUser.id,
    );
    expect(mocks.removeMeetingAttachment).toHaveBeenCalledWith(
      "meeting-01",
      "attachment-01",
      currentUser.id,
    );
  });

  it("updates and approves AI summary through meeting update permission", async () => {
    const currentUser = { id: "assistant-01", role: "tong_giam_doc" };
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.getScopedMeeting.mockResolvedValue({
      id: "meeting-01",
      projectId: "project-a",
      projectIds: ["project-a"],
      title: "Meeting",
    });
    mocks.updateMeetingAiSummaryDraft.mockResolvedValue({
      id: "meeting-01",
      projectId: "project-a",
      projectIds: ["project-a"],
    });
    mocks.approveMeetingAiSummary.mockResolvedValue({
      id: "meeting-01",
      projectId: "project-a",
      projectIds: ["project-a"],
    });

    await updateMeetingAiSummaryDraftAction(
      "meeting-01",
      aiSummaryFormData(),
    );
    await approveMeetingAiSummaryAction("meeting-01", new FormData());

    expect(mocks.updateMeetingAiSummaryDraft).toHaveBeenCalledWith(
      "meeting-01",
      { content: "AI draft summary" },
      currentUser.id,
    );
    expect(mocks.approveMeetingAiSummary).toHaveBeenCalledWith(
      "meeting-01",
      currentUser.id,
    );
  });

  it("generates a provider AI summary draft through scoped meeting update permission", async () => {
    const currentUser = { id: "assistant-01", role: "tong_giam_doc" };
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.getScopedMeeting.mockResolvedValue({
      aiSummary: { status: "APPROVED", content: "Previous official summary" },
      attachments: [
        {
          documentId: "document-visible",
          id: "attachment-01",
          name: "Visible deck",
        },
      ],
      id: "meeting-01",
      meetingMinutes: "Scoped minutes",
      projectId: "project-a",
      projectIds: ["project-a"],
      relatedApprovals: ["proposal-visible"],
      relatedRecords: [
        {
          id: "document-visible",
          relationType: "context",
          type: "document",
        },
        {
          id: "risk-hidden",
          relationType: "context",
          type: "risk",
        },
      ],
      relatedTasks: ["task-visible"],
      title: "Meeting",
    });
    mocks.getScopedDocument.mockResolvedValue({
      id: "document-visible",
      title: "Visible document",
    });
    mocks.getScopedExecutiveRiskRecord.mockResolvedValue(undefined);
    mocks.getScopedProject.mockImplementation(
      async (_user, projectId: string) =>
        projectId === "project-a" ? { id: "project-a" } : undefined,
    );
    mocks.getScopedProposal.mockResolvedValue({
      proposal: {
        code: "DX-001",
        id: "proposal-visible",
        title: "Visible approval",
      },
    });
    mocks.getScopedTask.mockResolvedValue({
      id: "task-visible",
      title: "Visible task",
    });
    mocks.buildAiMeetingSummaryDraft.mockResolvedValue({
      actionProposals: [
        {
          actionKey: "create_meeting_action_item",
          affectedFields: ["decisions"],
          id: "proposal-meeting",
          previewTitle: "Create action item",
          requiredPermission: "decision.create",
          sourceCitationIds: ["meeting-source-meeting-01"],
          status: "proposed",
          targetEntityId: "meeting-01",
          targetEntityType: "meeting",
          workflowStatus: "DRAFT",
        },
      ],
      citations: [
        {
          id: "meeting-source-meeting-01",
          sourceId: "meeting-01",
          sourceType: "meeting",
          title: "Meeting",
        },
      ],
      generatedFrom: ["meeting", "minutes"],
      jobId: "job-meeting",
      status: "draft",
      text: "Provider draft summary",
      updatedAt: "2026-06-04T01:00:00.000Z",
    });
    mocks.updateMeetingAiSummaryDraft.mockResolvedValue({
      aiSummary: { status: "DRAFT" },
      id: "meeting-01",
      projectId: "project-a",
      projectIds: ["project-a"],
      updatedAt: "2026-06-04T01:01:00.000Z",
    });
    mocks.getAiActionProposal.mockResolvedValue({
      id: "proposal-meeting",
      proposedPayload: {
        currentAiSummaryStatus: "APPROVED",
        currentMeetingUpdatedAt: "2026-06-04T00:00:00.000Z",
        meetingId: "meeting-01",
      },
    });
    const formData = new FormData();
    formData.set("returnTo", "/meetings/meeting-01?scopeId=scope-a");

    const result = await generateMeetingAiSummaryDraftAction(
      "meeting-01",
      formData,
    );

    expect(result.status).toBe("idle");
    expect(mocks.buildAiMeetingSummaryDraft).toHaveBeenCalledWith(
      currentUser,
      expect.objectContaining({
        meeting: expect.objectContaining({ id: "meeting-01" }),
        visibleAttachments: [
          expect.objectContaining({ documentId: "document-visible" }),
        ],
        returnToHref: "/meetings/meeting-01?scopeId=scope-a",
        visibleProjectIds: ["project-a"],
        visibleRelatedRecords: expect.arrayContaining([
          expect.objectContaining({
            id: "proposal-visible",
            type: "approval",
          }),
          expect.objectContaining({ id: "document-visible", type: "document" }),
          expect.objectContaining({ id: "task-visible", type: "task" }),
        ]),
      }),
      expect.objectContaining({
        createActionProposal: false,
        useProvider: true,
      }),
    );
    expect(mocks.updateMeetingAiSummaryDraft).toHaveBeenCalledWith(
      "meeting-01",
      { content: "Provider draft summary" },
      currentUser.id,
    );
    expect(mocks.approveMeetingAiSummary).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/ai");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/ai/jobs/job-meeting");
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      "/meetings/meeting-01?scopeId=scope-a",
    );
    expect(mocks.updateAiActionProposal).toHaveBeenCalledWith(
      "proposal-meeting",
      expect.objectContaining({
        proposedPayload: expect.objectContaining({
          currentAiSummaryStatus: "DRAFT",
          currentMeetingUpdatedAt: "2026-06-04T01:01:00.000Z",
        }),
        updatedAt: "2026-06-04T01:01:00.000Z",
      }),
    );
  });

  it("does not overwrite an existing summary when provider generation is unavailable", async () => {
    const currentUser = { id: "assistant-01", role: "tong_giam_doc" };
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.getScopedMeeting.mockResolvedValue({
      aiSummary: { status: "APPROVED", content: "Previous official summary" },
      attachments: [],
      id: "meeting-01",
      meetingMinutes: "Scoped minutes",
      projectId: "project-a",
      projectIds: ["project-a"],
      title: "Meeting",
    });
    mocks.buildAiMeetingSummaryDraft.mockResolvedValue({
      actionProposals: [],
      citations: [],
      generatedFrom: ["meeting", "minutes"],
      status: "unavailable",
      text: "AI Meeting Summary tam thoi khong kha dung.",
      updatedAt: "2026-06-04T01:00:00.000Z",
    });

    const result = await generateMeetingAiSummaryDraftAction(
      "meeting-01",
      new FormData(),
    );

    expect(result.status).toBe("error");
    expect(result.message).toContain("tam thoi khong kha dung");
    expect(mocks.updateMeetingAiSummaryDraft).not.toHaveBeenCalled();
  });

  it("adds follow-up actions through scoped meeting update permission without requiring task.create", async () => {
    const currentUser = { id: "assistant-01", role: "tong_giam_doc" };
    const formData = followUpFormData();
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.getScopedMeeting.mockResolvedValue({
      id: "meeting-01",
      projectId: "project-a",
      projectIds: ["project-a"],
      status: "COMPLETED",
      title: "Meeting",
    });
    mocks.addMeetingFollowUpAction.mockResolvedValue({
      id: "meeting-01",
      projectId: "project-a",
      projectIds: ["project-a"],
    });

    const result = await addMeetingFollowUpActionAction(
      "meeting-01",
      formData,
    );

    expect(result.status).toBe("idle");
    expect(mocks.addMeetingFollowUpAction).toHaveBeenCalledWith(
      "meeting-01",
      {
        title: "Confirm contractor action item",
        ownerId: "owner-01",
        dueDate: "2026-06-10",
        status: "open",
      },
      currentUser.id,
    );
    expect(mocks.getScopedProject).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/meetings");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/meetings/meeting-01");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/projects/project-a");
  });

  it("validates task permission and scoped project before creating a related follow-up task", async () => {
    const currentUser = { id: "assistant-01", role: "tong_giam_doc" };
    const formData = followUpFormData();
    formData.set("createRelatedTask", "on");
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.getScopedMeeting.mockResolvedValue({
      id: "meeting-01",
      projectId: "project-a",
      projectIds: ["project-a"],
      status: "COMPLETED",
      title: "Meeting",
    });
    mocks.getScopedProject.mockResolvedValue({ id: "project-a" });
    mocks.addMeetingFollowUpAction.mockResolvedValue({
      id: "meeting-01",
      projectId: "project-a",
      projectIds: ["project-a"],
    });

    const result = await addMeetingFollowUpActionAction(
      "meeting-01",
      formData,
    );

    expect(result.status).toBe("idle");
    expect(mocks.getScopedProject).toHaveBeenCalledWith(
      currentUser,
      "project-a",
    );
    expect(mocks.addMeetingFollowUpAction).toHaveBeenCalledWith(
      "meeting-01",
      expect.objectContaining({
        createRelatedTask: true,
        taskProjectId: "project-a",
      }),
      currentUser.id,
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/tasks");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/command-center");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/executive");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/executive/meetings");
  });

  it("rejects follow-up task creation before any service write when task permission fails", async () => {
    const currentUser = { id: "viewer-01", role: "viewer" };
    const formData = followUpFormData();
    formData.set("createRelatedTask", "on");
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.getScopedMeeting.mockResolvedValue({
      id: "meeting-01",
      projectId: "project-a",
      projectIds: ["project-a"],
      status: "COMPLETED",
      title: "Meeting",
    });

    const result = await addMeetingFollowUpActionAction(
      "meeting-01",
      formData,
    );

    expect(result.status).toBe("error");
    expect(result.values?.title).toBe("Confirm contractor action item");
    expect(mocks.getScopedProject).not.toHaveBeenCalled();
    expect(mocks.addMeetingFollowUpAction).not.toHaveBeenCalled();
  });

  it("creates a task for an existing follow-up only after task target project is scoped", async () => {
    const currentUser = { id: "assistant-01", role: "tong_giam_doc" };
    const formData = new FormData();
    formData.set("taskProjectId", "project-b");
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.getScopedMeeting.mockResolvedValue({
      id: "meeting-01",
      projectIds: ["project-a", "project-b"],
      status: "FOLLOW_UP_PENDING",
      title: "Meeting",
    });
    mocks.getScopedProject.mockResolvedValue({ id: "project-b" });
    mocks.createMeetingFollowUpTask.mockResolvedValue({
      id: "meeting-01",
      projectId: "project-a",
      projectIds: ["project-a", "project-b"],
    });

    const result = await createMeetingFollowUpTaskAction(
      "meeting-01",
      "follow-up-01",
      formData,
    );

    expect(result.status).toBe("idle");
    expect(mocks.getScopedProject).toHaveBeenCalledWith(
      currentUser,
      "project-b",
    );
    expect(mocks.createMeetingFollowUpTask).toHaveBeenCalledWith(
      "meeting-01",
      "follow-up-01",
      { taskProjectId: "project-b" },
      currentUser.id,
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/tasks");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/command-center");
  });

  it("updates follow-up status through scoped meeting update permission", async () => {
    const currentUser = { id: "assistant-01", role: "tong_giam_doc" };
    const formData = new FormData();
    formData.set("status", "done");
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.getScopedMeeting.mockResolvedValue({
      id: "meeting-01",
      projectId: "project-a",
      projectIds: ["project-a"],
      status: "FOLLOW_UP_PENDING",
      title: "Meeting",
    });
    mocks.updateMeetingFollowUpActionStatus.mockResolvedValue({
      id: "meeting-01",
      projectId: "project-a",
      projectIds: ["project-a"],
    });

    const result = await updateMeetingFollowUpActionStatusAction(
      "meeting-01",
      "follow-up-01",
      formData,
    );

    expect(result.status).toBe("idle");
    expect(mocks.updateMeetingFollowUpActionStatus).toHaveBeenCalledWith(
      "meeting-01",
      "follow-up-01",
      { status: "done" },
      currentUser.id,
    );
  });

  it("blocks minutes approval when the user lacks meeting.update", async () => {
    const currentUser = { id: "viewer-01", role: "viewer" };
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.getScopedMeeting.mockResolvedValue({
      id: "meeting-01",
      title: "Meeting",
    });

    const result = await approveMeetingMinutesAction(
      "meeting-01",
      new FormData(),
    );

    expect(result.status).toBe("error");
    expect(mocks.approveMeetingMinutes).not.toHaveBeenCalled();
  });
});
