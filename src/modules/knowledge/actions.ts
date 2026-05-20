"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { assertCan, can } from "@/lib/permissions/can";
import {
  approveKnowledgeItem,
  createKnowledgeItem,
  getKnowledgeItem,
  markKnowledgeItemExpired,
  markKnowledgeItemSuperseded,
  rejectKnowledgeItem,
  submitKnowledgeItemForReview
} from "@/modules/knowledge/services/knowledge-service";
import {
  approveKnowledgeCandidateIntoKnowledgeItem,
  createKnowledgeCandidate,
  getKnowledgeCandidate,
  rejectKnowledgeCandidate,
  submitKnowledgeCandidateForReview
} from "@/modules/knowledge/services/knowledge-candidate-service";
import { deleteKnowledgeItemIndex, indexKnowledgeItem } from "@/modules/knowledge/services/knowledge-indexing-service";
import { importExternalSourceCandidate } from "@/modules/knowledge/services/knowledge-intake-service";
import {
  createKnowledgeDiscoveryTopic,
  runKnowledgeDiscoveryTopicNow,
  updateKnowledgeDiscoveryTopic
} from "@/modules/knowledge/services/knowledge-discovery-service";
import type {
  ExternalSourceCandidate,
  KnowledgeDiscoveryTopicInput,
  KnowledgeCandidateInput,
  KnowledgeCandidateReviewInput,
  KnowledgeItemInput,
  KnowledgeReviewInput
} from "@/modules/knowledge/types";
import { createAuditLog } from "@/modules/users/services/user-service";

function readOptionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  return value.length > 0 ? value : undefined;
}

function readTags(formData: FormData) {
  return String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formDataToKnowledgeInput(formData: FormData): KnowledgeItemInput {
  return {
    title: String(formData.get("title") ?? ""),
    sourceUrl: readOptionalString(formData, "sourceUrl"),
    sourceFileId: readOptionalString(formData, "sourceFileId"),
    sourceType: String(formData.get("sourceType") ?? "internal_note") as KnowledgeItemInput["sourceType"],
    module: String(formData.get("module") ?? "general") as KnowledgeItemInput["module"],
    jurisdiction: readOptionalString(formData, "jurisdiction"),
    effectiveDate: readOptionalString(formData, "effectiveDate"),
    expiryDate: readOptionalString(formData, "expiryDate"),
    status: String(formData.get("status") ?? "imported") as KnowledgeItemInput["status"],
    confidence: String(formData.get("confidence") ?? "unknown") as KnowledgeItemInput["confidence"],
    tags: readTags(formData),
    summary: readOptionalString(formData, "summary"),
    notes: readOptionalString(formData, "notes")
  };
}

function formDataToReviewInput(formData: FormData): KnowledgeReviewInput {
  return {
    notes: readOptionalString(formData, "notes")
  };
}

function formDataToCandidateReviewInput(formData: FormData): KnowledgeCandidateReviewInput {
  return {
    notes: readOptionalString(formData, "notes")
  };
}

function formDataToKnowledgeCandidateInput(formData: FormData): KnowledgeCandidateInput {
  return {
    sourceType: String(formData.get("sourceType") ?? "manual") as KnowledgeCandidateInput["sourceType"],
    sourceRefId: readOptionalString(formData, "sourceRefId"),
    module: String(formData.get("module") ?? "general") as KnowledgeCandidateInput["module"],
    title: String(formData.get("title") ?? ""),
    extractedText: String(formData.get("extractedText") ?? ""),
    notes: readOptionalString(formData, "notes")
  };
}

function formDataToExternalSourceCandidate(formData: FormData): ExternalSourceCandidate {
  return {
    id: String(formData.get("candidateId") ?? ""),
    title: String(formData.get("title") ?? ""),
    url: String(formData.get("url") ?? ""),
    provider: String(formData.get("provider") ?? "mock_web"),
    publishedAt: readOptionalString(formData, "publishedAt"),
    retrievedAt: String(formData.get("retrievedAt") ?? new Date().toISOString()),
    snippet: String(formData.get("snippet") ?? ""),
    sourceType: String(formData.get("sourceType") ?? "internal_note") as ExternalSourceCandidate["sourceType"],
    confidence: String(formData.get("confidence") ?? "unknown") as ExternalSourceCandidate["confidence"],
    module: String(formData.get("module") ?? "general") as ExternalSourceCandidate["module"],
    tags: readTags(formData)
  };
}

function formDataToDiscoveryTopicInput(formData: FormData): KnowledgeDiscoveryTopicInput {
  return {
    module: String(formData.get("module") ?? "general") as KnowledgeDiscoveryTopicInput["module"],
    query: String(formData.get("query") ?? ""),
    enabled: formData.get("enabled") === "on" || formData.get("enabled") === "true",
    frequency: String(formData.get("frequency") ?? "manual") as KnowledgeDiscoveryTopicInput["frequency"],
    ownerId: readOptionalString(formData, "ownerId"),
    reviewerId: readOptionalString(formData, "reviewerId"),
    maxRetries: Number(formData.get("maxRetries") ?? 3)
  };
}

export async function createKnowledgeItemAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "knowledge.create");
  const item = await createKnowledgeItem(formDataToKnowledgeInput(formData), currentUser.id);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "knowledge_item",
    entityId: item.id,
    action: "knowledge.create",
    newValue: { title: item.title, module: item.module, sourceType: item.sourceType, status: item.status }
  });

  revalidatePath("/knowledge");
  redirect(`/knowledge/${item.id}`);
}

