import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PROPOSAL_PRIORITIES, PROPOSAL_TYPES, type Proposal } from "@/modules/proposals/types";

import { ProposalStatusBadge } from "./proposal-status-badge";

export function ProposalListTable({ proposals, canCreate }: { proposals: Proposal[]; canCreate: boolean }) {
  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Danh sách đề xuất</h2>
          <p className="text-sm text-slate-600">Luồng trình duyệt nội bộ cho các quyết định doanh nghiệp.</p>
        </div>
        {canCreate ? (
          <Button asChild>
            <Link href="/proposals/new">Tạo đề xuất</Link>
          </Button>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Tên đề xuất</th>
              <th className="px-4 py-3">Loại</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Ưu tiên</th>
              <th className="px-4 py-3">Cập nhật</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {proposals.map((proposal) => (
              <tr key={proposal.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{proposal.code}</td>
                <td className="px-4 py-3">
                  <Link className="font-medium text-emerald-700 hover:underline" href={`/proposals/${proposal.id}`}>
                    {proposal.title}
                  </Link>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">{proposal.summary}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{PROPOSAL_TYPES[proposal.type]}</td>
                <td className="px-4 py-3"><ProposalStatusBadge status={proposal.status} /></td>
                <td className="px-4 py-3 text-slate-600">{PROPOSAL_PRIORITIES[proposal.priority]}</td>
                <td className="px-4 py-3 text-slate-600">{new Intl.DateTimeFormat("vi-VN").format(new Date(proposal.updatedAt))}</td>
              </tr>
            ))}
            {proposals.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                  Chưa có đề xuất nào trong phạm vi hiện tại.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
