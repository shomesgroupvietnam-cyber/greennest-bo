import { randomUUID } from "node:crypto";

import {
  canAccessScopedAction,
  canReadProposalInScope,
  resolveAccessScope,
} from "@/lib/permissions/access-scope";
import {
  assertCan,
  can,
  normalizePermissionAction,
  type PermissionAction,
  type PermissionInput,
  type PermissionUser,
} from "@/lib/permissions/can";
import {
  proposalApprovalActionSchema,
  proposalInputSchema,
  type ProposalApprovalActionInput,
} from "@/modules/proposals/validation";
import { assertDelegatedActionAllowed } from "@/modules/settings/services/leadership-delegation-service";
import type { LeadershipDelegationRepository } from "@/modules/settings/services/leadership-delegation-repository";
import { resolveApprovalPolicyForProposal } from "@/modules/settings/services/policy-settings-service";
import type { PolicySettingsRepository } from "@/modules/settings/services/policy-settings-repository";
import {
  documentRepository,
  type DocumentRepository,
} from "@/modules/documents/services/document-repository";
import type {
  Proposal,
  ProposalAttachment,
  ProposalApprovalAction,
  ProposalDecision,
  ProposalDetail,
  ProposalInput,
  ProposalLink,
  ProposalStatus,
  ProposalStep,
} from "@/modules/proposals/types";
import type {
  RolePermissionCatalog,
  ScopeAssignment,
} from "@/modules/settings/types";

import {
  proposalRepository,
  type ProposalApprovalMutation,
  type ProposalRepository,
} from "./proposal-repository";

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
    throw new Error("Ban khong co quyen tao de xuat tai chinh.");
  }

  if (type === "contract" && !can(user, "contract.view")) {
    throw new Error("Ban khong co quyen tao de xuat hop dong.");
  }

  if (type === "investment" && !can(user, "investment.view")) {
    throw new Error("Ban khong co quyen tao de xuat dau tu.");
  }
}

type DelegatedApprovalContext = {
  onBehalfOf?: string;
  delegationId?: string;
};

export type ProposalApprovalActionOptions = {
  delegatedContext?: DelegatedApprovalContext;
  repository?: ProposalRepository;
  requireScopeAssignments?: boolean;
  rolePermissionCatalog?: RolePermissionCatalog;
  scopeAssignments?: ScopeAssignment[];
};

export type ProposalApprovalActionResult = {
  action: ProposalApprovalAction;
  decision: ProposalDecision;
  nextStatus: ProposalStatus;
  nextStepId?: string;
  nextStepStatus?: ProposalStep["status"];
  notes?: string;
  previousStatus: ProposalStatus;
  previousStepId: string;
  previousStepStatus: ProposalStep["status"];
  proposal: Proposal;
};

export type ProposalSubmissionResult = {
  decision: ProposalDecision;
  nextStatus: ProposalStatus;
  nextStepId?: string;
  nextStepStatus?: ProposalStep["status"];
  previousStatus: ProposalStatus;
  previousStepId?: string;
  previousStepStatus?: ProposalStep["status"];
  proposal: Proposal;
};

type DecisionTransitionMetadata = Pick<
  ProposalDecision,
  | "attachmentIds"
  | "nextStatus"
  | "nextStepStatus"
  | "previousStatus"
  | "previousStepStatus"
  | "version"
>;

function assertNoDelegatedApprovalContext(context?: DelegatedApprovalContext) {
  if (context?.onBehalfOf || context?.delegationId) {
    throw new Error("MVP khong cho approve, reject hoac request-change thay lanh dao.");
  }
}

function redactProposalFinanceForUser<T extends Proposal>(proposal: T, user: PermissionUser): T {
  if (can(user, "finance.view")) {
    return proposal;
  }

  const redactedProposal = { ...proposal };
  delete redactedProposal.amount;
  return redactedProposal as T;
}

