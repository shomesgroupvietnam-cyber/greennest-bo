import { randomUUID } from "node:crypto";

import { can, type PermissionUser } from "@/lib/permissions/can";
import {
  approvalThresholdPolicyInputSchema,
  riskGroupInputSchema,
} from "@/modules/settings/validation";
import type {
  ApprovalPolicyInput,
  ApprovalPolicyResolution,
  ApprovalTargetType,
  ApprovalThresholdPolicy,
  PolicyScope,
  RiskGroupConfig,
  RiskGroupInput,
  RiskSeverity,
} from "@/modules/settings/types";

import {
  rolePermissionCatalogRepository,
  type RolePermissionCatalogRepository,
} from "./role-permission-catalog-repository";
import {
  policySettingsRepository,
  type PolicySettingsRepository,
} from "./policy-settings-repository";

type PolicySettingsServiceOptions = {
  repository?: PolicySettingsRepository;
  catalogRepository?: RolePermissionCatalogRepository;
};

export type ApprovalPolicyResolutionInput = {
  targetType?: ApprovalTargetType | string;
  amount?: number;
  moduleId?: string;
  riskLevel?: RiskSeverity;
  scope?: PolicyScope;
};

const scopeKeys = [
  "organizationId",
  "projectId",
  "axisId",
  "workstreamId",
  "moduleId",
  "recordId",
] as const;

function now() {
  return new Date().toISOString();
}

function assertManagePolicySettings(user: PermissionUser) {
  if (!can(user, "settings.manage")) {
    throw new Error("Ban khong co quyen quan ly policy settings.");
  }
}

function resolveRepository(options: PolicySettingsServiceOptions = {}) {
  return options.repository ?? policySettingsRepository;
}

function resolveCatalogRepository(options: PolicySettingsServiceOptions = {}) {
  return options.catalogRepository ?? rolePermissionCatalogRepository;
}

function sameScope(a: Partial<PolicyScope>, b: Partial<PolicyScope>) {
  return scopeKeys.every((key) => (a[key] ?? undefined) === (b[key] ?? undefined));
}

function scopeSnapshot(policy: Partial<PolicyScope>) {
  return {
    organizationId: policy.organizationId,
    projectId: policy.projectId,
    axisId: policy.axisId,
    workstreamId: policy.workstreamId,
    moduleId: policy.moduleId,
    recordId: policy.recordId,
  };
}

function rangeOverlaps(a: ApprovalThresholdPolicy, b: ApprovalThresholdPolicy) {
  const aMin = a.amountMin ?? 0;
  const bMin = b.amountMin ?? 0;
  const aMax = a.amountMax ?? Number.POSITIVE_INFINITY;
  const bMax = b.amountMax ?? Number.POSITIVE_INFINITY;

  return aMin <= bMax && bMin <= aMax;
}

function assertNoAmbiguousDuplicateRange(
  candidate: ApprovalThresholdPolicy,
  policies: ApprovalThresholdPolicy[],
) {
  if (!candidate.active) {
    return;
  }

  const duplicate = policies.find(
    (policy) =>
      policy.id !== candidate.id &&
      policy.active &&
      policy.targetType === candidate.targetType &&
      policy.priority === candidate.priority &&
      sameScope(policy, candidate) &&
      rangeOverlaps(policy, candidate),
  );

  if (duplicate) {
    throw new Error(
      `Approval policy range trung nhau voi ${duplicate.policyKey}; hay doi priority hoac amount range.`,
    );
  }
}

function assertUniquePolicyKey(
  candidate: Pick<ApprovalThresholdPolicy, "id" | "policyKey">,
  policies: ApprovalThresholdPolicy[],
) {
  const duplicate = policies.find(
    (policy) => policy.policyKey === candidate.policyKey && policy.id !== candidate.id,
  );

  if (duplicate) {
    throw new Error(`Policy key da ton tai tren ${duplicate.id}.`);
  }
}

function assertCanDeactivateDefaultRiskGroup(
  candidate: RiskGroupConfig,
  riskGroups: RiskGroupConfig[],
) {
  if (candidate.active || !candidate.isDefault) {
    return;
  }

  const hasOtherActiveDefault = riskGroups.some(
    (riskGroup) => riskGroup.id !== candidate.id && riskGroup.isDefault && riskGroup.active,
  );

  if (!hasOtherActiveDefault) {
    throw new Error("Khong duoc vo hieu hoa toan bo nhom risk mac dinh.");
  }
}

