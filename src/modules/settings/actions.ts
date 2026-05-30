"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import type { PermissionAction } from "@/lib/permissions/can";
import type { SourceRegistryEntryInput } from "@/modules/knowledge/types";
import type {
  ApprovalAuthorityLevel,
  ApprovalPolicyInput,
  ApprovalTargetType,
  LeadershipDelegationInput,
  RiskGroupInput,
  RiskSeverity,
  RoleScope,
  RoleTemplateInput,
  ScopeAssignmentInput,
} from "@/modules/settings/types";
import {
  addRoleTemplate,
  renameRoleTemplate,
  setRoleTemplateActive,
  updateRolePermissionMapping,
} from "@/modules/settings/services/role-permission-catalog-service";
import {
  policySettingsAuditValue,
  setApprovalThresholdPolicyActive,
  setRiskGroupConfigActive,
  upsertApprovalThresholdPolicy,
  upsertRiskGroupConfig,
} from "@/modules/settings/services/policy-settings-service";
import {
  createScopeAssignment,
  disableScopeAssignment,
  scopeAssignmentAuditValue,
  updateScopeAssignment,
} from "@/modules/settings/services/scope-assignment-service";
import {
  leadershipDelegationAuditValue,
  setLeadershipDelegationActive,
  upsertLeadershipDelegation,
} from "@/modules/settings/services/leadership-delegation-service";
import {
  setSourceRegistryEntryEnabled,
  upsertSourceRegistryEntry
} from "@/modules/settings/services/source-registry-settings-service";
import { createAuditLog } from "@/modules/users/services/user-service";

function readTags(formData: FormData) {
  return String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formDataToSourceRegistryEntryInput(formData: FormData): SourceRegistryEntryInput {
  return {
    domain: String(formData.get("domain") ?? ""),
    sourceCategory: String(formData.get("sourceCategory") ?? "reference") as SourceRegistryEntryInput["sourceCategory"],
    module: String(formData.get("module") ?? "general") as SourceRegistryEntryInput["module"],
    sourceType: String(formData.get("sourceType") ?? "internal_note") as SourceRegistryEntryInput["sourceType"],
    confidence: String(formData.get("confidence") ?? "unknown") as SourceRegistryEntryInput["confidence"],
    tags: readTags(formData),
    enabled: String(formData.get("enabled") ?? "true") === "true",
    notes: String(formData.get("notes") ?? "").trim() || undefined
  };
}

function readPermissionKeys(formData: FormData) {
  return formData
    .getAll("permissionKeys")
    .map((permissionKey) => String(permissionKey))
    .filter(Boolean) as PermissionAction[];
}

function readActionKeys(formData: FormData) {
  return formData
    .getAll("actionKeys")
    .map((actionKey) => String(actionKey))
    .filter(Boolean);
}

function formDataToRoleTemplateInput(formData: FormData): RoleTemplateInput {
  return {
    key: String(formData.get("key") ?? ""),
    labelVi: String(formData.get("labelVi") ?? ""),
    description: String(formData.get("description") ?? "").trim() || undefined,
    scope: String(formData.get("scope") ?? "system") as RoleScope,
    permissionKeys: readPermissionKeys(formData),
  };
}

function optionalFormValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  return value || undefined;
}

function optionalNumberValue(formData: FormData, key: string) {
  const rawValue = optionalFormValue(formData, key);

  if (!rawValue) {
    return undefined;
  }

  return Number(rawValue);
}

function optionalBooleanValue(formData: FormData, key: string) {
  if (!formData.has(key)) {
    return undefined;
  }

  return String(formData.get(key) ?? "false") === "true";
}

function formDataToScopeAssignmentInput(formData: FormData): ScopeAssignmentInput {
  return {
    userId: String(formData.get("userId") ?? ""),
    roleKey: String(formData.get("roleKey") ?? ""),
    permissionKeys: readPermissionKeys(formData),
    scopeType: String(formData.get("scopeType") ?? "scoped") as ScopeAssignmentInput["scopeType"],
    organizationId: optionalFormValue(formData, "organizationId"),
    projectId: optionalFormValue(formData, "projectId"),
    axisId: optionalFormValue(formData, "axisId"),
    workstreamId: optionalFormValue(formData, "workstreamId"),
    moduleId: optionalFormValue(formData, "moduleId"),
    recordId: optionalFormValue(formData, "recordId"),
    startsAt: optionalFormValue(formData, "startsAt"),
    endsAt: optionalFormValue(formData, "endsAt"),
    active: String(formData.get("active") ?? "true") === "true",
  };
}

