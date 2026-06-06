import type { AiModule, AiResponseValidationMetadata, AiResponseValidationReason } from "../types";
import type { AiPromptPackage } from "./ai-prompt-builder";

export type AiResponseValidationInput = {
  responseText: string;
  module: AiModule;
  promptPackage: AiPromptPackage;
};

const HIGH_IMPACT_MODULES = new Set<AiModule>(["legal", "finance", "design", "construction"]);
const INSUFFICIENT_DATA_TERMS = [
  "chua du du lieu",
  "chưa đủ dữ liệu",
  "khong du du lieu",
  "không đủ dữ liệu",
  "can kiem tra them",
  "cần kiểm tra thêm",
  "khong the ket luan",
  "không thể kết luận"
];
const UNSAFE_MUTATION_PATTERNS = [
  /\b(i|ai|toi|tôi)\s+(have\s+)?(updated|changed|created|deleted|archived|approved|rejected)\b/i,
  /\b(da|đã)\s+(cap nhat|cập nhật|tao|tạo|xoa|xóa|luu|lưu|phe duyet|phê duyệt|tu choi|từ chối)\b/i,
  /\b(task|cong viec|công việc|document|ho so|hồ sơ|legal step|buoc phap ly)\s+(da|đã)\s+(duoc\s+)?(cap nhat|cập nhật|tao|tạo|xoa|xóa)\b/i
];
const SAFE_PROPOSAL_PATTERNS = [
  /\b(i|ai|toi|tôi)\s+(propose|suggest|de xuat|đề xuất)\b/i,
  /\b(de xuat|đề xuất)\s+(tao|tạo|cap nhat|cập nhật|mot|một)\b/i,
  /\bcan\s+nguoi\s+dung\s+xac\s+nhan\b/i,
  /\bcần\s+người\s+dùng\s+xác\s+nhận\b/i
];

export function validateAiResponse(input: AiResponseValidationInput): AiResponseValidationMetadata {
  const reasons: AiResponseValidationReason[] = [
    ...validateCitationReferences(input.responseText, input.promptPackage),
    ...validateCitationRequirement(input.responseText, input.module, input.promptPackage),
    ...validateUnsupportedSourceClaims(input.responseText, input.promptPackage),
    ...validateMutationClaims(input.responseText)
  ];
  const status = reasons.some((reason) => reason.severity === "blocked")
    ? "blocked"
    : reasons.some((reason) => reason.severity === "warning")
      ? "warning"
      : "valid";

  return {
    status,
    reasons,
    checkedAt: new Date().toISOString()
  };
}

export function safeFallbackForBlockedResponse(validation: AiResponseValidationMetadata) {
  const reasonText = validation.reasons.map((reason) => reason.message).join(" ");

  return [
    "AI da chan phan hoi nay vi khong dat quy tac an toan/citation.",
    reasonText || "Vui long thu lai voi cau hoi cu the hon hoac bo sung nguon duoc phe duyet."
  ].join("\n");
}

export function applyResponseWarnings(responseText: string, validation: AiResponseValidationMetadata) {
  if (validation.status !== "warning") {
    return responseText;
  }

  return [
    "Luu y: Phan hoi AI co canh bao ve citation/du lieu. Vui long kiem tra nguon truoc khi ra quyet dinh.",
    responseText
  ].join("\n\n");
}

function validateCitationReferences(responseText: string, promptPackage: AiPromptPackage): AiResponseValidationReason[] {
  const allowedCitationIds = new Set(promptPackage.citations.map((citation) => citation.citationId));
  const citedIds = extractCitationIds(responseText);

  return citedIds
    .filter((citationId) => !allowedCitationIds.has(citationId))
    .map((citationId) => ({
      code: "unknown_citation" as const,
      severity: "blocked" as const,
      citationId,
      message: `Model da su dung citation khong ton tai trong prompt: ${citationId}.`
    }));
}

