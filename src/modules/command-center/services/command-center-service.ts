import {
  can,
  PERMISSIONS,
  type PermissionAction,
  type PermissionUser,
} from "@/lib/permissions/can";
import {
  canAccessScopedAction,
  hasAnyScopedActionGrant,
  requiresAssignmentScopeForRole,
} from "@/lib/permissions/access-scope";
import { selectScopeAssignmentsForUser } from "@/lib/permissions/navigation-context";
import {
  getAxisOneMissingDocuments,
  getAxisOneOpenTasks,
  getAxisOneRiskAlerts,
  getAxisOneStages,
} from "@/modules/axis-1/services/axis-one-service";
import type {
  CommandAiSuggestion,
  CommandCenterAxis,
  CommandCenterData,
  CommandCenterKpi,
  CommandNotification,
  CommandProjectRow,
  CommandQuickAction,
  CommandScheduleItem,
  CommandTask,
  ProjectProgressSegment,
} from "@/modules/command-center/types";
import { getDashboardData } from "@/modules/dashboard/services/dashboard-service";
import { getExecutiveCommonCenterData } from "@/modules/dashboard/services/executive-common-center-service";
import { getExecutiveDashboardData } from "@/modules/dashboard/services/executive-dashboard-service";
import { getExecutiveMorningBriefingData } from "@/modules/dashboard/services/executive-morning-briefing-service";
import { canAccessExecutiveModule } from "@/modules/executive/constants";
import { getExecutiveLeadershipData } from "@/modules/executive/services/executive-service";
import { listActiveDelegationsForDelegate } from "@/modules/settings/services/leadership-delegation-service";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import { listActiveScopeAssignments } from "@/modules/settings/services/scope-assignment-service";
import type { LeadershipDelegation, RolePermissionCatalog, ScopeAssignment } from "@/modules/settings/types";
import { getExecutivePrivateWorkspaceData } from "@/modules/workspaces/services/executive-private-workspace-service";
import { getApprovalCenterData } from "@/modules/proposals/services/approval-center-service";

const executiveWorkspacePermissions = [
  "project.view",
  "task.view",
  "document.view",
  "legal.view",
  "finance.view",
  "meeting.view",
  "decision.approve",
  "proposal.view",
  "proposal.approve",
] as const;

