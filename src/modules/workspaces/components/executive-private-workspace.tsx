"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Lock,
  ShieldCheck,
} from "lucide-react";

import { ExecutiveDrilldownPanel } from "@/modules/dashboard/components/executive-drilldown-panel";
import type {
  ExecutiveDashboardSourceItem,
  ExecutiveDashboardTone,
} from "@/modules/dashboard/types";
import { getPrivateWorkspaceVariantConfig } from "@/modules/workspaces/private-workspace-variants";
import type {
  ExecutivePrivateWorkspaceData,
  PrivateWorkspaceSectionItem,
} from "@/modules/workspaces/types";

const toneClasses: Record<
  ExecutiveDashboardTone,
  { bg: string; border: string; text: string }
> = {
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

  if (sourceType === "meeting") {
    return CalendarClock;
  }

  if (sourceType === "decision") {
    return CheckCircle2;
  }

  if (sourceType === "project") {
    return BriefcaseBusiness;
  }

  return ClipboardList;
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

function WorkspaceItem({
  canDrillDown,
  item,
  onSelect,
}: {
  canDrillDown: boolean;
  item: PrivateWorkspaceSectionItem;
  onSelect: (item: PrivateWorkspaceSectionItem) => void;
}) {
  const Icon = iconForSource(item.sourceType);
  const content = (
    <>
      <span
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${toneClasses[item.tone].bg} ${toneClasses[item.tone].text}`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          {item.priorityLabel ? (
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${toneClasses[item.tone].bg} ${toneClasses[item.tone].text}`}
            >
              {item.priorityLabel}
            </span>
          ) : null}
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {item.status}
          </span>
          {item.groupLabel ? (
            <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
              {item.groupLabel}
            </span>
          ) : null}
        </span>
        <span className="mt-2 block break-words text-sm font-semibold text-slate-950">
          {item.title}
        </span>
        <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
          {item.owner ? <span>Owner: {item.owner}</span> : null}
          {item.deadline ? <span>Deadline: {item.deadline}</span> : null}
          {item.projectId ? <span>Project: {item.projectId}</span> : null}
          {item.reason ? <span>Reason: {item.reason}</span> : null}
        </span>
        {item.readOnlyReason ? (
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-600">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            {item.readOnlyReason}
          </span>
        ) : null}
      </span>
      {canDrillDown ? (
        <ChevronRight
          className="mt-3 h-4 w-4 shrink-0 text-slate-500"
          aria-hidden="true"
        />
      ) : null}
    </>
  );

  if (!canDrillDown) {
    return (
      <article
        className={`flex min-h-24 gap-3 rounded-md border bg-slate-50 p-3 ${toneClasses[item.tone].border}`}
      >
        {content}
      </article>
    );
  }

  return (
    <button
      aria-label={`Xem chi tiet ${item.title}`}
      className={`flex min-h-24 w-full gap-3 rounded-md border p-3 text-left transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${toneClasses[item.tone].border}`}
      onClick={() => onSelect(item)}
      type="button"
    >
      {content}
    </button>
  );
}

function WorkspaceSection({
  ariaLabel,
  emptyLabel,
  items,
  onSelect,
  title,
  canDrillDown,
}: {
  ariaLabel: string;
  emptyLabel: string;
  items: PrivateWorkspaceSectionItem[];
  onSelect: (item: PrivateWorkspaceSectionItem) => void;
  title: string;
  canDrillDown: boolean;
}) {
  return (
    <section aria-label={ariaLabel} className="rounded-md border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
          {items.length}
        </span>
      </div>
      <div className="mt-3 space-y-3">
        {items.length ? (
          items.map((item) => (
            <WorkspaceItem
              canDrillDown={canDrillDown}
              item={item}
              key={`${ariaLabel}-${item.id}`}
              onSelect={onSelect}
            />
          ))
        ) : (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            {emptyLabel}
          </p>
        )}
      </div>
    </section>
  );
}

type WorkspaceSectionConfig = {
  ariaLabel: string;
  emptyLabel: string;
  items: PrivateWorkspaceSectionItem[];
  title: string;
};

