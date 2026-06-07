import { randomUUID } from "node:crypto";

import { can, type PermissionUser } from "@/lib/permissions/can";
import type { Meeting, MeetingAttachment } from "@/modules/meetings/types";

import type {
  AiActionProposal,
  AiAskInput,
  AiAskResult,
  AiCitation,
  AiMeetingSummary,
  AiMeetingSummaryActionProposal,
  AiMeetingSummaryCitation,
  AiResourceRef,
} from "../types";
import { aiRepository, type AiRepository } from "./ai-repository";
import { askAi, type AiGatewayOptions } from "./ai-gateway-service";

export type AiMeetingSummaryVisibleRelatedRecordInput = {
  href?: string;
  id: string;
  label: string;
  type: string;
};

export type AiMeetingSummaryVisibleAttachmentInput = Pick<
  MeetingAttachment,
  "documentId" | "id" | "name" | "url"
>;

export type AiMeetingSummarySourceInput = {
  generatedAt: string;
  meeting: Meeting;
  returnToHref?: string;
  visibleAttachments?: AiMeetingSummaryVisibleAttachmentInput[];
  visibleProjectIds?: string[];
  visibleRelatedRecords?: AiMeetingSummaryVisibleRelatedRecordInput[];
};

export type AiMeetingSummaryRunAi = (
  input: AiAskInput,
  user: PermissionUser,
  options?: AiGatewayOptions,
) => Promise<AiAskResult>;

export type AiMeetingSummaryBuildOptions = {
  enabled?: boolean;
  useProvider?: boolean;
  createActionProposal?: boolean;
  runAi?: AiMeetingSummaryRunAi;
  gatewayOptions?: AiGatewayOptions;
};

