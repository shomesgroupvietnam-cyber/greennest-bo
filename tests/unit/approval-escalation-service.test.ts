import { describe, expect, it } from "vitest";

import {
  resolveApprovalEscalationState,
  resolveApprovalOverdueState,
} from "@/modules/proposals/services/approval-escalation-service";
import type { LeadershipDelegation } from "@/modules/settings/types";

const now = new Date("2026-05-29T00:00:00+07:00");

function delegation(
  overrides: Partial<LeadershipDelegation>,
): LeadershipDelegation {
  return {
    actionKeys: ["proposal.create"],
    active: true,
    createdAt: "2026-05-20T00:00:00.000Z",
    delegateUserId: "assistant-01",
    id: "delegation-01",
    principalUserId: "approver-01",
    projectId: "project-a",
    moduleId: "proposal",
    updatedAt: "2026-05-20T00:00:00.000Z",
    ...overrides,
  };
}

describe("approval escalation service", () => {
  it("calculates overdue days, severity, reason, owner and next action from date-only deadlines", () => {
    const overdue = resolveApprovalOverdueState({
      dueDate: "2026-05-25",
      now,
      ownerLabel: "owner-01",
      policyLabel: "CEO approval",
      thresholdDays: 3,
    });

    expect(overdue).toMatchObject({
      daysOverdue: 4,
      isOverdue: true,
      ownerLabel: "owner-01",
      severity: "critical",
    });
    expect(overdue.reason).toContain("Qua han 4 ngay");
    expect(overdue.reason).toContain("CEO approval");
    expect(overdue.nextAction).toMatch(/escalation|nang cap/i);
  });

  it("does not mark missing, invalid or non-overdue deadlines as overdue", () => {
    expect(
      resolveApprovalOverdueState({ dueDate: undefined, now }).isOverdue,
    ).toBe(false);
    expect(
      resolveApprovalOverdueState({ dueDate: "not-a-date", now }).isOverdue,
    ).toBe(false);
    expect(
      resolveApprovalOverdueState({ dueDate: "2026-05-29", now }).severity,
    ).toBe("warning");
  });

  it("treats date-only due dates as business calendar days across runtime time zones", () => {
    const overdue = resolveApprovalOverdueState({
      dueDate: "2026-05-25",
      now: new Date("2026-05-28T17:00:00.000Z"),
      thresholdDays: 3,
    });

    expect(overdue).toMatchObject({
      daysOverdue: 4,
      isOverdue: true,
      severity: "critical",
    });
  });

  it("resolves long-overdue escalation targets and filters delegates by scope", () => {
    const overdue = resolveApprovalOverdueState({
      dueDate: "2026-05-25",
      now,
      ownerLabel: "owner-01",
      thresholdDays: 3,
    });
    const escalation = resolveApprovalEscalationState({
      currentApprover: {
        label: "Tong giam doc",
        roleKey: "tong_giam_doc",
        userId: "approver-01",
      },
      delegations: [
        delegation({ delegateUserId: "assistant-in-scope" }),
        delegation({
          delegateUserId: "assistant-out-of-scope",
          id: "delegation-out",
          projectId: "project-b",
        }),
      ],
      now,
      ownerId: "owner-01",
      overdue,
      policy: {
        escalateAfterDays: 3,
        id: "policy-a",
        label: "CEO approval",
        roleKey: "tong_giam_doc",
      },
      proposerId: "requester-01",
      scope: {
        projectId: "project-a",
        moduleId: "proposal",
        recordId: "proposal-a",
      },
    });

    expect(escalation).toMatchObject({
      policyId: "policy-a",
      required: true,
      thresholdDays: 3,
      trigger: "long_overdue",
    });
    expect(escalation.targets).toEqual(
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
          userId: "assistant-in-scope",
        }),
        expect.objectContaining({
          kind: "policy_escalation",
          roleKey: "tong_giam_doc",
        }),
      ]),
    );
    expect(
      escalation.targets.some((target) => target.userId === "assistant-out-of-scope"),
    ).toBe(false);
  });

  it("uses policy risk configuration to trigger escalation before long-overdue threshold", () => {
    const overdue = resolveApprovalOverdueState({
      dueDate: "2026-05-28",
      now,
      thresholdDays: 5,
    });
    const escalation = resolveApprovalEscalationState({
      overdue,
      policy: {
        escalateAfterDays: 5,
        escalateOnRiskLevels: ["high", "critical"],
        id: "policy-risk",
        label: "Risk policy",
      },
      riskLevel: "high",
      proposerId: "requester-01",
      scope: { projectId: "project-a", moduleId: "proposal" },
    });

    expect(escalation).toMatchObject({
      policyId: "policy-risk",
      required: true,
      trigger: "risk_policy",
    });
    expect(escalation.reason).toMatch(/risk/i);
  });

  it("includes in-scope delegates for additional principals without adding fake direct targets", () => {
    const overdue = resolveApprovalOverdueState({
      dueDate: "2026-05-25",
      now,
      thresholdDays: 3,
    });
    const escalation = resolveApprovalEscalationState({
      delegationPrincipalIds: ["submitter-01", "on-behalf-01"],
      delegations: [
        delegation({
          delegateUserId: "submitter-assistant",
          id: "delegation-submitter",
          principalUserId: "submitter-01",
        }),
      ],
      now,
      overdue,
      policy: {
        escalateAfterDays: 3,
        id: "policy-a",
        label: "CEO approval",
      },
      scope: { projectId: "project-a", moduleId: "proposal" },
    });

    expect(escalation.targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          delegationId: "delegation-submitter",
          kind: "delegate",
          userId: "submitter-assistant",
        }),
      ]),
    );
    expect(escalation.targets.some((target) => target.userId === "submitter-01")).toBe(false);
  });
});
