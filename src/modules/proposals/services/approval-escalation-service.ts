import type {
  ApprovalEscalationState,
  ApprovalEscalationTarget,
  ApprovalOverdueSeverity,
  ApprovalOverdueState,
} from "@/modules/executive/types";
import type {
  LeadershipDelegation,
  PolicyScope,
  RiskSeverity,
} from "@/modules/settings/types";
import { businessDaysBetween } from "@/lib/date/business-day";

type ApprovalOverdueInput = {
  dueDate?: string;
  now?: Date;
  ownerLabel?: string;
  policyLabel?: string;
  thresholdDays?: number;
};

type ApprovalEscalationPolicy = {
  id?: string;
  label?: string;
  roleKey?: string;
  escalateAfterDays?: number;
  escalateOnRiskLevels?: RiskSeverity[];
};

type ApprovalEscalationPrincipal = {
  label?: string;
  roleKey?: string;
  userId?: string;
};

type ApprovalEscalationInput = {
  currentApprover?: ApprovalEscalationPrincipal;
  delegations?: LeadershipDelegation[];
  delegationPrincipalIds?: string[];
  now?: Date;
  ownerId?: string;
  overdue: ApprovalOverdueState;
  policy?: ApprovalEscalationPolicy;
  proposerId?: string;
  riskLevel?: RiskSeverity;
  scope?: PolicyScope;
  notificationId?: string;
};

function severityFor(daysOverdue: number, thresholdDays?: number): ApprovalOverdueSeverity {
  if (daysOverdue < 0) {
    return "none";
  }

  if (daysOverdue === 0) {
    return "warning";
  }

  if (thresholdDays !== undefined && daysOverdue >= thresholdDays) {
    return "critical";
  }

  return "overdue";
}

export function resolveApprovalOverdueState(
  input: ApprovalOverdueInput,
): ApprovalOverdueState {
  const ownerLabel = input.ownerLabel ?? "Chua gan owner";
  const now = input.now ?? new Date();
  const daysOverdue = businessDaysBetween(input.dueDate, now);

  if (daysOverdue === undefined) {
    return {
      daysOverdue: 0,
      isOverdue: false,
      nextAction: "Dat deadline hop le de theo doi approval.",
      ownerLabel,
      reason: "Approval chua co deadline hop le.",
      severity: "none",
    };
  }

  const severity = severityFor(daysOverdue, input.thresholdDays);
  const isOverdue = daysOverdue > 0;
  const policyReason = input.policyLabel ? ` theo ${input.policyLabel}` : "";

  if (!isOverdue) {
    return {
      daysOverdue: 0,
      isOverdue: false,
      nextAction:
        severity === "warning"
          ? "Theo doi deadline hom nay va chuan bi action neu can."
          : "Tiep tuc theo doi approval theo deadline.",
      ownerLabel,
      reason:
        severity === "warning"
          ? `Approval den han hom nay${policyReason}.`
          : "Approval chua qua han.",
      severity,
    };
  }

  const shouldEscalate =
    input.thresholdDays !== undefined && daysOverdue >= input.thresholdDays;

  return {
    daysOverdue,
    isOverdue,
    nextAction: shouldEscalate
      ? "Kiem tra escalation queue va nang cap theo policy."
      : "Lien he owner/nguoi duyet de xu ly approval qua han.",
    ownerLabel,
    reason: `Qua han ${daysOverdue} ngay${policyReason}.`,
    severity,
  };
}

function dimensionMatches(expected: string | undefined, actual: string | undefined) {
  if (!expected) {
    return true;
  }

  if (!actual) {
    return false;
  }

  return expected === "*" || expected === actual;
}

function delegationMatchesScope(
  delegation: LeadershipDelegation,
  scope: PolicyScope | undefined,
) {
  if (!scope) {
    return true;
  }

  return (
    dimensionMatches(delegation.organizationId, scope.organizationId) &&
    dimensionMatches(delegation.projectId, scope.projectId) &&
    dimensionMatches(delegation.axisId, scope.axisId) &&
    dimensionMatches(delegation.workstreamId, scope.workstreamId) &&
    dimensionMatches(delegation.moduleId, scope.moduleId) &&
    dimensionMatches(delegation.recordId, scope.recordId)
  );
}

