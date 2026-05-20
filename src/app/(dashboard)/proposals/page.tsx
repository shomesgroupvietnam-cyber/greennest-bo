import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { ProposalListTable } from "@/modules/proposals/components/proposal-list-table";
import { listProposals } from "@/modules/proposals/services/proposal-service";

export default async function ProposalsPage() {
  const currentUser = await getCurrentUser();

  if (!can(currentUser, "proposal.view")) {
    return (
      <PageShell title="Đề xuất">
        <UnauthorizedState description="Vai trò hiện tại không có quyền xem đề xuất nội bộ." />
      </PageShell>
    );
  }

  const proposals = await listProposals({}, currentUser);

  return (
    <PageShell title="Đề xuất nội bộ" description="Quản lý luồng trình duyệt, review, yêu cầu chỉnh sửa và phê duyệt nội bộ.">
      <ProposalListTable proposals={proposals} canCreate={can(currentUser, "proposal.create")} />
    </PageShell>
  );
}
