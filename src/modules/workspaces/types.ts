import type { WorkspaceDefinition } from "@/modules/workspaces/config";
import type { ExecutiveAiSummary } from "@/modules/ai/types";
import type {
  DashboardData,
  ExecutiveDashboardKpi,
  ExecutiveDashboardScope,
  ExecutiveDashboardSourceCounts,
  ExecutiveDashboardSourceItem,
} from "@/modules/dashboard/types";
import type { Document } from "@/modules/documents/types";
import type { LegalStep } from "@/modules/legal/types";
import type { Decision, Meeting } from "@/modules/meetings/types";
import type { Project } from "@/modules/projects/types";
import type { PermissionAction } from "@/lib/permissions/can";
import type { LeadershipDelegation, RolePermissionCatalog, ScopeAssignment } from "@/modules/settings/types";
import type { Task } from "@/modules/tasks/types";
import type { AuditLog, ProjectMembership, User } from "@/modules/users/types";

export type WorkspaceScopedData = {
  projects: Project[];
  tasks: Task[];
  documents: Document[];
  legalSteps: LegalStep[];
  meetings: Meeting[];
  decisions: Decision[];
  users: User[];
  auditLogs: AuditLog[];
  memberships: ProjectMembership[];
  requireScopeAssignments?: boolean;
  scopeAssignments?: ScopeAssignment[];
  delegations?: LeadershipDelegation[];
  rolePermissionCatalog?: RolePermissionCatalog;
};

export type DelegationSummary = {
  activeCount: number;
  principalUserIds: string[];
  actionKeys: string[];
};

export type RoleWorkspaceData = {
  definition: WorkspaceDefinition;
  dashboard: DashboardData;
  scoped: WorkspaceScopedData;
  kpis: Array<{
    label: string;
    value: string | number;
    href?: string;
  }>;
  actionItems: Array<{
    title: string;
    meta: string;
    href?: string;
    tone?: "default" | "danger" | "warning";
  }>;
  delegationSummary?: DelegationSummary;
};

export type ExecutivePrivateWorkspaceVariant =
  | "chairman"
  | "ceo"
  | "project_director"
  | "department_head"
  | "secretary_assistant"
  | "viewer";

export type PrivateWorkspaceMutationMode =
  | "allowed"
  | "read_only"
  | "delegated_only"
  | "none";

export type PrivateWorkspacePermissions = {
  canViewProjects: boolean;
  canViewProposals: boolean;
  canViewMeetings: boolean;
  canViewDecisions: boolean;
  canViewRisk: boolean;
  canViewFinance: boolean;
  canCreateProposal: boolean;
  canCreateMeeting: boolean;
  canCreateRisk: boolean;
  canUpdateRisk: boolean;
  canOverrideRisk: boolean;
  canCloseRisk: boolean;
  canCloseHighRisk: boolean;
  canDrillDown: boolean;
  mutationMode: PrivateWorkspaceMutationMode;
};

export type PrivateWorkspaceSectionItem = ExecutiveDashboardSourceItem & {
  groupLabel: string;
  priorityLabel?: string;
  readOnlyReason?: string;
};

export type PrivateWorkspaceAction = {
  id: string;
  label: string;
  actionKey: PermissionAction;
  enabled: boolean;
  reason?: string;
  delegationId?: string;
  principalUserId?: string;
  scope?: {
    organizationId?: string;
    projectId?: string;
    axisId?: string;
    workstreamId?: string;
    moduleId?: string;
    recordId?: string;
  };
};

export type AssistantDelegationWorkspaceSummary = {
  delegationId: string;
  principalUserId: string;
  actionKeys: PermissionAction[];
  scope: {
    organizationId?: string;
    projectId?: string;
    axisId?: string;
    workstreamId?: string;
    moduleId?: string;
    recordId?: string;
  };
  startsAt?: string;
  endsAt?: string;
  canActOnBehalf: boolean;
  reason?: string;
};

export type AssistantPrivateWorkspaceSupport = {
  delegations: AssistantDelegationWorkspaceSummary[];
  scheduleItems: PrivateWorkspaceSectionItem[];
  submissionDossiers: PrivateWorkspaceSectionItem[];
  meetingDocuments: PrivateWorkspaceSectionItem[];
  supportTasks: PrivateWorkspaceSectionItem[];
  reminders: PrivateWorkspaceSectionItem[];
  pendingApprovals: PrivateWorkspaceSectionItem[];
  allowedActions: PrivateWorkspaceAction[];
};

export type ExecutivePrivateWorkspaceEmptyState = {
  kind: "no_data" | "no_permission" | "delegation_invalid" | "invalid_scope";
  title: string;
  description: string;
};

export type ExecutivePrivateWorkspaceSourceCounts =
  ExecutiveDashboardSourceCounts & {
    priorityItems: number;
    delegations: number;
  };

export type ExecutivePrivateWorkspaceData = {
  generatedAt: string;
  scope: ExecutiveDashboardScope;
  variant: ExecutivePrivateWorkspaceVariant;
  permissions: PrivateWorkspacePermissions;
  kpis: ExecutiveDashboardKpi[];
  priorityItems: PrivateWorkspaceSectionItem[];
  assignedProjects: PrivateWorkspaceSectionItem[];
  approvalItems: PrivateWorkspaceSectionItem[];
  riskItems: PrivateWorkspaceSectionItem[];
  deadlineItems: PrivateWorkspaceSectionItem[];
  decisionItems: PrivateWorkspaceSectionItem[];
  meetingItems: PrivateWorkspaceSectionItem[];
  assistantSupport: AssistantPrivateWorkspaceSupport;
  aiSummary: ExecutiveAiSummary;
  sourceCounts: ExecutivePrivateWorkspaceSourceCounts;
  emptyState?: ExecutivePrivateWorkspaceEmptyState;
};
