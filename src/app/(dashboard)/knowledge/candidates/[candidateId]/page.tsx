import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { KnowledgeCandidateDetail } from "@/modules/knowledge/components/knowledge-candidate-detail";
import { getKnowledgeCandidate } from "@/modules/knowledge/services/knowledge-candidate-service";

type KnowledgeCandidateDetailPageProps = {
  params: Promise<{ candidateId: string }>;
};

export default async function KnowledgeCandidateDetailPage({ params }: KnowledgeCandidateDetailPageProps) {
  const { candidateId } = await params;
  const currentUser = await getCurrentUser();

  if (!can(currentUser, "knowledge.view")) {
    return (
      <PageShell title="Không có quyền truy cập" description="Bạn cần quyền xem Knowledge Center để mở candidate.">
        <UnauthorizedState backHref="/knowledge" backLabel="Về Knowledge Center" title="Bạn không có quyền xem Knowledge Candidate" />
      </PageShell>
    );
  }

  const candidate = await getKnowledgeCandidate(candidateId);

  if (!candidate) {
    notFound();
  }

  return (
    <PageShell title="Chi tiết Knowledge Candidate" description="Review candidate trước khi promote thành Knowledge Item. Candidate không được đưa vào RAG tự động.">
      <Button asChild variant="ghost">
        <Link href="/knowledge/candidates">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Candidate queue
        </Link>
      </Button>
      <KnowledgeCandidateDetail
        canApprove={can(currentUser, "knowledge.approve")}
        canPromote={can(currentUser, "knowledge.promote")}
        canReview={can(currentUser, "knowledge.review")}
        candidate={candidate}
      />
    </PageShell>
  );
}
