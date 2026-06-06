import { can, type PermissionUser } from "@/lib/permissions/can";
import type {
  ExternalSearchLog,
  ExternalSourceCandidate,
  KnowledgeCandidate,
  KnowledgeConfidence,
  KnowledgeModule,
  KnowledgeSourceType
} from "@/modules/knowledge/types";

import {
  externalSearchLogRepository,
  type ExternalSearchLogListFilters,
  type ExternalSearchLogRepository
} from "./external-search-log-repository";
import {
  ExternalSearchProviderError,
  getExternalSearchProviderFromEnv,
  type ExternalSearchProvider,
  type RawExternalSearchResult
} from "./external-search-provider";
import { createKnowledgeCandidate } from "./knowledge-candidate-service";
import { knowledgeCandidateRepository, type KnowledgeCandidateRepository } from "./knowledge-candidate-repository";
import { listActiveSourceRegistryEntries } from "@/modules/settings/services/source-registry-settings-service";

import { findSourceRegistryEntryInRegistry, isAllowedSourceUrlInRegistry, normalizeSourceUrl, SOURCE_REGISTRY } from "./source-registry";

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function now() {
  return new Date().toISOString();
}

function assertIntakePermission(user: PermissionUser) {
  if (!can(user, "knowledge.create_candidate") && !can(user, "knowledge.review")) {
    throw new Error("Ban khong co quyen intake nguon tri thuc.");
  }
}

function fallbackClassify(raw: RawExternalSearchResult): {
  sourceType: KnowledgeSourceType;
  confidence: KnowledgeConfidence;
  module: KnowledgeModule;
  tags: string[];
} {
  const text = `${raw.title} ${raw.snippet} ${raw.url}`.toLowerCase();

  if (text.includes("phap") || text.includes("legal") || text.includes("dat-dai")) {
    return { sourceType: "law", confidence: "external_reference", module: "legal", tags: ["phap-ly"] };
  }

  if (text.includes("xay") || text.includes("construction") || text.includes("quy-chuan")) {
    return { sourceType: "standard", confidence: "external_reference", module: "construction", tags: ["xay-dung"] };
  }

  if (text.includes("finance") || text.includes("thanh-toan") || text.includes("tai-chinh")) {
    return { sourceType: "market", confidence: "external_reference", module: "finance", tags: ["tai-chinh"] };
  }

  return { sourceType: "internal_note", confidence: "unknown", module: "general", tags: ["candidate"] };
}

export function normalizeExternalSource(
  raw: RawExternalSearchResult,
  registry: Awaited<ReturnType<typeof listActiveSourceRegistryEntries>> | readonly typeof SOURCE_REGISTRY[number][] = SOURCE_REGISTRY
): ExternalSourceCandidate {
  const registryEntry = findSourceRegistryEntryInRegistry(raw.url, registry);
  const classified = registryEntry
    ? {
        sourceType: registryEntry.sourceType,
        confidence: registryEntry.confidence,
        module: registryEntry.module,
        tags: registryEntry.tags
      }
    : fallbackClassify(raw);

  return {
    id: createId("candidate"),
    title: raw.title.trim(),
    url: raw.url.trim(),
    provider: raw.provider,
    publishedAt: raw.publishedAt,
    retrievedAt: raw.retrievedAt ?? now(),
    snippet: raw.snippet.trim(),
    ...classified
  };
}

export async function runExternalSourceSearch(
  input: {
    user: PermissionUser;
    query: string;
    limit?: number;
  },
  provider?: ExternalSearchProvider,
  logRepository: ExternalSearchLogRepository = externalSearchLogRepository
) {
  assertIntakePermission(input.user);
  const query = input.query.trim();

  if (!query) {
    throw new Error("Tu khoa tim kiem la bat buoc.");
  }

  const searchProvider = provider ?? getExternalSearchProviderFromEnv();
  const rawResults = await searchProvider.search({ query, limit: input.limit });
  const registry = await listActiveSourceRegistryEntries();
  const candidates = rawResults.map((result) => normalizeExternalSource(result, registry));
  const log: ExternalSearchLog = {
    id: createId("search-log"),
    userId: input.user.id,
    query,
    provider: searchProvider.key,
    providerMetadata: searchProvider.metadata,
    resultCount: candidates.length,
    createdAt: now()
  };

  await logRepository.createLog(log);

  return { candidates, log };
}

