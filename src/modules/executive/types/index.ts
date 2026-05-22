import type { Role } from "@/constants/roles";

export type ExecutiveTone =
  | "blue"
  | "emerald"
  | "amber"
  | "purple"
  | "red"
  | "slate";

export type ExecutivePageKey =
  | "dashboard"
  | "investment-plans"
  | "leadership-team"
  | "directives"
  | "meetings"
  | "approvals"
  | "decision-log";

export type ExecutiveAccessLevel =
  | "owner"
  | "founder"
  | "admin"
  | "leader"
  | "project_director"
  | "department_head"
  | "viewer";

export type ExecutiveOperatingRole =
  | "CHAIRMAN"
  | "CEO"
  | "PROJECT_DIRECTOR"
  | "DEPARTMENT_HEAD"
  | "STAFF";

export type ExecutiveScopeType =
  | "global"
  | "portfolio"
  | "project"
  | "department"
  | "task";

export type ExecutiveApprovalAuthorityLevel =
  | "DEPARTMENT_HEAD"
  | "PROJECT_DIRECTOR"
  | "CEO"
  | "CHAIRMAN";

export type ExecutiveRiskLevel = "low" | "medium" | "high" | "critical";

export type ExecutiveApprovalCategory =
  | "legal_approval"
  | "planning_approval"
  | "design_approval"
  | "feasibility_approval"
  | "investment_approval"
  | "contractor_approval"
  | "material_approval"
  | "progress_approval"
  | "variation_order_approval"
  | "acceptance_approval"
  | "payment_approval"
  | "budget_approval"
  | "executive_payment_approval"
  | "kpi_approval"
  | "strategy_approval"
  | "permission_approval";

export type ExecutiveRiskCategory =
  | "legal_risk"
  | "land_risk"
  | "planning_risk"
  | "approval_risk"
  | "schedule_risk"
  | "delay_risk"
  | "quality_risk"
  | "safety_risk"
  | "contractor_risk"
  | "cost_overrun_risk"
  | "material_risk"
  | "cashflow_risk"
  | "operational_risk"
  | "permission_risk"
  | "compliance_risk"
  | "system_risk";

export type ExecutiveDashboardViewMode =
  | "system_overview"
  | "by_project"
  | "by_axis"
  | "by_risk"
  | "pending_approval";

export type ExecutiveAccessPolicy = {
  level: ExecutiveAccessLevel;
  label: string;
  operatingRole: ExecutiveOperatingRole;
  scopeType: ExecutiveScopeType;
  canView: boolean;
  canViewGlobalDashboard: boolean;
  canViewProjectDashboard: boolean;
  canViewDepartmentSummary: boolean;
  canCreatePlan: boolean;
  canApprovePlan: boolean;
  canCreateDirective: boolean;
  canCreateMeetingAction: boolean;
  canApproveProposal: boolean;
  canViewAudit: boolean;
  canUseAiPanel: boolean;
  approvalLevels: ExecutiveApprovalAuthorityLevel[];
};

export type ExecutiveOrganization = {
  id: string;
  name: string;
  code: string;
  type: "internal" | "managed_external";
  isolationLabel: string;
};

export type ExecutiveDataScope = {
  organizationId: string;
  projectId?: string;
  axisId: ExecutiveCommandCenterAxisKey;
  moduleId: string;
  role: ExecutiveOperatingRole;
  permission: string;
};

export type ExecutiveConfigResource = "all" | "by_organization" | string[];

export type ExecutiveRoleDecisionVisibility = {
  approvalLevels: ExecutiveApprovalAuthorityLevel[];
  riskLevels: ExecutiveRiskLevel[];
  projectImportances: Array<"standard" | "important" | "strategic">;
  includeLegalImpact: boolean;
  includeScheduleImpact: boolean;
  includeTodayDecisions: boolean;
};

export type ExecutiveRoleDefinition = {
  role: ExecutiveOperatingRole;
  label: string;
  hierarchyLevel: number;
  scope: string;
  manages: string[];
  doesNotHandle: string[];
  dashboardLayers: Array<ExecutiveDashboardLayer["layer"]>;
  decisionVisibility: ExecutiveRoleDecisionVisibility;
};

export type ExecutiveAxisModuleDefinition = {
  id: string;
  label: string;
  executiveScope: string;
};

export type ExecutiveAxisDefinition = {
  id: ExecutiveCommandCenterAxisKey;
  label: string;
  englishLabel: string;
  description: string;
  modules: ExecutiveAxisModuleDefinition[];
  approvalCategories: ExecutiveApprovalCategory[];
  riskCategories: ExecutiveRiskCategory[];
};

