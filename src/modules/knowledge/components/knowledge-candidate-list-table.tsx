import { Eye } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  KNOWLEDGE_CANDIDATE_SOURCE_TYPES,
  KNOWLEDGE_CANDIDATE_STATUSES,
  KNOWLEDGE_MODULES,
  type KnowledgeCandidate,
  type KnowledgeCandidateStatus
} from "@/modules/knowledge/types";
import { cn } from "@/lib/utils";

const statusClasses: Record<KnowledgeCandidateStatus, string> = {
  candidate: "bg-slate-100 text-slate-700",
  pending_review: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-1 ring-red-200",
  expired: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  superseded: "bg-purple-50 text-purple-700 ring-1 ring-purple-200"
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(new Date(value));
}

export function KnowledgeCandidateStatusBadge({ status }: { status: KnowledgeCandidateStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", statusClasses[status])}>
      {KNOWLEDGE_CANDIDATE_STATUSES[status]}
    </span>
  );
}

export function KnowledgeCandidateListTable({ candidates }: { candidates: KnowledgeCandidate[] }) {
  if (candidates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-white p-8 text-center">
        <h2 className="text-base font-semibold text-slate-950">Chưa có Knowledge Candidate phù hợp</h2>
        <p className="mt-2 text-sm text-slate-600">Tạo candidate từ chat, search, upload, meeting, report, document hoặc nhập thủ công.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Nguồn</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Cập nhật</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {candidates.map((candidate) => (
              <tr className="align-top hover:bg-slate-50" key={candidate.id}>
                <td className="min-w-72 px-4 py-3">
                  <Link className="font-medium text-emerald-700 hover:text-emerald-800" href={`/knowledge/candidates/${candidate.id}`}>
                    {candidate.title}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{candidate.extractedText}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{KNOWLEDGE_MODULES[candidate.module]}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{KNOWLEDGE_CANDIDATE_SOURCE_TYPES[candidate.sourceType]}</td>
                <td className="px-4 py-3">
                  <KnowledgeCandidateStatusBadge status={candidate.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(candidate.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/knowledge/candidates/${candidate.id}`}>
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        Xem
                      </Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
