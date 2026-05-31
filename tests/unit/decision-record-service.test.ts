import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PermissionUser } from "@/lib/permissions/can";
import {
  createDecisionRecord,
  type DecisionRecordServiceDependencies
} from "@/modules/executive/services/decision-record-service";
import { JsonMeetingRepository } from "@/modules/meetings/services/meeting-repository";
import { createMeeting, listDecisions } from "@/modules/meetings/services/meeting-service";
import type { ProposalDetail } from "@/modules/proposals/types";
import { JsonProjectRepository } from "@/modules/projects/services/project-repository";
import { createProject } from "@/modules/projects/services/project-service";
import { JsonUserRepository } from "@/modules/users/services/user-repository";
import type { AuditLog } from "@/modules/users/types";

let tempDir: string;
let meetingRepository: JsonMeetingRepository;
let projectRepository: JsonProjectRepository;
let userRepository: JsonUserRepository;
let auditWrites: Array<Omit<AuditLog, "id" | "createdAt">>;

const actor: PermissionUser = { id: "leader-01", role: "tong_giam_doc" };

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-decision-record-"));
  meetingRepository = new JsonMeetingRepository(path.join(tempDir, "meetings-decisions.json"));
  projectRepository = new JsonProjectRepository(path.join(tempDir, "project-core.json"));
  userRepository = new JsonUserRepository(path.join(tempDir, "users.json"));
  auditWrites = [];
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

function dependencies(overrides: Parameters<typeof createDecisionRecord>[2] = {}) {
  return {
    repository: meetingRepository,
    userRepository,
    auditWriter: async (input: Omit<AuditLog, "id" | "createdAt">) => {
      auditWrites.push(input);
      return input;
    },
    canCreateDecisionInScope: async () => true,
    now: () => "2026-05-30T09:00:00.000Z",
    idGenerator: () => `decision-${auditWrites.length + 1}`,
    ...overrides
  };
}

function dependenciesUsingDefaultPermissionCheck(
  overrides: DecisionRecordServiceDependencies = {}
) {
  const serviceDependencies: DecisionRecordServiceDependencies = dependencies(overrides);

  delete serviceDependencies.canCreateDecisionInScope;

  return serviceDependencies;
}

function proposalDetail(overrides: Partial<ProposalDetail["proposal"]> = {}): ProposalDetail {
  return {
    proposal: {
      id: "proposal-a",
      code: "DX-A",
      title: "Proposal source",
      type: "finance",
      projectId: "project-a",
      module: "finance",
      requestedBy: "requester-01",
      status: "approved",
      priority: "high",
      amount: 999_000_000,
      summary: "Sensitive raw proposal summary",
      aiReviewStatus: "not_checked",
      createdAt: "2026-05-29T08:00:00.000Z",
      updatedAt: "2026-05-29T08:00:00.000Z",
      ...overrides
    },
    steps: [],
    links: [],
    decisions: []
  };
}

