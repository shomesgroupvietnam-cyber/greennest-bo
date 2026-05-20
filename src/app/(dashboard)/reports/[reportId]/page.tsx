import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { getScopedProject } from "@/lib/permissions/scoped-resources";
import { ReportDetail } from "@/modules/reports/components/report-detail";
import { getReport } from "@/modules/reports/services/report-service";

type ReportDetailPageProps = {
  params: Promise<{ reportId: string }>;
};

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { reportId } = await params;
  const currentUser = await getCurrentUser();

  if (!can(currentUser, "report.view")) {
    return (
      <PageShell title="Không có quyền truy cập" description="Bạn cần quyền xem báo cáo để mở trang này.">
        <UnauthorizedState backHref="/dashboard" backLabel="Về dashboard" title="Bạn không có quyền xem báo cáo" />
      </PageShell>
    );
  }

  const report = await getReport(reportId);

  if (!report) {
    notFound();
  }

  const scopedProject = await getScopedProject(currentUser, report.projectId);

  if (!scopedProject) {
    return (
      <PageShell title="Không có quyền truy cập" description="Báo cáo này thuộc dự án ngoài phạm vi được giao của bạn.">
        <UnauthorizedState backHref="/reports" backLabel="Về danh sách báo cáo" title="Bạn không có quyền xem báo cáo này" />
      </PageShell>
    );
  }

  return (
    <PageShell title="Chi tiết báo cáo" description="Dữ liệu dưới đây là snapshot tại thời điểm báo cáo được tạo.">
      <Button asChild variant="ghost">
        <Link href="/reports">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Danh sách báo cáo
        </Link>
      </Button>
      <ReportDetail report={report} />
    </PageShell>
  );
}