function buildAxes(
  user: PermissionUser,
  access: {
    canViewAxisOne?: boolean;
    canViewExecutive?: boolean;
    canViewPrivateWorkspace?: boolean;
    scopedPermissions?: ReadonlySet<PermissionAction>;
  } = {},
): CommandCenterAxis[] {
  const hasPermission = (permission: PermissionAction) =>
    can(user, permission) || (access.scopedPermissions?.has(permission) ?? false);
  const canViewExecutive =
    access.canViewExecutive ?? canAccessExecutiveModule(user.role);
  const canViewPrivateWorkspace =
    access.canViewPrivateWorkspace ?? canViewExecutive;
  const canViewAxisOne = access.canViewAxisOne ?? can(user, "axis1.view");

  const axes: CommandCenterAxis[] = [
    {
      title: "Dự án | Project Management",
      tone: "emerald",
      items: [
        ...(canViewExecutive
          ? [
              {
                code: "01",
                label: "Ban lãnh đạo",
                href: "/command-center?view=executive-dashboard",
                viewKey: "executive-dashboard",
                children: [
                  {
                    label: "Dashboard Tong Quan",
                    href: "/command-center?view=executive-dashboard",
                    viewKey: "executive-dashboard",
                  },
                  {
                    label: "Morning Briefing",
                    href: "/command-center?view=executive-morning-briefing",
                    viewKey: "executive-morning-briefing",
                  },
                  {
                    label: "Executive Common Center",
                    href: "/command-center?view=executive-common-center",
                    viewKey: "executive-common-center",
                  },
                  {
                    label: "Approval Center",
                    href: "/command-center?view=executive-approvals",
                    viewKey: "executive-approvals",
                  },
                  {
                    label: "Private Workspace",
                    href: "/command-center?view=executive-private-workspace",
                    viewKey: "executive-private-workspace",
                  },
                ],
              },
            ]
          : canViewPrivateWorkspace
            ? [
                {
                  code: "01",
                  label: "Private Workspace",
                  href: "/command-center?view=executive-private-workspace",
                  viewKey: "executive-private-workspace",
                },
              ]
          : []),
        ...(canViewAxisOne
          ? [
              {
                code: "02",
                label: "Tìm kiếm & PT dự án",
                href: "/command-center?view=axis1-search-development",
                viewKey: "axis1-search-development",
              },
            ]
          : []),
        ...(hasPermission("legal.view")
          ? [
              {
                code: "03",
                label: "Pháp lý",
                href: "/legal",
                viewKey: "axis1-legal",
              },
            ]
          : []),
        ...(hasPermission("design.view")
          ? [
              {
                code: "04",
                label: "Thiết kế - Quy hoạch - Kỹ thuật - BIM",
                href: "/design-workspace",
                viewKey: "axis1-design-technical-bim",
              },
            ]
          : []),
        ...(hasPermission("proposal.view")
          ? [
              {
                code: "05",
                label: "Đề xuất - Họp - Phê duyệt nội bộ",
                href: "/proposals",
                viewKey: "axis1-internal-approval",
              },
            ]
          : []),
      ],
    },
    {
      title: "Kiến tạo | Build Management",
      tone: "blue",
      items: [
        ...(hasPermission("project.view")
          ? [
              {
                code: "01",
                label: "Quản lý dự án",
                href: "/projects",
                viewKey: "axis2-project-management",
              },
            ]
          : []),
        ...(hasPermission("contract.view")
          ? [
              {
                code: "02",
                label: "Hợp đồng",
                href: "/contract-workspace",
                viewKey: "axis2-contracts",
              },
            ]
          : []),
        ...(hasPermission("project.view")
          ? [
              {
                code: "03",
                label: "Mua sắm - Nhà thầu",
                href: "/project-workbench",
                viewKey: "axis2-procurement",
              },
            ]
          : []),
        ...(hasPermission("construction.view")
          ? [
              {
                code: "04",
                label: "Thi công",
                href: "/construction-workspace",
                viewKey: "axis2-construction",
              },
              {
                code: "07",
                label: "Nghiệm thu - Bàn giao",
                href: "/construction-workspace",
                viewKey: "axis2-handover",
              },
            ]
          : []),
        ...(hasPermission("qa.view")
          ? [
              {
                code: "05",
                label: "Quản lý chất lượng",
                href: "/quality-workspace",
                viewKey: "axis2-quality",
              },
            ]
          : []),
        ...(hasPermission("safety.view")
          ? [
              {
                code: "06",
                label: "An toàn - Môi trường",
                href: "/safety-workspace",
                viewKey: "axis2-safety",
              },
            ]
          : []),
      ],
    },
    {
      title: "Điều hành | Operations & Analytics",
      tone: "purple",
      items: [
        {
          code: "00",
          label: "Dashboard vận hành",
          href: "/command-center?view=operations-dashboard",
          viewKey: "operations-dashboard",
        },
        ...(hasPermission("finance.view")
          ? [
              {
                code: "01",
                label: "Tài chính - Kế toán",
                href: "/finance-management-workspace",
                viewKey: "axis3-finance-accounting",
              },
            ]
          : []),
        ...(hasPermission("hr.view")
          ? [
              {
                code: "02",
                label: "Quản trị nhân sự",
                href: "/hr-workspace",
                viewKey: "axis3-human-resources",
              },
            ]
          : []),
        ...(hasPermission("document.view")
          ? [
              {
                code: "03",
                label: "Quản trị tài liệu",
                href: "/documents",
                viewKey: "axis3-documents",
              },
            ]
          : []),
        ...(hasPermission("report.view")
          ? [
              {
                code: "04",
                label: "Báo cáo - Thống kê",
                href: "/reports",
                viewKey: "axis3-reports",
              },
            ]
          : []),
        ...(hasPermission("settings.manage")
          ? [
              {
                code: "05",
                label: "Hệ thống - Cấu hình",
                href: "/settings",
                viewKey: "axis3-settings",
              },
            ]
          : []),
      ],
    },
  ];

  return axes.filter((axis) => axis.items.length > 0);
}

