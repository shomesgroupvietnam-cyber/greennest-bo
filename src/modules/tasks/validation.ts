import { z } from "zod";

import { TASK_PRIORITIES, TASK_STATUSES } from "@/constants/statuses";

const taskStatusKeys = Object.keys(TASK_STATUSES) as [keyof typeof TASK_STATUSES, ...Array<keyof typeof TASK_STATUSES>];
const taskPriorityKeys = Object.keys(TASK_PRIORITIES) as [
  keyof typeof TASK_PRIORITIES,
  ...Array<keyof typeof TASK_PRIORITIES>
];

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

export const taskInputSchema = z.object({
  projectId: z.string().trim().min(1, "Dự án là bắt buộc."),
  title: z.string().trim().min(1, "Tên công việc là bắt buộc."),
  description: optionalText,
  assigneeId: optionalText,
  dueDate: optionalText.refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    message: "Deadline không hợp lệ."
  }),
  status: z.enum(taskStatusKeys),
  priority: z.enum(taskPriorityKeys),
  category: optionalText
});

export const taskUpdateSchema = taskInputSchema;

export type TaskInputSchema = z.infer<typeof taskInputSchema>;
export type TaskUpdateSchema = z.infer<typeof taskUpdateSchema>;
