import type { PermissionUser } from "@/lib/permissions/can";
import { can } from "@/lib/permissions/can";
import {
  filterDecisionsForScope,
  filterDocumentsForScope,
  filterLegalStepsForScope,
  filterMeetingsForScope,
  filterProjectsForScope,
  filterTasksForScope,
  resolveAccessScope
} from "@/lib/permissions/access-scope";
import { getDashboardData } from "@/modules/dashboard/services/dashboard-service";
import { listDocuments } from "@/modules/documents/services/document-service";
import { listLegalSteps } from "@/modules/legal/services/legal-service";
import { listDecisions, listMeetings } from "@/modules/meetings/services/meeting-service";
import { listProjects } from "@/modules/projects/services/project-service";
import { isTaskOverdue, isTaskUpcoming, listTasks } from "@/modules/tasks/services/task-service";
import { listAuditLogs, listProjectMemberships, listUsers } from "@/modules/users/services/user-service";
import type { ProjectMembership } from "@/modules/users/types";
import { WORKSPACE_DEFINITIONS, type WorkspaceRoute } from "@/modules/workspaces/config";
import type { RoleWorkspaceData, WorkspaceScopedData } from "@/modules/workspaces/types";

export function applyWorkspaceScope(user: PermissionUser, data: WorkspaceScopedData): WorkspaceScopedData {
  const scope = resolveAccessScope(user, data);

  return {
    ...data,
    projects: filterProjectsForScope(data.projects, scope),
    tasks: filterTasksForScope(data.tasks, scope),
    documents: filterDocumentsForScope(data.documents, scope),
    legalSteps: filterLegalStepsForScope(data.legalSteps, scope),
    meetings: filterMeetingsForScope(data.meetings, scope),
    decisions: filterDecisionsForScope(data.decisions, scope),
    users: scope.kind === "external_limited" || scope.kind === "read_only_allowed" ? [] : data.users,
    auditLogs: scope.kind === "external_limited" || scope.kind === "read_only_allowed" ? [] : data.auditLogs,
    memberships:
      scope.kind === "external_limited" || scope.kind === "read_only_allowed"
        ? data.memberships.filter((membership) => membership.userId === user.id)
        : data.memberships
  };
}

function taskMeta(task: { dueDate?: string; priority?: string; status?: string }) {
  return [task.dueDate ? `Hạn ${task.dueDate}` : undefined, task.priority, task.status].filter(Boolean).join(" · ");
}

function buildKpis(route: WorkspaceRoute, scoped: WorkspaceScopedData, today: Date) {
  const overdueTasks = scoped.tasks.filter((task) => isTaskOverdue(task, today)).length;
  const missingDocuments = scoped.documents.filter((document) => document.status === "missing").length;
  const needsUpdateDocuments = scoped.documents.filter((document) => document.status === "needs_update").length;
  const legalAlerts = scoped.legalSteps.filter(
    (step) => step.status === "blocked" || step.status === "waiting_authority"
  ).length;
  const pendingDecisions = scoped.decisions.filter((decision) => decision.status !== "done" && decision.status !== "cancelled").length;
  const base = [
    { label: "Dự án trong phạm vi", value: scoped.projects.length, href: "/projects" },
    { label: "Việc quá hạn", value: overdueTasks, href: "/tasks?scope=overdue" },
    { label: "Hồ sơ cần bổ sung", value: missingDocuments + needsUpdateDocuments, href: "/documents" },
    { label: "Pháp lý vướng/chờ", value: legalAlerts, href: "/legal" },
    { label: "Quyết định chờ xử lý", value: pendingDecisions, href: "/meetings" }
  ];

  if (route === "/admin") {
    return [
      { label: "Người dùng", value: scoped.users.length, href: "/users" },
      { label: "Nhật ký kiểm soát", value: scoped.auditLogs.length },
      { label: "Dự án", value: scoped.projects.length, href: "/projects" },
      { label: "Vai trò cấu hình", value: "18", href: "/users" }
    ];
  }

  if (route === "/finance-workspace") {
    return [
      { label: "Việc tài chính", value: scoped.tasks.filter((task) => /tài chính|thanh toán|hợp đồng/i.test(task.category ?? task.title)).length },
      { label: "Hồ sơ thanh toán", value: scoped.documents.filter((document) => /finance|payment|contract|hợp đồng/i.test(document.docType)).length },
      { label: "Hồ sơ cần bổ sung", value: missingDocuments + needsUpdateDocuments, href: "/documents" },
      { label: "Quyền tài chính", value: "Sẵn sàng" }
    ];
  }

  if (route === "/design-workspace") {
    return [
      { label: "Việc thiết kế", value: scoped.tasks.filter((task) => /thiết kế|design/i.test(task.category ?? task.title)).length, href: "/tasks" },
      { label: "Hồ sơ thiết kế", value: scoped.documents.filter((document) => /design|drawing|thiết kế/i.test(document.docType)).length, href: "/documents" },
      { label: "Cần cập nhật", value: needsUpdateDocuments, href: "/documents" },
      { label: "Review", value: can({ id: "", role: "thiet_ke" }, "design.review") ? "Có quyền" : "Chưa bật" }
    ];
  }

  if (route === "/executive" || route === "/project-workbench" || route === "/assistant-workspace") {
    return [...base, { label: "Báo cáo snapshot", value: "Tạo", href: "/reports/new" }];
  }

  return base;
}

