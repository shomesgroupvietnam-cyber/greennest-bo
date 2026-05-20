import type { AiContextBlock, AiRoutingPlan } from "./ai-coordinator-service";
import type { AiCitation, AiJob, AiModule } from "../types";

export type AiPromptModuleProfile = {
  module: AiModule;
  label: string;
  instruction: string;
  requiresCitations: boolean;
};

export type AiPromptCitation = {
  citationId: string;
  title: string;
  citationType: AiCitation["citationType"];
  module: AiCitation["module"];
  entityType?: string;
  entityId?: string;
  knowledgeItemId?: string;
  knowledgeChunkId?: string;
  sourceUrl?: string;
  projectId?: string;
  accessLevel?: string;
};

export type AiPromptPackage = {
  systemInstruction: string;
  roleModuleInstruction: string;
  userQuestion: string;
  structuredContext: string;
  ragContext: string;
  citations: AiPromptCitation[];
  guardrails: string[];
  responseFormat: string[];
  missingDataInstruction: string;
  contextBlocks: AiContextBlock[];
  maxContextChars: number;
  usedContextChars: number;
  truncated: boolean;
  messages: Array<{ role: "system" | "user"; content: string }>;
};

export type AiPromptBuilderInput = {
  job: AiJob;
  routingPlan: AiRoutingPlan;
  contextBlocks: AiContextBlock[];
  ragContext: string;
  citations: Array<Omit<AiCitation, "id" | "interactionId" | "jobId" | "createdAt">>;
  maxContextChars: number;
};

export const AI_PROMPT_MODULE_PROFILES: Record<AiModule, AiPromptModuleProfile> = {
  project: {
    module: "project",
    label: "Du an",
    instruction: "Tap trung vao tinh trang du an, rui ro, blockers, viec can uu tien va lien ket voi task/ho so/phap ly/cuoc hop.",
    requiresCitations: false
  },
  legal: {
    module: "legal",
    label: "Phap ly",
    instruction:
      "Noi dung phap ly phai neu ro day la ho tro tham khao, can citation khi dua ra nhan dinh va khong ket luan thay nguoi phu trach phap ly.",
    requiresCitations: true
  },
  documents: {
    module: "documents",
    label: "Ho so",
    instruction: "Tap trung vao tinh trang ho so, yeu cau con thieu, phien ban, trang thai phe duyet va viec can cap nhat.",
    requiresCitations: false
  },
  tasks: {
    module: "tasks",
    label: "Cong viec",
    instruction: "Tap trung vao viec qua han, viec sap den han, uu tien, nguoi phu trach va de xuat buoc tiep theo can xac nhan.",
    requiresCitations: false
  },
  meetings: {
    module: "meetings",
    label: "Cuoc hop",
    instruction: "Tap trung vao bien ban, quyet dinh, action items, nguoi phu trach va han xu ly.",
    requiresCitations: false
  },
  reports: {
    module: "reports",
    label: "Bao cao",
    instruction: "Tap trung vao snapshot bao cao, task qua han, ho so, phap ly, quyet dinh dang mo va cac rui ro quan tri.",
    requiresCitations: false
  },
  design: {
    module: "design",
    label: "Thiet ke",
    instruction: "Chi ho tro dinh huong thiet ke tu du lieu duoc cap; khong thay the kien truc su/ky su phe duyet.",
    requiresCitations: true
  },
  construction: {
    module: "construction",
    label: "Thi cong",
    instruction: "Chi ho tro dieu phoi/kiem tra thong tin thi cong; khong phe duyet nghiem thu hay chat luong.",
    requiresCitations: true
  },
  finance: {
    module: "finance",
    label: "Tai chinh",
    instruction: "Chi ho tro tham khao ve san sang thanh toan/ho so; khong phe duyet chi tra hay ket luan thue/phap ly.",
    requiresCitations: true
  },
  general: {
    module: "general",
    label: "Chung",
    instruction: "Tra loi tong hop trong pham vi du lieu duoc cung cap va noi ro khi can chuyen sang module chuyen trach.",
    requiresCitations: false
  }
};

const BASE_GUARDRAILS = [
  "Chi tra loi tu context da duoc ung dung loc theo quyen va scope cua nguoi dung.",
  "Khong suy doan hoac nhac den ban ghi, du an, ho so, task, phap ly, cuoc hop ma context khong cung cap.",
  "Chi coi Knowledge Center da duyet/index la nguon RAG co tham quyen; khong tu nhan chat/search/upload la tri thuc da duyet.",
  "Khong bia citation. Khi dung source, chi trich dan cac ma citation co trong danh sach Citation map.",
  "Khong tao hoac thuc thi thay doi du lieu. De xuat hanh dong, neu co, chi la de xuat can nguoi dung xac nhan.",
  "Neu du lieu thieu, het scope hoac khong du can cu, hay noi ro la chua du du lieu."
];

