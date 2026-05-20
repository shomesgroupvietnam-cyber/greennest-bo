import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { listScopedProjects } from "@/lib/permissions/scoped-resources";
import { generateReportAction } from "@/modules/reports/actions";
import { ReportForm } from "@/modules/reports/components/report-form";

type NewReportPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewReportPage({ searchParams }: NewReportPageProps) {
  const params = searchParams ? await searchParams : {};
  const currentUser = await getCurrentUser();

  if (!can(currentUser, "report.create")) {
    return (
      <PageShell title="Không có quyền tạo báo cáo" description="Vai trò hiện tại chỉ được xem báo cáo hoặc không có quyền báo cáo.">
        <UnauthorizedState backHref="/reports" backLabel="Về danh sách báo cáo" title="Bạn không có quyền tạo báo cáo" />
      </PageShell>
    );
  }

  const projects = await listScopedProjects(currentUser);
  const requestedProjectId = readParam(params.projectId);
  const defaultProjectId = projects.some((project) => project.id === requestedProjectId) ? requestedProjectId : projects[0]?.id;

  return (
    <PageShell
      title="Tạo báo cáo"
      description="Tạo snapshot quản trị từ dữ liệu dự án, công việc, hồ sơ, pháp lý, cuộc họp và quyết định hiện có."
    >
      <Button asChild variant="ghost">
        <Link href="/reports">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Danh sách báo cáo
        </Link>
      </Button>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-white p-8 text-center">
          <h2 className="text-base font-semibold text-slate-950">Chưa có dự án trong phạm vi</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
            Bạn cần có ít nhất một dự án được phép xem trước khi tạo báo cáo.
          </p>
        </div>
      ) : (
        <ReportForm action={generateReportAction} defaultProjectId={defaultProjectId} projects={projects} />
      )}
    </PageShell>
  );
}