function assertCanDeactivateApprovalPolicy(
  candidate: ApprovalThresholdPolicy,
  policies: ApprovalThresholdPolicy[],
) {
  if (candidate.active) {
    return;
  }

  const hasOtherActivePolicy = policies.some(
    (policy) => policy.id !== candidate.id && policy.active,
  );

  if (!hasOtherActivePolicy) {
    throw new Error("Khong duoc vo hieu hoa toan bo approval policy.");
  }
}

function cleanScope(input: Partial<PolicyScope>): PolicyScope {
  return {
    organizationId: input.organizationId,
    projectId: input.projectId,
    axisId: input.axisId,
    workstreamId: input.workstreamId,
    moduleId: input.moduleId,
    recordId: input.recordId,
  };
}

async function assertKnownRoleAndPermission(
  approverRoleKey: string,
  requiredPermissionKey: string,
  catalogRepository: RolePermissionCatalogRepository,
) {
  const catalog = await catalogRepository.listCatalog();
  const role = catalog.roles.find((item) => item.key === approverRoleKey);
  const permission = catalog.permissions.find((item) => item.key === requiredPermissionKey);

  if (!role?.active) {
    throw new Error("Approver role khong ton tai hoac da bi vo hieu hoa.");
  }

  if (!permission) {
    throw new Error("Required permission khong ton tai trong permission catalog.");
  }
}

function findPreviousPolicy(
  policies: ApprovalThresholdPolicy[],
  input: Pick<ApprovalPolicyInput, "id" | "policyKey">,
) {
  return input.id
    ? policies.find((policy) => policy.id === input.id)
    : policies.find((policy) => policy.policyKey === input.policyKey);
}

function findPreviousRiskGroup(riskGroups: RiskGroupConfig[], input: Pick<RiskGroupInput, "id" | "riskKey">) {
  return input.id
    ? riskGroups.find((riskGroup) => riskGroup.id === input.id)
    : riskGroups.find((riskGroup) => riskGroup.riskKey === input.riskKey);
}

function toPolicyTargetType(value: ApprovalPolicyResolutionInput["targetType"]): ApprovalTargetType {
  if (
    value === "proposal" ||
    value === "finance" ||
    value === "investment" ||
    value === "contract" ||
    value === "general"
  ) {
    return value;
  }

  return "proposal";
}

function policyTargetScore(policy: ApprovalThresholdPolicy, targetType: ApprovalTargetType) {
  if (policy.targetType === targetType) {
    return 2;
  }

  if (targetType !== "proposal" && policy.targetType === "proposal") {
    return 1;
  }

  return policy.targetType === "general" ? 0 : -1;
}

function policyScopeScore(policy: ApprovalThresholdPolicy, inputScope: PolicyScope) {
  let score = 0;

  for (const key of scopeKeys) {
    const policyValue = policy[key];
    const inputValue = inputScope[key];

    if (!policyValue) {
      continue;
    }

    if (policyValue === "*") {
      score += 1;
      continue;
    }

    if (policyValue !== inputValue) {
      return -1;
    }

    score += 2;
  }

  return score;
}

function policyMatchesAmount(policy: ApprovalThresholdPolicy, amount: number) {
  const min = policy.amountMin ?? 0;
  const max = policy.amountMax;

  return amount >= min && (max === undefined || amount <= max);
}

function toResolution(policy: ApprovalThresholdPolicy): ApprovalPolicyResolution {
  return {
    approvalLevel: policy.approvalLevel,
    approverRole: policy.approverRoleKey,
    requiredPermission: policy.requiredPermissionKey,
    thresholdPolicyId: policy.id,
    thresholdPolicyKey: policy.policyKey,
    thresholdLabel: policy.labelVi,
    amountMin: policy.amountMin,
    amountMax: policy.amountMax,
    currency: policy.currency,
    escalateAfterDays: policy.escalateAfterDays,
  };
}

export async function listPolicySettings(
  repository: PolicySettingsRepository = policySettingsRepository,
) {
  return repository.listSettings();
}

export async function listActiveApprovalThresholds(
  repository: PolicySettingsRepository = policySettingsRepository,
) {
  const settings = await repository.listSettings();

  return settings.approvalThresholds.filter((policy) => policy.active);
}

