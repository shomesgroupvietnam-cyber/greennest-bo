import { describe, expect, it, vi } from "vitest";

import { checkAiProviderHealth, getAiProviderFromEnv, MockAiProvider, OpenAICompatibleProvider } from "@/modules/ai/services/ai-provider";
import type { AiJob } from "@/modules/ai/types";

const job = {
  id: "job-001",
  interactionId: "interaction-001",
  requestedBy: "mock-founder",
  module: "general",
  intent: "Hoi dap",
  mode: "queued",
  priority: "normal",
  status: "queued",
  scopeSnapshot: {
    userId: "mock-founder",
    role: "admin",
    permissions: [],
    scopeKind: "internal_full",
    module: "general",
    resourceRefs: [],
    capturedAt: "2026-05-17T00:00:00.000Z"
  },
  rateLimitKey: "test",
  payload: {
    prompt: "Tom tat tinh hinh du an",
    intent: "Hoi dap",
    useRag: false,
    wantsActionProposal: false,
    knowledgeModule: "general"
  },
  createdAt: "2026-05-17T00:00:00.000Z",
  updatedAt: "2026-05-17T00:00:00.000Z"
} satisfies AiJob;

const providerInput = {
  job,
  routingPlan: {
    intent: "Hoi dap",
    primaryModule: "general" as const,
    supportingModules: [],
    toolKeys: []
  },
  contextBlocks: [],
  ragContext: "",
  citations: [],
  actionProposalCount: 0,
  truncated: false
};

describe("AI provider adapter", () => {
  it("uses mock provider without API key", async () => {
    const provider = getAiProviderFromEnv({ AI_PROVIDER: "mock" });
    const result = await provider.generateAnswer(providerInput);

    expect(provider.metadata.provider).toBe("mock");
    expect(result.text).toContain("Phan hoi AI mock");
  });

  it("falls back to mock in auto mode when API key is missing", () => {
    const provider = getAiProviderFromEnv({ AI_PROVIDER: "auto" });

    expect(provider.metadata.provider).toBe("mock");
  });

  it("fails gracefully when OpenAI-compatible provider is explicit without API key", () => {
    expect(() => getAiProviderFromEnv({ AI_PROVIDER: "openai_compatible" })).toThrow(/OPENAI_API_KEY/);
  });

  it("calls OpenAI-compatible endpoint only through configured provider", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: "Cau tra loi tu model that." } }],
        usage: {
          prompt_tokens: 12,
          completion_tokens: 8,
          total_tokens: 20
        }
      })
    })) as unknown as typeof fetch;
    const provider = new OpenAICompatibleProvider({
      apiKey: "test-key",
      model: "test-model",
      maxOutputTokens: 123,
      temperature: 0.1,
      endpoint: "https://example.com/v1/chat/completions",
      timeoutMs: 100,
      maxRetries: 0,
      fetchImpl
    });

    const result = await provider.generateAnswer(providerInput);

    expect(result.text).toBe("Cau tra loi tu model that.");
    expect(result.metadata.provider).toBe("openai_compatible");
    expect(result.usage?.totalTokens).toBe(20);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("times out provider calls", async () => {
    const fetchImpl = vi.fn(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        })
    ) as unknown as typeof fetch;
    const provider = new OpenAICompatibleProvider({
      apiKey: "test-key",
      model: "test-model",
      maxOutputTokens: 123,
      temperature: 0.1,
      timeoutMs: 1,
      maxRetries: 0,
      fetchImpl
    });

    await expect(provider.generateAnswer(providerInput)).rejects.toMatchObject({
      code: "timeout"
    });
  });

  it("retries transient failures and succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: { message: "temporary" } })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: "Da phuc hoi." } }] })
      }) as unknown as typeof fetch;
    const provider = new OpenAICompatibleProvider({
      apiKey: "test-key",
      model: "test-model",
      maxOutputTokens: 123,
      temperature: 0.1,
      timeoutMs: 100,
      maxRetries: 1,
      backoffMs: 0,
      sleepImpl: async () => undefined,
      fetchImpl
    });

    const result = await provider.generateAnswer(providerInput);

    expect(result.text).toBe("Da phuc hoi.");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("classifies retry exhaustion", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 503,
      json: async () => ({ error: { message: "provider unavailable" } })
    })) as unknown as typeof fetch;
    const provider = new OpenAICompatibleProvider({
      apiKey: "test-key",
      model: "test-model",
      maxOutputTokens: 123,
      temperature: 0.1,
      timeoutMs: 100,
      maxRetries: 1,
      backoffMs: 0,
      sleepImpl: async () => undefined,
      fetchImpl
    });

    await expect(provider.generateAnswer(providerInput)).rejects.toMatchObject({
      code: "provider_error",
      options: expect.objectContaining({ attempts: 2 })
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("classifies rate limit errors", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 429,
      json: async () => ({ error: { message: "slow down" } })
    })) as unknown as typeof fetch;
    const provider = new OpenAICompatibleProvider({
      apiKey: "test-key",
      model: "test-model",
      maxOutputTokens: 123,
      temperature: 0.1,
      timeoutMs: 100,
      maxRetries: 0,
      fetchImpl
    });

    await expect(provider.generateAnswer(providerInput)).rejects.toMatchObject({
      code: "rate_limited"
    });
  });

  it("reports provider health diagnostics", async () => {
    const provider = new MockAiProvider();
    const health = await checkAiProviderHealth(provider);

    expect(health.ok).toBe(true);
    expect(health.provider).toBe("mock");
  });

  it("mock provider cannot create action proposals directly", async () => {
    const result = await new MockAiProvider().generateAnswer({
      ...providerInput,
      job: {
        ...job,
        payload: {
          ...job.payload,
          prompt: "Hay tao task moi",
          wantsActionProposal: true
        }
      },
      actionProposalCount: 0
    });

    expect(result.text).not.toContain("Da tao 1 de xuat");
  });
});
