import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PermissionUser } from "@/lib/permissions/can";
import { updateDecisionAssignmentLifecycle } from "@/modules/executive/services/decision-assignment-lifecycle-service";
import { JsonMeetingRepository } from "@/modules/meetings/services/meeting-repository";
import type { Decision, DecisionAssignment } from "@/modules/meetings/types";
import { JsonProjectRepository } from "@/modules/projects/services/project-repository";
import { createProject } from "@/modules/projects/services/project-service";
import { JsonTaskRepository } from "@/modules/tasks/services/task-repository";
import type { Task } from "@/modules/tasks/types";
import type { AuditLog } from "@/modules/users/types";

let tempDir: string;
let meetingRepository: JsonMeetingRepository;
let projectRepository: JsonProjectRepository;
let taskRepository: JsonTaskRepository;
let auditWrites: Array<Omit<AuditLog, "id" | "createdAt">>;

const actor: PermissionUser = { id: "leader-01", role: "tong_giam_doc" };
const timestamp = "2026-06-07T08:00:00.000Z";

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-assignment-lifecycle-"));
  meetingRepository = new JsonMeetingRepository(path.join(tempDir, "meetings-decisions.json"));
  projectRepository = new JsonProjectRepository(path.join(tempDir, "project-core.json"));
  taskRepository = new JsonTaskRepository(path.join(tempDir, "task-management.json"));
  auditWrites = [];
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

function dependencies(
  overrides: Parameters<typeof updateDecisionAssignmentLifecycle>[2] = {},
) {
  return {
    repository: meetingRepository,
    taskRepository,
    projectRepository,
    getScopedDecision: async (_actor: PermissionUser, decisionId: string) =>
      meetingRepository.getDecision(decisionId),
    getScopedTask: async (_actor: PermissionUser, taskId: string) =>
      taskRepository.getTask(taskId),
    canUpdateDecisionAssignmentInScope: async () => true,
    canUpdateTaskInProject: async () => true,
    auditWriter: async (input: Omit<AuditLog, "id" | "createdAt">) => {
      auditWrites.push(input);
      return input;
    },
    now: () => timestamp,
    ...overrides,
  };
}

async function createDecision(overrides: Partial<Decision> = {}) {
  return meetingRepository.createDecision({
    id: overrides.id ?? "decision-01",
    title: overrides.title ?? "Official instruction",
    organizationId: overrides.organizationId ?? "org-green-nest",
    projectId: overrides.projectId,
    projectIds: overrides.projectIds ?? (overrides.projectId ? [overrides.projectId] : []),
    axisId: overrides.axisId ?? "axis-1",
    workstreamId: overrides.workstreamId ?? "decision",
    moduleId: overrides.moduleId ?? "meeting",
    decisionText:
      overrides.decisionText ??
      "Sensitive decision body should not be copied into lifecycle audit.",
    sourceType: overrides.sourceType ?? "independent",
    sourceId: overrides.sourceId,
    linkedRecords: overrides.linkedRecords ?? [],
    ownerId: overrides.ownerId ?? "owner-01",
    priority: overrides.priority ?? "high",
    kpi: overrides.kpi,
    dueDate: overrides.dueDate,
    status: overrides.status ?? "open",
    createdBy: overrides.createdBy ?? actor.id,
    decidedBy: overrides.decidedBy ?? actor.id,
    decidedAt: overrides.decidedAt ?? "2026-06-07T07:00:00.000Z",
    createdAt: overrides.createdAt ?? "2026-06-07T07:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-06-07T07:00:00.000Z",
  });
}

async function createTaskRecord(input: Partial<Task> & Pick<Task, "projectId">) {
  return taskRepository.createTask({
    id: input.id ?? "task-01",
    projectId: input.projectId,
    title: input.title ?? "Linked decision task",
    description: input.description ?? "Raw task detail should stay out of audit.",
    assigneeId: input.assigneeId,
    dueDate: input.dueDate,
    status: input.status ?? "todo",
    priority: input.priority ?? "high",
    category: input.category ?? "decision",
    linkedEntityType: input.linkedEntityType ?? "decision",
    linkedEntityId: input.linkedEntityId ?? "decision-01",
    createdBy: input.createdBy ?? actor.id,
    createdAt: input.createdAt ?? "2026-06-07T07:05:00.000Z",
    updatedAt: input.updatedAt ?? "2026-06-07T07:05:00.000Z",
  });
}

async function createAssignment(overrides: Partial<DecisionAssignment> = {}) {
  const [assignment] = await meetingRepository.createDecisionAssignments([
    {
      id: overrides.id ?? "assignment-01",
      decisionId: overrides.decisionId ?? "decision-01",
      taskId: overrides.taskId ?? "task-01",
      organizationId: overrides.organizationId ?? "org-green-nest",
      projectId: overrides.projectId ?? "project-a",
      assigneeType: overrides.assigneeType ?? "user",
      assigneeId: overrides.assigneeId ?? "owner-01",
      departmentId: overrides.departmentId,
      title: overrides.title ?? "Execute official instruction",
      description: overrides.description ?? "Sensitive assignment detail.",
      kpi: overrides.kpi,
      dueDate: overrides.dueDate,
      priority: overrides.priority ?? "high",
      status: overrides.status ?? "assigned",
      createdBy: overrides.createdBy ?? actor.id,
      createdAt: overrides.createdAt ?? "2026-06-07T07:05:00.000Z",
      updatedAt: overrides.updatedAt ?? "2026-06-07T07:05:00.000Z",
    },
  ]);

  return assignment;
}

