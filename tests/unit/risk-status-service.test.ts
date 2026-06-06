import { describe, expect, it } from "vitest";

import {
  buildExecutiveRiskItem,
  buildExecutiveRiskItemFromRecord,
  buildRiskStatusSuggestion,
  mapRiskCategoryToConfiguredGroup,
  normalizeRiskLevel,
} from "@/modules/executive/services/risk-status-service";
import type { ExecutiveLeadershipActionItem } from "@/modules/executive/types";
import type { RiskGroupConfig } from "@/modules/settings/types";

const timestamp = "2026-05-24T00:00:00.000Z";

function riskGroup(overrides: Partial<RiskGroupConfig>): RiskGroupConfig {
  return {
    active: true,
    createdAt: timestamp,
    createdBy: "test",
    defaultSeverity: "medium",
    id: "risk-group-test",
    isDefault: true,
    labelVi: "Test",
    riskKey: "test",
    sortOrder: 10,
    updatedAt: timestamp,
    updatedBy: "test",
    ...overrides,
  };
}

const configuredGroups = [
  riskGroup({
    defaultSeverity: "high",
    id: "risk-group-finance",
    labelVi: "Tài chính",
    moduleId: "finance",
    riskKey: "finance",
  }),
  riskGroup({
    defaultSeverity: "high",
    id: "risk-group-planning-technical",
    labelVi: "Quy hoạch / kỹ thuật",
    moduleId: "planning",
    riskKey: "planning_technical",
    sortOrder: 15,
  }),
  riskGroup({
    defaultSeverity: "medium",
    id: "risk-group-system-permission",
    labelVi: "Hệ thống / phân quyền",
    moduleId: "settings",
    riskKey: "system_permission",
    sortOrder: 20,
  }),
];

const action = {
  approvalCategory: "budget_approval",
  approvalLevel: "CEO",
  approvalType: "finance",
  axis: "project_management",
  axisId: "project_management",
  category: "alert",
  deadline: "2026-05-20",
  decisionRequired: "Cần quyết định phương án dòng tiền.",
  dueGroup: "overdue",
  escalationReason: "Quá hạn phê duyệt và có rủi ro dòng tiền.",
  href: "/command-center?risk=action-risk-finance",
  id: "action-risk-finance",
  impactSummary: "Rủi ro dòng tiền đang chặn tiến độ thanh toán.",
  isScheduleImpact: true,
  legalImpact: false,
  moduleId: "finance",
  organizationId: "org-a",
  organizationName: "GreenNest",
  ownerName: "finance-owner",
  priority: "critical",
  projectId: "project-a",
  projectImportance: "strategic",
  projectName: "Project A",
  requiresTodayDecision: true,
  riskCategory: "cashflow_risk",
  riskLevel: "critical",
  role: "CEO",
  scheduleImpact: true,
  scope: {
    axisId: "project_management",
    moduleId: "finance",
    organizationId: "org-a",
    permission: "finance.view",
    projectId: "project-a",
    role: "CEO",
  },
  status: "blocked",
  title: "Dòng tiền thanh toán nhà thầu bị chặn",
  tone: "red",
  type: "risk",
  permission: "finance.view",
} satisfies ExecutiveLeadershipActionItem;

