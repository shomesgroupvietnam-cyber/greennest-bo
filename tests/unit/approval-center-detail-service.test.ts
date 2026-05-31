import { describe, expect, it } from "vitest";

import type { PermissionUser } from "@/lib/permissions/can";
import {
  getApprovalCenterDetailData,
  getApprovalCenterData,
} from "@/modules/proposals/services/approval-center-service";
import type {
  ProposalApprovalMutation,
  ProposalRepository,
} from "@/modules/proposals/services/proposal-repository";
import type {
  Proposal,
  ProposalDecision,
  ProposalDetail,
  ProposalLink,
  ProposalListFilters,
  ProposalStatus,
  ProposalStep,
  ProposalType,
} from "@/modules/proposals/types";
import { createDefaultRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-repository";
import type {
  ApprovalThresholdPolicy,
  LeadershipDelegation,
  ScopeAssignment,
} from "@/modules/settings/types";
import type { AuditLog } from "@/modules/users/types";
import type { NotificationRepository } from "@/lib/notifications/notification-service";
import type { NotificationOutboxItem } from "@/lib/notifications/types";

class InMemoryProposalRepository implements ProposalRepository {
  constructor(
    private proposals: Proposal[],
    private links: ProposalLink[] = [],
    private steps: ProposalStep[] = [],
    private decisions: ProposalDecision[] = [],
  ) {}

  async listProposals(filters: ProposalListFilters = {}) {
    return this.proposals.filter((proposal) => {
      if (filters.status && filters.status !== "all" && proposal.status !== filters.status) {
        return false;
      }

      return true;
    });
  }

  async getProposalDetail(proposalId: string): Promise<ProposalDetail | undefined> {
    const proposal = this.proposals.find((item) => item.id === proposalId);

    if (!proposal) {
      return undefined;
    }

    return {
      decisions: this.decisions
        .filter((decision) => decision.proposalId === proposalId)
        .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt)),
      links: this.links.filter((link) => link.proposalId === proposalId),
      proposal,
      steps: this.steps
        .filter((step) => step.proposalId === proposalId)
        .sort((a, b) => a.stepOrder - b.stepOrder),
    };
  }

  async createProposal(proposal: Proposal, links: ProposalLink[] = []) {
    this.proposals = [proposal, ...this.proposals];
    this.links = [...links, ...this.links];

    return { decisions: [], links, proposal, steps: [] };
  }

  async updateProposal(proposalId: string, patch: Partial<Proposal>) {
    const existing = this.proposals.find((proposal) => proposal.id === proposalId);

    if (!existing) {
      throw new Error("Missing proposal");
    }

    const updated = { ...existing, ...patch };
    this.proposals = this.proposals.map((proposal) =>
      proposal.id === proposalId ? updated : proposal,
    );

    return updated;
  }

  async addStep(step: ProposalStep) {
    this.steps = [step, ...this.steps];

    return step;
  }

  async updateStep(stepId: string, patch: Partial<ProposalStep>) {
    const existing = this.steps.find((step) => step.id === stepId);

    if (!existing) {
      throw new Error("Missing step");
    }

    const updated = { ...existing, ...patch };
    this.steps = this.steps.map((step) => (step.id === stepId ? updated : step));

    return updated;
  }

  async addDecision(decision: ProposalDecision) {
    this.decisions = [decision, ...this.decisions];

    return decision;
  }

  async addLink(link: ProposalLink) {
    this.links = [link, ...this.links];

    return link;
  }

  async applyApprovalMutation(mutation: ProposalApprovalMutation) {
    const proposal = await this.updateProposal(
      mutation.proposalId,
      mutation.proposalPatch,
    );
    const step = mutation.stepPatch
      ? await this.updateStep(mutation.stepPatch.stepId, mutation.stepPatch.patch)
      : undefined;

    if (mutation.newStep) {
      await this.addStep(mutation.newStep);
    }

    if (mutation.generatedLink) {
      await this.addLink(mutation.generatedLink);
    }

    await this.addDecision(mutation.decision);

    return {
      decision: mutation.decision,
      generatedLink: mutation.generatedLink,
      newStep: mutation.newStep,
      proposal,
      step,
    };
  }
}

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

