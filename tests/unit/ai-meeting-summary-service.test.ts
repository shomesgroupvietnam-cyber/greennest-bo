import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PermissionUser } from "@/lib/permissions/can";
import {
  buildAiMeetingSummaryDraft,
  type AiMeetingSummaryRunAi,
} from "@/modules/ai/services/ai-meeting-summary-service";
import { JsonAiRepository } from "@/modules/ai/services/ai-repository";
import type {
  AiAskInput,
  AiAskResult,
  AiCitation,
} from "@/modules/ai/types";
import type { Meeting } from "@/modules/meetings/types";

let tempDir: string;
let aiRepository: JsonAiRepository;

const meetingLeader: PermissionUser = {
  id: "leader-01",
  permissions: [
    "ai.ask",
    "ai.create_draft",
    "ai.propose_action",
    "decision.create",
  ],
  permissionsMode: "replace",
  role: "pending",
};

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-ai-meeting-"));
  aiRepository = new JsonAiRepository(path.join(tempDir, "ai-jobs.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("AI meeting summary service", () => {
  it("builds a provider-backed draft from scoped meeting minutes with app-approved citations", async () => {
    let capturedInput: AiAskInput | undefined;
    const runAi: AiMeetingSummaryRunAi = async (input) => {
      capturedInput = input;

      return buildAiResult({
        citations: [providerCitation("meeting", "meeting-01")],
      });
    };

    const summary = await buildAiMeetingSummaryDraft(
      meetingLeader,
      {
        generatedAt: "2026-06-04T01:00:00.000Z",
        meeting: meetingFixture(),
        visibleAttachments: [
          {
            id: "attachment-visible",
            name: "Visible deck",
            documentId: "document-visible",
          },
        ],
        visibleProjectIds: ["project-a"],
        visibleRelatedRecords: [
          {
            href: "/tasks/task-visible",
            id: "task-visible",
            label: "Visible scoped task",
            type: "task",
          },
        ],
      },
      { runAi, useProvider: true },
    );

    expect(summary).toMatchObject({
      interactionId: "interaction-meeting",
      jobId: "job-meeting",
      status: "draft",
      text: "AI draft meeting summary [CIT-001]",
    });
    expect(summary.citations).toEqual([
      expect.objectContaining({
        sourceId: "meeting-01",
        sourceType: "meeting",
      }),
    ]);
    expect(capturedInput).toMatchObject({
      intent: "AI Meeting Summary",
      mode: "fast",
      module: "meetings",
      projectId: "project-a",
      resourceRefs: expect.arrayContaining([
        { entityId: "meeting-01", entityType: "meeting" },
        { entityId: "task-visible", entityType: "task" },
        { entityId: "document-visible", entityType: "document" },
      ]),
      useRag: false,
      wantsActionProposal: false,
    });
    expect(capturedInput?.prompt).toContain("Draft/goi y");
    expect(capturedInput?.prompt).toContain("Meeting minutes");
    expect(capturedInput?.prompt).toContain("Visible scoped task");
    expect(capturedInput?.prompt).not.toContain("Hidden related record");
    expect(capturedInput?.prompt).not.toContain("hidden-document");
  });

  it("returns placeholder context when provider mode is disabled", async () => {
    const runAi = vi.fn();

    const summary = await buildAiMeetingSummaryDraft(
      meetingLeader,
      {
        generatedAt: "2026-06-04T01:00:00.000Z",
        meeting: meetingFixture(),
      },
      { runAi, useProvider: false },
    );

    expect(runAi).not.toHaveBeenCalled();
    expect(summary).toMatchObject({
      actionProposals: [],
      status: "placeholder",
    });
    expect(summary.text).toContain("Meeting AI Summary chua goi provider");
    expect(summary.citations.map((citation) => citation.sourceType)).toContain(
      "meeting",
    );
  });

  it("returns insufficient context without minutes or transcript", async () => {
    const runAi = vi.fn();

    const summary = await buildAiMeetingSummaryDraft(
      meetingLeader,
      {
        generatedAt: "2026-06-04T01:00:00.000Z",
        meeting: meetingFixture({
          meetingMinutes: undefined,
          transcript: undefined,
        }),
      },
      { runAi, useProvider: true },
    );

    expect(runAi).not.toHaveBeenCalled();
    expect(summary).toMatchObject({
      actionProposals: [],
      citations: [],
      status: "insufficient_context",
    });
  });

  it("returns unavailable when the gateway/provider fails", async () => {
    const summary = await buildAiMeetingSummaryDraft(
      meetingLeader,
      {
        generatedAt: "2026-06-04T01:00:00.000Z",
        meeting: meetingFixture(),
      },
      {
        runAi: async () => {
          throw new Error("provider failed");
        },
        useProvider: true,
      },
    );

    expect(summary).toMatchObject({
      actionProposals: [],
      citations: [],
      generatedFrom: ["meeting", "minutes", "transcript"],
      status: "unavailable",
    });
  });

  it("rejects provider citations outside the app-approved source map", async () => {
    const summary = await buildAiMeetingSummaryDraft(
      meetingLeader,
      {
        generatedAt: "2026-06-04T01:00:00.000Z",
        meeting: meetingFixture(),
      },
      {
        runAi: async () =>
          buildAiResult({
            citations: [providerCitation("document", "hidden-document")],
          }),
        useProvider: true,
      },
    );

    expect(summary).toMatchObject({
      actionProposals: [],
      citations: [],
      status: "insufficient_context",
    });
  });

  it("keeps hidden meeting project ids out of provider prompt and citations", async () => {
    let capturedInput: AiAskInput | undefined;

    const summary = await buildAiMeetingSummaryDraft(
      meetingLeader,
      {
        generatedAt: "2026-06-04T01:00:00.000Z",
        meeting: meetingFixture({
          projectId: "project-hidden",
          projectIds: ["project-visible", "project-hidden"],
        }),
        visibleProjectIds: ["project-visible"],
      },
      {
        runAi: async (input) => {
          capturedInput = input;

          return buildAiResult({
            citations: [
              providerCitation("meeting", "meeting-01"),
              providerCitation("project", "project-visible"),
            ],
          });
        },
        useProvider: true,
      },
    );

    expect(summary.status).toBe("draft");
    expect(capturedInput?.projectId).toBe("project-visible");
    expect(capturedInput?.resourceRefs).toEqual(
      expect.arrayContaining([
        { entityId: "project-visible", entityType: "project" },
      ]),
    );
    expect(capturedInput?.prompt).toContain("Project project-visible");
    expect(capturedInput?.prompt).not.toContain("project-hidden");
  });

  it("includes scoped meeting decisions and follow-up actions in provider context", async () => {
    let capturedInput: AiAskInput | undefined;

    const summary = await buildAiMeetingSummaryDraft(
      meetingLeader,
      {
        generatedAt: "2026-06-04T01:00:00.000Z",
        meeting: meetingFixture({
          decisions: [
            {
              decisionText: "Approve recovery plan",
              id: "decision-visible",
              status: "open",
            },
          ],
          followUpActions: [
            {
              id: "follow-up-visible",
              status: "open",
              title: "Confirm contractor acceleration",
            },
          ],
        }),
        visibleProjectIds: ["project-a"],
      },
      {
        runAi: async (input) => {
          capturedInput = input;

          return buildAiResult({
            citations: [providerCitation("meeting", "meeting-01")],
          });
        },
        useProvider: true,
      },
    );

    expect(summary.generatedFrom).toEqual(
      expect.arrayContaining(["decisions", "follow_up_actions"]),
    );
    expect(capturedInput?.prompt).toContain("Visible meeting decisions");
    expect(capturedInput?.prompt).toContain("Approve recovery plan");
    expect(capturedInput?.prompt).toContain("Visible meeting follow-up actions");
    expect(capturedInput?.prompt).toContain("Confirm contractor acceleration");
  });

  it("does not request action proposals unless the user explicitly asks and has permissions", async () => {
    const draftOnlyUser: PermissionUser = {
      id: "draft-only",
      permissions: ["ai.ask", "ai.create_draft"],
      permissionsMode: "replace",
      role: "pending",
    };
    let capturedInput: AiAskInput | undefined;

    const summary = await buildAiMeetingSummaryDraft(
      draftOnlyUser,
      {
        generatedAt: "2026-06-04T01:00:00.000Z",
        meeting: meetingFixture(),
      },
      {
        createActionProposal: true,
        runAi: async (input) => {
          capturedInput = input;

          return buildAiResult({
            citations: [providerCitation("meeting", "meeting-01")],
          });
        },
        useProvider: true,
      },
    );

    expect(capturedInput?.wantsActionProposal).toBe(false);
    expect(summary.actionProposals).toEqual([]);
  });

  it("creates meeting action item proposals as draft previews only when requested", async () => {
    const result = await buildAiMeetingSummaryDraft(
      meetingLeader,
      {
        generatedAt: "2026-06-04T01:00:00.000Z",
        meeting: meetingFixture(),
        returnToHref: "/meetings/meeting-01?scopeId=scope-a",
      },
      {
        createActionProposal: true,
        gatewayOptions: { aiRepo: aiRepository },
        runAi: async () =>
          buildAiResult({
            citations: [providerCitation("meeting", "meeting-01")],
          }),
        useProvider: true,
      },
    );
    const persisted = await aiRepository.listActionProposals({
      jobId: "job-meeting",
    });

    expect(result.status).toBe("draft");
    expect(result.actionProposals).toHaveLength(1);
    expect(result.actionProposals[0]).toMatchObject({
      actionKey: "create_meeting_action_item",
      returnToHref: "/meetings/meeting-01?scopeId=scope-a",
      status: "proposed",
      targetEntityId: "meeting-01",
      targetEntityType: "meeting",
      workflowStatus: "DRAFT",
    });
    expect(persisted[0]).toMatchObject({
      actionKey: "create_meeting_action_item",
      requiredPermission: "decision.create",
      status: "proposed",
      targetEntityId: "meeting-01",
      targetEntityType: "meeting",
      workflowStatus: "DRAFT",
    });
    expect(persisted[0]?.proposedPayload).toMatchObject({
      affectedFields: ["decisions"],
      currentAiSummaryStatus: "DRAFT",
      currentMeetingUpdatedAt: "2026-06-03T00:00:00.000Z",
      meetingId: "meeting-01",
      requiredPermission: "decision.create",
      sourceCitationIds: ["meeting-source-meeting-01"],
      targetEntityType: "meeting",
    });
  });

  it("keeps reusable meeting action proposal previews visible after draft persistence updates the meeting timestamp", async () => {
    await buildAiMeetingSummaryDraft(
      meetingLeader,
      {
        generatedAt: "2026-06-04T01:00:00.000Z",
        meeting: meetingFixture(),
        returnToHref: "/meetings/meeting-01",
      },
      {
        createActionProposal: true,
        gatewayOptions: { aiRepo: aiRepository },
        runAi: async () =>
          buildAiResult({
            citations: [providerCitation("meeting", "meeting-01")],
          }),
        useProvider: true,
      },
    );
    const [proposal] = await aiRepository.listActionProposals({
      jobId: "job-meeting",
    });

    expect(proposal).toBeDefined();
    await aiRepository.updateActionProposal(proposal!.id, {
      proposedPayload: {
        ...proposal.proposedPayload,
        currentMeetingUpdatedAt: "2026-06-04T01:04:00.000Z",
      },
      updatedAt: "2026-06-04T01:04:00.000Z",
    });

    const placeholder = await buildAiMeetingSummaryDraft(
      meetingLeader,
      {
        generatedAt: "2026-06-04T01:05:00.000Z",
        meeting: meetingFixture({
          updatedAt: "2026-06-04T01:04:00.000Z",
        }),
        returnToHref: "/meetings/meeting-01",
      },
      {
        gatewayOptions: { aiRepo: aiRepository },
        useProvider: false,
      },
    );

    expect(placeholder.status).toBe("placeholder");
    expect(placeholder.actionProposals).toEqual([
      expect.objectContaining({
        actionKey: "create_meeting_action_item",
        status: "proposed",
        targetEntityId: "meeting-01",
      }),
    ]);
  });
});

