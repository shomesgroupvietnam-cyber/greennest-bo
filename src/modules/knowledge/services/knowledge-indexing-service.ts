import { can, type PermissionUser } from "@/lib/permissions/can";
import { isExternalRole } from "@/lib/permissions/access-scope";
import type {
  KnowledgeAccessLevel,
  KnowledgeChunk,
  KnowledgeRetrievalContext,
  KnowledgeModule,
  KnowledgeRetrievalResult,
  KnowledgeSourceType
} from "@/modules/knowledge/types";

import { knowledgeIndexRepository, type KnowledgeIndexRepository } from "./knowledge-index-repository";
import { knowledgeRepository, type KnowledgeRepository } from "./knowledge-repository";
import {
  cosineVectorRetrievalAdapter,
  getEmbeddingProviderFromEnv,
  hasStoredEmbedding,
  mockEmbeddingProvider,
  type EmbeddingProvider,
  type VectorRetrievalAdapter
} from "./knowledge-vector-retrieval";

const CHUNK_MAX_LENGTH = 700;

function now() {
  return new Date().toISOString();
}

function chunkId(knowledgeItemId: string, order: number) {
  return `${knowledgeItemId}-chunk-${String(order + 1).padStart(3, "0")}`;
}

function resolveAccessLevel(sourceType: KnowledgeSourceType): KnowledgeAccessLevel {
  if (sourceType === "law" || sourceType === "standard" || sourceType === "market") {
    return "public_read";
  }

  if (sourceType === "template" || sourceType === "technical_guideline") {
    return "external_limited";
  }

  return "internal";
}

function allowedAccessLevelsForUser(user: PermissionUser): KnowledgeAccessLevel[] {
  if (isExternalRole(user.role)) {
    return ["public_read", "external_limited"];
  }

  if (user.role === "viewer") {
    return ["public_read"];
  }

  return ["public_read", "external_limited", "internal"];
}