const approver: PermissionUser = { id: "approver-01", role: "tong_giam_doc" };
const qaReviewer: PermissionUser = { id: "qa-reviewer", role: "qa_qc_chat_luong" };

function proposal(
  overrides: Partial<Proposal> & Pick<Proposal, "id" | "title">,
): Proposal {
  const { id, title, ...proposalOverrides } = overrides;

  return {
    aiReviewStatus: "not_checked",
    code: `DX-${id.toUpperCase()}`,
    createdAt: "2026-05-20T00:00:00.000Z",
    currentStepId: `${id}-step`,
    dueDate: "2026-05-30",
    id,
    module: overrides.type ?? "general",
    ownerId: "owner-01",
    priority: "high",
    projectId: "demo-project-riverside",
    requestedBy: "requester-01",
    status: "in_review",
    submittedBy: "submitter-01",
    summary: `${title} summary`,
    title,
    type: "general",
    updatedAt: "2026-05-20T00:00:00.000Z",
    ...proposalOverrides,
  };
}

function step(proposalId: string): ProposalStep {
  return {
    approvalLevel: "CEO",
    approverRole: "tong_giam_doc",
    createdAt: "2026-05-20T00:00:00.000Z",
    id: `${proposalId}-step`,
    proposalId,
    requiredPermission: "proposal.approve",
    status: "in_review",
    stepOrder: 1,
    thresholdLabel: "Policy sentinel",
    thresholdPolicyId: "policy-sentinel",
    updatedAt: "2026-05-20T00:00:00.000Z",
  };
}

function decision(
  proposalId: string,
  overrides: Partial<ProposalDecision> = {},
): ProposalDecision {
  return {
    decidedAt: "2026-05-21T08:30:00.000Z",
    decidedBy: "submitter-01",
    decision: "submitted",
    id: `${proposalId}-decision`,
    notes: "Submitted for approval",
    proposalId,
    ...overrides,
  };
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
    id: "policy-sentinel",
    labelVi: "Policy sentinel",
    policyKey: "policy_sentinel",
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
    id: "delegation-01",
    moduleId: "general",
    principalUserId: "approver-01",
    projectId: "demo-project-riverside",
    updatedAt: "2026-05-20T00:00:00.000Z",
    ...overrides,
  };
}

function scopeAssignment(overrides: Partial<ScopeAssignment> = {}): ScopeAssignment {
  return {
    active: true,
    axisId: "axis-1",
    createdAt: "",
    id: "scope-a",
    permissionKeys: ["proposal.view", "proposal.review"],
    projectId: "demo-project-riverside",
    roleKey: "qa_qc_chat_luong",
    scopeType: "scoped",
    updatedAt: "",
    userId: "qa-reviewer",
    ...overrides,
  };
}

