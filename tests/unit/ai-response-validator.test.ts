import { describe, expect, it } from "vitest";

import { buildAiPromptPackage } from "@/modules/ai/services/ai-prompt-builder";
import { applyResponseWarnings, safeFallbackForBlockedResponse, validateAiResponse } from "@/modules/ai/services/ai-response-validator";
import type { AiJob } from "@/modules/ai/types";

describe("AI response validator", () => {
  it("allows responses with valid citation ids", () => {
    const promptPackage = promptWithCitation("legal");
    const result = validateAiResponse({
      responseText: "Buoc phap ly dang bi chan theo checklist [CIT-001].",
      module: "legal",
      promptPackage
    });

    expect(result.status).toBe("valid");
  });

  it("blocks unknown citation ids", () => {
    const result = validateAiResponse({
      responseText: "Noi dung nay dua tren nguon [CIT-999].",
      module: "project",
      promptPackage: promptWithCitation("project")
    });

    expect(result.status).toBe("blocked");
    expect(result.reasons[0]?.code).toBe("unknown_citation");
  });

  it("blocks legal factual answers without citations", () => {
    const result = validateAiResponse({
      responseText: "Du an co the nop ho so phap ly ngay.",
      module: "legal",
      promptPackage: promptWithCitation("legal")
    });

    expect(result.status).toBe("blocked");
    expect(result.reasons.some((reason) => reason.code === "citation_required")).toBe(true);
  });

  it("does not block missing-data legal answers without citations", () => {
    const result = validateAiResponse({
      responseText: "Chua du du lieu duoc phep xem de ket luan. Can kiem tra them ho so phap ly.",
      module: "legal",
      promptPackage: promptWithCitation("legal")
    });

    expect(result.status).toBe("valid");
  });

  it("blocks claims about unapproved sources", () => {
    const result = validateAiResponse({
      responseText: "Theo nguon chua duyet, quy dinh nay da thay doi.",
      module: "documents",
      promptPackage: promptWithCitation("documents")
    });

    expect(result.status).toBe("blocked");
    expect(result.reasons.some((reason) => reason.code === "unapproved_source_claim")).toBe(true);
  });

  it("blocks web search claims when no web source was provided", () => {
    const result = validateAiResponse({
      responseText: "Theo web search moi nhat, du an can bo sung ho so.",
      module: "project",
      promptPackage: promptWithCitation("project", { sourceUrl: undefined })
    });

    expect(result.status).toBe("blocked");
    expect(result.reasons.some((reason) => reason.code === "web_search_claim")).toBe(true);
  });

  it("blocks unsafe mutation claims", () => {
    const result = validateAiResponse({
      responseText: "I updated the task and changed the due date.",
      module: "tasks",
      promptPackage: promptWithCitation("tasks")
    });

    expect(result.status).toBe("blocked");
    expect(result.reasons.some((reason) => reason.code === "unsafe_mutation_claim")).toBe(true);
  });

  it("allows proposal-only mutation language", () => {
    const result = validateAiResponse({
      responseText: "I propose creating a task. Can nguoi dung xac nhan truoc khi ghi du lieu.",
      module: "tasks",
      promptPackage: promptWithCitation("tasks")
    });

    expect(result.status).toBe("valid");
  });

  it("builds fallback and warning wrapper", () => {
    const blocked = validateAiResponse({
      responseText: "I updated the task.",
      module: "tasks",
      promptPackage: promptWithCitation("tasks")
    });
    const warned = {
      status: "warning" as const,
      checkedAt: "2026-05-17T00:00:00.000Z",
      reasons: [{ code: "citation_required" as const, severity: "warning" as const, message: "Can citation." }]
    };

    expect(safeFallbackForBlockedResponse(blocked)).toContain("AI da chan");
    expect(applyResponseWarnings("Noi dung", warned)).toContain("Luu y");
  });
});

function promptWithCitation(module: AiJob["module"], citationOverrides: { sourceUrl?: string } = {}) {
  return buildAiPromptPackage({
    job: buildJob(module),
    routingPlan: {
      intent: "Kiem thu validator",
      primaryModule: module,
      supportingModules: [],
      toolKeys: []
    },
    contextBlocks: [
      {
        key: module,
        title: "Context demo",
        module,
        content: "Ban ghi demo da duoc loc scope.",
        recordCount: 1
      }
    ],
    ragContext: "Tri thuc da duyet demo.",
    citations: [
      {
        citationType: "knowledge_chunk",
        entityType: "knowledge_chunk",
        entityId: "chunk-001",
        knowledgeItemId: "knowledge-001",
        knowledgeChunkId: "chunk-001",
        title: "Nguon da duyet",
        sourceUrl: Object.prototype.hasOwnProperty.call(citationOverrides, "sourceUrl")
          ? citationOverrides.sourceUrl
          : "https://example.test/approved",
        module,
        projectId: "project-001",
        accessLevel: "internal"
      }
    ],
    maxContextChars: 2000
  });
}

function buildJob(module: AiJob["module"]): AiJob {
  const now = "2026-05-17T00:00:00.000Z";

  return {
    id: "job-001",
    interactionId: "interaction-001",
    requestedBy: "mock-founder",
    module,
    intent: "Kiem thu validator",
    mode: "queued",
    priority: "normal",
    status: "queued",
    scopeSnapshot: {
      userId: "mock-founder",
      role: "admin",
      permissions: [],
      scopeKind: "internal_full",
      module,
      resourceRefs: [],
      capturedAt: now
    },
    rateLimitKey: "test",
    payload: {
      prompt: "Kiem thu validator",
      intent: "Kiem thu validator",
      useRag: true,
      wantsActionProposal: false,
      knowledgeModule: module === "documents" ? "documents" : module === "reports" ? "reports" : "general"
    },
    createdAt: now,
    updatedAt: now
  };
}
