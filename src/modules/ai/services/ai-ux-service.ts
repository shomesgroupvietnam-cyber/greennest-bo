import { can, type PermissionUser } from "@/lib/permissions/can";

import type { AiAskInput, AiModule } from "../types";

export type AiAssistantPresetKey = "finance" | "legal" | "documents" | "executive" | "field";

export type AiAssistantPreset = {
  key: AiAssistantPresetKey;
  label: string;
  description: string;
  module: AiModule;
  intent: string;
  promptHint: string;
};

export const AI_ASSISTANT_PRESETS: AiAssistantPreset[] = [
  {
    key: "finance",
    label: "Kế toán",
    description: "Kiểm tra hồ sơ thanh toán, quyết toán, công nợ.",
    module: "finance",
    intent: "Kiểm tra hồ sơ thanh toán, quyết toán, công nợ",
    promptHint: "Ví dụ: Dự án này còn thiếu gì để kiểm tra hồ sơ thanh toán nhà thầu?"
  },
  {
    key: "legal",
    label: "Pháp lý",
    description: "Kiểm tra hồ sơ pháp lý và văn bản liên quan.",
    module: "legal",
    intent: "Kiểm tra hồ sơ pháp lý và văn bản liên quan",
    promptHint: "Ví dụ: Các bước pháp lý nào đang bị chặn và cần bổ sung hồ sơ gì?"
  },
  {
    key: "documents",
    label: "Hồ sơ",
    description: "Thiếu hồ sơ gì, hồ sơ nào cần cập nhật.",
    module: "documents",
    intent: "Kiểm tra hồ sơ thiếu và hồ sơ cần cập nhật",
    promptHint: "Ví dụ: Dự án này còn thiếu hồ sơ bắt buộc nào?"
  },
  {
    key: "executive",
    label: "Điều hành",
    description: "Rủi ro dự án và việc cần ưu tiên.",
    module: "project",
    intent: "Tổng hợp rủi ro dự án và việc cần ưu tiên",
    promptHint: "Ví dụ: Rủi ro lớn nhất tuần này là gì và lãnh đạo cần xử lý việc nào trước?"
  },
  {
    key: "field",
    label: "Công trường/nhà thầu",
    description: "Việc được giao và hồ sơ cần bổ sung.",
    module: "construction",
    intent: "Kiểm tra việc được giao và hồ sơ cần bổ sung",
    promptHint: "Ví dụ: Tôi đang được giao việc gì và cần bổ sung hồ sơ nào?"
  }
];

export function getAiAssistantPreset(key: FormDataEntryValue | null | undefined) {
  const normalized = String(key ?? "").trim();

  return AI_ASSISTANT_PRESETS.find((preset) => preset.key === normalized) ?? AI_ASSISTANT_PRESETS[3];
}

export function buildAiAskInputFromFormData(formData: FormData, user: PermissionUser): AiAskInput {
  const preset = getAiAssistantPreset(formData.get("preset"));
  const explicitIntent = String(formData.get("intent") ?? "").trim();

  return {
    module: preset.module,
    projectId: String(formData.get("projectId") ?? "").trim() || undefined,
    intent: explicitIntent || preset.intent || "Hỏi đáp",
    prompt: String(formData.get("prompt") ?? ""),
    mode: "fast",
    priority: "normal",
    useRag: can(user, "ai.use_rag") && formData.get("useRag") !== "off",
    wantsActionProposal: formData.get("wantsActionProposal") === "on"
  };
}

export function getFriendlyAiFailureMessage(errorCode?: string, errorMessage?: string) {
  if (!errorCode) {
    return errorMessage ?? "Trợ lý AI chưa có kết quả. Vui lòng thử xử lý lại.";
  }

  if (errorCode === "missing_config") {
    return "AI provider chưa được cấu hình. Tạm thời chuyển sang mock nếu cần test UI.";
  }

  if (errorCode === "rate_limited" || /quota|billing/i.test(errorMessage ?? "")) {
    return "API key hết quota hoặc chưa bật billing. Tạm thời chuyển sang mock nếu cần test UI.";
  }

  if (errorCode === "timeout") {
    return "Nhà cung cấp AI phản hồi quá chậm. Vui lòng thử xử lý lại sau ít phút.";
  }

  if (errorCode === "invalid_response") {
    return "Nhà cung cấp AI trả về nội dung không hợp lệ. Vui lòng thử lại hoặc chuyển sang mock để test UI.";
  }

  return errorMessage ?? "Trợ lý AI xử lý thất bại. Vui lòng thử xử lý lại.";
}

export function isTechnicalAiDetailAllowed(user: PermissionUser) {
  return user.role === "admin" || user.role === "super_admin";
}
