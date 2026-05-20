"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { assertCan } from "@/lib/permissions/can";
import { getLegalStep, updateLegalStep } from "@/modules/legal/services/legal-service";
import type { LegalStepUpdateInput } from "@/modules/legal/types";

function readOptionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  return value.length > 0 ? value : undefined;
}

function formDataToLegalStepUpdateInput(formData: FormData): LegalStepUpdateInput {
  return {
    status: String(formData.get("status") ?? "not_started") as LegalStepUpdateInput["status"],
    assigneeId: readOptionalString(formData, "assigneeId"),
    dueDate: readOptionalString(formData, "dueDate"),
    completedDate: readOptionalString(formData, "completedDate"),
    notes: readOptionalString(formData, "notes"),
    relatedDocumentIds: formData
      .getAll("relatedDocumentIds")
      .map(String)
      .filter((value) => value.length > 0)
  };
}

export async function updateLegalStepAction(stepId: string, formData: FormData) {
  const currentUser = await getCurrentUser();
  const existingStep = await getLegalStep(stepId);
  assertCan(currentUser, "legal.update", existingStep);

  const legalStep = await updateLegalStep(stepId, formDataToLegalStepUpdateInput(formData));

  revalidatePath("/legal");
  revalidatePath(`/projects/${legalStep.projectId}`);
}