function redactProposalDetailFinanceForUser(detail: ProposalDetail, user: PermissionUser): ProposalDetail {
  return {
    ...detail,
    proposal: redactProposalFinanceForUser(detail.proposal, user),
  };
}

function safeExternalAttachmentUrl(value?: string) {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = new URL(value);

    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}

async function redactProposalDetailAttachmentsForUser(
  detail: ProposalDetail,
  user: PermissionUser,
  documents: DocumentRepository,
): Promise<ProposalDetail> {
  const canViewDocuments = can(user, "document.view");
  const attachments = await Promise.all(
    detail.attachments.map(async (attachment) => {
      if (!attachment.documentId) {
        return {
          ...attachment,
          externalUrl: safeExternalAttachmentUrl(attachment.externalUrl),
          url: safeExternalAttachmentUrl(attachment.url),
        };
      }

      const document = await documents.getDocument(attachment.documentId);
      const canSerializeDocument =
        canViewDocuments &&
        Boolean(document) &&
        Boolean(detail.proposal.projectId) &&
        document?.projectId === detail.proposal.projectId;

      if (canSerializeDocument) {
        return attachment;
      }

      return {
        ...attachment,
        documentId: undefined,
        externalUrl: undefined,
        name: "File bi gioi han quyen",
        url: undefined,
      };
    }),
  );

  return {
    ...detail,
    attachments,
  };
}

