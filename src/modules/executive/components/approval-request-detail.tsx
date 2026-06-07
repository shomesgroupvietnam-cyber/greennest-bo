import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  ExternalLink,
  FileText,
  Paperclip,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import React, { type ReactNode } from "react";

import type {
  ApprovalDeadlineCompliance,
  ApprovalCenterDetailData,
  ApprovalCenterDetailHistoryItem,
  ApprovalCenterDetailSource,
  ApprovalCenterFinancialAccess,
} from "@/modules/executive/types";
import { AiApprovalAssistantPanel } from "@/modules/ai/components/ai-approval-assistant-panel";

import { ApprovalActionPanel } from "./approval-action-panel";
import { ApprovalDecisionEntryPanel } from "./approval-decision-entry-panel";

const financeLabels: Record<ApprovalCenterFinancialAccess, string> = {
  allowed: "Tài chính được hiển thị",
  no_permission: "Tài chính bị giới hạn quyền",
  not_applicable: "Không có dữ liệu tài chính",
};

const deadlineComplianceLabels: Record<ApprovalDeadlineCompliance, string> = {
  invalid: "Deadline khong hop le",
  missing_required: "Thieu deadline",
  not_applicable: "Khong can deadline",
  valid: "Deadline hop le",
};

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(date);
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "emerald" | "amber" | "blue" | "red" | "slate";
}) {
  const classes = {
    amber: "bg-amber-50 text-amber-800",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${classes[tone]}`}>
      {children}
    </span>
  );
}

function historyKindLabel(kind: ApprovalCenterDetailHistoryItem["kind"]) {
  switch (kind) {
    case "attachment":
      return "File dinh kem";
    case "audit":
      return "Kiểm toán";
    case "decision":
      return "Quyết định";
    case "link":
      return "Liên kết";
    case "step":
      return "Bước duyệt";
    case "version":
      return "Phiên bản";
  }
}

function historyKindTone(kind: ApprovalCenterDetailHistoryItem["kind"]) {
  switch (kind) {
    case "attachment":
      return "blue";
    case "audit":
      return "amber";
    case "decision":
      return "emerald";
    case "link":
      return "slate";
    case "step":
      return "blue";
    case "version":
      return "slate";
  }
}

function transitionText(previous?: string, next?: string) {
  if (!previous && !next) {
    return undefined;
  }

  if (previous && next && previous !== next) {
    return `${previous} -> ${next}`;
  }

  return previous ?? next;
}

function HistoryTimelineItem({
  item,
}: {
  item: ApprovalCenterDetailHistoryItem;
}) {
  const proposalTransition = transitionText(item.previousStatus, item.nextStatus);
  const stepTransition = transitionText(
    item.previousStepStatus,
    item.nextStepStatus,
  );

  return (
    <article
      className="rounded-md border bg-slate-50 p-3 focus-within:ring-2 focus-within:ring-emerald-600"
      tabIndex={0}
    >
      <div className="flex flex-wrap gap-2">
        <Badge tone={historyKindTone(item.kind)}>{historyKindLabel(item.kind)}</Badge>
        {item.attachmentIds?.length ? (
          <Badge tone="blue">File {item.attachmentIds.length}</Badge>
        ) : null}
        {item.version ? <Badge tone="blue">Phiên bản {item.version}</Badge> : null}
        {item.auditLogId ? <Badge>Nhật ký kiểm toán</Badge> : null}
      </div>
      <h3 className="mt-3 break-words text-sm font-semibold text-slate-950">
        {item.label}
      </h3>
      <p className="mt-1 break-words text-xs text-slate-500">
        {item.actorId ?? "system"} - {formatDateTime(item.occurredAt)}
      </p>
      {proposalTransition ? (
        <p className="mt-2 break-words text-sm text-slate-700">
          <span className="font-medium text-slate-500">Trạng thái:</span>{" "}
          {proposalTransition}
        </p>
      ) : null}
      {stepTransition ? (
        <p className="mt-1 break-words text-sm text-slate-700">
          <span className="font-medium text-slate-500">Bước duyệt:</span>{" "}
          {stepTransition}
        </p>
      ) : null}
      {item.notes ? (
        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">
          {item.notes}
        </p>
      ) : null}
    </article>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-slate-950">
        {value || "-"}
      </dd>
    </div>
  );
}

function AttachmentSection({ detail }: { detail: ApprovalCenterDetailData }) {
  return (
    <section
      aria-label="File dinh kem"
      className="space-y-3 rounded-lg border bg-slate-50 p-5"
    >
      <div className="flex items-center gap-2">
        <Paperclip className="h-5 w-5 text-emerald-700" aria-hidden="true" />
        <h2 className="text-base font-semibold text-slate-950">
          File dinh kem
        </h2>
      </div>
      {detail.attachments.length > 0 ? (
        detail.attachments.map((attachment) => (
          <div
            className="rounded-lg border bg-white p-4 shadow-sm"
            key={attachment.id}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <Badge tone={attachment.state === "linked" ? "emerald" : "slate"}>
                    {attachment.state === "linked" ? "Da lien ket" : "Chi xem"}
                  </Badge>
                  <Badge>{attachment.source}</Badge>
                </div>
                <h3 className="mt-3 break-words text-sm font-semibold text-slate-950">
                  {attachment.name}
                </h3>
                <p className="mt-1 break-words text-sm text-slate-500">
                  {attachment.helper}
                </p>
              </div>
              {attachment.href ? (
                <a
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  href={attachment.href}
                >
                  Mo file {attachment.name}
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>
        ))
      ) : (
        <p className="rounded-lg border bg-white p-4 text-sm text-slate-500">
          Chua co file dinh kem.
        </p>
      )}
    </section>
  );
}

function SourceLink({ source }: { source: ApprovalCenterDetailSource }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Badge tone={source.state === "linked" ? "emerald" : "slate"}>
              {source.state === "linked" ? "Đã liên kết" : "Chỉ xem"}
            </Badge>
            <Badge>{source.relationType}</Badge>
          </div>
          <h3 className="mt-3 break-words text-sm font-semibold text-slate-950">
            {source.label}
          </h3>
          <p className="mt-1 break-words text-sm text-slate-500">
            {source.helper}
          </p>
        </div>
        {source.href ? (
          <Link
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            href={source.href}
          >
            Mở nguồn {source.label}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function escalationTargetLabel(kind: string) {
  switch (kind) {
    case "current_approver":
      return "Người duyệt hiện tại";
    case "proposer":
      return "Người đề xuất";
    case "owner":
      return "Người phụ trách";
    case "delegate":
      return "Thư ký/Trợ lý";
    case "policy_escalation":
      return "Người nhận theo chính sách";
    default:
      return kind;
  }
}

function OverdueEscalationSection({
  detail,
}: {
  detail: ApprovalCenterDetailData;
}) {
  if (!detail.overdue && !detail.escalation) {
    return null;
  }

  return (
    <section
      aria-label="Quá hạn và leo thang"
      className="rounded-lg border bg-white p-5 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-700" aria-hidden="true" />
        <h2 className="text-base font-semibold text-slate-950">
          Quá hạn và leo thang
        </h2>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {detail.overdue ? (
          <>
            <Badge tone={detail.overdue.severity === "critical" ? "red" : "amber"}>
              {detail.overdue.severity}
            </Badge>
            <Badge tone={detail.overdue.isOverdue ? "red" : "slate"}>
              {detail.overdue.isOverdue
                ? `Quá hạn ${detail.overdue.daysOverdue} ngày`
                : "Chưa quá hạn"}
            </Badge>
          </>
        ) : null}
        {detail.escalation?.required ? (
          <Badge tone="red">{detail.escalation.trigger}</Badge>
        ) : (
          <Badge>Không cần leo thang</Badge>
        )}
      </div>
      <dl className="mt-4 grid gap-4 md:grid-cols-2">
        <DetailRow label="Người phụ trách" value={detail.overdue?.ownerLabel} />
        <DetailRow label="Lý do" value={detail.escalation?.reason ?? detail.overdue?.reason} />
        <DetailRow label="Hành động tiếp theo" value={detail.overdue?.nextAction} />
        <DetailRow label="Chính sách" value={detail.escalation?.policyLabel ?? detail.policy?.thresholdLabel} />
        <DetailRow label="Ngưỡng ngày" value={detail.escalation?.thresholdDays?.toString()} />
        <DetailRow label="Thông báo mẫu" value={detail.escalation?.notificationId ?? detail.escalation?.status} />
      </dl>
      {detail.escalation?.targets.length ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold text-slate-950">Người nhận</p>
          <div className="space-y-2">
            {detail.escalation.targets.map((target) => (
              <div
                className="rounded-md border bg-slate-50 p-3 text-sm"
                key={`${target.kind}-${target.userId ?? target.roleKey ?? target.delegationId}`}
              >
                <p className="text-xs font-semibold uppercase text-slate-500">
                  {escalationTargetLabel(target.kind)}
                </p>
                <p className="mt-1 font-semibold text-slate-950">
                  {target.label}
                </p>
                <p className="mt-1 break-words text-xs text-slate-500">
                  {[target.userId, target.roleKey, target.delegationId]
                    .filter(Boolean)
                    .join(" - ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function ApprovalRequestDetail({
  detail,
}: {
  detail: ApprovalCenterDetailData;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          href={detail.backHref}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Trung Tâm Phê Duyệt
        </Link>
        <span className="text-sm text-slate-500">
          Tạo lúc {formatDateTime(detail.generatedAt)}
        </span>
      </div>

      <header className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-700">
              {detail.source.code}
            </p>
            <h1 className="mt-2 break-words text-2xl font-semibold text-slate-950">
              {detail.source.title}
            </h1>
            {detail.requestSummary.summary ? (
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                {detail.requestSummary.summary}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Badge tone="blue">{detail.source.categoryLabel}</Badge>
            <Badge tone="emerald">{detail.source.statusLabel}</Badge>
            <Badge tone={detail.requestSummary.deadlineCompliance === "valid" ? "slate" : "amber"}>
              {deadlineComplianceLabels[detail.requestSummary.deadlineCompliance]}
            </Badge>
            <Badge tone={detail.requestSummary.financialAccess === "no_permission" ? "amber" : "slate"}>
              {financeLabels[detail.requestSummary.financialAccess]}
            </Badge>
          </div>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section
            aria-label="Tóm tắt yêu cầu"
            className="rounded-lg border bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              <h2 className="text-base font-semibold text-slate-950">
                Tóm tắt yêu cầu
              </h2>
            </div>
            <dl className="mt-4 grid gap-4 md:grid-cols-2">
              <DetailRow label="Phạm vi" value={detail.requestSummary.scopeLabel} />
              <DetailRow label="Dự án" value={detail.requestSummary.projectName ?? detail.requestSummary.projectId} />
              <DetailRow label="Module" value={detail.requestSummary.module} />
              <DetailRow label="Người đề xuất" value={detail.requestSummary.proposer} />
              <DetailRow label="Người gửi" value={detail.requestSummary.submittedBy} />
              <DetailRow label="Người phụ trách" value={detail.requestSummary.ownerName} />
              <DetailRow label="Mức ưu tiên" value={detail.requestSummary.priority} />
              <DetailRow label="Hạn xử lý" value={formatDate(detail.requestSummary.dueDate)} />
              <DetailRow label="Giá trị" value={detail.requestSummary.amountLabel ?? financeLabels[detail.requestSummary.financialAccess]} />
            </dl>
          </section>

          <OverdueEscalationSection detail={detail} />

          <AttachmentSection detail={detail} />

          <section
            aria-label="Nguồn liên quan"
            className="space-y-3 rounded-lg border bg-slate-50 p-5"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              <h2 className="text-base font-semibold text-slate-950">
                Nguồn liên quan
              </h2>
            </div>
            {detail.linkedSources.length > 0 ? (
              detail.linkedSources.map((source) => (
                <SourceLink key={source.id} source={source} />
              ))
            ) : (
              <p className="rounded-lg border bg-white p-4 text-sm text-slate-500">
                Không có nguồn liên quan trong yêu cầu này.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          {detail.aiAssistant ? (
            <AiApprovalAssistantPanel assistant={detail.aiAssistant} />
          ) : null}

          <ApprovalActionPanel detail={detail} />

          <ApprovalDecisionEntryPanel entryPoint={detail.decisionEntryPoint} />

          <section
            aria-label="Chính sách"
            className="rounded-lg border bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              <h2 className="text-base font-semibold text-slate-950">Chính sách</h2>
            </div>
            {detail.policy ? (
              <dl className="mt-4 space-y-3">
                <DetailRow label="Ngưỡng duyệt" value={detail.policy.thresholdLabel} />
                <DetailRow label="Cấp duyệt" value={detail.policy.approvalLevel} />
                <DetailRow label="Vai trò duyệt" value={detail.policy.approverRole} />
                <DetailRow label="Quyền bắt buộc" value={detail.policy.requiredPermission} />
                <DetailRow label="Trạng thái bước" value={detail.policy.status} />
              </dl>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Chưa có bước chính sách.</p>
            )}
          </section>

          <section
            aria-label="Lịch sử và kiểm toán"
            className="rounded-lg border bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              <h2 className="text-base font-semibold text-slate-950">
                Lịch sử / Kiểm toán
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {!detail.permissions.canViewAudit ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  Sự kiện kiểm toán bị ẩn theo quyền.
                </p>
              ) : null}
              {detail.history.length > 0 ? (
                detail.history.map((item) => (
                  <HistoryTimelineItem item={item} key={item.id} />
                ))
              ) : (
                <p className="text-sm text-slate-500">Chưa có lịch sử hiện có.</p>
              )}
            </div>
          </section>

        </aside>
      </div>
    </div>
  );
}
