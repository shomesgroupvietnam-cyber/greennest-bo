import {
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  HelpCircle,
  Sparkles,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  acceptAiActionProposalAction,
  rejectAiActionProposalAction,
} from "@/modules/ai/actions";
import type {
  AiApprovalAssistant,
  AiApprovalAssistantActionProposal,
  AiApprovalAssistantStatus,
} from "@/modules/ai/types";

const statusLabels: Record<AiApprovalAssistantStatus, string> = {
  draft: "Draft goi y",
  insufficient_context: "Thieu context",
  unavailable: "Tam thoi khong kha dung",
};

const statusClasses: Record<AiApprovalAssistantStatus, string> = {
  draft: "bg-emerald-50 text-emerald-700",
  insufficient_context: "bg-amber-50 text-amber-800",
  unavailable: "bg-slate-100 text-slate-700",
};

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

function StatusBadge({ status }: { status: AiApprovalAssistantStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

function TextList({
  icon,
  items,
  title,
}: {
  icon: React.ReactNode;
  items: string[];
  title: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border bg-slate-50 p-3">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm font-semibold text-slate-950">{title}</p>
      </div>
      <ul className="mt-2 space-y-1 text-sm text-slate-700">
        {items.map((item) => (
          <li className="break-words" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionLabel(action: AiApprovalAssistantActionProposal["approvalAction"]) {
  return action === "request_change"
    ? "Xac nhan tra lai approval"
    : "Xac nhan yeu cau hop";
}

function returnToFor(proposal: AiApprovalAssistantActionProposal) {
  if (proposal.returnToHref) {
    return proposal.returnToHref;
  }

  return proposal.targetEntityType === "proposal" && proposal.targetEntityId
    ? `/approvals/proposal/${encodeURIComponent(proposal.targetEntityId)}`
    : undefined;
}

function ActionProposalPreview({
  proposal,
}: {
  proposal: AiApprovalAssistantActionProposal;
}) {
  const returnTo = returnToFor(proposal);

  return (
    <article className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-emerald-950">
            {proposal.previewTitle}
          </p>
          {proposal.rationale ? (
            <p className="mt-1 break-words text-xs text-emerald-900">
              {proposal.rationale}
            </p>
          ) : null}
        </div>
        <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-emerald-800">
          {proposal.status}
        </span>
      </div>
      <dl className="mt-3 space-y-2 text-xs text-emerald-950">
        <div>
          <dt className="font-semibold">Record</dt>
          <dd className="break-all">
            {proposal.targetEntityType}
            {proposal.targetEntityId ? ` / ${proposal.targetEntityId}` : ""}
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Action</dt>
          <dd>Action: {proposal.approvalAction}</dd>
        </div>
        {proposal.currentStatus || proposal.nextStatus ? (
          <div>
            <dt className="font-semibold">Status</dt>
            <dd>
              {proposal.currentStatus ?? "?"} -&gt; {proposal.nextStatus ?? "?"}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="font-semibold">Field</dt>
          <dd>Field: {proposal.affectedFields.join(", ") || "-"}</dd>
        </div>
        <div>
          <dt className="font-semibold">Permission</dt>
          <dd>Quyen can co: {proposal.requiredPermission}</dd>
        </div>
      </dl>
      {proposal.reason ? (
        <p className="mt-3 break-words rounded-md bg-white p-2 text-xs text-slate-700">
          {proposal.reason}
        </p>
      ) : null}
      {proposal.agendaDraft ? (
        <p className="mt-3 whitespace-pre-wrap break-words rounded-md bg-white p-2 text-xs text-slate-700">
          {proposal.agendaDraft}
        </p>
      ) : null}
      {proposal.sourceCitationIds.length > 0 ? (
        <p className="mt-2 break-words text-xs text-emerald-900">
          Citation: {proposal.sourceCitationIds.join(", ")}
        </p>
      ) : null}
      {proposal.status === "proposed" ? (
        <div className="mt-3 grid gap-2">
          <form action={acceptAiActionProposalAction} className="space-y-2">
            <input name="proposalId" type="hidden" value={proposal.id} />
            {returnTo ? <input name="returnTo" type="hidden" value={returnTo} /> : null}
            <label className="block text-xs font-medium text-emerald-950">
              Ghi chu xac nhan
              <textarea
                className="mt-1 min-h-16 w-full rounded-md border border-emerald-200 px-2 py-1 text-xs text-slate-950 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                name="decisionNotes"
              />
            </label>
            <Button size="sm" type="submit">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {ActionLabel(proposal.approvalAction)}
            </Button>
          </form>
          <form action={rejectAiActionProposalAction}>
            <input name="proposalId" type="hidden" value={proposal.id} />
            {returnTo ? <input name="returnTo" type="hidden" value={returnTo} /> : null}
            <Button size="sm" type="submit" variant="outline">
              <XCircle className="h-4 w-4" aria-hidden="true" />
              Tu choi de xuat AI
            </Button>
          </form>
        </div>
      ) : null}
    </article>
  );
}

export function AiApprovalAssistantPanel({
  assistant,
}: {
  assistant: AiApprovalAssistant;
}) {
  return (
    <section
      aria-label="AI Approval Assistant"
      className="rounded-lg border bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-700" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-950">
            AI Approval Assistant
          </h2>
        </div>
        <StatusBadge status={assistant.status} />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Generated {formatDateTime(assistant.updatedAt)}
      </p>
      <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
        {assistant.summaryText}
      </p>

      <div className="mt-4 space-y-3">
        <TextList
          icon={<AlertTriangle className="h-4 w-4 text-amber-700" aria-hidden="true" />}
          items={assistant.riskNotes}
          title="Risk notes"
        />
        <TextList
          icon={<FileSearch className="h-4 w-4 text-slate-700" aria-hidden="true" />}
          items={assistant.missingInformation}
          title="Missing information"
        />
        <TextList
          icon={<HelpCircle className="h-4 w-4 text-blue-700" aria-hidden="true" />}
          items={assistant.suggestedQuestions}
          title="Suggested questions"
        />
      </div>

      {assistant.citations.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-950">Citations</p>
          <ul className="mt-2 space-y-2 text-sm">
            {assistant.citations.map((citation) => (
              <li
                className="rounded-md border bg-slate-50 px-3 py-2"
                key={citation.id}
              >
                {citation.href ? (
                  <Link className="font-medium text-slate-950 underline" href={citation.href}>
                    {citation.title}
                  </Link>
                ) : (
                  <span className="font-medium text-slate-950">
                    {citation.title}
                  </span>
                )}
                <p className="mt-1 break-all text-xs text-slate-500">
                  {citation.sourceType} / {citation.sourceId}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {assistant.actionProposals.length > 0 ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-semibold text-slate-950">
            De xuat can xac nhan
          </p>
          {assistant.actionProposals.map((proposal) => (
            <ActionProposalPreview key={proposal.id} proposal={proposal} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
