import type { EntityId, TimestampFields } from "@/types/common";

export const PROPOSAL_TYPES = {
  investment: "Đầu tư",
  legal: "Pháp lý",
  document: "Hồ sơ",
  finance: "Tài chính",
  contract: "Hợp đồng",
  procurement: "Mua hàng",
  design: "Thiết kế",
  construction: "Thi công",
  hr: "Nhân sự",
  quality: "QA/QC",
  safety: "An toàn",
  general: "Chung"
} as const;

export const PROPOSAL_STATUSES = {
  draft: "Nháp",
  submitted: "Đã trình",
  in_review: "Đang review",
  change_requested: "Yêu cầu chỉnh sửa",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  archived: "Lưu trữ"
} as const;

export const PROPOSAL_PRIORITIES = {
  low: "Thấp",
  normal: "Bình thường",
  high: "Cao",
  urgent: "Khẩn cấp"
} as const;

export type ProposalType = keyof typeof PROPOSAL_TYPES;
export type ProposalStatus = keyof typeof PROPOSAL_STATUSES;
export type ProposalPriority = keyof typeof PROPOSAL_PRIORITIES;
export type ProposalAiReviewStatus = "not_checked" | "checked" | "warning" | "blocked";

export type ProposalLink = {
  id: EntityId;
  proposalId: EntityId;
  entityType: string;
  entityId: string;
  relationType: "evidence" | "source" | "output" | "dependency" | "generated_action";
  createdAt: string;
};

export type ProposalStep = TimestampFields & {
  id: EntityId;
  proposalId: EntityId;
  stepOrder: number;
  approverRole?: string;
  approverUserId?: EntityId;
  status: "pending" | "in_review" | "approved" | "rejected" | "change_requested" | "skipped";
  decidedBy?: EntityId;
  decidedAt?: string;
  decisionNotes?: string;
};

export type ProposalDecision = {
  id: EntityId;
  proposalId: EntityId;
  stepId?: EntityId;
  decision: "submitted" | "approved" | "rejected" | "change_requested" | "archived";
  decidedBy: EntityId;
  decidedAt: string;
  notes?: string;
};

export type Proposal = TimestampFields & {
  id: EntityId;
  code: string;
  title: string;
  type: ProposalType;
  projectId?: EntityId;
  module: string;
  requestedBy: EntityId;
  ownerId?: EntityId;
  currentStepId?: EntityId;
  status: ProposalStatus;
  priority: ProposalPriority;
  amount?: number;
  dueDate?: string;
  summary?: string;
  aiReviewStatus: ProposalAiReviewStatus;
  aiReviewSummary?: string;
  archivedAt?: string;
};

export type ProposalInput = {
  title: string;
  type: ProposalType;
  projectId?: EntityId;
  module?: string;
  ownerId?: EntityId;
  priority?: ProposalPriority;
  amount?: number;
  dueDate?: string;
  summary?: string;
  links?: Array<Pick<ProposalLink, "entityType" | "entityId" | "relationType">>;
};

export type ProposalListFilters = {
  projectId?: EntityId | "all";
  type?: ProposalType | "all";
  status?: ProposalStatus | "all";
  ownerId?: EntityId | "all";
  requestedBy?: EntityId | "all";
  query?: string;
};

export type ProposalDetail = {
  proposal: Proposal;
  steps: ProposalStep[];
  links: ProposalLink[];
  decisions: ProposalDecision[];
};
