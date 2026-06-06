import { randomUUID } from "node:crypto";

import {
  can,
  normalizePermissionAction,
  type PermissionAction,
  type PermissionInput,
  type PermissionUser,
} from "@/lib/permissions/can";
import type { ApprovalCenterDetailData } from "@/modules/executive/types";

import type {
  AiActionProposal,
  AiApprovalAssistant,
  AiApprovalAssistantActionProposal,
  AiApprovalAssistantCitation,
  AiAskInput,
  AiAskResult,
  AiCitation,
  AiResourceRef,
} from "../types";
import { aiRepository, type AiRepository } from "./ai-repository";
import { askAi, type AiGatewayOptions } from "./ai-gateway-service";

export type AiApprovalAssistantRunAi = (
  input: AiAskInput,
  user: PermissionUser,
  options?: AiGatewayOptions,
) => Promise<AiAskResult>;

export type AiApprovalAssistantBuildOptions = {
  enabled?: boolean;
  useProvider?: boolean;
  createActionProposal?: boolean;
  runAi?: AiApprovalAssistantRunAi;
  gatewayOptions?: AiGatewayOptions;
};

const mutableApprovalStatuses = new Set(["submitted", "in_review", "on_hold"]);

export async function buildAiApprovalAssistantDraft(
  user: PermissionUser,
  detail: ApprovalCenterDetailData,
  options: AiApprovalAssistantBuildOptions = {},
): Promise<AiApprovalAssistant> {
  const source = buildAssistantSource(detail);

  if (!source.sourceText || source.citations.length === 0) {
    return insufficientAssistant(detail.generatedAt);
  }

  if (!isAiApprovalAssistantEnabled(user, options.enabled)) {
    return unavailableAssistant(
      detail.generatedAt,
      source.generatedFrom,
      "AI Approval Assistant chua kha dung cho user hoac scope hien tai.",
    );
  }

  if (!options.useProvider) {
    return buildLocalAdvisoryDraft(detail, source);
  }

  const wantsActionProposal = Boolean(
    options.createActionProposal &&
      can(user, "ai.propose_action") &&
      pickEnabledApprovalAction(detail),
  );
  const result = await (options.runAi ?? askAi)(
    {
      intent: "AI Approval Assistant",
      mode: "fast",
      module: "general",
      projectId: inferSingleProjectId(source.citations),
      prompt: buildPrompt(source),
      resourceRefs: buildResourceRefs(source.citations),
      useRag: false,
      wantsActionProposal,
    },
    user,
    options.gatewayOptions,
  ).catch(() => undefined);

  if (
    !result ||
    result.job.status !== "succeeded" ||
    !result.interaction.responseText
  ) {
    return unavailableAssistant(detail.generatedAt, source.generatedFrom);
  }

  const validatedCitations = mapAllowedProviderCitations(
    result.citations,
    source.citations,
  );

  if (
    validatedCitations.length === 0 ||
    validatedCitations.length !== result.citations.length
  ) {
    return insufficientAssistant(detail.generatedAt);
  }

  const generatedProposals = wantsActionProposal
    ? await createApprovalActionProposals({
        aiRepo: options.gatewayOptions?.aiRepo ?? aiRepository,
        citations: validatedCitations,
        detail,
        result,
        user,
      })
    : [];
  const visibleProposals = [
    ...result.actionProposals.filter(isApprovalActionProposal),
    ...generatedProposals,
  ]
    .filter((proposal) => isVisibleApprovalProposal(proposal, user, detail))
    .map((proposal) => mapApprovalProposal(proposal, detail));

  return {
    actionProposals: visibleProposals,
    citations: validatedCitations,
    generatedFrom: source.generatedFrom,
    interactionId: result.interaction.id,
    jobId: result.job.id,
    missingInformation: extractLines(
      result.interaction.responseText,
      ["missing", "thieu", "thieu thong tin", "can bo sung"],
    ),
    riskNotes: [
      ...extractLines(result.interaction.responseText, ["risk", "rui ro"]),
      ...source.riskNotes,
    ],
    status: "draft",
    suggestedQuestions: extractLines(
      result.interaction.responseText,
      ["question", "cau hoi", "hoi"],
    ),
    summaryText: result.interaction.responseText,
    updatedAt: result.interaction.completedAt ?? result.interaction.updatedAt,
  };
}