function formDataToLeadershipDelegationInput(formData: FormData): LeadershipDelegationInput {
  return {
    id: optionalFormValue(formData, "delegationId") ?? optionalFormValue(formData, "id"),
    principalUserId: String(formData.get("principalUserId") ?? ""),
    delegateUserId: String(formData.get("delegateUserId") ?? ""),
    actionKeys: readActionKeys(formData),
    organizationId: optionalFormValue(formData, "organizationId"),
    projectId: optionalFormValue(formData, "projectId"),
    axisId: optionalFormValue(formData, "axisId"),
    workstreamId: optionalFormValue(formData, "workstreamId"),
    moduleId: optionalFormValue(formData, "moduleId"),
    recordId: optionalFormValue(formData, "recordId"),
    startsAt: optionalFormValue(formData, "startsAt"),
    endsAt: optionalFormValue(formData, "endsAt"),
    note: optionalFormValue(formData, "note"),
    active: optionalBooleanValue(formData, "active"),
  };
}

function formDataToApprovalPolicyInput(formData: FormData): ApprovalPolicyInput {
  return {
    id: optionalFormValue(formData, "policyId") ?? optionalFormValue(formData, "id"),
    policyKey: String(formData.get("policyKey") ?? ""),
    labelVi: String(formData.get("labelVi") ?? ""),
    targetType: String(formData.get("targetType") ?? "proposal") as ApprovalTargetType,
    amountMin: optionalNumberValue(formData, "amountMin"),
    amountMax: optionalNumberValue(formData, "amountMax"),
    currency: "VND",
    approvalLevel: String(formData.get("approvalLevel") ?? "DEPARTMENT_HEAD") as ApprovalAuthorityLevel,
    approverRoleKey: String(formData.get("approverRoleKey") ?? ""),
    requiredPermissionKey: String(formData.get("requiredPermissionKey") ?? "") as PermissionAction,
    escalateAfterDays: optionalNumberValue(formData, "escalateAfterDays"),
    escalateOnRiskLevels: formData
      .getAll("escalateOnRiskLevels")
      .map((riskLevel) => String(riskLevel))
      .filter(Boolean) as RiskSeverity[],
    active: optionalBooleanValue(formData, "active"),
    priority: optionalNumberValue(formData, "priority"),
    organizationId: optionalFormValue(formData, "organizationId"),
    projectId: optionalFormValue(formData, "projectId"),
    axisId: optionalFormValue(formData, "axisId"),
    workstreamId: optionalFormValue(formData, "workstreamId"),
    moduleId: optionalFormValue(formData, "moduleId"),
    recordId: optionalFormValue(formData, "recordId"),
  };
}

function formDataToRiskGroupInput(formData: FormData): RiskGroupInput {
  return {
    id: optionalFormValue(formData, "riskGroupId") ?? optionalFormValue(formData, "id"),
    riskKey: String(formData.get("riskKey") ?? ""),
    labelVi: String(formData.get("labelVi") ?? ""),
    description: optionalFormValue(formData, "description"),
    defaultSeverity: String(formData.get("defaultSeverity") ?? "medium") as RiskSeverity,
    moduleId: optionalFormValue(formData, "moduleId"),
    sortOrder: optionalNumberValue(formData, "sortOrder"),
    isDefault: String(formData.get("isDefault") ?? "false") === "true",
    active: optionalBooleanValue(formData, "active"),
  };
}

export async function upsertSourceRegistryEntryAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const entry = await upsertSourceRegistryEntry(formDataToSourceRegistryEntryInput(formData), currentUser);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "source_registry_entry",
    entityId: entry.id,
    action: "source_registry.upsert",
    newValue: {
      domain: entry.domain,
      enabled: entry.enabled,
      module: entry.module,
      sourceType: entry.sourceType,
      confidence: entry.confidence
    }
  });

  revalidatePath("/settings");
  revalidatePath("/knowledge/intake");
  redirect("/settings");
}

export async function setSourceRegistryEntryEnabledAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const entryId = String(formData.get("entryId") ?? "");
  const enabled = String(formData.get("enabled") ?? "false") === "true";
  const entry = await setSourceRegistryEntryEnabled(entryId, enabled, currentUser);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "source_registry_entry",
    entityId: entry.id,
    action: enabled ? "source_registry.enable" : "source_registry.disable",
    newValue: { domain: entry.domain, enabled: entry.enabled }
  });

  revalidatePath("/settings");
  revalidatePath("/knowledge/intake");
  redirect("/settings");
}

export async function addRoleTemplateAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const result = await addRoleTemplate(formDataToRoleTemplateInput(formData), currentUser);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "role_template",
    entityId: String(result.role.key),
    action: "role_template.add",
    newValue: {
      key: result.role.key,
      labelVi: result.role.labelVi,
      scope: result.role.scope,
      active: result.role.active,
      permissionKeys: result.role.permissionKeys,
    },
  });

  revalidatePath("/settings");
  redirect("/settings#role-permission-catalog");
}

export async function renameRoleTemplateAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const roleKey = String(formData.get("roleKey") ?? "");
  const result = await renameRoleTemplate(
    {
      roleKey,
      labelVi: String(formData.get("labelVi") ?? ""),
      description: String(formData.get("description") ?? "").trim() || undefined,
    },
    currentUser,
  );

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "role_template",
    entityId: String(result.role.key),
    action: "role_template.rename",
    oldValue: {
      labelVi: result.previousRole?.labelVi,
      description: result.previousRole?.description,
    },
    newValue: {
      labelVi: result.role.labelVi,
      description: result.role.description,
    },
  });

  revalidatePath("/settings");
  redirect("/settings#role-permission-catalog");
}

export async function setRoleTemplateActiveAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const roleKey = String(formData.get("roleKey") ?? "");
  const active = String(formData.get("active") ?? "false") === "true";
  const result = await setRoleTemplateActive(roleKey, active, currentUser);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "role_template",
    entityId: String(result.role.key),
    action: active ? "role_template.enable" : "role_template.disable",
    oldValue: { active: result.previousRole?.active },
    newValue: { active: result.role.active },
  });

  revalidatePath("/settings");
  redirect("/settings#role-permission-catalog");
}

export async function updateRolePermissionMappingAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const roleKey = String(formData.get("roleKey") ?? "");
  const result = await updateRolePermissionMapping(
    {
      roleKey,
      permissionKeys: readPermissionKeys(formData),
    },
    currentUser,
  );

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "role_permission_mapping",
    entityId: String(result.role.key),
    action: "role_permission_mapping.update",
    oldValue: {
      permissionKeys: result.previousPermissionKeys ?? [],
    },
    newValue: {
      permissionKeys: result.role.permissionKeys,
    },
  });

  revalidatePath("/settings");
  redirect("/settings#role-permission-catalog");
}

export async function createScopeAssignmentAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const result = await createScopeAssignment(formDataToScopeAssignmentInput(formData), currentUser);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "scope_assignment",
    entityId: result.assignment.id,
    action: "scope_assignment.create",
    newValue: scopeAssignmentAuditValue(result.assignment),
  });

  revalidatePath("/settings");
  redirect("/settings#scope-assignments");
}

export async function updateScopeAssignmentAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const result = await updateScopeAssignment(
    assignmentId,
    formDataToScopeAssignmentInput(formData),
    currentUser,
  );

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "scope_assignment",
    entityId: result.assignment.id,
    action: "scope_assignment.update",
    oldValue: result.previousAssignment
      ? scopeAssignmentAuditValue(result.previousAssignment)
      : undefined,
    newValue: scopeAssignmentAuditValue(result.assignment),
  });

  revalidatePath("/settings");
  redirect("/settings#scope-assignments");
}

