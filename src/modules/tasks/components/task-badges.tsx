import React from "react";

import { TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskStatus } from "@/constants/statuses";
import { cn } from "@/lib/utils";

const statusClasses: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-slate-700",
  in_progress: "bg-amber-50 text-amber-700",
  waiting: "bg-blue-50 text-blue-700",
  done: "bg-emerald-50 text-emerald-700",
  blocked: "bg-red-50 text-red-700"
};

const priorityClasses: Record<TaskPriority, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-amber-50 text-amber-700",
  urgent: "bg-red-50 text-red-700"
};

type TaskStatusBadgeProps = {
  status: TaskStatus;
};

type TaskPriorityBadgeProps = {
  priority: TaskPriority;
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", statusClasses[status])}>
      {TASK_STATUSES[status]}
    </span>
  );
}

export function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", priorityClasses[priority])}>
      {TASK_PRIORITIES[priority]}
    </span>
  );
}
