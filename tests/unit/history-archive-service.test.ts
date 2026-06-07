import { describe, expect, it, vi } from "vitest";

import type { PermissionAction, PermissionUser } from "@/lib/permissions/can";
import type { Document, DocumentVersion } from "@/modules/documents/types";
import type { ExternalSearchLog } from "@/modules/knowledge/types";
import type { Decision, DecisionAssignment, DecisionVersion, Meeting } from "@/modules/meetings/types";
import type { Project } from "@/modules/projects/types";
import type { Proposal, ProposalDecision, ProposalDetail, ProposalLink, ProposalStep } from "@/modules/proposals/types";
import { getHistoryArchiveData } from "@/modules/reports/services/history-archive-service";
import { historyArchiveFilterSchema } from "@/modules/reports/validation";
import type { RolePermissionCatalog, ScopeAssignment } from "@/modules/settings/types";
import type { Task } from "@/modules/tasks/types";
import type { AuditLog } from "@/modules/users/types";

const roleCatalog = (permissionKeys: PermissionAction[] = []): RolePermissionCatalog => ({
  assignments: [],
  permissions: [],
  roles: [
    {
      active: true,
      key: "viewer",
      labelVi: "Viewer",
      permissionKeys,
      scope: "project",
    },
  ],
});

const viewer: PermissionUser = {
  id: "viewer-01",
  role: "pending",
  permissions: [
    "report.view",
    "proposal.view",
    "meeting.view",
    "document.view",
    "knowledge.view",
    "task.view",
  ],
  permissionsMode: "replace",
};

const auditor: PermissionUser = {
  id: "auditor-01",
  role: "pending",
  permissions: [
    "report.view",
    "audit.view",
    "proposal.view",
    "meeting.view",
    "document.view",
    "knowledge.review",
  ],
  permissionsMode: "replace",
};

