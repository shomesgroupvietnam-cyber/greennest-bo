import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildAiApprovalAssistantDraft,
} from "@/modules/ai/services/ai-approval-assistant-service";
import { JsonAiRepository } from "@/modules/ai/services/ai-repository";
import type {
  AiActionProposal,
  AiAskInput,
  AiAskResult,
  AiCitation,
} from "@/modules/ai/types";
import type { ApprovalCenterDetailData } from "@/modules/executive/types";

let tempDir: string;
let aiRepository: JsonAiRepository;

const approver = { id: "approver-01", role: "quan_ly_tai_chinh" as const };

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-ai-approval-"));
  aiRepository = new JsonAiRepository(path.join(tempDir, "ai-jobs.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("AI approval assistant service", () => {
  it("builds a draft from sanitized approval detail and excludes finance or hidden linked sources", async () => {
    const capturedInputs: AiAskInput[] = [];
    const runAi = vi.fn(async (input: AiAskInput) => {
      capturedInputs.push(input);

      return buildAiResult({
        citations: [
          providerCitation("proposal", "finance-secret"),
          providerCitation("project", "demo-project-riverside"),
        ],
      });
    });

    const result = await buildAiApprovalAssistantDraft(
      approver,
      approvalDetail(),
      {
        runAi,
        useProvider: true,
      },
    );

    expect(result.status).toBe("draft");
    expect(result.summaryText).toContain("AI draft approval summary");
    expect(result.citations.map((citation) => citation.sourceId)).toEqual(
      expect.arrayContaining(["finance-secret", "demo-project-riverside"]),
    );

    const input = capturedInputs[0];

    expect(input?.prompt).not.toContain("9,999,000,000");
    expect(input?.prompt).not.toContain("hidden-document-01");
    expect(input?.resourceRefs).toEqual(
      expect.arrayContaining([
        { entityId: "finance-secret", entityType: "proposal" },
        { entityId: "demo-project-riverside", entityType: "project" },
      ]),
    );
    expect(input?.resourceRefs).not.toEqual(
      expect.arrayContaining([
        { entityId: "hidden-document-01", entityType: "document" },
      ]),
    );
  });

  it("returns a local advisory draft from sanitized context when provider is disabled", async () => {
    const runAi = vi.fn();
    const result = await buildAiApprovalAssistantDraft(
      approver,
      approvalDetail(),
      {
        createActionProposal: true,
        runAi,
        useProvider: false,
      },
    );

    expect(runAi).not.toHaveBeenCalled();
    expect(result.status).toBe("draft");
    expect(result.actionProposals).toEqual([]);
    expect(result.summaryText).toContain("Draft advisory");
    expect(result.citations.map((citation) => citation.sourceId)).toEqual(
      expect.arrayContaining(["finance-secret", "demo-project-riverside"]),
    );
    expect(JSON.stringify(result)).not.toContain("9,999,000,000");
    expect(JSON.stringify(result)).not.toContain("hidden-document-01");
  });

  it("returns insufficient context when provider citations are outside the app-approved map", async () => {
    const result = await buildAiApprovalAssistantDraft(
      approver,
      approvalDetail(),
      {
        runAi: async () =>
          buildAiResult({
            citations: [providerCitation("document", "hidden-document-01")],
          }),
        useProvider: true,
      },
    );

    expect(result.status).toBe("insufficient_context");
    expect(result.citations).toHaveLength(0);
  });

  it("returns unavailable when the gateway/provider fails", async () => {
    const result = await buildAiApprovalAssistantDraft(
      approver,
      approvalDetail(),
      {
        runAi: async () => {
          throw new Error("provider unavailable");
        },
        useProvider: true,
      },
    );

    expect(result.status).toBe("unavailable");
    expect(result.summaryText).toContain("tam thoi khong kha dung");
  });

  it("creates approval-specific request-change proposals only from enabled approval actions", async () => {
    const result = await buildAiApprovalAssistantDraft(
      approver,
      approvalDetail(),
      {
        createActionProposal: true,
        gatewayOptions: { aiRepo: aiRepository },
        runAi: async () =>
          buildAiResult({
            actionProposals: [],
            citations: [providerCitation("proposal", "finance-secret")],
          }),
        useProvider: true,
      },
    );
    const persisted = await aiRepository.listActionProposals({
      jobId: "job-approval",
    });

    expect(result.status).toBe("draft");
    expect(result.actionProposals).toHaveLength(1);
    expect(persisted).toHaveLength(1);
    expect(persisted[0]).toMatchObject({
      actionKey: "approval_request_change",
      requiredPermission: "proposal.request_change",
      status: "proposed",
      targetEntityId: "finance-secret",
      targetEntityType: "proposal",
      workflowStatus: "DRAFT",
    });
    expect(persisted[0]?.proposedPayload).toMatchObject({
      affectedFields: ["status", "currentStep"],
      approvalAction: "request_change",
      currentDecisionVersion: 1,
      currentStepId: "step-01",
      currentStepStatus: "in_review",
      currentStatus: "in_review",
      nextStatus: "change_requested",
      proposalId: "finance-secret",
      requiredPermission: "proposal.request_change",
      sourceType: "proposal",
    });
    expect(JSON.stringify(persisted[0]?.proposedPayload)).not.toContain(
      "9,999,000,000",
    );
  });

  it("shows generated scoped approval proposals when the detail action is enabled", async () => {
    const scopedApprover = {
      id: "scoped-approver",
      permissions: ["ai.ask" as const, "ai.propose_action" as const],
      permissionsMode: "replace" as const,
      role: "pending" as const,
    };
    const result = await buildAiApprovalAssistantDraft(
      scopedApprover,
      approvalDetail({ selectedScopeId: "scope-a" }),
      {
        createActionProposal: true,
        gatewayOptions: { aiRepo: aiRepository },
        runAi: async () =>
          buildAiResult({
            citations: [providerCitation("proposal", "finance-secret")],
          }),
        useProvider: true,
      },
    );
    const persisted = await aiRepository.listActionProposals({
      jobId: "job-approval",
    });

    expect(result.status).toBe("draft");
    expect(result.actionProposals).toHaveLength(1);
    expect(result.actionProposals[0]).toMatchObject({
      approvalAction: "request_change",
      requiredPermission: "proposal.request_change",
      returnToHref: "/approvals/proposal/finance-secret?scopeId=scope-a",
      targetEntityId: "finance-secret",
      targetEntityType: "proposal",
    });
    expect(persisted[0]).toMatchObject({
      requestedBy: "scoped-approver",
      status: "proposed",
      workflowStatus: "DRAFT",
    });
  });

  it("reuses the current approval proposal across repeated provider runs", async () => {
    const detail = approvalDetail({ selectedScopeId: "scope-a" });

    const first = await buildAiApprovalAssistantDraft(approver, detail, {
      createActionProposal: true,
      gatewayOptions: { aiRepo: aiRepository },
      runAi: async () =>
        buildAiResult({
          citations: [providerCitation("proposal", "finance-secret")],
          interactionId: "interaction-approval-1",
          jobId: "job-approval-1",
        }),
      useProvider: true,
    });
    const second = await buildAiApprovalAssistantDraft(approver, detail, {
      createActionProposal: true,
      gatewayOptions: { aiRepo: aiRepository },
      runAi: async () =>
        buildAiResult({
          citations: [providerCitation("proposal", "finance-secret")],
          interactionId: "interaction-approval-2",
          jobId: "job-approval-2",
        }),
      useProvider: true,
    });
    const persisted = await aiRepository.listActionProposals();

    expect(first.actionProposals).toHaveLength(1);
    expect(second.actionProposals).toHaveLength(1);
    expect(persisted).toHaveLength(1);
    expect(second.actionProposals[0]?.id).toBe(persisted[0]?.id);
    expect(second.actionProposals[0]?.returnToHref).toBe(
      "/approvals/proposal/finance-secret?scopeId=scope-a",
    );
  });

  it("keeps final approval details read-only without action proposals", async () => {
    const result = await buildAiApprovalAssistantDraft(
      approver,
      approvalDetail({
        permissions: {
          ...approvalDetail().permissions,
          availableActions: approvalDetail().permissions.availableActions.map(
            (action) => ({ ...action, enabled: false }),
          ),
        },
        source: {
          ...approvalDetail().source,
          status: "approved",
          statusLabel: "Approved",
        },
      }),
      {
        createActionProposal: true,
        gatewayOptions: { aiRepo: aiRepository },
        runAi: async () =>
          buildAiResult({
            citations: [providerCitation("proposal", "finance-secret")],
          }),
        useProvider: true,
      },
    );

    expect(result.status).toBe("draft");
    expect(result.actionProposals).toEqual([]);
    expect(await aiRepository.listActionProposals()).toHaveLength(0);
  });
});

