"use client";

import React, { useMemo, useState } from "react";
import { CalendarDays, FileCheck2, LockKeyhole, Users } from "lucide-react";

import type {
  ExecutiveApprovalItem,
  ExecutiveDashboardData,
  ExecutiveDashboardSourceItem,
  ExecutiveDecisionItem,
  ExecutiveRiskItem,
} from "@/modules/dashboard/types";
import { ExecutiveDashboardKpiStrip } from "@/modules/dashboard/components/executive-dashboard-kpi-strip";
import { ExecutiveDrilldownPanel } from "@/modules/dashboard/components/executive-drilldown-panel";
import { ExecutivePriorityQueue, type ExecutivePriorityQueueItem } from "@/modules/dashboard/components/executive-priority-queue";
import { ExecutiveRiskSummary } from "@/modules/dashboard/components/executive-risk-summary";

function scoreBase(item: ExecutiveDashboardSourceItem) {
  const normalized = `${item.status} ${item.reason ?? ""}`.toLowerCase();

  if (normalized.includes("critical") || normalized.includes("khan") || item.tone === "red") {
    return 90;
  }

  if (normalized.includes("high") || normalized.includes("cao") || item.tone === "amber") {
    return 70;
  }

  if (item.tone === "purple") {
    return 50;
  }

  return 30;
}

function dueScore(item: ExecutiveDashboardSourceItem) {
  const normalized = `${item.status} ${item.deadline ?? ""} ${item.reason ?? ""}`.toLowerCase();

  if (normalized.includes("overdue") || normalized.includes("qua han")) {
    return 20;
  }

  if (normalized.includes("today") || normalized.includes("hom nay")) {
    return 10;
  }

  return 0;
}

function priorityLabel(item: ExecutiveDashboardSourceItem, fallback: string) {
  const normalized = `${item.status} ${item.reason ?? ""}`.toLowerCase();

  if (normalized.includes("critical") || normalized.includes("khan")) {
    return "Khan cap";
  }

  if (normalized.includes("overdue") || normalized.includes("qua han")) {
    return "Qua han";
  }

  if (normalized.includes("high") || normalized.includes("cao")) {
    return "Uu tien cao";
  }

  return fallback;
}

function deadlinePriorityLabel(item: ExecutiveDashboardSourceItem) {
  const normalized = `${item.status} ${item.deadline ?? ""} ${item.reason ?? ""}`.toLowerCase();

  if (item.tone === "red" || normalized.includes("overdue") || normalized.includes("qua han")) {
    return "Qua han";
  }

  return "Hom nay";
}

function approvalPriority(item: ExecutiveApprovalItem): ExecutivePriorityQueueItem {
  const escalationScore = item.escalation?.required ? 25 : 0;
  const escalationLabel = item.escalation?.required
    ? item.escalation.trigger === "risk_policy"
      ? "Escalation risk"
      : "Escalation"
    : undefined;

  return {
    ...item,
    amountLabel: item.financialAccess === "allowed" ? item.amountLabel : undefined,
    groupLabel: item.escalation?.required ? "Approval escalation" : "Phe duyet",
    priorityLabel: escalationLabel ?? priorityLabel(item, item.priority ?? "Cho duyet"),
    score:
      scoreBase(item) +
      dueScore(item) +
      escalationScore +
      (item.riskLevel === "critical" ? 15 : 0),
  };
}

function riskPriority(item: ExecutiveRiskItem): ExecutivePriorityQueueItem {
  const severityScore = {
    critical: 30,
    high: 20,
    low: 0,
    medium: 10,
  }[item.severity];

  return {
    ...item,
    groupLabel: "Rủi ro",
    priorityLabel: priorityLabel(item, item.severityLabel),
    score: scoreBase(item) + dueScore(item) + severityScore,
  };
}

function sourcePriority(
  item: ExecutiveDashboardSourceItem | ExecutiveDecisionItem,
  groupLabel: string,
  fallbackPriority: string,
  groupScore: number,
): ExecutivePriorityQueueItem {
  return {
    ...item,
    groupLabel,
    priorityLabel: priorityLabel(item, fallbackPriority),
    score: scoreBase(item) + dueScore(item) + groupScore,
  };
}

