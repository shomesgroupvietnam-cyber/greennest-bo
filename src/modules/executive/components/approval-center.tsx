"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Clock,
  ClipboardList,
  ExternalLink,
  FileText,
  Lock,
} from "lucide-react";
import Link from "next/link";

import type {
  ApprovalCenterAxisKey,
  ApprovalCenterAxisTab,
  ApprovalCenterData,
  ApprovalCenterDueGroup,
  ApprovalCenterFinancialAccess,
  ApprovalCenterPriority,
  ApprovalCenterQueueItem,
} from "@/modules/executive/types";

const dueToneClasses: Record<ApprovalCenterDueGroup, string> = {
  later: "bg-slate-100 text-slate-700",
  none: "bg-slate-100 text-slate-700",
  overdue: "bg-red-50 text-red-700",
  this_week: "bg-amber-50 text-amber-700",
  today: "bg-emerald-50 text-emerald-700",
};

const priorityToneClasses: Record<ApprovalCenterPriority, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-amber-100 text-amber-800",
  low: "bg-slate-100 text-slate-600",
  normal: "bg-blue-50 text-blue-700",
  urgent: "bg-red-50 text-red-700",
};

const financeLabels: Record<ApprovalCenterFinancialAccess, string> = {
  allowed: "Tai chinh duoc xem",
  no_permission: "Tai chinh han che quyen",
  not_applicable: "Khong co du lieu tai chinh",
};

function escalationTargetSummary(item: ApprovalCenterQueueItem) {
  const targets = item.escalation?.targets ?? [];

  if (!targets.length) {
    return undefined;
  }

  return targets.map((target) => target.label).join(", ");
}

function tabPanelId(key: ApprovalCenterAxisKey) {
  return `approval-center-panel-${key}`;
}

function tabButtonId(key: ApprovalCenterAxisKey) {
  return `approval-center-tab-${key}`;
}

export function ApprovalCenterNoAccessState() {
  return (
    <section className="space-y-5">
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase text-emerald-700">
          Ban lanh dao
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          Approval Center
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Khong co quyen Approval Center trong scope hien tai.
        </p>
      </div>
    </section>
  );
}

function CategorySummary({ tab }: { tab: ApprovalCenterAxisTab }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {tab.categories.map((category) => (
        <div className="rounded-lg border bg-white p-3 shadow-sm" key={category.key}>
          <p className="text-xs font-semibold uppercase text-slate-400">
            {category.label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {category.total}
          </p>
        </div>
      ))}
    </div>
  );
}

