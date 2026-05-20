import type { PermissionUser } from "@/lib/permissions/can";
import type { SourceRegistrySettingsRepository } from "@/modules/settings/services/source-registry-settings-repository";

import type { ExternalSearchProvider } from "./external-search-provider";
import type { KnowledgeCandidateRepository } from "./knowledge-candidate-repository";
import {
  knowledgeDiscoveryRepository,
  type KnowledgeDiscoveryRepository
} from "./knowledge-discovery-repository";
import { classifyDiscoveryError, runKnowledgeDiscoveryTopicNow } from "./knowledge-discovery-service";
import type { KnowledgeDiscoveryTopic } from "../types";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const LOCK_TIMEOUT_MS = 15 * 60 * 1000;
const BASE_RETRY_DELAY_MS = 15 * 60 * 1000;

export type DiscoverySchedulerOptions = {
  now?: Date;
  runnerId?: string;
  user?: PermissionUser;
  discoveryRepository?: KnowledgeDiscoveryRepository;
  candidateRepository?: KnowledgeCandidateRepository;
  sourceRegistryRepository?: SourceRegistrySettingsRepository;
  provider?: ExternalSearchProvider;
};

export type DiscoverySchedulerResult = {
  dueCount: number;
  attemptedCount: number;
  succeededCount: number;
  failedCount: number;
  skippedLockedCount: number;
  importedCount: number;
  results: Array<{
    topicId: string;
    status: "succeeded" | "partial" | "failed" | "locked";
    importedCount: number;
    retryCount?: number;
    nextRetryAt?: string;
    errorMessage?: string;
  }>;
};

const schedulerUser: PermissionUser = {
  id: "discovery-scheduler",
  role: "admin"
};

export function isKnowledgeDiscoveryTopicDue(topic: KnowledgeDiscoveryTopic, referenceDate = new Date()) {
  if (!topic.enabled || topic.frequency === "manual" || isTopicLocked(topic, referenceDate)) {
    return false;
  }

  if (topic.lastRunStatus === "failed") {
    return Boolean(topic.nextRetryAt && topic.retryCount < topic.maxRetries && new Date(topic.nextRetryAt) <= referenceDate);
  }

  if (!topic.lastRunAt) {
    return true;
  }

  const elapsedMs = referenceDate.getTime() - new Date(topic.lastRunAt).getTime();

  if (topic.frequency === "daily") {
    return elapsedMs >= ONE_DAY_MS;
  }

  if (topic.frequency === "weekly") {
    return elapsedMs >= 7 * ONE_DAY_MS;
  }

  return false;
}

export async function listDueKnowledgeDiscoveryTopics(
  referenceDate = new Date(),
  repository: KnowledgeDiscoveryRepository = knowledgeDiscoveryRepository
) {
  const topics = await repository.listTopics();

  return topics.filter((topic) => isKnowledgeDiscoveryTopicDue(topic, referenceDate));
}

export async function runDueKnowledgeDiscoveryTopics(options: DiscoverySchedulerOptions = {}): Promise<DiscoverySchedulerResult> {
  const referenceDate = options.now ?? new Date();
  const runnerId = options.runnerId ?? `discovery-scheduler-${referenceDate.toISOString()}`;
  const user = options.user ?? schedulerUser;
  const discoveryRepository = options.discoveryRepository ?? knowledgeDiscoveryRepository;
  const dueTopics = await listDueKnowledgeDiscoveryTopics(referenceDate, discoveryRepository);
  const result: DiscoverySchedulerResult = {
    dueCount: dueTopics.length,
    attemptedCount: 0,
    succeededCount: 0,
    failedCount: 0,
    skippedLockedCount: 0,
    importedCount: 0,
    results: []
  };

  for (const topic of dueTopics) {
    const lockedTopic = await discoveryRepository.tryLockTopic(
      topic.id,
      runnerId,
      referenceDate.toISOString(),
      new Date(referenceDate.getTime() - LOCK_TIMEOUT_MS).toISOString()
    );

    if (!lockedTopic) {
      result.skippedLockedCount += 1;
      result.results.push({ topicId: topic.id, status: "locked", importedCount: 0 });
      continue;
    }

    result.attemptedCount += 1;

    try {
      const runResult = await runKnowledgeDiscoveryTopicNow(lockedTopic.id, user, {
        discoveryRepository,
        candidateRepository: options.candidateRepository,
        sourceRegistryRepository: options.sourceRegistryRepository,
        provider: options.provider
      });
      const retryPatch = buildRetryPatch(
        lockedTopic,
        runResult.runLog.status,
        referenceDate,
        runResult.runLog.errorCode,
        runResult.runLog.errorMessage
      );
      const releasedTopic = await discoveryRepository.releaseTopicLock(lockedTopic.id, runnerId, {
        ...retryPatch,
        updatedBy: user.id,
        updatedAt: new Date().toISOString()
      });

      if (runResult.runLog.status === "failed") {
        result.failedCount += 1;
      } else {
        result.succeededCount += 1;
      }

      result.importedCount += runResult.imported.length;
      result.results.push({
        topicId: lockedTopic.id,
        status: runResult.runLog.status,
        importedCount: runResult.imported.length,
        retryCount: releasedTopic.retryCount,
        nextRetryAt: releasedTopic.nextRetryAt,
        errorMessage: releasedTopic.errorMessage
      });
    } catch (error) {
      const retryPatch = buildRetryPatch(
        lockedTopic,
        "failed",
        referenceDate,
        classifyDiscoveryError(error),
        error instanceof Error ? error.message : "Loi scheduler khong xac dinh."
      );
      const releasedTopic = await discoveryRepository.releaseTopicLock(lockedTopic.id, runnerId, {
        ...retryPatch,
        lastRunStatus: "failed",
        updatedBy: user.id,
        updatedAt: new Date().toISOString()
      });

      result.failedCount += 1;
      result.results.push({
        topicId: lockedTopic.id,
        status: "failed",
        importedCount: 0,
        retryCount: releasedTopic.retryCount,
        nextRetryAt: releasedTopic.nextRetryAt,
        errorMessage: releasedTopic.errorMessage
      });
    }
  }

  return result;
}

function isTopicLocked(topic: KnowledgeDiscoveryTopic, referenceDate: Date) {
  return Boolean(topic.lockedAt && new Date(topic.lockedAt).getTime() > referenceDate.getTime() - LOCK_TIMEOUT_MS);
}

function buildRetryPatch(
  topic: KnowledgeDiscoveryTopic,
  status: "succeeded" | "partial" | "failed",
  referenceDate: Date,
  errorCode?: KnowledgeDiscoveryTopic["errorCode"],
  errorMessage?: string
): Partial<KnowledgeDiscoveryTopic> {
  if (status !== "failed") {
    return {
      retryCount: 0,
      nextRetryAt: undefined,
      errorCode: undefined,
      errorMessage: undefined
    };
  }

  const retryCount = topic.retryCount + 1;
  const nextRetryAt =
    retryCount < topic.maxRetries ? new Date(referenceDate.getTime() + BASE_RETRY_DELAY_MS * Math.max(retryCount, 1)).toISOString() : undefined;

  return {
    retryCount,
    maxRetries: topic.maxRetries,
    nextRetryAt,
    errorCode,
    errorMessage
  };
}
