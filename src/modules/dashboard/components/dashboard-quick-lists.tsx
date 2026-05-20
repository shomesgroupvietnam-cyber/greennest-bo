import Link from "next/link";

import { DocumentStatusBadge } from "@/modules/documents/components/document-badges";
import type { DashboardData } from "@/modules/dashboard/types";
import { LegalStatusBadge } from "@/modules/legal/components/legal-status-badge";
import type { Project } from "@/modules/projects/types";
import { TaskPriorityBadge, TaskStatusBadge } from "@/modules/tasks/components/task-badges";

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short"
  }).format(new Date(value));
}

function projectLabel(projects: Project[], projectId: string) {
  const project = projects.find((item) => item.id === projectId);

  return project ? `${project.code} - ${project.name}` : "Dự án không rõ";
}

export function DashboardQuickLists({ data }: { data: DashboardData }) {
  return (
    <section className="grid gap-6 xl:grid-cols-2">
      {data.permissions.canViewTasks ? (
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-950">Việc cần xử lý trong tuần</h2>
            <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" href="/tasks?scope=upcoming">
              Xem tất cả
            </Link>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {data.tasksDueThisWeek.slice(0, 5).map((task) => (
              <div className="py-3" key={task.id}>
                <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" href={`/tasks/${task.id}`}>
                  {task.title}
                </Link>
                <p className="mt-1 text-xs text-slate-500">
                  {projectLabel(data.projects, task.projectId)} · Deadline: {formatDate(task.dueDate)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <TaskStatusBadge status={task.status} />
                  <TaskPriorityBadge priority={task.priority} />
                </div>
              </div>
            ))}
            {data.tasksDueThisWeek.length === 0 ? <p className="py-3 text-sm text-slate-600">Không có việc sắp đến hạn.</p> : null}
          </div>
        </div>
      ) : null}

      {data.permissions.canViewTasks ? (
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-950">Việc quá hạn</h2>
            <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" href="/tasks?scope=overdue">
              Xem tất cả
            </Link>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {data.overdueTasks.slice(0, 5).map((task) => (
              <div className="py-3" key={task.id}>
                <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" href={`/tasks/${task.id}`}>
                  {task.title}
                </Link>
                <p className="mt-1 text-xs text-red-700">
                  {projectLabel(data.projects, task.projectId)} · Quá hạn từ {formatDate(task.dueDate)}
                </p>
              </div>
            ))}
            {data.overdueTasks.length === 0 ? <p className="py-3 text-sm text-slate-600">Không có việc quá hạn.</p> : null}
          </div>
        </div>
      ) : null}

      {data.permissions.canViewDocuments ? (
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-950">Hồ sơ thiếu/cần bổ sung</h2>
            <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" href="/documents?status=missing">
              Xem tất cả
            </Link>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {[...data.missingDocuments, ...data.needsUpdateDocuments].slice(0, 5).map((document) => (
              <div className="py-3" key={document.id}>
                <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" href={`/documents/${document.id}`}>
                  {document.title}
                </Link>
                <p className="mt-1 text-xs text-slate-500">{projectLabel(data.projects, document.projectId)}</p>
                <div className="mt-2">
                  <DocumentStatusBadge status={document.status} />
                </div>
              </div>
            ))}
            {data.missingDocuments.length + data.needsUpdateDocuments.length === 0 ? (
              <p className="py-3 text-sm text-slate-600">Không có hồ sơ thiếu hoặc cần bổ sung.</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {data.permissions.canViewLegal ? (
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-950">Pháp lý bị vướng</h2>
            <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" href="/legal?status=blocked">
              Xem tất cả
            </Link>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {data.blockedLegalSteps.slice(0, 5).map((step) => (
              <div className="py-3" key={step.id}>
                <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" href={`/legal?projectId=${step.projectId}`}>
                  {step.stepName}
                </Link>
                <p className="mt-1 text-xs text-slate-500">{projectLabel(data.projects, step.projectId)}</p>
                <div className="mt-2">
                  <LegalStatusBadge status={step.status} />
                </div>
              </div>
            ))}
            {data.blockedLegalSteps.length === 0 ? <p className="py-3 text-sm text-slate-600">Không có bước pháp lý bị vướng.</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
