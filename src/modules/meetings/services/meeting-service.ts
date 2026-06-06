import type { ProjectRepository } from "@/modules/projects/services/project-repository";
import { projectRepository } from "@/modules/projects/services/project-repository";
import type { TaskRepository } from "@/modules/tasks/services/task-repository";
import { taskRepository } from "@/modules/tasks/services/task-repository";
import { createTask } from "@/modules/tasks/services/task-service";
import type {
  Decision,
  DecisionAssignmentListFilters,
  DecisionInput,
  DecisionListFilters,
  Meeting,
  MeetingAiSummaryDraftInput,
  MeetingAttachment,
  MeetingAttachmentInput,
  MeetingDecisionTrackingLinkInput,
  MeetingFollowUpAction,
  MeetingFollowUpActionInput,
  MeetingFollowUpActionStatusInput,
  MeetingFollowUpTaskInput,
  MeetingInput,
  MeetingListFilters,
  MeetingMinutesApproval,
  MeetingMinutesUpdateInput,
  MeetingRelatedRecord,
  MeetingUpdateInput,
} from "@/modules/meetings/types";
import {
  decisionInputSchema,
  meetingFollowUpActionInputSchema,
  meetingFollowUpActionStatusInputSchema,
  meetingFollowUpTaskInputSchema,
  meetingDecisionTrackingLinkInputSchema,
  meetingAiSummaryDraftInputSchema,
  meetingAttachmentRemoveInputSchema,
  meetingAttachmentInputSchema,
  meetingInputSchema,
  meetingMinutesUpdateInputSchema,
  meetingUpdateSchema,
} from "@/modules/meetings/validation";

import {
  meetingRepository,
  type MeetingRepository,
} from "./meeting-repository";

function createId() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