function buildActionItems(scoped: WorkspaceScopedData, today: Date) {
  const overdueTasks = scoped.tasks.filter((task) => isTaskOverdue(task, today)).slice(0, 4);
  const upcomingTasks = scoped.tasks.filter((task) => isTaskUpcoming(task, today, 7)).slice(0, 4);
  const documentAlerts = scoped.documents
    .filter((document) => document.status === "missing" || document.status === "needs_update")
    .slice(0, 4);
  const legalAlerts = scoped.legalSteps
    .filter((step) => step.status === "blocked" || step.status === "waiting_authority")
    .slice(0, 4);
  const decisionAlerts = scoped.decisions
    .filter((decision) => decision.status !== "done" && decision.status !== "cancelled")
    .slice(0, 4);

  return [
    ...overdueTasks.map((task) => ({
      title: task.title,
      meta: `Quá hạn · ${taskMeta(task)}`,
      href: `/tasks/${task.id}`,
      tone: "danger" as const
    })),
    ...upcomingTasks.map((task) => ({
      title: task.title,
      meta: `Sắp đến hạn · ${taskMeta(task)}`,
      href: `/tasks/${task.id}`,
      tone: "warning" as const
    })),
    ...documentAlerts.map((document) => ({
      title: document.title,
      meta: `Hồ sơ ${document.status} · ${document.version}`,
      href: `/documents/${document.id}`,
      tone: "warning" as const
    })),
    ...legalAlerts.map((step) => ({
      title: step.stepName,
      meta: `Pháp lý ${step.status}`,
      href: `/legal?projectId=${step.projectId}`,
      tone: step.status === "blocked" ? ("danger" as const) : ("warning" as const)
    })),
    ...decisionAlerts.map((decision) => ({
      title: decision.decisionText,
      meta: `Action item · Hạn ${decision.dueDate ?? "chưa có"} · Phụ trách ${decision.ownerId ?? "-"}`,
      href: decision.meetingId ? `/meetings/${decision.meetingId}` : "/meetings",
      tone: "warning" as const
    }))
  ].slice(0, 8);
}

export async function getRoleWorkspaceData(user: PermissionUser, route: WorkspaceRoute): Promise<RoleWorkspaceData> {
  const today = new Date();
  const [dashboard, projects, tasks, documents, legalSteps, meetings, decisions, users, auditLogs, memberships] = await Promise.all([
    getDashboardData(user, { today }),
    can(user, "project.view") ? listProjects({}) : [],
    can(user, "task.view") ? listTasks({}) : [],
    can(user, "document.view") ? listDocuments({}) : [],
    can(user, "legal.view") ? listLegalSteps({}) : [],
    can(user, "meeting.view") ? listMeetings({}) : [],
    can(user, "meeting.view") ? listDecisions({}) : [],
    can(user, "user.view") ? listUsers() : [],
    can(user, "audit.view") ? listAuditLogs() : [],
    listProjectMemberships()
  ]);
  const scoped = applyWorkspaceScope(user, {
    projects,
    tasks,
    documents,
    legalSteps,
    meetings,
    decisions,
    users,
    auditLogs,
    memberships: memberships as ProjectMembership[]
  });

  return {
    definition: WORKSPACE_DEFINITIONS[route],
    dashboard,
    scoped,
    kpis: buildKpis(route, scoped, today),
    actionItems: buildActionItems(scoped, today)
  };
}
