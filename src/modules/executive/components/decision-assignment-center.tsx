"use client";

import React from "react";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  GitBranch,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { DECISION_STATUSES, TASK_STATUSES } from "@/constants/statuses";
import {
  createDecisionAssignmentsStateAction,
  createDecisionRecordStateAction,
  updateDecisionAssignmentLifecycleStateAction,
  updateDecisionRecordStateAction,
  type ExecutiveActionFormState,
} from "@/modules/executive/actions";
import { DecisionHistoryTimeline } from "@/modules/executive/components/decision-history-timeline";
import type {
  DecisionAssignmentCenterAssignmentItem,
  DecisionAssignmentCenterData,
  DecisionAssignmentCenterDetail,
  DecisionAssignmentCenterItem,
} from "@/modules/executive/types";
import { DecisionStatusBadge } from "@/modules/meetings/components/decision-status-badge";
import { TaskPriorityBadge } from "@/modules/tasks/components/task-badges";

const initialActionState: ExecutiveActionFormState = { status: "idle" };

const assignmentStatusLabels: Record<
  DecisionAssignmentCenterAssignmentItem["status"],
  string
> = {
  assigned: "Đã giao",
  cancelled: "Đã hủy",
  done: "Đã xong",
  in_progress: "Đang xử lý",
};

const assignmentStatusClasses: Record<
  DecisionAssignmentCenterAssignmentItem["status"],
  string
> = {
  assigned: "bg-blue-50 text-blue-700",
  cancelled: "bg-slate-100 text-slate-600",
  done: "bg-emerald-50 text-emerald-700",
  in_progress: "bg-amber-50 text-amber-700",
};

const assignmentLifecycleOptions: Array<{
  label: string;
  value: DecisionAssignmentCenterAssignmentItem["status"];
}> = [
  { label: "Da giao", value: "assigned" },
  { label: "Dang xu ly", value: "in_progress" },
  { label: "Hoan thanh", value: "done" },
  { label: "Huy giao viec", value: "cancelled" },
];

type AssignmentDraft = {
  assigneeId: string;
  assigneeType: DecisionAssignmentCenterAssignmentItem["assigneeType"];
  departmentId: string;
  description: string;
  dueDate: string;
  id: string;
  kpi: string;
  priority: DecisionAssignmentCenterAssignmentItem["priority"];
  projectId: string;
  title: string;
};

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(date);
}

