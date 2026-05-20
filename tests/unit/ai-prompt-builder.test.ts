import { describe, expect, it } from "vitest";

import { buildAiPromptPackage, AI_PROMPT_MODULE_PROFILES } from "@/modules/ai/services/ai-prompt-builder";
import type { AiJob } from "@/modules/ai/types";

describe("AI prompt builder", () => {
  it("includes RBAC, RAG and approved-knowledge guardrails", () => {
    const prompt = buildAiPromptPackage({
      job: buildJob({ module: "project", prompt: "Tong hop du an" }),
      routingPlan: routingPlan("project"),
      contextBlocks: [contextBlock("project", "Du an GN-A", "Du an dang active")],
      ragContext: "",
      citations: [],
      maxContextChars: 2000
    });

    expect(prompt.systemInstruction).toContain("loc theo quyen va scope");
    expect(prompt.systemInstruction).toContain("Knowledge Center da duyet/index");
    expect(prompt.systemInstruction).toContain("Khong bia citation");
    expect(prompt.systemInstruction).toContain("Tra loi ngan gon bang tieng Viet");
  });

  it("preserves citation ids and source metadata in packaged prompt", () => {
    const prompt = buildAiPromptPackage({
      job: buildJob({ module: "reports", prompt: "Can citation" }),
      routingPlan: routingPlan("reports"),
      contextBlocks: [contextBlock("reports", "Bao cao", "Snapshot demo")],
      ragContext: "Huong dan bao cao tuan",
      citations: [
        {
          citationType: "knowledge_chunk",
          entityType: "knowledge_chunk",
          entityId: "chunk-001",
          knowledgeItemId: "knowledge-001",
          knowledgeChunkId: "chunk-001",
          title: "Huong dan bao cao",
          sourceUrl: "https://example.test/report",
          module: "reports",
          projectId: "project-001",
          accessLevel: "internal"
        }
      ],
      maxContextChars: 2000
    });
    const userPrompt = prompt.messages.find((message) => message.role === "user")?.content ?? "";

    expect(prompt.citations[0]?.citationId).toBe("CIT-001");
    expect(userPrompt).toContain("[CIT-001]");
    expect(userPrompt).toContain("knowledgeItemId=knowledge-001");
    expect(userPrompt).toContain("knowledgeChunkId=chunk-001");
  });

  it("uses legal profile with caveat and citation requirement", () => {
    const prompt = buildAiPromptPackage({
      job: buildJob({ module: "legal", prompt: "Buoc phap ly nay co the ket luan chua?" }),
      routingPlan: routingPlan("legal"),
      contextBlocks: [],
      ragContext: "",
      citations: [],
      maxContextChars: 1000
    });

    expect(AI_PROMPT_MODULE_PROFILES.legal.requiresCitations).toBe(true);
    expect(prompt.systemInstruction).toContain("ho tro tham khao");
    expect(prompt.systemInstruction).toContain("Module nay yeu cau citation va caveat");
    expect(prompt.missingDataInstruction).toContain("Chua du du lieu duoc phep xem de ket luan");
  });

  it("packages context deterministically with structured context before broad RAG", () => {
    const prompt = buildAiPromptPackage({
      job: buildJob({ module: "project", prompt: "Can tom tat ngan" }),
      routingPlan: routingPlan("project"),
      contextBlocks: [
        contextBlock("tasks", "Cong viec", "Task quan trong"),
        contextBlock("project", "Du an", "Du an uu tien")
      ],
      ragContext: "RAG ".repeat(500),
      citations: [],
      maxContextChars: 120
    });

    expect(prompt.structuredContext).toContain("Du an uu tien");
    expect(prompt.contextBlocks[0]?.key).toBe("project");
    expect(prompt.ragContext).toContain("[context truncated]");
    expect(prompt.truncated).toBe(true);
  });

  it("instructs the model to say data is insufficient when context is missing", () => {
    const prompt = buildAiPromptPackage({
      job: buildJob({ module: "general", prompt: "Co du du lieu khong?" }),
      routingPlan: routingPlan("general"),
      contextBlocks: [],
      ragContext: "",
      citations: [],
      maxContextChars: 1000
    });
    const userPrompt = prompt.messages.find((message) => message.role === "user")?.content ?? "";

    expect(userPrompt).toContain("(khong co structured context trong scope)");
    expect(userPrompt).toContain("(khong co approved RAG context trong scope)");
    expect(userPrompt).toContain("tranh ket luan vuot qua nguon duoc cung cap");
  });
});

function buildJob(input: { module: AiJob["module"]; prompt: string }): AiJob {
  const now = "2026-05-17T00:00:00.000Z";

  return {
    id: "job-001",
    interactionId: "interaction-001",
    requestedBy: "mock-founder",
    module: input.module,
    intent: "Kiem thu prompt",
    mode: "queued",
    priority: "normal",
    status: "queued",
    scopeSnapshot: {
      userId: "mock-founder",
      role: "admin",
      permissions: [],
      scopeKind: "internal_full",
      module: input.module,
      resourceRefs: [],
      capturedAt: now
    },
    rateLimitKey: "test",
    payload: {
      prompt: input.prompt,
      intent: "Kiem thu prompt",
      useRag: input.module === "reports",
      wantsActionProposal: false,
      knowledgeModule: input.module === "documents" ? "documents" : input.module === "reports" ? "reports" : "general"
    },
    createdAt: now,
    updatedAt: now
  };
}

function routingPlan(primaryModule: AiJob["module"]) {
  return {
    intent: "Kiem thu prompt",
    primaryModule,
    supportingModules: [],
    toolKeys: []
  };
}

function contextBlock(key: string, title: string, content: string) {
  return {
    key,
    title,
    module: key === "project" ? ("project" as const) : key === "tasks" ? ("tasks" as const) : ("reports" as const),
    content,
    recordCount: 1
  };
}
