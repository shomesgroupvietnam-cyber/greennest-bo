import { assertCan, type PermissionUser } from "@/lib/permissions/can";
import {
  canAccessScopedAction,
  canReadDocumentInScope,
  canReadLegalStepInScope,
  canReadMeetingInScope,
  canReadProjectInScope,
  resolveAccessScope
} from "@/lib/permissions/access-scope";
import { updateDocument } from "@/modules/documents/services/document-service";
import { documentRepository, type DocumentRepository } from "@/modules/documents/services/document-repository";
import {
  createExecutiveRiskRecord,
  type RiskRecordServiceDependencies,
} from "@/modules/executive/services/risk-record-service";
import {
  riskRecordRepository,
  type RiskRecordRepository,
} from "@/modules/executive/services/risk-record-repository";
import type { CreateExecutiveRiskRecordInput } from "@/modules/executive/types";
import { updateLegalStep } from "@/modules/legal/services/legal-service";
import { legalRepository, type LegalRepository } from "@/modules/legal/services/legal-repository";
import { createDecision } from "@/modules/meetings/services/meeting-service";
import { meetingRepository, type MeetingRepository } from "@/modules/meetings/services/meeting-repository";
import {
  applyProposalApprovalAction,
  type ProposalApprovalActionResult,
} from "@/modules/proposals/services/proposal-service";
import { proposalRepository, type ProposalRepository } from "@/modules/proposals/services/proposal-repository";
import type { ProposalApprovalAction } from "@/modules/proposals/types";
import type { ProposalApprovalActionInput } from "@/modules/proposals/validation";
import { projectRepository, type ProjectRepository } from "@/modules/projects/services/project-repository";
import type {
  LeadershipDelegation,
  RolePermissionCatalog,
  ScopeAssignment,
} from "@/modules/settings/types";
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
  proposals?: ProposalRepository;
  riskRecords?: RiskRecordRepository;
  riskGroups?: RiskRecordServiceDependencies["riskGroups"];
  requireScopeAssignments?: boolean;
  scopeAssignments?: ScopeAssignment[];
  rolePermissionCatalog?: RolePermissionCatalog;
  delegations?: LeadershipDelegation[];
  users?: UserRepository;
};

