import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { requireAuthenticatedSession } from "@/lib/permissions/guard";
import { requiresAssignmentScopeForRole } from "@/lib/permissions/access-scope";
import { selectScopeAssignmentsForUser } from "@/lib/permissions/navigation-context";
import { buildAiApprovalAssistantDraft } from "@/modules/ai/services/ai-approval-assistant-service";
import { ApprovalRequestDetail } from "@/modules/executive/components/approval-request-detail";
import { getApprovalCenterDetailData } from "@/modules/proposals/services/approval-center-service";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import { listActiveScopeAssignments } from "@/modules/settings/services/scope-assignment-service";
import { listAuditLogs } from "@/modules/users/services/user-service";

type ApprovalDetailPageProps = {
  params: Promise<{ sourceId: string; sourceType: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function selectedScopeIdFrom(
  params: Record<string, string | string[] | undefined>,
) {
  const scopeId = params.scopeId;

  return Array.isArray(scopeId) ? scopeId[0] : scopeId;
}

function approvalCenterBackHref(scopeId?: string) {
  if (!scopeId || scopeId === "all") {
    return "/command-center?view=executive-approvals";
  }

  return `/command-center?view=executive-approvals&scopeId=${encodeURIComponent(scopeId)}`;
}

export default async function ApprovalDetailPage({
  params,
  searchParams,
}: ApprovalDetailPageProps) {
  const [{ sourceId, sourceType }, rawSearchParams, session] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({}),
    requireAuthenticatedSession({ route: "/approvals" }),
  ]);

  if (sourceType !== "proposal") {
    notFound();
  }

  const selectedScopeId = selectedScopeIdFrom(rawSearchParams);
  const [scopeAssignments, rolePermissionCatalog] = await Promise.all([
    listActiveScopeAssignments(),
    listRolePermissionCatalog(),
  ]);
  const selectedScopeAssignments = selectScopeAssignmentsForUser(
    session.user,
    scopeAssignments,
    selectedScopeId,
  );
  const selectedScopeActive =
    Boolean(selectedScopeId) && selectedScopeId !== "all";
  const requireScopeAssignments =
    selectedScopeActive || requiresAssignmentScopeForRole(session.user.role);
  const detail = await getApprovalCenterDetailData(
    { sourceId, sourceType },
    session.user,
    {
      requireScopeAssignments,
      rolePermissionCatalog,
      auditLogLoader: listAuditLogs,
      scopeAssignments: selectedScopeAssignments,
      selectedScopeId,
    },
  );

  if (!detail) {
    return (
      <PageShell
        description="Approval nay khong nam trong pham vi duoc giao hoac khong ton tai."
        title="Khong co quyen xem approval"
      >
        <UnauthorizedState
          backHref={approvalCenterBackHref(selectedScopeId)}
          backLabel="Ve Approval Center"
          title="Ban khong co quyen xem approval nay"
        />
      </PageShell>
    );
  }

  const aiAssistant = await buildAiApprovalAssistantDraft(session.user, detail, {
    createActionProposal: true,
    useProvider: true,
  });

  return (
    <PageShell
      description="Request summary, policy, linked sources va history hien co."
      title="Approval Detail"
    >
      <ApprovalRequestDetail detail={{ ...detail, aiAssistant }} />
    </PageShell>
  );
}
