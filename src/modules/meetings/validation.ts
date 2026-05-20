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

const dateTimeString = z.string().trim().min(1, "Thá»i gian há»p lÃ  báº¯t buá»™c.").refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Thá»i gian há»p khÃ´ng há»£p lá»‡."
});

const optionalDate = optionalText.refine((value) => !value || !Number.isNaN(Date.parse(value)), {
  message: "Háº¡n xá»­ lÃ½ khÃ´ng há»£p lá»‡."
});

export const meetingInputSchema = z.object({
  projectId: z.string().trim().min(1, "Dá»± Ã¡n lÃ  báº¯t buá»™c."),
  title: z.string().trim().min(1, "TiÃªu Ä‘á» cuá»™c há»p lÃ  báº¯t buá»™c."),
  meetingDate: dateTimeString,
  summary: optionalText
});

export const meetingUpdateSchema = meetingInputSchema.omit({ projectId: true });

export const decisionInputSchema = z.object({
  meetingId: z.string().trim().min(1, "Cuá»™c há»p lÃ  báº¯t buá»™c."),
  decisionText: z.string().trim().min(1, "Ná»™i dung quyáº¿t Ä‘á»‹nh/action item lÃ  báº¯t buá»™c."),
  ownerId: optionalText,
  dueDate: optionalDate,
  status: z.enum(decisionStatusKeys)
});
