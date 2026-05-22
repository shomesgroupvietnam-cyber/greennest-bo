import { Plus } from "lucide-react";
import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";
import { TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskStatus } from "@/constants/statuses";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/guard";
import { listScopedProjects, listScopedTasks } from "@/lib/permissions/scoped-resources";
import { TaskListTable } from "@/modules/tasks/components/task-list-table";
import { DEFAULT_UPCOMING_WINDOW_DAYS } from "@/modules/tasks/constants";
import type { TaskScope } from "@/modules/tasks/types";

type TasksPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = searchParams ? await searchParams : {};
  const projectId = readParam(params.projectId) ?? "all";
  const status = (readParam(params.status) ?? "all") as TaskStatus | "all";
  const priority = (readParam(params.priority) ?? "all") as TaskPriority | "all";
  const scope = (readParam(params.scope) ?? "all") as TaskScope;
  const session = await requirePermission("task.view", { route: "/tasks" });
  const currentUser = session.user;
  const canCreateTask = can(currentUser, "task.create");
  const canUpdateTask = can(currentUser, "task.update");
  const [projects, tasks] = await Promise.all([
    listScopedProjects(currentUser),
    listScopedTasks(currentUser, {
      projectId,
      status,
      priority,
      scope,
      upcomingWindowDays: DEFAULT_UPCOMING_WINDOW_DAYS
    })
  ]);

  return (
    <PageShell title="Công việc" description="Quản lý công việc theo dự án, deadline, trạng thái và mức ưu tiên.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="grid flex-1 gap-3 rounded-lg border bg-white p-4 shadow-sm lg:grid-cols-[minmax(220px,1fr)_180px_180px_180px_auto]">
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            defaultValue={projectId}
            name="projectId"
          >
            <option value="all">Tất cả dự án</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} - {project.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            defaultValue={status}
            name="status"
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(TASK_STATUSES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            defaultValue={priority}
            name="priority"
          >
            <option value="all">Tất cả ưu tiên</option>
            {Object.entries(TASK_PRIORITIES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            defaultValue={scope}
            name="scope"
          >
            <option value="all">Tất cả việc</option>
            <option value="overdue">Quá hạn</option>
            <option value="upcoming">Sắp đến hạn</option>
            <option value="mine">Việc của tôi</option>
          </select>
          <Button type="submit" variant="secondary">
            Lọc
          </Button>
        </form>
        {canCreateTask ? (
          <Button asChild>
            <Link href="/tasks/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Tạo công việc
            </Link>
          </Button>
        ) : null}
      </div>

      <TaskListTable
        canCreate={canCreateTask}
        canUpdate={canUpdateTask || can(currentUser, "task.update_own")}
        projects={projects}
        tasks={tasks}
      />
    </PageShell>
  );
}