function buildWorkspaceSections(
  data: ExecutivePrivateWorkspaceData,
): WorkspaceSectionConfig[] {
  if (data.variant === "secretary_assistant") {
    return [
      {
        ariaLabel: "Lich lanh dao",
        emptyLabel: "Khong co lich lanh dao trong delegation/scope hien tai.",
        items: data.assistantSupport.scheduleItems,
        title: "Lich lanh dao",
      },
      {
        ariaLabel: "Ho so trinh",
        emptyLabel: "Khong co ho so trinh trong delegation/scope hien tai.",
        items: data.assistantSupport.submissionDossiers,
        title: "Ho so trinh",
      },
      {
        ariaLabel: "Tai lieu hop",
        emptyLabel: "Khong co tai lieu hop trong delegation/scope hien tai.",
        items: data.assistantSupport.meetingDocuments,
        title: "Tai lieu hop",
      },
      {
        ariaLabel: "Reminder",
        emptyLabel: "Khong co reminder trong delegation/scope hien tai.",
        items: data.assistantSupport.reminders,
        title: "Reminder",
      },
      {
        ariaLabel: "Approval uy quyen",
        emptyLabel: "Khong co approval pending trong delegation/scope hien tai.",
        items: data.assistantSupport.pendingApprovals,
        title: "Approval uy quyen",
      },
      {
        ariaLabel: "Support tasks",
        emptyLabel: "Khong co support task trong delegation/scope hien tai.",
        items: data.assistantSupport.supportTasks,
        title: "Support tasks",
      },
      {
        ariaLabel: "Du an duoc giao",
        emptyLabel: "Khong co du an duoc giao trong scope hien tai.",
        items: data.assignedProjects,
        title: "Du an duoc giao",
      },
    ];
  }

  if (data.variant === "viewer") {
    return [
      {
        ariaLabel: "Read-only priority",
        emptyLabel: "Khong co item read-only trong scope hien tai.",
        items: data.priorityItems,
        title: "Read-only priority",
      },
      {
        ariaLabel: "Du an duoc xem",
        emptyLabel: "Khong co du an duoc xem trong scope hien tai.",
        items: data.assignedProjects,
        title: "Du an duoc xem",
      },
      {
        ariaLabel: "Quyet dinh duoc xem",
        emptyLabel: "Khong co quyet dinh duoc xem trong scope hien tai.",
        items: data.decisionItems,
        title: "Quyet dinh duoc xem",
      },
      {
        ariaLabel: "Cuoc hop duoc xem",
        emptyLabel: "Khong co cuoc hop duoc xem trong scope hien tai.",
        items: data.meetingItems,
        title: "Cuoc hop duoc xem",
      },
    ];
  }

  if (data.variant === "project_director") {
    return [
      {
        ariaLabel: "Du an duoc giao",
        emptyLabel: "Khong co du an duoc giao trong scope hien tai.",
        items: data.assignedProjects,
        title: "Du an duoc giao",
      },
      {
        ariaLabel: "Project war room priority",
        emptyLabel: "Khong co item uu tien trong project scope hien tai.",
        items: data.priorityItems,
        title: "Project war room priority",
      },
      {
        ariaLabel: "Risk va blocker du an",
        emptyLabel: "Khong co risk/blocker trong project scope hien tai.",
        items: data.riskItems,
        title: "Risk va blocker du an",
      },
      {
        ariaLabel: "Deadline du an",
        emptyLabel: "Khong co deadline trong project scope hien tai.",
        items: data.deadlineItems,
        title: "Deadline du an",
      },
      {
        ariaLabel: "Cuoc hop du an",
        emptyLabel: "Khong co cuoc hop trong project scope hien tai.",
        items: data.meetingItems,
        title: "Cuoc hop du an",
      },
      {
        ariaLabel: "Quyet dinh lien quan du an",
        emptyLabel: "Khong co quyet dinh lien quan project scope hien tai.",
        items: data.decisionItems,
        title: "Quyet dinh lien quan du an",
      },
    ];
  }

  if (data.variant === "department_head") {
    return [
      {
        ariaLabel: "Department workflow priority",
        emptyLabel: "Khong co item uu tien trong workstream/module scope hien tai.",
        items: data.priorityItems,
        title: "Department workflow priority",
      },
      {
        ariaLabel: "Ho so chuyen mon",
        emptyLabel: "Khong co ho so chuyen mon can xu ly.",
        items: data.approvalItems,
        title: "Ho so chuyen mon",
      },
      {
        ariaLabel: "Risk chuyen mon",
        emptyLabel: "Khong co risk chuyen mon trong scope hien tai.",
        items: data.riskItems,
        title: "Risk chuyen mon",
      },
      {
        ariaLabel: "Deadline chuyen mon",
        emptyLabel: "Khong co deadline chuyen mon trong scope hien tai.",
        items: data.deadlineItems,
        title: "Deadline chuyen mon",
      },
      {
        ariaLabel: "Cuoc hop phong ban",
        emptyLabel: "Khong co cuoc hop phong ban trong scope hien tai.",
        items: data.meetingItems,
        title: "Cuoc hop phong ban",
      },
    ];
  }

  if (data.variant === "chairman") {
    return [
      {
        ariaLabel: "Portfolio priority",
        emptyLabel: "Khong co item portfolio uu tien trong scope hien tai.",
        items: data.priorityItems,
        title: "Portfolio priority",
      },
      {
        ariaLabel: "Portfolio du an",
        emptyLabel: "Khong co du an portfolio trong scope hien tai.",
        items: data.assignedProjects,
        title: "Portfolio du an",
      },
      {
        ariaLabel: "Critical risk",
        emptyLabel: "Khong co critical/high risk trong scope hien tai.",
        items: data.riskItems,
        title: "Critical risk",
      },
      {
        ariaLabel: "Overdue approval",
        emptyLabel: "Khong co approval qua han/can xu ly.",
        items: data.approvalItems,
        title: "Overdue approval",
      },
      {
        ariaLabel: "Strategic decisions",
        emptyLabel: "Khong co strategic decision gan day.",
        items: data.decisionItems,
        title: "Strategic decisions",
      },
    ];
  }

  return [
    {
      ariaLabel: "Priority area",
      emptyLabel: "Khong co item uu tien trong scope hien tai.",
      items: data.priorityItems,
      title: "Priority area",
    },
    {
      ariaLabel: "Approval queue",
      emptyLabel: "Khong co approval can xu ly.",
      items: data.approvalItems,
      title: "Approval queue",
    },
    {
      ariaLabel: "Cross-project deadlines",
      emptyLabel: "Khong co deadline trong scope hien tai.",
      items: data.deadlineItems,
      title: "Cross-project deadlines",
    },
    {
      ariaLabel: "Escalation risk",
      emptyLabel: "Khong co risk/blocker trong scope hien tai.",
      items: data.riskItems,
      title: "Escalation risk",
    },
    {
      ariaLabel: "Meeting follow-up",
      emptyLabel: "Khong co cuoc hop trong scope hien tai.",
      items: data.meetingItems,
      title: "Meeting follow-up",
    },
    {
      ariaLabel: "Assigned portfolio",
      emptyLabel: "Khong co du an duoc giao trong scope hien tai.",
      items: data.assignedProjects,
      title: "Assigned portfolio",
    },
  ];
}