function assigneeTypeLabel(value: string) {
  if (value === "project") {
    return "Dự án";
  }

  if (value === "department") {
    return "Bộ phận";
  }

  if (value === "user") {
    return "Người dùng";
  }

  return value;
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border bg-white p-3 shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function AssignmentStatusBadge({
  status,
}: {
  status: DecisionAssignmentCenterAssignmentItem["status"];
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${assignmentStatusClasses[status]}`}
    >
      {assignmentStatusLabels[status]}
    </span>
  );
}

function createAssignmentDraft(projectId = ""): AssignmentDraft {
  return {
    assigneeId: "",
    assigneeType: "project",
    departmentId: "",
    description: "",
    dueDate: "",
    id: crypto.randomUUID(),
    kpi: "",
    priority: "medium",
    projectId,
    title: "",
  };
}

function serializeAssignmentDrafts(drafts: AssignmentDraft[]) {
  return JSON.stringify(
    drafts.map((draft) => ({
      projectId: draft.projectId || undefined,
      assigneeType: draft.assigneeType,
      assigneeId: draft.assigneeId || undefined,
      departmentId: draft.departmentId || undefined,
      title: draft.title,
      description: draft.description || undefined,
      kpi: draft.kpi || undefined,
      dueDate: draft.dueDate || undefined,
      priority: draft.priority,
    })),
  );
}

function ActionStatusMessage({ state }: { state: ExecutiveActionFormState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <p
      className={`rounded-md px-3 py-2 text-sm ${
        state.status === "success"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}

function AssignmentLifecycleForm({
  assignment,
  canUpdateLifecycle,
}: {
  assignment: DecisionAssignmentCenterAssignmentItem;
  canUpdateLifecycle: boolean;
}) {
  const [state, formAction, isPending] = React.useActionState(
    updateDecisionAssignmentLifecycleStateAction,
    initialActionState,
  );

  if (!canUpdateLifecycle) {
    return null;
  }

  if (assignment.taskId && !assignment.taskHref) {
    return (
      <p className="w-full rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Cong viec bi gioi han quyen.
      </p>
    );
  }

  return (
    <form action={formAction} className="w-full space-y-2">
      <input name="assignmentId" type="hidden" value={assignment.assignmentId} />
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <label className="space-y-1 text-xs font-medium text-slate-600">
          Trang thai
          <select
            aria-label="Trang thai assignment"
            className="h-9 w-full rounded-md border px-2 text-sm text-slate-950"
            defaultValue={assignment.status}
            name="status"
          >
            {assignmentLifecycleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-slate-600">
          Ly do
          <input
            aria-label="Ly do cap nhat assignment"
            className="h-9 w-full rounded-md border px-2 text-sm text-slate-950"
            name="reason"
            placeholder="Ly do cap nhat"
          />
        </label>
      </div>
      <button
        className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        {isPending ? "Dang cap nhat" : "Cap nhat trang thai"}
      </button>
      <ActionStatusMessage state={state} />
    </form>
  );
}

function decisionDetailHref(decisionId: string, searchParams: { toString(): string }) {
  const params = new URLSearchParams(searchParams.toString());

  params.set("view", "executive-decision-log");
  params.set("decisionId", decisionId);

  return `/command-center?${params.toString()}`;
}

function DecisionListItem({
  href,
  isSelected,
  item,
}: {
  href: string;
  isSelected: boolean;
  item: DecisionAssignmentCenterItem;
}) {
  return (
    <article
      className={`rounded-lg border bg-white p-4 shadow-sm ${
        isSelected ? "border-emerald-300 ring-1 ring-emerald-200" : ""
      }`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <DecisionStatusBadge status={item.status} />
            {item.priority ? <TaskPriorityBadge priority={item.priority} /> : null}
            {item.latestVersionNumber ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                v{item.latestVersionNumber}
              </span>
            ) : null}
          </div>
          <h2 className="mt-3 text-base font-semibold text-slate-950">
            <Link className="hover:text-emerald-700" href={href}>
              {item.title}
            </Link>
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {item.summary}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-md bg-slate-50 px-2 py-1">
              Người phụ trách: {item.ownerId ?? "-"}
            </span>
            <span className="rounded-md bg-slate-50 px-2 py-1">
              Hạn xử lý: {formatDate(item.dueDate)}
            </span>
            <span className="rounded-md bg-slate-50 px-2 py-1">
              Việc được giao: {item.openAssignmentCount}/{item.assignmentCount}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-sm text-slate-600 lg:min-w-[220px]">
          <span className="font-medium text-slate-900">Nguồn</span>
          {item.source.href ? (
            <Link
              className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800"
              href={item.source.href}
            >
              {item.source.label}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          ) : (
            <span>{item.source.label}</span>
          )}
          {item.kpi ? <span>KPI: {item.kpi}</span> : null}
        </div>
      </div>
    </article>
  );
}

function AssignmentList({
  assignments,
  canUpdateLifecycle,
}: {
  assignments: DecisionAssignmentCenterAssignmentItem[];
  canUpdateLifecycle: boolean;
}) {
  if (assignments.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-4 text-sm text-slate-500">
        Chưa có việc được giao cho quyết định này.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {assignments.map((assignment) => (
        <article
          className="rounded-lg border bg-white p-4 shadow-sm"
          key={assignment.assignmentId}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="font-semibold text-slate-950">
                {assignment.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {assigneeTypeLabel(assignment.assigneeType)}:{" "}
                {assignment.assigneeId ?? assignment.departmentId ?? assignment.projectId}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Hạn xử lý: {formatDate(assignment.dueDate)}
              </p>
              {assignment.kpi ? (
                <p className="mt-2 text-sm text-slate-600">KPI: {assignment.kpi}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <TaskPriorityBadge priority={assignment.priority} />
              <AssignmentStatusBadge status={assignment.status} />
              {assignment.executionStatus ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  Công việc: {TASK_STATUSES[assignment.executionStatus]}
                </span>
              ) : null}
              {assignment.taskHref ? (
                <Link
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                  href={assignment.taskHref}
                >
                  Mở công việc
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </div>
          <div className="mt-3">
            <AssignmentLifecycleForm
              assignment={assignment}
              canUpdateLifecycle={canUpdateLifecycle}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

function CreateDecisionForm({
  data,
}: {
  data: DecisionAssignmentCenterData;
}) {
  const [state, formAction, isPending] = React.useActionState(
    createDecisionRecordStateAction,
    initialActionState,
  );

  if (!data.permissions.canCreateDecision) {
    return null;
  }

  const defaultProjectId =
    data.selectedDecision?.projectId ?? data.items[0]?.projectId ?? "";

  return (
    <form action={formAction} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 text-emerald-600" aria-hidden="true" />
        <h3 className="font-semibold text-slate-950">Tạo quyết định</h3>
      </div>
      <input name="status" type="hidden" value="open" />
      <input name="sourceType" type="hidden" value="independent" />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Tiêu đề</span>
          <input
            className="w-full rounded-md border px-3 py-2"
            name="title"
            placeholder="Tiêu đề quyết định"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Mã dự án</span>
          <input
            className="w-full rounded-md border px-3 py-2"
            defaultValue={defaultProjectId}
            name="projectId"
            placeholder="project-id"
          />
        </label>
      </div>
      <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Nội dung</span>
        <textarea
          className="min-h-20 w-full rounded-md border px-3 py-2"
          name="decisionText"
          placeholder="Nội dung quyết định"
          required
        />
      </label>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Người phụ trách</span>
          <input className="w-full rounded-md border px-3 py-2" name="ownerId" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Hạn xử lý</span>
          <input className="w-full rounded-md border px-3 py-2" name="dueDate" type="date" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Mức ưu tiên</span>
          <select className="w-full rounded-md border px-3 py-2" name="priority" defaultValue="medium">
            <option value="low">Thấp</option>
            <option value="medium">Trung bình</option>
            <option value="high">Cao</option>
            <option value="urgent">Khẩn cấp</option>
          </select>
        </label>
      </div>
      <button
        className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        {isPending ? "Đang lưu" : "Lưu quyết định"}
      </button>
      <ActionStatusMessage state={state} />
    </form>
  );
}

function ActionForms({
  canAssignDecision,
  canUpdateDecision,
  detail,
}: {
  canAssignDecision: boolean;
  canUpdateDecision: boolean;
  detail: DecisionAssignmentCenterDetail;
}) {
  const [assignmentState, assignmentFormAction, isAssignmentPending] =
    React.useActionState(
      createDecisionAssignmentsStateAction,
      initialActionState,
    );
  const [updateState, updateFormAction, isUpdatePending] = React.useActionState(
    updateDecisionRecordStateAction,
    initialActionState,
  );
  const defaultAssignmentProjectId =
    detail.projectId ?? detail.projectIds[0] ?? "";
  const [assignmentDrafts, setAssignmentDrafts] = React.useState<
    AssignmentDraft[]
  >(() => [createAssignmentDraft(defaultAssignmentProjectId)]);
  const assignmentsJson = React.useMemo(
    () => serializeAssignmentDrafts(assignmentDrafts),
    [assignmentDrafts],
  );

  React.useEffect(() => {
    setAssignmentDrafts([createAssignmentDraft(defaultAssignmentProjectId)]);
  }, [defaultAssignmentProjectId, detail.decisionId]);

  function updateDraft(
    id: string,
    patch: Partial<Omit<AssignmentDraft, "id">>,
  ) {
    setAssignmentDrafts((drafts) =>
      drafts.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)),
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {canAssignDecision ? (
      <form action={assignmentFormAction} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          <h3 className="font-semibold text-slate-950">Giao việc</h3>
        </div>
        <input name="decisionId" type="hidden" value={detail.decisionId} />
        <input name="assignmentsJson" type="hidden" value={assignmentsJson} />
        <div className="space-y-3">
          {assignmentDrafts.map((draft, index) => (
            <div
              className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3"
              key={draft.id}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">
                  Assignment {index + 1}
                </p>
                {assignmentDrafts.length > 1 ? (
                  <button
                    aria-label="Xoa assignment"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-white text-slate-600 hover:bg-slate-100"
                    onClick={() =>
                      setAssignmentDrafts((drafts) =>
                        drafts.filter((item) => item.id !== draft.id),
                      )
                    }
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Tieu de viec giao</span>
                  <input
                    aria-label="Tieu de viec giao"
                    className="w-full rounded-md border px-3 py-2"
                    onChange={(event) =>
                      updateDraft(draft.id, { title: event.target.value })
                    }
                    required
                    value={draft.title}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Ma du an</span>
                  <input
                    className="w-full rounded-md border px-3 py-2"
                    onChange={(event) =>
                      updateDraft(draft.id, { projectId: event.target.value })
                    }
                    placeholder="project-id"
                    value={draft.projectId}
                  />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Loai nguoi nhan</span>
                  <select
                    className="w-full rounded-md border px-3 py-2"
                    onChange={(event) =>
                      updateDraft(draft.id, {
                        assigneeType: event.target
                          .value as AssignmentDraft["assigneeType"],
                      })
                    }
                    value={draft.assigneeType}
                  >
                    <option value="project">Du an</option>
                    <option value="department">Bo phan</option>
                    <option value="user">Nguoi dung</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Ma nguoi nhan</span>
                  <input
                    className="w-full rounded-md border px-3 py-2"
                    onChange={(event) =>
                      updateDraft(draft.id, { assigneeId: event.target.value })
                    }
                    value={draft.assigneeId}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Ma bo phan</span>
                  <input
                    className="w-full rounded-md border px-3 py-2"
                    onChange={(event) =>
                      updateDraft(draft.id, { departmentId: event.target.value })
                    }
                    value={draft.departmentId}
                  />
                </label>
              </div>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Mo ta</span>
                <textarea
                  className="min-h-16 w-full rounded-md border px-3 py-2"
                  onChange={(event) =>
                    updateDraft(draft.id, { description: event.target.value })
                  }
                  value={draft.description}
                />
              </label>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Han xu ly</span>
                  <input
                    className="w-full rounded-md border px-3 py-2"
                    onChange={(event) =>
                      updateDraft(draft.id, { dueDate: event.target.value })
                    }
                    type="date"
                    value={draft.dueDate}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Muc uu tien</span>
                  <select
                    className="w-full rounded-md border px-3 py-2"
                    onChange={(event) =>
                      updateDraft(draft.id, {
                        priority: event.target
                          .value as AssignmentDraft["priority"],
                      })
                    }
                    value={draft.priority}
                  >
                    <option value="low">Thap</option>
                    <option value="medium">Trung binh</option>
                    <option value="high">Cao</option>
                    <option value="urgent">Khan cap</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">KPI</span>
                  <input
                    className="w-full rounded-md border px-3 py-2"
                    onChange={(event) =>
                      updateDraft(draft.id, { kpi: event.target.value })
                    }
                    value={draft.kpi}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() =>
            setAssignmentDrafts((drafts) => [
              ...drafts,
              createAssignmentDraft(defaultAssignmentProjectId),
            ])
          }
          type="button"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Them assignment
        </button>
        <div aria-hidden="true" className="hidden">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Tiêu đề việc giao</span>
            <input className="w-full rounded-md border px-3 py-2" name="assignmentTitle" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Mã dự án</span>
            <input
              className="w-full rounded-md border px-3 py-2"
              defaultValue={detail.projectId ?? detail.projectIds[0] ?? ""}
              name="assignmentProjectId"
            />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Loại người nhận</span>
            <select className="w-full rounded-md border px-3 py-2" name="assignmentAssigneeType" defaultValue="project">
              <option value="project">Dự án</option>
              <option value="department">Bộ phận</option>
              <option value="user">Người dùng</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Mã người nhận</span>
            <input className="w-full rounded-md border px-3 py-2" name="assignmentAssigneeId" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Mã bộ phận</span>
            <input className="w-full rounded-md border px-3 py-2" name="assignmentDepartmentId" />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Hạn xử lý</span>
            <input className="w-full rounded-md border px-3 py-2" name="assignmentDueDate" type="date" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Mức ưu tiên</span>
            <select className="w-full rounded-md border px-3 py-2" name="assignmentPriority" defaultValue="medium">
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
              <option value="urgent">Khẩn cấp</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">KPI</span>
            <input className="w-full rounded-md border px-3 py-2" name="assignmentKpi" />
          </label>
        </div>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isAssignmentPending}
          type="submit"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          {isAssignmentPending ? "Đang giao" : "Giao việc"}
        </button>
        <ActionStatusMessage state={assignmentState} />
      </form>
      ) : null}

      {canUpdateDecision ? (
      <form action={updateFormAction} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          <h3 className="font-semibold text-slate-950">Cập nhật quyết định</h3>
        </div>
        <input name="decisionId" type="hidden" value={detail.decisionId} />
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Tieu de quyet dinh</span>
          <input
            className="w-full rounded-md border px-3 py-2"
            defaultValue={detail.title}
            name="title"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Noi dung chi dao</span>
          <textarea
            className="min-h-24 w-full rounded-md border px-3 py-2"
            defaultValue={detail.decisionText}
            name="decisionText"
          />
        </label>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Người phụ trách</span>
            <input className="w-full rounded-md border px-3 py-2" defaultValue={detail.ownerId} name="ownerId" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Hạn xử lý</span>
            <input className="w-full rounded-md border px-3 py-2" defaultValue={detail.dueDate} name="dueDate" type="date" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Mức ưu tiên</span>
            <select className="w-full rounded-md border px-3 py-2" name="priority" defaultValue={detail.priority ?? "medium"}>
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
              <option value="urgent">Khẩn cấp</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Trạng thái</span>
            <select className="w-full rounded-md border px-3 py-2" name="status" defaultValue={detail.status}>
              {Object.entries(DECISION_STATUSES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">KPI</span>
          <input className="w-full rounded-md border px-3 py-2" defaultValue={detail.kpi} name="kpi" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Lý do</span>
          <input className="w-full rounded-md border px-3 py-2" name="reason" placeholder="Lý do cập nhật" />
        </label>
        <button
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isUpdatePending}
          type="submit"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {isUpdatePending ? "Đang cập nhật" : "Cập nhật"}
        </button>
        <ActionStatusMessage state={updateState} />
      </form>
      ) : null}
    </div>
  );
}

function DecisionDetail({
  data,
}: {
  data: DecisionAssignmentCenterData;
}) {
  const detail = data.selectedDecision;

  if (!detail) {
    return (
      <section
        aria-label="Chi tiết quyết định"
        className="rounded-lg border border-dashed bg-white p-5 text-sm text-slate-500"
      >
        Chọn một quyết định để xem chi tiết.
      </section>
    );
  }

  return (
    <section aria-label="Chi tiết quyết định" className="space-y-4">
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <DecisionStatusBadge status={detail.status} />
              {detail.priority ? <TaskPriorityBadge priority={detail.priority} /> : null}
            </div>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">
              {detail.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {detail.decisionText}
            </p>
          </div>
          <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
            <p>Người phụ trách: {detail.ownerId ?? "-"}</p>
            <p>Dự án: {detail.projectIds.length > 0 ? detail.projectIds.join(", ") : "-"}</p>
            <p>Hạn xử lý: {formatDate(detail.dueDate)}</p>
            <p>Ngày quyết định: {formatDate(detail.decidedAt)}</p>
          </div>
        </div>
      </div>

      <section aria-label="Nguồn liên quan" className="rounded-lg border bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-950">Nguồn liên quan</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {detail.linkedSources.length === 0 ? (
            <span className="text-sm text-slate-500">Không có nguồn liên quan.</span>
          ) : (
            detail.linkedSources.map((source) =>
              source.href ? (
                <Link
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-700"
                  href={source.href}
                  key={source.id}
                >
                  {source.label}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              ) : (
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-700" key={source.id}>
                  {source.label}
                </span>
              ),
            )
          )}
        </div>
      </section>

      <section aria-label="Việc được giao" className="space-y-3">
        <h3 className="font-semibold text-slate-950">Việc được giao</h3>
        <AssignmentList
          assignments={detail.assignments}
          canUpdateLifecycle={
            data.permissions.canAssignDecision || data.permissions.canUpdateDecision
          }
        />
      </section>

      {data.permissions.canAssignDecision || data.permissions.canUpdateDecision ? (
        <ActionForms
          canAssignDecision={data.permissions.canAssignDecision}
          canUpdateDecision={data.permissions.canUpdateDecision}
          detail={detail}
        />
      ) : null}

      <section aria-label="Lịch sử và kiểm toán" className="rounded-lg border bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-950">Dòng thời gian / Kiểm toán</h3>
        <div className="mt-4">
          <DecisionHistoryTimeline events={detail.history} />
        </div>
      </section>
    </section>
  );
}

export function DecisionAssignmentCenterNoAccessState() {
  return (
    <section className="space-y-5">
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase text-emerald-700">
          Ban lãnh đạo
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          Trung Tâm Quyết Định Và Giao Việc
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Không có quyền xem Trung Tâm Quyết Định Và Giao Việc trong phạm vi hiện tại.
        </p>
      </div>
    </section>
  );
}

export function DecisionAssignmentCenter({
  data,
}: {
  data: DecisionAssignmentCenterData;
}) {
  const searchParams = useSearchParams();

  if (!data.permissions.canView) {
    return <DecisionAssignmentCenterNoAccessState />;
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase text-emerald-700">
          Ban lãnh đạo
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          Trung Tâm Quyết Định Và Giao Việc
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Theo dõi quyết định, việc được giao, KPI, hạn xử lý và trạng thái thực hiện.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryMetric label="Quyết định" value={data.summary.totalDecisions} />
        <SummaryMetric label="Việc đang mở" value={data.summary.openAssignments} />
        <SummaryMetric label="Quá hạn" value={data.summary.overdueAssignments} />
        <SummaryMetric label="Sắp đến hạn" value={data.summary.dueSoonAssignments} />
        <SummaryMetric label="Ưu tiên cao" value={data.summary.highPriorityDecisions} />
      </div>

      <CreateDecisionForm data={data} />

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section aria-label="Danh sách quyết định" className="min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <h2 className="font-semibold text-slate-950">Danh sách quyết định</h2>
          </div>
          {data.items.length === 0 ? (
            <p className="rounded-lg border border-dashed bg-white p-5 text-sm text-slate-500">
              Chưa có quyết định trong phạm vi hiện tại.
            </p>
          ) : (
            data.items.map((item) => (
              <DecisionListItem
                href={decisionDetailHref(item.decisionId, searchParams)}
                isSelected={item.decisionId === data.selectedDecision?.decisionId}
                item={item}
                key={item.decisionId}
              />
            ))
          )}
        </section>

        <DecisionDetail data={data} />
      </div>
    </section>
  );
}
