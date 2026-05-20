import { z } from "zod";

import {
  KNOWLEDGE_CONFIDENCE_LEVELS,
  KNOWLEDGE_MODULES,
  KNOWLEDGE_SOURCE_TYPES
} from "@/modules/knowledge/types";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const sourceRegistryEntryInputSchema = z.object({
  domain: z
    .string()
    .trim()
    .min(3, "Domain la bat buoc.")
    .transform((value) => value.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").toLowerCase()),
  sourceCategory: z.enum(["government", "standards", "internal", "market", "reference"]),
  module: z.enum(Object.keys(KNOWLEDGE_MODULES) as [keyof typeof KNOWLEDGE_MODULES, ...Array<keyof typeof KNOWLEDGE_MODULES>]),
  sourceType: z.enum(Object.keys(KNOWLEDGE_SOURCE_TYPES) as [keyof typeof KNOWLEDGE_SOURCE_TYPES, ...Array<keyof typeof KNOWLEDGE_SOURCE_TYPES>]),
  confidence: z.enum(
    Object.keys(KNOWLEDGE_CONFIDENCE_LEVELS) as [
      keyof typeof KNOWLEDGE_CONFIDENCE_LEVELS,
      ...Array<keyof typeof KNOWLEDGE_CONFIDENCE_LEVELS>
    ]
  ),
  tags: z.array(z.string().trim().min(1)).default([]),
  enabled: z.boolean().optional().default(true),
  notes: optionalText
});
