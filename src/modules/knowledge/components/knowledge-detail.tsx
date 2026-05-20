import { ExternalLink, RefreshCw, Send, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { reindexKnowledgeItemAction, submitKnowledgeItemForReviewAction } from "@/modules/knowledge/actions";
import {
  KNOWLEDGE_MODULES,
  KNOWLEDGE_SOURCE_TYPES,
  type KnowledgeChunk,
  type KnowledgeItem
} from "@/modules/knowledge/types";

import { KnowledgeConfidenceBadge, KnowledgeStatusBadge, RagEligibilityBadge } from "./knowledge-badges";

type KnowledgeDetailProps = {
  canReview?: boolean;
  canReindex?: boolean;
  canSubmit?: boolean;
  chunks?: KnowledgeChunk[];
  item: KnowledgeItem;
};

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value));
}

export function KnowledgeDetail({ canReview = false, canReindex = false, canSubmit = false, chunks = [], item }: KnowledgeDetailProps) {
  const submitAction = submitKnowledgeItemForReviewAction.bind(null, item.id);
  const reindexAction = reindexKnowledgeItemAction.bind(null, item.id);
  const canSubmitForReview = canSubmit && !["approved", "expired", "superseded", "pending_review"].includes(item.status);
  const hasIndexedChunks = chunks.length > 0;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">
              {KNOWLEDGE_MODULES[item.module]} · {KNOWLEDGE_SOURCE_TYPES[item.sourceType]}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">{item.title}</h2>
            <p className="mt-1 text-sm text-slate-600">
              Cập nhật: {formatDateTime(item.updatedAt)} · Người nhập: {item.createdBy ?? "-"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canSubmitForReview ? (
              <form action={submitAction}>
                <Button type="submit" variant="outline">
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Gửi review
                </Button>
              </form>
            ) : null}
            {canReview ? (
              <Button asChild>
                <Link href={`/knowledge/${item.id}/review`}>
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Mở review
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Trạng thái</p>
          <div className="mt-2">
            <KnowledgeStatusBadge status={item.status} />
          </div>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Độ tin cậy</p>
          <div className="mt-2">
            <KnowledgeConfidenceBadge confidence={item.confidence} />
          </div>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">RAG index</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <RagEligibilityBadge eligible={item.isRagEligible} />
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                hasIndexedChunks ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {hasIndexedChunks ? `${chunks.length} chunk` : "Chưa index"}
            </span>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Phạm vi</p>
          <p className="mt-2 text-sm font-medium text-slate-950">{item.jurisdiction ?? "-"}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Tóm tắt</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{item.summary ?? "Chưa có tóm tắt."}</p>
          </section>

          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Ghi chú review</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{item.notes ?? "Chưa có ghi chú."}</p>
          </section>

          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950">RAG index</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Chỉ nguồn đã duyệt và còn hiệu lực được dùng cho retrieval thường. Đây là index text placeholder, chưa phải
                  embedding/vector search.
                </p>
              </div>
              {canReindex ? (
                <form action={reindexAction}>
                  <Button type="submit" variant="outline">
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Reindex
                  </Button>
                </form>
              ) : null}
            </div>
            {chunks.length > 0 ? (
              <div className="mt-4 space-y-3">
                {chunks.slice(0, 4).map((chunk) => (
                  <article className="rounded-md border bg-slate-50 p-3" key={chunk.id}>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                      <span>Chunk #{chunk.chunkOrder + 1}</span>
                      <span>·</span>
                      <span>{chunk.accessLevel}</span>
                      <span>·</span>
                      <span>{chunk.status}</span>
                    </div>
                    <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-slate-700">{chunk.chunkText}</p>
                    <p className="mt-2 text-xs text-slate-500">Trích dẫn: {chunk.citation.knowledgeTitle}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-md border border-dashed p-4 text-sm text-slate-600">
                Chưa có chunk index. Nguồn cần được duyệt trước khi reindex cho retrieval thông thường.
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Nguồn và hiệu lực</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Ngày hiệu lực</dt>
                <dd className="font-medium text-slate-950">{formatDate(item.effectiveDate)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Ngày hết hiệu lực</dt>
                <dd className="font-medium text-slate-950">{formatDate(item.expiryDate)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">File nguồn</dt>
                <dd className="font-medium text-slate-950">{item.sourceFileId ?? "-"}</dd>
              </div>
            </dl>
            {item.sourceUrl ? (
              <Button asChild className="mt-4" variant="outline">
                <a href={item.sourceUrl} rel="noreferrer" target="_blank">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Mở URL nguồn
                </a>
              </Button>
            ) : null}
          </section>

          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Review</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Người review</dt>
                <dd className="font-medium text-slate-950">{item.reviewedBy ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Người duyệt</dt>
                <dd className="font-medium text-slate-950">{item.approvedBy ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Ngày review</dt>
                <dd className="font-medium text-slate-950">{formatDateTime(item.reviewedAt)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Ngày duyệt</dt>
                <dd className="font-medium text-slate-950">{formatDateTime(item.approvedAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Tags</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.tags.length > 0 ? (
                item.tags.map((tag) => (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700" key={tag}>
                    {tag}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-600">Chưa có tag.</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