function hasValidRequiredDeadline(dueDate?: string) {
  if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return false;
  }

  const date = new Date(`${dueDate}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dueDate;
}

function assertApprovalReadinessMetadata(detail: ProposalDetail) {
  if (!hasValidRequiredDeadline(detail.proposal.dueDate)) {
    throw new Error("Deadline / han xu ly la bat buoc truoc khi dua approval vao hang cho.");
  }

  if (!detail.attachments.length) {
    throw new Error("File dinh kem / attachment metadata la bat buoc truoc khi dua approval vao hang cho.");
  }
}

async function assertAttachmentDocumentsScoped(
  attachments: ProposalAttachment[],
  proposal: Pick<Proposal, "id" | "projectId">,
  documents: DocumentRepository,
) {
  const documentIds = [
    ...new Set(attachments.map((attachment) => attachment.documentId).filter((documentId): documentId is string => Boolean(documentId))),
  ];

  for (const documentId of documentIds) {
    const document = await documents.getDocument(documentId);

    if (!document) {
      throw new Error("Document dinh kem khong ton tai hoac khong nam trong scope.");
    }

    if (!proposal.projectId || document.projectId !== proposal.projectId) {
      throw new Error("Document dinh kem khong thuoc cung du an voi approval.");
    }
  }
}

const openStateApprovalActions = new Set<ProposalApprovalAction>([
  "forward",
  "request_change",
  "ask_meeting",
  "hold",
]);

function decisionFallbackVersions(decisions: ProposalDecision[]) {
  const chronological = [...decisions].sort((a, b) => {
    const timeRank = a.decidedAt.localeCompare(b.decidedAt);

    return timeRank !== 0 ? timeRank : a.id.localeCompare(b.id);
  });

  return new Map(chronological.map((decision, index) => [decision.id, index + 1]));
}

function nextDecisionVersion(decisions: ProposalDecision[]) {
  if (decisions.length === 0) {
    return 1;
  }

  const fallbackVersions = decisionFallbackVersions(decisions);
  const highestVersion = decisions.reduce((highest, decision) => {
    const explicitVersion = Number.isInteger(decision.version)
      ? Number(decision.version)
      : undefined;
    const version = explicitVersion && explicitVersion > 0
      ? explicitVersion
      : fallbackVersions.get(decision.id) ?? 0;

    return Math.max(highest, version);
  }, 0);

  return highestVersion + 1;
}

export async function listProposals(filters = {}, user: PermissionUser, repository: ProposalRepository = proposalRepository) {
  assertProposalReadable(user);

  const proposals = await repository.listProposals(filters);
  return proposals.map((proposal) => redactProposalFinanceForUser(proposal, user));
}

export async function getProposalDetail(
  proposalId: string,
  user: PermissionUser,
  repository: ProposalRepository = proposalRepository,
  documents: DocumentRepository = documentRepository,
) {
  const detail = await repository.getProposalDetail(proposalId);

  if (!detail) {
    return undefined;
  }

  const safeDetail = await redactProposalDetailAttachmentsForUser(detail, user, documents);

  if (
    can(user, "proposal.view") ||
    safeDetail.proposal.submittedBy === user.id ||
    safeDetail.proposal.requestedBy === user.id
  ) {
    return redactProposalDetailFinanceForUser(safeDetail, user);
  }

  assertProposalReadable(user);

  return redactProposalDetailFinanceForUser(safeDetail, user);
}

export async function createProposal(
  input: ProposalInput,
  user: PermissionUser,
  repository: ProposalRepository = proposalRepository,
  delegationRepository?: LeadershipDelegationRepository,
  documents: DocumentRepository = documentRepository,
) {
  const parsed = proposalInputSchema.parse(input);
  const timestamp = now();
  const moduleId = inferModule(parsed.type, parsed.module);
  const delegationResolution = parsed.onBehalfOf
    ? await assertDelegatedActionAllowed(
        {
          actor: user,
          principalUserId: parsed.onBehalfOf,
          delegationId: parsed.delegationId,
          actionKey: "proposal.create",
          scope: {
            projectId: parsed.projectId,
            moduleId,
          },
        },
        { repository: delegationRepository },
      )
    : undefined;

  if (!delegationResolution) {
    assertCan(user, "proposal.create");
    assertDomainCreatePermission(user, parsed.type);
  }

  const proposal: Proposal = {
    id: randomUUID(),
    code: createCode(parsed.type),
    title: parsed.title,
    type: parsed.type,
    projectId: parsed.projectId,
    module: moduleId,
    requestedBy: delegationResolution?.principalUserId ?? user.id,
    submittedBy: user.id,
    onBehalfOf: delegationResolution?.principalUserId,
    delegationId: delegationResolution?.delegationId,
    ownerId: parsed.ownerId,
    status: "draft",
    priority: parsed.priority,
    amount: parsed.amount,
    dueDate: parsed.dueDate,
    summary: parsed.summary,
    aiReviewStatus: "not_checked",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const links: ProposalLink[] = (input.links ?? []).map((link) => ({
    id: randomUUID(),
    proposalId: proposal.id,
    entityType: link.entityType,
    entityId: link.entityId,
    relationType: link.relationType,
    createdAt: timestamp,
  }));
  const attachments: ProposalAttachment[] = parsed.attachments.map((attachment) => ({
    id: randomUUID(),
    proposalId: proposal.id,
    name: attachment.name,
    source: attachment.documentId ? "document" : "external_url",
    url: attachment.documentId ? undefined : attachment.url,
    externalUrl: attachment.documentId ? undefined : attachment.externalUrl,
    documentId: attachment.documentId,
    uploadedBy: user.id,
    uploadedAt: timestamp,
    createdAt: timestamp,
  }));

  await assertAttachmentDocumentsScoped(attachments, proposal, documents);

  return repository.createProposal(proposal, links, attachments);
}

export async function submitProposalWithResult(
  proposalId: string,
  user: PermissionUser,
  repository: ProposalRepository = proposalRepository,
  policyRepository?: PolicySettingsRepository,
  delegationRepository?: LeadershipDelegationRepository,
): Promise<ProposalSubmissionResult> {
  const detail = await repository.getProposalDetail(proposalId);

  if (!detail) {
    throw new Error("Khong tim thay de xuat.");
  }

  if (detail.proposal.onBehalfOf) {
    await assertDelegatedActionAllowed(
      {
        actor: user,
        principalUserId: detail.proposal.onBehalfOf,
        delegationId: detail.proposal.delegationId,
        actionKey: "proposal.create",
        scope: {
          projectId: detail.proposal.projectId,
          moduleId: detail.proposal.module,
          recordId: detail.proposal.id,
        },
      },
      { repository: delegationRepository },
    );
  } else {
    assertCan(user, "proposal.create");
  }

  if (!["draft", "change_requested"].includes(detail.proposal.status)) {
    throw new Error("Chi de xuat nhap hoac can chinh sua moi duoc trinh duyet.");
  }

  assertApprovalReadinessMetadata(detail);

  const timestamp = now();
  const previousStep = currentStep(detail);
  const policyResolution = policyRepository
    ? await resolveApprovalPolicyForProposal(
        {
          targetType: detail.proposal.type,
          amount: detail.proposal.amount,
          moduleId: detail.proposal.module,
          scope: {
            projectId: detail.proposal.projectId,
            moduleId: detail.proposal.module,
          },
        },
        policyRepository,
      )
    : await resolveApprovalPolicyForProposal({
        targetType: detail.proposal.type,
        amount: detail.proposal.amount,
        moduleId: detail.proposal.module,
        scope: {
          projectId: detail.proposal.projectId,
          moduleId: detail.proposal.module,
        },
      });
  const step: ProposalStep = {
    id: randomUUID(),
    proposalId,
    stepOrder: detail.steps.length + 1,
    approverRole: policyResolution.approverRole,
    requiredPermission: policyResolution.requiredPermission,
    thresholdPolicyId: policyResolution.thresholdPolicyId,
    thresholdLabel: policyResolution.thresholdLabel,
    approvalLevel: policyResolution.approvalLevel,
    status: "in_review",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const mutationResult = await repository.applyApprovalMutation({
    decision: createDecision(
      proposalId,
      "submitted",
      user.id,
      detail.proposal.onBehalfOf
        ? `Trinh duyet de xuat thay mat ${detail.proposal.onBehalfOf}.`
        : "Trinh duyet de xuat.",
      step.id,
      timestamp,
      {
        attachmentIds: detail.attachments.map((attachment) => attachment.id),
        nextStatus: "in_review",
        nextStepStatus: step.status,
        previousStatus: detail.proposal.status,
        previousStepStatus: previousStep?.status,
        version: nextDecisionVersion(detail.decisions),
      },
    ),
    newStep: step,
    proposalId,
    proposalPatch: {
      status: "in_review",
      currentStepId: step.id,
      updatedAt: timestamp,
    },
  });

  return {
    decision: mutationResult.decision,
    nextStatus: mutationResult.proposal.status,
    nextStepId: step.id,
    nextStepStatus: step.status,
    previousStatus: detail.proposal.status,
    previousStepId: previousStep?.id,
    previousStepStatus: previousStep?.status,
    proposal: mutationResult.proposal,
  };
}

export async function submitProposal(
  proposalId: string,
  user: PermissionUser,
  repository: ProposalRepository = proposalRepository,
  policyRepository?: PolicySettingsRepository,
  delegationRepository?: LeadershipDelegationRepository,
) {
  const result = await submitProposalWithResult(
    proposalId,
    user,
    repository,
    policyRepository,
    delegationRepository,
  );

  return result.proposal;
}

const mutableApprovalStatuses = new Set<ProposalStatus>([
  "submitted",
  "in_review",
  "on_hold",
]);

function currentStep(detail: ProposalDetail) {
  return detail.proposal.currentStepId
    ? detail.steps.find((item) => item.id === detail.proposal.currentStepId)
    : undefined;
}

function requireCurrentStep(detail: ProposalDetail) {
  const step = currentStep(detail);

  if (!step) {
    throw new Error("Can co current approval step hop le truoc khi thao tac approval.");
  }

  return step;
}

function normalizeActionPermission(action?: string): PermissionAction | undefined {
  return action
    ? normalizePermissionAction(action as PermissionInput)
    : undefined;
}

function proposalActionTarget(proposal: Proposal) {
  return {
    axisId: "project_management",
    moduleId: "proposal",
    projectId: proposal.projectId,
    recordId: proposal.id,
    workstreamId: "proposal",
  };
}

function hasActionGrant(
  user: PermissionUser,
  permission: PermissionAction,
  proposal: Proposal,
  options: ProposalApprovalActionOptions,
) {
  if (can(user, permission)) {
    return true;
  }

  return canAccessScopedAction(user, permission, proposalActionTarget(proposal), {
    rolePermissionCatalog: options.rolePermissionCatalog,
    scopeAssignments: options.scopeAssignments,
  });
}

function actionPermissionCandidates(
  action: ProposalApprovalAction,
  step: ProposalStep,
): PermissionAction[] {
  const stepPermission = normalizeActionPermission(step?.requiredPermission);
  const candidates: Array<PermissionAction | undefined> = (() => {
    if (action === "request_change") {
      return ["proposal.request_change"];
    }

    if (action === "reject" || action === "cancel") {
      return ["proposal.reject", stepPermission];
    }

    if (action === "approve") {
      return [stepPermission ?? "proposal.approve"];
    }

    return [stepPermission, "proposal.approve"];
  })();

  return [...new Set(candidates.filter((permission): permission is PermissionAction => Boolean(permission)))];
}

function assertProposalActionScope(
  detail: ProposalDetail,
  user: PermissionUser,
  options: ProposalApprovalActionOptions,
) {
  const scope = resolveAccessScope(user, {
    requireScopeAssignments: options.requireScopeAssignments,
    rolePermissionCatalog: options.rolePermissionCatalog,
    scopeAssignments: options.scopeAssignments,
  });

  if (!canReadProposalInScope(detail.proposal, scope)) {
    throw new Error("Ban khong co quyen thao tac de xuat ngoai scope.");
  }
}

function assertActionAllowed(
  detail: ProposalDetail,
  action: ProposalApprovalAction,
  step: ProposalStep,
  user: PermissionUser,
  options: ProposalApprovalActionOptions,
) {
  const candidates = actionPermissionCandidates(action, step);
  const allowed = candidates.some((permission) =>
    hasActionGrant(user, permission, detail.proposal, options),
  );

  if (!allowed) {
    throw new Error(`Ban khong co quyen ${action} de xuat nay.`);
  }
}

function hasScopedApproverRole(
  detail: ProposalDetail,
  step: ProposalStep,
  action: ProposalApprovalAction,
  user: PermissionUser,
  options: ProposalApprovalActionOptions,
) {
  if (!step.approverRole) {
    return true;
  }

  if (step.approverRole === user.role) {
    return true;
  }

  const roleScopedAssignments = options.scopeAssignments?.filter(
    (assignment) => assignment.roleKey === step.approverRole,
  );

  if (!roleScopedAssignments?.length) {
    return false;
  }

  return actionPermissionCandidates(action, step).some((permission) =>
    canAccessScopedAction(user, permission, proposalActionTarget(detail.proposal), {
      rolePermissionCatalog: options.rolePermissionCatalog,
      scopeAssignments: roleScopedAssignments,
    }),
  );
}

function assertStepApproverTarget(
  detail: ProposalDetail,
  action: ProposalApprovalAction,
  step: ProposalStep,
  user: PermissionUser,
  options: ProposalApprovalActionOptions,
) {
  if (step.approverUserId && step.approverUserId !== user.id) {
    throw new Error("Ban khong phai nguoi duyet duoc chi dinh cho buoc hien tai.");
  }

  if (!hasScopedApproverRole(detail, step, action, user, options)) {
    throw new Error("Ban khong nam trong vai tro duyet cua buoc hien tai.");
  }
}

function notesForAction(input: ProposalApprovalActionInput) {
  switch (input.action) {
    case "approve":
    case "hold":
      return input.notes;
    case "reject":
    case "request_change":
    case "cancel":
      return input.reason;
    case "ask_meeting":
      return input.agendaDraft ?? input.meetingType;
    case "forward":
      return input.notes
        ? `${input.targetLabel}: ${input.notes}`
        : `Chuyen cap den ${input.targetLabel}.`;
  }
}

export async function applyProposalApprovalAction(
  proposalId: string,
  input: ProposalApprovalActionInput,
  user: PermissionUser,
  options: ProposalApprovalActionOptions = {},
): Promise<ProposalApprovalActionResult> {
  const parsed = proposalApprovalActionSchema.parse(input);
  const repository = options.repository ?? proposalRepository;

  assertNoDelegatedApprovalContext(options.delegatedContext);

  const detail = await repository.getProposalDetail(proposalId);

  if (!detail) {
    throw new Error("Khong tim thay de xuat.");
  }

  assertProposalActionScope(detail, user, options);

  if (!mutableApprovalStatuses.has(detail.proposal.status)) {
    throw new Error("Trang thai de xuat nay khong con cho phep thao tac approval.");
  }

  const step = requireCurrentStep(detail);

  assertStepApproverTarget(detail, parsed.action, step, user, options);
  assertActionAllowed(detail, parsed.action, step, user, options);

  if (openStateApprovalActions.has(parsed.action)) {
    assertApprovalReadinessMetadata(detail);
  }

  const timestamp = now();
  const previousStatus = detail.proposal.status;
  let proposalPatch: Partial<Proposal> = { updatedAt: timestamp };
  let stepPatch: Partial<ProposalStep> | undefined;
  let newStep: ProposalStep | undefined;
  let generatedLink: ProposalLink | undefined;
  let decisionValue: ProposalDecision["decision"];
  const notes = notesForAction(parsed);

  switch (parsed.action) {
    case "approve":
      decisionValue = "approved";
      proposalPatch = { ...proposalPatch, status: "approved" };
      stepPatch = {
        status: "approved",
        decidedBy: user.id,
        decidedAt: timestamp,
        decisionNotes: notes,
        updatedAt: timestamp,
      };
      break;
    case "reject":
      decisionValue = "rejected";
      proposalPatch = { ...proposalPatch, status: "rejected" };
      stepPatch = {
        status: "rejected",
        decidedBy: user.id,
        decidedAt: timestamp,
        decisionNotes: notes,
        updatedAt: timestamp,
      };
      break;
    case "request_change":
      decisionValue = "change_requested";
      proposalPatch = { ...proposalPatch, status: "change_requested" };
      stepPatch = {
        status: "change_requested",
        decidedBy: user.id,
        decidedAt: timestamp,
        decisionNotes: notes,
        updatedAt: timestamp,
      };
      break;
    case "forward":
      decisionValue = "forwarded";
      stepPatch = {
        status: "forwarded",
        decidedBy: user.id,
        decidedAt: timestamp,
        decisionNotes: notes,
        updatedAt: timestamp,
      };
      newStep = {
        id: randomUUID(),
        proposalId,
        stepOrder: detail.steps.length + 1,
        approverRole: parsed.targetRole,
        approverUserId: parsed.targetUserId,
        requiredPermission: step.requiredPermission ?? "proposal.approve",
        thresholdPolicyId: step.thresholdPolicyId,
        thresholdLabel: parsed.targetLabel,
        approvalLevel: step.approvalLevel,
        status: "in_review",
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      proposalPatch = {
        ...proposalPatch,
        currentStepId: newStep.id,
        status: "in_review",
      };
      break;
    case "ask_meeting":
      decisionValue = "meeting_requested";
      proposalPatch = { ...proposalPatch, status: "in_review" };
      generatedLink = {
        id: randomUUID(),
        proposalId,
        entityId: `meeting-request-${randomUUID()}`,
        entityType: "meeting_request",
        relationType: "generated_action",
        createdAt: timestamp,
      };
      break;
    case "hold":
      decisionValue = "held";
      proposalPatch = { ...proposalPatch, status: "on_hold" };
      stepPatch = {
        status: "held",
        decidedBy: user.id,
        decidedAt: timestamp,
        decisionNotes: notes,
        updatedAt: timestamp,
      };
      break;
    case "cancel":
      decisionValue = "cancelled";
      proposalPatch = { ...proposalPatch, status: "cancelled" };
      stepPatch = {
        status: "cancelled",
        decidedBy: user.id,
        decidedAt: timestamp,
        decisionNotes: notes,
        updatedAt: timestamp,
      };
      break;
  }

  const nextStatus = proposalPatch.status ?? previousStatus;
  const decisionNextStepStatus = stepPatch?.status ?? step.status;
  const mutation: ProposalApprovalMutation = {
    decision: createDecision(
      proposalId,
      decisionValue,
      user.id,
      notes,
      step.id,
      timestamp,
      {
        attachmentIds: detail.attachments.map((attachment) => attachment.id),
        nextStatus,
        nextStepStatus: decisionNextStepStatus,
        previousStatus,
        previousStepStatus: step.status,
        version: nextDecisionVersion(detail.decisions),
      },
    ),
    generatedLink,
    newStep,
    proposalId,
    proposalPatch,
    stepPatch: stepPatch
      ? {
          patch: stepPatch,
          stepId: step.id,
        }
      : undefined,
  };
  const mutationResult = await repository.applyApprovalMutation(mutation);
  const nextStep = mutationResult.newStep ?? mutationResult.step ?? step;

  return {
    action: parsed.action,
    decision: mutationResult.decision,
    nextStatus: mutationResult.proposal.status,
    nextStepId: mutationResult.proposal.currentStepId ?? nextStep.id,
    nextStepStatus: nextStep.status,
    notes,
    previousStatus,
    previousStepId: step.id,
    previousStepStatus: step.status,
    proposal: mutationResult.proposal,
  };
}

export async function requestProposalChange(
  proposalId: string,
  user: PermissionUser,
  notes?: string,
  repository: ProposalRepository = proposalRepository,
  delegatedContext?: DelegatedApprovalContext,
) {
  const result = await applyProposalApprovalAction(
    proposalId,
    { action: "request_change", reason: notes ?? "" },
    user,
    { delegatedContext, repository },
  );

  return result.proposal;
}

export async function approveProposal(
  proposalId: string,
  user: PermissionUser,
  notes?: string,
  repository: ProposalRepository = proposalRepository,
  delegatedContext?: DelegatedApprovalContext,
) {
  const result = await applyProposalApprovalAction(
    proposalId,
    { action: "approve", notes },
    user,
    { delegatedContext, repository },
  );

  return result.proposal;
}

export async function rejectProposal(
  proposalId: string,
  user: PermissionUser,
  notes?: string,
  repository: ProposalRepository = proposalRepository,
  delegatedContext?: DelegatedApprovalContext,
) {
  const result = await applyProposalApprovalAction(
    proposalId,
    { action: "reject", reason: notes ?? "" },
    user,
    { delegatedContext, repository },
  );

  return result.proposal;
}

function createDecision(
  proposalId: string,
  decision: ProposalDecision["decision"],
  decidedBy: string,
  notes?: string,
  stepId?: string,
  decidedAt = now(),
  metadata: DecisionTransitionMetadata = {},
): ProposalDecision {
  return {
    id: randomUUID(),
    proposalId,
    stepId,
    decision,
    decidedBy,
    decidedAt,
    notes,
    ...metadata,
  };
}
