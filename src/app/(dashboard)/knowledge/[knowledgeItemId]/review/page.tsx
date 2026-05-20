import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { KnowledgeDetail } from "@/modules/knowledge/components/knowledge-detail";
import { KnowledgeReviewPanel } from "@/modules/knowledge/components/knowledge-review-panel";
import { getKnowledgeItem } from "@/modules/knowledge/services/knowledge-service";

type KnowledgeReviewPageProps = {
  params: Promise<{ knowledgeItemId: string }>;
};

export default async function KnowledgeReviewPage({ params }: KnowledgeReviewPageProps) {
  const { knowledgeItemId } = await params;
  const currentUser = await getCurrentUser();

  if (!can(currentUser, "knowledge.review")) {
    return (
      <PageShell title="Không có quyền review" description="Bạn cần quyền review Knowledge Center để mở trang này.">
        <UnauthorizedState backHref="/knowledge" backLabel="Về Knowledge Center" title="Bạn không có quyền review nguồn tri thức" />
      </PageShell>
    );
  }

  const item = await getKnowledgeItem(knowledgeItemId);

  if (!item) {
    notFound();
  }

  return (
    <PageShell title="Review nguồn tri thức" description="Duyệt, từ chối hoặc đánh dấu hiệu lực của nguồn tri thức trước khi dùng cho RAG tương lai.">
      <Button asChild variant="ghost">
        <Link href={`/knowledge/${item.id}`}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Chi tiết nguồn
        </Link>
      </Button>
      <KnowledgeReviewPanel canApprove={can(currentUser, "knowledge.approve")} item={item} />
      <KnowledgeDetail canReview={false} canSubmit={false} item={item} />
    </PageShell>
  );
}
