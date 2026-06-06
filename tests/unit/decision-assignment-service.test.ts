import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PermissionUser } from "@/lib/permissions/can";
import { createDecisionAssignments } from "@/modules/executive/services/decision-assignment-service";
import { JsonMeetingRepository } from "@/modules/meetings/services/meeting-repository";
import type { Decision } from "@/modules/meetings/types";
import { JsonProjectRepository } from "@/modules/projects/services/project-repository";
import { createProject } from "@/modules/projects/services/project-service";
import { JsonTaskRepository } from "@/modules/tasks/services/task-repository";
import { JsonUserRepository } from "@/modules/users/services/user-repository";
import type { AuditLog } from "@/modules/users/types";

let tempDir: string;
let meetingRepository: JsonMeetingRepository;
let projectRepository: JsonProjectRepository;
let taskRepository: JsonTaskRepository;
let userRepository: JsonUserRepository;
let auditWrites: Array<Omit<AuditLog, "id" | "createdAt">>;

const actor: PermissionUser = { id: "leader-01", role: "tong_giam_doc" };

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-decision-assignments-"));
  meetingRepository = new JsonMeetingRepository(path.join(tempDir, "meetings-decisions.json"));
  projectRepository = new JsonProjectRepository(path.join(tempDir, "project-core.json"));
  taskRepository = new JsonTaskRepository(path.join(tempDir, "task-management.json"));
  userRepository = new JsonUserRepository(path.join(tempDir, "users.json"));
  auditWrites = [];
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

function dependencies(overrides: Parameters<typeof createDecisionAssignments>[2] = {}) {
  return {
    repository: meetingRepository,
    taskRepository,
    projectRepository,
    userRepository,
    getScopedDecision: async (_actor: PermissionUser, decisionId: string) => meetingRepository.getDecision(decisionId),
    getScopedProject: async (_actor: PermissionUser, projectId: string) => projectRepository.getProject(projectId),
    auditWriter: async (input: Omit<AuditLog, "id" | "createdAt">) => {
      auditWrites.push(input);
      return input;
    },
    listScopeAssignments: async () => [],
    listRolePermissionCatalog: async () => ({ roles: [], permissions: [], assignments: [] }),
    now: () => "2026-05-31T07:00:00.000Z",
    ...overrides,
  };
}

async function addProjectMembership(userId: string, projectId: string) {
  await userRepository.upsertProjectMembership({
    id: `membership-${userId}-${projectId}`,
    projectId,
    userId,
    role: "member",
    createdAt: "2026-05-31T06:00:00.000Z",
    updatedAt: "2026-05-31T06:00:00.000Z",
  });
}

async function createDecision(overrides: Partial<Decision> = {}) {
  return meetingRepository.createDecision({
    id: overrides.id ?? `decision-${crypto.randomUUID()}`,
    title: overrides.title ?? "Issue project instruction",
    organizationId: overrides.organizationId ?? "org-green-nest",
    projectId: overrides.projectId,
    projectIds: overrides.projectIds ?? (overrides.projectId ? [overrides.projectId] : []),
    axisId: overrides.axisId ?? "axis-1",
    workstreamId: overrides.workstreamId ?? "decision",
    moduleId: overrides.moduleId ?? "meeting",
    decisionText: overrides.decisionText ?? "Sensitive decision body that must not be copied to audit.",
    sourceType: overrides.sourceType ?? "independent",
    linkedRecords: overrides.linkedRecords ?? [],
    ownerId: overrides.ownerId,
    priority: overrides.priority ?? "high",
    dueDate: overrides.dueDate,
    status: overrides.status ?? "open",
    createdBy: overrides.createdBy ?? actor.id,
    decidedBy: overrides.decidedBy ?? actor.id,
    decidedAt: overrides.decidedAt ?? "2026-05-31T06:00:00.000Z",
    createdAt: overrides.createdAt ?? "2026-05-31T06:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-05-31T06:00:00.000Z",
  });
}

