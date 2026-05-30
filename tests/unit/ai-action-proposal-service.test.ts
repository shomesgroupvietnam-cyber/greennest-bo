import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { AiActionProposal } from "@/modules/ai/types";
import {
  acceptAiActionProposal,
  rejectAiActionProposal,
  type AiActionProposalServiceRepositories
} from "@/modules/ai/services/ai-action-proposal-service";
import { JsonAiRepository } from "@/modules/ai/services/ai-repository";
import { JsonDocumentRepository } from "@/modules/documents/services/document-repository";
import { JsonLegalRepository } from "@/modules/legal/services/legal-repository";
import { JsonMeetingRepository } from "@/modules/meetings/services/meeting-repository";
import { JsonProjectRepository } from "@/modules/projects/services/project-repository";
import { JsonTaskRepository } from "@/modules/tasks/services/task-repository";
import { JsonUserRepository } from "@/modules/users/services/user-repository";

let tempDir: string;
let aiRepository: JsonAiRepository;
let projectRepository: JsonProjectRepository;
let taskRepository: JsonTaskRepository;
let documentRepository: JsonDocumentRepository;
let legalRepository: JsonLegalRepository;
let meetingRepository: JsonMeetingRepository;
let userRepository: JsonUserRepository;
let repositories: AiActionProposalServiceRepositories;

const admin = { id: "mock-founder", role: "admin" as const };
const viewer = { id: "viewer-01", role: "viewer" as const };

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-ai-proposal-"));
  const projectPath = path.join(tempDir, "project-core.json");

  aiRepository = new JsonAiRepository(path.join(tempDir, "ai-jobs.json"));
  projectRepository = new JsonProjectRepository(projectPath);
  legalRepository = new JsonLegalRepository(projectPath);
  taskRepository = new JsonTaskRepository(path.join(tempDir, "task-management.json"));
  documentRepository = new JsonDocumentRepository(path.join(tempDir, "document-center.json"));
  meetingRepository = new JsonMeetingRepository(path.join(tempDir, "meetings-decisions.json"));
  userRepository = new JsonUserRepository(path.join(tempDir, "users.json"));
  repositories = {
    ai: aiRepository,
    projects: projectRepository,
    tasks: taskRepository,
    documents: documentRepository,
    legal: legalRepository,
    meetings: meetingRepository,
    users: userRepository
  };
  await seedDomainData();
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("AI action proposal review and confirm", () => {
  it("accepts create_task proposal through task service", async () => {
    const [proposal] = await aiRepository.createActionProposals([
      buildProposal("proposal-task", {
        actionKey: "create_task",
        requiredPermission: "task.create",
        targetEntityType: "task",
        proposedPayload: {
          projectId: "project-001",
          title: "Task duoc chap nhan tu AI",
          description: "Theo doi sau hop",
          priority: "high",
          category: "ai"
        }
      })
    ]);

    const updated = await acceptAiActionProposal(proposal.id, admin, { decisionNotes: "OK" }, repositories);
    const tasks = await taskRepository.listTasks({ projectId: "project-001" });

    expect(updated.status).toBe("accepted");
    expect(updated.decidedBy).toBe(admin.id);
    expect(tasks.some((task) => task.title === "Task duoc chap nhan tu AI")).toBe(true);
  });

  it("rejects proposals without mutating domain records", async () => {
    const [proposal] = await aiRepository.createActionProposals([
      buildProposal("proposal-reject", {
        actionKey: "create_task",
        requiredPermission: "task.create",
        targetEntityType: "task",
        proposedPayload: {
          projectId: "project-001",
          title: "Task khong duoc tao"
        }
      })
    ]);
    const beforeTasks = await taskRepository.listTasks();

    const updated = await rejectAiActionProposal(proposal.id, admin, { decisionNotes: "Chua can" }, repositories);
    const afterTasks = await taskRepository.listTasks();

    expect(updated.status).toBe("rejected");
    expect(afterTasks).toHaveLength(beforeTasks.length);
  });

  it("blocks unauthorized accept attempts", async () => {
    const [proposal] = await aiRepository.createActionProposals([
      buildProposal("proposal-unauthorized", {
        actionKey: "create_task",
        requiredPermission: "task.create",
        targetEntityType: "task",
        proposedPayload: {
          projectId: "project-001",
          title: "Viewer khong duoc tao"
        }
      })
    ]);

    await expect(acceptAiActionProposal(proposal.id, viewer, {}, repositories)).rejects.toThrow();
    expect((await aiRepository.getActionProposal(proposal.id))?.status).toBe("proposed");
  });

  it("accepts request_document_update through document service", async () => {
    const [proposal] = await aiRepository.createActionProposals([
      buildProposal("proposal-document", {
        actionKey: "request_document_update",
        requiredPermission: "document.update",
        targetEntityType: "document",
        targetEntityId: "document-001",
        proposedPayload: {
          documentId: "document-001"
        }
      })
    ]);

    const updated = await acceptAiActionProposal(proposal.id, admin, {}, repositories);
    const document = await documentRepository.getDocument("document-001");

    expect(updated.status).toBe("accepted");
    expect(document?.status).toBe("needs_update");
  });

  it("accepts update_legal_note and appends notes", async () => {
    const [proposal] = await aiRepository.createActionProposals([
      buildProposal("proposal-legal", {
        actionKey: "update_legal_note",
        requiredPermission: "legal.update",
        targetEntityType: "legal_step",
        targetEntityId: "legal-001",
        proposedPayload: {
          legalStepId: "legal-001",
          notes: "Can gui cong van bo sung"
        }
      })
    ]);

    const updated = await acceptAiActionProposal(proposal.id, admin, {}, repositories);
    const legalStep = await legalRepository.getLegalStep("legal-001");

    expect(updated.status).toBe("accepted");
    expect(legalStep?.notes).toContain("Can gui cong van bo sung");
  });

  it("accepts create_meeting_action_item through meeting decision service", async () => {
    const [proposal] = await aiRepository.createActionProposals([
      buildProposal("proposal-meeting", {
        actionKey: "create_meeting_action_item",
        requiredPermission: "decision.create",
        targetEntityType: "meeting",
        targetEntityId: "meeting-001",
        proposedPayload: {
          meetingId: "meeting-001",
          decisionText: "Bo sung action item tu AI"
        }
      })
    ]);

    const updated = await acceptAiActionProposal(proposal.id, admin, {}, repositories);
    const decisions = await meetingRepository.listDecisions({ meetingId: "meeting-001" });

    expect(updated.status).toBe("accepted");
    expect(decisions.some((decision) => decision.decisionText === "Bo sung action item tu AI")).toBe(true);
  });
});

