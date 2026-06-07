"use client";

import React from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";

import type {
  ExecutiveDashboardSourceItem,
  ExecutiveDashboardTone,
  ExecutiveProjectPortfolio,
  ExecutiveRiskSummary as ExecutiveRiskSummaryData,
} from "@/modules/dashboard/types";

const healthLabels = {
  green: "Xanh",
  red: "Đỏ",
  yellow: "Vàng",
};

const toneClasses: Record<ExecutiveDashboardTone, { bg: string; text: string }> = {
  amber: { bg: "bg-amber-50", text: "text-amber-800" },
  blue: { bg: "bg-blue-50", text: "text-blue-800" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-800" },
  purple: { bg: "bg-purple-50", text: "text-purple-800" },
  red: { bg: "bg-red-50", text: "text-red-800" },
  slate: { bg: "bg-slate-50", text: "text-slate-800" },
};

const statusClasses = {
  green: "bg-emerald-50 text-emerald-800",
  red: "bg-red-50 text-red-800",
  yellow: "bg-amber-50 text-amber-800",
};

function compactList(values: string[], emptyLabel: string) {
  if (!values.length) {
    return emptyLabel;
  }

  if (values.length <= 2) {
    return values.join(", ");
  }

  return `${values.slice(0, 2).join(", ")} +${values.length - 2}`;
}

function escalationTargetSummary(item: ExecutiveRiskSummaryData["items"][number]) {
  const targets = item.escalation?.targets ?? [];

  if (!targets.length) {
    return undefined;
  }

  return targets.map((target) => target.label ?? target.userId ?? target.roleKey).filter(Boolean).join(", ");
}

function renderRiskAlertMeta(item: ExecutiveRiskSummaryData["items"][number]) {
  const targetSummary = escalationTargetSummary(item);
  const showOverdue =
    item.overdue?.isOverdue ||
    item.overdue?.severity === "warning" ||
    item.escalation?.required;

  if (!showOverdue && !item.escalation?.required) {
    return null;
  }

  return (
    <span className="mt-2 block rounded-md border border-red-100 bg-red-50 px-2.5 py-2 text-xs leading-5 text-red-900">
      {showOverdue && item.overdue ? (
        <>
          <span className="block font-semibold">
            Quá hạn: {item.overdue.severity} - {item.overdue.reason}
          </span>
          <span className="block">Hành động tiếp theo: {item.overdue.nextAction}</span>
        </>
      ) : null}
      {item.escalation?.required ? (
        <>
          <span className="block font-semibold">
            Leo thang: {item.escalation.trigger}
            {item.escalation.status ? ` - ${item.escalation.status}` : ""}
          </span>
          {item.escalation.policyLabel ? (
            <span className="block">Chính sách: {item.escalation.policyLabel}</span>
          ) : null}
          {targetSummary ? <span className="block">Người nhận: {targetSummary}</span> : null}
        </>
      ) : null}
    </span>
  );
}

export function ExecutiveRiskSummary({
  canDrillDown,
  categoryEmptyLabel,
  emptyLabel,
  portfolio,
  riskSummary,
  onSelectSource,
}: {
  canDrillDown: boolean;
  categoryEmptyLabel: string;
  emptyLabel: string;
  portfolio: ExecutiveProjectPortfolio;
  riskSummary: ExecutiveRiskSummaryData;
  onSelectSource: (item: ExecutiveDashboardSourceItem) => void;
}) {
  const categoryEntries = riskSummary.riskMap.categories;
  const matrixEntries = riskSummary.riskMap.matrix;

  return (
    <section aria-label="Tổng hợp rủi ro" className="rounded-md border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Tổng hợp rủi ro</h2>
          <p className="mt-1 text-sm text-slate-600">
            Bản đồ rủi ro theo nhóm, mức ảnh hưởng, khả năng xảy ra, người phụ trách và hạn xử lý.
          </p>
        </div>
        <span className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800">
          Nghiêm trọng {riskSummary.critical} | Cao {riskSummary.high} | Dự án ảnh hưởng {riskSummary.riskMap.affectedProjectCount}
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <div className="rounded-md border border-slate-200 p-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-700" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-slate-950">Bản đồ rủi ro</h3>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {categoryEntries.length ? (
              categoryEntries.map((category) => (
                <div
                  aria-label={`Nhóm rủi ro ${category.categoryLabel}: ${category.count} rủi ro, ${category.affectedProjectCount} dự án ảnh hưởng`}
                  className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm"
                  key={category.categoryKey}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-slate-950">
                        {category.categoryLabel}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {category.count} rủi ro | {category.affectedProjectCount} dự án
                      </p>
                    </div>
                    {category.nearestDeadline ? (
                      <span className="w-fit rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                        {category.nearestDeadline}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                    <span className="rounded-md bg-red-50 px-2 py-0.5 font-semibold text-red-800">
                      Nghiêm trọng {category.critical}
                    </span>
                    <span className="rounded-md bg-red-50 px-2 py-0.5 font-semibold text-red-800">
                      Cao {category.high}
                    </span>
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 font-semibold text-amber-800">
                      Trung bình {category.medium}
                    </span>
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">
                      Thấp {category.low}
                    </span>
                    {(["red", "yellow", "green"] as const).map((status) => (
                      <span
                        className={`rounded-md px-2 py-0.5 font-semibold ${statusClasses[status]}`}
                        key={status}
                      >
                        {status === "red" ? "Đỏ" : status === "yellow" ? "Vàng" : "Xanh"} {category.statusCounts[status]}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-600">
                    Người phụ trách: {compactList(category.owners, "Chưa gán")}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Dự án: {compactList(category.affectedProjectIds, "Không có dự án")}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-slate-200 p-3 text-sm text-slate-600">
                {categoryEmptyLabel}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-700" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-slate-950">Ma trận rủi ro</h3>
          </div>
          <div className="mt-3 grid gap-2">
            {matrixEntries.length ? (
              matrixEntries.map((cell) => (
                <div
                  aria-label={`Ma trận rủi ro ${cell.likelihoodLabel} x ${cell.impactLabel}: ${cell.count} rủi ro`}
                  className="rounded-md border border-slate-200 bg-white p-3 text-sm"
                  key={`${cell.likelihood}-${cell.impact}`}
                >
                  <p className="break-words font-semibold text-slate-950">
                    {cell.likelihoodLabel} x {cell.impactLabel}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {cell.count} rủi ro | Mã {compactList(cell.riskIds, "Không có rủi ro")}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                {categoryEmptyLabel}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-slate-200 p-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-700" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-slate-950">Rủi ro cần xem</h3>
        </div>
        <div className="mt-3 space-y-2">
          {riskSummary.items.length ? (
            riskSummary.items.map((item) => {
              const content = (
                <>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${toneClasses[item.tone].bg} ${toneClasses[item.tone].text}`}>
                      {item.severityLabel}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {item.categoryLabel}
                    </span>
                    <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                      Gợi ý {item.statusSuggestion.labelVi}
                    </span>
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800">
                      {item.likelihoodLabel}
                    </span>
                    <span className="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-800">
                      {item.impactLabel}
                    </span>
                  </span>
                  <span className="mt-2 block break-words text-sm font-semibold text-slate-950">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">
                    {item.reason ?? item.status}
                  </span>
                  {renderRiskAlertMeta(item)}
                  <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                    {item.owner ? <span>Người phụ trách: {item.owner}</span> : null}
                    {item.deadline ? <span>Hạn xử lý: {item.deadline}</span> : null}
                    {item.projectId ? <span>Dự án: {item.projectId}</span> : null}
                    {item.moduleId ? <span>Module: {item.moduleId}</span> : null}
                  </span>
                </>
              );

              if (!canDrillDown) {
                return (
                  <article
                    className="w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-left"
                    key={item.id}
                  >
                    {content}
                    <span className="mt-2 block text-xs font-semibold text-slate-500">
                      Không có quyền xem chi tiết
                    </span>
                  </article>
                );
              }

              return (
                <button
                  aria-label={`Xem chi tiết ${item.title}`}
                  className="w-full rounded-md border border-slate-200 p-3 text-left transition hover:border-emerald-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  key={item.id}
                  onClick={() => onSelectSource(item)}
                  type="button"
                >
                  {content}
                </button>
              );
            })
          ) : (
            <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              {emptyLabel}
            </p>
          )}
        </div>
      </div>

      <div className="sr-only">
        {portfolio.items.map((item) => (
          <span key={item.id}>
            {item.title}: {healthLabels[item.health]}
          </span>
        ))}
      </div>
    </section>
  );
}