function QueueItem({ item }: { item: ApprovalCenterQueueItem }) {
  const targetSummary = escalationTargetSummary(item);
  const visibleAmountLabel =
    item.financialAccess === "allowed" ? item.amountLabel : undefined;
  const policyLabel = item.policyLabel ?? item.escalation?.policyLabel;
  const metadata = [
    item.ownerName ? `Owner: ${item.ownerName}` : undefined,
    item.reviewerLabel ? `Approver: ${item.reviewerLabel}` : undefined,
    item.riskLevel ? `Risk: ${item.riskLevel}` : undefined,
    policyLabel ? `Policy: ${policyLabel}` : undefined,
  ].filter((detail): detail is string => Boolean(detail));

  return (
    <article className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
              {item.code}
            </span>
            <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
              {item.categoryLabel}
            </span>
            <span className={`rounded-md px-2 py-1 text-xs font-semibold ${priorityToneClasses[item.priority]}`}>
              {item.priority}
            </span>
          </div>
          <h2 className="mt-3 text-base font-semibold text-slate-950">
            {item.title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {item.projectName ?? item.scopeLabel} - Requester: {item.requester}
          </p>
          {metadata.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
              {metadata.map((detail) => (
                <span
                  className="rounded-md bg-slate-50 px-2 py-1"
                  key={detail}
                >
                  {detail}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${dueToneClasses[item.dueGroup]}`}>
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {item.dueLabel}
          </span>
          <span className="rounded-md bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
            {item.statusLabel}
          </span>
        </div>
      </div>

      {item.reason ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">{item.reason}</p>
      ) : null}

      {item.overdue || item.escalation?.required ? (
        <div className="mt-3 space-y-2 border-l-2 border-red-200 pl-3 text-sm">
          {item.overdue ? (
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  {item.overdue.severity}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  Owner: {item.overdue.ownerLabel}
                </span>
              </div>
              <p className="break-words text-slate-600">{item.overdue.reason}</p>
              <p className="break-words text-slate-700">
                Next action: {item.overdue.nextAction}
              </p>
            </div>
          ) : null}
          {item.escalation?.required ? (
            <div className="space-y-1 text-xs text-slate-600">
              <p className="font-semibold text-red-700">
                Escalation: {item.escalation.trigger}
                {item.escalation.status ? ` - ${item.escalation.status}` : ""}
              </p>
              {targetSummary ? (
                <p className="break-words">Targets: {targetSummary}</p>
              ) : null}
              {item.escalation.notificationId ? (
                <p className="break-words">
                  Mock alert: {item.escalation.notificationId}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2.5 py-1">
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          {item.sourceType === "proposal" ? "Proposal" : "Leadership queue"}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2.5 py-1">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          {financeLabels[item.financialAccess]}
        </span>
        {visibleAmountLabel ? (
          <span className="rounded-md bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
            {visibleAmountLabel}
          </span>
        ) : null}
        {item.href ? (
          <Link
            aria-label={`Mo chi tiet ${item.title}`}
            className="ml-auto inline-flex items-center gap-1 rounded-md border px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50"
            href={item.href}
          >
            Mo chi tiet
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function PlaceholderPanel({ tab }: { tab: ApprovalCenterAxisTab }) {
  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-slate-100 p-2 text-slate-600">
          <ClipboardList className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-950">Placeholder MVP</p>
          <p className="mt-1 text-sm text-slate-500">{tab.helper}</p>
        </div>
      </div>
    </div>
  );
}

export function ApprovalCenter({
  data,
  legacyScopeLabel,
}: {
  data: ApprovalCenterData | null;
  legacyScopeLabel?: string;
}) {
  const [activeKey, setActiveKey] = useState<ApprovalCenterAxisKey>("axis_1");
  const activeTab = useMemo(() => {
    return data?.tabs.find((tab) => tab.key === activeKey) ?? data?.tabs[0];
  }, [activeKey, data]);

  if (!data?.permissions.canView || !activeTab) {
    return <ApprovalCenterNoAccessState />;
  }

  const focusTab = (key: ApprovalCenterAxisKey) => {
    document.getElementById(tabButtonId(key))?.focus();
  };

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    const lastIndex = data.tabs.length - 1;
    let nextIndex: number | undefined;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
    }

    if (event.key === "Home") {
      nextIndex = 0;
    }

    if (event.key === "End") {
      nextIndex = lastIndex;
    }

    if (nextIndex === undefined) {
      return;
    }

    event.preventDefault();
    const nextKey = data.tabs[nextIndex]?.key;

    if (nextKey) {
      setActiveKey(nextKey);
      focusTab(nextKey);
    }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">
              Ban lanh dao
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              Approval Center
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {data.scopeLabel || legacyScopeLabel || "Approval scope"} - {activeTab.total} items
            </p>
          </div>
          <div className="rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Generated {new Date(data.generatedAt).toLocaleString("vi-VN")}
          </div>
        </div>

        <div
          aria-label="Approval axes"
          className="mt-5 flex flex-wrap gap-2"
          role="tablist"
        >
          {data.tabs.map((tab, index) => (
            <button
              aria-controls={tabPanelId(tab.key)}
              aria-selected={activeTab.key === tab.key}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold ${
                activeTab.key === tab.key
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
              id={tabButtonId(tab.key)}
              key={tab.key}
              onClick={() => setActiveKey(tab.key)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              role="tab"
              tabIndex={activeTab.key === tab.key ? 0 : -1}
              type="button"
            >
              {tab.label}
              <span className="rounded bg-white px-1.5 py-0.5 text-xs text-slate-500">
                {tab.total}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div
        aria-labelledby={tabButtonId(activeTab.key)}
        id={tabPanelId(activeTab.key)}
        role="tabpanel"
      >
        {activeTab.state === "placeholder" ? (
          <PlaceholderPanel tab={activeTab} />
        ) : (
          <div className="space-y-4">
            <CategorySummary tab={activeTab} />
            <div
              aria-label={`Approval queue ${activeTab.label}`}
              className="space-y-3"
              role="region"
            >
              {activeTab.items.length > 0 ? (
                activeTab.items.map((item) => <QueueItem item={item} key={item.id} />)
              ) : (
                <div className="rounded-lg border bg-white p-5 text-sm text-slate-500 shadow-sm">
                  Khong co approval nao trong scope hien tai.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
