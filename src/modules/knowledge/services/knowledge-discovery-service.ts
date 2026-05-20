import { can, type PermissionUser } from "@/lib/permissions/can";
import type { SourceRegistrySettingsRepository } from "@/modules/settings/services/source-registry-settings-repository";
import {
  listActiveSourceRegistryEntries
} from "@/modules/settings/services/source-registry-settings-service";
import type { ExternalSourceCandidate, KnowledgeCandidate, KnowledgeDiscoveryTopic, KnowledgeDiscoveryTopicInput } from "@/modules/knowledge/types";
import { knowledgeDiscoveryTopicInputSchema } from "@/modules/knowledge/validation";

import { ExternalSearchProviderError, type ExternalSearchProvider, getExternalSearchProviderFromEnv } from "./external-search-provider";
import { knowledgeCandidateRepository, type KnowledgeCandidateRepository } from "./knowledge-candidate-repository";
import { knowledgeDiscoveryRepository, type KnowledgeDiscoveryRepository } from "./knowledge-discovery-repository";
import { normalizeExternalSource } from "./knowledge-intake-service";
import { isAllowedSourceUrlInRegistry, normalizeSourceUrl } from "./source-registry";

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function now() {
  return new Date().toISOString();
}

function assertManageDiscovery(user: PermissionUser) {
  if (!can(user, "settings.manage") && !can(user, "knowledge.manage_source_registry")) {
    throw new Error("Ban khong co quyen quan ly discovery topic.");
  }
}

export async function listKnowledgeDiscoveryTopics(repository: KnowledgeDiscoveryRepository = knowledgeDiscoveryRepository) {
  return repository.listTopics();
}

export async function listKnowledgeDiscoveryRunLogs(
  filters: { topicId?: string } = {},
  repository: KnowledgeDiscoveryRepository = knowledgeDiscoveryRepository
) {
  return repository.listRunLogs(filters);
}