export async function submitKnowledgeItemForReviewAction(itemId: string) {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "knowledge.create");
  const existingItem = await getKnowledgeItem(itemId);
  const item = await submitKnowledgeItemForReview(itemId);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "knowledge_item",
    entityId: item.id,
    action: "knowledge.submit_for_review",
    oldValue: { status: existingItem?.status },
    newValue: { status: item.status }
  });

  revalidatePath("/knowledge");
  revalidatePath(`/knowledge/${item.id}`);
  redirect(`/knowledge/${item.id}`);
}

export async function approveKnowledgeItemAction(itemId: string, formData: FormData) {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "knowledge.approve");
  const existingItem = await getKnowledgeItem(itemId);
  const item = await approveKnowledgeItem(itemId, currentUser.id, formDataToReviewInput(formData));
  const chunks = await indexKnowledgeItem(item.id);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "knowledge_item",
    entityId: item.id,
    action: "knowledge.approve",
    oldValue: { status: existingItem?.status, isRagEligible: existingItem?.isRagEligible },
    newValue: { status: item.status, isRagEligible: item.isRagEligible, chunkCount: chunks.length }
  });

  revalidatePath("/knowledge");
  revalidatePath(`/knowledge/${item.id}`);
  redirect(`/knowledge/${item.id}`);
}

export async function rejectKnowledgeItemAction(itemId: string, formData: FormData) {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "knowledge.approve");
  const existingItem = await getKnowledgeItem(itemId);
  const item = await rejectKnowledgeItem(itemId, currentUser.id, formDataToReviewInput(formData));
  await deleteKnowledgeItemIndex(item.id);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "knowledge_item",
    entityId: item.id,
    action: "knowledge.reject",
    oldValue: { status: existingItem?.status, isRagEligible: existingItem?.isRagEligible },
    newValue: { status: item.status, isRagEligible: item.isRagEligible, notes: item.notes }
  });

  revalidatePath("/knowledge");
  revalidatePath(`/knowledge/${item.id}`);
  redirect(`/knowledge/${item.id}`);
}

export async function markKnowledgeItemExpiredAction(itemId: string, formData: FormData) {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "knowledge.review");
  const existingItem = await getKnowledgeItem(itemId);
  const item = await markKnowledgeItemExpired(itemId, currentUser.id, formDataToReviewInput(formData));
  await deleteKnowledgeItemIndex(item.id);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "knowledge_item",
    entityId: item.id,
    action: "knowledge.expire",
    oldValue: { status: existingItem?.status, isRagEligible: existingItem?.isRagEligible },
    newValue: { status: item.status, isRagEligible: item.isRagEligible }
  });

  revalidatePath("/knowledge");
  revalidatePath(`/knowledge/${item.id}`);
  redirect(`/knowledge/${item.id}`);
}

export async function markKnowledgeItemSupersededAction(itemId: string, formData: FormData) {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "knowledge.review");
  const existingItem = await getKnowledgeItem(itemId);
  const item = await markKnowledgeItemSuperseded(itemId, currentUser.id, formDataToReviewInput(formData));
  await deleteKnowledgeItemIndex(item.id);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "knowledge_item",
    entityId: item.id,
    action: "knowledge.supersede",
    oldValue: { status: existingItem?.status, isRagEligible: existingItem?.isRagEligible },
    newValue: { status: item.status, isRagEligible: item.isRagEligible }
  });

  revalidatePath("/knowledge");
  revalidatePath(`/knowledge/${item.id}`);
  redirect(`/knowledge/${item.id}`);
}

export async function reindexKnowledgeItemAction(itemId: string) {
  const currentUser = await getCurrentUser();

  if (!can(currentUser, "knowledge.review") && !can(currentUser, "knowledge.approve")) {
    throw new Error("Bạn không có quyền reindex nguồn tri thức.");
  }

  const existingItem = await getKnowledgeItem(itemId);
  const chunks = await indexKnowledgeItem(itemId);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "knowledge_item",
    entityId: itemId,
    action: "knowledge.reindex",
    oldValue: { status: existingItem?.status, isRagEligible: existingItem?.isRagEligible },
    newValue: { chunkCount: chunks.length }
  });

  revalidatePath("/knowledge");
  revalidatePath(`/knowledge/${itemId}`);
}

