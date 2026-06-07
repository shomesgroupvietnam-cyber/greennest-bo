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
import { JsonRiskRecordRepository } from "@/modules/executive/services/risk-record-repository";
import { JsonLegalRepository } from "@/modules/legal/services/legal-repository";
import { JsonMeetingRepository } from "@/modules/meetings/services/meeting-repository";
import { JsonProjectRepository } from "@/modules/projects/services/project-repository";
import { JsonProposalRepository } from "@/modules/proposals/services/proposal-repository";
import { createDefaultRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-repository";
import { JsonTaskRepository } from "@/modules/tasks/services/task-repository";
import { JsonUserRepository } from "@/modules/users/services/user-repository";

let tempDir: string;
let aiRepository: JsonAiRepository;
let projectRepository: JsonProjectRepository;
let taskRepository: JsonTaskRepository;
let documentRepository: JsonDocumentRepository;
let legalRepository: JsonLegalRepository;
let meetingRepository: JsonMeetingRepository;
let proposalRepository: JsonProposalRepository;
let riskRecordRepository: JsonRiskRecordRepository;
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
  proposalRepository = new JsonProposalRepository(path.join(tempDir, "proposals.json"));
  riskRecordRepository = new JsonRiskRecordRepository(path.join(tempDir, "executive-risk-records.json"));
  userRepository = new JsonUserRepository(path.join(tempDir, "users.json"));
  repositories = {
    ai: aiRepository,
    projects: projectRepository,
    tasks: taskRepository,
    documents: documentRepository,
    legal: legalRepository,
    meetings: meetingRepository,
    proposals: proposalRepository,
    riskRecords: riskRecordRepository,
    riskGroups: [{ active: true, riskKey: "legal" }],
    rolePermissionCatalog: createDefaultRolePermissionCatalog(),
    scopeAssignments: [],
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
    const proposedPayload = await buildMeetingActionPayload({
      decisionText: "Bo sung action item tu AI",
    });
    const [proposal] = await aiRepository.createActionProposals([
      buildProposal("proposal-meeting", {
        actionKey: "create_meeting_action_item",
        requiredPermission: "decision.create",
        targetEntityType: "meeting",
        targetEntityId: "meeting-001",
        proposedPayload,
      })
    ]);

    const updated = await acceptAiActionProposal(proposal.id, admin, {}, repositories);
    const decisions = await meetingRepository.listDecisions({ meetingId: "meeting-001" });

    expect(updated.status).toBe("accepted");
    expect(decisions.some((decision) => decision.decisionText === "Bo sung action item tu AI")).toBe(true);
  });

  it("fails stale meeting action item proposals when AI summary status changed", async () => {
    const proposedPayload = await buildMeetingActionPayload({
      decisionText: "Khong duoc tao khi summary da duyet",
    });
    const [proposal] = await aiRepository.createActionProposals([
      buildProposal("proposal-meeting-stale", {
        actionKey: "create_meeting_action_item",
        requiredPermission: "decision.create",
        targetEntityType: "meeting",
        targetEntityId: "meeting-001",
        proposedPayload,
      })
    ]);
    await meetingRepository.updateMeeting("meeting-001", {
      aiSummary: {
        approvedAt: new Date().toISOString(),
        approvedBy: admin.id,
        content: "Summary da thanh official",
        status: "APPROVED"
      },
      updatedAt: new Date().toISOString()
    });

    await expect(acceptAiActionProposal(proposal.id, admin, {}, repositories)).rejects.toThrow(/AI summary|thay doi/i);

    const staleProposal = await aiRepository.getActionProposal(proposal.id);
    const decisions = await meetingRepository.listDecisions({ meetingId: "meeting-001" });

    expect(staleProposal?.status).toBe("failed");
    expect(decisions.some((decision) => decision.decisionText === "Khong duoc tao khi summary da duyet")).toBe(false);
  });

  it("fails stale meeting action item proposals when the meeting changed after generation", async () => {
    const proposedPayload = await buildMeetingActionPayload({
      decisionText: "Khong duoc tao khi meeting da doi",
    });
    const [proposal] = await aiRepository.createActionProposals([
      buildProposal("proposal-meeting-stale-updated-at", {
        actionKey: "create_meeting_action_item",
        requiredPermission: "decision.create",
        targetEntityType: "meeting",
        targetEntityId: "meeting-001",
        proposedPayload,
      })
    ]);
    await meetingRepository.updateMeeting("meeting-001", {
      updatedAt: "2099-01-01T00:00:00.000Z",
    });

    await expect(acceptAiActionProposal(proposal.id, admin, {}, repositories)).rejects.toThrow(/Cuoc hop|thay doi/i);

    const staleProposal = await aiRepository.getActionProposal(proposal.id);
    const decisions = await meetingRepository.listDecisions({ meetingId: "meeting-001" });

    expect(staleProposal?.status).toBe("failed");
    expect(decisions.some((decision) => decision.decisionText === "Khong duoc tao khi meeting da doi")).toBe(false);
  });

  it("accepts create_risk_record proposals through the official risk service", async () => {
    const [proposal] = await aiRepository.createActionProposals([
      buildProposal("proposal-risk", {
        actionKey: "create_risk_record",
        module: "project",
        requiredPermission: "risk.create",
        targetEntityType: "risk",
        proposedPayload: {
          categoryKey: "legal",
          deadline: "2026-06-10",
          level: "high",
          ownerId: "mock-founder",
          projectId: "project-001",
          reason: "AI phat hien risk phap ly can theo doi.",
          recordType: "risk",
          title: "Risk phap ly tu AI",
        },
        workflowStatus: "DRAFT",
      })
    ]);
    const beforeRisks = await riskRecordRepository.listRiskRecords({ includeClosed: true });

    const updated = await acceptAiActionProposal(
      proposal.id,
      { id: "ceo-01", role: "tong_giam_doc" },
      { decisionNotes: "Chap nhan tao risk" },
      repositories,
    );
    const afterRisks = await riskRecordRepository.listRiskRecords({ includeClosed: true });

    expect(beforeRisks).toHaveLength(0);
    expect(updated).toMatchObject({
      status: "accepted",
      executionResult: {
        entityType: "risk",
        projectId: "project-001",
        status: "open",
      },
    });
    expect(afterRisks).toHaveLength(1);
    expect(afterRisks[0]).toMatchObject({
      categoryKey: "legal",
      createdBy: "ceo-01",
      ownerId: "mock-founder",
      projectId: "project-001",
      status: "open",
      title: "Risk phap ly tu AI",
    });
    expect(afterRisks[0]?.nextAction).toBe("Review citation va xac nhan phuong an xu ly risk/blocker.");

    await expect(
      acceptAiActionProposal(
        proposal.id,
        { id: "ceo-01", role: "tong_giam_doc" },
        {},
        repositories,
      ),
    ).rejects.toThrow(/proposed|xu ly/i);
    expect(await riskRecordRepository.listRiskRecords({ includeClosed: true })).toHaveLength(1);
  });

  it("accepts create_risk_record proposals for scoped risk.create users", async () => {
    const [proposal] = await aiRepository.createActionProposals([
      buildProposal("proposal-risk-scoped", {
        actionKey: "create_risk_record",
        module: "project",
        requiredPermission: "risk.create",
        targetEntityType: "risk",
        proposedPayload: {
          categoryKey: "legal",
          deadline: "2026-06-10",
          level: "high",
          ownerId: "mock-founder",
          projectId: "project-001",
          reason: "Scoped user tao risk tu draft AI.",
          recordType: "risk",
          title: "Scoped risk tu AI",
        },
        workflowStatus: "DRAFT",
      })
    ]);

    const updated = await acceptAiActionProposal(
      proposal.id,
      {
        id: "scoped-risk-creator",
        permissions: ["ai.confirm_action"],
        permissionsMode: "replace",
        role: "pending",
      },
      {},
      {
        ...repositories,
        scopeAssignments: [
          {
            active: true,
            createdAt: "",
            id: "assignment-scoped-risk-create",
            permissionKeys: ["risk.create"],
            projectId: "project-001",
            roleKey: "giam_doc_du_an",
            scopeType: "scoped",
            updatedAt: "",
            userId: "scoped-risk-creator",
          },
        ],
      },
    );

    expect(updated).toMatchObject({
      status: "accepted",
      executionResult: expect.objectContaining({
        entityType: "risk",
        projectId: "project-001",
      }),
    });
  });

  it("accepts approval_request_change through the official proposal service", async () => {
    const [proposal] = await aiRepository.createActionProposals([
      buildProposal("proposal-approval-change", {
        actionKey: "approval_request_change",
        module: "general",
        requiredPermission: "proposal.request_change",
        targetEntityType: "proposal",
        targetEntityId: "approval-001",
        proposedPayload: {
          affectedFields: ["status", "currentStep"],
          approvalAction: "request_change",
          currentDecisionVersion: 0,
          currentStepId: "approval-step-001",
          currentStepStatus: "in_review",
          currentStatus: "in_review",
          nextStatus: "change_requested",
          proposalId: "approval-001",
          reason: "Can bo sung chung tu va giai trinh truoc khi duyet.",
          requiredPermission: "proposal.request_change",
          sourceCitationIds: ["approval-source-approval-001"],
          sourceType: "proposal",
        },
        workflowStatus: "DRAFT",
      })
    ]);

    const updated = await acceptAiActionProposal(
      proposal.id,
      { id: "finance-approver", role: "tong_giam_doc" },
      { decisionNotes: "Chap nhan tra lai theo AI draft" },
      repositories,
    );
    const detail = await proposalRepository.getProposalDetail("approval-001");
    const auditLogs = await userRepository.listAuditLogs({
      entityId: "approval-001",
      entityType: "proposal",
    });

    expect(updated).toMatchObject({
      status: "accepted",
      executionResult: expect.objectContaining({
        action: "request_change",
        entityId: "approval-001",
        entityType: "proposal",
        nextStatus: "change_requested",
        previousStatus: "in_review",
      }),
    });
    expect(detail?.proposal.status).toBe("change_requested");
    expect(detail?.decisions[0]).toMatchObject({
      decision: "change_requested",
      nextStatus: "change_requested",
      previousStatus: "in_review",
      version: 1,
    });
    expect(auditLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "proposal.change_requested",
          newValue: expect.objectContaining({
            status: "change_requested",
            version: 1,
          }),
        }),
      ]),
    );
    expect(JSON.stringify(auditLogs)).not.toContain("sourcePrompt");
  });

  it("rejects approval action proposals without mutating the approval request", async () => {
    const [proposal] = await aiRepository.createActionProposals([
      buildProposal("proposal-approval-reject-ai", {
        actionKey: "approval_ask_meeting",
        module: "general",
        requiredPermission: "proposal.approve",
        targetEntityType: "proposal",
        targetEntityId: "approval-001",
        proposedPayload: {
          affectedFields: ["generatedLink"],
          agendaDraft: "Hop nhanh de lam ro chung tu.",
          approvalAction: "ask_meeting",
          currentDecisionVersion: 0,
          currentStepId: "approval-step-001",
          currentStepStatus: "in_review",
          currentStatus: "in_review",
          meetingType: "approval_review",
          nextStatus: "in_review",
          proposalId: "approval-001",
          requiredPermission: "proposal.approve",
          sourceCitationIds: ["approval-source-approval-001"],
          sourceType: "proposal",
        },
        workflowStatus: "DRAFT",
      })
    ]);
    const before = await proposalRepository.getProposalDetail("approval-001");

    const updated = await rejectAiActionProposal(
      proposal.id,
      { id: "finance-approver", role: "tong_giam_doc" },
      { decisionNotes: "Khong can hop" },
      repositories,
    );
    const after = await proposalRepository.getProposalDetail("approval-001");
    const auditLogs = await userRepository.listAuditLogs({
      entityId: "approval-001",
      entityType: "proposal",
    });

    expect(updated.status).toBe("rejected");
    expect(after?.proposal.status).toBe(before?.proposal.status);
    expect(after?.decisions).toHaveLength(before?.decisions.length ?? 0);
    expect(auditLogs).toHaveLength(0);
  });

  it("fails approval proposal accept safely when the approval is no longer actionable", async () => {
    const [proposal] = await aiRepository.createActionProposals([
      buildProposal("proposal-approval-stale", {
        actionKey: "approval_request_change",
        module: "general",
        requiredPermission: "proposal.request_change",
        targetEntityType: "proposal",
        targetEntityId: "approval-001",
        proposedPayload: {
          affectedFields: ["status", "currentStep"],
          approvalAction: "request_change",
          currentDecisionVersion: 0,
          currentStepId: "approval-step-001",
          currentStepStatus: "in_review",
          currentStatus: "in_review",
          nextStatus: "change_requested",
          proposalId: "approval-001",
          reason: "Can bo sung.",
          requiredPermission: "proposal.request_change",
          sourceCitationIds: ["approval-source-approval-001"],
          sourceType: "proposal",
        },
        workflowStatus: "DRAFT",
      })
    ]);
    await proposalRepository.updateProposal("approval-001", {
      status: "approved",
    });

    await expect(
      acceptAiActionProposal(
        proposal.id,
        { id: "finance-approver", role: "tong_giam_doc" },
        {},
        repositories,
      ),
    ).rejects.toThrow(/khong con|Trang thai|approval/i);

    const staleProposal = await aiRepository.getActionProposal(proposal.id);
    const detail = await proposalRepository.getProposalDetail("approval-001");

    expect(staleProposal?.status).toBe("failed");
    expect(detail?.proposal.status).toBe("approved");
    expect(detail?.decisions).toHaveLength(0);
  });

  it("blocks unauthorized approval accepts before claiming or mutating the approval", async () => {
    const [proposal] = await aiRepository.createActionProposals([
      buildProposal("proposal-approval-unauthorized", {
        actionKey: "approval_request_change",
        module: "general",
        requiredPermission: "proposal.request_change",
        targetEntityType: "proposal",
        targetEntityId: "approval-001",
        proposedPayload: {
          affectedFields: ["status", "currentStep"],
          approvalAction: "request_change",
          currentDecisionVersion: 0,
          currentStepId: "approval-step-001",
          currentStepStatus: "in_review",
          currentStatus: "in_review",
          nextStatus: "change_requested",
          proposalId: "approval-001",
          reason: "User nay khong du quyen request change.",
          requiredPermission: "proposal.request_change",
          sourceCitationIds: ["approval-source-approval-001"],
          sourceType: "proposal",
        },
        workflowStatus: "DRAFT",
      })
    ]);

    await expect(
      acceptAiActionProposal(
        proposal.id,
        {
          id: "limited-approver",
          permissions: ["ai.confirm_action"],
          permissionsMode: "replace",
          role: "pending",
        },
        {},
        repositories,
      ),
    ).rejects.toThrow(/permission|quyen|quyền/i);

    const blockedProposal = await aiRepository.getActionProposal(proposal.id);
    const detail = await proposalRepository.getProposalDetail("approval-001");

    expect(blockedProposal?.status).toBe("proposed");
    expect(blockedProposal?.decidedBy).toBeUndefined();
    expect(detail?.proposal.status).toBe("in_review");
    expect(detail?.decisions).toHaveLength(0);
  });

  it("blocks approval proposal payloads whose proposalId does not match the target before claiming", async () => {
    const [proposal] = await aiRepository.createActionProposals([
      buildProposal("proposal-approval-mismatch", {
        actionKey: "approval_request_change",
        module: "general",
        requiredPermission: "proposal.request_change",
        targetEntityType: "proposal",
        targetEntityId: "approval-001",
        proposedPayload: {
          affectedFields: ["status", "currentStep"],
          approvalAction: "request_change",
          currentDecisionVersion: 0,
          currentStepId: "approval-step-001",
          currentStepStatus: "in_review",
          currentStatus: "in_review",
          nextStatus: "change_requested",
          proposalId: "approval-other",
          reason: "Payload tro nham approval.",
          requiredPermission: "proposal.request_change",
          sourceCitationIds: ["approval-source-approval-001"],
          sourceType: "proposal",
        },
        workflowStatus: "DRAFT",
      })
    ]);

    await expect(
      acceptAiActionProposal(
        proposal.id,
        { id: "finance-approver", role: "tong_giam_doc" },
        {},
        repositories,
      ),
    ).rejects.toThrow(/khong khop|proposalId/i);

    expect(await aiRepository.getActionProposal(proposal.id)).toMatchObject({
      status: "proposed",
    });
    expect((await proposalRepository.getProposalDetail("approval-001"))?.decisions).toHaveLength(0);
  });

  it("fails stale approval proposals when the current step changed after proposal generation", async () => {
    const now = new Date().toISOString();
    const [proposal] = await aiRepository.createActionProposals([
      buildProposal("proposal-approval-stale-step", {
        actionKey: "approval_request_change",
        module: "general",
        requiredPermission: "proposal.request_change",
        targetEntityType: "proposal",
        targetEntityId: "approval-001",
        proposedPayload: {
          affectedFields: ["status", "currentStep"],
          approvalAction: "request_change",
          currentDecisionVersion: 0,
          currentStepId: "approval-step-001",
          currentStepStatus: "in_review",
          currentStatus: "in_review",
          nextStatus: "change_requested",
          proposalId: "approval-001",
          reason: "Can bo sung.",
          requiredPermission: "proposal.request_change",
          sourceCitationIds: ["approval-source-approval-001"],
          sourceType: "proposal",
        },
        workflowStatus: "DRAFT",
      })
    ]);
    await proposalRepository.addStep({
      createdAt: now,
      id: "approval-step-002",
      proposalId: "approval-001",
      requiredPermission: "proposal.approve",
      status: "in_review",
      stepOrder: 2,
      updatedAt: now,
    });
    await proposalRepository.updateProposal("approval-001", {
      currentStepId: "approval-step-002",
      updatedAt: now,
    });

    await expect(
      acceptAiActionProposal(
        proposal.id,
        { id: "finance-approver", role: "tong_giam_doc" },
        {},
        repositories,
      ),
    ).rejects.toThrow(/Buoc approval|thay doi/i);

    const staleProposal = await aiRepository.getActionProposal(proposal.id);
    const detail = await proposalRepository.getProposalDetail("approval-001");

    expect(staleProposal?.status).toBe("failed");
    expect(detail?.proposal.status).toBe("in_review");
    expect(detail?.decisions).toHaveLength(0);
  });

  it("fails stale approval proposals when the decision version changed after proposal generation", async () => {
    const now = new Date().toISOString();
    const [proposal] = await aiRepository.createActionProposals([
      buildProposal("proposal-approval-stale-version", {
        actionKey: "approval_request_change",
        module: "general",
        requiredPermission: "proposal.request_change",
        targetEntityType: "proposal",
        targetEntityId: "approval-001",
        proposedPayload: {
          affectedFields: ["status", "currentStep"],
          approvalAction: "request_change",
          currentDecisionVersion: 0,
          currentStepId: "approval-step-001",
          currentStepStatus: "in_review",
          currentStatus: "in_review",
          nextStatus: "change_requested",
          proposalId: "approval-001",
          reason: "Can bo sung.",
          requiredPermission: "proposal.request_change",
          sourceCitationIds: ["approval-source-approval-001"],
          sourceType: "proposal",
        },
        workflowStatus: "DRAFT",
      })
    ]);
    await proposalRepository.addDecision({
      decidedAt: now,
      decidedBy: "other-approver",
      decision: "meeting_requested",
      id: "approval-decision-existing",
      nextStatus: "in_review",
      nextStepStatus: "in_review",
      previousStatus: "in_review",
      previousStepStatus: "in_review",
      proposalId: "approval-001",
      stepId: "approval-step-001",
      version: 1,
    });

    await expect(
      acceptAiActionProposal(
        proposal.id,
        { id: "finance-approver", role: "tong_giam_doc" },
        {},
        repositories,
      ),
    ).rejects.toThrow(/Version approval|thay doi/i);

    const staleProposal = await aiRepository.getActionProposal(proposal.id);
    const detail = await proposalRepository.getProposalDetail("approval-001");

    expect(staleProposal?.status).toBe("failed");
    expect(detail?.proposal.status).toBe("in_review");
    expect(detail?.decisions).toHaveLength(1);
  });

  it("keeps invalid create_risk_record proposals as failed and does not create official risks", async () => {
    const [proposal] = await aiRepository.createActionProposals([
      buildProposal("proposal-risk-invalid", {
        actionKey: "create_risk_record",
        requiredPermission: "risk.create",
        targetEntityType: "risk",
        proposedPayload: {
          projectId: "project-001",
          title: "Risk thieu payload",
        },
      })
    ]);

    await expect(
      acceptAiActionProposal(
        proposal.id,
        { id: "ceo-01", role: "tong_giam_doc" },
        {},
        repositories,
      ),
    ).rejects.toThrow();

    expect(await riskRecordRepository.listRiskRecords({ includeClosed: true })).toHaveLength(0);
    expect(await aiRepository.getActionProposal(proposal.id)).toMatchObject({
      status: "failed",
    });
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
  await userRepository.upsertProjectMembership({
    id: "membership-founder-project-001",
    projectId: "project-001",
    role: "admin",
    userId: "mock-founder",
    createdAt: now,
    updatedAt: now,
  });
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
  await proposalRepository.createProposal({
    aiReviewStatus: "not_checked",
    code: "DX-APPROVAL-001",
    createdAt: now,
    currentStepId: "approval-step-001",
    dueDate: "2026-06-30",
    id: "approval-001",
    module: "finance",
    priority: "high",
    projectId: "project-001",
    requestedBy: "requester-01",
    status: "in_review",
    submittedBy: "requester-01",
    summary: "Approval request dung cho AI proposal.",
    title: "Approval can AI de xuat",
    type: "finance",
    updatedAt: now,
  }, [], [
    {
      createdAt: now,
      id: "approval-attachment-001",
      name: "Ho so AI approval.pdf",
      proposalId: "approval-001",
      source: "external_url",
      uploadedAt: now,
      uploadedBy: "requester-01",
      url: "https://example.com/approval-001.pdf",
    },
  ]);
  await proposalRepository.addStep({
    createdAt: now,
    id: "approval-step-001",
    proposalId: "approval-001",
    requiredPermission: "proposal.approve",
    status: "in_review",
    stepOrder: 1,
    updatedAt: now,
  });
}

async function buildMeetingActionPayload(
  patch: Partial<AiActionProposal["proposedPayload"]> = {},
) {
  const meeting = await meetingRepository.getMeeting("meeting-001");

  expect(meeting).toBeDefined();

  return {
    affectedFields: ["decisions"],
    currentAiSummaryStatus: meeting!.aiSummary.status,
    currentMeetingUpdatedAt: meeting!.updatedAt,
    meetingId: "meeting-001",
    requiredPermission: "decision.create",
    sourceCitationIds: ["meeting-source-meeting-001"],
    targetEntityType: "meeting",
    ...patch,
  };
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
