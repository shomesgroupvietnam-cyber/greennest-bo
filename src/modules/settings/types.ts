import type { Role } from "@/constants/roles";
import type { PermissionAction } from "@/lib/permissions/can";

export type RoleScope = "system" | "project" | "external";

export type PermissionModule = string;

export type PermissionActionType =
  | "view"
  | "create"
  | "update"
  | "approve"
  | "export"
  | "audit"
  | "admin"
  | "ai";

export type RoleTemplate = {
  key: Role | string;
  labelVi: string;
  description?: string;
  scope: RoleScope;
  active: boolean;
  defaultScreenHref?: string;
  defaultScreenLabel?: string;
  permissionKeys: PermissionAction[];
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
};

export type PermissionCatalogItem = {
  key: PermissionAction;
  module: PermissionModule;
  labelVi: string;
  description?: string;
  sensitive?: boolean;
  actionType: PermissionActionType;
};

export type RolePermissionAssignment = {
  roleKey: Role | string;
  permissionKey: PermissionAction;
};

export type RolePermissionCatalog = {
  roles: RoleTemplate[];
  permissions: PermissionCatalogItem[];
  assignments: RolePermissionAssignment[];
};

export type RoleTemplateInput = {
  key: string;
  labelVi: string;
  description?: string;
  scope: RoleScope;
  permissionKeys?: PermissionAction[];
};

export type RoleTemplateRenameInput = {
  roleKey: string;
  labelVi: string;
  description?: string;
};

export type RolePermissionMappingInput = {
  roleKey: string;
  permissionKeys: PermissionAction[];
};

export type RoleTemplateMutationResult = {
  role: RoleTemplate;
  previousRole?: RoleTemplate;
  previousPermissionKeys?: PermissionAction[];
};

export type ScopeAssignmentStatus =
  | "active"
  | "inactive"
  | "scheduled"
  | "expired";

export type ScopeAssignmentScopeType = "scoped" | "global";

export type ScopeDimension = {
  organizationId?: string;
  projectId?: string;
  axisId?: string;
  workstreamId?: string;
  moduleId?: string;
  recordId?: string;
};

export type ScopeAssignment = ScopeDimension & {
  id: string;
  userId: string;
  roleKey: string;
  permissionKeys: PermissionAction[];
  scopeType: ScopeAssignmentScopeType;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type ScopeAssignmentInput = ScopeDimension & {
  userId: string;
  roleKey: string;
  permissionKeys: string[];
  scopeType?: ScopeAssignmentScopeType;
  active?: boolean;
  startsAt?: string;
  endsAt?: string;
};

export type ScopedPermissionGrant = ScopeDimension & {
  assignmentId: string;
  userId: string;
  roleKey: string;
  permissionKey: PermissionAction;
  startsAt?: string;
  endsAt?: string;
};

export type ScopeAssignmentMutationResult = {
  assignment: ScopeAssignment;
  previousAssignment?: ScopeAssignment;
};

export type DelegationActionKey = PermissionAction;

export type LeadershipDelegation = ScopeDimension & {
  id: string;
  principalUserId: string;
  delegateUserId: string;
  actionKeys: DelegationActionKey[];
  active: boolean;
  startsAt?: string;
  endsAt?: string;
  note?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type LeadershipDelegationInput = ScopeDimension & {
  id?: string;
  principalUserId: string;
  delegateUserId: string;
  actionKeys: string[];
  active?: boolean;
  startsAt?: string;
  endsAt?: string;
  note?: string;
};

export type LeadershipDelegationMutationResult = {
  delegation: LeadershipDelegation;
  previousDelegation?: LeadershipDelegation;
};

export type DelegationResolution = {
  delegationId: string;
  principalUserId: string;
  delegateUserId: string;
  actionKey: DelegationActionKey;
  scope: ScopeDimension;
};

export type DelegationAuditValue = ScopeDimension & {
  id: string;
  principalUserId: string;
  delegateUserId: string;
  actionKeys: DelegationActionKey[];
  active: boolean;
  startsAt?: string;
  endsAt?: string;
  note?: string;
};

export type PolicyScope = ScopeDimension;

export type ApprovalTargetType =
  | "proposal"
  | "finance"
  | "investment"
  | "contract"
  | "general";

export type ApprovalAuthorityLevel =
  | "DEPARTMENT_HEAD"
  | "PROJECT_DIRECTOR"
  | "CEO"
  | "CHAIRMAN";

export type RiskSeverity = "low" | "medium" | "high" | "critical";

export type ApprovalThresholdPolicy = PolicyScope & {
  id: string;
  policyKey: string;
  labelVi: string;
  targetType: ApprovalTargetType;
  amountMin?: number;
  amountMax?: number;
  currency: "VND";
  approvalLevel: ApprovalAuthorityLevel;
  approverRoleKey: string;
  requiredPermissionKey: PermissionAction;
  escalateAfterDays?: number;
  escalateOnRiskLevels?: RiskSeverity[];
  active: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
};

export type RiskGroupConfig = {
  id: string;
  riskKey: string;
  labelVi: string;
  description?: string;
  defaultSeverity: RiskSeverity;
  moduleId?: string;
  sortOrder: number;
  isDefault: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
};

export type PolicySettings = {
  approvalThresholds: ApprovalThresholdPolicy[];
  riskGroups: RiskGroupConfig[];
};

export type ApprovalPolicyInput = PolicyScope & {
  id?: string;
  policyKey: string;
  labelVi: string;
  targetType: ApprovalTargetType;
  amountMin?: number;
  amountMax?: number;
  currency?: "VND";
  approvalLevel: ApprovalAuthorityLevel;
  approverRoleKey: string;
  requiredPermissionKey: PermissionAction;
  escalateAfterDays?: number;
  escalateOnRiskLevels?: RiskSeverity[];
  active?: boolean;
  priority?: number;
};

export type RiskGroupInput = {
  id?: string;
  riskKey: string;
  labelVi: string;
  description?: string;
  defaultSeverity: RiskSeverity;
  moduleId?: string;
  sortOrder?: number;
  isDefault?: boolean;
  active?: boolean;
};

export type PolicyMutationResult =
  | {
      policy: ApprovalThresholdPolicy;
      previousPolicy?: ApprovalThresholdPolicy;
    }
  | {
      riskGroup: RiskGroupConfig;
      previousRiskGroup?: RiskGroupConfig;
    };

export type ApprovalPolicyResolution = {
  approvalLevel: ApprovalAuthorityLevel;
  approverRole: string;
  requiredPermission: PermissionAction;
  thresholdPolicyId: string;
  thresholdPolicyKey: string;
  thresholdLabel: string;
  amountMin?: number;
  amountMax?: number;
  currency: "VND";
  escalateAfterDays?: number;
};
