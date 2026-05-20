import { AlertTriangle, FileWarning, Scale } from "lucide-react";
import Link from "next/link";

import type { DashboardData } from "@/modules/dashboard/types";

export function DashboardPriorityAlerts({ data }: { data: DashboardData }) {
  const alerts = [
    {
      count: data.summary.overdueTasks,
      description: "Công việc đã quá hạn và chưa hoàn thành.",
      href: "/tasks?scope=overdue",
      icon: AlertTriangle,
      label: "Việc quá hạn",
      visible: data.permissions.canViewTasks
    },
    {
      count: data.summary.missingDocuments + data.summary.needsUpdateDocuments + data.summary.missingRequiredDocuments,
      description: "Hồ sơ thiếu, cần bổ sung hoặc chưa đáp ứng checklist bắt buộc.",
      href: "/documents/requirements",
      icon: FileWarning,
      label: "Hồ sơ cần xử lý",
      visible: data.permissions.canViewDocuments
    },
    {
      count: data.summary.blockedLegalSteps,
      description: "Bước pháp lý đang bị vướng và cần ghi chú xử lý.",
      href: "/legal?status=blocked",
      icon: Scale,
      label: "Pháp lý bị vướng",
      visible: data.permissions.canViewLegal
    }
  ].filter((alert) => alert.visible && alert.count > 0);

  if (alerts.length === 0) {
    return (
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Cảnh báo ưu tiên</h2>
        <p className="mt-2 text-sm text-slate-600">
          Chưa có việc quá hạn, hồ sơ thiếu hoặc pháp lý bị vướng trong phạm vi quyền hiện tại.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <h2 className="text-base font-semibold text-amber-950">Cảnh báo ưu tiên</h2>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {alerts.map((alert) => {
          const Icon = alert.icon;

          return (
            <Link className="rounded-lg border border-amber-200 bg-white p-4 hover:border-amber-300" href={alert.href} key={alert.label}>
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {alert.label}: {alert.count}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{alert.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
