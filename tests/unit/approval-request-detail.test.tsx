import { render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { ApprovalRequestDetail } from "@/modules/executive/components/approval-request-detail";
import type { ApprovalCenterDetailData } from "@/modules/executive/types";

const detail: ApprovalCenterDetailData = {
  backHref: "/command-center?view=executive-approvals&scopeId=scope-a",
  generatedAt: "2026-05-29T00:00:00.000Z",
  attachments: [
    {
      helper: "Document attachment",
      href: "/documents/document-visible",
      id: "attachment-document",
      name: "Tai lieu trong scope.pdf",
      source: "document",
      state: "linked",
      uploadedAt: "2026-05-20T00:00:00.000Z",
      uploadedBy: "submitter-01",
    },
    {
      helper: "Khong co quyen xem file dinh kem nay trong scope hien tai",
      id: "attachment-hidden",
      name: "File bi gioi han quyen",
      source: "document",
      state: "no_permission",
    },
  ],
  history: [
    {
      actorId: "submitter-01",
      id: "history-01",
      kind: "decision",
      label: "submitted",
      notes: "Submitted for approval",
      occurredAt: "2026-05-21T08:30:00.000Z",
      nextStatus: "in_review",
      previousStatus: "draft",
      status: "submitted",
      version: 1,
    },
    {
      actorId: "approver-01",
      auditAction: "proposal.approved",
      auditLogId: "audit-01",
      id: "audit-01",
      kind: "audit",
      label: "proposal.approved",
      nextStatus: "approved",
      nextStepStatus: "approved",
      notes: "Approved after review",
      occurredAt: "2026-05-21T09:00:00.000Z",
      previousStatus: "in_review",
      previousStepStatus: "in_review",
    },
    {
      id: "link-source-project",
      kind: "link",
      label: "Linked source: Project demo-project-riverside",
      notes: "Relation: source",
      occurredAt: "2026-05-20T00:00:00.000Z",
      status: "source",
    },
  ],
  linkedSources: [
    {
      entityId: "demo-project-riverside",
      entityType: "project",
      helper: "Source record",
      href: "/projects/demo-project-riverside",
      id: "source-project",
      label: "Project demo-project-riverside",
      relationType: "source",
      state: "linked",
    },
    {
      entityId: "future-module-record",
      entityType: "axis-2-specialist-module",
      helper: "Placeholder read-only",
      id: "source-future",
      label: "axis-2-specialist-module future-module-record",
      relationType: "evidence",
      state: "placeholder",
    },
  ],
  overdue: {
    daysOverdue: 4,
    isOverdue: true,
    nextAction: "Kiem tra escalation queue va nang cap theo policy.",
    ownerLabel: "owner-01",
    reason: "Qua han 4 ngay theo Policy sentinel.",
    severity: "critical",
  },
  escalation: {
    notificationId: "mock-notification-01",
    policyId: "policy-sentinel",
    policyLabel: "Policy sentinel",
    reason: "Qua han 4 ngay theo Policy sentinel.",
    required: true,
    status: "queued",
    targets: [
      {
        kind: "current_approver",
        label: "tong_giam_doc",
        roleKey: "tong_giam_doc",
        scopeMatched: true,
      },
      {
        kind: "delegate",
        label: "assistant-01",
        userId: "assistant-01",
        delegationId: "delegation-01",
        scopeMatched: true,
      },
    ],
    thresholdDays: 3,
    trigger: "long_overdue",
  },
  permissions: {
    availableActions: [],
    canCreateDecisionFromApproval: true,
    canView: true,
    canViewAudit: true,
    canViewFinance: false,
  },
  decisionEntryPoint: {
    canCreate: true,
    projectId: "demo-project-riverside",
    selectedScopeId: "scope-a",
    sourceId: "finance-secret",
    sourceType: "approval",
    titleSuggestion: "Decision after approval: Approval detail title",
  },
  policy: {
    approvalLevel: "CEO",
    approverRole: "tong_giam_doc",
    currentStepId: "step-01",
    requiredPermission: "proposal.approve",
    status: "in_review",
    stepOrder: 1,
    thresholdLabel: "Policy sentinel",
    thresholdPolicyId: "policy-sentinel",
  },
  requestSummary: {
    dueDate: "2026-05-30",
    attachmentCount: 2,
    deadlineCompliance: "valid",
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
    title: "Approval detail title",
  },
};

describe("ApprovalRequestDetail", () => {
  it("renders read-only approval detail sections without mutation actions", () => {
    render(<ApprovalRequestDetail detail={detail} />);

    expect(
      screen.getByRole("heading", { name: "Approval detail title" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /T.m t.t y.u c.u/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Ch.nh s.ch/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Qu.* h.n v. leo thang/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /File .{0,3}nh k.m/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Ngu.n li.n quan/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /L.ch s. v. ki.m to.n/i })).toBeInTheDocument();
    expect(screen.getAllByText(/T.i ch.nh b. gi.i h.n quy.n/).length).toBeGreaterThan(0);
    expect(screen.queryByText("9,999,000,000")).not.toBeInTheDocument();
    expect(screen.getByText(/Phi.n b.n 1/)).toBeInTheDocument();
    expect(screen.getByText("draft -> in_review")).toBeInTheDocument();
    expect(screen.getByText("proposal.approved")).toBeInTheDocument();
    expect(screen.getByText("Linked source: Project demo-project-riverside")).toBeInTheDocument();
    expect(screen.getByText("Relation: source")).toBeInTheDocument();
    expect(screen.getAllByText("in_review -> approved").length).toBeGreaterThan(0);
    expect(screen.getByText("critical")).toBeInTheDocument();
    expect(screen.getByText("Qua han 4 ngay theo Policy sentinel.")).toBeInTheDocument();
    expect(screen.getByText("Kiem tra escalation queue va nang cap theo policy.")).toBeInTheDocument();
    expect(screen.getByText("mock-notification-01")).toBeInTheDocument();
    expect(screen.getByText("assistant-01")).toBeInTheDocument();
    expect(screen.getByText("Tai lieu trong scope.pdf")).toBeInTheDocument();
    expect(screen.getByText("File bi gioi han quyen")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /M. file Tai lieu trong scope.pdf/ })).toHaveAttribute(
      "href",
      "/documents/document-visible",
    );

    const sources = screen.getByRole("region", { name: /Ngu.n li.n quan/i });

    expect(
      within(sources).getByRole("link", {
        name: /M. ngu.n Project demo-project-riverside/,
      }),
    ).toHaveAttribute("href", "/projects/demo-project-riverside");
    expect(within(sources).getByText("Placeholder read-only")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /approve|reject|return|request changes|forward|hold|cancel|duyet|tu choi/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("falls back instead of throwing on invalid date values", () => {
    render(
      <ApprovalRequestDetail
        detail={{
          ...detail,
          generatedAt: "not-a-date",
          history: [
            {
              ...detail.history[0],
              occurredAt: "not-a-date",
            },
          ],
          requestSummary: {
            ...detail.requestSummary,
            dueDate: "not-a-date",
          },
        }}
      />,
    );

    expect(screen.getByText(/T.o l.c -/)).toBeInTheDocument();
    expect(screen.getByText("submitter-01 - -")).toBeInTheDocument();
  });

  it("renders audit permission state without raw audit details", () => {
    render(
      <ApprovalRequestDetail
        detail={{
          ...detail,
          history: [detail.history[0]],
          permissions: {
            ...detail.permissions,
            canViewAudit: false,
          },
        }}
      />,
    );

    expect(screen.getByText(/S. ki.n ki.m to.n b. .n theo quy.n/)).toBeInTheDocument();
    expect(screen.queryByText("proposal.approved")).not.toBeInTheDocument();
    expect(screen.queryByText("oldValue")).not.toBeInTheDocument();
    expect(screen.queryByText("newValue")).not.toBeInTheDocument();
  });

  it("renders the contextual AI approval assistant when server data provides it", () => {
    render(
      <ApprovalRequestDetail
        detail={{
          ...detail,
          aiAssistant: {
            actionProposals: [],
            citations: [
              {
                id: "approval-source-finance-secret",
                sourceId: "finance-secret",
                sourceType: "proposal",
                title: "Approval detail title",
              },
            ],
            generatedFrom: ["requestSummary", "policy"],
            missingInformation: ["Can bo sung chung tu."],
            riskNotes: ["Risk: qua han approval."],
            status: "draft",
            suggestedQuestions: ["Can hop review khong?"],
            summaryText: "AI draft approval summary",
            updatedAt: "2026-06-04T00:00:00.000Z",
          },
        }}
      />,
    );

    expect(
      screen.getByRole("region", { name: /Tr. l. ph. duy.t AI|AI Approval Assistant/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("AI draft approval summary")).toBeInTheDocument();
  });

  it("renders enabled approval action controls with required safeguards", () => {
    render(
      <ApprovalRequestDetail
        detail={{
          ...detail,
          permissions: {
            ...detail.permissions,
            availableActions: [
              {
                action: "approve",
                enabled: true,
                label: "Duyet approval",
              },
              {
                action: "reject",
                destructive: true,
                enabled: true,
                label: "Tu choi",
                requiresConfirmation: true,
                requiresReason: true,
              },
              {
                action: "request_change",
                enabled: true,
                label: "Tra lai",
                requiresReason: true,
              },
              {
                action: "forward",
                enabled: true,
                label: "Chuyen cap",
              },
              {
                action: "ask_meeting",
                enabled: true,
                label: "Yeu cau hop",
              },
              {
                action: "hold",
                enabled: true,
                label: "Tam giu",
              },
              {
                action: "cancel",
                destructive: true,
                enabled: true,
                label: "Huy approval",
                requiresConfirmation: true,
                requiresReason: true,
              },
            ],
          },
        }}
      />,
    );

    const panel = screen.getByRole("region", { name: /H.nh .{1,2}ng ph. duy.t/ });

    expect(within(panel).getByRole("button", { name: "Duyet approval" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "Tu choi" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "Tra lai" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "Chuyen cap" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "Yeu cau hop" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "Tam giu" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "Huy approval" })).toBeInTheDocument();
    expect(within(panel).getByLabelText(/L. do t. ch.i/)).toBeRequired();
    expect(within(panel).getByLabelText(/L. do tr. l.i/)).toBeRequired();
    expect(within(panel).getByLabelText(/X.c nh.n t. ch.i/)).toBeRequired();
    expect(within(panel).getByLabelText(/X.c nh.n h.y/)).toBeRequired();
  });

  it("renders a separate create-decision entry point from approval without leaking finance payload", () => {
    render(<ApprovalRequestDetail detail={detail} />);

    const panel = screen.getByRole("region", {
      name: /Tao quyet dinh chinh thuc/i,
    });

    expect(panel).toBeInTheDocument();
    expect(
      within(panel).getByRole("button", { name: /Tao quyet dinh/i }),
    ).toBeInTheDocument();
    expect(panel.querySelector('input[name="sourceType"]')).toHaveValue(
      "approval",
    );
    expect(panel.querySelector('input[name="sourceId"]')).toHaveValue(
      "finance-secret",
    );
    expect(panel.querySelector('input[name="projectId"]')).toHaveValue(
      "demo-project-riverside",
    );
    expect(panel.querySelector('input[name="scopeId"]')).toHaveValue("scope-a");
    expect(panel.textContent).not.toContain("9,999,000,000");
    expect(panel.textContent).not.toContain("9999000000");
  });

  it("does not render the create-decision entry point when the DTO denies permission", () => {
    render(
      <ApprovalRequestDetail
        detail={{
          ...detail,
          decisionEntryPoint: undefined,
          permissions: {
            ...detail.permissions,
            canCreateDecisionFromApproval: false,
          },
        }}
      />,
    );

    expect(
      screen.queryByRole("region", { name: /Tao quyet dinh chinh thuc/i }),
    ).not.toBeInTheDocument();
  });
});
