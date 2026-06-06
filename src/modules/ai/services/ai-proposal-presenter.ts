import type { PermissionAction } from "@/lib/permissions/can";
import type { Project } from "@/modules/projects/types";

import type { AiActionProposal, AiActionProposalKey, AiActionProposalStatus } from "../types";

export const AI_ACTION_PROPOSAL_LABELS: Record<AiActionProposalKey, string> = {
  create_task: "Tạo công việc",
  request_document_update: "Yêu cầu cập nhật hồ sơ",
  update_legal_note: "Cập nhật ghi chú pháp lý",
  create_legal_followup_task: "Tạo việc follow-up pháp lý",
  create_meeting_action_item: "Tạo action item cuộc họp",
  create_risk_record: "De xuat risk/blocker",
  approval_request_change: "Tra lai approval",
  approval_ask_meeting: "Yeu cau hop approval",
};

export const AI_ACTION_PROPOSAL_STATUS_LABELS: Record<AiActionProposalStatus, string> = {
  proposed: "Đang chờ duyệt",
  accepted: "Đã chấp nhận và thực thi",
  rejected: "Đã từ chối",
  expired: "Đã hết hạn",
  executed: "Đã thực thi",
  failed: "Thực thi thất bại",
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

export function buildAiProposalDisplaySummary(
  proposal: AiActionProposal,
  project?: Project,
): AiProposalDisplaySummary {
  return {
    actionLabel: getAiActionProposalLabel(proposal.actionKey),
    statusLabel: getAiActionProposalStatusLabel(proposal.status),
    projectLabel: formatAiProjectLabel(project, proposal.projectId),
    responsibleLabel: getResponsibleLabel(proposal),
    contentItems: getContentItems(proposal),
    requiredPermission: proposal.requiredPermission,
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
    actionKey === "create_meeting_action_item" ||
    actionKey === "create_risk_record" ||
    actionKey === "approval_request_change" ||
    actionKey === "approval_ask_meeting"
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
  const normalizedKey = normalizeAiActionProposalKey(proposal.actionKey);

  if (normalizedKey === "create_risk_record") {
    return getRiskContentItems(proposal);
  }

  if (normalizedKey === "approval_request_change" || normalizedKey === "approval_ask_meeting") {
    return getApprovalContentItems(proposal);
  }

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
    dueDate ? `Hạn xử lý: ${dueDate}` : undefined,
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

function getApprovalContentItems(proposal: AiActionProposal) {
  const proposalId = readString(proposal.proposedPayload.proposalId) ?? proposal.targetEntityId;
  const approvalAction = readString(proposal.proposedPayload.approvalAction);
  const currentStatus = readString(proposal.proposedPayload.currentStatus);
  const nextStatus = readString(proposal.proposedPayload.nextStatus);
  const reason = readString(proposal.proposedPayload.reason);
  const agendaDraft = readString(proposal.proposedPayload.agendaDraft);
  const meetingType = readString(proposal.proposedPayload.meetingType);
  const affectedFields = readStringArray(proposal.proposedPayload.affectedFields);
  const sourceCitationIds = readStringArray(proposal.proposedPayload.sourceCitationIds);

  return [
    proposalId ? `Approval: ${proposalId}` : undefined,
    approvalAction ? `Action: ${approvalAction}` : undefined,
    currentStatus || nextStatus
      ? `Status: ${currentStatus ?? "?"} -> ${nextStatus ?? "?"}`
      : undefined,
    affectedFields.length > 0 ? `Field: ${affectedFields.join(", ")}` : undefined,
    reason ? `Ly do: ${reason}` : undefined,
    meetingType ? `Loai hop: ${meetingType}` : undefined,
    agendaDraft ? `Agenda: ${agendaDraft}` : undefined,
    sourceCitationIds.length > 0 ? `Citation: ${sourceCitationIds.join(", ")}` : undefined,
  ].filter((item): item is string => Boolean(item));
}

function getRiskContentItems(proposal: AiActionProposal) {
  const title = readString(proposal.proposedPayload.title);
  const reason = readString(proposal.proposedPayload.reason);
  const level = readString(proposal.proposedPayload.level);
  const categoryKey = readString(proposal.proposedPayload.categoryKey);
  const deadline = readString(proposal.proposedPayload.deadline);
  const ownerId = readString(proposal.proposedPayload.ownerId);
  const projectId = readString(proposal.proposedPayload.projectId) ?? proposal.projectId;
  const sourceType = readString(proposal.proposedPayload.sourceType);
  const sourceId = readString(proposal.proposedPayload.sourceId) ?? proposal.targetEntityId;
  const nextAction = readString(proposal.proposedPayload.nextAction);

  return [
    title ? `Tieu de: ${title}` : undefined,
    level ? `Muc do: ${level}` : undefined,
    categoryKey ? `Nhom risk: ${categoryKey}` : undefined,
    deadline ? `Deadline: ${deadline}` : undefined,
    ownerId ? `Owner: ${ownerId}` : undefined,
    projectId ? `Du an: ${projectId}` : undefined,
    reason ? `Ly do: ${reason}` : undefined,
    nextAction ? `Hanh dong tiep theo: ${nextAction}` : undefined,
    sourceType || sourceId
      ? `Nguon/citation: ${sourceType ?? "record"} / ${sourceId ?? "chua ro"}`
      : undefined,
  ].filter((item): item is string => Boolean(item));
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}
