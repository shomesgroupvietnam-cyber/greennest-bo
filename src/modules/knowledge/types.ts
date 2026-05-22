import type { EntityId, TimestampFields } from "@/types/common";

export const KNOWLEDGE_SOURCE_TYPES = {
  law: "Văn bản pháp luật",
  standard: "Tiêu chuẩn/quy chuẩn",
  template: "Mẫu biểu",
  policy: "Chính sách nội bộ",
  contract: "Hợp đồng",
  technical_guideline: "Hướng dẫn kỹ thuật",
  market: "Thông tin thị trường",
  internal_note: "Ghi chú nội bộ"
} as const;

export const KNOWLEDGE_MODULES = {
  legal: "Pháp lý",
  design: "Thiết kế",
  construction: "Thi công",
  finance: "Tài chính",
  documents: "Hồ sơ",
  meetings: "Cuộc họp",
  reports: "Báo cáo",
  project: "Dự án",
  general: "Chung"
} as const;

export const KNOWLEDGE_STATUSES = {
  discovered: "Mới phát hiện",
  imported: "Đã nhập",
  pending_review: "Chờ review",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  expired: "Hết hiệu lực",
  superseded: "Bị thay thế"
} as const;

export const KNOWLEDGE_CONFIDENCE_LEVELS = {
  official: "Nguồn chính thức",
  internal_approved: "Nội bộ đã duyệt",
  external_reference: "Tham khảo bên ngoài",
  unknown: "Chưa xác định"
} as const;

export type KnowledgeSourceType = keyof typeof KNOWLEDGE_SOURCE_TYPES;
export type KnowledgeModule = keyof typeof KNOWLEDGE_MODULES;
export type KnowledgeStatus = keyof typeof KNOWLEDGE_STATUSES;
export type KnowledgeConfidence = keyof typeof KNOWLEDGE_CONFIDENCE_LEVELS;
export type KnowledgeAccessLevel = "internal" | "external_limited" | "public_read";
export type KnowledgeCandidateSourceType = "chat" | "ai_response" | "web_search" | "upload" | "meeting" | "report" | "document" | "manual";
export type KnowledgeCandidateStatus = "candidate" | "pending_review" | "approved" | "rejected" | "expired" | "superseded";

export const KNOWLEDGE_CANDIDATE_SOURCE_TYPES: Record<KnowledgeCandidateSourceType, string> = {
  chat: "Trao đổi/chat",
  ai_response: "Phản hồi AI",
  web_search: "Web search",
  upload: "Tải lên",
  meeting: "Cuộc họp",
  report: "Báo cáo",
  document: "Hồ sơ",
  manual: "Nhập thủ công"
};

export const KNOWLEDGE_CANDIDATE_STATUSES: Record<KnowledgeCandidateStatus, string> = {
  candidate: "Ứng viên",
  pending_review: "Chờ review",
  approved: "Đã promote",
  rejected: "Từ chối",
  expired: "Hết hiệu lực",
  superseded: "Bị thay thế"
};

export type KnowledgeItem = TimestampFields & {
  id: EntityId;
  title: string;
  sourceUrl?: string;
  sourceFileId?: string;
  sourceType: KnowledgeSourceType;
  module: KnowledgeModule;
  jurisdiction?: string;
  effectiveDate?: string;
  expiryDate?: string;
  status: KnowledgeStatus;
  confidence: KnowledgeConfidence;
  tags: string[];
  summary?: string;
  notes?: string;
  reviewedBy?: EntityId;
  approvedBy?: EntityId;
  reviewedAt?: string;
  approvedAt?: string;
  createdBy?: EntityId;
  isRagEligible: boolean;
};

export type KnowledgeItemInput = {
  title: string;
  sourceUrl?: string;
  sourceFileId?: string;
  sourceType: KnowledgeSourceType;
  module: KnowledgeModule;
  jurisdiction?: string;
  effectiveDate?: string;
  expiryDate?: string;
  status?: Extract<KnowledgeStatus, "discovered" | "imported" | "pending_review">;
  confidence: KnowledgeConfidence;
  tags?: string[];
  summary?: string;
  notes?: string;
};

export type KnowledgeCandidate = TimestampFields & {
  id: EntityId;
  sourceType: KnowledgeCandidateSourceType;
  sourceRefId?: EntityId;
  module: KnowledgeModule;
  title: string;
  extractedText: string;
  submittedBy: EntityId;
  status: KnowledgeCandidateStatus;
  promotedKnowledgeItemId?: EntityId;
  reviewedBy?: EntityId;
  reviewedAt?: string;
  notes?: string;
};

export type KnowledgeCandidateInput = {
  sourceType: KnowledgeCandidateSourceType;
  sourceRefId?: EntityId;
  module: KnowledgeModule;
  title: string;
  extractedText: string;
  notes?: string;
};

export type KnowledgeCandidateListFilters = {
  module?: KnowledgeModule | "all";
  sourceType?: KnowledgeCandidateSourceType | "all";
  status?: KnowledgeCandidateStatus | "all";
  query?: string;
};

export type KnowledgeCandidateReviewInput = {
  notes?: string;
};

export type KnowledgeReviewInput = {
  notes?: string;
};

export type KnowledgeListFilters = {
  module?: KnowledgeModule | "all";
  sourceType?: KnowledgeSourceType | "all";
  status?: KnowledgeStatus | "all";
  confidence?: KnowledgeConfidence | "all";
  query?: string;
};

