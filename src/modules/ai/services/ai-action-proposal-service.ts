import { assertCan, type PermissionUser } from "@/lib/permissions/can";
import {
  canReadDocumentInScope,
  canReadLegalStepInScope,
  canReadMeetingInScope,
  canReadProjectInScope,
  resolveAccessScope
} from "@/lib/permissions/access-scope";
import { updateDocument } from "@/modules/documents/services/document-service";
import { documentRepository, type DocumentRepository } from "@/modules/documents/services/document-repository";
import { updateLegalStep } from "@/modules/legal/services/legal-service";
import { legalRepository, type LegalRepository } from "@/modules/legal/services/legal-repository";
import { createDecision } from "@/modules/meetings/services/meeting-service";
import { meetingRepository, type MeetingRepository } from "@/modules/meetings/services/meeting-repository";
import { projectRepository, type ProjectRepository } from "@/modules/projects/services/project-repository";
import { createTask } from "@/modules/tasks/services/task-service";
import { taskRepository, type TaskRepository } from "@/modules/tasks/services/task-repository";
import { createAuditLog } from "@/modules/users/services/user-service";
import { userRepository, type UserRepository } from "@/modules/users/services/user-repository";

import type { AiActionProposal, AiActionProposalKey } from "../types";
import { aiRepository, type AiRepository } from "./ai-repository";

export type AiActionProposalDecisionInput = {
  decisionNotes?: string;
};

export type AiActionProposalServiceRepositories = {
  ai?: AiRepository;
  projects?: ProjectRepository;
  tasks?: TaskRepository;
  documents?: DocumentRepository;
  legal?: LegalRepository;
  meetings?: MeetingRepository;
  users?: UserRepository;
};

type ResolvedRepositories = Required<AiActionProposalServiceRepositories>;

export async function getAiActionProposal(proposalId: string, repository: AiRepository = aiRepository) {
  return repository.getActionProposal(proposalId);
}

export async function acceptAiActionProposal(
  proposalId: string,
  user: PermissionUser,
  input: AiActionProposalDecisionInput = {},
  repositories: AiActionProposalServiceRepositories = {}
) {
  const repos = resolveRepositories(repositories);
  const proposal = await repos.ai.getActionProposal(proposalId);

  if (!proposal) {
    throw new Error("Khong tim thay de xuat AI.");
  }

  assertCan(user, "ai.confirm_action");
  assertCan(user, proposal.requiredPermission, {
    id: proposal.targetEntityId,
    projectId: proposal.projectId,
    ownerId: proposal.requestedBy
  });

  if (proposal.status !== "proposed") {
    throw new Error("Chi co the chap nhan de xuat dang o trang thai proposed.");
  }

  const timestamp = new Date().toISOString();

  try {
    const executionResult = await executeProposal(proposal, user, repos);
    const updated = await repos.ai.updateActionProposal(proposal.id, {
      status: "accepted",
      decidedBy: user.id,
      decidedAt: timestamp,
      decisionNotes: input.decisionNotes,
      executionResult,
      updatedAt: timestamp
    });

    await createAuditLog(
      {
        actorId: user.id,
        entityType: "ai_action_proposal",
        entityId: proposal.id,
        action: "ai_action_proposal.accept",
        oldValue: { status: proposal.status },
        newValue: { actionKey: proposal.actionKey, status: updated.status, executionResult }
      },
      repos.users
    );

    return updated;
  } catch (error) {
    const failed = await repos.ai.updateActionProposal(proposal.id, {
      status: "failed",
      decidedBy: user.id,
      decidedAt: timestamp,
      decisionNotes: input.decisionNotes,
      executionResult: { error: error instanceof Error ? error.message : "Loi khong xac dinh" },
      updatedAt: timestamp
    });

    await createAuditLog(
      {
        actorId: user.id,
        entityType: "ai_action_proposal",
        entityId: proposal.id,
        action: "ai_action_proposal.fail",
        oldValue: { status: proposal.status },
        newValue: { actionKey: proposal.actionKey, status: failed.status, error: failed.executionResult }
      },
      repos.users
    );

    throw error;
  }
}

