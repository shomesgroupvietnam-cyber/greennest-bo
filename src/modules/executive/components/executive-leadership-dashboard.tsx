"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  FileText,
  FolderKanban,
  Gavel,
  HelpCircle,
  Home,
  Landmark,
  Layers3,
  ListChecks,
  Menu,
  MessageCircle,
  MoreVertical,
  PenTool,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import type { AppSessionUser } from "@/lib/auth/session";
import { EXECUTIVE_PAGE_NAV_ITEMS } from "@/modules/executive/constants";
import { useExecutiveWorkspaceState } from "@/modules/executive/hooks/use-executive-workspace-state";
import type {
  ExecutiveDecisionLogItem,
  ExecutiveDirective,
  ExecutiveAiInsight,
  ExecutiveGlobalStatusItem,
  ExecutiveGlobalStatusKind,
  ExecutiveLeadershipData,
  ExecutivePageKey,
  ExecutiveProgressSegment,
  ExecutiveProjectRow,
  ExecutiveWorkspaceSwitchItem,
  ExecutiveTone,
  LeadershipApproval,
  StrategicInvestmentPlan,
} from "@/modules/executive/types";

const toneClasses: Record<
  ExecutiveTone,
  {
    icon: string;
    bg: string;
    text: string;
    dot: string;
    bar: string;
    border: string;
    soft: string;
  }
> = {
  blue: {
    icon: "text-blue-600",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    bar: "bg-blue-500",
    border: "border-blue-200",
    soft: "bg-blue-50 text-blue-800",
  },
  emerald: {
    icon: "text-emerald-600",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    border: "border-emerald-200",
    soft: "bg-emerald-50 text-emerald-800",
  },
  amber: {
    icon: "text-amber-600",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
    border: "border-amber-200",
    soft: "bg-amber-50 text-amber-800",
  },
  purple: {
    icon: "text-purple-600",
    bg: "bg-purple-50",
    text: "text-purple-700",
    dot: "bg-purple-500",
    bar: "bg-purple-500",
    border: "border-purple-200",
    soft: "bg-purple-50 text-purple-800",
  },
  red: {
    icon: "text-red-600",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    bar: "bg-red-500",
    border: "border-red-200",
    soft: "bg-red-50 text-red-800",
  },
  slate: {
    icon: "text-slate-600",
    bg: "bg-slate-50",
    text: "text-slate-700",
    dot: "bg-slate-400",
    bar: "bg-slate-400",
    border: "border-slate-200",
    soft: "bg-slate-50 text-slate-800",
  },
};

const planStatusLabels: Record<StrategicInvestmentPlan["status"], string> = {
  draft: "Nháp",
  reviewing: "Đang review",
  approved: "Đã duyệt",
};

const directiveStatusLabels: Record<ExecutiveDirective["status"], string> = {
  open: "Chưa xử lý",
  in_progress: "Đang xử lý",
  blocked: "Bị vướng",
  done: "Đã xong",
};

const directivePriorityLabels: Record<ExecutiveDirective["priority"], string> =
  {
    normal: "Bình thường",
    high: "Cao",
    urgent: "Khẩn cấp",
  };

const approvalStatusLabels: Record<LeadershipApproval["status"], string> = {
  pending: "Chờ duyệt",
  revision_required: "Yêu cầu sửa",
  approved: "Đã duyệt",
  rejected: "Không duyệt",
};

const riskLabels: Record<LeadershipApproval["riskLevel"], string> = {
  low: "Rủi ro thấp",
  medium: "Rủi ro trung bình",
  high: "Rủi ro cao",
  critical: "Rủi ro khẩn cấp",
};

const executivePageIcons: Record<ExecutivePageKey, typeof BarChart3> = {
  dashboard: BarChart3,
  "investment-plans": BriefcaseBusiness,
  "leadership-team": UsersRound,
  directives: Send,
  meetings: CalendarDays,
  approvals: ClipboardCheck,
  "decision-log": ListChecks,
};

const executivePageShortLabels: Record<ExecutivePageKey, string> = {
  dashboard: "Dashboard",
  "investment-plans": "Kế hoạch đầu tư",
  "leadership-team": "Danh sách lãnh đạo",
  directives: "Chỉ đạo điều hành",
  meetings: "Họp lãnh đạo",
  approvals: "Phê duyệt",
  "decision-log": "Nhật ký quyết định",
};

const globalStatusIcons: Record<ExecutiveGlobalStatusKind, typeof BarChart3> = {
  active_projects: FolderKanban,
  legal_blockers: Gavel,
  pending_approvals: ClipboardCheck,
  today_meetings: CalendarDays,
  risk_level: Activity,
};

const rolePreviewOptions: Array<{
  label: string;
  value: AppSessionUser["role"];
}> = [
  { label: "Tổng giám đốc", value: "tong_giam_doc" },
  { label: "Phó tổng giám đốc", value: "pho_tong_giam_doc" },
  { label: "Chu tich", value: "chu_tich" },
  { label: "Super Admin", value: "super_admin" },
  { label: "Admin", value: "admin" },
  { label: "Viewer", value: "viewer" },
];