export async function buildAiMeetingSummaryDraft(
  user: PermissionUser,
  input: AiMeetingSummarySourceInput,
  options: AiMeetingSummaryBuildOptions = {},
): Promise<AiMeetingSummary> {
  const source = buildMeetingSummarySource(input);

  if (!source.hasSummarizableContent || !source.sourceText) {
    return insufficientSummary(input.generatedAt);
  }

  if (!isAiMeetingSummaryEnabled(user, options.enabled)) {
    return unavailableSummary(
      input.generatedAt,
      source.generatedFrom,
      "AI Meeting Summary chua kha dung cho user hoac scope hien tai.",
    );
  }

  if (!options.useProvider) {
    const actionProposals = await listReusableMeetingActionProposalRecords(
      options.gatewayOptions?.aiRepo ?? aiRepository,
      user,
      input,
    );

    return {
      actionProposals: actionProposals.map((proposal) =>
        mapMeetingProposal(proposal, input),
      ),
      citations: source.citations,
      generatedFrom: source.generatedFrom,
      status: "placeholder",
      text:
        input.meeting.aiSummary.content?.trim() ||
        "Meeting AI Summary chua goi provider. Bam tao ban nhap AI de sinh draft co citation.",
      updatedAt: input.generatedAt,
    };
  }

  const wantsActionProposal = canCreateMeetingActionProposal(
    user,
    options.createActionProposal,
  );
  const result = await (options.runAi ?? askAi)(
    {
      intent: "AI Meeting Summary",
      mode: "fast",
      module: "meetings",
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
    return unavailableSummary(input.generatedAt, source.generatedFrom);
  }

  const validatedCitations = mapAllowedProviderCitations(
    result.citations,
    source.citations,
  );

  if (
    validatedCitations.length === 0 ||
    validatedCitations.length !== result.citations.length
  ) {
    return insufficientSummary(input.generatedAt);
  }

  const generatedProposals = wantsActionProposal
    ? await createMeetingActionProposals({
        aiRepo: options.gatewayOptions?.aiRepo ?? aiRepository,
        citations: validatedCitations,
        input,
        result,
        user,
      })
    : [];

  return {
    actionProposals: [
      ...result.actionProposals,
      ...generatedProposals,
    ]
      .filter((proposal) => isVisibleMeetingProposal(proposal, user, input))
      .map((proposal) => mapMeetingProposal(proposal, input)),
    citations: validatedCitations,
    generatedFrom: source.generatedFrom,
    interactionId: result.interaction.id,
    jobId: result.job.id,
    status: "draft",
    text: result.interaction.responseText,
    updatedAt: result.interaction.completedAt ?? result.interaction.updatedAt,
  };
}

export function isAiMeetingSummaryEnabled(
  user: PermissionUser,
  enabled = true,
) {
  return enabled && (can(user, "ai.ask") || can(user, "ai.create_draft"));
}

function buildMeetingSummarySource(input: AiMeetingSummarySourceInput) {
  const meeting = input.meeting;
  const hasMinutes = Boolean(meeting.meetingMinutes?.trim());
  const hasTranscript = Boolean(meeting.transcript?.trim());
  const meetingDecisions = meeting.decisions ?? [];
  const meetingFollowUps = meeting.followUpActions ?? [];
  const visibleProjectIds = dedupeStrings(input.visibleProjectIds ?? []);
  const citationProjectId =
    visibleProjectIds.length === 1 ? visibleProjectIds[0] : undefined;
  const citations = dedupeCitations([
    {
      href: `/meetings/${meeting.id}`,
      id: citationId("meeting", meeting.id),
      projectId: citationProjectId,
      sourceId: meeting.id,
      sourceType: "meeting",
      title: meeting.title,
    },
    ...visibleProjectIds.map<AiMeetingSummaryCitation>((projectId) => ({
      href: `/projects/${projectId}`,
      id: citationId("project", projectId),
      projectId,
      sourceId: projectId,
      sourceType: "project",
      title: `Project ${projectId}`,
    })),
    ...meetingDecisions.map<AiMeetingSummaryCitation>((decision) => ({
      id: citationId("decision", decision.id),
      projectId: citationProjectId,
      sourceId: decision.id,
      sourceType: "decision",
      title: decision.decisionText,
    })),
    ...meetingFollowUps.map<AiMeetingSummaryCitation>((action) => ({
      id: citationId("meeting_follow_up", action.id),
      projectId: citationProjectId,
      sourceId: action.id,
      sourceType: "meeting_follow_up",
      title: action.title,
    })),
    ...(input.visibleRelatedRecords ?? []).map<AiMeetingSummaryCitation>(
      (record) => ({
        href: record.href,
        id: citationId(record.type, record.id),
        projectId: citationProjectId,
        sourceId: record.id,
        sourceType: record.type,
        title: record.label,
      }),
    ),
    ...(input.visibleAttachments ?? []).map<AiMeetingSummaryCitation>(
      (attachment) => ({
        href: attachment.url,
        id: citationId(
          attachment.documentId ? "document" : "meeting_attachment",
          attachment.documentId ?? attachment.id,
        ),
        projectId: citationProjectId,
        sourceId: attachment.documentId ?? attachment.id,
        sourceType: attachment.documentId ? "document" : "meeting_attachment",
        title: attachment.name,
      }),
    ),
  ]);
  const generatedFrom = [
    "meeting",
    hasMinutes ? "minutes" : undefined,
    hasTranscript ? "transcript" : undefined,
    input.visibleAttachments?.length ? "attachments" : undefined,
    input.visibleRelatedRecords?.length ? "related_records" : undefined,
    meetingDecisions.length ? "decisions" : undefined,
    meetingFollowUps.length ? "follow_up_actions" : undefined,
  ].filter((item): item is string => Boolean(item));
  const sourceText = [
    `Meeting: ${meeting.title}`,
    `Trạng thái: ${meeting.status}`,
    `Scope: ${meeting.visibility}`,
    meeting.agenda ? `Agenda: ${meeting.agenda}` : undefined,
    hasMinutes ? `Meeting minutes:\n${meeting.meetingMinutes}` : undefined,
    hasTranscript ? `Transcript:\n${meeting.transcript}` : undefined,
    meeting.aiSummary.content
      ? `Existing AI summary status: ${meeting.aiSummary.status}`
      : `Existing AI summary status: ${meeting.aiSummary.status}`,
    meetingDecisions.length
      ? [
          "Visible meeting decisions:",
          ...meetingDecisions.map(
            (decision) =>
              `- decision:${decision.id} ${decision.decisionText} (${decision.status})`,
          ),
        ].join("\n")
      : undefined,
    meetingFollowUps.length
      ? [
          "Visible meeting follow-up actions:",
          ...meetingFollowUps.map(
            (action) =>
              `- follow_up:${action.id} ${action.title} (${action.status ?? "open"})`,
          ),
        ].join("\n")
      : undefined,
    input.visibleRelatedRecords?.length
      ? [
          "Visible related records:",
          ...input.visibleRelatedRecords.map(
            (record) => `- ${record.type}:${record.id} ${record.label}`,
          ),
        ].join("\n")
      : undefined,
    input.visibleAttachments?.length
      ? [
          "Visible attachments:",
          ...input.visibleAttachments.map((attachment) =>
            [
              `- ${attachment.name}`,
              attachment.documentId ? `document ${attachment.documentId}` : undefined,
              attachment.url ? "external_url" : undefined,
            ]
              .filter(Boolean)
              .join(" | "),
          ),
        ].join("\n")
      : undefined,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n")
    .trim();

  return {
    citations,
    generatedFrom,
    hasSummarizableContent: hasMinutes || hasTranscript,
    sourceText,
  };
}

function buildPrompt(source: ReturnType<typeof buildMeetingSummarySource>) {
  return [
    "AI Meeting Summary: tao tom tat cuoc hop dang Draft/goi y.",
    "Chi dung context va citation da loc quyen ben duoi.",
    "Khong publish official minutes, khong noi nhu da approve, khong tao task/risk/decision truc tiep.",
    "Neu thieu du lieu hoac citation, hay noi ro thieu du lieu.",
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

async function createMeetingActionProposals(input: {
  aiRepo: AiRepository;
  citations: AiMeetingSummaryCitation[];
  input: AiMeetingSummarySourceInput;
  result: AiAskResult;
  user: PermissionUser;
}) {
  const reusable = await listReusableMeetingActionProposalRecords(
    input.aiRepo,
    input.user,
    input.input,
  );

  if (reusable.length > 0) {
    return reusable;
  }

  const timestamp =
    input.result.interaction.completedAt ??
    input.result.interaction.updatedAt ??
    new Date().toISOString();
  const sourceCitationIds = input.citations.map((citation) => citation.id);
  const meeting = input.input.meeting;
  const projectId = inferSingleProjectId(input.citations);
  const proposal: AiActionProposal = {
    actionKey: "create_meeting_action_item",
    createdAt: timestamp,
    id: randomUUID(),
    interactionId: input.result.interaction.id,
    jobId: input.result.job.id,
    module: "meetings",
    projectId,
    proposedPayload: {
      affectedFields: ["decisions"],
      currentAiSummaryStatus: meeting.aiSummary.status,
      currentMeetingUpdatedAt: meeting.updatedAt,
      decisionText: summaryToActionItem(input.result.interaction.responseText ?? ""),
      meetingId: meeting.id,
      requiredPermission: "decision.create",
      returnToHref: input.input.returnToHref,
      sourceCitationIds,
      targetEntityType: "meeting",
      title: `Action item tu AI summary: ${meeting.title}`,
    },
    rationale:
      "AI chi de xuat action item tu meeting summary; can nguoi dung xac nhan truoc khi tao decision/action item.",
    requestedBy: input.user.id,
    requiredPermission: "decision.create",
    status: "proposed",
    targetEntityId: meeting.id,
    targetEntityType: "meeting",
    updatedAt: timestamp,
    workflowStatus: "DRAFT",
  };

  return input.aiRepo.createActionProposals([proposal]);
}

async function listReusableMeetingActionProposalRecords(
  aiRepo: AiRepository,
  user: PermissionUser,
  input: AiMeetingSummarySourceInput,
) {
  const existing = await aiRepo.listActionProposals();

  return existing.filter(
    (proposal) =>
      isReusableMeetingProposal(proposal, input) &&
      isVisibleMeetingProposal(proposal, user, input),
  );
}

function isVisibleMeetingProposal(
  proposal: AiActionProposal,
  user: PermissionUser,
  input: AiMeetingSummarySourceInput,
) {
  return (
    proposal.status === "proposed" &&
    (!proposal.workflowStatus || proposal.workflowStatus === "DRAFT") &&
    proposal.targetEntityType === "meeting" &&
    proposal.targetEntityId === input.meeting.id &&
    isValidMeetingProposalPayload(proposal, input) &&
    can(user, proposal.requiredPermission)
  );
}

function mapMeetingProposal(
  proposal: AiActionProposal,
  input: AiMeetingSummarySourceInput,
): AiMeetingSummaryActionProposal {
  return {
    actionKey: proposal.actionKey,
    affectedFields: readStringArray(proposal.proposedPayload.affectedFields),
    id: proposal.id,
    previewTitle:
      readString(proposal.proposedPayload.title) ??
      `De xuat cho meeting ${input.meeting.title}`,
    rationale: proposal.rationale,
    requiredPermission: proposal.requiredPermission,
    returnToHref:
      readString(proposal.proposedPayload.returnToHref) ?? input.returnToHref,
    sourceCitationIds: readStringArray(
      proposal.proposedPayload.sourceCitationIds,
    ),
    status: proposal.status,
    targetEntityId: proposal.targetEntityId,
    targetEntityType: proposal.targetEntityType,
    workflowStatus: proposal.workflowStatus,
  };
}

function isReusableMeetingProposal(
  proposal: AiActionProposal,
  input: AiMeetingSummarySourceInput,
) {
  return (
    proposal.actionKey === "create_meeting_action_item" &&
    proposal.status === "proposed" &&
    (!proposal.workflowStatus || proposal.workflowStatus === "DRAFT") &&
    proposal.targetEntityType === "meeting" &&
    proposal.targetEntityId === input.meeting.id &&
    isValidMeetingProposalPayload(proposal, input)
  );
}

function isValidMeetingProposalPayload(
  proposal: AiActionProposal,
  input: AiMeetingSummarySourceInput,
) {
  const payload = proposal.proposedPayload;
  const expectedMeetingCitationId = citationId("meeting", input.meeting.id);

  return (
    readString(payload.meetingId) === input.meeting.id &&
    readString(payload.requiredPermission) === "decision.create" &&
    readString(payload.targetEntityType) === "meeting" &&
    readString(payload.currentAiSummaryStatus) === input.meeting.aiSummary.status &&
    readString(payload.currentMeetingUpdatedAt) === input.meeting.updatedAt &&
    readStringArray(payload.affectedFields).includes("decisions") &&
    readStringArray(payload.sourceCitationIds).includes(expectedMeetingCitationId)
  );
}

function canCreateMeetingActionProposal(
  user: PermissionUser,
  requested = false,
) {
  return Boolean(
    requested &&
      can(user, "ai.propose_action") &&
      can(user, "decision.create"),
  );
}

function insufficientSummary(updatedAt: string): AiMeetingSummary {
  return {
    actionProposals: [],
    citations: [],
    generatedFrom: [],
    status: "insufficient_context",
    text: "Khong co minutes/transcript trong scope hoac khong co citation hop le de tao AI Meeting Summary.",
    updatedAt,
  };
}

function unavailableSummary(
  updatedAt: string,
  generatedFrom: string[],
  text = "AI Meeting Summary tam thoi khong kha dung. Vui long dung meeting minutes/transcript va citation hien co de review.",
): AiMeetingSummary {
  return {
    actionProposals: [],
    citations: [],
    generatedFrom,
    status: "unavailable",
    text,
    updatedAt,
  };
}

function dedupeCitations(citations: AiMeetingSummaryCitation[]) {
  const seen = new Set<string>();
  const unique: AiMeetingSummaryCitation[] = [];

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
  citations: AiMeetingSummaryCitation[],
): AiResourceRef[] {
  return citations.map((citation) => ({
    entityId: citation.sourceId,
    entityType: citation.sourceType,
  }));
}

function inferSingleProjectId(citations: AiMeetingSummaryCitation[]) {
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

function mapAllowedProviderCitations(
  providerCitations: AiCitation[],
  allowedCitations: AiMeetingSummaryCitation[],
) {
  const allowedByKey = new Map(
    allowedCitations.map((citation) => [citationKey(citation), citation]),
  );

  return providerCitations
    .map((citation) => allowedByKey.get(aiCitationKey(citation)))
    .filter((citation): citation is AiMeetingSummaryCitation =>
      Boolean(citation),
    );
}

function citationKey(citation: AiMeetingSummaryCitation) {
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

function citationId(sourceType: string, sourceId: string) {
  if (sourceType === "meeting") {
    return `meeting-source-${slug(sourceId)}`;
  }

  return `meeting-source-${slug(sourceType)}-${slug(sourceId)}`;
}

function slug(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function summaryToActionItem(text: string) {
  const normalized = text.trim().replace(/\s+/g, " ");

  return normalized.length > 240
    ? `${normalized.slice(0, 237)}...`
    : normalized || "Action item tu AI Meeting Summary";
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : [];
}

function dedupeStrings(values: string[]) {
  return [
    ...new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  ];
}
