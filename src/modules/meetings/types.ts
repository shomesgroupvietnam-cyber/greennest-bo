import type { DecisionStatus, TaskPriority } from "@/constants/statuses";
import type {
  AiSummaryStatus,
  MeetingParticipantScope,
  MeetingStatus,
  MeetingType,
  MeetingVisibility,
} from "@/modules/meetings/constants";
import type { EntityId, TimestampFields } from "@/types/common";

export type MeetingAttachment = {
  id: EntityId;
  name: string;
  url?: string;
  documentId?: EntityId;
  source?: "document" | "external_url";
  uploadedBy?: EntityId;
  uploadedAt?: string;
};

export type MeetingAiSummary = {
  status: AiSummaryStatus;
  content?: string;
  approvedBy?: EntityId;
  approvedAt?: string;
};

export type MeetingMinutesApproval = {
  status: AiSummaryStatus;
  approvedBy?: EntityId;
  approvedAt?: string;
};

export type MeetingFollowUpAction = {
  id: EntityId;
  title: string;
  ownerId?: EntityId;
  dueDate?: string;
  relatedTaskId?: EntityId;
  status?: DecisionStatus;
};

export type MeetingFollowUpActionInput = {
  title: string;
  ownerId?: EntityId;
  dueDate?: string;
  status?: DecisionStatus;
  createRelatedTask?: boolean;
  taskProjectId?: EntityId;
};

export type MeetingFollowUpActionStatusInput = {
  status: DecisionStatus;
};

export type MeetingFollowUpTaskInput = {
  taskProjectId?: EntityId;
};

export type MeetingDecisionTrackingLinkInput = {
  decisionId: EntityId;
};

export type MeetingDecisionTracking = {
  id: EntityId;
  decisionText: string;
  ownerId?: EntityId;
  dueDate?: string;
  status: DecisionStatus;
  relatedTaskId?: EntityId;
};

export type MeetingAuditEntry = {
  id: EntityId;
  actorId?: EntityId;
  action: string;
  createdAt: string;
  note?: string;
};

export type MeetingRelatedRecordType =
  | "proposal"
  | "approval"
  | "risk"
  | "decision"
  | "task"
  | "document"
  | "project"
  | "custom";

export type MeetingRelatedRecordRelationType =
  | "source"
  | "context"
  | "generated_action"
  | "dependency";

export type MeetingRelatedRecord = {
  type: MeetingRelatedRecordType;
  id: EntityId;
  relationType: MeetingRelatedRecordRelationType;
  title?: string;
};

export type Meeting = TimestampFields & {
  id: EntityId;
  organizationId?: EntityId;
  projectId?: EntityId;
  projectIds?: EntityId[];
  axisId?: string;
  departmentId?: EntityId;
  title: string;
  meetingType: MeetingType;
  visibility: MeetingVisibility;
  participantScope: MeetingParticipantScope;
  status: MeetingStatus;
  meetingDate: string;
  startTime: string;
  endTime?: string;
  hostId?: EntityId;
  participants: EntityId[];
  externalParticipants: string[];
  roomId?: EntityId;
  agenda?: string;
  attachments: MeetingAttachment[];
  transcript?: string;
  aiSummary: MeetingAiSummary;
  meetingMinutes?: string;
  meetingMinutesApproval?: MeetingMinutesApproval;
  decisions: MeetingDecisionTracking[];
  followUpActions: MeetingFollowUpAction[];
  relatedApprovals: EntityId[];
  relatedTasks: EntityId[];
  relatedRecords?: MeetingRelatedRecord[];
  auditLog: MeetingAuditEntry[];
  summary?: string;
  createdBy?: EntityId;
};

export type DecisionSourceType =
  | "independent"
  | "proposal"
  | "approval"
  | "meeting";

export type DecisionLinkedRecord = {
  type:
    | "project"
    | "proposal"
    | "approval"
    | "meeting"
    | "task"
    | "document"
    | "risk"
    | "custom";
  id: string;
  relationType: "source" | "context" | "generated_action" | "dependency";
  title?: string;
};

export type DecisionScopeInput = {
  organizationId?: EntityId;
  projectId?: EntityId;
  projectIds?: EntityId[];
  axisId?: string;
  workstreamId?: string;
  moduleId?: string;
};

export type Decision = TimestampFields & {
  id: EntityId;
  title?: string;
  organizationId?: EntityId;
  meetingId?: EntityId;
  projectId?: EntityId;
  projectIds?: EntityId[];
  axisId?: string;
  workstreamId?: string;
  moduleId?: string;
  decisionText: string;
  sourceType?: DecisionSourceType;
  sourceId?: EntityId;
  linkedRecords?: DecisionLinkedRecord[];
  ownerId?: EntityId;
  priority?: TaskPriority;
  kpi?: string;
  dueDate?: string;
  status: DecisionStatus;
  taskId?: EntityId;
  createdBy?: EntityId;
  decidedBy?: EntityId;
  decidedAt?: string;
};

export type DecisionVersionField =
  | "title"
  | "decisionText"
  | "ownerId"
  | "dueDate"
  | "priority"
  | "status"
  | "organizationId"
  | "projectId"
  | "projectIds"
  | "axisId"
  | "workstreamId"
  | "moduleId"
  | "linkedRecords"
  | "kpi";

export type DecisionVersionValue = Partial<
  Record<DecisionVersionField, unknown>
>;

