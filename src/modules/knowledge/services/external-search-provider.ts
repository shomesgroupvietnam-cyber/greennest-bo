import type { ExternalSearchProviderKey } from "@/modules/knowledge/types";

export type ExternalSearchProviderErrorCode = "missing_config" | "timeout" | "rate_limited" | "provider_error" | "invalid_response";

export type ExternalSearchProviderMetadata = {
  provider: ExternalSearchProviderKey | string;
  maxResults: number;
  timeoutMs: number;
};

export type RawExternalSearchResult = {
  title: string;
  url: string;
  provider: ExternalSearchProviderKey | string;
  publishedAt?: string;
  retrievedAt?: string;
  snippet: string;
};

export type ExternalSearchProvider = {
  key: ExternalSearchProviderKey | string;
  metadata: ExternalSearchProviderMetadata;
  search(input: { query: string; limit?: number }): Promise<RawExternalSearchResult[]>;
};

export type ExternalSearchProviderEnv = {
  [key: string]: string | undefined;
  WEB_SEARCH_PROVIDER?: string;
  WEB_SEARCH_API_KEY?: string;
  WEB_SEARCH_MAX_RESULTS?: string;
  WEB_SEARCH_TIMEOUT_MS?: string;
};

type TavilySearchResponse = {
  results?: Array<{
    title?: string;
    url?: string;
    content?: string;
    raw_content?: string;
    published_date?: string;
  }>;
  error?: string;
};

const DEFAULT_MAX_RESULTS = 6;
const DEFAULT_TIMEOUT_MS = 12_000;

export class ExternalSearchProviderError extends Error {
  constructor(
    readonly code: ExternalSearchProviderErrorCode,
    message: string,
    readonly options: { status?: number; retryable?: boolean } = {}
  ) {
    super(message);
    this.name = "ExternalSearchProviderError";
  }
}

export class MockExternalSearchProvider implements ExternalSearchProvider {
  readonly key = "mock_web";
  readonly metadata: ExternalSearchProviderMetadata;

  constructor(config: Partial<ExternalSearchProviderMetadata> = {}) {
    this.metadata = {
      provider: "mock_web",
      maxResults: config.maxResults ?? DEFAULT_MAX_RESULTS,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS
    };
  }

  async search(input: { query: string; limit?: number }) {
    const retrievedAt = new Date().toISOString();
    const query = input.query.trim();
    const results: RawExternalSearchResult[] = [
      {
        title: `Van ban phap ly lien quan: ${query}`,
        url: "https://chinhphu.vn/van-ban/phap-ly-du-an-nha-o",
        provider: this.key,
        publishedAt: "2025-01-15",
        retrievedAt,
        snippet: "Nguon chinh phu de doi chieu quy dinh phap ly va dieu kien trien khai du an."
      },
      {
        title: `Quy chuan xay dung va thiet ke: ${query}`,
        url: "https://moc.gov.vn/quy-chuan/xay-dung-thiet-ke",
        provider: this.key,
        publishedAt: "2024-11-20",
        retrievedAt,
        snippet: "Nguon bo xay dung ve quy chuan, tieu chuan va dieu kien ky thuat can review."
      },
      {
        title: `Ghi chu noi bo can review: ${query}`,
        url: "https://greennest.local/policies/document-storage",
        provider: this.key,
        retrievedAt,
        snippet: "Nguon noi bo demo cho quy trinh ho so va luu tru tai lieu du an."
      },
      {
        title: `Nguon tham khao thi truong: ${query}`,
        url: "https://example.com/market/construction-reference",
        provider: this.key,
        retrievedAt,
        snippet: "Nguon demo ben ngoai chi dung de phat hien ung vien, khong duoc tra loi AI truc tiep."
      }
    ];

    return results.slice(0, input.limit ?? results.length);
  }
}

export class TavilyExternalSearchProvider implements ExternalSearchProvider {
  readonly key = "tavily";
  readonly metadata: ExternalSearchProviderMetadata;

