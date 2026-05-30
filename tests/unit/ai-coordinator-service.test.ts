import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_LEGAL_STEPS } from "@/constants/legal-steps";
import {
  classifyIntentAndRoute,
  runAiCoordinator,
  type AiCoordinatorRepositories
} from "@/modules/ai/services/ai-coordinator-service";
import type { AiJob } from "@/modules/ai/types";
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
let projectRepository: JsonProjectRepository;
let taskRepository: JsonTaskRepository;
let documentRepository: JsonDocumentRepository;
let requirementRepository: JsonDocumentRequirementRepository;
let legalRepository: JsonLegalRepository;
let meetingRepository: JsonMeetingRepository;
let reportRepository: JsonReportRepository;
let userRepository: JsonUserRepository;
let knowledgeRepository: JsonKnowledgeRepository;
let knowledgeIndexRepository: JsonKnowledgeIndexRepository;
let repositories: AiCoordinatorRepositories;

const admin = { id: "mock-founder", role: "admin" as const };
const contractor = { id: "contractor-01", role: "nha_thau" as const, permissions: ["ai.ask" as const] };
const viewer = { id: "viewer-01", role: "viewer" as const, permissions: ["ai.ask" as const] };

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-ai-coordinator-"));
  const projectCorePath = path.join(tempDir, "project-core.json");
  const knowledgePath = path.join(tempDir, "knowledge-center.json");

  projectRepository = new JsonProjectRepository(projectCorePath);
  legalRepository = new JsonLegalRepository(projectCorePath);
  taskRepository = new JsonTaskRepository(path.join(tempDir, "task-management.json"));
  documentRepository = new JsonDocumentRepository(path.join(tempDir, "document-center.json"));
  requirementRepository = new JsonDocumentRequirementRepository(path.join(tempDir, "document-requirements.json"));
  meetingRepository = new JsonMeetingRepository(path.join(tempDir, "meetings-decisions.json"));
  reportRepository = new JsonReportRepository(path.join(tempDir, "reports.json"));
  userRepository = new JsonUserRepository(path.join(tempDir, "users.json"));
  knowledgeRepository = new JsonKnowledgeRepository(knowledgePath);
  knowledgeIndexRepository = new JsonKnowledgeIndexRepository(knowledgePath);
  repositories = {
    projects: projectRepository,
    tasks: taskRepository,
    documents: documentRepository,
    requirements: requirementRepository,
    legal: legalRepository,
    meetings: meetingRepository,
    reports: reportRepository,
    users: userRepository,
    knowledgeIndex: knowledgeIndexRepository
  };

  await seedCoordinatorData();
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("AI Coordinator service", () => {
  it("routes by requested module and intent keywords", () => {
    const plan = classifyIntentAndRoute(
      buildJob({
        module: "project",
        intent: "Risk summary",
        prompt: "Why is this project blocked and what documents are missing?"
      })
    );

    expect(plan.primaryModule).toBe("project");
    expect(plan.supportingModules).toEqual(expect.arrayContaining(["tasks", "documents", "legal", "meetings", "reports"]));
  });

  it("assembles cross-module context for an internal user", async () => {
    const result = await runAiCoordinator(
      buildJob({
        module: "project",
        projectId: "project-assigned",
        intent: "Tong hop du an",
        prompt: "Tong hop risk, task qua han, ho so thieu, phap ly va meeting"
      }),
      admin,
      repositories
    );
    const blockKeys = result.contextBlocks.map((block) => block.key);

    expect(blockKeys).toEqual(expect.arrayContaining(["project", "tasks", "documents", "legal", "meetings", "reports"]));
    expect(result.responseText).toContain("Coordinator");
    expect(result.responseText).toContain("Context module");
    expect(result.citations.some((citation) => citation.entityType === "project")).toBe(true);
  });

  it("limits contractor context to assigned project/task/document records", async () => {
    const result = await runAiCoordinator(
      buildJob({
        module: "project",
        intent: "Contractor view",
        prompt: "Show my assigned package context"
      }),
      contractor,
      repositories
    );
    const combinedContext = result.contextBlocks.map((block) => block.content).join("\n");

    expect(combinedContext).toContain("Du an duoc gan");
    expect(combinedContext).toContain("Task nha thau");
    expect(combinedContext).toContain("Ho so nha thau");
    expect(combinedContext).not.toContain("Du an an");
    expect(combinedContext).not.toContain("Task noi bo");
    expect(result.contextBlocks.find((block) => block.key === "legal")).toBeUndefined();
    expect(result.promptPackage.messages.map((message) => message.content).join("\n")).not.toContain("Du an an");
    expect(result.promptPackage.roleModuleInstruction).toContain("Scope:");
  });

  it("keeps viewer read-only and does not create action proposals", async () => {
    const result = await runAiCoordinator(
      buildJob({
        module: "project",
        projectId: "project-assigned",
        intent: "Viewer summary",
        prompt: "Summarize allowed project and propose an action",
        wantsActionProposal: true
      }),
      viewer,
      repositories
    );

    expect(result.contextBlocks.some((block) => block.key === "project")).toBe(true);
    expect(result.actionProposals).toHaveLength(0);
  });

  it("preserves approved RAG citations", async () => {
    const item = await createKnowledgeItem(
      {
        title: "Huong dan bao cao dieu hanh",
        sourceType: "template",
        module: "reports",
        status: "pending_review",
        confidence: "internal_approved",
        tags: ["bao cao"],
        summary: "Bao cao dieu hanh can neu task qua han, ho so thieu va buoc phap ly bi chan."
      },
      admin.id,
      knowledgeRepository
    );
    await approveKnowledgeItem(item.id, admin.id, {}, knowledgeRepository);
    await indexKnowledgeItem(item.id, {}, knowledgeRepository, knowledgeIndexRepository);

    const result = await runAiCoordinator(
      buildJob({
        module: "reports",
        projectId: "project-assigned",
        intent: "Bao cao tuan",
        prompt: "Can mau bao cao task qua han va ho so thieu",
        useRag: true
      }),
      admin,
      repositories
    );

    expect(result.citations.some((citation) => citation.citationType === "knowledge_chunk" && citation.knowledgeItemId === item.id)).toBe(true);
    expect(result.contextBlocks.some((block) => block.key === "knowledge")).toBe(true);
  });

  it("creates proposed-only action plans without mutating task data", async () => {
    const beforeTasks = await taskRepository.listTasks();
    const result = await runAiCoordinator(
      buildJob({
        module: "tasks",
        projectId: "project-assigned",
        intent: "Tao de xuat task",
        prompt: "De xuat task follow up",
        wantsActionProposal: true
      }),
      admin,
      repositories
    );
    const afterTasks = await taskRepository.listTasks();

    expect(result.actionProposals).toHaveLength(1);
    expect(result.actionProposals[0]?.status).toBe("proposed");
    expect(afterTasks).toHaveLength(beforeTasks.length);
  });
});

