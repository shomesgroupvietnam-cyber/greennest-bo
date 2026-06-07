import { describe, expect, it } from "vitest";

import type { PermissionUser } from "@/lib/permissions/can";
import type { ExecutiveDashboardData } from "@/modules/dashboard/types";
import { getExecutiveDashboardData } from "@/modules/dashboard/services/executive-dashboard-service";
import { getExecutivePrivateWorkspaceData } from "@/modules/workspaces/services/executive-private-workspace-service";
import { createDefaultRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-repository";
import type {
  LeadershipDelegation,
  ScopeAssignment,
} from "@/modules/settings/types";

const today = new Date("2026-05-24T00:00:00.000Z");
const rolePermissionCatalog = createDefaultRolePermissionCatalog();

function assignment(
  input: Partial<ScopeAssignment> &
    Pick<ScopeAssignment, "id" | "roleKey" | "userId">,
): ScopeAssignment {
  return {
    active: true,
    createdAt: "2026-05-20T00:00:00.000Z",
    permissionKeys: [
      "project.view",
      "task.view",
      "document.view",
      "meeting.view",
      "proposal.view",
    ],
    scopeType: "scoped",
    updatedAt: "2026-05-20T00:00:00.000Z",
    ...input,
  };
}

function delegation(
  input: Partial<LeadershipDelegation> & Pick<LeadershipDelegation, "id">,
): LeadershipDelegation {
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

function fixtureRiskStatus(
  status: "green" | "yellow" | "red",
  labelVi: string,
) {
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
      scope: expect.objectContaining({
        selectedScopeId: "all",
        operatingRole: "CEO",
      }),
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
        permissionKeys: [
          "project.view",
          "proposal.view",
          "meeting.view",
          "finance.view",
        ],
      }),
      assignment({
        id: "scope-director-riverside",
        roleKey: "giam_doc_du_an",
        userId: "project-director-01",
        projectId: "demo-project-riverside",
        axisId: "axis-1",
        permissionKeys: [
          "project.view",
          "proposal.view",
          "meeting.view",
          "finance.view",
        ],
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
      permissions: [
        "project.view",
        "task.view",
        "document.view",
        "meeting.view",
      ],
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
          permissionKeys: [
            "project.view",
            "task.view",
            "document.view",
            "meeting.view",
          ],
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
        reason: "Ủy quyền đã hết hiệu lực.",
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
        [
          "proposal.approve",
          "proposal.reject",
          "proposal.request_change",
        ].includes(action.actionKey),
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
        delegations: [
          delegation({ id: "delegation-with-missing-catalog-action" }),
        ],
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
        reason:
          "Không có thao tác được phép ủy quyền trong danh mục quyền hiện tại.",
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

    expect(
      workspace?.assistantSupport.allowedActions.map(
        (action) => action.actionKey,
      ),
    ).toEqual(["proposal.create"]);
    expect(workspace?.assistantSupport.delegations[0]?.actionKeys).toEqual([
      "proposal.create",
    ]);
    expect(JSON.stringify(workspace?.assistantSupport)).not.toContain(
      "proposal.approve",
    );
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
    expect(
      workspace?.assistantSupport.allowedActions.map(
        (action) => action.actionKey,
      ),
    ).toEqual(["risk.override"]);
    expect(workspace?.assistantSupport.delegations[0]?.actionKeys).toEqual([
      "risk.override",
    ]);
    expect(JSON.stringify(workspace?.assistantSupport)).not.toContain(
      "risk.close",
    );
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
        reason: "Ủy quyền đang hiệu lực nhưng nằm ngoài phạm vi đã chọn.",
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
                priority: "normal",
                riskLevel: "low",
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
                deadline: "2026-05-23T17:30:00.000Z",
                id: "meeting-due-today",
                sourceId: "meeting-due-today",
                sourceType: "meeting",
                title: "ISO meeting due today in Vietnam timezone",
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
      title: "ISO meeting due today in Vietnam timezone",
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

  it("builds the 1.4 role-specific executive private workspace panels", async () => {
    const departmentDashboard = await getExecutiveDashboardData(
      { id: "legal-head-01", role: "phap_ly" },
      {
        rolePermissionCatalog,
        scopeAssignments: [],
        requireScopeAssignments: false,
        today,
      },
    );
    const professionalApprovalBase =
      departmentDashboard.approvalSummary.items[0];
    const workflowDeadlineBase =
      departmentDashboard.todayDeadlines.items[0] ?? professionalApprovalBase;

    if (!professionalApprovalBase || !workflowDeadlineBase) {
      throw new Error("Expected department dashboard fixture items");
    }

    const departmentDashboardWithProfessionalContext: ExecutiveDashboardData = {
      ...departmentDashboard,
      approvalSummary: {
        ...departmentDashboard.approvalSummary,
        items: [
          {
            ...professionalApprovalBase,
            id: "legal-professional-approval",
            moduleId: "legal",
            reason: "Workflow pháp lý chuyên môn cần phê duyệt.",
            sourceId: "legal-professional-approval",
            title: "Hồ sơ pháp lý chuyên môn",
          },
        ],
      },
      todayDeadlines: {
        ...departmentDashboard.todayDeadlines,
        items: [
          {
            ...workflowDeadlineBase,
            id: "legal-workflow-checklist",
            moduleId: "legal",
            reason: "Checklist pháp lý trước khi trình.",
            sourceId: "legal-workflow-checklist",
            title: "Workflow checklist pháp lý",
          },
        ],
      },
    };
    const chairman = await getExecutivePrivateWorkspaceData(
      { id: "chairman-01", role: "chu_tich" },
      {
        rolePermissionCatalog,
        scopeAssignments: [],
        requireScopeAssignments: false,
        today,
      },
    );
    const ceo = await getExecutivePrivateWorkspaceData(
      { id: "ceo-01", role: "tong_giam_doc" },
      {
        rolePermissionCatalog,
        scopeAssignments: [],
        requireScopeAssignments: false,
        today,
      },
    );
    const projectDirectorScopeAssignments = [
      assignment({
        id: "scope-director-riverside-1-4",
        roleKey: "giam_doc_du_an",
        userId: "project-director-01",
        projectId: "demo-project-riverside",
        permissionKeys: [
          "project.view",
          "proposal.view",
          "meeting.view",
          "finance.view",
          "risk.view",
        ],
      }),
    ];
    const projectDirectorDashboard = await getExecutiveDashboardData(
      { id: "project-director-01", role: "giam_doc_du_an" },
      {
        rolePermissionCatalog,
        scopeAssignments: projectDirectorScopeAssignments,
        selectedScopeId: "scope-director-riverside-1-4",
        today,
      },
    );
    const projectDirectorDashboardWithCost: ExecutiveDashboardData = {
      ...projectDirectorDashboard,
      financialSummary: {
        access: "partial",
        currency: "VND",
        items: [
          {
            amount: 123_000_000,
            amountLabel: "123.000.000 ₫",
            id: "riverside-cost-row",
            projectId: "demo-project-riverside",
            sourceId: "riverside-cost-row",
            sourceType: "project",
          },
        ],
        state: "allowed",
        visibleAmountTotal: 123_000_000,
        visibleRecordCount: 1,
      },
    };
    const projectDirector = await getExecutivePrivateWorkspaceData(
      { id: "project-director-01", role: "giam_doc_du_an" },
      {
        dashboardData: projectDirectorDashboardWithCost,
        rolePermissionCatalog,
        scopeAssignments: projectDirectorScopeAssignments,
        selectedScopeId: "scope-director-riverside-1-4",
        today,
      },
    );
    const departmentHead = await getExecutivePrivateWorkspaceData(
      { id: "legal-head-01", role: "phap_ly" },
      {
        rolePermissionCatalog,
        dashboardData: departmentDashboardWithProfessionalContext,
        scopeAssignments: [],
        requireScopeAssignments: false,
        today,
      },
    );

    expect(chairman).toMatchObject({
      variant: "chairman",
      financialSummary: expect.objectContaining({ state: "allowed" }),
      permissionOverview: expect.objectContaining({
        state: "available",
        items: expect.arrayContaining([
          expect.objectContaining({ id: "project-view", enabled: true }),
          expect.objectContaining({ id: "finance-view", enabled: true }),
          expect.objectContaining({ id: "risk-governance", enabled: true }),
          expect.objectContaining({ id: "bo-admin", enabled: false }),
        ]),
      }),
      riskMap: expect.objectContaining({
        total: expect.any(Number),
        affectedProjectCount: expect.any(Number),
        categories: expect.any(Array),
        matrix: expect.any(Array),
      }),
    });
    expect(ceo?.resourceProgress).toMatchObject({
      state: "available",
      items: expect.arrayContaining([
        expect.objectContaining({ id: "project-progress" }),
        expect.objectContaining({ id: "resource-load" }),
      ]),
    });
    expect(projectDirector).toMatchObject({
      variant: "project_director",
      projectCost: expect.objectContaining({
        state: "available",
        financialSummary: expect.objectContaining({ state: "allowed" }),
      }),
    });
    expect(projectDirector?.approvalItems).toEqual(expect.any(Array));
    expect(departmentHead).toMatchObject({
      variant: "department_head",
      professionalApprovals: expect.objectContaining({
        state: "available",
        items: [
          expect.objectContaining({ sourceId: "legal-professional-approval" }),
        ],
      }),
      workflowChecklist: expect.objectContaining({
        state: "available",
        items: [
          expect.objectContaining({ sourceId: "legal-workflow-checklist" }),
        ],
      }),
    });
  });

  it("does not fabricate CEO resource metrics when progress or owner metadata is missing", async () => {
    const dashboard = await getExecutiveDashboardData(
      { id: "ceo-01", role: "tong_giam_doc" },
      {
        rolePermissionCatalog,
        scopeAssignments: [],
        requireScopeAssignments: false,
        today,
      },
    );
    const dashboardWithoutResourceMetadata: ExecutiveDashboardData = {
      ...dashboard,
      projectPortfolio: {
        ...dashboard.projectPortfolio,
        items: dashboard.projectPortfolio.items.map((item) => ({
          ...item,
          owner: undefined,
          progress: undefined,
        })),
      },
      todayDeadlines: {
        ...dashboard.todayDeadlines,
        items: dashboard.todayDeadlines.items.map((item) => ({
          ...item,
          owner: undefined,
        })),
      },
    };
    const workspace = await getExecutivePrivateWorkspaceData(
      { id: "ceo-01", role: "tong_giam_doc" },
      {
        dashboardData: dashboardWithoutResourceMetadata,
        rolePermissionCatalog,
        scopeAssignments: [],
        requireScopeAssignments: false,
        today,
      },
    );

    expect(workspace?.resourceProgress).toMatchObject({
      items: [],
      state: "empty",
    });
    expect(workspace?.resourceProgress?.reason).toContain("metadata");
  });

  it("scopes project director cost summary to assigned project finance rows only", async () => {
    const scopeAssignments = [
      assignment({
        id: "scope-director-riverside-cost",
        roleKey: "giam_doc_du_an",
        userId: "project-director-cost",
        projectId: "demo-project-riverside",
        permissionKeys: [
          "project.view",
          "proposal.view",
          "meeting.view",
          "finance.view",
        ],
      }),
    ];
    const dashboard = await getExecutiveDashboardData(
      { id: "project-director-cost", role: "giam_doc_du_an" },
      {
        rolePermissionCatalog,
        scopeAssignments,
        selectedScopeId: "scope-director-riverside-cost",
        today,
      },
    );
    const dashboardWithOutOfScopeFinance: ExecutiveDashboardData = {
      ...dashboard,
      financialSummary: {
        access: "partial",
        currency: "VND",
        items: [
          {
            amount: 999_000_000,
            amountLabel: "999.000.000 ₫",
            id: "garden-cost-row",
            projectId: "demo-project-garden",
            sourceId: "garden-cost-row",
            sourceType: "project",
          },
        ],
        state: "allowed",
        visibleAmountTotal: 999_000_000,
        visibleRecordCount: 1,
      },
    };
    const workspace = await getExecutivePrivateWorkspaceData(
      { id: "project-director-cost", role: "giam_doc_du_an" },
      {
        dashboardData: dashboardWithOutOfScopeFinance,
        rolePermissionCatalog,
        scopeAssignments,
        selectedScopeId: "scope-director-riverside-cost",
        today,
      },
    );

    expect(workspace?.projectCost).toMatchObject({
      items: [],
      state: "empty",
      financialSummary: expect.objectContaining({
        visibleAmountTotal: 0,
        visibleRecordCount: 0,
      }),
    });
  });

  it("keeps department workflow and professional approvals empty without scoped professional context", async () => {
    const dashboard = await buildDashboardPatch();
    const workspace = await getExecutivePrivateWorkspaceData(
      { id: "legal-head-empty", role: "phap_ly" },
      {
        dashboardData: dashboard,
        rolePermissionCatalog,
        scopeAssignments: [],
        requireScopeAssignments: false,
        today,
      },
    );

    expect(workspace?.workflowChecklist).toMatchObject({
      items: [],
      state: "empty",
    });
    expect(workspace?.professionalApprovals).toMatchObject({
      items: [],
      state: "empty",
    });
  });

  it("does not collapse two leaders with the same role into the same private workspace when scopes differ", async () => {
    const scopeAssignments = [
      assignment({
        id: "scope-director-riverside-same-role",
        roleKey: "giam_doc_du_an",
        userId: "director-riverside",
        projectId: "demo-project-riverside",
        permissionKeys: [
          "project.view",
          "proposal.view",
          "meeting.view",
          "finance.view",
        ],
      }),
      assignment({
        id: "scope-director-garden-same-role",
        roleKey: "giam_doc_du_an",
        userId: "director-garden",
        projectId: "demo-project-garden",
        permissionKeys: [
          "project.view",
          "proposal.view",
          "meeting.view",
          "finance.view",
        ],
      }),
    ];
    const riverside = await getExecutivePrivateWorkspaceData(
      { id: "director-riverside", role: "giam_doc_du_an" },
      {
        rolePermissionCatalog,
        scopeAssignments,
        selectedScopeId: "scope-director-riverside-same-role",
        today,
      },
    );
    const garden = await getExecutivePrivateWorkspaceData(
      { id: "director-garden", role: "giam_doc_du_an" },
      {
        rolePermissionCatalog,
        scopeAssignments,
        selectedScopeId: "scope-director-garden-same-role",
        today,
      },
    );

    expect(riverside?.variant).toBe("project_director");
    expect(garden?.variant).toBe("project_director");
    expect(riverside?.scope.selectedScopeId).toBe(
      "scope-director-riverside-same-role",
    );
    expect(garden?.scope.selectedScopeId).toBe(
      "scope-director-garden-same-role",
    );
    expect(riverside?.assignedProjects.map((item) => item.projectId)).toEqual([
      "demo-project-riverside",
    ]);
    expect(garden?.assignedProjects.map((item) => item.projectId)).toEqual([
      "demo-project-garden",
    ]);
  });
});
