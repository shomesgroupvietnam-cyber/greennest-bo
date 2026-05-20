import { ExternalLink, Eye, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  KNOWLEDGE_MODULES,
  KNOWLEDGE_SOURCE_TYPES,
  type KnowledgeItem
} from "@/modules/knowledge/types";

import { KnowledgeConfidenceBadge, KnowledgeStatusBadge, RagEligibilityBadge } from "./knowledge-badges";

type KnowledgeListTableProps = {
  canCreate?: boolean;
  canReview?: boolean;
  items: KnowledgeItem[];
};

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(new Date(value));
}

export function KnowledgeListTable({ canCreate = false, canReview = false, items }: KnowledgeListTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-white p-8 text-center">
        <h2 className="text-base font-semibold text-slate-950">Chưa có nguồn tri thức phù hợp</h2>
        <p className="mt-2 text-sm text-slate-600">Thêm nguồn mới hoặc điều chỉnh bộ lọc.</p>
        {canCreate ? (
          <Button asChild className="mt-4">
            <Link href="/knowledge/new">Thêm nguồn tri thức</Link>
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nguồn tri thức</th>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Loại nguồn</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Độ tin cậy</th>
              <th className="px-4 py-3">RAG</th>
              <th className="px-4 py-3">Cập nhật</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr className="align-top hover:bg-slate-50" key={item.id}>
                <td className="min-w-72 px-4 py-3">
                  <Link className="font-medium text-emerald-700 hover:text-emerald-800" href={`/knowledge/${item.id}`}>
                    {item.title}
                  </Link>
                  {item.summary ? <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.summary}</p> : null}
                  {item.sourceUrl ? (
                    <a
                      className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-700"
                      href={item.sourceUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      Mở nguồn
                    </a>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{KNOWLEDGE_MODULES[item.module]}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{KNOWLEDGE_SOURCE_TYPES[item.sourceType]}</td>
                <td className="px-4 py-3">
                  <KnowledgeStatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3">
                  <KnowledgeConfidenceBadge confidence={item.confidence} />
                </td>
                <td className="px-4 py-3">
                  <RagEligibilityBadge eligible={item.isRagEligible} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(item.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/knowledge/${item.id}`}>
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        Xem
                      </Link>
                    </Button>
                    {canReview ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/knowledge/${item.id}/review`}>
                          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                          Review
                        </Link>
                      </Button>
                    ) : null}
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
