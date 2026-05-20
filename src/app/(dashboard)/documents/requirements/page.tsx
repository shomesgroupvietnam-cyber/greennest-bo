import { FileText } from "lucide-react";
import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { listScopedDocuments, listScopedLegalSteps, listScopedProjects } from "@/lib/permissions/scoped-resources";
import { DocumentReadinessPanel } from "@/modules/documents/components/document-readiness-panel";
import { calculateProjectDocumentReadiness, listDocumentRequirements } from "@/modules/documents/services/document-readiness-service";

type DocumentRequirementsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DocumentRequirementsPage({ searchParams }: DocumentRequirementsPageProps) {
  const params = searchParams ? await searchParams : {};
  const requestedProjectId = readParam(params.projectId);
  const currentUser = await getCurrentUser();

  if (!can(currentUser, "document.view")) {
    return (
      <PageShell title="Không có quyền truy cập" description="Bạn cần quyền xem hồ sơ để mở checklist hồ sơ bắt buộc.">
        <UnauthorizedState backHref="/dashboard" backLabel="Về dashboard" title="Bạn không có quyền xem checklist hồ sơ" />
      </PageShell>
    );
  }

  const projects = await listScopedProjects(currentUser);
  const selectedProject = projects.find((project) => project.id === requestedProjectId) ?? projects[0];
  const canCreateDocument = can(currentUser, "document.create");
  const requirements = await listDocumentRequirements();
  const [documents, legalSteps] = selectedProject
    ? await Promise.all([
        listScopedDocuments(currentUser, { projectId: selectedProject.id }),
        listScopedLegalSteps(currentUser, { projectId: selectedProject.id })
      ])
    : [[], []];
  const readiness = selectedProject
    ? calculateProjectDocumentReadiness({
        project: selectedProject,
        requirements,
        documents,
        legalSteps
      })
    : undefined;

  return (
    <PageShell
      title="Checklist hồ sơ bắt buộc"
      description="Đối chiếu hồ sơ theo loại dự án để phát hiện tài liệu còn thiếu hoặc cần cập nhật."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="flex flex-1 flex-wrap gap-3 rounded-lg border bg-white p-4 shadow-sm">
          <select
            className="min-w-64 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            defaultValue={selectedProject?.id ?? ""}
            name="projectId"
          >
            {projects.length === 0 ? <option value="">Chưa có dự án trong phạm vi</option> : null}
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} - {project.name}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary">
            Xem checklist
          </Button>
        </form>
        <Button asChild variant="outline">
          <Link href="/documents">
            <FileText className="h-4 w-4" aria-hidden="true" />
            Danh sách hồ sơ
          </Link>
        </Button>
      </div>

      {!selectedProject || !readiness ? (
        <div className="rounded-lg border border-dashed bg-white p-8 text-center">
          <h2 className="text-base font-semibold text-slate-950">Chưa có dự án để kiểm tra</h2>
          <p className="mt-2 text-sm text-slate-600">Tạo hoặc được phân quyền vào dự án trước khi xem checklist hồ sơ.</p>
        </div>
      ) : (
        <DocumentReadinessPanel canCreateDocument={canCreateDocument} readiness={readiness} />
      )}
    </PageShell>
  );
}
