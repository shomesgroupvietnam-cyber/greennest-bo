"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Bot,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  HelpCircle,
  Home,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Settings,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { getStaticRoleLabel } from "@/constants/roles";
import { logoutAction } from "@/lib/auth/actions";
import type { AppSessionUser } from "@/lib/auth/session";
import { AxisOneDashboard } from "@/modules/axis-1/components/axis-one-dashboard";
import type {
  CommandCenterAxis,
  CommandCenterData,
  CommandCenterMenuItem,
  CommandCenterTone,
  CommandCenterViewKey,
  ProjectProgressSegment,
} from "@/modules/command-center/types";
import { DashboardKpiGrid } from "@/modules/dashboard/components/dashboard-kpi-grid";
import { DashboardPriorityAlerts } from "@/modules/dashboard/components/dashboard-priority-alerts";
import { DashboardQuickLists } from "@/modules/dashboard/components/dashboard-quick-lists";
import {
  ExecutiveCommonCenter,
  ExecutiveCommonCenterNoAccessState,
} from "@/modules/dashboard/components/executive-common-center";
import {
  ExecutiveDashboardNoAccessState,
  ExecutiveDashboardOverview,
} from "@/modules/dashboard/components/executive-dashboard-overview";
import {
  ExecutiveMorningBriefing,
  ExecutiveMorningBriefingNoAccessState,
} from "@/modules/dashboard/components/executive-morning-briefing";
import { ApprovalCenter } from "@/modules/executive/components/approval-center";
import {
  ExecutivePrivateWorkspace,
  ExecutivePrivateWorkspaceNoAccessState,
} from "@/modules/workspaces/components/executive-private-workspace";

type CommandCenterApprovalStatus =
  CommandCenterData["executiveWorkspace"]["approvals"][number]["status"];
type CommandCenterDirectiveStatus =
  CommandCenterData["executiveWorkspace"]["directives"][number]["status"];
type CommandCenterLeadershipActionItem =
  CommandCenterData["executiveWorkspace"]["leadershipActionItems"][number];
type CommandCenterExecutiveApprovalLevel =
  CommandCenterLeadershipActionItem["approvalLevel"];
type CommandCenterExecutiveRiskLevel =
  CommandCenterLeadershipActionItem["riskLevel"];
type CommandCenterExecutiveApprovalCategory =
  CommandCenterLeadershipActionItem["approvalCategory"];
type CommandCenterExecutiveRiskCategory =
  CommandCenterLeadershipActionItem["riskCategory"];
type CommandCenterExecutiveViewMode =
  | "system_overview"
  | "by_project"
  | "by_axis"
  | "by_risk"
  | "pending_approval";
type CommandCenterSnapshotItem =
  CommandCenterData["executiveWorkspace"]["commandCenterSnapshot"]["notes"][number];
type CommandCenterQuickReport =
  CommandCenterData["executiveWorkspace"]["commandCenterSnapshot"]["quickReports"][number];
type CommandCenterDecisionLogItem =
  CommandCenterData["executiveWorkspace"]["decisionLog"][number];
type CommandCenterAuditLogItem =
  CommandCenterData["executiveWorkspace"]["auditLog"][number];

const toneClasses: Record<
  CommandCenterTone,
  { icon: string; bg: string; text: string; dot: string; bar: string }
> = {
  blue: {
    icon: "text-blue-600",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    bar: "bg-blue-500",
  },
  emerald: {
    icon: "text-emerald-600",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
  },
  amber: {
    icon: "text-amber-600",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
  },
  purple: {
    icon: "text-purple-600",
    bg: "bg-purple-50",
    text: "text-purple-700",
    dot: "bg-purple-500",
    bar: "bg-purple-500",
  },
  red: {
    icon: "text-red-600",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    bar: "bg-red-500",
  },
  slate: {
    icon: "text-slate-600",
    bg: "bg-slate-50",
    text: "text-slate-700",
    dot: "bg-slate-400",
    bar: "bg-slate-400",
  },
};

const executivePlanStatusLabels = {
  draft: "Nháp",
  reviewing: "Đang review",
  approved: "Đã duyệt",
};

const directiveStatusLabels = {
  open: "Chưa xử lý",
  in_progress: "Đang xử lý",
  blocked: "Bị vướng",
  done: "Đã xong",
};

const approvalStatusLabels = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Không duyệt",
  revision_required: "Yêu cầu sửa",
};

const meetingStatusLabels = {
  scheduled: "Đã lên lịch",
  completed: "Đã hoàn tất",
};

const decisionStatusLabels = {
  effective: "Có hiệu lực",
  follow_up: "Cần follow-up",
  superseded: "Đã thay thế",
};

const leadershipActionTypeLabels: Record<
  CommandCenterLeadershipActionItem["type"],
  string
> = {
  directive: "Chỉ đạo",
  approval: "Phê duyệt",
  legal: "Pháp lý",
  proposal: "Đề xuất",
  risk: "Rủi ro",
  payment: "Xin chi",
};

const fallbackExecutiveAxisOptions: Array<{
  key: CommandCenterLeadershipActionItem["axis"];
  label: string;
}> = [
  { key: "project_management", label: "Dự án | Project Management" },
  { key: "build_management", label: "Kiến tạo | Build Management" },
  { key: "operations_analytics", label: "Điều hành | Operations & Analytics" },
];

const leadershipActionCategoryLabels: Record<
  CommandCenterLeadershipActionItem["category"],
  string
> = {
  submission: "Trình duyệt",
  payment_request: "Xin chi",
  approval: "Phê duyệt",
  alert: "Cảnh báo",
  priority: "Ưu tiên",
  overdue: "Quá hạn",
};

const leadershipActionStatusLabels: Record<
  CommandCenterLeadershipActionItem["status"],
  string
> = {
  overdue: "Quá hạn",
  pending: "Chờ xử lý",
  in_progress: "Đang xử lý",
  blocked: "Đang vướng",
  high_risk: "Rủi ro cao",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  returned: "Trả lại",
};

const leadershipPriorityLabels: Record<
  CommandCenterLeadershipActionItem["priority"],
  string
> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Khẩn cấp",
};

const leadershipDueGroupLabels: Record<
  CommandCenterLeadershipActionItem["dueGroup"],
  string
> = {
  overdue: "Quá hạn",
  today: "Hôm nay",
  this_week: "Trong tuần",
  later: "Sau tuần này",
};

const executiveRiskLevelLabels: Record<
  CommandCenterExecutiveRiskLevel,
  string
> = {
  low: "Thap",
  medium: "Trung binh",
  high: "Cao",
  critical: "Khan cap",
};

const executiveApprovalLevelLabels: Record<
  CommandCenterExecutiveApprovalLevel,
  string
> = {
  DEPARTMENT_HEAD: "Truong bo phan",
  PROJECT_DIRECTOR: "Giam doc du an",
  CEO: "CEO/TGD",
  CHAIRMAN: "Chu tich",
};

const executiveApprovalCategoryLabels: Record<
  CommandCenterExecutiveApprovalCategory,
  string
> = {
  legal_approval: "Legal approval",
  planning_approval: "Planning approval",
  design_approval: "Design approval",
  feasibility_approval: "Feasibility approval",
  investment_approval: "Investment approval",
  contractor_approval: "Contractor approval",
  material_approval: "Material approval",
  progress_approval: "Progress approval",
  variation_order_approval: "Variation order",
  acceptance_approval: "Acceptance approval",
  payment_approval: "Payment approval",
  budget_approval: "Budget approval",
  executive_payment_approval: "Executive payment",
  kpi_approval: "KPI approval",
  strategy_approval: "Strategy approval",
  permission_approval: "Permission approval",
};

const executiveRiskCategoryLabels: Record<
  CommandCenterExecutiveRiskCategory,
  string
> = {
  legal_risk: "Legal risk",
  land_risk: "Land risk",
  planning_risk: "Planning risk",
  approval_risk: "Approval risk",
  schedule_risk: "Schedule risk",
  delay_risk: "Delay risk",
  quality_risk: "Quality risk",
  safety_risk: "Safety risk",
  contractor_risk: "Contractor risk",
  cost_overrun_risk: "Cost overrun",
  material_risk: "Material risk",
  cashflow_risk: "Cashflow risk",
  operational_risk: "Operational risk",
  permission_risk: "Permission risk",
  compliance_risk: "Compliance risk",
  system_risk: "System risk",
};

const executiveViewModeOptions: Array<{
  key: CommandCenterExecutiveViewMode;
  label: string;
}> = [
  { key: "system_overview", label: "Tong quan toan he thong" },
  { key: "by_project", label: "Theo du an" },
  { key: "by_axis", label: "Theo truc" },
  { key: "by_risk", label: "Theo loai rui ro" },
  { key: "pending_approval", label: "Theo viec cho duyet" },
];

