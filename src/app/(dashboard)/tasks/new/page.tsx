import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { listScopedProjects } from "@/lib/permissions/scoped-resources";
import { createTaskAction } from "@/modules/tasks/actions";
import { TaskForm } from "@/modules/tasks/components/task-form";

type NewTaskPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewTaskPage({ searchParams }: NewTaskPageProps) {
  const currentUser = await getCurrentUser();
  const params = searchParams ? await searchParams : {};
  const defaultProjectId = readParam(params.projectId);
  const projects = await listScopedProjects(currentUser);

  return (
    <PageShell title="Tạo công việc" description="Mỗi công việc phải gắn với một dự án cụ thể.">
      {!can(currentUser, "task.create") ? (
        <UnauthorizedState backHref="/tasks" backLabel="Về danh sách công việc" title="Bạn không có quyền tạo công việc" />
      ) : projects.length === 0 ? (
        <EmptyState
          action={
            <Button asChild>
              <Link href="/projects/new">Tạo dự án</Link>
            </Button>
          }
          description="Tạo dự án trước khi thêm công việc để dữ liệu dashboard và checklist có nguồn liên kết rõ ràng."
          title="Cần có dự án trước"
        />
      ) : (
        <TaskForm action={createTaskAction} defaultProjectId={defaultProjectId} projects={projects} submitLabel="Tạo công việc" />
      )}
    </PageShell>
  );
}
