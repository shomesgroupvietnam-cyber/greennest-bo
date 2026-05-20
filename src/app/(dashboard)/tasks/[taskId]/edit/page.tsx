import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { getScopedTask, listScopedProjects } from "@/lib/permissions/scoped-resources";
import { updateTaskAction } from "@/modules/tasks/actions";
import { TaskForm } from "@/modules/tasks/components/task-form";
import { getTask } from "@/modules/tasks/services/task-service";

type EditTaskPageProps = {
  params: Promise<{ taskId: string }>;
};

export default async function EditTaskPage({ params }: EditTaskPageProps) {
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

  const projects = await listScopedProjects(currentUser);
  const updateAction = updateTaskAction.bind(null, task.id);

  return (
    <PageShell title="Sửa công việc" description="Cập nhật trạng thái, ưu tiên, người phụ trách và deadline.">
      {can(currentUser, "task.update", task) ? (
        <TaskForm action={updateAction} projects={projects} submitLabel="Lưu thay đổi" task={task} />
      ) : (
        <UnauthorizedState backHref={`/tasks/${task.id}`} backLabel="Về chi tiết công việc" title="Bạn không có quyền sửa công việc" />
      )}
    </PageShell>
  );
}
