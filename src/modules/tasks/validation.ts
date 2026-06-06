import { z } from "zod";

import { TASK_PRIORITIES, TASK_STATUSES } from "@/constants/statuses";

const taskStatusKeys = Object.keys(TASK_STATUSES) as [keyof typeof TASK_STATUSES, ...Array<keyof typeof TASK_STATUSES>];
const taskPriorityKeys = Object.keys(TASK_PRIORITIES) as [
  keyof typeof TASK_PRIORITIES,
  ...Array<keyof typeof TASK_PRIORITIES>
];
const taskLinkedEntityTypeKeys = ["decision", "meeting", "proposal", "document", "risk", "custom"] as const;

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

function isDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export const taskInputSchema = z.object({
  projectId: z.string().trim().min(1, "Dự án là bắt buộc."),
  title: z.string().trim().min(1, "Tên công việc là bắt buộc."),
  description: optionalText,
  assigneeId: optionalText,
  dueDate: optionalText.refine((value) => !value || isDateOnly(value), {
    message: "Deadline không hợp lệ."
  }),
  status: z.enum(taskStatusKeys),
  priority: z.enum(taskPriorityKeys),
  category: optionalText
});

export const taskCreationMetadataSchema = z
  .object({
    linkedEntityType: z.enum(taskLinkedEntityTypeKeys).optional(),
    linkedEntityId: optionalText,
    createdBy: optionalText
  })
  .superRefine((input, context) => {
    if (Boolean(input.linkedEntityType) !== Boolean(input.linkedEntityId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Task linkage must include both linkedEntityType and linkedEntityId.",
        path: input.linkedEntityType ? ["linkedEntityId"] : ["linkedEntityType"]
      });
    }
  });

export const taskUpdateSchema = taskInputSchema;

export type TaskInputSchema = z.infer<typeof taskInputSchema>;
export type TaskCreationMetadataSchema = z.infer<typeof taskCreationMetadataSchema>;
export type TaskUpdateSchema = z.infer<typeof taskUpdateSchema>;
