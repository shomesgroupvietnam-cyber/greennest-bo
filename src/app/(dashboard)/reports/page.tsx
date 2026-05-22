import { Plus } from "lucide-react";
import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/guard";
import { listScopedProjects } from "@/lib/permissions/scoped-resources";
import { ReportListTable } from "@/modules/reports/components/report-list-table";
import { listReports } from "@/modules/reports/services/report-service";
import type { ReportType } from "@/modules/reports/types";

type ReportsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = searchParams ? await searchParams : {};
  const projectId = readParam(params.projectId) ?? "all";
  const reportType = (readParam(params.reportType) ?? "all") as ReportType | "all";
  const session = await requirePermission("report.view", { route: "/reports" });
  const currentUser = session.user;

  const [projects, allReports] = await Promise.all([
    listScopedProjects(currentUser),
    listReports({ projectId, reportType })
  ]);
  const scopedProjectIds = new Set(projects.map((project) => project.id));
  const reports = allReports.filter((report) => scopedProjectIds.has(report.projectId));
  const canCreateReport = can(currentUser, "report.create");

  return (
    <PageShell title="Báo cáo" description="Snapshot quản trị từ dữ liệu dự án, công việc, hồ sơ, pháp lý và cuộc họp.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="grid flex-1 gap-3 rounded-lg border bg-white p-4 shadow-sm md:grid-cols-[minmax(220px,1fr)_220px_auto]">
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
            defaultValue={reportType}
            name="reportType"
          >
            <option value="all">Tất cả loại báo cáo</option>
            <option value="weekly_project_summary">Báo cáo tuần dự án</option>
            <option value="document_readiness_report">Báo cáo sẵn sàng hồ sơ</option>
            <option value="legal_status_report">Báo cáo tình trạng pháp lý</option>
          </select>
          <Button type="submit" variant="secondary">
            Lọc
          </Button>
        </form>
        {canCreateReport ? (
          <Button asChild>
            <Link href="/reports/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Tạo báo cáo
            </Link>
          </Button>
        ) : null}
      </div>

      <ReportListTable canCreate={canCreateReport} projects={projects} reports={reports} />
    </PageShell>
  );
}
