import { render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { AiApprovalAssistantPanel } from "@/modules/ai/components/ai-approval-assistant-panel";
import type { AiApprovalAssistant } from "@/modules/ai/types";

vi.mock("@/modules/ai/actions", () => ({
  acceptAiActionProposalAction: vi.fn(),
  rejectAiActionProposalAction: vi.fn(),
}));

describe("AI approval assistant panel", () => {
  it("renders draft summary, citations and approval action proposal preview", () => {
    const { container } = render(<AiApprovalAssistantPanel assistant={assistant()} />);

    const panel = screen.getByRole("region", {
      name: "AI Approval Assistant",
    });

    expect(within(panel).getByText("Draft goi y")).toBeInTheDocument();
    expect(within(panel).getByText("AI draft approval summary")).toBeInTheDocument();
    expect(within(panel).getByText("Risk: can bo sung chung tu.")).toBeInTheDocument();
    expect(within(panel).getByText("Can hoi ai chiu trach nhiem chung tu?")).toBeInTheDocument();
    expect(within(panel).getByText("Finance approval")).toBeInTheDocument();
    expect(within(panel).getByText("Project demo-project-riverside")).toBeInTheDocument();
    expect(within(panel).getByText("Quyen can co: proposal.request_change")).toBeInTheDocument();
    expect(within(panel).getByText("Action: request_change")).toBeInTheDocument();
    expect(within(panel).getByText("Field: status, currentStep")).toBeInTheDocument();
    expect(
      within(panel).getByRole("button", { name: "Xac nhan tra lai approval" }),
    ).toBeInTheDocument();
    expect(
      within(panel).getByRole("button", { name: "Tu choi de xuat AI" }),
    ).toBeInTheDocument();
    const returnToInputs = [
      ...container.querySelectorAll<HTMLInputElement>('input[name="returnTo"]'),
    ];

    expect(returnToInputs.map((input) => input.value)).toEqual([
      "/approvals/proposal/finance-secret?scopeId=scope-a",
      "/approvals/proposal/finance-secret?scopeId=scope-a",
    ]);
  });

  it("shows advisory-only state without mutation controls when no action proposal is allowed", () => {
    render(
      <AiApprovalAssistantPanel
        assistant={{
          ...assistant(),
          actionProposals: [],
        }}
      />,
    );

    expect(screen.getByText("Draft goi y")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Xac nhan/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tu choi de xuat/i })).not.toBeInTheDocument();
  });

  it("renders insufficient context state without citations or controls", () => {
    render(
      <AiApprovalAssistantPanel
        assistant={{
          actionProposals: [],
          citations: [],
          generatedFrom: [],
          missingInformation: ["Khong co citation hop le."],
          riskNotes: [],
          status: "insufficient_context",
          suggestedQuestions: [],
          summaryText: "Khong co du lieu trong scope hoac citation hop le.",
          updatedAt: "2026-06-04T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText("Thieu context")).toBeInTheDocument();
    expect(screen.getByText("Khong co citation hop le.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

function assistant(): AiApprovalAssistant {
  return {
    actionProposals: [
      {
        actionKey: "approval_request_change",
        affectedFields: ["status", "currentStep"],
        approvalAction: "request_change",
        currentStatus: "in_review",
        id: "ai-proposal-approval-change",
        nextStatus: "change_requested",
        previewTitle: "Tra lai approval Finance approval",
        rationale: "AI de xuat can bo sung chung tu.",
        reason: "Can bo sung chung tu truoc khi duyet.",
        requiredPermission: "proposal.request_change",
        returnToHref: "/approvals/proposal/finance-secret?scopeId=scope-a",
        sourceCitationIds: ["approval-source-finance-secret"],
        status: "proposed",
        targetEntityId: "finance-secret",
        targetEntityType: "proposal",
        workflowStatus: "DRAFT",
      },
    ],
    citations: [
      {
        href: "/approvals/proposal/finance-secret",
        id: "approval-source-finance-secret",
        sourceId: "finance-secret",
        sourceType: "proposal",
        title: "Finance approval",
      },
      {
        href: "/projects/demo-project-riverside",
        id: "approval-source-demo-project-riverside",
        sourceId: "demo-project-riverside",
        sourceType: "project",
        title: "Project demo-project-riverside",
      },
    ],
    generatedFrom: ["requestSummary", "policy", "linkedSources"],
    interactionId: "interaction-approval",
    jobId: "job-approval",
    missingInformation: ["Can hoi ai chiu trach nhiem chung tu?"],
    riskNotes: ["Risk: can bo sung chung tu."],
    status: "draft",
    suggestedQuestions: ["Co can hop review approval khong?"],
    summaryText: "AI draft approval summary",
    updatedAt: "2026-06-04T00:00:00.000Z",
  };
}
