import { describe, expect, it } from "vitest";

import type { PermissionUser } from "@/lib/permissions/can";
import { getApprovalCenterData } from "@/modules/proposals/services/approval-center-service";
import type {
  Proposal,
  ProposalAttachment,
  ProposalDecision,
  ProposalDetail,
  ProposalLink,
  ProposalListFilters,
  ProposalStep,
} from "@/modules/proposals/types";
import type {
  ProposalApprovalMutation,
  ProposalRepository,
} from "@/modules/proposals/services/proposal-repository";
import { createDefaultRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-repository";
import type {
  ApprovalThresholdPolicy,
  LeadershipDelegation,
  ScopeAssignment,
} from "@/modules/settings/types";
import type {
  NotificationOutboxItem,
} from "@/lib/notifications/types";
import type { NotificationRepository } from "@/lib/notifications/notification-service";
import type { AuditLog } from "@/modules/users/types";

class InMemoryProposalRepository implements ProposalRepository {
  private proposals: Proposal[] = [];
  private links: ProposalLink[] = [];
  private attachments: ProposalAttachment[] = [];
  private steps: ProposalStep[] = [];
  private decisions: ProposalDecision[] = [];

  constructor(
    proposals: Proposal[],
    links: ProposalLink[] = [],
    attachments: ProposalAttachment[] = [],
  ) {
    this.proposals = proposals;
    this.links = links;
    this.attachments = attachments;
  }

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
      proposal,
      steps: this.steps.filter((step) => step.proposalId === proposalId),
      links: this.links.filter((link) => link.proposalId === proposalId),
      attachments: this.attachments.filter((attachment) => attachment.proposalId === proposalId),
      decisions: this.decisions.filter((decision) => decision.proposalId === proposalId),
    };
  }

  async createProposal(
    proposal: Proposal,
    links: ProposalLink[] = [],
    attachments: ProposalAttachment[] = [],
  ) {
    this.proposals = [proposal, ...this.proposals];
    this.links = [...links, ...this.links];
    this.attachments = [...attachments, ...this.attachments];

    return {
      proposal,
      steps: [],
      links,
      attachments,
      decisions: [],
    };
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

function proposal(overrides: Partial<Proposal> & Pick<Proposal, "id" | "title">): Proposal {
  const { id, title, ...proposalOverrides } = overrides;

  return {
    aiReviewStatus: "not_checked",
    code: `DX-${id.toUpperCase()}`,
    createdAt: "2026-05-20T00:00:00.000Z",
    dueDate: "2026-05-29",
    id,
    module: overrides.type ?? "general",
    priority: "normal",
    projectId: "project-a",
    requestedBy: "requester-01",
    status: "in_review",
    submittedBy: "submitter-01",
    title,
    type: "general",
    updatedAt: "2026-05-20T00:00:00.000Z",
    ...proposalOverrides,
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
    id: "policy-a",
    labelVi: "CEO approval",
    policyKey: "ceo_approval",
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
    moduleId: "proposal",
    principalUserId: "approver-01",
    projectId: "project-a",
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
    projectId: "project-a",
    roleKey: "dau_tu_phat_trien",
    scopeType: "scoped",
    updatedAt: "",
    userId: "scoped-approver",
    ...overrides,
  };
}

describe("approval center service", () => {
  it("builds Axis 1 queue categories and placeholder tabs without approval actions", async () => {
    const repository = new InMemoryProposalRepository([
      proposal({ id: "document", title: "Document package", type: "document" }),
      proposal({ id: "finance", title: "Finance spend", type: "finance" }),
      proposal({ id: "strategy", title: "Strategy approval", type: "investment" }),
      proposal({ id: "technical", title: "Technical design", type: "design" }),
      proposal({ id: "legal", title: "Legal clearance", type: "legal" }),
      proposal({ id: "meeting", module: "meeting", title: "Meeting decision", type: "general" }),
    ]);

    const data = await getApprovalCenterData(approver, {
      now: new Date("2026-05-29T00:00:00+07:00"),
      repository,
    });
    const axisOne = data.tabs.find((tab) => tab.key === "axis_1");

    expect(axisOne).toMatchObject({
      key: "axis_1",
      state: "available",
      total: 6,
    });
    expect(axisOne?.categories.map((category) => category.key)).toEqual([
      "ho_so_van_ban",
      "tai_chinh_chi",
      "chien_luoc",
      "ky_thuat",
      "phap_ly",
      "hop",
    ]);
    expect(axisOne?.categories.every((category) => category.total === 1)).toBe(true);
    expect(axisOne?.items.map((item) => item.category)).toEqual(
      expect.arrayContaining([
        "ho_so_van_ban",
        "tai_chinh_chi",
        "chien_luoc",
        "ky_thuat",
        "phap_ly",
        "hop",
      ]),
    );
    expect(JSON.stringify(data)).not.toMatch(/approve|reject|requestChange/i);
    expect(data.tabs.find((tab) => tab.key === "axis_2")).toMatchObject({
      state: "placeholder",
      total: 0,
      items: [],
    });
    expect(data.tabs.find((tab) => tab.key === "axis_3")).toMatchObject({
      state: "placeholder",
      total: 0,
      items: [],
    });
  });

  it("maps contract proposals into the finance spend category", async () => {
    const repository = new InMemoryProposalRepository([
      proposal({ id: "contract", title: "Contract payment approval", type: "contract" }),
    ]);

    const data = await getApprovalCenterData(approver, {
      now: new Date("2026-05-29T00:00:00+07:00"),
      repository,
    });

    expect(data.tabs[0].items[0]).toMatchObject({
      category: "tai_chinh_chi",
      sourceId: "contract",
    });
  });

  it("surfaces the current proposal approver in queue metadata", async () => {
    const repository = new InMemoryProposalRepository([
      proposal({
        currentStepId: "current-review-step",
        id: "reviewer-metadata",
        title: "Proposal with reviewer metadata",
      }),
    ]);
    await repository.addStep({
      approvalLevel: "CEO",
      approverRole: "tong_giam_doc",
      createdAt: "2026-05-20T00:00:00.000Z",
      id: "current-review-step",
      proposalId: "reviewer-metadata",
      requiredPermission: "proposal.approve",
      status: "in_review",
      stepOrder: 1,
      updatedAt: "2026-05-20T00:00:00.000Z",
    });

    const data = await getApprovalCenterData(approver, {
      now: new Date("2026-05-29T00:00:00+07:00"),
      repository,
    });

    expect(data.tabs[0].items[0]).toMatchObject({
      reviewerLabel: "tong_giam_doc",
      sourceId: "reviewer-metadata",
    });
  });

  it("surfaces attachment counts and deadline compliance on proposal queue items", async () => {
    const repository = new InMemoryProposalRepository(
      [
        proposal({
          id: "attachment-ready",
          title: "Attachment ready proposal",
        }),
        proposal({
          dueDate: undefined,
          id: "missing-deadline",
          title: "Missing deadline proposal",
        }),
      ],
      [],
      [
        {
          createdAt: "2026-05-20T00:00:00.000Z",
          id: "attachment-01",
          name: "Ho so approval.pdf",
          proposalId: "attachment-ready",
          source: "external_url",
          url: "https://example.com/ho-so-approval.pdf",
          uploadedAt: "2026-05-20T00:00:00.000Z",
          uploadedBy: "requester-01",
        },
      ],
    );

    const data = await getApprovalCenterData(approver, {
      now: new Date("2026-05-29T00:00:00+07:00"),
      repository,
    });
    const ready = data.tabs[0].items.find((item) => item.sourceId === "attachment-ready");
    const missing = data.tabs[0].items.find((item) => item.sourceId === "missing-deadline");

    expect(ready).toMatchObject({
      attachmentCount: 1,
      deadlineCompliance: "valid",
    });
    expect(missing).toMatchObject({
      attachmentCount: 0,
      deadlineCompliance: "missing_required",
      dueLabel: "Thieu deadline",
    });
    expect(JSON.stringify(data)).not.toContain("No due date");
  });

  it("uses updatedAt as the deterministic tie-breaker after due date", async () => {
    const repository = new InMemoryProposalRepository([
      proposal({
        id: "older",
        title: "Older update",
        updatedAt: "2026-05-20T00:00:00.000Z",
      }),
      proposal({
        id: "newer",
        title: "Newer update",
        updatedAt: "2026-05-21T00:00:00.000Z",
      }),
    ]);

    const data = await getApprovalCenterData(approver, {
      now: new Date("2026-05-29T00:00:00+07:00"),
      repository,
    });

    expect(data.tabs[0].items.map((item) => item.sourceId)).toEqual([
      "newer",
      "older",
    ]);
  });

  it("filters queue DTOs by selected scope before returning JSON", async () => {
    const repository = new InMemoryProposalRepository([
      proposal({
        code: "DX-IN-SCOPE",
        id: "in-scope",
        projectId: "project-a",
        title: "IN_SCOPE_SENTINEL",
      }),
      proposal({
        code: "DX-OUT-OF-SCOPE",
        id: "out-of-scope",
        projectId: "project-b",
        title: "OUT_OF_SCOPE_SENTINEL",
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

    const data = await getApprovalCenterData(
      { id: "scoped-approver", role: "viewer" },
      {
        requireScopeAssignments: true,
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments,
        repository,
      },
    );

    expect(JSON.stringify(data)).toContain("IN_SCOPE_SENTINEL");
    expect(JSON.stringify(data)).not.toContain("OUT_OF_SCOPE_SENTINEL");
    expect(data.tabs[0].items).toHaveLength(1);
  });

  it("does not let reviewer roles fall back to the global proposal queue without scope", async () => {
    const repository = new InMemoryProposalRepository([
      proposal({
        code: "DX-GLOBAL-LEAK",
        id: "global-leak",
        projectId: "project-b",
        title: "GLOBAL_REVIEWER_LEAK_SENTINEL",
      }),
    ]);

    const data = await getApprovalCenterData(
      { id: "investment-reviewer", role: "dau_tu_phat_trien" },
      {
        repository,
      },
    );

    expect(data.permissions.canView).toBe(false);
    expect(JSON.stringify(data)).not.toContain("GLOBAL_REVIEWER_LEAK_SENTINEL");
    expect(data.tabs[0].items).toEqual([]);
  });

  it("redacts finance data for users without finance.view before rendering", async () => {
    const repository = new InMemoryProposalRepository([
      proposal({
        amount: 9_999_000_000,
        code: "DX-FINANCE-SECRET",
        id: "finance-secret",
        title: "Finance approval without finance permission",
        type: "finance",
      }),
    ]);

    const data = await getApprovalCenterData(
      { id: "qa-user", role: "qa_qc_chat_luong" },
      {
        requireScopeAssignments: true,
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [
          scopeAssignment({
            permissionKeys: ["proposal.view", "proposal.review"],
            roleKey: "qa_qc_chat_luong",
            userId: "qa-user",
          }),
        ],
        repository,
      },
    );
    const serialized = JSON.stringify(data);
    const financeItem = data.tabs[0].items[0];

    expect(financeItem).toMatchObject({
      category: "tai_chinh_chi",
      financialAccess: "no_permission",
    });
    expect(financeItem.amountLabel).toBeUndefined();
    expect(serialized).not.toContain("9999000000");
    expect(serialized).not.toContain("9,999");
  });

  it("marks long-overdue approvals with escalation metadata and queues one mock alert", async () => {
    const repository = new InMemoryProposalRepository([
      proposal({
        currentStepId: "overdue-step",
        dueDate: "2026-05-25",
        id: "overdue-approval",
        module: "proposal",
        ownerId: "owner-01",
        requestedBy: "requester-01",
        title: "Overdue approval",
      }),
    ]);
    await repository.addStep({
      approvalLevel: "CEO",
      approverRole: "tong_giam_doc",
      approverUserId: "approver-01",
      createdAt: "2026-05-20T00:00:00.000Z",
      id: "overdue-step",
      proposalId: "overdue-approval",
      requiredPermission: "proposal.approve",
      status: "in_review",
      stepOrder: 1,
      thresholdLabel: "CEO approval",
      thresholdPolicyId: "policy-a",
      updatedAt: "2026-05-20T00:00:00.000Z",
    });
    const notifications = new InMemoryNotificationRepository();
    const audits: Array<Omit<AuditLog, "id" | "createdAt">> = [];
    const options = {
      approvalPolicies: [approvalPolicy()],
      auditWriter: async (input: Omit<AuditLog, "id" | "createdAt">) => {
        audits.push(input);
        return {
          ...input,
          createdAt: "2026-05-29T00:00:00.000Z",
          id: `audit-${audits.length}`,
        };
      },
      delegations: [delegation()],
      notificationRepository: notifications,
      now: new Date("2026-05-29T00:00:00+07:00"),
      queueEscalationNotifications: true,
      repository,
    };

    const first = await getApprovalCenterData(approver, options);
    const second = await getApprovalCenterData(approver, options);
    const item = first.tabs[0].items[0];

    expect(item.overdue).toMatchObject({
      daysOverdue: 4,
      isOverdue: true,
      severity: "critical",
    });
    expect(item.escalation).toMatchObject({
      policyId: "policy-a",
      required: true,
      status: "queued",
      thresholdDays: 3,
      trigger: "long_overdue",
    });
    expect(item.escalation?.notificationId).toBeDefined();
    expect(item.escalation?.targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "current_approver",
          userId: "approver-01",
        }),
        expect.objectContaining({ kind: "proposer", userId: "requester-01" }),
        expect.objectContaining({ kind: "owner", userId: "owner-01" }),
        expect.objectContaining({
          delegationId: "delegation-01",
          kind: "delegate",
          userId: "assistant-01",
        }),
      ]),
    );
    expect(await notifications.list()).toHaveLength(1);
    expect((await notifications.list())[0]).toMatchObject({
      moduleId: "proposal",
      projectId: "project-a",
      recordId: "overdue-approval",
    });
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      action: "proposal.escalation_queued",
      entityId: "overdue-approval",
      entityType: "proposal",
    });
    expect(audits[0].newValue).toMatchObject({
      policyId: "policy-a",
      targetCount: 5,
      targets: expect.arrayContaining([
        expect.objectContaining({ kind: "current_approver", userId: "approver-01" }),
        expect.objectContaining({ kind: "delegate", userId: "assistant-01" }),
        expect.objectContaining({ kind: "policy_escalation", roleKey: "tong_giam_doc" }),
      ]),
      trigger: "long_overdue",
    });
    expect(second.tabs[0].items[0].escalation?.notificationId).toBe(
      item.escalation?.notificationId,
    );
    expect(audits).toHaveLength(1);
    const [storedNotification] = await notifications.list();

    await notifications.upsert({ ...storedNotification, status: "acknowledged" });
    const third = await getApprovalCenterData(approver, options);

    expect(third.tabs[0].items[0].escalation?.status).toBe("acknowledged");
    expect(audits).toHaveLength(1);
  });

  it("keeps legacy leadership approvals outside the Approval Center service contract", async () => {
    const notifications = new InMemoryNotificationRepository();
    const audits: Array<Omit<AuditLog, "id" | "createdAt">> = [];

    const data = await getApprovalCenterData(approver, {
      approvalPolicies: [
        approvalPolicy({
          approvalLevel: "CEO",
          approverRoleKey: "tong_giam_doc",
          escalateAfterDays: 3,
          labelVi: "CEO only",
        }),
      ],
      auditWriter: async (input: Omit<AuditLog, "id" | "createdAt">) => {
        audits.push(input);
        return {
          ...input,
          createdAt: "2026-05-29T00:00:00.000Z",
          id: `audit-unmatched-${audits.length}`,
        };
      },
      notificationRepository: notifications,
      now: new Date("2026-05-29T00:00:00+07:00"),
      repository: new InMemoryProposalRepository([]),
    });

    expect(data.tabs[0].items).toEqual([]);
    expect(JSON.stringify(data)).not.toContain("leadership_approval");
    expect(await notifications.list()).toHaveLength(0);
    expect(audits).toHaveLength(0);
  });
});