export async function listActiveRiskGroups(
  repository: PolicySettingsRepository = policySettingsRepository,
) {
  const settings = await repository.listSettings();

  return settings.riskGroups.filter((riskGroup) => riskGroup.active);
}

export function findMatchingApprovalThresholdPolicy(
  policies: ApprovalThresholdPolicy[],
  input: ApprovalPolicyResolutionInput,
) {
  const targetType = toPolicyTargetType(input.targetType);
  const amount = input.amount ?? 0;
  const inputScope: PolicyScope = {
    ...input.scope,
    moduleId: input.scope?.moduleId ?? input.moduleId,
  };
  const candidates = policies
    .map((policy) => ({
      policy,
      targetScore: policyTargetScore(policy, targetType),
      scopeScore: policyScopeScore(policy, inputScope),
      riskScore: input.riskLevel && policy.escalateOnRiskLevels?.includes(input.riskLevel) ? 1 : 0,
    }))
    .filter(
      (candidate) =>
        candidate.targetScore >= 0 &&
        candidate.scopeScore >= 0 &&
        policyMatchesAmount(candidate.policy, amount),
    )
    .sort(
      (a, b) =>
        b.targetScore - a.targetScore ||
        b.scopeScore - a.scopeScore ||
        b.riskScore - a.riskScore ||
        a.policy.priority - b.policy.priority ||
        (b.policy.amountMin ?? 0) - (a.policy.amountMin ?? 0),
    );

  return candidates[0]?.policy;
}

export async function resolveApprovalPolicyForProposal(
  input: ApprovalPolicyResolutionInput,
  repository: PolicySettingsRepository = policySettingsRepository,
): Promise<ApprovalPolicyResolution> {
  const policies = await listActiveApprovalThresholds(repository);
  const match = findMatchingApprovalThresholdPolicy(policies, input);

  if (!match) {
    throw new Error("Khong tim thay approval policy phu hop.");
  }

  return toResolution(match);
}

export async function upsertApprovalThresholdPolicy(
  input: ApprovalPolicyInput,
  actor: PermissionUser,
  options: PolicySettingsServiceOptions = {},
) {
  assertManagePolicySettings(actor);
  const repository = resolveRepository(options);
  const catalogRepository = resolveCatalogRepository(options);
  const parsed = approvalThresholdPolicyInputSchema.parse(input);
  await assertKnownRoleAndPermission(parsed.approverRoleKey, parsed.requiredPermissionKey, catalogRepository);
  const settings = await repository.listSettings();
  const previousPolicy = findPreviousPolicy(settings.approvalThresholds, parsed);
  const timestamp = now();
  const policy: ApprovalThresholdPolicy = {
    id: previousPolicy?.id ?? parsed.id ?? randomUUID(),
    policyKey: parsed.policyKey,
    labelVi: parsed.labelVi,
    targetType: parsed.targetType,
    amountMin: parsed.amountMin,
    amountMax: parsed.amountMax,
    currency: parsed.currency,
    approvalLevel: parsed.approvalLevel,
    approverRoleKey: parsed.approverRoleKey,
    requiredPermissionKey: parsed.requiredPermissionKey,
    escalateAfterDays: parsed.escalateAfterDays,
    escalateOnRiskLevels: parsed.escalateOnRiskLevels,
    active: parsed.active ?? previousPolicy?.active ?? true,
    priority: parsed.priority,
    createdAt: previousPolicy?.createdAt ?? timestamp,
    updatedAt: timestamp,
    createdBy: previousPolicy?.createdBy ?? actor.id,
    updatedBy: actor.id,
    ...cleanScope(parsed),
  };

  assertUniquePolicyKey(policy, settings.approvalThresholds);
  assertNoAmbiguousDuplicateRange(policy, settings.approvalThresholds);
  assertCanDeactivateApprovalPolicy(policy, settings.approvalThresholds);

  return {
    policy: await repository.upsertApprovalThresholdPolicy(policy),
    previousPolicy,
  };
}

