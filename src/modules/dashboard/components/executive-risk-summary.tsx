"use client";

import React from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";

import type {
  ExecutiveDashboardSourceItem,
  ExecutiveDashboardTone,
  ExecutiveProjectPortfolio,
  ExecutiveRiskSummary as ExecutiveRiskSummaryData,
} from "@/modules/dashboard/types";

const severityLabels = {
  critical: "Critical",
  high: "High",
  low: "Low",
  medium: "Medium",
};

const healthLabels = {
  green: "Xanh",
  red: "Do",
  yellow: "Vang",
};

const toneClasses: Record<ExecutiveDashboardTone, { bg: string; text: string }> = {
  amber: { bg: "bg-amber-50", text: "text-amber-800" },
  blue: { bg: "bg-blue-50", text: "text-blue-800" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-800" },
  purple: { bg: "bg-purple-50", text: "text-purple-800" },
  red: { bg: "bg-red-50", text: "text-red-800" },
  slate: { bg: "bg-slate-50", text: "text-slate-800" },
};

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
  const categoryEntries = Object.entries(riskSummary.byCategory).sort(
    ([, left], [, right]) => right - left,
  );

  return (
    <section aria-label="Risk Summary" className="rounded-md border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Risk Summary</h2>
          <p className="mt-1 text-sm text-slate-600">
            Ban do risk theo severity, category va health cua du an.
          </p>
        </div>
        <span className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800">
          Critical {riskSummary.critical} | High {riskSummary.high}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          ["Do", portfolio.red, "bg-red-50 text-red-800"],
          ["Vang", portfolio.yellow, "bg-amber-50 text-amber-800"],
          ["Xanh", portfolio.green, "bg-emerald-50 text-emerald-800"],
        ].map(([label, value, classes]) => (
          <div className={`rounded-md border border-slate-200 p-3 ${classes}`} key={label}>
            <p className="text-xs font-semibold uppercase">Project health</p>
            <p className="mt-1 text-xl font-semibold">
              {label}: {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-slate-200 p-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-700" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-slate-950">Risk category map</h3>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {categoryEntries.length ? (
              categoryEntries.map(([category, count]) => (
                <div
                  aria-label={`${category}: ${count} risk`}
                  className="rounded-md bg-slate-50 p-3 text-sm"
                  key={category}
                >
                  <p className="break-words font-semibold text-slate-950">{category}</p>
                  <p className="mt-1 text-xs text-slate-600">{count} risk item</p>
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
            <h3 className="text-sm font-semibold text-slate-950">Risk can xem</h3>
          </div>
          <div className="mt-3 space-y-2">
            {riskSummary.items.length ? (
              riskSummary.items.map((item) => {
                const content = (
                  <>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${toneClasses[item.tone].bg} ${toneClasses[item.tone].text}`}>
                        {severityLabels[item.severity]}
                      </span>
                      {item.category ? (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {item.category}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-2 block break-words text-sm font-semibold text-slate-950">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-xs text-slate-600">
                      {item.reason ?? item.status}
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
                        Khong co quyen drill-down
                      </span>
                    </article>
                  );
                }

                return (
                  <button
                    aria-label={`Xem chi tiet ${item.title}`}
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
