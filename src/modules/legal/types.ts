import type { LegalStepCode } from "@/constants/legal-steps";
import type { LegalStatus } from "@/constants/statuses";
import type { EntityId, TimestampFields } from "@/types/common";

export type LegalStep = TimestampFields & {
  id: EntityId;
  projectId: EntityId;
  stepCode: LegalStepCode;
  stepName: string;
  status: LegalStatus;
  assigneeId?: EntityId;
  dueDate?: string;
  completedDate?: string;
  notes?: string;
  relatedDocumentIds?: EntityId[];
};

export type LegalStepUpdateInput = {
  status: LegalStatus;
  assigneeId?: EntityId;
  dueDate?: string;
  completedDate?: string;
  notes?: string;
  relatedDocumentIds?: EntityId[];
};

export type LegalStepListFilters = {
  projectId?: EntityId | "all";
  status?: LegalStatus | "all";
  assigneeId?: EntityId | "all";
};