const RESPONSE_FORMAT = [
  "Tra loi ngan gon bang tieng Viet.",
  "Tach ro phan su kien tu context va phan khuyen nghi.",
  "Neu dung nguon, ghi ma citation nhu [CIT-001] gan voi nhan dinh lien quan.",
  "Neu khong co citation phu hop, noi ro can kiem tra them thay vi dua ket luan chac chan.",
  "Neu co rui ro/han che, neu trong mot muc rieng."
];

export function buildAiPromptPackage(input: AiPromptBuilderInput): AiPromptPackage {
  const profile = AI_PROMPT_MODULE_PROFILES[input.job.module] ?? AI_PROMPT_MODULE_PROFILES.general;
  const budgetedContext = packageContext(input.contextBlocks, input.ragContext, {
    primaryModule: input.routingPlan.primaryModule,
    maxContextChars: input.maxContextChars
  });
  const citations = input.citations.map((citation, index) => ({
    citationId: `CIT-${String(index + 1).padStart(3, "0")}`,
    title: citation.title,
    citationType: citation.citationType,
    module: citation.module,
    entityType: citation.entityType,
    entityId: citation.entityId,
    knowledgeItemId: citation.knowledgeItemId,
    knowledgeChunkId: citation.knowledgeChunkId,
    sourceUrl: citation.sourceUrl,
    projectId: citation.projectId,
    accessLevel: citation.accessLevel
  }));
  const roleModuleInstruction = buildRoleModuleInstruction(input.job, profile);
  const guardrails = profile.requiresCitations
    ? [...BASE_GUARDRAILS, "Module nay yeu cau citation va caveat khi dua ra nhan dinh chuyen mon."]
    : BASE_GUARDRAILS;
  const systemInstruction = buildSystemInstruction(roleModuleInstruction, guardrails, RESPONSE_FORMAT);
  const userPrompt = buildUserPrompt({
    job: input.job,
    routingPlan: input.routingPlan,
    structuredContext: budgetedContext.structuredContext,
    ragContext: budgetedContext.ragContext,
    citations,
    missingDataInstruction: missingDataInstruction(profile),
    truncated: budgetedContext.truncated
  });

  return {
    systemInstruction,
    roleModuleInstruction,
    userQuestion: input.job.payload.prompt,
    structuredContext: budgetedContext.structuredContext,
    ragContext: budgetedContext.ragContext,
    citations,
    guardrails,
    responseFormat: RESPONSE_FORMAT,
    missingDataInstruction: missingDataInstruction(profile),
    contextBlocks: budgetedContext.contextBlocks,
    maxContextChars: input.maxContextChars,
    usedContextChars: budgetedContext.usedContextChars,
    truncated: budgetedContext.truncated,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: userPrompt }
    ]
  };
}

function packageContext(
  contextBlocks: AiContextBlock[],
  ragContext: string,
  options: { primaryModule: AiModule; maxContextChars: number }
) {
  const selectedBlocks: AiContextBlock[] = [];
  let usedContextChars = 0;
  let truncated = false;
  const structuredBlocks = prioritizeContextBlocks(
    contextBlocks.filter((block) => block.key !== "knowledge"),
    options.primaryModule
  );

  for (const block of structuredBlocks) {
    const blockText = formatContextBlock(block);
    const nextLength = usedContextChars + blockText.length;

    if (nextLength > options.maxContextChars) {
      truncated = true;
      break;
    }

    selectedBlocks.push(block);
    usedContextChars = nextLength;
  }

  const remainingChars = Math.max(options.maxContextChars - usedContextChars, 0);
  const ragContextSlice = remainingChars > 0 ? sliceAtBoundary(ragContext, remainingChars) : "";

  if (ragContextSlice.length < ragContext.length) {
    truncated = true;
  }

  usedContextChars += ragContextSlice.length;

  const knowledgeBlock = contextBlocks.find((block) => block.key === "knowledge");
  const packagedBlocks =
    ragContextSlice.length > 0
      ? [
          ...selectedBlocks,
          {
            key: "knowledge",
            title: knowledgeBlock?.title ?? "Tri thuc da duyet",
            module: knowledgeBlock?.module ?? options.primaryModule,
            content: ragContextSlice,
            recordCount: knowledgeBlock?.recordCount ?? 1
          }
        ]
      : selectedBlocks;

  return {
    contextBlocks: packagedBlocks,
    structuredContext: selectedBlocks.map(formatContextBlock).join("\n\n"),
    ragContext: ragContextSlice,
    usedContextChars,
    truncated
  };
}

