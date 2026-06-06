import { can, type PermissionUser } from "@/lib/permissions/can";
import {
  canAccessScopedAction,
  requiresAssignmentScopeForRole
} from "@/lib/permissions/access-scope";
import {
  getScopedDecision as defaultGetScopedDecision,
  getScopedProject as defaultGetScopedProject
} from "@/lib/permissions/scoped-resources";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import { listActiveScopeAssignments } from "@/modules/settings/services/scope-assignment-service";
import type { RolePermissionCatalog, ScopeAssignment } from "@/modules/settings/types";
import { meetingRepository, type MeetingRepository } from "@/modules/meetings/services/meeting-repository";
import type {
  CreateDecisionAssignmentsInput,
  Decision,
  DecisionAssignment,
  DecisionAssignmentInput
} from "@/modules/meetings/types";
import { createDecisionAssignmentsInputSchema } from "@/modules/meetings/validation";
import type { Project } from "@/modules/projects/types";
import { projectRepository, type ProjectRepository } from "@/modules/projects/services/project-repository";
import type { Task } from "@/modules/tasks/types";
import { taskRepository, type TaskRepository } from "@/modules/tasks/services/task-repository";
import { createTask } from "@/modules/tasks/services/task-service";
import { createAuditLog } from "@/modules/users/services/user-service";
import { userRepository, type UserRepository } from "@/modules/users/services/user-repository";
import type { AuditLog, ProjectMembership } from "@/modules/users/types";

type AuditWriter = (input: Omit<AuditLog, "id" | "createdAt">) => Promise<unknown>;
type ScopedDecisionLoader = (actor: PermissionUser, decisionId: string) => Promise<Decision | undefined>;
type ScopedProjectLoader = (actor: PermissionUser, projectId: string) => Promise<Project | undefined>;
type TaskCreator = (
  input: Parameters<typeof createTask>[0],
  repository: TaskRepository,
  projects: ProjectRepository,
  metadata?: Parameters<typeof createTask>[3]
) => Promise<Task>;
type DecisionAssignChecker = (
  actor: PermissionUser,
  target: { decision: Decision; project?: Project }
) => Promise<boolean>;
type TaskCreateChecker = (actor: PermissionUser, target: { decision: Decision; project: Project }) => Promise<boolean>;
type ScopeAssignmentLoader = () => Promise<ScopeAssignment[]>;
type RolePermissionCatalogLoader = () => Promise<RolePermissionCatalog>;

type ValidatedAssignment = {
  input: Required<Pick<DecisionAssignmentInput, "assigneeType" | "title" | "priority">> &
    Omit<DecisionAssignmentInput, "assigneeType" | "title" | "priority">;
  project: Project;
};

export type DecisionAssignmentCreationResult = {
  decision: Decision;
  assignments: DecisionAssignment[];
  tasks: Task[];
};

export type DecisionAssignmentServiceDependencies = {
  repository?: MeetingRepository;
  taskRepository?: TaskRepository;
  projectRepository?: ProjectRepository;
  userRepository?: Pick<UserRepository, "getUser" | "listProjectMemberships">;
  getScopedDecision?: ScopedDecisionLoader;
  getScopedProject?: ScopedProjectLoader;
  canAssignDecisionInScope?: DecisionAssignChecker;
  canCreateTaskInProject?: TaskCreateChecker;
  listScopeAssignments?: ScopeAssignmentLoader;
  listRolePermissionCatalog?: RolePermissionCatalogLoader;
  taskCreator?: TaskCreator;
  auditWriter?: AuditWriter;
  idGenerator?: () => string;
  now?: () => string;
};

function createId() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

