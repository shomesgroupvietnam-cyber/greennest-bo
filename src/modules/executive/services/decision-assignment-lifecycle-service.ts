import { can, type PermissionUser } from "@/lib/permissions/can";
import {
  canAccessScopedAction,
  requiresAssignmentScopeForRole,
} from "@/lib/permissions/access-scope";
import {
  getScopedDecision as defaultGetScopedDecision,
  getScopedTask as defaultGetScopedTask,
} from "@/lib/permissions/scoped-resources";
import {
  meetingRepository,
  type MeetingRepository,
} from "@/modules/meetings/services/meeting-repository";
import type {
  Decision,
  DecisionAssignment,
  DecisionAssignmentStatus,
} from "@/modules/meetings/types";
import { updateDecisionAssignmentLifecycleInputSchema } from "@/modules/meetings/validation";
import {
  projectRepository,
  type ProjectRepository,
} from "@/modules/projects/services/project-repository";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import { listActiveScopeAssignments } from "@/modules/settings/services/scope-assignment-service";
import type {
  RolePermissionCatalog,
  ScopeAssignment,
} from "@/modules/settings/types";
import {
  taskRepository,
  type TaskRepository,
} from "@/modules/tasks/services/task-repository";
import type { Task } from "@/modules/tasks/types";
import { createAuditLog } from "@/modules/users/services/user-service";
import type { AuditLog } from "@/modules/users/types";

type AuditWriter = (
  input: Omit<AuditLog, "id" | "createdAt">,
) => Promise<unknown>;
type ScopedDecisionLoader = (
  actor: PermissionUser,
  decisionId: string,
) => Promise<Decision | undefined>;
type ScopedTaskLoader = (
  actor: PermissionUser,
  taskId: string,
) => Promise<Task | undefined>;
type AssignmentUpdateChecker = (
  actor: PermissionUser,
  target: { assignment: DecisionAssignment; decision: Decision },
) => Promise<boolean>;
type TaskUpdateChecker = (
  actor: PermissionUser,
  target: { assignment: DecisionAssignment; decision: Decision; task: Task },
) => Promise<boolean>;
type ScopeAssignmentLoader = () => Promise<ScopeAssignment[]>;
type RolePermissionCatalogLoader = () => Promise<RolePermissionCatalog>;

export type UpdateDecisionAssignmentLifecycleInput = {
  assignmentId: string;
  status: DecisionAssignmentStatus;
  reason?: string;
};

export type DecisionAssignmentLifecycleResult = {
  assignment: DecisionAssignment;
  decision: Decision;
  task?: Task;
};

export type DecisionAssignmentLifecycleDependencies = {
  auditWriter?: AuditWriter;
  canUpdateDecisionAssignmentInScope?: AssignmentUpdateChecker;
  canUpdateTaskInProject?: TaskUpdateChecker;
  getScopedDecision?: ScopedDecisionLoader;
  getScopedTask?: ScopedTaskLoader;
  listRolePermissionCatalog?: RolePermissionCatalogLoader;
  listScopeAssignments?: ScopeAssignmentLoader;
  now?: () => string;
  projectRepository?: ProjectRepository;
  repository?: MeetingRepository;
  taskRepository?: TaskRepository;
};

function now() {
  return new Date().toISOString();
}

