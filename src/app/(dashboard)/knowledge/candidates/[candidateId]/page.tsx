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
      <PageShell title="KhÃ´ng cÃ³ quyá»n truy cáº­p" description="Báº¡n cáº§n quyá»n xem Knowledge Center Ä‘á»ƒ má»Ÿ candidate.">
        <UnauthorizedState backHref="/knowledge" backLabel="Vá» Knowledge Center" title="Báº¡n khÃ´ng cÃ³ quyá»n xem Knowledge Candidate" />
      </PageShell>
    );
  }

  const candidate = await getKnowledgeCandidate(candidateId);

  if (!candidate) {
    notFound();
  }

  return (
    <PageShell title="Chi tiáº¿t Knowledge Candidate" description="Review candidate trÆ°á»›c khi promote thÃ nh Knowledge Item. Candidate khÃ´ng Ä‘Æ°á»£c Ä‘Æ°a vÃ o RAG tá»± Ä‘á»™ng.">
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
