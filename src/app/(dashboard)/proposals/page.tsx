import { PageShell } from "@/components/shared/page-shell";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/guard";
import { ProposalListTable } from "@/modules/proposals/components/proposal-list-table";
import { listProposals } from "@/modules/proposals/services/proposal-service";

export default async function ProposalsPage() {
  const session = await requirePermission("proposal.view", { route: "/proposals" });
  const currentUser = session.user;

  const proposals = await listProposals({}, currentUser);

  return (
    <PageShell title="Đề xuất nội bộ" description="Quản lý luồng trình duyệt, review, yêu cầu chỉnh sửa và phê duyệt nội bộ.">
      <ProposalListTable proposals={proposals} canCreate={can(currentUser, "proposal.create")} />
    </PageShell>
  );
}
