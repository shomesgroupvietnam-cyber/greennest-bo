import { randomUUID } from "node:crypto";

import type { PermissionUser } from "@/lib/permissions/can";
import { assertCan, can } from "@/lib/permissions/can";
import type { Proposal, ProposalDecision, ProposalInput, ProposalLink, ProposalStep } from "@/modules/proposals/types";
import { proposalInputSchema } from "@/modules/proposals/validation";

import { proposalRepository, type ProposalRepository } from "./proposal-repository";

function now() {
  return new Date().toISOString();
}

function createCode(type: string) {
  return `DX-${type.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

function inferModule(type: ProposalInput["type"], module?: string) {
  return module || type;
}

function assertProposalReadable(user: PermissionUser) {
  assertCan(user, "proposal.view");
}

function assertDomainCreatePermission(user: PermissionUser, type: ProposalInput["type"]) {
  if (type === "finance" && !can(user, "finance.view")) {
    throw new Error("Bạn không có quyền tạo đề xuất tài chính.");
  }

  if (type === "contract" && !can(user, "contract.view")) {
    throw new Error("Bạn không có quyền tạo đề xuất hợp đồng.");
  }

  if (type === "investment" && !can(user, "investment.view")) {
    throw new Error("Bạn không có quyền tạo đề xuất đầu tư.");
  }
}

export async function listProposals(filters = {}, user: PermissionUser, repository: ProposalRepository = proposalRepository) {
  assertProposalReadable(user);

  return repository.listProposals(filters);
}

export async function getProposalDetail(proposalId: string, user: PermissionUser, repository: ProposalRepository = proposalRepository) {
  assertProposalReadable(user);

  return repository.getProposalDetail(proposalId);
}

export async function createProposal(input: ProposalInput, user: PermissionUser, repository: ProposalRepository = proposalRepository) {
  assertCan(user, "proposal.create");
  assertDomainCreatePermission(user, input.type);
  const parsed = proposalInputSchema.parse(input);
  const timestamp = now();
  const proposal: Proposal = {
    id: randomUUID(),
    code: createCode(parsed.type),
    title: parsed.title,
    type: parsed.type,
    projectId: parsed.projectId,
    module: inferModule(parsed.type, parsed.module),
    requestedBy: user.id,
    ownerId: parsed.ownerId,
    status: "draft",
    priority: parsed.priority,
    amount: parsed.amount,
    dueDate: parsed.dueDate,
    summary: parsed.summary,
    aiReviewStatus: "not_checked",
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const links: ProposalLink[] = (input.links ?? []).map((link) => ({
    id: randomUUID(),
    proposalId: proposal.id,
    entityType: link.entityType,
    entityId: link.entityId,
    relationType: link.relationType,
    createdAt: timestamp
  }));

  return repository.createProposal(proposal, links);
}

export async function submitProposal(proposalId: string, user: PermissionUser, repository: ProposalRepository = proposalRepository) {
  assertCan(user, "proposal.create");
  const detail = await repository.getProposalDetail(proposalId);

  if (!detail) {
    throw new Error("Không tìm thấy đề xuất.");
  }

  if (!["draft", "change_requested"].includes(detail.proposal.status)) {
    throw new Error("Chỉ đề xuất nháp hoặc cần chỉnh sửa mới được trình duyệt.");
  }

  const timestamp = now();
  const step: ProposalStep = {
    id: randomUUID(),
    proposalId,
    stepOrder: detail.steps.length + 1,
    approverRole: "quan_ly_du_an",
    status: "in_review",
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await repository.addStep(step);
  await repository.addDecision(createDecision(proposalId, "submitted", user.id, "Trình duyệt đề xuất."));

  return repository.updateProposal(proposalId, {
    status: "in_review",
    currentStepId: step.id,
    updatedAt: timestamp
  });
}

export async function requestProposalChange(
  proposalId: string,
  user: PermissionUser,
  notes?: string,
  repository: ProposalRepository = proposalRepository
) {
  if (!can(user, "proposal.request_change") && !can(user, "proposal.review")) {
    throw new Error("Bạn không có quyền yêu cầu chỉnh sửa đề xuất.");
  }

  const detail = await repository.getProposalDetail(proposalId);

  if (!detail) {
    throw new Error("Không tìm thấy đề xuất.");
  }

  const timestamp = now();
  const step = detail.proposal.currentStepId ? detail.steps.find((item) => item.id === detail.proposal.currentStepId) : undefined;

  if (step) {
    await repository.updateStep(step.id, {
      status: "change_requested",
      decidedBy: user.id,
      decidedAt: timestamp,
      decisionNotes: notes,
      updatedAt: timestamp
    });
  }

  await repository.addDecision(createDecision(proposalId, "change_requested", user.id, notes));

  return repository.updateProposal(proposalId, {
    status: "change_requested",
    updatedAt: timestamp
  });
}

export async function approveProposal(proposalId: string, user: PermissionUser, notes?: string, repository: ProposalRepository = proposalRepository) {
  assertCan(user, "proposal.approve");
  const detail = await repository.getProposalDetail(proposalId);

  if (!detail) {
    throw new Error("Không tìm thấy đề xuất.");
  }

  const timestamp = now();
  const step = detail.proposal.currentStepId ? detail.steps.find((item) => item.id === detail.proposal.currentStepId) : undefined;

  if (step) {
    await repository.updateStep(step.id, {
      status: "approved",
      decidedBy: user.id,
      decidedAt: timestamp,
      decisionNotes: notes,
      updatedAt: timestamp
    });
  }

  await repository.addDecision(createDecision(proposalId, "approved", user.id, notes));

  return repository.updateProposal(proposalId, {
    status: "approved",
    updatedAt: timestamp
  });
}

export async function rejectProposal(proposalId: string, user: PermissionUser, notes?: string, repository: ProposalRepository = proposalRepository) {
  if (!can(user, "proposal.reject") && !can(user, "proposal.approve")) {
    throw new Error("Bạn không có quyền từ chối đề xuất.");
  }

  const detail = await repository.getProposalDetail(proposalId);

  if (!detail) {
    throw new Error("Không tìm thấy đề xuất.");
  }

  const timestamp = now();
  const step = detail.proposal.currentStepId ? detail.steps.find((item) => item.id === detail.proposal.currentStepId) : undefined;

  if (step) {
    await repository.updateStep(step.id, {
      status: "rejected",
      decidedBy: user.id,
      decidedAt: timestamp,
      decisionNotes: notes,
      updatedAt: timestamp
    });
  }

  await repository.addDecision(createDecision(proposalId, "rejected", user.id, notes));

  return repository.updateProposal(proposalId, {
    status: "rejected",
    updatedAt: timestamp
  });
}

function createDecision(proposalId: string, decision: ProposalDecision["decision"], decidedBy: string, notes?: string): ProposalDecision {
  return {
    id: randomUUID(),
    proposalId,
    decision,
    decidedBy,
    decidedAt: now(),
    notes
  };
}
