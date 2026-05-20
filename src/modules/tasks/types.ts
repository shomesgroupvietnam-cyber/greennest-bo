import type { TaskPriority, TaskStatus } from "@/constants/statuses";
import type { EntityId, TimestampFields } from "@/types/common";

export type Task = TimestampFields & {
  id: EntityId;
  projectId: EntityId;
  title: string;
  description?: string;
  assigneeId?: EntityId;
  dueDate?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: string;
};

export type TaskInput = {
  projectId: EntityId;
  title: string;
  description?: string;
  assigneeId?: EntityId;
  dueDate?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: string;
};

export type TaskUpdateInput = TaskInput;

export type TaskScope = "all" | "overdue" | "upcoming" | "mine";

export type TaskListFilters = {
  projectId?: EntityId | "all";
  status?: TaskStatus | "all";
  priority?: TaskPriority | "all";
  assigneeId?: EntityId;
  scope?: TaskScope;
  upcomingWindowDays?: number;
  today?: Date;
};
