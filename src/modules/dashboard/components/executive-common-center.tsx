"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarClock,
  FileCheck2,
  Flag,
  LockKeyhole,
  ShieldAlert,
  Target,
} from "lucide-react";

import { ExecutiveDrilldownPanel } from "@/modules/dashboard/components/executive-drilldown-panel";
import { executiveSourceTypeLabel } from "@/modules/dashboard/source-labels";
import type {
  ExecutiveCommonCenterData,
  ExecutiveCommonCenterNotification,
  ExecutiveCommonCenterStrategyItem,
  ExecutiveDashboardSourceItem,
  ExecutiveDashboardTone,
  ExecutiveRiskItem,
} from "@/modules/dashboard/types";

const toneClasses: Record<ExecutiveDashboardTone, string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  purple: "border-purple-200 bg-purple-50 text-purple-800",
  red: "border-red-200 bg-red-50 text-red-800",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
};

function formatGeneratedAt(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
      {children}
    </p>
  );
}

function SectionShell({
  children,
  icon,
  label,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <section
      aria-label={label}
      className="rounded-md border bg-white p-4 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <span className="text-slate-600">{icon}</span>
        <h2 className="text-sm font-semibold text-slate-950">{label}</h2>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function escalationTargetSummary(item: ExecutiveDashboardSourceItem) {
  const targets = item.escalation?.targets ?? [];

  if (!targets.length) {
    return undefined;
  }

  return targets.map((target) => target.label).join(", ");
}

function ApprovalMeta({ item }: { item: ExecutiveDashboardSourceItem }) {
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

type RiskLabeledItem = ExecutiveDashboardSourceItem &
  Pick<
    ExecutiveRiskItem,
    "categoryLabel" | "impactLabel" | "likelihoodLabel" | "severityLabel" | "statusSuggestion"
  >;

function isRiskLabeledItem(item: ExecutiveDashboardSourceItem): item is RiskLabeledItem {
  return (
    item.sourceType === "risk" &&
    "categoryLabel" in item &&
    "impactLabel" in item &&
    "likelihoodLabel" in item &&
    "severityLabel" in item &&
    "statusSuggestion" in item
  );
}

function SourceList<T extends ExecutiveDashboardSourceItem>({
  canDrillDown,
  emptyLabel,
  items,
  onSelectSource,
}: {
  canDrillDown: boolean;
  emptyLabel: string;
  items: T[];
  onSelectSource: (item: T) => void;
}) {
  if (!items.length) {
    return <EmptyState>{emptyLabel}</EmptyState>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const content = (
          <>
            <span className="block break-words text-sm font-semibold text-slate-950">
              {item.title}
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-600">
              {item.reason ?? item.status}
            </span>
            {isRiskLabeledItem(item) ? (
              <span className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-md bg-red-50 px-2 py-0.5 font-semibold text-red-800">
                  {item.severityLabel}
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                  {item.categoryLabel}
                </span>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 font-semibold text-blue-800">
                  {item.likelihoodLabel}
                </span>
                <span className="rounded-md bg-purple-50 px-2 py-0.5 font-semibold text-purple-800">
                  {item.impactLabel}
                </span>
                <span className="rounded-md bg-white px-2 py-0.5 font-semibold text-slate-600 ring-1 ring-slate-200">
                  Gợi ý {item.statusSuggestion.labelVi}
                </span>
              </span>
            ) : null}
            <ApprovalMeta item={item} />
            <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
              {item.owner ? <span>Người phụ trách: {item.owner}</span> : null}
              {item.deadline ? <span>Hạn xử lý: {item.deadline}</span> : null}
              {item.projectId ? <span>Dự án: {item.projectId}</span> : null}
              <span>{executiveSourceTypeLabel(item.sourceType)}: {item.sourceId}</span>
            </span>
          </>
        );

        if (!canDrillDown) {
          return (
            <article
              className="rounded-md border border-slate-200 bg-slate-50 p-3"
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
            className="min-h-11 w-full rounded-md border border-slate-200 p-3 text-left transition hover:border-emerald-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            key={item.id}
            onClick={() => onSelectSource(item)}
            type="button"
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

function PriorityArea({
  canDrillDown,
  data,
  onSelectSource,
}: {
  canDrillDown: boolean;
  data: ExecutiveCommonCenterData;
  onSelectSource: (item: ExecutiveDashboardSourceItem) => void;
}) {
  const emptyLabel =
    data.permissions.canViewRisk ||
    data.permissions.canViewProposals ||
    data.permissions.canViewProjects
      ? "Không có việc ưu tiên trong phạm vi hiện tại."
      : "Không có quyền xem việc ưu tiên trong phạm vi hiện tại.";

  return (
    <section
      aria-label="Khu vực ưu tiên"
      className="rounded-md border bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-slate-600" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-950">Khu vực ưu tiên</h2>
        </div>
        <span className="w-fit rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {data.priorityItems.length} mục
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {data.priorityItems.length ? (
          data.priorityItems.map((item) => {
            const content = (
              <>
                <span className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${toneClasses[item.tone]}`}
                  >
                    {item.priorityLabel}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {item.groupLabel}
                  </span>
                  <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    {item.status}
                  </span>
                  {isRiskLabeledItem(item) ? (
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
                    </>
                  ) : null}
                </span>
                <span className="mt-2 block break-words text-sm font-semibold text-slate-950">
                  {item.title}
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">
                  {item.reason ?? "Cần lãnh đạo xem trước."}
                </span>
                <ApprovalMeta item={item} />
                <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                  {item.owner ? <span>Người phụ trách: {item.owner}</span> : null}
                  {item.deadline ? <span>Hạn xử lý: {item.deadline}</span> : null}
                  {item.projectId ? <span>Dự án: {item.projectId}</span> : null}
                  <span>{executiveSourceTypeLabel(item.sourceType)}: {item.sourceId}</span>
                  {item.financialAccess === "allowed" && item.amountLabel ? (
                    <span>Giá trị: {item.amountLabel}</span>
                  ) : null}
                  {item.financialAccess === "no_permission" ? (
                    <span>Tài chính: không có quyền xem</span>
                  ) : null}
                </span>
              </>
            );

            if (!canDrillDown) {
              return (
                <article
                  className={`rounded-md border p-3 ${toneClasses[item.tone]}`}
                  key={`${item.sourceType}-${item.sourceId}`}
                >
                  {content}
                  <span className="mt-2 block text-xs font-semibold">
                    Không có quyền xem chi tiết
                  </span>
                </article>
              );
            }

            return (
              <button
                aria-label={`Xem chi tiết ${item.title}`}
                className={`min-h-11 w-full rounded-md border p-3 text-left transition hover:border-emerald-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${toneClasses[item.tone]}`}
                key={`${item.sourceType}-${item.sourceId}`}
                onClick={() => onSelectSource(item)}
                type="button"
              >
                {content}
              </button>
            );
          })
        ) : (
          <EmptyState>{emptyLabel}</EmptyState>
        )}
      </div>
    </section>
  );
}

function KpiSection({ data }: { data: ExecutiveCommonCenterData }) {
  return (
    <SectionShell
      icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />}
      label="KPI chung"
    >
      {data.commonKpis.length ? (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {data.commonKpis.map((kpi) => (
            <article
              className={`rounded-md border p-3 ${toneClasses[kpi.tone]}`}
              key={kpi.id}
            >
              <p className="text-xs font-semibold uppercase">{kpi.label}</p>
              <p className="mt-2 text-2xl font-semibold">{kpi.value}</p>
              {kpi.reason ? (
                <p className="mt-1 text-xs leading-5">{kpi.reason}</p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState>Không có KPI trong phạm vi hiện tại.</EmptyState>
      )}
    </SectionShell>
  );
}

function NotificationList({
  items,
}: {
  items: ExecutiveCommonCenterNotification[];
}) {
  if (!items.length) {
    return <EmptyState>Không có thông báo trong phạm vi hiện tại.</EmptyState>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <article
          className={`rounded-md border p-3 ${toneClasses[item.tone]}`}
          key={item.id}
        >
          <p className="break-words text-sm font-semibold">{item.title}</p>
          <p className="mt-1 text-xs leading-5">{item.description}</p>
          <p className="mt-2 text-xs">
            {item.timeLabel ?? "Mới cập nhật"}
            {item.sourceType && item.sourceId
              ? ` - ${executiveSourceTypeLabel(item.sourceType)}: ${item.sourceId}`
              : ""}
          </p>
        </article>
      ))}
    </div>
  );
}

function RiskOverview({
  canDrillDown,
  data,
  onSelectSource,
}: {
  canDrillDown: boolean;
  data: ExecutiveCommonCenterData;
  onSelectSource: (item: ExecutiveDashboardSourceItem) => void;
}) {
  return (
    <SectionShell
      icon={<ShieldAlert className="h-4 w-4" aria-hidden="true" />}
      label="Rủi ro tổng"
    >
      <div className="grid grid-cols-2 gap-2 text-center text-xs">
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-red-800">
          <p className="font-semibold">{data.riskOverview.critical}</p>
          <p>Nghiêm trọng</p>
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-800">
          <p className="font-semibold">{data.riskOverview.high}</p>
          <p>Cao</p>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {Object.entries(data.riskOverview.byCategory).length ? (
          Object.entries(data.riskOverview.byCategory).map(([category, value]) => (
            <div className="rounded-md bg-slate-50 p-2 text-xs" key={category}>
              <p className="font-semibold text-slate-950">{value}</p>
              <p className="text-slate-600">{category}</p>
            </div>
          ))
        ) : (
          <EmptyState>Không có nhóm rủi ro trong phạm vi hiện tại.</EmptyState>
        )}
      </div>
      <div className="mt-3">
        <SourceList
          canDrillDown={canDrillDown}
          emptyLabel={
            data.permissions.canViewRisk
              ? "Không có rủi ro trong phạm vi hiện tại."
              : "Không có quyền xem rủi ro trong phạm vi hiện tại."
          }
          items={data.riskOverview.items}
          onSelectSource={onSelectSource}
        />
      </div>
    </SectionShell>
  );
}

function StrategyList({
  items,
}: {
  items: ExecutiveCommonCenterStrategyItem[];
}) {
  if (!items.length) {
    return <EmptyState>Không có chiến lược trong phạm vi hiện tại.</EmptyState>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <article
          className={`rounded-md border p-3 ${toneClasses[item.tone]}`}
          key={item.id}
        >
          <p className="break-words text-sm font-semibold">{item.title}</p>
          <p className="mt-1 text-xs leading-5">{item.description}</p>
          <p className="mt-2 text-xs">
            {item.status}
            {item.owner ? ` - Người phụ trách: ${item.owner}` : ""}
          </p>
        </article>
      ))}
    </div>
  );
}

function mergeDeadlineItems(data: ExecutiveCommonCenterData) {
  const bySource = new Map<string, ExecutiveDashboardSourceItem>();

  for (const item of [...data.thresholdBreaches, ...data.systemDeadlines]) {
    const sourceKey = `${item.sourceType}:${item.sourceId}`;

    if (!bySource.has(sourceKey)) {
      bySource.set(sourceKey, item);
    }
  }

  return Array.from(bySource.values());
}

export function ExecutiveCommonCenter({
  data,
  legacyScopeLabel,
}: {
  data: ExecutiveCommonCenterData;
  legacyScopeLabel?: string;
}) {
  const [selectedSourceItem, setSelectedSourceItem] =
    useState<ExecutiveDashboardSourceItem | null>(null);
  const scopeLabel = data.scope.scopeLabel || legacyScopeLabel || "Phạm vi hiện tại";
  const canDrillDown = data.permissions.canDrillDown;
  const deadlineItems = mergeDeadlineItems(data);

  return (
    <section className="space-y-5">
      <header className="rounded-md border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase text-emerald-700">
              Ban lãnh đạo
            </p>
            <h1 className="mt-2 break-words text-2xl font-semibold text-slate-950">
              Trung Tâm Điều Hành Chung
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Góc nhìn tổng hợp KPI, rủi ro, quyết định, lịch họp và việc quá hạn trong phạm vi đã được phân quyền.
            </p>
          </div>
          <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">{scopeLabel}</p>
            <p className="mt-1 text-xs">
              Cập nhật {formatGeneratedAt(data.generatedAt)}
            </p>
          </div>
        </div>
      </header>

      {!canDrillDown ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">
          Không có quyền xem chi tiết trong Trung Tâm Điều Hành Chung.
        </p>
      ) : null}

      {!data.permissions.canViewFinance ? (
        <p className="rounded-md border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700">
          <LockKeyhole className="mr-2 inline h-4 w-4 align-text-bottom text-slate-500" aria-hidden="true" />
          Không có quyền xem tài chính trong Trung Tâm Điều Hành Chung.
        </p>
      ) : null}

      <KpiSection data={data} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <div className="space-y-5">
          <PriorityArea
            canDrillDown={canDrillDown}
            data={data}
            onSelectSource={setSelectedSourceItem}
          />
          <SectionShell
            icon={<FileCheck2 className="h-4 w-4" aria-hidden="true" />}
            label="Quyết định mới"
          >
            <SourceList
              canDrillDown={canDrillDown}
              emptyLabel={
                data.permissions.canViewDecisions
                  ? "Không có quyết định mới trong phạm vi hiện tại."
                  : "Không có quyền xem quyết định trong phạm vi hiện tại."
              }
              items={data.decisionHighlights}
              onSelectSource={setSelectedSourceItem}
            />
          </SectionShell>
          <RiskOverview
            canDrillDown={canDrillDown}
            data={data}
            onSelectSource={setSelectedSourceItem}
          />
        </div>

        <aside className="space-y-5">
          <SectionShell
            icon={<Bell className="h-4 w-4" aria-hidden="true" />}
            label="Thông báo mới"
          >
            <NotificationList items={data.notifications} />
          </SectionShell>
          <SectionShell
            icon={<CalendarClock className="h-4 w-4" aria-hidden="true" />}
            label="Lịch họp và sự kiện"
          >
            <SourceList
              canDrillDown={canDrillDown}
              emptyLabel={
                data.permissions.canViewMeetings
                  ? "Không có lịch họp trong phạm vi hiện tại."
                  : "Không có quyền xem lịch họp trong phạm vi hiện tại."
              }
              items={data.calendarItems}
              onSelectSource={setSelectedSourceItem}
            />
          </SectionShell>
          <SectionShell
            icon={<Target className="h-4 w-4" aria-hidden="true" />}
            label="Chiến lược"
          >
            <StrategyList items={data.strategyItems} />
          </SectionShell>
          <SectionShell
            icon={<Flag className="h-4 w-4" aria-hidden="true" />}
            label="Hạn xử lý vượt ngưỡng"
          >
            <SourceList
              canDrillDown={canDrillDown}
              emptyLabel="Không có hạn xử lý vượt ngưỡng trong phạm vi hiện tại."
              items={deadlineItems}
              onSelectSource={setSelectedSourceItem}
            />
          </SectionShell>
        </aside>
      </div>

      <ExecutiveDrilldownPanel
        item={selectedSourceItem}
        onClose={() => setSelectedSourceItem(null)}
      />
    </section>
  );
}

export function ExecutiveCommonCenterNoAccessState() {
  return (
    <section className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
      <LockKeyhole className="mx-auto h-8 w-8 text-slate-500" aria-hidden="true" />
      <h1 className="mt-3 text-xl font-semibold text-slate-950">
        Không có quyền xem Trung Tâm Điều Hành Chung
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
        Trung Tâm Điều Hành chưa nhận được dữ liệu Trung Tâm Điều Hành Chung cho màn này.
      </p>
    </section>
  );
}