describe("risk status service", () => {
  it("normalizes canonical risk levels with Vietnamese labels", () => {
    expect(normalizeRiskLevel("critical")).toMatchObject({
      key: "critical",
      labelVi: "Nghiêm trọng",
    });
    expect(normalizeRiskLevel("high")).toMatchObject({
      key: "high",
      labelVi: "Cao",
    });
    expect(normalizeRiskLevel("not-a-level")).toMatchObject({
      key: "medium",
      labelVi: "Trung bình",
    });
  });

  it("maps legacy executive categories to configured risk groups with fallback defaults", () => {
    expect(mapRiskCategoryToConfiguredGroup("cashflow_risk", configuredGroups)).toMatchObject({
      defaultSeverity: "high",
      key: "finance",
      label: "Tài chính",
      moduleId: "finance",
    });
    expect(mapRiskCategoryToConfiguredGroup("material_risk", configuredGroups)).toMatchObject({
      key: "finance",
      label: "Tài chính",
    });
    expect(mapRiskCategoryToConfiguredGroup("land_risk", configuredGroups)).toMatchObject({
      key: "planning_technical",
      label: "Quy hoạch / kỹ thuật",
    });
    expect(mapRiskCategoryToConfiguredGroup("compliance_risk", configuredGroups)).toMatchObject({
      key: "system_permission",
      label: "Hệ thống / phân quyền",
    });

    expect(mapRiskCategoryToConfiguredGroup("permission_risk", [])).toMatchObject({
      key: "system_permission",
      label: "Hệ thống / phân quyền",
      moduleId: "settings",
    });
  });

  it("builds safe suggested red/yellow/green risk statuses without leaking finance details", () => {
    const suggestion = buildRiskStatusSuggestion({
      generatedAt: timestamp,
      riskLevel: "critical",
      sources: [
        {
          projectId: "project-a",
          reason: "Quá hạn phê duyệt thanh toán 500000000 VND",
          severity: "critical",
          sourceId: "proposal-finance",
          sourceType: "proposal",
          status: "overdue",
          href: "/proposals/proposal-finance",
          permissionState: "read_only",
          title: "Thanh toán nhà thầu",
        },
        {
          projectId: "project-a",
          reason: "External source should keep text safe",
          severity: "high",
          sourceId: "unsafe-source",
          sourceType: "proposal",
          status: "pending",
          href: "https://evil.example/proposals/unsafe-source",
          permissionState: "read_only",
          title: "Unsafe href source",
        },
      ],
    });

    expect(suggestion).toMatchObject({
      confirmationState: "suggested",
      generatedAt: timestamp,
      labelVi: "Đỏ",
      status: "red",
    });
    expect(suggestion.reason).toContain("critical");
    expect(suggestion.sourceData).toEqual([
      expect.objectContaining({
        projectId: "project-a",
        severity: "critical",
        sourceId: "proposal-finance",
        sourceType: "proposal",
        status: "overdue",
        href: "/proposals/proposal-finance",
        permissionState: "read_only",
        reason: expect.stringContaining("["),
      }),
      expect.objectContaining({
        href: undefined,
        sourceId: "unsafe-source",
      }),
    ]);
    expect(JSON.stringify(suggestion.sourceData)).not.toContain("500000000");
    expect(JSON.stringify(suggestion.sourceData)).not.toContain("VND");
    expect(JSON.stringify(suggestion.sourceData)).not.toContain("evil.example");
  });

  it("escalates high legal, finance and planning categories to red suggestions", () => {
    expect(buildRiskStatusSuggestion({
      categoryKey: "legal",
      generatedAt: timestamp,
      riskLevel: "high",
    })).toMatchObject({
      labelVi: "Đỏ",
      status: "red",
    });
    expect(buildRiskStatusSuggestion({
      categoryKey: "operation",
      generatedAt: timestamp,
      riskLevel: "high",
    })).toMatchObject({
      labelVi: "Vàng",
      status: "yellow",
    });
  });

  it("builds dashboard risk items with normalized severity, configured category and suggested status", () => {
    const item = buildExecutiveRiskItem({
      action,
      generatedAt: timestamp,
      riskGroups: configuredGroups,
    });

    expect(item).toMatchObject({
      category: "finance",
      categoryKey: "finance",
      categoryLabel: "Tài chính",
      impact: "critical",
      impactLabel: "Nghiêm trọng",
      id: "risk-action-risk-finance",
      likelihood: "high",
      likelihoodLabel: "Khả năng cao",
      matrixCellLabel: "Khả năng cao x Nghiêm trọng",
      moduleId: "finance",
      nextAction: "Cần quyết định phương án dòng tiền.",
      severity: "critical",
      severityLabel: "Nghiêm trọng",
      sourceId: "action-risk-finance",
      sourceType: "risk",
      statusSuggestion: {
        confirmationState: "suggested",
        generatedAt: timestamp,
        labelVi: "Đỏ",
        status: "red",
        sourceData: [
          expect.objectContaining({
            href: "/command-center?risk=action-risk-finance",
            permissionState: "allowed",
            reason: expect.any(String),
          }),
        ],
      },
    });
  });

  it("sanitizes top-level risk item display text before dashboard serialization", () => {
    const item = buildExecutiveRiskItem({
      action: {
        ...action,
        decisionRequired: "Phê duyệt dòng tiền 700000000 VND trước khi tiếp tục.",
        impactSummary: "Rủi ro thanh toán 900000000 VND đang chặn tiến độ.",
        title: "Thanh toán 800000000 VND cần xử lý",
      },
      generatedAt: timestamp,
      riskGroups: configuredGroups,
    });

    expect(item.title).toContain("[");
    expect(item.reason).toContain("[");
    expect(item.nextAction).toContain("[");
    expect(JSON.stringify(item)).not.toContain("700000000");
    expect(JSON.stringify(item)).not.toContain("800000000");
    expect(JSON.stringify(item)).not.toContain("900000000");
    expect(JSON.stringify(item)).not.toContain("VND");
  });

  it("derives medium likelihood from yellow monitored risk signals", () => {
    const item = buildExecutiveRiskItem({
      action: {
        ...action,
        decisionRequired: "",
        dueGroup: "this_week",
        id: "action-risk-schedule",
        riskCategory: "schedule_risk",
        riskLevel: "medium",
        status: "in_progress",
        title: "Theo doi moc tien do",
        tone: "amber",
      },
      generatedAt: timestamp,
      riskGroups: configuredGroups,
    });

    expect(item).toMatchObject({
      impact: "medium",
      impactLabel: "Trung bình",
      likelihood: "medium",
      likelihoodLabel: "Khả năng trung bình",
      matrixCellLabel: "Khả năng trung bình x Trung bình",
      nextAction: item.statusSuggestion.reason,
    });
  });

  it("builds official risk record items with stable ids and sanitized display text", () => {
    const item = buildExecutiveRiskItemFromRecord({
      generatedAt: timestamp,
      record: {
        categoryKey: "finance",
        createdAt: timestamp,
        createdBy: "ceo-01",
        deadline: "2026-06-10",
        id: "official-risk-01",
        level: "high",
        moduleId: "finance",
        nextAction: "Xu ly thanh toan 700000000 VND",
        ownerId: "owner-01",
        ownerName: "Owner One",
        projectId: "project-a",
        reason: "Cham thanh toan 900000000 VND",
        recordType: "blocker",
        status: "blocked",
        title: "Blocker dong tien 800000000 VND",
        updatedAt: timestamp,
        updatedBy: "ceo-01",
      },
      riskGroups: configuredGroups,
    });

    expect(item).toMatchObject({
      categoryKey: "finance",
      id: "risk-record-official-risk-01",
      owner: "Owner One",
      ownerId: "owner-01",
      sourceId: "official-risk-01",
      sourceType: "risk",
      statusSuggestion: expect.objectContaining({
        status: "red",
      }),
    });
    expect(JSON.stringify(item)).not.toContain("700000000");
    expect(JSON.stringify(item)).not.toContain("800000000");
    expect(JSON.stringify(item)).not.toContain("900000000");
    expect(JSON.stringify(item)).not.toContain("VND");
  });

  it("uses manual override as the effective dashboard status while retaining source status", () => {
    const item = buildExecutiveRiskItemFromRecord({
      generatedAt: timestamp,
      record: {
        categoryKey: "legal",
        createdAt: timestamp,
        createdBy: "ceo-01",
        deadline: "2026-06-10",
        id: "official-risk-override",
        level: "high",
        moduleId: "risk",
        nextAction: "Tiep tuc theo doi",
        ownerId: "owner-01",
        ownerName: "Owner One",
        projectId: "project-a",
        reason: "High legal risk",
        recordType: "risk",
        status: "blocked",
        statusOverride: "green",
        statusOverrideAt: timestamp,
        statusOverrideBy: "ceo-01",
        statusOverrideReason: "CEO xac nhan bien phap kiem soat da du.",
        statusOverrideSourceStatus: "red",
        title: "Legal risk override",
        updatedAt: timestamp,
        updatedBy: "ceo-01",
      },
      riskGroups: configuredGroups,
    });

    expect(item).toMatchObject({
      likelihood: "low",
      status: "blocked",
      statusSuggestion: {
        confirmationState: "overridden",
        generatedAt: timestamp,
        labelVi: "Xanh",
        reason: "CEO xac nhan bien phap kiem soat da du.",
        status: "green",
        sourceData: [
          expect.objectContaining({
            sourceId: "official-risk-override",
            status: "blocked",
          }),
        ],
      },
      tone: "emerald",
    });
  });

  it("attaches overdue source signal while preserving manual override precedence", () => {
    const item = buildExecutiveRiskItemFromRecord({
      generatedAt: timestamp,
      overdue: {
        daysOverdue: 4,
        isOverdue: true,
        nextAction: "Kiem tra escalation risk.",
        ownerLabel: "Owner One",
        reason: "Risk qua han 4 ngay.",
        severity: "critical",
      },
      record: {
        categoryKey: "legal",
        createdAt: timestamp,
        createdBy: "ceo-01",
        deadline: "2026-05-20",
        id: "official-risk-overdue-override",
        level: "high",
        moduleId: "risk",
        nextAction: "Tiep tuc theo doi",
        ownerId: "owner-01",
        ownerName: "Owner One",
        projectId: "project-a",
        reason: "High legal risk qua han",
        recordType: "risk",
        status: "open",
        statusOverride: "green",
        statusOverrideAt: timestamp,
        statusOverrideBy: "ceo-01",
        statusOverrideReason: "CEO xac nhan chua can escalation thanh official blocker.",
        statusOverrideSourceStatus: "red",
        title: "Legal risk overdue override",
        updatedAt: timestamp,
        updatedBy: "ceo-01",
      },
      riskGroups: configuredGroups,
    });

    expect(item).toMatchObject({
      likelihood: "low",
      overdue: {
        daysOverdue: 4,
        isOverdue: true,
        severity: "critical",
      },
      statusSuggestion: {
        confirmationState: "overridden",
        status: "green",
      },
      tone: "emerald",
    });
    expect(item.statusSuggestion.sourceData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reason: expect.stringContaining("Risk qua han"),
          sourceId: "official-risk-overdue-override",
          status: "overdue",
        }),
      ]),
    );
  });
});
