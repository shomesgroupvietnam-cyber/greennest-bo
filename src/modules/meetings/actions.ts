"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { assertCan } from "@/lib/permissions/can";
import { getScopedDecision, getScopedMeeting, getScopedProject } from "@/lib/permissions/scoped-resources";
import {
  convertDecisionToTask,
  createDecision,
  createMeeting,
  getDecision,
  getMeeting,
  updateMeeting
} from "@/modules/meetings/services/meeting-service";
import type { DecisionInput, MeetingInput, MeetingUpdateInput } from "@/modules/meetings/types";

function formDataToMeetingInput(formData: FormData): MeetingInput {
  return {
    projectId: String(formData.get("projectId") ?? ""),
    title: String(formData.get("title") ?? ""),
    meetingDate: String(formData.get("meetingDate") ?? ""),
    summary: String(formData.get("summary") ?? "")
  };
}

function formDataToMeetingUpdateInput(formData: FormData): MeetingUpdateInput {
  return {
    title: String(formData.get("title") ?? ""),
    meetingDate: String(formData.get("meetingDate") ?? ""),
    summary: String(formData.get("summary") ?? "")
  };
}

function formDataToDecisionInput(meetingId: string, formData: FormData): DecisionInput {
  return {
    meetingId,
    decisionText: String(formData.get("decisionText") ?? ""),
    ownerId: String(formData.get("ownerId") ?? ""),
    dueDate: String(formData.get("dueDate") ?? ""),
    status: String(formData.get("status") ?? "open") as DecisionInput["status"]
  };
}

export async function createMeetingAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "meeting.create");
  const input = formDataToMeetingInput(formData);

  if (!(await getScopedProject(currentUser, input.projectId))) {
    throw new Error("Báº¡n khÃ´ng cÃ³ quyá»n táº¡o biÃªn báº£n há»p cho dá»± Ã¡n nÃ y.");
  }

  const meeting = await createMeeting(input, currentUser.id);

  revalidatePath("/meetings");
  revalidatePath(`/projects/${meeting.projectId}`);
  redirect(`/meetings/${meeting.id}`);
}

export async function updateMeetingAction(meetingId: string, formData: FormData) {
  const currentUser = await getCurrentUser();
  const existingMeeting = await getMeeting(meetingId);
  assertCan(currentUser, "meeting.update", existingMeeting);

  if (!(await getScopedMeeting(currentUser, meetingId))) {
    throw new Error("Báº¡n khÃ´ng cÃ³ quyá»n cáº­p nháº­t cuá»™c há»p nÃ y.");
  }

  const meeting = await updateMeeting(meetingId, formDataToMeetingUpdateInput(formData));

  revalidatePath("/meetings");
  revalidatePath(`/meetings/${meeting.id}`);
  revalidatePath(`/projects/${meeting.projectId}`);
  redirect(`/meetings/${meeting.id}`);
}

export async function createDecisionAction(meetingId: string, formData: FormData) {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "decision.create");

  if (!(await getScopedMeeting(currentUser, meetingId))) {
    throw new Error("Báº¡n khÃ´ng cÃ³ quyá»n táº¡o quyáº¿t Ä‘á»‹nh cho cuá»™c há»p nÃ y.");
  }

  const decision = await createDecision(formDataToDecisionInput(meetingId, formData));

  revalidatePath("/meetings");
  revalidatePath(`/meetings/${meetingId}`);
  revalidatePath(`/projects/${decision.projectId}`);
}

export async function convertDecisionToTaskAction(decisionId: string) {
  const currentUser = await getCurrentUser();
  const decision = await getDecision(decisionId);
  assertCan(currentUser, "task.create");

  if (!decision || !(await getScopedDecision(currentUser, decisionId)) || !(await getScopedProject(currentUser, decision.projectId))) {
    throw new Error("Báº¡n khÃ´ng cÃ³ quyá»n chuyá»ƒn action item nÃ y thÃ nh cÃ´ng viá»‡c.");
  }

  const task = await convertDecisionToTask(decisionId);

  revalidatePath("/tasks");
  revalidatePath("/meetings");
  revalidatePath(`/meetings/${decision.meetingId}`);
  revalidatePath(`/projects/${decision.projectId}`);
  redirect(`/tasks/${task.id}`);
}
