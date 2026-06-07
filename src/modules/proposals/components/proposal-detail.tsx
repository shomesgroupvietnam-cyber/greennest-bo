import { Button } from "@/components/ui/button";
import {
  approveProposalAction,
  rejectProposalAction,
  requestProposalChangeAction,
  submitProposalAction
} from "@/modules/proposals/actions";
import { PROPOSAL_PRIORITIES, PROPOSAL_TYPES, type ProposalDetail as ProposalDetailType } from "@/modules/proposals/types";

import { ProposalStatusBadge } from "./proposal-status-badge";

function safeExternalAttachmentUrl(value?: string) {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = new URL(value);

    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}

function proposalAttachmentHref(attachment: ProposalDetailType["attachments"][number]) {
  if (attachment.documentId) {
    return `/documents/${encodeURIComponent(attachment.documentId)}`;
  }

  return safeExternalAttachmentUrl(attachment.externalUrl ?? attachment.url);
}

function proposalAttachmentHelper(attachment: ProposalDetailType["attachments"][number]) {
  if (attachment.documentId) {
    return "Document attachment";
  }

  return proposalAttachmentHref(attachment)
    ? "External attachment URL"
    : "Lien ket file khong hop le hoac bi an.";
}

export function ProposalDetail({
  detail,
  canSubmit,
  canRequestChange,
  canApprove
}: {
  detail: ProposalDetailType;
  canSubmit: boolean;
  canRequestChange: boolean;
  canApprove: boolean;
}) {
  const { proposal, steps, decisions, attachments } = detail;
  const hasRequiredApprovalMetadata = Boolean(proposal.dueDate) && attachments.length > 0;

  return (
    <div className="space-y-5">
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">{proposal.code}</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">{proposal.title}</h2>
          </div>
          <ProposalStatusBadge status={proposal.status} />
        </div>
        <dl className="mt-5 grid gap-4 text-sm md:grid-cols-4">
          <div>
            <dt className="text-slate-500">Loại</dt>
            <dd className="font-medium text-slate-950">{PROPOSAL_TYPES[proposal.type]}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Ưu tiên</dt>
            <dd className="font-medium text-slate-950">{PROPOSAL_PRIORITIES[proposal.priority]}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Giá trị</dt>
            <dd className="font-medium text-slate-950">{proposal.amount ? new Intl.NumberFormat("vi-VN").format(proposal.amount) : "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Dự án</dt>
            <dd className="font-medium text-slate-950">{proposal.projectId ?? "-"}</dd>
          </div>
          {proposal.onBehalfOf ? (
            <>
              <div>
                <dt className="text-slate-500">Thay lanh dao</dt>
                <dd className="font-medium text-slate-950">{proposal.onBehalfOf}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Nguoi thao tac</dt>
                <dd className="font-medium text-slate-950">{proposal.submittedBy ?? "-"}</dd>
              </div>
            </>
          ) : null}
        </dl>
        {proposal.summary ? <p className="mt-5 whitespace-pre-wrap rounded-md bg-slate-50 p-4 text-sm text-slate-700">{proposal.summary}</p> : null}
        <div className="mt-5 rounded-md border bg-slate-50 p-4 text-sm">
          <p className="font-semibold text-slate-950">File dinh kem</p>
          {attachments.length > 0 ? (
            <div className="mt-3 space-y-2">
              {attachments.map((attachment) => (
                <div className="rounded-md border bg-white p-3" key={attachment.id}>
                  <p className="font-medium text-slate-950">{attachment.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {proposalAttachmentHelper(attachment)}
                  </p>
                  {proposalAttachmentHref(attachment) ? (
                    <a
                      className="mt-2 inline-flex text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                      href={proposalAttachmentHref(attachment)}
                    >
                      Mo file dinh kem
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-slate-500">Chua co file dinh kem.</p>
          )}
          {!hasRequiredApprovalMetadata ? (
            <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
              Can co han xu ly va it nhat mot file dinh kem truoc khi trinh duyet.
            </p>
          ) : null}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {canSubmit && ["draft", "change_requested"].includes(proposal.status) ? (
            <form action={submitProposalAction}>
              <input type="hidden" name="proposalId" value={proposal.id} />
              <Button type="submit">Trình duyệt</Button>
            </form>
          ) : null}
        </div>
      </section>

      {proposal.status === "in_review" ? (
        <section className="grid gap-4 md:grid-cols-3">
          {canRequestChange ? (
            <form action={requestProposalChangeAction} className="space-y-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
              <input type="hidden" name="proposalId" value={proposal.id} />
              <label className="block text-sm font-medium text-orange-950">
                Nội dung cần chỉnh
                <textarea className="mt-2 min-h-20 w-full rounded-md border px-3 py-2 text-sm text-slate-900" name="notes" required />
              </label>
              <Button type="submit" variant="outline">Yêu cầu chỉnh sửa</Button>
            </form>
          ) : null}
          {canApprove ? (
            <form action={approveProposalAction} className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <input type="hidden" name="proposalId" value={proposal.id} />
              <label className="block text-sm font-medium text-emerald-950">
                Ghi chú duyệt
                <textarea className="mt-2 min-h-20 w-full rounded-md border px-3 py-2 text-sm text-slate-900" name="notes" />
              </label>
              <Button type="submit">Duyệt đề xuất</Button>
            </form>
          ) : null}
          {canApprove ? (
            <form action={rejectProposalAction} className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <input type="hidden" name="proposalId" value={proposal.id} />
              <label className="block text-sm font-medium text-red-950">
                Lý do từ chối
                <textarea className="mt-2 min-h-20 w-full rounded-md border px-3 py-2 text-sm text-slate-900" name="notes" required />
              </label>
              <Button type="submit" variant="outline">Từ chối</Button>
            </form>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-950">Bước duyệt</h3>
        <div className="mt-3 space-y-2 text-sm">
          {steps.map((step) => (
            <div className="rounded-md border bg-slate-50 p-3" key={step.id}>
              Bước {step.stepOrder}: {step.status} {step.approverRole ? `· vai trò ${step.approverRole}` : ""}
            </div>
          ))}
          {steps.length === 0 ? <p className="text-slate-500">Chưa trình duyệt.</p> : null}
        </div>
      </section>

      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-950">Lịch sử quyết định</h3>
        <div className="mt-3 space-y-2 text-sm">
          {decisions.map((decision) => (
            <div className="rounded-md border bg-slate-50 p-3" key={decision.id}>
              <p className="font-medium text-slate-900">{decision.decision}</p>
              <p className="text-slate-500">{decision.decidedBy} · {new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(decision.decidedAt))}</p>
              {decision.notes ? <p className="mt-1 text-slate-600">{decision.notes}</p> : null}
            </div>
          ))}
          {decisions.length === 0 ? <p className="text-slate-500">Chưa có quyết định.</p> : null}
        </div>
      </section>
    </div>
  );
}
