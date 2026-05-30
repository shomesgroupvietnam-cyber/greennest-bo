"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { requiresAssignmentScopeForRole } from "@/lib/permissions/access-scope";
import { selectScopeAssignmentsForUser } from "@/lib/permissions/navigation-context";
import {
  applyProposalApprovalAction,
  approveProposal,
  createProposal,
  rejectProposal,
  requestProposalChange,
  submitProposalWithResult
} from "@/modules/proposals/services/proposal-service";
import type { ProposalApprovalAction, ProposalInput } from "@/modules/proposals/types";
import type { ProposalApprovalActionInput } from "@/modules/proposals/validation";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import { listActiveScopeAssignments } from "@/modules/settings/services/scope-assignment-service";
import { createAuditLog } from "@/modules/users/services/user-service";

function readOptionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  return value || undefined;
}

function formDataToProposalInput(formData: FormData): ProposalInput {
  return {
    title: String(formData.get("title") ?? ""),
    type: String(formData.get("type") ?? "general") as ProposalInput["type"],
    projectId: readOptionalString(formData, "projectId"),
    module: readOptionalString(formData, "module"),
    ownerId: readOptionalString(formData, "ownerId"),
    onBehalfOf: readOptionalString(formData, "onBehalfOf"),
    delegationId: readOptionalString(formData, "delegationId"),
    priority: String(formData.get("priority") ?? "normal") as ProposalInput["priority"],
    amount: formData.get("amount") ? Number(formData.get("amount")) : undefined,
    dueDate: readOptionalString(formData, "dueDate"),
    summary: readOptionalString(formData, "summary")
  };
}

function withScopeId(path: string, scopeId?: string) {
  if (!scopeId || scopeId === "all") {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}scopeId=${encodeURIComponent(scopeId)}`;
}

function approvalDetailHref(proposalId: string, scopeId?: string) {
  return withScopeId(`/approvals/proposal/${encodeURIComponent(proposalId)}`, scopeId);
}

function auditActionFor(action: ProposalApprovalAction) {
  const actions: Record<ProposalApprovalAction, string> = {
    approve: "proposal.approved",
    ask_meeting: "proposal.meeting_requested",
    cancel: "proposal.cancelled",
    forward: "proposal.forwarded",
    hold: "proposal.held",
    reject: "proposal.rejected",
    request_change: "proposal.change_requested",
  };

  return actions[action];
}

function formDataToApprovalActionInput(formData: FormData): ProposalApprovalActionInput {
  const action = String(formData.get("approvalAction") ?? "") as ProposalApprovalAction;

  if ((action === "reject" || action === "cancel") && formData.get("confirm") !== "yes") {
    throw new Error("Can xac nhan thao tac truoc khi gui.");
  }

  switch (action) {
    case "approve":
      return {
        action,
        notes: readOptionalString(formData, "notes"),
      };
    case "reject":
    case "request_change":
    case "cancel":
      return {
        action,
        reason: readOptionalString(formData, "reason") ?? readOptionalString(formData, "notes") ?? "",
      };
    case "forward":
      return {
        action,
        notes: readOptionalString(formData, "notes"),
        targetLabel: readOptionalString(formData, "targetLabel") ?? readOptionalString(formData, "targetRole") ?? readOptionalString(formData, "targetUserId") ?? "",
        targetRole: readOptionalString(formData, "targetRole"),
        targetUserId: readOptionalString(formData, "targetUserId"),
      };
    case "ask_meeting":
      return {
        action,
        agendaDraft: readOptionalString(formData, "agendaDraft"),
        meetingType: readOptionalString(formData, "meetingType"),
      };
    case "hold":
      return {
        action,
        notes: readOptionalString(formData, "notes"),
      };
    default:
      throw new Error("Thao tac approval khong hop le.");
  }
}

export async function createProposalAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const detail = await createProposal(formDataToProposalInput(formData), currentUser);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "proposal",
    entityId: detail.proposal.id,
    action: "proposal.create",
    newValue: {
      code: detail.proposal.code,
      title: detail.proposal.title,
      type: detail.proposal.type,
      status: detail.proposal.status,
      submittedBy: detail.proposal.submittedBy,
      onBehalfOf: detail.proposal.onBehalfOf,
      delegationId: detail.proposal.delegationId,
    }
  });

  revalidatePath("/proposals");
  redirect(`/proposals/${detail.proposal.id}`);
}

export async function submitProposalAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const proposalId = String(formData.get("proposalId") ?? "");
  const result = await submitProposalWithResult(proposalId, currentUser);
  const proposal = result.proposal;

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "proposal",
    entityId: proposal.id,
    action: "proposal.submit",
    oldValue: {
      status: result.previousStatus,
      stepId: result.previousStepId,
      stepStatus: result.previousStepStatus,
    },
    newValue: {
      decisionId: result.decision.id,
      status: result.nextStatus,
      stepId: result.nextStepId,
      stepStatus: result.nextStepStatus,
      submittedBy: proposal.submittedBy,
      onBehalfOf: proposal.onBehalfOf,
      delegationId: proposal.delegationId,
      version: result.decision.version,
    }
  });

  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposal.id}`);
  redirect(`/proposals/${proposal.id}`);
}

