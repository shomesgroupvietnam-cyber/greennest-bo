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
  let detail;

  try {
    detail = await getProposalDetail(proposalId, currentUser);
  } catch {
    return (
      <PageShell title="De xuat">
        <UnauthorizedState description="Vai tro hien tai khong co quyen xem de xuat noi bo nay." />
      </PageShell>
    );
  }

  if (!detail) {
    notFound();
  }

  const canSubmit =
    can(currentUser, "proposal.create") ||
    (Boolean(detail.proposal.onBehalfOf) && detail.proposal.submittedBy === currentUser.id);

  return (
    <PageShell title="Chi tiet de xuat" description="Review, yeu cau chinh sua, phe duyet hoac tu choi de xuat noi bo.">
      <ProposalDetail
        detail={detail}
        canSubmit={canSubmit}
        canRequestChange={can(currentUser, "proposal.request_change")}
        canApprove={can(currentUser, "proposal.approve")}
      />
    </PageShell>
  );
}
