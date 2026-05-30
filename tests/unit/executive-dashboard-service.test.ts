import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getExecutiveDashboardData } from "@/modules/dashboard/services/executive-dashboard-service";
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