  constructor(
    private readonly config: {
      apiKey: string;
      maxResults: number;
      timeoutMs: number;
      endpoint?: string;
      fetchImpl?: typeof fetch;
    }
  ) {
    this.metadata = {
      provider: "tavily",
      maxResults: config.maxResults,
      timeoutMs: config.timeoutMs
    };
  }

  async search(input: { query: string; limit?: number }) {
    const fetchImpl = this.config.fetchImpl ?? fetch;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetchImpl(this.config.endpoint ?? "https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        signal: controller.signal,
        body: JSON.stringify({
          api_key: this.config.apiKey,
          query: input.query,
          max_results: Math.min(input.limit ?? this.config.maxResults, this.config.maxResults),
          include_answer: false,
          include_raw_content: false
        })
      });
      const body = (await response.json().catch(() => undefined)) as TavilySearchResponse | undefined;

      if (!response.ok) {
        throw errorForHttpResponse(response.status, body?.error);
      }

      if (!body?.results || !Array.isArray(body.results)) {
        throw new ExternalSearchProviderError("invalid_response", "Web search provider returned an invalid response.", {
          retryable: false
        });
      }

      const retrievedAt = new Date().toISOString();

      return body.results
        .filter((result) => result.title && result.url)
        .map<RawExternalSearchResult>((result) => ({
          title: result.title ?? "",
          url: result.url ?? "",
          provider: this.key,
          publishedAt: result.published_date,
          retrievedAt,
          snippet: result.content ?? result.raw_content ?? ""
        }));
    } catch (error) {
      if (isAbortError(error)) {
        throw new ExternalSearchProviderError("timeout", `Web search provider timed out after ${this.config.timeoutMs}ms.`, {
          retryable: true
        });
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function getExternalSearchProviderFromEnv(env: ExternalSearchProviderEnv = process.env): ExternalSearchProvider {
  const provider = normalizeProvider(env.WEB_SEARCH_PROVIDER, Boolean(env.WEB_SEARCH_API_KEY));
  const maxResults = parsePositiveInteger(env.WEB_SEARCH_MAX_RESULTS, DEFAULT_MAX_RESULTS);
  const timeoutMs = parsePositiveInteger(env.WEB_SEARCH_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);

  if (provider === "mock_web") {
    return new MockExternalSearchProvider({ maxResults, timeoutMs });
  }

  if (!env.WEB_SEARCH_API_KEY) {
    if (!env.WEB_SEARCH_PROVIDER || env.WEB_SEARCH_PROVIDER === "auto") {
      return new MockExternalSearchProvider({ maxResults, timeoutMs });
    }

    throw new ExternalSearchProviderError("missing_config", "WEB_SEARCH_PROVIDER yeu cau API key nhung WEB_SEARCH_API_KEY chua duoc cau hinh.", {
      retryable: false
    });
  }

  return new TavilyExternalSearchProvider({
    apiKey: env.WEB_SEARCH_API_KEY,
    maxResults,
    timeoutMs
  });
}

function normalizeProvider(provider: string | undefined, hasApiKey: boolean): "mock_web" | "tavily" {
  if (!provider || provider === "auto" || provider === "mock" || provider === "mock_web") {
    return provider === "auto" && hasApiKey ? "tavily" : "mock_web";
  }

  if (provider === "tavily") {
    return "tavily";
  }

  return "mock_web";
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function errorForHttpResponse(status: number, message: string | undefined) {
  if (status === 429) {
    return new ExternalSearchProviderError("rate_limited", message ?? "Web search provider rate limit reached.", {
      status,
      retryable: true
    });
  }

  return new ExternalSearchProviderError("provider_error", message ?? `Web search provider request failed with HTTP ${status}.`, {
    status,
    retryable: status >= 500
  });
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export const mockExternalSearchProvider = new MockExternalSearchProvider();
