import { describe, expect, it } from "vitest";

import { AiProviderError } from "@/modules/ai/services/ai-provider";
import {
  checkAllProviderHealth,
  getFriendlyProviderErrorMessage
} from "@/modules/settings/services/provider-health-service";

describe("provider health UX", () => {
  it("does not run live provider checks until requested", async () => {
    const results = await checkAllProviderHealth({ runLiveChecks: false });

    expect(results).toHaveLength(3);
    expect(results.every((result) => result.status === "not_checked")).toBe(true);
  });

  it("maps provider errors to friendly messages", () => {
    expect(getFriendlyProviderErrorMessage("missing_config")).toContain("chưa được cấu hình");
    expect(getFriendlyProviderErrorMessage("rate_limited")).toContain("quota");
    expect(getFriendlyProviderErrorMessage("timeout")).toContain("quá lâu");
    expect(getFriendlyProviderErrorMessage("provider_error", "model not found")).toContain("Model không hợp lệ");
    expect(getFriendlyProviderErrorMessage("provider_error", "401 unauthorized")).toContain("API key không hợp lệ");
  });

  it("returns friendly AI health error for explicit provider without key", async () => {
    const previousProvider = process.env.AI_PROVIDER;
    const previousKey = process.env.OPENAI_API_KEY;

    process.env.AI_PROVIDER = "openai_compatible";
    delete process.env.OPENAI_API_KEY;

    try {
      const [ai] = await checkAllProviderHealth({ runLiveChecks: true });

      expect(ai?.key).toBe("ai");
      expect(ai?.status).toBe("error");
      expect(ai?.message).toContain("chưa được cấu hình");
    } finally {
      if (previousProvider === undefined) {
        delete process.env.AI_PROVIDER;
      } else {
        process.env.AI_PROVIDER = previousProvider;
      }

      if (previousKey === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = previousKey;
      }
    }
  });

  it("keeps provider error codes readable", () => {
    const error = new AiProviderError("rate_limited", "quota exceeded");

    expect(error.code).toBe("rate_limited");
    expect(getFriendlyProviderErrorMessage(error.code, error.message)).toContain("quota");
  });
});
