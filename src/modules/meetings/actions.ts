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

function readArrayField(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "");

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formDataToMeetingInput(formData: FormData): MeetingInput {
  return {
    organizationId: String(formData.get("organizationId") ?? ""),
    projectId: String(formData.get("projectId") ?? ""),
    axisId: String(formData.get("axisId") ?? ""),
    departmentId: String(formData.get("departmentId") ?? ""),
    title: String(formData.get("title") ?? ""),
    meetingType: String(formData.get("meetingType") ?? "PROJECT_MEETING") as MeetingInput["meetingType"],
    visibility: String(formData.get("visibility") ?? "project") as MeetingInput["visibility"],
    participantScope: String(formData.get("participantScope") ?? "project_team") as MeetingInput["participantScope"],
    status: String(formData.get("status") ?? "SCHEDULED") as MeetingInput["status"],
    meetingDate: String(formData.get("meetingDate") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    hostId: String(formData.get("hostId") ?? ""),
    participants: readArrayField(formData, "participants"),
    externalParticipants: readArrayField(formData, "externalParticipants"),
    roomId: String(formData.get("roomId") ?? ""),
    agenda: String(formData.get("agenda") ?? ""),
    meetingMinutes: String(formData.get("meetingMinutes") ?? ""),
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

  if (input.projectId && !(await getScopedProject(currentUser, input.projectId))) {
    throw new Error("Bạn không có quyền tạo biên bản họp cho dự án này.");
  }

  const meeting = await createMeeting(input, currentUser.id);

  revalidatePath("/meetings");
  if (meeting.projectId) {
    revalidatePath(`/projects/${meeting.projectId}`);
  }
  redirect(`/meetings/${meeting.id}`);
}

export async function updateMeetingAction(meetingId: string, formData: FormData) {
  const currentUser = await getCurrentUser();
  const existingMeeting = await getMeeting(meetingId);
  assertCan(currentUser, "meeting.update", existingMeeting);

  if (!(await getScopedMeeting(currentUser, meetingId))) {
    throw new Error("Bạn không có quyền cập nhật cuộc họp này.");
  }

  const meeting = await updateMeeting(meetingId, formDataToMeetingUpdateInput(formData));

  revalidatePath("/meetings");
  revalidatePath(`/meetings/${meeting.id}`);
  if (meeting.projectId) {
    revalidatePath(`/projects/${meeting.projectId}`);
  }
  redirect(`/meetings/${meeting.id}`);
}

export async function createDecisionAction(meetingId: string, formData: FormData) {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "decision.create");

  if (!(await getScopedMeeting(currentUser, meetingId))) {
    throw new Error("Bạn không có quyền tạo quyết định cho cuộc họp này.");
  }

  const decision = await createDecision(formDataToDecisionInput(meetingId, formData));

  revalidatePath("/meetings");
  revalidatePath(`/meetings/${meetingId}`);
  if (decision.projectId) {
    revalidatePath(`/projects/${decision.projectId}`);
  }
}

export async function convertDecisionToTaskAction(decisionId: string) {
  const currentUser = await getCurrentUser();
  const decision = await getDecision(decisionId);
  assertCan(currentUser, "task.create");

  if (
    !decision ||
    !decision.projectId ||
    !(await getScopedDecision(currentUser, decisionId)) ||
    !(await getScopedProject(currentUser, decision.projectId))
  ) {
    throw new Error("Bạn không có quyền chuyển action item này thành công việc.");
  }

  const task = await convertDecisionToTask(decisionId);

  revalidatePath("/tasks");
  revalidatePath("/meetings");
  if (decision.meetingId) {
    revalidatePath(`/meetings/${decision.meetingId}`);
  }
  revalidatePath(`/projects/${decision.projectId}`);
  redirect(`/tasks/${task.id}`);
}
