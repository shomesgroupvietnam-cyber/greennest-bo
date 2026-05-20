import { z } from "zod";

import { AI_JOB_PRIORITIES, AI_MODULES, AI_REQUEST_MODES } from "./types";

const resourceRefSchema = z.object({
  entityType: z.string().trim().min(1),
  entityId: z.string().trim().min(1)
});

export const aiAskInputSchema = z.object({
  module: z.enum(Object.keys(AI_MODULES) as [keyof typeof AI_MODULES, ...Array<keyof typeof AI_MODULES>]),
  projectId: z.string().trim().min(1).optional(),
  resourceRefs: z.array(resourceRefSchema).optional().default([]),
  intent: z.preprocess((value) => {
    const text = String(value ?? "").trim();

    return text || "Hoi dap";
  }, z.string().trim().min(2, "Can neu muc dich yeu cau AI.")),
  prompt: z.string().trim().min(3, "Can nhap cau hoi cho AI."),
  mode: z.enum(Object.keys(AI_REQUEST_MODES) as [keyof typeof AI_REQUEST_MODES, ...Array<keyof typeof AI_REQUEST_MODES>]).optional().default("queued"),
  priority: z
    .enum(Object.keys(AI_JOB_PRIORITIES) as [keyof typeof AI_JOB_PRIORITIES, ...Array<keyof typeof AI_JOB_PRIORITIES>])
    .optional()
    .default("normal"),
  useRag: z.coerce.boolean().optional().default(false),
  wantsActionProposal: z.coerce.boolean().optional().default(false)
});

export type AiAskInputValues = z.infer<typeof aiAskInputSchema>;
