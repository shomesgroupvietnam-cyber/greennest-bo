import { render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { ExecutiveRiskSummary } from "@/modules/dashboard/components/executive-risk-summary";
import type {
  ExecutiveRiskMutationOptions,
  ExecutiveRiskSummary as ExecutiveRiskSummaryData,
} from "@/modules/dashboard/types";

vi.mock("@/modules/executive/actions", () => ({
  closeExecutiveRiskRecordStateAction: vi.fn(),
  createExecutiveRiskRecordStateAction: vi.fn(),
  overrideExecutiveRiskStatusStateAction: vi.fn(),
  updateExecutiveRiskRecordStateAction: vi.fn(),
}));

const mutationOptions: ExecutiveRiskMutationOptions = {
  categories: [{ id: "legal", label: "Phap ly" }],
  delegations: [
    {
      actionKeys: ["risk.create", "risk.update", "risk.override"],
      delegationId: "delegation-risk",
      label: "ceo-01 (risk.create, risk.update, risk.override)",
      principalUserId: "ceo-01",
      projectId: "project-a",
    },
  ],
  owners: [{ id: "owner-01", label: "Owner One" }],
  projects: [{ id: "project-a", label: "Project A" }],
};

const emptyRiskSummary: ExecutiveRiskSummaryData = {
  byCategory: {},
  critical: 0,
  high: 0,
  items: [],
  riskMap: {
    affectedProjectCount: 0,
    categories: [],
    matrix: [],
    total: 0,
  },
};

const officialRiskSummary: ExecutiveRiskSummaryData = {
  byCategory: { "Phap ly": 1 },
  critical: 1,
  high: 0,
  items: [
    {
      category: "legal",
      categoryKey: "legal",
      categoryLabel: "Phap ly",
      deadline: "2026-06-10",
      id: "risk-record-risk-01",
      impact: "critical",
      impactLabel: "Nghiem trong",
      likelihood: "high",
      likelihoodLabel: "Kha nang cao",
      matrixCellLabel: "Kha nang cao x Nghiem trong",
      moduleId: "risk",
      nextAction: "Xu ly blocker",
      owner: "Owner One",
      ownerId: "owner-01",
      projectId: "project-a",
      reason: "Official risk reason",
      severity: "critical",
      severityLabel: "Nghiem trong",
      sourceId: "risk-01",
      sourceType: "risk",
      status: "blocked",
      statusSuggestion: {
        confirmationState: "suggested",
        generatedAt: "2026-06-01T00:00:00.000Z",
        labelVi: "Do",
        reason: "Suggested red",
        sourceData: [],
        status: "red",
      },
      title: "Official risk",
      tone: "red",
    },
  ],
  riskMap: {
    affectedProjectCount: 1,
    categories: [],
    matrix: [],
    total: 1,
  },
};

const overdueRiskSummary: ExecutiveRiskSummaryData = {
  ...officialRiskSummary,
  items: [
    {
      ...officialRiskSummary.items[0],
      escalation: {
        notificationId: "notification-risk-01",
        policyId: "policy-risk-01",
        policyLabel: "Risk dashboard policy",
        required: true,
        status: "queued",
        targets: [
          {
            kind: "owner",
            label: "Owner One",
            scopeMatched: true,
            userId: "owner-01",
          },
          {
            kind: "policy_escalation",
            label: "CEO",
            roleKey: "tong_giam_doc",
            scopeMatched: true,
          },
        ],
        thresholdDays: 3,
        trigger: "critical_overdue",
      },
      overdue: {
        daysOverdue: 4,
        isOverdue: true,
        nextAction: "Kiem tra escalation risk.",
        ownerLabel: "Owner One",
        reason: "Risk qua han 4 ngay.",
        severity: "critical",
      },
    },
  ],
};

function renderSummary(props: Partial<React.ComponentProps<typeof ExecutiveRiskSummary>> = {}) {
  return render(
    <ExecutiveRiskSummary
      canCreateRisk
      canCloseHighRisk
      canCloseRisk
      canDrillDown
      canOverrideRisk
      canUpdateRisk={false}
      categoryEmptyLabel="Khong co category"
      emptyLabel="Khong co risk"
      onSelectSource={vi.fn()}
      portfolio={{
        active: 0,
        green: 0,
        items: [],
        red: 0,
        total: 0,
        yellow: 0,
      }}
      riskMutationOptions={mutationOptions}
      riskSummary={emptyRiskSummary}
      {...props}
    />,
  );
}

describe("RiskRecordForm", () => {
  it("renders Vietnamese required labels and delegated on-behalf option", () => {
    renderSummary();

    const formPanel = screen
      .getAllByText("Tao risk/blocker")
      .find((element) => element.tagName.toLowerCase() === "summary")
      ?.closest("details");

    if (!formPanel) {
      throw new Error("Expected create risk form panel");
    }

    expect(within(formPanel).getByText("Loai ban ghi")).toBeInTheDocument();
    expect(within(formPanel).getByText("Tieu de")).toBeInTheDocument();
    expect(within(formPanel).getByText("Nhom risk")).toBeInTheDocument();
    expect(within(formPanel).getByText("Muc do")).toBeInTheDocument();
    expect(within(formPanel).getByText("Ly do / mo ta")).toBeInTheDocument();
    expect(within(formPanel).getByText("Du an / module lien quan")).toBeInTheDocument();
    expect(within(formPanel).getByText("Nguoi phu trach")).toBeInTheDocument();
    expect(within(formPanel).getByText("Deadline xu ly")).toBeInTheDocument();
    expect(within(formPanel).getByText("Hanh dong tiep theo")).toBeInTheDocument();
    expect(within(formPanel).getByText("Trang thai")).toBeInTheDocument();
    expect(within(formPanel).getByText("ceo-01 (risk.create, risk.update, risk.override)")).toBeInTheDocument();
  });

  it("renders permission-aware override and close panels for active official risks", () => {
    renderSummary({
      canCreateRisk: false,
      canUpdateRisk: false,
      riskSummary: officialRiskSummary,
    });

    const overridePanel = screen
      .getAllByText("Xac nhan/override trang thai")[0]
      .closest("details");
    const closePanel = screen
      .getAllByText("Dong risk/blocker")[0]
      .closest("details");

    if (!overridePanel || !closePanel) {
      throw new Error("Expected override and close panels");
    }

    expect(within(overridePanel).getByText("Trang thai xac nhan")).toBeInTheDocument();
    expect(within(overridePanel).getByText("Ly do override")).toBeInTheDocument();
    expect(within(overridePanel).getByText("ceo-01 (risk.create, risk.update, risk.override)")).toBeInTheDocument();
    expect(within(closePanel).getByText("Trang thai dong")).toBeInTheDocument();
    expect(within(closePanel).getByText("Ly do dong")).toBeInTheDocument();
  });

  it("renders overdue and escalation metadata with text labels on risk cards", () => {
    renderSummary({
      canCreateRisk: false,
      canUpdateRisk: false,
      riskSummary: overdueRiskSummary,
    });

    expect(screen.getByText("Qua han: critical - Risk qua han 4 ngay.")).toBeInTheDocument();
    expect(screen.getByText("Next action: Kiem tra escalation risk.")).toBeInTheDocument();
    expect(screen.getByText("Escalation: critical_overdue - queued")).toBeInTheDocument();
    expect(screen.getByText("Policy: Risk dashboard policy")).toBeInTheDocument();
    expect(screen.getByText("Targets: Owner One, CEO")).toBeInTheDocument();
  });

  it("hides mutation panels when dashboard permissions deny create and update", () => {
    renderSummary({
      canCreateRisk: false,
      canCloseHighRisk: false,
      canCloseRisk: false,
      canOverrideRisk: false,
      canUpdateRisk: false,
      riskSummary: officialRiskSummary,
    });

    expect(screen.queryByText("Tao risk/blocker")).not.toBeInTheDocument();
    expect(screen.queryByText("Cap nhat risk/blocker dang mo")).not.toBeInTheDocument();
    expect(screen.queryByText("Xac nhan/override trang thai")).not.toBeInTheDocument();
    expect(screen.queryByText("Dong risk/blocker")).not.toBeInTheDocument();
  });
});