function unique(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function decisionProjectIds(decision: Decision) {
  return unique([decision.projectId, ...(decision.projectIds ?? [])]);
}

function decisionScopeTargets(decision: Decision, projectId?: string) {
  const projectIds = projectId ? [projectId] : decisionProjectIds(decision);
  const baseTarget = {
    organizationId: decision.organizationId,
    axisId: decision.axisId,
    workstreamId: decision.workstreamId ?? "decision",
    moduleId: decision.moduleId ?? "meeting",
    recordId: decision.id,
  };

  if (projectIds.length === 0) {
    return [baseTarget];
  }

  return projectIds.map((targetProjectId) => ({
    ...baseTarget,
    projectId: targetProjectId,
  }));
}

function taskScopeTarget(
  decision: Decision,
  assignment: DecisionAssignment,
  task: Task,
) {
  return {
    organizationId: decision.organizationId ?? assignment.organizationId,
    axisId: decision.axisId,
    workstreamId: "task",
    moduleId: "task",
    projectId: task.projectId,
    recordId: task.id,
  };
}

async function defaultCanUpdateAssignmentInScope(
  actor: PermissionUser,
  target: { assignment: DecisionAssignment; decision: Decision },
  loadScopeAssignments: ScopeAssignmentLoader,
  loadRolePermissionCatalog: RolePermissionCatalogLoader,
) {
  if (
    can(actor, "decision.create") &&
    !requiresAssignmentScopeForRole(actor.role)
  ) {
    return true;
  }

  const [scopeAssignments, rolePermissionCatalog] = await Promise.all([
    loadScopeAssignments(),
    loadRolePermissionCatalog(),
  ]);

  return decisionScopeTargets(
    target.decision,
    target.assignment.projectId,
  ).some((scopeTarget) =>
    canAccessScopedAction(actor, "decision.create", scopeTarget, {
      rolePermissionCatalog,
      scopeAssignments,
    }),
  );
}

async function defaultCanUpdateTaskInProject(
  actor: PermissionUser,
  target: { assignment: DecisionAssignment; decision: Decision; task: Task },
  loadScopeAssignments: ScopeAssignmentLoader,
  loadRolePermissionCatalog: RolePermissionCatalogLoader,
) {
  if (
    can(actor, "task.update", {
      assigneeId: target.task.assigneeId,
      ownerId: target.task.createdBy,
      projectId: target.task.projectId,
    }) &&
    !requiresAssignmentScopeForRole(actor.role)
  ) {
    return true;
  }

  const [scopeAssignments, rolePermissionCatalog] = await Promise.all([
    loadScopeAssignments(),
    loadRolePermissionCatalog(),
  ]);
  const scopeTarget = taskScopeTarget(
    target.decision,
    target.assignment,
    target.task,
  );

  return (
    canAccessScopedAction(actor, "task.update", scopeTarget, {
      rolePermissionCatalog,
      scopeAssignments,
    }) ||
    canAccessScopedAction(actor, "task.update_own", scopeTarget, {
      rolePermissionCatalog,
      scopeAssignments,
    })
  );
}

async function getAssignmentOrThrow(
  repository: MeetingRepository,
  assignmentId: string,
) {
  const assignment = repository.getDecisionAssignment
    ? await repository.getDecisionAssignment(assignmentId)
    : (await repository.listDecisionAssignments()).find(
        (item) => item.id === assignmentId,
      );

  if (!assignment) {
    throw new Error("Khong tim thay assignment cua decision.");
  }

  return assignment;
}

async function updateAssignmentOrThrow(
  repository: MeetingRepository,
  assignmentId: string,
  patch: Partial<DecisionAssignment>,
) {
  if (!repository.updateDecisionAssignment) {
    throw new Error("Repository chua ho tro cap nhat assignment lifecycle.");
  }

  return repository.updateDecisionAssignment(assignmentId, patch);
}

function taskStatusForAssignmentStatus(status: DecisionAssignmentStatus) {
  switch (status) {
    case "assigned":
      return "todo" as const;
    case "in_progress":
      return "in_progress" as const;
    case "done":
      return "done" as const;
    case "cancelled":
      return undefined;
  }
}

function buildAuditValue(input: {
  assignment: DecisionAssignment;
  decision: Decision;
  nextAssignment: DecisionAssignment;
  previousTask?: Task;
  nextTask?: Task;
  reason?: string;
}) {
  return {
    assignmentId: input.assignment.id,
    decisionId: input.decision.id,
    nextAssignmentStatus: input.nextAssignment.status,
    nextTaskStatus: input.nextTask?.status ?? input.previousTask?.status,
    previousAssignmentStatus: input.assignment.status,
    previousTaskStatus: input.previousTask?.status,
    projectId: input.assignment.projectId,
    reasonProvided: Boolean(input.reason),
    summary: "decision assignment lifecycle updated",
    taskId: input.assignment.taskId,
  };
}

async function rollbackLifecycle(
  input: {
    assignmentChanged: boolean;
    previousAssignment: DecisionAssignment;
    previousTask?: Task;
    repository: MeetingRepository;
    taskChanged: boolean;
    tasks: TaskRepository;
  },
) {
  const rollbackErrors: string[] = [];

  if (input.taskChanged && input.previousTask) {
    try {
      await input.tasks.updateTask(input.previousTask.id, {
        status: input.previousTask.status,
        updatedAt: input.previousTask.updatedAt,
      });
    } catch (error) {
      rollbackErrors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (input.assignmentChanged) {
    try {
      await updateAssignmentOrThrow(input.repository, input.previousAssignment.id, {
        status: input.previousAssignment.status,
        updatedAt: input.previousAssignment.updatedAt,
      });
    } catch (error) {
      rollbackErrors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (rollbackErrors.length > 0) {
    throw new Error(`Rollback assignment lifecycle failed: ${rollbackErrors.join("; ")}`);
  }
}

export async function updateDecisionAssignmentLifecycle(
  input: UpdateDecisionAssignmentLifecycleInput,
  actor: PermissionUser,
  dependencies: DecisionAssignmentLifecycleDependencies = {},
): Promise<DecisionAssignmentLifecycleResult> {
  const repository = dependencies.repository ?? meetingRepository;
  const tasks = dependencies.taskRepository ?? taskRepository;
  const projects = dependencies.projectRepository ?? projectRepository;
  const getScopedDecision =
    dependencies.getScopedDecision ?? defaultGetScopedDecision;
  const getScopedTask = dependencies.getScopedTask ?? defaultGetScopedTask;
  const loadScopeAssignments =
    dependencies.listScopeAssignments ?? listActiveScopeAssignments;
  const loadRolePermissionCatalog =
    dependencies.listRolePermissionCatalog ?? listRolePermissionCatalog;
  const canUpdateDecisionAssignmentInScope =
    dependencies.canUpdateDecisionAssignmentInScope ??
    ((permissionActor, target) =>
      defaultCanUpdateAssignmentInScope(
        permissionActor,
        target,
        loadScopeAssignments,
        loadRolePermissionCatalog,
      ));
  const canUpdateTaskInProject =
    dependencies.canUpdateTaskInProject ??
    ((permissionActor, target) =>
      defaultCanUpdateTaskInProject(
        permissionActor,
        target,
        loadScopeAssignments,
        loadRolePermissionCatalog,
      ));
  const auditWriter = dependencies.auditWriter ?? createAuditLog;
  const timestamp = (dependencies.now ?? now)();
  const parsedInput =
    updateDecisionAssignmentLifecycleInputSchema.parse(input);
  const assignment = await getAssignmentOrThrow(
    repository,
    parsedInput.assignmentId,
  );
  const decision = await getScopedDecision(actor, assignment.decisionId);

  if (!decision) {
    throw new Error("Ban khong co quyen doc decision hoac decision khong ton tai.");
  }

  const project = await projects.getProject(assignment.projectId);

  if (!project || project.archivedAt) {
    throw new Error("Project assignment khong ton tai hoac da luu tru.");
  }

  const canUpdateAssignment = await canUpdateDecisionAssignmentInScope(actor, {
    assignment,
    decision,
  });

  if (!canUpdateAssignment) {
    throw new Error("Ban khong co quyen cap nhat assignment cua decision.");
  }

  const previousTask = assignment.taskId
    ? await getScopedTask(actor, assignment.taskId)
    : undefined;

  if (assignment.taskId && !previousTask) {
    throw new Error("Cong viec lien ket nam ngoai scope hoac khong co quyen cap nhat.");
  }

  if (previousTask && previousTask.projectId !== assignment.projectId) {
    throw new Error("Cong viec lien ket khong khop project assignment.");
  }

  if (previousTask) {
    const canUpdateTask = await canUpdateTaskInProject(actor, {
      assignment,
      decision,
      task: previousTask,
    });

    if (!canUpdateTask) {
      throw new Error("Ban khong co quyen cap nhat task lien ket assignment.");
    }
  }

  const nextTaskStatus = previousTask
    ? taskStatusForAssignmentStatus(parsedInput.status)
    : undefined;
  let updatedAssignment: DecisionAssignment | undefined;
  let updatedTask: Task | undefined = previousTask;
  let assignmentChanged = false;
  let taskChanged = false;

  try {
    updatedAssignment = await updateAssignmentOrThrow(
      repository,
      assignment.id,
      {
        status: parsedInput.status,
        updatedAt: timestamp,
      },
    );
    assignmentChanged = true;

    if (
      previousTask &&
      nextTaskStatus &&
      previousTask.status !== nextTaskStatus
    ) {
      updatedTask = await tasks.updateTask(previousTask.id, {
        status: nextTaskStatus,
        updatedAt: timestamp,
      });
      taskChanged = true;
    }

    await auditWriter({
      actorId: actor.id,
      entityType: "decision",
      entityId: decision.id,
      action: "decision.assignment_lifecycle_updated",
      oldValue: {
        assignmentId: assignment.id,
        decisionId: decision.id,
        previousAssignmentStatus: assignment.status,
        previousTaskStatus: previousTask?.status,
        taskId: assignment.taskId,
      },
      newValue: buildAuditValue({
        assignment,
        decision,
        nextAssignment: updatedAssignment,
        nextTask: updatedTask,
        previousTask,
        reason: parsedInput.reason,
      }),
    });

    return {
      assignment: updatedAssignment,
      decision,
      task: updatedTask,
    };
  } catch (error) {
    try {
      await rollbackLifecycle({
        assignmentChanged,
        previousAssignment: assignment,
        previousTask,
        repository,
        taskChanged,
        tasks,
      });
    } catch (rollbackError) {
      const originalMessage =
        error instanceof Error ? error.message : String(error);
      const rollbackMessage =
        rollbackError instanceof Error
          ? rollbackError.message
          : String(rollbackError);

      throw new Error(`${originalMessage} ${rollbackMessage}`);
    }

    throw error;
  }
}
