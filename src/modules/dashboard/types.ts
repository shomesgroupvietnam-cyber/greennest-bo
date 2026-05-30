import type { Document, DocumentRequirementReadinessItem } from "@/modules/documents/types";
import type { LegalStep } from "@/modules/legal/types";
import type { PermissionAction } from "@/lib/permissions/can";
import type { Project } from "@/modules/projects/types";
import type { Task } from "@/modules/tasks/types";
import type {
  ApprovalEscalationState,
  ApprovalOverdueState,
} from "@/modules/executive/types";

export type DashboardSummary = {
  totalProjects: number;
  activeProjects: number;
  overdueTasks: number;
  upcomingTasks: number;
  missingDocuments: number;
  missingRequiredDocuments: number;
  needsUpdateDocuments: number;
  blockedLegalSteps: number;
  waitingAuthorityLegalSteps: number;
  overallProgress: number;
};

export type DashboardPermissions = {
  canViewProjects: boolean;
  canViewTasks: boolean;
  canViewDocuments: boolean;
  canViewLegal: boolean;
  canViewFinance: boolean;
  canViewDesign: boolean;
  canViewConstruction: boolean;
};

export type DashboardData = {
  summary: DashboardSummary;
  permissions: DashboardPermissions;
  projects: Project[];
  overdueTasks: Task[];
  upcomingTasks: Task[];
  tasksDueThisWeek: Task[];
  missingDocuments: Document[];
  missingRequiredDocuments: DocumentRequirementReadinessItem[];
  needsUpdateDocuments: Document[];
  blockedLegalSteps: LegalStep[];
  waitingAuthorityLegalSteps: LegalStep[];
  generatedAt: string;
  progressFormula: string;
};

export type ExecutiveDashboardSourceType =
  | "project"
  | "proposal"
  | "leadership_approval"
  | "executive_action"
  | "meeting"
  | "decision"
  | "risk";

export type ExecutiveDashboardTone =
  | "blue"
  | "emerald"
  | "amber"
  | "purple"
  | "red"
  | "slate";

export type ExecutiveDrilldownPermissionState =
  | "allowed"
  | "read_only"
  | "denied";

export type ExecutiveDrilldownLinkedRecordType =
  | ExecutiveDashboardSourceType
  | "document"
  | "legal"
  | "task";

export type ExecutiveDrilldownLinkedRecord = {
  id: string;
  type: ExecutiveDrilldownLinkedRecordType;
  title: string;
  status?: string;
  href?: string;
  permissionState: ExecutiveDrilldownPermissionState;
  reason?: string;
};

export type ExecutiveDrilldownAction = {
  id: string;
  label: string;
  href?: string;
  actionKey?: PermissionAction;
  enabled: boolean;
  reason?: string;
};

export type ExecutiveDrilldownTimelineItem = {
  id: string;
  label: string;
  timestamp?: string;
  actor?: string;
  status?: string;
};

export type ExecutiveDrilldownAuditItem = {
  id: string;
  action: string;
  actor?: string;
  timestamp?: string;
  reason?: string;
};

export type ExecutiveDashboardSourceItem = {
  id: string;
  sourceType: ExecutiveDashboardSourceType;
  sourceId: string;
  projectId?: string;
  href?: string;
  title: string;
  status: string;
  tone: ExecutiveDashboardTone;
  owner?: string;
  deadline?: string;
  reason?: string;
  overdue?: ApprovalOverdueState;
  escalation?: ApprovalEscalationState;
  scopeLabel?: string;
  linkedRecords?: ExecutiveDrilldownLinkedRecord[];
  availableActions?: ExecutiveDrilldownAction[];
  timeline?: ExecutiveDrilldownTimelineItem[];
  auditTrail?: ExecutiveDrilldownAuditItem[];
  permissionState?: ExecutiveDrilldownPermissionState;
  deniedReason?: string;
};

