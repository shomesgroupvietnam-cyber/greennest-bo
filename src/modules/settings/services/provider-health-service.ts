import { checkAiProviderHealth, getAiProviderFromEnv, type AiProviderHealthResult } from "@/modules/ai/services/ai-provider";
import {
  ExternalSearchProviderError,
  getExternalSearchProviderFromEnv,
  type ExternalSearchProviderErrorCode,
  type ExternalSearchProviderMetadata
} from "@/modules/knowledge/services/external-search-provider";
import { getEmbeddingProviderFromEnv } from "@/modules/knowledge/services/knowledge-vector-retrieval";

export type ProviderHealthStatus = "ok" | "warning" | "error" | "not_checked";

export type ProviderHealthCheckResult = {
  key: "ai" | "embedding" | "web_search";
  label: string;
  status: ProviderHealthStatus;
  provider: string;
  model?: string;
  checkedAt?: string;
  errorCode?: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export async function checkAllProviderHealth(options: { runLiveChecks: boolean }) {
  if (!options.runLiveChecks) {
    return [
      notChecked("ai", "AI provider", process.env.AI_PROVIDER || "mock"),
      notChecked("embedding", "Embedding provider", process.env.AI_EMBEDDING_PROVIDER || "mock"),
      notChecked("web_search", "Web Search provider", process.env.WEB_SEARCH_PROVIDER || "mock_web")
    ];
  }

  const [ai, embedding, webSearch] = await Promise.all([checkAiHealth(), checkEmbeddingHealth(), checkWebSearchHealth()]);

  return [ai, embedding, webSearch];
}

export function getFriendlyProviderErrorMessage(errorCode?: string, message?: string) {
  const normalizedMessage = message?.toLowerCase() ?? "";

  if (errorCode === "missing_config") {
    return "Provider chưa được cấu hình API key. Có thể tạm thời chuyển sang mock để test UI.";
  }

  if (errorCode === "rate_limited" || normalizedMessage.includes("quota") || normalizedMessage.includes("billing")) {
    return "API key hết quota hoặc chưa bật billing. Tạm thời chuyển sang mock nếu cần test UI.";
  }

  if (errorCode === "timeout" || normalizedMessage.includes("timeout")) {
    return "Provider phản hồi quá lâu. Vui lòng thử lại sau hoặc tăng timeout trong môi trường staging.";
  }

  if (errorCode === "invalid_response") {
    return "Provider trả về dữ liệu không đúng định dạng. Vui lòng kiểm tra model/provider đang cấu hình.";
  }

  if (normalizedMessage.includes("model") || normalizedMessage.includes("not found")) {
    return "Model không hợp lệ hoặc chưa được bật cho API key hiện tại.";
  }

  if (normalizedMessage.includes("invalid") || normalizedMessage.includes("unauthorized") || normalizedMessage.includes("401")) {
    return "API key không hợp lệ hoặc không có quyền gọi provider.";
  }

  return "Provider tạm thời lỗi. Vui lòng kiểm tra cấu hình hoặc chuyển sang mock nếu cần test UI.";
}

async function checkAiHealth(): Promise<ProviderHealthCheckResult> {
  try {
    const provider = getAiProviderFromEnv();
    const health: AiProviderHealthResult = await checkAiProviderHealth(provider);

    return {
      key: "ai",
      label: "AI provider",
      status: health.ok ? "ok" : "error",
      provider: health.provider,
      model: health.model,
      checkedAt: health.checkedAt,
      errorCode: health.errorCode,
      message: health.ok ? "AI provider sẵn sàng." : getFriendlyProviderErrorMessage(health.errorCode, health.message),
      metadata: { rawMessage: health.message }
    };
  } catch (error) {
    return errorResult("ai", "AI provider", process.env.AI_PROVIDER || "unknown", error);
  }
}

async function checkEmbeddingHealth(): Promise<ProviderHealthCheckResult> {
  try {
    const provider = getEmbeddingProviderFromEnv();
    await provider.embedText("GreenNest provider health check");

    return {
      key: "embedding",
      label: "Embedding provider",
      status: "ok",
      provider: provider.metadata.provider,
      model: provider.metadata.model,
      checkedAt: new Date().toISOString(),
      message: "Embedding provider sẵn sàng.",
      metadata: { dimensions: provider.metadata.dimensions }
    };
  } catch (error) {
    return errorResult("embedding", "Embedding provider", process.env.AI_EMBEDDING_PROVIDER || "unknown", error);
  }
}

async function checkWebSearchHealth(): Promise<ProviderHealthCheckResult> {
  try {
    const provider = getExternalSearchProviderFromEnv();
    const results = await provider.search({ query: "GreenNest health check", limit: 1 });

    return {
      key: "web_search",
      label: "Web Search provider",
      status: "ok",
      provider: provider.key,
      checkedAt: new Date().toISOString(),
      message: "Web Search provider sẵn sàng.",
      metadata: { ...provider.metadata, resultCount: results.length } satisfies ExternalSearchProviderMetadata & { resultCount: number }
    };
  } catch (error) {
    return errorResult("web_search", "Web Search provider", process.env.WEB_SEARCH_PROVIDER || "unknown", error);
  }
}

function notChecked(key: ProviderHealthCheckResult["key"], label: string, provider: string): ProviderHealthCheckResult {
  return {
    key,
    label,
    status: "not_checked",
    provider,
    message: "Chưa kiểm tra trong phiên này. Bấm kiểm tra provider để chạy diagnostic."
  };
}

function errorResult(
  key: ProviderHealthCheckResult["key"],
  label: string,
  provider: string,
  error: unknown
): ProviderHealthCheckResult {
  const errorCode = readErrorCode(error);
  const rawMessage = error instanceof Error ? error.message : undefined;

  return {
    key,
    label,
    status: "error",
    provider,
    checkedAt: new Date().toISOString(),
    errorCode,
    message: getFriendlyProviderErrorMessage(errorCode, rawMessage),
    metadata: { rawMessage }
  };
}

function readErrorCode(error: unknown): string | undefined {
  if (error instanceof ExternalSearchProviderError) {
    return error.code satisfies ExternalSearchProviderErrorCode;
  }

  if (typeof error === "object" && error && "code" in error && typeof error.code === "string") {
    return error.code;
  }

  return undefined;
}
