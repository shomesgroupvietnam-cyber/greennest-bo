import type { EntityId, TimestampFields } from "@/types/common";

export const PROPOSAL_TYPES = {
  investment: "Dau tu",
  legal: "Phap ly",
  document: "Ho so",
  finance: "Tai chinh",
  contract: "Hop dong",
  procurement: "Mua hang",
  design: "Thiet ke",
  construction: "Thi cong",
  hr: "Nhan su",
  quality: "QA/QC",
  safety: "An toan",
  general: "Chung",
} as const;

export const PROPOSAL_STATUSES = {
  draft: "Nhap",
  submitted: "Da trinh",
  in_review: "Dang review",
  change_requested: "Yeu cau chinh sua",
  on_hold: "Tam giu",
  cancelled: "Da huy",
  approved: "Da duyet",
  rejected: "Tu choi",
  archived: "Luu tru",
} as const;

export const PROPOSAL_PRIORITIES = {
  low: "Thap",
  normal: "Binh thuong",
  high: "Cao",
  urgent: "Khan cap",
} as const;

export type ProposalType = keyof typeof PROPOSAL_TYPES;
export type ProposalStatus = keyof typeof PROPOSAL_STATUSES;
export type ProposalPriority = keyof typeof PROPOSAL_PRIORITIES;
export type ProposalAiReviewStatus = "not_checked" | "checked" | "warning" | "blocked";
export type ProposalApprovalAction =
  | "approve"
  | "reject"
  | "request_change"
  | "forward"
  | "ask_meeting"
  | "hold"
  | "cancel";

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
  requiredPermission?: string;
  thresholdPolicyId?: string;
  thresholdLabel?: string;
  approvalLevel?: string;
  status:
    | "pending"
    | "in_review"
    | "approved"
    | "rejected"
    | "change_requested"
    | "forwarded"
    | "meeting_requested"
    | "held"
    | "cancelled"
    | "skipped";
  decidedBy?: EntityId;
  decidedAt?: string;
  decisionNotes?: string;
};

export type ProposalDecision = {
  id: EntityId;
  proposalId: EntityId;
  stepId?: EntityId;
  decision:
    | "submitted"
    | "approved"
    | "rejected"
    | "change_requested"
    | "forwarded"
    | "meeting_requested"
    | "held"
    | "cancelled"
    | "archived";
  decidedBy: EntityId;
  decidedAt: string;
  notes?: string;
  version?: number;
  previousStatus?: ProposalStatus;
  nextStatus?: ProposalStatus;
  previousStepStatus?: ProposalStep["status"];
  nextStepStatus?: ProposalStep["status"];
};

export type Proposal = TimestampFields & {
  id: EntityId;
  code: string;
  title: string;
  type: ProposalType;
  projectId?: EntityId;
  module: string;
  requestedBy: EntityId;
  submittedBy?: EntityId;
  onBehalfOf?: EntityId;
  delegationId?: string;
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
  onBehalfOf?: EntityId;
  delegationId?: string;
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
