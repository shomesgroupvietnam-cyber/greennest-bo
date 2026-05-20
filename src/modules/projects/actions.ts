"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { assertCan } from "@/lib/permissions/can";
import { archiveProject, createProject, updateProject } from "@/modules/projects/services/project-service";
import type { ProjectInput, ProjectUpdateInput } from "@/modules/projects/types";

function formDataToProjectInput(formData: FormData): ProjectInput {
  return {
    code: String(formData.get("code") ?? ""),
    name: String(formData.get("name") ?? ""),
    location: String(formData.get("location") ?? ""),
    area: formData.get("area") ? Number(formData.get("area")) : undefined,
    projectType: String(formData.get("projectType") ?? ""),
    investor: String(formData.get("investor") ?? ""),
    status: String(formData.get("status") ?? "planning") as ProjectInput["status"],
    ownerName: String(formData.get("ownerName") ?? "")
  };
}

export async function createProjectAction(formData: FormData) {
  assertCan(await getCurrentUser(), "project.create");

  const project = await createProject(formDataToProjectInput(formData));

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProjectAction(projectId: string, formData: FormData) {
  assertCan(await getCurrentUser(), "project.update", { id: projectId });

  await updateProject(projectId, formDataToProjectInput(formData) as ProjectUpdateInput);

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

export async function archiveProjectAction(projectId: string) {
  assertCan(await getCurrentUser(), "project.archive", { id: projectId });

  await archiveProject(projectId);

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  redirect("/projects?archived=1");
}