async function seedCoordinatorData() {
  const now = new Date().toISOString();
  const legalStep = DEFAULT_LEGAL_STEPS[0];

  await projectRepository.createProject(
    {
      id: "project-assigned",
      code: "GN-A",
      name: "Du an duoc gan",
      location: "Thu Duc",
      projectType: "nha_o",
      investor: "GreenNest",
      status: "active",
      createdAt: now,
      updatedAt: now
    },
    [
      {
        id: "legal-assigned",
        projectId: "project-assigned",
        stepCode: legalStep.code,
        stepName: legalStep.name,
        status: "blocked",
        dueDate: "2026-05-20",
        notes: "Can bo sung ho so",
        createdAt: now,
        updatedAt: now
      }
    ]
  );
  await projectRepository.createProject(
    {
      id: "project-hidden",
      code: "GN-H",
      name: "Du an an",
      status: "active",
      createdAt: now,
      updatedAt: now
    },
    []
  );
  await taskRepository.createTask({
    id: "task-contractor",
    projectId: "project-assigned",
    title: "Task nha thau",
    assigneeId: contractor.id,
    dueDate: "2026-05-15",
    status: "todo",
    priority: "high",
    category: "construction",
    createdAt: now,
    updatedAt: now
  });
  await taskRepository.createTask({
    id: "task-hidden",
    projectId: "project-hidden",
    title: "Task noi bo",
    assigneeId: "internal-user",
    dueDate: "2026-05-18",
    status: "todo",
    priority: "urgent",
    category: "internal",
    createdAt: now,
    updatedAt: now
  });
  await documentRepository.createDocument({
    id: "document-contractor",
    projectId: "project-assigned",
    title: "Ho so nha thau",
    docType: "contractor_package",
    version: "1.0",
    status: "needs_update",
    ownerId: contractor.id,
    approvalStatus: "rejected",
    createdAt: now,
    updatedAt: now
  });
  await documentRepository.createDocument({
    id: "document-hidden",
    projectId: "project-hidden",
    title: "Ho so noi bo",
    docType: "internal",
    version: "1.0",
    status: "complete",
    ownerId: "internal-user",
    approvalStatus: "approved",
    createdAt: now,
    updatedAt: now
  });
  await requirementRepository.upsertRequirement({
    id: "requirement-001",
    projectType: "nha_o",
    requirementCode: "REQ-CONTRACTOR",
    requirementName: "Ho so nha thau",
    docType: "contractor_package",
    isRequired: true,
    orderIndex: 1,
    createdAt: now,
    updatedAt: now
  });
  await meetingRepository.createMeeting({
    id: "meeting-001",
    organizationId: "org-001",
    projectId: "project-assigned",
    projectIds: ["project-assigned"],
    axisId: "axis-1",
    departmentId: "project",
    title: "Hop tien do",
    meetingType: "PROJECT_MEETING",
    visibility: "project",
    participantScope: "project_team",
    status: "COMPLETED",
    meetingDate: now,
    startTime: now,
    participants: [],
    externalParticipants: [],
    attachments: [],
    aiSummary: { status: "DRAFT" },
    decisions: [],
    followUpActions: [],
    relatedApprovals: [],
    relatedTasks: [],
    auditLog: [],
    summary: "Can theo doi ho so nha thau",
    createdBy: admin.id,
    createdAt: now,
    updatedAt: now
  });
  await meetingRepository.createDecision({
    id: "decision-001",
    meetingId: "meeting-001",
    projectId: "project-assigned",
    decisionText: "Bo sung ho so nha thau",
    ownerId: contractor.id,
    dueDate: "2026-05-19",
    status: "open",
    createdAt: now,
    updatedAt: now
  });
  await reportRepository.createReport({
    id: "report-001",
    projectId: "project-assigned",
    reportType: "weekly_project_summary",
    title: "Bao cao tuan demo",
    generatedBy: admin.id,
    generatedAt: now,
    snapshot: {
      project: {
        id: "project-assigned",
        code: "GN-A",
        name: "Du an duoc gan",
        status: "active",
        createdAt: now,
        updatedAt: now
      },
      summary: {
        totalTasks: 1,
        overdueTasks: 1,
        upcomingTasks: 0,
        missingDocuments: 0,
        needsUpdateDocuments: 1,
        rejectedDocuments: 1,
        documentReadinessRatio: 0,
        blockedLegalSteps: 1,
        waitingAuthorityLegalSteps: 0,
        meetings: 1,
        pendingDecisions: 1
      },
      tasks: { overdue: [], upcoming: [] },
      documents: { missing: [], needsUpdate: [], rejectedOrNeedsUpdateRecords: [], readiness: emptyReadiness("project-assigned") },
      legal: { blocked: [], waitingAuthority: [] },
      meetings: [],
      generatedFrom: {
        taskCount: 1,
        documentCount: 1,
        legalStepCount: 1,
        meetingCount: 1,
        decisionCount: 1
      }
    }
  });
  await userRepository.upsertProjectMembership({
    id: "membership-contractor",
    projectId: "project-assigned",
    userId: contractor.id,
    role: "nha_thau",
    createdAt: now,
    updatedAt: now
  });
  await userRepository.upsertProjectMembership({
    id: "membership-viewer",
    projectId: "project-assigned",
    userId: viewer.id,
    role: "viewer",
    createdAt: now,
    updatedAt: now
  });
}

