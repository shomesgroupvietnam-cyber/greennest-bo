import { can, type PermissionUser } from "@/lib/permissions/can";
import type {
  KnowledgeCandidate,
  KnowledgeCandidateInput,
  KnowledgeCandidateListFilters,
  KnowledgeCandidateReviewInput,
  KnowledgeItem
} from "@/modules/knowledge/types";
import {
  knowledgeCandidateInputSchema,
  knowledgeCandidateReviewSchema
} from "@/modules/knowledge/validation";

import {
  knowledgeCandidateRepository,
  type KnowledgeCandidateRepository
} from "./knowledge-candidate-repository";
import { knowledgeRepository, type KnowledgeRepository } from "./knowledge-repository";
import { createKnowledgeItem } from "./knowledge-service";

function createId() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

function assertCandidateExists(candidate: KnowledgeCandidate | undefined) {
  if (!candidate) {
    throw new Error("Không tìm thấy Knowledge Candidate.");
  }

  return candidate;
}

function assertCanCreateCandidate(user: PermissionUser) {
  if (!can(user, "knowledge.create_candidate")) {
    throw new Error("Bạn không có quyền tạo Knowledge Candidate.");
  }
}

function assertCanPromoteCandidate(user: PermissionUser) {
  if (!can(user, "knowledge.promote")) {
    throw new Error("Bạn không có quyền promote Knowledge Candidate.");
  }
}

function assertCanReviewCandidate(user: PermissionUser) {
  if (!can(user, "knowledge.review")) {
    throw new Error("Bạn không có quyền review Knowledge Candidate.");
  }
}

function assertCanApproveCandidate(user: PermissionUser) {
  if (!can(user, "knowledge.approve")) {
    throw new Error("Bạn không có quyền duyệt Knowledge Candidate.");
  }
}

export async function listKnowledgeCandidates(
  filters: KnowledgeCandidateListFilters = {},
  repository: KnowledgeCandidateRepository = knowledgeCandidateRepository
) {
  return repository.listKnowledgeCandidates(filters);
}

export async function getKnowledgeCandidate(
  candidateId: string,
  repository: KnowledgeCandidateRepository = knowledgeCandidateRepository
) {
  return repository.getKnowledgeCandidate(candidateId);
}

export async function createKnowledgeCandidate(
  input: KnowledgeCandidateInput,
  user: PermissionUser,
  repository: KnowledgeCandidateRepository = knowledgeCandidateRepository
) {
  assertCanCreateCandidate(user);
  const parsedInput = knowledgeCandidateInputSchema.parse(input);
  const timestamp = now();
  const candidate: KnowledgeCandidate = {
    id: createId(),
    sourceType: parsedInput.sourceType,
    sourceRefId: parsedInput.sourceRefId,
    module: parsedInput.module,
    title: parsedInput.title,
    extractedText: parsedInput.extractedText,
    submittedBy: user.id,
    status: "candidate",
    notes: parsedInput.notes,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  return repository.createKnowledgeCandidate(candidate);
}

export async function createKnowledgeCandidateFromSourceReference(
  input: KnowledgeCandidateInput,
  user: PermissionUser,
  repository: KnowledgeCandidateRepository = knowledgeCandidateRepository
) {
  return createKnowledgeCandidate(input, user, repository);
}

export async function submitKnowledgeCandidateForReview(
  candidateId: string,
  user: PermissionUser,
  repository: KnowledgeCandidateRepository = knowledgeCandidateRepository
) {
  assertCanPromoteCandidate(user);
  const candidate = assertCandidateExists(await repository.getKnowledgeCandidate(candidateId));

  if (candidate.status !== "candidate") {
    throw new Error("Chỉ candidate mới có thể gửi review.");
  }

  return repository.updateKnowledgeCandidate(candidateId, {
    status: "pending_review",
    updatedAt: now()
  });
}

export async function approveKnowledgeCandidateIntoKnowledgeItem(
  candidateId: string,
  user: PermissionUser,
  input: KnowledgeCandidateReviewInput = {},
  candidateRepository: KnowledgeCandidateRepository = knowledgeCandidateRepository,
  itemRepository: KnowledgeRepository = knowledgeRepository
): Promise<{ candidate: KnowledgeCandidate; item: KnowledgeItem }> {
  assertCanApproveCandidate(user);
  const parsedInput = knowledgeCandidateReviewSchema.parse(input);
  const candidate = assertCandidateExists(await candidateRepository.getKnowledgeCandidate(candidateId));

  if (candidate.status !== "pending_review") {
    throw new Error("Chỉ candidate đang chờ review mới có thể promote vào Knowledge Center.");
  }

  const item = await createKnowledgeItem(
    {
      title: candidate.title,
      sourceFileId: candidate.sourceRefId,
      sourceType: candidate.sourceType === "web_search" ? "market" : "internal_note",
      module: candidate.module,
      status: "pending_review",
      confidence: candidate.sourceType === "manual" ? "internal_approved" : "unknown",
      tags: ["knowledge-candidate", candidate.sourceType],
      summary: candidate.extractedText,
      notes: [
        `Promoted from Knowledge Candidate ${candidate.id}.`,
        candidate.sourceRefId ? `Source ref: ${candidate.sourceRefId}.` : undefined,
        parsedInput.notes ?? candidate.notes
      ]
        .filter(Boolean)
        .join("\n")
    },
    user.id,
    itemRepository
  );
  const timestamp = now();
  const updatedCandidate = await candidateRepository.updateKnowledgeCandidate(candidateId, {
    status: "approved",
    promotedKnowledgeItemId: item.id,
    reviewedBy: user.id,
    reviewedAt: timestamp,
    notes: parsedInput.notes ?? candidate.notes,
    updatedAt: timestamp
  });

  return { candidate: updatedCandidate, item };
}

export async function rejectKnowledgeCandidate(
  candidateId: string,
  user: PermissionUser,
  input: KnowledgeCandidateReviewInput = {},
  repository: KnowledgeCandidateRepository = knowledgeCandidateRepository
) {
  assertCanReviewCandidate(user);
  const parsedInput = knowledgeCandidateReviewSchema.parse(input);
  const candidate = assertCandidateExists(await repository.getKnowledgeCandidate(candidateId));

  if (candidate.status !== "candidate" && candidate.status !== "pending_review") {
    throw new Error("Candidate này không còn ở trạng thái có thể từ chối.");
  }

  const timestamp = now();

  return repository.updateKnowledgeCandidate(candidateId, {
    status: "rejected",
    reviewedBy: user.id,
    reviewedAt: timestamp,
    notes: parsedInput.notes ?? candidate.notes,
    updatedAt: timestamp
  });
}

export function isKnowledgeCandidateRagEligible(candidate: KnowledgeCandidate) {
  void candidate;
  return false;
}