function prioritizeContextBlocks(blocks: AiContextBlock[], primaryModule: AiModule) {
  const order: Record<string, number> = {
    project: 0,
    [primaryModule]: 1,
    tasks: 2,
    documents: 3,
    legal: 4,
    meetings: 5,
    reports: 6
  };

  return [...blocks].sort((a, b) => (order[a.key] ?? 20) - (order[b.key] ?? 20));
}

function buildSystemInstruction(roleModuleInstruction: string, guardrails: string[], responseFormat: string[]) {
  return [
    "Ban la Coordinator AI cua GreenNest BuildFlow.",
    roleModuleInstruction,
    "",
    "Guardrails:",
    ...guardrails.map((guardrail) => `- ${guardrail}`),
    "",
    "Dinh dang phan hoi:",
    ...responseFormat.map((rule) => `- ${rule}`)
  ].join("\n");
}

function buildRoleModuleInstruction(job: AiJob, profile: AiPromptModuleProfile) {
  return [
    `Module chinh: ${profile.label} (${profile.module}).`,
    `Vai tro hien tai: ${job.scopeSnapshot.role}. Scope: ${job.scopeSnapshot.scopeKind}.`,
    job.projectId ? `Du an dang hoi: ${job.projectId}.` : "Khong co du an cu the trong request.",
    profile.instruction
  ].join(" ");
}

function buildUserPrompt(input: {
  job: AiJob;
  routingPlan: AiRoutingPlan;
  structuredContext: string;
  ragContext: string;
  citations: AiPromptCitation[];
  missingDataInstruction: string;
  truncated: boolean;
}) {
  return [
    `Cau hoi nguoi dung: ${input.job.payload.prompt}`,
    `Intent: ${input.job.intent}`,
    `Routing: primary=${input.routingPlan.primaryModule}; support=${input.routingPlan.supportingModules.join(", ") || "none"}`,
    input.truncated ? "Luu y: context da duoc cat theo budget, can neu ro neu thieu du lieu." : undefined,
    "",
    "Structured context da loc quyen:",
    input.structuredContext || "(khong co structured context trong scope)",
    "",
    "Approved RAG context:",
    input.ragContext || "(khong co approved RAG context trong scope)",
    "",
    "Citation map:",
    input.citations.map(formatCitation).join("\n") || "(khong co citation kha dung)",
    "",
    "Huong dan khi thieu du lieu:",
    input.missingDataInstruction
  ]
    .filter(Boolean)
    .join("\n");
}

function formatContextBlock(block: AiContextBlock) {
  return [`## ${block.title}`, `Module: ${block.module}`, `Record count: ${block.recordCount}`, block.content].join("\n");
}

function formatCitation(citation: AiPromptCitation) {
  return [
    `[${citation.citationId}] ${citation.title}`,
    `type=${citation.citationType}`,
    citation.entityId ? `entityId=${citation.entityId}` : undefined,
    citation.knowledgeItemId ? `knowledgeItemId=${citation.knowledgeItemId}` : undefined,
    citation.knowledgeChunkId ? `knowledgeChunkId=${citation.knowledgeChunkId}` : undefined,
    citation.sourceUrl ? `url=${citation.sourceUrl}` : undefined
  ]
    .filter(Boolean)
    .join(" | ");
}

function missingDataInstruction(profile: AiPromptModuleProfile) {
  if (profile.requiresCitations) {
    return "Neu khong co citation/du lieu duoc duyet du de tra loi, hay noi: 'Chua du du lieu duoc phep xem de ket luan' va de xuat buoc kiem tra tiep theo.";
  }

  return "Neu context khong co du lieu can thiet, hay noi ro phan nao chua du du lieu va tranh ket luan vuot qua nguon duoc cung cap.";
}

function sliceAtBoundary(text: string, maxChars: number) {
  if (text.length <= maxChars) {
    return text;
  }

  const sliced = text.slice(0, Math.max(maxChars - 20, 0));
  const lastBreak = Math.max(sliced.lastIndexOf("\n"), sliced.lastIndexOf(". "), sliced.lastIndexOf("; "));

  return `${sliced.slice(0, lastBreak > 100 ? lastBreak : sliced.length).trim()}... [context truncated]`;
}
