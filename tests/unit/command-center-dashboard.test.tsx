import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import type { AppSessionUser } from "@/lib/auth/session";
import { CommandCenterDashboard } from "@/modules/command-center/components/command-center-dashboard";
import { getCommandCenterData } from "@/modules/command-center/services/command-center-service";
import type { CommandCenterData } from "@/modules/command-center/types";
import { createDefaultRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-repository";

vi.mock("@/lib/auth/actions", () => ({
  logoutAction: vi.fn(),
}));

const executiveUser: AppSessionUser = {
  email: "ceo@example.test",
  fullName: "Nguyen Thanh Binh",
  id: "mock-founder",
  role: "tong_giam_doc",
  status: "active",
};

const projectDirectorUser: AppSessionUser = {
  email: "project-director@example.test",
  fullName: "Tran Du An",
  id: "project-director-without-scope",
  role: "giam_doc_du_an",
  status: "active",
};

async function buildCommandCenterData() {
  return getCommandCenterData({
    id: executiveUser.id,
    role: executiveUser.role,
  });
}

function renderDashboard(
  data: CommandCenterData,
  initialView = "executive-dashboard",
  user = executiveUser,
) {
  return render(
    <CommandCenterDashboard
      data={data}
      initialView={initialView}
      user={user}
    />,
  );
}

describe("CommandCenterDashboard executive dashboard", () => {
  it("shows a role workspace return link for project roles entering Command Center", async () => {
    const data = await getCommandCenterData(
      { id: projectDirectorUser.id, role: projectDirectorUser.role },
      {
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [],
      },
    );

    renderDashboard(data, "axis1-search-development", projectDirectorUser);

    const returnLink = screen.getByRole("link", {
      name: /Quay lai Ban du an/i,
    });

    expect(returnLink).toHaveAttribute("href", "/project-workbench");
  });

  it("disables mock executive approval actions for admin", async () => {
    const adminUser: AppSessionUser = {
      email: "admin@example.test",
      fullName: "Admin User",
      id: "admin-01",
      role: "admin",
      status: "active",
    };
    const data = await getCommandCenterData(
      { id: adminUser.id, role: adminUser.role },
      {
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [],
      },
    );
    const legacyData = {
      ...data,
      executiveDashboard: undefined,
    } as unknown as CommandCenterData;

    renderDashboard(legacyData, "executive-dashboard", adminUser);

    expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reject" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Return" })).toBeDisabled();
    expect(
      screen.getByText(/khong co approval authority/i),
    ).toBeInTheDocument();
  });

  it("renders the executive morning briefing view from scoped briefing data", async () => {
    const data = await buildCommandCenterData();
    const briefing = data.executiveMorningBriefing;

    if (!briefing) {
      throw new Error("Expected executive morning briefing data for leadership user");
    }

    data.operationsDashboard.tasksDueThisWeek = [
      {
        assigneeId: "operations-assignee",
        createdAt: "2026-05-20T00:00:00.000Z",
        description: "Operations-only briefing sentinel",
        dueDate: "2026-05-24",
        id: "operations-briefing-sentinel",
        priority: "medium",
        projectId: "demo-project-riverside",
        status: "todo",
        title: "OPERATIONS_BRIEFING_SENTINEL",
        updatedAt: "2026-05-20T00:00:00.000Z",
      },
    ];
    data.executiveMorningBriefing = {
      ...briefing,
      summary: {
        ...briefing.summary,
        citations: [
          {
            id: "citation-visible-test",
            sourceId: "decision-visible-test",
            sourceType: "decision",
            title: "Visible citation metadata",
          },
        ],
      },
    };

    renderDashboard(data, "executive-morning-briefing");

    expect(
      screen.getByRole("heading", { name: "Morning Briefing" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "AI Summary draft" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "KPI hom nay" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Top risk" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Approval qua han" })).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Viec can quyet hom nay" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Du an do vang xanh" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Meeting Snapshot" })).toBeInTheDocument();
    expect(screen.getByText(/Ban tom tat goi y/)).toBeInTheDocument();
    expect(screen.getByText("Visible citation metadata")).toBeInTheDocument();
    expect(screen.getByText("decision: decision-visible-test")).toBeInTheDocument();
    expect(screen.queryByText("OPERATIONS_BRIEFING_SENTINEL")).not.toBeInTheDocument();
  });

  it("renders morning briefing empty and no-permission states without finance leakage", async () => {
    const data = await buildCommandCenterData();
    const briefing = data.executiveMorningBriefing;

    if (!briefing) {
      throw new Error("Expected executive morning briefing data for leadership user");
    }

    data.executiveMorningBriefing = {
      ...briefing,
      decisionsToday: [],
      overdueApprovals: [
        {
          amount: 9999000000,
          amountLabel: "9,999,000,000 VND",
          financialAccess: "no_permission",
          id: "hidden-finance-approval",
          sourceId: "hidden-finance-approval",
          sourceType: "leadership_approval",
          status: "overdue",
          title: "Hidden finance approval",
          tone: "red",
        },
      ],
      permissions: {
        ...briefing.permissions,
        canDrillDown: false,
        canViewFinance: false,
      },
      projectHealth: {
        ...briefing.projectHealth,
        green: 0,
        items: [],
        red: 0,
        total: 0,
        yellow: 0,
      },
      summary: {
        citations: [],
        generatedFrom: [],
        status: "insufficient_context",
        text: "Khong co du lieu trong scope hoac khong co quyen xem du lieu de tao Morning Briefing.",
        updatedAt: briefing.generatedAt,
      },
      topRisks: [],
    };

    renderDashboard(data, "executive-morning-briefing");

    expect(screen.getByText("Khong co du lieu trong scope")).toBeInTheDocument();
    expect(screen.getByText("Khong co quyen drill-down trong scope hien tai.")).toBeInTheDocument();
    expect(screen.getByText("Khong co quyen xem tai chinh trong scope nay.")).toBeInTheDocument();
    expect(screen.getByText("Khong co risk trong scope hien tai.")).toBeInTheDocument();
    expect(screen.queryByText("9,999,000,000 VND")).not.toBeInTheDocument();
  });

  it("renders the executive common center view from scoped DTO data", async () => {
    const data = await buildCommandCenterData();

    data.operationsDashboard.tasksDueThisWeek = [
      {
        assigneeId: "operations-assignee",
        createdAt: "2026-05-20T00:00:00.000Z",
        description: "Operations-only common center sentinel",
        dueDate: "2026-05-24",
        id: "operations-common-sentinel",
        priority: "medium",
        projectId: "demo-project-riverside",
        status: "todo",
        title: "OPERATIONS_COMMON_SENTINEL",
        updatedAt: "2026-05-20T00:00:00.000Z",
      },
    ];

    renderDashboard(data, "executive-common-center");

    expect(
      screen.getByRole("heading", { name: "Executive Common Center" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Executive Common Center" }),
    ).toBeVisible();
    expect(screen.getByRole("region", { name: "KPI chung" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Priority area" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Thong bao moi" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Quyet dinh moi" })).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Lich hop va su kien" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Risk tong" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Chien luoc" })).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Deadline vuot nguong qua han" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("OPERATIONS_COMMON_SENTINEL")).not.toBeInTheDocument();
  });

  it("renders system deadlines even when there are no threshold breaches", async () => {
    const data = await buildCommandCenterData();
    const commonCenter = data.executiveCommonCenter;

    if (!commonCenter) {
      throw new Error("Expected executive common center data for leadership user");
    }

    data.executiveCommonCenter = {
      ...commonCenter,
      systemDeadlines: [
        {
          deadline: "2026-05-24",
          id: "system-only-deadline",
          reason: "System deadline sentinel",
          sourceId: "system-only-deadline",
          sourceType: "executive_action",
          status: "due_today",
          title: "SYSTEM_DEADLINE_SENTINEL",
          tone: "purple",
        },
      ],
      thresholdBreaches: [],
    };

    renderDashboard(data, "executive-common-center");

    expect(screen.getByText("SYSTEM_DEADLINE_SENTINEL")).toBeInTheDocument();
  });

  it("renders common center no-access state when DTO is missing", async () => {
    const data = await buildCommandCenterData();

    data.executiveCommonCenter = null;

    renderDashboard(data, "executive-common-center");

    expect(
      screen.getByRole("heading", { name: "Khong co quyen xem Executive Common Center" }),
    ).toBeInTheDocument();
  });

  it("renders the executive private workspace view from scoped DTO data", async () => {
    const data = await buildCommandCenterData();

    data.operationsDashboard.tasksDueThisWeek = [
      {
        assigneeId: "operations-assignee",
        createdAt: "2026-05-20T00:00:00.000Z",
        description: "Operations-only private workspace sentinel",
        dueDate: "2026-05-24",
        id: "operations-private-sentinel",
        priority: "medium",
        projectId: "demo-project-riverside",
        status: "todo",
        title: "OPERATIONS_PRIVATE_WORKSPACE_SENTINEL",
        updatedAt: "2026-05-20T00:00:00.000Z",
      },
    ];

    renderDashboard(data, "executive-private-workspace");

    expect(
      screen.getByRole("heading", { name: "Private Workspace" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Private Workspace" }),
    ).toBeVisible();
    expect(screen.getByRole("region", { name: "KPI theo role" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Priority area" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Assigned portfolio" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Approval queue" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Escalation risk" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Assistant support" })).toBeInTheDocument();
    expect(screen.queryByText("OPERATIONS_PRIVATE_WORKSPACE_SENTINEL")).not.toBeInTheDocument();
  });

  it("renders private workspace read-only and no-permission states without finance leakage", async () => {
    const data = await buildCommandCenterData();
    const privateWorkspace = data.executivePrivateWorkspace;

    if (!privateWorkspace) {
      throw new Error("Expected executive private workspace data for leadership user");
    }

    data.executivePrivateWorkspace = {
      ...privateWorkspace,
      approvalItems: privateWorkspace.approvalItems.map((item, index) =>
        index === 0
          ? {
              ...item,
              amount: 9999000000,
              amountLabel: "9,999,000,000 VND",
              financialAccess: "no_permission",
            }
          : item,
      ),
      permissions: {
        ...privateWorkspace.permissions,
        canDrillDown: false,
        canViewFinance: false,
        mutationMode: "read_only",
      },
      priorityItems: privateWorkspace.priorityItems.map((item) => ({
        ...item,
        readOnlyReason: "Read-only trong scope hien tai.",
      })),
      variant: "viewer",
    };

    renderDashboard(data, "executive-private-workspace");

    expect(screen.getByText("Khong co quyen xem tai chinh trong scope nay.")).toBeInTheDocument();
    expect(screen.getByText("Read-only: khong co mutation action trong workspace nay.")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Read-only summary" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Assistant support" })).not.toBeInTheDocument();
    expect(screen.queryByText("9,999,000,000 VND")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Chi tiet nguon dieu hanh" })).not.toBeInTheDocument();
  });

  it("renders secretary briefing desk groups separately", async () => {
    const data = await buildCommandCenterData();
    const privateWorkspace = data.executivePrivateWorkspace;

    if (!privateWorkspace) {
      throw new Error("Expected executive private workspace data for leadership user");
    }

    data.executivePrivateWorkspace = {
      ...privateWorkspace,
      assistantSupport: {
        ...privateWorkspace.assistantSupport,
        allowedActions: [
          {
            actionKey: "proposal.create",
            delegationId: "delegation-active-riverside",
            enabled: true,
            id: "delegation-active-riverside:proposal.create",
            label: "Tao de xuat thay lanh dao",
            principalUserId: "ceo-01",
            reason: "Delegation active va match scope.",
          },
        ],
        delegations: [
          {
            actionKeys: ["proposal.create"],
            canActOnBehalf: true,
            delegationId: "delegation-active-riverside",
            principalUserId: "ceo-01",
            reason: "Delegation active va match scope.",
            scope: { projectId: "demo-project-riverside" },
          },
        ],
        meetingDocuments: privateWorkspace.meetingItems,
        pendingApprovals: privateWorkspace.approvalItems,
        reminders: privateWorkspace.deadlineItems,
        scheduleItems: privateWorkspace.meetingItems,
        submissionDossiers: privateWorkspace.approvalItems,
        supportTasks: privateWorkspace.deadlineItems,
      },
      permissions: {
        ...privateWorkspace.permissions,
        mutationMode: "delegated_only",
      },
      variant: "secretary_assistant",
    };

    renderDashboard(data, "executive-private-workspace");

    expect(screen.getByRole("region", { name: "Lich lanh dao" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Ho so trinh" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Tai lieu hop" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Reminder" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Approval uy quyen" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Support tasks" })).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Secretary delegation support" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tao de xuat thay lanh dao")).toBeInTheDocument();
  });

  it("renders private workspace no-access state when DTO is missing", async () => {
    const data = await buildCommandCenterData();

    data.executivePrivateWorkspace = null;

    renderDashboard(data, "executive-private-workspace");

    expect(
      screen.getByRole("heading", { name: "Khong co quyen xem Private Workspace" }),
    ).toBeInTheDocument();
  });

  it("preserves direct executive common center URL when selected scope is invalid", async () => {
    const data = await getCommandCenterData(
      { id: executiveUser.id, role: executiveUser.role },
      {
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [],
        selectedScopeId: "missing-scope",
      },
    );

    renderDashboard(data, "executive-common-center");

    expect(
      screen.getByRole("heading", { name: "Khong co quyen xem Executive Common Center" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Xin chao/)).not.toBeInTheDocument();
  });

  it("falls back to overview for unknown executive view keys", async () => {
    const data = await buildCommandCenterData();

    renderDashboard(data, "executive-not-real");

    expect(screen.getByText(/Xin ch/)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Private Workspace" }),
    ).not.toBeInTheDocument();
  });

  it("renders the executive dashboard from ExecutiveDashboardData instead of operations data", async () => {
    const data = await buildCommandCenterData();

    data.operationsDashboard.tasksDueThisWeek = [
      {
        assigneeId: "operations-assignee",
        createdAt: "2026-05-20T00:00:00.000Z",
        description: "Operations-only micro task description",
        dueDate: "2026-05-24",
        id: "operations-micro-task",
        priority: "medium",
        projectId: "demo-project-riverside",
        status: "todo",
        title: "OPERATIONS_MICRO_TASK_SENTINEL",
        updatedAt: "2026-05-20T00:00:00.000Z",
      },
    ];

    renderDashboard(data);

    expect(
      screen.getByRole("heading", { name: "Dashboard Tong Quan" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "KPI Strip" })).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Priority Queue" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Risk Summary" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Deadline hom nay" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Quyet dinh moi" }),
    ).toBeInTheDocument();

    const kpiRegion = screen.getByRole("region", { name: "KPI Strip" });

    for (const kpi of data.executiveDashboard?.kpis ?? []) {
      expect(within(kpiRegion).getAllByText(kpi.label).length).toBeGreaterThan(0);
    }

    const approval = data.executiveDashboard?.approvalSummary.items[0];
    const risk = data.executiveDashboard?.riskSummary.items[0];
    const deadline = data.executiveDashboard?.todayDeadlines.items[0];
    const decision = data.executiveDashboard?.recentDecisions.items[0];

    if (approval) {
      expect(screen.getAllByText(approval.title).length).toBeGreaterThan(0);
    }

    if (risk) {
      expect(screen.getAllByText(risk.title).length).toBeGreaterThan(0);
    }

    if (deadline) {
      expect(screen.getAllByText(deadline.title).length).toBeGreaterThan(0);
    }

    if (decision) {
      expect(screen.getAllByText(decision.title).length).toBeGreaterThan(0);
    }

    expect(screen.queryByText("OPERATIONS_MICRO_TASK_SENTINEL")).not.toBeInTheDocument();
  });

  it("does not expose finance amounts when the DTO says no_permission", async () => {
    const data = await buildCommandCenterData();
    const executiveDashboard = data.executiveDashboard;

    if (!executiveDashboard) {
      throw new Error("Expected executive dashboard data for leadership user");
    }

    data.executiveDashboard = {
      ...executiveDashboard,
      approvalSummary: {
        ...executiveDashboard.approvalSummary,
        items: executiveDashboard.approvalSummary.items.map((item, index) =>
          index === 0
            ? {
                ...item,
                amount: 9999000000,
                amountLabel: "9,999,000,000 VND",
                financialAccess: "no_permission",
              }
            : item,
        ),
      },
      financialSummary: {
        reason: "Test user cannot view finance in this scope.",
        state: "no_permission",
      },
    };

    renderDashboard(data);

    const financeRegion = screen.getByRole("region", { name: "Tai chinh" });

    expect(within(financeRegion).getByText("Tai chinh han che quyen")).toBeInTheDocument();
    expect(
      within(financeRegion).getByText("Test user cannot view finance in this scope."),
    ).toBeInTheDocument();
    expect(screen.queryByText("9,999,000,000 VND")).not.toBeInTheDocument();
  });

  it("opens a read-only drill-down panel with accessible source metadata", async () => {
    const data = await buildCommandCenterData();
    const selectedItem = data.executiveDashboard?.approvalSummary.items[0];

    if (!selectedItem) {
      throw new Error("Expected at least one approval item");
    }

    renderDashboard(data);

    const openButton = screen.getAllByRole("button", {
      name: `Xem chi tiet ${selectedItem.title}`,
    })[0];

    fireEvent.click(openButton);

    const panel = screen.getByRole("dialog", {
      name: "Chi tiet nguon dieu hanh",
    });

    expect(within(panel).getByRole("heading", { name: selectedItem.title })).toBeInTheDocument();
    expect(within(panel).getByText(selectedItem.sourceType)).toBeInTheDocument();
    expect(within(panel).getByText(selectedItem.sourceId)).toBeInTheDocument();
    expect(within(panel).getByText(selectedItem.status)).toBeInTheDocument();

    const closeButton = within(panel).getByRole("button", {
      name: "Dong panel chi tiet",
    });
    await waitFor(() => expect(closeButton).toHaveFocus());
  });

  it("renders enriched drill-down metadata, linked records, actions and timeline", async () => {
    const data = await buildCommandCenterData();
    const executiveDashboard = data.executiveDashboard;
    const selectedItem = executiveDashboard?.approvalSummary.items[0];

    if (!executiveDashboard || !selectedItem) {
      throw new Error("Expected executive dashboard data with approval item");
    }

    data.executiveDashboard = {
      ...executiveDashboard,
      approvalSummary: {
        ...executiveDashboard.approvalSummary,
        items: [
          {
            ...selectedItem,
            auditTrail: [
              {
                action: "AUDIT_SENTINEL",
                actor: "mock-founder",
                id: "audit-sentinel",
                reason: "Audit reason sentinel",
                timestamp: "2026-05-25T00:00:00.000Z",
              },
            ],
            availableActions: [
              {
                enabled: true,
                href: "/proposals/drilldown-source",
                id: "open-source",
                label: "Mo nguon",
              },
              {
                enabled: false,
                id: "blocked-action",
                label: "Duyet",
                reason: "ACTION_DENIED_SENTINEL",
              },
              {
                enabled: true,
                href: "/meetings/action-target",
                id: "action-link",
                label: "ACTION_LINK_SENTINEL",
              },
            ],
            href: "/proposals/drilldown-source",
            linkedRecords: [
              {
                href: "/projects/demo-project-riverside",
                id: "linked-project",
                permissionState: "allowed",
                status: "active",
                title: "LINKED_RECORD_SENTINEL",
                type: "project",
              },
            ],
            scopeLabel: "SCOPE_DETAIL_SENTINEL",
            timeline: [
              {
                actor: "mock-founder",
                id: "timeline-sentinel",
                label: "TIMELINE_SENTINEL",
                status: "pending",
                timestamp: "2026-05-25T00:00:00.000Z",
              },
            ],
          },
          ...executiveDashboard.approvalSummary.items.slice(1),
        ],
      },
    };

    renderDashboard(data);

    fireEvent.click(
      screen.getAllByRole("button", {
        name: `Xem chi tiet ${selectedItem.title}`,
      })[0],
    );

    const panel = screen.getByRole("dialog", {
      name: "Chi tiet nguon dieu hanh",
    });

    expect(within(panel).getByText("SCOPE_DETAIL_SENTINEL")).toBeInTheDocument();
    expect(within(panel).getByText("LINKED_RECORD_SENTINEL")).toBeInTheDocument();
    expect(within(panel).getByText("ACTION_DENIED_SENTINEL")).toBeInTheDocument();
    expect(within(panel).getByText("TIMELINE_SENTINEL")).toBeInTheDocument();
    expect(within(panel).getByText("AUDIT_SENTINEL")).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: "Mo nguon" })).toHaveAttribute(
      "href",
      "/proposals/drilldown-source",
    );
    expect(within(panel).getByRole("link", { name: "Mo record LINKED_RECORD_SENTINEL" })).toHaveAttribute(
      "href",
      "/projects/demo-project-riverside",
    );
    expect(within(panel).getByRole("link", { name: "Thuc hien ACTION_LINK_SENTINEL" })).toHaveAttribute(
      "href",
      "/meetings/action-target",
    );
  });

  it("does not open drill-down when the DTO denies drill-down permission", async () => {
    const data = await buildCommandCenterData();
    const executiveDashboard = data.executiveDashboard;
    const selectedItem = executiveDashboard?.approvalSummary.items[0];

    if (!executiveDashboard || !selectedItem) {
      throw new Error("Expected executive dashboard data with approval item");
    }

    data.executiveDashboard = {
      ...executiveDashboard,
      permissions: {
        ...executiveDashboard.permissions,
        canDrillDown: false,
      },
    };

    renderDashboard(data);

    expect(
      screen.getByText("Khong co quyen drill-down nguon dieu hanh trong scope hien tai."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: `Xem chi tiet ${selectedItem.title}` }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Chi tiet nguon dieu hanh" }),
    ).not.toBeInTheDocument();
  });

  it("shows no-permission empty states separately from no-data states", async () => {
    const data = await buildCommandCenterData();
    const executiveDashboard = data.executiveDashboard;

    if (!executiveDashboard) {
      throw new Error("Expected executive dashboard data for leadership user");
    }

    data.executiveDashboard = {
      ...executiveDashboard,
      approvalSummary: {
        ...executiveDashboard.approvalSummary,
        items: [],
      },
      meetingSnapshot: {
        ...executiveDashboard.meetingSnapshot,
        items: [],
      },
      permissions: {
        ...executiveDashboard.permissions,
        canDrillDown: false,
        canViewDecisions: false,
        canViewMeetings: false,
        canViewProjects: false,
        canViewProposals: false,
        canViewRisk: false,
      },
      recentDecisions: {
        ...executiveDashboard.recentDecisions,
        items: [],
      },
      riskSummary: {
        ...executiveDashboard.riskSummary,
        byCategory: {},
        items: [],
      },
      todayDeadlines: {
        ...executiveDashboard.todayDeadlines,
        items: [],
      },
    };

    renderDashboard(data);

    expect(
      screen.getByText("Khong co quyen xem item uu tien trong scope hien tai."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Khong co quyen xem deadline trong scope hien tai."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Khong co quyen xem quyet dinh trong scope hien tai."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Khong co quyen xem lich hop trong scope hien tai."),
    ).toBeInTheDocument();
    expect(screen.getByText("Khong co quyen xem risk trong scope hien tai.")).toBeInTheDocument();
  });

  it("keeps priority queue unique and labels risk/deadline priority accurately", async () => {
    const data = await buildCommandCenterData();
    const executiveDashboard = data.executiveDashboard;
    const approval = executiveDashboard?.approvalSummary.items[0];

    if (!executiveDashboard || !approval) {
      throw new Error("Expected executive dashboard data with approval item");
    }

    const duplicateSource = {
      ...approval,
      id: "duplicate-approval",
      reason: "Duplicate source sentinel",
      sourceId: "shared-source-id",
      sourceType: "leadership_approval" as const,
      title: "DUPLICATE_SOURCE_SENTINEL",
    };
    const mediumRisk = {
      ...approval,
      id: "medium-risk",
      reason: "Medium risk sentinel",
      severity: "medium" as const,
      sourceId: "medium-risk-source",
      sourceType: "risk" as const,
      title: "MEDIUM_RISK_SENTINEL",
    };
    const overdueDeadline = {
      ...approval,
      id: "overdue-deadline",
      reason: "Overdue deadline sentinel",
      sourceId: "overdue-deadline-source",
      sourceType: "executive_action" as const,
      title: "OVERDUE_DEADLINE_SENTINEL",
      tone: "red" as const,
    };

    data.executiveDashboard = {
      ...executiveDashboard,
      approvalSummary: {
        ...executiveDashboard.approvalSummary,
        items: [duplicateSource],
      },
      recentDecisions: {
        ...executiveDashboard.recentDecisions,
        items: [],
      },
      riskSummary: {
        ...executiveDashboard.riskSummary,
        byCategory: {},
        items: [
          {
            ...mediumRisk,
            category: "Schedule",
          },
          {
            ...duplicateSource,
            category: "Finance",
            id: "duplicate-risk",
            severity: "high" as const,
          },
        ],
      },
      todayDeadlines: {
        ...executiveDashboard.todayDeadlines,
        items: [duplicateSource, overdueDeadline],
      },
    };

    renderDashboard(data);

    const priorityQueue = screen.getByRole("region", { name: "Priority Queue" });

    expect(
      within(priorityQueue).getAllByText("DUPLICATE_SOURCE_SENTINEL"),
    ).toHaveLength(1);
    expect(within(priorityQueue).getByText("Medium")).toBeInTheDocument();
    expect(within(priorityQueue).getByText("Qua han")).toBeInTheDocument();
  });

  it("keeps unsafe drill-down hrefs read-only and closes with Escape", async () => {
    const data = await buildCommandCenterData();
    const executiveDashboard = data.executiveDashboard;
    const selectedItem = executiveDashboard?.approvalSummary.items[0];

    if (!executiveDashboard || !selectedItem) {
      throw new Error("Expected executive dashboard data with approval item");
    }

    data.executiveDashboard = {
      ...executiveDashboard,
      approvalSummary: {
        ...executiveDashboard.approvalSummary,
        items: [
          {
            ...selectedItem,
            href: "https://example.test/unsafe",
          },
          ...executiveDashboard.approvalSummary.items.slice(1),
        ],
      },
    };

    renderDashboard(data);

    const openButton = screen.getAllByRole("button", {
      name: `Xem chi tiet ${selectedItem.title}`,
    })[0];

    openButton.focus();
    fireEvent.click(openButton);

    const panel = screen.getByRole("dialog", {
      name: "Chi tiet nguon dieu hanh",
    });
    const closeButton = within(panel).getByRole("button", {
      name: "Dong panel chi tiet",
    });

    await waitFor(() => expect(closeButton).toHaveFocus());
    expect(within(panel).queryByRole("link", { name: "Mo nguon" })).not.toBeInTheDocument();

    fireEvent.keyDown(panel, { key: "Escape" });

    expect(
      screen.queryByRole("dialog", { name: "Chi tiet nguon dieu hanh" }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(openButton).toHaveFocus());
  });

  it("renders approval center axis tabs as a read-only scoped queue", async () => {
    const data = await buildCommandCenterData();

    if (!data.approvalCenter) {
      throw new Error("Expected approval center data for leadership user");
    }

    const firstItem = data.approvalCenter.tabs[0]?.items[0];

    if (!firstItem) {
      throw new Error("Expected approval center queue item for leadership user");
    }

    data.approvalCenter = {
      ...data.approvalCenter,
      tabs: data.approvalCenter.tabs.map((tab) =>
        tab.key === "axis_1"
          ? {
              ...tab,
              items: [
                {
                  ...firstItem,
                  amountLabel: "9,999,000,000 VND",
                  escalation: {
                    policyLabel: "Policy queue sentinel",
                    reason: "Qua han 4 ngay theo Policy queue sentinel.",
                    required: true,
                    status: "queued",
                    targets: [
                      {
                        kind: "delegate",
                        label: "assistant-queue",
                        scopeMatched: true,
                        userId: "assistant-queue",
                      },
                    ],
                    thresholdDays: 3,
                    trigger: "long_overdue",
                  },
                  financialAccess: "no_permission",
                  href: "/proposals/approval-center-test",
                  ownerName: "record-owner-queue",
                  overdue: {
                    daysOverdue: 4,
                    isOverdue: true,
                    nextAction: "Kiem tra escalation queue va nang cap theo policy.",
                    ownerLabel: "owner-queue",
                    reason: "Qua han 4 ngay theo Policy queue sentinel.",
                    severity: "critical",
                  },
                  policyLabel: "Policy queue sentinel",
                  reviewerLabel: "reviewer-queue",
                  riskLevel: "critical",
                },
                ...tab.items.slice(1),
              ],
            }
          : tab,
      ),
    };

    renderDashboard(data, "executive-approvals");

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Approval Center" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Truc 1/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("region", { name: "Approval queue Truc 1" })).toBeInTheDocument();
    expect(screen.getAllByText("Ho so / Van ban").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tai chinh / Chi").length).toBeGreaterThan(0);
    expect(screen.getAllByText("critical").length).toBeGreaterThan(0);
    expect(screen.getByText("Owner: record-owner-queue")).toBeInTheDocument();
    expect(screen.getByText("Approver: reviewer-queue")).toBeInTheDocument();
    expect(screen.getByText("Risk: critical")).toBeInTheDocument();
    expect(screen.getByText("Policy: Policy queue sentinel")).toBeInTheDocument();
    expect(screen.getByText("Tai chinh han che quyen")).toBeInTheDocument();
    expect(screen.queryByText("9,999,000,000 VND")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: `Mo chi tiet ${firstItem.title}` }),
    ).toHaveAttribute("href", "/proposals/approval-center-test");
    expect(
      screen.getAllByText(/Kiem tra escalation queue va nang cap theo policy\./).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Escalation: long_overdue - queued").length).toBeGreaterThan(0);
    expect(screen.getByText("Targets: assistant-queue")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /approve|reject|duyet|tu choi/i })).not.toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("tab", { name: /Truc 1/ }), {
      key: "ArrowRight",
    });

    expect(screen.getByRole("tab", { name: /Truc 2/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: /Truc 2/ })).toHaveFocus();
    expect(screen.getByText("Placeholder MVP")).toBeInTheDocument();
    expect(screen.getByText(/Chua co flow chi tiet cho Truc 2/)).toBeInTheDocument();
  });
});