function approvalDetail(
  overrides: Partial<ApprovalCenterDetailData> = {},
): ApprovalCenterDetailData {
  return {
    backHref: "/command-center?view=executive-approvals",
    generatedAt: "2026-06-04T00:00:00.000Z",
    history: [
      {
        actorId: "submitter-01",
        id: "history-submitted",
        kind: "decision",
        label: "submitted",
        notes: "Submitted for approval",
        occurredAt: "2026-06-01T00:00:00.000Z",
        nextStatus: "in_review",
        previousStatus: "draft",
        version: 1,
      },
    ],
    linkedSources: [
      {
        entityId: "demo-project-riverside",
        entityType: "project",
        helper: "Source record",
        href: "/projects/demo-project-riverside",
        id: "link-project",
        label: "Project demo-project-riverside",
        relationType: "source",
        state: "linked",
      },
      {
        entityId: "hidden-document-01",
        entityType: "document",
        helper: "Hidden source should not reach AI",
        id: "link-hidden-document",
        label: "Document hidden-document-01",
        relationType: "evidence",
        state: "no_permission",
      },
    ],
    overdue: {
      daysOverdue: 2,
      isOverdue: true,
      nextAction: "Kiem tra thong tin truoc khi duyet.",
      ownerLabel: "owner-01",
      reason: "Qua han 2 ngay.",
      severity: "warning",
    },
    permissions: {
      availableActions: [
        {
          action: "request_change",
          enabled: true,
          label: "Tra lai",
          requiresReason: true,
        },
        {
          action: "ask_meeting",
          enabled: true,
          label: "Yeu cau hop",
        },
      ],
      canView: true,
      canViewAudit: true,
      canViewFinance: false,
    },
    policy: {
      approvalLevel: "CEO",
      currentStepId: "step-01",
      requiredPermission: "proposal.approve",
      status: "in_review",
      stepOrder: 1,
      thresholdLabel: "Policy sentinel",
    },
    requestSummary: {
      amountLabel: "9,999,000,000 VND",
      dueDate: "2026-06-10",
      financialAccess: "no_permission",
      module: "finance",
      ownerName: "owner-01",
      priority: "high",
      projectId: "demo-project-riverside",
      projectName: "GreenNest Riverside",
      proposer: "requester-01",
      scopeLabel: "GreenNest Riverside",
      submittedBy: "submitter-01",
      summary: "Need finance approval.",
    },
    source: {
      axisKey: "axis_1",
      category: "tai_chinh_chi",
      categoryLabel: "Tai chinh / Chi",
      code: "DX-FINANCE-01",
      sourceId: "finance-secret",
      sourceType: "proposal",
      status: "in_review",
      statusLabel: "In review",
      title: "Finance approval",
    },
    ...overrides,
  };
}

