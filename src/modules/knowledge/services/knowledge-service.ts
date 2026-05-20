import type { KnowledgeItem, KnowledgeItemInput, KnowledgeListFilters, KnowledgeReviewInput } from "@/modules/knowledge/types";
import { knowledgeItemInputSchema, knowledgeReviewSchema } from "@/modules/knowledge/validation";

import { knowledgeRepository, type KnowledgeRepository } from "./knowledge-repository";

function createId() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

function assertExists(item: KnowledgeItem | undefined) {
  if (!item) {
    throw new Error("Không tìm thấy nguồn tri thức.");
  }

  return item;
}

function assertReviewable(item: KnowledgeItem) {
  if (item.status === "approved" || item.status === "expired" || item.status === "superseded") {
    throw new Error("Nguồn tri thức này không còn ở trạng thái có thể gửi review.");
  }
}

export async function listKnowledgeItems(filters: KnowledgeListFilters = {}, repository: KnowledgeRepository = knowledgeRepository) {
  return repository.listKnowledgeItems(filters);
}

export async function getKnowledgeItem(itemId: string, repository: KnowledgeRepository = knowledgeRepository) {
  return repository.getKnowledgeItem(itemId);
}

export async function createKnowledgeItem(
  input: KnowledgeItemInput,
  createdBy: string,
  repository: KnowledgeRepository = knowledgeRepository
) {
  const parsedInput = knowledgeItemInputSchema.parse(input);
  const timestamp = now();
  const status = parsedInput.status ?? "imported";
  const item: KnowledgeItem = {
    id: createId(),
    title: parsedInput.title,
    sourceUrl: parsedInput.sourceUrl,
    sourceFileId: parsedInput.sourceFileId,
    sourceType: parsedInput.sourceType,
    module: parsedInput.module,
    jurisdiction: parsedInput.jurisdiction,
    effectiveDate: parsedInput.effectiveDate,
    expiryDate: parsedInput.expiryDate,
    status,
    confidence: parsedInput.confidence,
    tags: parsedInput.tags,
    summary: parsedInput.summary,
    notes: parsedInput.notes,
    createdBy,
    isRagEligible: false,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  return repository.createKnowledgeItem(item);
}

export async function submitKnowledgeItemForReview(itemId: string, repository: KnowledgeRepository = knowledgeRepository) {
  const existingItem = assertExists(await repository.getKnowledgeItem(itemId));
  assertReviewable(existingItem);

  return repository.updateKnowledgeItem(itemId, {
    status: "pending_review",
    reviewedBy: undefined,
    approvedBy: undefined,
    reviewedAt: undefined,
    approvedAt: undefined,
    isRagEligible: false,
    updatedAt: now()
  });
}

export async function approveKnowledgeItem(
  itemId: string,
  approvedBy: string,
  input: KnowledgeReviewInput = {},
  repository: KnowledgeRepository = knowledgeRepository
) {
  const parsedInput = knowledgeReviewSchema.parse(input);
  const existingItem = assertExists(await repository.getKnowledgeItem(itemId));

  if (existingItem.status !== "pending_review") {
    throw new Error("Chỉ nguồn đang chờ review mới có thể được duyệt.");
  }

  const timestamp = now();

  return repository.updateKnowledgeItem(itemId, {
    status: "approved",
    notes: parsedInput.notes ?? existingItem.notes,
    reviewedBy: approvedBy,
    approvedBy,
    reviewedAt: timestamp,
    approvedAt: timestamp,
    isRagEligible: true,
    updatedAt: timestamp
  });
}

export async function rejectKnowledgeItem(
  itemId: string,
  reviewedBy: string,
  input: KnowledgeReviewInput = {},
  repository: KnowledgeRepository = knowledgeRepository
) {
  const parsedInput = knowledgeReviewSchema.parse(input);
  const existingItem = assertExists(await repository.getKnowledgeItem(itemId));

  if (existingItem.status !== "pending_review") {
    throw new Error("Chỉ nguồn đang chờ review mới có thể bị từ chối.");
  }

  const timestamp = now();

  return repository.updateKnowledgeItem(itemId, {
    status: "rejected",
    notes: parsedInput.notes ?? existingItem.notes,
    reviewedBy,
    approvedBy: undefined,
    reviewedAt: timestamp,
    approvedAt: undefined,
    isRagEligible: false,
    updatedAt: timestamp
  });
}

export async function markKnowledgeItemExpired(
  itemId: string,
  reviewedBy: string,
  input: KnowledgeReviewInput = {},
  repository: KnowledgeRepository = knowledgeRepository
) {
  const parsedInput = knowledgeReviewSchema.parse(input);
  const existingItem = assertExists(await repository.getKnowledgeItem(itemId));
  const timestamp = now();

  return repository.updateKnowledgeItem(itemId, {
    status: "expired",
    notes: parsedInput.notes ?? existingItem.notes,
    reviewedBy,
    reviewedAt: timestamp,
    isRagEligible: false,
    updatedAt: timestamp
  });
}

export async function markKnowledgeItemSuperseded(
  itemId: string,
  reviewedBy: string,
  input: KnowledgeReviewInput = {},
  repository: KnowledgeRepository = knowledgeRepository
) {
  const parsedInput = knowledgeReviewSchema.parse(input);
  const existingItem = assertExists(await repository.getKnowledgeItem(itemId));
  const timestamp = now();

  return repository.updateKnowledgeItem(itemId, {
    status: "superseded",
    notes: parsedInput.notes ?? existingItem.notes,
    reviewedBy,
    reviewedAt: timestamp,
    isRagEligible: false,
    updatedAt: timestamp
  });
}
