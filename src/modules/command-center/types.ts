import type {
  AxisOneDashboardSummary,
  AxisOneDevelopmentStage,
  AxisOneRiskLevel,
  AxisOneTaskStatus,
} from "@/modules/axis-1/types";
import type {
  DashboardData,
  ExecutiveCommonCenterData,
  ExecutiveDashboardData,
  ExecutiveMorningBriefingData,
} from "@/modules/dashboard/types";
import type { ExecutivePrivateWorkspaceData } from "@/modules/workspaces/types";
import type {
  ExecutiveAiLeadershipSummary,
  ExecutiveAiInsight,
  ExecutiveAuditLogItem,
  ExecutiveAccessibleScope,
  ExecutiveAccessPolicy,
  ApprovalCenterData,
  ExecutiveAxisDefinition,
  ExecutiveCommandCenterSnapshot,
  ExecutiveDashboardLayer,
  ExecutiveDecisionLogItem,
  ExecutiveDirective,
  ExecutiveEscalationRule,
  ExecutiveGlobalStatusItem,
  ExecutiveLeadershipActionItem,
  ExecutiveLeader,
  ExecutiveOrganization,
  ExecutiveOverviewCard,
  ExecutiveProjectRow,
  ExecutiveRiskGroupMetadata,
  ExecutiveRoleDefinition,
  LeadershipApproval,
  LeadershipMeeting,
  StrategicInvestmentPlan,
} from "@/modules/executive/types";

export type CommandCenterTone =
  | "blue"
  | "emerald"
  | "amber"
  | "purple"
  | "red"
  | "slate";

export type CommandCenterMenuItem = {
  code: string;
  label: string;
  href?: string;
  viewKey: CommandCenterViewKey;
  children?: CommandCenterSubMenuItem[];
};

export type CommandCenterSubMenuItem = {
  label: string;
  href: string;
  viewKey: CommandCenterViewKey;
};

export type CommandCenterViewKey = string;

export type CommandCenterAxis = {
  title: string;
  tone: CommandCenterTone;
  items: CommandCenterMenuItem[];
};

export type CommandCenterKpi = {
  label: string;
  value: number;
  delta: string;
  tone: CommandCenterTone;
};

export type ProjectProgressSegment = {
  label: string;
  value: number;
  percent: number;
  color: string;
};

export type CommandProjectRow = {
  id: string;
  name: string;
  phase: string;
  progress: number;
  investor: string;
  updatedAt: string;
  tone: CommandCenterTone;
};

export type CommandTask = {
  id: string;
  title: string;
  projectName: string;
  dueLabel: string;
  ownerAvatarLabel: string;
};

export type CommandScheduleItem = {
  id: string;
  time: string;
  title: string;
  location: string;
  tone: CommandCenterTone;
};

export type CommandNotification = {
  id: string;
  title: string;
  time: string;
  tone: CommandCenterTone;
};

export type CommandQuickAction = {
  label: string;
  href: string;
  tone: CommandCenterTone;
};

export type CommandAiSuggestion = {
  label: string;
  value: string;
};

export type CommandCenterExecutiveWorkspaceData = {
  scopeLabel: string;
  access: ExecutiveAccessPolicy | null;
  accessibleScope: ExecutiveAccessibleScope | null;
  organizations: ExecutiveOrganization[];
  roleDefinitions: ExecutiveRoleDefinition[];
  axisDefinitions: ExecutiveAxisDefinition[];
  dashboardLayers: ExecutiveDashboardLayer[];
  escalationRules: ExecutiveEscalationRule[];
  riskGroups: ExecutiveRiskGroupMetadata[];
  globalStatusItems: ExecutiveGlobalStatusItem[];
  overviewCards: ExecutiveOverviewCard[];
  commandCenterSnapshot: ExecutiveCommandCenterSnapshot;
  leadershipActionItems: ExecutiveLeadershipActionItem[];
  projects: ExecutiveProjectRow[];
  strategicPlans: StrategicInvestmentPlan[];
  leadershipTeam: ExecutiveLeader[];
  directives: ExecutiveDirective[];
  meetings: LeadershipMeeting[];
  approvals: LeadershipApproval[];
  decisionLog: ExecutiveDecisionLogItem[];
  auditLog: ExecutiveAuditLogItem[];
  aiInsights: ExecutiveAiInsight[];
  aiLeadershipSummary: ExecutiveAiLeadershipSummary;
};

export type CommandCenterAxisOneDashboardData = {
  summary: AxisOneDashboardSummary;
  stages: AxisOneDevelopmentStage[];
  missingDocuments: Array<{
    id: string;
    name: string;
    owner: string;
    stageCode: string;
    stageTitle: string;
    dueDate?: string;
    href: string;
  }>;
  openTasks: Array<{
    id: string;
    title: string;
    assignee: string;
    deadline: string;
    status: AxisOneTaskStatus;
    priority: AxisOneRiskLevel;
    stageCode: string;
    stageTitle: string;
    href: string;
  }>;
  riskAlerts: Array<{
    id: string;
    stageId: string;
    title: string;
    riskLevel: AxisOneRiskLevel;
    reason: string;
    deadline: string;
    href: string;
  }>;
};

export type CommandCenterData = {
  axes: CommandCenterAxis[];
  approvalCenter: ApprovalCenterData | null;
  executiveCommonCenter: ExecutiveCommonCenterData | null;
  executiveDashboard: ExecutiveDashboardData | null;
  executiveMorningBriefing: ExecutiveMorningBriefingData | null;
  executivePrivateWorkspace: ExecutivePrivateWorkspaceData | null;
  executiveWorkspace: CommandCenterExecutiveWorkspaceData;
  operationsDashboard: DashboardData;
  axisOneDashboard: CommandCenterAxisOneDashboardData;
  kpis: CommandCenterKpi[];
  progressSegments: ProjectProgressSegment[];
  overdueTasks: CommandTask[];
  projects: CommandProjectRow[];
  schedule: CommandScheduleItem[];
  quickActions: CommandQuickAction[];
  notifications: CommandNotification[];
  aiSuggestions: CommandAiSuggestion[];
};