export async function rejectAiActionProposal(
  proposalId: string,
  user: PermissionUser,
  input: AiActionProposalDecisionInput = {},
  repositories: AiActionProposalServiceRepositories = {}
) {
  const repos = resolveRepositories(repositories);
  const proposal = await repos.ai.getActionProposal(proposalId);

  if (!proposal) {
    throw new Error("Khong tim thay de xuat AI.");
  }

  if (proposal.requestedBy !== user.id) {
    assertCan(user, "ai.confirm_action");
  }

  if (proposal.status !== "proposed") {
    throw new Error("Chi co the tu choi de xuat dang o trang thai proposed.");
  }

  const timestamp = new Date().toISOString();
  const updated = await repos.ai.updateActionProposal(proposal.id, {
    status: "rejected",
    decidedBy: user.id,
    decidedAt: timestamp,
    decisionNotes: input.decisionNotes,
    updatedAt: timestamp
  });

  await createAuditLog(
    {
      actorId: user.id,
      entityType: "ai_action_proposal",
      entityId: proposal.id,
      action: "ai_action_proposal.reject",
      oldValue: { status: proposal.status },
      newValue: { actionKey: proposal.actionKey, status: updated.status, decisionNotes: input.decisionNotes }
    },
    repos.users
  );

  return updated;
}

async function executeProposal(proposal: AiActionProposal, user: PermissionUser, repositories: ResolvedRepositories) {
  switch (normalizeActionKey(proposal.actionKey)) {
    case "create_task":
    case "create_legal_followup_task":
      return executeCreateTaskProposal(proposal, user, repositories);
    case "request_document_update":
      return executeRequestDocumentUpdateProposal(proposal, user, repositories);
    case "update_legal_note":
      return executeUpdateLegalNoteProposal(proposal, user, repositories);
    case "create_meeting_action_item":
      return executeCreateMeetingActionItemProposal(proposal, user, repositories);
    default:
      throw new Error(`Loai de xuat AI chua duoc ho tro: ${proposal.actionKey}`);
  }
}

async function executeCreateTaskProposal(proposal: AiActionProposal, user: PermissionUser, repositories: ResolvedRepositories) {
  const projectId = readString(proposal.proposedPayload.projectId) ?? proposal.projectId;

  if (!projectId) {
    throw new Error("De xuat tao task thieu projectId.");
  }

  await assertProjectScope(user, projectId, repositories);
  const task = await createTask(
    {
      projectId,
      title: readString(proposal.proposedPayload.title) ?? "Task tu de xuat AI",
      description: readString(proposal.proposedPayload.description) ?? proposal.rationale,
      assigneeId: readString(proposal.proposedPayload.assigneeId),
      dueDate: readString(proposal.proposedPayload.dueDate),
      status: "todo",
      priority: readTaskPriority(proposal.proposedPayload.priority),
      category: readString(proposal.proposedPayload.category) ?? "ai_proposal"
    },
    repositories.tasks,
    repositories.projects
  );

  return { entityType: "task", entityId: task.id, projectId: task.projectId };
}

async function executeRequestDocumentUpdateProposal(proposal: AiActionProposal, user: PermissionUser, repositories: ResolvedRepositories) {
  const documentId = proposal.targetEntityId ?? readString(proposal.proposedPayload.documentId);

  if (!documentId) {
    throw new Error("De xuat cap nhat ho so thieu documentId.");
  }

  const document = await repositories.documents.getDocument(documentId);

  if (!document) {
    throw new Error("Khong tim thay ho so can cap nhat.");
  }

  await assertDocumentScope(user, documentId, repositories);
  const updated = await updateDocument(
    document.id,
    {
      projectId: document.projectId,
      title: document.title,
      docType: document.docType,
      fileUrl: document.fileUrl,
      externalUrl: document.externalUrl,
      version: document.version,
      status: "needs_update",
      ownerId: document.ownerId
    },
    repositories.documents,
    repositories.projects
  );

  return { entityType: "document", entityId: updated.id, projectId: updated.projectId, status: updated.status };
}

