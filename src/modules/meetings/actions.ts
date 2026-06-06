"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { assertCan, can } from "@/lib/permissions/can";
import {
  canCreateOrganizationMeeting,
  canCreateProjectMeeting,
  getScopedDocument,
  getScopedDecision,
  getScopedExecutiveRiskRecord,
  getScopedMeeting,
  getScopedProposal,
  getScopedProject,
  getScopedTask,
} from "@/lib/permissions/scoped-resources";
import { assertStorageUploadNotImplemented } from "@/lib/storage/document-storage";
import {
  buildAiMeetingSummaryDraft,
  type AiMeetingSummaryVisibleRelatedRecordInput,
} from "@/modules/ai/services/ai-meeting-summary-service";
import { aiRepository } from "@/modules/ai/services/ai-repository";
import type { AiMeetingSummaryActionProposal } from "@/modules/ai/types";
import { createDecisionRecord } from "@/modules/executive/services/decision-record-service";
import {
  addMeetingAttachment,
  addMeetingFollowUpAction,
  approveMeetingAiSummary,
  approveMeetingMinutes,
  convertDecisionToTask,
  createMeetingFollowUpTask,
  createMeeting,
  getDecision,
  linkMeetingDecisionTracking,
  removeMeetingAttachment,
  updateMeetingFollowUpActionStatus,
  updateMeetingAiSummaryDraft,
  updateMeeting,
  updateMeetingMinutes,
} from "@/modules/meetings/services/meeting-service";
import type {
  Decision,
  DecisionInput,
  Meeting,
  MeetingDecisionTrackingLinkInput,
  MeetingFollowUpActionInput,
  MeetingFollowUpTaskInput,
  MeetingInput,
  MeetingRelatedRecord,
  MeetingUpdateInput,
} from "@/modules/meetings/types";

export type MeetingActionState = {
  fieldErrors?: Record<string, string>;
  message?: string;
  status: "idle" | "error";
  values?: Record<string, string | string[]>;
};

const initialMeetingActionState: MeetingActionState = {
  status: "idle",
};

