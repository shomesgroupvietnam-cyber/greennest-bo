import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  acceptAiActionProposal: vi.fn(),
  getAiActionProposal: vi.fn(),
  getCurrentUser: vi.fn(),
  listActiveScopeAssignments: vi.fn(),
  listRolePermissionCatalog: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  rejectAiActionProposal: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/modules/ai/services/ai-action-proposal-service", () => ({
  acceptAiActionProposal: mocks.acceptAiActionProposal,
  getAiActionProposal: mocks.getAiActionProposal,
  rejectAiActionProposal: mocks.rejectAiActionProposal,
}));

vi.mock("@/modules/settings/services/role-permission-catalog-service", () => ({
  listRolePermissionCatalog: mocks.listRolePermissionCatalog,
}));

vi.mock("@/modules/settings/services/scope-assignment-service", () => ({
  listActiveScopeAssignments: mocks.listActiveScopeAssignments,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import {
  acceptAiActionProposalAction,
  rejectAiActionProposalAction,
} from "@/modules/ai/actions";

function formData(values: Record<string, string>) {
  const data = new FormData();

  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }

  return data;
}

describe("AI action proposal server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue({
      id: "approver-01",
      role: "tong_giam_doc",
    });
    mocks.listActiveScopeAssignments.mockResolvedValue([
      {
        active: true,
        createdAt: "2026-06-04T00:00:00.000Z",
        id: "scope-a",
        permissionKeys: ["proposal.request_change"],
        projectId: "project-01",
        roleKey: "quan_ly_tai_chinh",
        scopeType: "scoped",
        updatedAt: "2026-06-04T00:00:00.000Z",
        userId: "approver-01",
      },
      {
        active: true,
        createdAt: "2026-06-04T00:00:00.000Z",
        id: "scope-other-user",
        permissionKeys: ["proposal.request_change"],
        projectId: "project-01",
        roleKey: "quan_ly_tai_chinh",
        scopeType: "scoped",
        updatedAt: "2026-06-04T00:00:00.000Z",
        userId: "other-user",
      },
    ]);
    mocks.listRolePermissionCatalog.mockResolvedValue({
      assignments: [],
      permissions: [],
      roles: [],
    });
    mocks.getAiActionProposal.mockResolvedValue({
      id: "ai-proposal-approval",
      jobId: "job-approval",
      targetEntityId: "proposal-01",
      targetEntityType: "proposal",
    });
  });

  it("revalidates approval and proposal routes after accepting an approval proposal", async () => {
    mocks.acceptAiActionProposal.mockResolvedValue({
      executionResult: {
        entityId: "proposal-01",
        entityType: "proposal",
        projectId: "project-01",
      },
      jobId: "job-approval",
      targetEntityId: "proposal-01",
      targetEntityType: "proposal",
    });

    await expect(
      acceptAiActionProposalAction(
        formData({
          decisionNotes: "OK",
          proposalId: "ai-proposal-approval",
          returnTo: "/approvals/proposal/proposal-01?scopeId=scope-a",
        }),
      ),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/approvals/proposal/proposal-01?scopeId=scope-a",
    );

    expect(mocks.acceptAiActionProposal).toHaveBeenCalledWith(
      "ai-proposal-approval",
      { id: "approver-01", role: "tong_giam_doc" },
      { decisionNotes: "OK" },
      {
        requireScopeAssignments: true,
        rolePermissionCatalog: {
          assignments: [],
          permissions: [],
          roles: [],
        },
        scopeAssignments: [
          expect.objectContaining({
            id: "scope-a",
            userId: "approver-01",
          }),
        ],
      },
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/command-center");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/executive");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/ai");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/projects/project-01");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/approvals/proposal/proposal-01");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/proposals/proposal-01");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/proposals");
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      "/approvals/proposal/proposal-01?scopeId=scope-a",
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/ai/jobs/job-approval");
  });

  it("revalidates approval context after rejecting an AI proposal without domain mutation", async () => {
    mocks.rejectAiActionProposal.mockResolvedValue({
      jobId: "job-approval",
      targetEntityId: "proposal-01",
      targetEntityType: "proposal",
    });

    await expect(
      rejectAiActionProposalAction(
        formData({
          proposalId: "ai-proposal-approval",
          returnTo: "/approvals/proposal/proposal-01",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/approvals/proposal/proposal-01");

    expect(mocks.rejectAiActionProposal).toHaveBeenCalledWith(
      "ai-proposal-approval",
      { id: "approver-01", role: "tong_giam_doc" },
      { decisionNotes: undefined },
      {
        requireScopeAssignments: false,
        rolePermissionCatalog: {
          assignments: [],
          permissions: [],
          roles: [],
        },
        scopeAssignments: [
          expect.objectContaining({
            id: "scope-a",
            userId: "approver-01",
          }),
        ],
      },
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/command-center");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/executive");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/ai");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/approvals/proposal/proposal-01");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/proposals/proposal-01");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/ai/jobs/job-approval");
  });
});