function meetingFixture(patch: Partial<Meeting> = {}): Meeting {
  return {
    agenda: "Review site progress and open risks.",
    aiSummary: { status: "DRAFT" },
    attachments: [
      {
        documentId: "hidden-document",
        id: "hidden-attachment",
        name: "Hidden attachment title",
      },
    ],
    auditLog: [],
    createdAt: "2026-06-01T00:00:00.000Z",
    decisions: [],
    externalParticipants: [],
    followUpActions: [],
    id: "meeting-01",
    meetingDate: "2026-06-04T09:00:00.000Z",
    meetingMinutes: "Meeting minutes: contractor committed recovery plan.",
    meetingMinutesApproval: { status: "DRAFT" },
    meetingType: "PROJECT_MEETING",
    organizationId: "org-green-nest",
    participants: ["leader-01"],
    participantScope: "project_team",
    projectId: "project-a",
    projectIds: ["project-a"],
    relatedApprovals: [],
    relatedRecords: [
      {
        id: "hidden-risk",
        relationType: "context",
        title: "Hidden related record",
        type: "risk",
      },
    ],
    relatedTasks: [],
    startTime: "2026-06-04T09:00:00.000Z",
    status: "COMPLETED",
    title: "Weekly coordination",
    transcript: "Transcript: team discussed revised delivery dates.",
    updatedAt: "2026-06-03T00:00:00.000Z",
    visibility: "project",
    ...patch,
  };
}

