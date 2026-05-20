import type { AiContextBlock, AiRoutingPlan } from "./ai-coordinator-service";
import { buildAiPromptPackage, type AiPromptPackage } from "./ai-prompt-builder";
import type { AiCitation, AiJob, AiProviderErrorCode, AiUsageMetadata } from "../types";

export type AiProviderKey = "mock" | "openai_compatible";

export type AiProviderMetadata = {
  provider: AiProviderKey;
  model: string;
  maxOutputTokens: number;
  temperature: number;
  timeoutMs: number;
  maxRetries: number;
};

export type AiGenerateAnswerInput = {
  job: AiJob;
  routingPlan: AiRoutingPlan;
  contextBlocks: AiContextBlock[];
  ragContext: string;
  citations: Array<Omit<AiCitation, "id" | "interactionId" | "jobId" | "createdAt">>;
  actionProposalCount: number;
  truncated: boolean;
  promptPackage?: AiPromptPackage;
};

export type AiGenerateAnswerResult = {
  text: string;
  metadata: AiProviderMetadata;
  usage?: AiUsageMetadata;
};

export type AiProvider = {
  metadata: AiProviderMetadata;
  generateAnswer(input: AiGenerateAnswerInput): Promise<AiGenerateAnswerResult>;
};

export type AiProviderEnv = {
  [key: string]: string | undefined;
  AI_PROVIDER?: string;
  AI_CHAT_MODEL?: string;
  AI_MAX_OUTPUT_TOKENS?: string;
  AI_TEMPERATURE?: string;
  AI_PROVIDER_TIMEOUT_MS?: string;
  AI_PROVIDER_MAX_RETRIES?: string;
  OPENAI_API_KEY?: string;
};

export type AiProviderHealthResult = {
  ok: boolean;
  provider: AiProviderKey;
  model: string;
  checkedAt: string;
  errorCode?: AiProviderErrorCode;
  message?: string;
};

type OpenAICompatibleResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
  };
};

const DEFAULT_MOCK_MODEL = "mock-greennest-coordinator";
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const DEFAULT_MAX_OUTPUT_TOKENS = 700;
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_BACKOFF_MS = 250;
const DEFAULT_RETRYABLE_STATUS_CODES = [408, 409, 425, 429, 500, 502, 503, 504];

