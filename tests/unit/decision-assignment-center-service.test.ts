import { describe, expect, it } from "vitest";

import type { PermissionUser } from "@/lib/permissions/can";
import { getDecisionAssignmentCenterData } from "@/modules/executive/services/decision-assignment-center-service";
import type { Decision, DecisionAssignment, DecisionVersion } from "@/modules/meetings/types";
import type { AuditLog } from "@/modules/users/types";

const actor: PermissionUser = { id: "leader-01", role: "chu_tich" };

function decision(overrides: Partial<Decision> = {}): Decision {
  return {
    id: overrides.id ?? "decision-01",
    title: overrides.title ?? "Approve site priority",
    organizationId: overrides.organizationId ?? "org-green-nest",
    projectId: overrides.projectId ?? "project-a",
    projectIds: overrides.projectIds ?? [overrides.projectId ?? "project-a"],
    decisionText: overrides.decisionText ?? "Move site priority to legal clearance.",
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
    kpi: overrides.kpi ?? "Clear blocker in 5 days",
    dueDate: overrides.dueDate ?? "2026-06-05",
    status: overrides.status ?? "open",
    createdBy: overrides.createdBy ?? "leader-01",
    decidedBy: overrides.decidedBy ?? "leader-01",
    decidedAt: overrides.decidedAt ?? "2026-05-31T07:00:00.000Z",
    createdAt: overrides.createdAt ?? "2026-05-31T07:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-05-31T07:00:00.000Z",
  };
}

function assignment(overrides: Partial<DecisionAssignment> = {}): DecisionAssignment {
  return {
    id: overrides.id ?? "assignment-01",
    decisionId: overrides.decisionId ?? "decision-01",
    taskId: overrides.taskId ?? "task-01",
    organizationId: overrides.organizationId ?? "org-green-nest",
    projectId: overrides.projectId ?? "project-a",
    assigneeType: overrides.assigneeType ?? "user",
    assigneeId: overrides.assigneeId ?? "owner-01",
    departmentId: overrides.departmentId,
    title: overrides.title ?? "Prepare legal clearance plan",
    description: overrides.description ?? "Raw assignment detail should stay in assignment only.",
    kpi: overrides.kpi ?? "Plan ready by due date",
    dueDate: overrides.dueDate ?? "2026-06-03",
    priority: overrides.priority ?? "high",
    status: overrides.status ?? "assigned",
    createdBy: overrides.createdBy ?? "leader-01",
    createdAt: overrides.createdAt ?? "2026-05-31T07:05:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-05-31T07:05:00.000Z",
  };
}

const version: DecisionVersion = {
  id: "version-01",
  decisionId: "decision-01",
  versionNumber: 2,
  changedFields: ["dueDate", "decisionText"],
  previousValue: {
    dueDate: "2026-06-01",
    decisionText: "Sensitive previous instruction",
  },
  newValue: {
    dueDate: "2026-06-05",
    decisionText: "Sensitive new instruction",
  },
  reason: "Extend deadline.",
  createdBy: "leader-01",
  createdAt: "2026-05-31T08:00:00.000Z",
  updatedAt: "2026-05-31T08:00:00.000Z",
};

const auditLog: AuditLog = {
  id: "audit-01",
  actorId: "leader-01",
  entityType: "decision",
  entityId: "decision-01",
  action: "decision.updated",
  oldValue: {
    decisionText: "Do not expose this raw old value",
  },
  newValue: {
    changedFields: ["dueDate", "decisionText"],
    summary: "Decision deadline updated",
    decisionText: "Do not expose this raw new value",
  },
  createdAt: "2026-05-31T08:05:00.000Z",
};

const scopeDependencies = {
  documentLoader: async () => [],
  membershipLoader: async () => [],
  rawTaskLoader: async () => [],
  scopeAssignments: [],
};

describe("decision assignment center service", () => {
  it("returns scoped decision center data without leaking out-of-scope assignments", async () => {
    const result = await getDecisionAssignmentCenterData(
      actor,
      {},
      {
        ...scopeDependencies,
        auditLogLoader: async () => [auditLog],
        decisionLoader: async () => [decision()],
        assignmentLoader: async () => [
          assignment(),
          assignment({
            id: "assignment-hidden-decision",
            decisionId: "decision-hidden",
            projectId: "project-a",
          }),
          assignment({
            id: "assignment-hidden-project",
            decisionId: "decision-01",
            projectId: "project-b",
          }),
        ],
        taskLoader: async () => [
          {
            id: "task-01",
            projectId: "project-a",
            title: "Prepare legal clearance plan",
            status: "in_progress",
            priority: "high",
            createdAt: "2026-05-31T07:05:00.000Z",
            updatedAt: "2026-05-31T07:05:00.000Z",
          },
        ],
        versionLoader: async () => [version],
        now: () => "2026-05-31T09:00:00.000Z",
      },
    );

    expect(result.permissions.canView).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      assignmentCount: 1,
      latestVersionNumber: 2,
      openAssignmentCount: 1,
      source: {
        href: "/meetings/meeting-01",
        label: "Weekly leadership meeting",
        type: "meeting",
      },
    });
    expect(result.selectedDecision?.assignments).toHaveLength(1);
    expect(result.selectedDecision?.assignments[0]).toMatchObject({
      executionStatus: "in_progress",
      taskHref: "/tasks/task-01",
    });
    expect(JSON.stringify(result)).not.toContain("decision-hidden");
    expect(JSON.stringify(result)).not.toContain("assignment-hidden-project");
  });

  it("builds sanitized linked source and history events for selected detail", async () => {
    const result = await getDecisionAssignmentCenterData(
      actor,
      { selectedDecisionId: "decision-01" },
      {
        ...scopeDependencies,
        auditLogLoader: async () => [auditLog],
        decisionLoader: async () => [decision()],
        assignmentLoader: async () => [assignment()],
        taskLoader: async () => [],
        versionLoader: async () => [version],
        now: () => "2026-05-31T09:00:00.000Z",
      },
    );

    expect(result.selectedDecision?.linkedSources).toEqual([
      expect.objectContaining({
        href: "/meetings/meeting-01",
        label: "Weekly leadership meeting",
        relationType: "source",
        type: "meeting",
      }),
    ]);
    expect(result.selectedDecision?.history).toEqual([
      expect.objectContaining({ action: "decision.updated", type: "audit" }),
      expect.objectContaining({ type: "version", versionNumber: 2 }),
    ]);
    expect(JSON.stringify(result.selectedDecision?.history)).not.toContain(
      "Do not expose this raw",
    );
    expect(JSON.stringify(result.selectedDecision?.history)).not.toContain(
      "Sensitive previous instruction",
    );
  });

  it("does not call raw loaders when the user cannot view the center", async () => {
    let called = false;

    const result = await getDecisionAssignmentCenterData(
      { id: "pending-01", role: "pending" },
      {},
      {
        ...scopeDependencies,
        decisionLoader: async () => {
          called = true;
          return [decision()];
        },
        now: () => "2026-05-31T09:00:00.000Z",
      },
    );

    expect(result.permissions.canView).toBe(false);
    expect(result.items).toEqual([]);
    expect(called).toBe(false);
  });
});
