import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";
import { LEGAL_STATUSES, type LegalStatus } from "@/constants/statuses";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { listScopedDocuments, listScopedLegalSteps, listScopedProjects } from "@/lib/permissions/scoped-resources";
import { LegalChecklistList } from "@/modules/legal/components/legal-checklist-list";

type LegalPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LegalPage({ searchParams }: LegalPageProps) {
  const params = searchParams ? await searchParams : {};
  const projectId = readParam(params.projectId) ?? "all";
  const status = (readParam(params.status) ?? "all") as LegalStatus | "all";
  const assigneeId = readParam(params.assigneeId) ?? "all";
  const currentUser = await getCurrentUser();
  const canUpdateLegal = can(currentUser, "legal.update");
  const [projects, steps, documents] = await Promise.all([
    listScopedProjects(currentUser),
    listScopedLegalSteps(currentUser, {
      projectId,
      status,
      assigneeId
    }),
    listScopedDocuments(currentUser, projectId === "all" ? {} : { projectId })
  ]);
  const blockedCount = steps.filter((step) => step.status === "blocked").length;
  const waitingCount = steps.filter((step) => step.status === "waiting_authority").length;
  const doneCount = steps.filter((step) => step.status === "done").length;

  return (
    <PageShell title="Pháp lý" description="Checklist 12 bước Trục 1 theo dự án, trạng thái, người phụ trách và hồ sơ liên quan.">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Đã hoàn thành</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{doneCount}</p>
        </div>
        <div className="rounded-lg border border-red-100 bg-red-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-red-700">Bị vướng</p>
          <p className="mt-2 text-2xl font-semibold text-red-800">{blockedCount}</p>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-amber-700">Chờ cơ quan</p>
          <p className="mt-2 text-2xl font-semibold text-amber-800">{waitingCount}</p>
        </div>
      </section>

      <form className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm lg:grid-cols-[minmax(220px,1fr)_180px_180px_auto]">
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
          {Object.entries(LEGAL_STATUSES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          defaultValue={assigneeId === "all" ? "" : assigneeId}
          name="assigneeId"
          placeholder="Người phụ trách"
        />
        <Button type="submit" variant="secondary">
          Lọc
        </Button>
      </form>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-white p-8 text-center">
          <h2 className="text-base font-semibold text-slate-950">Cần có dự án trước</h2>
          <p className="mt-2 text-sm text-slate-600">Checklist pháp lý được tự động khởi tạo khi tạo dự án.</p>
          <Button asChild className="mt-4">
            <Link href="/projects/new">Tạo dự án</Link>
          </Button>
        </div>
      ) : (
        <LegalChecklistList canUpdate={canUpdateLegal} documents={documents} projects={projects} steps={steps} />
      )}
    </PageShell>
  );
}
