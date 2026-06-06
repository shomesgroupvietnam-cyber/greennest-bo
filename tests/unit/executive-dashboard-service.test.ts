import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getExecutiveDashboardData } from "@/modules/dashboard/services/executive-dashboard-service";
import { JsonRiskRecordRepository } from "@/modules/executive/services/risk-record-repository";
import { JsonMeetingRepository } from "@/modules/meetings/services/meeting-repository";
import { JsonProjectRepository } from "@/modules/projects/services/project-repository";
import { createProject } from "@/modules/projects/services/project-service";
import { JsonProposalRepository } from "@/modules/proposals/services/proposal-repository";
import type { Proposal } from "@/modules/proposals/types";
import type { NotificationRepository } from "@/lib/notifications/notification-service";
import type { NotificationOutboxItem } from "@/lib/notifications/types";
import { createDefaultRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-repository";
import type { ApprovalThresholdPolicy, LeadershipDelegation, ScopeAssignment } from "@/modules/settings/types";
import type { AuditLog } from "@/modules/users/types";

let tempDir: string;
let projectRepository: JsonProjectRepository;
let proposalRepository: JsonProposalRepository;
let meetingRepository: JsonMeetingRepository;
let riskRecordRepository: JsonRiskRecordRepository;

class InMemoryNotificationRepository implements NotificationRepository {
  private items: NotificationOutboxItem[] = [];

  async getByDedupeKey(dedupeKey: string) {
    return this.items.find((item) => item.dedupeKey === dedupeKey);
  }

  async list() {
    return this.items;
  }

  async upsert(item: NotificationOutboxItem) {
    const exists = this.items.some((current) => current.id === item.id);
    this.items = exists
      ? this.items.map((current) => (current.id === item.id ? item : current))
      : [item, ...this.items];

    return item;
  }
}

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-executive-dashboard-"));
  projectRepository = new JsonProjectRepository(path.join(tempDir, "project-core.json"));
  proposalRepository = new JsonProposalRepository(path.join(tempDir, "proposals.json"));
  meetingRepository = new JsonMeetingRepository(path.join(tempDir, "meetings-decisions.json"));
  riskRecordRepository = new JsonRiskRecordRepository(path.join(tempDir, "risk-records.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

async function seedProposal(input: {
  id: string;
  projectId: string;
  title: string;
  amount?: number;
  dueDate?: string;
  status?: Proposal["status"];
}) {
  const timestamp = "2026-05-20T00:00:00.000Z";
  const proposal: Proposal = {
    id: input.id,
    code: `DX-${input.id.toUpperCase()}`,
    title: input.title,
    type: input.amount ? "finance" : "general",
    projectId: input.projectId,
    module: "proposal",
    requestedBy: "requester-01",
    submittedBy: "requester-01",
    ownerId: "owner-01",
    status: input.status ?? "in_review",
    priority: "high",
    amount: input.amount,
    dueDate: input.dueDate,
    summary: "Executive dashboard proposal fixture.",
    aiReviewStatus: "not_checked",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await proposalRepository.createProposal(proposal);

  return proposal;
}

function approvalPolicy(overrides: Partial<ApprovalThresholdPolicy> = {}): ApprovalThresholdPolicy {
  return {
    active: true,
    approvalLevel: "CEO",
    approverRoleKey: "tong_giam_doc",
    createdAt: "2026-05-20T00:00:00.000Z",
    currency: "VND",
    escalateAfterDays: 3,
    escalateOnRiskLevels: ["high", "critical"],
    id: "policy-dashboard",
    labelVi: "Dashboard approval",
    policyKey: "dashboard_approval",
    priority: 1,
    requiredPermissionKey: "proposal.approve",
    targetType: "general",
    updatedAt: "2026-05-20T00:00:00.000Z",
    ...overrides,
  };
}

function delegation(overrides: Partial<LeadershipDelegation> = {}): LeadershipDelegation {
  return {
    actionKeys: ["proposal.create"],
    active: true,
    createdAt: "2026-05-20T00:00:00.000Z",
    delegateUserId: "assistant-01",
    id: "delegation-dashboard",
    moduleId: "proposal",
    principalUserId: "requester-01",
    projectId: "project-a",
    updatedAt: "2026-05-20T00:00:00.000Z",
    ...overrides,
  };
}

describe("executive dashboard service", () => {
  it("builds a scoped DTO with portfolio, approval, risk, deadline and decision sections", async () => {
    const dashboard = await getExecutiveDashboardData(
      { id: "ceo-01", role: "tong_giam_doc" },
      {
        today: new Date("2026-05-24T00:00:00.000Z"),
        repositories: {
          projects: projectRepository,
          proposals: proposalRepository,
          meetings: meetingRepository,
        },
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [],
        requireScopeAssignments: false,
      },
    );

    expect(dashboard.generatedAt).toEqual(expect.any(String));
    expect(dashboard.scope).toMatchObject({
      selectedScopeId: "all",
      operatingRole: "CEO",
    });
    expect(dashboard.permissions).toMatchObject({
      canViewProjects: true,
      canViewProposals: true,
      canViewMeetings: true,
      canViewDecisions: true,
      canViewFinance: true,
    });
    expect(dashboard.projectPortfolio.total).toBeGreaterThan(0);
    expect(
      dashboard.projectPortfolio.red +
        dashboard.projectPortfolio.yellow +
        dashboard.projectPortfolio.green,
    ).toBe(dashboard.projectPortfolio.total);
    expect(dashboard.projectPortfolio.items[0]).toMatchObject({
      sourceType: "project",
      sourceId: expect.any(String),
      status: expect.any(String),
    });
    expect(dashboard.approvalSummary.pending).toBeGreaterThan(0);
    expect(dashboard.approvalSummary.items[0]).toMatchObject({
      sourceType: expect.stringMatching(/proposal|leadership_approval|executive_action/),
      sourceId: expect.any(String),
      status: expect.any(String),
    });
    expect(dashboard.riskSummary.high + dashboard.riskSummary.critical).toBeGreaterThan(0);
    expect(dashboard.riskSummary.items[0]).toMatchObject({
      categoryKey: expect.any(String),
      categoryLabel: expect.any(String),
      impact: expect.stringMatching(/low|medium|high|critical/),
      impactLabel: expect.any(String),
      likelihood: expect.stringMatching(/low|medium|high/),
      likelihoodLabel: expect.any(String),
      matrixCellLabel: expect.any(String),
      nextAction: expect.any(String),
      severityLabel: expect.stringMatching(/Cao|Nghiêm trọng/),
      statusSuggestion: expect.objectContaining({
        confirmationState: "suggested",
        generatedAt: expect.any(String),
        labelVi: expect.stringMatching(/Đỏ|Vàng|Xanh/),
      }),
    });
    expect(dashboard.riskSummary.riskMap.total).toBeGreaterThanOrEqual(
      dashboard.riskSummary.items.length,
    );
    expect(dashboard.riskSummary.riskMap.affectedProjectCount).toBeGreaterThan(0);
    expect(dashboard.riskSummary.riskMap.categories[0]).toMatchObject({
      affectedProjectCount: expect.any(Number),
      affectedProjectIds: expect.any(Array),
      categoryKey: expect.any(String),
      categoryLabel: expect.any(String),
      count: expect.any(Number),
      owners: expect.any(Array),
      statusCounts: expect.objectContaining({
        green: expect.any(Number),
        red: expect.any(Number),
        yellow: expect.any(Number),
      }),
    });
    expect(dashboard.riskSummary.riskMap.matrix).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          count: expect.any(Number),
          impact: expect.stringMatching(/low|medium|high|critical/),
          impactLabel: expect.any(String),
          likelihood: expect.stringMatching(/low|medium|high/),
          likelihoodLabel: expect.any(String),
          riskIds: expect.any(Array),
        }),
      ]),
    );
    expect(Object.keys(dashboard.riskSummary.byCategory)).toContain(
      dashboard.riskSummary.items[0].categoryLabel,
    );
    expect(JSON.stringify(dashboard.riskSummary)).not.toContain("amountLabel");
    expect(dashboard.todayDeadlines.items.length).toBeGreaterThan(0);
    expect(dashboard.recentDecisions.items.length).toBeGreaterThan(0);
    expect(dashboard.meetingSnapshot.total).toBeGreaterThanOrEqual(0);
    expect(dashboard.sourceCounts).toMatchObject({
      projects: expect.any(Number),
      proposals: expect.any(Number),
      meetings: expect.any(Number),
      decisions: expect.any(Number),
    });
  });

  it("ignores terminal meeting follow-ups when counting overdue dashboard items", async () => {
    const timestamp = "2026-05-20T00:00:00.000Z";
    await meetingRepository.createMeeting({
      aiSummary: { status: "DRAFT" },
      auditLog: [],
      attachments: [],
      createdAt: timestamp,
      decisions: [],
      externalParticipants: [],
      followUpActions: [
        {
          dueDate: "2026-05-20",
          id: "follow-up-open",
          status: "open",
          title: "Open follow-up",
        },
        {
          dueDate: "2026-05-20",
          id: "follow-up-done",
          status: "done",
          title: "Done follow-up",
        },
        {
          dueDate: "2026-05-20",
          id: "follow-up-cancelled",
          status: "cancelled",
          title: "Cancelled follow-up",
        },
      ],
      id: "meeting-follow-up-dashboard",
      meetingDate: "2026-05-24T09:00:00.000Z",
      meetingType: "PROJECT_MEETING",
      participants: [],
      participantScope: "project_team",
      relatedApprovals: [],
      relatedRecords: [],
      relatedTasks: [],
      startTime: "2026-05-24T09:00:00.000Z",
      status: "COMPLETED",
      title: "Follow-up dashboard meeting",
      updatedAt: timestamp,
      visibility: "project",
    });

    const dashboard = await getExecutiveDashboardData(
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

    const meetingFollowUps = dashboard.todayDeadlines.items.filter(
      (item) => item.id.startsWith("meeting-follow-up-"),
    );

    expect(dashboard.meetingSnapshot.followUpsOverdue).toBe(1);
    expect(meetingFollowUps.map((item) => item.title)).toEqual([
      "Open follow-up",
    ]);
  });

  it("does not serialize risk summary source data when the user cannot view risk", async () => {
    await riskRecordRepository.createRiskRecord({
      categoryKey: "legal",
      createdAt: "2026-05-20T00:00:00.000Z",
      createdBy: "ceo-01",
      deadline: "2026-05-24",
      id: "official-hidden-risk",
      level: "critical",
      moduleId: "risk",
      nextAction: "Hidden next action",
      ownerId: "owner-01",
      projectId: "project-a",
      reason: "Hidden official risk reason",
      recordType: "risk",
      status: "blocked",
      title: "HIDDEN_OFFICIAL_RISK_SENTINEL",
      updatedAt: "2026-05-20T00:00:00.000Z",
      updatedBy: "ceo-01",
    });

    const dashboard = await getExecutiveDashboardData(
      {
        id: "ceo-no-risk",
        permissions: ["meeting.view"],
        permissionsMode: "replace",
        role: "tong_giam_doc",
      },
      {
        approvalPolicies: [],
        delegations: [],
        repositories: {
          projects: projectRepository,
          proposals: proposalRepository,
          meetings: meetingRepository,
          riskRecords: riskRecordRepository,
        },
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        today: new Date("2026-05-24T00:00:00.000Z"),
      },
    );

    expect(dashboard.permissions.canViewRisk).toBe(false);
    expect(dashboard.sourceCounts.executiveActions).toBeGreaterThan(0);
    expect(dashboard.riskSummary).toEqual({
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
    });
    expect(dashboard.kpis.find((kpi) => kpi.id === "high-risks")).toMatchObject({
      value: 0,
    });
    expect(JSON.stringify(dashboard)).not.toContain("HIDDEN_OFFICIAL_RISK_SENTINEL");
  });

  it("does not serialize official risk records for project viewers without risk.view", async () => {
    const project = await createProject(
      { name: "Project Viewer Risk", status: "active" },
      projectRepository,
    );
    await riskRecordRepository.createRiskRecord({
      categoryKey: "legal",
      createdAt: "2026-05-20T00:00:00.000Z",
      createdBy: "ceo-01",
      deadline: "2026-05-20",
      id: "official-project-viewer-hidden-risk",
      level: "critical",
      moduleId: "risk",
      nextAction: "Should stay hidden",
      ownerId: "owner-01",
      projectId: project.id,
      reason: "PROJECT_VIEWER_RISK_REASON_SENTINEL",
      recordType: "risk",
      status: "blocked",
      title: "PROJECT_VIEWER_RISK_SENTINEL",
      updatedAt: "2026-05-20T00:00:00.000Z",
      updatedBy: "ceo-01",
    });

    const dashboard = await getExecutiveDashboardData(
      {
        id: "project-viewer-no-risk",
        permissions: ["project.view"],
        permissionsMode: "replace",
        role: "pending",
      },
      {
        approvalPolicies: [],
        delegations: [],
        repositories: {
          projects: projectRepository,
          proposals: proposalRepository,
          meetings: meetingRepository,
          riskRecords: riskRecordRepository,
        },
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        today: new Date("2026-05-24T00:00:00.000Z"),
      },
    );

    expect(dashboard.permissions.canViewRisk).toBe(true);
    expect(JSON.stringify(dashboard.riskSummary)).not.toContain("PROJECT_VIEWER_RISK_SENTINEL");
    expect(JSON.stringify(dashboard.riskSummary)).not.toContain("PROJECT_VIEWER_RISK_REASON_SENTINEL");
  });

  it("merges persisted official risk records into risk summary and map", async () => {
    const project = await createProject(
      { name: "Official Risk Project", status: "active" },
      projectRepository,
    );
    await riskRecordRepository.createRiskRecord({
      categoryKey: "legal",
      createdAt: "2026-05-20T00:00:00.000Z",
      createdBy: "ceo-01",
      deadline: "2026-05-24",
      id: "official-visible-risk",
      level: "critical",
      moduleId: "risk",
      nextAction: "Xu ly official risk",
      ownerId: "owner-01",
      ownerName: "Owner One",
      projectId: project.id,
      reason: "Official risk reason",
      recordType: "blocker",
      status: "blocked",
      statusOverride: "green",
      statusOverrideAt: "2026-05-20T00:00:00.000Z",
      statusOverrideBy: "ceo-01",
      statusOverrideReason: "CEO xac nhan da kiem soat.",
      statusOverrideSourceStatus: "red",
      title: "OFFICIAL_RISK_SENTINEL",
      updatedAt: "2026-05-20T00:00:00.000Z",
      updatedBy: "ceo-01",
    });
    await riskRecordRepository.createRiskRecord({
      categoryKey: "legal",
      closedAt: "2026-05-21T00:00:00.000Z",
      closedBy: "ceo-01",
      closedReason: "Da xu ly.",
      createdAt: "2026-05-20T00:00:00.000Z",
      createdBy: "ceo-01",
      deadline: "2026-05-24",
      id: "official-closed-risk",
      level: "critical",
      moduleId: "risk",
      nextAction: "Khong hien tren dashboard active",
      ownerId: "owner-01",
      ownerName: "Owner One",
      projectId: project.id,
      reason: "Closed official risk reason",
      recordType: "blocker",
      status: "closed",
      title: "CLOSED_RISK_SENTINEL",
      updatedAt: "2026-05-21T00:00:00.000Z",
      updatedBy: "ceo-01",
    });

    const dashboard = await getExecutiveDashboardData(
      { id: "ceo-01", role: "tong_giam_doc" },
      {
        repositories: {
          projects: projectRepository,
          proposals: proposalRepository,
          meetings: meetingRepository,
          riskRecords: riskRecordRepository,
        },
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [],
        today: new Date("2026-05-24T00:00:00.000Z"),
      },
    );

    expect(dashboard.permissions).toMatchObject({
      canCreateRisk: true,
      canOverrideRisk: true,
      canCloseRisk: true,
      canCloseHighRisk: true,
      canUpdateRisk: true,
    });
    expect(dashboard.riskSummary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "risk-record-official-visible-risk",
          sourceId: "official-visible-risk",
          statusSuggestion: expect.objectContaining({
            confirmationState: "overridden",
            status: "green",
          }),
          title: "OFFICIAL_RISK_SENTINEL",
        }),
      ]),
    );
    expect(dashboard.riskSummary.items.map((item) => item.sourceId)).not.toContain(
      "official-closed-risk",
    );
    expect(JSON.stringify(dashboard.riskSummary)).not.toContain("CLOSED_RISK_SENTINEL");
    expect(
      dashboard.riskSummary.riskMap.categories.find((item) => item.categoryKey === "legal")
        ?.statusCounts.green,
    ).toBeGreaterThan(0);
    expect(dashboard.riskSummary.riskMap.total).toBeGreaterThanOrEqual(
      dashboard.riskSummary.items.length,
    );
    expect(dashboard.riskMutationOptions.projects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: project.id, label: "Official Risk Project" }),
      ]),
    );
  });

  it("adds overdue and escalation metadata to active official risks and dedupes notifications", async () => {
    const project = await createProject(
      { name: "Risk Alert Project", status: "active" },
      projectRepository,
    );
    await riskRecordRepository.createRiskRecord({
      categoryKey: "legal",
      createdAt: "2026-05-20T00:00:00.000Z",
      createdBy: "ceo-01",
      deadline: "2026-05-29",
      id: "official-overdue-risk",
      level: "high",
      moduleId: "risk",
      nextAction: "Lam viec voi owner de xu ly risk.",
      ownerId: "owner-01",
      ownerName: "Owner One",
      projectId: project.id,
      reason: "Risk phap ly qua han.",
      recordType: "risk",
      status: "open",
      title: "OFFICIAL_OVERDUE_RISK_SENTINEL",
      updatedAt: "2026-05-20T00:00:00.000Z",
      updatedBy: "ceo-01",
    });
    await riskRecordRepository.createRiskRecord({
      categoryKey: "legal",
      closedAt: "2026-06-01T00:00:00.000Z",
      closedBy: "ceo-01",
      closedReason: "Da dong.",
      createdAt: "2026-05-20T00:00:00.000Z",
      createdBy: "ceo-01",
      deadline: "2026-05-29",
      id: "official-closed-overdue-risk",
      level: "critical",
      moduleId: "risk",
      nextAction: "Khong tinh active alert.",
      ownerId: "owner-01",
      ownerName: "Owner One",
      projectId: project.id,
      reason: "Closed risk qua han.",
      recordType: "risk",
      status: "closed",
      title: "CLOSED_OVERDUE_RISK_SENTINEL",
      updatedAt: "2026-06-01T00:00:00.000Z",
      updatedBy: "ceo-01",
    });
    const notifications = new InMemoryNotificationRepository();
    const audits: Array<Omit<AuditLog, "id" | "createdAt">> = [];

    const options = {
      approvalPolicies: [
        approvalPolicy({
          id: "policy-risk-dashboard",
          labelVi: "Risk dashboard policy",
          priority: 1,
          projectId: project.id,
          requiredPermissionKey: "risk.view",
        }),
      ],
      auditWriter: async (input: Omit<AuditLog, "id" | "createdAt">) => {
        audits.push(input);
        return {
          ...input,
          createdAt: "2026-06-02T00:00:00.000Z",
          id: `audit-risk-dashboard-${audits.length}`,
        };
      },
      delegations: [
        delegation({
          actionKeys: ["risk.update"],
          delegateUserId: "assistant-01",
          moduleId: "risk",
          principalUserId: "owner-01",
          projectId: project.id,
        }),
      ],
      notificationRepository: notifications,
      repositories: {
        projects: projectRepository,
        proposals: proposalRepository,
        meetings: meetingRepository,
        riskRecords: riskRecordRepository,
      },
      rolePermissionCatalog: createDefaultRolePermissionCatalog(),
      scopeAssignments: [],
      today: new Date("2026-06-02T03:00:00.000Z"),
    };

    const first = await getExecutiveDashboardData(
      { id: "ceo-01", role: "tong_giam_doc" },
      options,
    );
    const second = await getExecutiveDashboardData(
      { id: "ceo-01", role: "tong_giam_doc" },
      options,
    );
    const riskItem = first.riskSummary.items.find(
      (item) => item.sourceId === "official-overdue-risk",
    );

    expect(riskItem).toMatchObject({
      overdue: {
        daysOverdue: 4,
        isOverdue: true,
        ownerLabel: "Owner One",
        severity: "critical",
      },
      escalation: {
        notificationId: expect.any(String),
        policyId: "policy-risk-dashboard",
        required: true,
        status: "queued",
        trigger: "critical_overdue",
      },
    });
    expect(riskItem?.escalation?.targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "owner", userId: "owner-01" }),
        expect.objectContaining({ kind: "delegate", userId: "assistant-01" }),
        expect.objectContaining({ kind: "policy_escalation", roleKey: "tong_giam_doc" }),
      ]),
    );
    expect(first.todayDeadlines.overdue).toBeGreaterThan(0);
    expect(first.todayDeadlines.items.map((item) => item.sourceId)).toContain(
      "official-overdue-risk",
    );
    expect(second.riskSummary.items.find((item) => item.sourceId === "official-overdue-risk")?.escalation).toMatchObject({
      notificationId: riskItem?.escalation?.notificationId,
      status: "queued",
    });
    expect(await notifications.list()).toHaveLength(1);
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      action: "risk.escalation_queued",
      entityId: "official-overdue-risk",
      entityType: "risk",
    });
    expect(JSON.stringify(first.riskSummary)).not.toContain("CLOSED_OVERDUE_RISK_SENTINEL");
  });

  it("does not fall back to global executive data when selected scope is invalid", async () => {
    const dashboard = await getExecutiveDashboardData(
      { id: "ceo-01", role: "tong_giam_doc" },
      {
        today: new Date("2026-05-24T00:00:00.000Z"),
        selectedScopeId: "missing-scope",
        repositories: {
          projects: projectRepository,
          proposals: proposalRepository,
          meetings: meetingRepository,
        },
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [],
      },
    );

    expect(dashboard.scope.selectedScopeId).toBe("missing-scope");
    expect(dashboard.projectPortfolio.total).toBe(0);
    expect(dashboard.sourceCounts).toMatchObject({
      leadershipApprovals: 0,
      executiveActions: 0,
      meetings: 0,
      decisions: 0,
    });
  });

  it("returns explicit no-permission finance state and strips sensitive finance fields", async () => {
    const dashboard = await getExecutiveDashboardData(
      { id: "legal-head-01", role: "phap_ly" },
      {
        today: new Date("2026-05-24T00:00:00.000Z"),
        repositories: {
          projects: projectRepository,
          proposals: proposalRepository,
          meetings: meetingRepository,
        },
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [],
        requireScopeAssignments: false,
      },
    );
    const serialized = JSON.stringify(dashboard);

    expect(dashboard.permissions.canViewFinance).toBe(false);
    expect(dashboard.financialSummary).toMatchObject({
      state: "no_permission",
    });
    expect(serialized).not.toContain("amountLabel");
    expect(serialized).not.toContain("cashFlowLabel");
    expect(serialized).not.toContain("budgetLabel");
    expect(serialized).not.toContain("budgetRange");
    expect(serialized).not.toContain("allocatedBudget");
    expect(serialized).not.toContain("committedBudget");
    expect(serialized).not.toContain("12 triệu");
  });

  it("keeps finance fields only for records with scoped finance grants when selected scope is all", async () => {
    const projectA = await createProject({ name: "Finance Allowed", status: "active" }, projectRepository);
    const projectB = await createProject({ name: "Finance Hidden", status: "active" }, projectRepository);
    await seedProposal({
      id: "proposal-finance-allowed",
      projectId: projectA.id,
      title: "Allowed finance proposal",
      amount: 111_000_000,
      dueDate: "2026-05-24",
    });
    await seedProposal({
      id: "proposal-finance-hidden",
      projectId: projectB.id,
      title: "Hidden finance proposal",
      amount: 222_000_000,
      dueDate: "2026-05-24",
    });

    const scopeAssignments: ScopeAssignment[] = [
      {
        id: "assignment-finance-a",
        userId: "scoped-finance",
        roleKey: "quan_ly_tai_chinh",
        permissionKeys: ["project.view", "proposal.view", "finance.view"],
        projectId: projectA.id,
        active: true,
        scopeType: "scoped",
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "assignment-proposal-b",
        userId: "scoped-finance",
        roleKey: "dau_tu_phat_trien",
        permissionKeys: ["project.view", "proposal.view"],
        projectId: projectB.id,
        active: true,
        scopeType: "scoped",
        createdAt: "",
        updatedAt: "",
      },
    ];

    const dashboard = await getExecutiveDashboardData(
      { id: "scoped-finance", role: "pending" },
      {
        today: new Date("2026-05-24T00:00:00.000Z"),
        repositories: {
          projects: projectRepository,
          proposals: proposalRepository,
          meetings: meetingRepository,
        },
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments,
        selectedScopeId: "all",
      },
    );
    const allowed = dashboard.approvalSummary.items.find(
      (item) => item.sourceId === "proposal-finance-allowed",
    );
    const hidden = dashboard.approvalSummary.items.find(
      (item) => item.sourceId === "proposal-finance-hidden",
    );

    expect(allowed).toMatchObject({
      amount: 111_000_000,
      amountLabel: "111.000.000 VND",
      financialAccess: "allowed",
    });
    expect(hidden).toMatchObject({
      financialAccess: "no_permission",
    });
    expect(hidden).not.toHaveProperty("amount");
    expect(hidden).not.toHaveProperty("amountLabel");
    expect(dashboard.financialSummary).toMatchObject({
      state: "allowed",
      access: "partial",
      visibleAmountTotal: 111_000_000,
      visibleRecordCount: 1,
    });
    expect(JSON.stringify(dashboard)).not.toContain("222000000");
  });

  it("loads proposal-backed approvals for scoped-only executive assignments", async () => {
    const projectA = await createProject({ name: "Scoped Project", status: "active" }, projectRepository);
    const projectB = await createProject({ name: "Hidden Project", status: "active" }, projectRepository);
    await seedProposal({
      id: "proposal-scoped-visible",
      projectId: projectA.id,
      title: "Visible scoped proposal",
      dueDate: "2026-05-24",
    });
    await seedProposal({
      id: "proposal-scoped-hidden",
      projectId: projectB.id,
      title: "Hidden scoped proposal",
      dueDate: "2026-05-24",
    });

    const dashboard = await getExecutiveDashboardData(
      { id: "scoped-exec", role: "pending" },
      {
        today: new Date("2026-05-24T00:00:00.000Z"),
        repositories: {
          projects: projectRepository,
          proposals: proposalRepository,
          meetings: meetingRepository,
        },
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [
          {
            id: "assignment-scoped-exec",
            userId: "scoped-exec",
            roleKey: "dau_tu_phat_trien",
            permissionKeys: ["project.view", "proposal.view"],
            projectId: projectA.id,
            active: true,
            scopeType: "scoped",
            createdAt: "",
            updatedAt: "",
          },
        ],
      },
    );

    expect(dashboard.approvalSummary.items.map((item) => item.sourceId)).toContain(
      "proposal-scoped-visible",
    );
    expect(dashboard.approvalSummary.items.map((item) => item.sourceId)).not.toContain(
      "proposal-scoped-hidden",
    );
  });

  it("counts all due approvals in deadlines before capping the approval queue and excludes drafts", async () => {
    const project = await createProject({ name: "Deadline Project", status: "active" }, projectRepository);

    for (let index = 0; index < 11; index += 1) {
      await seedProposal({
        id: `proposal-due-${index + 1}`,
        projectId: project.id,
        title: `Due proposal ${index + 1}`,
        dueDate: "2026-05-24",
      });
    }
    await seedProposal({
      id: "proposal-draft",
      projectId: project.id,
      title: "Draft proposal",
      dueDate: "2026-05-24",
      status: "draft",
    });

    const dashboard = await getExecutiveDashboardData(
      { id: "scoped-deadlines", role: "pending" },
      {
        today: new Date("2026-05-24T00:00:00.000Z"),
        repositories: {
          projects: projectRepository,
          proposals: proposalRepository,
          meetings: meetingRepository,
        },
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [
          {
            id: "assignment-deadline-project",
            userId: "scoped-deadlines",
            roleKey: "dau_tu_phat_trien",
            permissionKeys: ["project.view", "proposal.view"],
            projectId: project.id,
            active: true,
            scopeType: "scoped",
            createdAt: "",
            updatedAt: "",
          },
        ],
      },
    );

    const approvalIds = dashboard.approvalSummary.items.map((item) => item.sourceId);
    const deadlineIds = dashboard.todayDeadlines.items.map((item) => item.sourceId);

    expect(dashboard.approvalSummary.pending).toBe(11);
    expect(dashboard.approvalSummary.items).toHaveLength(10);
    expect(dashboard.todayDeadlines.today).toBe(11);
    expect(approvalIds).not.toContain("proposal-draft");
    expect(deadlineIds).not.toContain("proposal-draft");
  });

  it("adds overdue metadata to approval dashboard items", async () => {
    const project = await createProject(
      { name: "Overdue Dashboard Project", status: "active" },
      projectRepository,
    );
    await seedProposal({
      dueDate: "2026-05-20",
      id: "proposal-overdue-dashboard",
      projectId: project.id,
      title: "Overdue dashboard proposal",
    });
    const notifications = new InMemoryNotificationRepository();
    const audits: Array<Omit<AuditLog, "id" | "createdAt">> = [];

    const dashboard = await getExecutiveDashboardData(
      { id: "scoped-overdue-dashboard", role: "pending" },
      {
        approvalPolicies: [approvalPolicy()],
        auditWriter: async (input: Omit<AuditLog, "id" | "createdAt">) => {
          audits.push(input);
          return {
            ...input,
            createdAt: "2026-05-24T00:00:00.000Z",
            id: `audit-dashboard-${audits.length}`,
          };
        },
        delegations: [delegation({ projectId: project.id })],
        notificationRepository: notifications,
        today: new Date("2026-05-24T00:00:00.000Z"),
        repositories: {
          projects: projectRepository,
          proposals: proposalRepository,
          meetings: meetingRepository,
        },
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [
          {
            active: true,
            createdAt: "",
            id: "assignment-overdue-dashboard",
            permissionKeys: ["project.view", "proposal.view"],
            projectId: project.id,
            roleKey: "dau_tu_phat_trien",
            scopeType: "scoped",
            updatedAt: "",
            userId: "scoped-overdue-dashboard",
          },
        ],
      },
    );
    const overdueItem = dashboard.approvalSummary.items.find(
      (item) => item.sourceId === "proposal-overdue-dashboard",
    );

    expect(overdueItem?.overdue).toMatchObject({
      daysOverdue: 4,
      isOverdue: true,
      ownerLabel: "owner-01",
      severity: "critical",
    });
    expect(overdueItem?.overdue?.nextAction).toMatch(/escalation|nang cap/i);
    expect(overdueItem?.escalation).toMatchObject({
      notificationId: expect.any(String),
      policyId: "policy-dashboard",
      required: true,
      status: "queued",
      trigger: "long_overdue",
    });
    expect(overdueItem?.escalation?.targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "delegate", userId: "assistant-01" }),
        expect.objectContaining({ kind: "policy_escalation", roleKey: "tong_giam_doc" }),
      ]),
    );
    expect(await notifications.list()).toHaveLength(1);
    expect(audits[0].newValue).toMatchObject({
      targets: expect.arrayContaining([
        expect.objectContaining({ kind: "delegate", userId: "assistant-01" }),
      ]),
    });
  });

  it("does not queue escalation for cancelled proposal dashboard items", async () => {
    const project = await createProject(
      { name: "Cancelled Dashboard Project", status: "active" },
      projectRepository,
    );
    await seedProposal({
      dueDate: "2026-05-20",
      id: "proposal-cancelled-dashboard",
      projectId: project.id,
      status: "cancelled",
      title: "Cancelled dashboard proposal",
    });
    const notifications = new InMemoryNotificationRepository();
    const audits: Array<Omit<AuditLog, "id" | "createdAt">> = [];

    const dashboard = await getExecutiveDashboardData(
      { id: "scoped-cancelled-dashboard", role: "pending" },
      {
        approvalPolicies: [approvalPolicy()],
        auditWriter: async (input: Omit<AuditLog, "id" | "createdAt">) => {
          audits.push(input);
          return {
            ...input,
            createdAt: "2026-05-24T00:00:00.000Z",
            id: `audit-cancelled-${audits.length}`,
          };
        },
        notificationRepository: notifications,
        today: new Date("2026-05-24T00:00:00.000Z"),
        repositories: {
          projects: projectRepository,
          proposals: proposalRepository,
          meetings: meetingRepository,
        },
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [
          {
            active: true,
            createdAt: "",
            id: "assignment-cancelled-dashboard",
            permissionKeys: ["project.view", "proposal.view"],
            projectId: project.id,
            roleKey: "dau_tu_phat_trien",
            scopeType: "scoped",
            updatedAt: "",
            userId: "scoped-cancelled-dashboard",
          },
        ],
      },
    );

    expect(dashboard.approvalSummary.items.map((item) => item.sourceId)).not.toContain(
      "proposal-cancelled-dashboard",
    );
    expect(await notifications.list()).toHaveLength(0);
    expect(audits).toHaveLength(0);
  });
});
