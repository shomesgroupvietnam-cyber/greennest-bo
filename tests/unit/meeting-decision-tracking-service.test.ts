import { describe, expect, it, vi } from "vitest";

import type { PermissionUser } from "@/lib/permissions/can";
import { getMeetingDecisionTrackingData } from "@/modules/meetings/services/meeting-decision-tracking-service";
import type {
  Decision,
  DecisionAssignment,
  DecisionVersion,
  Meeting,
} from "@/modules/meetings/types";
import type { Task } from "@/modules/tasks/types";
import type { AuditLog } from "@/modules/users/types";

const actor: PermissionUser = { id: "leader-01", role: "super_admin" };

function meeting(overrides: Partial<Meeting> = {}): Meeting {
  return {
    aiSummary: { status: "DRAFT" },
    attachments: [],
    auditLog: [],
    createdAt: "2026-06-01T00:00:00.000Z",
    decisions: [],
    externalParticipants: [],
    followUpActions: [],
    id: "meeting-01",
    meetingDate: "2026-06-05T09:00:00.000Z",
    meetingMinutesApproval: { status: "DRAFT" },
    meetingType: "EXECUTIVE_MEETING",
    organizationId: "org-green-nest",
    participants: ["leader-01"],
    participantScope: "all_leadership",
    projectId: "project-a",
    projectIds: ["project-a", "project-b"],
    relatedApprovals: [],
    relatedRecords: [
      {
        id: "decision-linked",
        relationType: "context",
        title: "Linked decision title should be ignored if out of scope",
        type: "decision",
      },
      {
        id: "decision-hidden",
        relationType: "context",
        title: "Hidden decision title must not leak",
        type: "decision",
      },
    ],
    relatedTasks: [],
    startTime: "2026-06-05T09:00:00.000Z",
    status: "COMPLETED",
    title: "Weekly leadership meeting",
    updatedAt: "2026-06-01T00:00:00.000Z",
    visibility: "executive",
    ...overrides,
  };
}

function decision(overrides: Partial<Decision> = {}): Decision {
  return {
    id: overrides.id ?? "decision-direct",
    title: overrides.title ?? "Approve contractor acceleration",
    organizationId: overrides.organizationId ?? "org-green-nest",
    meetingId: overrides.meetingId,
    projectId: overrides.projectId ?? "project-a",
    projectIds: overrides.projectIds ?? [overrides.projectId ?? "project-a"],
    decisionText:
      overrides.decisionText ?? "Sensitive decision body must stay summarized.",
    sourceType: overrides.sourceType ?? "meeting",
    sourceId: overrides.sourceId ?? "meeting-01",
    linkedRecords: overrides.linkedRecords ?? [
      {
        id: "meeting-01",
        relationType: "source",
        title: "Weekly leadership meeting",
        type: "meeting",
      },
    ],
    ownerId: overrides.ownerId ?? "owner-01",
    priority: overrides.priority ?? "high",
    dueDate: overrides.dueDate ?? "2026-06-10",
    status: overrides.status ?? "open",
    createdBy: overrides.createdBy ?? "leader-01",
    decidedBy: overrides.decidedBy ?? "leader-01",
    decidedAt: overrides.decidedAt ?? "2026-06-01T01:00:00.000Z",
    createdAt: overrides.createdAt ?? "2026-06-01T01:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-06-01T02:00:00.000Z",
  };
}

function assignment(overrides: Partial<DecisionAssignment> = {}): DecisionAssignment {
  return {
    id: overrides.id ?? "assignment-01",
    decisionId: overrides.decisionId ?? "decision-direct",
    taskId: "taskId" in overrides ? overrides.taskId : "task-visible",
    organizationId: overrides.organizationId ?? "org-green-nest",
    projectId: overrides.projectId ?? "project-a",
    assigneeType: overrides.assigneeType ?? "user",
    assigneeId: overrides.assigneeId ?? "owner-01",
    departmentId: overrides.departmentId,
    title: overrides.title ?? "Prepare acceleration plan",
    description: overrides.description,
    kpi: overrides.kpi ?? "Plan approved by Friday",
    dueDate: overrides.dueDate ?? "2026-06-02",
    priority: overrides.priority ?? "high",
    status: overrides.status ?? "assigned",
    createdBy: overrides.createdBy ?? "leader-01",
    createdAt: overrides.createdAt ?? "2026-06-01T02:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-06-01T02:00:00.000Z",
  };
}

const task: Task = {
  id: "task-visible",
  projectId: "project-a",
  title: "Visible execution task",
  status: "in_progress",
  priority: "high",
  linkedEntityType: "decision",
  linkedEntityId: "decision-direct",
  createdAt: "2026-06-01T02:00:00.000Z",
  updatedAt: "2026-06-01T02:00:00.000Z",
};

const version: DecisionVersion = {
  id: "version-01",
  decisionId: "decision-direct",
  versionNumber: 1,
  changedFields: ["decisionText", "dueDate"],
  previousValue: {
    decisionText: "Raw previous instruction",
    dueDate: "2026-06-08",
  },
  newValue: {
    decisionText: "Raw new instruction",
    dueDate: "2026-06-10",
  },
  reason: "Adjust after meeting",
  createdBy: "leader-01",
  createdAt: "2026-06-01T03:00:00.000Z",
  updatedAt: "2026-06-01T03:00:00.000Z",
};

