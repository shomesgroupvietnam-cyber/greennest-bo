import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { getScopedMeeting } from "@/lib/permissions/scoped-resources";
import { AiProposalDetail } from "@/modules/ai/components/ai-proposal-detail";
import { getAiActionProposal } from "@/modules/ai/services/ai-action-proposal-service";
import { isTechnicalAiDetailAllowed } from "@/modules/ai/services/ai-ux-service";
import { projectRepository } from "@/modules/projects/services/project-repository";

type AiProposalPageProps = {
  params: Promise<{ proposalId: string }>;
};

export default async function AiProposalPage({ params }: AiProposalPageProps) {
  const currentUser = await getCurrentUser();
  const { proposalId } = await params;
  const proposal = await getAiActionProposal(proposalId);

  if (!proposal) {
    notFound();
  }

  if (proposal.requestedBy !== currentUser.id && !can(currentUser, "ai.confirm_action")) {
    return (
      <PageShell title="Đề xuất AI">
        <UnauthorizedState description="Vai trò hiện tại không có quyền xem đề xuất AI này." />
      </PageShell>
    );
  }

  if (
    proposal.targetEntityType === "meeting" &&
    proposal.targetEntityId &&
    !(await getScopedMeeting(currentUser, proposal.targetEntityId))
  ) {
    return (
      <PageShell title="De xuat AI">
        <UnauthorizedState description="Cuoc hop cua de xuat AI khong nam trong pham vi cua ban." />
      </PageShell>
    );
  }

  const project = proposal.projectId ? await projectRepository.getProject(proposal.projectId) : undefined;

  return (
    <PageShell
      title="Duyệt đề xuất AI"
      description="AI chỉ đề xuất. Dữ liệu nghiệp vụ chỉ thay đổi khi người có quyền chấp nhận và hệ thống thực thi qua domain service."
    >
      <AiProposalDetail proposal={proposal} project={project} showTechnicalDetails={isTechnicalAiDetailAllowed(currentUser)} />
    </PageShell>
  );
}
