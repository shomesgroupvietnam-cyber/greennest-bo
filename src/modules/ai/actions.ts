"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import {
  acceptAiActionProposal,
  getAiActionProposal,
  rejectAiActionProposal
} from "@/modules/ai/services/ai-action-proposal-service";
import { askAi } from "@/modules/ai/services/ai-gateway-service";
import { buildAiAskInputFromFormData } from "@/modules/ai/services/ai-ux-service";
import { processAiJob } from "@/modules/ai/services/ai-worker-service";

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
  const proposal = await getAiActionProposal(proposalId);
  const updatedProposal = await acceptAiActionProposal(proposalId, currentUser, {
    decisionNotes: String(formData.get("decisionNotes") ?? "").trim() || undefined
  });
  const jobId = proposal?.jobId ?? updatedProposal.jobId;

  revalidatePath("/ai");
  if (jobId) {
    revalidatePath(`/ai/jobs/${jobId}`);
    redirect(`/ai/jobs/${jobId}`);
  }

  redirect("/ai");
}

export async function rejectAiActionProposalAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const proposalId = String(formData.get("proposalId") ?? "");
  const proposal = await getAiActionProposal(proposalId);
  const updatedProposal = await rejectAiActionProposal(proposalId, currentUser, {
    decisionNotes: String(formData.get("decisionNotes") ?? "").trim() || undefined
  });
  const jobId = proposal?.jobId ?? updatedProposal.jobId;

  revalidatePath("/ai");
  if (jobId) {
    revalidatePath(`/ai/jobs/${jobId}`);
    redirect(`/ai/jobs/${jobId}`);
  }

  redirect("/ai");
}
