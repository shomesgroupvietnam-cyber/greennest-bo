import type { ProjectRepository } from "@/modules/projects/services/project-repository";
import { projectRepository } from "@/modules/projects/services/project-repository";
import type { Task, TaskCreationMetadata, TaskInput, TaskListFilters, TaskUpdateInput } from "@/modules/tasks/types";
import { taskCreationMetadataSchema, taskInputSchema, taskUpdateSchema } from "@/modules/tasks/validation";

import { DEFAULT_UPCOMING_WINDOW_DAYS, MOCK_CURRENT_USER_ID } from "../constants";
import { taskRepository, type TaskRepository } from "./task-repository";

function createId() {
  return crypto.randomUUID();
}

function toDateOnly(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export function isTaskDone(task: Pick<Task, "status">) {
  return task.status === "done";
}

export function isTaskOverdue(task: Pick<Task, "dueDate" | "status">, today = new Date()) {
  if (!task.dueDate || isTaskDone(task)) {
    return false;
  }

  return parseDateOnly(task.dueDate) < toDateOnly(today);
}

export function isTaskUpcoming(
  task: Pick<Task, "dueDate" | "status">,
  today = new Date(),
  upcomingWindowDays = DEFAULT_UPCOMING_WINDOW_DAYS
) {
  if (!task.dueDate || isTaskDone(task)) {
    return false;
  }

  const dueDate = parseDateOnly(task.dueDate);
  const startDate = toDateOnly(today);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + upcomingWindowDays);

  return dueDate >= startDate && dueDate <= endDate;
}

export async function listTasks(filters: TaskListFilters = {}, repository: TaskRepository = taskRepository) {
  const effectiveFilters = { ...filters };

  if (effectiveFilters.scope === "mine") {
    effectiveFilters.assigneeId = effectiveFilters.assigneeId ?? MOCK_CURRENT_USER_ID;
  }

  const tasks = await repository.listTasks(effectiveFilters);
  const today = effectiveFilters.today ?? new Date();
  const upcomingWindowDays = effectiveFilters.upcomingWindowDays ?? DEFAULT_UPCOMING_WINDOW_DAYS;

  if (effectiveFilters.scope === "overdue") {
    return tasks.filter((task) => isTaskOverdue(task, today));
  }

  if (effectiveFilters.scope === "upcoming") {
    return tasks.filter((task) => isTaskUpcoming(task, today, upcomingWindowDays));
  }

  return tasks;
}

export async function getTask(taskId: string, repository: TaskRepository = taskRepository) {
  return repository.getTask(taskId);
}

export async function getOverdueTasks(filters: TaskListFilters = {}, repository: TaskRepository = taskRepository) {
  return listTasks({ ...filters, scope: "overdue" }, repository);
}

export async function getUpcomingTasks(filters: TaskListFilters = {}, repository: TaskRepository = taskRepository) {
  return listTasks({ ...filters, scope: "upcoming" }, repository);
}

export async function createTask(
  input: TaskInput,
  repository: TaskRepository = taskRepository,
  projects: ProjectRepository = projectRepository,
  metadata: TaskCreationMetadata = {}
) {
  const parsedInput = taskInputSchema.parse(input);
  const parsedMetadata = taskCreationMetadataSchema.parse(metadata);
  const project = await projects.getProject(parsedInput.projectId);

  if (!project || project.archivedAt) {
    throw new Error("Dự án không tồn tại hoặc đã được lưu trữ.");
  }

  const now = new Date().toISOString();
  const task: Task = {
    id: createId(),
    projectId: parsedInput.projectId,
    title: parsedInput.title,
    description: parsedInput.description,
    assigneeId: parsedInput.assigneeId,
    dueDate: parsedInput.dueDate,
    status: parsedInput.status,
    priority: parsedInput.priority,
    category: parsedInput.category,
    linkedEntityType: parsedMetadata.linkedEntityType,
    linkedEntityId: parsedMetadata.linkedEntityId,
    createdBy: parsedMetadata.createdBy,
    createdAt: now,
    updatedAt: now
  };

  return repository.createTask(task);
}

export async function updateTask(
  taskId: string,
  input: TaskUpdateInput,
  repository: TaskRepository = taskRepository,
  projects: ProjectRepository = projectRepository
) {
  const parsedInput = taskUpdateSchema.parse(input);
  const existingTask = await repository.getTask(taskId);

  if (!existingTask) {
    throw new Error("Không tìm thấy công việc.");
  }

  const project = await projects.getProject(parsedInput.projectId);

  if (!project || project.archivedAt) {
    throw new Error("Dự án không tồn tại hoặc đã được lưu trữ.");
  }

  return repository.updateTask(taskId, {
    projectId: parsedInput.projectId,
    title: parsedInput.title,
    description: parsedInput.description,
    assigneeId: parsedInput.assigneeId,
    dueDate: parsedInput.dueDate,
    status: parsedInput.status,
    priority: parsedInput.priority,
    category: parsedInput.category,
    updatedAt: new Date().toISOString()
  });
}
