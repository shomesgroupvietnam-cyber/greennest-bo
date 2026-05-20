import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { listProjects } from "@/modules/projects/services/project-service";
import { createProposalAction } from "@/modules/proposals/actions";
import { ProposalForm } from "@/modules/proposals/components/proposal-form";

export default async function NewProposalPage() {
  const currentUser = await getCurrentUser();

  if (!can(currentUser, "proposal.create")) {
    return (
      <PageShell title="Tạo đề xuất">
        <UnauthorizedState description="Vai trò hiện tại không có quyền tạo đề xuất." />
      </PageShell>
    );
  }

  const projects = can(currentUser, "project.view") ? await listProjects({}) : [];

  return (
    <PageShell title="Tạo đề xuất" description="Tạo đề xuất nội bộ để trình review và phê duyệt.">
      <ProposalForm action={createProposalAction} projects={projects} />
    </PageShell>
  );
}