function normalizeMeetingProjectIds(
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

function uniqueIds(values: Array<string | undefined> = []) {
  return [
    ...new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ];
}

function canonicalRelatedRecordType(type: MeetingRelatedRecord["type"]) {
  return type === "proposal" ? "approval" : type;
}

function relatedRecordKey(record: Pick<MeetingRelatedRecord, "id" | "type">) {
  return `${canonicalRelatedRecordType(record.type)}:${record.id.trim()}`;
}

function normalizeMeetingRelatedRecords(input: {
  relatedApprovals?: string[];
  relatedDecisions?: string[];
  relatedDocuments?: string[];
  relatedRecords?: MeetingRelatedRecord[];
  relatedRisks?: string[];
  relatedTasks?: string[];
}) {
  const records: MeetingRelatedRecord[] = [];
  const seen = new Set<string>();

  function add(record: MeetingRelatedRecord) {
    const id = record.id.trim();

    if (!id) {
      return;
    }

    const key = relatedRecordKey({ id, type: record.type });

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    records.push({
      type: record.type,
      id,
      relationType: record.relationType,
      title: record.title,
    });
  }

  for (const record of input.relatedRecords ?? []) {
    add(record);
  }

  for (const approvalId of uniqueIds(input.relatedApprovals)) {
    add({ type: "approval", id: approvalId, relationType: "context" });
  }

  for (const taskId of uniqueIds(input.relatedTasks)) {
    add({ type: "task", id: taskId, relationType: "context" });
  }

  for (const riskId of uniqueIds(input.relatedRisks)) {
    add({ type: "risk", id: riskId, relationType: "context" });
  }

  for (const documentId of uniqueIds(input.relatedDocuments)) {
    add({ type: "document", id: documentId, relationType: "context" });
  }

  for (const decisionId of uniqueIds(input.relatedDecisions)) {
    add({ type: "decision", id: decisionId, relationType: "context" });
  }

  return records;
}

function relatedApprovalsFromRecords(records: MeetingRelatedRecord[]) {
  return uniqueIds(
    records
      .filter(
        (record) => record.type === "approval" || record.type === "proposal",
      )
      .map((record) => record.id),
  );
}

function relatedTasksFromRecords(records: MeetingRelatedRecord[]) {
  return uniqueIds(
    records
      .filter((record) => record.type === "task")
      .map((record) => record.id),
  );
}

function hasRelatedRecordInput(input: {
  relatedApprovals?: string[];
  relatedDecisions?: string[];
  relatedDocuments?: string[];
  relatedRecords?: MeetingRelatedRecord[];
  relatedRisks?: string[];
  relatedTasks?: string[];
}) {
  return (
    input.relatedApprovals !== undefined ||
    input.relatedTasks !== undefined ||
    input.relatedDecisions !== undefined ||
    input.relatedRisks !== undefined ||
    input.relatedDocuments !== undefined ||
    input.relatedRecords !== undefined
  );
}

function existingMeetingRelatedRecords(meeting: Meeting) {
  return normalizeMeetingRelatedRecords({
    relatedApprovals: meeting.relatedApprovals,
    relatedRecords: meeting.relatedRecords,
    relatedTasks: meeting.relatedTasks,
  });
}

function visibleRelatedIdsForRecord(
  input: MeetingUpdateInput,
  record: MeetingRelatedRecord,
) {
  const canonicalType = canonicalRelatedRecordType(record.type);
  const valuesByType = {
    approval: input.visibleRelatedApprovals,
    decision: input.visibleRelatedDecisions,
    document: input.visibleRelatedDocuments,
    risk: input.visibleRelatedRisks,
    task: input.visibleRelatedTasks,
  } satisfies Partial<
    Record<MeetingRelatedRecord["type"], string[] | undefined>
  >;
  const values = valuesByType[canonicalType as keyof typeof valuesByType];

  return values === undefined ? undefined : new Set(values);
}

function hasTypedRelatedInput(
  input: MeetingUpdateInput,
  record: MeetingRelatedRecord,
) {
  const canonicalType = canonicalRelatedRecordType(record.type);

  return (
    (canonicalType === "approval" && input.relatedApprovals !== undefined) ||
    (canonicalType === "task" && input.relatedTasks !== undefined) ||
    (canonicalType === "decision" && input.relatedDecisions !== undefined) ||
    (canonicalType === "risk" && input.relatedRisks !== undefined) ||
    (canonicalType === "document" && input.relatedDocuments !== undefined)
  );
}

function shouldPreserveExistingRelatedRecord(
  input: MeetingUpdateInput,
  record: MeetingRelatedRecord,
) {
  if (input.relatedRecords !== undefined) {
    return false;
  }

  const canonicalType = canonicalRelatedRecordType(record.type);

  if (canonicalType === "project" || canonicalType === "custom") {
    return true;
  }

  if (!hasTypedRelatedInput(input, record)) {
    return true;
  }

  const visibleIds = visibleRelatedIdsForRecord(input, record);

  if (visibleIds === undefined) {
    return false;
  }

  return !visibleIds.has(record.id);
}

function mergeMeetingRelatedRecordsForUpdate(
  existingMeeting: Meeting,
  input: MeetingUpdateInput,
) {
  if (!hasRelatedRecordInput(input)) {
    return existingMeetingRelatedRecords(existingMeeting);
  }

  const records = normalizeMeetingRelatedRecords(input);
  const seen = new Set(records.map(relatedRecordKey));

  for (const record of existingMeetingRelatedRecords(existingMeeting)) {
    const key = relatedRecordKey(record);

    if (seen.has(key) || !shouldPreserveExistingRelatedRecord(input, record)) {
      continue;
    }

    seen.add(key);
    records.push(record);
  }

  return records;
}

function sortedSignature(values: string[] = []) {
  return [...values].sort().join("\u0000");
}

function relatedRecordSignature(records: MeetingRelatedRecord[]) {
  return [...new Set(records.map(relatedRecordKey))].sort();
}

function buildMeetingUpdateAuditNote(
  existingMeeting: Meeting,
  input: MeetingUpdateInput,
  relatedRecords: MeetingRelatedRecord[],
) {
  const changes: string[] = [];

  if (
    input.participants !== undefined &&
    sortedSignature(existingMeeting.participants) !==
      sortedSignature(input.participants)
  ) {
    changes.push(
      `participants ${existingMeeting.participants.length}->${input.participants.length}`,
    );
  }

  if (
    input.externalParticipants !== undefined &&
    sortedSignature(existingMeeting.externalParticipants) !==
      sortedSignature(input.externalParticipants)
  ) {
    changes.push(
      `external participants ${existingMeeting.externalParticipants.length}->${input.externalParticipants.length}`,
    );
  }

  if (hasRelatedRecordInput(input)) {
    const previousRelatedKeys = relatedRecordSignature(
      existingMeetingRelatedRecords(existingMeeting),
    );
    const nextRelatedKeys = relatedRecordSignature(relatedRecords);
    const previousSet = new Set(previousRelatedKeys);
    const nextSet = new Set(nextRelatedKeys);
    const addedCount = nextRelatedKeys.filter(
      (key) => !previousSet.has(key),
    ).length;
    const removedCount = previousRelatedKeys.filter(
      (key) => !nextSet.has(key),
    ).length;

    if (addedCount > 0 || removedCount > 0) {
      changes.push(`related records +${addedCount}/-${removedCount}`);
    }
  }

  return changes.length > 0
    ? `Cap nhat cuoc hop: ${changes.join("; ")}.`
    : "Cap nhat thong tin cuoc hop tu Meeting Engine.";
}

function assertMeetingActor(actorId: string) {
  if (!actorId.trim()) {
    throw new Error("Nguoi cap nhat cuoc hop la bat buoc.");
  }
}

function meetingAuditEntry(
  actorId: string,
  action: string,
  createdAt: string,
  note: string,
) {
  return {
    id: createId(),
    actorId,
    action,
    createdAt,
    note,
  };
}

function minutesApproval(
  approval: MeetingMinutesApproval | undefined,
): MeetingMinutesApproval {
  return approval ?? { status: "DRAFT" };
}

function minutesContentChanged(
  existingMeeting: Meeting,
  nextMinutes: string | undefined,
  nextSummary: string | undefined,
) {
  return (
    nextMinutes !== existingMeeting.meetingMinutes ||
    nextSummary !== existingMeeting.summary
  );
}

function minutesUpdateAuditNote(
  previousApproval: MeetingMinutesApproval,
  nextApproval: MeetingMinutesApproval,
  minutesChanged: boolean,
  summaryChanged: boolean,
) {
  return [
    `minutes ${previousApproval.status}->${nextApproval.status}`,
    minutesChanged ? "minutes updated" : undefined,
    summaryChanged ? "summary updated" : undefined,
  ]
    .filter(Boolean)
    .join("; ");
}

async function getExistingMeetingOrThrow(
  meetingId: string,
  repository: MeetingRepository,
) {
  const meeting = await repository.getMeeting(meetingId);

  if (!meeting) {
    throw new Error("Khong tim thay cuoc hop.");
  }

  return meeting;
}

function normalizedAttachmentUrl(url?: string) {
  return url?.trim().toLowerCase();
}

function attachmentDuplicateKey(attachment: Pick<MeetingAttachment, "documentId" | "name" | "url">) {
  if (attachment.documentId) {
    return `document:${attachment.documentId.trim()}`;
  }

  return `url:${normalizedAttachmentUrl(attachment.url) ?? ""}:${attachment.name.trim().toLowerCase()}`;
}

async function assertProjectsWritable(
  projectIds: string[],
  projects: ProjectRepository,
) {
  for (const projectId of projectIds) {
    const project = await projects.getProject(projectId);

    if (!project || project.archivedAt) {
      throw new Error("Dự án không tồn tại hoặc đã được lưu trữ.");
    }
  }
}

const meetingFollowUpReadyStatuses = new Set(["COMPLETED", "FOLLOW_UP_PENDING"]);

function assertMeetingAcceptsFollowUp(meeting: Meeting) {
  if (!meetingFollowUpReadyStatuses.has(meeting.status)) {
    throw new Error("Cuộc họp chưa đến giai đoạn follow-up.");
  }
}

function resolveMeetingFollowUpTaskProjectId(
  meeting: Meeting,
  taskProjectId?: string,
) {
  const meetingProjectIds = normalizeMeetingProjectIds(
    meeting.projectId,
    meeting.projectIds,
  );

  if (taskProjectId) {
    if (meetingProjectIds.length > 0 && !meetingProjectIds.includes(taskProjectId)) {
      throw new Error("Dự án task không thuộc phạm vi cuộc họp.");
    }

    return taskProjectId;
  }

  if (meetingProjectIds.length === 1) {
    return meetingProjectIds[0];
  }

  throw new Error("Cần chọn dự án đích để tạo task follow-up.");
}

function mergeGeneratedTaskRecord(
  meeting: Meeting,
  task: { id: string; title: string },
) {
  return normalizeMeetingRelatedRecords({
    relatedApprovals: meeting.relatedApprovals,
    relatedRecords: [
      ...(meeting.relatedRecords ?? []),
      {
        type: "task",
        id: task.id,
        relationType: "generated_action",
        title: task.title,
      },
    ],
    relatedTasks: [...meeting.relatedTasks, task.id],
  });
}

function taskDescriptionForFollowUp(
  meeting: Meeting,
  followUpAction: MeetingFollowUpAction,
) {
  return [
    "Công việc được tạo từ follow-up action sau cuộc họp.",
    `Cuộc họp: ${meeting.title}`,
    `Meeting ID: ${meeting.id}`,
    `Follow-up action ID: ${followUpAction.id}`,
  ].join("\n");
}

async function createTaskForMeetingFollowUp(
  meeting: Meeting,
  followUpAction: MeetingFollowUpAction,
  taskProjectId: string | undefined,
  actorId: string,
  tasks: TaskRepository,
  projects: ProjectRepository,
) {
  const projectId = resolveMeetingFollowUpTaskProjectId(meeting, taskProjectId);

  return createTask(
    {
      projectId,
      title: followUpAction.title,
      description: taskDescriptionForFollowUp(meeting, followUpAction),
      assigneeId: followUpAction.ownerId,
      dueDate: followUpAction.dueDate,
      status: "todo",
      priority: "medium",
      category: "meeting",
    },
    tasks,
    projects,
    {
      linkedEntityType: "meeting",
      linkedEntityId: meeting.id,
      createdBy: actorId,
    },
  );
}

async function updateMeetingWithFollowUpTaskRollback(
  meetingId: string,
  patch: Partial<Meeting>,
  repository: MeetingRepository,
  tasks: TaskRepository,
  createdTaskId?: string,
) {
  try {
    return await repository.updateMeeting(meetingId, patch);
  } catch (error) {
    if (createdTaskId) {
      await tasks.deleteTasks([createdTaskId]).catch(() => undefined);
    }

    throw error;
  }
}

export async function listMeetings(
  filters: MeetingListFilters = {},
  repository: MeetingRepository = meetingRepository,
) {
  return repository.listMeetings(filters);
}

export async function getMeeting(
  meetingId: string,
  repository: MeetingRepository = meetingRepository,
) {
  return repository.getMeeting(meetingId);
}

export async function createMeeting(
  input: MeetingInput,
  createdBy: string,
  repository: MeetingRepository = meetingRepository,
  projects: ProjectRepository = projectRepository,
) {
  const parsedInput = meetingInputSchema.parse(input);
  const projectIds = normalizeMeetingProjectIds(
    parsedInput.projectId,
    parsedInput.projectIds,
  );

  await assertProjectsWritable(projectIds, projects);

  const timestamp = now();
  const startTime = new Date(parsedInput.meetingDate).toISOString();
  const relatedRecords = normalizeMeetingRelatedRecords(parsedInput);
  const meeting: Meeting = {
    id: createId(),
    organizationId: parsedInput.organizationId,
    projectId: parsedInput.projectId,
    projectIds,
    axisId: parsedInput.axisId,
    departmentId: parsedInput.departmentId,
    title: parsedInput.title,
    meetingType: parsedInput.meetingType,
    visibility: parsedInput.visibility,
    participantScope: parsedInput.participantScope,
    status: parsedInput.status,
    meetingDate: startTime,
    startTime,
    endTime: parsedInput.endTime
      ? new Date(parsedInput.endTime).toISOString()
      : undefined,
    hostId: parsedInput.hostId ?? createdBy,
    participants: parsedInput.participants,
    externalParticipants: parsedInput.externalParticipants,
    roomId: parsedInput.roomId,
    agenda: parsedInput.agenda,
    attachments: [],
    aiSummary: { status: "DRAFT" },
    meetingMinutes: parsedInput.meetingMinutes,
    meetingMinutesApproval: { status: "DRAFT" },
    decisions: [],
    followUpActions: [],
    relatedApprovals: relatedApprovalsFromRecords(relatedRecords),
    relatedTasks: relatedTasksFromRecords(relatedRecords),
    relatedRecords,
    auditLog: [
      meetingAuditEntry(
        createdBy,
        "meeting.created",
        timestamp,
        "Tao cuoc hop tu Meeting Engine.",
      ),
    ],
    summary: parsedInput.summary,
    createdBy,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return repository.createMeeting(meeting);
}

export async function updateMeeting(
  meetingId: string,
  input: MeetingUpdateInput,
  updatedBy: string,
  repository: MeetingRepository = meetingRepository,
) {
  const parsedInput = meetingUpdateSchema.parse(input);

  if (!updatedBy.trim()) {
    throw new Error("Nguoi cap nhat cuoc hop la bat buoc.");
  }

  const existingMeeting = await repository.getMeeting(meetingId);

  if (!existingMeeting) {
    throw new Error("Khong tim thay cuoc hop.");
  }

  const timestamp = now();
  const relatedRecords = mergeMeetingRelatedRecordsForUpdate(
    existingMeeting,
    parsedInput,
  );
  const minutesChanged =
    parsedInput.meetingMinutes !== existingMeeting.meetingMinutes;
  const summaryChanged = parsedInput.summary !== existingMeeting.summary;
  const minutesChangedOrSummaryChanged = minutesContentChanged(
    existingMeeting,
    parsedInput.meetingMinutes,
    parsedInput.summary,
  );
  const previousApproval = minutesApproval(existingMeeting.meetingMinutesApproval);
  const nextApproval: MeetingMinutesApproval = minutesChangedOrSummaryChanged
    ? { status: "DRAFT" }
    : previousApproval;
  const auditLog = [
    ...existingMeeting.auditLog,
    meetingAuditEntry(
      updatedBy,
      "meeting.updated",
      timestamp,
      buildMeetingUpdateAuditNote(existingMeeting, parsedInput, relatedRecords),
    ),
    ...(minutesChangedOrSummaryChanged
      ? [
          meetingAuditEntry(
            updatedBy,
            "meeting.minutes_updated",
            timestamp,
            minutesUpdateAuditNote(
              previousApproval,
              nextApproval,
              minutesChanged,
              summaryChanged,
            ),
          ),
        ]
      : []),
  ];

  return repository.updateMeeting(meetingId, {
    title: parsedInput.title,
    meetingType: parsedInput.meetingType,
    visibility: parsedInput.visibility,
    participantScope: parsedInput.participantScope,
    status: parsedInput.status,
    meetingDate: new Date(parsedInput.meetingDate).toISOString(),
    startTime: new Date(parsedInput.meetingDate).toISOString(),
    endTime: parsedInput.endTime
      ? new Date(parsedInput.endTime).toISOString()
      : undefined,
    hostId: parsedInput.hostId,
    participants: parsedInput.participants,
    externalParticipants: parsedInput.externalParticipants,
    roomId: parsedInput.roomId,
    agenda: parsedInput.agenda,
    meetingMinutes: parsedInput.meetingMinutes,
    relatedApprovals: relatedApprovalsFromRecords(relatedRecords),
    relatedTasks: relatedTasksFromRecords(relatedRecords),
    relatedRecords,
    auditLog,
    ...(minutesChangedOrSummaryChanged
      ? { meetingMinutesApproval: nextApproval }
      : {}),
    summary: parsedInput.summary,
    updatedAt: timestamp,
  });
}

export async function updateMeetingMinutes(
  meetingId: string,
  input: MeetingMinutesUpdateInput,
  actorId: string,
  repository: MeetingRepository = meetingRepository,
) {
  const parsedInput = meetingMinutesUpdateInputSchema.parse(input);
  assertMeetingActor(actorId);
  const existingMeeting = await getExistingMeetingOrThrow(meetingId, repository);
  const timestamp = now();
  const previousApproval = minutesApproval(existingMeeting.meetingMinutesApproval);
  const minutesChanged =
    parsedInput.meetingMinutes !== existingMeeting.meetingMinutes;
  const summaryChanged = parsedInput.summary !== existingMeeting.summary;
  const contentChanged = minutesChanged || summaryChanged;
  const nextApproval: MeetingMinutesApproval = contentChanged
    ? { status: "DRAFT" }
    : previousApproval;

  return repository.updateMeeting(meetingId, {
    meetingMinutes: parsedInput.meetingMinutes,
    meetingMinutesApproval: nextApproval,
    summary: parsedInput.summary,
    auditLog: [
      ...existingMeeting.auditLog,
      meetingAuditEntry(
        actorId,
        "meeting.minutes_updated",
        timestamp,
        minutesUpdateAuditNote(
          previousApproval,
          nextApproval,
          minutesChanged,
          summaryChanged,
        ),
      ),
    ],
    updatedAt: timestamp,
  });
}

export async function approveMeetingMinutes(
  meetingId: string,
  actorId: string,
  repository: MeetingRepository = meetingRepository,
) {
  assertMeetingActor(actorId);
  const existingMeeting = await getExistingMeetingOrThrow(meetingId, repository);

  if (!existingMeeting.meetingMinutes?.trim()) {
    throw new Error("Chua co bien ban de duyet.");
  }

  const timestamp = now();
  const previousApproval = minutesApproval(existingMeeting.meetingMinutesApproval);
  const nextApproval: MeetingMinutesApproval = {
    status: "APPROVED",
    approvedBy: actorId,
    approvedAt: timestamp,
  };

  return repository.updateMeeting(meetingId, {
    meetingMinutesApproval: nextApproval,
    auditLog: [
      ...existingMeeting.auditLog,
      meetingAuditEntry(
        actorId,
        "meeting.minutes_approved",
        timestamp,
        `minutes ${previousApproval.status}->APPROVED`,
      ),
    ],
    updatedAt: timestamp,
  });
}

export async function addMeetingAttachment(
  meetingId: string,
  input: MeetingAttachmentInput,
  actorId: string,
  repository: MeetingRepository = meetingRepository,
) {
  const parsedInput = meetingAttachmentInputSchema.parse(input);
  assertMeetingActor(actorId);
  const existingMeeting = await getExistingMeetingOrThrow(meetingId, repository);
  const timestamp = now();
  const attachment: MeetingAttachment = {
    id: createId(),
    name: parsedInput.name,
    url: parsedInput.url,
    documentId: parsedInput.documentId,
    source: parsedInput.documentId ? "document" : "external_url",
    uploadedBy: actorId,
    uploadedAt: timestamp,
  };
  const nextKey = attachmentDuplicateKey(attachment);

  if (
    existingMeeting.attachments.some(
      (existingAttachment) =>
        attachmentDuplicateKey(existingAttachment) === nextKey,
    )
  ) {
    throw new Error("Attachment nay da ton tai trong cuoc hop.");
  }

  const attachments = [...existingMeeting.attachments, attachment];

  return repository.updateMeeting(meetingId, {
    attachments,
    auditLog: [
      ...existingMeeting.auditLog,
      meetingAuditEntry(
        actorId,
        "meeting.attachment_added",
        timestamp,
        `attachments ${existingMeeting.attachments.length}->${attachments.length}`,
      ),
    ],
    updatedAt: timestamp,
  });
}

export async function removeMeetingAttachment(
  meetingId: string,
  attachmentId: string,
  actorId: string,
  repository: MeetingRepository = meetingRepository,
) {
  const parsedInput = meetingAttachmentRemoveInputSchema.parse({
    attachmentId,
  });
  assertMeetingActor(actorId);
  const existingMeeting = await getExistingMeetingOrThrow(meetingId, repository);
  const attachments = existingMeeting.attachments.filter(
    (attachment) => attachment.id !== parsedInput.attachmentId,
  );

  if (attachments.length === existingMeeting.attachments.length) {
    throw new Error("Khong tim thay attachment trong cuoc hop.");
  }

  const timestamp = now();

  return repository.updateMeeting(meetingId, {
    attachments,
    auditLog: [
      ...existingMeeting.auditLog,
      meetingAuditEntry(
        actorId,
        "meeting.attachment_removed",
        timestamp,
        `attachments ${existingMeeting.attachments.length}->${attachments.length}`,
      ),
    ],
    updatedAt: timestamp,
  });
}

export async function updateMeetingAiSummaryDraft(
  meetingId: string,
  input: MeetingAiSummaryDraftInput,
  actorId: string,
  repository: MeetingRepository = meetingRepository,
) {
  const parsedInput = meetingAiSummaryDraftInputSchema.parse(input);
  assertMeetingActor(actorId);
  const existingMeeting = await getExistingMeetingOrThrow(meetingId, repository);
  const timestamp = now();

  return repository.updateMeeting(meetingId, {
    aiSummary: {
      content: parsedInput.content,
      status: "DRAFT",
    },
    auditLog: [
      ...existingMeeting.auditLog,
      meetingAuditEntry(
        actorId,
        "meeting.ai_summary_draft_updated",
        timestamp,
        `ai summary ${existingMeeting.aiSummary.status}->DRAFT`,
      ),
    ],
    updatedAt: timestamp,
  });
}

export async function approveMeetingAiSummary(
  meetingId: string,
  actorId: string,
  repository: MeetingRepository = meetingRepository,
) {
  assertMeetingActor(actorId);
  const existingMeeting = await getExistingMeetingOrThrow(meetingId, repository);

  if (!existingMeeting.aiSummary.content?.trim()) {
    throw new Error("Chua co ban nhap AI summary de duyet.");
  }

  const timestamp = now();

  return repository.updateMeeting(meetingId, {
    aiSummary: {
      content: existingMeeting.aiSummary.content,
      status: "APPROVED",
      approvedBy: actorId,
      approvedAt: timestamp,
    },
    auditLog: [
      ...existingMeeting.auditLog,
      meetingAuditEntry(
        actorId,
        "meeting.ai_summary_approved",
        timestamp,
        `ai summary ${existingMeeting.aiSummary.status}->APPROVED`,
      ),
    ],
    updatedAt: timestamp,
  });
}

export async function addMeetingFollowUpAction(
  meetingId: string,
  input: MeetingFollowUpActionInput,
  actorId: string,
  repository: MeetingRepository = meetingRepository,
  tasks: TaskRepository = taskRepository,
  projects: ProjectRepository = projectRepository,
) {
  const parsedInput = meetingFollowUpActionInputSchema.parse(input);
  assertMeetingActor(actorId);
  const existingMeeting = await getExistingMeetingOrThrow(meetingId, repository);
  assertMeetingAcceptsFollowUp(existingMeeting);

  const timestamp = now();
  const followUpAction: MeetingFollowUpAction = {
    id: createId(),
    title: parsedInput.title,
    ownerId: parsedInput.ownerId,
    dueDate: parsedInput.dueDate,
    status: parsedInput.status,
  };
  const auditLog = [
    ...existingMeeting.auditLog,
    meetingAuditEntry(
      actorId,
      "meeting.follow_up_added",
      timestamp,
      `follow-up actions ${existingMeeting.followUpActions.length}->${existingMeeting.followUpActions.length + 1}`,
    ),
  ];
  let relatedRecords = existingMeetingRelatedRecords(existingMeeting);
  let relatedTasks = existingMeeting.relatedTasks;
  let createdTaskId: string | undefined;

  if (parsedInput.createRelatedTask) {
    const task = await createTaskForMeetingFollowUp(
      existingMeeting,
      followUpAction,
      parsedInput.taskProjectId,
      actorId,
      tasks,
      projects,
    );
    createdTaskId = task.id;
    followUpAction.relatedTaskId = task.id;
    relatedRecords = mergeGeneratedTaskRecord(existingMeeting, task);
    relatedTasks = relatedTasksFromRecords(relatedRecords);
    auditLog.push(
      meetingAuditEntry(
        actorId,
        "meeting.follow_up_task_created",
        timestamp,
        `follow-up ${followUpAction.id} -> task ${task.id}`,
      ),
    );
  }

  return updateMeetingWithFollowUpTaskRollback(
    meetingId,
    {
      followUpActions: [...existingMeeting.followUpActions, followUpAction],
      relatedRecords,
      relatedTasks,
      auditLog,
      updatedAt: timestamp,
    },
    repository,
    tasks,
    createdTaskId,
  );
}

export async function updateMeetingFollowUpActionStatus(
  meetingId: string,
  followUpActionId: string,
  input: MeetingFollowUpActionStatusInput,
  actorId: string,
  repository: MeetingRepository = meetingRepository,
) {
  const parsedInput = meetingFollowUpActionStatusInputSchema.parse(input);
  assertMeetingActor(actorId);
  const existingMeeting = await getExistingMeetingOrThrow(meetingId, repository);
  assertMeetingAcceptsFollowUp(existingMeeting);

  const existingAction = existingMeeting.followUpActions.find(
    (action) => action.id === followUpActionId,
  );

  if (!existingAction) {
    throw new Error("Không tìm thấy follow-up action trong cuộc họp.");
  }

  const previousStatus = existingAction.status ?? "open";
  const timestamp = now();

  return repository.updateMeeting(meetingId, {
    followUpActions: existingMeeting.followUpActions.map((action) =>
      action.id === followUpActionId
        ? { ...action, status: parsedInput.status }
        : action,
    ),
    auditLog: [
      ...existingMeeting.auditLog,
      meetingAuditEntry(
        actorId,
        "meeting.follow_up_status_updated",
        timestamp,
        `follow-up ${previousStatus}->${parsedInput.status}`,
      ),
    ],
    updatedAt: timestamp,
  });
}

export async function createMeetingFollowUpTask(
  meetingId: string,
  followUpActionId: string,
  input: MeetingFollowUpTaskInput,
  actorId: string,
  repository: MeetingRepository = meetingRepository,
  tasks: TaskRepository = taskRepository,
  projects: ProjectRepository = projectRepository,
) {
  const parsedInput = meetingFollowUpTaskInputSchema.parse(input);
  assertMeetingActor(actorId);
  const existingMeeting = await getExistingMeetingOrThrow(meetingId, repository);
  assertMeetingAcceptsFollowUp(existingMeeting);

  const existingAction = existingMeeting.followUpActions.find(
    (action) => action.id === followUpActionId,
  );

  if (!existingAction) {
    throw new Error("Không tìm thấy follow-up action trong cuộc họp.");
  }

  if (existingAction.relatedTaskId) {
    throw new Error("Follow-up action đã có task liên kết.");
  }

  const task = await createTaskForMeetingFollowUp(
    existingMeeting,
    existingAction,
    parsedInput.taskProjectId,
    actorId,
    tasks,
    projects,
  );
  const timestamp = now();
  const relatedRecords = mergeGeneratedTaskRecord(existingMeeting, task);

  return updateMeetingWithFollowUpTaskRollback(
    meetingId,
    {
      followUpActions: existingMeeting.followUpActions.map((action) =>
        action.id === followUpActionId
          ? { ...action, relatedTaskId: task.id }
          : action,
      ),
      relatedRecords,
      relatedTasks: relatedTasksFromRecords(relatedRecords),
      auditLog: [
        ...existingMeeting.auditLog,
        meetingAuditEntry(
          actorId,
          "meeting.follow_up_task_created",
          timestamp,
          `follow-up ${followUpActionId} -> task ${task.id}`,
        ),
      ],
      updatedAt: timestamp,
    },
    repository,
    tasks,
    task.id,
  );
}

export async function linkMeetingDecisionTracking(
  meetingId: string,
  input: MeetingDecisionTrackingLinkInput,
  actorId: string,
  repository: MeetingRepository = meetingRepository,
) {
  const parsedInput = meetingDecisionTrackingLinkInputSchema.parse(input);
  assertMeetingActor(actorId);
  const existingMeeting = await getExistingMeetingOrThrow(meetingId, repository);
  const existingRecords = existingMeetingRelatedRecords(existingMeeting);

  if (
    existingRecords.some(
      (record) => record.type === "decision" && record.id === parsedInput.decisionId,
    )
  ) {
    throw new Error("Decision nay da duoc lien ket voi cuoc hop.");
  }

  const timestamp = now();
  const relatedRecords = normalizeMeetingRelatedRecords({
    relatedApprovals: existingMeeting.relatedApprovals,
    relatedRecords: [
      ...existingRecords,
      {
        type: "decision",
        id: parsedInput.decisionId,
        relationType: "context",
      },
    ],
    relatedTasks: existingMeeting.relatedTasks,
  });

  return repository.updateMeeting(meetingId, {
    relatedApprovals: relatedApprovalsFromRecords(relatedRecords),
    relatedRecords,
    relatedTasks: relatedTasksFromRecords(relatedRecords),
    auditLog: [
      ...existingMeeting.auditLog,
      meetingAuditEntry(
        actorId,
        "meeting.decision_tracking_updated",
        timestamp,
        `decision tracking linked ${parsedInput.decisionId}; decisions ${
          existingRecords.filter((record) => record.type === "decision").length
        }->${
          relatedRecords.filter((record) => record.type === "decision").length
        }`,
      ),
    ],
    updatedAt: timestamp,
  });
}

export async function listDecisions(
  filters: DecisionListFilters = {},
  repository: MeetingRepository = meetingRepository,
) {
  return repository.listDecisions(filters);
}

export async function getDecision(
  decisionId: string,
  repository: MeetingRepository = meetingRepository,
) {
  return repository.getDecision(decisionId);
}

export async function listDecisionAssignments(
  filters: DecisionAssignmentListFilters = {},
  repository: MeetingRepository = meetingRepository,
) {
  return repository.listDecisionAssignments(filters);
}

export async function createDecision(
  input: DecisionInput,
  repository: MeetingRepository = meetingRepository,
) {
  const parsedInput = decisionInputSchema.parse(input);
  const meeting = await repository.getMeeting(parsedInput.meetingId);

  if (!meeting) {
    throw new Error("Không tìm thấy cuộc họp.");
  }

  if (!meeting.projectId) {
    throw new Error(
      "Cuộc họp không gắn dự án nên chưa thể tạo action item theo dự án.",
    );
  }

  const timestamp = now();
  const decision: Decision = {
    id: createId(),
    title: parsedInput.decisionText,
    organizationId: meeting.organizationId,
    meetingId: meeting.id,
    projectId: meeting.projectId,
    projectIds: meeting.projectIds?.length
      ? meeting.projectIds
      : [meeting.projectId],
    axisId: meeting.axisId,
    workstreamId: meeting.departmentId ?? "decision",
    moduleId: "meeting",
    decisionText: parsedInput.decisionText,
    sourceType: "meeting",
    sourceId: meeting.id,
    linkedRecords: [
      {
        type: "meeting",
        id: meeting.id,
        relationType: "source",
        title: meeting.title,
      },
    ],
    ownerId: parsedInput.ownerId,
    priority: "medium",
    dueDate: parsedInput.dueDate,
    status: parsedInput.status,
    createdBy: meeting.createdBy,
    decidedBy: meeting.createdBy,
    decidedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return repository.createDecision(decision);
}

export async function convertDecisionToTask(
  decisionId: string,
  repository: MeetingRepository = meetingRepository,
  tasks: TaskRepository = taskRepository,
  projects: ProjectRepository = projectRepository,
) {
  const decision = await repository.getDecision(decisionId);

  if (!decision) {
    throw new Error("Không tìm thấy quyết định/action item.");
  }

  if (decision.taskId) {
    throw new Error("Action item này đã được chuyển thành công việc.");
  }

  if (!decision.projectId) {
    throw new Error("Chỉ decision gắn một dự án mới có thể chuyển thành task.");
  }

  const projectIds = [
    decision.projectId,
    ...(decision.projectIds ?? []),
  ].filter((projectId): projectId is string => Boolean(projectId));
  const uniqueProjectIds = [...new Set(projectIds)];

  if (uniqueProjectIds.length !== 1) {
    throw new Error(
      "Chỉ decision gắn đúng một dự án mới có thể chuyển thành task.",
    );
  }

  const meeting = decision.meetingId
    ? await repository.getMeeting(decision.meetingId)
    : undefined;
  const projectId = uniqueProjectIds[0];
  const task = await createTask(
    {
      projectId,
      title: decision.decisionText,
      description: [
        "Công việc được tạo từ quyết định/action item cuộc họp.",
        meeting ? `Cuộc họp: ${meeting.title}` : undefined,
      ]
        .filter(Boolean)
        .join("\n"),
      assigneeId: decision.ownerId,
      dueDate: decision.dueDate,
      status: "todo",
      priority: "medium",
      category: "meeting",
    },
    tasks,
    projects,
    {
      linkedEntityType: "decision",
      linkedEntityId: decision.id,
      createdBy: decision.createdBy,
    },
  );

  await repository.updateDecision(decision.id, {
    taskId: task.id,
    status: "in_progress",
    updatedAt: now(),
  });

  return task;
}
