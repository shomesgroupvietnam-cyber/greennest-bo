"use client";

import React from "react";
import { AlertTriangle, CalendarClock, ChevronRight, CircleDollarSign, FileText } from "lucide-react";

import type {
  ExecutiveDashboardSourceItem,
  ExecutiveDashboardTone,
  ExecutiveRiskItem,
} from "@/modules/dashboard/types";

export type ExecutivePriorityQueueItem = ExecutiveDashboardSourceItem & {
  amountLabel?: string;
  financialAccess?: "allowed" | "no_permission";
  groupLabel: string;
  priorityLabel: string;
  score: number;
};

const toneClasses: Record<ExecutiveDashboardTone, { bg: string; border: string; text: string }> = {
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
  },
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-800",
  },
  red: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
  },
  slate: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-800",
  },
};

function iconForSource(sourceType: ExecutiveDashboardSourceItem["sourceType"]) {
  if (sourceType === "risk") {
    return AlertTriangle;
  }

  if (sourceType === "meeting" || sourceType === "decision") {
    return CalendarClock;
  }

  if (sourceType === "leadership_approval" || sourceType === "proposal") {
    return CircleDollarSign;
  }

  return FileText;
}

function escalationTargetSummary(item: ExecutivePriorityQueueItem) {
  const targets = item.escalation?.targets ?? [];

  if (!targets.length) {
    return undefined;
  }

  return targets.map((target) => target.label).join(", ");
}

function ApprovalMeta({ item }: { item: ExecutivePriorityQueueItem }) {
  const targetSummary = escalationTargetSummary(item);

  if (!item.overdue && !item.escalation?.required) {
    return null;
  }

  return (
    <span className="mt-2 block space-y-1 border-l-2 border-red-200 pl-3 text-xs leading-5 text-slate-600">
      {item.overdue ? (
        <>
          <span className="block font-semibold text-red-700">
            {item.overdue.severity} - {item.overdue.reason}
          </span>
          <span className="block">Hành động tiếp theo: {item.overdue.nextAction}</span>
        </>
      ) : null}
      {item.escalation?.required ? (
        <>
          <span className="block font-semibold text-red-700">
            Leo thang: {item.escalation.trigger}
            {item.escalation.status ? ` - ${item.escalation.status}` : ""}
          </span>
          {targetSummary ? <span className="block">Người nhận: {targetSummary}</span> : null}
        </>
      ) : null}
    </span>
  );
}

type RiskPriorityQueueItem = ExecutivePriorityQueueItem &
  Pick<
    ExecutiveRiskItem,
    "categoryLabel" | "impactLabel" | "likelihoodLabel" | "severityLabel" | "statusSuggestion"
  >;

function isRiskPriorityQueueItem(item: ExecutivePriorityQueueItem): item is RiskPriorityQueueItem {
  return (
    item.sourceType === "risk" &&
    "categoryLabel" in item &&
    "impactLabel" in item &&
    "likelihoodLabel" in item &&
    "severityLabel" in item &&
    "statusSuggestion" in item
  );
}

export function ExecutivePriorityQueue({
  canDrillDown,
  emptyLabel,
  items,
  onSelectSource,
}: {
  canDrillDown: boolean;
  emptyLabel: string;
  items: ExecutivePriorityQueueItem[];
  onSelectSource: (item: ExecutivePriorityQueueItem) => void;
}) {
  return (
    <section aria-label="Việc ưu tiên" className="rounded-md border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Việc ưu tiên</h2>
          <p className="mt-1 text-sm text-slate-600">
            Việc lãnh đạo cần xem trước theo mức khẩn, quá hạn và rủi ro.
          </p>
        </div>
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {items.length} mục
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item) => {
            const Icon = iconForSource(item.sourceType);
            const content = (
              <>
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-md ${toneClasses[item.tone].bg} ${toneClasses[item.tone].text}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>

                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${toneClasses[item.tone].bg} ${toneClasses[item.tone].text}`}>
                      {item.priorityLabel}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {item.groupLabel}
                    </span>
                    <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                      {item.status}
                    </span>
                    {isRiskPriorityQueueItem(item) ? (
                      <>
                        <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800">
                          {item.severityLabel}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {item.categoryLabel}
                        </span>
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800">
                          {item.likelihoodLabel}
                        </span>
                        <span className="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-800">
                          {item.impactLabel}
                        </span>
                        <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                          Gợi ý {item.statusSuggestion.labelVi}
                        </span>
                      </>
                    ) : null}
                  </span>
                  <span className="mt-2 block break-words text-sm font-semibold text-slate-950">
                    {item.title}
                  </span>
                  {item.reason ? (
                    <span className="mt-1 block text-xs leading-5 text-slate-600">
                      {item.reason}
                    </span>
                  ) : null}
                  <ApprovalMeta item={item} />
                  <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                    {item.owner ? <span>Người phụ trách: {item.owner}</span> : null}
                    {item.deadline ? <span>Hạn xử lý: {item.deadline}</span> : null}
                    {item.projectId ? <span>Dự án: {item.projectId}</span> : null}
                    {item.financialAccess === "allowed" && item.amountLabel ? (
                      <span>Giá trị: {item.amountLabel}</span>
                    ) : null}
                    {item.financialAccess === "no_permission" ? (
                      <span>Tài chính: không có quyền xem</span>
                    ) : null}
                  </span>
                </span>

                <span className="inline-flex items-center gap-1 self-center text-xs font-semibold text-slate-600">
                  {canDrillDown ? "Xem" : "Chi tiết bị hạn chế"}
                  {canDrillDown ? <ChevronRight className="h-4 w-4" aria-hidden="true" /> : null}
                </span>
              </>
            );

            if (!canDrillDown) {
              return (
                <article
                  className={`grid min-h-24 w-full gap-3 rounded-md border bg-slate-50 p-3 text-left md:grid-cols-[auto_minmax(0,1fr)_auto] ${toneClasses[item.tone].border}`}
                  key={`${item.groupLabel}-${item.id}`}
                >
                  {content}
                </article>
              );
            }

            return (
              <button
                aria-label={`Xem chi tiết ${item.title}`}
                className={`grid min-h-24 w-full gap-3 rounded-md border p-3 text-left transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 md:grid-cols-[auto_minmax(0,1fr)_auto] ${toneClasses[item.tone].border}`}
                key={`${item.groupLabel}-${item.id}`}
                onClick={() => onSelectSource(item)}
                type="button"
              >
                {content}
              </button>
            );
          })
        ) : (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            {emptyLabel}
          </p>
        )}
      </div>
    </section>
  );
}