type ResolvedRepositories = {
  ai: AiRepository;
  projects: ProjectRepository;
  tasks: TaskRepository;
  documents: DocumentRepository;
  legal: LegalRepository;
  meetings: MeetingRepository;
  proposals: ProposalRepository;
  riskRecords: RiskRecordRepository;
  riskGroups?: RiskRecordServiceDependencies["riskGroups"];
  requireScopeAssignments?: boolean;
  scopeAssignments?: ScopeAssignment[];
  rolePermissionCatalog?: RolePermissionCatalog;
  delegations?: LeadershipDelegation[];
  users: UserRepository;
};

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
  const actionKey = normalizeActionKey(proposal.actionKey);
  assertCanExecuteActionProposal(proposal, user, repos, actionKey);

  if (proposal.status !== "proposed") {
    throw new Error("Chi co the chap nhan de xuat dang o trang thai proposed.");
  }

  const timestamp = new Date().toISOString();
  const claimed = await repos.ai.claimActionProposal(proposal.id, {
    status: "executed",
    decidedBy: user.id,
    decidedAt: timestamp,
    decisionNotes: input.decisionNotes,
    updatedAt: timestamp
  });

  if (!claimed) {
    throw new Error("De xuat AI da duoc xu ly boi yeu cau khac.");
  }

  try {
    const executionResult = await executeProposal(claimed, user, repos);
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
        oldValue: { status: claimed.status },
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
    case "create_risk_record":
      return executeCreateRiskRecordProposal(proposal, user, repositories);
    case "approval_request_change":
    case "approval_ask_meeting":
      return executeApprovalActionProposal(proposal, user, repositories);
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
    repositories.projects,
    { createdBy: user.id }
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

  if (proposal.targetEntityType !== "meeting") {
    throw new Error("De xuat action item meeting co target khong hop le.");
  }

  const meeting = await assertMeetingScope(user, meetingId, repositories);
  const expectedMeetingId = readString(proposal.proposedPayload.meetingId);
  const expectedAiSummaryStatus = readString(proposal.proposedPayload.currentAiSummaryStatus);
  const expectedMeetingUpdatedAt = readString(proposal.proposedPayload.currentMeetingUpdatedAt);
  const sourceCitationIds = readStringArray(proposal.proposedPayload.sourceCitationIds);
  const affectedFields = readStringArray(proposal.proposedPayload.affectedFields);

  if (!expectedMeetingId || expectedMeetingId !== meetingId) {
    throw new Error("meetingId cua de xuat AI khong khop target meeting.");
  }

  if (readString(proposal.proposedPayload.requiredPermission) !== "decision.create") {
    throw new Error("De xuat action item thieu requiredPermission hop le.");
  }

  if (!affectedFields.includes("decisions")) {
    throw new Error("De xuat action item thieu affectedFields hop le.");
  }

  if (!expectedAiSummaryStatus) {
    throw new Error("De xuat action item thieu trang thai AI summary hien tai.");
  }

  if (!expectedMeetingUpdatedAt) {
    throw new Error("De xuat action item thieu stale guard cua meeting.");
  }

  if (expectedAiSummaryStatus && meeting.aiSummary.status !== expectedAiSummaryStatus) {
    throw new Error("Trang thai AI summary cua meeting da thay doi; can tao lai de xuat AI.");
  }

  if (expectedMeetingUpdatedAt && meeting.updatedAt !== expectedMeetingUpdatedAt) {
    throw new Error("Cuoc hop da thay doi sau khi AI tao de xuat; can tao lai de xuat AI.");
  }

  if (sourceCitationIds.length === 0) {
    throw new Error("De xuat action item thieu citation nguon hop le.");
  }

  if (!sourceCitationIds.includes(meetingCitationId(meetingId))) {
    throw new Error("Citation nguon cua de xuat AI khong khop cuoc hop.");
  }

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

async function executeCreateRiskRecordProposal(proposal: AiActionProposal, user: PermissionUser, repositories: ResolvedRepositories) {
  const input = parseRiskActionProposalPayload(
    proposal.proposedPayload,
    proposal.projectId,
  );
  const record = await createExecutiveRiskRecord(input, user, {
    auditWriter: (auditInput) => createAuditLog(auditInput, repositories.users),
    projectRepository: repositories.projects,
    repository: repositories.riskRecords,
    riskGroups: repositories.riskGroups,
    rolePermissionCatalog: repositories.rolePermissionCatalog,
    scopeAssignments: repositories.scopeAssignments,
    delegations: repositories.delegations,
    userRepository: repositories.users,
  });

  return {
    entityType: "risk",
    entityId: record.id,
    projectId: record.projectId,
    status: record.status,
  };
}

async function executeApprovalActionProposal(
  proposal: AiActionProposal,
  user: PermissionUser,
  repositories: ResolvedRepositories,
) {
  const payload = parseApprovalActionProposalPayload(proposal);
  const currentDetail = await repositories.proposals.getProposalDetail(payload.proposalId);

  if (!currentDetail) {
    throw new Error("Khong tim thay approval/proposal can xu ly.");
  }

  if (
    payload.currentStatus &&
    currentDetail.proposal.status !== payload.currentStatus
  ) {
    throw new Error("Trang thai approval da thay doi, can tao lai de xuat AI.");
  }

  if (
    payload.currentStepId &&
    currentDetail.proposal.currentStepId !== payload.currentStepId
  ) {
    throw new Error("Buoc approval da thay doi, can tao lai de xuat AI.");
  }

  if (payload.currentStepStatus) {
    const currentStep = currentDetail.steps.find(
      (step) => step.id === currentDetail.proposal.currentStepId,
    );

    if (!currentStep || currentStep.status !== payload.currentStepStatus) {
      throw new Error("Trang thai buoc approval da thay doi, can tao lai de xuat AI.");
    }
  }

  if (
    payload.currentDecisionVersion !== undefined &&
    latestDecisionVersion(currentDetail.decisions) !==
      payload.currentDecisionVersion
  ) {
    throw new Error("Version approval da thay doi, can tao lai de xuat AI.");
  }

  const result = await applyProposalApprovalAction(
    payload.proposalId,
    payload.input,
    user,
    approvalActionOptions(repositories),
  );

  await createAuditLog(
    {
      actorId: user.id,
      entityType: "proposal",
      entityId: result.proposal.id,
      action: auditActionForApprovalAction(result.action),
      oldValue: {
        status: result.previousStatus,
        stepId: result.previousStepId,
        stepStatus: result.previousStepStatus,
      },
      newValue: {
        actionKey: proposal.actionKey,
        aiActionProposalId: proposal.id,
        decisionId: result.decision.id,
        status: result.nextStatus,
        stepId: result.nextStepId,
        stepStatus: result.nextStepStatus,
        version: result.decision.version,
      },
    },
    repositories.users,
  );

  return approvalExecutionResult(result, proposal);
}

function approvalActionOptions(repositories: ResolvedRepositories) {
  const hasScopedOptions =
    repositories.requireScopeAssignments ||
    (repositories.scopeAssignments && repositories.scopeAssignments.length > 0);

  return {
    repository: repositories.proposals,
    requireScopeAssignments: repositories.requireScopeAssignments,
    rolePermissionCatalog: hasScopedOptions
      ? repositories.rolePermissionCatalog
      : undefined,
    scopeAssignments: hasScopedOptions ? repositories.scopeAssignments : undefined,
  };
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

  return meeting;
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
    proposals: repositories.proposals ?? proposalRepository,
    riskRecords: repositories.riskRecords ?? riskRecordRepository,
    riskGroups: repositories.riskGroups,
    requireScopeAssignments: repositories.requireScopeAssignments,
    rolePermissionCatalog: repositories.rolePermissionCatalog,
    scopeAssignments: repositories.scopeAssignments,
    delegations: repositories.delegations,
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
    actionKey === "create_meeting_action_item" ||
    actionKey === "create_risk_record" ||
    actionKey === "approval_request_change" ||
    actionKey === "approval_ask_meeting"
  ) {
    return actionKey;
  }

  return "unsupported";
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function meetingCitationId(meetingId: string) {
  return `meeting-source-${meetingId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function isApprovalActionKey(actionKey: AiActionProposalKey | "unsupported") {
  return actionKey === "approval_request_change" || actionKey === "approval_ask_meeting";
}

function assertCanExecuteActionProposal(
  proposal: AiActionProposal,
  user: PermissionUser,
  repositories: ResolvedRepositories,
  actionKey: AiActionProposalKey | "unsupported",
) {
  if (isApprovalActionKey(actionKey)) {
    parseApprovalActionProposalPayload(proposal);
  }

  try {
    assertCan(user, proposal.requiredPermission, {
      id: proposal.targetEntityId,
      projectId: proposal.projectId,
      ownerId: proposal.requestedBy
    });

    return;
  } catch (error) {
    if (hasScopedActionGrant(user, proposal, repositories)) {
      return;
    }

    throw error;
  }
}

function hasScopedActionGrant(
  user: PermissionUser,
  proposal: AiActionProposal,
  repositories: ResolvedRepositories,
) {
  if (!repositories.scopeAssignments?.length) {
    return false;
  }

  return canAccessScopedAction(
    user,
    proposal.requiredPermission,
    actionProposalTarget(proposal),
    {
      rolePermissionCatalog: repositories.rolePermissionCatalog,
      scopeAssignments: repositories.scopeAssignments,
    },
  );
}

function actionProposalTarget(proposal: AiActionProposal) {
  const projectId =
    readString(proposal.proposedPayload.projectId) ?? proposal.projectId;
  const recordId =
    proposal.targetEntityId ??
    readString(proposal.proposedPayload.proposalId) ??
    readString(proposal.proposedPayload.documentId) ??
    readString(proposal.proposedPayload.meetingId) ??
    readString(proposal.proposedPayload.legalStepId);

  return {
    axisId: "project_management",
    moduleId: proposal.module,
    projectId,
    recordId,
    workstreamId: proposal.module,
  };
}

function parseApprovalActionProposalPayload(proposal: AiActionProposal): {
  currentDecisionVersion?: number;
  currentStepId?: string;
  currentStepStatus?: string;
  currentStatus?: string;
  input: ProposalApprovalActionInput;
  proposalId: string;
} {
  const payload = proposal.proposedPayload;
  const proposalId = readString(payload.proposalId) ?? proposal.targetEntityId;
  const approvalAction = readApprovalAction(payload.approvalAction);
  const sourceType = readString(payload.sourceType);
  const currentDecisionVersion = readNumber(payload.currentDecisionVersion);
  const currentStepId = readString(payload.currentStepId);
  const currentStepStatus = readString(payload.currentStepStatus);
  const currentStatus = readString(payload.currentStatus);
  const requiredPermission = readString(payload.requiredPermission);
  const sourceCitationIds = readStringArray(payload.sourceCitationIds);

  if (!proposalId) {
    throw new Error("De xuat approval thieu proposalId.");
  }

  if (proposal.targetEntityType !== "proposal" || !proposal.targetEntityId) {
    throw new Error("De xuat approval phai tro den target proposal hop le.");
  }

  if (proposal.targetEntityId !== proposalId) {
    throw new Error("De xuat approval co proposalId khong khop target.");
  }

  if (sourceType && sourceType !== "proposal") {
    throw new Error("De xuat approval chi ho tro sourceType proposal.");
  }

  if (
    normalizeActionKey(proposal.actionKey) === "approval_request_change" &&
    approvalAction !== "request_change"
  ) {
    throw new Error("Payload approval_request_change khong hop le.");
  }

  if (
    normalizeActionKey(proposal.actionKey) === "approval_ask_meeting" &&
    approvalAction !== "ask_meeting"
  ) {
    throw new Error("Payload approval_ask_meeting khong hop le.");
  }

  if (requiredPermission && requiredPermission !== proposal.requiredPermission) {
    throw new Error("Required permission trong payload khong khop de xuat AI.");
  }

  if (sourceCitationIds.length === 0) {
    throw new Error("De xuat approval thieu citation nguon hop le.");
  }

  return {
    currentDecisionVersion,
    currentStepId,
    currentStepStatus,
    currentStatus,
    input: approvalActionInputFromPayload(approvalAction, payload),
    proposalId,
  };
}

function readApprovalAction(value: unknown): Extract<ProposalApprovalAction, "request_change" | "ask_meeting"> {
  if (value === "request_change" || value === "ask_meeting") {
    return value;
  }

  throw new Error("De xuat approval thieu action hop le.");
}

function approvalActionInputFromPayload(
  action: Extract<ProposalApprovalAction, "request_change" | "ask_meeting">,
  payload: Record<string, unknown>,
): ProposalApprovalActionInput {
  if (action === "request_change") {
    return {
      action,
      reason: readString(payload.reason) ?? "",
    };
  }

  return {
    action,
    agendaDraft: readString(payload.agendaDraft),
    meetingType: readString(payload.meetingType),
  };
}

function auditActionForApprovalAction(action: ProposalApprovalAction) {
  const actions: Record<ProposalApprovalAction, string> = {
    approve: "proposal.approved",
    ask_meeting: "proposal.meeting_requested",
    cancel: "proposal.cancelled",
    forward: "proposal.forwarded",
    hold: "proposal.held",
    reject: "proposal.rejected",
    request_change: "proposal.change_requested",
  };

  return actions[action];
}

function approvalExecutionResult(
  result: ProposalApprovalActionResult,
  proposal: AiActionProposal,
) {
  return {
    action: result.action,
    aiActionProposalId: proposal.id,
    decisionId: result.decision.id,
    entityId: result.proposal.id,
    entityType: "proposal",
    nextStatus: result.nextStatus,
    nextStepId: result.nextStepId,
    nextStepStatus: result.nextStepStatus,
    previousStatus: result.previousStatus,
    previousStepId: result.previousStepId,
    previousStepStatus: result.previousStepStatus,
    projectId: result.proposal.projectId,
    version: result.decision.version,
  };
}

function latestDecisionVersion(decisions: Array<{ version?: number }>) {
  return decisions.reduce(
    (latest, decision) => Math.max(latest, decision.version ?? 0),
    0,
  );
}

function readTaskPriority(value: unknown) {
  const priority = readString(value);

  return priority === "low" || priority === "medium" || priority === "high" || priority === "urgent" ? priority : "medium";
}

function readRiskRecordType(value: unknown) {
  const recordType = readString(value);

  if (recordType === "risk" || recordType === "blocker") {
    return recordType;
  }

  return undefined;
}

function readRiskLevel(value: unknown) {
  const level = readString(value);

  if (level === "low" || level === "medium" || level === "high" || level === "critical") {
    return level;
  }

  return undefined;
}

function readRiskStatus(value: unknown) {
  const status = readString(value);

  if (
    status === "open" ||
    status === "monitoring" ||
    status === "in_progress" ||
    status === "blocked"
  ) {
    return status;
  }

  return undefined;
}

function readRiskSourceType(value: unknown) {
  const sourceType = readString(value);

  if (
    sourceType === "project" ||
    sourceType === "proposal" ||
    sourceType === "leadership_approval" ||
    sourceType === "executive_action" ||
    sourceType === "meeting" ||
    sourceType === "decision" ||
    sourceType === "risk" ||
    sourceType === "document" ||
    sourceType === "legal" ||
    sourceType === "task"
  ) {
    return sourceType;
  }

  return undefined;
}

function readRequiredString(payload: Record<string, unknown>, key: string) {
  const value = readString(payload[key]);

  if (!value) {
    throw new Error(`De xuat tao risk thieu ${key}.`);
  }

  return value;
}

function assertDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Deadline risk phai la YYYY-MM-DD.");
  }
}

export function parseRiskActionProposalPayload(
  payload: Record<string, unknown>,
  fallbackProjectId?: string,
): CreateExecutiveRiskRecordInput {
  const recordType = readRiskRecordType(payload.recordType);
  const level = readRiskLevel(payload.level);
  const title = readRequiredString(payload, "title");
  const reason = readRequiredString(payload, "reason");
  const categoryKey = readRequiredString(payload, "categoryKey");
  const deadline = readRequiredString(payload, "deadline");
  const ownerId = readRequiredString(payload, "ownerId");
  const projectId = readString(payload.projectId) ?? fallbackProjectId;
  const nextAction =
    readString(payload.nextAction) ??
    "Review citation va xac nhan phuong an xu ly risk/blocker.";

  if (!recordType) {
    throw new Error("De xuat tao risk thieu recordType hop le.");
  }

  if (!level) {
    throw new Error("De xuat tao risk thieu level hop le.");
  }

  if (!projectId) {
    throw new Error("De xuat tao risk thieu projectId.");
  }

  assertDateOnly(deadline);

  return {
    categoryKey,
    deadline,
    level,
    moduleId: readString(payload.moduleId) ?? "risk",
    nextAction,
    ownerId,
    projectId,
    reason,
    recordType,
    sourceId: readString(payload.sourceId),
    sourceType: readRiskSourceType(payload.sourceType),
    status: readRiskStatus(payload.status) ?? "open",
    title,
  };
}