export function isAiApprovalAssistantEnabled(
  user: PermissionUser,
  enabled = true,
) {
  return enabled && can(user, "ai.ask");
}

function buildAssistantSource(detail: ApprovalCenterDetailData) {
  const citations = dedupeCitations([
    {
      href: approvalHref(detail),
      id: citationId(detail.source.sourceType, detail.source.sourceId),
      projectId: detail.requestSummary.projectId,
      sourceId: detail.source.sourceId,
      sourceType: detail.source.sourceType,
      title: detail.source.title,
    },
    ...detail.linkedSources
      .filter((source) => source.state === "linked")
      .map<AiApprovalAssistantCitation>((source) => ({
        href: source.href,
        id: citationId(source.entityType, source.entityId),
        projectId:
          source.entityType === "project"
            ? source.entityId
            : detail.requestSummary.projectId,
        sourceId: source.entityId,
        sourceType: source.entityType,
        title: source.label,
      })),
  ]);
  const generatedFrom = [
    "requestSummary",
    "policy",
    "linkedSources",
    detail.overdue ? "overdue" : undefined,
    detail.escalation ? "escalation" : undefined,
    detail.permissions.canViewAudit ? "history" : undefined,
  ].filter((item): item is string => Boolean(item));
  const lines = [
    `Approval: ${detail.source.code} - ${detail.source.title}`,
    `Trang thai: ${detail.source.status}`,
    `Loai: ${detail.source.categoryLabel}`,
    detail.requestSummary.summary
      ? `Tom tat request: ${detail.requestSummary.summary}`
      : undefined,
    `Scope: ${detail.requestSummary.scopeLabel}`,
    detail.requestSummary.projectName || detail.requestSummary.projectId
      ? `Project: ${detail.requestSummary.projectName ?? detail.requestSummary.projectId}`
      : undefined,
    `Module: ${detail.requestSummary.module}`,
    `Priority: ${detail.requestSummary.priority}`,
    detail.requestSummary.dueDate
      ? `Deadline: ${detail.requestSummary.dueDate}`
      : undefined,
    `Proposer: ${detail.requestSummary.proposer}`,
    detail.requestSummary.submittedBy
      ? `Submitted by: ${detail.requestSummary.submittedBy}`
      : undefined,
    detail.requestSummary.ownerName
      ? `Owner: ${detail.requestSummary.ownerName}`
      : undefined,
    detail.requestSummary.financialAccess === "allowed" &&
    detail.requestSummary.amountLabel
      ? `Amount: ${detail.requestSummary.amountLabel}`
      : `Financial access: ${detail.requestSummary.financialAccess}`,
    detail.policy
      ? [
          "Policy:",
          detail.policy.thresholdLabel
            ? `- Threshold: ${detail.policy.thresholdLabel}`
            : undefined,
          detail.policy.approvalLevel
            ? `- Approval level: ${detail.policy.approvalLevel}`
            : undefined,
          detail.policy.requiredPermission
            ? `- Required permission: ${detail.policy.requiredPermission}`
            : undefined,
          detail.policy.status ? `- Step status: ${detail.policy.status}` : undefined,
        ]
          .filter(Boolean)
          .join("\n")
      : undefined,
    detail.overdue
      ? `Overdue: ${detail.overdue.reason}. Next action: ${detail.overdue.nextAction}`
      : undefined,
    detail.escalation?.required
      ? `Escalation: ${detail.escalation.trigger}. ${detail.escalation.reason ?? ""}`
      : undefined,
    detail.linkedSources.some((source) => source.state === "linked")
      ? [
          "Linked sources duoc phep xem:",
          ...detail.linkedSources
            .filter((source) => source.state === "linked")
            .map((source) => `- ${source.entityType}:${source.entityId} ${source.label}`),
        ].join("\n")
      : undefined,
    detail.permissions.canViewAudit && detail.history.length > 0
      ? [
          "History da loc quyen:",
          ...detail.history.slice(0, 8).map((item) =>
            [
              `- ${item.kind}: ${item.label}`,
              item.version ? `v${item.version}` : undefined,
              item.previousStatus || item.nextStatus
                ? `${item.previousStatus ?? "-"} -> ${item.nextStatus ?? "-"}`
                : undefined,
              item.notes ? `notes: ${item.notes}` : undefined,
            ]
              .filter(Boolean)
              .join(" | "),
          ),
        ].join("\n")
      : undefined,
  ].filter((line): line is string => Boolean(line));
  const riskNotes = [
    detail.overdue?.reason,
    detail.escalation?.reason,
  ].filter((item): item is string => Boolean(item));

  return {
    citations,
    generatedFrom,
    riskNotes,
    sourceText: lines.join("\n").trim(),
  };
}

