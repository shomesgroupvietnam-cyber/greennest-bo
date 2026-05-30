"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { assertCan } from "@/lib/permissions/can";
import { inviteUser, updateUserRole, upsertProjectMembership } from "@/modules/users/services/user-service";

function readRole(formData: FormData, key = "role") {
  return String(formData.get(key) ?? "viewer");
}

export async function inviteUserAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "user.invite");

  await inviteUser(
    {
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      role: readRole(formData)
    },
    currentUser.id
  );

  revalidatePath("/users");
}

export async function updateUserRoleAction(userId: string, formData: FormData) {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "user.update_role", { id: userId });

  await updateUserRole(userId, readRole(formData), currentUser.id);

  revalidatePath("/users");
}

export async function upsertProjectMembershipAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "project.assign_member");

  await upsertProjectMembership(
    {
      projectId: String(formData.get("projectId") ?? ""),
      userId: String(formData.get("userId") ?? ""),
      role: readRole(formData)
    },
    currentUser.id
  );

  revalidatePath("/users");
  revalidatePath(`/projects/${String(formData.get("projectId") ?? "")}`);
}
