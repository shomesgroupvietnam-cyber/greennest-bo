"use client";

import {
  CheckCircle2,
  FileText,
  GitBranch,
  Link2,
  ListChecks,
  Paperclip,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import React, { useActionState } from "react";

import { Button } from "@/components/ui/button";
import type { AiMeetingSummary } from "@/modules/ai/types";
import { DecisionHistoryTimeline } from "@/modules/executive/components/decision-history-timeline";
import type { MeetingActionState } from "@/modules/meetings/actions";
import { DecisionStatusBadge } from "@/modules/meetings/components/decision-status-badge";
import type { MeetingDecisionTrackingData } from "@/modules/meetings/services/meeting-decision-tracking-service";
import type { Meeting } from "@/modules/meetings/types";
import { TaskPriorityBadge, TaskStatusBadge } from "@/modules/tasks/components/task-badges";

type MeetingPanelAction = (
  state: MeetingActionState,
  formData: FormData,
) => MeetingActionState | Promise<MeetingActionState>;

type MeetingPanelBaseProps = {
  canUpdate: boolean;
};

type MeetingMinutesPanelProps = MeetingPanelBaseProps & {
  approveAction: MeetingPanelAction;
  meeting: Pick<Meeting, "meetingMinutes" | "meetingMinutesApproval" | "summary">;
  updateAction: MeetingPanelAction;
};

type MeetingAttachmentsPanelProps = MeetingPanelBaseProps & {
  addAction: MeetingPanelAction;
  meeting: Pick<Meeting, "attachments">;
  removeAction: MeetingPanelAction;
};

type MeetingAiSummaryPanelProps = MeetingPanelBaseProps & {
  aiMeetingSummary?: AiMeetingSummary;
  approveAction: MeetingPanelAction;
  generateAction: MeetingPanelAction;
  meeting: Pick<Meeting, "aiSummary">;
  returnToHref?: string;
  updateDraftAction: MeetingPanelAction;
};

export type MeetingFollowUpTaskLink = {
  href: string;
  id: string;
  title: string;
};

export type MeetingFollowUpActionPanelItem = Pick<
  Meeting["followUpActions"][number],
  "dueDate" | "id" | "ownerId" | "relatedTaskId" | "status" | "title"
> & {
  hasHiddenRelatedTask?: boolean;
};

type MeetingFollowUpActionsPanelProps = MeetingPanelBaseProps & {
  addAction: MeetingPanelAction;
  canCreateTask: boolean;
  createTaskAction: MeetingPanelAction;
  followUpActions: MeetingFollowUpActionPanelItem[];
  needsTaskProjectInput: boolean;
  today?: Date;
  updateStatusAction: MeetingPanelAction;
  visibleTaskLinks: MeetingFollowUpTaskLink[];
};

type MeetingDecisionTrackingPanelProps = {
  createDecisionAction: MeetingPanelAction;
  data: MeetingDecisionTrackingData;
  linkDecisionAction: MeetingPanelAction;
};

const initialPanelActionState: MeetingActionState = {
  status: "idle",
};

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDateOnly(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

function toDateOnly(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

const terminalFollowUpStatuses = new Set(["done", "cancelled"]);
const followUpStatusLabels = {
  open: "Chưa xử lý",
  in_progress: "Đang xử lý",
  done: "Đã xong",
  cancelled: "Hủy",
} as const;

const assignmentStatusLabels = {
  assigned: "Đã giao",
  in_progress: "Đang xử lý",
  done: "Đã xong",
  cancelled: "Hủy",
} as const;

function isFollowUpOverdue(
  action: Pick<Meeting["followUpActions"][number], "dueDate" | "status">,
  today: Date,
) {
  if (!action.dueDate || terminalFollowUpStatuses.has(String(action.status))) {
    return false;
  }

  return parseDateOnly(action.dueDate) < toDateOnly(today);
}

function ActionError({ state }: { state: MeetingActionState }) {
  if (state.status !== "error") {
    return null;
  }

  return (
    <div
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      role="alert"
    >
      {state.message ?? "Khong the luu thay doi."}
    </div>
  );
}

function StatusBadge({ status, ai = false }: { ai?: boolean; status: "APPROVED" | "DRAFT" }) {
  const approved = status === "APPROVED";
  const label = approved ? "Đã duyệt" : ai ? "Bản nháp AI" : "Bản nháp";

  return (
    <span
      className={
        approved
          ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800"
          : "rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800"
      }
    >
      {label}
    </span>
  );
}

function aiMeetingSummaryStatusLabel(status: AiMeetingSummary["status"]) {
  const labels: Record<AiMeetingSummary["status"], string> = {
    draft: "Goi y AI",
    insufficient_context: "Thieu context",
    placeholder: "Placeholder",
    unavailable: "Tam thoi unavailable",
  };

  return labels[status];
}

function AiMeetingSummaryContext({
  summary,
}: {
  summary?: AiMeetingSummary;
}) {
  if (!summary) {
    return null;
  }

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{aiMeetingSummaryStatusLabel(summary.status)}</p>
        <p className="text-xs text-amber-800">
          Generated: {formatDateTime(summary.updatedAt)}
        </p>
      </div>
      {summary.status !== "draft" ? (
        <p className="mt-2 whitespace-pre-line text-sm leading-6">
          {summary.text}
        </p>
      ) : null}
      {summary.citations.length > 0 ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
            Citations
          </p>
          <ul className="space-y-2">
            {summary.citations.map((citation) => (
              <li
                className="rounded-md bg-white/70 px-3 py-2 text-xs text-slate-700"
                key={citation.id}
              >
                {citation.href ? (
                  <Link
                    className="font-medium text-emerald-700 hover:text-emerald-800"
                    href={citation.href}
                  >
                    {citation.title}
                  </Link>
                ) : (
                  <span className="font-medium text-slate-900">
                    {citation.title}
                  </span>
                )}
                <span className="ml-2 text-slate-500">
                  {citation.sourceType}:{citation.sourceId}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {summary.actionProposals.length > 0 ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
            Action proposal preview
          </p>
          <ul className="space-y-2">
            {summary.actionProposals.map((proposal) => (
              <li
                className="rounded-md border border-amber-200 bg-white px-3 py-2 text-xs text-slate-700"
                key={proposal.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-950">
                      {proposal.previewTitle}
                    </p>
                    <p className="mt-1 text-slate-500">
                      {proposal.targetEntityType}:{proposal.targetEntityId} -{" "}
                      {proposal.status}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">
                    {proposal.requiredPermission}
                  </span>
                </div>
                {proposal.affectedFields.length > 0 ? (
                  <p className="mt-2 text-slate-600">
                    Fields: {proposal.affectedFields.join(", ")}
                  </p>
                ) : null}
                {proposal.sourceCitationIds.length > 0 ? (
                  <p className="mt-1 text-slate-600">
                    Citations: {proposal.sourceCitationIds.join(", ")}
                  </p>
                ) : null}
                <Link
                  className="mt-2 inline-flex text-xs font-medium text-emerald-700 underline"
                  href={`/ai/proposals/${proposal.id}`}
                >
                  Mo trang duyet de xuat AI
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function MeetingMinutesPanel({
  approveAction,
  canUpdate,
  meeting,
  updateAction,
}: MeetingMinutesPanelProps) {
  const [updateState, updateFormAction, isUpdating] = useActionState(
    updateAction,
    initialPanelActionState,
  );
  const [approveState, approveFormAction, isApproving] = useActionState(
    approveAction,
    initialPanelActionState,
  );
  const approval = meeting.meetingMinutesApproval ?? { status: "DRAFT" as const };

  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
            <FileText className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            Biên bản chính thức
          </h2>
          {approval.status === "APPROVED" && approval.approvedBy ? (
            <p className="mt-2 text-xs text-slate-500">
              Duyệt bởi {approval.approvedBy}
              {approval.approvedAt ? ` · ${formatDateTime(approval.approvedAt)}` : ""}
            </p>
          ) : null}
        </div>
        <StatusBadge status={approval.status} />
      </div>

      {canUpdate ? (
        <div className="mt-4 space-y-4">
          <form action={updateFormAction} className="space-y-3">
            <ActionError state={updateState} />
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-800"
                htmlFor="meetingMinutes"
              >
                Meeting minutes chính thức
              </label>
              <textarea
                className={fieldClass}
                defaultValue={meeting.meetingMinutes ?? ""}
                id="meetingMinutes"
                name="meetingMinutes"
                rows={7}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-800"
                htmlFor="summary"
              >
                Tóm tắt an toàn
              </label>
              <textarea
                className={fieldClass}
                defaultValue={meeting.summary ?? ""}
                id="summary"
                name="summary"
                rows={3}
              />
            </div>
            <Button disabled={isUpdating} type="submit">
              {isUpdating ? "Đang lưu..." : "Lưu biên bản"}
            </Button>
          </form>
          <form action={approveFormAction} className="space-y-3">
            <ActionError state={approveState} />
            <Button disabled={isApproving} type="submit" variant="outline">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Duyệt biên bản
            </Button>
          </form>
        </div>
      ) : (
        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700">
          {meeting.meetingMinutes ?? meeting.summary ?? "Chưa có biên bản."}
        </p>
      )}
    </section>
  );
}

export function MeetingAttachmentsPanel({
  addAction,
  canUpdate,
  meeting,
  removeAction,
}: MeetingAttachmentsPanelProps) {
  const [addState, addFormAction, isAdding] = useActionState(
    addAction,
    initialPanelActionState,
  );
  const [removeState, removeFormAction, isRemoving] = useActionState(
    removeAction,
    initialPanelActionState,
  );

  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
          <Paperclip className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          Attachments
        </h2>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
          {meeting.attachments.length}
        </span>
      </div>

      {meeting.attachments.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {meeting.attachments.map((attachment) => (
            <li
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm"
              key={attachment.id}
            >
              <div>
                {attachment.url ? (
                  <a
                    className="font-medium text-emerald-700 hover:text-emerald-800"
                    href={attachment.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {attachment.name}
                  </a>
                ) : attachment.documentId ? (
                  <Link
                    className="font-medium text-emerald-700 hover:text-emerald-800"
                    href={`/documents/${attachment.documentId}`}
                  >
                    {attachment.name}
                  </Link>
                ) : (
                  <span className="font-medium text-slate-900">
                    {attachment.name}
                  </span>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  {attachment.documentId
                    ? `Document: ${attachment.documentId}`
                    : "External URL"}
                </p>
              </div>
              {canUpdate ? (
                <form action={removeFormAction}>
                  <input
                    name="attachmentId"
                    type="hidden"
                    value={attachment.id}
                  />
                  <Button
                    aria-label={`Gỡ ${attachment.name}`}
                    disabled={isRemoving}
                    type="submit"
                    variant="outline"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Gỡ
                  </Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          Chưa có attachment trong scope được phép xem.
        </p>
      )}

      {canUpdate ? (
        <form action={addFormAction} className="mt-4 space-y-3">
          <ActionError state={addState.status === "error" ? addState : removeState} />
          <p className="text-xs text-slate-500">
            Chỉ hỗ trợ external URL hoặc documentId. Upload file thật sẽ được
            triển khai ở story storage riêng.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800" htmlFor="name">
                Tên attachment
              </label>
              <input className={fieldClass} id="name" name="name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800" htmlFor="url">
                External URL
              </label>
              <input className={fieldClass} id="url" name="url" type="url" />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-800"
                htmlFor="documentId"
              >
                Document ID
              </label>
              <input className={fieldClass} id="documentId" name="documentId" />
            </div>
          </div>
          <Button disabled={isAdding} type="submit">
            {isAdding ? "Đang thêm..." : "Thêm attachment"}
          </Button>
        </form>
      ) : null}
    </section>
  );
}

export function MeetingFollowUpActionsPanel({
  addAction,
  canCreateTask,
  canUpdate,
  createTaskAction,
  followUpActions,
  needsTaskProjectInput,
  today = new Date(),
  updateStatusAction,
  visibleTaskLinks,
}: MeetingFollowUpActionsPanelProps) {
  const [addState, addFormAction, isAdding] = useActionState(
    addAction,
    initialPanelActionState,
  );
  const [createTaskState, createTaskFormAction, isCreatingTask] =
    useActionState(createTaskAction, initialPanelActionState);
  const [statusState, statusFormAction, isUpdatingStatus] = useActionState(
    updateStatusAction,
    initialPanelActionState,
  );
  const taskLinkById = new Map(visibleTaskLinks.map((task) => [task.id, task]));

  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
          <ListChecks className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          Follow-up actions
        </h2>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
          {followUpActions.length}
        </span>
      </div>

      {followUpActions.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {followUpActions.map((action) => {
            const relatedTask = action.relatedTaskId
              ? taskLinkById.get(action.relatedTaskId)
              : undefined;
            const hasRelatedTask = Boolean(
              action.relatedTaskId || action.hasHiddenRelatedTask,
            );
            const overdue = isFollowUpOverdue(action, today);

            return (
              <li
                className="rounded-md border border-slate-200 px-3 py-3 text-sm"
                key={action.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-950">{action.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Owner: {action.ownerId ?? "-"} Â· Deadline:{" "}
                      {action.dueDate ? formatDateOnly(action.dueDate) : "-"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {followUpStatusLabels[action.status ?? "open"]}
                    </span>
                    {overdue ? (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                        Quá hạn
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  {action.relatedTaskId ? (
                    relatedTask ? (
                      <Link
                        className="font-medium text-emerald-700 hover:text-emerald-800"
                        href={relatedTask.href}
                      >
                        {relatedTask.title}
                      </Link>
                    ) : (
                      <span>Task liên kết ngoài phạm vi hiển thị</span>
                    )
                  ) : action.hasHiddenRelatedTask ? (
                    <span>Task liên kết ngoài phạm vi hiển thị</span>
                  ) : (
                    <span>Chưa có task liên kết</span>
                  )}
                </div>

                {canUpdate ? (
                  <div className="mt-3 flex flex-wrap gap-3">
                    <form action={statusFormAction} className="flex flex-wrap items-end gap-2">
                      <input name="followUpActionId" type="hidden" value={action.id} />
                      <label className="space-y-1 text-xs font-medium text-slate-700">
                        <span>Trạng thái follow-up</span>
                        <select
                          aria-label="Trạng thái follow-up"
                          className="rounded-md border border-slate-300 px-2 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                          defaultValue={action.status ?? "open"}
                          name="status"
                        >
                          {Object.entries(followUpStatusLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Button disabled={isUpdatingStatus} type="submit" variant="outline">
                        Cập nhật
                      </Button>
                    </form>

                    {canCreateTask && !hasRelatedTask ? (
                      <form action={createTaskFormAction} className="flex flex-wrap items-end gap-2">
                        <input name="followUpActionId" type="hidden" value={action.id} />
                        {needsTaskProjectInput ? (
                          <label className="space-y-1 text-xs font-medium text-slate-700">
                            <span>Dự án task</span>
                            <input
                              className="rounded-md border border-slate-300 px-2 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                              name="taskProjectId"
                            />
                          </label>
                        ) : null}
                        <Button disabled={isCreatingTask} type="submit" variant="outline">
                          Tạo task
                        </Button>
                      </form>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          Chưa có follow-up action sau họp.
        </p>
      )}

      {canUpdate ? (
        <form action={addFormAction} className="mt-4 space-y-3">
          <ActionError
            state={
              addState.status === "error"
                ? addState
                : createTaskState.status === "error"
                  ? createTaskState
                  : statusState
            }
          />
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <label
                className="text-sm font-medium text-slate-800"
                htmlFor="followUpTitle"
              >
                Tiêu đề follow-up
              </label>
              <input
                className={fieldClass}
                id="followUpTitle"
                name="title"
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-800"
                htmlFor="ownerId"
              >
                Owner
              </label>
              <input className={fieldClass} id="ownerId" name="ownerId" />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-800"
                htmlFor="dueDate"
              >
                Deadline
              </label>
              <input className={fieldClass} id="dueDate" name="dueDate" type="date" />
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="space-y-2 text-sm font-medium text-slate-800">
              <span>Status</span>
              <select className={fieldClass} defaultValue="open" name="status">
                {Object.entries(followUpStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {canCreateTask ? (
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
                <input
                  className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                  name="createRelatedTask"
                  type="checkbox"
                />
                Tạo task liên kết
              </label>
            ) : null}
            {canCreateTask && needsTaskProjectInput ? (
              <label className="space-y-2 text-sm font-medium text-slate-800">
                <span>Dự án task</span>
                <input className={fieldClass} name="taskProjectId" />
              </label>
            ) : null}
            <Button disabled={isAdding} type="submit">
              {isAdding ? "Đang thêm..." : "Thêm follow-up"}
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

export function MeetingDecisionTrackingPanel({
  createDecisionAction,
  data,
  linkDecisionAction,
}: MeetingDecisionTrackingPanelProps) {
  const [createState, createFormAction, isCreating] = useActionState(
    createDecisionAction,
    initialPanelActionState,
  );
  const [linkState, linkFormAction, isLinking] = useActionState(
    linkDecisionAction,
    initialPanelActionState,
  );
  const canMutate =
    data.permissions.canCreateDecision || data.permissions.canLinkDecision;

  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
          <GitBranch className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          Decision tracking sau họp
        </h2>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
          {data.items.length}
        </span>
      </div>

      {data.items.length > 0 ? (
        <ul className="mt-4 space-y-4">
          {data.items.map((item) => (
            <li
              className="rounded-md border border-slate-200 px-3 py-3 text-sm"
              key={item.decisionId}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    className="font-medium text-emerald-700 hover:text-emerald-800"
                    href={item.decisionHref}
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">
                    Owner: {item.ownerId ?? "-"} · Deadline:{" "}
                    {item.dueDate ? formatDateOnly(item.dueDate) : "-"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DecisionStatusBadge status={item.status} />
                  {item.priority ? (
                    <TaskPriorityBadge priority={item.priority} />
                  ) : null}
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {item.relation === "source" ? "Source" : "Context"}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                  {item.assignmentCount} assignment
                </span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                  {item.openAssignmentCount} đang mở
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                  {item.dueSoonAssignmentCount} sap den han
                </span>
                <span className="rounded-full bg-red-50 px-2.5 py-1 font-medium text-red-700">
                  {item.overdueAssignmentCount} quá hạn
                </span>
              </div>

              {item.assignments.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-medium text-slate-900">
                    Assignments
                  </h3>
                  <ul className="space-y-2">
                    {item.assignments.map((assignment) => (
                      <li
                        className="rounded-md bg-slate-50 px-3 py-2"
                        key={assignment.assignmentId}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900">
                              {assignment.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Project: {assignment.projectId} · Assignee:{" "}
                              {assignment.assigneeId ?? "-"} · Deadline:{" "}
                              {assignment.dueDate
                                ? formatDateOnly(assignment.dueDate)
                                : "-"}
                            </p>
                            {assignment.kpi ? (
                              <p className="mt-1 text-xs text-slate-600">
                                KPI: {assignment.kpi}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <TaskPriorityBadge priority={assignment.priority} />
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {assignmentStatusLabels[assignment.status]}
                            </span>
                            {assignment.executionStatus ? (
                              <TaskStatusBadge
                                status={assignment.executionStatus}
                              />
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-slate-600">
                          {assignment.taskHref && assignment.taskTitle ? (
                            <Link
                              className="font-medium text-emerald-700 hover:text-emerald-800"
                              href={assignment.taskHref}
                            >
                              {assignment.taskTitle}
                            </Link>
                          ) : assignment.hasHiddenTask ? (
                            <span>
                              Task liên kết ngoài phạm vi hiển thị
                            </span>
                          ) : (
                            <span>Chưa có task thực thi liên kết</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {item.history.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-medium text-slate-900">
                    Lịch sử thay đổi
                  </h3>
                  <DecisionHistoryTimeline events={item.history} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          Chưa có official decision nào được liên kết với cuộc họp này.
        </p>
      )}

      {canMutate ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {data.permissions.canCreateDecision ? (
            <form action={createFormAction} className="space-y-3">
              <ActionError state={createState} />
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-slate-800"
                  htmlFor="decisionText"
                >
                  Nội dung quyết định
                </label>
                <textarea
                  className={fieldClass}
                  defaultValue={String(
                    createState.values?.decisionText ?? "",
                  )}
                  id="decisionText"
                  name="decisionText"
                  rows={4}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="space-y-2 text-sm font-medium text-slate-800">
                  <span>Owner</span>
                  <input
                    className={fieldClass}
                    defaultValue={String(createState.values?.ownerId ?? "")}
                    name="ownerId"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-800">
                  <span>Deadline</span>
                  <input
                    className={fieldClass}
                    defaultValue={String(createState.values?.dueDate ?? "")}
                    name="dueDate"
                    type="date"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-800">
                  <span>Status</span>
                  <select
                    className={fieldClass}
                    defaultValue={String(createState.values?.status ?? "open")}
                    name="status"
                  >
                    <option value="open">Chưa xử lý</option>
                    <option value="in_progress">Đang xử lý</option>
                    <option value="done">Đã xong</option>
                    <option value="cancelled">Hủy</option>
                  </select>
                </label>
              </div>
              <Button disabled={isCreating} type="submit">
                <Plus className="h-4 w-4" aria-hidden="true" />
                {isCreating ? "Đang tạo..." : "Tạo decision"}
              </Button>
            </form>
          ) : null}

          {data.permissions.canLinkDecision ? (
            <form action={linkFormAction} className="space-y-3">
              <ActionError state={linkState} />
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-slate-800"
                  htmlFor="decisionId"
                >
                  Decision ID cần liên kết
                </label>
                <input
                  className={fieldClass}
                  defaultValue={String(linkState.values?.decisionId ?? "")}
                  id="decisionId"
                  name="decisionId"
                />
              </div>
              <Button disabled={isLinking} type="submit" variant="outline">
                <Link2 className="h-4 w-4" aria-hidden="true" />
                {isLinking ? "Đang liên kết..." : "Liên kết decision"}
              </Button>
            </form>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function MeetingAiSummaryPanel({
  aiMeetingSummary,
  approveAction,
  canUpdate,
  generateAction,
  meeting,
  returnToHref,
  updateDraftAction,
}: MeetingAiSummaryPanelProps) {
  const [generateState, generateFormAction, isGenerating] = useActionState(
    generateAction,
    initialPanelActionState,
  );
  const [draftState, draftFormAction, isUpdatingDraft] = useActionState(
    updateDraftAction,
    initialPanelActionState,
  );
  const [approveState, approveFormAction, isApproving] = useActionState(
    approveAction,
    initialPanelActionState,
  );

  return (
    <section
      className="rounded-lg border bg-white p-5 shadow-sm"
      data-testid="meeting-ai-summary-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
            <Sparkles className="h-4 w-4 text-amber-700" aria-hidden="true" />
            AI summary
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            AI chỉ là gợi ý cho tới khi người có quyền duyệt.
          </p>
        </div>
        <StatusBadge ai status={meeting.aiSummary.status} />
      </div>

      {canUpdate ? (
        <div className="mt-4 space-y-4">
          <form action={generateFormAction} className="space-y-3">
            <ActionError state={generateState} />
            {returnToHref ? (
              <input name="returnTo" type="hidden" value={returnToHref} />
            ) : null}
            <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <input
                className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                name="createActionProposal"
                type="checkbox"
              />
              De xuat action item neu AI thay can follow-up
            </label>
            <Button disabled={isGenerating} type="submit" variant="outline">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {isGenerating ? "Dang tao draft AI..." : "Tao ban nhap AI"}
            </Button>
          </form>
          <AiMeetingSummaryContext summary={aiMeetingSummary} />
          <form action={draftFormAction} className="space-y-3">
            <ActionError state={draftState} />
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-800"
                htmlFor="content"
              >
                AI summary draft
              </label>
              <textarea
                className={fieldClass}
                defaultValue={meeting.aiSummary.content ?? ""}
                id="content"
                name="content"
                rows={5}
              />
            </div>
            <Button disabled={isUpdatingDraft} type="submit">
              {isUpdatingDraft ? "Đang lưu..." : "Lưu draft AI"}
            </Button>
          </form>
          {meeting.aiSummary.status === "DRAFT" &&
          meeting.aiSummary.content?.trim() ? (
            <form action={approveFormAction} className="space-y-3">
            <ActionError state={approveState} />
            <Button disabled={isApproving} type="submit" variant="outline">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Duyệt AI summary
            </Button>
            </form>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {meeting.aiSummary.content ||
          !aiMeetingSummary ||
          aiMeetingSummary.status === "draft" ? (
            <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
              {meeting.aiSummary.content ??
                aiMeetingSummary?.text ??
                "AI summary thật chưa triển khai. Nội dung AI luôn là draft cho tới khi được duyệt."}
            </p>
          ) : null}
          <AiMeetingSummaryContext summary={aiMeetingSummary} />
        </div>
      )}
    </section>
  );
}