export type ExecutiveScopeRule = {
  id: string;
  description: string;
  roles?: Role[];
  accessLevels?: ExecutiveAccessLevel[];
  userIdIncludes?: string;
  operatingRole: ExecutiveOperatingRole;
  scopeType: ExecutiveScopeType;
  organizationIds: ExecutiveConfigResource;
  projectIds: ExecutiveConfigResource;
  axisIds: ExecutiveConfigResource;
  moduleIds: ExecutiveConfigResource;
  permission: string;
  canViewAllOrganizations?: boolean;
  canViewAllProjects?: boolean;
};

export type ExecutiveAccessibleScope = {
  operatingRole: ExecutiveOperatingRole;
  scopeType: ExecutiveScopeType;
  organizationIds: string[];
  projectIds: string[];
  axisIds: ExecutiveCommandCenterAxisKey[];
  moduleIds: string[];
  permission: string;
  canViewAllOrganizations: boolean;
  canViewAllProjects: boolean;
};

export type ExecutiveDashboardKpi = {
  id: string;
  label: string;
  value: string | number;
  helper: string;
  tone: ExecutiveTone;
};

export type ExecutiveDashboardLayer = {
  id: string;
  layer: "global" | "project" | "department";
  title: string;
  description: string;
  targetRole: ExecutiveOperatingRole;
  scopeLabel: string;
  kpis: ExecutiveDashboardKpi[];
};

export type ExecutiveEscalationRule = {
  id: string;
  approvalLevel: ExecutiveApprovalAuthorityLevel;
  thresholdLabel: string;
  amountMin?: number;
  amountMax?: number;
  autoEscalationSignals: string[];
};

export type ExecutiveDashboardMetric = {
  label: string;
  value: string | number;
  helper: string;
  delta: string;
  tone: ExecutiveTone;
};

export type ExecutiveGlobalStatusKind =
  | "active_projects"
  | "legal_blockers"
  | "pending_approvals"
  | "today_meetings"
  | "risk_level";

export type ExecutiveGlobalStatusItem = {
  id: string;
  kind: ExecutiveGlobalStatusKind;
  label: string;
  value: string | number;
  helper: string;
  tone: ExecutiveTone;
};

export type ExecutiveProgressSegment = {
  label: string;
  value: number;
  percent: number;
  color: string;
};

export type ExecutiveProjectRow = {
  id: string;
  projectId: string;
  organizationId: string;
  organizationName: string;
  name: string;
  phase: string;
  progress: number;
  investor: string;
  health: "green" | "yellow" | "red";
  cashFlowLabel: string;
  strategicImportance: "standard" | "important" | "strategic";
  updatedAt: string;
  tone: ExecutiveTone;
};

export type ExecutiveUrgentItem = {
  id: string;
  projectId: string;
  title: string;
  projectName: string;
  dueLabel: string;
  ownerAvatarLabel: string;
  tone: ExecutiveTone;
};

export type ExecutiveOverviewCardKey =
  | "tracked_projects"
  | "overdue_directives"
  | "legal_blockers"
  | "pending_proposals"
  | "high_risks";

export type ExecutiveOverviewCard = {
  id: string;
  key: ExecutiveOverviewCardKey;
  label: string;
  value: string | number;
  helper: string;
  tone: ExecutiveTone;
};

export type ExecutiveCommandCenterAxisKey =
  | "project_management"
  | "build_management"
  | "operations_analytics";

export type ExecutiveLeadershipActionType =
  | "directive"
  | "approval"
  | "legal"
  | "proposal"
  | "risk"
  | "payment";

export type ExecutiveLeadershipActionCategory =
  | "submission"
  | "payment_request"
  | "approval"
  | "alert"
  | "priority"
  | "overdue";

export type ExecutiveLeadershipPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ExecutiveLeadershipDueGroup =
  | "overdue"
  | "today"
  | "this_week"
  | "later";

export type ExecutiveLeadershipActionStatus =
  | "overdue"
  | "pending"
  | "in_progress"
  | "blocked"
  | "high_risk"
  | "approved"
  | "rejected"
  | "returned";

