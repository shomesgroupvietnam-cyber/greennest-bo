import { describe, expect, it } from "vitest";

import type { PermissionUser } from "@/lib/permissions/can";
import {
  buildExecutiveAiSummaryDraft,
  type ExecutiveAiSummaryRunAi,
} from "@/modules/ai/services/executive-ai-summary-service";
import type {
  AiActionProposal,
  AiAskInput,
  AiAskResult,
  AiCitation,
  AiInteraction,
  AiJob,
} from "@/modules/ai/types";

const executiveUser: PermissionUser = {
  id: "ceo-01",
  role: "tong_giam_doc",
};

function interaction(patch: Partial<AiInteraction> = {}): AiInteraction {
  return {
    id: "interaction-summary-01",
    requestedBy: executiveUser.id,
    module: "general",
    intent: "Executive AI Summary",
    mode: "fast",
    promptSummary: "Executive AI Summary",
    responseText: "AI draft tu provider [CIT-001]",
    modelProvider: "mock",
    modelName: "mock-summary",
    status: "succeeded",
    scopeSnapshot: {
      userId: executiveUser.id,
      role: executiveUser.role,
      permissions: [],
      scopeKind: "internal_full",
      module: "general",
      resourceRefs: [],
      capturedAt: "2026-06-04T10:00:00.000Z",
    },
    createdAt: "2026-06-04T10:00:00.000Z",
    updatedAt: "2026-06-04T10:00:00.000Z",
    completedAt: "2026-06-04T10:01:00.000Z",
    ...patch,
  };
}

function job(patch: Partial<AiJob> = {}): AiJob {
  return {
    id: "job-summary-01",
    interactionId: "interaction-summary-01",
    requestedBy: executiveUser.id,
    module: "general",
    intent: "Executive AI Summary",
    mode: "fast",
    priority: "normal",
    status: "succeeded",
    scopeSnapshot: interaction().scopeSnapshot,
    rateLimitKey: "ai:ceo-01",
    payload: {
      intent: "Executive AI Summary",
      knowledgeModule: "general",
      prompt: "Executive AI Summary",
      useRag: false,
      wantsActionProposal: false,
    },
    createdAt: "2026-06-04T10:00:00.000Z",
    updatedAt: "2026-06-04T10:01:00.000Z",
    finishedAt: "2026-06-04T10:01:00.000Z",
    ...patch,
  };
}

function citation(patch: Partial<AiCitation> = {}): AiCitation {
  return {
    id: "citation-ai-01",
    interactionId: "interaction-summary-01",
    jobId: "job-summary-01",
    citationType: "internal_record",
    entityType: "project",
    entityId: "project-visible",
    title: "Visible project citation",
    module: "project",
    projectId: "project-visible",
    createdAt: "2026-06-04T10:01:00.000Z",
    ...patch,
  };
}

function proposal(patch: Partial<AiActionProposal> = {}): AiActionProposal {
  return {
    id: "proposal-summary-01",
    interactionId: "interaction-summary-01",
    jobId: "job-summary-01",
    requestedBy: executiveUser.id,
    module: "general",
    actionKey: "create_task",
    targetEntityType: "task",
    projectId: "project-visible",
    proposedPayload: {
      title: "Review citation",
      description: "SAFE_DESCRIPTION",
      sourcePrompt: "RAW_PROMPT_SHOULD_NOT_LEAK",
    },
    rationale: "Can review citation truoc khi tao task.",
    requiredPermission: "task.create",
    status: "proposed",
    workflowStatus: "DRAFT",
    createdAt: "2026-06-04T10:01:00.000Z",
    updatedAt: "2026-06-04T10:01:00.000Z",
    ...patch,
  };
}

