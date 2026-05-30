"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  LockKeyhole,
  ShieldAlert,
  Target,
  Users,
} from "lucide-react";

import type {
  ExecutiveDashboardSourceItem,
  ExecutiveMorningBriefingData,
} from "@/modules/dashboard/types";
import { ExecutiveDrilldownPanel } from "@/modules/dashboard/components/executive-drilldown-panel";

const toneClasses = {
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  purple: "border-purple-200 bg-purple-50 text-purple-800",
  red: "border-red-200 bg-red-50 text-red-800",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
} satisfies Record<string, string>;

const healthLabels: Record<"green" | "red" | "yellow", string> = {
  green: "Xanh",
  red: "Do",
  yellow: "Vang",
};

const summaryStatusLabels: Record<
  ExecutiveMorningBriefingData["summary"]["status"],
  string
> = {
  draft: "draft",
  insufficient_context: "insufficient_context",
  placeholder: "placeholder",
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

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-600">{icon}</span>
      <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
    </div>
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

function SourceList({
  canDrillDown,
  emptyLabel,
  items,
  noDrillDownLabel,
  onSelectSource,
}: {
  canDrillDown: boolean;
  emptyLabel: string;
  items: ExecutiveDashboardSourceItem[];
  noDrillDownLabel: string;
  onSelectSource: (item: ExecutiveDashboardSourceItem) => void;
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
              {item.owner ? <span>{item.owner}</span> : null}
              {item.deadline ? <span>{item.deadline}</span> : null}
              <span>{item.sourceType}</span>
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
                {noDrillDownLabel}
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

function SummaryPanel({ data }: { data: ExecutiveMorningBriefingData }) {
  const isInsufficient = data.summary.status === "insufficient_context";

  return (
    <section
      aria-label="AI Summary draft"
      className="rounded-md border bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader
          icon={<Bot className="h-4 w-4" aria-hidden="true" />}
          title="AI Summary draft"
        />
        <span className="inline-flex w-fit items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
          {summaryStatusLabels[data.summary.status]}
        </span>
      </div>
      {isInsufficient ? (
        <p className="mt-3 text-sm font-semibold text-slate-800">
          Khong co du lieu trong scope
        </p>
      ) : null}
      <p className="mt-2 text-sm leading-6 text-slate-700">{data.summary.text}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Cap nhat {formatGeneratedAt(data.summary.updatedAt)}. Ban tom tat nay la goi y noi bo, can kiem tra citation truoc khi quyet dinh.
      </p>
      {data.summary.citations.length ? (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Citation noi bo
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.summary.citations.map((citation) => (
              <span
                className="inline-flex max-w-full items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                key={citation.id}
              >
                <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block truncate">{citation.title}</span>
                  <span className="block text-[11px] font-normal text-slate-500">
                    {citation.sourceType}: {citation.sourceId}
                  </span>
                </span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function KpiPanel({ data }: { data: ExecutiveMorningBriefingData }) {
  return (
    <section
      aria-label="KPI hom nay"
      className="rounded-md border bg-white p-4 shadow-sm"
    >
      <SectionHeader
        icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />}
        title="KPI hom nay"
      />
      {data.kpisToday.length ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {data.kpisToday.map((kpi) => (
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
        <div className="mt-3">
          <EmptyState>Khong co KPI trong scope hien tai.</EmptyState>
        </div>
      )}
    </section>
  );
}

function ProjectHealthPanel({ data }: { data: ExecutiveMorningBriefingData }) {
  return (
    <section
      aria-label="Du an do vang xanh"
      className="rounded-md border bg-white p-4 shadow-sm"
    >
      <SectionHeader
        icon={<Target className="h-4 w-4" aria-hidden="true" />}
        title="Du an do vang xanh"
      />
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-red-800">
          <p className="font-semibold">{data.projectHealth.red}</p>
          <p>Do</p>
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-800">
          <p className="font-semibold">{data.projectHealth.yellow}</p>
          <p>Vang</p>
        </div>
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-emerald-800">
          <p className="font-semibold">{data.projectHealth.green}</p>
          <p>Xanh</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {data.projectHealth.items.length ? (
          data.projectHealth.items.slice(0, 5).map((item) => (
            <article
              className="rounded-md border border-slate-200 bg-slate-50 p-3"
              key={item.id}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-slate-950">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {item.phase ?? item.status}
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {healthLabels[item.health]}
                </span>
              </div>
            </article>
          ))
        ) : (
          <EmptyState>Khong co du an trong scope hien tai.</EmptyState>
        )}
      </div>
    </section>
  );
}

function MeetingSnapshotPanel({
  canDrillDown,
  data,
  onSelectSource,
}: {
  canDrillDown: boolean;
  data: ExecutiveMorningBriefingData;
  onSelectSource: (item: ExecutiveDashboardSourceItem) => void;
}) {
  return (
    <section
      aria-label="Meeting Snapshot"
      className="rounded-md border bg-white p-4 shadow-sm"
    >
      <SectionHeader
        icon={<Users className="h-4 w-4" aria-hidden="true" />}
        title="Meeting Snapshot"
      />
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-md bg-slate-50 p-2">
          <p className="font-semibold text-slate-950">{data.meetingSnapshot.today}</p>
          <p className="text-slate-600">Hom nay</p>
        </div>
        <div className="rounded-md bg-slate-50 p-2">
          <p className="font-semibold text-slate-950">{data.meetingSnapshot.upcoming}</p>
          <p className="text-slate-600">Sap toi</p>
        </div>
        <div className="rounded-md bg-red-50 p-2">
          <p className="font-semibold text-red-800">
            {data.meetingSnapshot.followUpsOverdue}
          </p>
          <p className="text-red-800">Qua han</p>
        </div>
      </div>
      <div className="mt-3">
        <SourceList
          canDrillDown={canDrillDown}
          emptyLabel={
            data.permissions.canViewMeetings
              ? "Khong co lich hop trong scope hien tai."
              : "Khong co quyen xem lich hop trong scope hien tai."
          }
          items={data.meetingSnapshot.items.slice(0, 4)}
          noDrillDownLabel="Khong co quyen drill-down"
          onSelectSource={onSelectSource}
        />
      </div>
    </section>
  );
}

export function ExecutiveMorningBriefing({
  data,
  legacyScopeLabel,
}: {
  data: ExecutiveMorningBriefingData;
  legacyScopeLabel?: string;
}) {
  const [selectedSourceItem, setSelectedSourceItem] =
    useState<ExecutiveDashboardSourceItem | null>(null);
  const canDrillDown = data.permissions.canDrillDown;
  const scopeLabel = data.scope.scopeLabel || legacyScopeLabel || "Scope hien tai";

  return (
    <section className="space-y-5">
      <header className="rounded-md border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase text-emerald-700">
              Ban lanh dao
            </p>
            <h1 className="mt-2 break-words text-2xl font-semibold text-slate-950">
              Morning Briefing
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Tom tat dau ngay theo scope tu ExecutiveDashboardData da loc quyen.
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
          Khong co quyen drill-down trong scope hien tai.
        </p>
      ) : null}

      {!data.permissions.canViewFinance ? (
        <p className="rounded-md border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700">
          <LockKeyhole className="mr-2 inline h-4 w-4 align-text-bottom text-slate-500" aria-hidden="true" />
          Khong co quyen xem tai chinh trong scope nay.
        </p>
      ) : null}

      <SummaryPanel data={data} />
      <KpiPanel data={data} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="space-y-5">
          <section
            aria-label="Top risk"
            className="rounded-md border bg-white p-4 shadow-sm"
          >
            <SectionHeader
              icon={<ShieldAlert className="h-4 w-4" aria-hidden="true" />}
              title="Top risk"
            />
            <div className="mt-3">
              <SourceList
                canDrillDown={canDrillDown}
                emptyLabel={
                  data.permissions.canViewRisk
                    ? "Khong co risk trong scope hien tai."
                    : "Khong co quyen xem risk trong scope hien tai."
                }
                items={data.topRisks}
                noDrillDownLabel="Khong co quyen drill-down"
                onSelectSource={setSelectedSourceItem}
              />
            </div>
          </section>

          <section
            aria-label="Approval qua han"
            className="rounded-md border bg-white p-4 shadow-sm"
          >
            <SectionHeader
              icon={<ClipboardCheck className="h-4 w-4" aria-hidden="true" />}
              title="Approval qua han"
            />
            <div className="mt-3">
              <SourceList
                canDrillDown={canDrillDown}
                emptyLabel={
                  data.permissions.canViewProposals
                    ? "Khong co approval qua han trong scope hien tai."
                    : "Khong co quyen xem approval trong scope hien tai."
                }
                items={data.overdueApprovals}
                noDrillDownLabel="Khong co quyen drill-down"
                onSelectSource={setSelectedSourceItem}
              />
            </div>
          </section>

          <section
            aria-label="Viec can quyet hom nay"
            className="rounded-md border bg-white p-4 shadow-sm"
          >
            <SectionHeader
              icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
              title="Viec can quyet hom nay"
            />
            <div className="mt-3">
              <SourceList
                canDrillDown={canDrillDown}
                emptyLabel={
                  data.permissions.canViewDecisions
                    ? "Khong co viec can quyet trong scope hien tai."
                    : "Khong co quyen xem quyet dinh trong scope hien tai."
                }
                items={data.decisionsToday}
                noDrillDownLabel="Khong co quyen drill-down"
                onSelectSource={setSelectedSourceItem}
              />
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <ProjectHealthPanel data={data} />
          <MeetingSnapshotPanel
            canDrillDown={canDrillDown}
            data={data}
            onSelectSource={setSelectedSourceItem}
          />
          <section className="rounded-md border bg-white p-4 shadow-sm">
            <SectionHeader
              icon={<CalendarClock className="h-4 w-4" aria-hidden="true" />}
              title="Source counts"
            />
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {Object.entries(data.sourceCounts).map(([label, value]) => (
                <div className="rounded-md bg-slate-50 p-2" key={label}>
                  <p className="font-semibold text-slate-950">{value}</p>
                  <p className="text-slate-600">{label}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <ExecutiveDrilldownPanel
        item={selectedSourceItem}
        onClose={() => setSelectedSourceItem(null)}
      />
    </section>
  );
}

export function ExecutiveMorningBriefingNoAccessState() {
  return (
    <section className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
      <AlertTriangle className="mx-auto h-8 w-8 text-slate-500" aria-hidden="true" />
      <h1 className="mt-3 text-xl font-semibold text-slate-950">
        Khong co quyen xem Morning Briefing
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
        Command Center khong nhan duoc ExecutiveMorningBriefingData cho view nay.
      </p>
    </section>
  );
}