const executiveMockDecisionActions: Array<{
  label: string;
  status: Extract<
    CommandCenterLeadershipActionItem["status"],
    "approved" | "rejected" | "returned"
  >;
  tone: CommandCenterTone;
}> = [
  { label: "Approve", status: "approved", tone: "emerald" },
  { label: "Reject", status: "rejected", tone: "red" },
  { label: "Return", status: "returned", tone: "amber" },
];

const executiveActionRoles = new Set([
  "super_admin",
  "admin",
  "tong_giam_doc",
  "pho_tong_giam_doc",
  "giam_doc_du_an",
  "dau_tu_phat_trien",
  "quan_ly_tai_chinh",
  "quan_ly_hop_dong",
  "phap_ly",
  "thiet_ke",
  "ky_thuat",
  "thi_cong",
  "qa_qc_chat_luong",
  "an_toan_lao_dong",
]);

const approvalActionReasons: Record<
  Exclude<CommandCenterApprovalStatus, "pending">,
  string
> = {
  approved: "Lãnh đạo duyệt trên Command Center mock.",
  rejected: "Lãnh đạo không duyệt và yêu cầu dừng xử lý đề xuất này.",
  revision_required:
    "Lãnh đạo yêu cầu chỉnh sửa, bổ sung hồ sơ trước khi trình lại.",
};

function canRunExecutiveActions(user: AppSessionUser) {
  return executiveActionRoles.has(user.role);
}

function getExecutiveGlobalStatusItems(
  data: CommandCenterData["executiveWorkspace"],
) {
  const pendingApprovals = data.approvals.filter(
    (approval) => approval.status === "pending",
  ).length;

  return data.globalStatusItems.map((item) =>
    item.kind === "pending_approvals"
      ? { ...item, value: pendingApprovals }
      : item,
  );
}

