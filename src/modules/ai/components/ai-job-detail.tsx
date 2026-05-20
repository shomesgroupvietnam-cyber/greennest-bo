import Link from "next/link";
import React from "react";

import { acceptAiActionProposalAction, processAiJobAction, rejectAiActionProposalAction } from "@/modules/ai/actions";
import {
  buildAiProposalDisplaySummary,
  getAiActionProposalStatusLabel
} from "@/modules/ai/services/ai-proposal-presenter";
import { getFriendlyAiFailureMessage } from "@/modules/ai/services/ai-ux-service";
import { AI_JOB_STATUSES, AI_MODULES } from "@/modules/ai/types";
import type { AiActionProposal, AiAskResult } from "@/modules/ai/types";

type AiJobDetailProps = {
  result: AiAskResult;
  projectLabel?: string;
  showTechnicalDetails?: boolean;
};

export function AiJobDetail({ result, projectLabel, showTechnicalDetails = false }: AiJobDetailProps) {
  const { interaction, job, citations, actionProposals } = result;
  const isQueued = job.status === "queued";
  const isFailed = job.status === "failed";
  const scopeLabel = job.projectId ? projectLabel ?? `Dự án ${job.projectId}` : "Tất cả dữ liệu được phép xem";

  return (
    <div className="space-y-5">
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Câu hỏi</p>
            <h2 className="text-lg font-semibold text-slate-950">{interaction.intent}</h2>
            <p className="mt-2 text-sm text-slate-600">{interaction.promptSummary}</p>
          </div>
          <div className="rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            Trạng thái xử lý: {isQueued ? "Đang xử lý" : AI_JOB_STATUSES[job.status]}
          </div>
        </div>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-slate-500">Phạm vi</dt>
            <dd className="font-medium text-slate-900">{scopeLabel}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Nhóm nghiệp vụ</dt>
            <dd className="font-medium text-slate-900">{AI_MODULES[job.module]}</dd>
          </div>
        </dl>
        {isQueued ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-900">Đang xử lý. Nếu kết quả chưa xuất hiện, bạn có thể thử xử lý lại.</p>
            <form action={processAiJobAction} className="mt-3">
              <input name="jobId" type="hidden" value={job.id} />
              <button className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white" type="submit">
                Thử xử lý lại
              </button>
            </form>
          </div>
        ) : null}
        {isFailed ? (
          <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
            <p>{getFriendlyAiFailureMessage(job.errorCode, job.errorMessage)}</p>
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-950">Kết quả</h3>
        <div className="mt-3 whitespace-pre-wrap rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          {interaction.responseText ?? (isQueued ? "Đang xử lý. Kết quả sẽ hiển thị tại đây sau khi hoàn tất." : "Chưa có kết quả phù hợp.")}
        </div>
      </section>

      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-950">Nguồn tham chiếu</h3>
        {citations.length > 0 ? (
          <ul className="mt-3 divide-y text-sm">
            {citations.map((citation) => (
              <li key={citation.id} className="py-3">
                <p className="font-medium text-slate-900">{citation.title}</p>
                <p className="text-slate-500">{citation.sourceUrl ?? citation.knowledgeChunkId ?? citation.entityId}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Chưa có nguồn tham chiếu được gắn cho câu trả lời này.</p>
        )}
      </section>

      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-950">Đề xuất cần duyệt</h3>
        {actionProposals.length > 0 ? (
          <ul className="mt-3 divide-y text-sm">
            {actionProposals.map((proposal) => (
              <AiJobProposalListItem key={proposal.id} proposal={proposal} projectLabel={projectLabel} />
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Không có đề xuất cần duyệt. AI chỉ tạo đề xuất khi bạn chọn “Đề xuất việc cần làm”.</p>
        )}
      </section>

      {showTechnicalDetails ? (
        <details className="rounded-lg border bg-white p-5 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-slate-950">Chi tiết kỹ thuật</summary>
          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="text-slate-500">Job ID</dt>
              <dd className="break-all font-medium text-slate-900">{job.id}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Rate limit key</dt>
              <dd className="break-all font-medium text-slate-900">{job.rateLimitKey}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Mode</dt>
              <dd className="font-medium text-slate-900">{job.mode}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Priority</dt>
              <dd className="font-medium text-slate-900">{job.priority}</dd>
            </div>
          </dl>
          <pre className="mt-4 max-h-80 overflow-auto rounded-md bg-slate-50 p-3 text-xs text-slate-600">
            {JSON.stringify({ job, interaction, citations, actionProposals }, null, 2)}
          </pre>
        </details>
      ) : null}
    </div>
  );
}

function AiJobProposalListItem({ proposal, projectLabel }: { proposal: AiActionProposal; projectLabel?: string }) {
  const summary = buildAiProposalDisplaySummary(proposal);

  if (proposal.projectId && projectLabel) {
    summary.projectLabel = projectLabel;
  }

  return (
    <li className="space-y-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">{summary.actionLabel}</p>
          <p className="text-xs text-slate-500">{summary.statusLabel}</p>
        </div>
        <Link className="inline-flex text-xs font-medium text-slate-700 underline" href={`/ai/proposals/${proposal.id}`}>
          Mở trang duyệt đề xuất
        </Link>
      </div>
      <p className="text-slate-500">{proposal.rationale}</p>
      <dl className="grid gap-2 rounded-md bg-slate-50 p-3 text-xs md:grid-cols-2">
        <div>
          <dt className="text-slate-500">Dự án liên quan</dt>
          <dd className="font-medium text-slate-900">{summary.projectLabel}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Quyền cần có</dt>
          <dd className="font-medium text-slate-900">{summary.requiredPermission}</dd>
        </div>
      </dl>
      {proposal.status === "proposed" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <form action={acceptAiActionProposalAction} className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <input name="proposalId" type="hidden" value={proposal.id} />
            <label className="block text-xs font-medium text-emerald-900">
              Ghi chú chấp nhận
              <textarea className="mt-1 min-h-16 w-full rounded-md border px-2 py-1 text-xs text-slate-900" name="decisionNotes" />
            </label>
            <button className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white" type="submit">
              Chấp nhận và thực thi
            </button>
          </form>
          <form action={rejectAiActionProposalAction} className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3">
            <input name="proposalId" type="hidden" value={proposal.id} />
            <label className="block text-xs font-medium text-red-900">
              Lý do từ chối
              <textarea className="mt-1 min-h-16 w-full rounded-md border px-2 py-1 text-xs text-slate-900" name="decisionNotes" />
            </label>
            <button className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-white" type="submit">
              Từ chối
            </button>
          </form>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          {getAiActionProposalStatusLabel(proposal.status)} bởi {proposal.decidedBy ?? "hệ thống"} lúc {proposal.decidedAt ?? "chưa rõ"}. {proposal.decisionNotes}
        </p>
      )}
    </li>
  );
}