export type ExecutiveDashboardScope = {
  selectedScopeId: string;
  scopeLabel: string;
  organizationIds: string[];
  projectIds: string[];
  axisIds: string[];
  moduleIds: string[];
  operatingRole?: string;
};

export type ExecutiveDashboardPermissions = {
  canViewProjects: boolean;
  canViewProposals: boolean;
  canViewMeetings: boolean;
  canViewDecisions: boolean;
  canViewRisk: boolean;
  canViewFinance: boolean;
  canDrillDown: boolean;
};

export type ExecutiveProjectPortfolioItem = ExecutiveDashboardSourceItem & {
  health: "green" | "yellow" | "red";
  progress?: number;
  phase?: string;
  investor?: string;
  financialAccess: "allowed" | "no_permission";
  cashFlowLabel?: string;
};

export type ExecutiveProjectPortfolio = {
  total: number;
  active: number;
  red: number;
  yellow: number;
  green: number;
  items: ExecutiveProjectPortfolioItem[];
};

export type ExecutiveDashboardKpi = {
  id: string;
  label: string;
  value: number | string;
  tone: ExecutiveDashboardTone;
  sourceType?: ExecutiveDashboardSourceType;
  sourceId?: string;
  reason?: string;
};

export type ExecutiveFinancialSummary =
  | {
      state: "allowed";
      access: "full" | "partial";
      visibleAmountTotal: number;
      visibleRecordCount: number;
      currency: "VND";
      items: Array<{
        id: string;
        sourceType: ExecutiveDashboardSourceType;
        sourceId: string;
        projectId?: string;
        amount: number;
        amountLabel: string;
      }>;
    }
  | {
      state: "no_permission";
      reason: string;
    };

export type ExecutiveApprovalItem = ExecutiveDashboardSourceItem & {
  priority?: string;
  riskLevel?: string;
  approvalLevel?: string;
  financialAccess: "allowed" | "no_permission";
  amount?: number;
  amountLabel?: string;
};

export type ExecutiveApprovalSummary = {
  pending: number;
  overdue: number;
  highRisk: number;
  items: ExecutiveApprovalItem[];
};

export type ExecutiveRiskItem = ExecutiveDashboardSourceItem & {
  severity: "low" | "medium" | "high" | "critical";
  category?: string;
};

export type ExecutiveRiskSummary = {
  critical: number;
  high: number;
  byCategory: Record<string, number>;
  items: ExecutiveRiskItem[];
};

export type ExecutiveDeadlineSummary = {
  overdue: number;
  today: number;
  items: ExecutiveDashboardSourceItem[];
};

export type ExecutiveDecisionItem = ExecutiveDashboardSourceItem & {
  decidedAt?: string;
  decidedBy?: string;
};

export type ExecutiveRecentDecisions = {
  items: ExecutiveDecisionItem[];
};

export type ExecutiveMeetingSnapshot = {
  total: number;
  today: number;
  upcoming: number;
  followUpsOverdue: number;
  items: ExecutiveDashboardSourceItem[];
};

export type ExecutiveDashboardSourceCounts = {
  projects: number;
  proposals: number;
  leadershipApprovals: number;
  executiveActions: number;
  meetings: number;
  decisions: number;
};

export type ExecutiveDashboardData = {
  generatedAt: string;
  scope: ExecutiveDashboardScope;
  permissions: ExecutiveDashboardPermissions;
  projectPortfolio: ExecutiveProjectPortfolio;
  kpis: ExecutiveDashboardKpi[];
  financialSummary: ExecutiveFinancialSummary;
  approvalSummary: ExecutiveApprovalSummary;
  riskSummary: ExecutiveRiskSummary;
  todayDeadlines: ExecutiveDeadlineSummary;
  recentDecisions: ExecutiveRecentDecisions;
  meetingSnapshot: ExecutiveMeetingSnapshot;
  sourceCounts: ExecutiveDashboardSourceCounts;
};

export type ExecutiveMorningBriefingCitation = {
  id: string;
  sourceType: ExecutiveDashboardSourceType;
  sourceId: string;
  projectId?: string;
  title: string;
  href?: string;
};

