import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { ProposalDetail } from "@/modules/proposals/components/proposal-detail";
import { getProposalDetail } from "@/modules/proposals/services/proposal-service";

type ProposalDetailPageProps = {
  params: Promise<{ proposalId: string }>;
};

export default async function ProposalDetailPage({ params }: ProposalDetailPageProps) {
  const currentUser = await getCurrentUser();
  const { proposalId } = await params;

  if (!can(currentUser, "proposal.view")) {
    return (
      <PageShell title="Đề xuất">
        <UnauthorizedState description="Vai trò hiện tại không có quyền xem đề xuất nội bộ." />
      </PageShell>
    );
  }

  const detail = await getProposalDetail(proposalId, currentUser);

  if (!detail) {
    notFound();
  }

  return (
    <PageShell title="Chi tiết đề xuất" description="Review, yêu cầu chỉnh sửa, phê duyệt hoặc từ chối đề xuất nội bộ.">
      <ProposalDetail
        detail={detail}
        canSubmit={can(currentUser, "proposal.create")}
        canReview={can(currentUser, "proposal.review")}
        canApprove={can(currentUser, "proposal.approve")}
      />
    </PageShell>
  );
}
