import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { AiAskInput } from "@/modules/ai/types";
import {
  getExecutiveMorningBriefingData,
} from "@/modules/dashboard/services/executive-morning-briefing-service";
import type { ExecutiveDashboardSourceItem } from "@/modules/dashboard/types";
import { JsonMeetingRepository } from "@/modules/meetings/services/meeting-repository";
import type { Decision, Meeting } from "@/modules/meetings/types";
import { JsonProjectRepository } from "@/modules/projects/services/project-repository";
import { createProject } from "@/modules/projects/services/project-service";
import { JsonProposalRepository } from "@/modules/proposals/services/proposal-repository";
import type { Proposal } from "@/modules/proposals/types";
import { createDefaultRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-repository";
import type { ScopeAssignment } from "@/modules/settings/types";

let tempDir: string;
let projectRepository: JsonProjectRepository;
let proposalRepository: JsonProposalRepository;
let meetingRepository: JsonMeetingRepository;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-morning-briefing-"));
  projectRepository = new JsonProjectRepository(path.join(tempDir, "project-core.json"));
  proposalRepository = new JsonProposalRepository(path.join(tempDir, "proposals.json"));
  meetingRepository = new JsonMeetingRepository(path.join(tempDir, "meetings-decisions.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

async function seedProposal(input: {
  id: string;
  projectId: string;
  title: string;
  amount?: number;
  dueDate?: string;
  status?: Proposal["status"];
}) {
  const timestamp = "2026-05-20T00:00:00.000Z";
  const proposal: Proposal = {
    aiReviewStatus: "not_checked",
    amount: input.amount,
    code: `DX-${input.id.toUpperCase()}`,
    createdAt: timestamp,
    dueDate: input.dueDate,
    id: input.id,
    module: "proposal",
    ownerId: "owner-01",
    priority: "high",
    projectId: input.projectId,
    requestedBy: "requester-01",
    status: input.status ?? "in_review",
    submittedBy: "requester-01",
    summary: "Morning briefing proposal fixture.",
    title: input.title,
    type: input.amount ? "finance" : "general",
    updatedAt: timestamp,
  };

  await proposalRepository.createProposal(proposal);

  return proposal;
}

async function seedDecision(input: {
  dueDate: string;
  id: string;
  projectId: string;
  text: string;
  updatedAt?: string;
}) {
  const timestamp = "2026-05-20T00:00:00.000Z";
  const decision: Decision = {
    createdAt: timestamp,
    decisionText: input.text,
    dueDate: input.dueDate,
    id: input.id,
    ownerId: "owner-01",
    projectId: input.projectId,
    status: "open",
    updatedAt: input.updatedAt ?? timestamp,
  };

  await meetingRepository.createDecision(decision);

  return decision;
}

async function seedMeetingFollowUp(input: {
  dueDate: string;
  id: string;
  projectId: string;
  title: string;
}) {
  const timestamp = "2026-05-20T00:00:00.000Z";
  const meeting: Meeting = {
    aiSummary: { status: "DRAFT" },
    auditLog: [],
    attachments: [],
    createdAt: timestamp,
    decisions: [],
    externalParticipants: [],
    followUpActions: [
      {
        dueDate: input.dueDate,
        id: `${input.id}-follow-up`,
        status: "open",
        title: `${input.title} follow-up`,
      },
    ],
    id: input.id,
    meetingDate: input.dueDate,
    meetingType: "PROJECT_MEETING",
    participants: [],
    participantScope: "project_team",
    projectId: input.projectId,
    projectIds: [input.projectId],
    relatedApprovals: [],
    relatedTasks: [],
    startTime: input.dueDate,
    status: "COMPLETED",
    title: input.title,
    updatedAt: timestamp,
    visibility: "project",
  };

  await meetingRepository.createMeeting(meeting);

  return meeting;
}

function sourceKey(item: Pick<ExecutiveDashboardSourceItem, "sourceId" | "sourceType">) {
  return `${item.sourceType}:${item.sourceId}`;
}

describe("executive morning briefing service", () => {
  it("builds a scoped DTO from ExecutiveDashboardData with visible citations", async () => {
    const briefing = await getExecutiveMorningBriefingData(
      { id: "ceo-01", role: "tong_giam_doc" },
      {
        repositories: {
          meetings: meetingRepository,
          projects: projectRepository,
          proposals: proposalRepository,
        },
        requireScopeAssignments: false,
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [],
        today: new Date("2026-05-24T00:00:00.000Z"),
      },
    );

    expect(briefing.generatedAt).toEqual(expect.any(String));
    expect(briefing.scope).toMatchObject({
      operatingRole: "CEO",
      selectedScopeId: "all",
    });
    expect(briefing.permissions.canDrillDown).toBe(true);
    expect(briefing.summary.status).toBe("placeholder");
    expect(briefing.summary.text).toContain("Bản tóm tắt gợi ý");
    expect(briefing.kpisToday.length).toBeGreaterThan(0);
    expect(briefing.topRisks.length).toBeGreaterThan(0);
    expect(briefing.projectHealth.total).toBeGreaterThan(0);

    const visibleSourceKeys = new Set(
      [
        ...briefing.topRisks,
        ...briefing.overdueApprovals,
        ...briefing.decisionsToday,
        ...briefing.projectHealth.items,
        ...briefing.meetingSnapshot.items,
      ].map(sourceKey),
    );

    expect(briefing.summary.citations.length).toBeGreaterThan(0);
    expect(
      briefing.summary.citations.every((citation) =>
        visibleSourceKeys.has(sourceKey(citation)),
      ),
    ).toBe(true);
  });

  it("returns insufficient context instead of over-claiming when the active scope has no visible data", async () => {
    const briefing = await getExecutiveMorningBriefingData(
      { id: "ceo-01", role: "tong_giam_doc" },
      {
        repositories: {
          meetings: meetingRepository,
          projects: projectRepository,
          proposals: proposalRepository,
        },
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [],
        selectedScopeId: "missing-scope",
        today: new Date("2026-05-24T00:00:00.000Z"),
      },
    );

    expect(briefing.summary).toMatchObject({
      citations: [],
      status: "insufficient_context",
    });
    expect(briefing.summary.text).toContain("Khong co du lieu trong scope");
    expect(briefing.topRisks).toEqual([]);
    expect(briefing.overdueApprovals).toEqual([]);
    expect(briefing.decisionsToday).toEqual([]);
  });

  it("keeps project-only visible data as placeholder context", async () => {
    const visibleProject = await createProject(
      { name: "Project-only briefing context", status: "active" },
      projectRepository,
    );
    const briefing = await getExecutiveMorningBriefingData(
      {
        id: "project-only-briefing",
        role: "pending",
        permissions: ["ai.create_draft"],
      },
      {
        repositories: {
          meetings: meetingRepository,
          projects: projectRepository,
          proposals: proposalRepository,
        },
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [
          {
            active: true,
            createdAt: "",
            id: "assignment-project-only-briefing",
            permissionKeys: ["project.view"],
            projectId: visibleProject.id,
            roleKey: "quan_ly_du_an",
            scopeType: "scoped",
            updatedAt: "",
            userId: "project-only-briefing",
          },
        ],
        selectedScopeId: "all",
        today: new Date("2026-05-24T00:00:00.000Z"),
      },
    );

    expect(briefing.projectHealth.total).toBeGreaterThan(0);
    expect(briefing.summary.status).toBe("placeholder");
    expect(briefing.summary.citations.map(sourceKey)).toContain(
      `project:${visibleProject.id}`,
    );
  });

  it("keeps decisions today limited to decision/action sources due by today", async () => {
    const visibleProject = await createProject(
      { name: "Decision Briefing Project", status: "active" },
      projectRepository,
    );

    await seedMeetingFollowUp({
      dueDate: "2026-05-24",
      id: "meeting-due-today",
      projectId: visibleProject.id,
      title: "Meeting due today is not a decision",
    });
    await seedDecision({
      dueDate: "2026-05-24",
      id: "decision-due-today",
      projectId: visibleProject.id,
      text: "Decision due today",
    });
    await seedDecision({
      dueDate: "2026-05-30",
      id: "stale-future-decision",
      projectId: visibleProject.id,
      text: "Future decision should not be fallback",
    });

    const briefing = await getExecutiveMorningBriefingData(
      { id: "decision-briefing", role: "pending" },
      {
        repositories: {
          meetings: meetingRepository,
          projects: projectRepository,
          proposals: proposalRepository,
        },
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [
          {
            active: true,
            createdAt: "",
            id: "assignment-decision-briefing",
            permissionKeys: ["project.view", "meeting.view", "decision.create"],
            projectId: visibleProject.id,
            roleKey: "quan_ly_du_an",
            scopeType: "scoped",
            updatedAt: "",
            userId: "decision-briefing",
          },
        ],
        selectedScopeId: "all",
        today: new Date("2026-05-24T00:00:00.000Z"),
      },
    );

    expect(briefing.decisionsToday.map((item) => item.sourceId)).toContain(
      "decision-due-today",
    );
    expect(briefing.decisionsToday.map((item) => item.sourceId)).not.toContain(
      "meeting-due-today-follow-up",
    );
    expect(briefing.decisionsToday.map((item) => item.sourceId)).not.toContain(
      "stale-future-decision",
    );
    expect(
      briefing.decisionsToday.every((item) =>
        item.sourceType === "decision" || item.sourceType === "executive_action",
      ),
    ).toBe(true);
  });

  it("uses the AI pipeline when explicitly enabled and keeps app-generated citations", async () => {
    let capturedInput: AiAskInput | undefined;
    const briefing = await getExecutiveMorningBriefingData(
      { id: "ceo-01", role: "tong_giam_doc" },
      {
        aiSummary: {
          enabled: true,
          runAi: async (input) => {
            capturedInput = input;
            const ref = input.resourceRefs?.[0] ?? {
              entityId: "demo-project-riverside",
              entityType: "project",
            };

            return {
              interaction: {
                id: "interaction-morning-ai",
                requestedBy: "ceo-01",
                module: "general",
                intent: "Executive AI Summary",
                mode: "fast",
                promptSummary: "Executive AI Summary",
                responseText: "Morning AI draft tu provider [CIT-001]",
                modelProvider: "mock",
                modelName: "mock-summary",
                status: "succeeded",
                scopeSnapshot: {
                  userId: "ceo-01",
                  role: "tong_giam_doc",
                  permissions: [],
                  scopeKind: "internal_full",
                  module: "general",
                  resourceRefs: input.resourceRefs ?? [],
                  capturedAt: "2026-06-04T10:00:00.000Z",
                },
                createdAt: "2026-06-04T10:00:00.000Z",
                updatedAt: "2026-06-04T10:01:00.000Z",
                completedAt: "2026-06-04T10:01:00.000Z",
              },
              job: {
                id: "job-morning-ai",
                interactionId: "interaction-morning-ai",
                requestedBy: "ceo-01",
                module: "general",
                intent: "Executive AI Summary",
                mode: "fast",
                priority: "normal",
                status: "succeeded",
                scopeSnapshot: {
                  userId: "ceo-01",
                  role: "tong_giam_doc",
                  permissions: [],
                  scopeKind: "internal_full",
                  module: "general",
                  resourceRefs: input.resourceRefs ?? [],
                  capturedAt: "2026-06-04T10:00:00.000Z",
                },
                rateLimitKey: "ai:ceo-01",
                payload: {
                  intent: "Executive AI Summary",
                  knowledgeModule: "general",
                  prompt: input.prompt,
                  useRag: false,
                  wantsActionProposal: false,
                },
                createdAt: "2026-06-04T10:00:00.000Z",
                updatedAt: "2026-06-04T10:01:00.000Z",
                finishedAt: "2026-06-04T10:01:00.000Z",
              },
              citations: [
                {
                  id: "citation-morning-ai",
                  interactionId: "interaction-morning-ai",
                  jobId: "job-morning-ai",
                  citationType: "internal_record",
                  entityType: ref.entityType,
                  entityId: ref.entityId,
                  title: "AI generated source citation",
                  module: "project",
                  createdAt: "2026-06-04T10:01:00.000Z",
                },
              ],
              actionProposals: [],
            };
          },
          useProvider: true,
        },
        repositories: {
          meetings: meetingRepository,
          projects: projectRepository,
          proposals: proposalRepository,
        },
        requireScopeAssignments: false,
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments: [],
        today: new Date("2026-05-24T00:00:00.000Z"),
      },
    );

    expect(briefing.summary).toMatchObject({
      status: "draft",
      text: "Morning AI draft tu provider [CIT-001]",
      interactionId: "interaction-morning-ai",
      jobId: "job-morning-ai",
    });
    expect(briefing.summary.citations).toEqual([
      expect.objectContaining({
        sourceId: capturedInput?.resourceRefs?.[0]?.entityId,
        sourceType: capturedInput?.resourceRefs?.[0]?.entityType,
      }),
    ]);
  });

  it("keeps selected scope data visible without leaking hidden finance values", async () => {
    const visibleProject = await createProject(
      { name: "Visible Briefing Project", status: "active" },
      projectRepository,
    );
    const hiddenProject = await createProject(
      { name: "Hidden Finance Project", status: "active" },
      projectRepository,
    );
    await seedProposal({
      amount: 111_000_000,
      dueDate: "2026-05-20",
      id: "visible-approval",
      projectId: visibleProject.id,
      title: "Visible scoped approval",
    });
    await seedProposal({
      amount: 222_000_000,
      dueDate: "2026-05-20",
      id: "hidden-approval",
      projectId: hiddenProject.id,
      title: "Hidden finance approval",
    });

    const scopeAssignments: ScopeAssignment[] = [
      {
        active: true,
        createdAt: "",
        id: "assignment-visible-briefing",
        permissionKeys: ["project.view", "proposal.view"],
        projectId: visibleProject.id,
        roleKey: "dau_tu_phat_trien",
        scopeType: "scoped",
        updatedAt: "",
        userId: "scoped-briefing",
      },
    ];
    const briefing = await getExecutiveMorningBriefingData(
      { id: "scoped-briefing", role: "pending" },
      {
        repositories: {
          meetings: meetingRepository,
          projects: projectRepository,
          proposals: proposalRepository,
        },
        rolePermissionCatalog: createDefaultRolePermissionCatalog(),
        scopeAssignments,
        selectedScopeId: "all",
        today: new Date("2026-05-24T00:00:00.000Z"),
      },
    );
    const serialized = JSON.stringify(briefing);

    expect(briefing.overdueApprovals.map((item) => item.sourceId)).toContain(
      "visible-approval",
    );
    expect(briefing.overdueApprovals.map((item) => item.sourceId)).not.toContain(
      "hidden-approval",
    );
    expect(serialized).not.toContain("222000000");
    expect(serialized).not.toContain("222.000.000");
    expect(serialized).not.toContain("Hidden finance approval");
    expect(serialized).not.toContain("cashFlowLabel");
    expect(serialized).not.toContain("budgetLabel");
    expect(
      briefing.summary.citations.every((citation) => citation.sourceId !== "hidden-approval"),
    ).toBe(true);
  });
});
