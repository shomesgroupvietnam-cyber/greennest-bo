import { randomUUID } from "node:crypto";

import type { PermissionUser } from "@/lib/permissions/can";

import type { AiAskInput, AiAskResult, AiInteraction, AiJob } from "../types";
import { aiAskInputSchema } from "../validation";
import { AI_TO_KNOWLEDGE_MODULE, assertAiRequestPermissions, createAiScopeSnapshot } from "./ai-permissions";
import { assertWithinAiRateLimit } from "./ai-rate-limit-service";
import { aiRepository, type AiRepository } from "./ai-repository";
import { processAiJob, type ProcessAiJobOptions } from "./ai-worker-service";

export type AiGatewayOptions = {
  aiRepo?: AiRepository;
  workerOptions?: Omit<ProcessAiJobOptions, "aiRepo">;
};

export async function askAi(input: AiAskInput, user: PermissionUser, options: AiGatewayOptions = {}): Promise<AiAskResult> {
  const aiRepo = options.aiRepo ?? aiRepository;
  const parsed = aiAskInputSchema.parse(input);
  const normalizedInput: AiAskInput = {
    ...parsed,
    resourceRefs: parsed.resourceRefs ?? []
  };

  assertAiRequestPermissions(user, normalizedInput);

  const now = new Date().toISOString();
  const scopeSnapshot = createAiScopeSnapshot(user, normalizedInput);
  const rateLimit = await assertWithinAiRateLimit(user, normalizedInput);
  const interaction: AiInteraction = {
    id: randomUUID(),
    requestedBy: user.id,
    projectId: normalizedInput.projectId,
    module: normalizedInput.module,
    intent: normalizedInput.intent,
    mode: normalizedInput.mode ?? "queued",
    promptSummary: summarizePrompt(normalizedInput.prompt),
    modelProvider: "mock",
    modelName: "mock-greennest-ai",
    status: normalizedInput.mode === "fast" ? "pending" : "queued",
    scopeSnapshot,
    createdAt: now,
    updatedAt: now
  };

  const job: AiJob = {
    id: randomUUID(),
    interactionId: interaction.id,
    requestedBy: user.id,
    projectId: normalizedInput.projectId,
    module: normalizedInput.module,
    intent: normalizedInput.intent,
    mode: normalizedInput.mode ?? "queued",
    priority: normalizedInput.priority ?? "normal",
    status: "queued",
    scopeSnapshot,
    rateLimitKey: rateLimit.key,
    payload: {
      prompt: normalizedInput.prompt,
      intent: normalizedInput.intent,
      useRag: normalizedInput.useRag ?? false,
      wantsActionProposal: normalizedInput.wantsActionProposal ?? false,
      knowledgeModule: AI_TO_KNOWLEDGE_MODULE[normalizedInput.module]
    },
    createdAt: now,
    updatedAt: now
  };

  const createdInteraction = await aiRepo.createInteraction(interaction);
  const createdJob = await aiRepo.createJob(job);

  if (normalizedInput.mode === "fast") {
    try {
      return await processAiJob(createdJob.id, user, { aiRepo, ...options.workerOptions });
    } catch {
      const failedResult = await getAiJobResult(createdJob.id, aiRepo);

      if (failedResult) {
        return failedResult;
      }

      throw new Error("AI job xu ly that bai va khong the tai ket qua.");
    }
  }

  return {
    interaction: createdInteraction,
    job: createdJob,
    citations: [],
    actionProposals: []
  };
}

export async function getAiJobResult(jobId: string, aiRepo: AiRepository = aiRepository) {
  const job = await aiRepo.getJob(jobId);

  if (!job) {
    return undefined;
  }

  const interaction = await aiRepo.getInteraction(job.interactionId);
  const citations = await aiRepo.listCitations({ jobId });
  const actionProposals = await aiRepo.listActionProposals({ jobId });

  if (!interaction) {
    return undefined;
  }

  return {
    interaction,
    job,
    citations,
    actionProposals
  };
}

function summarizePrompt(prompt: string) {
  const normalized = prompt.trim().replace(/\s+/g, " ");

  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}
