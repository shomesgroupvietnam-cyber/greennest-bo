import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { KnowledgeDetail } from "@/modules/knowledge/components/knowledge-detail";
import { listKnowledgeChunksByItem } from "@/modules/knowledge/services/knowledge-indexing-service";
import { getKnowledgeItem } from "@/modules/knowledge/services/knowledge-service";

type KnowledgeDetailPageProps = {
  params: Promise<{ knowledgeItemId: string }>;
};

export default async function KnowledgeDetailPage({ params }: KnowledgeDetailPageProps) {
  const { knowledgeItemId } = await params;
  const currentUser = await getCurrentUser();

  if (!can(currentUser, "knowledge.view")) {
    return (
      <PageShell title="Không có quyền truy cập" description="Bạn cần quyền xem Knowledge Center để mở trang này.">
        <UnauthorizedState backHref="/dashboard" backLabel="Về dashboard" title="Bạn không có quyền xem nguồn tri thức" />
      </PageShell>
    );
  }

  const item = await getKnowledgeItem(knowledgeItemId);

  if (!item) {
    notFound();
  }

  const chunks = await listKnowledgeChunksByItem(item.id);
  const canReview = can(currentUser, "knowledge.review");

  return (
    <PageShell title="Chi tiết nguồn tri thức" description="Metadata, trạng thái review, hiệu lực và điều kiện đưa vào RAG tương lai.">
      <Button asChild variant="ghost">
        <Link href="/knowledge">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Knowledge Center
        </Link>
      </Button>
      <KnowledgeDetail
        canReview={canReview}
        canReindex={canReview || can(currentUser, "knowledge.approve")}
        canSubmit={can(currentUser, "knowledge.create")}
        chunks={chunks}
        item={item}
      />
    </PageShell>
  );
}