export async function importExternalSourceCandidate(
  input: {
    user: PermissionUser;
    candidate: ExternalSourceCandidate;
  },
  candidateRepository: KnowledgeCandidateRepository = knowledgeCandidateRepository
): Promise<KnowledgeCandidate> {
  assertIntakePermission(input.user);

  const registry = await listActiveSourceRegistryEntries();

  if (!isAllowedSourceUrlInRegistry(input.candidate.url, registry)) {
    throw new Error("Nguon nay khong nam trong source registry/allowlist, khong the import.");
  }

  const normalizedCandidateUrl = normalizeSourceUrl(input.candidate.url);
  const existingCandidates = await candidateRepository.listKnowledgeCandidates({ sourceType: "web_search", status: "all" });
  const duplicate = existingCandidates.find(
    (candidate) => candidate.sourceRefId && normalizeSourceUrl(candidate.sourceRefId) === normalizedCandidateUrl
  );

  if (duplicate) {
    throw new Error("Nguon nay da ton tai trong Knowledge Candidate queue.");
  }

  const created = await createKnowledgeCandidate(
    {
      title: input.candidate.title,
      sourceType: "web_search",
      sourceRefId: input.candidate.url,
      module: input.candidate.module,
      extractedText: input.candidate.snippet,
      notes: [
        `Provider: ${input.candidate.provider}.`,
        `Retrieved at: ${input.candidate.retrievedAt}.`,
        `Original source type: ${input.candidate.sourceType}.`,
        `Confidence: ${input.candidate.confidence}.`,
        `Tags: ${[...new Set(["external-intake", input.candidate.provider, ...input.candidate.tags])].join(", ")}.`
      ].join("\n")
    },
    input.user,
    candidateRepository
  );

  return candidateRepository.updateKnowledgeCandidate(created.id, {
    status: "pending_review",
    updatedAt: now()
  });
}

export type { ExternalSearchLogListFilters };

export async function listExternalSearchLogs(
  filters: ExternalSearchLogListFilters = {},
  repository: ExternalSearchLogRepository = externalSearchLogRepository
) {
  return repository.listLogs(filters);
}

export function getFriendlyExternalSearchErrorMessage(error: unknown) {
  const errorCode =
    error instanceof ExternalSearchProviderError
      ? error.code
      : typeof error === "object" && error && "code" in error && typeof error.code === "string"
        ? error.code
        : undefined;

  if (errorCode) {
    if (errorCode === "missing_config") {
      return "Web Search provider chưa có API key. Có thể tạm thời chuyển sang mock_web để test UI.";
    }

    if (errorCode === "rate_limited") {
      return "Web Search API key đang bị giới hạn tần suất hoặc hết quota. Vui lòng thử lại sau.";
    }

    if (errorCode === "timeout") {
      return "Web Search provider phản hồi quá lâu. Vui lòng thử lại hoặc tăng WEB_SEARCH_TIMEOUT_MS.";
    }

    if (errorCode === "invalid_response") {
      return "Web Search provider trả về dữ liệu không đúng định dạng. Vui lòng kiểm tra provider đang cấu hình.";
    }
  }

  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : typeof error === "object" && error && "message" in error && typeof error.message === "string"
        ? error.message.toLowerCase()
        : "";

  if (message.includes("invalid") || message.includes("unauthorized") || message.includes("401")) {
    return "Web Search API key không hợp lệ hoặc không có quyền gọi provider.";
  }

  return "Không thể chạy Web Search lúc này. Vui lòng kiểm tra cấu hình hoặc chuyển sang mock_web nếu cần test UI.";
}