function addUniqueTarget(
  targets: ApprovalEscalationTarget[],
  target: ApprovalEscalationTarget,
) {
  const key = `${target.kind}:${target.userId ?? ""}:${target.roleKey ?? ""}:${target.delegationId ?? ""}`;

  if (
    targets.some(
      (item) =>
        `${item.kind}:${item.userId ?? ""}:${item.roleKey ?? ""}:${item.delegationId ?? ""}` ===
        key,
    )
  ) {
    return;
  }

  targets.push(target);
}

function activeDelegationsForPrincipals(
  delegations: LeadershipDelegation[],
  principals: Set<string>,
  scope: PolicyScope | undefined,
  now: Date,
) {
  return delegations.filter((delegation) => {
    if (!delegation.active || !principals.has(delegation.principalUserId)) {
      return false;
    }

    if (delegation.startsAt && new Date(delegation.startsAt).getTime() > now.getTime()) {
      return false;
    }

    if (delegation.endsAt && new Date(delegation.endsAt).getTime() < now.getTime()) {
      return false;
    }

    return delegationMatchesScope(delegation, scope);
  });
}

export function resolveApprovalEscalationState(
  input: ApprovalEscalationInput,
): ApprovalEscalationState {
  const thresholdDays = input.policy?.escalateAfterDays;
  const riskMatches =
    input.riskLevel !== undefined &&
    (input.policy?.escalateOnRiskLevels ?? []).includes(input.riskLevel);
  const longOverdue =
    input.overdue.isOverdue &&
    thresholdDays !== undefined &&
    input.overdue.daysOverdue >= thresholdDays;
  const required = longOverdue || riskMatches;

  if (!required) {
    return {
      required: false,
      status: "none",
      targets: [],
      thresholdDays,
      trigger: "none",
    };
  }

  const now = input.now ?? new Date();
  const targets: ApprovalEscalationTarget[] = [];
  const principals = new Set<string>();

  if (input.currentApprover?.userId) {
    principals.add(input.currentApprover.userId);
    addUniqueTarget(targets, {
      kind: "current_approver",
      label: input.currentApprover.label ?? input.currentApprover.userId,
      roleKey: input.currentApprover.roleKey,
      scopeMatched: true,
      userId: input.currentApprover.userId,
    });
  } else if (input.currentApprover?.roleKey) {
    addUniqueTarget(targets, {
      kind: "current_approver",
      label: input.currentApprover.label ?? input.currentApprover.roleKey,
      roleKey: input.currentApprover.roleKey,
      scopeMatched: true,
    });
  }

  if (input.proposerId) {
    principals.add(input.proposerId);
    addUniqueTarget(targets, {
      kind: "proposer",
      label: input.proposerId,
      scopeMatched: true,
      userId: input.proposerId,
    });
  }

  if (input.ownerId) {
    principals.add(input.ownerId);
    addUniqueTarget(targets, {
      kind: "owner",
      label: input.ownerId,
      scopeMatched: true,
      userId: input.ownerId,
    });
  }

  for (const principalId of input.delegationPrincipalIds ?? []) {
    principals.add(principalId);
  }

  for (const delegation of activeDelegationsForPrincipals(
    input.delegations ?? [],
    principals,
    input.scope,
    now,
  )) {
    addUniqueTarget(targets, {
      delegationId: delegation.id,
      kind: "delegate",
      label: delegation.delegateUserId,
      scopeMatched: true,
      userId: delegation.delegateUserId,
    });
  }

  if (input.policy?.roleKey) {
    addUniqueTarget(targets, {
      kind: "policy_escalation",
      label: input.policy.roleKey,
      roleKey: input.policy.roleKey,
      scopeMatched: true,
    });
  }

  const trigger =
    longOverdue && riskMatches
      ? "critical_overdue"
      : longOverdue
        ? "long_overdue"
        : "risk_policy";

  return {
    notificationId: input.notificationId,
    policyId: input.policy?.id,
    policyLabel: input.policy?.label,
    reason: riskMatches
      ? `${input.overdue.reason} Risk ${input.riskLevel} nam trong policy escalation.`
      : input.overdue.reason,
    required: true,
    status: input.notificationId ? "queued" : "none",
    targets,
    thresholdDays,
    trigger,
  };
}