describe("decision record service", () => {
  it("creates independent decisions with project scope and organization-only scope", async () => {
    const project = await createProject({ name: "Decision Project", status: "active" }, projectRepository);

    const projectDecision = await createDecisionRecord(
      {
        title: "Issue project instruction",
        content: "Approve project operating instruction.",
        projectId: project.id,
        organizationId: "org-green-nest",
        ownerId: actor.id,
        priority: "high"
      },
      actor,
      dependencies()
    );
    const organizationDecision = await createDecisionRecord(
      {
        title: "Portfolio instruction",
        content: "Apply portfolio governance rule.",
        organizationId: "org-green-nest",
        ownerId: actor.id
      },
      actor,
      dependencies()
    );

    expect(projectDecision).toMatchObject({
      title: "Issue project instruction",
      decisionText: "Approve project operating instruction.",
      projectId: project.id,
      projectIds: [project.id],
      sourceType: "independent",
      createdBy: actor.id,
      decidedBy: actor.id,
      priority: "high"
    });
    expect(organizationDecision.projectId).toBeUndefined();
    expect(organizationDecision.projectIds).toEqual([]);
    expect(organizationDecision.organizationId).toBe("org-green-nest");
    expect(auditWrites).toHaveLength(2);
  });

  it("creates source-linked decisions from project and organization meetings without completing the meeting", async () => {
    const project = await createProject({ name: "Meeting Decision", status: "active" }, projectRepository);
    const projectMeeting = await createMeeting(
      {
        projectId: project.id,
        title: "Project meeting",
        meetingDate: "2026-05-30T09:00"
      },
      actor.id,
      meetingRepository,
      projectRepository
    );
    const organizationMeeting = await createMeeting(
      {
        organizationId: "org-green-nest",
        title: "Organization meeting",
        meetingDate: "2026-05-30T10:00"
      },
      actor.id,
      meetingRepository,
      projectRepository
    );
    const getScopedMeeting = async (_actor: PermissionUser, meetingId: string) => meetingRepository.getMeeting(meetingId);

    const projectDecision = await createDecisionRecord(
      {
        content: "Create formal instruction from meeting.",
        sourceType: "meeting",
        sourceId: projectMeeting.id
      },
      actor,
      dependencies({ getScopedMeeting })
    );
    const organizationDecision = await createDecisionRecord(
      {
        content: "Create organization-wide instruction from meeting.",
        sourceType: "meeting",
        sourceId: organizationMeeting.id
      },
      actor,
      dependencies({ getScopedMeeting })
    );

    const reloadedMeeting = await meetingRepository.getMeeting(projectMeeting.id);

    expect(projectDecision).toMatchObject({
      meetingId: projectMeeting.id,
      projectId: project.id,
      sourceType: "meeting",
      sourceId: projectMeeting.id
    });
    expect(projectDecision.linkedRecords).toEqual([
      expect.objectContaining({ type: "meeting", id: projectMeeting.id, relationType: "source" })
    ]);
    expect(organizationDecision.projectId).toBeUndefined();
    expect(organizationDecision.organizationId).toBe("org-green-nest");
    expect(reloadedMeeting?.status).toBe(projectMeeting.status);

    await expect(
      createDecisionRecord(
        {
          content: "Unauthorized meeting source.",
          sourceType: "meeting",
          sourceId: projectMeeting.id
        },
        actor,
        dependencies({ getScopedMeeting: async () => undefined })
      )
    ).rejects.toThrow(/nguon decision/i);
    await expect(listDecisions({}, meetingRepository)).resolves.toHaveLength(2);
  });

  it("creates decisions from proposal or approval sources without leaking raw source data to audit", async () => {
    const getScopedProposal = async () => proposalDetail();

    const proposalDecision = await createDecisionRecord(
      {
        content: "Issue instruction after proposal approval.",
        sourceType: "proposal",
        sourceId: "proposal-a",
        ownerId: actor.id
      },
      actor,
      dependencies({ getScopedProposal })
    );
    const approvalDecision = await createDecisionRecord(
      {
        content: "Issue instruction after approval action.",
        sourceType: "approval",
        sourceId: "proposal-a",
        ownerId: actor.id
      },
      actor,
      dependencies({ getScopedProposal })
    );

    expect(proposalDecision).toMatchObject({
      sourceType: "proposal",
      sourceId: "proposal-a",
      projectId: "project-a",
      workstreamId: "finance"
    });
    expect(approvalDecision.sourceType).toBe("approval");
    expect(proposalDecision.linkedRecords).toEqual([
      expect.objectContaining({ type: "proposal", id: "proposal-a", title: "Proposal source" })
    ]);
    expect(JSON.stringify(auditWrites)).not.toMatch(/999000000|Sensitive raw proposal summary/);

    await expect(
      createDecisionRecord(
        {
          content: "Unauthorized proposal source.",
          sourceType: "proposal",
          sourceId: "proposal-a"
        },
        actor,
        dependencies({ getScopedProposal: async () => undefined })
      )
    ).rejects.toThrow(/nguon decision/i);
  });

  it("requires every project in multi-project scope to be authorized", async () => {
    const projectA = await createProject({ name: "Scope A", status: "active" }, projectRepository);
    const projectB = await createProject({ name: "Scope B", status: "active" }, projectRepository);

    await expect(
      createDecisionRecord(
        {
          content: "Cross-project decision.",
          projectIds: [projectA.id, projectB.id]
        },
        actor,
        dependenciesUsingDefaultPermissionCheck({
          getScopedProject: async (_actor, projectId) =>
            projectId === projectA.id ? projectA : undefined
        })
      )
    ).rejects.toThrow(/quyen tao decision/i);

    expect(await listDecisions({}, meetingRepository)).toHaveLength(0);
    expect(auditWrites).toHaveLength(0);
  });

  it("blocks unscoped owners and unverified linked records before writes", async () => {
    const project = await createProject({ name: "Scoped Owner", status: "active" }, projectRepository);

    await expect(
      createDecisionRecord(
        {
          content: "Owner has no project membership.",
          projectId: project.id,
          ownerId: "viewer"
        },
        actor,
        dependencies()
      )
    ).rejects.toThrow(/nguoi phu trach/i);

    await expect(
      createDecisionRecord(
        {
          content: "Unverified linked meeting.",
          projectId: project.id,
          linkedRecords: [
            {
              type: "meeting",
              id: "meeting-outside",
              relationType: "context"
            }
          ]
        },
        actor,
        dependencies({ getScopedMeeting: async () => undefined })
      )
    ).rejects.toThrow(/lien ket record/i);

    await expect(
      createDecisionRecord(
        {
          content: "Raw source id without source type.",
          projectId: project.id,
          sourceId: "proposal-a"
        },
        actor,
        dependencies()
      )
    ).rejects.toThrow(/nguon decision/i);

    expect(await listDecisions({}, meetingRepository)).toHaveLength(0);
    expect(auditWrites).toHaveLength(0);
  });

  it("blocks source-linked decisions from overriding source module scope", async () => {
    await expect(
      createDecisionRecord(
        {
          content: "Misclassified proposal decision.",
          sourceType: "proposal",
          sourceId: "proposal-a",
          moduleId: "meeting"
        },
        actor,
        dependencies({ getScopedProposal: async () => proposalDetail() })
      )
    ).rejects.toThrow(/pham vi decision/i);

    expect(await listDecisions({}, meetingRepository)).toHaveLength(0);
    expect(auditWrites).toHaveLength(0);
  });

  it("blocks permission and owner scope failures before repository or audit writes", async () => {
    const projectA = await createProject({ name: "Scope A", status: "active" }, projectRepository);
    const projectB = await createProject({ name: "Scope B", status: "active" }, projectRepository);
    const viewer: PermissionUser = { id: "viewer-01", role: "viewer" };

    await expect(
      createDecisionRecord(
        {
          content: "Denied by permission.",
          projectId: projectA.id
        },
        viewer,
        dependencies({ canCreateDecisionInScope: async () => false })
      )
    ).rejects.toThrow(/quyen tao decision/i);

    expect(await listDecisions({}, meetingRepository)).toHaveLength(0);
    expect(auditWrites).toHaveLength(0);

    await userRepository.upsertProjectMembership({
      id: "membership-owner-b",
      projectId: projectB.id,
      userId: "owner-outside",
      role: "quan_ly_du_an",
      createdAt: "2026-05-30T08:00:00.000Z",
      updatedAt: "2026-05-30T08:00:00.000Z"
    });

    await expect(
      createDecisionRecord(
        {
          content: "Owner outside project scope.",
          projectId: projectA.id,
          ownerId: "owner-outside"
        },
        actor,
        dependencies()
      )
    ).rejects.toThrow(/nguoi phu trach/i);

    expect(await listDecisions({}, meetingRepository)).toHaveLength(0);
    expect(auditWrites).toHaveLength(0);
  });
});
