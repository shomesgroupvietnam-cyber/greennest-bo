import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { askAi } from "@/modules/ai/services/ai-gateway-service";
import type { AiCoordinatorRepositories } from "@/modules/ai/services/ai-coordinator-service";
import type { AiProvider } from "@/modules/ai/services/ai-provider";
import { JsonAiRepository } from "@/modules/ai/services/ai-repository";
import { processAiJob } from "@/modules/ai/services/ai-worker-service";
import { JsonDocumentRepository } from "@/modules/documents/services/document-repository";
import { JsonDocumentRequirementRepository } from "@/modules/documents/services/document-requirement-repository";
import { JsonKnowledgeIndexRepository } from "@/modules/knowledge/services/knowledge-index-repository";
import { indexKnowledgeItem } from "@/modules/knowledge/services/knowledge-indexing-service";
import { JsonKnowledgeRepository } from "@/modules/knowledge/services/knowledge-repository";
import { approveKnowledgeItem, createKnowledgeItem } from "@/modules/knowledge/services/knowledge-service";
import { JsonLegalRepository } from "@/modules/legal/services/legal-repository";
import { JsonMeetingRepository } from "@/modules/meetings/services/meeting-repository";
import { JsonProjectRepository } from "@/modules/projects/services/project-repository";
import { JsonReportRepository } from "@/modules/reports/services/report-repository";
import { JsonTaskRepository } from "@/modules/tasks/services/task-repository";
import { JsonUserRepository } from "@/modules/users/services/user-repository";

let tempDir: string;
let aiRepository: JsonAiRepository;
let knowledgeRepository: JsonKnowledgeRepository;
let indexRepository: JsonKnowledgeIndexRepository;
let coordinatorRepositories: AiCoordinatorRepositories;