export async function importExternalSourceCandidateAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const candidate = await importExternalSourceCandidate({
    user: currentUser,
    candidate: formDataToExternalSourceCandidate(formData)
  });

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "knowledge_candidate",
    entityId: candidate.id,
    action: "knowledge_candidate.external_import",
    newValue: { title: candidate.title, sourceRefId: candidate.sourceRefId, status: candidate.status, sourceType: candidate.sourceType }
  });

  revalidatePath("/knowledge");
  revalidatePath("/knowledge/candidates");
  revalidatePath("/knowledge/intake");
  redirect(`/knowledge/candidates/${candidate.id}`);
}

export async function createKnowledgeCandidateAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const candidate = await createKnowledgeCandidate(formDataToKnowledgeCandidateInput(formData), currentUser);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "knowledge_candidate",
    entityId: candidate.id,
    action: "knowledge_candidate.create",
    newValue: { title: candidate.title, module: candidate.module, sourceType: candidate.sourceType, status: candidate.status }
  });

  revalidatePath("/knowledge/candidates");
  redirect(`/knowledge/candidates/${candidate.id}`);
}

export async function submitKnowledgeCandidateForReviewAction(candidateId: string) {
  const currentUser = await getCurrentUser();
  const existingCandidate = await getKnowledgeCandidate(candidateId);
  const candidate = await submitKnowledgeCandidateForReview(candidateId, currentUser);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "knowledge_candidate",
    entityId: candidate.id,
    action: "knowledge_candidate.submit_for_review",
    oldValue: { status: existingCandidate?.status },
    newValue: { status: candidate.status }
  });

  revalidatePath("/knowledge/candidates");
  revalidatePath(`/knowledge/candidates/${candidate.id}`);
  redirect(`/knowledge/candidates/${candidate.id}`);
}

export async function approveKnowledgeCandidateAction(candidateId: string, formData: FormData) {
  const currentUser = await getCurrentUser();
  const existingCandidate = await getKnowledgeCandidate(candidateId);
  const { candidate, item } = await approveKnowledgeCandidateIntoKnowledgeItem(candidateId, currentUser, formDataToCandidateReviewInput(formData));

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "knowledge_candidate",
    entityId: candidate.id,
    action: "knowledge_candidate.approve",
    oldValue: { status: existingCandidate?.status },
    newValue: { status: candidate.status, promotedKnowledgeItemId: item.id, itemStatus: item.status, isRagEligible: item.isRagEligible }
  });

  revalidatePath("/knowledge/candidates");
  revalidatePath(`/knowledge/candidates/${candidate.id}`);
  revalidatePath("/knowledge");
  redirect(`/knowledge/${item.id}`);
}

export async function rejectKnowledgeCandidateAction(candidateId: string, formData: FormData) {
  const currentUser = await getCurrentUser();
  const existingCandidate = await getKnowledgeCandidate(candidateId);
  const candidate = await rejectKnowledgeCandidate(candidateId, currentUser, formDataToCandidateReviewInput(formData));

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "knowledge_candidate",
    entityId: candidate.id,
    action: "knowledge_candidate.reject",
    oldValue: { status: existingCandidate?.status },
    newValue: { status: candidate.status, notes: candidate.notes }
  });

  revalidatePath("/knowledge/candidates");
  revalidatePath(`/knowledge/candidates/${candidate.id}`);
  redirect(`/knowledge/candidates/${candidate.id}`);
}

export async function createKnowledgeDiscoveryTopicAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const topic = await createKnowledgeDiscoveryTopic(formDataToDiscoveryTopicInput(formData), currentUser);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "knowledge_discovery_topic",
    entityId: topic.id,
    action: "knowledge_discovery.create",
    newValue: { query: topic.query, module: topic.module, enabled: topic.enabled, frequency: topic.frequency }
  });

  revalidatePath("/knowledge/discovery");
  redirect("/knowledge/discovery");
}

export async function updateKnowledgeDiscoveryTopicAction(topicId: string, formData: FormData) {
  const currentUser = await getCurrentUser();
  const topic = await updateKnowledgeDiscoveryTopic(topicId, formDataToDiscoveryTopicInput(formData), currentUser);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "knowledge_discovery_topic",
    entityId: topic.id,
    action: "knowledge_discovery.update",
    newValue: { query: topic.query, module: topic.module, enabled: topic.enabled, frequency: topic.frequency }
  });

  revalidatePath("/knowledge/discovery");
  redirect("/knowledge/discovery");
}

export async function runKnowledgeDiscoveryTopicNowAction(topicId: string) {
  const currentUser = await getCurrentUser();
  const result = await runKnowledgeDiscoveryTopicNow(topicId, currentUser);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "knowledge_discovery_topic",
    entityId: topicId,
    action: "knowledge_discovery.run_now",
    newValue: {
      status: result.runLog.status,
      resultCount: result.runLog.resultCount,
      importedCount: result.runLog.importedCount,
      skippedDuplicateCount: result.runLog.skippedDuplicateCount,
      skippedDisallowedCount: result.runLog.skippedDisallowedCount
    }
  });

  revalidatePath("/knowledge/discovery");
  revalidatePath("/knowledge/candidates");
  redirect("/knowledge/discovery");
}
