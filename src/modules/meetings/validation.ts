import { z } from "zod";

import { DECISION_STATUSES } from "@/constants/statuses";

const decisionStatusKeys = Object.keys(DECISION_STATUSES) as [
  keyof typeof DECISION_STATUSES,
  ...Array<keyof typeof DECISION_STATUSES>
];

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

const dateTimeString = z.string().trim().min(1, "Thời gian họp là bắt buộc.").refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Thời gian họp không hợp lệ."
});

const optionalDate = optionalText.refine((value) => !value || !Number.isNaN(Date.parse(value)), {
  message: "Hạn xử lý không hợp lệ."
});

export const meetingInputSchema = z.object({
  projectId: z.string().trim().min(1, "Dự án là bắt buộc."),
  title: z.string().trim().min(1, "Tiêu đề cuộc họp là bắt buộc."),
  meetingDate: dateTimeString,
  summary: optionalText
});

export const meetingUpdateSchema = meetingInputSchema.omit({ projectId: true });

export const decisionInputSchema = z.object({
  meetingId: z.string().trim().min(1, "Cuộc họp là bắt buộc."),
  decisionText: z.string().trim().min(1, "Nội dung quyết định/action item là bắt buộc."),
  ownerId: optionalText,
  dueDate: optionalDate,
  status: z.enum(decisionStatusKeys)
});