describe("approval center detail service", () => {
  it.each<[ProposalType, string]>([
    ["document", "ho_so_van_ban"],
    ["finance", "tai_chinh_chi"],
    ["legal", "phap_ly"],
    ["design", "ky_thuat"],
    ["investment", "chien_luoc"],
  ])("builds proposal-backed detail DTO for %s approvals", async (type, category) => {
    const source = proposal({
      amount: type === "finance" ? 999_000_000 : undefined,
      id: `${type}-detail`,
      title: `${type} approval detail`,
      type,
    });
    const repository = new InMemoryProposalRepository(
      [source],
      [
        {
          createdAt: "2026-05-20T00:00:00.000Z",
          entityId: "demo-project-riverside",
          entityType: "project",
          id: "project-link",
          proposalId: source.id,
          relationType: "source",
        },
        {
          createdAt: "2026-05-20T00:00:00.000Z",
          entityId: "future-module-record",
          entityType: "axis-2-specialist-module",
          id: "future-link",
          proposalId: source.id,
          relationType: "evidence",
        },
      ],
      [step(source.id)],
      [decision(source.id)],
    );

    const detail = await getApprovalCenterDetailData(
      { sourceId: source.id, sourceType: "proposal" },
      approver,
      {
        repository,
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [
          scopeAssignment({
            permissionKeys: ["proposal.view", "project.view"],
            roleKey: "tong_giam_doc",
            userId: "approver-01",
          }),
        ],
        selectedScopeId: "scope-a",
      },
    );

    expect(detail).toMatchObject({
      source: expect.objectContaining({
        category,
        code: source.code,
        sourceId: source.id,
        sourceType: "proposal",
        title: source.title,
      }),
      policy: expect.objectContaining({
        approvalLevel: "CEO",
        requiredPermission: "proposal.approve",
        thresholdLabel: "Policy sentinel",
      }),
      requestSummary: expect.objectContaining({
        proposer: "requester-01",
        projectId: "demo-project-riverside",
        scopeLabel: expect.any(String),
      }),
    });
    expect(detail?.linkedSources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityType: "project",
          href: "/projects/demo-project-riverside",
          state: "linked",
        }),
        expect.objectContaining({
          entityType: "axis-2-specialist-module",
          href: undefined,
          state: "placeholder",
        }),
      ]),
    );
    expect(detail?.history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actorId: "submitter-01",
          kind: "decision",
          label: "submitted",
        }),
        expect.objectContaining({
          kind: "link",
          label: "Linked source: Project demo-project-riverside",
          status: "source",
        }),
      ]),
    );
    expect(JSON.stringify(detail)).not.toContain('"amount":');
  });

  it("builds meeting category detail from meeting-linked proposals", async () => {
    const source = proposal({
      id: "meeting-detail",
      module: "meeting",
      title: "Meeting approval detail",
      type: "general",
    });
    const repository = new InMemoryProposalRepository(
      [source],
      [
        {
          createdAt: "2026-05-20T00:00:00.000Z",
          entityId: "meeting-01",
          entityType: "meeting",
          id: "meeting-link",
          proposalId: source.id,
          relationType: "source",
        },
      ],
      [step(source.id)],
      [decision(source.id)],
    );

    const detail = await getApprovalCenterDetailData(
      { sourceId: source.id, sourceType: "proposal" },
      approver,
      { repository },
    );

    expect(detail?.source.category).toBe("hop");
    expect(detail?.linkedSources[0]).toMatchObject({
      href: "/meetings/meeting-01",
      state: "linked",
    });
  });

  it("redacts linked source ids and hrefs when the source is outside scope", async () => {
    const source = proposal({
      id: "linked-source-scope",
      title: "Linked source scope detail",
    });
    const repository = new InMemoryProposalRepository(
      [source],
      [
        {
          createdAt: "2026-05-20T00:00:00.000Z",
          entityId: "project-outside-scope",
          entityType: "project",
          id: "restricted-project-link",
          proposalId: source.id,
          relationType: "source",
        },
      ],
      [step(source.id)],
      [decision(source.id)],
    );

    const detail = await getApprovalCenterDetailData(
      { sourceId: source.id, sourceType: "proposal" },
      qaReviewer,
      {
        repository,
        requireScopeAssignments: true,
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [scopeAssignment()],
      },
    );
    const serialized = JSON.stringify(detail);

    expect(detail?.linkedSources[0]).toMatchObject({
      entityId: "restricted",
      href: undefined,
      state: "no_permission",
    });
    expect(serialized).not.toContain("project-outside-scope");
    expect(detail?.history.some((item) => item.kind === "link")).toBe(false);
  });

  it("includes overdue escalation summary on proposal detail and queues one mock alert when enabled", async () => {
    const source = proposal({
      dueDate: "2026-05-25",
      id: "overdue-detail",
      ownerId: "owner-01",
      title: "Overdue approval detail",
    });
    const repository = new InMemoryProposalRepository(
      [source],
      [],
      [step(source.id)],
      [decision(source.id)],
    );
    const notifications = new InMemoryNotificationRepository();
    const audits: Array<Omit<AuditLog, "id" | "createdAt">> = [];

    const detail = await getApprovalCenterDetailData(
      { sourceId: source.id, sourceType: "proposal" },
      approver,
      {
        approvalPolicies: [approvalPolicy()],
        auditWriter: async (input: Omit<AuditLog, "id" | "createdAt">) => {
          audits.push(input);
          return {
            ...input,
            createdAt: "2026-05-29T00:00:00.000Z",
            id: `audit-${audits.length}`,
          };
        },
        delegations: [delegation({ principalUserId: "requester-01" })],
        notificationRepository: notifications,
        now: new Date("2026-05-29T00:00:00+07:00"),
        queueEscalationNotifications: true,
        repository,
      },
    );

    expect(detail?.overdue).toMatchObject({
      daysOverdue: 4,
      isOverdue: true,
      severity: "critical",
    });
    expect(detail?.escalation).toMatchObject({
      policyId: "policy-sentinel",
      required: true,
      status: "queued",
      thresholdDays: 3,
      trigger: "long_overdue",
    });
    expect(detail?.escalation?.targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "delegate", userId: "assistant-01" }),
      ]),
    );
    expect(detail?.history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          auditAction: "proposal.escalation_queued",
          auditLogId: "audit-1",
        }),
      ]),
    );
    expect(await notifications.list()).toHaveLength(1);
    expect(audits).toHaveLength(1);
    expect(audits[0].newValue).toMatchObject({
      targets: expect.arrayContaining([
        expect.objectContaining({ kind: "delegate", userId: "assistant-01" }),
      ]),
      trigger: "long_overdue",
    });
  });

  it("preserves selected scope on linked proposal source hrefs", async () => {
    const source = proposal({
      id: "source-proposal",
      title: "Source approval detail",
    });
    const repository = new InMemoryProposalRepository(
      [source],
      [
        {
          createdAt: "2026-05-20T00:00:00.000Z",
          entityId: "linked-proposal",
          entityType: "proposal",
          id: "linked-proposal-source",
          proposalId: source.id,
          relationType: "dependency",
        },
      ],
      [step(source.id)],
      [decision(source.id)],
    );

    const detail = await getApprovalCenterDetailData(
      { sourceId: source.id, sourceType: "proposal" },
      approver,
      {
        repository,
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [
          scopeAssignment({
            permissionKeys: ["proposal.view"],
            roleKey: "tong_giam_doc",
            userId: "approver-01",
          }),
        ],
        selectedScopeId: "scope-a",
      },
    );

    expect(detail?.linkedSources[0]).toMatchObject({
      href: "/approvals/proposal/linked-proposal?scopeId=scope-a",
      state: "linked",
    });
  });

  it.each<ProposalStatus>(["draft", "archived"])(
    "does not return %s proposals through the approval detail route",
    async (status) => {
      const source = proposal({
        dueDate: "2026-05-25",
        id: `${status}-proposal`,
        status,
        title: `${status} approval detail`,
      });
      const repository = new InMemoryProposalRepository(
        [source],
        [],
        [step(source.id)],
        [decision(source.id)],
      );

      const detail = await getApprovalCenterDetailData(
        { sourceId: source.id, sourceType: "proposal" },
        approver,
        { repository },
      );

      expect(detail).toBeUndefined();
    },
  );

  it.each<ProposalStatus>(["approved", "rejected", "cancelled"])(
    "returns read-only detail for final %s proposals without enabled actions",
    async (status) => {
      const source = proposal({
        id: `${status}-proposal`,
        status,
        title: `${status} approval detail`,
      });
      const repository = new InMemoryProposalRepository(
        [source],
        [],
        [step(source.id)],
        [decision(source.id)],
      );
      const notifications = new InMemoryNotificationRepository();
      const audits: Array<Omit<AuditLog, "id" | "createdAt">> = [];

      const detail = await getApprovalCenterDetailData(
        { sourceId: source.id, sourceType: "proposal" },
        approver,
        {
          approvalPolicies: [approvalPolicy()],
          auditWriter: async (input: Omit<AuditLog, "id" | "createdAt">) => {
            audits.push(input);
            return {
              ...input,
              createdAt: "2026-05-29T00:00:00.000Z",
              id: `audit-final-${audits.length}`,
            };
          },
          notificationRepository: notifications,
          now: new Date("2026-05-29T00:00:00+07:00"),
          repository,
        },
      );

      expect(detail?.source.status).toBe(status);
      expect(detail?.overdue).toBeUndefined();
      expect(detail?.escalation).toBeUndefined();
      expect(detail?.permissions.availableActions.every((action) => !action.enabled)).toBe(true);
      expect(await notifications.list()).toHaveLength(0);
      expect(audits).toHaveLength(0);
    },
  );

  it("builds a stable permissioned history timeline from decisions, steps and audit logs", async () => {
    const source = proposal({
      id: "history-audit",
      title: "History audit detail",
    });
    const decidedStep = {
      ...step(source.id),
      decidedAt: "2026-05-21T08:45:00.000Z",
      decidedBy: "approver-01",
      decisionNotes: "Approved after review",
      status: "approved" as const,
    };
    const auditLogs: AuditLog[] = [
      {
        action: "proposal.approved",
        actorId: "approver-01",
        createdAt: "2026-05-21T09:00:00.000Z",
        entityId: source.id,
        entityType: "proposal",
        id: "audit-approval",
        newValue: {
          notes: "Approved after review",
          status: "approved",
          stepId: decidedStep.id,
          stepStatus: "approved",
        },
        oldValue: {
          status: "in_review",
          stepId: decidedStep.id,
          stepStatus: "in_review",
        },
      },
      {
        action: "task.updated",
        actorId: "approver-01",
        createdAt: "2026-05-21T09:30:00.000Z",
        entityId: "task-01",
        entityType: "task",
        id: "audit-other-entity",
      },
    ];
    const options = {
      auditLogs,
      repository: new InMemoryProposalRepository(
        [source],
        [],
        [decidedStep],
        [
          decision(source.id, {
            nextStatus: "in_review",
            nextStepStatus: "in_review",
            previousStatus: "draft",
            version: 1,
          }),
        ],
      ),
    };

    const detail = await getApprovalCenterDetailData(
      { sourceId: source.id, sourceType: "proposal" },
      approver,
      options,
    );

    expect(detail?.permissions.canViewAudit).toBe(true);
    expect(detail?.history.map((item) => item.id)).toEqual([
      "audit-approval",
      decidedStep.id,
      `${source.id}-decision`,
    ]);
    expect(detail?.history[0]).toMatchObject({
      auditAction: "proposal.approved",
      auditLogId: "audit-approval",
      kind: "audit",
      nextStatus: "approved",
      nextStepStatus: "approved",
      previousStatus: "in_review",
      previousStepStatus: "in_review",
    });
    expect(detail?.history[2]).toMatchObject({
      kind: "decision",
      nextStatus: "in_review",
      previousStatus: "draft",
      version: 1,
    });
    expect(JSON.stringify(detail)).not.toContain("task.updated");
  });

  it("hides raw audit events and values for users without audit.view", async () => {
    const source = proposal({
      id: "history-no-audit",
      title: "History no audit detail",
    });
    const auditLogs: AuditLog[] = [
      {
        action: "proposal.approved",
        actorId: "approver-01",
        createdAt: "2026-05-21T09:00:00.000Z",
        entityId: source.id,
        entityType: "proposal",
        id: "audit-hidden",
        newValue: { status: "approved", stepStatus: "approved" },
        oldValue: { status: "in_review", stepStatus: "in_review" },
      },
    ];
    const options = {
      auditLogs,
      requireScopeAssignments: true,
      rolePermissionCatalog: createDefaultRolePermissionCatalog(),
      scopeAssignments: [scopeAssignment()],
      repository: new InMemoryProposalRepository(
        [source],
        [],
        [step(source.id)],
        [decision(source.id)],
      ),
    };

    const detail = await getApprovalCenterDetailData(
      { sourceId: source.id, sourceType: "proposal" },
      qaReviewer,
      options,
    );
    const serialized = JSON.stringify(detail);

    expect(detail?.permissions.canViewAudit).toBe(false);
    expect(detail?.history.some((item) => item.kind === "audit")).toBe(false);
    expect(serialized).not.toContain("proposal.approved");
    expect(serialized).not.toContain("oldValue");
    expect(serialized).not.toContain("newValue");
  });

  it("includes action availability in approval detail DTOs", async () => {
    const source = proposal({
      id: "actionable-proposal",
      title: "Action availability detail",
    });
    const repository = new InMemoryProposalRepository(
      [source],
      [],
      [step(source.id)],
      [decision(source.id)],
    );

    const approverDetail = await getApprovalCenterDetailData(
      { sourceId: source.id, sourceType: "proposal" },
      approver,
      { repository },
    );
    const reviewerDetail = await getApprovalCenterDetailData(
      { sourceId: source.id, sourceType: "proposal" },
      qaReviewer,
      {
        repository,
        requireScopeAssignments: true,
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [scopeAssignment()],
      },
    );

    expect(approverDetail?.permissions.availableActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "approve", enabled: true }),
        expect.objectContaining({ action: "reject", enabled: true, requiresReason: true }),
        expect.objectContaining({ action: "request_change", enabled: true, requiresReason: true }),
        expect.objectContaining({ action: "forward", enabled: true }),
        expect.objectContaining({ action: "ask_meeting", enabled: true }),
        expect.objectContaining({ action: "hold", enabled: true }),
        expect.objectContaining({ action: "cancel", enabled: true, requiresReason: true }),
      ]),
    );
    expect(reviewerDetail?.permissions.availableActions.every((action) => !action.enabled)).toBe(true);
  });

  it("redacts finance amount from detail DTOs before serialization", async () => {
    const source = proposal({
      amount: 9_999_000_000,
      id: "finance-secret",
      title: "FINANCE_SECRET_TITLE",
      type: "finance",
    });
    const repository = new InMemoryProposalRepository(
      [source],
      [],
      [step(source.id)],
      [decision(source.id)],
    );

    const detail = await getApprovalCenterDetailData(
      { sourceId: source.id, sourceType: "proposal" },
      qaReviewer,
      {
        repository,
        requireScopeAssignments: true,
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [scopeAssignment()],
      },
    );
    const serialized = JSON.stringify(detail);

    expect(detail?.requestSummary).toMatchObject({
      financialAccess: "no_permission",
    });
    expect(detail?.requestSummary.amountLabel).toBeUndefined();
    expect(serialized).not.toContain("9999000000");
    expect(serialized).not.toContain("9,999");
  });

  it("does not return out-of-scope approval details for direct URL access", async () => {
    const repository = new InMemoryProposalRepository([
      proposal({
        amount: 9_999_000_000,
        code: "DX-OUT-OF-SCOPE",
        id: "out-of-scope",
        projectId: "project-b",
        title: "OUT_OF_SCOPE_DETAIL_SENTINEL",
      }),
    ]);
    const scopeAssignments: ScopeAssignment[] = [
      {
        active: true,
        axisId: "axis-1",
        createdAt: "",
        id: "scope-a",
        permissionKeys: ["proposal.view", "proposal.review"],
        projectId: "project-a",
        roleKey: "dau_tu_phat_trien",
        scopeType: "scoped",
        updatedAt: "",
        userId: "scoped-approver",
      },
    ];

    const detail = await getApprovalCenterDetailData(
      { sourceId: "out-of-scope", sourceType: "proposal" },
      { id: "scoped-approver", role: "viewer" },
      {
        repository,
        requireScopeAssignments: true,
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments,
      },
    );
    const serialized = JSON.stringify(detail ?? {});

    expect(detail).toBeUndefined();
    expect(serialized).not.toContain("OUT_OF_SCOPE_DETAIL_SENTINEL");
    expect(serialized).not.toContain("9999000000");
  });

  it("uses approval detail routes in queue hrefs and preserves selected scope", async () => {
    const repository = new InMemoryProposalRepository([
      proposal({ id: "queue-detail", title: "Queue detail link" }),
    ]);

    const data = await getApprovalCenterData(approver, {
      leadershipApprovals: [],
      repository,
      rolePermissionCatalog: createDefaultRolePermissionCatalog(),
      scopeAssignments: [
        scopeAssignment({
          permissionKeys: ["proposal.view"],
          roleKey: "tong_giam_doc",
          userId: "approver-01",
        }),
      ],
      selectedScopeId: "scope-a",
    });

    expect(data.tabs[0].items[0].href).toBe(
      "/approvals/proposal/queue-detail?scopeId=scope-a",
    );
  });
});