function buildPriorityQueue(data: ExecutiveDashboardData) {
  const sortedItems = [
    ...data.approvalSummary.items.map(approvalPriority),
    ...data.riskSummary.items.map(riskPriority),
    ...data.todayDeadlines.items.map((item) =>
      sourcePriority(item, "Deadline", deadlinePriorityLabel(item), 12),
    ),
    ...data.recentDecisions.items.map((item) =>
      sourcePriority(item, "Quyet dinh", "Moi", 4),
    ),
  ].sort((left, right) => right.score - left.score);
  const uniqueItems: ExecutivePriorityQueueItem[] = [];
  const seenSources = new Set<string>();

  for (const item of sortedItems) {
    const sourceKey = `${item.sourceType}:${item.sourceId}`;

    if (seenSources.has(sourceKey)) {
      const existingIndex = uniqueItems.findIndex(
        (existing) =>
          existing.sourceType === item.sourceType &&
          existing.sourceId === item.sourceId,
      );

      if (existingIndex >= 0) {
        const existing = uniqueItems[existingIndex];

        uniqueItems[existingIndex] = {
          ...existing,
          auditTrail: existing.auditTrail ?? item.auditTrail,
          availableActions: existing.availableActions ?? item.availableActions,
          deniedReason: existing.deniedReason ?? item.deniedReason,
          href: existing.href ?? item.href,
          linkedRecords: existing.linkedRecords ?? item.linkedRecords,
          permissionState: existing.permissionState ?? item.permissionState,
          scopeLabel: existing.scopeLabel ?? item.scopeLabel,
          timeline: existing.timeline ?? item.timeline,
        };
      }

      continue;
    }

    seenSources.add(sourceKey);
    uniqueItems.push(item);
  }

  return uniqueItems.slice(0, 12);
}

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

