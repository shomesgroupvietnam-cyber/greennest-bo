import { businessDaysBetween } from "@/lib/date/business-day";
import type {
  ApprovalEscalationState,
  ApprovalEscalationTarget,
  ApprovalOverdueSeverity,
  ApprovalOverdueState,
  ExecutiveRiskRecord,
} from "@/modules/executive/types";
import type {
  ApprovalThresholdPolicy,
  LeadershipDelegation,
  PolicyScope,
} from "@/modules/settings/types";

type RiskOverdueInput = {
  deadline?: string;
  nextAction?: string;
  now?: Date;
  ownerLabel?: string;
  policyLabel?: string;
  recordStatus?: ExecutiveRiskRecord["status"];
  thresholdDays?: number;
};

type RiskEscalationInput = {
  delegations?: LeadershipDelegation[];
  notificationId?: string;
  now?: Date;
  overdue: ApprovalOverdueState;
  policy?: ApprovalThresholdPolicy;
  record: ExecutiveRiskRecord;
  scope?: PolicyScope;
};

const terminalRiskStatuses = new Set<ExecutiveRiskRecord["status"]>([
  "closed",
  "resolved",
]);

const scopeKeys = [
  "organizationId",
  "projectId",
  "axisId",
  "workstreamId",
  "moduleId",
  "recordId",
] as const;

function isTerminalRiskStatus(status: ExecutiveRiskRecord["status"] | undefined) {
  return Boolean(status && terminalRiskStatuses.has(status));
}

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

function dimensionMatches(expected: string | undefined, actual: string | undefined) {
  if (!expected) {
    return true;
  }

  if (!actual) {
    return false;
  }

  return expected === "*" || expected === actual;
}

function scopeMatchesPolicy(policy: ApprovalThresholdPolicy, scope: PolicyScope) {
  return scopeKeys.every((key) => dimensionMatches(policy[key], scope[key]));
}

function scopeScore(policy: ApprovalThresholdPolicy, scope: PolicyScope) {
  let score = 0;

  for (const key of scopeKeys) {
    const policyValue = policy[key];

    if (!policyValue) {
      continue;
    }

    if (!dimensionMatches(policyValue, scope[key])) {
      return -1;
    }

    score += policyValue === "*" ? 1 : 2;
  }

  return score;
}

function recordScope(record: ExecutiveRiskRecord): PolicyScope {
  return {
    axisId: record.axisId,
    moduleId: record.moduleId,
    organizationId: record.organizationId,
    projectId: record.projectId,
    recordId: record.id,
    workstreamId: record.workstreamId,
  };
}

function hasEscalationConfig(policy: ApprovalThresholdPolicy) {
  return (
    policy.escalateAfterDays !== undefined ||
    (policy.escalateOnRiskLevels ?? []).length > 0
  );
}

function targetTypeScore(policy: ApprovalThresholdPolicy) {
  return policy.targetType === "general" ? 1 : 0;
}

