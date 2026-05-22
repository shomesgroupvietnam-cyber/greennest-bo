import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  Database,
  FileOutput,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";

import {
  AxisOneDocumentStatusBadge,
  AxisOneRiskBadge,
  AxisOneStageStatusBadge,
  AxisOneTaskStatusBadge,
} from "@/modules/axis-1/components/axis-one-badges";
import type { AxisOneDevelopmentStage } from "@/modules/axis-1/types";

type AxisOneStageDetailProps = {
  stage: AxisOneDevelopmentStage;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function InfoBlock({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
  title: string;
}) {
  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="rounded-md bg-emerald-50 p-2 text-emerald-700">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <h2 className="font-semibold text-slate-950">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AxisOneStageDetail({ stage }: AxisOneStageDetailProps) {
  const missingDocuments = stage.requiredDocuments.filter(
    (document) => document.status === "missing",
  ).length;
  const openTasks = stage.tasks.filter((task) => task.status !== "done").length;

  return (
    <section className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
        href="/axis-1"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Quay lại Dashboard Trục 1
      </Link>

      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">
              Bước {stage.code} · Trục 1 - Dự án | Project Management
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              {stage.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {stage.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AxisOneStageStatusBadge status={stage.status} />
            <AxisOneRiskBadge riskLevel={stage.riskLevel} />
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Tiến độ
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {stage.progress}%
            </p>
            <div className="mt-3 h-2 rounded-full bg-white">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${stage.progress}%` }}
              />
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <UserRound className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {stage.responsiblePerson}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {stage.responsibleRole}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <CalendarDays className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {formatDate(stage.deadline)}
            </p>
            <p className="mt-1 text-xs text-slate-500">Deadline xử lý</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Tồn đọng
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {missingDocuments} hồ sơ thiếu · {openTasks} việc mở
            </p>
            <p className="mt-1 text-xs text-slate-500">{stage.projectName}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <InfoBlock icon={ClipboardCheck} title="Mục tiêu bước">
          <p className="text-sm leading-6 text-slate-600">{stage.objective}</p>
        </InfoBlock>

        <InfoBlock icon={Database} title="Dữ liệu đầu vào">
          <ul className="space-y-2 text-sm text-slate-600">
            {stage.inputData.map((item) => (
              <li className="flex gap-2" key={item}>
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </InfoBlock>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <InfoBlock icon={FileOutput} title="Dữ liệu đầu ra">
          <ul className="space-y-2 text-sm text-slate-600">
            {stage.outputData.map((item) => (
              <li className="flex gap-2" key={item}>
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </InfoBlock>

        <InfoBlock icon={ClipboardCheck} title="Trạng thái xử lý">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
              <span className="text-slate-500">Trạng thái</span>
              <AxisOneStageStatusBadge status={stage.status} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
              <span className="text-slate-500">Rủi ro</span>
              <AxisOneRiskBadge riskLevel={stage.riskLevel} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
              <span className="text-slate-500">Project ID</span>
              <span className="text-right font-medium text-slate-950">
                {stage.projectId}
              </span>
            </div>
          </div>
        </InfoBlock>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Checklist hồ sơ</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3">Hồ sơ</th>
                  <th>Phụ trách</th>
                  <th>Hạn</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stage.requiredDocuments.map((document) => (
                  <tr key={document.id}>
                    <td className="py-3">
                      <p className="font-medium text-slate-950">
                        {document.name}
                      </p>
                      {document.note ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {document.note}
                        </p>
                      ) : null}
                    </td>
                    <td className="text-slate-600">{document.owner}</td>
                    <td className="text-slate-600">
                      {document.dueDate ? formatDate(document.dueDate) : "-"}
                    </td>
                    <td>
                      <AxisOneDocumentStatusBadge status={document.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Việc theo dõi</h2>
          <div className="mt-4 space-y-3">
            {stage.tasks.map((task) => (
              <div className="rounded-md bg-slate-50 p-3" key={task.id}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">
                    {task.title}
                  </p>
                  <AxisOneTaskStatusBadge status={task.status} />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {task.assignee} · hạn {formatDate(task.deadline)}
                </p>
                <div className="mt-2">
                  <AxisOneRiskBadge riskLevel={task.priority} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </section>
  );
}
