import { PageShell } from "@/components/shared/page-shell";
import { getCurrentSession } from "@/lib/auth/session";
import { isExternalRole } from "@/lib/permissions/access-scope";
import { DashboardKpiGrid } from "@/modules/dashboard/components/dashboard-kpi-grid";
import { DashboardPriorityAlerts } from "@/modules/dashboard/components/dashboard-priority-alerts";
import { DashboardQuickLists } from "@/modules/dashboard/components/dashboard-quick-lists";
import { getDashboardData } from "@/modules/dashboard/services/dashboard-service";
import { redirect } from "next/navigation";

function formatGeneratedAt(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function DashboardPage() {
  const session = await getCurrentSession();
  const currentUser = session.user;

  if (isExternalRole(currentUser.role) || currentUser.role === "viewer") {
    redirect(session.defaultScreen.href);
  }

  const dashboardData = await getDashboardData(currentUser);

  return (
    <PageShell
      title="Dashboard"
      description={`${session.defaultScreen.label} · Tổng quan dự án, việc, hồ sơ và pháp lý theo quyền hiện tại.`}
    >
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Người dùng mô phỏng</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">{currentUser.fullName}</h2>
            <p className="mt-1 text-sm text-slate-600">
              Vai trò: {currentUser.role} · Cập nhật: {formatGeneratedAt(dashboardData.generatedAt)}
            </p>
          </div>
          <div className="max-w-xl rounded-md bg-slate-50 p-3 text-sm text-slate-600">
            <p className="font-medium text-slate-800">Công thức tiến độ</p>
            <p className="mt-1">{dashboardData.progressFormula}</p>
          </div>
        </div>
      </section>

      <DashboardKpiGrid data={dashboardData} />
      <DashboardPriorityAlerts data={dashboardData} />
      <DashboardQuickLists data={dashboardData} />
    </PageShell>
  );
}
