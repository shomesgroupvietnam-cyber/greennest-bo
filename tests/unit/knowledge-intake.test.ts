import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { JsonExternalSearchLogRepository } from "@/modules/knowledge/services/external-search-log-repository";
import {
  getExternalSearchProviderFromEnv,
  mockExternalSearchProvider,
  TavilyExternalSearchProvider
} from "@/modules/knowledge/services/external-search-provider";
import { JsonKnowledgeCandidateRepository } from "@/modules/knowledge/services/knowledge-candidate-repository";
import { JsonKnowledgeIndexRepository } from "@/modules/knowledge/services/knowledge-index-repository";
import { listKnowledgeChunksByItem } from "@/modules/knowledge/services/knowledge-indexing-service";
import {
  getFriendlyExternalSearchErrorMessage,
  importExternalSourceCandidate,
  normalizeExternalSource,
  runExternalSourceSearch
} from "@/modules/knowledge/services/knowledge-intake-service";
import { JsonKnowledgeRepository } from "@/modules/knowledge/services/knowledge-repository";

let tempDir: string;
let knowledgeRepository: JsonKnowledgeRepository;
let candidateRepository: JsonKnowledgeCandidateRepository;
let indexRepository: JsonKnowledgeIndexRepository;
let logRepository: JsonExternalSearchLogRepository;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-knowledge-intake-"));
  knowledgeRepository = new JsonKnowledgeRepository(path.join(tempDir, "knowledge-center.json"));
  candidateRepository = new JsonKnowledgeCandidateRepository(path.join(tempDir, "knowledge-candidates.json"));
  indexRepository = new JsonKnowledgeIndexRepository(path.join(tempDir, "knowledge-center.json"));
  logRepository = new JsonExternalSearchLogRepository(path.join(tempDir, "external-search-logs.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("knowledge external source intake", () => {
  it("mock provider returns candidates and records a search log", async () => {
    const { candidates, log } = await runExternalSourceSearch(
      {
        user: { id: "legal-manager", role: "phap_ly" },
        query: "quy dinh dat dai",
        limit: 2
      },
      mockExternalSearchProvider,
      logRepository
    );
    const logs = await logRepository.listLogs();

    expect(candidates).toHaveLength(2);
    expect(candidates[0]?.provider).toBe("mock_web");
    expect(log.resultCount).toBe(2);
    expect(log.providerMetadata?.provider).toBe("mock_web");
    expect(logs).toHaveLength(1);
    expect(logs[0]?.query).toBe("quy dinh dat dai");
    expect(logs[0]?.providerMetadata?.provider).toBe("mock_web");
  });

  it("real provider config path is gated and mock fallback works without key", () => {
    const fallback = getExternalSearchProviderFromEnv({ WEB_SEARCH_PROVIDER: "auto" });
    const realProvider = getExternalSearchProviderFromEnv({
      WEB_SEARCH_PROVIDER: "tavily",
      WEB_SEARCH_API_KEY: "test-key",
      WEB_SEARCH_MAX_RESULTS: "3",
      WEB_SEARCH_TIMEOUT_MS: "1000"
    });

    expect(fallback.key).toBe("mock_web");
    expect(realProvider.key).toBe("tavily");
    expect(realProvider.metadata.maxResults).toBe(3);
    expect(() => getExternalSearchProviderFromEnv({ WEB_SEARCH_PROVIDER: "tavily" })).toThrow(/WEB_SEARCH_API_KEY/);
  });

  it("maps Tavily results through the real provider adapter", async () => {
    const provider = new TavilyExternalSearchProvider({
      apiKey: "test-key",
      maxResults: 2,
      timeoutMs: 100,
      fetchImpl: (async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          results: [
            {
              title: "Nguon chinh phu",
              url: "https://chinhphu.vn/demo",
              content: "Noi dung demo",
              published_date: "2026-01-01"
            }
          ]
        })
      })) as unknown as typeof fetch
    });

    const results = await provider.search({ query: "demo", limit: 1 });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      provider: "tavily",
      title: "Nguon chinh phu",
      url: "https://chinhphu.vn/demo",
      snippet: "Noi dung demo"
    });
  });

  it("normalizer maps allowed domains to registry metadata", () => {
    const candidate = normalizeExternalSource({
      title: "Quy chuan xay dung",
      url: "https://moc.gov.vn/quy-chuan/demo",
      provider: "mock_web",
      retrievedAt: "2026-05-17T00:00:00.000Z",
      snippet: "Bo xay dung demo."
    });

    expect(candidate.module).toBe("construction");
    expect(candidate.sourceType).toBe("standard");
    expect(candidate.confidence).toBe("official");
    expect(candidate.tags).toContain("quy-chuan");
  });

  it("imports a search candidate as pending_review Knowledge Candidate and does not create/index Knowledge Item", async () => {
    const { candidates } = await runExternalSourceSearch(
      {
        user: { id: "assistant-01", role: "thu_ky_tro_ly" },
        query: "ho so du an",
        limit: 1
      },
      mockExternalSearchProvider,
      logRepository
    );
    const candidate = await importExternalSourceCandidate(
      {
        user: { id: "assistant-01", role: "thu_ky_tro_ly" },
        candidate: candidates[0]!
      },
      candidateRepository
    );
    const items = await knowledgeRepository.listKnowledgeItems();
    const chunks = await listKnowledgeChunksByItem(candidate.id, indexRepository);

    expect(candidate.status).toBe("pending_review");
    expect(candidate.sourceType).toBe("web_search");
    expect(candidate.sourceRefId).toBe(candidates[0]?.url);
    expect(candidate.notes).toContain("external-intake");
    expect(items).toEqual([]);
    expect(chunks).toEqual([]);
  });

  it("blocks disallowed domains before import", async () => {
    const candidate = normalizeExternalSource({
      title: "Nguon khong nam trong registry",
      url: "https://not-allowed.example.org/demo",
      provider: "mock_web",
      retrievedAt: "2026-05-17T00:00:00.000Z",
      snippet: "Nguon demo."
    });

    await expect(
      importExternalSourceCandidate(
        {
          user: { id: "assistant-01", role: "thu_ky_tro_ly" },
          candidate
        },
        candidateRepository
      )
    ).rejects.toThrow(/allowlist/);
  });

  it("detects duplicate normalized source URLs", async () => {
    const candidate = normalizeExternalSource({
      title: "Nguon hop le",
      url: "https://chinhphu.vn/demo?b=2&a=1#section",
      provider: "mock_web",
      retrievedAt: "2026-05-17T00:00:00.000Z",
      snippet: "Nguon demo."
    });
    const duplicate = { ...candidate, id: "candidate-duplicate", url: "https://chinhphu.vn/demo?a=1&b=2" };

    await importExternalSourceCandidate(
      {
        user: { id: "assistant-01", role: "thu_ky_tro_ly" },
        candidate
      },
      candidateRepository
    );

    await expect(
      importExternalSourceCandidate(
        {
          user: { id: "assistant-01", role: "thu_ky_tro_ly" },
          candidate: duplicate
        },
        candidateRepository
      )
    ).rejects.toThrow(/da ton tai/);
  });

  it("classifies provider errors", async () => {
    const rateLimitedProvider = new TavilyExternalSearchProvider({
      apiKey: "test-key",
      maxResults: 2,
      timeoutMs: 100,
      fetchImpl: (async () => ({
        ok: false,
        status: 429,
        json: async () => ({ error: "slow down" })
      })) as unknown as typeof fetch
    });
    const timeoutProvider = new TavilyExternalSearchProvider({
      apiKey: "test-key",
      maxResults: 2,
      timeoutMs: 1,
      fetchImpl: ((_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        })) as unknown as typeof fetch
    });

    await expect(rateLimitedProvider.search({ query: "demo" })).rejects.toMatchObject({ code: "rate_limited" });
    await expect(timeoutProvider.search({ query: "demo" })).rejects.toMatchObject({ code: "timeout" });
    expect(getFriendlyExternalSearchErrorMessage({ code: "rate_limited", message: "slow down" })).toContain("giới hạn");
    expect(getFriendlyExternalSearchErrorMessage({ code: "missing_config" })).toContain("chưa có API key");
  });

  it("blocks unauthorized users from search and import", async () => {
    const viewer = { id: "viewer", role: "viewer" } as const;
    const candidate = normalizeExternalSource({
      title: "Nguon demo",
      url: "https://example.com/demo",
      provider: "mock_web",
      retrievedAt: "2026-05-17T00:00:00.000Z",
      snippet: "Demo."
    });

    await expect(runExternalSourceSearch({ user: viewer, query: "demo" }, mockExternalSearchProvider, logRepository)).rejects.toThrow(
      "khong co quyen"
    );
    await expect(importExternalSourceCandidate({ user: viewer, candidate }, candidateRepository)).rejects.toThrow("khong co quyen");
  });
});
