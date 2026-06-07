import { render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { ExecutiveRiskSummary } from "@/modules/dashboard/components/executive-risk-summary";
import type {
  ExecutiveRiskMutationOptions,
  ExecutiveRiskSummary as ExecutiveRiskSummaryData,
} from "@/modules/dashboard/types";
import { RiskRecordForm } from "@/modules/executive/components/risk-record-form";

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

function toSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "d")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function viText(expected: string) {
  const target = toSearchText(expected);
  return (_content: string, element: Element | null) => {
    const text = toSearchText(element?.textContent ?? "");

    if (!text.includes(target)) {
      return false;
    }

    return Array.from(element?.children ?? []).every(
      (child) => !toSearchText(child.textContent ?? "").includes(target),
    );
  };
}

function renderSummary(props: Partial<React.ComponentProps<typeof ExecutiveRiskSummary>> = {}) {
  return render(
    <ExecutiveRiskSummary
      canDrillDown
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
      riskSummary={emptyRiskSummary}
      {...props}
    />,
  );
}

describe("RiskRecordForm", () => {
  it("renders Vietnamese required labels and delegated on-behalf option", () => {
    render(<RiskRecordForm mode="create" options={mutationOptions} />);

    expect(screen.getAllByText(viText("tao rui ro vuong mac")).length).toBeGreaterThan(0);
    expect(screen.getByText("Loai ban ghi")).toBeInTheDocument();
    expect(screen.getByText(viText("tieu de"))).toBeInTheDocument();
    expect(screen.getByText(viText("nhom rui ro"))).toBeInTheDocument();
    expect(screen.getByText("Muc do")).toBeInTheDocument();
    expect(screen.getByText(viText("ly do mo ta"))).toBeInTheDocument();
    expect(screen.getByText(viText("du an module lien quan"))).toBeInTheDocument();
    expect(screen.getByText(viText("nguoi phu trach"))).toBeInTheDocument();
    expect(screen.getByText(viText("han xu ly"))).toBeInTheDocument();
    expect(screen.getByText("Hanh dong tiep theo")).toBeInTheDocument();
    expect(screen.getByText(viText("trang thai"))).toBeInTheDocument();
    expect(screen.getByText("ceo-01 (risk.create, risk.update, risk.override)")).toBeInTheDocument();
  });

  it("renders override and close forms when used by the dedicated risk mutation surface", () => {
    const record = officialRiskSummary.items[0];

    render(
      <>
        <section aria-label="override-form">
          <RiskRecordForm mode="override" options={mutationOptions} record={record} />
        </section>
        <section aria-label="close-form">
          <RiskRecordForm mode="close" options={mutationOptions} record={record} />
        </section>
      </>,
    );

    const overrideForm = screen.getByRole("region", { name: "override-form" });
    const closeForm = screen.getByRole("region", { name: "close-form" });

    expect(within(overrideForm).getByText(viText("xac nhan dieu chinh trang thai"))).toBeInTheDocument();
    expect(within(overrideForm).getByText(viText("trang thai xac nhan"))).toBeInTheDocument();
    expect(within(overrideForm).getByText(viText("ly do dieu chinh"))).toBeInTheDocument();
    expect(within(overrideForm).getByText("ceo-01 (risk.create, risk.update, risk.override)")).toBeInTheDocument();
    expect(within(closeForm).getAllByText(viText("dong rui ro vuong mac")).length).toBeGreaterThan(0);
    expect(within(closeForm).getByText(viText("trang thai dong"))).toBeInTheDocument();
    expect(within(closeForm).getByText(viText("ly do dong"))).toBeInTheDocument();
  });

  it("renders overdue and escalation metadata with text labels on risk cards", () => {
    renderSummary({ riskSummary: overdueRiskSummary });

    expect(screen.getByText(viText("qua han critical risk qua han 4 ngay"))).toBeInTheDocument();
    expect(screen.getByText(viText("hanh dong tiep theo kiem tra escalation risk"))).toBeInTheDocument();
    expect(screen.getByText(viText("leo thang critical overdue queued"))).toBeInTheDocument();
    expect(screen.getByText(viText("chinh sach risk dashboard policy"))).toBeInTheDocument();
    expect(screen.getByText(viText("nguoi nhan owner one ceo"))).toBeInTheDocument();
  });

  it("keeps the dashboard risk summary read-only even when official risks are present", () => {
    renderSummary({ riskSummary: officialRiskSummary });

    expect(screen.getByText("Official risk")).toBeInTheDocument();
    expect(screen.queryByText(viText("tao rui ro vuong mac"))).not.toBeInTheDocument();
    expect(screen.queryByText(viText("cap nhat rui ro vuong mac"))).not.toBeInTheDocument();
    expect(screen.queryByText(viText("xac nhan dieu chinh trang thai"))).not.toBeInTheDocument();
    expect(screen.queryByText(viText("dong rui ro vuong mac"))).not.toBeInTheDocument();
  });
});