describe("decision assignment service", () => {
  it("creates multiple assignments and tasks linked back to a project-bound decision", async () => {
    const project = await createProject({ name: "Decision assignment project", status: "active" }, projectRepository);
    const decision = await createDecision({ projectId: project.id });
    await addProjectMembership("legal-manager", project.id);

    const result = await createDecisionAssignments(
      {
        decisionId: decision.id,
        assignments: [
          {
            assigneeType: "user",
            assigneeId: "legal-manager",
            title: "Prepare legal instruction",
            description: "Prepare follow-up task.",
            dueDate: "2026-06-05",
            priority: "high",
          },
          {
            assigneeType: "department",
            departmentId: "finance",
            title: "Confirm funding guardrail",
            kpi: "Funding decision is confirmed by 2026-06-07.",
            dueDate: "2026-06-07",
          },
        ],
      },
      actor,
      dependencies(),
    );

    const tasks = await taskRepository.listTasks({ projectId: project.id });
    const assignments = await meetingRepository.listDecisionAssignments({ decisionId: decision.id });

    expect(result.assignments).toHaveLength(2);
    expect(assignments.map((assignment) => assignment.status)).toEqual(["assigned", "assigned"]);
    expect(tasks).toHaveLength(2);
    expect(tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Prepare legal instruction",
          status: "todo",
          priority: "high",
          category: "decision",
          assigneeId: "legal-manager",
          linkedEntityType: "decision",
          linkedEntityId: decision.id,
          createdBy: actor.id,
        }),
        expect.objectContaining({
          title: "Confirm funding guardrail",
          status: "todo",
          priority: "medium",
          category: "decision",
          linkedEntityType: "decision",
          linkedEntityId: decision.id,
        }),
      ]),
    );
    expect(tasks.find((task) => task.title === "Confirm funding guardrail")?.assigneeId).toBeUndefined();
    expect(assignments.every((assignment) => assignment.taskId)).toBe(true);
    expect(assignments.some((assignment) => "acknowledgedAt" in assignment)).toBe(false);
    expect(auditWrites).toHaveLength(1);
    expect(auditWrites[0]).toMatchObject({
      actorId: actor.id,
      entityType: "decision",
      entityId: decision.id,
      action: "decision.assignments_created",
      oldValue: {},
      newValue: {
        decisionId: decision.id,
        assignmentCount: 2,
        projectIds: [project.id],
        assigneeIds: ["legal-manager"],
        departmentIds: ["finance"],
        status: "assigned",
      },
    });
    expect(JSON.stringify(auditWrites[0])).not.toMatch(/Sensitive decision body|Prepare follow-up task|Funding decision/);
  });

  it("rejects invalid batch items before writing any task, assignment, or success audit", async () => {
    const projectA = await createProject({ name: "Decision project A", status: "active" }, projectRepository);
    const projectB = await createProject({ name: "Decision project B", status: "active" }, projectRepository);
    const decision = await createDecision({ projectId: projectA.id });
    await addProjectMembership("legal-manager", projectA.id);

    await expect(
      createDecisionAssignments(
        {
          decisionId: decision.id,
          assignments: [
            {
              projectId: projectA.id,
              assigneeType: "user",
              assigneeId: "legal-manager",
              title: "Valid item should not be written",
            },
            {
              projectId: projectB.id,
              assigneeType: "user",
              assigneeId: "missing-user",
              title: "Invalid out-of-scope item",
            },
          ],
        },
        actor,
        dependencies(),
      ),
    ).rejects.toThrow(/pham vi decision|nguoi nhan/i);

    expect(await taskRepository.listTasks()).toHaveLength(0);
    expect(await meetingRepository.listDecisionAssignments()).toHaveLength(0);
    expect(auditWrites).toHaveLength(0);
  });

  it("rejects active user assignees that cannot read the target project", async () => {
    const project = await createProject({ name: "Hidden assignee project", status: "active" }, projectRepository);
    const decision = await createDecision({ projectId: project.id });

    await expect(
      createDecisionAssignments(
        {
          decisionId: decision.id,
          assignments: [
            {
              assigneeType: "user",
              assigneeId: "legal-manager",
              title: "Hidden task should not be created",
            },
          ],
        },
        actor,
        dependencies(),
      ),
    ).rejects.toThrow(/pham vi du an/i);

    expect(await taskRepository.listTasks()).toHaveLength(0);
    expect(await meetingRepository.listDecisionAssignments()).toHaveLength(0);
    expect(auditWrites).toHaveLength(0);
  });

  it("rejects non-date-only assignment due dates before writes", async () => {
    const project = await createProject({ name: "Date-only assignment project", status: "active" }, projectRepository);
    const decision = await createDecision({ projectId: project.id });

    await expect(
      createDecisionAssignments(
        {
          decisionId: decision.id,
          assignments: [
            {
              assigneeType: "project",
              title: "Invalid due date",
              dueDate: "2026-06-05T00:00:00.000Z",
            },
          ],
        },
        actor,
        dependencies(),
      ),
    ).rejects.toThrow(/han xu ly|date|deadline/i);

    expect(await taskRepository.listTasks()).toHaveLength(0);
    expect(await meetingRepository.listDecisionAssignments()).toHaveLength(0);
    expect(auditWrites).toHaveLength(0);
  });

  it("requires explicit project id for multi-project decisions and keeps targets inside decision scope", async () => {
    const projectA = await createProject({ name: "Decision project A", status: "active" }, projectRepository);
    const projectB = await createProject({ name: "Decision project B", status: "active" }, projectRepository);
    const projectC = await createProject({ name: "Decision project C", status: "active" }, projectRepository);
    const decision = await createDecision({ projectId: undefined, projectIds: [projectA.id, projectB.id] });

    await expect(
      createDecisionAssignments(
        {
          decisionId: decision.id,
          assignments: [
            {
              assigneeType: "project",
              title: "Ambiguous target",
            },
          ],
        },
        actor,
        dependencies(),
      ),
    ).rejects.toThrow(/projectId/i);

    await expect(
      createDecisionAssignments(
        {
          decisionId: decision.id,
          assignments: [
            {
              projectId: projectC.id,
              assigneeType: "project",
              title: "Wrong project",
            },
          ],
        },
        actor,
        dependencies(),
      ),
    ).rejects.toThrow(/pham vi decision/i);

    const result = await createDecisionAssignments(
      {
        decisionId: decision.id,
        assignments: [
          {
            projectId: projectB.id,
            assigneeType: "project",
            title: "Valid explicit target",
          },
        ],
      },
      actor,
      dependencies(),
    );

    expect(result.assignments).toEqual([
      expect.objectContaining({
        decisionId: decision.id,
        projectId: projectB.id,
        assigneeType: "project",
        status: "assigned",
      }),
    ]);
  });

  it("requires decision assignment authority in each target project", async () => {
    const projectA = await createProject({ name: "Scoped decision project A", status: "active" }, projectRepository);
    const projectB = await createProject({ name: "Scoped decision project B", status: "active" }, projectRepository);
    const decision = await createDecision({ projectId: undefined, projectIds: [projectA.id, projectB.id] });

    await expect(
      createDecisionAssignments(
        {
          decisionId: decision.id,
          assignments: [
            {
              projectId: projectB.id,
              assigneeType: "project",
              title: "Unauthorized target project",
            },
          ],
        },
        actor,
        dependencies({
          canAssignDecisionInScope: async (_actor, target) => target.project?.id === projectA.id,
        }),
      ),
    ).rejects.toThrow(/decision.*project/i);

    expect(await taskRepository.listTasks()).toHaveLength(0);
    expect(await meetingRepository.listDecisionAssignments()).toHaveLength(0);
    expect(auditWrites).toHaveLength(0);
  });

  it("rolls back created tasks when assignment persistence fails", async () => {
    const project = await createProject({ name: "Rollback assignment project", status: "active" }, projectRepository);
    const decision = await createDecision({ projectId: project.id });

    await expect(
      createDecisionAssignments(
        {
          decisionId: decision.id,
          assignments: [
            {
              assigneeType: "project",
              title: "Task should be removed",
            },
          ],
        },
        actor,
        dependencies({
          repository: {
            ...meetingRepository,
            listMeetings: meetingRepository.listMeetings.bind(meetingRepository),
            getMeeting: meetingRepository.getMeeting.bind(meetingRepository),
            createMeeting: meetingRepository.createMeeting.bind(meetingRepository),
            updateMeeting: meetingRepository.updateMeeting.bind(meetingRepository),
            listDecisions: meetingRepository.listDecisions.bind(meetingRepository),
            getDecision: meetingRepository.getDecision.bind(meetingRepository),
            createDecision: meetingRepository.createDecision.bind(meetingRepository),
            updateDecision: meetingRepository.updateDecision.bind(meetingRepository),
            listDecisionVersions: meetingRepository.listDecisionVersions.bind(meetingRepository),
            createDecisionVersion: meetingRepository.createDecisionVersion.bind(meetingRepository),
            deleteDecisionVersions: meetingRepository.deleteDecisionVersions.bind(meetingRepository),
            listDecisionAssignments: meetingRepository.listDecisionAssignments.bind(meetingRepository),
            deleteDecisionAssignments: meetingRepository.deleteDecisionAssignments.bind(meetingRepository),
            createDecisionAssignments: async () => {
              throw new Error("assignment write failed");
            },
          },
        }),
      ),
    ).rejects.toThrow(/assignment write failed/i);

    expect(await taskRepository.listTasks()).toHaveLength(0);
    expect(await meetingRepository.listDecisionAssignments()).toHaveLength(0);
    expect(auditWrites).toHaveLength(0);
  });

  it("rolls back assignments and tasks when success audit fails", async () => {
    const project = await createProject({ name: "Rollback audit project", status: "active" }, projectRepository);
    const decision = await createDecision({ projectId: project.id });

    await expect(
      createDecisionAssignments(
        {
          decisionId: decision.id,
          assignments: [
            {
              assigneeType: "project",
              title: "Audit failure should rollback",
            },
          ],
        },
        actor,
        dependencies({
          auditWriter: async () => {
            throw new Error("audit write failed");
          },
        }),
      ),
    ).rejects.toThrow(/audit write failed/i);

    expect(await taskRepository.listTasks()).toHaveLength(0);
    expect(await meetingRepository.listDecisionAssignments()).toHaveLength(0);
    expect(auditWrites).toHaveLength(0);
  });

  it("blocks cancelled decisions and task-create permission failures before writes", async () => {
    const project = await createProject({ name: "Cancelled decision project", status: "active" }, projectRepository);
    const decision = await createDecision({ projectId: project.id, status: "cancelled" });

    await expect(
      createDecisionAssignments(
        {
          decisionId: decision.id,
          assignments: [
            {
              assigneeType: "project",
              title: "Should not be assigned",
            },
          ],
        },
        actor,
        dependencies(),
      ),
    ).rejects.toThrow(/cancelled|huy/i);

    const openDecision = await createDecision({ projectId: project.id, status: "open" });

    await expect(
      createDecisionAssignments(
        {
          decisionId: openDecision.id,
          assignments: [
            {
              assigneeType: "project",
              title: "Permission denied",
            },
          ],
        },
        actor,
        dependencies({ canCreateTaskInProject: async () => false }),
      ),
    ).rejects.toThrow(/task.create|tao cong viec/i);

    expect(await taskRepository.listTasks()).toHaveLength(0);
    expect(await meetingRepository.listDecisionAssignments()).toHaveLength(0);
    expect(auditWrites).toHaveLength(0);
  });
});
