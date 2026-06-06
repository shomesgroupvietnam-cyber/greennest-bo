import { describe, expect, it } from "vitest";

import type { PermissionUser } from "@/lib/permissions/can";
import { getCommandCenterData } from "@/modules/command-center/services/command-center-service";
import { createDefaultRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-repository";
import type { LeadershipDelegation, ScopeAssignment } from "@/modules/settings/types";

const founder: PermissionUser = { id: "mock-founder", role: "tong_giam_doc" };
const admin: PermissionUser = { id: "admin-user", role: "admin" };
const employee: PermissionUser = { id: "employee-user", role: "ke_toan" };
const projectDirector: PermissionUser = {
  id: "project-director-without-scope",
  role: "giam_doc_du_an",
};
const axisOneProjectId = "11111111-1111-4111-8111-111111111111";

describe("command center service", () => {
  it("returns all three axes and executive dashboard sections", async () => {
    const data = await getCommandCenterData(founder);

    expect(data.axes.map((axis) => axis.title)).toEqual([
      "Dự án | Project Management",
      "Kiến tạo | Build Management",
      "Điều hành | Operations & Analytics",
    ]);
    expect(data.axes[0].items.map((item) => item.label)).toContain(
      "Ban lãnh đạo",
    );
    expect(data.axes[0].items.map((item) => item.label)).toContain(
      "Đề xuất - Họp - Phê duyệt nội bộ",
    );
    const executiveItem = data.axes[0].items.find((item) => item.code === "01");

    expect(executiveItem?.href).toBe(
      "/command-center?view=executive-dashboard",
    );
    expect(executiveItem?.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: "/command-center?view=executive-dashboard",
          label: "Dashboard Tong Quan",
          viewKey: "executive-dashboard",
        }),
        expect.objectContaining({
          href: "/command-center?view=executive-morning-briefing",
          label: "Morning Briefing",
          viewKey: "executive-morning-briefing",
        }),
        expect.objectContaining({
          href: "/command-center?view=executive-common-center",
          label: "Executive Common Center",
          viewKey: "executive-common-center",
        }),
        expect.objectContaining({
          href: "/command-center?view=executive-approvals",
          label: "Approval Center",
          viewKey: "executive-approvals",
        }),
        expect.objectContaining({
          href: "/command-center?view=executive-history",
          label: "History & Archive",
          viewKey: "executive-history",
        }),
        expect.objectContaining({
          href: "/command-center?view=executive-private-workspace",
          label: "Private Workspace",
          viewKey: "executive-private-workspace",
        }),
      ]),
    );
    expect(
      data.axes.flatMap((axis) => axis.items).every((item) => item.viewKey),
    ).toBe(true);
    expect(data.kpis.length).toBeGreaterThanOrEqual(5);
    expect(data.availableViews).toMatchObject({
      operationsDashboard: true,
      overview: true,
    });
    expect(data.projects.length).toBeGreaterThan(0);
    expect(data.overdueTasks.length).toBeGreaterThan(0);
    expect(data.schedule.length).toBeGreaterThan(0);
    expect(data.aiSuggestions.length).toBeGreaterThan(0);
    expect(data.executiveWorkspace.globalStatusItems.length).toBeGreaterThan(0);
    expect(data.executiveDashboard).toMatchObject({
      scope: expect.objectContaining({ operatingRole: "CEO" }),
      projectPortfolio: expect.objectContaining({ total: expect.any(Number) }),
      approvalSummary: expect.objectContaining({ pending: expect.any(Number) }),
    });
    expect(data.executiveMorningBriefing).toMatchObject({
      scope: expect.objectContaining({ operatingRole: "CEO" }),
      summary: expect.objectContaining({
        status: expect.stringMatching(/placeholder|draft|insufficient_context/),
      }),
      projectHealth: expect.objectContaining({ total: expect.any(Number) }),
    });
    expect(data.executiveCommonCenter).toMatchObject({
      scope: expect.objectContaining({ operatingRole: "CEO" }),
      priorityItems: expect.any(Array),
      riskOverview: expect.objectContaining({ critical: expect.any(Number) }),
    });
    expect(data.executivePrivateWorkspace).toMatchObject({
      scope: expect.objectContaining({ operatingRole: "CEO" }),
      variant: "ceo",
      priorityItems: expect.any(Array),
      assignedProjects: expect.any(Array),
    });
    expect(data.approvalCenter).toMatchObject({
      permissions: expect.objectContaining({ canView: true }),
      tabs: expect.arrayContaining([
        expect.objectContaining({
          key: "axis_1",
          label: "Truc 1",
          state: "available",
        }),
        expect.objectContaining({
          key: "axis_2",
          state: "placeholder",
        }),
        expect.objectContaining({
          key: "axis_3",
          state: "placeholder",
        }),
      ]),
    });
    expect(data.executiveWorkspace.access?.operatingRole).toBe("CEO");
    expect(data.executiveWorkspace.axisDefinitions.map((axis) => axis.id)).toEqual([
      "project_management",
      "build_management",
      "operations_analytics",
    ]);
    expect(data.executiveWorkspace.roleDefinitions.map((role) => role.role)).toEqual(
      expect.arrayContaining(["CHAIRMAN", "CEO", "PROJECT_DIRECTOR"]),
    );
    expect(data.executiveWorkspace.strategicPlans.length).toBeGreaterThan(0);
    expect(data.executiveWorkspace.leadershipTeam.length).toBeGreaterThan(0);
    expect(data.executiveWorkspace.directives.length).toBeGreaterThan(0);
    expect(data.executiveWorkspace.meetings.length).toBeGreaterThan(0);
    expect(data.executiveWorkspace.approvals.length).toBeGreaterThan(0);
    expect(data.executiveWorkspace.decisionLog.length).toBeGreaterThan(0);
    expect(data.executiveWorkspace.auditLog.length).toBeGreaterThan(0);
    expect(data.executiveWorkspace.aiInsights.length).toBeGreaterThan(0);
    expect(data.executiveWorkspace.overviewCards).toHaveLength(5);
    expect(
      data.executiveWorkspace.commandCenterSnapshot.notes.length,
    ).toBeGreaterThan(0);
    expect(
      data.executiveWorkspace.commandCenterSnapshot.quickReports.length,
    ).toBeGreaterThanOrEqual(5);
    expect(
      data.executiveWorkspace.leadershipActionItems.length,
    ).toBeGreaterThan(0);
    expect(
      new Set(
        data.executiveWorkspace.leadershipActionItems.map((item) => item.axis),
      ),
    ).toEqual(
      new Set([
        "project_management",
        "build_management",
        "operations_analytics",
      ]),
    );
    expect(
      data.executiveWorkspace.aiLeadershipSummary.weeklyPriorities.length,
    ).toBeGreaterThan(0);
  });

  it("keeps command-center settings hidden from chairman but visible to super admin", async () => {
    const chairmanData = await getCommandCenterData({
      id: "chairman-01",
      role: "chu_tich",
    });
    const superAdminData = await getCommandCenterData({
      id: "super-admin-01",
      role: "super_admin",
    });

    expect(chairmanData.availableViews.settings).toBe(false);
    expect(superAdminData.availableViews.settings).toBe(true);
  });

  it("does not serialize legacy executive approvals when Approval Center permission is denied", async () => {
    const data = await getCommandCenterData(admin, {
      rolePermissionCatalog: createDefaultRolePermissionCatalog(),
      scopeAssignments: [],
    });

    expect(data.approvalCenter?.permissions.canView).toBe(false);
    expect(data.executiveWorkspace.access?.operatingRole).toBe("CHAIRMAN");
    expect(data.executiveWorkspace.approvals).toEqual([]);
  });

  it("does not expose executive dashboard data to non-leadership employees", async () => {
    const data = await getCommandCenterData(employee);

    expect(
      data.axes
        .flatMap((axis) => axis.items)
        .some((item) => item.viewKey === "executive-dashboard"),
    ).toBe(false);
    expect(data.executiveWorkspace.overviewCards).toEqual([]);
    expect(data.executiveDashboard).toBeNull();
    expect(data.executiveMorningBriefing).toBeNull();
    expect(data.executiveCommonCenter).toBeNull();
    expect(data.executivePrivateWorkspace).toBeNull();
    expect(data.approvalCenter).toBeNull();
    expect(data.executiveWorkspace.access).toBeNull();
    expect(data.executiveWorkspace.axisDefinitions).toEqual([]);
    expect(data.executiveWorkspace.leadershipActionItems).toEqual([]);
    expect(data.executiveWorkspace.commandCenterSnapshot.quickReports).toEqual(
      [],
    );
  });

  it("does not load legacy executive workspace data for invalid selected scope", async () => {
    const data = await getCommandCenterData(founder, {
      rolePermissionCatalog: createDefaultRolePermissionCatalog(),
      scopeAssignments: [],
      selectedScopeId: "missing-scope",
    });

    expect(
      data.axes
        .flatMap((axis) => axis.items)
        .some((item) => item.viewKey === "executive-dashboard"),
    ).toBe(false);
    expect(data.executiveDashboard).toBeNull();
    expect(data.executiveMorningBriefing).toBeNull();
    expect(data.executiveCommonCenter).toBeNull();
    expect(data.executivePrivateWorkspace).toMatchObject({
      emptyState: expect.objectContaining({ kind: "invalid_scope" }),
      assignedProjects: [],
      priorityItems: [],
    });
    expect(data.executiveWorkspace.access).toBeNull();
    expect(data.executiveWorkspace.projects).toEqual([]);
    expect(data.executiveWorkspace.leadershipActionItems).toEqual([]);
    expect(data.executiveWorkspace.commandCenterSnapshot.quickReports).toEqual([]);
  });

  it("keeps direct Axis 1 access populated when no scope is selected", async () => {
    const data = await getCommandCenterData(projectDirector, {
      rolePermissionCatalog: createDefaultRolePermissionCatalog(),
      scopeAssignments: [],
    });

    expect(data.axisOneDashboard.stages.length).toBeGreaterThan(0);
    expect(data.axisOneDashboard.summary.totalStages).toBeGreaterThan(0);
  });

  it("does not treat scoped executive workspace assignment as command-center eligibility", async () => {
    const scopeAssignments: ScopeAssignment[] = [
      {
        id: "scoped-executive-assignment",
        userId: "scoped-executive",
        roleKey: "giam_doc_du_an",
        projectId: axisOneProjectId,
        axisId: "axis-1",
        permissionKeys: ["project.view", "task.view", "proposal.view"],
        active: true,
        scopeType: "scoped",
        createdAt: "",
        updatedAt: "",
      },
    ];
    const data = await getCommandCenterData(
      { id: "scoped-executive", role: "viewer" },
      {
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments,
      },
    );

    expect(
      data.axes
        .flatMap((axis) => axis.items)
        .some((item) => item.viewKey === "executive-dashboard"),
    ).toBe(false);
    expect(data.executiveWorkspace.access).toBeNull();
    expect(data.executiveDashboard).toBeNull();
    expect(data.executiveMorningBriefing).toBeNull();
    expect(data.executiveCommonCenter).toBeNull();
    expect(data.executivePrivateWorkspace).not.toBeNull();
  });

  it("shows Approval Center to scoped proposal approvers without executive dashboard data", async () => {
    const scopeAssignments: ScopeAssignment[] = [
      {
        id: "scoped-proposal-approval",
        userId: "scoped-approval",
        roleKey: "dau_tu_phat_trien",
        projectId: axisOneProjectId,
        axisId: "axis-1",
        permissionKeys: ["proposal.view", "proposal.review"],
        active: true,
        scopeType: "scoped",
        createdAt: "",
        updatedAt: "",
      },
    ];
    const data = await getCommandCenterData(
      { id: "scoped-approval", role: "viewer" },
      {
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments,
      },
    );
    const viewKeys = data.axes.flatMap((axis) =>
      axis.items.flatMap((item) => [
        item.viewKey,
        ...(item.children?.map((child) => child.viewKey) ?? []),
      ]),
    );

    expect(viewKeys).toContain("executive-approvals");
    expect(viewKeys).not.toContain("executive-dashboard");
    expect(data.approvalCenter?.permissions.canView).toBe(true);
    expect(data.executiveDashboard).toBeNull();
    expect(data.executiveMorningBriefing).toBeNull();
    expect(data.executiveCommonCenter).toBeNull();
  });

  it("shows scoped Axis 1 overview without executive dashboard data", async () => {
    const scopeAssignments: ScopeAssignment[] = [
      {
        id: "scoped-axis-one-assignment",
        userId: "scoped-axis-one",
        roleKey: "giam_doc_du_an",
        projectId: axisOneProjectId,
        axisId: "axis-1",
        permissionKeys: ["axis1.view", "project.view", "task.view"],
        active: true,
        scopeType: "scoped",
        createdAt: "",
        updatedAt: "",
      },
    ];
    const data = await getCommandCenterData(
      { id: "scoped-axis-one", role: "viewer" },
      {
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments,
      },
    );

    expect(
      data.axes
        .flatMap((axis) => axis.items)
        .some((item) => item.viewKey === "axis1-search-development"),
    ).toBe(true);
    expect(
      data.axes
        .flatMap((axis) => axis.items)
        .some((item) => item.viewKey === "executive-dashboard"),
    ).toBe(false);
    expect(data.executiveDashboard).toBeNull();
    expect(data.executiveMorningBriefing).toBeNull();
    expect(data.executiveCommonCenter).toBeNull();
    expect(data.availableViews.overview).toBe(false);
    expect(data.availableViews.operationsDashboard).toBe(false);
    expect(
      data.axes
        .flatMap((axis) => axis.items)
        .some((item) => item.viewKey === "operations-dashboard"),
    ).toBe(false);
    expect(data.kpis).toEqual([]);
    expect(data.projects).toEqual([]);
    expect(data.axisOneDashboard.stages.length).toBeGreaterThan(0);
    expect(
      data.axisOneDashboard.stages.every(
        (stage) => stage.projectId === axisOneProjectId,
      ),
    ).toBe(true);
  });

  it("bounds delegated Axis 1 command-center data to the delegated scope", async () => {
    const delegations: LeadershipDelegation[] = [
      {
        actionKeys: ["axis1.view"],
        active: true,
        createdAt: "",
        delegateUserId: "assistant-delegate",
        id: "delegate-riverside-axis1",
        principalUserId: "mock-founder",
        projectId: axisOneProjectId,
        updatedAt: "",
      },
    ];
    const data = await getCommandCenterData(
      { id: "assistant-delegate", role: "thu_ky_tro_ly" },
      {
        delegations,
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [],
      },
    );

    expect(
      data.axes
        .flatMap((axis) => axis.items)
        .some((item) => item.viewKey === "axis1-search-development"),
    ).toBe(true);
    expect(data.axisOneDashboard.stages.length).toBeGreaterThan(0);
    expect(
      data.axisOneDashboard.stages.every(
        (stage) => stage.projectId === axisOneProjectId,
      ),
    ).toBe(true);
    expect(data.availableViews.operationsDashboard).toBe(false);
  });

  it("keeps private workspace navigation explicit for viewer only", async () => {
    const scopeAssignments: ScopeAssignment[] = [
      {
        id: "scope-viewer-garden",
        userId: "viewer-01",
        roleKey: "viewer",
        projectId: "demo-project-garden",
        axisId: "axis-1",
        permissionKeys: ["project.view", "meeting.view"],
        active: true,
        scopeType: "scoped",
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "scope-assistant-riverside",
        userId: "assistant-01",
        roleKey: "thu_ky_tro_ly",
        projectId: "demo-project-riverside",
        axisId: "axis-1",
        permissionKeys: ["project.view", "meeting.view"],
        active: true,
        scopeType: "scoped",
        createdAt: "",
        updatedAt: "",
      },
    ];
    const viewerData = await getCommandCenterData(
      { id: "viewer-01", role: "viewer" },
      {
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments,
        selectedScopeId: "scope-viewer-garden",
      },
    );

    expect(
      viewerData.axes
        .flatMap((axis) => axis.items)
        .some((item) => item.viewKey === "executive-private-workspace"),
    ).toBe(true);
    expect(viewerData.executivePrivateWorkspace?.variant).toBe("viewer");

    const assistantData = await getCommandCenterData(
      { id: "assistant-01", role: "thu_ky_tro_ly" },
      {
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments,
        selectedScopeId: "scope-assistant-riverside",
      },
    );

    expect(
      assistantData.axes
        .flatMap((axis) => axis.items)
        .some((item) => item.viewKey === "executive-private-workspace"),
    ).toBe(false);
    expect(assistantData.executivePrivateWorkspace).toBeNull();
  });
});