function delegationMatchesScope(
  delegation: LeadershipDelegation,
  scope: PolicyScope | undefined,
) {
  if (!scope) {
    return true;
  }

  return scopeKeys.every((key) => dimensionMatches(delegation[key], scope[key]));
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

function activeDelegationsForPrincipal(input: {
  delegations: LeadershipDelegation[];
  now: Date;
  principalUserId: string;
  scope?: PolicyScope;
}) {
  return input.delegations.filter((delegation) => {
    if (
      !delegation.active ||
      delegation.principalUserId !== input.principalUserId
    ) {
      return false;
    }

    if (delegation.startsAt && new Date(delegation.startsAt).getTime() > input.now.getTime()) {
      return false;
    }

    if (delegation.endsAt && new Date(delegation.endsAt).getTime() < input.now.getTime()) {
      return false;
    }

    return delegationMatchesScope(delegation, input.scope);
  });
}

export function resolveRiskOverdueState(
  input: RiskOverdueInput,
): ApprovalOverdueState {
  const ownerLabel = input.ownerLabel ?? "Chua gan owner";

  if (isTerminalRiskStatus(input.recordStatus)) {
    return {
      daysOverdue: 0,
      isOverdue: false,
      nextAction: "Risk/blocker da dong, khong tinh alert qua han active.",
      ownerLabel,
      reason: "Risk/blocker da o trang thai terminal.",
      severity: "none",
    };
  }

  const now = input.now ?? new Date();
  const daysOverdue = businessDaysBetween(input.deadline, now);

  if (daysOverdue === undefined) {
    return {
      daysOverdue: 0,
      isOverdue: false,
      nextAction: "Dat deadline hop le de theo doi risk/blocker.",
      ownerLabel,
      reason: "Risk/blocker chua co deadline hop le.",
      severity: "none",
    };
  }

  const severity = severityFor(daysOverdue, input.thresholdDays);
  const policyReason = input.policyLabel ? ` theo ${input.policyLabel}` : "";

  if (daysOverdue <= 0) {
    return {
      daysOverdue: 0,
      isOverdue: false,
      nextAction:
        severity === "warning"
          ? "Theo doi deadline hom nay va chuan bi action neu can."
          : "Tiep tuc theo doi risk/blocker theo deadline.",
      ownerLabel,
      reason:
        severity === "warning"
          ? `Risk/blocker den han hom nay${policyReason}.`
          : "Risk/blocker chua qua han.",
      severity,
    };
  }

  const shouldEscalate =
    input.thresholdDays !== undefined && daysOverdue >= input.thresholdDays;

  return {
    daysOverdue,
    isOverdue: true,
    nextAction:
      input.nextAction ??
      (shouldEscalate
        ? "Kiem tra escalation queue va nang cap risk theo policy."
        : "Lien he owner de xu ly risk/blocker qua han."),
    ownerLabel,
    reason: `Risk/blocker qua han ${daysOverdue} ngay${policyReason}.`,
    severity,
  };
}

export function resolveRiskEscalationPolicyForRecord(
  record: ExecutiveRiskRecord,
  policies: ApprovalThresholdPolicy[],
) {
  const scope = recordScope(record);

  return policies
    .filter((policy) => policy.active && hasEscalationConfig(policy))
    .map((policy) => ({
      policy,
      riskScore: (policy.escalateOnRiskLevels ?? []).includes(record.level) ? 1 : 0,
      scopeScore: scopeScore(policy, scope),
      targetScore: targetTypeScore(policy),
    }))
    .filter((candidate) => candidate.scopeScore >= 0)
    .filter((candidate) => scopeMatchesPolicy(candidate.policy, scope))
    .sort(
      (left, right) =>
        right.scopeScore - left.scopeScore ||
        right.targetScore - left.targetScore ||
        right.riskScore - left.riskScore ||
        left.policy.priority - right.policy.priority ||
        left.policy.policyKey.localeCompare(right.policy.policyKey),
    )[0]?.policy;
}

export function resolveRiskEscalationState(
  input: RiskEscalationInput,
): ApprovalEscalationState {
  const thresholdDays = input.policy?.escalateAfterDays;
  const riskMatches = Boolean(
    input.policy?.escalateOnRiskLevels?.includes(input.record.level),
  );
  const longOverdue =
    input.overdue.isOverdue &&
    thresholdDays !== undefined &&
    input.overdue.daysOverdue >= thresholdDays;
  const required =
    !isTerminalRiskStatus(input.record.status) &&
    input.overdue.isOverdue &&
    (longOverdue || riskMatches);

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
  const scope = input.scope ?? recordScope(input.record);

  addUniqueTarget(targets, {
    kind: "owner",
    label: input.record.ownerName ?? input.record.ownerId,
    scopeMatched: true,
    userId: input.record.ownerId,
  });

  for (const delegation of activeDelegationsForPrincipal({
    delegations: input.delegations ?? [],
    now,
    principalUserId: input.record.ownerId,
    scope,
  })) {
    addUniqueTarget(targets, {
      delegationId: delegation.id,
      kind: "delegate",
      label: delegation.delegateUserId,
      scopeMatched: true,
      userId: delegation.delegateUserId,
    });
  }

  if (input.policy?.approverRoleKey) {
    addUniqueTarget(targets, {
      kind: "policy_escalation",
      label: input.policy.approverRoleKey,
      roleKey: input.policy.approverRoleKey,
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
    policyLabel: input.policy?.labelVi,
    reason: riskMatches
      ? `${input.overdue.reason} Risk ${input.record.level} nam trong policy escalation.`
      : input.overdue.reason,
    required: true,
    status: input.notificationId ? "queued" : "none",
    targets,
    thresholdDays,
    trigger,
  };
}