function formatLeadershipDeadline(deadline: string) {
  const parsed = new Date(`${deadline}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return deadline;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function buildCommandCenterQuickSwitchGroups(data: CommandCenterData) {
  return [
    {
      label: "Command Center",
      options: [
        { label: "Tổng quan", viewKey: "overview" },
        { label: "Thông báo", viewKey: "notifications" },
        { label: "Cài đặt", viewKey: "settings" },
      ],
    },
    ...data.axes.map((axis) => ({
      label: axis.title,
      options: axis.items.flatMap((item) =>
        item.children?.length
          ? item.children.map((child) => ({
              label: `${item.code}. ${item.label} / ${child.label}`,
              viewKey: child.viewKey,
            }))
          : [
              {
                label: `${item.code}. ${item.label}`,
                viewKey: item.viewKey,
              },
            ],
      ),
    })),
  ];
}

function resolveCommandCenterBreadcrumbs(
  data: CommandCenterData,
  activeView: CommandCenterViewKey,
  activeViewLabel: string,
) {
  if (activeView === "overview") {
    return ["GreenNest Group", "Command Center", "Tổng quan"];
  }

  if (activeView === "notifications" || activeView === "settings") {
    return ["GreenNest Group", "Command Center", activeViewLabel];
  }

  for (const axis of data.axes) {
    for (const item of axis.items) {
      if (item.viewKey === activeView) {
        return ["GreenNest Group", axis.title, item.label];
      }

      const child = item.children?.find(
        (childItem) => childItem.viewKey === activeView,
      );

      if (child) {
        return ["GreenNest Group", axis.title, item.label, child.label];
      }
    }
  }

  return ["GreenNest Group", "Command Center", activeViewLabel];
}

function AxisMenuItem({
  activeView,
  axis,
  item,
  onSelect,
}: {
  activeView: CommandCenterViewKey;
  axis: CommandCenterAxis;
  item: CommandCenterMenuItem;
  onSelect: (viewKey: CommandCenterViewKey) => void;
}) {
  const hasActiveChild = Boolean(
    item.children?.some((child) => child.viewKey === activeView),
  );
  const [isChildGroupOpen, setIsChildGroupOpen] = useState(hasActiveChild);
  const codeBadge = (
    <span
      className={`flex h-6 w-6 items-center justify-center rounded-md ${toneClasses[axis.tone].bg} text-xs font-semibold ${toneClasses[axis.tone].text}`}
    >
      {item.code}
    </span>
  );

  useEffect(() => {
    if (hasActiveChild) {
      setIsChildGroupOpen(true);
    }
  }, [hasActiveChild]);

  if (item.children?.length) {
    return (
      <details
        className="group rounded-md"
        onToggle={(event) => setIsChildGroupOpen(event.currentTarget.open)}
        open={isChildGroupOpen}
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-slate-100 hover:bg-white/10 [&::-webkit-details-marker]:hidden">
          {codeBadge}
          <span className="min-w-0 flex-1">{item.label}</span>
          <ChevronDown
            className="h-4 w-4 text-slate-400 transition group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="ml-8 mt-1 space-y-1 border-l border-white/10 pl-3">
          {item.children.map((child) => (
            <button
              className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-white/10 hover:text-white ${
                activeView === child.viewKey
                  ? "bg-white/10 text-white"
                  : "text-slate-200"
              }`}
              key={`${item.code}-${child.href}`}
              onClick={() => onSelect(child.viewKey)}
              type="button"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              <span className="min-w-0 flex-1">{child.label}</span>
              <ChevronRight
                className="h-3.5 w-3.5 text-slate-500"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </details>
    );
  }

  return (
    <button
      className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium hover:bg-white/10 ${
        activeView === item.viewKey
          ? "bg-white/10 text-white"
          : "text-slate-100"
      }`}
      onClick={() => onSelect(item.viewKey)}
      type="button"
    >
      {codeBadge}
      <span className="min-w-0 flex-1">{item.label}</span>
      <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
    </button>
  );
}

function AxisSection({
  activeView,
  axis,
  defaultOpen = false,
  onSelect,
}: {
  activeView: CommandCenterViewKey;
  axis: CommandCenterAxis;
  defaultOpen?: boolean;
  onSelect: (viewKey: CommandCenterViewKey) => void;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="space-y-2 rounded-lg">
      <button
        className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-xs font-semibold uppercase text-slate-300 hover:bg-white/10"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>{axis.title}</span>
        <ChevronDown
          className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {isOpen ? (
        <div className="space-y-1">
          {axis.items.map((item) => (
            <AxisMenuItem
              activeView={activeView}
              axis={axis}
              item={item}
              key={`${axis.title}-${item.code}`}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function DonutChart({ segments }: { segments: ProjectProgressSegment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const gradient = segments
    .reduce<{ cursor: number; parts: string[] }>(
      (acc, segment) => {
        const next = acc.cursor + segment.percent;
        acc.parts.push(`${segment.color} ${acc.cursor}% ${next}%`);
        acc.cursor = next;

        return acc;
      },
      { cursor: 0, parts: [] },
    )
    .parts.join(", ");

  return (
    <div
      className="relative h-48 w-48 rounded-full"
      style={{
        background: gradient
          ? `conic-gradient(${gradient})`
          : "conic-gradient(#cbd5e1 0% 100%)",
      }}
    >
      <div className="absolute inset-12 flex flex-col items-center justify-center rounded-full bg-white">
        <span className="text-3xl font-semibold text-slate-950">{total}</span>
        <span className="text-sm text-slate-500">Tổng dự án</span>
      </div>
    </div>
  );
}

function resolveCommandCenterViewLabel(
  data: CommandCenterData,
  activeView: CommandCenterViewKey,
) {
  if (activeView === "overview") {
    return "Tổng quan";
  }

  if (activeView === "notifications") {
    return "Thông báo";
  }

  if (activeView === "settings") {
    return "Cài đặt";
  }

  for (const axis of data.axes) {
    for (const item of axis.items) {
      if (item.viewKey === activeView) {
        return item.label;
      }

      const child = item.children?.find(
        (childItem) => childItem.viewKey === activeView,
      );

      if (child) {
        return child.label;
      }
    }
  }

  return "Tổng quan";
}

function collectCommandCenterViewKeys(data: CommandCenterData) {
  return new Set([
    "overview",
    "notifications",
    "settings",
    ...data.axes.flatMap((axis) =>
      axis.items.flatMap((item) => [
        item.viewKey,
        ...(item.children?.map((child) => child.viewKey) ?? []),
      ]),
    ),
  ]);
}

const knownExecutiveViewKeys = new Set([
  "executive-dashboard",
  "executive-morning-briefing",
  "executive-common-center",
  "executive-private-workspace",
  "executive-investment-plans",
  "executive-leadership-team",
  "executive-directives",
  "executive-meetings",
  "executive-approvals",
  "executive-decision-log",
]);

function resolveInitialCommandCenterView(
  data: CommandCenterData,
  initialView?: string,
) {
  if (!initialView) {
    return "overview";
  }

  return collectCommandCenterViewKeys(data).has(initialView)
    ? initialView
    : knownExecutiveViewKeys.has(initialView)
      ? initialView
      : "overview";
}

function CommandCenterContextBar({
  activeView,
  activeViewLabel,
  data,
  onSelect,
}: {
  activeView: CommandCenterViewKey;
  activeViewLabel: string;
  data: CommandCenterData;
  onSelect: (viewKey: CommandCenterViewKey) => void;
}) {
  const breadcrumbs = resolveCommandCenterBreadcrumbs(
    data,
    activeView,
    activeViewLabel,
  );
  const quickSwitchGroups = buildCommandCenterQuickSwitchGroups(data);

  return (
    <section className="rounded-lg border bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav
          className="flex flex-wrap items-center gap-2 text-sm"
          aria-label="Ngữ cảnh hiện tại"
        >
          {breadcrumbs.map((breadcrumb, index) => (
            <span className="inline-flex items-center gap-2" key={breadcrumb}>
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? "font-semibold text-slate-950"
                    : "text-slate-500"
                }
              >
                {breadcrumb}
              </span>
              {index < breadcrumbs.length - 1 ? (
                <ChevronRight
                  className="h-3.5 w-3.5 text-slate-300"
                  aria-hidden="true"
                />
              ) : null}
            </span>
          ))}
        </nav>

        <label className="flex flex-col gap-1 text-xs font-semibold uppercase text-slate-400 sm:flex-row sm:items-center sm:gap-2">
          Quick switch
          <select
            className="min-w-[240px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium normal-case text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            onChange={(event) => onSelect(event.target.value)}
            value={activeView}
          >
            {quickSwitchGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option.viewKey} value={option.viewKey}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

function CommandCenterGlobalStatusStrip({
  data,
}: {
  data: CommandCenterData["executiveWorkspace"];
}) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {getExecutiveGlobalStatusItems(data).map((item) => (
        <div
          className="rounded-lg border bg-white px-4 py-3 shadow-sm"
          key={item.id}
        >
          <p className="text-xs font-semibold uppercase text-slate-400">
            {item.label}
          </p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="text-xl font-semibold text-slate-950">{item.value}</p>
            <span
              className={`text-xs font-medium ${toneClasses[item.tone].text}`}
            >
              {item.helper}
            </span>
          </div>
        </div>
      ))}
    </section>
  );
}

function ExecutiveSnapshotCard({
  emptyLabel,
  items,
  title,
}: {
  emptyLabel: string;
  items: CommandCenterSnapshotItem[];
  title: string;
}) {
  return (
    <section className="rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <div className="mt-3 space-y-3">
        {items.length ? (
          items.slice(0, 3).map((item) => (
            <Link
              className="block rounded-md border border-slate-100 bg-slate-50 p-3 hover:border-emerald-200 hover:bg-emerald-50/40"
              href={item.href}
              key={item.id}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`mt-1.5 h-2 w-2 flex-none rounded-full ${toneClasses[item.tone].dot}`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-950">
                    {item.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                    {item.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium text-slate-500">
                    {item.timeLabel ? <span>{item.timeLabel}</span> : null}
                    {item.projectName ? <span>{item.projectName}</span> : null}
                    {item.ownerName ? <span>{item.ownerName}</span> : null}
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-sm text-slate-500">{emptyLabel}</p>
        )}
      </div>
    </section>
  );
}

function ExecutiveQuickReportsCard({
  reports,
}: {
  reports: CommandCenterQuickReport[];
}) {
  return (
    <section className="rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-950">Báo cáo nhanh</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
        {reports.length ? (
          reports.map((report) => (
            <Link
              className="rounded-md border border-slate-100 bg-slate-50 p-3 hover:border-emerald-200 hover:bg-emerald-50/40"
              href={report.href}
              key={report.id}
            >
              <p className="text-xs font-semibold uppercase text-slate-400">
                {report.title}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {report.value}
              </p>
              <p className={`mt-1 text-xs ${toneClasses[report.tone].text}`}>
                {report.helper}
              </p>
            </Link>
          ))
        ) : (
          <p className="text-sm text-slate-500">Chưa có báo cáo nhanh.</p>
        )}
      </div>
    </section>
  );
}

function LegacyExecutiveCommandCenterView({
  canAct,
  data,
}: {
  canAct: boolean;
  data: CommandCenterData["executiveWorkspace"];
}) {
  const [activeAxis, setActiveAxis] =
    useState<CommandCenterLeadershipActionItem["axis"]>("project_management");
  const [decisionItems, setDecisionItems] = useState(
    data.leadershipActionItems,
  );
  const [selectedActionId, setSelectedActionId] = useState<string | null>(
    data.leadershipActionItems[0]?.id ?? null,
  );
  const [mockActionLog, setMockActionLog] = useState<string[]>([]);
  const [organizationFilter, setOrganizationFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [viewMode, setViewMode] =
    useState<CommandCenterExecutiveViewMode>("system_overview");
  const [statusFilter, setStatusFilter] = useState<
    "all" | CommandCenterLeadershipActionItem["status"]
  >("all");
  const [riskFilter, setRiskFilter] = useState<
    "all" | CommandCenterLeadershipActionItem["riskLevel"]
  >("all");
  const [approvalLevelFilter, setApprovalLevelFilter] = useState<
    "all" | CommandCenterLeadershipActionItem["approvalLevel"]
  >("all");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | CommandCenterLeadershipActionItem["priority"]
  >("all");
  const [dueFilter, setDueFilter] = useState<
    "all" | CommandCenterLeadershipActionItem["dueGroup"]
  >("all");

  const snapshot = data.commandCenterSnapshot;
  const executiveAxisOptions = useMemo(() => {
    return data.axisDefinitions.length
      ? data.axisDefinitions.map((axis) => ({
          key: axis.id,
          label: `${axis.label} | ${axis.englishLabel}`,
        }))
      : fallbackExecutiveAxisOptions;
  }, [data.axisDefinitions]);
  const selectedAction =
    decisionItems.find((item) => item.id === selectedActionId) ?? null;
  const activeRoleDefinition =
    data.roleDefinitions.find(
      (roleDefinition) =>
        roleDefinition.role === data.accessibleScope?.operatingRole,
    ) ?? null;
  const selectedAxisDefinition =
    data.axisDefinitions.find((axis) => axis.id === activeAxis) ?? null;
  const canApproveSelectedAction = Boolean(
    selectedAction &&
      canAct &&
      data.access?.approvalLevels.includes(selectedAction.approvalLevel),
  );
  const todayApprovalItems: CommandCenterSnapshotItem[] = decisionItems
    .filter((item) => item.requiresTodayDecision)
    .map((item) => ({
      id: `today-${item.id}`,
      title: item.title,
      description: item.decisionRequired,
      timeLabel: leadershipDueGroupLabels[item.dueGroup],
      projectName: item.projectName,
      ownerName: item.ownerName,
      href: item.href,
      tone: item.tone,
    }));
  const snapshotGroups = [
    {
      emptyLabel: "Chưa có ghi chú điều hành.",
      items: snapshot.notes,
      title: "Ghi chú lãnh đạo",
    },
    {
      emptyLabel: "Chưa có lịch họp.",
      items: snapshot.meetings,
      title: "Lịch họp",
    },
    {
      emptyLabel: "Chưa có lịch làm việc.",
      items: snapshot.workCalendar,
      title: "Lịch làm việc",
    },
    {
      emptyLabel: "Chưa có việc cần duyệt hôm nay.",
      items: todayApprovalItems,
      title: "Việc cần duyệt hôm nay",
    },
    {
      emptyLabel: "Chưa có cảnh báo.",
      items: snapshot.alerts,
      title: "Cảnh báo rủi ro",
    },
  ];

  const organizationOptions = useMemo(() => {
    return data.organizations.length
      ? data.organizations
      : Array.from(
          new Map(
            decisionItems.map((item) => [
              item.organizationId,
              {
                id: item.organizationId,
                name: item.organizationName,
              },
            ]),
          ).values(),
        );
  }, [data.organizations, decisionItems]);

  const projectOptions = useMemo(() => {
    return Array.from(
      new Map(
        decisionItems
          .filter(
            (item) =>
              organizationFilter === "all" ||
              item.organizationId === organizationFilter,
          )
          .map((item) => [
            item.projectId,
            {
              id: item.projectId,
              name: item.projectName,
            },
          ]),
      ).values(),
    ).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [decisionItems, organizationFilter]);

  const filteredItems = useMemo(() => {
    return decisionItems.filter((item) => {
      return (
        item.axis === activeAxis &&
        (organizationFilter === "all" ||
          item.organizationId === organizationFilter) &&
        (projectFilter === "all" || item.projectId === projectFilter) &&
        (statusFilter === "all" || item.status === statusFilter) &&
        (riskFilter === "all" || item.riskLevel === riskFilter) &&
        (approvalLevelFilter === "all" ||
          item.approvalLevel === approvalLevelFilter) &&
        (priorityFilter === "all" || item.priority === priorityFilter) &&
        (dueFilter === "all" || item.dueGroup === dueFilter) &&
        (viewMode !== "pending_approval" ||
          item.status === "pending" ||
          item.status === "overdue") &&
        (viewMode !== "by_risk" ||
          item.riskLevel === "high" ||
          item.riskLevel === "critical")
      );
    });
  }, [
    activeAxis,
    approvalLevelFilter,
    decisionItems,
    dueFilter,
    organizationFilter,
    priorityFilter,
    projectFilter,
    riskFilter,
    statusFilter,
    viewMode,
  ]);

  const categorySummary = useMemo(() => {
    return Object.entries(leadershipActionCategoryLabels).map(
      ([category, label]) => ({
        category,
        label,
        value: decisionItems.filter((item) => item.category === category)
          .length,
      }),
    );
  }, [decisionItems]);

  const scheduleImpactCount = decisionItems.filter(
    (item) => item.isScheduleImpact,
  ).length;
  const todayDecisionCount = decisionItems.filter(
    (item) => item.requiresTodayDecision,
  ).length;

  function applyMockDecision(
    action: Extract<
      CommandCenterLeadershipActionItem["status"],
      "approved" | "rejected" | "returned"
    >,
  ) {
    if (!selectedAction || !canApproveSelectedAction) {
      return;
    }

    const actionTone = executiveMockDecisionActions.find(
      (item) => item.status === action,
    )?.tone;

    setDecisionItems((current) =>
      current.map((item) =>
        item.id === selectedAction.id
          ? { ...item, status: action, tone: actionTone ?? item.tone }
          : item,
      ),
    );
    setMockActionLog((current) => [
      `${selectedAction.title}: ${leadershipActionStatusLabels[action]}`,
      ...current,
    ]);
  }

  function handleAxisChange(axis: CommandCenterLeadershipActionItem["axis"]) {
    setActiveAxis(axis);
    const nextItem = decisionItems.find((item) => item.axis === axis);
    setSelectedActionId(nextItem?.id ?? null);
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase text-emerald-700">
          Ban lãnh đạo
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          Executive Command Center
        </h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
          Trung tâm tổng hợp cho 3 trục, chỉ giữ lại các việc cần lãnh đạo xem,
          duyệt, phản hồi hoặc ra quyết định.
        </p>
      </div>

      {activeRoleDefinition ? (
        <section className="grid gap-4 lg:grid-cols-[1fr_1fr_280px]">
          <article className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Tang dieu hanh hien tai
            </p>
            <h2 className="mt-1 font-semibold text-slate-950">
              {activeRoleDefinition.label}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {activeRoleDefinition.scope}
            </p>
          </article>
          <article className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Chi xem/quyet dinh
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {activeRoleDefinition.manages.slice(0, 6).map((item) => (
                <span
                  className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>
          </article>
          <article className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Khong xu ly mac dinh
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {activeRoleDefinition.doesNotHandle.slice(0, 4).map((item) => (
                <span
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="font-semibold text-slate-950">
            Mo hinh dashboard dieu hanh 3 lop
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Global Executive, Project Executive va Department Workspace Summary
            duoc tra ve theo quyen tu service layer.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {data.dashboardLayers.map((layer) => (
            <article
              className="rounded-lg border bg-white p-4 shadow-sm"
              key={layer.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    {layer.targetRole}
                  </p>
                  <h3 className="mt-1 font-semibold text-slate-950">
                    {layer.title}
                  </h3>
                </div>
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {layer.layer}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {layer.description}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {layer.kpis.map((kpi) => (
                  <div className="rounded-md bg-slate-50 p-3" key={kpi.id}>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      {kpi.label}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">
                      {kpi.value}
                    </p>
                    <p className={`mt-1 text-xs ${toneClasses[kpi.tone].text}`}>
                      {kpi.helper}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-semibold text-slate-950">Dashboard tổng quan</h2>
          <p className="mt-1 text-sm text-slate-500">
            Các chỉ số chỉ phục vụ quyết định của Ban lãnh đạo.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {data.overviewCards.map((item) => (
            <div
              className="rounded-lg border bg-white p-4 shadow-sm"
              key={item.id}
            >
              <p className="text-xs font-semibold uppercase text-slate-400">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {item.value}
              </p>
              <p className={`mt-2 text-xs ${toneClasses[item.tone].text}`}>
                {item.helper}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[repeat(5,minmax(0,1fr))_minmax(240px,0.9fr)]">
        {snapshotGroups.map((group) => (
          <ExecutiveSnapshotCard
            emptyLabel={group.emptyLabel}
            items={group.items}
            key={group.title}
            title={group.title}
          />
        ))}
        <ExecutiveQuickReportsCard reports={snapshot.quickReports} />
      </div>

      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-950">
              Việc lãnh đạo cần quyết định theo trục
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Danh sách trình duyệt, xin chi, phê duyệt, cảnh báo, ưu tiên và
              quá hạn đã được lọc khỏi dữ liệu vận hành chi tiết.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categorySummary.map((item) => (
              <span
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                key={item.category}
              >
                {item.label}: {item.value}
              </span>
            ))}
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              Ảnh hưởng tiến độ: {scheduleImpactCount}
            </span>
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
              Quyết định trong ngày: {todayDecisionCount}
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {executiveAxisOptions.map((axis) => (
            <button
              className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                activeAxis === axis.key
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-600 hover:border-emerald-200"
              }`}
              key={axis.key}
              onClick={() => handleAxisChange(axis.key)}
              type="button"
            >
              {axis.label}
            </button>
          ))}
        </div>

        {selectedAxisDefinition ? (
          <div className="mt-4 grid gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 lg:grid-cols-[1.2fr_1fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Source of truth
              </p>
              <h3 className="mt-1 font-semibold text-slate-950">
                Trục {selectedAxisDefinition.label} |{" "}
                {selectedAxisDefinition.englishLabel}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {selectedAxisDefinition.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selectedAxisDefinition.modules.map((module) => (
                  <span
                    className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600"
                    key={module.id}
                  >
                    {module.label}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Approval categories
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedAxisDefinition.approvalCategories.map((category) => (
                  <span
                    className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                    key={category}
                  >
                    {executiveApprovalCategoryLabels[category]}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Risk categories
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedAxisDefinition.riskCategories.map((category) => (
                  <span
                    className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"
                    key={category}
                  >
                    {executiveRiskCategoryLabels[category]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase text-slate-400">
            Che do xem
            <select
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium normal-case text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              onChange={(event) =>
                setViewMode(
                  event.target.value as CommandCenterExecutiveViewMode,
                )
              }
              value={viewMode}
            >
              {executiveViewModeOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase text-slate-400">
            Organization
            <select
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium normal-case text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              onChange={(event) => {
                setOrganizationFilter(event.target.value);
                setProjectFilter("all");
              }}
              value={organizationFilter}
            >
              <option value="all">Tat ca organization</option>
              {organizationOptions.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase text-slate-400">
            Truc
            <select
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium normal-case text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              onChange={(event) =>
                handleAxisChange(
                  event.target
                    .value as CommandCenterLeadershipActionItem["axis"],
                )
              }
              value={activeAxis}
            >
              {executiveAxisOptions.map((axis) => (
                <option key={axis.key} value={axis.key}>
                  {axis.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase text-slate-400">
            Dự án
            <select
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium normal-case text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              onChange={(event) => setProjectFilter(event.target.value)}
              value={projectFilter}
            >
              <option value="all">Tất cả dự án</option>
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase text-slate-400">
            Trạng thái
            <select
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium normal-case text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "all"
                    | CommandCenterLeadershipActionItem["status"],
                )
              }
              value={statusFilter}
            >
              <option value="all">Tất cả trạng thái</option>
              {Object.entries(leadershipActionStatusLabels).map(
                ([status, label]) => (
                  <option key={status} value={status}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase text-slate-400">
            Mức ưu tiên
            <select
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium normal-case text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              onChange={(event) =>
                setPriorityFilter(
                  event.target.value as
                    | "all"
                    | CommandCenterLeadershipActionItem["priority"],
                )
              }
              value={priorityFilter}
            >
              <option value="all">Tất cả mức ưu tiên</option>
              {Object.entries(leadershipPriorityLabels).map(
                ([priority, label]) => (
                  <option key={priority} value={priority}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase text-slate-400">
            Risk level
            <select
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium normal-case text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              onChange={(event) =>
                setRiskFilter(
                  event.target.value as
                    | "all"
                    | CommandCenterLeadershipActionItem["riskLevel"],
                )
              }
              value={riskFilter}
            >
              <option value="all">Tat ca risk level</option>
              {Object.entries(executiveRiskLevelLabels).map(
                ([riskLevel, label]) => (
                  <option key={riskLevel} value={riskLevel}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase text-slate-400">
            Approval level
            <select
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium normal-case text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              onChange={(event) =>
                setApprovalLevelFilter(
                  event.target.value as
                    | "all"
                    | CommandCenterLeadershipActionItem["approvalLevel"],
                )
              }
              value={approvalLevelFilter}
            >
              <option value="all">Tat ca approval level</option>
              {Object.entries(executiveApprovalLevelLabels).map(
                ([approvalLevel, label]) => (
                  <option key={approvalLevel} value={approvalLevel}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase text-slate-400">
            Hạn xử lý
            <select
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium normal-case text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              onChange={(event) =>
                setDueFilter(
                  event.target.value as
                    | "all"
                    | CommandCenterLeadershipActionItem["dueGroup"],
                )
              }
              value={dueFilter}
            >
              <option value="all">Tất cả hạn xử lý</option>
              {Object.entries(leadershipDueGroupLabels).map(
                ([dueGroup, label]) => (
                  <option key={dueGroup} value={dueGroup}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1320px] text-left text-sm">
            <thead>
              <tr className="border-b text-xs font-semibold uppercase text-slate-400">
                <th className="py-3 pr-4">Việc cần quyết định</th>
                <th className="px-4 py-3">Nhóm</th>
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Dự án</th>
                <th className="px-4 py-3">Người phụ trách</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Cấp duyệt</th>
                <th className="px-4 py-3">Ưu tiên</th>
                <th className="px-4 py-3">Hạn xử lý</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="py-3 pl-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="py-4 pr-4">
                    <p className="font-medium text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {item.decisionRequired}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.isScheduleImpact ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          Ảnh hưởng tiến độ
                        </span>
                      ) : null}
                      {item.requiresTodayDecision ? (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                          Cần quyết định trong ngày
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="font-medium text-slate-700">
                        {leadershipActionCategoryLabels[item.category]}
                      </p>
                      <p className="text-xs text-slate-500">
                        {leadershipActionTypeLabels[item.type]}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {item.organizationName}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {item.projectName}
                  </td>
                  <td className="px-4 py-4 text-slate-600">{item.ownerName}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[item.tone].bg} ${toneClasses[item.tone].text}`}
                    >
                      {executiveRiskLevelLabels[item.riskLevel]}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {executiveApprovalLevelLabels[item.approvalLevel]}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[item.tone].bg} ${toneClasses[item.tone].text}`}
                    >
                      {leadershipPriorityLabels[item.priority]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-slate-800">
                      {formatLeadershipDeadline(item.deadline)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {leadershipDueGroupLabels[item.dueGroup]}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[item.tone].bg} ${toneClasses[item.tone].text}`}
                    >
                      {leadershipActionStatusLabels[item.status]}
                    </span>
                  </td>
                  <td className="py-4 pl-4 text-right">
                    <button
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
                      onClick={() => setSelectedActionId(item.id)}
                      type="button"
                    >
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                      Xem
                      <ChevronRight
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredItems.length ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Không có việc lãnh đạo cần xử lý theo bộ lọc hiện tại.
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-950">
              Chi tiết một trình duyệt
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Hành động approve/reject/return hiện là mock trên giao diện, chưa
              ghi xuống API.
            </p>
          </div>
          {selectedAction ? (
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[selectedAction.tone].bg} ${toneClasses[selectedAction.tone].text}`}
            >
              {leadershipActionStatusLabels[selectedAction.status]}
            </span>
          ) : null}
        </div>

        {selectedAction ? (
          <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Nội dung trình duyệt
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">
                  {selectedAction.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {selectedAction.decisionRequired}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  [
                    "Trục",
                    executiveAxisOptions.find(
                      (axis) => axis.key === selectedAction.axis,
                    )?.label ?? selectedAction.axis,
                  ],
                  [
                    "Nhóm",
                    leadershipActionCategoryLabels[selectedAction.category],
                  ],
                  [
                    "Loại việc",
                    leadershipActionTypeLabels[selectedAction.type],
                  ],
                  ["Dự án", selectedAction.projectName],
                  ["Organization", selectedAction.organizationName],
                  ["Người phụ trách", selectedAction.ownerName],
                  [
                    "Risk level",
                    executiveRiskLevelLabels[selectedAction.riskLevel],
                  ],
                  [
                    "Risk category",
                    executiveRiskCategoryLabels[selectedAction.riskCategory],
                  ],
                  [
                    "Cấp duyệt",
                    executiveApprovalLevelLabels[selectedAction.approvalLevel],
                  ],
                  [
                    "Approval category",
                    executiveApprovalCategoryLabels[
                      selectedAction.approvalCategory
                    ],
                  ],
                  ["Giá trị", selectedAction.amountLabel ?? "Không áp dụng"],
                  ["Module", selectedAction.moduleId],
                  [
                    "Deadline",
                    formatLeadershipDeadline(selectedAction.deadline),
                  ],
                  [
                    "Mức ưu tiên",
                    leadershipPriorityLabels[selectedAction.priority],
                  ],
                  [
                    "Hạn xử lý",
                    leadershipDueGroupLabels[selectedAction.dueGroup],
                  ],
                ].map(([label, value]) => (
                  <div className="rounded-md bg-slate-50 p-3" key={label}>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-md bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase text-amber-700">
                  Ảnh hưởng tiến độ
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-900">
                  {selectedAction.impactSummary}
                </p>
              </div>
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-xs font-semibold uppercase text-red-700">
                  Approval escalation
                </p>
                <p className="mt-1 text-sm leading-6 text-red-900">
                  {selectedAction.escalationReason}
                </p>
              </div>
            </div>

            <aside className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-950">
                Hành động mock
              </h3>
              <div className="mt-3 space-y-2">
                {executiveMockDecisionActions.map((action) => (
                  <button
                    className={`w-full rounded-md px-3 py-2 text-sm font-semibold ${toneClasses[action.tone].bg} ${toneClasses[action.tone].text} disabled:cursor-not-allowed disabled:opacity-50`}
                    disabled={!canApproveSelectedAction}
                    key={action.status}
                    onClick={() => applyMockDecision(action.status)}
                    type="button"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
              {!canApproveSelectedAction ? (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Vai tro hien tai khong co approval authority cho cap duyet nay.
                </p>
              ) : null}
              {mockActionLog.length ? (
                <div className="mt-4 border-t border-slate-200 pt-3">
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Audit mock gần nhất
                  </p>
                  <ul className="mt-2 space-y-2 text-xs leading-5 text-slate-600">
                    {mockActionLog.slice(0, 3).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </aside>
          </div>
        ) : (
          <p className="mt-5 text-sm text-slate-500">
            Chọn một dòng trong danh sách trình duyệt để xem chi tiết.
          </p>
        )}
      </div>
    </section>
  );
}

function ExecutiveCommandCenterView({
  canAct,
  data,
  executiveDashboard,
}: {
  canAct: boolean;
  data: CommandCenterData["executiveWorkspace"];
  executiveDashboard?: CommandCenterData["executiveDashboard"];
}) {
  if (executiveDashboard === undefined) {
    return <LegacyExecutiveCommandCenterView canAct={canAct} data={data} />;
  }

  if (!executiveDashboard) {
    return <ExecutiveDashboardNoAccessState />;
  }

  return (
    <ExecutiveDashboardOverview
      data={executiveDashboard}
      legacyScopeLabel={data.scopeLabel}
    />
  );
}

function CommandCenterExecutivePanel({
  activeView,
  approvalCenter,
  canAct,
  data,
  executiveCommonCenter,
  executiveDashboard,
  executiveMorningBriefing,
  executivePrivateWorkspace,
  onApprovalAction,
  onDirectiveStatusChange,
}: {
  activeView: CommandCenterViewKey;
  approvalCenter: CommandCenterData["approvalCenter"];
  canAct: boolean;
  data: CommandCenterData["executiveWorkspace"];
  executiveCommonCenter: CommandCenterData["executiveCommonCenter"];
  executiveDashboard: CommandCenterData["executiveDashboard"];
  executiveMorningBriefing: CommandCenterData["executiveMorningBriefing"];
  executivePrivateWorkspace: CommandCenterData["executivePrivateWorkspace"];
  onApprovalAction: (
    approvalId: string,
    status: Exclude<CommandCenterApprovalStatus, "pending">,
  ) => void;
  onDirectiveStatusChange: (
    directiveId: string,
    status: CommandCenterDirectiveStatus,
  ) => void;
}) {
  if (activeView === "executive-dashboard") {
    return (
      <ExecutiveCommandCenterView
        canAct={canAct}
        data={data}
        executiveDashboard={executiveDashboard}
      />
    );
  }

  if (activeView === "executive-morning-briefing") {
    if (!executiveMorningBriefing) {
      return <ExecutiveMorningBriefingNoAccessState />;
    }

    return (
      <ExecutiveMorningBriefing
        data={executiveMorningBriefing}
        legacyScopeLabel={data.scopeLabel}
      />
    );
  }

  if (activeView === "executive-common-center") {
    if (!executiveCommonCenter) {
      return <ExecutiveCommonCenterNoAccessState />;
    }

    return (
      <ExecutiveCommonCenter
        data={executiveCommonCenter}
        legacyScopeLabel={data.scopeLabel}
      />
    );
  }

  if (activeView === "executive-private-workspace") {
    if (!executivePrivateWorkspace) {
      return <ExecutivePrivateWorkspaceNoAccessState />;
    }

    return (
      <ExecutivePrivateWorkspace
        data={executivePrivateWorkspace}
        legacyScopeLabel={data.scopeLabel}
      />
    );
  }

  if (activeView === "executive-approvals") {
    return (
      <ApprovalCenter
        data={approvalCenter}
        legacyScopeLabel={data.scopeLabel}
      />
    );
  }

  if (activeView === "executive-investment-plans") {
    return (
      <section className="space-y-5">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase text-emerald-700">
            Ban lãnh đạo
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            Kế hoạch đầu tư
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Theo dõi định hướng đầu tư năm/quý, khu vực mục tiêu, ngân sách và
            trạng thái phê duyệt.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {data.strategicPlans.map((plan) => (
            <article
              className="rounded-lg border bg-white p-5 shadow-sm"
              key={plan.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-950">{plan.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {plan.period} · {plan.regionFocus}
                  </p>
                </div>
                <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {executivePlanStatusLabels[plan.status]}
                </span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase text-slate-400">Ngân sách</p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {plan.budgetLabel}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Phân khúc</p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {plan.segmentFocus}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Phụ trách</p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {plan.ownerName}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {plan.priorities.slice(0, 3).map((priority) => (
                  <span
                    className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                    key={priority}
                  >
                    {priority}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (activeView === "executive-leadership-team") {
    return (
      <section className="space-y-5">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase text-emerald-700">
            Ban lãnh đạo
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            Danh sách lãnh đạo
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Quản lý vai trò, phạm vi và thẩm quyền xem/duyệt/chỉ đạo của từng
            thành viên.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {data.leadershipTeam.map((member) => (
            <article
              className="rounded-lg border bg-white p-5 shadow-sm"
              key={member.id}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                  {member.fullName.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-slate-950">
                    {member.fullName}
                  </h2>
                  <p className="text-sm text-slate-500">{member.position}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {member.authoritySummary}
                  </p>
                </div>
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {member.approvalLevel}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (activeView === "executive-directives") {
    return (
      <section className="space-y-5">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase text-emerald-700">
            Ban lãnh đạo
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            Chỉ đạo điều hành
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Theo dõi chỉ đạo, người nhận, deadline, trạng thái và task phát
            sinh.
          </p>
        </div>
        <div className="space-y-3">
          {data.directives.map((directive) => (
            <article
              className="rounded-lg border bg-white p-4 shadow-sm"
              key={directive.id}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="font-semibold text-slate-950">
                    {directive.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {directive.projectName} · Người nhận:{" "}
                    {directive.receiverName}
                  </p>
                </div>
                <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  {directiveStatusLabels[directive.status]}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Deadline: {directive.dueDate} · Task: {directive.taskCode}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    !canAct ||
                    directive.status === "in_progress" ||
                    directive.status === "done"
                  }
                  onClick={() =>
                    onDirectiveStatusChange(directive.id, "in_progress")
                  }
                  type="button"
                >
                  Chuyển xử lý
                </button>
                <button
                  className="rounded-md border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!canAct || directive.status === "done"}
                  onClick={() => onDirectiveStatusChange(directive.id, "done")}
                  type="button"
                >
                  Hoàn tất chỉ đạo
                </button>
                {!canAct ? (
                  <span className="text-xs text-slate-400">
                    Vai trò hiện tại chỉ được xem workflow.
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (activeView === "executive-meetings") {
    return (
      <section className="space-y-5">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase text-emerald-700">
            Ban lãnh đạo
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            Họp lãnh đạo
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Agenda, ý kiến, kết luận và action items sau họp.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {data.meetings.map((meeting) => (
            <article
              className="rounded-lg border bg-white p-5 shadow-sm"
              key={meeting.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-950">
                    {meeting.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {meeting.meetingDate} · {meeting.participants.length} người
                    tham gia
                  </p>
                </div>
                <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {meetingStatusLabels[meeting.status]}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {meeting.aiSummary}
              </p>
              <div className="mt-3 space-y-2">
                {meeting.actionItems.slice(0, 3).map((item) => (
                  <p className="text-sm text-slate-700" key={item}>
                    • {item}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (activeView === "executive-approvals") {
    return (
      <section className="space-y-5">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase text-emerald-700">
            Ban lãnh đạo
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            Phê duyệt
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Hàng đợi duyệt/không duyệt/yêu cầu sửa với lý do và hồ sơ đính kèm.
          </p>
        </div>
        <div className="space-y-3">
          {data.approvals.map((approval) => (
            <article
              className="rounded-lg border bg-white p-4 shadow-sm"
              key={approval.id}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    {approval.proposalCode}
                  </p>
                  <h2 className="mt-1 font-semibold text-slate-950">
                    {approval.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Người đề xuất: {approval.requester} · Hạn:{" "}
                    {approval.dueDate}
                  </p>
                </div>
                <span className="rounded-md bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                  {approvalStatusLabels[approval.status]}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {approval.reason}
              </p>
              {approval.decisionReason ? (
                <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  Lý do quyết định: {approval.decisionReason}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    !canAct ||
                    approval.status === "approved" ||
                    approval.status === "rejected"
                  }
                  onClick={() => onApprovalAction(approval.id, "approved")}
                  type="button"
                >
                  Duyệt
                </button>
                <button
                  className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    !canAct ||
                    approval.status === "approved" ||
                    approval.status === "rejected"
                  }
                  onClick={() => onApprovalAction(approval.id, "rejected")}
                  type="button"
                >
                  Không duyệt
                </button>
                <button
                  className="rounded-md border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    !canAct ||
                    approval.status === "approved" ||
                    approval.status === "rejected" ||
                    approval.status === "revision_required"
                  }
                  onClick={() =>
                    onApprovalAction(approval.id, "revision_required")
                  }
                  type="button"
                >
                  Yêu cầu sửa
                </button>
                {!canAct ? (
                  <span className="text-xs text-slate-400">
                    Vai trò hiện tại không có quyền phê duyệt.
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (activeView === "executive-decision-log") {
    return (
      <section className="space-y-5">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase text-emerald-700">
            Ban lãnh đạo
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            Nhật ký quyết định
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Lưu vết ai quyết định, thời điểm, lý do, phiên bản và gợi ý AI.
          </p>
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-3">
            {data.decisionLog.map((decision) => (
              <article
                className="rounded-lg border bg-white p-4 shadow-sm"
                key={decision.id}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-950">
                      {decision.decisionText}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {decision.decidedBy} · {decision.decidedAt} ·{" "}
                      {decision.version}
                    </p>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {decisionStatusLabels[decision.status]}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {decision.reason}
                </p>
                {decision.aiRecommendation ? (
                  <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    AI: {decision.aiRecommendation}
                  </p>
                ) : null}
              </article>
            ))}
          </div>

          <aside className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-950">Audit log</h2>
            <p className="mt-1 text-sm text-slate-500">
              Lưu vết thao tác quan trọng phát sinh từ workflow lãnh đạo.
            </p>
            <div className="mt-4 space-y-3">
              {data.auditLog.slice(0, 5).map((audit) => (
                <div className="rounded-md bg-slate-50 p-3" key={audit.id}>
                  <p className="text-sm font-semibold text-slate-950">
                    {audit.action}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {audit.actorName} · {audit.createdAt}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    {audit.reason}
                  </p>
                  {audit.beforeStatus || audit.afterStatus ? (
                    <p className="mt-2 text-xs text-slate-500">
                      {audit.beforeStatus ?? "mới"} -&gt;{" "}
                      {audit.afterStatus ?? "không đổi"}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    );
  }

  return null;
}

function CommandCenterOperationsPanel({
  data,
}: {
  data: CommandCenterData["operationsDashboard"];
}) {
  return (
    <section className="space-y-5">
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <p className="text-[0px] font-semibold uppercase text-purple-700">
          <span className="text-sm">Điều hành</span>
          Äiá»u hÃ nh
        </p>
        <h1 className="mt-2 text-[0px] font-semibold text-slate-950">
          <span className="text-2xl">Dashboard vận hành</span>
        </h1>
        <p className="mt-2 text-[0px] leading-6 text-slate-600">
          <span className="text-sm">
            Tổng quan dự án, công việc, hồ sơ và pháp lý được tổng hợp từ
            service dashboard chung theo quyền hiện tại.
          </span>
          Tá»•ng quan dá»± Ã¡n, cÃ´ng viá»‡c, há»“ sÆ¡ vÃ  phÃ¡p lÃ½ Ä‘Æ°á»£c
          tá»•ng há»£p tá»« service dashboard chung theo quyá»n hiá»‡n táº¡i.
        </p>
      </div>

      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[0px] font-medium text-slate-500">
              <span className="text-sm">Cập nhật dữ liệu</span>
              Cáº­p nháº­t dá»¯ liá»‡u
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">
              {new Intl.DateTimeFormat("vi-VN", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(data.generatedAt))}
            </h2>
          </div>
          <div className="max-w-xl rounded-md bg-slate-50 p-3 text-sm text-slate-600">
            <p className="font-medium text-slate-800">Công thức tiến độ</p>
            <p className="mt-1">{data.progressFormula}</p>
          </div>
        </div>
      </section>

      <DashboardKpiGrid data={data} />
      <DashboardPriorityAlerts data={data} />
      <DashboardQuickLists data={data} />
    </section>
  );
}

function CommandCenterAxisOnePanel({
  data,
}: {
  data: CommandCenterData["axisOneDashboard"];
}) {
  return (
    <AxisOneDashboard
      missingDocuments={data.missingDocuments}
      openTasks={data.openTasks}
      riskAlerts={data.riskAlerts}
      stages={data.stages}
      summary={data.summary}
    />
  );
}

function CommandCenterInPagePanel({
  activeViewLabel,
}: {
  activeViewLabel: string;
}) {
  return (
    <section className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase text-emerald-700">
          Command Center
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          {activeViewLabel}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Mục này đang giữ điều hướng nội bộ trong Command Center. Nội dung chi
          tiết sẽ được triển khai ở giai đoạn riêng, không chuyển sang route
          khác khi chưa có lệnh.
        </p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ["Trạng thái", "Đã chọn mục trong command center"],
          ["URL", "Giữ nguyên /command-center"],
          ["Bước tiếp theo", "Chỉ triển khai khi được duyệt phạm vi"],
        ].map(([title, description]) => (
          <div className="rounded-lg border border-slate-200 p-4" key={title}>
            <p className="text-xs font-semibold uppercase text-slate-400">
              {title}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CommandCenterDashboard({
  data,
  initialView,
  user,
}: {
  data: CommandCenterData;
  initialView?: string;
  user: AppSessionUser;
}) {
  const [activeView, setActiveView] = useState<CommandCenterViewKey>(() =>
    resolveInitialCommandCenterView(data, initialView),
  );
  const [executiveWorkspace, setExecutiveWorkspace] = useState(
    data.executiveWorkspace,
  );
  const activeViewLabel = useMemo(
    () => resolveCommandCenterViewLabel(data, activeView),
    [activeView, data],
  );
  const canAct = canRunExecutiveActions(user);

  const handleViewSelect = (viewKey: CommandCenterViewKey) => {
    const nextView = resolveInitialCommandCenterView(data, viewKey);

    setActiveView(nextView);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);

      if (nextView === "overview") {
        params.delete("view");
      } else {
        params.set("view", nextView);
      }

      const query = params.toString();
      const nextUrl = query ? `/command-center?${query}` : "/command-center";
      window.history.replaceState(null, "", nextUrl);
    }
  };

  const handleApprovalAction = (
    approvalId: string,
    status: Exclude<CommandCenterApprovalStatus, "pending">,
  ) => {
    if (!canAct) {
      return;
    }

    setExecutiveWorkspace((current) => {
      const approval = current.approvals.find((item) => item.id === approvalId);

      if (
        !approval ||
        approval.status === "approved" ||
        approval.status === "rejected"
      ) {
        return current;
      }

      const decidedAt = new Date().toISOString();
      const reason = approvalActionReasons[status];
      const decisionStatus =
        status === "approved"
          ? "effective"
          : status === "rejected"
            ? "superseded"
            : "follow_up";
      const decisionText = `${approval.title}: ${approvalStatusLabels[status]}`;
      const decisionItem: CommandCenterDecisionLogItem = {
        id: `decision-ui-${approval.id}-${Date.now()}`,
        entityType: "approval",
        entityId: approval.id,
        decision: decisionText,
        projectId: approval.projectId,
        decisionText,
        decidedBy: user.fullName,
        decidedAt: decidedAt.slice(0, 10),
        source: "Command Center mock",
        reason,
        aiRecommendation:
          status === "revision_required"
            ? "AI mock khuyến nghị ghi rõ tài liệu cần bổ sung trước khi trình lại."
            : undefined,
        version: approval.version,
        status: decisionStatus,
      };
      const auditItem: CommandCenterAuditLogItem = {
        id: `audit-ui-${approval.id}-${Date.now()}`,
        action: `approval.${status}`,
        entityType: "approval",
        entityId: approval.id,
        projectId: approval.projectId,
        actorId: user.id,
        actorName: user.fullName,
        createdAt: decidedAt,
        reason,
        beforeStatus: approval.status,
        afterStatus: status,
      };

      return {
        ...current,
        approvals: current.approvals.map((item) =>
          item.id === approval.id
            ? {
                ...item,
                approverId: user.id,
                decidedAt,
                decisionReason: reason,
                status,
              }
            : item,
        ),
        auditLog: [auditItem, ...current.auditLog],
        decisionLog: [decisionItem, ...current.decisionLog],
      };
    });
  };

  const handleDirectiveStatusChange = (
    directiveId: string,
    status: CommandCenterDirectiveStatus,
  ) => {
    if (!canAct) {
      return;
    }

    setExecutiveWorkspace((current) => {
      const directive = current.directives.find(
        (item) => item.id === directiveId,
      );

      if (!directive || directive.status === status) {
        return current;
      }

      const createdAt = new Date().toISOString();
      const reason =
        status === "done"
          ? "Lãnh đạo đánh dấu chỉ đạo đã hoàn tất trên Command Center mock."
          : "Lãnh đạo chuyển chỉ đạo sang trạng thái đang xử lý trên Command Center mock.";
      const auditItem: CommandCenterAuditLogItem = {
        id: `audit-ui-${directive.id}-${Date.now()}`,
        action: `directive.${status}`,
        entityType: "directive",
        entityId: directive.id,
        projectId: directive.projectId,
        actorId: user.id,
        actorName: user.fullName,
        createdAt,
        reason,
        beforeStatus: directive.status,
        afterStatus: status,
      };

      return {
        ...current,
        auditLog: [auditItem, ...current.auditLog],
        directives: current.directives.map((item) =>
          item.id === directive.id ? { ...item, status } : item,
        ),
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-r border-emerald-950/10 bg-[#073c34] text-emerald-50 lg:min-h-screen">
        <div className="flex items-center gap-3 border-b border-white/10 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500 text-slate-950">
            <Home className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <span className="sr-only">GreenNest BuildFlow</span>
            <p className="text-base font-bold">GREENNEST</p>
            <p className="text-xs font-semibold text-emerald-300">BUILDFLOW</p>
          </div>
        </div>

        <nav
          className="max-h-[70vh] space-y-5 overflow-y-auto p-4 lg:max-h-none"
          aria-label="Điều hướng 3 trục"
        >
          <button
            className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold ${
              activeView === "overview"
                ? "bg-emerald-500 text-white"
                : "text-slate-100 hover:bg-white/10"
            }`}
            onClick={() => handleViewSelect("overview")}
            type="button"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Tổng quan
          </button>
          {data.axes.map((axis, index) => (
            <AxisSection
              activeView={activeView}
              axis={axis}
              defaultOpen={index === 0}
              key={axis.title}
              onSelect={handleViewSelect}
            />
          ))}
          <div className="rounded-lg border border-white/10 p-3">
            <button
              className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-white/10 ${
                activeView === "notifications"
                  ? "bg-white/10 text-white"
                  : "text-slate-200"
              }`}
              onClick={() => handleViewSelect("notifications")}
              type="button"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              Thông báo
              <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                12
              </span>
            </button>
            <button
              className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-white/10 ${
                activeView === "settings"
                  ? "bg-white/10 text-white"
                  : "text-slate-200"
              }`}
              onClick={() => handleViewSelect("settings")}
              type="button"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              Cài đặt
            </button>
          </div>
        </nav>
      </aside>

      <section className="min-w-0">
        <header className="flex flex-col gap-4 border-b bg-white px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <Menu className="h-5 w-5 text-slate-500" aria-hidden="true" />
            <div className="flex w-full max-w-xl items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500 xl:w-[520px]">
              <Search className="h-4 w-4" aria-hidden="true" />
              Tìm kiếm dự án, công việc, hồ sơ, tài liệu...
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Bell className="h-5 w-5 text-slate-500" aria-hidden="true" />
            <MessageCircle
              className="h-5 w-5 text-slate-500"
              aria-hidden="true"
            />
            <HelpCircle className="h-5 w-5 text-slate-500" aria-hidden="true" />
            <div className="flex items-center gap-3 rounded-md border px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                {user.fullName.slice(0, 1)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {user.fullName}
                </p>
                <p className="text-xs text-slate-500">
                  {getStaticRoleLabel(user.role)}
                </p>
              </div>
            </div>
            <form action={logoutAction}>
              <button
                className="rounded-md border px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                type="submit"
              >
                Đăng xuất
              </button>
            </form>
          </div>
        </header>

        <div className="space-y-5 p-5">
          {activeView !== "overview" ? (
            <CommandCenterContextBar
              activeView={activeView}
              activeViewLabel={activeViewLabel}
              data={data}
              onSelect={handleViewSelect}
            />
          ) : null}
          {activeView.startsWith("executive-") &&
          activeView !== "executive-dashboard" ? (
            <CommandCenterGlobalStatusStrip data={executiveWorkspace} />
          ) : null}

          {activeView === "overview" ? (
            <>
              <section className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-slate-950">
                    Xin chào, {user.fullName}!
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    {new Intl.DateTimeFormat("vi-VN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(
                      new Date(data.operationsDashboard.generatedAt),
                    )}{" "}
                    · Dữ liệu vận hành
                  </p>
                </div>
                <div className="flex gap-3">
                  <button className="rounded-md border bg-white px-4 py-2 text-sm font-medium text-slate-700">
                    Tất cả dự án
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Tạo nhanh
                  </button>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {data.kpis.map((kpi) => (
                  <div
                    className="rounded-lg border bg-white p-4 shadow-sm"
                    key={kpi.label}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-500">{kpi.label}</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-950">
                          {kpi.value}
                        </p>
                      </div>
                      <div
                        className={`rounded-md p-2 ${toneClasses[kpi.tone].bg}`}
                      >
                        <ClipboardList
                          className={`h-5 w-5 ${toneClasses[kpi.tone].icon}`}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                    <p className={`mt-3 text-xs ${toneClasses[kpi.tone].text}`}>
                      {kpi.delta}
                    </p>
                  </div>
                ))}
              </section>

              <section className="grid gap-5 xl:grid-cols-[1fr_280px]">
                <div className="grid gap-5 xl:grid-cols-2">
                  <div className="rounded-lg border bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-slate-950">
                        Tiến độ danh mục dự án
                      </h2>
                      <Link
                        className="text-sm font-medium text-blue-600"
                        href="/projects"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                    <div className="mt-5 flex flex-col items-center gap-6 md:flex-row">
                      <DonutChart segments={data.progressSegments} />
                      <div className="w-full space-y-3">
                        {data.progressSegments.map((segment) => (
                          <div
                            className="flex items-center gap-3 text-sm"
                            key={segment.label}
                          >
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: segment.color }}
                            />
                            <span className="flex-1 text-slate-700">
                              {segment.label}
                            </span>
                            <span className="font-medium text-slate-950">
                              {segment.value}
                            </span>
                            <span className="text-slate-500">
                              ({segment.percent}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-slate-950">
                        Công việc quá hạn
                      </h2>
                      <Link
                        className="text-sm font-medium text-blue-600"
                        href="/tasks"
                      >
                        Xem tất cả
                      </Link>
                    </div>
                    <div className="mt-4 space-y-4">
                      {data.overdueTasks.map((task) => (
                        <div className="flex items-start gap-3" key={task.id}>
                          <span className="mt-2 h-2 w-2 rounded-full bg-red-500" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-950">
                              {task.title}
                            </p>
                            <p className="text-xs text-slate-500">
                              {task.projectName}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-red-600">
                            {task.dueLabel}
                          </span>
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                            {task.ownerAvatarLabel}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <aside className="space-y-5">
                  <div className="rounded-lg border bg-white p-5 shadow-sm">
                    <h2 className="font-semibold text-slate-950">
                      Thao tác nhanh
                    </h2>
                    <div className="mt-4 space-y-3">
                      {data.quickActions.map((action) => (
                        <Link
                          className="flex items-center gap-3 text-sm text-slate-700 hover:text-emerald-700"
                          href={action.href}
                          key={action.label}
                        >
                          <span
                            className={`rounded-md p-1.5 ${toneClasses[action.tone].bg}`}
                          >
                            <Plus
                              className={`h-4 w-4 ${toneClasses[action.tone].icon}`}
                              aria-hidden="true"
                            />
                          </span>
                          {action.label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-slate-950">
                        Thông báo
                      </h2>
                      <Link className="text-sm text-blue-600" href="/reports">
                        Xem tất cả
                      </Link>
                    </div>
                    <div className="mt-4 space-y-4">
                      {data.notifications.map((notification) => (
                        <div className="flex gap-3" key={notification.id}>
                          <AlertTriangle
                            className={`mt-0.5 h-4 w-4 ${toneClasses[notification.tone].icon}`}
                            aria-hidden="true"
                          />
                          <div>
                            <p className="text-sm text-slate-800">
                              {notification.title}
                            </p>
                            <p className="text-xs text-slate-500">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>
              </section>

              <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr_280px]">
                <div className="rounded-lg border bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-slate-950">
                      Dự án đang triển khai
                    </h2>
                    <Link
                      className="text-sm font-medium text-blue-600"
                      href="/projects"
                    >
                      Xem tất cả
                    </Link>
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="border-b text-left text-xs uppercase text-slate-500">
                        <tr>
                          <th className="py-3">Dự án</th>
                          <th>Giai đoạn</th>
                          <th>Tiến độ</th>
                          <th>Chủ đầu tư</th>
                          <th>Cập nhật cuối</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {data.projects.map((project) => (
                          <tr key={project.id}>
                            <td className="py-3 font-medium text-slate-950">
                              {project.name}
                            </td>
                            <td className="text-slate-600">{project.phase}</td>
                            <td>
                              <div className="flex items-center gap-3">
                                <div className="h-2 w-20 rounded-full bg-slate-100">
                                  <div
                                    className={`h-full rounded-full ${toneClasses[project.tone].bar}`}
                                    style={{ width: `${project.progress}%` }}
                                  />
                                </div>
                                <span className="text-slate-600">
                                  {project.progress}%
                                </span>
                              </div>
                            </td>
                            <td className="text-slate-600">
                              {project.investor}
                            </td>
                            <td className="text-slate-600">
                              {project.updatedAt}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-lg border bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-slate-950">
                      Lịch làm việc hôm nay
                    </h2>
                    <Link
                      className="text-sm font-medium text-blue-600"
                      href="/meetings"
                    >
                      Xem lịch
                    </Link>
                  </div>
                  <div className="mt-4 space-y-4">
                    {data.schedule.map((item) => (
                      <div className="flex gap-3" key={item.id}>
                        <span
                          className={`mt-1 h-2.5 w-2.5 rounded-full ${toneClasses[item.tone].dot}`}
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-950">
                            {item.time}
                          </p>
                          <p className="text-sm text-slate-800">{item.title}</p>
                          <p className="text-xs text-slate-500">
                            {item.location}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Bot
                      className="h-5 w-5 text-emerald-600"
                      aria-hidden="true"
                    />
                    <h2 className="font-semibold text-slate-950">
                      AI trợ lý ảo
                    </h2>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                      BETA
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Dưới đây là các gợi ý hôm nay
                  </p>
                  <div className="mt-4 space-y-3">
                    {data.aiSuggestions.map((suggestion) => (
                      <div
                        className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"
                        key={suggestion.label}
                      >
                        <ShieldCheck
                          className="h-4 w-4 text-blue-500"
                          aria-hidden="true"
                        />
                        <span className="font-semibold text-slate-950">
                          {suggestion.value}
                        </span>
                        <span className="text-slate-600">
                          {suggestion.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid gap-4 rounded-lg border bg-white p-4 text-sm shadow-sm md:grid-cols-4">
                {[
                  [
                    "Bảo mật cao",
                    "Dữ liệu được mã hóa và bảo vệ theo tiêu chuẩn quốc tế",
                  ],
                  [
                    "Phân quyền linh hoạt",
                    "Kiểm soát truy cập theo vai trò, phòng ban, dự án",
                  ],
                  [
                    "Làm việc mọi lúc, mọi nơi",
                    "Truy cập trên mọi thiết bị mọi lúc, mọi nơi",
                  ],
                  [
                    "Dữ liệu đồng bộ",
                    "Cập nhật real-time, đồng bộ trên toàn hệ thống",
                  ],
                ].map(([title, description]) => (
                  <div className="flex gap-3" key={title}>
                    <FileText
                      className="h-8 w-8 text-emerald-600"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-semibold text-slate-950">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </section>
            </>
          ) : activeView.startsWith("executive-") ? (
            <CommandCenterExecutivePanel
              activeView={activeView}
              approvalCenter={data.approvalCenter}
              canAct={canAct}
              data={executiveWorkspace}
              executiveCommonCenter={data.executiveCommonCenter}
              executiveDashboard={data.executiveDashboard}
              executiveMorningBriefing={data.executiveMorningBriefing}
              executivePrivateWorkspace={data.executivePrivateWorkspace}
              onApprovalAction={handleApprovalAction}
              onDirectiveStatusChange={handleDirectiveStatusChange}
            />
          ) : activeView === "operations-dashboard" ? (
            <CommandCenterOperationsPanel data={data.operationsDashboard} />
          ) : activeView === "axis1-search-development" ? (
            <CommandCenterAxisOnePanel data={data.axisOneDashboard} />
          ) : (
            <CommandCenterInPagePanel activeViewLabel={activeViewLabel} />
          )}
        </div>
      </section>
    </div>
  );
}
