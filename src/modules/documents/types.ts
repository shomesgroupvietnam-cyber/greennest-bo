import type { DocumentApprovalStatus, DocumentStatus } from "@/constants/statuses";
import type { EntityId, TimestampFields } from "@/types/common";

export type Document = TimestampFields & {
  id: EntityId;
  projectId: EntityId;
  title: string;
  docType: string;
  fileUrl?: string;
  externalUrl?: string;
  version: string;
  status: DocumentStatus;
  ownerId?: EntityId;
  approvalStatus?: DocumentApprovalStatus;
  reviewerId?: EntityId;
  reviewedAt?: string;
  approvalNotes?: string;
};

export type DocumentInput = {
  projectId: EntityId;
  title: string;
  docType: string;
  fileUrl?: string;
  externalUrl?: string;
  version: string;
  status: DocumentStatus;
  ownerId?: EntityId;
};

export type DocumentUpdateInput = DocumentInput;

export type DocumentApprovalInput = {
  reviewerId: EntityId;
  approvalNotes?: string;
};

export type DocumentRejectionInput = DocumentApprovalInput & {
  approvalNotes: string;
};

export type DocumentVersion = {
  id: EntityId;
  documentId: EntityId;
  version: string;
  fileUrl?: string;
  externalUrl?: string;
  uploadedBy?: EntityId;
  uploadedAt: string;
  notes?: string;
};

export type DocumentListFilters = {
  projectId?: EntityId | "all";
  docType?: string | "all";
  status?: DocumentStatus | "all";
  ownerId?: EntityId | "all";
};

export type DocumentRequirementTemplate = TimestampFields & {
  id: EntityId;
  projectType: string;
  requirementCode: string;
  requirementName: string;
  docType: string;
  requiredPhase?: string;
  legalStepCode?: string;
  isRequired: boolean;
  orderIndex: number;
};

export type DocumentRequirementTemplateInput = {
  projectType: string;
  requirementCode: string;
  requirementName: string;
  docType: string;
  requiredPhase?: string;
  legalStepCode?: string;
  isRequired: boolean;
  orderIndex: number;
};

export type DocumentRequirementListFilters = {
  projectType?: string | "all";
  docType?: string | "all";
  isRequired?: boolean | "all";
};

export type DocumentReadinessStatus = "complete" | "submitted" | "missing" | "needs_update" | "optional_missing";

export type DocumentRequirementReadinessItem = {
  requirement: DocumentRequirementTemplate;
  matchingDocuments: Document[];
  status: DocumentReadinessStatus;
  relatedLegalStepName?: string;
};

export type ProjectDocumentReadiness = {
  projectId: EntityId;
  projectType?: string;
  requiredCount: number;
  completedRequiredCount: number;
  submittedRequiredCount: number;
  missingRequirements: DocumentRequirementReadinessItem[];
  needsUpdateRequirements: DocumentRequirementReadinessItem[];
  items: DocumentRequirementReadinessItem[];
  completionRatio: number;
};
