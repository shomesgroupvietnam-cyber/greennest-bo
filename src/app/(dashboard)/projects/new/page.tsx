import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { createProjectAction } from "@/modules/projects/actions";
import { ProjectForm } from "@/modules/projects/components/project-form";

export default async function NewProjectPage() {
  const currentUser = await getCurrentUser();

  return (
    <PageShell
      title="Tạo dự án"
      description="Nhập thông tin dự án trung tâm. Nếu bỏ trống mã dự án, hệ thống sẽ tự sinh mã duy nhất."
    >
      {can(currentUser, "project.create") ? (
        <ProjectForm action={createProjectAction} submitLabel="Tạo dự án" />
      ) : (
        <UnauthorizedState backHref="/projects" backLabel="Về danh sách dự án" title="Bạn không có quyền tạo dự án" />
      )}
    </PageShell>
  );
}
