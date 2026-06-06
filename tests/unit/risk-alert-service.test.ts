import { describe, expect, it } from "vitest";

import {
  resolveRiskEscalationPolicyForRecord,
  resolveRiskEscalationState,
  resolveRiskOverdueState,
} from "@/modules/executive/services/risk-alert-service";
import type { ExecutiveRiskRecord } from "@/modules/executive/types";
import type { ApprovalThresholdPolicy, LeadershipDelegation } from "@/modules/settings/types";

const now = new Date("2026-06-02T03:00:00.000Z");

function riskRecord(patch: Partial<ExecutiveRiskRecord> = {}): ExecutiveRiskRecord {
  return {
    categoryKey: "legal",
    createdAt: "2026-05-20T00:00:00.000Z",
    createdBy: "ceo-01",
    deadline: "2026-05-29",
    id: "risk-01",
    level: "high",
    moduleId: "risk",
    nextAction: "Lam viec voi owner de chot phuong an xu ly.",
    ownerId: "owner-01",
    ownerName: "Owner One",
    projectId: "project-a",
    reason: "Cham xu ly risk phap ly.",
    recordType: "risk",
    status: "open",
    title: "Risk phap ly qua han",
    updatedAt: "2026-05-20T00:00:00.000Z",
    updatedBy: "ceo-01",
    ...patch,
  };
}

function policy(patch: Partial<ApprovalThresholdPolicy> = {}): ApprovalThresholdPolicy {
  return {
    active: true,
    approvalLevel: "CEO",
    approverRoleKey: "tong_giam_doc",
    createdAt: "2026-05-20T00:00:00.000Z",
    currency: "VND",
    escalateAfterDays: 3,
    escalateOnRiskLevels: ["high", "critical"],
    id: "policy-risk",
    labelVi: "Risk general policy",
    policyKey: "risk_general_policy",
    priority: 10,
    requiredPermissionKey: "risk.view",
    targetType: "general",
    updatedAt: "2026-05-20T00:00:00.000Z",
    ...patch,
  };
}

function delegation(patch: Partial<LeadershipDelegation> = {}): LeadershipDelegation {
  return {
    actionKeys: ["risk.update"],
    active: true,
    createdAt: "2026-05-20T00:00:00.000Z",
    delegateUserId: "assistant-01",
    id: "delegation-risk",
    principalUserId: "owner-01",
    projectId: "project-a",
    updatedAt: "2026-05-20T00:00:00.000Z",
    ...patch,
  };
}

describe("risk alert service", () => {
  it("calculates date-only overdue state and handles invalid or due-today deadlines", () => {
    expect(resolveRiskOverdueState({
      deadline: "2026-05-29",
      nextAction: "Xu ly blocker",
      now,
      ownerLabel: "Owner One",
      thresholdDays: 3,
    })).toMatchObject({
      daysOverdue: 4,
      isOverdue: true,
      nextAction: "Xu ly blocker",
      ownerLabel: "Owner One",
      severity: "critical",
    });

    expect(resolveRiskOverdueState({
      deadline: "2026-06-02",
      now,
      ownerLabel: "Owner One",
    })).toMatchObject({
      daysOverdue: 0,
      isOverdue: false,
      severity: "warning",
    });

    expect(resolveRiskOverdueState({
      deadline: "not-a-date",
      now,
      ownerLabel: "Owner One",
    })).toMatchObject({
      daysOverdue: 0,
      isOverdue: false,
      severity: "none",
    });
  });

  it("resolves deterministic matching risk escalation policy by scope and priority", () => {
    const match = resolveRiskEscalationPolicyForRecord(riskRecord(), [
      policy({ id: "policy-late", priority: 50 }),
      policy({ id: "policy-wrong-project", priority: 1, projectId: "project-b" }),
      policy({ id: "policy-project", priority: 20, projectId: "project-a" }),
      policy({ id: "policy-inactive", active: false, priority: 0, projectId: "project-a" }),
    ]);

    expect(match).toMatchObject({
      id: "policy-project",
      labelVi: "Risk general policy",
    });
  });

  it("builds escalation targets from owner, active scoped delegations and matched policy role", () => {
    const record = riskRecord();
    const overdue = resolveRiskOverdueState({
      deadline: record.deadline,
      nextAction: record.nextAction,
      now,
      ownerLabel: record.ownerName,
      thresholdDays: 3,
    });
    const escalation = resolveRiskEscalationState({
      delegations: [
        delegation(),
        delegation({ id: "delegation-hidden", delegateUserId: "assistant-hidden", projectId: "project-b" }),
      ],
      now,
      overdue,
      policy: policy(),
      record,
      scope: { projectId: "project-a", moduleId: "risk", recordId: record.id },
    });

    expect(escalation).toMatchObject({
      policyId: "policy-risk",
      policyLabel: "Risk general policy",
      required: true,
      status: "none",
      thresholdDays: 3,
      trigger: "critical_overdue",
    });
    expect(escalation.targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "owner", userId: "owner-01" }),
        expect.objectContaining({ kind: "delegate", userId: "assistant-01" }),
        expect.objectContaining({ kind: "policy_escalation", roleKey: "tong_giam_doc" }),
      ]),
    );
    expect(escalation.targets).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: "assistant-hidden" }),
      ]),
    );
  });

  it("does not require escalation for high risks before they are overdue", () => {
    const record = riskRecord({ deadline: "2026-06-05", level: "critical" });
    const overdue = resolveRiskOverdueState({
      deadline: record.deadline,
      nextAction: record.nextAction,
      now,
      ownerLabel: record.ownerName,
      thresholdDays: 3,
    });
    const escalation = resolveRiskEscalationState({
      overdue,
      policy: policy(),
      record,
    });

    expect(overdue).toMatchObject({
      isOverdue: false,
      severity: "none",
    });
    expect(escalation).toMatchObject({
      required: false,
      status: "none",
      trigger: "none",
    });
  });

  it("ignores terminal records for active overdue escalation", () => {
    const record = riskRecord({ status: "closed" });
    const overdue = resolveRiskOverdueState({
      deadline: record.deadline,
      now,
      ownerLabel: record.ownerName,
      recordStatus: record.status,
    });
    const escalation = resolveRiskEscalationState({
      overdue,
      policy: policy(),
      record,
    });

    expect(overdue).toMatchObject({
      daysOverdue: 0,
      isOverdue: false,
      severity: "none",
    });
    expect(escalation).toMatchObject({
      required: false,
      status: "none",
      trigger: "none",
    });
  });
});