function AssistantSupportPanel({ data }: { data: ExecutivePrivateWorkspaceData }) {
  const isViewer = data.variant === "viewer";
  const isAssistant = data.variant === "secretary_assistant";
  const ariaLabel = isViewer
    ? "Read-only summary"
    : isAssistant
      ? "Secretary delegation support"
      : "Assistant support";
  const title = isViewer
    ? "Read-only summary"
    : isAssistant
      ? "Delegation support"
      : "Assistant support";

  return (
    <section aria-label={ariaLabel} className="rounded-md border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <ShieldCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" />
      </div>
      <div className="mt-3 space-y-3">
        {isAssistant && data.assistantSupport.delegations.length ? (
          <div className="space-y-2">
            {data.assistantSupport.delegations.map((delegation) => (
              <article
                className={`rounded-md border p-3 text-sm ${
                  delegation.canActOnBehalf
                    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
                key={delegation.delegationId}
              >
                <p className="font-semibold">
                  {delegation.canActOnBehalf ? "Delegation active" : "Delegation disabled"}
                </p>
                <p className="mt-1 break-words text-xs">
                  {delegation.principalUserId} -{" "}
                  {delegation.actionKeys.length
                    ? delegation.actionKeys.join(", ")
                    : "khong co action delegatable"}
                </p>
                {delegation.reason ? (
                  <p className="mt-1 text-xs">{delegation.reason}</p>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}

        {data.assistantSupport.allowedActions.length ? (
          data.assistantSupport.allowedActions.map((action) => (
            <article
              className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm"
              key={action.id}
            >
              <p className="font-semibold text-emerald-950">{action.label}</p>
              <p className="mt-1 break-words text-xs text-emerald-800">
                {action.principalUserId} - {action.actionKey}
              </p>
              {action.reason ? (
                <p className="mt-1 text-xs text-emerald-800">{action.reason}</p>
              ) : null}
            </article>
          ))
        ) : (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            {isViewer
              ? "Read-only: khong co mutation action trong workspace nay."
              : isAssistant
                ? "Khong co delegated action active trong scope hien tai."
                : "Khong co delegated action active trong scope hien tai."}
          </p>
        )}
      </div>
    </section>
  );
}

export function ExecutivePrivateWorkspaceNoAccessState() {
  return (
    <section className="rounded-md border bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="rounded-md bg-slate-100 p-2 text-slate-700">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-slate-950">
            Khong co quyen xem Private Workspace
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            DTO Private Workspace khong duoc load cho scope hien tai.
          </p>
        </div>
      </div>
    </section>
  );
}

export function ExecutivePrivateWorkspace({
  data,
  legacyScopeLabel,
}: {
  data: ExecutivePrivateWorkspaceData | null;
  legacyScopeLabel?: string;
}) {
  const [selectedItem, setSelectedItem] =
    useState<ExecutiveDashboardSourceItem | null>(null);

  if (!data) {
    return <ExecutivePrivateWorkspaceNoAccessState />;
  }

  const variantConfig = getPrivateWorkspaceVariantConfig(data.variant);
  const canDrillDown = data.permissions.canDrillDown;
  const sections = buildWorkspaceSections(data);

  return (
    <section className="space-y-4">
      <header className="rounded-md border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-emerald-700">
              {variantConfig.label}
            </p>
            <h1 className="mt-1 break-words text-2xl font-semibold text-slate-950">
              Private Workspace
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {data.scope.scopeLabel || legacyScopeLabel || "Scope hien tai"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-slate-700">
              {data.permissions.mutationMode}
            </span>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-slate-700">
              {formatGeneratedAt(data.generatedAt)}
            </span>
          </div>
        </div>
      </header>

      {data.emptyState ? (
        <section
          aria-label="Private Workspace state"
          className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-900"
        >
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5" aria-hidden="true" />
            <div>
              <h2 className="font-semibold">{data.emptyState.title}</h2>
              <p className="mt-1 text-sm leading-6">{data.emptyState.description}</p>
            </div>
          </div>
        </section>
      ) : null}

      <section aria-label="KPI theo role" className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        {data.kpis.map((kpi) => (
          <div className="rounded-md border bg-white p-4 shadow-sm" key={kpi.id}>
            <p className="text-sm text-slate-600">{kpi.label}</p>
            <p className="mt-2 break-words text-2xl font-semibold text-slate-950">
              {kpi.value}
            </p>
          </div>
        ))}
      </section>

      {!data.permissions.canViewFinance ? (
        <section
          aria-label="Tai chinh"
          className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm"
        >
          Khong co quyen xem tai chinh trong scope nay.
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {sections.map((section) => (
          <WorkspaceSection
            ariaLabel={section.ariaLabel}
            canDrillDown={canDrillDown}
            emptyLabel={section.emptyLabel}
            items={section.items}
            key={section.ariaLabel}
            onSelect={setSelectedItem}
            title={section.title}
          />
        ))}
        <AssistantSupportPanel data={data} />
      </div>

      <ExecutiveDrilldownPanel
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </section>
  );
}
