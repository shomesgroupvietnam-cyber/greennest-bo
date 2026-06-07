import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  applyProposalApprovalAction: vi.fn(),
  createAuditLog: vi.fn(),
  createProposal: vi.fn(),
  getCurrentUser: vi.fn(),
  listActiveScopeAssignments: vi.fn(),
  listRolePermissionCatalog: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  revalidatePath: vi.fn(),
  submitProposalWithResult: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/modules/proposals/services/proposal-service", () => ({
  applyProposalApprovalAction: mocks.applyProposalApprovalAction,
  approveProposal: vi.fn(),
  createProposal: mocks.createProposal,
  rejectProposal: vi.fn(),
  requestProposalChange: vi.fn(),
  submitProposalWithResult: mocks.submitProposalWithResult,
}));

vi.mock("@/modules/settings/services/role-permission-catalog-service", () => ({
  listRolePermissionCatalog: mocks.listRolePermissionCatalog,
}));

vi.mock("@/modules/settings/services/scope-assignment-service", () => ({
  listActiveScopeAssignments: mocks.listActiveScopeAssignments,
}));

vi.mock("@/modules/users/services/user-service", () => ({
  createAuditLog: mocks.createAuditLog,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import {
  applyApprovalDetailAction,
  createProposalAction,
  submitProposalAction,
} from "@/modules/proposals/actions";

function formData(values: Record<string, string>) {
  const data = new FormData();

  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }

  return data;
}

describe("proposal approval detail actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue({
      id: "approver-01",
      role: "tong_giam_doc",
    });
    mocks.listActiveScopeAssignments.mockResolvedValue([]);
    mocks.listRolePermissionCatalog.mockResolvedValue({ roles: [] });
    mocks.createProposal.mockResolvedValue({
      attachments: [],
      proposal: {
        aiReviewStatus: "not_checked",
        code: "DX-GENERAL-ACTION",
        createdAt: "2026-05-29T00:00:00.000Z",
        id: "proposal-action",
        module: "proposal",
        priority: "normal",
        requestedBy: "approver-01",
        status: "draft",
        title: "Action proposal",
        type: "general",
        updatedAt: "2026-05-29T00:00:00.000Z",
      },
    });
    mocks.applyProposalApprovalAction.mockResolvedValue({
      action: "approve",
      decision: {
        decidedAt: "2026-05-29T00:00:00.000Z",
        decidedBy: "approver-01",
        decision: "approved",
        id: "decision-01",
        proposalId: "proposal-01",
        version: 2,
      },
      nextStatus: "approved",
      nextStepId: "step-01",
      nextStepStatus: "approved",
      notes: "Dong y.",
      previousStatus: "in_review",
      previousStepId: "step-01",
      previousStepStatus: "in_review",
      proposal: {
        id: "proposal-01",
        status: "approved",
      },
    });
  });

  it("passes delegated context to the service guard and audits outcome step transitions", async () => {
    await expect(
      applyApprovalDetailAction(
        formData({
          approvalAction: "approve",
          delegationId: "delegation-01",
          notes: "Dong y.",
          onBehalfOf: "principal-01",
          scopeId: "scope-01",
          sourceId: "proposal-01",
          sourceType: "proposal",
        }),
      ),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/approvals/proposal/proposal-01?scopeId=scope-01",
    );

    expect(mocks.applyProposalApprovalAction).toHaveBeenCalledWith(
      "proposal-01",
      { action: "approve", notes: "Dong y." },
      { id: "approver-01", role: "tong_giam_doc" },
      expect.objectContaining({
        delegatedContext: {
          delegationId: "delegation-01",
          onBehalfOf: "principal-01",
        },
      }),
    );
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "proposal.approved",
        entityId: "proposal-01",
        entityType: "proposal",
        newValue: {
          decisionId: "decision-01",
          notes: "Dong y.",
          status: "approved",
          stepId: "step-01",
          stepStatus: "approved",
          version: 2,
        },
        oldValue: {
          status: "in_review",
          stepId: "step-01",
          stepStatus: "in_review",
        },
      }),
    );
  });

  it("does not synthesize attachment names from URL or document id in create action input", async () => {
    await expect(
      createProposalAction(
        formData({
          attachmentUrl: "https://example.com/evidence.pdf",
          dueDate: "2026-05-29",
          title: "Action proposal",
          type: "general",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/proposals/proposal-action");

    expect(mocks.createProposal).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [
          expect.objectContaining({
            externalUrl: "https://example.com/evidence.pdf",
            name: "",
            url: "https://example.com/evidence.pdf",
          }),
        ],
      }),
      { id: "approver-01", role: "tong_giam_doc" },
    );
  });

  it("audits submit transitions with decision metadata", async () => {
    mocks.submitProposalWithResult.mockResolvedValue({
      decision: {
        decidedAt: "2026-05-29T00:00:00.000Z",
        decidedBy: "approver-01",
        decision: "submitted",
        id: "decision-submit",
        proposalId: "proposal-submit",
        version: 1,
      },
      nextStatus: "in_review",
      nextStepId: "step-submit",
      nextStepStatus: "in_review",
      previousStatus: "draft",
      previousStepId: undefined,
      previousStepStatus: undefined,
      proposal: {
        delegationId: "delegation-submit",
        id: "proposal-submit",
        onBehalfOf: "principal-01",
        status: "in_review",
        submittedBy: "approver-01",
      },
    });

    await expect(
      submitProposalAction(
        formData({
          proposalId: "proposal-submit",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/proposals/proposal-submit");

    expect(mocks.submitProposalWithResult).toHaveBeenCalledWith(
      "proposal-submit",
      { id: "approver-01", role: "tong_giam_doc" },
    );
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "proposal.submit",
        entityId: "proposal-submit",
        entityType: "proposal",
        newValue: {
          decisionId: "decision-submit",
          delegationId: "delegation-submit",
          onBehalfOf: "principal-01",
          status: "in_review",
          stepId: "step-submit",
          stepStatus: "in_review",
          submittedBy: "approver-01",
          version: 1,
        },
        oldValue: {
          status: "draft",
          stepId: undefined,
          stepStatus: undefined,
        },
      }),
    );
  });
});