function unique(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function decisionProjectIds(decision: Decision) {
  return unique([decision.projectId, ...(decision.projectIds ?? [])]);
}

function decisionScopeTargets(decision: Decision, project?: Project) {
  const projectIds = project ? [project.id] : decisionProjectIds(decision);
  const baseTarget = {
    organizationId: decision.organizationId,
    axisId: decision.axisId,
    workstreamId: decision.workstreamId ?? "decision",
    moduleId: decision.moduleId ?? "meeting",
    recordId: decision.id
  };

  if (projectIds.length === 0) {
    return [baseTarget];
  }

  return projectIds.map((projectId) => ({
    ...baseTarget,
    projectId
  }));
}

function projectReadScopeTarget(projectId: string) {
  return {
    axisId: "project_management",
    workstreamId: "project",
    moduleId: "project",
    projectId,
    recordId: projectId
  };
}

function taskReadScopeTarget(projectId: string) {
  return {
    axisId: "project_management",
    workstreamId: "task",
    moduleId: "task",
    projectId
  };
}

function taskScopeTarget(decision: Decision, project: Project) {
  return {
    organizationId: decision.organizationId,
    projectId: project.id,
    axisId: decision.axisId,
    workstreamId: "task",
    moduleId: "task"
  };
}

async function defaultCanAssignDecisionInScope(
  actor: PermissionUser,
  target: { decision: Decision; project?: Project }
) {
  if (can(actor, "decision.create") && !requiresAssignmentScopeForRole(actor.role)) {
    return true;
  }

  const [scopeAssignments, rolePermissionCatalog] = await Promise.all([
    listActiveScopeAssignments(),
    listRolePermissionCatalog()
  ]);

  return decisionScopeTargets(target.decision, target.project).some((scopeTarget) =>
    canAccessScopedAction(actor, "decision.create", scopeTarget, {
      rolePermissionCatalog,
      scopeAssignments
    })
  );
}

async function defaultCanCreateTaskInProject(
  actor: PermissionUser,
  target: { decision: Decision; project: Project },
  getScopedProject: ScopedProjectLoader
) {
  if (can(actor, "task.create") && !requiresAssignmentScopeForRole(actor.role)) {
    const scopedProject = await getScopedProject(actor, target.project.id);

    return Boolean(scopedProject && !scopedProject.archivedAt);
  }

  const [scopeAssignments, rolePermissionCatalog] = await Promise.all([
    listActiveScopeAssignments(),
    listRolePermissionCatalog()
  ]);

  return canAccessScopedAction(actor, "task.create", taskScopeTarget(target.decision, target.project), {
    rolePermissionCatalog,
    scopeAssignments
  });
}

function assertDecisionIsAssignable(decision: Decision) {
  if (decision.status === "cancelled") {
    throw new Error("Decision da bi huy, khong the tao assignment.");
  }

  if (decision.status === "done") {
    throw new Error("Decision da hoan thanh, khong the tao assignment moi.");
  }
}

function targetProjectIdForItem(decision: Decision, item: DecisionAssignmentInput) {
  const scopedProjectIds = decisionProjectIds(decision);
  const defaultProjectId = scopedProjectIds.length === 1 ? scopedProjectIds[0] : undefined;
  const projectId = item.projectId ?? defaultProjectId;

  if (!projectId) {
    throw new Error("Assignment cho decision multi-project hoac organization-only phai co projectId ro rang.");
  }

  if (scopedProjectIds.length > 0 && !scopedProjectIds.includes(projectId)) {
    throw new Error("Project assignment nam ngoai pham vi decision.");
  }

  return projectId;
}

async function assertUserAssignee(
  item: DecisionAssignmentInput,
  projectId: string,
  users: Pick<UserRepository, "getUser" | "listProjectMemberships">,
  memberships: ProjectMembership[] | undefined,
  scopeAssignments: ScopeAssignment[] | undefined,
  rolePermissionCatalog: RolePermissionCatalog | undefined
) {
  if (item.assigneeType !== "user") {
    return;
  }

  if (!item.assigneeId) {
    throw new Error("Nguoi nhan assignment la bat buoc.");
  }

  const assignee = await users.getUser(item.assigneeId);

  if (!assignee || assignee.status !== "active") {
    throw new Error("Nguoi nhan assignment khong ton tai hoac khong active.");
  }

  const assigneeMemberships = (memberships ?? []).filter((membership) => membership.userId === item.assigneeId);

  const hasProjectMembership = assigneeMemberships.some((membership) => membership.projectId === projectId);
  const canReadAllProjects =
    can(assignee, "project.view") &&
    !requiresAssignmentScopeForRole(assignee.role) &&
    assignee.role !== "viewer" &&
    assignee.role !== "pending";
  const hasScopedRead =
    canAccessScopedAction(assignee, "project.view", projectReadScopeTarget(projectId), {
      rolePermissionCatalog,
      scopeAssignments
    }) ||
    canAccessScopedAction(assignee, "task.view", taskReadScopeTarget(projectId), {
      rolePermissionCatalog,
      scopeAssignments
    });

  if (!hasProjectMembership && !canReadAllProjects && !hasScopedRead) {
    throw new Error("Nguoi nhan assignment khong thuoc pham vi du an.");
  }
}

function duplicateKey(projectId: string, item: DecisionAssignmentInput) {
  return [
    projectId,
    item.assigneeType,
    item.assigneeId ?? item.departmentId ?? "project",
    item.title.trim().toLowerCase()
  ].join("|");
}

function taskDescription(item: DecisionAssignmentInput) {
  const parts = [item.description, item.kpi ? `KPI: ${item.kpi}` : undefined].filter(Boolean);

  return parts.length > 0 ? parts.join("\n") : undefined;
}

async function validateAssignments(
  inputAssignments: DecisionAssignmentInput[],
  decision: Decision,
  actor: PermissionUser,
  dependencies: Required<
    Pick<
      DecisionAssignmentServiceDependencies,
      | "getScopedProject"
      | "userRepository"
      | "canAssignDecisionInScope"
      | "canCreateTaskInProject"
      | "listScopeAssignments"
      | "listRolePermissionCatalog"
    >
  >
) {
  const seen = new Set<string>();
  const hasUserAssignee = inputAssignments.some((item) => item.assigneeType === "user");
  const [memberships, scopeAssignments, rolePermissionCatalog] = hasUserAssignee
    ? await Promise.all([
        dependencies.userRepository.listProjectMemberships(),
        dependencies.listScopeAssignments(),
        dependencies.listRolePermissionCatalog()
      ])
    : [undefined, undefined, undefined];
  const validated: ValidatedAssignment[] = [];

  for (const item of inputAssignments) {
    const projectId = targetProjectIdForItem(decision, item);
    const key = duplicateKey(projectId, item);

    if (seen.has(key)) {
      throw new Error("Assignment bi trung lap trong cung batch.");
    }

    seen.add(key);

    const project = await dependencies.getScopedProject(actor, projectId);

    if (!project || project.archivedAt) {
      throw new Error("Project assignment khong ton tai, da luu tru hoac ngoai pham vi nguoi tao.");
    }

    const canAssign = await dependencies.canAssignDecisionInScope(actor, { decision, project });

    if (!canAssign) {
      throw new Error("Ban khong co quyen tao assignment cho decision trong project nay.");
    }

    const canCreateTask = await dependencies.canCreateTaskInProject(actor, { decision, project });

    if (!canCreateTask) {
      throw new Error("Ban khong co quyen task.create trong project assignment.");
    }

    await assertUserAssignee(
      item,
      projectId,
      dependencies.userRepository,
      memberships,
      scopeAssignments,
      rolePermissionCatalog
    );

    validated.push({
      input: {
        ...item,
        assigneeType: item.assigneeType,
        title: item.title,
        priority: item.priority ?? "medium"
      },
      project
    });
  }

  return validated;
}

function auditNewValue(decisionId: string, assignments: DecisionAssignment[]) {
  return {
    decisionId,
    assignmentCount: assignments.length,
    taskIds: unique(assignments.map((assignment) => assignment.taskId)),
    projectIds: unique(assignments.map((assignment) => assignment.projectId)),
    assigneeIds: unique(assignments.map((assignment) => assignment.assigneeId)),
    departmentIds: unique(assignments.map((assignment) => assignment.departmentId)),
    status: "assigned",
    summary: "created decision assignments"
  };
}

async function rollbackCreatedRecords(
  repository: MeetingRepository,
  tasks: TaskRepository,
  createdAssignments: DecisionAssignment[],
  createdTasks: Task[]
) {
  const rollbackErrors: string[] = [];

  if (createdAssignments.length > 0) {
    try {
      await repository.deleteDecisionAssignments(createdAssignments.map((assignment) => assignment.id));
    } catch (error) {
      rollbackErrors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (createdTasks.length > 0) {
    try {
      await tasks.deleteTasks(createdTasks.map((task) => task.id));
    } catch (error) {
      rollbackErrors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (rollbackErrors.length > 0) {
    throw new Error(`Rollback decision assignments failed: ${rollbackErrors.join("; ")}`);
  }
}

export async function createDecisionAssignments(
  input: CreateDecisionAssignmentsInput,
  actor: PermissionUser,
  dependencies: DecisionAssignmentServiceDependencies = {}
): Promise<DecisionAssignmentCreationResult> {
  const repository = dependencies.repository ?? meetingRepository;
  const tasks = dependencies.taskRepository ?? taskRepository;
  const projects = dependencies.projectRepository ?? projectRepository;
  const users = dependencies.userRepository ?? userRepository;
  const getScopedDecision = dependencies.getScopedDecision ?? defaultGetScopedDecision;
  const getScopedProject = dependencies.getScopedProject ?? defaultGetScopedProject;
  const canAssignDecisionInScope = dependencies.canAssignDecisionInScope ?? defaultCanAssignDecisionInScope;
  const taskCreator = dependencies.taskCreator ?? createTask;
  const auditWriter = dependencies.auditWriter ?? createAuditLog;
  const loadScopeAssignments = dependencies.listScopeAssignments ?? listActiveScopeAssignments;
  const loadRolePermissionCatalog = dependencies.listRolePermissionCatalog ?? listRolePermissionCatalog;
  const idGenerator = dependencies.idGenerator ?? createId;
  const timestamp = (dependencies.now ?? now)();
  const parsedInput = createDecisionAssignmentsInputSchema.parse(input);
  const decision = await getScopedDecision(actor, parsedInput.decisionId);

  if (!decision) {
    throw new Error("Ban khong co quyen doc decision hoac decision khong ton tai.");
  }

  assertDecisionIsAssignable(decision);

  const canCreateTaskInProject = dependencies.canCreateTaskInProject
    ? dependencies.canCreateTaskInProject
    : (permissionActor: PermissionUser, target: { decision: Decision; project: Project }) =>
        defaultCanCreateTaskInProject(permissionActor, target, getScopedProject);
  const validatedAssignments = await validateAssignments(parsedInput.assignments, decision, actor, {
    getScopedProject,
    userRepository: users,
    canAssignDecisionInScope,
    canCreateTaskInProject,
    listScopeAssignments: loadScopeAssignments,
    listRolePermissionCatalog: loadRolePermissionCatalog
  });
  const createdTasks: Task[] = [];
  let createdAssignments: DecisionAssignment[] = [];

  try {
    for (const { input: item, project } of validatedAssignments) {
      const task = await taskCreator(
        {
          projectId: project.id,
          title: item.title,
          description: taskDescription(item),
          assigneeId: item.assigneeType === "user" ? item.assigneeId : undefined,
          dueDate: item.dueDate,
          status: "todo",
          priority: item.priority,
          category: "decision"
        },
        tasks,
        projects,
        {
          linkedEntityType: "decision",
          linkedEntityId: decision.id,
          createdBy: actor.id
        }
      );

      createdTasks.push(task);
    }

    const assignmentRecords: DecisionAssignment[] = validatedAssignments.map(({ input: item, project }, index) => ({
      id: idGenerator(),
      decisionId: decision.id,
      taskId: createdTasks[index].id,
      organizationId: decision.organizationId,
      projectId: project.id,
      assigneeType: item.assigneeType,
      assigneeId: item.assigneeType === "user" ? item.assigneeId : undefined,
      departmentId: item.assigneeType === "department" ? item.departmentId : undefined,
      title: item.title,
      description: item.description,
      kpi: item.kpi,
      dueDate: item.dueDate,
      priority: item.priority,
      status: "assigned",
      createdBy: actor.id,
      createdAt: timestamp,
      updatedAt: timestamp
    }));
    createdAssignments = await repository.createDecisionAssignments(assignmentRecords);

    await auditWriter({
      actorId: actor.id,
      entityType: "decision",
      entityId: decision.id,
      action: "decision.assignments_created",
      oldValue: {},
      newValue: auditNewValue(decision.id, createdAssignments)
    });

    return {
      decision,
      assignments: createdAssignments,
      tasks: createdTasks
    };
  } catch (error) {
    try {
      await rollbackCreatedRecords(repository, tasks, createdAssignments, createdTasks);
    } catch (rollbackError) {
      const originalMessage = error instanceof Error ? error.message : String(error);
      const rollbackMessage = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);

      throw new Error(`${originalMessage} ${rollbackMessage}`);
    }

    throw error;
  }
}
