"use client";

import React from "react";
import { Activity, AlertTriangle, CalendarClock, CheckCircle2, CircleDollarSign, FolderKanban } from "lucide-react";

import type {
  ExecutiveDashboardClientData,
  ExecutiveDashboardKpi,
  ExecutiveDashboardSourceItem,
  ExecutiveDashboardTone,
} from "@/modules/dashboard/types";

const toneClasses: Record<ExecutiveDashboardTone, { bg: string; text: string; ring: string }> = {
  amber: {
    bg: "bg-amber-50",
    ring: "ring-amber-200",
    text: "text-amber-800",
  },
  blue: {
    bg: "bg-blue-50",
    ring: "ring-blue-200",
    text: "text-blue-800",
  },
  emerald: {
    bg: "bg-emerald-50",
    ring: "ring-emerald-200",
    text: "text-emerald-800",
  },
  purple: {
    bg: "bg-purple-50",
    ring: "ring-purple-200",
    text: "text-purple-800",
  },
  red: {
    bg: "bg-red-50",
    ring: "ring-red-200",
    text: "text-red-800",
  },
  slate: {
    bg: "bg-slate-50",
    ring: "ring-slate-200",
    text: "text-slate-800",
  },
};

function sourceFromKpi(kpi: ExecutiveDashboardKpi): ExecutiveDashboardSourceItem | null {
  if (!kpi.sourceType || !kpi.sourceId) {
    return null;
  }

  return {
    id: `kpi-${kpi.id}`,
    reason: kpi.reason,
    sourceId: kpi.sourceId,
    sourceType: kpi.sourceType,
    status: "kpi",
    title: kpi.label,
    tone: kpi.tone,
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function ExecutiveDashboardKpiStrip({
  canDrillDown,
  data,
  onSelectSource,
}: {
  canDrillDown: boolean;
  data: ExecutiveDashboardClientData;
  onSelectSource: (item: ExecutiveDashboardSourceItem) => void;
}) {
  const financialLabel =
    data.financialSummary.state === "allowed"
      ? formatCurrency(data.financialSummary.visibleAmountTotal)
      : "Bị giới hạn theo quyền";
  const projectCount = data.sourceCounts.projects;
  const opportunityCount = data.sourceCounts.proposals;
  const projectOpportunityTotal = projectCount + opportunityCount;
  const financialAccessLabel =
    data.financialSummary.state === "allowed"
      ? data.financialSummary.access === "full"
        ? "Quyền đầy đủ"
        : "Quyền một phần"
      : data.financialSummary.reason;

  const supportingMetrics = [
    {
      icon: FolderKanban,
      label: "Dự án / Cơ hội",
      value: projectOpportunityTotal,
      helper: `Dự án ${projectCount} | Cơ hội ${opportunityCount} | Đang hoạt động ${data.projectPortfolio.active} | Đỏ ${data.projectPortfolio.red} | Vàng ${data.projectPortfolio.yellow} | Xanh ${data.projectPortfolio.green}`,
    },
    {
      icon: CheckCircle2,
      label: "Phê duyệt",
      value: data.approvalSummary.pending,
      helper: `Quá hạn ${data.approvalSummary.overdue} | Rủi ro cao ${data.approvalSummary.highRisk}`,
    },
    {
      icon: AlertTriangle,
      label: "Bản đồ rủi ro",
      value: data.riskSummary.critical + data.riskSummary.high,
      helper: `Nghiêm trọng ${data.riskSummary.critical} | Cao ${data.riskSummary.high}`,
    },
    {
      icon: CalendarClock,
      label: "Hạn xử lý",
      value: data.todayDeadlines.today + data.todayDeadlines.overdue,
      helper: `Hôm nay ${data.todayDeadlines.today} | Quá hạn ${data.todayDeadlines.overdue}`,
    },
    {
      icon: Activity,
      label: "Lịch họp",
      value: data.meetingSnapshot.today + data.meetingSnapshot.upcoming,
      helper: `Theo dõi quá hạn ${data.meetingSnapshot.followUpsOverdue}`,
    },
    {
      icon: CircleDollarSign,
      label: "Dòng tiền / Chi phí tổng quan",
      value: financialLabel,
      helper:
        data.financialSummary.state === "allowed"
          ? `${data.financialSummary.visibleRecordCount} bản ghi tài chính được xem | ${financialAccessLabel}`
          : financialAccessLabel,
    },
  ];

  return (
    <section aria-label="Dải KPI" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {data.kpis.map((kpi) => {
          const sourceItem = sourceFromKpi(kpi);
          const content = (
            <>
              <p className="text-xs font-semibold uppercase text-slate-500">
                {kpi.label}
              </p>
              <p className="mt-2 break-words text-2xl font-semibold text-slate-950">
                {kpi.value}
              </p>
              {kpi.reason ? (
                <p className={`mt-2 text-xs leading-5 ${toneClasses[kpi.tone].text}`}>
                  {kpi.reason}
                </p>
              ) : null}
            </>
          );

          if (!sourceItem || !canDrillDown) {
            return (
              <article
                className={`min-h-32 rounded-md border bg-white p-4 shadow-sm ring-1 ring-transparent ${toneClasses[kpi.tone].bg}`}
                key={kpi.id}
              >
                {content}
                {sourceItem && !canDrillDown ? (
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Không có quyền xem chi tiết
                  </p>
                ) : null}
              </article>
            );
          }

          return (
            <button
              aria-label={`Xem chi tiết ${kpi.label}`}
              className={`min-h-32 rounded-md border bg-white p-4 text-left shadow-sm ring-1 ring-transparent transition hover:ring-2 focus:outline-none focus-visible:ring-2 ${toneClasses[kpi.tone].ring}`}
              key={kpi.id}
              onClick={() => onSelectSource(sourceItem)}
              type="button"
            >
              {content}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {supportingMetrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <article className="rounded-md border bg-white p-3 shadow-sm" key={metric.label}>
              <div className="flex items-start gap-3">
                <span className="rounded-md bg-slate-100 p-2 text-slate-700">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    {metric.label}
                  </p>
                  <p className="mt-1 break-words text-lg font-semibold text-slate-950">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {metric.helper}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
