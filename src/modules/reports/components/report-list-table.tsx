import { Eye } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Project } from "@/modules/projects/types";
import { REPORT_TYPES, type ReportRun } from "@/modules/reports/types";

type ReportListTableProps = {
  reports: ReportRun[];
  projects: Project[];
  canCreate?: boolean;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function ReportListTable({ reports, projects, canCreate = false }: ReportListTableProps) {
  const projectById = new Map(projects.map((project) => [project.id, project]));

  if (reports.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-white p-8 text-center">
        <h2 className="text-base font-semibold text-slate-950">Chưa có báo cáo</h2>
        <p className="mt-2 text-sm text-slate-600">Tạo báo cáo đầu tiên từ dữ liệu dự án hiện có.</p>
        {canCreate ? (
          <Button asChild className="mt-4">
            <Link href="/reports/new">Tạo báo cáo</Link>
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Báo cáo</th>
              <th className="px-4 py-3">Dự án</th>
              <th className="px-4 py-3">Loại</th>
              <th className="px-4 py-3">Người tạo</th>
              <th className="px-4 py-3">Thời điểm snapshot</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map((report) => {
              const project = projectById.get(report.projectId);

              return (
                <tr className="align-top hover:bg-slate-50" key={report.id}>
                  <td className="min-w-72 px-4 py-3">
                    <Link className="font-medium text-emerald-700 hover:text-emerald-800" href={`/reports/${report.id}`}>
                      {report.title}
                    </Link>
                  </td>
                  <td className="min-w-56 px-4 py-3 text-slate-600">{project ? `${project.code} - ${project.name}` : report.projectId}</td>
                  <td className="px-4 py-3 text-slate-600">{REPORT_TYPES[report.reportType]}</td>
                  <td className="px-4 py-3 text-slate-600">{report.generatedBy}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(report.generatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/reports/${report.id}`}>
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          Xem
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