function buildPrompt(source: ReturnType<typeof buildAssistantSource>) {
  return [
    "AI Approval Assistant: tao tom tat advisory cho nguoi duyet.",
    "Chi dung context va citation duoc phep duoi day; neu thieu du lieu hay noi ro thieu thong tin.",
    "Khong tuyen bo da approve/reject/request-change/tao meeting. Chi duoc de xuat va can nguoi dung xac nhan.",
    "Khong dung web search, raw prompt, source bi an, hoac du lieu tai chinh bi gioi han.",
    "",
    "Context da loc quyen:",
    source.sourceText,
    "",
    "Citation duoc phep:",
    ...source.citations.map(
      (citation, index) =>
        `CIT-${String(index + 1).padStart(3, "0")}: ${citation.sourceType}:${citation.sourceId} - ${citation.title}`,
    ),
  ].join("\n");
}

function buildLocalAdvisoryDraft(
  detail: ApprovalCenterDetailData,
  source: ReturnType<typeof buildAssistantSource>,
): AiApprovalAssistant {
  const linkedSourceCount = detail.linkedSources.filter(
    (linkedSource) => linkedSource.state === "linked",
  ).length;
  const missingInformation = [
    detail.requestSummary.summary ? undefined : "Chua co tom tat request.",
    detail.policy ? undefined : "Chua co policy/step approval trong scope.",
    linkedSourceCount > 0
      ? undefined
      : "Chua co linked source co quyen xem de doi chieu.",
    detail.requestSummary.dueDate ? undefined : "Chua co deadline xu ly.",
    detail.overdue?.nextAction
      ? `Can lam ro next action: ${detail.overdue.nextAction}`
      : undefined,
  ].filter((item): item is string => Boolean(item));
  const suggestedQuestions = [
    detail.policy?.thresholdLabel
      ? `Policy ${detail.policy.thresholdLabel} da duoc doi chieu voi request chua?`
      : undefined,
    detail.overdue?.isOverdue
      ? "Thong tin nao dang chan approval qua han?"
      : undefined,
    linkedSourceCount > 0
      ? "Linked source nao la citation chinh cho quyet dinh nay?"
      : undefined,
    pickEnabledApprovalAction(detail)
      ? "Neu can bo sung thong tin, reason tra lai approval nen ghi ro dieu gi?"
      : undefined,
  ].filter((item): item is string => Boolean(item));

  return {
    actionProposals: [],
    citations: source.citations,
    generatedFrom: source.generatedFrom,
    missingInformation,
    riskNotes: source.riskNotes,
    status: "draft",
    suggestedQuestions,
    summaryText: [
      "Draft advisory tu approval context da loc quyen.",
      `Approval ${detail.source.code}: ${detail.source.title}.`,
      `Trang thai hien tai: ${detail.source.statusLabel}.`,
      detail.requestSummary.summary
        ? `Tom tat request: ${detail.requestSummary.summary}`
        : undefined,
      detail.policy?.approvalLevel
        ? `Cap duyet/policy: ${detail.policy.approvalLevel}.`
        : undefined,
      detail.overdue?.isOverdue
        ? `Can chu y overdue: ${detail.overdue.reason}`
        : undefined,
      "Chua co mutation nao duoc thuc thi; moi de xuat hanh dong can xac nhan rieng.",
    ]
      .filter((item): item is string => Boolean(item))
      .join(" "),
    updatedAt: detail.generatedAt,
  };
}