const projectRecord: Project = {
  code: "P-A",
  createdAt: "2026-06-01T00:00:00.000Z",
  id: "project-a",
  name: "Green Nest A",
  status: "active",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

const taskRecord: Task = {
  assigneeId: "owner-01",
  createdAt: "2026-06-01T02:04:00.000Z",
  id: "task-01",
  linkedEntityId: "decision-01",
  linkedEntityType: "decision",
  priority: "high",
  projectId: "project-a",
  status: "in_progress",
  title: "Prepare acceleration plan",
  updatedAt: "2026-06-01T02:05:00.000Z",
};

function proposal(overrides: Partial<Proposal> = {}): Proposal {
  return {
    aiReviewStatus: "not_checked",
    amount: 123_456_789,
    code: "DX-001",
    createdAt: "2026-06-01T01:00:00.000Z",
    id: "proposal-01",
    module: "finance",
    ownerId: "owner-01",
    priority: "high",
    projectId: "project-a",
    requestedBy: "requester-01",
    status: "approved",
    summary: "Sensitive proposal summary must not be copied into history.",
    title: "Budget approval",
    type: "finance",
    updatedAt: "2026-06-01T04:00:00.000Z",
    ...overrides,
  };
}

const proposalDecision: ProposalDecision = {
  decision: "approved",
  decidedAt: "2026-06-01T03:00:00.000Z",
  decidedBy: "leader-01",
  id: "proposal-decision-01",
  nextStatus: "approved",
  notes: "Raw approval note should stay out.",
  previousStatus: "in_review",
  proposalId: "proposal-01",
  version: 2,
};

const proposalStep: ProposalStep = {
  approvalLevel: "CEO",
  createdAt: "2026-06-01T02:50:00.000Z",
  decidedAt: "2026-06-01T03:10:00.000Z",
  decidedBy: "leader-01",
  decisionNotes: "Sensitive step note must stay out.",
  id: "proposal-step-01",
  proposalId: "proposal-01",
  status: "approved",
  stepOrder: 1,
  updatedAt: "2026-06-01T03:10:00.000Z",
};

const proposalLink: ProposalLink = {
  createdAt: "2026-06-01T03:20:00.000Z",
  entityId: "hidden-document-01",
  entityType: "document",
  id: "proposal-link-01",
  proposalId: "proposal-01",
  relationType: "evidence",
};

function proposalDetail(overrides: Partial<ProposalDetail> = {}): ProposalDetail {
  return {
    decisions: [proposalDecision],
    links: [],
    proposal: proposal(),
    steps: [],
    ...overrides,
    attachments: overrides.attachments ?? [],
  };
}

function decision(overrides: Partial<Decision> = {}): Decision {
  return {
    createdAt: "2026-06-01T02:00:00.000Z",
    createdBy: "leader-01",
    decidedAt: "2026-06-01T02:00:00.000Z",
    decidedBy: "leader-01",
    decisionText: "Sensitive decision body must not appear in archive events.",
    id: "decision-01",
    linkedRecords: [
      {
        id: "proposal-01",
        relationType: "source",
        title: "Budget approval",
        type: "approval",
      },
    ],
    meetingId: "meeting-01",
    organizationId: "org-green-nest",
    ownerId: "owner-01",
    priority: "high",
    projectId: "project-a",
    projectIds: ["project-a"],
    sourceId: "proposal-01",
    sourceType: "approval",
    status: "open",
    title: "Approve acceleration plan",
    updatedAt: "2026-06-01T02:30:00.000Z",
    ...overrides,
  };
}

function assignment(overrides: Partial<DecisionAssignment> = {}): DecisionAssignment {
  return {
    assigneeId: "owner-01",
    assigneeType: "user",
    createdAt: "2026-06-01T02:05:00.000Z",
    createdBy: "leader-01",
    decisionId: "decision-01",
    description: "Sensitive assignment detail must stay private.",
    id: "assignment-01",
    kpi: "Private KPI",
    priority: "high",
    projectId: "project-a",
    status: "assigned",
    taskId: "task-01",
    title: "Prepare acceleration plan",
    updatedAt: "2026-06-01T02:05:00.000Z",
    ...overrides,
  };
}

const decisionVersion: DecisionVersion = {
  changedFields: ["decisionText", "dueDate"],
  createdAt: "2026-06-01T02:40:00.000Z",
  createdBy: "leader-01",
  decisionId: "decision-01",
  id: "decision-version-01",
  newValue: {
    decisionText: "Raw new decision body.",
    dueDate: "2026-06-10",
  },
  previousValue: {
    decisionText: "Raw previous decision body.",
    dueDate: "2026-06-08",
  },
  reason: "Safe reason.",
  updatedAt: "2026-06-01T02:40:00.000Z",
  versionNumber: 3,
};

function meeting(overrides: Partial<Meeting> = {}): Meeting {
  return {
    aiSummary: {
      approvedAt: "2026-06-01T05:10:00.000Z",
      approvedBy: "leader-01",
      content: "Raw AI summary must not appear.",
      status: "APPROVED",
    },
    attachments: [],
    auditLog: [
      {
        action: "meeting.minutes_updated",
        actorId: "assistant-01",
        createdAt: "2026-06-01T05:00:00.000Z",
        id: "meeting-audit-01",
        note: "minutes DRAFT->APPROVED",
      },
    ],
    createdAt: "2026-06-01T04:00:00.000Z",
    createdBy: "assistant-01",
    decisions: [],
    externalParticipants: [],
    followUpActions: [],
    id: "meeting-01",
    meetingDate: "2026-06-01T04:00:00.000Z",
    meetingMinutes: "Raw meeting minutes must not appear.",
    meetingMinutesApproval: {
      approvedAt: "2026-06-01T05:05:00.000Z",
      approvedBy: "leader-01",
      status: "APPROVED",
    },
    meetingType: "EXECUTIVE_MEETING",
    organizationId: "org-green-nest",
    participants: ["leader-01"],
    participantScope: "all_leadership",
    projectId: "project-a",
    projectIds: ["project-a"],
    relatedApprovals: ["proposal-01"],
    relatedRecords: [],
    relatedTasks: [],
    startTime: "2026-06-01T04:00:00.000Z",
    status: "COMPLETED",
    summary: "Safe meeting summary",
    title: "Leadership weekly",
    updatedAt: "2026-06-01T04:30:00.000Z",
    visibility: "executive",
    ...overrides,
  };
}

function documentRecord(overrides: Partial<Document> = {}): Document {
  return {
    approvalStatus: "approved",
    createdAt: "2026-06-01T00:00:00.000Z",
    docType: "legal_submission",
    externalUrl: "https://example.com/external.pdf",
    fileUrl: "https://example.com/file.pdf",
    id: "document-01",
    ownerId: "owner-01",
    projectId: "project-a",
    status: "complete",
    title: "Land dossier",
    updatedAt: "2026-06-01T06:00:00.000Z",
    version: "v2",
    ...overrides,
  };
}

const documentVersion: DocumentVersion = {
  documentId: "document-01",
  externalUrl: "https://example.com/version-external.pdf",
  fileUrl: "https://example.com/version-file.pdf",
  id: "document-version-01",
  notes: "Version accepted.",
  uploadedAt: "2026-06-01T06:00:00.000Z",
  uploadedBy: "owner-01",
  version: "v2",
};

const visibleAudit: AuditLog = {
  action: "decision.updated",
  actorId: "leader-01",
  createdAt: "2026-06-01T06:10:00.000Z",
  entityId: "decision-01",
  entityType: "decision",
  id: "audit-visible",
  newValue: {
    changedFields: ["status"],
    decisionText: "Raw audit new value.",
    summary: "Decision status updated",
  },
  oldValue: {
    decisionText: "Raw audit old value.",
    status: "open",
  },
};

const hiddenAudit: AuditLog = {
  ...visibleAudit,
  entityId: "decision-hidden",
  id: "audit-hidden",
  newValue: {
    summary: "Hidden decision title must not leak.",
  },
};

const ownSearchLog: ExternalSearchLog = {
  createdAt: "2026-06-01T06:20:00.000Z",
  id: "search-own",
  provider: "mock_web",
  providerMetadata: { token: "provider-secret" },
  query: "legal permit update",
  resultCount: 3,
  userId: "viewer-01",
};

const otherSearchLog: ExternalSearchLog = {
  ...ownSearchLog,
  id: "search-other",
  query: "other user's private search",
  userId: "other-user",
};

const baseDependencies = {
  assignmentLoader: async () => [
    assignment(),
    assignment({
      decisionId: "decision-hidden",
      id: "assignment-hidden",
      projectId: "project-hidden",
      taskId: "task-hidden",
      title: "Hidden assignment must not leak",
    }),
  ],
  decisionLoader: async () => [decision()],
  documentLoader: async () => [documentRecord()],
  documentVersionLoader: async () => [documentVersion],
  meetingLoader: async () => [meeting()],
  now: () => "2026-06-01T07:00:00.000Z",
  projectLoader: async () => [projectRecord],
  proposalDetailLoader: async () => proposalDetail(),
  proposalLoader: async () => [proposal()],
  rolePermissionCatalog: roleCatalog([
    "audit.view",
    "document.view",
    "knowledge.view",
    "meeting.view",
    "proposal.view",
    "report.view",
    "task.view",
  ]),
  scopeAssignments: [],
  searchLogLoader: async () => [ownSearchLog, otherSearchLog],
  taskLoader: async () => [taskRecord],
  versionLoader: async () => [decisionVersion],
};

function expectMetadataJsonSafe(data: Awaited<ReturnType<typeof getHistoryArchiveData>>) {
  JSON.parse(JSON.stringify(data));

  for (const item of data.items) {
    for (const value of Object.values(item.source.metadata ?? {})) {
      expect(value).not.toBeUndefined();
    }
  }
}

describe("history archive service", () => {
  it("aggregates visible live history without audit access or sensitive payloads", async () => {
    const auditLogLoader = vi.fn(async () => [visibleAudit]);

    const data = await getHistoryArchiveData(viewer, {}, {
      ...baseDependencies,
      auditLogLoader,
    });

    expect(data.permissions).toMatchObject({
      canView: true,
      canViewAudit: false,
    });
    expect(auditLogLoader).not.toHaveBeenCalled();
    expect(data.items.map((item) => item.type)).toEqual([
      "search",
      "document_version",
      "meeting",
      "meeting",
      "meeting",
      "meeting",
      "approval",
      "decision",
      "decision",
      "assignment",
    ]);
    expect(JSON.stringify(data)).not.toContain("123456789");
    expect(JSON.stringify(data)).not.toContain("Sensitive proposal summary");
    expect(JSON.stringify(data)).not.toContain("Sensitive decision body");
    expect(JSON.stringify(data)).not.toContain("Raw previous decision body");
    expect(JSON.stringify(data)).not.toContain("Sensitive assignment detail");
    expect(JSON.stringify(data)).not.toContain("Raw meeting minutes");
    expect(JSON.stringify(data)).not.toContain("Raw AI summary");
    expect(JSON.stringify(data)).not.toContain("https://example.com");
    expect(JSON.stringify(data)).not.toContain("Version accepted");
    expect(JSON.stringify(data)).not.toContain("other user's private search");
    expectMetadataJsonSafe(data);
    expect(data.items.find((item) => item.id === "document-version:document-version-01")).toMatchObject({
      href: "/documents/document-01",
      source: {
        sourceId: "document-01",
        sourceType: "document",
      },
    });
  });

  it("includes only visible sanitized audit events for audit viewers and keeps project-filtered audit", async () => {
    const data = await getHistoryArchiveData(auditor, { projectId: "project-a", type: "audit" }, {
      ...baseDependencies,
      auditLogLoader: async () => [visibleAudit, hiddenAudit],
      searchLogLoader: async () => [],
    });

    expect(data.permissions.canViewAudit).toBe(true);
    expect(data.items).toHaveLength(1);
    expect(data.items[0]).toMatchObject({
      actorId: "leader-01",
      id: "audit:audit-visible",
      scope: {
        projectId: "project-a",
      },
      source: {
        sourceId: "decision-01",
        sourceType: "decision",
      },
      summary: expect.stringContaining("changedFields: status"),
      type: "audit",
    });
    expect(JSON.stringify(data)).not.toContain("audit-hidden");
    expect(JSON.stringify(data)).not.toContain("Hidden decision title");
    expect(JSON.stringify(data)).not.toContain("Decision status updated");
    expect(JSON.stringify(data)).not.toContain("oldValue");
    expect(JSON.stringify(data)).not.toContain("newValue");
    expect(JSON.stringify(data)).not.toContain("Raw audit");
  });

  it("normalizes filters and counts total/source counts before applying limit", async () => {
    expect(
      historyArchiveFilterSchema.parse({
        actorId: "",
        dateTo: "2026-06-01",
        limit: "2",
        query: "  approve  ",
        severity: "critical",
        status: " ",
        type: "decision",
      }),
    ).toMatchObject({
      dateTo: "2026-06-01T23:59:59.999Z",
      limit: 2,
      query: "approve",
      severity: "critical",
      type: "decision",
    });
    const safeInvalidFilters = historyArchiveFilterSchema.parse({
      dateFrom: "2026-02-31",
      limit: "9999",
      module: "invalid-module",
      severity: "invalid-severity",
      type: "invalid-type",
    });

    expect(safeInvalidFilters).toMatchObject({ limit: 100 });
    expect(safeInvalidFilters.dateFrom).toBeUndefined();
    expect(safeInvalidFilters.module).toBeUndefined();
    expect(safeInvalidFilters.severity).toBeUndefined();
    expect(safeInvalidFilters.type).toBeUndefined();

    const data = await getHistoryArchiveData(viewer, {
      dateTo: "2026-06-01",
      limit: 1,
      query: "approve",
      type: "decision",
    }, {
      ...baseDependencies,
      auditLogLoader: async () => [visibleAudit],
      searchLogLoader: async () => [],
    });

    expect(data.items).toHaveLength(1);
    expect(data.items[0]).toMatchObject({
      id: "decision-version:decision-version-01",
      type: "decision",
    });
    expect(data.total).toBe(2);
    expect(data.sourceCounts).toMatchObject({ decision: 2 });
  });

  it("filters by severity before applying the result limit", async () => {
    const data = await getHistoryArchiveData(viewer, { severity: "critical" }, {
      ...baseDependencies,
      searchLogLoader: async () => [],
    });

    expect(data.items.length).toBeGreaterThan(0);
    expect(data.items.every((item) => item.severity === "critical")).toBe(true);
    expect(data.items.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        "approval:proposal-decision-01",
        "decision:decision-01",
        "assignment:assignment-01",
      ]),
    );
  });

  it("matches query text against visible project labels without exposing unscoped records", async () => {
    const data = await getHistoryArchiveData(viewer, { query: "Green Nest A" }, {
      ...baseDependencies,
      searchLogLoader: async () => [ownSearchLog],
    });

    expect(data.items.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        "approval:proposal-decision-01",
        "document-version:document-version-01",
      ]),
    );
    expect(data.items.map((item) => item.id)).not.toContain("search:search-own");
    expect(JSON.stringify(data)).not.toContain("project-hidden");
  });

  it("matches query text against visible actor identifiers", async () => {
    const data = await getHistoryArchiveData(viewer, { query: "leader-01" }, {
      ...baseDependencies,
      searchLogLoader: async () => [],
    });

    expect(data.items.length).toBeGreaterThan(0);
    expect(data.items.every((item) => JSON.stringify(item).includes("leader-01"))).toBe(true);
    expect(data.items.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        "approval:proposal-decision-01",
        "decision:decision-01",
      ]),
    );
  });

  it("loads search logs by user for non-review users and never exposes candidate creator peer queries", async () => {
    const candidateCreator: PermissionUser = {
      id: "viewer-01",
      role: "pending",
      permissions: ["report.view", "knowledge.create_candidate"],
      permissionsMode: "replace",
    };
    const searchLogLoader = vi.fn(async () => [ownSearchLog, otherSearchLog]);

    const data = await getHistoryArchiveData(candidateCreator, { type: "search" }, {
      ...baseDependencies,
      proposalLoader: async () => [],
      searchLogLoader,
    });

    expect(searchLogLoader).toHaveBeenCalledWith({ userId: "viewer-01" });
    expect(data.items.map((item) => item.id)).toEqual(["search:search-own"]);
    expect(JSON.stringify(data)).not.toContain("other user's private search");
  });

  it("does not load decision records for task-only viewers and emits only scoped assignment data", async () => {
    const taskOnly: PermissionUser = {
      id: "task-viewer-01",
      role: "pending",
      permissions: ["report.view", "task.view"],
      permissionsMode: "replace",
    };
    const decisionLoader = vi.fn(async () => [decision()]);

    const data = await getHistoryArchiveData(taskOnly, { type: "assignment" }, {
      ...baseDependencies,
      assignmentLoader: async () => [
        assignment(),
        assignment({
          id: "assignment-hidden-task",
          taskId: "task-hidden",
          title: "Hidden task assignment must not leak",
        }),
      ],
      decisionLoader,
      documentLoader: async () => [],
      meetingLoader: async () => [],
      proposalLoader: async () => [],
      searchLogLoader: async () => [],
      versionLoader: async () => [],
    });

    expect(decisionLoader).not.toHaveBeenCalled();
    expect(data.items).toHaveLength(1);
    expect(data.items[0]).toMatchObject({
      href: undefined,
      id: "assignment:assignment-01",
      summary: expect.stringContaining("quyet dinh bi gioi han quyen"),
      type: "assignment",
    });
    expect(JSON.stringify(data)).not.toContain("Approve acceleration plan");
    expect(JSON.stringify(data)).not.toContain("Hidden assignment must not leak");
    expect(JSON.stringify(data)).not.toContain("Hidden task assignment must not leak");
  });

  it("honors scoped grants before source loaders are skipped", async () => {
    const scopedViewer: PermissionUser = {
      id: "scoped-01",
      role: "pending",
      permissions: [],
      permissionsMode: "replace",
    };
    const scopeAssignments: ScopeAssignment[] = [
      {
        active: true,
        createdAt: "2026-06-01T00:00:00.000Z",
        id: "scope-proposal-view",
        permissionKeys: ["proposal.view"],
        projectId: "project-a",
        roleKey: "viewer",
        scopeType: "scoped",
        updatedAt: "2026-06-01T00:00:00.000Z",
        userId: "scoped-01",
      },
    ];
    const proposalLoader = vi.fn(async () => [proposal()]);

    const data = await getHistoryArchiveData(scopedViewer, {}, {
      ...baseDependencies,
      decisionLoader: async () => [],
      documentLoader: async () => [],
      meetingLoader: async () => [],
      proposalLoader,
      rolePermissionCatalog: roleCatalog(["proposal.view"]),
      scopeAssignments,
      searchLogLoader: async () => [],
    });

    expect(proposalLoader).toHaveBeenCalledWith(scopedViewer, { projectId: undefined });
    expect(data.items.map((item) => item.id)).toEqual(["approval:proposal-decision-01"]);
  });

  it("filters aggregate events to the selected command-center scope assignments before counts", async () => {
    const projectB: Project = {
      ...projectRecord,
      code: "P-B",
      id: "project-b",
      name: "Green Nest B",
    };
    const selectedScope: ScopeAssignment = {
      active: true,
      createdAt: "2026-06-01T00:00:00.000Z",
      id: "scope-project-a",
      permissionKeys: ["proposal.view", "report.view"],
      projectId: "project-a",
      roleKey: "viewer",
      scopeType: "scoped",
      updatedAt: "2026-06-01T00:00:00.000Z",
      userId: "viewer-01",
    };

    const data = await getHistoryArchiveData(viewer, {}, {
      ...baseDependencies,
      decisionLoader: async () => [],
      documentLoader: async () => [],
      meetingLoader: async () => [],
      projectLoader: async () => [projectRecord, projectB],
      proposalDetailLoader: async (_user, proposalId) => {
        const isProjectB = proposalId === "proposal-b";
        const proposalRecord = proposal({
          code: isProjectB ? "DX-B" : "DX-001",
          id: proposalId,
          projectId: isProjectB ? "project-b" : "project-a",
          title: isProjectB ? "Hidden project B approval" : "Budget approval",
        });

        return proposalDetail({
          decisions: [
            {
              ...proposalDecision,
              id: `decision-${proposalId}`,
              proposalId,
            },
          ],
          proposal: proposalRecord,
        });
      },
      proposalLoader: async () => [
        proposal(),
        proposal({
          code: "DX-B",
          id: "proposal-b",
          projectId: "project-b",
          title: "Hidden project B approval",
        }),
      ],
      scopeAssignments: [selectedScope],
      searchLogLoader: async () => [],
      taskLoader: async () => [],
      versionLoader: async () => [],
    });

    expect(data.items.map((item) => item.id)).toEqual(["approval:decision-proposal-01"]);
    expect(data.total).toBe(1);
    expect(data.sourceCounts).toMatchObject({ approval: 1 });
    expect(JSON.stringify(data)).not.toContain("DX-B");
    expect(JSON.stringify(data)).not.toContain("project-b");
  });

  it("maps proposal step/link history and keeps proposal detail failures partial", async () => {
    const data = await getHistoryArchiveData(viewer, { type: "approval" }, {
      ...baseDependencies,
      documentLoader: async () => [],
      meetingLoader: async () => [],
      proposalDetailLoader: async (_user, proposalId) => {
        if (proposalId === "proposal-broken") {
          throw new Error("detail failed");
        }

        return proposalDetail({
          links: [proposalLink],
          steps: [proposalStep],
        });
      },
      proposalLoader: async () => [
        proposal(),
        proposal({
          id: "proposal-broken",
          title: "Broken detail should not fail archive",
        }),
      ],
      searchLogLoader: async () => [],
    });

    expect(data.items.map((item) => item.id)).toEqual([
      "approval-link:proposal-link-01",
      "approval-step:proposal-step-01:2026-06-01T03:10:00.000Z",
      "approval:proposal-decision-01",
    ]);
    expect(JSON.stringify(data)).not.toContain("Sensitive step note");
    expect(JSON.stringify(data)).not.toContain("hidden-document-01");
    expect(JSON.stringify(data)).not.toContain("Broken detail");
  });
});