export async function requestProposalChangeAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const proposalId = String(formData.get("proposalId") ?? "");
  const proposal = await requestProposalChange(
    proposalId,
    currentUser,
    readOptionalString(formData, "notes"),
    undefined,
    {
      onBehalfOf: readOptionalString(formData, "onBehalfOf"),
      delegationId: readOptionalString(formData, "delegationId"),
    },
  );

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "proposal",
    entityId: proposal.id,
    action: "proposal.request_change",
    newValue: { status: proposal.status }
  });

  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposal.id}`);
  redirect(`/proposals/${proposal.id}`);
}

export async function approveProposalAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const proposalId = String(formData.get("proposalId") ?? "");
  const proposal = await approveProposal(
    proposalId,
    currentUser,
    readOptionalString(formData, "notes"),
    undefined,
    {
      onBehalfOf: readOptionalString(formData, "onBehalfOf"),
      delegationId: readOptionalString(formData, "delegationId"),
    },
  );

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "proposal",
    entityId: proposal.id,
    action: "proposal.approve",
    newValue: { status: proposal.status }
  });

  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposal.id}`);
  redirect(`/proposals/${proposal.id}`);
}

export async function rejectProposalAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const proposalId = String(formData.get("proposalId") ?? "");
  const proposal = await rejectProposal(
    proposalId,
    currentUser,
    readOptionalString(formData, "notes"),
    undefined,
    {
      onBehalfOf: readOptionalString(formData, "onBehalfOf"),
      delegationId: readOptionalString(formData, "delegationId"),
    },
  );

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "proposal",
    entityId: proposal.id,
    action: "proposal.reject",
    newValue: { status: proposal.status }
  });

  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposal.id}`);
  redirect(`/proposals/${proposal.id}`);
}

export async function applyApprovalDetailAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const sourceType = String(formData.get("sourceType") ?? "");
  const proposalId = String(formData.get("sourceId") ?? "");
  const selectedScopeId = readOptionalString(formData, "scopeId");

  if (sourceType !== "proposal") {
    throw new Error("Approval source khong ho tro thao tac nay.");
  }

  const [scopeAssignments, rolePermissionCatalog] = await Promise.all([
    listActiveScopeAssignments(),
    listRolePermissionCatalog(),
  ]);
  const selectedScopeAssignments = selectScopeAssignmentsForUser(
    currentUser,
    scopeAssignments,
    selectedScopeId,
  );
  const selectedScopeActive =
    Boolean(selectedScopeId) && selectedScopeId !== "all";
  const requireScopeAssignments =
    selectedScopeActive || requiresAssignmentScopeForRole(currentUser.role);
  const input = formDataToApprovalActionInput(formData);
  const result = await applyProposalApprovalAction(proposalId, input, currentUser, {
    delegatedContext: {
      delegationId: readOptionalString(formData, "delegationId"),
      onBehalfOf: readOptionalString(formData, "onBehalfOf"),
    },
    requireScopeAssignments,
    rolePermissionCatalog,
    scopeAssignments: selectedScopeAssignments,
  });

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "proposal",
    entityId: result.proposal.id,
    action: auditActionFor(result.action),
    oldValue: {
      status: result.previousStatus,
      stepId: result.previousStepId,
      stepStatus: result.previousStepStatus,
    },
    newValue: {
      decisionId: result.decision.id,
      notes: result.notes,
      status: result.nextStatus,
      stepId: result.nextStepId,
      stepStatus: result.nextStepStatus,
      version: result.decision.version,
    },
  });

  revalidatePath("/command-center");
  revalidatePath("/proposals");
  revalidatePath(`/proposals/${result.proposal.id}`);
  revalidatePath(`/approvals/proposal/${result.proposal.id}`);

  redirect(approvalDetailHref(result.proposal.id, selectedScopeId));
}