const auditLog: AuditLog = {
  id: "audit-01",
  actorId: "leader-01",
  entityType: "decision",
  entityId: "decision-direct",
  action: "decision.updated",
  oldValue: {
    decisionText: "Raw audit old value",
  },
  newValue: {
    changedFields: ["decisionText"],
    summary: "Decision instruction updated",
    decisionText: "Raw audit new value",
  },
  createdAt: "2026-06-01T03:05:00.000Z",
};

describe("meeting decision tracking service", () => {
  it("builds scoped tracking data from direct and linked decisions without leaking hidden records", async () => {
    const data = await getMeetingDecisionTrackingData(actor, meeting(), {
      auditLogLoader: async () => [auditLog],
      decisionLoader: async () => [
        decision({ id: "decision-direct", meetingId: "meeting-01" }),
        decision({
          id: "decision-source-only",
          meetingId: undefined,
          sourceId: "meeting-01",
          title: "Source-only meeting decision",
        }),
      ],
      getScopedDecision: async (_user, decisionId) =>
        decisionId === "decision-linked"
          ? decision({
              id: "decision-linked",
              sourceType: "independent",
              sourceId: undefined,
              title: "Visible linked decision",
            })
          : undefined,
      getScopedTask: async (_user, taskId) =>
        taskId === "task-visible" ? task : undefined,
      assignmentLoader: async (filters) =>
        filters?.decisionId === "decision-direct"
          ? [
              assignment(),
              assignment({
                id: "assignment-hidden-task",
                taskId: "task-hidden",
                dueDate: "2026-06-01",
              }),
              assignment({
                id: "assignment-due-soon",
                taskId: undefined,
                dueDate: "2026-06-08",
              }),
            ]
          : [],
      versionLoader: async (decisionId) =>
        decisionId === "decision-direct" ? [version] : [],
      now: () => "2026-06-03T00:00:00.000Z",
    });

    expect(data.items.map((item) => item.decisionId)).toEqual([
      "decision-direct",
      "decision-source-only",
      "decision-linked",
    ]);
    expect(JSON.stringify(data)).not.toContain("decision-hidden");
    expect(JSON.stringify(data)).not.toContain("Hidden decision title");
    expect(JSON.stringify(data)).not.toContain("Sensitive decision body");

    const direct = data.items[0];
    expect(direct.assignmentCount).toBe(3);
    expect(direct.decisionHref).toBe(
      "/command-center?decisionId=decision-direct&view=executive-decision-log",
    );
    expect(direct.dueSoonAssignmentCount).toBe(1);
    expect(direct.overdueAssignmentCount).toBe(2);
    expect(direct.assignments[0]).toMatchObject({
      executionStatus: "in_progress",
      taskHref: "/tasks/task-visible",
      taskTitle: "Visible execution task",
    });
    expect(direct.assignments[1]).toMatchObject({
      hasHiddenTask: true,
      taskHref: undefined,
      taskTitle: undefined,
    });

    expect(JSON.stringify(direct.history)).not.toContain("Raw previous");
    expect(JSON.stringify(direct.history)).not.toContain("Raw audit");
    expect(direct.history).toEqual([
      expect.objectContaining({ action: "decision.updated", type: "audit" }),
      expect.objectContaining({ type: "version", versionNumber: 1 }),
    ]);
  });

  it("does not load audit logs when the actor cannot view audit", async () => {
    const auditLogLoader = vi.fn(async () => [auditLog]);

    const data = await getMeetingDecisionTrackingData(
      { id: "viewer-01", role: "viewer" },
      meeting({ relatedRecords: [] }),
      {
        auditLogLoader,
        decisionLoader: async () => [
          decision({ id: "decision-direct", meetingId: "meeting-01" }),
        ],
        assignmentLoader: async () => [],
        versionLoader: async () => [version],
        now: () => "2026-06-03T00:00:00.000Z",
      },
    );

    expect(auditLogLoader).not.toHaveBeenCalled();
    expect(data.items[0].history).toEqual([
      expect.objectContaining({ type: "version" }),
    ]);
  });

  it("uses the business local date when counting overdue assignments", async () => {
    const data = await getMeetingDecisionTrackingData(
      actor,
      meeting({ relatedRecords: [] }),
      {
        decisionLoader: async () => [
          decision({ id: "decision-direct", meetingId: "meeting-01" }),
        ],
        assignmentLoader: async () => [
          assignment({
            dueDate: "2026-06-02",
            taskId: undefined,
          }),
        ],
        versionLoader: async () => [],
        now: () => "2026-06-02T18:00:00.000Z",
      },
    );

    expect(data.items[0].overdueAssignmentCount).toBe(1);
  });

  it("accepts meeting-scoped permission overrides for mutation controls", async () => {
    const canCreateDecisionForMeeting = vi.fn(async () => false);
    const canLinkDecisionForMeeting = vi.fn(async () => false);
    const targetMeeting = meeting({ relatedRecords: [] });

    const data = await getMeetingDecisionTrackingData(actor, targetMeeting, {
      canCreateDecisionForMeeting,
      canLinkDecisionForMeeting,
      decisionLoader: async () => [],
      assignmentLoader: async () => [],
      versionLoader: async () => [],
      now: () => "2026-06-03T00:00:00.000Z",
    });

    expect(data.permissions.canCreateDecision).toBe(false);
    expect(data.permissions.canLinkDecision).toBe(false);
    expect(canCreateDecisionForMeeting).toHaveBeenCalledWith(actor, targetMeeting);
    expect(canLinkDecisionForMeeting).toHaveBeenCalledWith(actor, targetMeeting);
  });
});