function readArrayField(formData: FormData, key: string) {
  const values = formData.getAll(key);

  return [
    ...new Set(
      values
        .flatMap((value) => String(value).split(","))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function readOptionalArrayField(formData: FormData, key: string) {
  if (!formData.has(key) && !formData.has(`${key}__present`)) {
    return undefined;
  }

  return readArrayField(formData, key);
}

function normalizeProjectScope(
  projectId: string | undefined,
  projectIds: string[] = [],
) {
  return [
    ...new Set(
      [projectId, ...projectIds].filter((item): item is string =>
        Boolean(item),
      ),
    ),
  ];
}

function resolveActionFormData(
  first: FormData | MeetingActionState,
  second?: FormData,
) {
  return second ?? (first as FormData);
}

function formDataToActionValues(
  formData: FormData,
): MeetingActionState["values"] {
  const values: Record<string, string | string[]> = {};
  const scalarFields = [
    "agenda",
    "attachmentId",
    "axisId",
    "content",
    "createActionProposal",
    "createRelatedTask",
    "departmentId",
    "decisionId",
    "decisionText",
    "dueDate",
    "documentId",
    "endTime",
    "externalParticipants",
    "followUpActionId",
    "hostId",
    "meetingDate",
    "meetingMinutes",
    "meetingType",
    "name",
    "organizationId",
    "ownerId",
    "participantScope",
    "participants",
    "projectId",
    "returnTo",
    "roomId",
    "status",
    "summary",
    "taskProjectId",
    "title",
    "url",
    "visibility",
  ];
  const arrayFields = [
    "projectIds",
    "relatedApprovals",
    "relatedTasks",
    "relatedDecisions",
    "relatedRisks",
    "relatedDocuments",
  ];

  for (const field of scalarFields) {
    if (formData.has(field)) {
      values[field] = String(formData.get(field) ?? "");
    }
  }

  for (const field of arrayFields) {
    if (formData.has(field) || formData.has(`${field}__present`)) {
      values[field] = readArrayField(formData, field);
    }
  }

  return values;
}

function fieldErrorsFromZod(error: ZodError) {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}

function meetingActionErrorState(
  formData: FormData,
  error: unknown,
): MeetingActionState {
  if (error instanceof ZodError) {
    return {
      fieldErrors: fieldErrorsFromZod(error),
      message: "Vui long kiem tra lai thong tin cuoc hop.",
      status: "error",
      values: formDataToActionValues(formData),
    };
  }

  return {
    message: error instanceof Error ? error.message : "Khong the luu cuoc hop.",
    status: "error",
    values: formDataToActionValues(formData),
  };
}

function optionalFormString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  return value ? value : undefined;
}

function formDataToMeetingMinutesInput(formData: FormData) {
  return {
    meetingMinutes: String(formData.get("meetingMinutes") ?? ""),
    summary: String(formData.get("summary") ?? ""),
  };
}

function formDataToMeetingAttachmentInput(formData: FormData) {
  const input: { documentId?: string; name: string; url?: string } = {
    name: String(formData.get("name") ?? ""),
  };
  const documentId = optionalFormString(formData, "documentId");
  const url = optionalFormString(formData, "url");

  if (documentId) {
    input.documentId = documentId;
  }

  if (url) {
    input.url = url;
  }

  return input;
}

function formDataToMeetingAiSummaryDraftInput(formData: FormData) {
  return {
    content: String(formData.get("content") ?? ""),
  };
}

function formDataToMeetingFollowUpInput(
  formData: FormData,
): MeetingFollowUpActionInput {
  const input: MeetingFollowUpActionInput = {
    title: String(formData.get("title") ?? ""),
    ownerId: String(formData.get("ownerId") ?? ""),
    dueDate: String(formData.get("dueDate") ?? ""),
    status: String(formData.get("status") ?? "open") as MeetingFollowUpActionInput["status"],
  };

  if (formData.has("createRelatedTask")) {
    input.createRelatedTask = true;
  }

  const taskProjectId = optionalFormString(formData, "taskProjectId");

  if (taskProjectId) {
    input.taskProjectId = taskProjectId;
  }

  return input;
}

function formDataToMeetingFollowUpTaskInput(
  formData: FormData,
): MeetingFollowUpTaskInput {
  const input: MeetingFollowUpTaskInput = {};
  const taskProjectId = optionalFormString(formData, "taskProjectId");

  if (taskProjectId) {
    input.taskProjectId = taskProjectId;
  }

  return input;
}

function formDataToMeetingFollowUpStatusInput(formData: FormData) {
  return {
    status: String(formData.get("status") ?? "open") as NonNullable<
      MeetingFollowUpActionInput["status"]
    >,
  };
}

function hasBinaryUpload(formData: FormData) {
  for (const value of formData.values()) {
    if (
      typeof value !== "string" &&
      "size" in value &&
      typeof value.size === "number"
    ) {
      return true;
    }
  }

  return false;
}

async function getWritableScopedMeeting(
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>,
  meetingId: string,
) {
  const scopedMeeting = await getScopedMeeting(currentUser, meetingId);

  if (!scopedMeeting) {
    throw new Error("Ban khong co quyen cap nhat cuoc hop nay.");
  }

  assertCan(currentUser, "meeting.update", scopedMeeting);

  return scopedMeeting;
}

function assertCanGenerateMeetingAiSummary(
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>,
) {
  if (!can(currentUser, "ai.ask") && !can(currentUser, "ai.create_draft")) {
    throw new Error("Ban khong co quyen tao ban nhap AI summary.");
  }
}

async function visibleMeetingAttachmentsForAi(
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>,
  meeting: Pick<Meeting, "attachments">,
) {
  const visibleAttachments: Meeting["attachments"] = [];

  for (const attachment of meeting.attachments) {
    if (
      attachment.documentId &&
      !(await getScopedDocument(currentUser, attachment.documentId))
    ) {
      continue;
    }

    visibleAttachments.push(attachment);
  }

  return visibleAttachments;
}

async function visibleMeetingProjectIdsForAi(
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>,
  meeting: Pick<Meeting, "projectId" | "projectIds">,
) {
  const visibleProjectIds: string[] = [];

  for (const projectId of meetingProjectIds(meeting)) {
    if (await getScopedProject(currentUser, projectId)) {
      visibleProjectIds.push(projectId);
    }
  }

  return visibleProjectIds;
}

function normalizedMeetingRelatedRecordsForAi(meeting: {
  relatedApprovals?: string[];
  relatedRecords?: MeetingRelatedRecord[];
  relatedTasks?: string[];
}) {
  const records: MeetingRelatedRecord[] = [];
  const seen = new Set<string>();

  function add(record: MeetingRelatedRecord) {
    const key = `${record.type}:${record.id}`;

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    records.push(record);
  }

  for (const record of meeting.relatedRecords ?? []) {
    add(record);
  }

  for (const approvalId of meeting.relatedApprovals ?? []) {
    add({ id: approvalId, relationType: "context", type: "approval" });
  }

  for (const taskId of meeting.relatedTasks ?? []) {
    add({ id: taskId, relationType: "context", type: "task" });
  }

  return records;
}

async function resolveVisibleMeetingRelatedRecordForAi(
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>,
  record: MeetingRelatedRecord,
): Promise<AiMeetingSummaryVisibleRelatedRecordInput | undefined> {
  if (record.type === "approval" || record.type === "proposal") {
    const detail = await getScopedProposal(currentUser, record.id);

    return detail
      ? {
          href: `/proposals/${detail.proposal.id}`,
          id: detail.proposal.id,
          label: `${detail.proposal.code} - ${detail.proposal.title}`,
          type: record.type,
        }
      : undefined;
  }

  if (record.type === "task") {
    const task = await getScopedTask(currentUser, record.id);

    return task
      ? {
          href: `/tasks/${task.id}`,
          id: task.id,
          label: task.title,
          type: record.type,
        }
      : undefined;
  }

  if (record.type === "document") {
    const document = await getScopedDocument(currentUser, record.id);

    return document
      ? {
          href: `/documents/${document.id}`,
          id: document.id,
          label: document.title,
          type: record.type,
        }
      : undefined;
  }

  if (record.type === "decision") {
    const decision = await getScopedDecision(currentUser, record.id);

    return decision
      ? {
          id: decision.id,
          label: decision.title ?? decision.decisionText,
          type: record.type,
        }
      : undefined;
  }

  if (record.type === "risk") {
    const risk = await getScopedExecutiveRiskRecord(currentUser, record.id);

    return risk
      ? {
          id: risk.id,
          label: risk.title,
          type: record.type,
        }
      : undefined;
  }

  if (record.type === "project") {
    const project = await getScopedProject(currentUser, record.id);

    return project
      ? {
          href: `/projects/${project.id}`,
          id: project.id,
          label: `${project.code} - ${project.name}`,
          type: record.type,
        }
      : undefined;
  }

  return {
    id: record.id,
    label: record.title ?? record.id,
    type: record.type,
  };
}

async function visibleMeetingRelatedRecordsForAi(
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>,
  meeting: Pick<
    Meeting,
    "relatedApprovals" | "relatedRecords" | "relatedTasks"
  >,
) {
  const records = await Promise.all(
    normalizedMeetingRelatedRecordsForAi(meeting).map((record) =>
      resolveVisibleMeetingRelatedRecordForAi(currentUser, record),
    ),
  );

  return records.filter(
    (record): record is AiMeetingSummaryVisibleRelatedRecordInput =>
      Boolean(record),
  );
}

function safeMeetingReturnTo(meetingId: string, value: FormDataEntryValue | null) {
  const fallback = `/meetings/${meetingId}`;
  const text = String(value ?? "").trim();

  if (!text || !text.startsWith("/") || text.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(text, "http://greennest.local");

    if (url.pathname !== fallback) {
      return fallback;
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}

async function refreshMeetingActionProposalBaselines(
  proposals: AiMeetingSummaryActionProposal[],
  meeting: Pick<Meeting, "aiSummary" | "updatedAt">,
) {
  await Promise.all(
    proposals
      .filter(
        (proposal) =>
          proposal.actionKey === "create_meeting_action_item" &&
          proposal.targetEntityType === "meeting",
      )
      .map(async (proposal) => {
        const existing = await aiRepository.getActionProposal(proposal.id);

        if (!existing) {
          return;
        }

        await aiRepository.updateActionProposal(proposal.id, {
          proposedPayload: {
            ...existing.proposedPayload,
            currentAiSummaryStatus: meeting.aiSummary.status,
            currentMeetingUpdatedAt: meeting.updatedAt,
          },
          updatedAt: meeting.updatedAt,
        });
      }),
  );
}

function revalidateMeetingMutationPaths(meeting: {
  id: string;
  projectId?: string;
  projectIds?: string[];
}) {
  revalidatePath("/meetings");
  revalidatePath(`/meetings/${meeting.id}`);
  for (const projectId of new Set(
    [meeting.projectId, ...(meeting.projectIds ?? [])].filter(
      (item): item is string => Boolean(item),
    ),
  )) {
    revalidatePath(`/projects/${projectId}`);
  }
}

function meetingProjectIds(meeting: {
  projectId?: string;
  projectIds?: string[];
}) {
  return [
    ...new Set(
      [meeting.projectId, ...(meeting.projectIds ?? [])].filter(
        (item): item is string => Boolean(item),
      ),
    ),
  ];
}

function decisionProjectIds(decision?: {
  projectId?: string;
  projectIds?: string[];
}) {
  if (!decision) {
    return [];
  }

  return [
    ...new Set(
      [decision.projectId, ...(decision.projectIds ?? [])].filter(
        (item): item is string => Boolean(item),
      ),
    ),
  ];
}

function revalidateDecisionTrackingPaths(
  meeting: { id: string; projectId?: string; projectIds?: string[] },
  decision?: { projectId?: string; projectIds?: string[] },
) {
  revalidateMeetingMutationPaths(meeting);
  revalidatePath("/executive/decision-log");
  revalidatePath("/executive/decisions");
  revalidatePath("/command-center");

  for (const projectId of decisionProjectIds(decision)) {
    revalidatePath(`/projects/${projectId}`);
  }
}

function resolveFollowUpTaskProjectId(
  meeting: { projectId?: string; projectIds?: string[] },
  requestedProjectId?: string,
) {
  const projectIds = meetingProjectIds(meeting);

  if (requestedProjectId) {
    if (projectIds.length > 0 && !projectIds.includes(requestedProjectId)) {
      throw new Error("Dự án task không thuộc phạm vi cuộc họp.");
    }

    return requestedProjectId;
  }

  if (projectIds.length === 1) {
    return projectIds[0];
  }

  throw new Error("Cần chọn dự án đích để tạo task follow-up.");
}

async function assertFollowUpTaskProjectWritable(
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>,
  meeting: { projectId?: string; projectIds?: string[] },
  requestedProjectId?: string,
) {
  assertCan(currentUser, "task.create");
  const taskProjectId = resolveFollowUpTaskProjectId(meeting, requestedProjectId);

  if (!(await getScopedProject(currentUser, taskProjectId))) {
    throw new Error("Bạn không có quyền tạo task cho dự án này.");
  }

  return taskProjectId;
}

function revalidateFollowUpTaskMutationPaths(
  meeting: { id: string; projectId?: string; projectIds?: string[] },
  taskProjectId?: string,
) {
  revalidateMeetingMutationPaths(meeting);

  if (taskProjectId) {
    revalidatePath(`/projects/${taskProjectId}`);
  }

  revalidatePath("/tasks");
  revalidatePath("/command-center");
  revalidatePath("/executive");
  revalidatePath("/executive/meetings");
}

function formDataToMeetingInput(formData: FormData): MeetingInput {
  return {
    organizationId: String(formData.get("organizationId") ?? ""),
    projectId: String(formData.get("projectId") ?? ""),
    projectIds: readArrayField(formData, "projectIds"),
    axisId: String(formData.get("axisId") ?? ""),
    departmentId: String(formData.get("departmentId") ?? ""),
    title: String(formData.get("title") ?? ""),
    meetingType: String(
      formData.get("meetingType") ?? "PROJECT_MEETING",
    ) as MeetingInput["meetingType"],
    visibility: String(
      formData.get("visibility") ?? "project",
    ) as MeetingInput["visibility"],
    participantScope: String(
      formData.get("participantScope") ?? "project_team",
    ) as MeetingInput["participantScope"],
    status: String(
      formData.get("status") ?? "SCHEDULED",
    ) as MeetingInput["status"],
    meetingDate: String(formData.get("meetingDate") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    hostId: String(formData.get("hostId") ?? ""),
    participants: readArrayField(formData, "participants"),
    externalParticipants: readArrayField(formData, "externalParticipants"),
    roomId: String(formData.get("roomId") ?? ""),
    agenda: String(formData.get("agenda") ?? ""),
    meetingMinutes: String(formData.get("meetingMinutes") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    relatedApprovals: readArrayField(formData, "relatedApprovals"),
    relatedTasks: readArrayField(formData, "relatedTasks"),
    relatedDecisions: readArrayField(formData, "relatedDecisions"),
    relatedRisks: readArrayField(formData, "relatedRisks"),
    relatedDocuments: readArrayField(formData, "relatedDocuments"),
  };
}

function formDataToMeetingUpdateInput(formData: FormData): MeetingUpdateInput {
  return {
    title: String(formData.get("title") ?? ""),
    meetingType: String(
      formData.get("meetingType") ?? "PROJECT_MEETING",
    ) as MeetingInput["meetingType"],
    visibility: String(
      formData.get("visibility") ?? "project",
    ) as MeetingInput["visibility"],
    participantScope: String(
      formData.get("participantScope") ?? "project_team",
    ) as MeetingInput["participantScope"],
    status: String(
      formData.get("status") ?? "SCHEDULED",
    ) as MeetingInput["status"],
    meetingDate: String(formData.get("meetingDate") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    hostId: String(formData.get("hostId") ?? ""),
    participants: readArrayField(formData, "participants"),
    externalParticipants: readArrayField(formData, "externalParticipants"),
    roomId: String(formData.get("roomId") ?? ""),
    agenda: String(formData.get("agenda") ?? ""),
    meetingMinutes: String(formData.get("meetingMinutes") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    relatedApprovals: readOptionalArrayField(formData, "relatedApprovals"),
    relatedTasks: readOptionalArrayField(formData, "relatedTasks"),
    relatedDecisions: readOptionalArrayField(formData, "relatedDecisions"),
    relatedRisks: readOptionalArrayField(formData, "relatedRisks"),
    relatedDocuments: readOptionalArrayField(formData, "relatedDocuments"),
    visibleRelatedApprovals: readArrayField(
      formData,
      "relatedApprovals__visible",
    ),
    visibleRelatedTasks: readArrayField(formData, "relatedTasks__visible"),
    visibleRelatedDecisions: readArrayField(
      formData,
      "relatedDecisions__visible",
    ),
    visibleRelatedRisks: readArrayField(formData, "relatedRisks__visible"),
    visibleRelatedDocuments: readArrayField(
      formData,
      "relatedDocuments__visible",
    ),
  };
}

function formDataToDecisionInput(
  meetingId: string,
  formData: FormData,
): DecisionInput {
  return {
    meetingId,
    decisionText: String(formData.get("decisionText") ?? ""),
    ownerId: String(formData.get("ownerId") ?? ""),
    dueDate: String(formData.get("dueDate") ?? ""),
    status: String(formData.get("status") ?? "open") as DecisionInput["status"],
  };
}

function formDataToMeetingDecisionTrackingLinkInput(
  formData: FormData,
): MeetingDecisionTrackingLinkInput {
  return {
    decisionId: optionalFormString(formData, "decisionId") ?? "",
  };
}

function isDecisionSourcedFromMeeting(
  meeting: Pick<Meeting, "id">,
  decision: Pick<Decision, "meetingId" | "sourceId" | "sourceType">,
) {
  return (
    decision.meetingId === meeting.id ||
    (decision.sourceType === "meeting" && decision.sourceId === meeting.id)
  );
}

function assertDecisionCanBeLinkedToMeeting(
  meeting: Pick<Meeting, "id" | "organizationId" | "projectId" | "projectIds">,
  decision: Pick<
    Decision,
    "meetingId" | "organizationId" | "projectId" | "projectIds" | "sourceId" | "sourceType"
  >,
) {
  if (isDecisionSourcedFromMeeting(meeting, decision)) {
    return;
  }

  if (
    meeting.organizationId &&
    decision.organizationId &&
    meeting.organizationId !== decision.organizationId
  ) {
    throw new Error("Decision khong cung pham vi voi cuoc hop.");
  }

  const meetingProjects = meetingProjectIds(meeting);
  const decisionProjects = decisionProjectIds(decision);
  const hasMatchingOrganization = Boolean(
    meeting.organizationId &&
      decision.organizationId &&
      meeting.organizationId === decision.organizationId,
  );
  const hasMatchingProject =
    meetingProjects.length > 0 &&
    decisionProjects.length > 0 &&
    decisionProjects.some((projectId) => meetingProjects.includes(projectId));

  if (
    meetingProjects.length > 0 &&
    decisionProjects.length > 0 &&
    !hasMatchingProject
  ) {
    throw new Error("Decision khong cung pham vi voi cuoc hop.");
  }

  if (!hasMatchingOrganization && !hasMatchingProject) {
    throw new Error("Decision khong cung pham vi voi cuoc hop.");
  }
}

function addRecordIds(
  records: Set<string>,
  relatedRecords: MeetingRelatedRecord[] | undefined,
  types: MeetingRelatedRecord["type"][],
) {
  for (const record of relatedRecords ?? []) {
    if (types.includes(record.type)) {
      records.add(record.id);
    }
  }
}

async function assertRelatedRecordsInScope(
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>,
  input: MeetingInput | MeetingUpdateInput,
) {
  const approvalIds = new Set(input.relatedApprovals ?? []);
  const taskIds = new Set(input.relatedTasks ?? []);
  const documentIds = new Set(input.relatedDocuments ?? []);
  const riskIds = new Set(input.relatedRisks ?? []);
  const decisionIds = new Set(input.relatedDecisions ?? []);

  addRecordIds(approvalIds, input.relatedRecords, ["approval", "proposal"]);
  addRecordIds(taskIds, input.relatedRecords, ["task"]);
  addRecordIds(documentIds, input.relatedRecords, ["document"]);
  addRecordIds(riskIds, input.relatedRecords, ["risk"]);
  addRecordIds(decisionIds, input.relatedRecords, ["decision"]);

  for (const approvalId of approvalIds) {
    if (!(await getScopedProposal(currentUser, approvalId))) {
      throw new Error(
        "Lien ket approval/proposal khong nam trong pham vi cua ban.",
      );
    }
  }

  for (const taskId of taskIds) {
    if (!(await getScopedTask(currentUser, taskId))) {
      throw new Error("Lien ket task khong nam trong pham vi cua ban.");
    }
  }

  for (const documentId of documentIds) {
    if (!(await getScopedDocument(currentUser, documentId))) {
      throw new Error("Lien ket document khong nam trong pham vi cua ban.");
    }
  }

  for (const riskId of riskIds) {
    if (!(await getScopedExecutiveRiskRecord(currentUser, riskId))) {
      throw new Error("Lien ket risk/blocker khong nam trong pham vi cua ban.");
    }
  }

  for (const decisionId of decisionIds) {
    if (!(await getScopedDecision(currentUser, decisionId))) {
      throw new Error("Lien ket decision khong nam trong pham vi cua ban.");
    }
  }
}

export async function createMeetingAction(
  formData: FormData,
): Promise<MeetingActionState>;
export async function createMeetingAction(
  _previousState: MeetingActionState,
  formData: FormData,
): Promise<MeetingActionState>;
export async function createMeetingAction(
  first: FormData | MeetingActionState,
  second?: FormData,
): Promise<MeetingActionState> {
  const formData = resolveActionFormData(first, second);
  let meeting: Awaited<ReturnType<typeof createMeeting>>;

  try {
    const currentUser = await getCurrentUser();
    assertCan(currentUser, "meeting.create");
    const input = formDataToMeetingInput(formData);
    const projectIds = normalizeProjectScope(input.projectId, input.projectIds);

    for (const projectId of projectIds) {
      if (
        !(await canCreateProjectMeeting(currentUser, {
          organizationId: input.organizationId,
          projectId,
          axisId: input.axisId,
          departmentId: input.departmentId,
        }))
      ) {
        throw new Error("Bạn không có quyền tạo biên bản họp cho dự án này.");
      }
    }
    if (
      projectIds.length === 0 &&
      !(await canCreateOrganizationMeeting(currentUser, {
        organizationId: input.organizationId,
        axisId: input.axisId,
        departmentId: input.departmentId,
      }))
    ) {
      throw new Error("Bạn không có quyền tạo biên bản họp cấp tổ chức.");
    }

    await assertRelatedRecordsInScope(currentUser, input);

    meeting = await createMeeting(input, currentUser.id);
  } catch (error) {
    return meetingActionErrorState(formData, error);
  }

  revalidatePath("/meetings");
  for (const projectId of new Set(
    [meeting.projectId, ...(meeting.projectIds ?? [])].filter(
      (item): item is string => Boolean(item),
    ),
  )) {
    revalidatePath(`/projects/${projectId}`);
  }
  redirect(`/meetings/${meeting.id}`);
  return initialMeetingActionState;
}

export async function updateMeetingAction(
  meetingId: string,
  formData: FormData,
): Promise<MeetingActionState>;
export async function updateMeetingAction(
  meetingId: string,
  _previousState: MeetingActionState,
  formData: FormData,
): Promise<MeetingActionState>;
export async function updateMeetingAction(
  meetingId: string,
  first: FormData | MeetingActionState,
  second?: FormData,
): Promise<MeetingActionState> {
  const formData = resolveActionFormData(first, second);
  let meeting: Awaited<ReturnType<typeof updateMeeting>>;

  try {
    const currentUser = await getCurrentUser();
    const scopedMeeting = await getScopedMeeting(currentUser, meetingId);

    if (!scopedMeeting) {
      throw new Error("Ban khong co quyen cap nhat cuoc hop nay.");
    }

    assertCan(currentUser, "meeting.update", scopedMeeting);

    const input = formDataToMeetingUpdateInput(formData);
    await assertRelatedRecordsInScope(currentUser, input);

    meeting = await updateMeeting(meetingId, input, currentUser.id);
  } catch (error) {
    return meetingActionErrorState(formData, error);
  }

  revalidatePath("/meetings");
  revalidatePath(`/meetings/${meeting.id}`);
  for (const projectId of new Set(
    [meeting.projectId, ...(meeting.projectIds ?? [])].filter(
      (item): item is string => Boolean(item),
    ),
  )) {
    revalidatePath(`/projects/${projectId}`);
  }
  redirect(`/meetings/${meeting.id}`);
  return initialMeetingActionState;
}

export async function updateMeetingMinutesAction(
  meetingId: string,
  formData: FormData,
): Promise<MeetingActionState>;
export async function updateMeetingMinutesAction(
  meetingId: string,
  _previousState: MeetingActionState,
  formData: FormData,
): Promise<MeetingActionState>;
export async function updateMeetingMinutesAction(
  meetingId: string,
  first: FormData | MeetingActionState,
  second?: FormData,
): Promise<MeetingActionState> {
  const formData = resolveActionFormData(first, second);

  try {
    const currentUser = await getCurrentUser();
    await getWritableScopedMeeting(currentUser, meetingId);
    const meeting = await updateMeetingMinutes(
      meetingId,
      formDataToMeetingMinutesInput(formData),
      currentUser.id,
    );

    revalidateMeetingMutationPaths(meeting);

    return initialMeetingActionState;
  } catch (error) {
    return meetingActionErrorState(formData, error);
  }
}

export async function approveMeetingMinutesAction(
  meetingId: string,
  formData: FormData,
): Promise<MeetingActionState>;
export async function approveMeetingMinutesAction(
  meetingId: string,
  _previousState: MeetingActionState,
  formData: FormData,
): Promise<MeetingActionState>;
export async function approveMeetingMinutesAction(
  meetingId: string,
  first: FormData | MeetingActionState,
  second?: FormData,
): Promise<MeetingActionState> {
  const formData = resolveActionFormData(first, second);

  try {
    const currentUser = await getCurrentUser();
    await getWritableScopedMeeting(currentUser, meetingId);
    const meeting = await approveMeetingMinutes(meetingId, currentUser.id);

    revalidateMeetingMutationPaths(meeting);

    return initialMeetingActionState;
  } catch (error) {
    return meetingActionErrorState(formData, error);
  }
}

export async function addMeetingAttachmentAction(
  meetingId: string,
  formData: FormData,
): Promise<MeetingActionState>;
export async function addMeetingAttachmentAction(
  meetingId: string,
  _previousState: MeetingActionState,
  formData: FormData,
): Promise<MeetingActionState>;
export async function addMeetingAttachmentAction(
  meetingId: string,
  first: FormData | MeetingActionState,
  second?: FormData,
): Promise<MeetingActionState> {
  const formData = resolveActionFormData(first, second);

  try {
    const currentUser = await getCurrentUser();
    await getWritableScopedMeeting(currentUser, meetingId);

    if (hasBinaryUpload(formData)) {
      assertStorageUploadNotImplemented();
    }

    const input = formDataToMeetingAttachmentInput(formData);

    if (
      input.documentId &&
      !(await getScopedDocument(currentUser, input.documentId))
    ) {
      throw new Error("Attachment document khong nam trong pham vi cua ban.");
    }

    const meeting = await addMeetingAttachment(
      meetingId,
      input,
      currentUser.id,
    );

    revalidateMeetingMutationPaths(meeting);

    return initialMeetingActionState;
  } catch (error) {
    return meetingActionErrorState(formData, error);
  }
}

export async function removeMeetingAttachmentAction(
  meetingId: string,
  formData: FormData,
): Promise<MeetingActionState>;
export async function removeMeetingAttachmentAction(
  meetingId: string,
  _previousState: MeetingActionState,
  formData: FormData,
): Promise<MeetingActionState>;
export async function removeMeetingAttachmentAction(
  meetingId: string,
  first: FormData | MeetingActionState,
  second?: FormData,
): Promise<MeetingActionState> {
  const formData = resolveActionFormData(first, second);

  try {
    const currentUser = await getCurrentUser();
    const scopedMeeting = await getWritableScopedMeeting(currentUser, meetingId);
    const attachmentId = optionalFormString(formData, "attachmentId") ?? "";
    const attachment = scopedMeeting.attachments.find(
      (item) => item.id === attachmentId,
    );

    if (
      attachment?.documentId &&
      !(await getScopedDocument(currentUser, attachment.documentId))
    ) {
      throw new Error("Attachment document khong nam trong pham vi cua ban.");
    }

    const meeting = await removeMeetingAttachment(
      meetingId,
      attachmentId,
      currentUser.id,
    );

    revalidateMeetingMutationPaths(meeting);

    return initialMeetingActionState;
  } catch (error) {
    return meetingActionErrorState(formData, error);
  }
}

export async function updateMeetingAiSummaryDraftAction(
  meetingId: string,
  formData: FormData,
): Promise<MeetingActionState>;
export async function updateMeetingAiSummaryDraftAction(
  meetingId: string,
  _previousState: MeetingActionState,
  formData: FormData,
): Promise<MeetingActionState>;
export async function updateMeetingAiSummaryDraftAction(
  meetingId: string,
  first: FormData | MeetingActionState,
  second?: FormData,
): Promise<MeetingActionState> {
  const formData = resolveActionFormData(first, second);

  try {
    const currentUser = await getCurrentUser();
    await getWritableScopedMeeting(currentUser, meetingId);
    const meeting = await updateMeetingAiSummaryDraft(
      meetingId,
      formDataToMeetingAiSummaryDraftInput(formData),
      currentUser.id,
    );

    revalidateMeetingMutationPaths(meeting);

    return initialMeetingActionState;
  } catch (error) {
    return meetingActionErrorState(formData, error);
  }
}

export async function generateMeetingAiSummaryDraftAction(
  meetingId: string,
  formData: FormData,
): Promise<MeetingActionState>;
export async function generateMeetingAiSummaryDraftAction(
  meetingId: string,
  _previousState: MeetingActionState,
  formData: FormData,
): Promise<MeetingActionState>;
export async function generateMeetingAiSummaryDraftAction(
  meetingId: string,
  first: FormData | MeetingActionState,
  second?: FormData,
): Promise<MeetingActionState> {
  const formData = resolveActionFormData(first, second);

  try {
    const currentUser = await getCurrentUser();
    const scopedMeeting = await getWritableScopedMeeting(currentUser, meetingId);

    assertCanGenerateMeetingAiSummary(currentUser);
    const returnToHref = safeMeetingReturnTo(meetingId, formData.get("returnTo"));
    const [visibleAttachments, visibleRelatedRecords, visibleProjectIds] =
      await Promise.all([
        visibleMeetingAttachmentsForAi(currentUser, scopedMeeting),
        visibleMeetingRelatedRecordsForAi(currentUser, scopedMeeting),
        visibleMeetingProjectIdsForAi(currentUser, scopedMeeting),
      ]);

    const aiSummary = await buildAiMeetingSummaryDraft(
      currentUser,
      {
        generatedAt: new Date().toISOString(),
        meeting: scopedMeeting,
        returnToHref,
        visibleAttachments,
        visibleProjectIds,
        visibleRelatedRecords,
      },
      {
        createActionProposal: formData.get("createActionProposal") === "on",
        useProvider: true,
      },
    );

    if (aiSummary.status !== "draft") {
      throw new Error(aiSummary.text);
    }

    const meeting = await updateMeetingAiSummaryDraft(
      meetingId,
      { content: aiSummary.text },
      currentUser.id,
    );

    await refreshMeetingActionProposalBaselines(
      aiSummary.actionProposals,
      meeting,
    );
    revalidateMeetingMutationPaths(meeting);
    revalidatePath(returnToHref);
    revalidatePath("/ai");
    if (aiSummary.jobId) {
      revalidatePath(`/ai/jobs/${aiSummary.jobId}`);
    }

    return initialMeetingActionState;
  } catch (error) {
    return meetingActionErrorState(formData, error);
  }
}

export async function approveMeetingAiSummaryAction(
  meetingId: string,
  formData: FormData,
): Promise<MeetingActionState>;
export async function approveMeetingAiSummaryAction(
  meetingId: string,
  _previousState: MeetingActionState,
  formData: FormData,
): Promise<MeetingActionState>;
export async function approveMeetingAiSummaryAction(
  meetingId: string,
  first: FormData | MeetingActionState,
  second?: FormData,
): Promise<MeetingActionState> {
  const formData = resolveActionFormData(first, second);

  try {
    const currentUser = await getCurrentUser();
    await getWritableScopedMeeting(currentUser, meetingId);
    const meeting = await approveMeetingAiSummary(meetingId, currentUser.id);

    revalidateMeetingMutationPaths(meeting);

    return initialMeetingActionState;
  } catch (error) {
    return meetingActionErrorState(formData, error);
  }
}

export async function addMeetingFollowUpActionAction(
  meetingId: string,
  formData: FormData,
): Promise<MeetingActionState>;
export async function addMeetingFollowUpActionAction(
  meetingId: string,
  _previousState: MeetingActionState,
  formData: FormData,
): Promise<MeetingActionState>;
export async function addMeetingFollowUpActionAction(
  meetingId: string,
  first: FormData | MeetingActionState,
  second?: FormData,
): Promise<MeetingActionState> {
  const formData = resolveActionFormData(first, second);

  try {
    const currentUser = await getCurrentUser();
    const scopedMeeting = await getWritableScopedMeeting(currentUser, meetingId);
    const input = formDataToMeetingFollowUpInput(formData);
    let taskProjectId: string | undefined;

    if (input.createRelatedTask) {
      taskProjectId = await assertFollowUpTaskProjectWritable(
        currentUser,
        scopedMeeting,
        input.taskProjectId,
      );
      input.taskProjectId = taskProjectId;
    }

    const meeting = await addMeetingFollowUpAction(
      meetingId,
      input,
      currentUser.id,
    );

    if (input.createRelatedTask) {
      revalidateFollowUpTaskMutationPaths(meeting, taskProjectId);
    } else {
      revalidateMeetingMutationPaths(meeting);
    }

    return initialMeetingActionState;
  } catch (error) {
    return meetingActionErrorState(formData, error);
  }
}

function resolveFollowUpActionFormData(
  first: string | FormData | MeetingActionState,
  second?: FormData | MeetingActionState,
  third?: FormData,
) {
  if (typeof first === "string") {
    const formData = third ?? (second as FormData);

    return {
      followUpActionId: first,
      formData,
    };
  }

  const formData = (second as FormData | undefined) ?? (first as FormData);

  return {
    followUpActionId: optionalFormString(formData, "followUpActionId") ?? "",
    formData,
  };
}

export async function createMeetingFollowUpTaskAction(
  meetingId: string,
  followUpActionId: string,
  formData: FormData,
): Promise<MeetingActionState>;
export async function createMeetingFollowUpTaskAction(
  meetingId: string,
  followUpActionId: string,
  _previousState: MeetingActionState,
  formData: FormData,
): Promise<MeetingActionState>;
export async function createMeetingFollowUpTaskAction(
  meetingId: string,
  formData: FormData,
): Promise<MeetingActionState>;
export async function createMeetingFollowUpTaskAction(
  meetingId: string,
  _previousState: MeetingActionState,
  formData: FormData,
): Promise<MeetingActionState>;
export async function createMeetingFollowUpTaskAction(
  meetingId: string,
  first: string | FormData | MeetingActionState,
  second?: FormData | MeetingActionState,
  third?: FormData,
): Promise<MeetingActionState> {
  const { followUpActionId, formData } = resolveFollowUpActionFormData(
    first,
    second,
    third,
  );

  try {
    const currentUser = await getCurrentUser();
    const scopedMeeting = await getWritableScopedMeeting(currentUser, meetingId);
    const input = formDataToMeetingFollowUpTaskInput(formData);
    const taskProjectId = await assertFollowUpTaskProjectWritable(
      currentUser,
      scopedMeeting,
      input.taskProjectId,
    );

    input.taskProjectId = taskProjectId;

    const meeting = await createMeetingFollowUpTask(
      meetingId,
      followUpActionId,
      input,
      currentUser.id,
    );

    revalidateFollowUpTaskMutationPaths(meeting, taskProjectId);

    return initialMeetingActionState;
  } catch (error) {
    return meetingActionErrorState(formData, error);
  }
}

export async function updateMeetingFollowUpActionStatusAction(
  meetingId: string,
  followUpActionId: string,
  formData: FormData,
): Promise<MeetingActionState>;
export async function updateMeetingFollowUpActionStatusAction(
  meetingId: string,
  followUpActionId: string,
  _previousState: MeetingActionState,
  formData: FormData,
): Promise<MeetingActionState>;
export async function updateMeetingFollowUpActionStatusAction(
  meetingId: string,
  formData: FormData,
): Promise<MeetingActionState>;
export async function updateMeetingFollowUpActionStatusAction(
  meetingId: string,
  _previousState: MeetingActionState,
  formData: FormData,
): Promise<MeetingActionState>;
export async function updateMeetingFollowUpActionStatusAction(
  meetingId: string,
  first: string | FormData | MeetingActionState,
  second?: FormData | MeetingActionState,
  third?: FormData,
): Promise<MeetingActionState> {
  const { followUpActionId, formData } = resolveFollowUpActionFormData(
    first,
    second,
    third,
  );

  try {
    const currentUser = await getCurrentUser();
    await getWritableScopedMeeting(currentUser, meetingId);
    const meeting = await updateMeetingFollowUpActionStatus(
      meetingId,
      followUpActionId,
      formDataToMeetingFollowUpStatusInput(formData),
      currentUser.id,
    );

    revalidateMeetingMutationPaths(meeting);

    return initialMeetingActionState;
  } catch (error) {
    return meetingActionErrorState(formData, error);
  }
}

export async function createDecisionAction(
  meetingId: string,
  formData: FormData,
): Promise<MeetingActionState>;
export async function createDecisionAction(
  meetingId: string,
  _previousState: MeetingActionState,
  formData: FormData,
): Promise<MeetingActionState>;
export async function createDecisionAction(
  meetingId: string,
  first: FormData | MeetingActionState,
  second?: FormData,
): Promise<MeetingActionState> {
  const formData = resolveActionFormData(first, second);

  try {
    const currentUser = await getCurrentUser();
    const scopedMeeting = await getScopedMeeting(currentUser, meetingId);

    if (!scopedMeeting) {
      throw new Error("Ban khong co quyen doc cuoc hop nay.");
    }

    assertCan(currentUser, "decision.create");
    const input = formDataToDecisionInput(meetingId, formData);
    const decision = await createDecisionRecord(
      {
        sourceType: "meeting",
        sourceId: meetingId,
        decisionText: input.decisionText,
        ownerId: input.ownerId,
        dueDate: input.dueDate,
        status: input.status,
      },
      currentUser,
    );

    revalidateDecisionTrackingPaths(scopedMeeting, decision);

    return initialMeetingActionState;
  } catch (error) {
    return meetingActionErrorState(formData, error);
  }
}

export async function linkMeetingDecisionTrackingAction(
  meetingId: string,
  formData: FormData,
): Promise<MeetingActionState>;
export async function linkMeetingDecisionTrackingAction(
  meetingId: string,
  _previousState: MeetingActionState,
  formData: FormData,
): Promise<MeetingActionState>;
export async function linkMeetingDecisionTrackingAction(
  meetingId: string,
  first: FormData | MeetingActionState,
  second?: FormData,
): Promise<MeetingActionState> {
  const formData = resolveActionFormData(first, second);

  try {
    const currentUser = await getCurrentUser();
    const scopedMeeting = await getWritableScopedMeeting(
      currentUser,
      meetingId,
    );
    const input = formDataToMeetingDecisionTrackingLinkInput(formData);
    const decision = await getScopedDecision(currentUser, input.decisionId);

    if (!decision) {
      throw new Error("Ban khong co quyen doc decision hoac decision khong ton tai.");
    }

    assertDecisionCanBeLinkedToMeeting(scopedMeeting, decision);
    const meeting = await linkMeetingDecisionTracking(
      meetingId,
      input,
      currentUser.id,
    );

    revalidateDecisionTrackingPaths(meeting, decision);

    return initialMeetingActionState;
  } catch (error) {
    return meetingActionErrorState(formData, error);
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
    throw new Error(
      "Bạn không có quyền chuyển action item này thành công việc.",
    );
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
