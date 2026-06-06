import { describe, expect, it } from "vitest";

import type { PermissionUser } from "@/lib/permissions/can";
import type { ExecutiveDashboardData } from "@/modules/dashboard/types";
import { getExecutiveDashboardData } from "@/modules/dashboard/services/executive-dashboard-service";
import { getExecutivePrivateWorkspaceData } from "@/modules/workspaces/services/executive-private-workspace-service";
import { createDefaultRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-repository";
import type { LeadershipDelegation, ScopeAssignment } from "@/modules/settings/types";

const today = new Date("2026-05-24T00:00:00.000Z");
const rolePermissionCatalog = createDefaultRolePermissionCatalog();

function assignment(input: Partial<ScopeAssignment> & Pick<ScopeAssignment, "id" | "roleKey" | "userId">): ScopeAssignment {
  return {
    active: true,
    createdAt: "2026-05-20T00:00:00.000Z",
    permissionKeys: ["project.view", "task.view", "document.view", "meeting.view", "proposal.view"],
    scopeType: "scoped",
    updatedAt: "2026-05-20T00:00:00.000Z",
    ...input,
  };
}

function delegation(input: Partial<LeadershipDelegation> & Pick<LeadershipDelegation, "id">): LeadershipDelegation {
  return {
    actionKeys: ["proposal.create"],
    active: true,
    createdAt: "2026-05-20T00:00:00.000Z",
    delegateUserId: "assistant-01",
    principalUserId: "ceo-01",
    projectId: "demo-project-riverside",
    moduleId: "proposal",
    startsAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-20T00:00:00.000Z",
    ...input,
  };
}

function fixtureRiskStatus(status: "green" | "yellow" | "red", labelVi: string) {
  return {
    confirmationState: "suggested" as const,
    generatedAt: "2026-05-24T00:00:00.000Z",
    labelVi,
    reason: `Fixture risk status ${status}`,
    sourceData: [],
    status,
  };
}

async function buildDashboardPatch(): Promise<ExecutiveDashboardData> {
  const dashboard = await getExecutiveDashboardData(
    { id: "ceo-01", role: "tong_giam_doc" },
    {
      today,
      rolePermissionCatalog,
      scopeAssignments: [],
      requireScopeAssignments: false,
    },
  );
  const base = dashboard.approvalSummary.items[0];

  if (!base) {
    throw new Error("Expected approval item fixture");
  }

  return {
    ...dashboard,
    approvalSummary: {
      ...dashboard.approvalSummary,
      items: [
        {
          ...base,
          id: "duplicate-approval-low",
          priority: "medium",
          sourceId: "shared-source",
          sourceType: "executive_action",
          title: "Duplicate approval lower priority",
          tone: "amber",
        },
      ],
    },
    riskSummary: {
      ...dashboard.riskSummary,
      items: [
        {
          ...base,
          category: "schedule",
          categoryKey: "schedule",
          categoryLabel: "Tiến độ",
          id: "duplicate-risk-high",
          impact: "critical",
          impactLabel: "Nghiem trong",
          likelihood: "high",
          likelihoodLabel: "Kha nang cao",
          matrixCellLabel: "Kha nang cao x Nghiem trong",
          nextAction: "Review duplicate risk priority",
          severity: "critical",
          severityLabel: "Nghiêm trọng",
          sourceId: "shared-source",
          sourceType: "executive_action",
          statusSuggestion: fixtureRiskStatus("red", "Đỏ"),
          title: "Duplicate risk higher priority",
          tone: "red",
        },
      ],
    },
    todayDeadlines: {
      ...dashboard.todayDeadlines,
      items: [
        {
          ...base,
          id: "deadline-overdue",
          sourceId: "deadline-overdue",
          sourceType: "executive_action",
          title: "Overdue deadline first",
          tone: "red",
        },
      ],
    },
  };
}

describe("executive private workspace service", () => {
  it("builds a role and scope aware DTO from existing executive dashboard data", async () => {
    const workspace = await getExecutivePrivateWorkspaceData(
      { id: "ceo-01", role: "tong_giam_doc" },
      {
        today,
        rolePermissionCatalog,
        scopeAssignments: [],
        requireScopeAssignments: false,
      },
    );

    expect(workspace).toMatchObject({
      variant: "ceo",
      permissions: expect.objectContaining({
        canViewProjects: true,
        canViewProposals: true,
        canCreateProposal: true,
        canOverrideRisk: true,
        canCloseRisk: true,
        canCloseHighRisk: true,
        mutationMode: "allowed",
      }),
      scope: expect.objectContaining({ selectedScopeId: "all", operatingRole: "CEO" }),
    });
    expect(workspace?.kpis.length).toBeGreaterThan(0);
    expect(workspace?.priorityItems.length).toBeGreaterThan(0);
    expect(workspace?.assignedProjects.length).toBeGreaterThan(0);
    expect(workspace?.aiSummary).toMatchObject({
      status: "placeholder",
      actionProposals: [],
    });
    expect(workspace?.aiSummary.citations.length).toBeGreaterThan(0);
    expect(workspace?.priorityItems[0]).toMatchObject({
      groupLabel: expect.any(String),
      priorityLabel: expect.any(String),
      sourceId: expect.any(String),
      sourceType: expect.any(String),
    });
  });

  it("returns different project data for two users with different assignments", async () => {
    const scopeAssignments = [
      assignment({
        id: "scope-ceo-company-axis1",
        roleKey: "tong_giam_doc",
        userId: "ceo-01",
        axisId: "axis-1",
        permissionKeys: ["project.view", "proposal.view", "meeting.view", "finance.view"],
      }),
      assignment({
        id: "scope-director-riverside",
        roleKey: "giam_doc_du_an",
        userId: "project-director-01",
        projectId: "demo-project-riverside",
        axisId: "axis-1",
        permissionKeys: ["project.view", "proposal.view", "meeting.view", "finance.view"],
      }),
    ];
    const ceo = await getExecutivePrivateWorkspaceData(
      { id: "ceo-01", role: "tong_giam_doc" },
      {
        today,
        rolePermissionCatalog,
        scopeAssignments,
        selectedScopeId: "scope-ceo-company-axis1",
      },
    );
    const director = await getExecutivePrivateWorkspaceData(
      { id: "project-director-01", role: "giam_doc_du_an" },
      {
        today,
        rolePermissionCatalog,
        scopeAssignments,
        selectedScopeId: "scope-director-riverside",
      },
    );

    expect(ceo?.variant).toBe("ceo");
    expect(director?.variant).toBe("project_director");
    expect(director?.assignedProjects.map((item) => item.projectId)).toEqual([
      "demo-project-riverside",
    ]);
    expect(ceo?.assignedProjects.map((item) => item.projectId)).not.toEqual(
      director?.assignedProjects.map((item) => item.projectId),
    );
  });

  it("returns invalid-scope empty state instead of falling back to global data", async () => {
    const workspace = await getExecutivePrivateWorkspaceData(
      { id: "ceo-01", role: "tong_giam_doc" },
      {
        today,
        rolePermissionCatalog,
        scopeAssignments: [],
        selectedScopeId: "missing-scope",
      },
    );

    expect(workspace).toMatchObject({
      emptyState: expect.objectContaining({ kind: "invalid_scope" }),
      permissions: expect.objectContaining({
        canCreateMeeting: false,
        canCreateProposal: false,
        mutationMode: "none",
      }),
      sourceCounts: expect.objectContaining({ projects: 0, meetings: 0 }),
      aiSummary: expect.objectContaining({
        citations: [],
        status: "insufficient_context",
      }),
    });
    expect(workspace?.assignedProjects).toEqual([]);
    expect(workspace?.priorityItems).toEqual([]);
  });

  it("sorts priority items and dedupes by source type and id", async () => {
    const dashboardData = await buildDashboardPatch();
    const workspace = await getExecutivePrivateWorkspaceData(
      { id: "ceo-01", role: "tong_giam_doc" },
      {
        dashboardData,
        today,
        rolePermissionCatalog,
        scopeAssignments: [],
        requireScopeAssignments: false,
      },
    );

    const duplicateItems = workspace?.priorityItems.filter(
      (item) => item.sourceId === "shared-source",
    );

    expect(workspace?.priorityItems[0]).toMatchObject({
      priorityLabel: "Nghiêm trọng",
      title: "Duplicate risk higher priority",
    });
    expect(duplicateItems).toHaveLength(1);
  });

  it("limits assistant data and on-behalf actions to active delegated scope", async () => {
    const assistantUser: PermissionUser = {
      id: "assistant-01",
      permissions: ["project.view", "task.view", "document.view", "meeting.view"],
      permissionsMode: "replace",
      role: "thu_ky_tro_ly",
    };
    const workspace = await getExecutivePrivateWorkspaceData(assistantUser, {
      delegations: [
        delegation({ id: "delegation-active-riverside" }),
        delegation({
          id: "delegation-expired-garden",
          projectId: "demo-project-garden",
          endsAt: "2026-03-31T23:59:59.000Z",
        }),
      ],
      rolePermissionCatalog,
      scopeAssignments: [
        assignment({
          id: "scope-assistant-riverside",
          roleKey: "thu_ky_tro_ly",
          userId: "assistant-01",
          projectId: "demo-project-riverside",
          permissionKeys: ["project.view", "task.view", "document.view", "meeting.view"],
        }),
      ],
      selectedScopeId: "scope-assistant-riverside",
      today,
    });

    expect(workspace).toMatchObject({
      variant: "secretary_assistant",
      permissions: expect.objectContaining({ mutationMode: "delegated_only" }),
    });
    expect(workspace?.assignedProjects.map((item) => item.projectId)).toEqual([
      "demo-project-riverside",
    ]);
    expect(workspace?.assistantSupport.delegations).toEqual([
      expect.objectContaining({
        canActOnBehalf: true,
        delegationId: "delegation-active-riverside",
        principalUserId: "ceo-01",
      }),
      expect.objectContaining({
        canActOnBehalf: false,
        delegationId: "delegation-expired-garden",
        reason: "Delegation da het hieu luc.",
      }),
    ]);
    expect(workspace?.assistantSupport.allowedActions).toEqual([
      expect.objectContaining({
        actionKey: "proposal.create",
        delegationId: "delegation-active-riverside",
        enabled: true,
      }),
    ]);
    expect(
      workspace?.assistantSupport.allowedActions.some((action) =>
        ["proposal.approve", "proposal.reject", "proposal.request_change"].includes(
          action.actionKey,
        ),
      ),
    ).toBe(false);
  });

  it("does not apply injected delegations for another delegate user", async () => {
    const workspace = await getExecutivePrivateWorkspaceData(
      {
        id: "assistant-01",
        permissions: ["project.view", "meeting.view"],
        permissionsMode: "replace",
        role: "thu_ky_tro_ly",
      },
      {
        delegations: [
          delegation({
            delegateUserId: "assistant-02",
            id: "delegation-for-another-assistant",
          }),
        ],
        rolePermissionCatalog,
        scopeAssignments: [
          assignment({
            id: "scope-assistant-riverside",
            roleKey: "thu_ky_tro_ly",
            userId: "assistant-01",
            projectId: "demo-project-riverside",
          }),
        ],
        selectedScopeId: "scope-assistant-riverside",
        today,
      },
    );

    expect(workspace?.assistantSupport.allowedActions).toEqual([]);
    expect(workspace?.assistantSupport.delegations).toEqual([]);
  });

  it("requires delegated actions to exist in the permission catalog", async () => {
    const catalogWithoutCreate = {
      ...rolePermissionCatalog,
      permissions: rolePermissionCatalog.permissions.filter(
        (permission) => permission.key !== "proposal.create",
      ),
    };
    const workspace = await getExecutivePrivateWorkspaceData(
      {
        id: "assistant-01",
        permissions: ["project.view", "meeting.view"],
        permissionsMode: "replace",
        role: "thu_ky_tro_ly",
      },
      {
        delegations: [delegation({ id: "delegation-with-missing-catalog-action" })],
        rolePermissionCatalog: catalogWithoutCreate,
        scopeAssignments: [
          assignment({
            id: "scope-assistant-riverside",
            roleKey: "thu_ky_tro_ly",
            userId: "assistant-01",
            projectId: "demo-project-riverside",
          }),
        ],
        selectedScopeId: "scope-assistant-riverside",
        today,
      },
    );

    expect(workspace?.assistantSupport.allowedActions).toEqual([]);
    expect(workspace?.assistantSupport.delegations).toEqual([
      expect.objectContaining({
        actionKeys: [],
        canActOnBehalf: false,
        reason: "Khong co action delegatable trong permission catalog hien tai.",
      }),
    ]);
  });

  it("does not serialize denied delegation action keys in assistant summaries", async () => {
    const workspace = await getExecutivePrivateWorkspaceData(
      {
        id: "assistant-01",
        permissions: ["project.view", "meeting.view"],
        permissionsMode: "replace",
        role: "thu_ky_tro_ly",
      },
      {
        delegations: [
          delegation({
            actionKeys: ["proposal.create", "proposal.approve"],
            id: "delegation-with-denied-approval-action",
          }),
        ],
        rolePermissionCatalog,
        scopeAssignments: [
          assignment({
            id: "scope-assistant-riverside",
            roleKey: "thu_ky_tro_ly",
            userId: "assistant-01",
            projectId: "demo-project-riverside",
          }),
        ],
        selectedScopeId: "scope-assistant-riverside",
        today,
      },
    );

    expect(workspace?.assistantSupport.allowedActions.map((action) => action.actionKey)).toEqual([
      "proposal.create",
    ]);
    expect(workspace?.assistantSupport.delegations[0]?.actionKeys).toEqual([
      "proposal.create",
    ]);
    expect(JSON.stringify(workspace?.assistantSupport)).not.toContain("proposal.approve");
  });

  it("allows delegated risk override but strips sensitive risk close actions", async () => {
    const workspace = await getExecutivePrivateWorkspaceData(
      {
        id: "assistant-01",
        permissions: ["project.view", "meeting.view"],
        permissionsMode: "replace",
        role: "thu_ky_tro_ly",
      },
      {
        delegations: [
          delegation({
            actionKeys: ["risk.override", "risk.close", "risk.close_high"],
            id: "delegation-risk-override-only",
            moduleId: "risk",
          }),
        ],
        rolePermissionCatalog,
        scopeAssignments: [
          assignment({
            id: "scope-assistant-riverside",
            roleKey: "thu_ky_tro_ly",
            userId: "assistant-01",
            projectId: "demo-project-riverside",
          }),
        ],
        selectedScopeId: "scope-assistant-riverside",
        today,
      },
    );

    expect(workspace?.permissions).toMatchObject({
      canOverrideRisk: true,
      canCloseRisk: false,
      canCloseHighRisk: false,
      mutationMode: "delegated_only",
    });
    expect(workspace?.assistantSupport.allowedActions.map((action) => action.actionKey)).toEqual([
      "risk.override",
    ]);
    expect(workspace?.assistantSupport.delegations[0]?.actionKeys).toEqual([
      "risk.override",
    ]);
    expect(JSON.stringify(workspace?.assistantSupport)).not.toContain("risk.close");
  });

  it("keeps active but out-of-scope delegations disabled with a reason", async () => {
    const workspace = await getExecutivePrivateWorkspaceData(
      {
        id: "assistant-01",
        permissions: ["project.view", "meeting.view"],
        permissionsMode: "replace",
        role: "thu_ky_tro_ly",
      },
      {
        delegations: [
          delegation({
            id: "delegation-out-of-scope-garden",
            projectId: "demo-project-garden",
          }),
        ],
        rolePermissionCatalog,
        scopeAssignments: [
          assignment({
            id: "scope-assistant-riverside",
            roleKey: "thu_ky_tro_ly",
            userId: "assistant-01",
            projectId: "demo-project-riverside",
          }),
        ],
        selectedScopeId: "scope-assistant-riverside",
        today,
      },
    );

    expect(workspace?.assistantSupport.allowedActions).toEqual([]);
    expect(workspace?.assistantSupport.delegations).toEqual([
      expect.objectContaining({
        canActOnBehalf: false,
        delegationId: "delegation-out-of-scope-garden",
        reason: "Delegation active nhung ngoai selected scope.",
      }),
    ]);
  });

  it("scores ISO datetime deadlines as due today", async () => {
    const dashboard = await getExecutiveDashboardData(
      { id: "ceo-01", role: "tong_giam_doc" },
      {
        today,
        rolePermissionCatalog,
        scopeAssignments: [],
        requireScopeAssignments: false,
      },
    );
    const base = dashboard.approvalSummary.items[0];

    if (!base) {
      throw new Error("Expected approval item fixture");
    }

    const workspace = await getExecutivePrivateWorkspaceData(
      { id: "ceo-01", role: "tong_giam_doc" },
      {
        dashboardData: {
          ...dashboard,
          approvalSummary: {
            ...dashboard.approvalSummary,
            items: [
              {
                ...base,
                deadline: "2026-06-01",
                id: "approval-later",
                sourceId: "approval-later",
                title: "Later amber approval",
                tone: "amber",
              },
            ],
          },
          meetingSnapshot: {
            ...dashboard.meetingSnapshot,
            items: [
              {
                ...base,
                deadline: "2026-05-24T09:00:00.000Z",
                id: "meeting-due-today",
                sourceId: "meeting-due-today",
                sourceType: "meeting",
                title: "ISO meeting due today",
                tone: "blue",
              },
            ],
          },
          riskSummary: {
            ...dashboard.riskSummary,
            items: [
              {
                ...base,
                category: "operation",
                categoryKey: "operation",
                categoryLabel: "Vận hành / phối hợp",
                id: "low-risk",
                impact: "low",
                impactLabel: "Thap",
                likelihood: "low",
                likelihoodLabel: "Kha nang thap",
                matrixCellLabel: "Kha nang thap x Thap",
                nextAction: "Monitor low risk",
                severity: "low",
                severityLabel: "Thấp",
                sourceId: "low-risk",
                sourceType: "risk",
                statusSuggestion: fixtureRiskStatus("green", "Xanh"),
                title: "Low risk item",
                tone: "blue",
              },
            ],
          },
          todayDeadlines: {
            ...dashboard.todayDeadlines,
            items: [],
          },
        },
        rolePermissionCatalog,
        scopeAssignments: [],
        requireScopeAssignments: false,
        today,
      },
    );

    expect(workspace?.priorityItems[0]).toMatchObject({
      sourceId: "meeting-due-today",
      title: "ISO meeting due today",
    });
  });

  it("keeps viewer workspaces read-only and strips hidden finance fields from serialized DTO", async () => {
    const workspace = await getExecutivePrivateWorkspaceData(
      {
        id: "viewer-01",
        permissions: ["project.view", "meeting.view"],
        permissionsMode: "replace",
        role: "viewer",
      },
      {
        rolePermissionCatalog,
        scopeAssignments: [
          assignment({
            id: "scope-viewer-garden",
            roleKey: "viewer",
            userId: "viewer-01",
            projectId: "demo-project-garden",
            permissionKeys: ["project.view", "meeting.view"],
          }),
        ],
        selectedScopeId: "scope-viewer-garden",
        today,
      },
    );
    const serialized = JSON.stringify(workspace);

    expect(workspace).toMatchObject({
      variant: "viewer",
      permissions: expect.objectContaining({
        canViewFinance: false,
        mutationMode: "read_only",
      }),
    });
    expect(workspace?.assistantSupport.allowedActions).toEqual([]);
    expect(workspace?.aiSummary).toMatchObject({
      status: "unavailable",
      actionProposals: [],
    });
    expect(serialized).not.toContain("amount");
    expect(serialized).not.toContain("cashFlowLabel");
    expect(serialized).not.toContain("budget");
  });
});
