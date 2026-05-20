import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  approveKnowledgeItemAction,
  markKnowledgeItemExpiredAction,
  markKnowledgeItemSupersededAction,
  rejectKnowledgeItemAction
} from "@/modules/knowledge/actions";
import type { KnowledgeItem } from "@/modules/knowledge/types";

type KnowledgeReviewPanelProps = {
  canApprove: boolean;
  item: KnowledgeItem;
};

const textareaClass =
  "min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export function KnowledgeReviewPanel({ canApprove, item }: KnowledgeReviewPanelProps) {
  const approveAction = approveKnowledgeItemAction.bind(null, item.id);
  const rejectAction = rejectKnowledgeItemAction.bind(null, item.id);
  const expireAction = markKnowledgeItemExpiredAction.bind(null, item.id);
  const supersedeAction = markKnowledgeItemSupersededAction.bind(null, item.id);
  const isPendingReview = item.status === "pending_review";

  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">Quy trình review</h2>
      <p className="mt-1 text-sm text-slate-600">
        Chỉ nguồn đã duyệt mới được đánh dấu đủ điều kiện đưa vào RAG. Nguồn hết hiệu lực hoặc bị thay thế sẽ bị loại khỏi RAG.
      </p>

      {!canApprove ? (
        <div className="mt-4 rounded-md border border-dashed p-4 text-sm text-slate-600">
          Bạn có quyền xem hàng đợi review nhưng không có quyền duyệt hoặc từ chối nguồn tri thức.
        </div>
      ) : null}

      {canApprove && isPendingReview ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <form action={approveAction} className="space-y-3 rounded-md border border-emerald-100 bg-emerald-50/40 p-4">
            <textarea className={textareaClass} name="notes" placeholder="Ghi chú duyệt nếu cần" />
            <Button type="submit">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Duyệt vào thư viện
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

      {canApprove ? (
        <div className="mt-5 grid gap-5 border-t pt-5 lg:grid-cols-2">
          <form action={expireAction} className="space-y-3">
            <textarea className={textareaClass} name="notes" placeholder="Ghi chú hết hiệu lực" />
            <Button type="submit" variant="outline">
              <Clock className="h-4 w-4" aria-hidden="true" />
              Đánh dấu hết hiệu lực
            </Button>
          </form>
          <form action={supersedeAction} className="space-y-3">
            <textarea className={textareaClass} name="notes" placeholder="Nguồn thay thế hoặc lý do bị thay thế" />
            <Button type="submit" variant="outline">
              <Clock className="h-4 w-4" aria-hidden="true" />
              Đánh dấu bị thay thế
            </Button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
