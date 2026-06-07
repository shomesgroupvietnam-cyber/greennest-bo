"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Banknote,
  Bot,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  Gauge,
  KeyRound,
  Lock,
  ShieldCheck,
} from "lucide-react";

import { ExecutiveDrilldownPanel } from "@/modules/dashboard/components/executive-drilldown-panel";
import { executiveSourceTypeLabel } from "@/modules/dashboard/source-labels";
import type {
  ExecutiveDashboardSourceItem,
  ExecutiveDashboardTone,
} from "@/modules/dashboard/types";
import { getPrivateWorkspaceVariantConfig } from "@/modules/workspaces/private-workspace-variants";
import type {
  ExecutivePrivateWorkspaceData,
  PrivateWorkspaceSectionItem,
} from "@/modules/workspaces/types";
import type { ExecutiveAiSummary } from "@/modules/ai/types";

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

function formatVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function PanelStateMessage({
  icon,
  reason,
}: {
  icon?: React.ReactNode;
  reason?: string;
}) {
  return (
    <p className="mt-3 flex items-start gap-2 rounded-md border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <span>{reason ?? "Chưa có dữ liệu trong phạm vi hiện tại."}</span>
    </p>
  );
}

function MetricTiles({
  items,
}: {
  items: NonNullable<
    ExecutivePrivateWorkspaceData["resourceProgress"]
  >["items"];
}) {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          className={`rounded-md border p-3 ${toneClasses[item.tone].bg} ${toneClasses[item.tone].border}`}
          key={item.id}
        >
          <p className="text-xs font-semibold text-slate-600">{item.label}</p>
          <p className="mt-2 break-words text-xl font-semibold text-slate-950">
            {item.value}
          </p>
          {item.helper ? (
            <p className="mt-1 text-xs leading-5 text-slate-600">
              {item.helper}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function FinancialSummaryPanel({
  summary,
}: {
  summary: NonNullable<ExecutivePrivateWorkspaceData["financialSummary"]>;
}) {
  return (
    <section
      aria-label="Dòng tiền / Chi phí tổng quan"
      className="rounded-md border bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-950">
            Dòng tiền / Chi phí tổng quan
          </h2>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
          {summary.state}
        </span>
      </div>

      {summary.state === "no_permission" ? (
        <PanelStateMessage
          icon={<Lock className="h-4 w-4" aria-hidden="true" />}
          reason={summary.reason}
        />
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs font-semibold text-emerald-800">
              Tổng giá trị thấy được
            </p>
            <p className="mt-2 break-words text-xl font-semibold text-emerald-950">
              {formatVnd(summary.visibleAmountTotal)}
            </p>
          </div>
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs font-semibold text-blue-800">
              Bản ghi có quyền
            </p>
            <p className="mt-2 text-xl font-semibold text-blue-950">
              {summary.visibleRecordCount}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-600">Mức truy cập</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">
              {summary.access}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function ResourceProgressPanel({
  resourceProgress,
}: {
  resourceProgress: NonNullable<
    ExecutivePrivateWorkspaceData["resourceProgress"]
  >;
}) {
  return (
    <section
      aria-label="Tiến độ và resource vận hành"
      className="rounded-md border bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-blue-700" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-950">
            Tiến độ và resource vận hành
          </h2>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
          {resourceProgress.state}
        </span>
      </div>
      {resourceProgress.items.length ? (
        <MetricTiles items={resourceProgress.items} />
      ) : (
        <PanelStateMessage reason={resourceProgress.reason} />
      )}
    </section>
  );
}

function RiskMapPanel({
  riskMap,
}: {
  riskMap: NonNullable<ExecutivePrivateWorkspaceData["riskMap"]>;
}) {
  return (
    <section
      aria-label="Bản đồ rủi ro Chủ tịch"
      className="rounded-md border bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-700" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-950">
            Bản đồ rủi ro Chủ tịch
          </h2>
        </div>
        <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-800">
          {riskMap.total}
        </span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-xs font-semibold text-red-800">Risk trong scope</p>
          <p className="mt-2 text-xl font-semibold text-red-950">
            {riskMap.total}
          </p>
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold text-amber-800">
            Dự án bị ảnh hưởng
          </p>
          <p className="mt-2 text-xl font-semibold text-amber-950">
            {riskMap.affectedProjectCount}
          </p>
        </div>
      </div>
      {riskMap.categories.length ? (
        <div className="mt-3 space-y-2">
          {riskMap.categories.slice(0, 4).map((category) => (
            <div
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm"
              key={category.categoryKey}
            >
              <span className="font-semibold text-slate-800">
                {category.categoryLabel}
              </span>
              <span className="text-xs text-slate-600">
                {category.count} risk - {category.affectedProjectCount} dự án
              </span>
            </div>
          ))}
        </div>
      ) : (
        <PanelStateMessage reason="Chưa có risk map trong phạm vi hiện tại." />
      )}
    </section>
  );
}

function PermissionOverviewPanel({
  permissionOverview,
}: {
  permissionOverview: NonNullable<
    ExecutivePrivateWorkspaceData["permissionOverview"]
  >;
}) {
  return (
    <section
      aria-label="Tổng quan phân quyền cấp cao"
      className="rounded-md border bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-purple-700" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-950">
            Tổng quan phân quyền cấp cao
          </h2>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
          {permissionOverview.state}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {permissionOverview.items.map((item) => (
          <div
            className={`rounded-md border p-3 ${toneClasses[item.tone].bg} ${toneClasses[item.tone].border}`}
            key={item.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-slate-900">{item.label}</p>
              <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                {item.enabled ? "Được phép" : "Không có quyền"}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              {item.reason}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProjectCostPanel({
  projectCost,
}: {
  projectCost: NonNullable<ExecutivePrivateWorkspaceData["projectCost"]>;
}) {
  const summary = projectCost.financialSummary;
  const noPermissionReason =
    summary.state === "no_permission" ? summary.reason : projectCost.reason;

  return (
    <section
      aria-label="Cost dự án"
      className="rounded-md border bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-950">Cost dự án</h2>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
          {projectCost.state}
        </span>
      </div>
      {projectCost.state === "no_permission" ||
      summary.state === "no_permission" ? (
        <PanelStateMessage
          icon={<Lock className="h-4 w-4" aria-hidden="true" />}
          reason={noPermissionReason}
        />
      ) : (
        <>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold text-emerald-800">
                Tổng cost thấy được
              </p>
              <p className="mt-2 break-words text-xl font-semibold text-emerald-950">
                {formatVnd(summary.visibleAmountTotal)}
              </p>
            </div>
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs font-semibold text-blue-800">
                Bản ghi cost
              </p>
              <p className="mt-2 text-xl font-semibold text-blue-950">
                {summary.visibleRecordCount}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-600">
                Dự án có quyền
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {projectCost.items.length}
              </p>
            </div>
          </div>
          {projectCost.reason ? (
            <PanelStateMessage reason={projectCost.reason} />
          ) : null}
        </>
      )}
    </section>
  );
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
          {item.owner ? <span>Người phụ trách: {item.owner}</span> : null}
          {item.deadline ? <span>Hạn xử lý: {item.deadline}</span> : null}
          {item.projectId ? <span>Dự án: {item.projectId}</span> : null}
          {item.reason ? <span>Lý do: {item.reason}</span> : null}
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
      aria-label={`Xem chi tiết ${item.title}`}
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
    <section
      aria-label={ariaLabel}
      className="rounded-md border bg-white p-4 shadow-sm"
    >
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

const aiSummaryStatusLabels: Record<ExecutiveAiSummary["status"], string> = {
  draft: "Nháp/gợi ý",
  insufficient_context: "Thiếu dữ liệu",
  placeholder: "Chờ dữ liệu",
  unavailable: "Chưa khả dụng",
};

function WorkspaceAiSummaryPanel({ summary }: { summary: ExecutiveAiSummary }) {
  const isInsufficient = summary.status === "insufficient_context";
  const proposals = (summary.actionProposals ?? []).filter(
    (proposal) =>
      proposal.status === "proposed" &&
      (!proposal.workflowStatus || proposal.workflowStatus === "DRAFT"),
  );

  return (
    <section
      aria-label="Bản tóm tắt AI nháp của không gian làm việc"
      className="rounded-md border bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-slate-600" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-950">
            Bản tóm tắt AI nháp
          </h2>
        </div>
        <span className="inline-flex w-fit rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
          {aiSummaryStatusLabels[summary.status]}
        </span>
      </div>

      {isInsufficient ? (
        <p className="mt-3 text-sm font-semibold text-slate-800">
          Không có dữ liệu trong phạm vi hiện tại
        </p>
      ) : null}
      <p className="mt-2 text-sm leading-6 text-slate-700">{summary.text}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Cập nhật {formatGeneratedAt(summary.updatedAt)}. Bản tóm tắt này là gợi
        ý nội bộ, cần kiểm tra nguồn trích dẫn trước khi ra quyết định.
      </p>

      {summary.citations.length ? (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Nguồn trích dẫn nội bộ
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {summary.citations.map((citation) => (
              <span
                className="inline-flex max-w-full items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                key={citation.id}
              >
                <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block truncate">{citation.title}</span>
                  <span className="block text-[11px] font-normal text-slate-500">
                    {executiveSourceTypeLabel(citation.sourceType)}:{" "}
                    {citation.sourceId}
                  </span>
                </span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {proposals.length ? (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Đề xuất hành động tham khảo
          </p>
          <div className="mt-2 space-y-2">
            {proposals.map((proposal) => (
              <article
                className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
                key={proposal.id}
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <p className="font-semibold">{proposal.title}</p>
                  <span className="w-fit rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                    {proposal.status}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-amber-900">
                  {proposal.actionKey} - {proposal.requiredPermission}. Chưa
                  thay đổi dữ liệu nghiệp vụ.
                </p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
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
  const workflowChecklistItems = data.workflowChecklist?.items ?? [];
  const professionalApprovalItems = data.professionalApprovals?.items ?? [];
  const professionalApprovalKeys = new Set(
    professionalApprovalItems.map(
      (item) => `${item.sourceType}:${item.sourceId}`,
    ),
  );
  const departmentDossierItems = data.approvalItems.filter(
    (item) =>
      !professionalApprovalKeys.has(`${item.sourceType}:${item.sourceId}`),
  );

  if (data.variant === "secretary_assistant") {
    return [
      {
        ariaLabel: "Lịch lãnh đạo",
        emptyLabel: "Không có lịch lãnh đạo trong phạm vi ủy quyền hiện tại.",
        items: data.assistantSupport.scheduleItems,
        title: "Lịch lãnh đạo",
      },
      {
        ariaLabel: "Hồ sơ trình",
        emptyLabel: "Không có hồ sơ trình trong phạm vi ủy quyền hiện tại.",
        items: data.assistantSupport.submissionDossiers,
        title: "Hồ sơ trình",
      },
      {
        ariaLabel: "Tài liệu họp",
        emptyLabel: "Không có tài liệu họp trong phạm vi ủy quyền hiện tại.",
        items: data.assistantSupport.meetingDocuments,
        title: "Tài liệu họp",
      },
      {
        ariaLabel: "Nhắc việc",
        emptyLabel: "Không có nhắc việc trong phạm vi ủy quyền hiện tại.",
        items: data.assistantSupport.reminders,
        title: "Nhắc việc",
      },
      {
        ariaLabel: "Phê duyệt được ủy quyền",
        emptyLabel:
          "Không có phê duyệt đang chờ trong phạm vi ủy quyền hiện tại.",
        items: data.assistantSupport.pendingApprovals,
        title: "Phê duyệt được ủy quyền",
      },
      {
        ariaLabel: "Việc hỗ trợ",
        emptyLabel: "Không có việc hỗ trợ trong phạm vi ủy quyền hiện tại.",
        items: data.assistantSupport.supportTasks,
        title: "Việc hỗ trợ",
      },
      {
        ariaLabel: "Dự án được giao",
        emptyLabel: "Không có dự án được giao trong phạm vi hiện tại.",
        items: data.assignedProjects,
        title: "Dự án được giao",
      },
    ];
  }

  if (data.variant === "viewer") {
    return [
      {
        ariaLabel: "Ưu tiên chỉ xem",
        emptyLabel:
          "Không có việc ưu tiên ở chế độ chỉ xem trong phạm vi hiện tại.",
        items: data.priorityItems,
        title: "Ưu tiên chỉ xem",
      },
      {
        ariaLabel: "Dự án được xem",
        emptyLabel: "Không có dự án được xem trong phạm vi hiện tại.",
        items: data.assignedProjects,
        title: "Dự án được xem",
      },
      {
        ariaLabel: "Quyết định được xem",
        emptyLabel: "Không có quyết định được xem trong phạm vi hiện tại.",
        items: data.decisionItems,
        title: "Quyết định được xem",
      },
      {
        ariaLabel: "Cuộc họp được xem",
        emptyLabel: "Không có cuộc họp được xem trong phạm vi hiện tại.",
        items: data.meetingItems,
        title: "Cuộc họp được xem",
      },
    ];
  }

  if (data.variant === "project_director") {
    return [
      {
        ariaLabel: "Dự án được giao",
        emptyLabel: "Không có dự án được giao trong phạm vi hiện tại.",
        items: data.assignedProjects,
        title: "Dự án được giao",
      },
      {
        ariaLabel: "Phê duyệt dự án",
        emptyLabel: "Không có phê duyệt trong phạm vi dự án hiện tại.",
        items: data.approvalItems,
        title: "Phê duyệt dự án",
      },
      {
        ariaLabel: "Rủi ro và vướng mắc dự án",
        emptyLabel: "Không có rủi ro/vướng mắc trong phạm vi dự án hiện tại.",
        items: data.riskItems,
        title: "Rủi ro và vướng mắc dự án",
      },
      {
        ariaLabel: "Việc ưu tiên của dự án",
        emptyLabel: "Không có việc ưu tiên trong phạm vi dự án hiện tại.",
        items: data.priorityItems,
        title: "Việc ưu tiên của dự án",
      },
      {
        ariaLabel: "Hạn xử lý của dự án",
        emptyLabel: "Không có hạn xử lý trong phạm vi dự án hiện tại.",
        items: data.deadlineItems,
        title: "Hạn xử lý của dự án",
      },
      {
        ariaLabel: "Cuộc họp dự án",
        emptyLabel: "Không có cuộc họp trong phạm vi dự án hiện tại.",
        items: data.meetingItems,
        title: "Cuộc họp dự án",
      },
      {
        ariaLabel: "Quyết định liên quan dự án",
        emptyLabel:
          "Không có quyết định liên quan trong phạm vi dự án hiện tại.",
        items: data.decisionItems,
        title: "Quyết định liên quan dự án",
      },
    ];
  }

  if (data.variant === "department_head") {
    return [
      {
        ariaLabel: "Việc ưu tiên của bộ phận",
        emptyLabel: "Không có việc ưu tiên trong phạm vi chuyên môn hiện tại.",
        items: data.priorityItems,
        title: "Việc ưu tiên của bộ phận",
      },
      {
        ariaLabel: "Hồ sơ chuyên môn",
        emptyLabel: "Không có hồ sơ chuyên môn cần xử lý.",
        items: departmentDossierItems,
        title: "Hồ sơ chuyên môn",
      },
      {
        ariaLabel: "Workflow và checklist chuyên môn",
        emptyLabel:
          "Không có workflow/checklist chuyên môn trong phạm vi hiện tại.",
        items: workflowChecklistItems,
        title: "Workflow và checklist chuyên môn",
      },
      {
        ariaLabel: "Phê duyệt chuyên môn",
        emptyLabel: "Không có phê duyệt chuyên môn trong phạm vi hiện tại.",
        items: professionalApprovalItems,
        title: "Phê duyệt chuyên môn",
      },
      {
        ariaLabel: "Rủi ro chuyên môn",
        emptyLabel: "Không có rủi ro chuyên môn trong phạm vi hiện tại.",
        items: data.riskItems,
        title: "Rủi ro chuyên môn",
      },
      {
        ariaLabel: "Hạn xử lý chuyên môn",
        emptyLabel: "Không có hạn xử lý chuyên môn trong phạm vi hiện tại.",
        items: data.deadlineItems,
        title: "Hạn xử lý chuyên môn",
      },
      {
        ariaLabel: "Cuộc họp phòng ban",
        emptyLabel: "Không có cuộc họp phòng ban trong phạm vi hiện tại.",
        items: data.meetingItems,
        title: "Cuộc họp phòng ban",
      },
    ];
  }

  if (data.variant === "chairman") {
    return [
      {
        ariaLabel: "Ưu tiên danh mục dự án",
        emptyLabel: "Không có việc ưu tiên trong danh mục dự án hiện tại.",
        items: data.priorityItems,
        title: "Ưu tiên danh mục dự án",
      },
      {
        ariaLabel: "Danh mục dự án",
        emptyLabel: "Không có dự án trong danh mục hiện tại.",
        items: data.assignedProjects,
        title: "Danh mục dự án",
      },
      {
        ariaLabel: "Rủi ro nghiêm trọng",
        emptyLabel: "Không có rủi ro nghiêm trọng/cao trong phạm vi hiện tại.",
        items: data.riskItems,
        title: "Rủi ro nghiêm trọng",
      },
      {
        ariaLabel: "Phê duyệt quá hạn",
        emptyLabel: "Không có phê duyệt quá hạn hoặc cần xử lý.",
        items: data.approvalItems,
        title: "Phê duyệt quá hạn",
      },
      {
        ariaLabel: "Quyết định chiến lược",
        emptyLabel: "Không có quyết định chiến lược gần đây.",
        items: data.decisionItems,
        title: "Quyết định chiến lược",
      },
    ];
  }

  if (data.variant === "ceo") {
    return [
      {
        ariaLabel: "Hàng chờ phê duyệt",
        emptyLabel: "Không có phê duyệt cần xử lý.",
        items: data.approvalItems,
        title: "Hàng chờ phê duyệt",
      },
      {
        ariaLabel: "Rủi ro cần leo thang",
        emptyLabel: "Không có rủi ro/vướng mắc trong phạm vi hiện tại.",
        items: data.riskItems,
        title: "Rủi ro cần leo thang",
      },
      {
        ariaLabel: "Hạn xử lý liên dự án",
        emptyLabel: "Không có hạn xử lý trong phạm vi hiện tại.",
        items: data.deadlineItems,
        title: "Hạn xử lý liên dự án",
      },
      {
        ariaLabel: "Theo dõi sau họp",
        emptyLabel: "Không có cuộc họp trong phạm vi hiện tại.",
        items: data.meetingItems,
        title: "Theo dõi sau họp",
      },
      {
        ariaLabel: "Danh mục được giao",
        emptyLabel: "Không có dự án được giao trong phạm vi hiện tại.",
        items: data.assignedProjects,
        title: "Danh mục được giao",
      },
      {
        ariaLabel: "Khu vực ưu tiên",
        emptyLabel: "Không có việc ưu tiên trong phạm vi hiện tại.",
        items: data.priorityItems,
        title: "Khu vực ưu tiên",
      },
    ];
  }

  return [
    {
      ariaLabel: "Khu vực ưu tiên",
      emptyLabel: "Không có việc ưu tiên trong phạm vi hiện tại.",
      items: data.priorityItems,
      title: "Khu vực ưu tiên",
    },
    {
      ariaLabel: "Hàng chờ phê duyệt",
      emptyLabel: "Không có phê duyệt cần xử lý.",
      items: data.approvalItems,
      title: "Hàng chờ phê duyệt",
    },
    {
      ariaLabel: "Hạn xử lý liên dự án",
      emptyLabel: "Không có hạn xử lý trong phạm vi hiện tại.",
      items: data.deadlineItems,
      title: "Hạn xử lý liên dự án",
    },
    {
      ariaLabel: "Rủi ro cần leo thang",
      emptyLabel: "Không có rủi ro/vướng mắc trong phạm vi hiện tại.",
      items: data.riskItems,
      title: "Rủi ro cần leo thang",
    },
    {
      ariaLabel: "Theo dõi sau họp",
      emptyLabel: "Không có cuộc họp trong phạm vi hiện tại.",
      items: data.meetingItems,
      title: "Theo dõi sau họp",
    },
    {
      ariaLabel: "Danh mục được giao",
      emptyLabel: "Không có dự án được giao trong phạm vi hiện tại.",
      items: data.assignedProjects,
      title: "Danh mục được giao",
    },
  ];
}

function AssistantSupportPanel({
  data,
}: {
  data: ExecutivePrivateWorkspaceData;
}) {
  const isViewer = data.variant === "viewer";
  const isAssistant = data.variant === "secretary_assistant";
  const ariaLabel = isViewer
    ? "Tóm tắt chỉ xem"
    : isAssistant
      ? "Hỗ trợ ủy quyền cho thư ký/trợ lý"
      : "Hỗ trợ trợ lý";
  const title = isViewer
    ? "Tóm tắt chỉ xem"
    : isAssistant
      ? "Hỗ trợ ủy quyền"
      : "Hỗ trợ trợ lý";

  return (
    <section
      aria-label={ariaLabel}
      className="rounded-md border bg-white p-4 shadow-sm"
    >
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
                  {delegation.canActOnBehalf
                    ? "Ủy quyền đang hiệu lực"
                    : "Ủy quyền chưa khả dụng"}
                </p>
                <p className="mt-1 break-words text-xs">
                  {delegation.principalUserId} -{" "}
                  {delegation.actionKeys.length
                    ? delegation.actionKeys.join(", ")
                    : "không có thao tác được ủy quyền"}
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
              ? "Chỉ xem: không có thao tác chỉnh sửa trong không gian này."
              : isAssistant
                ? "Không có thao tác ủy quyền đang hiệu lực trong phạm vi hiện tại."
                : "Không có thao tác ủy quyền đang hiệu lực trong phạm vi hiện tại."}
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
            Không có quyền xem Không Gian Làm Việc Cá Nhân
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Dữ liệu Không Gian Làm Việc Cá Nhân không được tải cho phạm vi hiện
            tại.
          </p>
        </div>
      </div>
    </section>
  );
}

function WorkspaceSectionsGrid({
  afterSection,
  canDrillDown,
  data,
  onSelect,
  sections,
}: {
  afterSection?: (section: WorkspaceSectionConfig) => React.ReactNode;
  canDrillDown: boolean;
  data: ExecutivePrivateWorkspaceData;
  onSelect: (item: PrivateWorkspaceSectionItem) => void;
  sections: WorkspaceSectionConfig[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {sections.map((section) => (
        <React.Fragment key={section.ariaLabel}>
          <WorkspaceSection
            ariaLabel={section.ariaLabel}
            canDrillDown={canDrillDown}
            emptyLabel={section.emptyLabel}
            items={section.items}
            onSelect={onSelect}
            title={section.title}
          />
          {afterSection?.(section)}
        </React.Fragment>
      ))}
      <AssistantSupportPanel data={data} />
    </div>
  );
}

function OrderedWorkspaceBody({
  canDrillDown,
  data,
  onSelect,
  sections,
}: {
  canDrillDown: boolean;
  data: ExecutivePrivateWorkspaceData;
  onSelect: (item: PrivateWorkspaceSectionItem) => void;
  sections: WorkspaceSectionConfig[];
}) {
  if (data.variant === "chairman") {
    return (
      <>
        {data.financialSummary || data.riskMap ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {data.financialSummary ? (
              <FinancialSummaryPanel summary={data.financialSummary} />
            ) : null}
            {data.riskMap ? <RiskMapPanel riskMap={data.riskMap} /> : null}
          </div>
        ) : null}
        <WorkspaceSectionsGrid
          afterSection={(section) =>
            section.ariaLabel === "Phê duyệt quá hạn" &&
            data.permissionOverview ? (
              <PermissionOverviewPanel
                permissionOverview={data.permissionOverview}
              />
            ) : null
          }
          canDrillDown={canDrillDown}
          data={data}
          onSelect={onSelect}
          sections={sections}
        />
        <WorkspaceAiSummaryPanel summary={data.aiSummary} />
      </>
    );
  }

  if (data.variant === "ceo") {
    return (
      <>
        {data.resourceProgress ? (
          <ResourceProgressPanel resourceProgress={data.resourceProgress} />
        ) : null}
        <WorkspaceSectionsGrid
          canDrillDown={canDrillDown}
          data={data}
          onSelect={onSelect}
          sections={sections}
        />
        <WorkspaceAiSummaryPanel summary={data.aiSummary} />
      </>
    );
  }

  if (data.variant === "project_director") {
    return (
      <>
        <WorkspaceSectionsGrid
          afterSection={(section) =>
            section.ariaLabel === "Phê duyệt dự án" && data.projectCost ? (
              <ProjectCostPanel projectCost={data.projectCost} />
            ) : null
          }
          canDrillDown={canDrillDown}
          data={data}
          onSelect={onSelect}
          sections={sections}
        />
        <WorkspaceAiSummaryPanel summary={data.aiSummary} />
      </>
    );
  }

  return (
    <>
      <WorkspaceSectionsGrid
        canDrillDown={canDrillDown}
        data={data}
        onSelect={onSelect}
        sections={sections}
      />
      <WorkspaceAiSummaryPanel summary={data.aiSummary} />
    </>
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
              Không Gian Làm Việc Cá Nhân
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {data.scope.scopeLabel || legacyScopeLabel || "Phạm vi hiện tại"}
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
          aria-label="Trạng thái Không Gian Làm Việc Cá Nhân"
          className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-900"
        >
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5" aria-hidden="true" />
            <div>
              <h2 className="font-semibold">{data.emptyState.title}</h2>
              <p className="mt-1 text-sm leading-6">
                {data.emptyState.description}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section
        aria-label="KPI theo role"
        className="grid gap-3 md:grid-cols-3 xl:grid-cols-5"
      >
        {data.kpis.map((kpi) => (
          <div
            className="rounded-md border bg-white p-4 shadow-sm"
            key={kpi.id}
          >
            <p className="text-sm text-slate-600">{kpi.label}</p>
            <p className="mt-2 break-words text-2xl font-semibold text-slate-950">
              {kpi.value}
            </p>
          </div>
        ))}
      </section>

      {!data.permissions.canViewFinance ? (
        <section
          aria-label="Tài chính"
          className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm"
        >
          Không có quyền xem tài chính trong phạm vi này.
        </section>
      ) : null}

      <OrderedWorkspaceBody
        canDrillDown={canDrillDown}
        data={data}
        onSelect={setSelectedItem}
        sections={sections}
      />

      <ExecutiveDrilldownPanel
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </section>
  );
}