export class AiProviderError extends Error {
  constructor(
    readonly code: AiProviderErrorCode,
    message: string,
    readonly options: { status?: number; retryable?: boolean; attempts?: number } = {}
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

export class MockAiProvider implements AiProvider {
  readonly metadata: AiProviderMetadata;

  constructor(config: Partial<AiProviderMetadata> = {}) {
    this.metadata = {
      provider: "mock",
      model: config.model ?? DEFAULT_MOCK_MODEL,
      maxOutputTokens: config.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
      temperature: config.temperature ?? 0,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      maxRetries: config.maxRetries ?? 0
    };
  }

  async generateAnswer(input: AiGenerateAnswerInput): Promise<AiGenerateAnswerResult> {
    return {
      metadata: this.metadata,
      text: [
        `Phan hoi AI mock qua Coordinator cho module ${input.job.module}.`,
        `Intent route: primary=${input.routingPlan.primaryModule}; support=${input.routingPlan.supportingModules.join(", ") || "none"}.`,
        `Yeu cau: ${input.job.payload.prompt.slice(0, 220)}`,
        `Context module: ${input.contextBlocks.map((block) => `${block.title} (${block.recordCount})`).join("; ") || "khong co du lieu trong scope"}.`,
        `Da dinh kem ${input.citations.length} citation tu du lieu duoc phep xem va Knowledge Center da duyet.`,
        input.actionProposalCount > 0
          ? `Da tao ${input.actionProposalCount} de xuat hanh dong o trang thai proposed; khong thay doi du lieu nghiep vu.`
          : undefined,
        input.truncated ? "Context da duoc cat theo budget placeholder." : undefined
      ]
        .filter(Boolean)
        .join("\n")
    };
  }
}

export class OpenAICompatibleProvider implements AiProvider {
  readonly metadata: AiProviderMetadata;

  constructor(
    private readonly config: {
      apiKey: string;
      model: string;
      maxOutputTokens: number;
      temperature: number;
      timeoutMs?: number;
      maxRetries?: number;
      retryableStatusCodes?: number[];
      backoffMs?: number;
      endpoint?: string;
      fetchImpl?: typeof fetch;
      sleepImpl?: (ms: number) => Promise<void>;
    }
  ) {
    this.metadata = {
      provider: "openai_compatible",
      model: config.model,
      maxOutputTokens: config.maxOutputTokens,
      temperature: config.temperature,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES
    };
  }

  async generateAnswer(input: AiGenerateAnswerInput): Promise<AiGenerateAnswerResult> {
    let lastError: AiProviderError | undefined;

    for (let attempt = 0; attempt <= this.metadata.maxRetries; attempt += 1) {
      try {
        return await this.requestAnswer(input, attempt + 1);
      } catch (error) {
        const classified = classifyProviderError(error);
        lastError = new AiProviderError(classified.code, classified.message, {
          status: classified.options.status,
          retryable: classified.options.retryable,
          attempts: attempt + 1
        });

        if (!lastError.options.retryable || attempt >= this.metadata.maxRetries) {
          throw lastError;
        }

        await (this.config.sleepImpl ?? sleep)(calculateBackoffMs(this.config.backoffMs ?? DEFAULT_BACKOFF_MS, attempt));
      }
    }

    throw lastError ?? new AiProviderError("provider_error", "AI provider failed without a classified error.");
  }

  private async requestAnswer(input: AiGenerateAnswerInput, attempt: number): Promise<AiGenerateAnswerResult> {
    const fetchImpl = this.config.fetchImpl ?? fetch;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.metadata.timeoutMs);

    try {
      const response = await fetchImpl(this.config.endpoint ?? "https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json"
        },
        signal: controller.signal,
        body: JSON.stringify({
        model: this.config.model,
        temperature: this.config.temperature,
        max_tokens: this.config.maxOutputTokens,
        messages: getPromptMessages(input)
      })
      });
      const body = (await response.json().catch(() => undefined)) as OpenAICompatibleResponse | undefined;

      if (!response.ok) {
        throw errorForHttpResponse(response.status, body?.error?.message, attempt, this.isRetryableStatus(response.status));
      }

      if (!body) {
        throw new AiProviderError("invalid_response", "AI provider returned an invalid JSON response.", { retryable: false, attempts: attempt });
      }

      const text = body.choices?.[0]?.message?.content?.trim();

      if (!text) {
        throw new AiProviderError("invalid_response", "AI provider returned an empty answer.", { retryable: false, attempts: attempt });
      }

      return {
        metadata: this.metadata,
        text,
        usage: mapUsage(body.usage)
      };
    } catch (error) {
      if (isAbortError(error)) {
        throw new AiProviderError("timeout", `AI provider timed out after ${this.metadata.timeoutMs}ms.`, {
          retryable: true,
          attempts: attempt
        });
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private isRetryableStatus(status: number) {
    return (this.config.retryableStatusCodes ?? DEFAULT_RETRYABLE_STATUS_CODES).includes(status);
  }
}

export function getAiProviderFromEnv(env: AiProviderEnv = process.env): AiProvider {
  const provider = normalizeProvider(env);
  const maxOutputTokens = parsePositiveInteger(env.AI_MAX_OUTPUT_TOKENS, DEFAULT_MAX_OUTPUT_TOKENS);
  const temperature = parseTemperature(env.AI_TEMPERATURE, DEFAULT_TEMPERATURE);
  const timeoutMs = parsePositiveInteger(env.AI_PROVIDER_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
  const maxRetries = parseNonNegativeInteger(env.AI_PROVIDER_MAX_RETRIES, DEFAULT_MAX_RETRIES);

  if (provider === "mock") {
    return new MockAiProvider({
      model: env.AI_CHAT_MODEL || DEFAULT_MOCK_MODEL,
      maxOutputTokens,
      temperature,
      timeoutMs,
      maxRetries: 0
    });
  }

  if (!env.OPENAI_API_KEY) {
    if (env.AI_PROVIDER === "auto" || !env.AI_PROVIDER) {
      return new MockAiProvider({
        model: DEFAULT_MOCK_MODEL,
        maxOutputTokens,
        temperature: 0,
        timeoutMs,
        maxRetries: 0
      });
    }

    throw new AiProviderError("missing_config", "AI_PROVIDER yeu cau OpenAI-compatible nhung OPENAI_API_KEY chua duoc cau hinh.", {
      retryable: false
    });
  }

  return new OpenAICompatibleProvider({
    apiKey: env.OPENAI_API_KEY,
    model: env.AI_CHAT_MODEL || DEFAULT_OPENAI_MODEL,
    maxOutputTokens,
    temperature,
    timeoutMs,
    maxRetries
  });
}

export async function checkAiProviderHealth(provider: AiProvider = getAiProviderFromEnv()): Promise<AiProviderHealthResult> {
  const checkedAt = new Date().toISOString();

  if (provider.metadata.provider === "mock") {
    return {
      ok: true,
      provider: provider.metadata.provider,
      model: provider.metadata.model,
      checkedAt
    };
  }

  try {
    await provider.generateAnswer(healthCheckInput());

    return {
      ok: true,
      provider: provider.metadata.provider,
      model: provider.metadata.model,
      checkedAt
    };
  } catch (error) {
    const classified = classifyProviderError(error);

    return {
      ok: false,
      provider: provider.metadata.provider,
      model: provider.metadata.model,
      checkedAt,
      errorCode: classified.code,
      message: classified.message
    };
  }
}

function normalizeProvider(env: AiProviderEnv): "mock" | "openai_compatible" {
  const provider = env.AI_PROVIDER;

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

function parseNonNegativeInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseTemperature(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 2 ? parsed : fallback;
}

function errorForHttpResponse(status: number, message: string | undefined, attempt: number, retryable: boolean) {
  if (status === 429) {
    return new AiProviderError("rate_limited", message ?? "AI provider rate limit reached.", {
      status,
      retryable: true,
      attempts: attempt
    });
  }

  return new AiProviderError("provider_error", message ?? `AI provider request failed with HTTP ${status}.`, {
    status,
    retryable,
    attempts: attempt
  });
}

function getPromptMessages(input: AiGenerateAnswerInput) {
  return (
    input.promptPackage ??
    buildAiPromptPackage({
      job: input.job,
      routingPlan: input.routingPlan,
      contextBlocks: input.contextBlocks,
      ragContext: input.ragContext,
      citations: input.citations,
      maxContextChars: 5000
    })
  ).messages;
}

function classifyProviderError(error: unknown): AiProviderError {
  if (error instanceof AiProviderError) {
    return error;
  }

  if (isAbortError(error)) {
    return new AiProviderError("timeout", "AI provider request timed out.", { retryable: true });
  }

  return new AiProviderError("provider_error", error instanceof Error ? error.message : "AI provider request failed.", {
    retryable: true
  });
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function calculateBackoffMs(baseMs: number, attempt: number) {
  return baseMs * 2 ** attempt;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function mapUsage(usage: OpenAICompatibleResponse["usage"]): AiUsageMetadata | undefined {
  if (!usage) {
    return undefined;
  }

  return {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
    estimatedCost: undefined
  };
}

function healthCheckInput(): AiGenerateAnswerInput {
  return {
    job: {
      id: "health-check-job",
      interactionId: "health-check-interaction",
      requestedBy: "health-check",
      module: "general",
      intent: "health_check",
      mode: "fast",
      priority: "low",
      status: "queued",
      scopeSnapshot: {
        userId: "health-check",
        role: "admin",
        permissions: [],
        scopeKind: "internal_full",
        module: "general",
        resourceRefs: [],
        capturedAt: new Date().toISOString()
      },
      rateLimitKey: "health-check",
      payload: {
        prompt: "Health check",
        intent: "health_check",
        useRag: false,
        wantsActionProposal: false,
        knowledgeModule: "general"
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    routingPlan: {
      intent: "health_check",
      primaryModule: "general",
      supportingModules: [],
      toolKeys: []
    },
    contextBlocks: [],
    ragContext: "",
    citations: [],
    actionProposalCount: 0,
    truncated: false
  };
}