export async function disableScopeAssignmentAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const result = await disableScopeAssignment(assignmentId, currentUser);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "scope_assignment",
    entityId: result.assignment.id,
    action: "scope_assignment.disable",
    oldValue: result.previousAssignment
      ? scopeAssignmentAuditValue(result.previousAssignment)
      : undefined,
    newValue: scopeAssignmentAuditValue(result.assignment),
  });

  revalidatePath("/settings");
  redirect("/settings#scope-assignments");
}

export async function upsertLeadershipDelegationAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const result = await upsertLeadershipDelegation(
    formDataToLeadershipDelegationInput(formData),
    currentUser,
  );

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "leadership_delegation",
    entityId: result.delegation.id,
    action: "delegation.upsert",
    oldValue: result.previousDelegation
      ? leadershipDelegationAuditValue(result.previousDelegation)
      : undefined,
    newValue: leadershipDelegationAuditValue(result.delegation),
  });

  revalidatePath("/settings");
  redirect("/settings#leadership-delegations");
}

export async function setLeadershipDelegationActiveAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const delegationId = String(formData.get("delegationId") ?? "");
  const active = String(formData.get("active") ?? "false") === "true";
  const result = await setLeadershipDelegationActive(delegationId, active, currentUser);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "leadership_delegation",
    entityId: result.delegation.id,
    action: active ? "delegation.enable" : "delegation.disable",
    oldValue: result.previousDelegation
      ? leadershipDelegationAuditValue(result.previousDelegation)
      : undefined,
    newValue: leadershipDelegationAuditValue(result.delegation),
  });

  revalidatePath("/settings");
  redirect("/settings#leadership-delegations");
}

export async function upsertApprovalThresholdPolicyAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const result = await upsertApprovalThresholdPolicy(
    formDataToApprovalPolicyInput(formData),
    currentUser,
  );

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "approval_threshold_policy",
    entityId: result.policy.id,
    action: "policy.approval_threshold.upsert",
    oldValue: result.previousPolicy
      ? policySettingsAuditValue(result.previousPolicy)
      : undefined,
    newValue: policySettingsAuditValue(result.policy),
  });

  revalidatePath("/settings");
  redirect("/settings#policy-settings");
}

export async function setApprovalThresholdPolicyActiveAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const policyId = String(formData.get("policyId") ?? "");
  const active = String(formData.get("active") ?? "false") === "true";
  const result = await setApprovalThresholdPolicyActive(policyId, active, currentUser);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "approval_threshold_policy",
    entityId: result.policy.id,
    action: active ? "policy.approval_threshold.enable" : "policy.approval_threshold.disable",
    oldValue: result.previousPolicy
      ? policySettingsAuditValue(result.previousPolicy)
      : undefined,
    newValue: policySettingsAuditValue(result.policy),
  });

  revalidatePath("/settings");
  redirect("/settings#policy-settings");
}

export async function upsertRiskGroupConfigAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const result = await upsertRiskGroupConfig(formDataToRiskGroupInput(formData), currentUser);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "risk_group_config",
    entityId: result.riskGroup.id,
    action: "policy.risk_group.upsert",
    oldValue: result.previousRiskGroup
      ? policySettingsAuditValue(result.previousRiskGroup)
      : undefined,
    newValue: policySettingsAuditValue(result.riskGroup),
  });

  revalidatePath("/settings");
  redirect("/settings#policy-settings");
}

export async function setRiskGroupConfigActiveAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const riskGroupId = String(formData.get("riskGroupId") ?? "");
  const active = String(formData.get("active") ?? "false") === "true";
  const result = await setRiskGroupConfigActive(riskGroupId, active, currentUser);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "risk_group_config",
    entityId: result.riskGroup.id,
    action: active ? "policy.risk_group.enable" : "policy.risk_group.disable",
    oldValue: result.previousRiskGroup
      ? policySettingsAuditValue(result.previousRiskGroup)
      : undefined,
    newValue: policySettingsAuditValue(result.riskGroup),
  });

  revalidatePath("/settings");
  redirect("/settings#policy-settings");
}
