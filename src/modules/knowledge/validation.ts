import { z } from "zod";

import {
  KNOWLEDGE_CANDIDATE_SOURCE_TYPES,
  KNOWLEDGE_CONFIDENCE_LEVELS,
  KNOWLEDGE_DISCOVERY_FREQUENCIES,
  KNOWLEDGE_MODULES,
  KNOWLEDGE_SOURCE_TYPES
} from "@/modules/knowledge/types";

const optionalDate = z.string().trim().optional().transform((value) => (value ? value : undefined));
const optionalText = z.string().trim().optional().transform((value) => (value ? value : undefined));

export const knowledgeItemInputSchema = z
  .object({
    title: z.string().trim().min(2, "Tên nguồn tri thức là bắt buộc."),
    sourceUrl: z.string().trim().url("URL nguồn không hợp lệ.").optional().or(z.literal("")).transform((value) => value || undefined),
    sourceFileId: optionalText,
    sourceType: z.enum(Object.keys(KNOWLEDGE_SOURCE_TYPES) as [keyof typeof KNOWLEDGE_SOURCE_TYPES, ...Array<keyof typeof KNOWLEDGE_SOURCE_TYPES>]),
    module: z.enum(Object.keys(KNOWLEDGE_MODULES) as [keyof typeof KNOWLEDGE_MODULES, ...Array<keyof typeof KNOWLEDGE_MODULES>]),
    jurisdiction: optionalText,
    effectiveDate: optionalDate,
    expiryDate: optionalDate,
    status: z.enum(["discovered", "imported", "pending_review"]).optional(),
    confidence: z.enum(
      Object.keys(KNOWLEDGE_CONFIDENCE_LEVELS) as [
        keyof typeof KNOWLEDGE_CONFIDENCE_LEVELS,
        ...Array<keyof typeof KNOWLEDGE_CONFIDENCE_LEVELS>
      ]
    ),
    tags: z.array(z.string().trim().min(1)).optional().default([]),
    summary: optionalText,
    notes: optionalText
  })
  .refine((input) => !input.expiryDate || !input.effectiveDate || input.expiryDate >= input.effectiveDate, {
    message: "Ngày hết hiệu lực phải sau ngày hiệu lực.",
    path: ["expiryDate"]
  });

export const knowledgeReviewSchema = z.object({
  notes: optionalText
});

export const knowledgeCandidateInputSchema = z.object({
  sourceType: z.enum(
    Object.keys(KNOWLEDGE_CANDIDATE_SOURCE_TYPES) as [
      keyof typeof KNOWLEDGE_CANDIDATE_SOURCE_TYPES,
      ...Array<keyof typeof KNOWLEDGE_CANDIDATE_SOURCE_TYPES>
    ]
  ),
  sourceRefId: optionalText,
  module: z.enum(Object.keys(KNOWLEDGE_MODULES) as [keyof typeof KNOWLEDGE_MODULES, ...Array<keyof typeof KNOWLEDGE_MODULES>]),
  title: z.string().trim().min(2, "Tiêu đề Knowledge Candidate là bắt buộc."),
  extractedText: z.string().trim().min(5, "Nội dung trải nghiệm/nguồn cần tối thiểu 5 ký tự."),
  notes: optionalText
});

export const knowledgeCandidateReviewSchema = z.object({
  notes: optionalText
});

export const knowledgeDiscoveryTopicInputSchema = z.object({
  module: z.enum(Object.keys(KNOWLEDGE_MODULES) as [keyof typeof KNOWLEDGE_MODULES, ...Array<keyof typeof KNOWLEDGE_MODULES>]),
  query: z.string().trim().min(3, "Tu khoa discovery toi thieu 3 ky tu."),
  enabled: z.boolean().optional().default(true),
  frequency: z
    .enum(
      Object.keys(KNOWLEDGE_DISCOVERY_FREQUENCIES) as [
        keyof typeof KNOWLEDGE_DISCOVERY_FREQUENCIES,
        ...Array<keyof typeof KNOWLEDGE_DISCOVERY_FREQUENCIES>
      ]
    )
    .optional()
    .default("manual"),
  ownerId: optionalText,
  reviewerId: optionalText,
  maxRetries: z.coerce.number().int().min(0).max(10).optional().default(3)
});
