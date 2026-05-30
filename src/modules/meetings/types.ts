import type { DecisionStatus, TaskPriority } from "@/constants/statuses";
import type {
  AiSummaryStatus,
  MeetingParticipantScope,
  MeetingStatus,
  MeetingType,
  MeetingVisibility
} from "@/modules/meetings/constants";
import type { EntityId, TimestampFields } from "@/types/common";

export type MeetingAttachment = {
  id: EntityId;
  name: string;
  url?: string;
  documentId?: EntityId;
};

export type MeetingAiSummary = {
  status: AiSummaryStatus;
  content?: string;
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
  decisions: MeetingDecisionTracking[];
  followUpActions: MeetingFollowUpAction[];
  relatedApprovals: EntityId[];
  relatedTasks: EntityId[];
  auditLog: MeetingAuditEntry[];
  summary?: string;
  createdBy?: EntityId;
};

export type DecisionSourceType = "independent" | "proposal" | "approval" | "meeting";

export type DecisionLinkedRecord = {
  type: "project" | "proposal" | "approval" | "meeting" | "task" | "document" | "risk" | "custom";
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
  dueDate?: string;
  status: DecisionStatus;
  taskId?: EntityId;
  createdBy?: EntityId;
  decidedBy?: EntityId;
  decidedAt?: string;
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
};

export type MeetingUpdateInput = Omit<MeetingInput, "projectId" | "projectIds">;

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
  dueDate?: string;
  status?: DecisionStatus;
  decidedBy?: EntityId;
  scope?: DecisionScopeInput;
};

export type MeetingListFilters = {
  projectId?: EntityId | "all";
  organizationId?: EntityId | "all";
  axisId?: string | "all";
  departmentId?: EntityId | "all";
  meetingType?: MeetingType | "all";
  status?: MeetingStatus | "all";
  visibility?: MeetingVisibility | "all";
};

export type DecisionListFilters = {
  meetingId?: EntityId;
  projectId?: EntityId | "all";
  ownerId?: EntityId | "all";
  status?: DecisionStatus | "all";
};
