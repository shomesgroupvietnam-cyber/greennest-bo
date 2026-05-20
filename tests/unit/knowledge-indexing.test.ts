import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { JsonKnowledgeIndexRepository } from "@/modules/knowledge/services/knowledge-index-repository";
import {
  buildKnowledgeRetrievalContext,
  generateKnowledgeChunkEmbeddings,
  indexKnowledgeItem,
  retrieveKnowledgeChunks
} from "@/modules/knowledge/services/knowledge-indexing-service";
import { JsonKnowledgeRepository } from "@/modules/knowledge/services/knowledge-repository";
import {
  approveKnowledgeItem,
  createKnowledgeItem,
  markKnowledgeItemExpired,
  rejectKnowledgeItem
} from "@/modules/knowledge/services/knowledge-service";
import {
  getEmbeddingProviderFromEnv,
  MockEmbeddingProvider,
  OpenAICompatibleEmbeddingProvider,
  type EmbeddingProvider,
  type VectorRetrievalAdapter
} from "@/modules/knowledge/services/knowledge-vector-retrieval";

let tempDir: string;
let filePath: string;
let itemRepository: JsonKnowledgeRepository;
let indexRepository: JsonKnowledgeIndexRepository;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-knowledge-index-"));
  filePath = path.join(tempDir, "knowledge-center.json");
  itemRepository = new JsonKnowledgeRepository(filePath);
  indexRepository = new JsonKnowledgeIndexRepository(filePath);
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("knowledge RAG indexing", () => {
  it("indexes approved knowledge items into deterministic chunks", async () => {
    const item = await createKnowledgeItem(
      {
        title: "Luật Đất đai 2024",
        sourceUrl: "https://example.com/legal/land-law",
        sourceType: "law",
        module: "legal",
        status: "pending_review",
        confidence: "official",
        tags: ["pháp lý", "đất đai"],
        summary: "Nguồn pháp lý chính thức cho điều kiện đất đai dự án.",
        notes: "Cần trích dẫn khi trả lời câu hỏi pháp lý."
      },
      "legal-manager",
      itemRepository
    );
    await approveKnowledgeItem(item.id, "legal-manager", {}, itemRepository);

    const chunks = await indexKnowledgeItem(item.id, {}, itemRepository, indexRepository);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.id).toBe(`${item.id}-chunk-001`);
    expect(chunks[0]?.status).toBe("approved");
    expect(chunks[0]?.accessLevel).toBe("public_read");
    expect(chunks[0]?.citation.knowledgeItemId).toBe(item.id);
  });

  it("does not index pending, rejected or expired items for normal retrieval", async () => {
    const pending = await createKnowledgeItem(
      {
        title: "Nguồn đang chờ review",
        sourceType: "template",
        module: "reports",
        status: "pending_review",
        confidence: "internal_approved",
        tags: ["báo cáo"],
        summary: "Chưa được duyệt."
      },
      "assistant-01",
      itemRepository
    );
    const rejectedSource = await createKnowledgeItem(
      {
        title: "Nguồn bị từ chối",
        sourceType: "policy",
        module: "documents",
        status: "pending_review",
        confidence: "internal_approved",
        tags: ["hồ sơ"],
        summary: "Sẽ bị từ chối."
      },
      "assistant-01",
      itemRepository
    );
    const expiredSource = await createKnowledgeItem(
      {
        title: "Nguồn hết hiệu lực",
        sourceType: "standard",
        module: "construction",
        status: "pending_review",
        confidence: "official",
        tags: ["thi công"],
        summary: "Sẽ bị hết hiệu lực."
      },
      "technical-01",
      itemRepository
    );

    await rejectKnowledgeItem(rejectedSource.id, "pm-01", {}, itemRepository);
    await approveKnowledgeItem(expiredSource.id, "pm-01", {}, itemRepository);
    await markKnowledgeItemExpired(expiredSource.id, "pm-01", {}, itemRepository);

    await expect(indexKnowledgeItem(pending.id, {}, itemRepository, indexRepository)).resolves.toEqual([]);
    await expect(indexKnowledgeItem(rejectedSource.id, {}, itemRepository, indexRepository)).resolves.toEqual([]);
    await expect(indexKnowledgeItem(expiredSource.id, {}, itemRepository, indexRepository)).resolves.toEqual([]);

    const retrieved = await retrieveKnowledgeChunks({ user: { id: "admin", role: "admin" }, module: "all" }, indexRepository);
    expect(retrieved).toEqual([]);
  });

  it("retrieves approved chunks by module and access level", async () => {
    const legal = await createKnowledgeItem(
      {
        title: "Nguồn pháp lý công khai",
        sourceType: "law",
        module: "legal",
        status: "pending_review",
        confidence: "official",
        tags: ["pháp lý"],
        summary: "Nội dung pháp lý public."
      },
      "legal-manager",
      itemRepository
    );
    const finance = await createKnowledgeItem(
      {
        title: "Ghi chú tài chính nội bộ",
        sourceType: "internal_note",
        module: "finance",
        status: "pending_review",
        confidence: "internal_approved",
        tags: ["tài chính"],
        summary: "Nội dung nội bộ."
      },
      "accountant",
      itemRepository
    );
    const design = await createKnowledgeItem(
      {
        title: "Template review thiết kế",
        sourceType: "template",
        module: "design",
        status: "pending_review",
        confidence: "internal_approved",
        tags: ["thiết kế"],
        summary: "Template có thể chia sẻ cho bên ngoài có giới hạn."
      },
      "designer",
      itemRepository
    );

    for (const item of [legal, finance, design]) {
      await approveKnowledgeItem(item.id, "admin", {}, itemRepository);
      await indexKnowledgeItem(item.id, {}, itemRepository, indexRepository);
    }

    const legalResults = await retrieveKnowledgeChunks({ user: { id: "admin", role: "admin" }, module: "legal" }, indexRepository);
    const viewerResults = await retrieveKnowledgeChunks({ user: { id: "viewer", role: "viewer" }, module: "all" }, indexRepository);
    const contractorResults = await retrieveKnowledgeChunks(
      { user: { id: "contractor-01", role: "nha_thau" }, module: "all" },
      indexRepository
    );

    expect(legalResults.map((result) => result.citation.knowledgeTitle)).toEqual(["Nguồn pháp lý công khai"]);
    expect(viewerResults.map((result) => result.chunk.accessLevel)).toEqual(["public_read"]);
    expect(contractorResults.map((result) => result.chunk.accessLevel).sort()).toEqual(["external_limited", "public_read"]);
  });

  it("returns citation metadata with retrieval results", async () => {
    const item = await createKnowledgeItem(
      {
        title: "Kế hoạch lưu trữ hồ sơ",
        sourceUrl: "https://example.com/storage-plan",
        sourceFileId: "doc-storage-plan",
        sourceType: "policy",
        module: "documents",
        status: "pending_review",
        confidence: "internal_approved",
        tags: ["hồ sơ", "storage"],
        summary: "Quy ước lưu trữ hồ sơ dự án."
      },
      "assistant-01",
      itemRepository
    );

    await approveKnowledgeItem(item.id, "pm-01", {}, itemRepository);
    await indexKnowledgeItem(item.id, {}, itemRepository, indexRepository);

    const [result] = await retrieveKnowledgeChunks({ user: { id: "pm-01", role: "quan_ly_du_an" }, module: "documents" }, indexRepository);

    expect(result?.citation).toMatchObject({
      knowledgeItemId: item.id,
      knowledgeTitle: "Kế hoạch lưu trữ hồ sơ",
      sourceUrl: "https://example.com/storage-plan",
      sourceFileId: "doc-storage-plan",
      module: "documents"
    });
  });

  it("supports topK vector retrieval with the mock embedding adapter", async () => {
    for (const [index, title] of ["Payment checklist", "Storage policy", "Construction standard"].entries()) {
      const item = await createKnowledgeItem(
        {
          title,
          sourceType: index === 2 ? "standard" : "law",
          module: index === 2 ? "construction" : "legal",
          status: "pending_review",
          confidence: "official",
          tags: ["vector"],
          summary: `${title} approved retrieval source.`
        },
        "admin",
        itemRepository
      );

      await approveKnowledgeItem(item.id, "admin", {}, itemRepository);
      await indexKnowledgeItem(item.id, {}, itemRepository, indexRepository);
    }
    await generateKnowledgeChunkEmbeddings({ embeddingProvider: new MockEmbeddingProvider() }, indexRepository);

    const results = await retrieveKnowledgeChunks(
      {
        user: { id: "admin", role: "admin" },
        module: "all",
        query: "payment",
        retrievalMode: "vector",
        topK: 2
      },
      indexRepository
    );

    expect(results).toHaveLength(2);
    expect(results.every((result) => result.retrievalMode === "vector")).toBe(true);
    expect(results.every((result) => typeof result.score === "number")).toBe(true);
  });

  it("generates mock embeddings and skips already embedded chunks unless forced", async () => {
    const item = await createKnowledgeItem(
      {
        title: "Embedding source",
        sourceType: "law",
        module: "legal",
        status: "pending_review",
        confidence: "official",
        tags: ["embedding"],
        summary: "Embedding generation source."
      },
      "admin",
      itemRepository
    );
    await approveKnowledgeItem(item.id, "admin", {}, itemRepository);
    await indexKnowledgeItem(item.id, {}, itemRepository, indexRepository);

    const first = await generateKnowledgeChunkEmbeddings({ embeddingProvider: new MockEmbeddingProvider() }, indexRepository);
    const second = await generateKnowledgeChunkEmbeddings({ embeddingProvider: new MockEmbeddingProvider() }, indexRepository);
    const forced = await generateKnowledgeChunkEmbeddings({ force: true, embeddingProvider: new MockEmbeddingProvider() }, indexRepository);

    expect(first.embedded).toHaveLength(1);
    expect(first.embedded[0]?.embedding).toHaveLength(12);
    expect(first.embedded[0]?.embeddingModel).toBe("mock-hash-v1");
    expect(second.embedded).toHaveLength(0);
    expect(second.skipped).toHaveLength(1);
    expect(forced.embedded).toHaveLength(1);
  });

  it("uses configured OpenAI-compatible embedding provider only when requested", async () => {
    const mockProvider = getEmbeddingProviderFromEnv({ AI_EMBEDDING_PROVIDER: "auto" });
    const explicitProvider = getEmbeddingProviderFromEnv({
      AI_EMBEDDING_PROVIDER: "openai_compatible",
      AI_EMBEDDING_MODEL: "embedding-test",
      AI_EMBEDDING_DIMENSIONS: "4",
      OPENAI_API_KEY: "test-key"
    });

    expect(mockProvider.metadata.provider).toBe("mock");
    expect(explicitProvider.metadata.provider).toBe("openai_compatible");
    expect(() => getEmbeddingProviderFromEnv({ AI_EMBEDDING_PROVIDER: "openai_compatible" })).toThrow(/OPENAI_API_KEY/);
  });

  it("calls OpenAI-compatible embedding endpoint through configured provider", async () => {
    const fetchImpl = async () =>
      ({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            { index: 1, embedding: [0, 1, 0, 0] },
            { index: 0, embedding: [1, 0, 0, 0] }
          ]
        })
      }) as Response;
    const provider = new OpenAICompatibleEmbeddingProvider({
      apiKey: "test-key",
      model: "embedding-test",
      dimensions: 4,
      fetchImpl
    });

    const embeddings = await provider.embedBatch(["alpha", "beta"]);

    expect(embeddings).toHaveLength(2);
    expect(embeddings[0]).toEqual([1, 0, 0, 0]);
    expect(embeddings[1]).toEqual([0, 1, 0, 0]);
  });

  it("uses semantic topK ranking against stored embeddings with metadata filters first", async () => {
    const vectorFor = async (text: string) => {
      if (text.toLowerCase().includes("payment")) {
        return [1, 0];
      }

      if (text.toLowerCase().includes("storage")) {
        return [0, 1];
      }

      return [0.5, 0.5];
    };
    const provider: EmbeddingProvider = {
      metadata: { provider: "mock", model: "semantic-test", dimensions: 2 },
      model: "semantic-test",
      embedText: vectorFor,
      async embedBatch(inputs) {
        return Promise.all(inputs.map(vectorFor));
      }
    };

    for (const [title, sourceType] of [
      ["Payment semantic source", "law"],
      ["Storage semantic source", "policy"]
    ] as const) {
      const item = await createKnowledgeItem(
        {
          title,
          sourceType,
          module: sourceType === "law" ? "legal" : "documents",
          status: "pending_review",
          confidence: "official",
          tags: ["semantic"],
          summary: `${title} approved source.`
        },
        "admin",
        itemRepository
      );
      await approveKnowledgeItem(item.id, "admin", {}, itemRepository);
      await indexKnowledgeItem(item.id, {}, itemRepository, indexRepository);
    }
    await generateKnowledgeChunkEmbeddings({ embeddingProvider: provider }, indexRepository);

    const results = await retrieveKnowledgeChunks(
      {
        user: { id: "admin", role: "admin" },
        module: "all",
        sourceTypes: ["law"],
        query: "payment",
        retrievalMode: "vector",
        topK: 1,
        embeddingProvider: provider
      },
      indexRepository
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.retrievalMode).toBe("vector");
    expect(results[0]?.citation.knowledgeTitle).toBe("Payment semantic source");
    expect(results[0]?.citation.module).toBe("legal");
  });

  it("keeps deterministic fallback and applies source metadata filters before ranking", async () => {
    const legal = await createKnowledgeItem(
      {
        title: "Public law source",
        sourceType: "law",
        module: "legal",
        status: "pending_review",
        confidence: "official",
        tags: ["filter"],
        summary: "Land filter text."
      },
      "admin",
      itemRepository
    );
    const policy = await createKnowledgeItem(
      {
        title: "Internal policy source",
        sourceType: "policy",
        module: "documents",
        status: "pending_review",
        confidence: "internal_approved",
        tags: ["filter"],
        summary: "Document filter text."
      },
      "admin",
      itemRepository
    );

    for (const item of [legal, policy]) {
      await approveKnowledgeItem(item.id, "admin", {}, itemRepository);
      await indexKnowledgeItem(item.id, {}, itemRepository, indexRepository);
    }

    let rankedSourceTypes: string[] = [];
    const recordingAdapter: VectorRetrievalAdapter = {
      async rank(input) {
        rankedSourceTypes = input.chunks.map((chunk) => chunk.sourceType);

        return input.chunks.map((chunk, index) => ({ chunk, score: 1 - index }));
      }
    };

    const deterministicResults = await retrieveKnowledgeChunks(
      {
        user: { id: "admin", role: "admin" },
        query: "document",
        retrievalMode: "deterministic",
        topK: 1
      },
      indexRepository
    );
    const vectorResults = await retrieveKnowledgeChunks(
      {
        user: { id: "admin", role: "admin" },
        query: "filter",
        retrievalMode: "vector",
        sourceTypes: ["law"],
        topK: 5,
        vectorAdapter: recordingAdapter
      },
      indexRepository
    );

    expect(deterministicResults).toHaveLength(1);
    expect(deterministicResults[0]?.retrievalMode).toBe("deterministic");
    expect(deterministicResults[0]?.citation.knowledgeTitle).toBe("Internal policy source");
    expect(rankedSourceTypes).toEqual(["law"]);
    expect(vectorResults.map((result) => result.citation.knowledgeTitle)).toEqual(["Public law source"]);
  });

  it("falls back to deterministic retrieval when semantic retrieval has no embeddings", async () => {
    const item = await createKnowledgeItem(
      {
        title: "Fallback source",
        sourceType: "law",
        module: "legal",
        status: "pending_review",
        confidence: "official",
        tags: ["fallback"],
        summary: "Fallback deterministic text."
      },
      "admin",
      itemRepository
    );
    await approveKnowledgeItem(item.id, "admin", {}, itemRepository);
    await indexKnowledgeItem(item.id, {}, itemRepository, indexRepository);

    const results = await retrieveKnowledgeChunks(
      {
        user: { id: "admin", role: "admin" },
        module: "legal",
        query: "fallback",
        retrievalMode: "vector",
        topK: 1
      },
      indexRepository
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.retrievalMode).toBe("deterministic");
    expect(results[0]?.citation.knowledgeTitle).toBe("Fallback source");
  });

  it("builds a retrieval context while preserving citations", async () => {
    const item = await createKnowledgeItem(
      {
        title: "Context source",
        sourceUrl: "https://example.com/context-source",
        sourceType: "law",
        module: "legal",
        status: "pending_review",
        confidence: "official",
        tags: ["context"],
        summary: "Context builder source text."
      },
      "admin",
      itemRepository
    );

    await approveKnowledgeItem(item.id, "admin", {}, itemRepository);
    await indexKnowledgeItem(item.id, {}, itemRepository, indexRepository);

    const results = await retrieveKnowledgeChunks(
      { user: { id: "admin", role: "admin" }, query: "context", topK: 1 },
      indexRepository
    );
    const context = buildKnowledgeRetrievalContext(results, { maxLength: 1000 });

    expect(context.selectedChunks).toHaveLength(1);
    expect(context.citations).toHaveLength(1);
    expect(context.citations[0]).toMatchObject({
      knowledgeItemId: item.id,
      knowledgeTitle: "Context source",
      sourceUrl: "https://example.com/context-source"
    });
    expect(context.contextText).toContain("Context source");
    expect(context.truncated).toBe(false);
  });
});
