import { z } from "zod";

import { PROPOSAL_PRIORITIES, PROPOSAL_TYPES } from "./types";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const proposalInputSchema = z.object({
  title: z.string().trim().min(2, "Tên đề xuất là bắt buộc."),
  type: z.enum(Object.keys(PROPOSAL_TYPES) as [keyof typeof PROPOSAL_TYPES, ...Array<keyof typeof PROPOSAL_TYPES>]),
  projectId: optionalText,
  module: optionalText,
  ownerId: optionalText,
  priority: z
    .enum(Object.keys(PROPOSAL_PRIORITIES) as [keyof typeof PROPOSAL_PRIORITIES, ...Array<keyof typeof PROPOSAL_PRIORITIES>])
    .optional()
    .default("normal"),
  amount: z.coerce.number().nonnegative().optional().or(z.literal("").transform(() => undefined)),
  dueDate: optionalText,
  summary: optionalText
});

export const proposalDecisionSchema = z.object({
  notes: optionalText
});