export type ExecutiveLeadershipActionItem = {
  id: string;
  organizationId: string;
  organizationName: string;
  projectId: string;
  axis: ExecutiveCommandCenterAxisKey;
  axisId: ExecutiveCommandCenterAxisKey;
  moduleId: string;
  role: ExecutiveOperatingRole;
  permission: string;
  title: string;
  type: ExecutiveLeadershipActionType;
  category: ExecutiveLeadershipActionCategory;
  projectName: string;
  ownerName: string;
  amount?: number;
  amountLabel?: string;
  riskLevel: ExecutiveRiskLevel;
  riskCategory: ExecutiveRiskCategory;
  approvalLevel: ExecutiveApprovalAuthorityLevel;
  approvalType: ApprovalRequestType;
  approvalCategory: ExecutiveApprovalCategory;
  projectImportance: "standard" | "important" | "strategic";
  legalImpact: boolean;
  scheduleImpact: boolean;
  deadline: string;
  dueGroup: ExecutiveLeadershipDueGroup;
  priority: ExecutiveLeadershipPriority;
  status: ExecutiveLeadershipActionStatus;
  decisionRequired: string;
  impactSummary: string;
  escalationReason: string;
  scope: ExecutiveDataScope;
  isScheduleImpact: boolean;
  requiresTodayDecision: boolean;
  href: string;
  tone: ExecutiveTone;
};

export type ExecutiveCommandCenterSnapshotItem = {
  id: string;
  title: string;
  description: string;
  timeLabel?: string;
  projectName?: string;
  ownerName?: string;
  href: string;
  tone: ExecutiveTone;
};

export type ExecutiveCommandCenterQuickReport = {
  id: string;
  title: string;
  value: string | number;
  helper: string;
  href: string;
  tone: ExecutiveTone;
};

export type ExecutiveCommandCenterSnapshot = {
  notes: ExecutiveCommandCenterSnapshotItem[];
  meetings: ExecutiveCommandCenterSnapshotItem[];
  workCalendar: ExecutiveCommandCenterSnapshotItem[];
  approvalQueue: ExecutiveCommandCenterSnapshotItem[];
  alerts: ExecutiveCommandCenterSnapshotItem[];
  quickReports: ExecutiveCommandCenterQuickReport[];
};

export type ExecutiveAiLeadershipSummaryItem = {
  id: string;
  projectId?: string;
  title: string;
  detail: string;
  tone: ExecutiveTone;
};

export type ExecutiveAiLeadershipSummary = {
  attentionPoints: ExecutiveAiLeadershipSummaryItem[];
  risks: ExecutiveAiLeadershipSummaryItem[];
  weeklyPriorities: ExecutiveAiLeadershipSummaryItem[];
};

export type InvestmentPlanStatus = "draft" | "reviewing" | "approved";
export type InvestmentPlanPriority = "low" | "medium" | "high" | "strategic";

