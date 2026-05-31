"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { createDecisionRecord } from "@/modules/executive/services/decision-record-service";
import type { CreateDecisionRecordInput, DecisionLinkedRecord } from "@/modules/meetings/types";

function readString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  return value.length > 0 ? value : undefined;
}

function readArrayField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readLinkedRecords(formData: FormData): DecisionLinkedRecord[] {
  const raw = readString(formData, "linkedRecordsJson");

  if (!raw) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Du lieu linked records khong hop le.");
  }

  return Array.isArray(parsed) ? (parsed as DecisionLinkedRecord[]) : [];
}

function formDataToDecisionRecordInput(formData: FormData): CreateDecisionRecordInput {
  return {
    title: readString(formData, "title"),
    content: readString(formData, "content"),
    decisionText: readString(formData, "decisionText"),
    sourceType: readString(formData, "sourceType") as CreateDecisionRecordInput["sourceType"],
    sourceId: readString(formData, "sourceId"),
    organizationId: readString(formData, "organizationId"),
    projectId: readString(formData, "projectId"),
    projectIds: readArrayField(formData, "projectIds"),
    axisId: readString(formData, "axisId"),
    workstreamId: readString(formData, "workstreamId"),
    moduleId: readString(formData, "moduleId"),
    ownerId: readString(formData, "ownerId"),
    priority: readString(formData, "priority") as CreateDecisionRecordInput["priority"],
    dueDate: readString(formData, "dueDate"),
    status: readString(formData, "status") as CreateDecisionRecordInput["status"],
    decidedBy: readString(formData, "decidedBy"),
    linkedRecords: readLinkedRecords(formData)
  };
}

export async function createDecisionRecordAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const decision = await createDecisionRecord(formDataToDecisionRecordInput(formData), currentUser);

  revalidatePath("/executive/decision-log");
  revalidatePath("/command-center");

  if (decision.meetingId) {
    revalidatePath(`/meetings/${decision.meetingId}`);
  }

  if (decision.projectId) {
    revalidatePath(`/projects/${decision.projectId}`);
  }

  for (const projectId of decision.projectIds ?? []) {
    revalidatePath(`/projects/${projectId}`);
  }

  return decision;
}
