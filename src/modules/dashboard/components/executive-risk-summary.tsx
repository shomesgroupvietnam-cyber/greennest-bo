"use client";

import React from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";

import type {
  ExecutiveDashboardSourceItem,
  ExecutiveDashboardTone,
  ExecutiveProjectPortfolio,
  ExecutiveRiskMutationOptions,
  ExecutiveRiskSummary as ExecutiveRiskSummaryData,
} from "@/modules/dashboard/types";
import { RiskRecordForm } from "@/modules/executive/components/risk-record-form";

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
            Qua han: {item.overdue.severity} - {item.overdue.reason}
          </span>
          <span className="block">Next action: {item.overdue.nextAction}</span>
        </>
      ) : null}
      {item.escalation?.required ? (
        <>
          <span className="block font-semibold">
            Escalation: {item.escalation.trigger}
            {item.escalation.status ? ` - ${item.escalation.status}` : ""}
          </span>
          {item.escalation.policyLabel ? (
            <span className="block">Policy: {item.escalation.policyLabel}</span>
          ) : null}
          {targetSummary ? <span className="block">Targets: {targetSummary}</span> : null}
        </>
      ) : null}
    </span>
  );
}

export function ExecutiveRiskSummary({
  canDrillDown,
  canCreateRisk,
  canUpdateRisk,
  canOverrideRisk,
  canCloseRisk,
  canCloseHighRisk,
  categoryEmptyLabel,
  emptyLabel,
  portfolio,
  riskMutationOptions,
  riskSummary,
  onSelectSource,
}: {
  canDrillDown: boolean;
  canCreateRisk: boolean;
  canUpdateRisk: boolean;
  canOverrideRisk: boolean;
  canCloseRisk: boolean;
  canCloseHighRisk: boolean;
  categoryEmptyLabel: string;
  emptyLabel: string;
  portfolio: ExecutiveProjectPortfolio;
  riskMutationOptions: ExecutiveRiskMutationOptions;
  riskSummary: ExecutiveRiskSummaryData;
  onSelectSource: (item: ExecutiveDashboardSourceItem) => void;
}) {
  const categoryEntries = riskSummary.riskMap.categories;
  const matrixEntries = riskSummary.riskMap.matrix;
  const firstOfficialRisk = riskSummary.items.find((item) =>
    item.id.startsWith("risk-record-"),
  );
  const selectedRiskNeedsHighClose =
    firstOfficialRisk?.severity === "high" || firstOfficialRisk?.severity === "critical";
  const canCloseSelectedRisk = Boolean(
    firstOfficialRisk &&
      (canCloseRisk || (selectedRiskNeedsHighClose && canCloseHighRisk)),
  );
  const canShowMutationPanel =
    canCreateRisk ||
    (canUpdateRisk && firstOfficialRisk) ||
    (canOverrideRisk && firstOfficialRisk) ||
    canCloseSelectedRisk;

  return (
    <section aria-label="Tổng hợp risk" className="rounded-md border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Tổng hợp risk</h2>
          <p className="mt-1 text-sm text-slate-600">
            Risk map theo category, mức ảnh hưởng, khả năng xảy ra, owner và deadline.
          </p>
        </div>
        <span className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800">
          Nghiêm trọng {riskSummary.critical} | Cao {riskSummary.high} | Dự án ảnh hưởng {riskSummary.riskMap.affectedProjectCount}
        </span>
      </div>

      {canShowMutationPanel ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {canCreateRisk ? (
            <details className="rounded-md border border-emerald-200 bg-emerald-50/50 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-emerald-950">
                Tao risk/blocker
              </summary>
              <div className="mt-3">
                <RiskRecordForm
                  mode="create"
                  options={riskMutationOptions}
                />
              </div>
            </details>
          ) : null}
          {canUpdateRisk && firstOfficialRisk ? (
            <details className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-950">
                Cap nhat risk/blocker dang mo
              </summary>
              <div className="mt-3">
                <RiskRecordForm
                  mode="update"
                  options={riskMutationOptions}
                  record={firstOfficialRisk}
                />
              </div>
            </details>
          ) : null}
          {canOverrideRisk && firstOfficialRisk ? (
            <details className="rounded-md border border-blue-200 bg-blue-50/50 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-blue-950">
                Xac nhan/override trang thai
              </summary>
              <div className="mt-3">
                <RiskRecordForm
                  mode="override"
                  options={riskMutationOptions}
                  record={firstOfficialRisk}
                />
              </div>
            </details>
          ) : null}
          {canCloseSelectedRisk && firstOfficialRisk ? (
            <details className="rounded-md border border-slate-300 bg-slate-50 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-950">
                Dong risk/blocker
              </summary>
              <div className="mt-3">
                <RiskRecordForm
                  mode="close"
                  options={riskMutationOptions}
                  record={firstOfficialRisk}
                />
              </div>
            </details>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <div className="rounded-md border border-slate-200 p-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-700" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-slate-950">Risk map</h3>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {categoryEntries.length ? (
              categoryEntries.map((category) => (
                <div
                  aria-label={`Risk map category ${category.categoryLabel}: ${category.count} risk, ${category.affectedProjectCount} du an anh huong`}
                  className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm"
                  key={category.categoryKey}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-slate-950">
                        {category.categoryLabel}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {category.count} risk | {category.affectedProjectCount} dự án
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
                    Owner: {compactList(category.owners, "Chưa gán")}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Project: {compactList(category.affectedProjectIds, "Không có project")}
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
            <h3 className="text-sm font-semibold text-slate-950">Ma tran risk</h3>
          </div>
          <div className="mt-3 grid gap-2">
            {matrixEntries.length ? (
              matrixEntries.map((cell) => (
                <div
                  aria-label={`Ma tran risk ${cell.likelihoodLabel} x ${cell.impactLabel}: ${cell.count} risk`}
                  className="rounded-md border border-slate-200 bg-white p-3 text-sm"
                  key={`${cell.likelihood}-${cell.impact}`}
                >
                  <p className="break-words font-semibold text-slate-950">
                    {cell.likelihoodLabel} x {cell.impactLabel}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {cell.count} risk | IDs {compactList(cell.riskIds, "Không có risk")}
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
          <h3 className="text-sm font-semibold text-slate-950">Risk cần xem</h3>
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
                    {item.owner ? <span>Owner: {item.owner}</span> : null}
                    {item.deadline ? <span>Deadline: {item.deadline}</span> : null}
                    {item.projectId ? <span>Project: {item.projectId}</span> : null}
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