export type InvestmentPlan = {
  id: string;
  projectId?: string;
  title: string;
  year: number;
  quarter: "Q1" | "Q2" | "Q3" | "Q4" | "FY";
  targetArea: string;
  projectType: string;
  budgetRange: string;
  priority: InvestmentPlanPriority;
  status: InvestmentPlanStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type StrategicInvestmentPlan = InvestmentPlan & {
  period: string;
  regionFocus: string;
  segmentFocus: string;
  budgetLabel: string;
  allocatedBudget: number;
  committedBudget: number;
  ownerName: string;
  priorities: string[];
  targetAreas: string[];
  projectTypes: string[];
};

export type LeadershipApprovalLevel =
  | "none"
  | "review"
  | "department"
  | "company"
  | "final";

export type LeadershipMember = {
  id: string;
  fullName: string;
  position: string;
  role: Role;
  email: string;
  phone: string;
  approvalLevel: LeadershipApprovalLevel;
  isActive: boolean;
};

export type ExecutiveLeader = LeadershipMember & {
  title: string;
  scope: string;
  authoritySummary: string;
  permissions: string[];
  status: "active" | "delegated";
};

export type AuthorityMatrixRow = {
  id: string;
  decisionArea: string;
  threshold: string;
  tongGiamDoc: string;
  phoTongGiamDoc: string;
  secretarySupport: string;
};

export type ExecutivePriority = "normal" | "high" | "urgent";
export type ExecutiveDirectiveStatus =
  | "open"
  | "in_progress"
  | "blocked"
  | "done";

export type ExecutiveDirective = {
  id: string;
  title: string;
  content: string;
  projectId?: string;
  assignedTo: string;
  dueDate: string;
  priority: ExecutivePriority;
  status: ExecutiveDirectiveStatus;
  createdBy: string;
  createdAt: string;
  projectName?: string;
  ownerName?: string;
  receiverName?: string;
  taskCode?: string;
};

export type LeadershipMeetingStatus = "scheduled" | "completed";

export type LeadershipMeeting = {
  id: string;
  projectId?: string;
  title: string;
  meetingDate: string;
  participants: string[];
  agenda: string[];
  summary: string;
  aiSummary: string;
  actionItems: string[];
  status: LeadershipMeetingStatus;
  opinions?: string[];
  conclusion?: string;
  decisionCount?: number;
};

export type ApprovalRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "revision_required";

export type ApprovalRequestType =
  | "investment"
  | "finance"
  | "design"
  | "legal"
  | "operation";

export type ApprovalRequest = {
  id: string;
  title: string;
  type: ApprovalRequestType;
  projectId?: string;
  requestedBy: string;
  amount?: number;
  reason: string;
  attachments: string[];
  status: ApprovalRequestStatus;
  approverId?: string;
  decisionReason?: string;
  decidedAt?: string;
};

export type LeadershipApproval = ApprovalRequest & {
  organizationId?: string;
  proposalCode: string;
  requester: string;
  amountLabel?: string;
  dueDate: string;
  riskLevel: ExecutiveRiskLevel;
  approvalLevel?: ExecutiveApprovalAuthorityLevel;
  legalImpact?: boolean;
  scheduleImpact?: boolean;
  scope?: ExecutiveDataScope;
  attachmentLabel?: string;
  version: string;
};

export type DecisionEntityType =
  | "investment_plan"
  | "directive"
  | "meeting"
  | "approval"
  | "decision";

export type DecisionLog = {
  id: string;
  entityType: DecisionEntityType;
  entityId: string;
  decision: string;
  reason: string;
  decidedBy: string;
  decidedAt: string;
  aiRecommendation?: string;
};

export type ExecutiveDecisionLogItem = DecisionLog & {
  projectId?: string;
  decisionText: string;
  source: string;
  version: string;
  status: "effective" | "follow_up" | "superseded";
};

export type ExecutiveAiInsight = {
  id: string;
  projectId?: string;
  title: string;
  summary: string;
  recommendedAction: string;
  tone: ExecutiveTone;
};

export type ExecutiveScheduleItem = {
  id: string;
  projectId?: string;
  time: string;
  title: string;
  location: string;
  tone: ExecutiveTone;
};

export type ExecutiveQuickAction = {
  label: string;
  href: string;
  tone: ExecutiveTone;
};

export type ExecutiveWorkspaceSwitchItem = {
  id: string;
  label: string;
  href: string;
  group: "Trục 1" | "Trục 2" | "Trục 3";
};

export type ExecutiveNotification = {
  id: string;
  projectId?: string;
  title: string;
  time: string;
  tone: ExecutiveTone;
};

export type ExecutiveAuditEntityType =
  | "investment_plan"
  | "directive"
  | "meeting"
  | "approval"
  | "decision";

export type ExecutiveAuditLogItem = {
  id: string;
  action: string;
  entityType: ExecutiveAuditEntityType;
  entityId: string;
  projectId?: string;
  actorId: string;
  actorName: string;
  createdAt: string;
  reason: string;
  beforeStatus?: string;
  afterStatus?: string;
};

export type ExecutiveLeadershipData = {
  scopeLabel: string;
  generatedAt: string;
  access: ExecutiveAccessPolicy;
  accessibleScope: ExecutiveAccessibleScope;
  organizations: ExecutiveOrganization[];
  roleDefinitions: ExecutiveRoleDefinition[];
  axisDefinitions: ExecutiveAxisDefinition[];
  dashboardLayers: ExecutiveDashboardLayer[];
  escalationRules: ExecutiveEscalationRule[];
  globalStatusItems: ExecutiveGlobalStatusItem[];
  workspaceSwitchItems: ExecutiveWorkspaceSwitchItem[];
  metrics: ExecutiveDashboardMetric[];
  overviewCards: ExecutiveOverviewCard[];
  commandCenterSnapshot: ExecutiveCommandCenterSnapshot;
  progressSegments: ExecutiveProgressSegment[];
  urgentItems: ExecutiveUrgentItem[];
  leadershipActionItems: ExecutiveLeadershipActionItem[];
  projects: ExecutiveProjectRow[];
  schedule: ExecutiveScheduleItem[];
  quickActions: ExecutiveQuickAction[];
  notifications: ExecutiveNotification[];
  strategicPlans: StrategicInvestmentPlan[];
  leadershipTeam: ExecutiveLeader[];
  authorityMatrix: AuthorityMatrixRow[];
  directives: ExecutiveDirective[];
  meetings: LeadershipMeeting[];
  approvals: LeadershipApproval[];
  decisionLog: ExecutiveDecisionLogItem[];
  auditLog: ExecutiveAuditLogItem[];
  aiInsights: ExecutiveAiInsight[];
  aiLeadershipSummary: ExecutiveAiLeadershipSummary;
};