async function createApprovalActionProposals(input: {
  aiRepo: AiRepository;
  citations: AiApprovalAssistantCitation[];
  detail: ApprovalCenterDetailData;
  result: AiAskResult;
  user: PermissionUser;
}) {
  if (!mutableApprovalStatuses.has(input.detail.source.status)) {
    return [];
  }

  const action = pickEnabledApprovalAction(input.detail);

  if (!action) {
    return [];
  }

  const existing = await input.aiRepo.listActionProposals();
  const existingApprovalProposals = existing.filter((proposal) =>
    isReusableApprovalProposal(proposal, action, input.detail),
  );

  if (existingApprovalProposals.length > 0) {
    return existingApprovalProposals;
  }

  const timestamp =
    input.result.interaction.completedAt ??
    input.result.interaction.updatedAt ??
    new Date().toISOString();
  const proposal = buildApprovalProposal({
    action,
    citations: input.citations,
    detail: input.detail,
    interactionId: input.result.interaction.id,
    jobId: input.result.job.id,
    timestamp,
    user: input.user,
  });

  return input.aiRepo.createActionProposals([proposal]);
}

function buildApprovalProposal(input: {
  action: "request_change" | "ask_meeting";
  citations: AiApprovalAssistantCitation[];
  detail: ApprovalCenterDetailData;
  interactionId: string;
  jobId: string;
  timestamp: string;
  user: PermissionUser;
}): AiActionProposal {
  const sourceCitationIds = input.citations.map((citation) => citation.id);

  if (input.action === "request_change") {
    const reason =
      input.detail.overdue?.nextAction ??
      input.detail.requestSummary.summary ??
      "Can bo sung thong tin/citation truoc khi tiep tuc approval.";

    return {
      actionKey: "approval_request_change",
      createdAt: input.timestamp,
      id: randomUUID(),
      interactionId: input.interactionId,
      jobId: input.jobId,
      module: "general",
      projectId: input.detail.requestSummary.projectId,
      proposedPayload: {
        affectedFields: ["status", "currentStep"],
        approvalAction: "request_change",
        currentDecisionVersion: latestHistoryVersion(input.detail),
        currentStepId: input.detail.policy?.currentStepId,
        currentStepStatus: input.detail.policy?.status,
        currentStatus: input.detail.source.status,
        nextStatus: "change_requested",
        proposalId: input.detail.source.sourceId,
        reason,
        requiredPermission: "proposal.request_change",
        sourceCitationIds,
        sourceType: "proposal",
      },
      rationale: "AI chi de xuat tra lai approval de nguoi duyet xac nhan.",
      requestedBy: input.user.id,
      requiredPermission: "proposal.request_change",
      status: "proposed",
      targetEntityId: input.detail.source.sourceId,
      targetEntityType: "proposal",
      updatedAt: input.timestamp,
      workflowStatus: "DRAFT",
    };
  }

  const requiredPermission = resolveAskMeetingPermission(input.detail);
  const agendaDraft = [
    `Review approval ${input.detail.source.code}: ${input.detail.source.title}`,
    input.detail.requestSummary.summary,
    input.detail.policy?.thresholdLabel
      ? `Policy: ${input.detail.policy.thresholdLabel}`
      : undefined,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    actionKey: "approval_ask_meeting",
    createdAt: input.timestamp,
    id: randomUUID(),
    interactionId: input.interactionId,
    jobId: input.jobId,
    module: "general",
    projectId: input.detail.requestSummary.projectId,
    proposedPayload: {
      affectedFields: ["generatedLink"],
      agendaDraft,
      approvalAction: "ask_meeting",
      currentDecisionVersion: latestHistoryVersion(input.detail),
      currentStepId: input.detail.policy?.currentStepId,
      currentStepStatus: input.detail.policy?.status,
      currentStatus: input.detail.source.status,
      meetingType: "approval_review",
      nextStatus: "in_review",
      proposalId: input.detail.source.sourceId,
      requiredPermission,
      sourceCitationIds,
      sourceType: "proposal",
    },
    rationale: "AI chi de xuat tao yeu cau hop de nguoi duyet xac nhan.",
    requestedBy: input.user.id,
    requiredPermission,
    status: "proposed",
    targetEntityId: input.detail.source.sourceId,
    targetEntityType: "proposal",
    updatedAt: input.timestamp,
    workflowStatus: "DRAFT",
  };
}

