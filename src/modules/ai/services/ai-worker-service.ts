import { randomUUID } from "node:crypto";

import type { PermissionUser } from "@/lib/permissions/can";
import { knowledgeIndexRepository, type KnowledgeIndexRepository } from "@/modules/knowledge/services/knowledge-index-repository";

import type { AiActionProposal, AiCitation } from "../types";
import { runAiCoordinator, type AiCoordinatorRepositories } from "./ai-coordinator-service";
import { canProcessAiJob } from "./ai-permissions";
import { AiProviderError, type AiProvider } from "./ai-provider";
import { aiRepository, type AiRepository } from "./ai-repository";
import { applyResponseWarnings, safeFallbackForBlockedResponse, validateAiResponse } from "./ai-response-validator";

export type ProcessAiJobOptions = {
  aiRepo?: AiRepository;
  indexRepo?: KnowledgeIndexRepository;
  coordinatorRepositories?: AiCoordinatorRepositories;
  provider?: AiProvider;
  workerId?: string;
};

export async function processAiJob(
  jobId: string,
  user: PermissionUser,
  {
    aiRepo = aiRepository,
    indexRepo = knowledgeIndexRepository,
    coordinatorRepositories = {},
    provider,
    workerId = "mock-worker"
  }: ProcessAiJobOptions = {}
) {
  const job = await aiRepo.getJob(jobId);

  if (!job) {
    throw new Error("Khong tim thay AI job.");
  }

  const now = new Date().toISOString();

  if (!canProcessAiJob(user, job.scopeSnapshot, job.payload.useRag)) {
    await aiRepo.updateJob(job.id, {
      status: "failed",
      errorCode: "permission_denied",
      errorMessage: "Worker re-check khong dat quyen hoac scope.",
      finishedAt: now,
      updatedAt: now
    });
    await aiRepo.updateInteraction(job.interactionId, {
      status: "failed",
      responseSummary: "AI job bi tu choi khi worker re-check quyen.",
      completedAt: now,
      updatedAt: now
    });
    throw new Error("Khong co quyen xu ly AI job nay.");
  }

  const runningJob = await aiRepo.updateJob(job.id, {
    status: "running",
    lockedBy: workerId,
    lockedAt: now,
    startedAt: now,
    updatedAt: now
  });
  await aiRepo.updateInteraction(job.interactionId, { status: "running", updatedAt: now });

  try {
    const completedAt = new Date().toISOString();
    const coordinatorResult = await runAiCoordinator(
      runningJob,
      user,
      {
        ...coordinatorRepositories,
        knowledgeIndex: coordinatorRepositories.knowledgeIndex ?? indexRepo
      },
      {
        provider
      }
    );
    const citations = coordinatorResult.citations.map<AiCitation>((citation) => ({
      id: randomUUID(),
      interactionId: runningJob.interactionId,
      jobId: runningJob.id,
      createdAt: completedAt,
      ...citation
    }));
    const proposals = coordinatorResult.actionProposals.map<AiActionProposal>((proposal) => ({
      id: randomUUID(),
      interactionId: runningJob.interactionId,
      jobId: runningJob.id,
      requestedBy: runningJob.requestedBy,
      createdAt: completedAt,
      updatedAt: completedAt,
      ...proposal
    }));
    const validation = validateAiResponse({
      responseText: coordinatorResult.responseText,
      module: runningJob.module,
      promptPackage: coordinatorResult.promptPackage
    });
    const responseText =
      validation.status === "blocked"
        ? safeFallbackForBlockedResponse(validation)
        : applyResponseWarnings(coordinatorResult.responseText, validation);

    await aiRepo.createCitations(citations);
    const persistedProposals = validation.status === "blocked" ? [] : await aiRepo.createActionProposals(proposals);

    if (validation.status === "blocked") {
      const updatedInteraction = await aiRepo.updateInteraction(runningJob.interactionId, {
        status: "failed",
        responseText,
        responseSummary: responseText.slice(0, 180),
        modelProvider: coordinatorResult.providerMetadata.provider,
        modelName: coordinatorResult.providerMetadata.model,
        usage: coordinatorResult.usage,
        responseValidation: validation,
        completedAt,
        updatedAt: completedAt
      });
      const updatedJob = await aiRepo.updateJob(runningJob.id, {
        status: "failed",
        usage: coordinatorResult.usage,
        responseValidation: validation,
        errorCode: "ai_response_blocked",
        errorMessage: validation.reasons.map((reason) => reason.message).join(" "),
        resultSummary: `AI response bi chan boi validator voi ${validation.reasons.length} ly do.`,
        finishedAt: completedAt,
        updatedAt: completedAt
      });

      return {
        interaction: updatedInteraction,
        job: updatedJob,
        citations,
        actionProposals: persistedProposals
      };
    }

    const updatedInteraction = await aiRepo.updateInteraction(runningJob.interactionId, {
      status: "succeeded",
      responseText,
      responseSummary: responseText.slice(0, 180),
      modelProvider: coordinatorResult.providerMetadata.provider,
      modelName: coordinatorResult.providerMetadata.model,
      usage: coordinatorResult.usage,
      responseValidation: validation,
      completedAt,
      updatedAt: completedAt
    });
    const updatedJob = await aiRepo.updateJob(runningJob.id, {
      status: "succeeded",
      usage: coordinatorResult.usage,
      responseValidation: validation,
      resultSummary:
        validation.status === "warning"
          ? `Coordinator AI hoan tat voi ${validation.reasons.length} canh bao validator.`
          : `Coordinator AI da tao ${citations.length} citation va ${persistedProposals.length} de xuat hanh dong.`,
      finishedAt: completedAt,
      updatedAt: completedAt
    });

    return {
      interaction: updatedInteraction,
      job: updatedJob,
      citations,
      actionProposals: persistedProposals
    };
  } catch (error) {
    const failedAt = new Date().toISOString();
    const classified = classifyWorkerError(error);
    await aiRepo.updateJob(runningJob.id, {
      status: "failed",
      errorCode: classified.code,
      errorMessage: classified.message,
      finishedAt: failedAt,
      updatedAt: failedAt
    });
    await aiRepo.updateInteraction(runningJob.interactionId, {
      status: "failed",
      responseSummary: friendlyFailureSummary(classified.code),
      completedAt: failedAt,
      updatedAt: failedAt
    });
    throw error;
  }
}

function classifyWorkerError(error: unknown) {
  if (error instanceof AiProviderError) {
    return {
      code: error.code,
      message: error.message
    };
  }

  return {
    code: "provider_error",
    message: error instanceof Error ? error.message : "Loi worker AI khong xac dinh."
  };
}

function friendlyFailureSummary(code: string) {
  if (code === "missing_config") {
    return "AI chua duoc cau hinh provider de xu ly yeu cau.";
  }

  if (code === "timeout") {
    return "AI provider phan hoi qua cham. Vui long thu lai sau.";
  }

  if (code === "rate_limited") {
    return "AI provider dang gioi han tan suat. Vui long thu lai sau.";
  }

  if (code === "invalid_response") {
    return "AI provider tra ve phan hoi khong hop le.";
  }

  return "AI job xu ly that bai.";
}
