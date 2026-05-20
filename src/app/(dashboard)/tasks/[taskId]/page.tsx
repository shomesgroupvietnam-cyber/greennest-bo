import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { getScopedProject, getScopedTask } from "@/lib/permissions/scoped-resources";
import { getProject } from "@/modules/projects/services/project-service";
import { TaskPriorityBadge, TaskStatusBadge } from "@/modules/tasks/components/task-badges";
import { isTaskOverdue, isTaskUpcoming, getTask } from "@/modules/tasks/services/task-service";

type TaskDetailPageProps = {
  params: Promise<{ taskId: string }>;
};

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium"
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { taskId } = await params;
  const currentUser = await getCurrentUser();
  const rawTask = await getTask(taskId);

  if (!rawTask) {
    notFound();
  }

  const task = await getScopedTask(currentUser, taskId);

  if (!task) {
    return (
      <PageShell title="Không có quyền truy cập" description="Công việc này không nằm trong phạm vi được giao của bạn.">
        <UnauthorizedState backHref="/tasks" backLabel="Về danh sách công việc" title="Bạn không có quyền xem công việc này" />
      </PageShell>
    );
  }

  const project = (await getScopedProject(currentUser, task.projectId)) ?? (await getProject(task.projectId));
  const overdue = isTaskOverdue(task);
  const upcoming = isTaskUpcoming(task);
  const canUpdateTask = can(currentUser, "task.update", task);

  return (
    <PageShell title={task.title} description="Chi tiết công việc theo dự án.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href="/tasks">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Danh sách công việc
          </Link>
        </Button>
        {canUpdateTask ? (
          <Button asChild variant="outline">
            <Link href={`/tasks/${task.id}/edit`}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Sửa công việc
            </Link>
          </Button>
        ) : null}
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Trạng thái</p>
          <div className="mt-2">
            <TaskStatusBadge status={task.status} />
          </div>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Ưu tiên</p>
          <div className="mt-2">
            <TaskPriorityBadge priority={task.priority} />
          </div>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Deadline</p>
          <p className="mt-2 text-sm font-medium text-slate-950">{formatDate(task.dueDate)}</p>
          {overdue ? <p className="mt-1 text-sm font-medium text-red-700">Quá hạn</p> : null}
          {!overdue && upcoming ? <p className="mt-1 text-sm font-medium text-amber-700">Sắp đến hạn</p> : null}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Thông tin công việc</h2>
          <dl className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm text-slate-500">Dự án</dt>
              <dd className="mt-1 text-sm font-medium text-slate-950">
                {project ? (
                  <Link className="text-emerald-700 hover:text-emerald-800" href={`/projects/${project.id}`}>
                    {project.code} - {project.name}
                  </Link>
                ) : (
                  "Không rõ"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Người phụ trách</dt>
              <dd className="mt-1 text-sm font-medium text-slate-950">{task.assigneeId ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Nhóm công việc</dt>
              <dd className="mt-1 text-sm font-medium text-slate-950">{task.category ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Cập nhật</dt>
              <dd className="mt-1 text-sm font-medium text-slate-950">{formatDateTime(task.updatedAt)}</dd>
            </div>
          </dl>
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-950">Mô tả</h3>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{task.description ?? "Chưa có mô tả."}</p>
          </div>
        </div>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Liên kết dự án</h2>
          <p className="mt-2 text-sm text-slate-600">
            Công việc này thuộc dự án và sẽ được dùng cho dashboard ở sprint sau.
          </p>
          {project ? (
            <Button asChild className="mt-4" variant="outline">
              <Link href={`/tasks?projectId=${project.id}`}>Xem việc cùng dự án</Link>
            </Button>
          ) : null}
        </section>
      </section>
    </PageShell>
  );
}
