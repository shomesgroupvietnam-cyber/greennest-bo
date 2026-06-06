"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { requiresAssignmentScopeForRole } from "@/lib/permissions/access-scope";
import { selectScopeAssignmentsForUser } from "@/lib/permissions/navigation-context";
import {
  acceptAiActionProposal,
  getAiActionProposal,
  rejectAiActionProposal
} from "@/modules/ai/services/ai-action-proposal-service";
import { askAi } from "@/modules/ai/services/ai-gateway-service";
import { buildAiAskInputFromFormData } from "@/modules/ai/services/ai-ux-service";
import { processAiJob } from "@/modules/ai/services/ai-worker-service";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import { listActiveScopeAssignments } from "@/modules/settings/services/scope-assignment-service";

export async function submitAiQuestionAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const input = buildAiAskInputFromFormData(formData, currentUser);
  const result = await askAi(input, currentUser);

  revalidatePath("/ai");
  redirect(`/ai/jobs/${result.job.id}`);
}

export async function processAiJobAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const jobId = String(formData.get("jobId") ?? "");

  await processAiJob(jobId, currentUser);
  revalidatePath(`/ai/jobs/${jobId}`);
  redirect(`/ai/jobs/${jobId}`);
}

export async function acceptAiActionProposalAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const proposalId = String(formData.get("proposalId") ?? "");
  const returnTo = safeReturnTo(formData.get("returnTo"));
  const scopedOptions = await approvalScopedOptions(currentUser, returnTo);
  const proposal = await getAiActionProposal(proposalId);
  const updatedProposal = await acceptAiActionProposal(proposalId, currentUser, {
    decisionNotes: String(formData.get("decisionNotes") ?? "").trim() || undefined
  }, scopedOptions);
  const jobId = proposal?.jobId ?? updatedProposal.jobId;

  revalidatePath("/ai");
  revalidatePath("/command-center");
  revalidatePath("/executive");
  revalidateExecutionProject(updatedProposal.executionResult);
  revalidateApprovalProposal(updatedProposal);
  revalidateApprovalProposalResult(updatedProposal.executionResult);
  if (returnTo) {
    revalidatePath(returnTo);
  }
  if (jobId) {
    revalidatePath(`/ai/jobs/${jobId}`);
    if (returnTo) {
      redirect(returnTo);
    }
    redirect(`/ai/jobs/${jobId}`);
  }

  redirect(returnTo ?? "/ai");
}

function revalidateExecutionProject(executionResult: unknown) {
  if (
    executionResult &&
    typeof executionResult === "object" &&
    "projectId" in executionResult &&
    typeof executionResult.projectId === "string"
  ) {
    revalidatePath(`/projects/${executionResult.projectId}`);
  }
}

export async function rejectAiActionProposalAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const proposalId = String(formData.get("proposalId") ?? "");
  const returnTo = safeReturnTo(formData.get("returnTo"));
  const scopedOptions = await approvalScopedOptions(currentUser, returnTo);
  const proposal = await getAiActionProposal(proposalId);
  const updatedProposal = await rejectAiActionProposal(proposalId, currentUser, {
    decisionNotes: String(formData.get("decisionNotes") ?? "").trim() || undefined
  }, scopedOptions);
  const jobId = proposal?.jobId ?? updatedProposal.jobId;

  revalidatePath("/ai");
  revalidatePath("/command-center");
  revalidatePath("/executive");
  revalidateApprovalProposal(updatedProposal);
  if (returnTo) {
    revalidatePath(returnTo);
  }
  if (jobId) {
    revalidatePath(`/ai/jobs/${jobId}`);
    if (returnTo) {
      redirect(returnTo);
    }
    redirect(`/ai/jobs/${jobId}`);
  }

  redirect(returnTo ?? "/ai");
}

function safeReturnTo(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text || !text.startsWith("/") || text.startsWith("//")) {
    return undefined;
  }

  return text;
}

async function approvalScopedOptions(
  user: Awaited<ReturnType<typeof getCurrentUser>>,
  returnTo?: string,
) {
  const selectedScopeId = scopeIdFromReturnTo(returnTo);
  const [scopeAssignments, rolePermissionCatalog] = await Promise.all([
    listActiveScopeAssignments(),
    listRolePermissionCatalog(),
  ]);
  const selectedScopeAssignments = selectScopeAssignmentsForUser(
    user,
    scopeAssignments,
    selectedScopeId,
  );
  const selectedScopeActive =
    Boolean(selectedScopeId) && selectedScopeId !== "all";

  return {
    requireScopeAssignments:
      selectedScopeActive || requiresAssignmentScopeForRole(user.role),
    rolePermissionCatalog,
    scopeAssignments: selectedScopeAssignments,
  };
}

function scopeIdFromReturnTo(returnTo?: string) {
  if (!returnTo) {
    return undefined;
  }

  try {
    const url = new URL(returnTo, "http://greennest.local");
    const scopeId = url.searchParams.get("scopeId")?.trim();

    return scopeId || undefined;
  } catch {
    return undefined;
  }
}

function revalidateApprovalProposal(proposal: { targetEntityId?: string; targetEntityType?: string }) {
  if (proposal.targetEntityType !== "proposal" || !proposal.targetEntityId) {
    return;
  }

  revalidatePath(`/approvals/proposal/${proposal.targetEntityId}`);
  revalidatePath(`/proposals/${proposal.targetEntityId}`);
  revalidatePath("/proposals");
}

function revalidateApprovalProposalResult(executionResult: unknown) {
  if (
    executionResult &&
    typeof executionResult === "object" &&
    "entityType" in executionResult &&
    executionResult.entityType === "proposal" &&
    "entityId" in executionResult &&
    typeof executionResult.entityId === "string"
  ) {
    revalidatePath(`/approvals/proposal/${executionResult.entityId}`);
    revalidatePath(`/proposals/${executionResult.entityId}`);
    revalidatePath("/proposals");
  }
}
