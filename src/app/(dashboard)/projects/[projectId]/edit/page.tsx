import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { getScopedProject } from "@/lib/permissions/scoped-resources";
import { updateProjectAction } from "@/modules/projects/actions";
import { ProjectForm } from "@/modules/projects/components/project-form";
import { getProject } from "@/modules/projects/services/project-service";

type EditProjectPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { projectId } = await params;
  const currentUser = await getCurrentUser();
  const rawProject = await getProject(projectId);

  if (!rawProject) {
    notFound();
  }

  const project = await getScopedProject(currentUser, projectId);

  if (!project) {
    return (
      <PageShell title="Không có quyền truy cập" description="Dự án này không nằm trong phạm vi được giao của bạn.">
        <UnauthorizedState backHref="/projects" backLabel="Về danh sách dự án" title="Bạn không có quyền xem dự án này" />
      </PageShell>
    );
  }

  const updateAction = updateProjectAction.bind(null, project.id);

  return (
    <PageShell title="Sửa dự án" description={`${project.code} · Cập nhật thông tin lõi của dự án.`}>
      {can(currentUser, "project.update", { id: project.id }) ? (
        <ProjectForm action={updateAction} project={project} submitLabel="Lưu thay đổi" />
      ) : (
        <UnauthorizedState backHref={`/projects/${project.id}`} backLabel="Về chi tiết dự án" title="Bạn không có quyền sửa dự án" />
      )}
    </PageShell>
  );
}