function providerCitation(entityType: string, entityId: string): AiCitation {
  return {
    citationType: "internal_record",
    createdAt: "2026-06-04T00:00:00.000Z",
    entityId,
    entityType,
    id: `citation-${entityType}-${entityId}`,
    interactionId: "interaction-approval",
    jobId: "job-approval",
    module: "general",
    title: `${entityType} ${entityId}`,
  };
}

function buildAiResult(input: {
  actionProposals?: AiActionProposal[];
  citations: AiCitation[];
  interactionId?: string;
  jobId?: string;
}): AiAskResult {
  const timestamp = "2026-06-04T00:00:00.000Z";
  const interactionId = input.interactionId ?? "interaction-approval";
  const jobId = input.jobId ?? "job-approval";

  return {
    actionProposals: input.actionProposals ?? [],
    citations: input.citations,
    interaction: {
      completedAt: timestamp,
      createdAt: timestamp,
      id: interactionId,
      intent: "AI Approval Assistant",
      mode: "fast",
      modelName: "mock",
      modelProvider: "mock",
      module: "general",
      promptSummary: "Approval assistant",
      requestedBy: "approver-01",
      responseText:
        "AI draft approval summary [CIT-001]\nRisk: can bo sung chung tu.\nQuestion: ai chiu trach nhiem?",
      scopeSnapshot: {
        capturedAt: timestamp,
        module: "general",
        permissions: [],
        resourceRefs: [],
        role: "quan_ly_tai_chinh",
        scopeKind: "internal_full",
        userId: "approver-01",
      },
      status: "succeeded",
      updatedAt: timestamp,
    },
    job: {
      createdAt: timestamp,
      id: jobId,
      interactionId,
      intent: "AI Approval Assistant",
      mode: "fast",
      module: "general",
      payload: {
        intent: "AI Approval Assistant",
        knowledgeModule: "general",
        prompt: "Approval assistant",
        useRag: false,
        wantsActionProposal: false,
      },
      priority: "normal",
      rateLimitKey: "test",
      requestedBy: "approver-01",
      scopeSnapshot: {
        capturedAt: timestamp,
        module: "general",
        permissions: [],
        resourceRefs: [],
        role: "quan_ly_tai_chinh",
        scopeKind: "internal_full",
        userId: "approver-01",
      },
      status: "succeeded",
      updatedAt: timestamp,
    },
  };
}
