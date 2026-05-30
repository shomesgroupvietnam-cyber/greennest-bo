import type { PermissionAction } from "@/lib/permissions/can";
import type { AccessScopeKind } from "@/lib/permissions/access-scope";
import type { KnowledgeModule } from "@/modules/knowledge/types";
import type { EntityId, TimestampFields } from "@/types/common";

export const AI_MODULES = {
  project: "Du an",
  tasks: "Cong viec",
  documents: "Ho so",
  legal: "Phap ly",
  meetings: "Cuoc hop",
  reports: "Bao cao",
  design: "Thiet ke",
  construction: "Thi cong",
  finance: "Tai chinh",
  general: "Chung"
} as const;

export const AI_JOB_PRIORITIES = {
  low: "Thap",
  normal: "Binh thuong",
  high: "Cao",
  urgent: "Khan cap"
} as const;

export const AI_JOB_STATUSES = {
  queued: "Dang cho",
  running: "Dang xu ly",
  succeeded: "Hoan tat",
  failed: "That bai",
  cancelled: "Da huy",
  expired: "Het han"
} as const;

export const AI_REQUEST_MODES = {
  fast: "Xu ly nhanh mock",
  queued: "Hang doi mock"
} as const;

export const AI_WORKFLOW_STATUSES = {
  DRAFT: "DRAFT",
  REVIEWING: "REVIEWING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const AI_WORKFLOW_STATUS_LABELS: Record<
  keyof typeof AI_WORKFLOW_STATUSES,
  string
> = {
  DRAFT: "Bản nháp AI",
  REVIEWING: "Đang review",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

export type AiModule = keyof typeof AI_MODULES;
export type AiJobPriority = keyof typeof AI_JOB_PRIORITIES;
export type AiJobStatus = keyof typeof AI_JOB_STATUSES;
export type AiRequestMode = keyof typeof AI_REQUEST_MODES;
export type AiWorkflowStatus = keyof typeof AI_WORKFLOW_STATUSES;
export type AiInteractionStatus = "pending" | "queued" | "running" | "succeeded" | "failed" | "cancelled";
export type AiCitationType = "knowledge_chunk" | "knowledge_item" | "internal_record" | "external_candidate_review_only";
export type AiActionProposalStatus = "proposed" | "accepted" | "rejected" | "expired" | "executed" | "failed";
export type AiProviderErrorCode = "missing_config" | "timeout" | "rate_limited" | "provider_error" | "invalid_response";
export type AiUsageMetadata = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCost?: number;
};
export type AiResponseSafetyStatus = "valid" | "warning" | "blocked";
export type AiResponseValidationReason = {
  code:
    | "unknown_citation"
    | "citation_required"
    | "unapproved_source_claim"
    | "web_search_claim"
    | "unsafe_mutation_claim";
  severity: Exclude<AiResponseSafetyStatus, "valid">;
  message: string;
  citationId?: string;
};
export type AiResponseValidationMetadata = {
  status: AiResponseSafetyStatus;
  reasons: AiResponseValidationReason[];
  checkedAt: string;
};
export type AiActionProposalKey =
  | "create_task"
  | "request_document_update"
  | "update_legal_note"
  | "create_legal_followup_task"
  | "create_meeting_action_item";

export type AiResourceRef = {
  entityType: string;
  entityId: EntityId;
};

export type AiScopeSnapshot = {
  userId: EntityId;
  role: string;
  permissions: PermissionAction[];
  scopeKind: AccessScopeKind;
  module: AiModule;
  projectId?: EntityId;
  resourceRefs: AiResourceRef[];
  capturedAt: string;
};

export type AiAskInput = {
  module: AiModule;
  projectId?: EntityId;
  resourceRefs?: AiResourceRef[];
  intent: string;
  prompt: string;
  mode?: AiRequestMode;
  priority?: AiJobPriority;
  useRag?: boolean;
  wantsActionProposal?: boolean;
};

export type AiInteraction = TimestampFields & {
  id: EntityId;
  requestedBy: EntityId;
  projectId?: EntityId;
  module: AiModule;
  intent: string;
  mode: AiRequestMode;
  promptSummary: string;
  responseText?: string;
  responseSummary?: string;
  modelProvider: string;
  modelName: string;
  usage?: AiUsageMetadata;
  responseValidation?: AiResponseValidationMetadata;
  workflowStatus?: AiWorkflowStatus;
  status: AiInteractionStatus;
  scopeSnapshot: AiScopeSnapshot;
  completedAt?: string;
};

export type AiJobPayload = {
  prompt: string;
  intent: string;
  useRag: boolean;
  wantsActionProposal: boolean;
  knowledgeModule: KnowledgeModule | "all";
};

export type AiJob = TimestampFields & {
  id: EntityId;
  interactionId: EntityId;
  requestedBy: EntityId;
  projectId?: EntityId;
  module: AiModule;
  intent: string;
  mode: AiRequestMode;
  priority: AiJobPriority;
  status: AiJobStatus;
  scopeSnapshot: AiScopeSnapshot;
  rateLimitKey: string;
  payload: AiJobPayload;
  resultSummary?: string;
  usage?: AiUsageMetadata;
  responseValidation?: AiResponseValidationMetadata;
  errorCode?: string;
  errorMessage?: string;
  lockedBy?: string;
  lockedAt?: string;
  startedAt?: string;
  finishedAt?: string;
};

export type AiCitation = {
  id: EntityId;
  interactionId: EntityId;
  jobId?: EntityId;
  citationType: AiCitationType;
  entityType?: string;
  entityId?: EntityId;
  knowledgeItemId?: EntityId;
  knowledgeChunkId?: EntityId;
  title: string;
  sourceUrl?: string;
  module: KnowledgeModule | AiModule;
  projectId?: EntityId;
  accessLevel?: string;
  createdAt: string;
};

export type AiActionProposal = TimestampFields & {
  id: EntityId;
  interactionId: EntityId;
  jobId?: EntityId;
  requestedBy: EntityId;
  projectId?: EntityId;
  module: AiModule;
  actionKey: AiActionProposalKey | string;
  targetEntityType: string;
  targetEntityId?: EntityId;
  proposedPayload: Record<string, unknown>;
  rationale?: string;
  requiredPermission: PermissionAction;
  workflowStatus?: AiWorkflowStatus;
  status: AiActionProposalStatus;
  decidedBy?: EntityId;
  decidedAt?: string;
  decisionNotes?: string;
  executionResult?: unknown;
};

export type AiAskResult = {
  interaction: AiInteraction;
  job: AiJob;
  citations: AiCitation[];
  actionProposals: AiActionProposal[];
};

export type AiListFilters = {
  requestedBy?: EntityId;
  projectId?: EntityId | "all";
  module?: AiModule | "all";
  status?: AiInteractionStatus | "all";
};