function buildJob(input: {
  module: AiJob["module"];
  projectId?: string;
  intent: string;
  prompt: string;
  useRag?: boolean;
  wantsActionProposal?: boolean;
}): AiJob {
  const now = new Date().toISOString();

  return {
    id: "job-test",
    interactionId: "interaction-test",
    requestedBy: admin.id,
    projectId: input.projectId,
    module: input.module,
    intent: input.intent,
    mode: "queued",
    priority: "normal",
    status: "queued",
    scopeSnapshot: {
      userId: admin.id,
      role: admin.role,
      permissions: [],
      scopeKind: "internal_full",
      module: input.module,
      projectId: input.projectId,
      resourceRefs: [],
      capturedAt: now
    },
    rateLimitKey: "test",
    payload: {
      prompt: input.prompt,
      intent: input.intent,
      useRag: input.useRag ?? false,
      wantsActionProposal: input.wantsActionProposal ?? false,
      knowledgeModule: input.module === "reports" ? "reports" : "project"
    },
    createdAt: now,
    updatedAt: now
  };
}

function emptyReadiness(projectId: string) {
  return {
    projectId,
    projectType: "nha_o",
    requiredCount: 0,
    completedRequiredCount: 0,
    submittedRequiredCount: 0,
    missingRequirements: [],
    needsUpdateRequirements: [],
    items: [],
    completionRatio: 0
  };
}
