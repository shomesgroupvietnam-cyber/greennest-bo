import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { listProjects } from "@/modules/projects/services/project-service";
import { createProposalAction } from "@/modules/proposals/actions";
import { ProposalForm } from "@/modules/proposals/components/proposal-form";
import { listActiveDelegationsForDelegate } from "@/modules/settings/services/leadership-delegation-service";

export default async function NewProposalPage() {
  const currentUser = await getCurrentUser();
  const canCreateDirect = can(currentUser, "proposal.create");
  const activeDelegations = await listActiveDelegationsForDelegate(currentUser.id);
  const proposalDelegations = activeDelegations.filter((delegation) =>
    delegation.actionKeys.includes("proposal.create"),
  );
  const canCreateOnBehalf = proposalDelegations.length > 0;

  if (!canCreateDirect && !canCreateOnBehalf) {
    return (
      <PageShell title="Tao de xuat">
        <UnauthorizedState description="Vai tro hien tai khong co quyen tao de xuat va khong co delegation tao thay lanh dao." />
      </PageShell>
    );
  }

  const allProjects = can(currentUser, "project.view") || canCreateOnBehalf
    ? await listProjects({})
    : [];
  const hasUnboundedProjectDelegation = proposalDelegations.some(
    (delegation) => !delegation.projectId || delegation.projectId === "*",
  );
  const delegatedProjectIds = new Set(
    proposalDelegations
      .map((delegation) => delegation.projectId)
      .filter((projectId): projectId is string => Boolean(projectId && projectId !== "*")),
  );
  const projects = can(currentUser, "project.view") || hasUnboundedProjectDelegation
    ? allProjects
    : allProjects.filter((project) => delegatedProjectIds.has(project.id));

  return (
    <PageShell title="Tao de xuat" description="Tao de xuat noi bo de trinh review va phe duyet.">
      <ProposalForm
        action={createProposalAction}
        canCreateDirect={canCreateDirect}
        delegations={proposalDelegations}
        projects={projects}
      />
    </PageShell>
  );
}