function summarizeAxisOneStages(stages: ReturnType<typeof getAxisOneStages>) {
  const completedStages = stages.filter(
    (stage) => stage.status === "completed",
  ).length;

  return {
    totalStages: stages.length,
    completedStages,
    completionRate:
      stages.length > 0
        ? Math.round(
            stages.reduce((total, stage) => total + stage.progress, 0) /
              stages.length,
          )
        : 0,
    missingDocuments: stages.reduce(
      (count, stage) =>
        count +
        stage.requiredDocuments.filter((document) => document.status === "missing")
          .length,
      0,
    ),
    openTasks: stages.reduce(
      (count, stage) =>
        count + stage.tasks.filter((task) => task.status !== "done").length,
      0,
    ),
    blockedStages: stages.filter((stage) => stage.status === "blocked").length,
    highRiskStages: stages.filter((stage) =>
      ["high", "critical"].includes(stage.riskLevel),
    ).length,
  };
}

function buildScopedAxisOneDashboard(
  user: PermissionUser,
  scopeAssignments: ScopeAssignment[],
  rolePermissionCatalog: RolePermissionCatalog,
) {
  const stages = getAxisOneStages().filter((stage) =>
    canAccessScopedAction(
      user,
      "axis1.view",
      {
        axisId: "project_management",
        moduleId: "axis1",
        projectId: stage.projectId,
        recordId: stage.id,
        workstreamId: "axis1",
      },
      {
        rolePermissionCatalog,
        scopeAssignments,
      },
    ),
  );

  return buildAxisOneDashboardFromStages(stages);
}

function buildAxisOneDashboardFromStages(
  stages: ReturnType<typeof getAxisOneStages>,
) {
  const stageIds = new Set(stages.map((stage) => stage.id));

  return {
    summary: summarizeAxisOneStages(stages),
    stages,
    missingDocuments: getAxisOneMissingDocuments().filter((item) =>
      stageIds.has(item.stageId),
    ),
    openTasks: getAxisOneOpenTasks().filter((item) => stageIds.has(item.stageId)),
    riskAlerts: getAxisOneRiskAlerts().filter((item) => stageIds.has(item.stageId)),
  };
}

function buildKpis(
  data: CommandCenterData["operationsDashboard"],
): CommandCenterKpi[] {
  return [
    {
      label: "Dự án đang triển khai",
      value: data.summary.activeProjects,
      delta: `${data.summary.totalProjects} tổng dự án`,
      tone: "blue",
    },
    {
      label: "Công việc quá hạn",
      value: data.summary.overdueTasks,
      delta: `${data.summary.upcomingTasks} việc sắp đến hạn`,
      tone: data.summary.overdueTasks > 0 ? "red" : "emerald",
    },
    {
      label: "Hồ sơ cần xử lý",
      value:
        data.summary.missingDocuments +
        data.summary.needsUpdateDocuments +
        data.summary.missingRequiredDocuments,
      delta: `${data.summary.needsUpdateDocuments} hồ sơ cần bổ sung`,
      tone: "amber",
    },
    {
      label: "Pháp lý vướng",
      value: data.summary.blockedLegalSteps,
      delta: `${data.summary.waitingAuthorityLegalSteps} bước chờ cơ quan`,
      tone: data.summary.blockedLegalSteps > 0 ? "red" : "emerald",
    },
    {
      label: "Tiến độ tổng",
      value: data.summary.overallProgress,
      delta: "Tính từ task, hồ sơ và pháp lý",
      tone: "purple",
    },
  ];
}

