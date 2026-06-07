import { can, type PermissionUser } from "@/lib/permissions/can";

import type {
  AiActionProposal,
  AiAskInput,
  AiAskResult,
  AiCitation,
  AiResourceRef,
  ExecutiveAiSummary,
  ExecutiveAiSummaryActionProposal,
  ExecutiveAiSummaryCitation,
} from "../types";
import { askAi, type AiGatewayOptions } from "./ai-gateway-service";

export type ExecutiveAiSummaryView = "morning_briefing" | "private_workspace";

export type ExecutiveAiSummarySourceInput = {
  view: ExecutiveAiSummaryView;
  sourceText: string;
  citations: ExecutiveAiSummaryCitation[];
  generatedFrom: string[];
  generatedAt: string;
};

export type ExecutiveAiSummaryRunAi = (
  input: AiAskInput,
  user: PermissionUser,
  options?: AiGatewayOptions,
) => Promise<AiAskResult>;

export type ExecutiveAiSummaryBuildOptions = {
  enabled?: boolean;
  useProvider?: boolean;
  createActionProposal?: boolean;
  runAi?: ExecutiveAiSummaryRunAi;
  gatewayOptions?: AiGatewayOptions;
};

export async function buildExecutiveAiSummaryDraft(
  user: PermissionUser,
  source: ExecutiveAiSummarySourceInput,
  options: ExecutiveAiSummaryBuildOptions = {},
): Promise<ExecutiveAiSummary> {
  const citations = dedupeSummaryCitations(source.citations);
  const sourceText = source.sourceText.trim();
  const resourceRefs = buildResourceRefs(citations);
  const projectId = inferSingleProjectId(citations);

  if (!sourceText || citations.length === 0) {
    return insufficientSummary(source.generatedAt);
  }

  if (!isExecutiveAiSummaryEnabled(user, options.enabled)) {
    return {
      actionProposals: [],
      citations: [],
      generatedFrom: source.generatedFrom,
      status: "unavailable",
      text: "AI Summary chua kha dung cho user hoac scope hien tai.",
      updatedAt: source.generatedAt,
    };
  }

  if (!options.useProvider) {
    return {
      actionProposals: [],
      citations,
      generatedFrom: source.generatedFrom,
      status: "placeholder",
      text: sourceText,
      updatedAt: source.generatedAt,
    };
  }

  const wantsActionProposal = Boolean(
    options.createActionProposal && can(user, "ai.propose_action"),
  );
  const result = await (options.runAi ?? askAi)(
    {
      intent: "Executive AI Summary",
      mode: "fast",
      module: "general",
      prompt: buildPrompt(source, citations),
      projectId,
      resourceRefs,
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
    return unavailableSummary(source.generatedAt, source.generatedFrom);
  }

  const validatedCitations = mapAllowedProviderCitations(
    result.citations,
    citations,
  );

  if (
    validatedCitations.length === 0 ||
    validatedCitations.length !== result.citations.length
  ) {
    return insufficientSummary(source.generatedAt);
  }

  return {
    actionProposals: wantsActionProposal
      ? result.actionProposals
          .filter((proposal) => isVisibleAdvisoryProposal(proposal, user))
          .map(mapActionProposal)
      : [],
    citations: validatedCitations,
    generatedFrom: source.generatedFrom,
    interactionId: result.interaction.id,
    jobId: result.job.id,
    status: "draft",
    text: result.interaction.responseText,
    updatedAt: result.interaction.completedAt ?? result.interaction.updatedAt,
  };
}

export function isExecutiveAiSummaryEnabled(
  user: PermissionUser,
  enabled = true,
) {
  return (
    enabled &&
    (can(user, "ai.ask") ||
      can(user, "ai.view_insight") ||
      can(user, "ai.create_draft"))
  );
}

function insufficientSummary(updatedAt: string): ExecutiveAiSummary {
  return {
    actionProposals: [],
    citations: [],
    generatedFrom: [],
    status: "insufficient_context",
    text: "Khong co du lieu trong scope hoac khong co citation hop le de tao AI Summary.",
    updatedAt,
  };
}

function unavailableSummary(
  updatedAt: string,
  generatedFrom: string[],
): ExecutiveAiSummary {
  return {
    actionProposals: [],
    citations: [],
    generatedFrom,
    status: "unavailable",
    text: "AI Summary tam thoi khong kha dung. Vui long dung du lieu va citation hien co de kiem tra tiep.",
    updatedAt,
  };
}

function buildPrompt(
  source: ExecutiveAiSummarySourceInput,
  citations: ExecutiveAiSummaryCitation[],
) {
  return [
    `Executive AI Summary view: ${source.view}`,
    "Hay tao ban tom tat ngan gon, o trang thai draft/goi y.",
    "Chi dung context va citation duoi day; neu thieu context hay noi ro thieu du lieu.",
    "Khong dua vao ban tom tat bat ky ban ghi nao ngoai danh sach citation duoc phep.",
    "",
    "Ngữ cảnh đã lọc quyền:",
    source.sourceText,
    "",
    "Citation duoc phep:",
    ...citations.map(
      (citation, index) =>
        `CIT-${String(index + 1).padStart(3, "0")}: ${citation.sourceType}:${citation.sourceId} - ${citation.title}`,
    ),
  ].join("\n");
}

function dedupeSummaryCitations(citations: ExecutiveAiSummaryCitation[]) {
  const seen = new Set<string>();
  const unique: ExecutiveAiSummaryCitation[] = [];

  for (const citation of citations) {
    const key = `${citation.sourceType}:${citation.sourceId}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(citation);
  }

  return unique;
}

function buildResourceRefs(
  citations: ExecutiveAiSummaryCitation[],
): AiResourceRef[] {
  return citations.map((citation) => ({
    entityId: citation.sourceId,
    entityType: citation.sourceType,
  }));
}

function inferSingleProjectId(citations: ExecutiveAiSummaryCitation[]) {
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

function citationKey(citation: ExecutiveAiSummaryCitation) {
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
  allowedCitations: ExecutiveAiSummaryCitation[],
) {
  const allowedByKey = new Map(
    allowedCitations.map((citation) => [citationKey(citation), citation]),
  );

  return providerCitations
    .map((citation) => allowedByKey.get(aiCitationKey(citation)))
    .filter((citation): citation is ExecutiveAiSummaryCitation =>
      Boolean(citation),
    );
}

function isVisibleAdvisoryProposal(
  proposal: AiActionProposal,
  user: PermissionUser,
) {
  return (
    proposal.status === "proposed" &&
    (!proposal.workflowStatus || proposal.workflowStatus === "DRAFT") &&
    can(user, proposal.requiredPermission)
  );
}

function mapActionProposal(
  proposal: AiActionProposal,
): ExecutiveAiSummaryActionProposal {
  return {
    actionKey: proposal.actionKey,
    id: proposal.id,
    projectId: proposal.projectId,
    rationale: proposal.rationale,
    requiredPermission: proposal.requiredPermission,
    status: proposal.status,
    targetEntityType: proposal.targetEntityType,
    title: readString(proposal.proposedPayload.title) ?? proposal.actionKey,
    workflowStatus: proposal.workflowStatus,
  };
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}