export async function createKnowledgeDiscoveryTopic(
  input: KnowledgeDiscoveryTopicInput,
  user: PermissionUser,
  repository: KnowledgeDiscoveryRepository = knowledgeDiscoveryRepository
) {
  assertManageDiscovery(user);
  const parsed = knowledgeDiscoveryTopicInputSchema.parse(input);
  const timestamp = now();
  const topic: KnowledgeDiscoveryTopic = {
    id: createId("discovery-topic"),
    module: parsed.module,
    query: parsed.query,
    enabled: parsed.enabled,
    frequency: parsed.frequency,
    ownerId: parsed.ownerId,
    reviewerId: parsed.reviewerId,
    lastRunStatus: "never_run",
    retryCount: 0,
    maxRetries: parsed.maxRetries,
    createdBy: user.id,
    updatedBy: user.id,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  return repository.createTopic(topic);
}

export async function updateKnowledgeDiscoveryTopic(
  topicId: string,
  input: KnowledgeDiscoveryTopicInput,
  user: PermissionUser,
  repository: KnowledgeDiscoveryRepository = knowledgeDiscoveryRepository
) {
  assertManageDiscovery(user);
  const parsed = knowledgeDiscoveryTopicInputSchema.parse(input);

  return repository.updateTopic(topicId, {
    module: parsed.module,
    query: parsed.query,
    enabled: parsed.enabled,
    frequency: parsed.frequency,
    ownerId: parsed.ownerId,
    reviewerId: parsed.reviewerId,
    maxRetries: parsed.maxRetries,
    updatedBy: user.id,
    updatedAt: now()
  });
}

export async function runKnowledgeDiscoveryTopicNow(
  topicId: string,
  user: PermissionUser,
  {
    discoveryRepository = knowledgeDiscoveryRepository,
    candidateRepository = knowledgeCandidateRepository,
    provider,
    sourceRegistryRepository
  }: {
    discoveryRepository?: KnowledgeDiscoveryRepository;
    candidateRepository?: KnowledgeCandidateRepository;
    provider?: ExternalSearchProvider;
    sourceRegistryRepository?: SourceRegistrySettingsRepository;
  } = {}
) {
  assertManageDiscovery(user);
  const topic = await discoveryRepository.getTopic(topicId);

  if (!topic) {
    throw new Error("Khong tim thay discovery topic.");
  }

  if (!topic.enabled) {
    throw new Error("Discovery topic dang bi tat.");
  }

  const startedAt = now();

  try {
    const searchProvider = provider ?? getExternalSearchProviderFromEnv();
    const registry = await listActiveSourceRegistryEntries(sourceRegistryRepository);
    const rawResults = await searchProvider.search({ query: topic.query });
    const candidates = rawResults.map((result) => normalizeExternalSource(result, registry));
    const existingUrls = new Set(
      (await candidateRepository.listKnowledgeCandidates({ sourceType: "web_search", status: "all" }))
        .map((candidate) => candidate.sourceRefId)
        .filter(Boolean)
        .map((url) => normalizeSourceUrl(url as string))
    );
    const imported: KnowledgeCandidate[] = [];
    let skippedDuplicateCount = 0;
    let skippedDisallowedCount = 0;

    for (const candidate of candidates) {
      const normalizedUrl = normalizeSourceUrl(candidate.url);

      if (!isAllowedSourceUrlInRegistry(candidate.url, registry)) {
        skippedDisallowedCount += 1;
        continue;
      }

      if (existingUrls.has(normalizedUrl)) {
        skippedDuplicateCount += 1;
        continue;
      }

      imported.push(await createPendingReviewCandidate(candidate, topic, user.id, candidateRepository));
      existingUrls.add(normalizedUrl);
    }

    const finishedAt = now();
    const status = imported.length === candidates.length ? "succeeded" : "partial";
    const runLog = await discoveryRepository.createRunLog({
      id: createId("discovery-run"),
      topicId: topic.id,
      runBy: user.id,
      query: topic.query,
      provider: searchProvider.key,
      providerMetadata: searchProvider.metadata,
      status,
      resultCount: candidates.length,
      importedCount: imported.length,
      skippedDuplicateCount,
      skippedDisallowedCount,
      retryCount: 0,
      maxRetries: topic.maxRetries,
      startedAt,
      finishedAt
    });
    const updatedTopic = await discoveryRepository.updateTopic(topic.id, {
      lastRunAt: finishedAt,
      lastRunStatus: status,
      retryCount: 0,
      nextRetryAt: undefined,
      errorCode: undefined,
      errorMessage: undefined,
      updatedBy: user.id,
      updatedAt: finishedAt
    });

    return { topic: updatedTopic, runLog, imported };
  } catch (error) {
    const fallbackProvider = provider ?? {
      key: process.env.WEB_SEARCH_PROVIDER || "unknown",
      metadata: {
        provider: process.env.WEB_SEARCH_PROVIDER || "unknown",
        maxResults: Number(process.env.WEB_SEARCH_MAX_RESULTS ?? 0),
        timeoutMs: Number(process.env.WEB_SEARCH_TIMEOUT_MS ?? 0)
      }
    };
    const finishedAt = now();
    const errorCode = classifyDiscoveryError(error);
    const errorMessage = error instanceof Error ? error.message : "Loi discovery khong xac dinh.";
    const runLog = await discoveryRepository.createRunLog({
      id: createId("discovery-run"),
      topicId: topic.id,
      runBy: user.id,
      query: topic.query,
      provider: fallbackProvider.key,
      providerMetadata: fallbackProvider.metadata,
      status: "failed",
      resultCount: 0,
      importedCount: 0,
      skippedDuplicateCount: 0,
      skippedDisallowedCount: 0,
      retryCount: topic.retryCount,
      maxRetries: topic.maxRetries,
      errorCode,
      errorMessage,
      startedAt,
      finishedAt
    });
    const updatedTopic = await discoveryRepository.updateTopic(topic.id, {
      lastRunAt: finishedAt,
      lastRunStatus: "failed",
      errorCode,
      errorMessage,
      updatedBy: user.id,
      updatedAt: finishedAt
    });

    return { topic: updatedTopic, runLog, imported: [] };
  }
}

async function createPendingReviewCandidate(
  candidate: ExternalSourceCandidate,
  topic: KnowledgeDiscoveryTopic,
  submittedBy: string,
  repository: KnowledgeCandidateRepository
) {
  const timestamp = now();

  return repository.createKnowledgeCandidate({
    id: createId("candidate"),
    sourceType: "web_search",
    sourceRefId: candidate.url,
    module: candidate.module,
    title: candidate.title,
    extractedText: candidate.snippet,
    submittedBy,
    status: "pending_review",
    notes: [
      `Discovery topic: ${topic.id}.`,
      `Provider: ${candidate.provider}.`,
      `Retrieved at: ${candidate.retrievedAt}.`,
      `Original source type: ${candidate.sourceType}.`,
      `Confidence: ${candidate.confidence}.`,
      `Tags: ${[...new Set(["discovery", "external-intake", candidate.provider, ...candidate.tags])].join(", ")}.`
    ].join("\n"),
    createdAt: timestamp,
    updatedAt: timestamp
  });
}

export function classifyDiscoveryError(error: unknown) {
  if (error instanceof ExternalSearchProviderError) {
    return error.code;
  }

  return "unknown";
}
