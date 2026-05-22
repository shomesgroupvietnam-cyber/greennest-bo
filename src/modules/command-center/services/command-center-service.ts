import type { PermissionUser } from "@/lib/permissions/can";
import { can } from "@/lib/permissions/can";
import {
  getAxisOneDashboardSummary,
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
import { canAccessExecutiveModule } from "@/modules/executive/constants";
import { getExecutiveLeadershipData } from "@/modules/executive/services/executive-service";

function buildAxes(user: PermissionUser): CommandCenterAxis[] {
  const canViewExecutive = canAccessExecutiveModule(user.role);
  const canViewAxisOne = can(user, "axis1.view");

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
        ...(can(user, "legal.view")
          ? [
              {
                code: "03",
                label: "Pháp lý",
                href: "/legal",
                viewKey: "axis1-legal",
              },
            ]
          : []),
        ...(can(user, "design.view")
          ? [
              {
                code: "04",
                label: "Thiết kế - Quy hoạch - Kỹ thuật - BIM",
                href: "/design-workspace",
                viewKey: "axis1-design-technical-bim",
              },
            ]
          : []),
        ...(can(user, "proposal.view")
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
        ...(can(user, "project.view")
          ? [
              {
                code: "01",
                label: "Quản lý dự án",
                href: "/projects",
                viewKey: "axis2-project-management",
              },
            ]
          : []),
        ...(can(user, "contract.view")
          ? [
              {
                code: "02",
                label: "Hợp đồng",
                href: "/contract-workspace",
                viewKey: "axis2-contracts",
              },
            ]
          : []),
        ...(can(user, "project.view")
          ? [
              {
                code: "03",
                label: "Mua sắm - Nhà thầu",
                href: "/project-workbench",
                viewKey: "axis2-procurement",
              },
            ]
          : []),
        ...(can(user, "construction.view")
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
        ...(can(user, "qa.view")
          ? [
              {
                code: "05",
                label: "Quản lý chất lượng",
                href: "/quality-workspace",
                viewKey: "axis2-quality",
              },
            ]
          : []),
        ...(can(user, "safety.view")
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
        ...(can(user, "finance.view")
          ? [
              {
                code: "01",
                label: "Tài chính - Kế toán",
                href: "/finance-management-workspace",
                viewKey: "axis3-finance-accounting",
              },
            ]
          : []),
        ...(can(user, "hr.view")
          ? [
              {
                code: "02",
                label: "Quản trị nhân sự",
                href: "/hr-workspace",
                viewKey: "axis3-human-resources",
              },
            ]
          : []),
        ...(can(user, "document.view")
          ? [
              {
                code: "03",
                label: "Quản trị tài liệu",
                href: "/documents",
                viewKey: "axis3-documents",
              },
            ]
          : []),
        ...(can(user, "report.view")
          ? [
              {
                code: "04",
                label: "Báo cáo - Thống kê",
                href: "/reports",
                viewKey: "axis3-reports",
              },
            ]
          : []),
        ...(can(user, "settings.manage")
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

export async function getCommandCenterData(
  user: PermissionUser,
): Promise<CommandCenterData> {
  const canViewExecutive = canAccessExecutiveModule(user.role);
  const [operationsDashboard, executiveData] = await Promise.all([
    getDashboardData(user),
    canViewExecutive ? getExecutiveLeadershipData(user) : null,
  ]);
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
    axes: buildAxes(user),
    executiveWorkspace,
    operationsDashboard,
    axisOneDashboard: {
      summary: getAxisOneDashboardSummary(),
      stages: getAxisOneStages(),
      missingDocuments: getAxisOneMissingDocuments(),
      openTasks: getAxisOneOpenTasks(),
      riskAlerts: getAxisOneRiskAlerts(),
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