async function executeUpdateLegalNoteProposal(proposal: AiActionProposal, user: PermissionUser, repositories: ResolvedRepositories) {
  const stepId = proposal.targetEntityId ?? readString(proposal.proposedPayload.legalStepId);

  if (!stepId) {
    throw new Error("De xuat cap nhat phap ly thieu legalStepId.");
  }

  const step = await repositories.legal.getLegalStep(stepId);

  if (!step) {
    throw new Error("Khong tim thay buoc phap ly.");
  }

  await assertLegalScope(user, stepId, repositories);
  const newNote = readString(proposal.proposedPayload.notes) ?? proposal.rationale ?? "Cap nhat tu de xuat AI.";
  const updated = await updateLegalStep(
    step.id,
    {
      status: step.status,
      assigneeId: step.assigneeId,
      dueDate: step.dueDate,
      completedDate: step.completedDate,
      notes: [step.notes, newNote].filter(Boolean).join("\n"),
      relatedDocumentIds: step.relatedDocumentIds ?? []
    },
    repositories.legal,
    repositories.projects,
    repositories.documents
  );

  return { entityType: "legal_step", entityId: updated.id, projectId: updated.projectId };
}

async function executeCreateMeetingActionItemProposal(proposal: AiActionProposal, user: PermissionUser, repositories: ResolvedRepositories) {
  const meetingId = proposal.targetEntityId ?? readString(proposal.proposedPayload.meetingId);

  if (!meetingId) {
    throw new Error("De xuat action item thieu meetingId.");
  }

  await assertMeetingScope(user, meetingId, repositories);
  const decision = await createDecision(
    {
      meetingId,
      decisionText: readString(proposal.proposedPayload.decisionText) ?? readString(proposal.proposedPayload.title) ?? "Action item tu AI",
      ownerId: readString(proposal.proposedPayload.ownerId),
      dueDate: readString(proposal.proposedPayload.dueDate),
      status: "open"
    },
    repositories.meetings
  );

  return { entityType: "decision", entityId: decision.id, projectId: decision.projectId };
}

async function assertProjectScope(user: PermissionUser, projectId: string, repositories: ResolvedRepositories) {
  const [project, scope] = await Promise.all([repositories.projects.getProject(projectId), resolveScope(user, repositories)]);

  if (!project || !canReadProjectInScope(project, scope)) {
    throw new Error("Nguoi dung khong co scope tren du an cua de xuat AI.");
  }
}

async function assertDocumentScope(user: PermissionUser, documentId: string, repositories: ResolvedRepositories) {
  const [document, scope] = await Promise.all([repositories.documents.getDocument(documentId), resolveScope(user, repositories)]);

  if (!document || !canReadDocumentInScope(document, scope)) {
    throw new Error("Nguoi dung khong co scope tren ho so cua de xuat AI.");
  }
}

async function assertLegalScope(user: PermissionUser, stepId: string, repositories: ResolvedRepositories) {
  const [step, scope] = await Promise.all([repositories.legal.getLegalStep(stepId), resolveScope(user, repositories)]);

  if (!step || !canReadLegalStepInScope(step, scope)) {
    throw new Error("Nguoi dung khong co scope tren buoc phap ly cua de xuat AI.");
  }
}

async function assertMeetingScope(user: PermissionUser, meetingId: string, repositories: ResolvedRepositories) {
  const [meeting, scope] = await Promise.all([repositories.meetings.getMeeting(meetingId), resolveScope(user, repositories)]);

  if (!meeting || !canReadMeetingInScope(meeting, scope)) {
    throw new Error("Nguoi dung khong co scope tren cuoc hop cua de xuat AI.");
  }
}

async function resolveScope(user: PermissionUser, repositories: ResolvedRepositories) {
  const [memberships, tasks, documents] = await Promise.all([
    repositories.users.listProjectMemberships(),
    repositories.tasks.listTasks(),
    repositories.documents.listDocuments()
  ]);

  return resolveAccessScope(user, { memberships, tasks, documents });
}

function resolveRepositories(repositories: AiActionProposalServiceRepositories): ResolvedRepositories {
  return {
    ai: repositories.ai ?? aiRepository,
    projects: repositories.projects ?? projectRepository,
    tasks: repositories.tasks ?? taskRepository,
    documents: repositories.documents ?? documentRepository,
    legal: repositories.legal ?? legalRepository,
    meetings: repositories.meetings ?? meetingRepository,
    users: repositories.users ?? userRepository
  };
}

function normalizeActionKey(actionKey: string): AiActionProposalKey | "unsupported" {
  if (actionKey === "task.create_from_ai_proposal") {
    return "create_task";
  }

  if (actionKey === "project.note_from_ai_proposal") {
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

  return "unsupported";
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readTaskPriority(value: unknown) {
  const priority = readString(value);

  return priority === "low" || priority === "medium" || priority === "high" || priority === "urgent" ? priority : "medium";
}