function splitTextIntoChunks(text: string) {
  const paragraphs = text
    .split(/\n{2,}|\r?\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs.length > 0 ? paragraphs : [text.trim()]) {
    if (!current) {
      current = paragraph;
      continue;
    }

    if (`${current}\n\n${paragraph}`.length <= CHUNK_MAX_LENGTH) {
      current = `${current}\n\n${paragraph}`;
      continue;
    }

    chunks.push(current);
    current = paragraph;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.flatMap((chunk) => {
    if (chunk.length <= CHUNK_MAX_LENGTH) {
      return [chunk];
    }

    const result: string[] = [];
    for (let index = 0; index < chunk.length; index += CHUNK_MAX_LENGTH) {
      result.push(chunk.slice(index, index + CHUNK_MAX_LENGTH).trim());
    }

    return result.filter(Boolean);
  });
}

function buildIndexText(input: {
  title: string;
  summary?: string;
  notes?: string;
  tags: string[];
  jurisdiction?: string;
}) {
  const sections = [
    `Tiêu đề: ${input.title}`,
    input.summary ? `Tóm tắt: ${input.summary}` : undefined,
    input.notes ? `Ghi chú: ${input.notes}` : undefined,
    input.jurisdiction ? `Phạm vi áp dụng: ${input.jurisdiction}` : undefined,
    input.tags.length > 0 ? `Tags: ${input.tags.join(", ")}` : undefined
  ].filter(Boolean);

  return sections.join("\n\n");
}

export async function indexKnowledgeItem(
  knowledgeItemId: string,
  options: { includeNonApproved?: boolean } = {},
  itemRepository: KnowledgeRepository = knowledgeRepository,
  indexRepository: KnowledgeIndexRepository = knowledgeIndexRepository
) {
  const item = await itemRepository.getKnowledgeItem(knowledgeItemId);

  if (!item) {
    throw new Error("Không tìm thấy nguồn tri thức để index.");
  }

  if (item.status !== "approved" && !options.includeNonApproved) {
    await indexRepository.deleteKnowledgeChunksForItem(knowledgeItemId);
    return [];
  }

  if (item.status === "approved" && !item.isRagEligible) {
    await indexRepository.deleteKnowledgeChunksForItem(knowledgeItemId);
    return [];
  }

  const timestamp = now();
  const sourceText = buildIndexText(item);
  const chunks = splitTextIntoChunks(sourceText).map<KnowledgeChunk>((chunkText, chunkOrder) => ({
    id: chunkId(item.id, chunkOrder),
    knowledgeItemId: item.id,
    module: item.module,
    chunkText,
    chunkOrder,
    sourceType: item.sourceType,
    status: item.status,
    effectiveDate: item.effectiveDate,
    expiresAt: item.expiryDate,
    accessLevel: resolveAccessLevel(item.sourceType),
    citation: {
      knowledgeItemId: item.id,
      knowledgeTitle: item.title,
      sourceUrl: item.sourceUrl,
      sourceFileId: item.sourceFileId,
      sourceType: item.sourceType,
      module: item.module,
      jurisdiction: item.jurisdiction,
      effectiveDate: item.effectiveDate,
      expiresAt: item.expiryDate
    },
    createdAt: timestamp,
    updatedAt: timestamp
  }));

  return indexRepository.replaceKnowledgeChunksForItem(item.id, chunks);
}

export async function deleteKnowledgeItemIndex(
  knowledgeItemId: string,
  indexRepository: KnowledgeIndexRepository = knowledgeIndexRepository
) {
  await indexRepository.deleteKnowledgeChunksForItem(knowledgeItemId);
}

export async function listKnowledgeChunksByItem(
  knowledgeItemId: string,
  indexRepository: KnowledgeIndexRepository = knowledgeIndexRepository
) {
  return indexRepository.listKnowledgeChunksByItem(knowledgeItemId);
}

export async function generateKnowledgeChunkEmbeddings(
  input: {
    knowledgeItemId?: string;
    force?: boolean;
    embeddingProvider?: EmbeddingProvider;
  } = {},
  indexRepository: KnowledgeIndexRepository = knowledgeIndexRepository
) {
  const provider = input.embeddingProvider ?? getEmbeddingProviderFromEnv();
  const chunks = await indexRepository.listKnowledgeChunks({
    knowledgeItemId: input.knowledgeItemId,
    status: "approved"
  });
  const chunksToEmbed = chunks.filter((chunk) => {
    if (input.force) {
      return true;
    }

    return !hasStoredEmbedding(chunk) || chunk.embeddingModel !== provider.metadata.model;
  });

  if (chunksToEmbed.length === 0) {
    return {
      embedded: [],
      skipped: chunks
    };
  }

  const embeddings = await provider.embedBatch(chunksToEmbed.map((chunk) => chunk.chunkText));
  const timestamp = now();
  const embedded: KnowledgeChunk[] = [];

  for (const [index, chunk] of chunksToEmbed.entries()) {
    embedded.push(
      await indexRepository.updateKnowledgeChunk(chunk.id, {
        embedding: embeddings[index],
        embeddingModel: provider.metadata.model,
        embeddedAt: timestamp,
        updatedAt: timestamp
      })
    );
  }

  return {
    embedded,
    skipped: chunks.filter((chunk) => !chunksToEmbed.some((embeddedChunk) => embeddedChunk.id === chunk.id))
  };
}

export async function retrieveKnowledgeChunks(
  input: {
    user: PermissionUser;
    module?: KnowledgeModule | "all";
    query?: string;
    limit?: number;
    topK?: number;
    sourceTypes?: KnowledgeSourceType[];
    retrievalMode?: "deterministic" | "vector";
    embeddingProvider?: EmbeddingProvider;
    vectorAdapter?: VectorRetrievalAdapter;
  },
  indexRepository: KnowledgeIndexRepository = knowledgeIndexRepository
): Promise<KnowledgeRetrievalResult[]> {
  if (!can(input.user, "knowledge.view")) {
    return [];
  }

  const chunks = await indexRepository.listKnowledgeChunks({
    module: input.module ?? "all",
    status: "approved",
    accessLevels: allowedAccessLevelsForUser(input.user),
    sourceTypes: input.sourceTypes
  });
  const nowDate = new Date();
  const activeChunks = chunks.filter((chunk) => {
    const isEffective = !chunk.effectiveDate || new Date(chunk.effectiveDate) <= nowDate;
    const isNotExpired = !chunk.expiresAt || new Date(chunk.expiresAt) >= nowDate;

    return isEffective && isNotExpired;
  });
  const topK = input.topK ?? input.limit ?? 10;

  if (input.retrievalMode === "vector" && input.query?.trim()) {
    const embeddedChunks = activeChunks.filter(hasStoredEmbedding);

    if (embeddedChunks.length === 0 && !input.embeddingProvider && !input.vectorAdapter) {
      return retrieveDeterministicChunks(activeChunks, input.query, topK);
    }

    const ranked = await (input.vectorAdapter ?? cosineVectorRetrievalAdapter).rank({
      chunks: embeddedChunks.length > 0 ? embeddedChunks : activeChunks,
      embeddingProvider: input.embeddingProvider ?? mockEmbeddingProvider,
      query: input.query,
      topK
    });

    return ranked.map(({ chunk, score }) => ({
      chunk,
      citation: chunk.citation,
      retrievalMode: "vector",
      score
    }));
  }

  return retrieveDeterministicChunks(activeChunks, input.query, topK);
}

function countTermMatches(text: string, query: string) {
  const terms = query.split(/\s+/).filter(Boolean);
  const normalizedText = text.toLowerCase();

  return terms.reduce((total, term) => total + (normalizedText.includes(term) ? 1 : 0), 0);
}

function retrieveDeterministicChunks(chunks: KnowledgeChunk[], rawQuery: string | undefined, topK: number): KnowledgeRetrievalResult[] {
  const query = rawQuery?.trim().toLowerCase();
  const deterministicChunks = query
    ? chunks
        .map((chunk) => ({
          chunk,
          score:
            countTermMatches(chunk.chunkText, query) * 2 +
            countTermMatches(chunk.citation.knowledgeTitle, query) +
            countTermMatches(chunk.citation.jurisdiction ?? "", query)
        }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score || a.chunk.chunkOrder - b.chunk.chunkOrder)
        .map(({ chunk, score }) => ({ chunk, score }))
    : chunks.map((chunk) => ({ chunk, score: 0 }));

  return deterministicChunks.slice(0, topK).map(({ chunk, score }) => ({
    chunk,
    citation: chunk.citation,
    retrievalMode: "deterministic",
    score
  }));
}

export function buildKnowledgeRetrievalContext(
  results: KnowledgeRetrievalResult[],
  options: { maxLength?: number } = {}
): KnowledgeRetrievalContext {
  const maxLength = options.maxLength ?? 4000;
  const selectedChunks: KnowledgeRetrievalResult[] = [];
  const citations: KnowledgeRetrievalContext["citations"] = [];
  const contextParts: string[] = [];
  let usedLength = 0;
  let truncated = false;

  for (const result of results) {
    const part = `[${result.citation.knowledgeTitle}] ${result.chunk.chunkText}`;
    const nextLength = usedLength + part.length + (contextParts.length > 0 ? 2 : 0);

    if (nextLength > maxLength) {
      truncated = true;
      break;
    }

    selectedChunks.push(result);
    citations.push(result.citation);
    contextParts.push(part);
    usedLength = nextLength;
  }

  return {
    selectedChunks,
    citations,
    contextText: contextParts.join("\n\n"),
    maxLength,
    usedLength,
    truncated
  };
}
