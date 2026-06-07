import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileWarning,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";

import { AXIS_ONE_TITLE } from "@/modules/axis-1/constants";
import {
  AxisOneRiskBadge,
  AxisOneStageStatusBadge,
  AxisOneTaskStatusBadge,
} from "@/modules/axis-1/components/axis-one-badges";
import type {
  AxisOneDashboardSummary,
  AxisOneDevelopmentStage,
  AxisOneRiskLevel,
  AxisOneTaskStatus,
} from "@/modules/axis-1/types";

type AxisOneDashboardProps = {
  summary: AxisOneDashboardSummary;
  stages: AxisOneDevelopmentStage[];
  missingDocuments: Array<{
    id: string;
    name: string;
    owner: string;
    stageCode: string;
    stageTitle: string;
    dueDate?: string;
    href: string;
  }>;
  openTasks: Array<{
    id: string;
    title: string;
    assignee: string;
    deadline: string;
    status: AxisOneTaskStatus;
    priority: AxisOneRiskLevel;
    stageCode: string;
    stageTitle: string;
    href: string;
  }>;
  riskAlerts: Array<{
    id: string;
    title: string;
    riskLevel: AxisOneRiskLevel;
    reason: string;
    deadline: string;
    href: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function SummaryCard({
  helper,
  icon: Icon,
  label,
  value,
}: {
  helper: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
        <div className="rounded-md bg-emerald-50 p-2 text-emerald-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{helper}</p>
    </div>
  );
}

export function AxisOneDashboard({
  missingDocuments,
  openTasks,
  riskAlerts,
  stages,
  summary,
}: AxisOneDashboardProps) {
  return (
    <section className="space-y-6">
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">
              Trục 1 - {AXIS_ONE_TITLE}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              Dashboard phát triển dự án
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Theo dõi 12 bước lõi từ ý tưởng dự án đến giao đất/cho thuê đất,
              gồm trạng thái xử lý, hồ sơ còn thiếu, người phụ trách, deadline
              và cảnh báo rủi ro.
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Dự án đang xem
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {stages[0]?.projectName ?? "Chưa có dự án"}
            </p>
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          helper={`${summary.completedStages}/${summary.totalStages} bước đã hoàn thành`}
          icon={CheckCircle2}
          label="Tỷ lệ hoàn thành"
          value={`${summary.completionRate}%`}
        />
        <SummaryCard
          helper="Hồ sơ bắt buộc chưa đủ điều kiện chuyển bước"
          icon={FileWarning}
          label="Hồ sơ còn thiếu"
          value={summary.missingDocuments}
        />
        <SummaryCard
          helper="Việc mở cần xử lý để giữ tiến độ"
          icon={ClipboardList}
          label="Việc cần xử lý"
          value={summary.openTasks}
        />
        <SummaryCard
          helper="Bước đang có blocker cần tháo gỡ"
          icon={ShieldAlert}
          label="Bước bị vướng"
          value={summary.blockedStages}
        />
        <SummaryCard
          helper="Bước có rủi ro cao hoặc nghiêm trọng"
          icon={AlertTriangle}
          label="Cảnh báo rủi ro"
          value={summary.highRiskStages}
        />
      </section>

      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Danh sách 12 bước Trục 1
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Click từng bước để xem mục tiêu, checklist hồ sơ, dữ liệu đầu vào
              và đầu ra.
            </p>
          </div>
          <div className="text-sm font-medium text-emerald-700">
            Tổng tiến độ: {summary.completionRate}%
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {stages.map((stage) => {
            const missingCount = stage.requiredDocuments.filter(
              (document) => document.status === "missing",
            ).length;
            const openTaskCount = stage.tasks.filter(
              (task) => task.status !== "done",
            ).length;

            return (
              <Link
                className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-md xl:grid-cols-[80px_1.2fr_1fr_120px_130px_40px] xl:items-center"
                href={`/axis-1/${stage.id}`}
                key={stage.id}
              >
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Bước
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-950">
                    {stage.code}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-950">
                    {stage.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {stage.objective}
                  </p>
                </div>
                <div>
                  <div className="flex flex-wrap gap-2">
                    <AxisOneStageStatusBadge status={stage.status} />
                    <AxisOneRiskBadge riskLevel={stage.riskLevel} />
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${stage.progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Hoàn thành {stage.progress}%
                  </p>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-slate-950">
                    {stage.responsiblePerson}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {stage.responsibleRole}
                  </p>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-slate-950">
                    {formatDate(stage.deadline)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Thiếu {missingCount} hồ sơ · {openTaskCount} việc mở
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Hồ sơ còn thiếu</h2>
          <div className="mt-4 space-y-4">
            {missingDocuments.slice(0, 6).map((document) => (
              <Link className="block rounded-md bg-slate-50 p-3" href={document.href} key={document.id}>
                <p className="text-sm font-semibold text-slate-950">
                  {document.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Bước {document.stageCode} · {document.stageTitle}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Phụ trách: {document.owner}
                  {document.dueDate ? ` · hạn ${formatDate(document.dueDate)}` : ""}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Việc cần xử lý</h2>
          <div className="mt-4 space-y-4">
            {openTasks.slice(0, 6).map((task) => (
              <Link className="block rounded-md bg-slate-50 p-3" href={task.href} key={task.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Bước {task.stageCode} · {task.assignee}
                    </p>
                  </div>
                  <AxisOneTaskStatusBadge status={task.status} />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Hạn xử lý: {formatDate(task.deadline)}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Cảnh báo rủi ro</h2>
          <div className="mt-4 space-y-4">
            {riskAlerts.map((alert) => (
              <Link className="block rounded-md bg-red-50 p-3" href={alert.href} key={alert.id}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">
                    {alert.title}
                  </p>
                  <AxisOneRiskBadge riskLevel={alert.riskLevel} />
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  {alert.reason}
                </p>
                <p className="mt-2 text-xs font-medium text-red-700">
                  Hạn xử lý: {formatDate(alert.deadline)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
