import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileWarning, FolderKanban, GanttChartSquare, Scale, type LucideIcon } from "lucide-react";

import type { DashboardData } from "@/modules/dashboard/types";

type KpiItem = {
  description: string;
  href: string;
  icon: LucideIcon;
  label: string;
  value: number | string;
  visible: boolean;
};

export function DashboardKpiGrid({ data }: { data: DashboardData }) {
  const items: KpiItem[] = [
    {
      label: "Tổng dự án",
      value: data.summary.totalProjects,
      description: `${data.summary.activeProjects} dự án đang triển khai`,
      href: "/projects",
      icon: FolderKanban,
      visible: data.permissions.canViewProjects
    },
    {
      label: "Việc quá hạn",
      value: data.summary.overdueTasks,
      description: `${data.summary.upcomingTasks} việc sắp đến hạn`,
      href: "/tasks?scope=overdue",
      icon: AlertTriangle,
      visible: data.permissions.canViewTasks
    },
    {
      label: "Hồ sơ thiếu",
      value: data.summary.missingDocuments,
      description: `${data.summary.needsUpdateDocuments} hồ sơ cần bổ sung`,
      href: "/documents?status=missing",
      icon: FileWarning,
      visible: data.permissions.canViewDocuments
    },
    {
      label: "Pháp lý vướng",
      value: data.summary.blockedLegalSteps,
      description: `${data.summary.waitingAuthorityLegalSteps} bước chờ cơ quan`,
      href: "/legal?status=blocked",
      icon: Scale,
      visible: data.permissions.canViewLegal
    },
    {
      label: "Tiến độ tổng",
      value: `${data.summary.overallProgress}%`,
      description: "Tính từ task, hồ sơ và pháp lý được phép xem",
      href: "/dashboard",
      icon: CheckCircle2,
      visible: data.permissions.canViewTasks || data.permissions.canViewDocuments || data.permissions.canViewLegal
    },
    {
      label: "Dự án active",
      value: data.summary.activeProjects,
      description: "Dự án chưa archive và đang triển khai",
      href: "/projects?status=active",
      icon: GanttChartSquare,
      visible: data.permissions.canViewProjects
    }
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items
        .filter((item) => item.visible)
        .map((item) => {
          const Icon = item.icon;

          return (
            <Link
              className="rounded-lg border bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
              href={item.href}
              key={item.label}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{item.value}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
            </Link>
          );
        })}
    </section>
  );
}