function FinancialSummary({ data }: { data: ExecutiveDashboardData }) {
  if (data.financialSummary.state === "no_permission") {
    return (
      <section className="rounded-md border border-amber-200 bg-amber-50 p-4" aria-label="Tai chinh">
        <div className="flex items-start gap-3">
          <span className="rounded-md bg-white p-2 text-amber-800">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-amber-950">
              Tai chinh han che quyen
            </h2>
            <p className="mt-1 text-sm leading-6 text-amber-900">
              {data.financialSummary.reason}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-md border bg-white p-4 shadow-sm" aria-label="Tai chinh">
      <h2 className="text-sm font-semibold text-slate-950">Tai chinh trong scope</h2>
      <p className="mt-2 text-2xl font-semibold text-slate-950">
        {new Intl.NumberFormat("vi-VN", {
          currency: "VND",
          maximumFractionDigits: 0,
          style: "currency",
        }).format(data.financialSummary.visibleAmountTotal)}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-600">
        {data.financialSummary.visibleRecordCount} ban ghi, access {data.financialSummary.access}.
      </p>
    </section>
  );
}

function SourceList({
  canDrillDown,
  emptyLabel,
  icon,
  items,
  label,
  onSelectSource,
}: {
  canDrillDown: boolean;
  emptyLabel: string;
  icon: React.ReactNode;
  items: ExecutiveDashboardSourceItem[];
  label: string;
  onSelectSource: (item: ExecutiveDashboardSourceItem) => void;
}) {
  return (
    <section aria-label={label} className="rounded-md border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-slate-600">{icon}</span>
        <h2 className="text-sm font-semibold text-slate-950">{label}</h2>
      </div>
      <div className="mt-3 space-y-2">
        {items.length ? (
          items.map((item) => {
            const content = (
              <>
                <span className="block break-words text-sm font-semibold text-slate-950">
                  {item.title}
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">
                  {item.reason ?? item.status}
                </span>
                <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                  {item.owner ? <span>{item.owner}</span> : null}
                  {item.deadline ? <span>{item.deadline}</span> : null}
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
    </section>
  );
}

function MeetingSnapshot({
  canDrillDown,
  data,
  emptyLabel,
  onSelectSource,
}: {
  canDrillDown: boolean;
  data: ExecutiveDashboardData;
  emptyLabel: string;
  onSelectSource: (item: ExecutiveDashboardSourceItem) => void;
}) {
  return (
    <section aria-label="Meeting Snapshot" className="rounded-md border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-slate-600" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-slate-950">Meeting Snapshot</h2>
      </div>
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
          <p className="font-semibold text-red-800">{data.meetingSnapshot.followUpsOverdue}</p>
          <p className="text-red-800">Qua han</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {data.meetingSnapshot.items.length ? (
          data.meetingSnapshot.items.slice(0, 3).map((item) => {
            const content = (
              <>
                <span className="block break-words text-sm font-semibold text-slate-950">
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
    </section>
  );
}

export function ExecutiveDashboardOverview({
  data,
  legacyScopeLabel,
}: {
  data: ExecutiveDashboardData;
  legacyScopeLabel?: string;
}) {
  const [selectedSourceItem, setSelectedSourceItem] =
    useState<ExecutiveDashboardSourceItem | null>(null);
  const priorityItems = useMemo(() => buildPriorityQueue(data), [data]);
  const scopeLabel = data.scope.scopeLabel || legacyScopeLabel || "Scope hien tai";
  const canDrillDown = data.permissions.canDrillDown;
  const canViewDeadlineSources =
    data.permissions.canViewProjects ||
    data.permissions.canViewProposals ||
    data.permissions.canViewMeetings ||
    data.permissions.canViewDecisions;
  const deadlineEmptyLabel = canViewDeadlineSources
    ? "Khong co deadline trong scope hien tai."
    : "Khong co quyen xem deadline trong scope hien tai.";
  const decisionEmptyLabel = data.permissions.canViewDecisions
    ? "Khong co quyet dinh moi trong scope hien tai."
    : "Khong co quyen xem quyet dinh trong scope hien tai.";
  const meetingEmptyLabel = data.permissions.canViewMeetings
    ? "Khong co lich hop trong scope hien tai."
    : "Khong co quyen xem lich hop trong scope hien tai.";
  const riskEmptyLabel = data.permissions.canViewRisk
    ? "Không có risk cao/nghiêm trọng trong scope hiện tại."
    : "Không có quyền xem risk trong scope hiện tại.";
  const riskCategoryEmptyLabel = data.permissions.canViewRisk
    ? "Không có category risk trong scope hiện tại."
    : "Không có quyền xem category risk trong scope hiện tại.";
  const priorityEmptyLabel =
    canViewDeadlineSources || data.permissions.canViewRisk
      ? "Khong co item uu tien trong scope hien tai."
      : "Khong co quyen xem item uu tien trong scope hien tai.";
  const handleSelectSource = (item: ExecutiveDashboardSourceItem) => {
    if (!canDrillDown) {
      return;
    }

    setSelectedSourceItem(item);
  };

  return (
    <section className="space-y-5">
      <header className="rounded-md border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase text-emerald-700">
              Ban lanh dao
            </p>
            <h1 className="mt-2 break-words text-2xl font-semibold text-slate-950">
              Dashboard Tong Quan
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              KPI, phe duyet, risk, deadline va quyet dinh moi duoc lay tu ExecutiveDashboardData theo scope da guard.
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
          Khong co quyen drill-down nguon dieu hanh trong scope hien tai.
        </p>
      ) : null}

      <ExecutiveDashboardKpiStrip
        canDrillDown={canDrillDown}
        data={data}
        onSelectSource={handleSelectSource}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
        <div className="space-y-5">
          <ExecutivePriorityQueue
            canDrillDown={canDrillDown}
            emptyLabel={priorityEmptyLabel}
            items={priorityItems}
            onSelectSource={handleSelectSource}
          />
          <ExecutiveRiskSummary
            canDrillDown={canDrillDown}
            canCreateRisk={data.permissions.canCreateRisk}
            canUpdateRisk={data.permissions.canUpdateRisk}
            canOverrideRisk={data.permissions.canOverrideRisk}
            canCloseRisk={data.permissions.canCloseRisk}
            canCloseHighRisk={data.permissions.canCloseHighRisk}
            categoryEmptyLabel={riskCategoryEmptyLabel}
            emptyLabel={riskEmptyLabel}
            portfolio={data.projectPortfolio}
            riskMutationOptions={data.riskMutationOptions}
            riskSummary={data.riskSummary}
            onSelectSource={handleSelectSource}
          />
        </div>

        <aside className="space-y-5">
          <FinancialSummary data={data} />
          <SourceList
            canDrillDown={canDrillDown}
            emptyLabel={deadlineEmptyLabel}
            icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
            items={data.todayDeadlines.items}
            label="Deadline hom nay"
            onSelectSource={handleSelectSource}
          />
          <SourceList
            canDrillDown={canDrillDown}
            emptyLabel={decisionEmptyLabel}
            icon={<FileCheck2 className="h-4 w-4" aria-hidden="true" />}
            items={data.recentDecisions.items}
            label="Quyet dinh moi"
            onSelectSource={handleSelectSource}
          />
          <MeetingSnapshot
            canDrillDown={canDrillDown}
            data={data}
            emptyLabel={meetingEmptyLabel}
            onSelectSource={handleSelectSource}
          />
        </aside>
      </div>

      <ExecutiveDrilldownPanel
        item={selectedSourceItem}
        onClose={() => setSelectedSourceItem(null)}
      />
    </section>
  );
}

export function ExecutiveDashboardNoAccessState() {
  return (
    <section className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
      <LockKeyhole className="mx-auto h-8 w-8 text-slate-500" aria-hidden="true" />
      <h1 className="mt-3 text-xl font-semibold text-slate-950">
        Khong co quyen xem Dashboard Tong Quan
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
        Command Center khong nhan duoc ExecutiveDashboardData cho view nay. UI khong hien du lieu legacy/mock de tranh vuot qua guard va finance sanitizer.
      </p>
    </section>
  );
}
