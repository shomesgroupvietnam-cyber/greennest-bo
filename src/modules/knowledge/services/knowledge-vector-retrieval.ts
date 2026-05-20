import type { KnowledgeChunk } from "@/modules/knowledge/types";

export type EmbeddingProviderKey = "mock" | "openai_compatible";

export type EmbeddingProviderMetadata = {
  provider: EmbeddingProviderKey;
  model: string;
  dimensions: number;
};

export type EmbeddingProvider = {
  metadata: EmbeddingProviderMetadata;
  model: string;
  embedText(text: string): Promise<number[]>;
  embedBatch(inputs: string[]): Promise<number[][]>;
};

export type VectorRetrievalAdapter = {
  rank(input: {
    chunks: KnowledgeChunk[];
    embeddingProvider: EmbeddingProvider;
    query: string;
    topK: number;
  }): Promise<Array<{ chunk: KnowledgeChunk; score: number }>>;
};

export type EmbeddingProviderEnv = {
  [key: string]: string | undefined;
  AI_EMBEDDING_PROVIDER?: string;
  AI_EMBEDDING_MODEL?: string;
  AI_EMBEDDING_DIMENSIONS?: string;
  OPENAI_API_KEY?: string;
};

type OpenAIEmbeddingResponse = {
  data?: Array<{ embedding?: number[]; index?: number }>;
  error?: { message?: string };
};

const DEFAULT_MOCK_EMBEDDING_MODEL = "mock-hash-v1";
const DEFAULT_OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_EMBEDDING_DIMENSIONS = 1536;

function normalizeVector(vector: number[]) {
  const magnitude = Math.sqrt(vector.reduce((total, value) => total + value * value, 0));

  if (magnitude === 0) {
    return vector;
  }

  return vector.map((value) => value / magnitude);
}

function cosineSimilarity(left: number[], right: number[]) {
  const length = Math.min(left.length, right.length);
  let score = 0;

  for (let index = 0; index < length; index += 1) {
    score += left[index] * right[index];
  }

  return score;
}

export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly metadata: EmbeddingProviderMetadata;
  readonly model: string;

  constructor(config: Partial<EmbeddingProviderMetadata> = {}) {
    this.metadata = {
      provider: "mock",
      model: config.model ?? DEFAULT_MOCK_EMBEDDING_MODEL,
      dimensions: config.dimensions ?? 12
    };
    this.model = this.metadata.model;
  }

  async embedText(text: string) {
    const vector = new Array<number>(this.metadata.dimensions).fill(0);
    const normalizedText = text.toLowerCase();

    for (let index = 0; index < normalizedText.length; index += 1) {
      const code = normalizedText.charCodeAt(index);
      vector[index % vector.length] += (code % 37) / 37;
    }

    return normalizeVector(vector);
  }

  async embedBatch(inputs: string[]) {
    return Promise.all(inputs.map((input) => this.embedText(input)));
  }
}

export class OpenAICompatibleEmbeddingProvider implements EmbeddingProvider {
  readonly metadata: EmbeddingProviderMetadata;
  readonly model: string;

  constructor(
    private readonly config: {
      apiKey: string;
      model: string;
      dimensions: number;
      endpoint?: string;
      fetchImpl?: typeof fetch;
    }
  ) {
    this.metadata = {
      provider: "openai_compatible",
      model: config.model,
      dimensions: config.dimensions
    };
    this.model = this.metadata.model;
  }

  async embedText(text: string) {
    const [embedding] = await this.embedBatch([text]);

    if (!embedding) {
      throw new Error("Embedding provider did not return an embedding.");
    }

    return embedding;
  }

  async embedBatch(inputs: string[]) {
    if (inputs.length === 0) {
      return [];
    }

    const fetchImpl = this.config.fetchImpl ?? fetch;
    const response = await fetchImpl(this.config.endpoint ?? "https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.config.model,
        input: inputs,
        dimensions: this.config.dimensions
      })
    });
    const body = (await response.json().catch(() => undefined)) as OpenAIEmbeddingResponse | undefined;

    if (!response.ok) {
      throw new Error(body?.error?.message ?? `Embedding provider request failed with HTTP ${response.status}.`);
    }

    const embeddings = body?.data
      ?.sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
      .map((item) => item.embedding)
      .filter((embedding): embedding is number[] => Array.isArray(embedding));

    if (!embeddings || embeddings.length !== inputs.length) {
      throw new Error("Embedding provider returned an invalid embedding batch.");
    }

    return embeddings.map(normalizeVector);
  }
}

export class CosineVectorRetrievalAdapter implements VectorRetrievalAdapter {
  async rank(input: { chunks: KnowledgeChunk[]; embeddingProvider: EmbeddingProvider; query: string; topK: number }) {
    const queryEmbedding = await input.embeddingProvider.embedText(input.query);
    const rankedChunks = await Promise.all(
      input.chunks.map(async (chunk) => {
        const chunkEmbedding = chunk.embedding ?? (await input.embeddingProvider.embedText(chunk.chunkText));

        return {
          chunk,
          score: cosineSimilarity(queryEmbedding, normalizeVector(chunkEmbedding))
        };
      })
    );

    return rankedChunks.sort((a, b) => b.score - a.score).slice(0, input.topK);
  }
}

export function getEmbeddingProviderFromEnv(env: EmbeddingProviderEnv = process.env): EmbeddingProvider {
  const provider = normalizeEmbeddingProvider(env);
  const dimensions = parsePositiveInteger(env.AI_EMBEDDING_DIMENSIONS, DEFAULT_EMBEDDING_DIMENSIONS);

  if (provider === "mock") {
    return new MockEmbeddingProvider({
      model: env.AI_EMBEDDING_MODEL || DEFAULT_MOCK_EMBEDDING_MODEL,
      dimensions: Math.min(dimensions, 64)
    });
  }

  if (!env.OPENAI_API_KEY) {
    if (env.AI_EMBEDDING_PROVIDER === "auto" || !env.AI_EMBEDDING_PROVIDER) {
      return new MockEmbeddingProvider({
        model: DEFAULT_MOCK_EMBEDDING_MODEL,
        dimensions: Math.min(dimensions, 64)
      });
    }

    throw new Error("AI_EMBEDDING_PROVIDER yeu cau OpenAI-compatible nhung OPENAI_API_KEY chua duoc cau hinh.");
  }

  return new OpenAICompatibleEmbeddingProvider({
    apiKey: env.OPENAI_API_KEY,
    model: env.AI_EMBEDDING_MODEL || DEFAULT_OPENAI_EMBEDDING_MODEL,
    dimensions
  });
}

export function hasStoredEmbedding(chunk: KnowledgeChunk) {
  return Array.isArray(chunk.embedding) && chunk.embedding.length > 0 && Boolean(chunk.embeddingModel) && Boolean(chunk.embeddedAt);
}

function normalizeEmbeddingProvider(env: EmbeddingProviderEnv): EmbeddingProviderKey {
  const provider = env.AI_EMBEDDING_PROVIDER;

  if (!provider || provider === "auto" || provider === "mock") {
    if (provider === "auto" && env.OPENAI_API_KEY) {
      return "openai_compatible";
    }

    return "mock";
  }

  if (provider === "openai" || provider === "openai_compatible") {
    return "openai_compatible";
  }

  return "mock";
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const mockEmbeddingProvider = new MockEmbeddingProvider();
export const cosineVectorRetrievalAdapter = new CosineVectorRetrievalAdapter();
