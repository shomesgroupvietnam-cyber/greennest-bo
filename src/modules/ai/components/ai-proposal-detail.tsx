import React from "react";

import { acceptAiActionProposalAction, rejectAiActionProposalAction } from "@/modules/ai/actions";
import { buildAiProposalDisplaySummary } from "@/modules/ai/services/ai-proposal-presenter";
import type { AiActionProposal } from "@/modules/ai/types";
import type { Project } from "@/modules/projects/types";

type AiProposalDetailProps = {
  proposal: AiActionProposal;
  project?: Project;
  showTechnicalDetails?: boolean;
};

export function AiProposalDetail({ proposal, project, showTechnicalDetails = false }: AiProposalDetailProps) {
  const summary = buildAiProposalDisplaySummary(proposal, project);
  const returnTo = readString(proposal.proposedPayload.returnToHref);

  return (
    <div className="space-y-5">
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">AI đề xuất làm gì</p>
            <h2 className="text-xl font-semibold text-slate-950">{summary.actionLabel}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{proposal.rationale ?? "AI chưa ghi rõ lý do đề xuất."}</p>
          </div>
          <span className={getStatusClassName(proposal.status)}>{summary.statusLabel}</span>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-950">Thông tin trước khi chấp nhận</h3>
        <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="text-slate-500">Dự án liên quan</dt>
            <dd className="font-medium text-slate-950">{summary.projectLabel}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Người/nhóm chịu trách nhiệm nếu có</dt>
            <dd className="font-medium text-slate-950">{summary.responsibleLabel}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Quyền cần có</dt>
            <dd className="font-medium text-slate-950">{summary.requiredPermission}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Đối tượng liên quan</dt>
            <dd className="font-medium text-slate-950">
              {proposal.targetEntityType}
              {proposal.targetEntityId ? ` / ${proposal.targetEntityId}` : ""}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-950">Nội dung sẽ được tạo/cập nhật</h3>
        {summary.contentItems.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {summary.contentItems.map((item) => (
              <li key={item} className="rounded-md bg-slate-50 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Đề xuất chưa có nội dung chi tiết. Vui lòng kiểm tra lại trước khi chấp nhận.</p>
        )}
      </section>

      {proposal.status === "proposed" ? (
        <section className="grid gap-3 md:grid-cols-2">
          <form action={acceptAiActionProposalAction} className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <input name="proposalId" type="hidden" value={proposal.id} />
            {returnTo ? <input name="returnTo" type="hidden" value={returnTo} /> : null}
            <label className="block text-sm font-medium text-emerald-900">
              Ghi chú chấp nhận
              <textarea className="mt-1 min-h-20 w-full rounded-md border px-3 py-2 text-sm text-slate-900" name="decisionNotes" />
            </label>
            <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white" type="submit">
              Chấp nhận và thực thi
            </button>
          </form>
          <form action={rejectAiActionProposalAction} className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4">
            <input name="proposalId" type="hidden" value={proposal.id} />
            {returnTo ? <input name="returnTo" type="hidden" value={returnTo} /> : null}
            <label className="block text-sm font-medium text-red-900">
              Lý do từ chối
              <textarea className="mt-1 min-h-20 w-full rounded-md border px-3 py-2 text-sm text-slate-900" name="decisionNotes" />
            </label>
            <button className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white" type="submit">
              Từ chối
            </button>
          </form>
        </section>
      ) : (
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-950">Kết quả duyệt</h3>
          <p className="mt-2 text-sm text-slate-600">
            {summary.statusLabel} bởi {proposal.decidedBy ?? "hệ thống"} lúc {proposal.decidedAt ?? "chưa rõ"}.
          </p>
          {proposal.decisionNotes ? <p className="mt-2 text-sm text-slate-600">Ghi chú: {proposal.decisionNotes}</p> : null}
          {proposal.status === "failed" ? (
            <p className="mt-2 text-sm text-red-700">Đề xuất không thực thi được. Vui lòng kiểm tra quyền, phạm vi dự án hoặc dữ liệu liên quan.</p>
          ) : null}
        </section>
      )}

      {showTechnicalDetails ? (
        <details className="rounded-lg border bg-white p-5 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-slate-950">Chi tiết kỹ thuật</summary>
          <pre className="mt-4 max-h-80 overflow-auto rounded-md bg-slate-50 p-3 text-xs text-slate-600">
            {JSON.stringify(proposal.proposedPayload, null, 2)}
          </pre>
        </details>
      ) : null}
    </div>
  );
}

function getStatusClassName(status: AiActionProposal["status"]) {
  if (status === "accepted" || status === "executed") {
    return "rounded-md bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800";
  }

  if (status === "rejected" || status === "failed") {
    return "rounded-md bg-red-100 px-3 py-1 text-sm font-medium text-red-800";
  }

  return "rounded-md bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800";
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}
