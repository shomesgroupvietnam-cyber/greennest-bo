import { Eye, Pencil } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import type { Project } from "@/modules/projects/types";
import { isTaskOverdue, isTaskUpcoming } from "@/modules/tasks/services/task-service";
import type { Task } from "@/modules/tasks/types";

import { TaskPriorityBadge, TaskStatusBadge } from "./task-badges";

type TaskListTableProps = {
  canCreate?: boolean;
  canUpdate?: boolean;
  projects: Project[];
  tasks: Task[];
};

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short"
  }).format(new Date(value));
}

export function TaskListTable({ canCreate = true, canUpdate = true, projects, tasks }: TaskListTableProps) {
  const projectById = new Map(projects.map((project) => [project.id, project]));

  if (tasks.length === 0) {
    return (
      <EmptyState
        action={
          canCreate ? (
            <Button asChild>
              <Link href="/tasks/new">Tạo công việc</Link>
            </Button>
          ) : undefined
        }
        description="Tạo công việc mới hoặc điều chỉnh bộ lọc theo dự án, trạng thái, mức ưu tiên hoặc phạm vi thời hạn."
        title="Chưa có công việc phù hợp"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Tên việc</th>
              <th className="px-4 py-3">Dự án</th>
              <th className="px-4 py-3">Người phụ trách</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Ưu tiên</th>
              <th className="px-4 py-3">Nhóm</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const project = projectById.get(task.projectId);
              const overdue = isTaskOverdue(task);
              const upcoming = isTaskUpcoming(task);

              return (
                <tr className="align-top hover:bg-slate-50" key={task.id}>
                  <td className="min-w-64 px-4 py-3">
                    <Link className="font-medium text-emerald-700 hover:text-emerald-800" href={`/tasks/${task.id}`}>
                      {task.title}
                    </Link>
                    {overdue ? <p className="mt-1 text-xs font-medium text-red-700">Quá hạn</p> : null}
                    {!overdue && upcoming ? <p className="mt-1 text-xs font-medium text-amber-700">Sắp đến hạn</p> : null}
                  </td>
                  <td className="min-w-56 px-4 py-3 text-slate-600">
                    {project ? (
                      <Link className="text-slate-700 hover:text-emerald-700" href={`/projects/${project.id}`}>
                        {project.code} - {project.name}
                      </Link>
                    ) : (
                      "Không rõ"
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{task.assigneeId ?? "-"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(task.dueDate)}</td>
                  <td className="px-4 py-3">
                    <TaskStatusBadge status={task.status} />
                  </td>
                  <td className="px-4 py-3">
                    <TaskPriorityBadge priority={task.priority} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{task.category ?? "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/tasks/${task.id}`}>
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          Xem
                        </Link>
                      </Button>
                      {canUpdate ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/tasks/${task.id}/edit`}>
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            Sửa
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