export type KnowledgeCitationMetadata = {
  knowledgeItemId: EntityId;
  knowledgeTitle: string;
  sourceUrl?: string;
  sourceFileId?: string;
  sourceType: KnowledgeSourceType;
  module: KnowledgeModule;
  jurisdiction?: string;
  effectiveDate?: string;
  expiresAt?: string;
};

export type KnowledgeChunk = TimestampFields & {
  id: EntityId;
  knowledgeItemId: EntityId;
  module: KnowledgeModule;
  chunkText: string;
  chunkOrder: number;
  sourceType: KnowledgeSourceType;
  status: KnowledgeStatus;
  effectiveDate?: string;
  expiresAt?: string;
  accessLevel: KnowledgeAccessLevel;
  citation: KnowledgeCitationMetadata;
  embedding?: number[];
  embeddingModel?: string;
  embeddedAt?: string;
};

export type KnowledgeChunkFilters = {
  knowledgeItemId?: EntityId;
  module?: KnowledgeModule | "all";
  status?: KnowledgeStatus | "all";
  accessLevels?: KnowledgeAccessLevel[];
  sourceTypes?: KnowledgeSourceType[];
  query?: string;
};

export type KnowledgeRetrievalResult = {
  chunk: KnowledgeChunk;
  citation: KnowledgeCitationMetadata;
  score?: number;
  retrievalMode?: "deterministic" | "vector";
};

export type KnowledgeRetrievalContext = {
  selectedChunks: KnowledgeRetrievalResult[];
  citations: KnowledgeCitationMetadata[];
  contextText: string;
  maxLength: number;
  usedLength: number;
  truncated: boolean;
};

export type ExternalSearchProviderKey = "mock_web" | "tavily";

export type ExternalSourceCandidate = {
  id: EntityId;
  title: string;
  url: string;
  provider: ExternalSearchProviderKey | string;
  publishedAt?: string;
  retrievedAt: string;
  snippet: string;
  sourceType: KnowledgeSourceType;
  confidence: KnowledgeConfidence;
  module: KnowledgeModule;
  tags: string[];
};

export type ExternalSearchLog = {
  id: EntityId;
  userId: EntityId;
  query: string;
  provider: ExternalSearchProviderKey | string;
  providerMetadata?: Record<string, unknown>;
  resultCount: number;
  createdAt: string;
};

export type KnowledgeDiscoveryFrequency = "manual" | "daily" | "weekly";
export type KnowledgeDiscoveryRunStatus = "never_run" | "succeeded" | "partial" | "failed";
export type KnowledgeDiscoveryErrorCode =
  | "missing_config"
  | "timeout"
  | "rate_limited"
  | "provider_error"
  | "invalid_response"
  | "unknown";

export const KNOWLEDGE_DISCOVERY_FREQUENCIES: Record<KnowledgeDiscoveryFrequency, string> = {
  manual: "Thu cong",
  daily: "Hang ngay",
  weekly: "Hang tuan"
};

export const KNOWLEDGE_DISCOVERY_RUN_STATUSES: Record<KnowledgeDiscoveryRunStatus, string> = {
  never_run: "Chua chay",
  succeeded: "Thanh cong",
  partial: "Mot phan",
  failed: "That bai"
};

export type KnowledgeDiscoveryTopic = TimestampFields & {
  id: EntityId;
  module: KnowledgeModule;
  query: string;
  enabled: boolean;
  frequency: KnowledgeDiscoveryFrequency;
  ownerId?: EntityId;
  reviewerId?: EntityId;
  lastRunAt?: string;
  lastRunStatus: KnowledgeDiscoveryRunStatus;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;
  errorCode?: KnowledgeDiscoveryErrorCode;
  errorMessage?: string;
  lockedAt?: string;
  lockedBy?: string;
  createdBy?: EntityId;
  updatedBy?: EntityId;
};

export type KnowledgeDiscoveryTopicInput = {
  module: KnowledgeModule;
  query: string;
  enabled?: boolean;
  frequency?: KnowledgeDiscoveryFrequency;
  ownerId?: EntityId;
  reviewerId?: EntityId;
  maxRetries?: number;
};

export type KnowledgeDiscoveryRunLog = {
  id: EntityId;
  topicId: EntityId;
  runBy: EntityId;
  query: string;
  provider: ExternalSearchProviderKey | string;
  providerMetadata?: Record<string, unknown>;
  status: Exclude<KnowledgeDiscoveryRunStatus, "never_run">;
  resultCount: number;
  importedCount: number;
  skippedDuplicateCount: number;
  skippedDisallowedCount: number;
  retryCount?: number;
  maxRetries?: number;
  nextRetryAt?: string;
  errorCode?: KnowledgeDiscoveryErrorCode;
  errorMessage?: string;
  startedAt: string;
  finishedAt: string;
};

export type SourceRegistryEntry = {
  domain: string;
  sourceCategory: "government" | "standards" | "internal" | "market" | "reference";
  module: KnowledgeModule;
  sourceType: KnowledgeSourceType;
  confidence: KnowledgeConfidence;
  tags: string[];
};

export type ManagedSourceRegistryEntry = TimestampFields &
  SourceRegistryEntry & {
    id: EntityId;
    enabled: boolean;
    notes?: string;
    createdBy?: EntityId;
    updatedBy?: EntityId;
  };

export type SourceRegistryEntryInput = SourceRegistryEntry & {
  enabled?: boolean;
  notes?: string;
};