export type DecisionVersion = TimestampFields & {
  id: EntityId;
  decisionId: EntityId;
  versionNumber: number;
  changedFields: DecisionVersionField[];
  previousValue: DecisionVersionValue;
  newValue: DecisionVersionValue;
  reason?: string;
  createdBy: EntityId;
};

export type DecisionHistoryEvent =
  | {
      id: EntityId;
      type: "version";
      actorId?: EntityId;
      createdAt: string;
      versionNumber: number;
      changedFields: DecisionVersionField[];
      previousValue?: DecisionVersionValue;
      newValue?: DecisionVersionValue;
      reason?: string;
    }
  | {
      id: EntityId;
      type: "audit";
      actorId?: EntityId;
      createdAt: string;
      action: string;
      summary?: string;
      changedFields?: string[];
    };

export type DecisionAssignmentStatus =
  | "assigned"
  | "in_progress"
  | "done"
  | "cancelled";

export type DecisionAssignmentAssigneeType = "user" | "department" | "project";

export type DecisionAssignment = TimestampFields & {
  id: EntityId;
  decisionId: EntityId;
  taskId?: EntityId;
  organizationId?: EntityId;
  projectId: EntityId;
  assigneeType: DecisionAssignmentAssigneeType;
  assigneeId?: EntityId;
  departmentId?: EntityId;
  title: string;
  description?: string;
  kpi?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: DecisionAssignmentStatus;
  createdBy: EntityId;
};

export type DecisionAssignmentInput = {
  projectId?: EntityId;
  assigneeType: DecisionAssignmentAssigneeType;
  assigneeId?: EntityId;
  departmentId?: EntityId;
  title: string;
  description?: string;
  kpi?: string;
  dueDate?: string;
  priority?: TaskPriority;
};

export type CreateDecisionAssignmentsInput = {
  decisionId: EntityId;
  assignments: DecisionAssignmentInput[];
};

export type MeetingInput = {
  organizationId?: EntityId;
  projectId?: EntityId;
  projectIds?: EntityId[];
  axisId?: string;
  departmentId?: EntityId;
  title: string;
  meetingType?: MeetingType;
  visibility?: MeetingVisibility;
  participantScope?: MeetingParticipantScope;
  status?: MeetingStatus;
  meetingDate: string;
  endTime?: string;
  hostId?: EntityId;
  participants?: EntityId[];
  externalParticipants?: string[];
  roomId?: EntityId;
  agenda?: string;
  meetingMinutes?: string;
  summary?: string;
  relatedApprovals?: EntityId[];
  relatedTasks?: EntityId[];
  relatedDecisions?: EntityId[];
  relatedRisks?: EntityId[];
  relatedDocuments?: EntityId[];
  relatedRecords?: MeetingRelatedRecord[];
};

export type MeetingRelatedRecordVisibilityInput = {
  visibleRelatedApprovals?: EntityId[];
  visibleRelatedTasks?: EntityId[];
  visibleRelatedDecisions?: EntityId[];
  visibleRelatedRisks?: EntityId[];
  visibleRelatedDocuments?: EntityId[];
};

export type MeetingUpdateInput = Omit<
  MeetingInput,
  "organizationId" | "projectId" | "projectIds" | "axisId" | "departmentId"
> &
  MeetingRelatedRecordVisibilityInput;

export type MeetingMinutesUpdateInput = {
  meetingMinutes?: string;
  summary?: string;
};

export type MeetingAttachmentInput = {
  name: string;
  url?: string;
  documentId?: EntityId;
};

export type MeetingAiSummaryDraftInput = {
  content?: string;
};

export type DecisionInput = {
  meetingId: EntityId;
  decisionText: string;
  ownerId?: EntityId;
  dueDate?: string;
  status: DecisionStatus;
};

export type CreateDecisionRecordInput = DecisionScopeInput & {
  title?: string;
  content?: string;
  decisionText?: string;
  source?: {
    type: DecisionSourceType;
    id?: EntityId;
  };
  sourceType?: DecisionSourceType;
  sourceId?: EntityId;
  linkedRecords?: DecisionLinkedRecord[];
  ownerId?: EntityId;
  priority?: TaskPriority;
  kpi?: string;
  dueDate?: string;
  status?: DecisionStatus;
  decidedBy?: EntityId;
  scope?: DecisionScopeInput;
};

export type UpdateDecisionRecordInput = DecisionScopeInput & {
  decisionId: EntityId;
  title?: string;
  content?: string;
  decisionText?: string;
  linkedRecords?: DecisionLinkedRecord[];
  ownerId?: EntityId;
  priority?: TaskPriority;
  kpi?: string;
  dueDate?: string;
  status?: DecisionStatus;
  reason?: string;
  scope?: DecisionScopeInput;
};

export type MeetingListFilters = {
  projectId?: EntityId | "all";
  organizationId?: EntityId | "all";
  axisId?: string | "all";
  departmentId?: EntityId | "all";
  participantId?: EntityId | "all";
  meetingType?: MeetingType | "all";
  status?: MeetingStatus | "all";
  visibility?: MeetingVisibility | "all";
  dateFrom?: string | "all";
  dateTo?: string | "all";
};

export type DecisionListFilters = {
  meetingId?: EntityId;
  projectId?: EntityId | "all";
  ownerId?: EntityId | "all";
  status?: DecisionStatus | "all";
};

export type DecisionAssignmentListFilters = {
  decisionId?: EntityId;
  taskId?: EntityId;
  projectId?: EntityId | "all";
  assigneeId?: EntityId | "all";
  status?: DecisionAssignmentStatus | "all";
};