const sidebarAxes = [
  {
    title: "PHÁT TRIỂN DỰ ÁN",
    tone: "emerald" as const,
    items: [
      { code: "01", label: "Ban lãnh đạo", href: "/executive", icon: Landmark },
      {
        code: "02",
        label: "Tìm kiếm & PT dự án",
        href: "/axis-1",
        icon: Building2,
      },
      { code: "03", label: "Pháp lý", href: "/legal", icon: Gavel },
      {
        code: "04",
        label: "Thiết kế - Quy hoạch - Kỹ thuật - BIM",
        href: "/design-workspace",
        icon: PenTool,
      },
      {
        code: "05",
        label: "Đề xuất - Họp - Phê duyệt nội bộ",
        href: "/proposals",
        icon: FileCheck2,
      },
    ],
  },
  {
    title: "TRIỂN KHAI DỰ ÁN",
    tone: "blue" as const,
    items: [
      {
        code: "01",
        label: "Quản lý dự án",
        href: "/project-workbench",
        icon: BriefcaseBusiness,
      },
      {
        code: "02",
        label: "Hợp đồng",
        href: "/contract-workspace",
        icon: FileText,
      },
      {
        code: "03",
        label: "Mua sắm - Nhà thầu",
        href: "/contract-workspace",
        icon: ClipboardList,
      },
      {
        code: "04",
        label: "Thi công",
        href: "/construction-workspace",
        icon: Building2,
      },
      {
        code: "05",
        label: "Quản lý chất lượng",
        href: "/quality-workspace",
        icon: ShieldCheck,
      },
    ],
  },
  {
    title: "QUẢN TRỊ - HỖ TRỢ",
    tone: "purple" as const,
    items: [
      {
        code: "01",
        label: "Tài chính - Kế toán",
        href: "/finance-management-workspace",
        icon: BarChart3,
      },
      {
        code: "02",
        label: "Quản trị nhân sự",
        href: "/hr-workspace",
        icon: UsersRound,
      },
      {
        code: "03",
        label: "Quản trị tài liệu",
        href: "/documents",
        icon: FileText,
      },
      {
        code: "04",
        label: "Báo cáo - Thống kê",
        href: "/reports",
        icon: BarChart3,
      },
      {
        code: "05",
        label: "Hệ thống - Cấu hình",
        href: "/settings",
        icon: ShieldCheck,
      },
    ],
  },
];

function todayLabel() {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date("2026-05-21T08:00:00+07:00"));
}

