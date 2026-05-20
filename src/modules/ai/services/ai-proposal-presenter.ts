import type { PermissionAction } from "@/lib/permissions/can";
import type { Project } from "@/modules/projects/types";

import type { AiActionProposal, AiActionProposalKey, AiActionProposalStatus } from "../types";

export const AI_ACTION_PROPOSAL_LABELS: Record<AiActionProposalKey, string> = {
  create_task: "Tạo công việc",
  request_document_update: "Yêu cầu cập nhật hồ sơ",
  update_legal_note: "Cập nhật ghi chú pháp lý",
  create_legal_followup_task: "Tạo việc follow-up pháp lý",
  create_meeting_action_item: "Tạo action item cuộc họp"
};

export const AI_ACTION_PROPOSAL_STATUS_LABELS: Record<AiActionProposalStatus, string> = {
  proposed: "Đang chờ duyệt",
  accepted: "Đã chấp nhận và thực thi",
  rejected: "Đã từ chối",
  expired: "Đã hết hạn",
  executed: "Đã thực thi",
  failed: "Thực thi thất bại"
};

export function getAiActionProposalLabel(actionKey: string) {
  const normalizedKey = normalizeAiActionProposalKey(actionKey);

  return normalizedKey ? AI_ACTION_PROPOSAL_LABELS[normalizedKey] : "Đề xuất AI";
}

export function getAiActionProposalStatusLabel(status: AiActionProposalStatus) {
  return AI_ACTION_PROPOSAL_STATUS_LABELS[status] ?? status;
}

export function formatAiProjectLabel(project?: Project, projectId?: string) {
  if (project) {
    return `${project.code} - ${project.name}`;
  }

  return projectId ? `Dự án ${projectId}` : "Không gắn dự án cụ thể";
}

export type AiProposalDisplaySummary = {
  actionLabel: string;
  statusLabel: string;
  projectLabel: string;
  responsibleLabel: string;
  contentItems: string[];
  requiredPermission: PermissionAction;
};

export function buildAiProposalDisplaySummary(proposal: AiActionProposal, project?: Project): AiProposalDisplaySummary {
  return {
    actionLabel: getAiActionProposalLabel(proposal.actionKey),
    statusLabel: getAiActionProposalStatusLabel(proposal.status),
    projectLabel: formatAiProjectLabel(project, proposal.projectId),
    responsibleLabel: getResponsibleLabel(proposal),
    contentItems: getContentItems(proposal),
    requiredPermission: proposal.requiredPermission
  };
}

function normalizeAiActionProposalKey(actionKey: string): AiActionProposalKey | undefined {
  if (actionKey === "task.create_from_ai_proposal" || actionKey === "project.note_from_ai_proposal") {
    return "create_task";
  }

  if (
    actionKey === "create_task" ||
    actionKey === "request_document_update" ||
    actionKey === "update_legal_note" ||
    actionKey === "create_legal_followup_task" ||
    actionKey === "create_meeting_action_item"
  ) {
    return actionKey;
  }

  return undefined;
}

function getResponsibleLabel(proposal: AiActionProposal) {
  const assigneeId = readString(proposal.proposedPayload.assigneeId);
  const ownerId = readString(proposal.proposedPayload.ownerId);
  const reviewerId = readString(proposal.proposedPayload.reviewerId);

  return assigneeId ?? ownerId ?? reviewerId ?? "Chưa chỉ định";
}

function getContentItems(proposal: AiActionProposal) {
  const title = readString(proposal.proposedPayload.title);
  const description = readString(proposal.proposedPayload.description);
  const decisionText = readString(proposal.proposedPayload.decisionText);
  const notes = readString(proposal.proposedPayload.notes);
  const dueDate = readString(proposal.proposedPayload.dueDate);
  const documentId = readString(proposal.proposedPayload.documentId) ?? proposal.targetEntityId;
  const legalStepId = readString(proposal.proposedPayload.legalStepId) ?? proposal.targetEntityId;
  const meetingId = readString(proposal.proposedPayload.meetingId) ?? proposal.targetEntityId;
  const contentItems = [
    title ? `Tiêu đề: ${title}` : undefined,
    description ? `Mô tả: ${description}` : undefined,
    decisionText ? `Nội dung action item: ${decisionText}` : undefined,
    notes ? `Ghi chú: ${notes}` : undefined,
    dueDate ? `Hạn xử lý: ${dueDate}` : undefined
  ];

  if (proposal.actionKey === "request_document_update" && documentId) {
    contentItems.unshift(`Hồ sơ cần cập nhật: ${documentId}`);
  }

  if (proposal.actionKey === "update_legal_note" && legalStepId) {
    contentItems.unshift(`Bước pháp lý: ${legalStepId}`);
  }

  if (proposal.actionKey === "create_meeting_action_item" && meetingId) {
    contentItems.unshift(`Cuộc họp: ${meetingId}`);
  }

  return contentItems.filter((item): item is string => Boolean(item));
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
