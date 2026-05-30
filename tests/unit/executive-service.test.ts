import { describe, expect, it } from "vitest";

import {
  canAccessExecutiveModule,
  EXECUTIVE_ROUTE_ROLES,
  resolveExecutiveAccess,
} from "@/modules/executive/constants";
import { getExecutiveLeadershipData } from "@/modules/executive/services/executive-service";
import {
  approvalRequestSchema,
  decisionLogSchema,
  executiveDirectiveSchema,
  investmentPlanSchema,
  leadershipMeetingSchema,
  leadershipMemberSchema,
} from "@/modules/executive/validation";
import type { ScopeAssignment } from "@/modules/settings/types";

describe("executive leadership service", () => {
  it("returns all required leadership sections for tong_giam_doc", async () => {
    const data = await getExecutiveLeadershipData({
      id: "ceo-01",
      role: "tong_giam_doc",
    });

    expect(data.scopeLabel).toBe("Toan danh muc cong ty duoc cap quyen");
    expect(data.access.operatingRole).toBe("CEO");
    expect(data.accessibleScope.organizationIds).toEqual(["org-green-nest"]);
    expect(data.roleDefinitions.map((role) => role.role)).toEqual(
      expect.arrayContaining([
        "CHAIRMAN",
        "CEO",
        "PROJECT_DIRECTOR",
        "DEPARTMENT_HEAD",
        "STAFF",
      ]),
    );
    expect(data.axisDefinitions.map((axis) => axis.id)).toEqual([
      "project_management",
      "build_management",
      "operations_analytics",
    ]);
    expect(
      data.axisDefinitions.find((axis) => axis.id === "project_management"),
    ).toMatchObject({
      approvalCategories: expect.arrayContaining([
        "legal_approval",
        "planning_approval",
        "design_approval",
        "feasibility_approval",
        "investment_approval",
      ]),
      riskCategories: expect.arrayContaining([
        "legal_risk",
        "land_risk",
        "planning_risk",
        "approval_risk",
        "schedule_risk",
      ]),
    });
    expect(data.organizations.map((organization) => organization.id)).toEqual([
      "org-green-nest",
    ]);
    expect(data.dashboardLayers.map((layer) => layer.layer)).toEqual(
      expect.arrayContaining(["global", "project", "department"]),
    );
    expect(data.escalationRules.map((rule) => rule.approvalLevel)).toEqual(
      expect.arrayContaining([
        "DEPARTMENT_HEAD",
        "PROJECT_DIRECTOR",
        "CEO",
        "CHAIRMAN",
      ]),
    );
    expect(data.escalationRules[0]).toMatchObject({
      thresholdPolicyId: expect.any(String),
      approverRole: expect.any(String),
      requiredPermission: expect.any(String),
    });
    expect(data.riskGroups.map((riskGroup) => riskGroup.key)).toEqual(
      expect.arrayContaining([
        "legal",
        "planning_technical",
        "approval",
        "schedule",
        "finance",
        "missing_document",
        "system_permission",
        "operation",
      ]),
    );
    expect(data.globalStatusItems.length).toBeGreaterThanOrEqual(5);
    expect(data.workspaceSwitchItems.length).toBeGreaterThanOrEqual(5);
    expect(data.metrics.length).toBeGreaterThanOrEqual(5);
    expect(data.overviewCards.map((card) => card.label)).toEqual([
      "Tổng số dự án đang theo dõi",
      "Việc/chỉ đạo quá hạn",
      "Hồ sơ pháp lý đang vướng",
      "Đề xuất chờ duyệt",
      "Rủi ro cao cần xử lý",
    ]);
    expect(data.commandCenterSnapshot.notes.length).toBeGreaterThan(0);
    expect(data.commandCenterSnapshot.meetings.length).toBeGreaterThan(0);
    expect(data.commandCenterSnapshot.workCalendar.length).toBeGreaterThan(0);
    expect(data.commandCenterSnapshot.approvalQueue.length).toBeGreaterThan(0);
    expect(data.commandCenterSnapshot.alerts.length).toBeGreaterThan(0);
    expect(
      data.commandCenterSnapshot.quickReports.map((report) => report.title),
    ).toEqual(
      expect.arrayContaining([
        "Trình duyệt",
        "Xin chi",
        "Quá hạn",
        "Ảnh hưởng tiến độ",
        "Quyết định trong ngày",
      ]),
    );
    expect(data.leadershipActionItems[0]).toMatchObject({
      organizationId: expect.any(String),
      axisId: expect.any(String),
      moduleId: expect.any(String),
      role: expect.any(String),
      permission: expect.any(String),
      axis: expect.any(String),
      title: expect.any(String),
      type: expect.any(String),
      category: expect.any(String),
      projectName: expect.any(String),
      ownerName: expect.any(String),
      deadline: expect.any(String),
      dueGroup: expect.any(String),
      priority: expect.any(String),
      riskLevel: expect.any(String),
      riskCategory: expect.any(String),
      approvalLevel: expect.any(String),
      approvalCategory: expect.any(String),
      legalImpact: expect.any(Boolean),
      scheduleImpact: expect.any(Boolean),
      status: expect.any(String),
      decisionRequired: expect.any(String),
      impactSummary: expect.any(String),
      escalationReason: expect.any(String),
      isScheduleImpact: expect.any(Boolean),
      requiresTodayDecision: expect.any(Boolean),
      href: "/command-center?view=executive-dashboard",
    });
    expect(
      new Set(data.leadershipActionItems.map((item) => item.axis)),
    ).toEqual(
      new Set([
        "project_management",
        "build_management",
        "operations_analytics",
      ]),
    );
    expect(data.aiLeadershipSummary.attentionPoints.length).toBeGreaterThan(0);
    expect(data.aiLeadershipSummary.risks.length).toBeGreaterThan(0);
    expect(data.aiLeadershipSummary.weeklyPriorities.length).toBeGreaterThan(0);
    expect(data.strategicPlans.length).toBeGreaterThan(0);
    expect(data.leadershipTeam.length).toBeGreaterThan(0);
    expect(data.authorityMatrix.length).toBeGreaterThan(0);
    expect(data.directives.length).toBeGreaterThan(0);
    expect(data.meetings.length).toBeGreaterThan(0);
    expect(data.approvals.length).toBeGreaterThan(0);
    expect(data.decisionLog.length).toBeGreaterThan(0);
    expect(data.auditLog.length).toBeGreaterThan(0);
    expect(data.aiInsights.length).toBeGreaterThan(0);
    expect(data.access.level).toBe("founder");
    expect(data.access.canApproveProposal).toBe(true);
    expect(
      data.leadershipActionItems.some(
        (item) => item.organizationId === "org-horizon",
      ),
    ).toBe(false);
    expect(
      data.leadershipActionItems.some(
        (item) => item.approvalLevel === "DEPARTMENT_HEAD",
      ),
    ).toBe(false);
  });

  it("marks pho_tong_giam_doc data as assigned portfolio scope", async () => {
    const data = await getExecutiveLeadershipData({
      id: "executive-01",
      role: "pho_tong_giam_doc",
    });

    expect(data.scopeLabel).toBe("Pham vi danh muc duoc giao");
    expect(data.metrics.map((metric) => metric.label)).toContain(
      "Quyet dinh cho xu ly",
    );
    expect(data.access.level).toBe("leader");
    expect(new Set(data.projects.map((project) => project.projectId))).toEqual(
      new Set(["project-riverside", "project-city", "project-ocean"]),
    );
  });

  it("applies selected scope assignments even for direct leadership roles", async () => {
    const scopeAssignments: ScopeAssignment[] = [
      {
        id: "selected-riverside",
        userId: "ceo-01",
        roleKey: "giam_doc_du_an",
        projectId: "project-riverside",
        axisId: "axis-1",
        permissionKeys: ["project.view", "task.view", "proposal.view"],
        active: true,
        scopeType: "scoped",
        createdAt: "",
        updatedAt: "",
      },
    ];

    const data = await getExecutiveLeadershipData(
      { id: "ceo-01", role: "tong_giam_doc" },
      { selectedScopeId: "selected-riverside", scopeAssignments },
    );

    expect(data.accessibleScope.canViewAllProjects).toBe(false);
    expect(data.projects.map((project) => project.projectId)).toEqual([
      "project-riverside",
    ]);
  });

  it("maps executive module access levels to existing business roles", async () => {
    const adminData = await getExecutiveLeadershipData({
      id: "admin-01",
      role: "admin",
    });

    expect(resolveExecutiveAccess("super_admin")?.level).toBe("owner");
    expect(resolveExecutiveAccess("tong_giam_doc")?.level).toBe("founder");
    expect(adminData.access.level).toBe("admin");
    expect(resolveExecutiveAccess("viewer")).toBeNull();
    expect(canAccessExecutiveModule("viewer")).toBe(false);
    expect(canAccessExecutiveModule("nha_thau")).toBe(false);
  });

  it("limits executive module access to configured executive roles", () => {
    expect([...EXECUTIVE_ROUTE_ROLES].sort()).toEqual(
      [
        "admin",
        "an_toan_lao_dong",
        "dau_tu_phat_trien",
        "giam_doc_du_an",
        "ky_thuat",
        "phap_ly",
        "pho_tong_giam_doc",
        "qa_qc_chat_luong",
        "quan_ly_hop_dong",
        "quan_ly_tai_chinh",
        "super_admin",
        "thiet_ke",
        "thi_cong",
        "tong_giam_doc",
      ].sort(),
    );
    expect(canAccessExecutiveModule("super_admin")).toBe(true);
    expect(canAccessExecutiveModule("admin")).toBe(true);
    expect(canAccessExecutiveModule("tong_giam_doc")).toBe(true);
    expect(canAccessExecutiveModule("pho_tong_giam_doc")).toBe(true);
    expect(canAccessExecutiveModule("giam_doc_du_an")).toBe(true);
    expect(canAccessExecutiveModule("quan_ly_tai_chinh")).toBe(true);
    expect(canAccessExecutiveModule("ke_toan")).toBe(false);
  });

  it("limits project director data to assigned project at service layer", async () => {
    const data = await getExecutiveLeadershipData({
      id: "project-director-01",
      role: "giam_doc_du_an",
    });

    expect(data.access.level).toBe("project_director");
    expect(data.accessibleScope.projectIds).toEqual(["project-riverside"]);
    expect(data.dashboardLayers.map((layer) => layer.layer)).toEqual([
      "project",
    ]);
    expect(new Set(data.projects.map((project) => project.projectId))).toEqual(
      new Set(["project-riverside"]),
    );
    expect(
      data.leadershipActionItems.every(
        (item) => item.projectId === "project-riverside",
      ),
    ).toBe(true);
  });

  it("keeps chairman at strategic/global level and does not surface small department work", async () => {
    const data = await getExecutiveLeadershipData({
      id: "owner-01",
      role: "super_admin",
    });

    expect(data.accessibleScope.operatingRole).toBe("CHAIRMAN");
    expect(data.dashboardLayers.map((layer) => layer.layer)).toEqual([
      "global",
    ]);
    expect(
      data.leadershipActionItems.some(
        (item) => item.approvalLevel === "DEPARTMENT_HEAD",
      ),
    ).toBe(false);
    expect(
      data.leadershipActionItems.some(
        (item) => item.amount !== undefined && item.amount < 20_000_000,
      ),
    ).toBe(false);
    expect(
      data.leadershipActionItems.every(
        (item) =>
          item.approvalLevel === "CHAIRMAN" ||
          item.riskLevel === "critical" ||
          item.projectImportance === "strategic" ||
          item.legalImpact,
      ),
    ).toBe(true);
  });

  it("keeps managed external organization data isolated unless granted", async () => {
    const externalData = await getExecutiveLeadershipData({
      id: "horizon-director-01",
      role: "giam_doc_du_an",
    });

    expect(externalData.accessibleScope.organizationIds).toEqual([
      "org-horizon",
    ]);
    expect(
      externalData.projects.map((project) => project.organizationId),
    ).toEqual(["org-horizon"]);
    expect(
      externalData.leadershipActionItems.every(
        (item) => item.organizationId === "org-horizon",
      ),
    ).toBe(true);
  });

  it("returns department summary only for department head roles", async () => {
    const data = await getExecutiveLeadershipData({
      id: "finance-manager-01",
      role: "quan_ly_tai_chinh",
    });

    expect(data.access.level).toBe("department_head");
    expect(data.dashboardLayers.map((layer) => layer.layer)).toEqual([
      "department",
    ]);
    expect(data.accessibleScope.axisIds).toEqual(["operations_analytics"]);
    expect(
      data.leadershipActionItems.every(
        (item) => item.axis === "operations_analytics",
      ),
    ).toBe(true);
  });

  it("limits axis 1 department heads to project-management department approvals", async () => {
    const data = await getExecutiveLeadershipData({
      id: "legal-head-01",
      role: "phap_ly",
    });

    expect(data.accessibleScope.axisIds).toEqual(["project_management"]);
    expect(data.dashboardLayers.map((layer) => layer.layer)).toEqual([
      "department",
    ]);
    expect(data.leadershipActionItems.map((item) => item.id)).toEqual([
      "leader-action-011",
    ]);
    expect(
      data.leadershipActionItems.every(
        (item) =>
          item.axis === "project_management" &&
          item.approvalLevel === "DEPARTMENT_HEAD",
      ),
    ).toBe(true);
  });

  it("sanitizes finance fields for executive users without finance permission", async () => {
    const data = await getExecutiveLeadershipData({
      id: "legal-head-01",
      role: "phap_ly",
    });
    const serialized = JSON.stringify(data);

    expect(data.leadershipActionItems[0]).not.toHaveProperty("amount");
    expect(data.leadershipActionItems[0]).not.toHaveProperty("amountLabel");
    expect(serialized).not.toContain("amountLabel");
    expect(serialized).not.toContain("cashFlowLabel");
    expect(serialized).not.toContain("budgetLabel");
    expect(serialized).not.toContain("budgetRange");
    expect(serialized).not.toContain("allocatedBudget");
    expect(serialized).not.toContain("committedBudget");
    expect(serialized).not.toContain("12 triệu");
  });

  it("attaches projectId to project-related records and exposes structured audit log", async () => {
    const data = await getExecutiveLeadershipData({
      id: "ceo-01",
      role: "tong_giam_doc",
    });

    expect(data.projects.every((project) => project.projectId)).toBe(true);
    expect(data.urgentItems.every((item) => item.projectId)).toBe(true);
    expect(data.directives.every((directive) => directive.projectId)).toBe(
      true,
    );
    expect(
      data.approvals
        .filter((approval) => approval.title.includes("dự án"))
        .every((approval) => approval.projectId),
    ).toBe(true);
    expect(
      data.decisionLog
        .filter((decision) => decision.decisionText.includes("dự án"))
        .every((decision) => decision.projectId),
    ).toBe(true);

    expect(data.auditLog[0]).toMatchObject({
      action: expect.any(String),
      entityType: expect.any(String),
      entityId: expect.any(String),
      actorId: expect.any(String),
      actorName: expect.any(String),
      createdAt: expect.any(String),
      reason: expect.any(String),
    });
    expect(
      data.auditLog.some((log) => log.projectId === "project-riverside"),
    ).toBe(true);
  });

  it("keeps executive mock data compatible with the domain schemas", async () => {
    const data = await getExecutiveLeadershipData({
      id: "ceo-01",
      role: "tong_giam_doc",
    });

    expect(() =>
      data.strategicPlans.forEach((item) => investmentPlanSchema.parse(item)),
    ).not.toThrow();
    expect(() =>
      data.leadershipTeam.forEach((item) => leadershipMemberSchema.parse(item)),
    ).not.toThrow();
    expect(() =>
      data.directives.forEach((item) => executiveDirectiveSchema.parse(item)),
    ).not.toThrow();
    expect(() =>
      data.meetings.forEach((item) => leadershipMeetingSchema.parse(item)),
    ).not.toThrow();
    expect(() =>
      data.approvals.forEach((item) => approvalRequestSchema.parse(item)),
    ).not.toThrow();
    expect(() =>
      data.decisionLog.forEach((item) => decisionLogSchema.parse(item)),
    ).not.toThrow();

    expect(data.approvals.map((approval) => approval.status)).toEqual(
      expect.arrayContaining(["pending", "revision_required", "approved"]),
    );
  });
});
