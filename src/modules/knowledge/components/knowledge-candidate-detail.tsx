import { CheckCircle2, Send, XCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  approveKnowledgeCandidateAction,
  rejectKnowledgeCandidateAction,
  submitKnowledgeCandidateForReviewAction
} from "@/modules/knowledge/actions";
import {
  KNOWLEDGE_CANDIDATE_SOURCE_TYPES,
  KNOWLEDGE_MODULES,
  type KnowledgeCandidate
} from "@/modules/knowledge/types";

import { KnowledgeCandidateStatusBadge } from "./knowledge-candidate-list-table";

const textareaClass =
  "min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function KnowledgeCandidateDetail({
  canApprove,
  canPromote,
  canReview,
  candidate
}: {
  canApprove: boolean;
  canPromote: boolean;
  canReview: boolean;
  candidate: KnowledgeCandidate;
}) {
  const submitAction = submitKnowledgeCandidateForReviewAction.bind(null, candidate.id);
  const approveAction = approveKnowledgeCandidateAction.bind(null, candidate.id);
  const rejectAction = rejectKnowledgeCandidateAction.bind(null, candidate.id);
  const canSubmitForReview = canPromote && candidate.status === "candidate";
  const canApprovePending = canApprove && candidate.status === "pending_review";
  const canReject = canReview && (candidate.status === "candidate" || candidate.status === "pending_review");

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">
              {KNOWLEDGE_MODULES[candidate.module]} · {KNOWLEDGE_CANDIDATE_SOURCE_TYPES[candidate.sourceType]}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">{candidate.title}</h2>
            <p className="mt-1 text-sm text-slate-600">
              Người gửi: {candidate.submittedBy} · Cập nhật: {formatDateTime(candidate.updatedAt)}
            </p>
          </div>
          <KnowledgeCandidateStatusBadge status={candidate.status} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Nội dung trích xuất</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{candidate.extractedText}</p>
          </section>

          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Quy trình promotion</h2>
            <p className="mt-1 text-sm text-slate-600">
              Candidate không được đưa vào RAG trực tiếp. Khi được duyệt, hệ thống tạo Knowledge Item ở trạng thái chờ review; item đó
              vẫn cần được duyệt và index riêng.
            </p>

            {canSubmitForReview ? (
              <form action={submitAction} className="mt-4">
                <Button type="submit" variant="outline">
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Gửi candidate review
                </Button>
              </form>
            ) : null}

            {canApprovePending ? (
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <form action={approveAction} className="space-y-3 rounded-md border border-emerald-100 bg-emerald-50/40 p-4">
                  <textarea className={textareaClass} name="notes" placeholder="Ghi chú promote vào Knowledge Center" />
                  <Button type="submit">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Promote thành Knowledge Item
                  </Button>
                </form>
                <form action={rejectAction} className="space-y-3 rounded-md border border-red-100 bg-red-50/40 p-4">
                  <textarea className={textareaClass} name="notes" placeholder="Lý do từ chối" required />
                  <Button type="submit" variant="outline">
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                    Từ chối
                  </Button>
                </form>
              </div>
            ) : null}

            {!canSubmitForReview && !canApprovePending && canReject ? (
              <form action={rejectAction} className="mt-5 space-y-3 rounded-md border border-red-100 bg-red-50/40 p-4">
                <textarea className={textareaClass} name="notes" placeholder="Lý do từ chối" required />
                <Button type="submit" variant="outline">
                  <XCircle className="h-4 w-4" aria-hidden="true" />
                  Từ chối
                </Button>
              </form>
            ) : null}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Metadata</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Nguồn tham chiếu</dt>
                <dd className="font-medium text-slate-950">{candidate.sourceRefId ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Review by</dt>
                <dd className="font-medium text-slate-950">{candidate.reviewedBy ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Review at</dt>
                <dd className="font-medium text-slate-950">{formatDateTime(candidate.reviewedAt)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Knowledge Item</dt>
                <dd className="font-medium text-slate-950">
                  {candidate.promotedKnowledgeItemId ? (
                    <Link className="text-emerald-700 hover:text-emerald-800" href={`/knowledge/${candidate.promotedKnowledgeItemId}`}>
                      {candidate.promotedKnowledgeItemId}
                    </Link>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Ghi chú</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{candidate.notes ?? "Chưa có ghi chú."}</p>
          </section>
        </div>
      </section>
    </div>
  );
}
