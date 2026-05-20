"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import {
  approveProposal,
  createProposal,
  rejectProposal,
  requestProposalChange,
  submitProposal
} from "@/modules/proposals/services/proposal-service";
import type { ProposalInput } from "@/modules/proposals/types";
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
    priority: String(formData.get("priority") ?? "normal") as ProposalInput["priority"],
    amount: formData.get("amount") ? Number(formData.get("amount")) : undefined,
    dueDate: readOptionalString(formData, "dueDate"),
    summary: readOptionalString(formData, "summary")
  };
}

export async function createProposalAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const detail = await createProposal(formDataToProposalInput(formData), currentUser);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "proposal",
    entityId: detail.proposal.id,
    action: "proposal.create",
    newValue: { code: detail.proposal.code, title: detail.proposal.title, type: detail.proposal.type, status: detail.proposal.status }
  });

  revalidatePath("/proposals");
  redirect(`/proposals/${detail.proposal.id}`);
}

export async function submitProposalAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const proposalId = String(formData.get("proposalId") ?? "");
  const proposal = await submitProposal(proposalId, currentUser);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "proposal",
    entityId: proposal.id,
    action: "proposal.submit",
    newValue: { status: proposal.status }
  });

  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposal.id}`);
  redirect(`/proposals/${proposal.id}`);
}

export async function requestProposalChangeAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const proposalId = String(formData.get("proposalId") ?? "");
  const proposal = await requestProposalChange(proposalId, currentUser, readOptionalString(formData, "notes"));

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
  const proposal = await approveProposal(proposalId, currentUser, readOptionalString(formData, "notes"));

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
  const proposal = await rejectProposal(proposalId, currentUser, readOptionalString(formData, "notes"));

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
