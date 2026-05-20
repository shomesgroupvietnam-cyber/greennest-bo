import type { DecisionStatus } from "@/constants/statuses";
import type { EntityId, TimestampFields } from "@/types/common";

export type Meeting = TimestampFields & {
  id: EntityId;
  projectId: EntityId;
  title: string;
  meetingDate: string;
  summary?: string;
  createdBy?: EntityId;
};

export type Decision = TimestampFields & {
  id: EntityId;
  meetingId?: EntityId;
  projectId: EntityId;
  decisionText: string;
  ownerId?: EntityId;
  dueDate?: string;
  status: DecisionStatus;
  taskId?: EntityId;
};

export type MeetingInput = {
  projectId: EntityId;
  title: string;
  meetingDate: string;
  summary?: string;
};

export type MeetingUpdateInput = {
  title: string;
  meetingDate: string;
  summary?: string;
};

export type DecisionInput = {
  meetingId: EntityId;
  decisionText: string;
  ownerId?: EntityId;
  dueDate?: string;
  status: DecisionStatus;
};

export type MeetingListFilters = {
  projectId?: EntityId | "all";
};

export type DecisionListFilters = {
  meetingId?: EntityId;
  projectId?: EntityId | "all";
  ownerId?: EntityId | "all";
  status?: DecisionStatus | "all";
};