describe("decision assignment lifecycle service", () => {
  it("updates assignment status, syncs linked task status, and writes safe audit summary", async () => {
    const project = await createProject({ name: "Lifecycle project", status: "active" }, projectRepository);
    const decision = await createDecision({ projectId: project.id });
    const task = await createTaskRecord({
      id: "task-01",
      linkedEntityId: decision.id,
      projectId: project.id,
      status: "todo",
    });
    const assignment = await createAssignment({
      decisionId: decision.id,
      projectId: project.id,
      taskId: task.id,
    });

    const result = await updateDecisionAssignmentLifecycle(
      {
        assignmentId: assignment.id,
        reason: "Bat dau xu ly theo chi dao.",
        status: "in_progress",
      },
      actor,
      dependencies(),
    );

    expect(result.assignment.status).toBe("in_progress");
    expect(result.task?.status).toBe("in_progress");
    await expect(meetingRepository.listDecisionAssignments({ decisionId: decision.id })).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: assignment.id,
          status: "in_progress",
          updatedAt: timestamp,
        }),
      ]),
    );
    await expect(taskRepository.getTask(task.id)).resolves.toMatchObject({
      status: "in_progress",
      updatedAt: timestamp,
    });
    expect(auditWrites).toHaveLength(1);
    expect(auditWrites[0]).toMatchObject({
      action: "decision.assignment_lifecycle_updated",
      actorId: actor.id,
      entityId: decision.id,
      entityType: "decision",
      newValue: {
        assignmentId: assignment.id,
        decisionId: decision.id,
        nextAssignmentStatus: "in_progress",
        nextTaskStatus: "in_progress",
        previousAssignmentStatus: "assigned",
        previousTaskStatus: "todo",
        projectId: project.id,
        reasonProvided: true,
        taskId: task.id,
      },
    });
    expect(JSON.stringify(auditWrites[0])).not.toMatch(
      /Sensitive decision body|Sensitive assignment detail|Raw task detail/,
    );
  });

  it("keeps linked task unchanged when assignment is cancelled and task has no cancelled status", async () => {
    const project = await createProject({ name: "Cancel project", status: "active" }, projectRepository);
    const decision = await createDecision({ projectId: project.id });
    const task = await createTaskRecord({
      id: "task-cancel",
      linkedEntityId: decision.id,
      projectId: project.id,
      status: "in_progress",
    });
    const assignment = await createAssignment({
      decisionId: decision.id,
      projectId: project.id,
      status: "in_progress",
      taskId: task.id,
    });

    const result = await updateDecisionAssignmentLifecycle(
      {
        assignmentId: assignment.id,
        reason: "Khong tiep tuc giao viec.",
        status: "cancelled",
      },
      actor,
      dependencies(),
    );

    expect(result.assignment.status).toBe("cancelled");
    expect(result.task?.status).toBe("in_progress");
    expect(auditWrites[0].newValue).toMatchObject({
      nextAssignmentStatus: "cancelled",
      nextTaskStatus: "in_progress",
      previousTaskStatus: "in_progress",
    });
  });

  it("blocks lifecycle updates when assignment permission or task scope is missing", async () => {
    const project = await createProject({ name: "Permission project", status: "active" }, projectRepository);
    const decision = await createDecision({ projectId: project.id });
    const task = await createTaskRecord({
      linkedEntityId: decision.id,
      projectId: project.id,
      status: "todo",
    });
    const assignment = await createAssignment({
      decisionId: decision.id,
      projectId: project.id,
      taskId: task.id,
    });

    await expect(
      updateDecisionAssignmentLifecycle(
        { assignmentId: assignment.id, status: "done" },
        actor,
        dependencies({ canUpdateDecisionAssignmentInScope: async () => false }),
      ),
    ).rejects.toThrow(/khong co quyen/i);
    await expect(
      updateDecisionAssignmentLifecycle(
        { assignmentId: assignment.id, status: "done" },
        actor,
        dependencies({ getScopedTask: async () => undefined }),
      ),
    ).rejects.toThrow(/cong viec|scope|quyen/i);
    await expect(meetingRepository.listDecisionAssignments({ decisionId: decision.id })).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: assignment.id, status: "assigned" }),
      ]),
    );
    await expect(taskRepository.getTask(task.id)).resolves.toMatchObject({
      status: "todo",
    });
    expect(auditWrites).toHaveLength(0);
  });

  it("rolls assignment and task status back when audit write fails", async () => {
    const project = await createProject({ name: "Rollback project", status: "active" }, projectRepository);
    const decision = await createDecision({ projectId: project.id });
    const task = await createTaskRecord({
      linkedEntityId: decision.id,
      projectId: project.id,
      status: "todo",
    });
    const assignment = await createAssignment({
      decisionId: decision.id,
      projectId: project.id,
      taskId: task.id,
    });

    await expect(
      updateDecisionAssignmentLifecycle(
        { assignmentId: assignment.id, status: "done" },
        actor,
        dependencies({
          auditWriter: async () => {
            throw new Error("audit unavailable");
          },
        }),
      ),
    ).rejects.toThrow(/audit unavailable/i);

    await expect(meetingRepository.listDecisionAssignments({ decisionId: decision.id })).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: assignment.id, status: "assigned" }),
      ]),
    );
    await expect(taskRepository.getTask(task.id)).resolves.toMatchObject({
      status: "todo",
    });
  });
});
