import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  ExternalLink,
  FileText,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import React, { type ReactNode } from "react";

import type {
  ApprovalCenterDetailData,
  ApprovalCenterDetailHistoryItem,
  ApprovalCenterDetailSource,
  ApprovalCenterFinancialAccess,
} from "@/modules/executive/types";
import { AiApprovalAssistantPanel } from "@/modules/ai/components/ai-approval-assistant-panel";

import { ApprovalActionPanel } from "./approval-action-panel";

const financeLabels: Record<ApprovalCenterFinancialAccess, string> = {
  allowed: "Tai chinh duoc hien thi",
  no_permission: "Tai chinh han che quyen",
  not_applicable: "Khong co du lieu tai chinh",
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
    case "audit":
      return "Audit";
    case "decision":
      return "Decision";
    case "link":
      return "Link";
    case "step":
      return "Step";
    case "version":
      return "Version";
  }
}

function historyKindTone(kind: ApprovalCenterDetailHistoryItem["kind"]) {
  switch (kind) {
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
        {item.version ? <Badge tone="blue">Version {item.version}</Badge> : null}
        {item.auditLogId ? <Badge>Audit log</Badge> : null}
      </div>
      <h3 className="mt-3 break-words text-sm font-semibold text-slate-950">
        {item.label}
      </h3>
      <p className="mt-1 break-words text-xs text-slate-500">
        {item.actorId ?? "system"} - {formatDateTime(item.occurredAt)}
      </p>
      {proposalTransition ? (
        <p className="mt-2 break-words text-sm text-slate-700">
          <span className="font-medium text-slate-500">Status:</span>{" "}
          {proposalTransition}
        </p>
      ) : null}
      {stepTransition ? (
        <p className="mt-1 break-words text-sm text-slate-700">
          <span className="font-medium text-slate-500">Step:</span>{" "}
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

function SourceLink({ source }: { source: ApprovalCenterDetailSource }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Badge tone={source.state === "linked" ? "emerald" : "slate"}>
              {source.state === "linked" ? "Linked" : "Read-only placeholder"}
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
            Mo source {source.label}
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
      return "Nguoi duyet hien tai";
    case "proposer":
      return "Nguoi de xuat";
    case "owner":
      return "Owner";
    case "delegate":
      return "Thu ky/Tro ly";
    case "policy_escalation":
      return "Policy target";
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
      aria-label="Overdue and escalation"
      className="rounded-lg border bg-white p-5 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-700" aria-hidden="true" />
        <h2 className="text-base font-semibold text-slate-950">
          Overdue and escalation
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
                ? `Qua han ${detail.overdue.daysOverdue} ngay`
                : "Chua qua han"}
            </Badge>
          </>
        ) : null}
        {detail.escalation?.required ? (
          <Badge tone="red">{detail.escalation.trigger}</Badge>
        ) : (
          <Badge>Khong can escalation</Badge>
        )}
      </div>
      <dl className="mt-4 grid gap-4 md:grid-cols-2">
        <DetailRow label="Owner" value={detail.overdue?.ownerLabel} />
        <DetailRow label="Reason" value={detail.escalation?.reason ?? detail.overdue?.reason} />
        <DetailRow label="Next action" value={detail.overdue?.nextAction} />
        <DetailRow label="Policy" value={detail.escalation?.policyLabel ?? detail.policy?.thresholdLabel} />
        <DetailRow label="Threshold days" value={detail.escalation?.thresholdDays?.toString()} />
        <DetailRow label="Mock notification" value={detail.escalation?.notificationId ?? detail.escalation?.status} />
      </dl>
      {detail.escalation?.targets.length ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold text-slate-950">Targets</p>
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
          Approval Center
        </Link>
        <span className="text-sm text-slate-500">
          Generated {formatDateTime(detail.generatedAt)}
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
            <Badge tone={detail.requestSummary.financialAccess === "no_permission" ? "amber" : "slate"}>
              {financeLabels[detail.requestSummary.financialAccess]}
            </Badge>
          </div>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section
            aria-label="Request summary"
            className="rounded-lg border bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              <h2 className="text-base font-semibold text-slate-950">
                Request summary
              </h2>
            </div>
            <dl className="mt-4 grid gap-4 md:grid-cols-2">
              <DetailRow label="Scope" value={detail.requestSummary.scopeLabel} />
              <DetailRow label="Project" value={detail.requestSummary.projectName ?? detail.requestSummary.projectId} />
              <DetailRow label="Module" value={detail.requestSummary.module} />
              <DetailRow label="Proposer" value={detail.requestSummary.proposer} />
              <DetailRow label="Submitted by" value={detail.requestSummary.submittedBy} />
              <DetailRow label="Owner" value={detail.requestSummary.ownerName} />
              <DetailRow label="Priority" value={detail.requestSummary.priority} />
              <DetailRow label="Deadline" value={formatDate(detail.requestSummary.dueDate)} />
              <DetailRow label="Amount" value={detail.requestSummary.amountLabel ?? financeLabels[detail.requestSummary.financialAccess]} />
            </dl>
          </section>

          <OverdueEscalationSection detail={detail} />

          <section
            aria-label="Linked sources"
            className="space-y-3 rounded-lg border bg-slate-50 p-5"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              <h2 className="text-base font-semibold text-slate-950">
                Linked sources
              </h2>
            </div>
            {detail.linkedSources.length > 0 ? (
              detail.linkedSources.map((source) => (
                <SourceLink key={source.id} source={source} />
              ))
            ) : (
              <p className="rounded-lg border bg-white p-4 text-sm text-slate-500">
                Khong co linked source trong request nay.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          {detail.aiAssistant ? (
            <AiApprovalAssistantPanel assistant={detail.aiAssistant} />
          ) : null}

          <ApprovalActionPanel detail={detail} />

          <section
            aria-label="Policy"
            className="rounded-lg border bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              <h2 className="text-base font-semibold text-slate-950">Policy</h2>
            </div>
            {detail.policy ? (
              <dl className="mt-4 space-y-3">
                <DetailRow label="Threshold" value={detail.policy.thresholdLabel} />
                <DetailRow label="Approval level" value={detail.policy.approvalLevel} />
                <DetailRow label="Approver role" value={detail.policy.approverRole} />
                <DetailRow label="Required permission" value={detail.policy.requiredPermission} />
                <DetailRow label="Step status" value={detail.policy.status} />
              </dl>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Chua co policy step.</p>
            )}
          </section>

          <section
            aria-label="History and audit"
            className="rounded-lg border bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              <h2 className="text-base font-semibold text-slate-950">
                History / Audit
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {!detail.permissions.canViewAudit ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  Audit events bi an theo quyen.
                </p>
              ) : null}
              {detail.history.length > 0 ? (
                detail.history.map((item) => (
                  <HistoryTimelineItem item={item} key={item.id} />
                ))
              ) : (
                <p className="text-sm text-slate-500">Chua co history hien co.</p>
              )}
            </div>
          </section>

        </aside>
      </div>
    </div>
  );
}
