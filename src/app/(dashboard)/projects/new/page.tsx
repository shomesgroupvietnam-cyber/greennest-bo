import { PageShell } from "@/components/shared/page-shell";
import { requirePermission } from "@/lib/permissions/guard";
import { createProjectAction } from "@/modules/projects/actions";
import { ProjectForm } from "@/modules/projects/components/project-form";

export default async function NewProjectPage() {
  await requirePermission("project.create", { route: "/projects/new" });

  return (
    <PageShell
      title="Tạo dự án"
      description="Nhập thông tin dự án trung tâm. Nếu bỏ trống mã dự án, hệ thống sẽ tự sinh mã duy nhất."
    >
      <ProjectForm action={createProjectAction} submitLabel="Tạo dự án" />
    </PageShell>
  );
}