function buildProgressSegments(
  data: CommandCenterData["operationsDashboard"],
): ProjectProgressSegment[] {
  const documentIssues =
    data.summary.missingDocuments +
    data.summary.needsUpdateDocuments +
    data.summary.missingRequiredDocuments;

  return [
    {
      label: "Dự án active",
      value: data.summary.activeProjects,
      percent:
        data.summary.totalProjects > 0
          ? Math.round(
              (data.summary.activeProjects / data.summary.totalProjects) * 100,
            )
          : 0,
      color: "#22c55e",
    },
    {
      label: "Việc quá hạn",
      value: data.summary.overdueTasks,
      percent: data.summary.overdueTasks > 0 ? 25 : 0,
      color: "#ef4444",
    },
    {
      label: "Hồ sơ cần xử lý",
      value: documentIssues,
      percent: documentIssues > 0 ? 25 : 0,
      color: "#f59e0b",
    },
    {
      label: "Pháp lý vướng",
      value: data.summary.blockedLegalSteps,
      percent: data.summary.blockedLegalSteps > 0 ? 25 : 0,
      color: "#8b5cf6",
    },
  ].filter((segment) => segment.value > 0);
}

function resolveProjectName(
  data: CommandCenterData["operationsDashboard"],
  projectId: string,
) {
  return (
    data.projects.find((project) => project.id === projectId)?.name ?? "Dự án"
  );
}

function daysOverdueLabel(dueDate?: string) {
  if (!dueDate) {
    return "Chưa có hạn";
  }

  const diffMs = Date.now() - new Date(dueDate).getTime();
  const days = Math.max(1, Math.ceil(diffMs / 86_400_000));

  return `${days} ngày`;
}

function buildOverdueTasks(
  data: CommandCenterData["operationsDashboard"],
): CommandTask[] {
  return data.overdueTasks.slice(0, 5).map((task) => ({
    id: task.id,
    title: task.title,
    projectName: resolveProjectName(data, task.projectId),
    dueLabel: daysOverdueLabel(task.dueDate),
    ownerAvatarLabel: task.assigneeId?.slice(0, 2).toUpperCase() ?? "NA",
  }));
}

function buildProjectRows(
  data: CommandCenterData["operationsDashboard"],
): CommandProjectRow[] {
  return data.projects.slice(0, 5).map((project) => ({
    id: project.id,
    name: project.name,
    phase: project.status,
    progress: data.summary.overallProgress,
    investor: project.investor ?? project.ownerName ?? "GreenNest",
    updatedAt: new Intl.DateTimeFormat("vi-VN").format(
      new Date(project.updatedAt),
    ),
    tone: project.status === "active" ? "emerald" : "slate",
  }));
}

function buildQuickActions(user: PermissionUser): CommandQuickAction[] {
  return [
    can(user, "project.create")
      ? { label: "Tạo dự án mới", href: "/projects/new", tone: "emerald" }
      : null,
    can(user, "proposal.create")
      ? {
          label: "Tạo đề xuất phê duyệt",
          href: "/proposals/new",
          tone: "purple",
        }
      : null,
    can(user, "task.create")
      ? { label: "Tạo công việc", href: "/tasks/new", tone: "amber" }
      : null,
    can(user, "meeting.create")
      ? { label: "Tạo cuộc họp", href: "/meetings/new", tone: "blue" }
      : null,
    can(user, "document.create")
      ? { label: "Tải lên tài liệu", href: "/documents/new", tone: "emerald" }
      : null,
  ].filter((action): action is CommandQuickAction => Boolean(action));
}

function buildAiSuggestions(
  data: CommandCenterData["operationsDashboard"],
): CommandAiSuggestion[] {
  return [
    {
      label: "việc quá hạn cần xử lý",
      value: String(data.summary.overdueTasks),
    },
    {
      label: "hồ sơ cần bổ sung hoặc còn thiếu",
      value: String(
        data.summary.missingDocuments +
          data.summary.needsUpdateDocuments +
          data.summary.missingRequiredDocuments,
      ),
    },
    {
      label: "bước pháp lý bị vướng",
      value: String(data.summary.blockedLegalSteps),
    },
  ];
}

function emptyExecutiveWorkspace() {
  return {
    scopeLabel: "",
    access: null,
    accessibleScope: null,
    organizations: [],
    roleDefinitions: [],
    axisDefinitions: [],
    dashboardLayers: [],
    escalationRules: [],
    riskGroups: [],
    globalStatusItems: [],
    overviewCards: [],
    commandCenterSnapshot: {
      notes: [],
      meetings: [],
      workCalendar: [],
      approvalQueue: [],
      alerts: [],
      quickReports: [],
    },
    leadershipActionItems: [],
    projects: [],
    strategicPlans: [],
    leadershipTeam: [],
    directives: [],
    meetings: [],
    approvals: [],
    decisionLog: [],
    auditLog: [],
    aiInsights: [],
    aiLeadershipSummary: {
      attentionPoints: [],
      risks: [],
      weeklyPriorities: [],
    },
  };
}