function validateCitationRequirement(
  responseText: string,
  module: AiModule,
  promptPackage: AiPromptPackage
): AiResponseValidationReason[] {
  const citedIds = extractCitationIds(responseText);

  if (citedIds.length > 0 && citedIds.some((citationId) => promptPackage.citations.some((citation) => citation.citationId === citationId))) {
    return [];
  }

  const hasCitableContext = promptPackage.citations.length > 0;
  const citationRequired = HIGH_IMPACT_MODULES.has(module) || hasCitableContext;

  if (!citationRequired) {
    return [];
  }

  if (
    (saysInsufficientData(responseText) || describesProposalOnly(responseText)) &&
    !appearsToMakeInternalFactualClaim(responseText)
  ) {
    return [];
  }

  return [
    {
      code: "citation_required",
      severity: "blocked",
      message: hasCitableContext
        ? "Phan hoi dung du lieu noi bo phai co citation hop le."
        : "Module nhay cam yeu cau citation hop le cho nhan dinh factual."
    }
  ];
}

function validateUnsupportedSourceClaims(responseText: string, promptPackage: AiPromptPackage): AiResponseValidationReason[] {
  const normalized = normalize(responseText);
  const reasons: AiResponseValidationReason[] = [];
  const hasSourceUrl = promptPackage.citations.some((citation) => Boolean(citation.sourceUrl));

  if (
    includesAny(normalized, [
      "unapproved source",
      "nguon chua duyet",
      "nguồn chưa duyệt",
      "candidate source",
      "external candidate",
      "ket qua tim kiem chua duyet",
      "kết quả tìm kiếm chưa duyệt"
    ])
  ) {
    reasons.push({
      code: "unapproved_source_claim",
      severity: "blocked",
      message: "Model da tuyen bo su dung nguon chua duyet hoac candidate source."
    });
  }

  if (includesAny(normalized, ["web search", "tim kiem web", "tìm kiếm web", "search result", "ket qua tim kiem"]) && !hasSourceUrl) {
    reasons.push({
      code: "web_search_claim",
      severity: "blocked",
      message: "Model da tuyen bo su dung web search nhung prompt khong cung cap nguon web duoc phep."
    });
  }

  return reasons;
}

function validateMutationClaims(responseText: string): AiResponseValidationReason[] {
  if (!UNSAFE_MUTATION_PATTERNS.some((pattern) => pattern.test(responseText))) {
    return [];
  }

  if (describesProposalOnly(responseText)) {
    return [];
  }

  return [
    {
      code: "unsafe_mutation_claim",
      severity: "blocked",
      message: "Model da noi nhu the du lieu da duoc thay doi; AI chi duoc de xuat hanh dong cho nguoi dung xac nhan."
    }
  ];
}

function extractCitationIds(responseText: string) {
  return [...new Set([...responseText.matchAll(/\[(CIT-\d{3,})\]/g)].map((match) => match[1]).filter(Boolean))];
}

function saysInsufficientData(responseText: string) {
  const normalized = normalize(responseText);

  return INSUFFICIENT_DATA_TERMS.some((term) => normalized.includes(term));
}

function describesProposalOnly(responseText: string) {
  const normalized = normalize(responseText);

  return (
    SAFE_PROPOSAL_PATTERNS.some((pattern) => pattern.test(responseText)) &&
    includesAny(normalized, ["de xuat", "đề xuất", "proposed", "xac nhan", "xác nhận"])
  );
}

function appearsToMakeInternalFactualClaim(responseText: string) {
  const normalized = normalize(responseText);
  const hasInternalEntity = includesAny(normalized, [
    "du an",
    "dự án",
    "du lieu noi bo",
    "dữ liệu nội bộ",
    "ban ghi",
    "bản ghi",
    "project",
    "record",
    "task",
    "cong viec",
    "công việc",
    "ho so",
    "hồ sơ",
    "document",
    "phap ly",
    "pháp lý",
    "legal",
    "meeting",
    "bao cao",
    "báo cáo",
    "tri thuc",
    "tri thức",
    "knowledge"
  ]);
  const hasFactualTerm = includesAny(normalized, [
    " co ",
    " có ",
    " dang ",
    " đang ",
    " bi ",
    " bị ",
    "qua han",
    "quá hạn",
    "blocked",
    "thieu",
    "thiếu",
    "can xu ly",
    "cần xử lý",
    "trang thai",
    "trạng thái",
    "status",
    "approved",
    "rejected",
    "open",
    "done",
    "todo",
    "high",
    "urgent"
  ]);

  return (hasInternalEntity && hasFactualTerm) || /\b\d+\b/.test(normalized);
}

function normalize(text: string) {
  return text.toLowerCase();
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}
