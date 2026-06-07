import { z } from "zod";

import { PROPOSAL_PRIORITIES, PROPOSAL_TYPES } from "./types";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const requiredText = (message: string) => z.string().trim().min(1, message);
const dateOnlyText = optionalText.refine(
  (value) => {
    if (!value) {
      return true;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  },
  "Han xu ly phai dung dinh dang YYYY-MM-DD.",
);
const optionalUrl = optionalText.refine(
  (value) => {
    if (!value) {
      return true;
    }

    try {
      const url = new URL(value);

      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  },
  "Lien ket file phai la URL http hoac https hop le.",
);

export const proposalAttachmentInputSchema = z
  .object({
    documentId: optionalText,
    name: requiredText("Ten file dinh kem la bat buoc."),
    externalUrl: optionalUrl,
    url: optionalUrl,
  })
  .superRefine((value, context) => {
    if (!value.documentId && !value.url && !value.externalUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "File dinh kem can co documentId hoac URL.",
        path: ["url"],
      });
    }
  });

export const proposalInputSchema = z.object({
  title: z.string().trim().min(2, "Ten de xuat la bat buoc."),
  type: z.enum(Object.keys(PROPOSAL_TYPES) as [keyof typeof PROPOSAL_TYPES, ...Array<keyof typeof PROPOSAL_TYPES>]),
  projectId: optionalText,
  module: optionalText,
  ownerId: optionalText,
  onBehalfOf: optionalText,
  delegationId: optionalText,
  priority: z
    .enum(Object.keys(PROPOSAL_PRIORITIES) as [keyof typeof PROPOSAL_PRIORITIES, ...Array<keyof typeof PROPOSAL_PRIORITIES>])
    .optional()
    .default("normal"),
  amount: z.coerce.number().nonnegative().optional().or(z.literal("").transform(() => undefined)),
  dueDate: dateOnlyText,
  summary: optionalText,
  attachments: z.array(proposalAttachmentInputSchema).optional().default([]),
});

export const proposalDecisionSchema = z.object({
  notes: optionalText,
});

export const proposalApprovalActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("approve"),
    notes: optionalText,
  }),
  z.object({
    action: z.literal("reject"),
    reason: requiredText("Ly do tu choi la bat buoc."),
  }),
  z.object({
    action: z.literal("request_change"),
    reason: requiredText("Ly do tra lai la bat buoc."),
  }),
  z.object({
    action: z.literal("forward"),
    notes: optionalText,
    targetLabel: requiredText("Nhan su hoac vai tro nhan chuyen cap la bat buoc."),
    targetRole: optionalText,
    targetUserId: optionalText,
  }),
  z.object({
    action: z.literal("ask_meeting"),
    agendaDraft: optionalText,
    meetingType: optionalText,
  }),
  z.object({
    action: z.literal("hold"),
    notes: optionalText,
  }),
  z.object({
    action: z.literal("cancel"),
    reason: requiredText("Ly do huy approval la bat buoc."),
  }),
]).superRefine((value, context) => {
  if (value.action === "ask_meeting" && !value.meetingType && !value.agendaDraft) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Can co loai hop hoac agenda du thao.",
      path: ["meetingType"],
    });
  }
});

export type ProposalApprovalActionInput = z.infer<typeof proposalApprovalActionSchema>;