function buildScopedPermissionSet(
  user: PermissionUser,
  scopeAssignments: ScopeAssignment[],
  rolePermissionCatalog: RolePermissionCatalog,
) {
  return new Set(
    PERMISSIONS.filter((permission): permission is PermissionAction =>
      hasAnyScopedActionGrant(user, permission, {
        rolePermissionCatalog,
        scopeAssignments,
      }),
    ),
  );
}

export async function getCommandCenterData(
  user: PermissionUser,
  options: {
    delegations?: LeadershipDelegation[];
    rolePermissionCatalog?: RolePermissionCatalog;
    scopeAssignments?: ScopeAssignment[];
    selectedScopeId?: string;
  } = {},
): Promise<CommandCenterData> {
  const [scopeAssignments, rolePermissionCatalog, delegations] = await Promise.all([
    options.scopeAssignments ?? listActiveScopeAssignments(),
    options.rolePermissionCatalog ?? listRolePermissionCatalog(),
    options.delegations ?? listActiveDelegationsForDelegate(user.id),
  ]);
  const selectedScopeAssignments = selectScopeAssignmentsForUser(
    user,
    scopeAssignments,
    options.selectedScopeId,
  );
  const selectedScopeActive =
    Boolean(options.selectedScopeId) && options.selectedScopeId !== "all";
  const selectedScopeInvalid =
    selectedScopeActive && selectedScopeAssignments.length === 0;
  const ignoreImplicitAssignments =
    !selectedScopeActive &&
    ["super_admin", "admin", "tong_giam_doc"].includes(user.role);
  const effectiveScopeAssignments = ignoreImplicitAssignments
    ? []
    : selectedScopeAssignments;
  const requireScopeAssignments =
    selectedScopeActive || requiresAssignmentScopeForRole(user.role);
  const scopedPermissions = buildScopedPermissionSet(
    user,
    effectiveScopeAssignments,
    rolePermissionCatalog,
  );
  const hasExecutiveScopeGrant = effectiveScopeAssignments.some((assignment) =>
    canAccessExecutiveModule(assignment.roleKey) &&
    executiveWorkspacePermissions.some((permission) =>
      hasAnyScopedActionGrant(user, permission, {
        rolePermissionCatalog,
        scopeAssignments: [assignment],
      }),
    ),
  );
  const canViewExecutive =
    !selectedScopeInvalid &&
    (canAccessExecutiveModule(user.role) || hasExecutiveScopeGrant);
  const canViewPrivateWorkspace =
    !selectedScopeInvalid &&
    (canViewExecutive || user.role === "thu_ky_tro_ly" || user.role === "viewer");
  const canViewAxisOne = can(user, "axis1.view") || scopedPermissions.has("axis1.view");
  const [
    operationsDashboard,
    executiveData,
    executiveDashboard,
    executiveMorningBriefing,
  ] = await Promise.all([
    getDashboardData(user, {
      requireScopeAssignments,
      rolePermissionCatalog,
      scopeAssignments: effectiveScopeAssignments,
    }),
    canViewExecutive
      ? getExecutiveLeadershipData(user, {
          rolePermissionCatalog,
          selectedScopeId: options.selectedScopeId,
          scopeAssignments: effectiveScopeAssignments,
        })
      : null,
    canViewExecutive
      ? getExecutiveDashboardData(user, {
          requireScopeAssignments,
          rolePermissionCatalog,
          selectedScopeId: options.selectedScopeId,
          scopeAssignments: effectiveScopeAssignments,
        })
      : null,
    canViewExecutive
      ? getExecutiveMorningBriefingData(user, {
          requireScopeAssignments,
          rolePermissionCatalog,
          selectedScopeId: options.selectedScopeId,
          scopeAssignments: effectiveScopeAssignments,
        })
      : null,
  ]);
  const executiveCommonCenter =
    canViewExecutive && executiveDashboard
      ? await getExecutiveCommonCenterData(user, {
          dashboardData: executiveDashboard,
          executiveData,
          requireScopeAssignments,
          rolePermissionCatalog,
          selectedScopeId: options.selectedScopeId,
          scopeAssignments: effectiveScopeAssignments,
        })
      : null;
  const executivePrivateWorkspace =
    canViewExecutive ||
    selectedScopeInvalid ||
    user.role === "thu_ky_tro_ly" ||
    user.role === "viewer"
      ? await getExecutivePrivateWorkspaceData(user, {
          dashboardData: executiveDashboard ?? undefined,
          delegations,
          executiveData,
          requireScopeAssignments,
          rolePermissionCatalog,
          selectedScopeId: options.selectedScopeId,
          scopeAssignments: effectiveScopeAssignments,
        })
      : null;
  const approvalCenter =
    canViewExecutive && executiveData
      ? await getApprovalCenterData(user, {
          leadershipApprovals: executiveData.approvals,
          requireScopeAssignments,
          rolePermissionCatalog,
          selectedScopeId: options.selectedScopeId,
          scopeAssignments: effectiveScopeAssignments,
          scopeLabel: executiveData.scopeLabel,
        })
      : null;
  const executiveWorkspace = executiveData
    ? {
        scopeLabel: executiveData.scopeLabel,
        access: executiveData.access,
        accessibleScope: executiveData.accessibleScope,
        organizations: executiveData.organizations,
        roleDefinitions: executiveData.roleDefinitions,
        axisDefinitions: executiveData.axisDefinitions,
        dashboardLayers: executiveData.dashboardLayers,
        escalationRules: executiveData.escalationRules,
        riskGroups: executiveData.riskGroups,
        globalStatusItems: executiveData.globalStatusItems,
        overviewCards: executiveData.overviewCards,
        commandCenterSnapshot: executiveData.commandCenterSnapshot,
        leadershipActionItems: executiveData.leadershipActionItems,
        projects: executiveData.projects,
        strategicPlans: executiveData.strategicPlans,
        leadershipTeam: executiveData.leadershipTeam,
        directives: executiveData.directives,
        meetings: executiveData.meetings,
        approvals: executiveData.approvals,
        decisionLog: executiveData.decisionLog,
        auditLog: executiveData.auditLog,
        aiInsights: executiveData.aiInsights,
        aiLeadershipSummary: executiveData.aiLeadershipSummary,
      }
    : emptyExecutiveWorkspace();

  return {
    axes: buildAxes(user, {
      canViewAxisOne,
      canViewExecutive,
      canViewPrivateWorkspace,
      scopedPermissions,
    }),
    approvalCenter,
    executiveDashboard,
    executiveCommonCenter,
    executiveMorningBriefing,
    executivePrivateWorkspace,
    executiveWorkspace,
    operationsDashboard,
    axisOneDashboard: canViewAxisOne
      ? can(user, "axis1.view") && !selectedScopeActive
        ? buildAxisOneDashboardFromStages(getAxisOneStages())
        : buildScopedAxisOneDashboard(
            user,
            effectiveScopeAssignments,
            rolePermissionCatalog,
          )
      : {
          summary: summarizeAxisOneStages([]),
          stages: [],
          missingDocuments: [],
          openTasks: [],
          riskAlerts: [],
        },
    kpis: buildKpis(operationsDashboard),
    progressSegments: buildProgressSegments(operationsDashboard),
    overdueTasks: buildOverdueTasks(operationsDashboard),
    projects: buildProjectRows(operationsDashboard),
    schedule:
      executiveData?.schedule.map(
        (item): CommandScheduleItem => ({
          id: item.id,
          time: item.time,
          title: item.title,
          location: item.location,
          tone: item.tone,
        }),
      ) ?? [],
    quickActions: buildQuickActions(user),
    notifications:
      executiveData?.notifications.map(
        (item): CommandNotification => ({
          id: item.id,
          title: item.title,
          time: item.time,
          tone: item.tone,
        }),
      ) ?? [],
    aiSuggestions: buildAiSuggestions(operationsDashboard),
  };
}