async function seedDomainData() {
  const now = new Date().toISOString();

  await projectRepository.createProject(
    {
      id: "project-001",
      code: "GN-001",
      name: "Du an AI proposal",
      status: "active",
      createdAt: now,
      updatedAt: now
    },
    [
      {
        id: "legal-001",
        projectId: "project-001",
        stepCode: "land_survey",
        stepName: "Khao sat quy dat",
        status: "in_progress",
        notes: "Ghi chu hien tai",
        createdAt: now,
        updatedAt: now
      }
    ]
  );
  await documentRepository.createDocument({
    id: "document-001",
    projectId: "project-001",
    title: "Ho so can cap nhat",
    docType: "legal",
    externalUrl: "https://example.com/document-001",
    version: "1.0",
    status: "complete",
    ownerId: admin.id,
    approvalStatus: "approved",
    createdAt: now,
    updatedAt: now
  });
  await meetingRepository.createMeeting({
    id: "meeting-001",
    organizationId: "org-001",
    projectId: "project-001",
    projectIds: ["project-001"],
    axisId: "axis-1",
    departmentId: "project",
    title: "Hop AI proposal",
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
    createdBy: admin.id,
    createdAt: now,
    updatedAt: now
  });
}

function buildProposal(id: string, patch: Partial<AiActionProposal>): AiActionProposal {
  const now = new Date().toISOString();

  return {
    id,
    interactionId: "interaction-001",
    jobId: "job-001",
    requestedBy: admin.id,
    projectId: "project-001",
    module: "tasks",
    actionKey: "create_task",
    targetEntityType: "task",
    proposedPayload: {},
    requiredPermission: "task.create",
    status: "proposed",
    createdAt: now,
    updatedAt: now,
    ...patch
  };
}
