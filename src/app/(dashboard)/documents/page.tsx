import { ClipboardCheck, Plus } from "lucide-react";
import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";
import { DOCUMENT_STATUSES, type DocumentStatus } from "@/constants/statuses";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/guard";
import { listScopedDocuments, listScopedProjects } from "@/lib/permissions/scoped-resources";
import { DOCUMENT_TYPES } from "@/modules/documents/constants";
import { DocumentListTable } from "@/modules/documents/components/document-list-table";

type DocumentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const params = searchParams ? await searchParams : {};
  const projectId = readParam(params.projectId) ?? "all";
  const docType = readParam(params.docType) ?? "all";
  const status = (readParam(params.status) ?? "all") as DocumentStatus | "all";
  const ownerId = readParam(params.ownerId) ?? "all";
  const session = await requirePermission("document.view", { route: "/documents" });
  const currentUser = session.user;
  const canCreateDocument = can(currentUser, "document.create");
  const canUpdateDocument = can(currentUser, "document.update");
  const [projects, documents] = await Promise.all([
    listScopedProjects(currentUser),
    listScopedDocuments(currentUser, {
      projectId,
      docType,
      status,
      ownerId
    })
  ]);

  return (
    <PageShell title="Hồ sơ" description="Quản lý hồ sơ dự án, phiên bản, trạng thái và liên kết tài liệu.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="grid flex-1 gap-3 rounded-lg border bg-white p-4 shadow-sm lg:grid-cols-[minmax(220px,1fr)_200px_180px_180px_auto]">
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
            defaultValue={docType}
            name="docType"
          >
            <option value="all">Tất cả loại hồ sơ</option>
            {Object.entries(DOCUMENT_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            defaultValue={status}
            name="status"
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(DOCUMENT_STATUSES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            defaultValue={ownerId === "all" ? "" : ownerId}
            name="ownerId"
            placeholder="Người phụ trách"
          />
          <Button type="submit" variant="secondary">
            Lọc
          </Button>
        </form>
        {canCreateDocument ? (
          <Button asChild>
            <Link href="/documents/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Tạo hồ sơ
            </Link>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link href={projectId !== "all" ? `/documents/requirements?projectId=${projectId}` : "/documents/requirements"}>
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            Checklist hồ sơ
          </Link>
        </Button>
      </div>

      <DocumentListTable canCreate={canCreateDocument} canUpdate={canUpdateDocument} documents={documents} projects={projects} />
    </PageShell>
  );
}