function pickEnabledApprovalAction(detail: ApprovalCenterDetailData) {
  const enabled = detail.permissions.availableActions.filter(
    (action) => action.enabled,
  );

  if (enabled.some((action) => action.action === "request_change")) {
    return "request_change";
  }

  if (enabled.some((action) => action.action === "ask_meeting")) {
    return "ask_meeting";
  }

  return undefined;
}

function resolveAskMeetingPermission(detail: ApprovalCenterDetailData): PermissionAction {
  const permission = detail.policy?.requiredPermission
    ? normalizePermissionAction(detail.policy.requiredPermission as PermissionInput)
    : undefined;

  return permission ?? "proposal.approve";
}

function latestHistoryVersion(detail: ApprovalCenterDetailData) {
  const versions = detail.history
    .map((item) => item.version)
    .filter((version): version is number => typeof version === "number");

  return versions.length > 0 ? Math.max(...versions) : 0;
}

function unavailableAssistant(
  updatedAt: string,
  generatedFrom: string[],
  summaryText = "AI Approval Assistant tam thoi khong kha dung. Vui long dung request, policy va citation hien co de review.",
): AiApprovalAssistant {
  return {
    actionProposals: [],
    citations: [],
    generatedFrom,
    missingInformation: [],
    riskNotes: [],
    status: "unavailable",
    suggestedQuestions: [],
    summaryText,
    updatedAt,
  };
}

function insufficientAssistant(updatedAt: string): AiApprovalAssistant {
  return {
    actionProposals: [],
    citations: [],
    generatedFrom: [],
    missingInformation: ["Khong co citation hop le trong scope hien tai."],
    riskNotes: [],
    status: "insufficient_context",
    suggestedQuestions: [],
    summaryText: "Khong co du lieu trong scope hoac khong co citation hop le de tao AI Approval Assistant.",
    updatedAt,
  };
}

function approvalHref(detail: ApprovalCenterDetailData) {
  const base = `/approvals/proposal/${encodeURIComponent(detail.source.sourceId)}`;

  return detail.selectedScopeId && detail.selectedScopeId !== "all"
    ? `${base}?scopeId=${encodeURIComponent(detail.selectedScopeId)}`
    : base;
}

function citationId(sourceType: string, sourceId: string) {
  return `approval-source-${slug(sourceType)}-${slug(sourceId)}`;
}