describe("executive AI summary service", () => {
  it("returns a draft summary from the AI pipeline with app-generated citations", async () => {
    let capturedInput: AiAskInput | undefined;
    const runAi: ExecutiveAiSummaryRunAi = async (input) => {
      capturedInput = input;

      return {
        interaction: interaction(),
        job: job({ payload: { ...job().payload, prompt: input.prompt } }),
        citations: [citation()],
        actionProposals: [],
      } satisfies AiAskResult;
    };

    const summary = await buildExecutiveAiSummaryDraft(
      executiveUser,
      {
        citations: [
          {
            id: "source-project-visible",
            sourceId: "project-visible",
            sourceType: "project",
            title: "Visible project citation",
          },
        ],
        generatedAt: "2026-06-04T10:00:00.000Z",
        generatedFrom: ["ExecutiveDashboardData.projectPortfolio"],
        sourceText: "Visible scoped context only",
        view: "morning_briefing",
      },
      { enabled: true, runAi, useProvider: true },
    );

    expect(capturedInput).toMatchObject({
      mode: "fast",
      module: "general",
      projectId: "project-visible",
      resourceRefs: [
        {
          entityId: "project-visible",
          entityType: "project",
        },
      ],
      useRag: false,
      wantsActionProposal: false,
    });
    expect(summary).toMatchObject({
      status: "draft",
      text: "AI draft tu provider [CIT-001]",
      interactionId: "interaction-summary-01",
      jobId: "job-summary-01",
    });
    expect(summary.citations).toEqual([
      expect.objectContaining({
        sourceId: "project-visible",
        sourceType: "project",
        title: "Visible project citation",
      }),
    ]);
  });

  it("returns a placeholder with app citations when provider mode is disabled", async () => {
    const summary = await buildExecutiveAiSummaryDraft(
      executiveUser,
      {
        citations: [
          {
            id: "source-project-visible",
            sourceId: "project-visible",
            sourceType: "project",
            title: "Visible project citation",
          },
        ],
        generatedAt: "2026-06-04T10:00:00.000Z",
        generatedFrom: ["ExecutiveDashboardData.projectPortfolio"],
        sourceText: "Visible scoped context only",
        view: "morning_briefing",
      },
      { enabled: true },
    );

    expect(summary).toMatchObject({
      status: "placeholder",
      text: "Visible scoped context only",
    });
    expect(summary.citations).toEqual([
      expect.objectContaining({
        sourceId: "project-visible",
        sourceType: "project",
      }),
    ]);
  });

  it("returns insufficient context without calling AI when source context has no citations", async () => {
    let called = false;
    const summary = await buildExecutiveAiSummaryDraft(
      executiveUser,
      {
        citations: [],
        generatedAt: "2026-06-04T10:00:00.000Z",
        generatedFrom: [],
        sourceText: "",
        view: "private_workspace",
      },
      {
        enabled: true,
        runAi: async () => {
          called = true;
          throw new Error("runAi should not be called");
        },
        useProvider: true,
      },
    );

    expect(called).toBe(false);
    expect(summary).toMatchObject({
      actionProposals: [],
      citations: [],
      status: "insufficient_context",
    });
    expect(summary.text).toContain("Khong co du lieu trong scope");
  });

  it("returns unavailable when the provider path fails", async () => {
    const summary = await buildExecutiveAiSummaryDraft(
      executiveUser,
      {
        citations: [
          {
            id: "source-project-visible",
            sourceId: "project-visible",
            sourceType: "project",
            title: "Visible project citation",
          },
        ],
        generatedAt: "2026-06-04T10:00:00.000Z",
        generatedFrom: ["ExecutiveDashboardData.projectPortfolio"],
        sourceText: "Visible scoped context only",
        view: "morning_briefing",
      },
      {
        enabled: true,
        runAi: async () => {
          throw new Error("provider unavailable");
        },
        useProvider: true,
      },
    );

    expect(summary).toMatchObject({
      actionProposals: [],
      citations: [],
      generatedFrom: ["ExecutiveDashboardData.projectPortfolio"],
      status: "unavailable",
    });
  });

  it("rejects provider citations that are not in the app-approved source map", async () => {
    const summary = await buildExecutiveAiSummaryDraft(
      executiveUser,
      {
        citations: [
          {
            id: "source-project-visible",
            sourceId: "project-visible",
            sourceType: "project",
            title: "Visible project citation",
          },
        ],
        generatedAt: "2026-06-04T10:00:00.000Z",
        generatedFrom: ["ExecutiveDashboardData.projectPortfolio"],
        sourceText: "Visible scoped context only",
        view: "morning_briefing",
      },
      {
        enabled: true,
        runAi: async () => ({
          interaction: interaction(),
          job: job(),
          citations: [
            citation({
              entityId: "hidden-project",
              projectId: "hidden-project",
              title: "Hidden project citation",
            }),
          ],
          actionProposals: [],
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

  it("maps proposed actions as advisory metadata without leaking raw proposal payload", async () => {
    const summary = await buildExecutiveAiSummaryDraft(
      executiveUser,
      {
        citations: [
          {
            id: "source-project-visible",
            sourceId: "project-visible",
            sourceType: "project",
            title: "Visible project citation",
          },
        ],
        generatedAt: "2026-06-04T10:00:00.000Z",
        generatedFrom: ["ExecutiveDashboardData.priorityItems"],
        sourceText: "Visible risk needs review",
        view: "private_workspace",
      },
      {
        createActionProposal: true,
        enabled: true,
        runAi: async (input) => ({
          interaction: interaction({ responseText: "Draft co de xuat [CIT-001]" }),
          job: job({
            payload: {
              ...job().payload,
              prompt: input.prompt,
              wantsActionProposal: input.wantsActionProposal ?? false,
            },
          }),
          citations: [citation()],
          actionProposals: [proposal()],
        }),
        useProvider: true,
      },
    );

    expect(summary.actionProposals).toEqual([
      expect.objectContaining({
        actionKey: "create_task",
        status: "proposed",
        title: "Review citation",
        workflowStatus: "DRAFT",
      }),
    ]);
    expect(JSON.stringify(summary.actionProposals)).not.toContain(
      "RAW_PROMPT_SHOULD_NOT_LEAK",
    );
  });

  it("filters non-draft or domain-forbidden action proposals", async () => {
    const limitedUser: PermissionUser = {
      id: "proposal-limited",
      permissions: ["ai.ask", "ai.propose_action", "project.view"],
      permissionsMode: "replace",
      role: "pending",
    };
    const summary = await buildExecutiveAiSummaryDraft(
      limitedUser,
      {
        citations: [
          {
            id: "source-project-visible",
            sourceId: "project-visible",
            sourceType: "project",
            title: "Visible project citation",
          },
        ],
        generatedAt: "2026-06-04T10:00:00.000Z",
        generatedFrom: ["ExecutiveDashboardData.priorityItems"],
        sourceText: "Visible risk needs review",
        view: "private_workspace",
      },
      {
        createActionProposal: true,
        enabled: true,
        runAi: async () => ({
          interaction: interaction({ responseText: "Draft co de xuat [CIT-001]" }),
          job: job(),
          citations: [citation()],
          actionProposals: [
            proposal({ id: "proposal-accepted", status: "accepted" }),
            proposal({
              id: "proposal-forbidden",
              requiredPermission: "task.create",
            }),
          ],
        }),
        useProvider: true,
      },
    );

    expect(summary.status).toBe("draft");
    expect(summary.actionProposals).toEqual([]);
  });

  it("does not request or expose action proposals without ai.propose_action", async () => {
    const draftOnlyUser: PermissionUser = {
      id: "draft-only-user",
      permissions: ["ai.create_draft"],
      permissionsMode: "replace",
      role: "pending",
    };
    let capturedInput: AiAskInput | undefined;

    const summary = await buildExecutiveAiSummaryDraft(
      draftOnlyUser,
      {
        citations: [
          {
            id: "source-project-visible",
            sourceId: "project-visible",
            sourceType: "project",
            title: "Visible project citation",
          },
        ],
        generatedAt: "2026-06-04T10:00:00.000Z",
        generatedFrom: ["ExecutiveDashboardData.priorityItems"],
        sourceText: "Visible scoped context only",
        view: "private_workspace",
      },
      {
        createActionProposal: true,
        enabled: true,
        runAi: async (input) => {
          capturedInput = input;

          return {
            interaction: interaction({ responseText: "Draft only [CIT-001]" }),
            job: job({
              payload: {
                ...job().payload,
                prompt: input.prompt,
                wantsActionProposal: input.wantsActionProposal ?? false,
              },
            }),
            citations: [citation()],
            actionProposals: [proposal()],
          };
        },
        useProvider: true,
      },
    );

    expect(capturedInput?.wantsActionProposal).toBe(false);
    expect(summary.status).toBe("draft");
    expect(summary.actionProposals).toEqual([]);
  });
});