export type ExecutiveMorningBriefingSummaryStatus =
  | "draft"
  | "placeholder"
  | "insufficient_context";

export type ExecutiveMorningBriefingSummary = {
  status: ExecutiveMorningBriefingSummaryStatus;
  text: string;
  citations: ExecutiveMorningBriefingCitation[];
  generatedFrom: string[];
  updatedAt: string;
};

export type ExecutiveMorningBriefingProjectHealth = {
  total: number;
  red: number;
  yellow: number;
  green: number;
  items: ExecutiveProjectPortfolioItem[];
};

export type ExecutiveMorningBriefingData = {
  generatedAt: string;
  scope: ExecutiveDashboardScope;
  permissions: ExecutiveDashboardPermissions;
  summary: ExecutiveMorningBriefingSummary;
  kpisToday: ExecutiveDashboardKpi[];
  topRisks: ExecutiveRiskItem[];
  decisionsToday: ExecutiveDashboardSourceItem[];
  overdueApprovals: ExecutiveApprovalItem[];
  projectHealth: ExecutiveMorningBriefingProjectHealth;
  meetingSnapshot: ExecutiveMeetingSnapshot;
  sourceCounts: ExecutiveDashboardSourceCounts;
};

export type ExecutiveCommonCenterPriorityItem = ExecutiveDashboardSourceItem & {
  amountLabel?: string;
  financialAccess?: "allowed" | "no_permission";
  groupLabel: string;
  priorityLabel: string;
  priority?: string;
  riskLevel?: string;
  score: number;
};

export type ExecutiveCommonCenterNotification = {
  id: string;
  title: string;
  description: string;
  timeLabel?: string;
  tone: ExecutiveDashboardTone;
  sourceType?: ExecutiveDashboardSourceType;
  sourceId?: string;
  projectId?: string;
  href?: string;
};

export type ExecutiveCommonCenterDecisionHighlight =
  ExecutiveDashboardSourceItem & {
    decidedAt?: string;
    decidedBy?: string;
    highlightLabel: "Moi" | "Quyet dinh Chu tich" | "Chi dao";
  };

export type ExecutiveCommonCenterCalendarItem = ExecutiveDashboardSourceItem & {
  eventType: "meeting" | "schedule" | "event";
  timeLabel?: string;
};

export type ExecutiveCommonCenterRiskOverview = {
  critical: number;
  high: number;
  byCategory: Record<string, number>;
  items: ExecutiveRiskItem[];
};

export type ExecutiveCommonCenterStrategyItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  tone: ExecutiveDashboardTone;
  owner?: string;
  projectId?: string;
  href?: string;
};

export type ExecutiveCommonCenterThresholdBreach =
  ExecutiveCommonCenterPriorityItem & {
    breachReason: string;
  };

export type ExecutiveCommonCenterSourceCounts = ExecutiveDashboardSourceCounts & {
  calendarItems: number;
  notifications: number;
  strategyItems: number;
  thresholdBreaches: number;
};

export type ExecutiveCommonCenterData = {
  generatedAt: string;
  scope: ExecutiveDashboardScope;
  permissions: ExecutiveDashboardPermissions;
  commonKpis: ExecutiveDashboardKpi[];
  priorityItems: ExecutiveCommonCenterPriorityItem[];
  notifications: ExecutiveCommonCenterNotification[];
  decisionHighlights: ExecutiveCommonCenterDecisionHighlight[];
  calendarItems: ExecutiveCommonCenterCalendarItem[];
  riskOverview: ExecutiveCommonCenterRiskOverview;
  strategyItems: ExecutiveCommonCenterStrategyItem[];
  systemDeadlines: ExecutiveDashboardSourceItem[];
  thresholdBreaches: ExecutiveCommonCenterThresholdBreach[];
  sourceCounts: ExecutiveCommonCenterSourceCounts;
};
