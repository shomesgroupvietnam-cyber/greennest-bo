import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getExecutiveCommonCenterData } from "@/modules/dashboard/services/executive-common-center-service";
import { getExecutiveDashboardData } from "@/modules/dashboard/services/executive-dashboard-service";
import { getExecutiveLeadershipData } from "@/modules/executive/services/executive-service";
import { JsonMeetingRepository } from "@/modules/meetings/services/meeting-repository";
import { JsonProjectRepository } from "@/modules/projects/services/project-repository";
import { createProject } from "@/modules/projects/services/project-service";
import { JsonProposalRepository } from "@/modules/proposals/services/proposal-repository";
import type { Proposal } from "@/modules/proposals/types";
import { createDefaultRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-repository";
import type { ScopeAssignment } from "@/modules/settings/types";

let tempDir: string;
let projectRepository: JsonProjectRepository;
let proposalRepository: JsonProposalRepository;
let meetingRepository: JsonMeetingRepository;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-common-center-"));
  projectRepository = new JsonProjectRepository(path.join(tempDir, "project-core.json"));
  proposalRepository = new JsonProposalRepository(path.join(tempDir, "proposals.json"));
  meetingRepository = new JsonMeetingRepository(path.join(tempDir, "meetings-decisions.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

async function seedProposal(input: {
  amount?: number;
  dueDate?: string;
  id: string;
  priority?: Proposal["priority"];
  projectId: string;
  status?: Proposal["status"];
  title: string;
}) {
  const timestamp = "2026-05-20T00:00:00.000Z";
  const proposal: Proposal = {
    aiReviewStatus: "not_checked",
    amount: input.amount,
    code: `DX-${input.id.toUpperCase()}`,
    createdAt: timestamp,
    dueDate: input.dueDate,
    id: input.id,
    module: "proposal",
    ownerId: "owner-01",
    priority: input.priority ?? "high",
    projectId: input.projectId,
    requestedBy: "requester-01",
    status: input.status ?? "in_review",
    submittedBy: "requester-01",
    summary: "Common center proposal fixture.",
    title: input.title,
    type: input.amount ? "finance" : "general",
    updatedAt: timestamp,
  };

  await proposalRepository.createProposal(proposal);

  return proposal;
}

describe("executive common center service", () => {
  it("builds scoped common center sections and priority from executive DTOs", async () => {
    const commonCenter = await getExecutiveCommonCenterData(
      { id: "ceo-01", role: "tong_giam_doc" },
      {
        repositories: {
          meetings: meetingRepository,
          projects: projectRepository,
          proposals: proposalRepository,
        },
        requireScopeAssignments: false,
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [],
        today: new Date("2026-05-24T00:00:00.000Z"),
      },
    );

    expect(commonCenter.scope).toMatchObject({
      operatingRole: "CEO",
      selectedScopeId: "all",
    });
    expect(commonCenter.commonKpis.length).toBeGreaterThan(0);
    expect(commonCenter.priorityItems.length).toBeGreaterThan(0);
    expect(commonCenter.notifications.length).toBeGreaterThan(0);
    expect(commonCenter.decisionHighlights.length).toBeGreaterThan(0);
    expect(commonCenter.calendarItems.length).toBeGreaterThan(0);
    expect(commonCenter.riskOverview.items.length).toBeGreaterThan(0);
    expect(commonCenter.strategyItems.length).toBeGreaterThan(0);
    expect(commonCenter.systemDeadlines.length).toBeGreaterThan(0);
    expect(commonCenter.thresholdBreaches.length).toBeGreaterThan(0);
    expect(commonCenter.priorityItems[0].score).toBeGreaterThanOrEqual(
      commonCenter.priorityItems.at(-1)?.score ?? 0,
    );
    expect(
      commonCenter.priorityItems.some(
        (item) =>
          item.groupLabel === "Risk nghiêm trọng" ||
          item.groupLabel === "Approval qua han",
      ),
    ).toBe(true);
  });

  it("dedupes priority items by source and keeps severe overdue approval first", async () => {
    const project = await createProject(
      { name: "Common Center Dedupe Project", status: "active" },
      projectRepository,
    );

    await seedProposal({
      amount: 120_000_000,
      dueDate: "2026-05-20",
      id: "overdue-common-approval",
      priority: "high",
      projectId: project.id,
      title: "Overdue common approval",
    });

    const commonCenter = await getExecutiveCommonCenterData(
      { id: "scoped-common-center", role: "pending" },
      {
        repositories: {
          meetings: meetingRepository,
          projects: projectRepository,
          proposals: proposalRepository,
        },
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [
          {
            active: true,
            createdAt: "",
            id: "assignment-common-dedupe",
            permissionKeys: ["project.view", "proposal.view"],
            projectId: project.id,
            roleKey: "dau_tu_phat_trien",
            scopeType: "scoped",
            updatedAt: "",
            userId: "scoped-common-center",
          },
        ],
        selectedScopeId: "all",
        today: new Date("2026-05-24T00:00:00.000Z"),
      },
    );
    const sourceKeys = commonCenter.priorityItems.map(
      (item) => `${item.sourceType}:${item.sourceId}`,
    );

    expect(sourceKeys).toContain("proposal:overdue-common-approval");
    expect(new Set(sourceKeys).size).toBe(sourceKeys.length);
    expect(commonCenter.priorityItems[0]).toMatchObject({
      groupLabel: "Approval escalation",
      overdue: expect.objectContaining({
        daysOverdue: 4,
        isOverdue: true,
      }),
      priorityLabel: "Leo thang",
      sourceId: "overdue-common-approval",
    });
  });

  it("does not leak hidden finance values when finance permission is missing", async () => {
    const visibleProject = await createProject(
      { name: "Visible Common Project", status: "active" },
      projectRepository,
    );
    const hiddenProject = await createProject(
      { name: "Hidden Common Project", status: "active" },
      projectRepository,
    );

    await seedProposal({
      amount: 111_000_000,
      dueDate: "2026-05-20",
      id: "visible-common-approval",
      projectId: visibleProject.id,
      title: "Visible common approval",
    });
    await seedProposal({
      amount: 222_000_000,
      dueDate: "2026-05-20",
      id: "hidden-common-approval",
      projectId: hiddenProject.id,
      title: "Hidden common approval",
    });

    const scopeAssignments: ScopeAssignment[] = [
      {
        active: true,
        createdAt: "",
        id: "assignment-visible-common",
        permissionKeys: ["project.view", "proposal.view"],
        projectId: visibleProject.id,
        roleKey: "dau_tu_phat_trien",
        scopeType: "scoped",
        updatedAt: "",
        userId: "common-no-finance",
      },
    ];
    const commonCenter = await getExecutiveCommonCenterData(
      { id: "common-no-finance", role: "pending" },
      {
        repositories: {
          meetings: meetingRepository,
          projects: projectRepository,
          proposals: proposalRepository,
        },
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments,
        selectedScopeId: "all",
        today: new Date("2026-05-24T00:00:00.000Z"),
      },
    );
    const serialized = JSON.stringify(commonCenter);

    expect(serialized).toContain("visible-common-approval");
    expect(serialized).not.toContain("hidden-common-approval");
    expect(serialized).not.toContain("222000000");
    expect(serialized).not.toContain("222.000.000");
    expect(serialized).not.toContain("cashFlowLabel");
    expect(serialized).not.toContain("budgetLabel");
  });

  it("gates leadership-derived common sections by dashboard DTO permissions", async () => {
    const user = { id: "ceo-permission-gate", role: "tong_giam_doc" };
    const rolePermissionCatalog = createDefaultRolePermissionCatalog();
    const dashboardData = await getExecutiveDashboardData(user, {
      repositories: {
        meetings: meetingRepository,
        projects: projectRepository,
        proposals: proposalRepository,
      },
      requireScopeAssignments: false,
      rolePermissionCatalog,
      scopeAssignments: [],
      today: new Date("2026-05-24T00:00:00.000Z"),
    });
    const executiveData = await getExecutiveLeadershipData(user, {
      rolePermissionCatalog,
      scopeAssignments: [],
    });

    const commonCenter = await getExecutiveCommonCenterData(user, {
      dashboardData: {
        ...dashboardData,
        permissions: {
          canDrillDown: false,
          canViewDecisions: false,
          canViewFinance: false,
          canViewMeetings: false,
          canViewProjects: false,
          canViewProposals: false,
          canViewRisk: false,
          canCreateRisk: false,
          canUpdateRisk: false,
          canOverrideRisk: false,
          canCloseRisk: false,
          canCloseHighRisk: false,
        },
      },
      executiveData,
      rolePermissionCatalog,
      scopeAssignments: [],
      today: new Date("2026-05-24T00:00:00.000Z"),
    });

    expect(commonCenter.notifications).toEqual([]);
    expect(commonCenter.decisionHighlights).toEqual([]);
    expect(commonCenter.calendarItems).toEqual([]);
    expect(commonCenter.strategyItems).toEqual([]);
    expect(commonCenter.priorityItems).toEqual([]);
    expect(commonCenter.riskOverview.items).toEqual([]);
    expect(commonCenter.systemDeadlines).toEqual([]);
  });

  it("does not fallback to another assignment when selected scope is invalid", async () => {
    const rolePermissionCatalog = createDefaultRolePermissionCatalog();
    const commonCenter = await getExecutiveCommonCenterData(
      { id: "scope-fallback-user", role: "tong_giam_doc" },
      {
        repositories: {
          meetings: meetingRepository,
          projects: projectRepository,
          proposals: proposalRepository,
        },
        rolePermissionCatalog,
        scopeAssignments: [
          {
            active: true,
            axisId: "axis-1",
            createdAt: "",
            id: "valid-but-not-selected",
            permissionKeys: ["project.view", "meeting.view", "decision.approve"],
            projectId: "demo-project-riverside",
            roleKey: "giam_doc_du_an",
            scopeType: "scoped",
            updatedAt: "",
            userId: "scope-fallback-user",
          },
        ],
        selectedScopeId: "missing-scope",
        today: new Date("2026-05-24T00:00:00.000Z"),
      },
    );

    expect(commonCenter.scope.selectedScopeId).toBe("missing-scope");
    expect(commonCenter.scope.operatingRole).toBeUndefined();
    expect(commonCenter.decisionHighlights).toEqual([]);
    expect(commonCenter.calendarItems).toEqual([]);
    expect(commonCenter.strategyItems).toEqual([]);
  });

  it("uses the actual threshold trigger for non-overdue high approvals", async () => {
    const project = await createProject(
      { name: "Future High Approval Project", status: "active" },
      projectRepository,
    );

    await seedProposal({
      dueDate: "2026-06-20",
      id: "future-high-approval",
      priority: "high",
      projectId: project.id,
      title: "Future high approval",
    });

    const commonCenter = await getExecutiveCommonCenterData(
      { id: "future-high-user", role: "pending" },
      {
        repositories: {
          meetings: meetingRepository,
          projects: projectRepository,
          proposals: proposalRepository,
        },
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [
          {
            active: true,
            createdAt: "",
            id: "assignment-future-high",
            permissionKeys: ["project.view", "proposal.view"],
            projectId: project.id,
            roleKey: "dau_tu_phat_trien",
            scopeType: "scoped",
            updatedAt: "",
            userId: "future-high-user",
          },
        ],
        selectedScopeId: "all",
        today: new Date("2026-05-24T00:00:00.000Z"),
      },
    );

    expect(
      commonCenter.thresholdBreaches.find(
        (item) => item.sourceId === "future-high-approval",
      ),
    ).toMatchObject({
      breachReason: "approval high risk",
      sourceId: "future-high-approval",
    });
  });
});
