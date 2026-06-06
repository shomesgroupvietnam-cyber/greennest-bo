"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { assertCan } from "@/lib/permissions/can";
import { getScopedProject, getScopedTask } from "@/lib/permissions/scoped-resources";
import { createTask, getTask, updateTask } from "@/modules/tasks/services/task-service";
import type { TaskInput, TaskUpdateInput } from "@/modules/tasks/types";

function formDataToTaskInput(formData: FormData): TaskInput {
  return {
    projectId: String(formData.get("projectId") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    assigneeId: String(formData.get("assigneeId") ?? ""),
    dueDate: String(formData.get("dueDate") ?? ""),
    status: String(formData.get("status") ?? "todo") as TaskInput["status"],
    priority: String(formData.get("priority") ?? "medium") as TaskInput["priority"],
    category: String(formData.get("category") ?? "")
  };
}

export async function createTaskAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "task.create");
  const input = formDataToTaskInput(formData);

  if (!(await getScopedProject(currentUser, input.projectId))) {
    throw new Error("Bạn không có quyền tạo công việc cho dự án này.");
  }

  const task = await createTask(input, undefined, undefined, { createdBy: currentUser.id });

  revalidatePath("/tasks");
  revalidatePath(`/projects/${task.projectId}`);
  redirect(`/tasks/${task.id}`);
}

export async function updateTaskAction(taskId: string, formData: FormData) {
  const currentUser = await getCurrentUser();
  const existingTask = await getTask(taskId);
  const scopedTask = await getScopedTask(currentUser, taskId);
  assertCan(currentUser, "task.update", existingTask);
  const input = formDataToTaskInput(formData);

  if (!scopedTask || !(await getScopedProject(currentUser, input.projectId))) {
    throw new Error("Bạn không có quyền cập nhật công việc hoặc dự án đích không thuộc phạm vi của bạn.");
  }

  const task = await updateTask(taskId, input as TaskUpdateInput);

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${task.id}`);
  revalidatePath(`/projects/${task.projectId}`);
  redirect(`/tasks/${task.id}`);
}