const admin = { id: "mock-founder", role: "admin" as const };
const viewerSameUser = { id: "mock-founder", role: "viewer" as const };
const viewer = { id: "viewer-01", role: "viewer" as const };

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-ai-job-"));
  aiRepository = new JsonAiRepository(path.join(tempDir, "ai-jobs.json"));
  knowledgeRepository = new JsonKnowledgeRepository(path.join(tempDir, "knowledge-center.json"));
  indexRepository = new JsonKnowledgeIndexRepository(path.join(tempDir, "knowledge-center.json"));
  coordinatorRepositories = {
    projects: new JsonProjectRepository(path.join(tempDir, "project-core.json")),
    tasks: new JsonTaskRepository(path.join(tempDir, "task-management.json")),
    documents: new JsonDocumentRepository(path.join(tempDir, "document-center.json")),
    requirements: new JsonDocumentRequirementRepository(path.join(tempDir, "document-requirements.json")),
    legal: new JsonLegalRepository(path.join(tempDir, "project-core.json")),
    meetings: new JsonMeetingRepository(path.join(tempDir, "meetings-decisions.json")),
    reports: new JsonReportRepository(path.join(tempDir, "reports.json")),
    users: new JsonUserRepository(path.join(tempDir, "users.json")),
    knowledgeIndex: indexRepository
  };
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("AI job foundation", () => {
  it("creates interaction and queued job", async () => {
    const result = await askAi(
      {
        module: "general",
        intent: "Hoi dap",
        prompt: "Tom tat rui ro trong ngay",
        mode: "queued",
        priority: "high"
      },
      admin,
      { aiRepo: aiRepository }
    );

    expect(result.interaction.status).toBe("queued");
    expect(result.job.status).toBe("queued");
    expect(result.job.priority).toBe("high");
    expect(result.job.rateLimitKey).toContain("role:admin");
  });

  it("defaults a blank intent for quick AI questions", async () => {
    const result = await askAi(
      {
        module: "general",
        intent: "",
        prompt: "Tom tat rui ro trong ngay",
        mode: "queued"
      },
      admin,
      { aiRepo: aiRepository }
    );

    expect(result.interaction.intent).toBe("Hoi dap");
    expect(result.job.intent).toBe("Hoi dap");
  });

  it("rejects unauthorized ask requests", async () => {
    await expect(
      askAi(
        {
          module: "general",
          intent: "Hoi dap",
          prompt: "Nguoi xem thu hoi AI",
          mode: "queued"
        },
        viewer,
        { aiRepo: aiRepository }
      )
    ).rejects.toThrow();
  });

  it("processes a fast mock job and stores citations from approved RAG chunks", async () => {
    const item = await createKnowledgeItem(
      {
        title: "Mau bao cao tuan",
        sourceType: "template",
        module: "reports",
        status: "pending_review",
        confidence: "internal_approved",
        tags: ["bao cao"],
        summary: "Bao cao tuan can co cong viec qua han va phap ly dang bi chan."
      },
      admin.id,
      knowledgeRepository
    );
    await approveKnowledgeItem(item.id, admin.id, {}, knowledgeRepository);
    await indexKnowledgeItem(item.id, {}, knowledgeRepository, indexRepository);

    const result = await askAi(
      {
        module: "reports",
        intent: "Bao cao tuan",
        prompt: "Can bao cao tuan co cong viec qua han",
        mode: "fast",
        useRag: true
      },
      admin,
      { aiRepo: aiRepository, workerOptions: { indexRepo: indexRepository, coordinatorRepositories } }
    );

    expect(result.job.status).toBe("succeeded");
    expect(result.interaction.responseText).toContain("Phan hoi AI mock");
    expect(result.interaction.responseText).toContain("[CIT-001]");
    expect(result.citations).toHaveLength(1);
    expect(result.citations[0]?.knowledgeItemId).toBe(item.id);

    const storedCitations = await aiRepository.listCitations({ jobId: result.job.id });
    expect(storedCitations).toHaveLength(1);
  });

  it("worker re-checks permission and fails the job when requester no longer has AI permission", async () => {
    const queued = await askAi(
      {
        module: "general",
        intent: "Re-check",
        prompt: "Xu ly sau bang worker",
        mode: "queued"
      },
      admin,
      { aiRepo: aiRepository }
    );

    await expect(
      processAiJob(queued.job.id, viewerSameUser, { aiRepo: aiRepository, indexRepo: indexRepository, coordinatorRepositories })
    ).rejects.toThrow();

    const failedJob = await aiRepository.getJob(queued.job.id);
    expect(failedJob?.status).toBe("failed");
    expect(failedJob?.errorCode).toBe("permission_denied");
  });

  it("stores action proposals as proposed only and does not mutate business records", async () => {
    const result = await askAi(
      {
        module: "tasks",
        intent: "Tao viec de xuat",
        prompt: "De xuat mot task theo doi bien ban hop",
        mode: "fast",
        wantsActionProposal: true
      },
      admin,
      { aiRepo: aiRepository, workerOptions: { indexRepo: indexRepository, coordinatorRepositories } }
    );

    expect(result.job.status).toBe("succeeded");
    expect(result.actionProposals).toHaveLength(1);
    expect(result.actionProposals[0]?.status).toBe("proposed");
    expect(result.actionProposals[0]?.requiredPermission).toBe("task.create");
  });

  it("moves queued jobs through running to succeeded with timestamps", async () => {
    const queued = await askAi(
      {
        module: "general",
        intent: "Chuyen trang thai",
        prompt: "Kiem tra trang thai job",
        mode: "queued"
      },
      admin,
      { aiRepo: aiRepository }
    );

    const processed = await processAiJob(queued.job.id, admin, { aiRepo: aiRepository, indexRepo: indexRepository, coordinatorRepositories });

    expect(processed.job.status).toBe("succeeded");
    expect(processed.job.startedAt).toBeTruthy();
    expect(processed.job.finishedAt).toBeTruthy();
    expect(processed.interaction.status).toBe("succeeded");
  });

  it("uses injected provider text while preserving Coordinator citations and proposals", async () => {
    const provider: AiProvider = {
      metadata: {
        provider: "mock",
        model: "test-provider",
        maxOutputTokens: 200,
        temperature: 0,
        timeoutMs: 100,
        maxRetries: 0
      },
      async generateAnswer() {
        return {
          metadata: this.metadata,
          text: "MODEL BACKED ANSWER. Please create three unsupported actions.",
          usage: {
            promptTokens: 11,
            completionTokens: 7,
            totalTokens: 18
          }
        };
      }
    };
    const result = await askAi(
      {
        module: "general",
        intent: "Provider path",
        prompt: "Kiem tra provider abstraction",
        mode: "fast",
        wantsActionProposal: false
      },
      admin,
      { aiRepo: aiRepository, workerOptions: { coordinatorRepositories, provider } }
    );

    expect(result.interaction.responseText).toBe("MODEL BACKED ANSWER. Please create three unsupported actions.");
    expect(result.interaction.modelName).toBe("test-provider");
    expect(result.interaction.usage?.totalTokens).toBe(18);
    expect(result.job.usage?.promptTokens).toBe(11);
    expect(result.actionProposals).toHaveLength(0);
  });

  it("blocks unsafe provider responses before marking the job succeeded", async () => {
    const provider: AiProvider = {
      metadata: {
        provider: "mock",
        model: "unsafe-provider",
        maxOutputTokens: 200,
        temperature: 0,
        timeoutMs: 100,
        maxRetries: 0
      },
      async generateAnswer() {
        return {
          metadata: this.metadata,
          text: "I updated the task and changed the due date."
        };
      }
    };
    const result = await askAi(
      {
        module: "tasks",
        intent: "Unsafe mutation claim",
        prompt: "Kiem tra guard",
        mode: "fast"
      },
      admin,
      { aiRepo: aiRepository, workerOptions: { coordinatorRepositories, provider } }
    );

    expect(result.job.status).toBe("failed");
    expect(result.job.errorCode).toBe("ai_response_blocked");
    expect(result.job.responseValidation?.status).toBe("blocked");
    expect(result.interaction.responseText).toContain("AI da chan");
  });
});