export async function setApprovalThresholdPolicyActive(
  policyId: string,
  active: boolean,
  actor: PermissionUser,
  options: Pick<PolicySettingsServiceOptions, "repository"> = {},
) {
  assertManagePolicySettings(actor);
  const repository = options.repository ?? policySettingsRepository;
  const settings = await repository.listSettings();
  const previousPolicy = settings.approvalThresholds.find((policy) => policy.id === policyId);

  if (!previousPolicy) {
    throw new Error("Khong tim thay approval policy.");
  }

  if (active) {
    assertNoAmbiguousDuplicateRange(
      { ...previousPolicy, active: true },
      settings.approvalThresholds,
    );
  } else {
    assertCanDeactivateApprovalPolicy(
      { ...previousPolicy, active: false },
      settings.approvalThresholds,
    );
  }

  return {
    policy: await repository.setApprovalThresholdPolicyActive(policyId, active, actor.id, now()),
    previousPolicy,
  };
}

export async function upsertRiskGroupConfig(
  input: RiskGroupInput,
  actor: PermissionUser,
  options: Pick<PolicySettingsServiceOptions, "repository"> = {},
) {
  assertManagePolicySettings(actor);
  const repository = options.repository ?? policySettingsRepository;
  const parsed = riskGroupInputSchema.parse(input);
  const settings = await repository.listSettings();
  const previousRiskGroup = findPreviousRiskGroup(settings.riskGroups, parsed);
  const duplicateRiskKey = settings.riskGroups.find(
    (riskGroup) =>
      riskGroup.riskKey === parsed.riskKey &&
      riskGroup.id !== (previousRiskGroup?.id ?? parsed.id),
  );

  if (duplicateRiskKey) {
    throw new Error("Risk key da ton tai.");
  }

  const timestamp = now();
  const riskGroup: RiskGroupConfig = {
    id: previousRiskGroup?.id ?? parsed.id ?? randomUUID(),
    riskKey: parsed.riskKey,
    labelVi: parsed.labelVi,
    description: parsed.description,
    defaultSeverity: parsed.defaultSeverity,
    moduleId: parsed.moduleId,
    sortOrder: parsed.sortOrder,
    isDefault: previousRiskGroup?.isDefault ?? parsed.isDefault,
    active: parsed.active ?? previousRiskGroup?.active ?? true,
    createdAt: previousRiskGroup?.createdAt ?? timestamp,
    updatedAt: timestamp,
    createdBy: previousRiskGroup?.createdBy ?? actor.id,
    updatedBy: actor.id,
  };

  assertCanDeactivateDefaultRiskGroup(riskGroup, settings.riskGroups);

  return {
    riskGroup: await repository.upsertRiskGroupConfig(riskGroup),
    previousRiskGroup,
  };
}

export async function setRiskGroupConfigActive(
  riskGroupId: string,
  active: boolean,
  actor: PermissionUser,
  options: Pick<PolicySettingsServiceOptions, "repository"> = {},
) {
  assertManagePolicySettings(actor);
  const repository = options.repository ?? policySettingsRepository;
  const settings = await repository.listSettings();
  const previousRiskGroup = settings.riskGroups.find((riskGroup) => riskGroup.id === riskGroupId);

  if (!previousRiskGroup) {
    throw new Error("Khong tim thay nhom risk.");
  }

  assertCanDeactivateDefaultRiskGroup(
    { ...previousRiskGroup, active },
    settings.riskGroups,
  );

  return {
    riskGroup: await repository.setRiskGroupConfigActive(riskGroupId, active, actor.id, now()),
    previousRiskGroup,
  };
}

export function policySettingsAuditValue(entity: ApprovalThresholdPolicy | RiskGroupConfig) {
  if ("policyKey" in entity) {
    return {
      id: entity.id,
      policyKey: entity.policyKey,
      labelVi: entity.labelVi,
      targetType: entity.targetType,
      amountMin: entity.amountMin,
      amountMax: entity.amountMax,
      currency: entity.currency,
      approvalLevel: entity.approvalLevel,
      approverRoleKey: entity.approverRoleKey,
      requiredPermissionKey: entity.requiredPermissionKey,
      escalateAfterDays: entity.escalateAfterDays,
      escalateOnRiskLevels: entity.escalateOnRiskLevels,
      active: entity.active,
      priority: entity.priority,
      ...scopeSnapshot(entity),
    };
  }

  return {
    id: entity.id,
    riskKey: entity.riskKey,
    labelVi: entity.labelVi,
    description: entity.description,
    defaultSeverity: entity.defaultSeverity,
    moduleId: entity.moduleId,
    sortOrder: entity.sortOrder,
    isDefault: entity.isDefault,
    active: entity.active,
  };
}