function slug(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function dedupeCitations(citations: AiApprovalAssistantCitation[]) {
  const seen = new Set<string>();
  const unique: AiApprovalAssistantCitation[] = [];

  for (const citation of citations) {
    if (!citation.sourceId || !citation.sourceType) {
      continue;
    }

    const key = citationKey(citation);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(citation);
  }

  return unique;
}

function buildResourceRefs(
  citations: AiApprovalAssistantCitation[],
): AiResourceRef[] {
  return citations.map((citation) => ({
    entityId: citation.sourceId,
    entityType: citation.sourceType,
  }));
}

function inferSingleProjectId(citations: AiApprovalAssistantCitation[]) {
  const projectIds = new Set(
    citations
      .map((citation) =>
        citation.sourceType === "project"
          ? citation.sourceId
          : citation.projectId,
      )
      .filter((value): value is string => Boolean(value)),
  );

  return projectIds.size === 1 ? [...projectIds][0] : undefined;
}

function citationKey(citation: AiApprovalAssistantCitation) {
  return `${citation.sourceType}:${citation.sourceId}`;
}

function aiCitationKey(citation: AiCitation) {
  const sourceType = citation.entityType ?? citation.citationType;
  const sourceId =
    citation.entityId ??
    citation.knowledgeChunkId ??
    citation.knowledgeItemId ??
    citation.id;

  return `${sourceType}:${sourceId}`;
}

function mapAllowedProviderCitations(
  providerCitations: AiCitation[],
  allowedCitations: AiApprovalAssistantCitation[],
) {
  const allowedByKey = new Map(
    allowedCitations.map((citation) => [citationKey(citation), citation]),
  );

  return providerCitations
    .map((citation) => allowedByKey.get(aiCitationKey(citation)))
    .filter((citation): citation is AiApprovalAssistantCitation =>
      Boolean(citation),
    );
}

function isApprovalActionProposal(proposal: AiActionProposal) {
  return (
    proposal.actionKey === "approval_request_change" ||
    proposal.actionKey === "approval_ask_meeting"
  );
}

function isVisibleApprovalProposal(
  proposal: AiActionProposal,
  user: PermissionUser,
  detail: ApprovalCenterDetailData,
) {
  return (
    proposal.status === "proposed" &&
    (!proposal.workflowStatus || proposal.workflowStatus === "DRAFT") &&
    Boolean(strictApprovalAction(proposal.proposedPayload.approvalAction)) &&
    proposalMatchesApprovalDetail(proposal, detail) &&
    (can(user, proposal.requiredPermission) ||
      detailActionEnabledForProposal(proposal, detail))
  );
}

function proposalMatchesApprovalDetail(
  proposal: AiActionProposal,
  detail: ApprovalCenterDetailData,
) {
  const proposalId = readString(proposal.proposedPayload.proposalId);

  return (
    proposal.targetEntityType === "proposal" &&
    proposal.targetEntityId === detail.source.sourceId &&
    proposalId === detail.source.sourceId
  );
}

function detailActionEnabledForProposal(
  proposal: AiActionProposal,
  detail: ApprovalCenterDetailData,
) {
  const approvalAction = strictApprovalAction(
    proposal.proposedPayload.approvalAction,
  );

  return detail.permissions.availableActions.some(
    (action) => action.enabled && action.action === approvalAction,
  );
}

function mapApprovalProposal(
  proposal: AiActionProposal,
  detail: ApprovalCenterDetailData,
): AiApprovalAssistantActionProposal {
  const approvalAction = readApprovalAction(proposal.proposedPayload.approvalAction);

  return {
    actionKey: proposal.actionKey,
    affectedFields: readStringArray(proposal.proposedPayload.affectedFields),
    agendaDraft: readString(proposal.proposedPayload.agendaDraft),
    approvalAction,
    currentStatus: readString(proposal.proposedPayload.currentStatus),
    id: proposal.id,
    meetingType: readString(proposal.proposedPayload.meetingType),
    nextStatus: readString(proposal.proposedPayload.nextStatus),
    previewTitle:
      readString(proposal.proposedPayload.previewTitle) ??
      previewTitleFor(approvalAction, detail.source.title),
    rationale: proposal.rationale,
    reason: readString(proposal.proposedPayload.reason),
    requiredPermission: proposal.requiredPermission,
    returnToHref: approvalHref(detail),
    sourceCitationIds: readStringArray(proposal.proposedPayload.sourceCitationIds),
    status: proposal.status,
    targetEntityId: proposal.targetEntityId,
    targetEntityType: proposal.targetEntityType,
    workflowStatus: proposal.workflowStatus,
  };
}

function previewTitleFor(
  action: AiApprovalAssistantActionProposal["approvalAction"],
  title: string,
) {
  return action === "request_change"
    ? `Tra lai approval ${title}`
    : `Yeu cau hop cho approval ${title}`;
}

function extractLines(text: string, markers: string[]) {
  const normalizedMarkers = markers.map((marker) => marker.toLowerCase());

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => {
      const normalized = line.toLowerCase();

      return normalizedMarkers.some((marker) => normalized.includes(marker));
    })
    .slice(0, 5);
}

function readApprovalAction(value: unknown) {
  return value === "ask_meeting" ? "ask_meeting" : "request_change";
}

function strictApprovalAction(value: unknown) {
  return value === "request_change" || value === "ask_meeting"
    ? value
    : undefined;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isReusableApprovalProposal(
  proposal: AiActionProposal,
  action: "request_change" | "ask_meeting",
  detail: ApprovalCenterDetailData,
) {
  return (
    isApprovalActionProposal(proposal) &&
    proposal.status === "proposed" &&
    (!proposal.workflowStatus || proposal.workflowStatus === "DRAFT") &&
    proposalMatchesApprovalDetail(proposal, detail) &&
    strictApprovalAction(proposal.proposedPayload.approvalAction) === action &&
    readString(proposal.proposedPayload.currentStatus) === detail.source.status &&
    readString(proposal.proposedPayload.currentStepId) === detail.policy?.currentStepId &&
    readString(proposal.proposedPayload.currentStepStatus) === detail.policy?.status &&
    readNumber(proposal.proposedPayload.currentDecisionVersion) ===
      latestHistoryVersion(detail)
  );
}