function formatDate(value: string) {
  const normalized = value.includes("T") ? value : `${value}T00:00:00+07:00`;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(new Date(normalized));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function Sidebar({ activePage }: { activePage: ExecutivePageKey }) {
  return (
    <aside className="border-r border-emerald-950/10 bg-[#073c34] text-emerald-50 lg:min-h-screen">
      <div className="flex items-center gap-3 border-b border-emerald-100/10 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
          <Home className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <span className="sr-only">GreenNest BuildFlow</span>
          <p className="text-base font-bold">GREENNEST</p>
          <p className="text-xs font-semibold text-emerald-300">BUILDFLOW</p>
        </div>
      </div>

      <nav
        className="max-h-[72vh] space-y-6 overflow-y-auto p-5 lg:max-h-none"
        aria-label="Điều hướng 3 trục"
      >
        <Link
          className="flex items-center gap-3 rounded-md bg-emerald-100 px-3 py-3 text-sm font-semibold text-emerald-900 shadow-sm"
          href="/command-center"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Tổng quan
        </Link>

        <section className="space-y-2 rounded-lg border border-emerald-100/15 bg-white/10 p-3 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-emerald-100/90">
            <span>Ban lãnh đạo</span>
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            {EXECUTIVE_PAGE_NAV_ITEMS.map((item) => {
              const Icon = executivePageIcons[item.key];
              const active = item.key === activePage;

              return (
                <Link
                  className={`flex items-center gap-2 rounded-md px-2 py-2.5 text-sm font-medium transition hover:bg-white/10 ${
                    active ? "bg-white text-emerald-900" : "text-emerald-50"
                  }`}
                  href={item.href}
                  key={item.key}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">{item.label}</span>
                  <ChevronRight
                    className={`h-4 w-4 ${active ? "text-emerald-700" : "text-emerald-100/70"}`}
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </div>
        </section>

        {sidebarAxes.map((axis) => (
          <section className="space-y-2" key={axis.title}>
            <div className="flex items-center justify-between px-2 text-xs font-semibold uppercase text-emerald-100/70">
              <span>{axis.title}</span>
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              {axis.items.map((item) => {
                const Icon = item.icon;
                const active = item.href === "/executive";

                return (
                  <Link
                    className={`flex items-center gap-2 rounded-md px-2 py-2.5 text-sm font-medium transition hover:bg-white/10 ${
                      active ? "bg-white text-emerald-900" : "text-emerald-50"
                    }`}
                    href={item.href}
                    key={`${axis.title}-${item.code}`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-md ${toneClasses[axis.tone].bg} text-xs font-semibold ${toneClasses[axis.tone].text}`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      {item.code}. {item.label}
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 ${active ? "text-emerald-700" : "text-emerald-100/50"}`}
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        <div className="rounded-lg border border-emerald-100/15 bg-white/5 p-3">
          <Link
            className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-emerald-50 hover:bg-white/10"
            href="/reports"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            Thông báo
            <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
              12
            </span>
          </Link>
          <Link
            className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-emerald-50 hover:bg-white/10"
            href="/settings"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Cài đặt
          </Link>
        </div>
      </nav>
    </aside>
  );
}

function ExecutiveContextBar({
  activePage,
  selectedProjectName,
  selectedWorkspaceLabel,
}: {
  activePage: ExecutivePageKey;
  selectedProjectName: string;
  selectedWorkspaceLabel: string;
}) {
  const crumbs = [
    selectedProjectName,
    "Trục 1",
    selectedWorkspaceLabel,
    executivePageShortLabels[activePage],
  ];

  return (
    <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {crumbs.map((crumb, index) => (
          <div className="flex items-center gap-2" key={`${crumb}-${index}`}>
            <span
              className={
                index === crumbs.length - 1
                  ? "font-semibold text-emerald-700"
                  : "font-medium text-slate-500"
              }
            >
              {crumb}
            </span>
            {index < crumbs.length - 1 ? (
              <ChevronRight
                className="h-4 w-4 text-slate-300"
                aria-hidden="true"
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ExecutiveGlobalStatusBar({
  items,
}: {
  items: ExecutiveGlobalStatusItem[];
}) {
  return (
    <section className="grid gap-3 border-b border-slate-200 bg-[#f7faf8] px-4 py-3 sm:px-5 md:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => {
        const Icon = globalStatusIcons[item.kind];

        return (
          <div
            className="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm"
            key={item.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium uppercase text-slate-400">
                  {item.label}
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-950">
                  {item.value}
                </p>
              </div>
              <span className={`rounded-md p-2 ${toneClasses[item.tone].bg}`}>
                <Icon
                  className={`h-4 w-4 ${toneClasses[item.tone].icon}`}
                  aria-hidden="true"
                />
              </span>
            </div>
            <p className={`mt-2 text-xs ${toneClasses[item.tone].text}`}>
              {item.helper}
            </p>
          </div>
        );
      })}
    </section>
  );
}

function ExecutiveQuickSwitch({
  onProjectChange,
  projects,
  selectedProjectId,
  user,
  workspaceItems,
}: {
  onProjectChange: (projectId: string) => void;
  projects: ExecutiveProjectRow[];
  selectedProjectId: string;
  user: AppSessionUser;
  workspaceItems: ExecutiveWorkspaceSwitchItem[];
}) {
  const [selectedWorkspaceHref, setSelectedWorkspaceHref] =
    useState("/executive");
  const [rolePreview, setRolePreview] = useState<AppSessionUser["role"]>(
    user.role,
  );
  const selectedWorkspace =
    workspaceItems.find((item) => item.href === selectedWorkspaceHref) ??
    workspaceItems[0];

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:grid-cols-[1fr_1fr_1fr_auto]">
      <label className="min-w-0">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400">
          <FolderKanban className="h-3.5 w-3.5" aria-hidden="true" />
          Dự án
        </span>
        <select
          className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800"
          onChange={(event) => onProjectChange(event.target.value)}
          value={selectedProjectId}
        >
          {projects.map((project) => (
            <option key={project.projectId} value={project.projectId}>
              {project.name}
            </option>
          ))}
        </select>
      </label>

      <label className="min-w-0">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400">
          <Layers3 className="h-3.5 w-3.5" aria-hidden="true" />
          Workspace
        </span>
        <select
          className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800"
          onChange={(event) => setSelectedWorkspaceHref(event.target.value)}
          value={selectedWorkspaceHref}
        >
          {workspaceItems.map((item) => (
            <option key={item.id} value={item.href}>
              {item.group} - {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="min-w-0">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400">
          <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
          Role preview
        </span>
        <select
          className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800"
          onChange={(event) =>
            setRolePreview(event.target.value as AppSessionUser["role"])
          }
          value={rolePreview}
        >
          {rolePreviewOptions.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-end">
        <Link
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 lg:w-auto"
          href={selectedWorkspace?.href ?? "/executive"}
        >
          Mở
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function AiExecutiveCopilotPanel({
  canUseAiPanel,
  insights,
  selectedProjectName,
}: {
  canUseAiPanel: boolean;
  insights: ExecutiveAiInsight[];
  selectedProjectName: string;
}) {
  const primaryInsight = insights[0];
  const answerByMode = {
    summary:
      primaryInsight?.summary ??
      "Danh mục hiện chưa có cảnh báo mới cần tổng hợp.",
    risk:
      primaryInsight?.title && primaryInsight?.recommendedAction
        ? `${primaryInsight.title}: ${primaryInsight.recommendedAction}`
        : "Chưa ghi nhận rủi ro nổi bật trong danh mục hiện tại.",
    recommendation:
      primaryInsight?.recommendedAction ??
      "Tiếp tục theo dõi các đề xuất chờ duyệt và hồ sơ có blocker.",
  };
  const previewItems = [
    { key: "summary", label: "Summary preview", text: answerByMode.summary },
    { key: "risk", label: "Risk preview", text: answerByMode.risk },
    {
      key: "recommendation",
      label: "Recommendation preview",
      text: answerByMode.recommendation,
    },
  ];

  if (!canUseAiPanel) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-slate-400" aria-hidden="true" />
          <h2 className="font-semibold text-slate-950">AI Executive Copilot</h2>
        </div>
        <p className="mt-2">
          Vai trò hiện tại chỉ xem dashboard, chưa được dùng gợi ý AI điều hành.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-emerald-50 p-2">
            <Bot className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold text-slate-950">
              AI Executive Copilot
            </h2>
            <p className="text-xs text-slate-500">
              Hỗ trợ tóm tắt, giải thích rủi ro và gợi ý quyết định
            </p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          Future enhancement
        </span>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase text-slate-400">
          Context
        </p>
        <p className="mt-1 text-sm font-medium text-slate-900">
          {selectedProjectName}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          AI Executive Copilot chua trien khai trong MVP. Khu vuc nay chi hien
          thi preview noi dung dieu hanh de giu bo cuc san sang cho phase sau.
        </p>
      </div>

      <div className="mt-4 grid gap-2">
        {previewItems.map((item) => (
          <div
            className="rounded-md border border-slate-200 bg-white p-3"
            key={item.key}
          >
            <p className="text-xs font-semibold uppercase text-slate-400">
              {item.label}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              {item.text}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {insights.slice(0, 2).map((insight) => (
          <div
            className={`rounded-md border p-3 ${toneClasses[insight.tone].border} ${toneClasses[insight.tone].bg}`}
            key={insight.id}
          >
            <p className="text-sm font-semibold text-slate-950">
              {insight.title}
            </p>
            <p
              className={`mt-2 text-xs font-semibold ${toneClasses[insight.tone].text}`}
            >
              {insight.recommendedAction}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ segments }: { segments: ExecutiveProgressSegment[] }) {
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
      className="relative h-48 w-48 shrink-0 rounded-full"
      style={{ background: `conic-gradient(${gradient})` }}
    >
      <div className="absolute inset-12 flex flex-col items-center justify-center rounded-full bg-white">
        <span className="text-3xl font-semibold text-slate-950">24</span>
        <span className="text-sm text-slate-500">Tổng dự án</span>
      </div>
    </div>
  );
}

function approvalTone(
  status: LeadershipApproval["status"],
  riskLevel: LeadershipApproval["riskLevel"],
) {
  if (status === "approved") {
    return "emerald";
  }

  if (status === "rejected") {
    return "red";
  }

  if (status === "revision_required") {
    return "amber";
  }

  return riskLevel === "high" ? "red" : "purple";
}

function decisionStatusLabel(status: ExecutiveDecisionLogItem["status"]) {
  if (status === "follow_up") {
    return "Cần follow-up";
  }

  if (status === "superseded") {
    return "Đã thay thế";
  }

  return "Có hiệu lực";
}

export function ExecutiveLeadershipDashboard({
  activePage = "dashboard",
  data,
  user,
}: {
  activePage?: ExecutivePageKey;
  data: ExecutiveLeadershipData;
  user: AppSessionUser;
}) {
  const {
    access,
    approvals,
    auditLog,
    closeInvestmentPlanPanel,
    createDirective,
    createMeetingAction,
    decisionLog,
    directiveDueDate,
    directiveReceiver,
    directives,
    directiveTitle,
    handleApprovalDecision,
    investmentPlanFormError,
    investmentPlanFormValues,
    investmentPlanPanelMode,
    markPlanReviewed,
    openCreateInvestmentPlanForm,
    openEditInvestmentPlanForm,
    openInvestmentPlanDetail,
    openApprovals,
    openDirectives,
    plans,
    readOnlyReason,
    selectedInvestmentPlan,
    setDirectiveDueDate,
    setDirectiveReceiver,
    setDirectiveTitle,
    submitInvestmentPlanForm,
    updateInvestmentPlanFormField,
  } = useExecutiveWorkspaceState({ data, user });
  const [selectedProjectId, setSelectedProjectId] = useState(
    data.projects[0]?.projectId ?? "portfolio",
  );
  const selectedProject = useMemo(
    () =>
      data.projects.find(
        (project) => project.projectId === selectedProjectId,
      ) ?? data.projects[0],
    [data.projects, selectedProjectId],
  );
  const selectedProjectName = selectedProject?.name ?? "Toàn danh mục";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f8f6] lg:grid lg:grid-cols-[260px_1fr]">
      <Sidebar activePage={activePage} />

      <section className="min-w-0">
        <header className="flex flex-col gap-4 border-b bg-white px-4 py-4 sm:px-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-full min-w-0 items-center gap-4 xl:w-auto">
            <Menu
              className="h-5 w-5 shrink-0 text-slate-500"
              aria-hidden="true"
            />
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500 xl:w-[520px] xl:flex-none">
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">
                Tìm kiếm dự án, công việc, hồ sơ, đề xuất, quyết định...
              </span>
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
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                {user.fullName.slice(0, 1)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {user.fullName}
                </p>
                <p className="text-xs text-slate-500">
                  {user.role === "tong_giam_doc"
                    ? "Tổng giám đốc"
                    : "Ban lãnh đạo"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <ExecutiveContextBar
          activePage={activePage}
          selectedProjectName={selectedProjectName}
          selectedWorkspaceLabel="Ban lãnh đạo"
        />

        <ExecutiveGlobalStatusBar items={data.globalStatusItems} />

        <div className="space-y-5 p-4 sm:p-5">
          <section className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">
                Ban lãnh đạo
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Xin chào, {user.fullName}. {todayLabel()} · {data.scopeLabel}
              </p>
              <p className="mt-1 text-xs font-medium text-emerald-700">
                Phân quyền module: {access.label}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-md border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                href="/executive/investment-plans"
              >
                Kế hoạch đầu tư
              </Link>
              <button
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!access.canCreatePlan}
                onClick={openCreateInvestmentPlanForm}
                title={
                  access.canCreatePlan
                    ? "Tạo kế hoạch đầu tư nhanh"
                    : readOnlyReason
                }
                type="button"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Tạo nhanh
              </button>
            </div>
          </section>

          <ExecutiveQuickSwitch
            onProjectChange={setSelectedProjectId}
            projects={data.projects}
            selectedProjectId={selectedProjectId}
            user={user}
            workspaceItems={data.workspaceSwitchItems}
          />

          <section
            className={`${activePage === "dashboard" ? "grid" : "hidden"} gap-4 md:grid-cols-2 xl:grid-cols-5`}
          >
            {data.metrics.map((metric, index) => {
              const Icon =
                [
                  BriefcaseBusiness,
                  AlertTriangle,
                  FileText,
                  ClipboardCheck,
                  ShieldCheck,
                ][index] ?? BarChart3;
              const value =
                metric.label === "Đề xuất chờ lãnh đạo"
                  ? openApprovals
                  : metric.value;

              return (
                <div
                  className="rounded-lg border bg-white p-4 shadow-sm"
                  key={metric.label}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">{metric.label}</p>
                      <p className="mt-3 text-3xl font-semibold text-slate-950">
                        {value}
                      </p>
                    </div>
                    <div
                      className={`rounded-md p-2 ${toneClasses[metric.tone].bg}`}
                    >
                      <Icon
                        className={`h-5 w-5 ${toneClasses[metric.tone].icon}`}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <p
                    className={`mt-3 text-xs ${toneClasses[metric.tone].text}`}
                  >
                    {metric.delta}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{metric.helper}</p>
                </div>
              );
            })}
          </section>

          <section
            className={`${activePage === "dashboard" ? "grid" : "hidden"} gap-5 xl:grid-cols-[1fr_300px]`}
          >
            <div className="grid gap-5 xl:grid-cols-2">
              <div className="rounded-lg border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-950">
                    Dashboard lãnh đạo
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
                    Việc cần xử lý ngay
                  </h2>
                  <Link
                    className="text-sm font-medium text-blue-600"
                    href="/tasks"
                  >
                    Xem tất cả
                  </Link>
                </div>
                <div className="mt-4 space-y-4">
                  {data.urgentItems.map((item) => (
                    <div className="flex items-start gap-3" key={item.id}>
                      <span
                        className={`mt-2 h-2 w-2 rounded-full ${toneClasses[item.tone].dot}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-950">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.projectName}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-semibold ${toneClasses[item.tone].text}`}
                      >
                        {item.dueLabel}
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                        {item.ownerAvatarLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-5">
              <div className="rounded-lg border bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-slate-950">Thao tác nhanh</h2>
                <div className="mt-4 space-y-3">
                  {data.quickActions.map((action) => (
                    <a
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
                    </a>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-950">Thông báo</h2>
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

              <AiExecutiveCopilotPanel
                canUseAiPanel={access.canUseAiPanel}
                insights={data.aiInsights}
                selectedProjectName={selectedProjectName}
              />
            </aside>
          </section>

          <section
            className={`${activePage === "dashboard" ? "grid" : "hidden"} gap-5 xl:grid-cols-[1.45fr_1fr]`}
          >
            <div className="min-w-0 rounded-lg border bg-white p-5 shadow-sm">
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
              <div className="mt-4 space-y-3 md:hidden">
                {data.projects.map((project) => (
                  <div
                    className="rounded-lg border border-slate-200 p-3"
                    key={project.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">
                          {project.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {project.phase} · {project.investor}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">
                        {project.progress}%
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${toneClasses[project.tone].bar}`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Cập nhật cuối: {project.updatedAt}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 hidden overflow-x-auto md:block">
                <table className="min-w-full text-sm">
                  <thead className="border-b text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="py-3">Dự án</th>
                      <th>Giai đoạn</th>
                      <th>Tiến độ</th>
                      <th>Chủ đầu tư</th>
                      <th>Cập nhật cuối</th>
                      <th />
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
                        <td className="text-slate-600">{project.investor}</td>
                        <td className="text-slate-600">{project.updatedAt}</td>
                        <td>
                          <MoreVertical
                            className="h-4 w-4 text-slate-400"
                            aria-hidden="true"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="min-w-0 rounded-lg border bg-white p-5 shadow-sm">
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
                      <p className="text-xs text-slate-500">{item.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            className={`${activePage === "investment-plans" ? "block" : "hidden"} rounded-lg border bg-white p-5 shadow-sm`}
            id="investment-plans"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-950">
                  Kế hoạch đầu tư
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Nhập định hướng năm/quý/tháng, khu vực mục tiêu, loại dự án,
                  ngân sách và ưu tiên.
                </p>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!access.canCreatePlan}
                onClick={openCreateInvestmentPlanForm}
                title={
                  access.canCreatePlan ? "Tạo kế hoạch đầu tư" : readOnlyReason
                }
                type="button"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Tạo kế hoạch
              </button>
            </div>
            {investmentPlanPanelMode !== "closed" ? (
              <div className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">
                      {investmentPlanPanelMode === "create"
                        ? "Tạo kế hoạch đầu tư"
                        : investmentPlanPanelMode === "edit"
                          ? "Sửa kế hoạch đầu tư"
                          : "Chi tiết kế hoạch đầu tư"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Cập nhật định hướng đầu tư, ngân sách, khu vực mục tiêu và
                      trạng thái phê duyệt.
                    </p>
                  </div>
                  <button
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={closeInvestmentPlanPanel}
                    type="button"
                  >
                    Đóng
                  </button>
                </div>

                {investmentPlanPanelMode === "detail" &&
                selectedInvestmentPlan ? (
                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                    {[
                      ["Tên kế hoạch", selectedInvestmentPlan.title],
                      [
                        "Năm/quý",
                        `${selectedInvestmentPlan.year} · ${selectedInvestmentPlan.quarter}`,
                      ],
                      ["Khu vực mục tiêu", selectedInvestmentPlan.targetArea],
                      ["Loại dự án", selectedInvestmentPlan.projectType],
                      ["Ngân sách", selectedInvestmentPlan.budgetRange],
                      ["Ưu tiên", selectedInvestmentPlan.priority],
                      [
                        "Trạng thái",
                        planStatusLabels[selectedInvestmentPlan.status],
                      ],
                      ["Người tạo", selectedInvestmentPlan.createdBy],
                      [
                        "Cập nhật",
                        formatDate(selectedInvestmentPlan.updatedAt),
                      ],
                    ].map(([label, value]) => (
                      <div
                        className="rounded-md border border-slate-200 bg-white p-3"
                        key={label}
                      >
                        <p className="text-xs font-medium uppercase text-slate-400">
                          {label}
                        </p>
                        <p className="mt-1 font-medium text-slate-900">
                          {value}
                        </p>
                      </div>
                    ))}
                    <div className="md:col-span-3">
                      <button
                        className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                        disabled={!access.canCreatePlan}
                        onClick={() =>
                          openEditInvestmentPlanForm(selectedInvestmentPlan.id)
                        }
                        title={
                          access.canCreatePlan
                            ? "Sửa kế hoạch đầu tư"
                            : readOnlyReason
                        }
                        type="button"
                      >
                        Sửa kế hoạch
                      </button>
                    </div>
                  </div>
                ) : null}

                {investmentPlanPanelMode === "create" ||
                investmentPlanPanelMode === "edit" ? (
                  <form
                    className="mt-4 grid gap-3 md:grid-cols-2"
                    onSubmit={submitInvestmentPlanForm}
                  >
                    <label className="md:col-span-2">
                      <span className="text-sm font-medium text-slate-700">
                        Tên kế hoạch
                      </span>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        onChange={(event) =>
                          updateInvestmentPlanFormField(
                            "title",
                            event.target.value,
                          )
                        }
                        value={investmentPlanFormValues.title}
                      />
                    </label>
                    <label>
                      <span className="text-sm font-medium text-slate-700">
                        Năm
                      </span>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        onChange={(event) =>
                          updateInvestmentPlanFormField(
                            "year",
                            event.target.value,
                          )
                        }
                        type="number"
                        value={investmentPlanFormValues.year}
                      />
                    </label>
                    <label>
                      <span className="text-sm font-medium text-slate-700">
                        Quý
                      </span>
                      <select
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        onChange={(event) =>
                          updateInvestmentPlanFormField(
                            "quarter",
                            event.target
                              .value as typeof investmentPlanFormValues.quarter,
                          )
                        }
                        value={investmentPlanFormValues.quarter}
                      >
                        <option value="Q1">Q1</option>
                        <option value="Q2">Q2</option>
                        <option value="Q3">Q3</option>
                        <option value="Q4">Q4</option>
                        <option value="FY">Cả năm</option>
                      </select>
                    </label>
                    <label>
                      <span className="text-sm font-medium text-slate-700">
                        Khu vực mục tiêu
                      </span>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        onChange={(event) =>
                          updateInvestmentPlanFormField(
                            "targetArea",
                            event.target.value,
                          )
                        }
                        value={investmentPlanFormValues.targetArea}
                      />
                    </label>
                    <label>
                      <span className="text-sm font-medium text-slate-700">
                        Loại dự án
                      </span>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        onChange={(event) =>
                          updateInvestmentPlanFormField(
                            "projectType",
                            event.target.value,
                          )
                        }
                        value={investmentPlanFormValues.projectType}
                      />
                    </label>
                    <label>
                      <span className="text-sm font-medium text-slate-700">
                        Ngân sách
                      </span>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        onChange={(event) =>
                          updateInvestmentPlanFormField(
                            "budgetRange",
                            event.target.value,
                          )
                        }
                        value={investmentPlanFormValues.budgetRange}
                      />
                    </label>
                    <label>
                      <span className="text-sm font-medium text-slate-700">
                        Mức ưu tiên
                      </span>
                      <select
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        onChange={(event) =>
                          updateInvestmentPlanFormField(
                            "priority",
                            event.target
                              .value as typeof investmentPlanFormValues.priority,
                          )
                        }
                        value={investmentPlanFormValues.priority}
                      >
                        <option value="low">Thấp</option>
                        <option value="medium">Trung bình</option>
                        <option value="high">Cao</option>
                        <option value="strategic">Chiến lược</option>
                      </select>
                    </label>
                    <label>
                      <span className="text-sm font-medium text-slate-700">
                        Trạng thái
                      </span>
                      <select
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        onChange={(event) =>
                          updateInvestmentPlanFormField(
                            "status",
                            event.target
                              .value as typeof investmentPlanFormValues.status,
                          )
                        }
                        value={investmentPlanFormValues.status}
                      >
                        <option value="draft">Nháp</option>
                        <option value="reviewing">Đang review</option>
                        <option value="approved">Đã duyệt</option>
                      </select>
                    </label>
                    {investmentPlanFormError ? (
                      <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-2">
                        {investmentPlanFormError}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2 md:col-span-2">
                      <button
                        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        type="submit"
                      >
                        {investmentPlanPanelMode === "create"
                          ? "Tạo kế hoạch"
                          : "Lưu thay đổi"}
                      </button>
                      <button
                        className="rounded-md border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        onClick={closeInvestmentPlanPanel}
                        type="button"
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>
            ) : null}
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              {plans.map((plan) => {
                const progress = Math.min(
                  Math.round(
                    (plan.committedBudget / Math.max(plan.allocatedBudget, 1)) *
                      100,
                  ),
                  100,
                );

                return (
                  <article
                    className="rounded-lg border border-slate-200 p-4"
                    key={plan.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-950">
                          {plan.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {plan.period} · {plan.regionFocus}
                        </p>
                      </div>
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {planStatusLabels[plan.status]}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-[0.65fr_1fr]">
                      <div>
                        <p className="text-sm text-slate-500">Ngân sách</p>
                        <p className="mt-1 text-lg font-semibold text-slate-950">
                          {plan.budgetLabel}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Owner: {plan.ownerName} · Cập nhật{" "}
                          {formatDate(plan.updatedAt)}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Đã cam kết</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-600"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[...plan.projectTypes, ...plan.targetAreas]
                            .slice(0, 5)
                            .map((tag) => (
                              <span
                                className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                                key={tag}
                              >
                                {tag}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        onClick={() => openInvestmentPlanDetail(plan.id)}
                        type="button"
                      >
                        Xem chi tiết
                      </button>
                      <button
                        className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        disabled={!access.canCreatePlan}
                        onClick={() => openEditInvestmentPlanForm(plan.id)}
                        title={
                          access.canCreatePlan
                            ? "Sửa kế hoạch đầu tư"
                            : readOnlyReason
                        }
                        type="button"
                      >
                        Sửa
                      </button>
                      <button
                        className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        disabled={!access.canApprovePlan}
                        onClick={() => markPlanReviewed(plan.id)}
                        title={
                          access.canApprovePlan
                            ? "Cập nhật trạng thái kế hoạch"
                            : readOnlyReason
                        }
                        type="button"
                      >
                        {plan.status === "approved" ? "Chuyển review" : "Duyệt"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section
            className={`${activePage === "leadership-team" ? "grid" : "hidden"} gap-5 xl:grid-cols-[0.8fr_1.2fr]`}
            id="leaders"
          >
            <div className="min-w-0 rounded-lg border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <UsersRound
                  className="h-5 w-5 text-emerald-700"
                  aria-hidden="true"
                />
                <h2 className="font-semibold text-slate-950">
                  Danh sách lãnh đạo
                </h2>
              </div>
              <div className="mt-4 space-y-3">
                {data.leadershipTeam.map((leader) => (
                  <div
                    className="rounded-lg border border-slate-200 p-3"
                    key={leader.id}
                  >
                    <p className="font-medium text-slate-950">
                      {leader.fullName}
                    </p>
                    <p className="text-sm text-slate-600">{leader.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {leader.scope}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {leader.permissions.map((permission) => (
                        <span
                          className="rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700"
                          key={permission}
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-0 rounded-lg border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className="h-5 w-5 text-emerald-700"
                  aria-hidden="true"
                />
                <h2 className="font-semibold text-slate-950">
                  Ma trận thẩm quyền lãnh đạo
                </h2>
              </div>
              <div className="mt-4 space-y-3 md:hidden">
                {data.authorityMatrix.map((row) => (
                  <article
                    className="rounded-lg border border-slate-200 p-3"
                    key={row.id}
                  >
                    <p className="font-medium text-slate-950">
                      {row.decisionArea}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Ngưỡng: {row.threshold}
                    </p>
                    <div className="mt-3 space-y-2 text-xs text-slate-600">
                      <p>
                        <strong>TGĐ:</strong> {row.tongGiamDoc}
                      </p>
                      <p>
                        <strong>PTGĐ:</strong> {row.phoTongGiamDoc}
                      </p>
                      <p>
                        <strong>Trợ lý:</strong> {row.secretarySupport}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
              <div className="mt-4 hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Phạm vi quyết định</th>
                      <th className="px-3 py-2">Ngưỡng</th>
                      <th className="px-3 py-2">TGĐ</th>
                      <th className="px-3 py-2">PTGĐ</th>
                      <th className="px-3 py-2">Trợ lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.authorityMatrix.map((row) => (
                      <tr key={row.id}>
                        <td className="px-3 py-3 font-medium text-slate-900">
                          {row.decisionArea}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {row.threshold}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {row.tongGiamDoc}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {row.phoTongGiamDoc}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {row.secretarySupport}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section
            className={`${activePage === "directives" ? "grid" : "hidden"} gap-5 xl:grid-cols-[0.9fr_1.1fr]`}
            id="directives"
          >
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-950">
                    Chỉ đạo điều hành
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Chỉ đạo có người nhận, deadline, trạng thái và task theo
                    dõi.
                  </p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  {openDirectives} đang mở
                </span>
              </div>
              <form
                className="mt-4 space-y-3 rounded-lg bg-slate-50 p-3"
                onSubmit={createDirective}
              >
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  disabled={!access.canCreateDirective}
                  onChange={(event) => setDirectiveTitle(event.target.value)}
                  placeholder="Nội dung chỉ đạo"
                  value={directiveTitle}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    disabled={!access.canCreateDirective}
                    onChange={(event) =>
                      setDirectiveReceiver(event.target.value)
                    }
                    placeholder="Người nhận/Bộ phận"
                    value={directiveReceiver}
                  />
                  <input
                    className="rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    disabled={!access.canCreateDirective}
                    onChange={(event) =>
                      setDirectiveDueDate(event.target.value)
                    }
                    type="date"
                    value={directiveDueDate}
                  />
                </div>
                <button
                  className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={!access.canCreateDirective}
                  title={
                    access.canCreateDirective
                      ? "Tạo chỉ đạo điều hành"
                      : readOnlyReason
                  }
                  type="submit"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Tạo chỉ đạo
                </button>
              </form>
            </div>

            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-950">
                Danh sách chỉ đạo
              </h2>
              <div className="mt-4 space-y-3">
                {directives.map((directive) => (
                  <div
                    className="rounded-lg border border-slate-200 p-3"
                    key={directive.id}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${toneClasses[directive.status === "blocked" ? "red" : directive.status === "done" ? "emerald" : "amber"].soft}`}
                      >
                        {directiveStatusLabels[directive.status]}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {directivePriorityLabels[directive.priority]}
                      </span>
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {directive.taskCode}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-950">
                      {directive.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {directive.projectName} · Nhận: {directive.receiverName} ·
                      Hạn {formatDate(directive.dueDate)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            className={`${activePage === "meetings" || activePage === "approvals" ? "grid" : "hidden"} gap-5 xl:grid-cols-[1fr_1.1fr]`}
            id="meetings"
          >
            <div
              className={`${activePage === "meetings" ? "block" : "hidden"} rounded-lg border bg-white p-5 shadow-sm`}
            >
              <div className="flex items-center gap-2">
                <CalendarDays
                  className="h-5 w-5 text-emerald-700"
                  aria-hidden="true"
                />
                <h2 className="font-semibold text-slate-950">Họp lãnh đạo</h2>
              </div>
              <div className="mt-4 space-y-4">
                {data.meetings.map((meeting) => (
                  <article
                    className="rounded-lg border border-slate-200 p-4"
                    key={meeting.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">
                          {meeting.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(meeting.meetingDate)} ·{" "}
                          {meeting.decisionCount} quyết định
                        </p>
                      </div>
                      <button
                        className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        disabled={!access.canCreateMeetingAction}
                        onClick={() => createMeetingAction(meeting.title)}
                        title={
                          access.canCreateMeetingAction
                            ? "Sinh việc theo dõi sau họp"
                            : readOnlyReason
                        }
                        type="button"
                      >
                        Sinh việc
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {meeting.agenda.map((agenda) => (
                        <span
                          className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700"
                          key={agenda}
                        >
                          {agenda}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-slate-700">
                      <strong>Kết luận:</strong> {meeting.conclusion}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div
              className={`${activePage === "approvals" ? "block" : "hidden"} rounded-lg border bg-white p-5 shadow-sm`}
              id="approvals"
            >
              <div className="flex items-center gap-2">
                <ClipboardCheck
                  className="h-5 w-5 text-emerald-700"
                  aria-hidden="true"
                />
                <h2 className="font-semibold text-slate-950">
                  Phê duyệt cấp lãnh đạo
                </h2>
              </div>
              <div className="mt-4 space-y-4">
                {approvals.map((approval) => {
                  const tone = approvalTone(
                    approval.status,
                    approval.riskLevel,
                  );

                  return (
                    <article
                      className="rounded-lg border border-slate-200 p-4"
                      key={approval.id}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-medium ${toneClasses[tone].soft}`}
                        >
                          {approvalStatusLabels[approval.status]}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {approval.proposalCode}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-medium ${toneClasses[tone].soft}`}
                        >
                          {riskLabels[approval.riskLevel]}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-950">
                        {approval.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {approval.requester} ·{" "}
                        {approval.amountLabel ?? "Không có ngân sách"} · Hạn{" "}
                        {formatDate(approval.dueDate)} · {approval.version}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        File:{" "}
                        {approval.attachmentLabel ?? "Chưa có file đính kèm"}
                      </p>
                      {approval.reason ? (
                        <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          Lý do: {approval.reason}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                          disabled={!access.canApproveProposal}
                          onClick={() =>
                            handleApprovalDecision(approval, "approved")
                          }
                          title={
                            access.canApproveProposal
                              ? "Duyệt đề xuất"
                              : readOnlyReason
                          }
                          type="button"
                        >
                          <CheckCircle2
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                          Duyệt
                        </button>
                        <button
                          className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                          disabled={!access.canApproveProposal}
                          onClick={() =>
                            handleApprovalDecision(approval, "rejected")
                          }
                          title={
                            access.canApproveProposal
                              ? "Không duyệt đề xuất"
                              : readOnlyReason
                          }
                          type="button"
                        >
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                          Không duyệt
                        </button>
                        <button
                          className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                          disabled={!access.canApproveProposal}
                          onClick={() =>
                            handleApprovalDecision(
                              approval,
                              "revision_required",
                            )
                          }
                          title={
                            access.canApproveProposal
                              ? "Yêu cầu chỉnh sửa đề xuất"
                              : readOnlyReason
                          }
                          type="button"
                        >
                          Yêu cầu sửa
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <section
            className={`${activePage === "decision-log" ? "block" : "hidden"} min-w-0 overflow-hidden rounded-lg border bg-white p-5 shadow-sm`}
            id="decision-log"
          >
            <div className="flex items-center gap-2">
              <ListChecks
                className="h-5 w-5 text-emerald-700"
                aria-hidden="true"
              />
              <h2 className="font-semibold text-slate-950">
                Nhật ký quyết định
              </h2>
            </div>
            <div className="mt-4 space-y-3 md:hidden">
              {decisionLog.map((decision) => (
                <article
                  className="rounded-lg border border-slate-200 p-3"
                  key={decision.id}
                >
                  <p className="font-medium text-slate-950">
                    {decision.decisionText}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {decision.decidedBy} · {decision.source} ·{" "}
                    {formatDate(decision.decidedAt)}
                  </p>
                  {decision.projectId ? (
                    <p className="mt-1 text-xs text-slate-500">
                      project_id: {decision.projectId}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-600">
                    {decision.reason} · {decision.version}
                  </p>
                  <span className="mt-3 inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {decisionStatusLabel(decision.status)}
                  </span>
                </article>
              ))}
            </div>
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Quyết định</th>
                    <th className="px-4 py-3">Người duyệt</th>
                    <th className="px-4 py-3">project_id</th>
                    <th className="px-4 py-3">Nguồn</th>
                    <th className="px-4 py-3">Ngày</th>
                    <th className="px-4 py-3">Lý do/Phiên bản</th>
                    <th className="px-4 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {decisionLog.map((decision) => (
                    <tr key={decision.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {decision.decisionText}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {decision.decidedBy}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {decision.projectId ?? "Không gắn dự án"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {decision.source}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(decision.decidedAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {decision.reason} · {decision.version}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {decisionStatusLabel(decision.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {access.canViewAudit ? (
              <div className="mt-6 border-t pt-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">
                      Audit log quyết định quan trọng
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Ghi nhận action, entity, project_id, actor, trạng thái
                      trước/sau và lý do.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {auditLog.length} log
                  </span>
                </div>

                <div className="mt-4 space-y-3 md:hidden">
                  {auditLog.map((log) => (
                    <article
                      className="rounded-lg border border-slate-200 p-3"
                      key={log.id}
                    >
                      <p className="font-medium text-slate-950">{log.action}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {log.entityType} · {log.entityId} ·{" "}
                        {log.projectId ?? "Không gắn dự án"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {log.actorName} · {formatDateTime(log.createdAt)}
                      </p>
                      <p className="mt-2 text-xs text-slate-600">
                        {log.reason}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {log.beforeStatus ?? "-"} → {log.afterStatus ?? "-"}
                      </p>
                    </article>
                  ))}
                </div>

                <div className="mt-4 hidden overflow-x-auto md:block">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Entity</th>
                        <th className="px-4 py-3">project_id</th>
                        <th className="px-4 py-3">Actor</th>
                        <th className="px-4 py-3">Thời điểm</th>
                        <th className="px-4 py-3">Trạng thái</th>
                        <th className="px-4 py-3">Lý do</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditLog.map((log) => (
                        <tr key={log.id}>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {log.action}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {log.entityType} · {log.entityId}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {log.projectId ?? "Không gắn dự án"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {log.actorName}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatDateTime(log.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {log.beforeStatus ?? "-"} → {log.afterStatus ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {log.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </section>

          <section
            className={`${activePage === "dashboard" ? "grid" : "hidden"} gap-4 rounded-lg border bg-white p-4 text-sm shadow-sm md:grid-cols-4`}
          >
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
                <Sparkles
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
        </div>
      </section>
    </main>
  );
}
