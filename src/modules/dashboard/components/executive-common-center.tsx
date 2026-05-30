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
import type {
  ExecutiveCommonCenterData,
  ExecutiveCommonCenterNotification,
  ExecutiveCommonCenterStrategyItem,
  ExecutiveDashboardSourceItem,
  ExecutiveDashboardTone,
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
          <span className="block">Next action: {item.overdue.nextAction}</span>
        </>
      ) : null}
      {item.escalation?.required ? (
        <>
          <span className="block font-semibold text-red-700">
            Escalation: {item.escalation.trigger}
            {item.escalation.status ? ` - ${item.escalation.status}` : ""}
          </span>
          {targetSummary ? <span className="block">Targets: {targetSummary}</span> : null}
        </>
      ) : null}
    </span>
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
            <ApprovalMeta item={item} />
            <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
              {item.owner ? <span>Owner: {item.owner}</span> : null}
              {item.deadline ? <span>Deadline: {item.deadline}</span> : null}
              {item.projectId ? <span>Project: {item.projectId}</span> : null}
              <span>{item.sourceType}: {item.sourceId}</span>
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
                Khong co quyen drill-down
              </span>
            </article>
          );
        }

        return (
          <button
            aria-label={`Xem chi tiet ${item.title}`}
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
      ? "Khong co item uu tien trong scope hien tai."
      : "Khong co quyen xem item uu tien trong scope hien tai.";

  return (
    <section
      aria-label="Priority area"
      className="rounded-md border bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-slate-600" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-950">Priority area</h2>
        </div>
        <span className="w-fit rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {data.priorityItems.length} muc
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
                </span>
                <span className="mt-2 block break-words text-sm font-semibold text-slate-950">
                  {item.title}
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">
                  {item.reason ?? "Can lanh dao xem truoc."}
                </span>
                <ApprovalMeta item={item} />
                <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                  {item.owner ? <span>Owner: {item.owner}</span> : null}
                  {item.deadline ? <span>Deadline: {item.deadline}</span> : null}
                  {item.projectId ? <span>Project: {item.projectId}</span> : null}
                  <span>{item.sourceType}: {item.sourceId}</span>
                  {item.financialAccess === "allowed" && item.amountLabel ? (
                    <span>Gia tri: {item.amountLabel}</span>
                  ) : null}
                  {item.financialAccess === "no_permission" ? (
                    <span>Tai chinh: khong co quyen</span>
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
                    Khong co quyen drill-down
                  </span>
                </article>
              );
            }

            return (
              <button
                aria-label={`Xem chi tiet ${item.title}`}
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
        <EmptyState>Khong co KPI trong scope hien tai.</EmptyState>
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
    return <EmptyState>Khong co thong bao trong scope hien tai.</EmptyState>;
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
            {item.timeLabel ?? "Moi cap nhat"}
            {item.sourceType && item.sourceId
              ? ` - ${item.sourceType}: ${item.sourceId}`
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
      label="Risk tong"
    >
      <div className="grid grid-cols-2 gap-2 text-center text-xs">
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-red-800">
          <p className="font-semibold">{data.riskOverview.critical}</p>
          <p>Critical</p>
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-800">
          <p className="font-semibold">{data.riskOverview.high}</p>
          <p>High</p>
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
          <EmptyState>Khong co category risk trong scope hien tai.</EmptyState>
        )}
      </div>
      <div className="mt-3">
        <SourceList
          canDrillDown={canDrillDown}
          emptyLabel={
            data.permissions.canViewRisk
              ? "Khong co risk trong scope hien tai."
              : "Khong co quyen xem risk trong scope hien tai."
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
    return <EmptyState>Khong co chien luoc trong scope hien tai.</EmptyState>;
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
            {item.owner ? ` - Owner: ${item.owner}` : ""}
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
  const scopeLabel = data.scope.scopeLabel || legacyScopeLabel || "Scope hien tai";
  const canDrillDown = data.permissions.canDrillDown;
  const deadlineItems = mergeDeadlineItems(data);

  return (
    <section className="space-y-5">
      <header className="rounded-md border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase text-emerald-700">
              Ban lanh dao
            </p>
            <h1 className="mt-2 break-words text-2xl font-semibold text-slate-950">
              Executive Common Center
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Common view tong hop tu ExecutiveDashboardData va ExecutiveLeadershipData da loc theo scope.
            </p>
          </div>
          <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">{scopeLabel}</p>
            <p className="mt-1 text-xs">
              Cap nhat {formatGeneratedAt(data.generatedAt)}
            </p>
          </div>
        </div>
      </header>

      {!canDrillDown ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">
          Khong co quyen drill-down trong Common Center.
        </p>
      ) : null}

      {!data.permissions.canViewFinance ? (
        <p className="rounded-md border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700">
          <LockKeyhole className="mr-2 inline h-4 w-4 align-text-bottom text-slate-500" aria-hidden="true" />
          Khong co quyen xem tai chinh trong Common Center.
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
            label="Quyet dinh moi"
          >
            <SourceList
              canDrillDown={canDrillDown}
              emptyLabel={
                data.permissions.canViewDecisions
                  ? "Khong co quyet dinh moi trong scope hien tai."
                  : "Khong co quyen xem quyet dinh trong scope hien tai."
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
            label="Thong bao moi"
          >
            <NotificationList items={data.notifications} />
          </SectionShell>
          <SectionShell
            icon={<CalendarClock className="h-4 w-4" aria-hidden="true" />}
            label="Lich hop va su kien"
          >
            <SourceList
              canDrillDown={canDrillDown}
              emptyLabel={
                data.permissions.canViewMeetings
                  ? "Khong co lich hop trong scope hien tai."
                  : "Khong co quyen xem lich hop trong scope hien tai."
              }
              items={data.calendarItems}
              onSelectSource={setSelectedSourceItem}
            />
          </SectionShell>
          <SectionShell
            icon={<Target className="h-4 w-4" aria-hidden="true" />}
            label="Chien luoc"
          >
            <StrategyList items={data.strategyItems} />
          </SectionShell>
          <SectionShell
            icon={<Flag className="h-4 w-4" aria-hidden="true" />}
            label="Deadline vuot nguong qua han"
          >
            <SourceList
              canDrillDown={canDrillDown}
              emptyLabel="Khong co deadline vuot nguong trong scope hien tai."
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
        Khong co quyen xem Executive Common Center
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
        Command Center khong nhan duoc ExecutiveCommonCenterData cho view nay.
      </p>
    </section>
  );
}