function providerCitation(entityType: string, entityId: string): AiCitation {
  return {
    citationType: "internal_record",
    createdAt: "2026-06-04T01:00:00.000Z",
    entityId,
    entityType,
    id: `provider-${entityType}-${entityId}`,
    interactionId: "interaction-meeting",
    jobId: "job-meeting",
    module: "meetings",
    projectId: entityType === "project" ? entityId : "project-a",
    title: `${entityType} ${entityId}`,
  };
}

function buildAiResult(input: { citations: AiCitation[] }): AiAskResult {
  const timestamp = "2026-06-04T01:00:00.000Z";

  return {
    actionProposals: [],
    citations: input.citations,
    interaction: {
      completedAt: timestamp,
      createdAt: timestamp,
      id: "interaction-meeting",
      intent: "AI Meeting Summary",
      mode: "fast",
      modelName: "mock",
      modelProvider: "mock",
      module: "meetings",
      promptSummary: "Meeting summary",
      requestedBy: "leader-01",
      responseText: "AI draft meeting summary [CIT-001]",
      scopeSnapshot: {
        capturedAt: timestamp,
        module: "meetings",
        permissions: [],
        projectId: "project-a",
        resourceRefs: [],
        role: "pending",
        scopeKind: "internal_full",
        userId: "leader-01",
      },
      status: "succeeded",
      updatedAt: timestamp,
    },
    job: {
      createdAt: timestamp,
      finishedAt: timestamp,
      id: "job-meeting",
      interactionId: "interaction-meeting",
      intent: "AI Meeting Summary",
      mode: "fast",
      module: "meetings",
      payload: {
        intent: "AI Meeting Summary",
        knowledgeModule: "meetings",
        prompt: "Meeting summary",
        useRag: false,
        wantsActionProposal: false,
      },
      priority: "normal",
      projectId: "project-a",
      rateLimitKey: "test",
      requestedBy: "leader-01",
      scopeSnapshot: {
        capturedAt: timestamp,
        module: "meetings",
        permissions: [],
        projectId: "project-a",
        resourceRefs: [],
        role: "pending",
        scopeKind: "internal_full",
        userId: "leader-01",
      },
      status: "succeeded",
      updatedAt: timestamp,
    },
  };
}
