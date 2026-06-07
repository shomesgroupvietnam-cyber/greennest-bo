import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

import { requireAuthenticatedSession } from "@/lib/permissions/guard";
import { requiresAssignmentScopeForRole } from "@/lib/permissions/access-scope";
import { selectScopeAssignmentsForUser } from "@/lib/permissions/navigation-context";
import { buildAiApprovalAssistantDraft } from "@/modules/ai/services/ai-approval-assistant-service";
import type { AiApprovalAssistant } from "@/modules/ai/types";
import { getApprovalCenterDetailData } from "@/modules/proposals/services/approval-center-service";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import { listActiveScopeAssignments } from "@/modules/settings/services/scope-assignment-service";
import type { ApprovalCenterDetailData } from "@/modules/executive/types";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/permissions/guard", () => ({
  requireAuthenticatedSession: vi.fn(),
}));

vi.mock("@/lib/permissions/access-scope", () => ({
  requiresAssignmentScopeForRole: vi.fn(),
}));

vi.mock("@/lib/permissions/navigation-context", () => ({
  selectScopeAssignmentsForUser: vi.fn(),
}));

vi.mock("@/modules/settings/services/scope-assignment-service", () => ({
  listActiveScopeAssignments: vi.fn(),
}));

vi.mock("@/modules/settings/services/role-permission-catalog-service", () => ({
  listRolePermissionCatalog: vi.fn(),
}));

vi.mock("@/modules/users/services/user-service", () => ({
  createAuditLog: vi.fn(),
  listAuditLogs: vi.fn(),
}));

vi.mock("@/lib/notifications/notification-repository", () => ({
  notificationRepository: {
    getByDedupeKey: vi.fn(),
    list: vi.fn(),
    upsert: vi.fn(),
  },
}));

vi.mock("@/modules/proposals/services/approval-center-service", () => ({
  getApprovalCenterDetailData: vi.fn(),
}));

vi.mock("@/modules/ai/services/ai-approval-assistant-service", () => ({
  buildAiApprovalAssistantDraft: vi.fn(),
}));

describe("ApprovalDetailPage", () => {
  beforeEach(() => {
    (globalThis as typeof globalThis & { React: typeof React }).React = React;
    vi.clearAllMocks();
    vi.mocked(requiresAssignmentScopeForRole).mockReturnValue(false);
    vi.mocked(listActiveScopeAssignments).mockResolvedValue([]);
    vi.mocked(listRolePermissionCatalog).mockResolvedValue({
      assignments: [],
      permissions: [],
      roles: [],
    });
    vi.mocked(selectScopeAssignmentsForUser).mockReturnValue([]);
  });

  it("uses provider-backed AI Approval Assistant with action proposals on approval detail", async () => {
    const user = {
      id: "approver-01",
      permissions: ["ai.ask", "ai.propose_action"],
      permissionsMode: "replace",
      role: "tong_giam_doc",
    };
    const detail = approvalDetail();
    const assistant: AiApprovalAssistant = {
      actionProposals: [],
      citations: [],
      generatedFrom: [],
      missingInformation: [],
      riskNotes: [],
      status: "draft",
      suggestedQuestions: [],
      summaryText: "AI draft approval summary",
      updatedAt: "2026-06-04T00:00:00.000Z",
    };

    vi.mocked(requireAuthenticatedSession).mockResolvedValue({
      user,
    } as Awaited<ReturnType<typeof requireAuthenticatedSession>>);
    vi.mocked(getApprovalCenterDetailData).mockResolvedValue(detail);
    vi.mocked(buildAiApprovalAssistantDraft).mockResolvedValue(assistant);

    const { default: ApprovalDetailPage } = await import(
      "@/app/(dashboard)/approvals/[sourceType]/[sourceId]/page"
    );

    await ApprovalDetailPage({
      params: Promise.resolve({
        sourceId: "finance-secret",
        sourceType: "proposal",
      }),
      searchParams: Promise.resolve({ scopeId: "scope-a" }),
    });

    expect(getApprovalCenterDetailData).toHaveBeenCalledWith(
      { sourceId: "finance-secret", sourceType: "proposal" },
      user,
      expect.objectContaining({
        queueEscalationNotifications: true,
        requireScopeAssignments: true,
        selectedScopeId: "scope-a",
      }),
    );
    expect(buildAiApprovalAssistantDraft).toHaveBeenCalledWith(user, detail, {
      createActionProposal: true,
      useProvider: true,
    });
  });
});

function approvalDetail(): ApprovalCenterDetailData {
  return {
    attachments: [],
    backHref: "/command-center?view=executive-approvals&scopeId=scope-a",
    generatedAt: "2026-06-04T00:00:00.000Z",
    history: [],
    linkedSources: [],
    permissions: {
      availableActions: [
        {
          action: "request_change",
          enabled: true,
          label: "Tra lai",
          requiresReason: true,
        },
      ],
      canView: true,
      canViewAudit: true,
      canViewFinance: false,
    },
    policy: null,
    requestSummary: {
      attachmentCount: 0,
      deadlineCompliance: "valid",
      financialAccess: "no_permission",
      module: "finance",
      priority: "high",
      projectId: "demo-project-riverside",
      proposer: "requester-01",
      scopeLabel: "GreenNest Riverside",
      summary: "Need finance approval.",
    },
    selectedScopeId: "scope-a",
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
  };
}
