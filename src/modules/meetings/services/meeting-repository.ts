import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import {
  businessDateRangeEndIso,
  businessDateRangeStartIso,
} from "@/lib/date/business-day";
import { selectRepository } from "@/lib/db/repository-mode";
import type {
  Decision,
  DecisionAssignment,
  DecisionAssignmentListFilters,
  DecisionListFilters,
  DecisionVersion,
  Meeting,
  MeetingAiSummary,
  MeetingAuditEntry,
  MeetingAttachment,
  MeetingDecisionTracking,
  MeetingFollowUpAction,
  MeetingMinutesApproval,
  MeetingListFilters,
  MeetingRelatedRecord,
} from "@/modules/meetings/types";
import type { AuditLog } from "@/modules/users/types";

type MeetingStore = {
  meetings: Meeting[];
  decisions: Decision[];
  decisionAssignments: DecisionAssignment[];
  decisionVersions: DecisionVersion[];
};

const emptyStore: MeetingStore = {
  meetings: [],
  decisions: [],
  decisionAssignments: [],
  decisionVersions: [],
};

function isWriteContention(error: unknown) {
  const code = (error as NodeJS.ErrnoException).code;

  return code === "EPERM" || code === "EBUSY" || code === "EACCES";
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function activeFilterValue(value: string | "all" | undefined) {
  if (!value || value === "all") {
    return undefined;
  }

  const normalized = value.trim();

  return normalized ? normalized : undefined;
}

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
const supabaseUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isSupabaseUuid(value: string) {
  return supabaseUuidPattern.test(value);
}

function normalizeDateRangeStart(value: string | "all" | undefined) {
  const normalized = activeFilterValue(value);

  if (!normalized) {
    return undefined;
  }

  if (dateOnlyPattern.test(normalized)) {
    return businessDateRangeStartIso(normalized);
  }

  return Number.isNaN(Date.parse(normalized)) ? undefined : normalized;
}

function normalizeDateRangeEnd(value: string | "all" | undefined) {
  const normalized = activeFilterValue(value);

  if (!normalized) {
    return undefined;
  }

  if (dateOnlyPattern.test(normalized)) {
    return businessDateRangeEndIso(normalized);
  }

  return Number.isNaN(Date.parse(normalized)) ? undefined : normalized;
}

export type MeetingRepository = {
  listMeetings(filters?: MeetingListFilters): Promise<Meeting[]>;
  getMeeting(meetingId: string): Promise<Meeting | undefined>;
  createMeeting(meeting: Meeting): Promise<Meeting>;
  updateMeeting(meetingId: string, patch: Partial<Meeting>): Promise<Meeting>;
  listDecisions(filters?: DecisionListFilters): Promise<Decision[]>;
  getDecision(decisionId: string): Promise<Decision | undefined>;
  createDecision(decision: Decision): Promise<Decision>;
  updateDecision(
    decisionId: string,
    patch: Partial<Decision>,
  ): Promise<Decision>;
  listDecisionVersions(decisionId: string): Promise<DecisionVersion[]>;
  createDecisionVersion(version: DecisionVersion): Promise<DecisionVersion>;
  deleteDecisionVersions(versionIds: string[]): Promise<void>;
  updateDecisionWithVersionAndAudit?(
    input: DecisionUpdateTransactionInput,
  ): Promise<Decision>;
  listDecisionAssignments(
    filters?: DecisionAssignmentListFilters,
  ): Promise<DecisionAssignment[]>;
  getDecisionAssignment?(
    assignmentId: string,
  ): Promise<DecisionAssignment | undefined>;
  createDecisionAssignments(
    assignments: DecisionAssignment[],
  ): Promise<DecisionAssignment[]>;
  updateDecisionAssignment?(
    assignmentId: string,
    patch: Partial<DecisionAssignment>,
  ): Promise<DecisionAssignment>;
  deleteDecisionAssignments(assignmentIds: string[]): Promise<void>;
};

export type DecisionUpdateTransactionInput = {
  decisionId: string;
  patch: Partial<Decision>;
  version?: DecisionVersion;
  auditLog: Omit<AuditLog, "id" | "createdAt">;
};

export class JsonMeetingRepository implements MeetingRepository {
  constructor(
    private readonly filePath = path.join(
      process.cwd(),
      ".mock-data",
      "meetings-decisions.json",
    ),
  ) {}

  async listMeetings(filters: MeetingListFilters = {}) {
    const store = await this.readStore();

    return store.meetings
      .map(normalizeMeeting)
      .filter((meeting) => matchesMeetingFilters(meeting, filters))
      .sort((a, b) => b.startTime.localeCompare(a.startTime));
  }

  async getMeeting(meetingId: string) {
    const store = await this.readStore();

    const meeting = store.meetings.find((item) => item.id === meetingId);

    return meeting ? normalizeMeeting(meeting) : undefined;
  }

  async createMeeting(meeting: Meeting) {
    const store = await this.readStore();
    await this.writeStore({ ...store, meetings: [meeting, ...store.meetings] });

    return meeting;
  }

  async updateMeeting(meetingId: string, patch: Partial<Meeting>) {
    const store = await this.readStore();
    const existingMeeting = store.meetings.find(
      (meeting) => meeting.id === meetingId,
    );

    if (!existingMeeting) {
      throw new Error("Không tìm thấy cuộc họp.");
    }

    const normalizedMeeting = normalizeMeeting(existingMeeting);
    const updatedMeeting = {
      ...normalizedMeeting,
      ...patch,
      id: normalizedMeeting.id,
      projectId: normalizedMeeting.projectId,
      projectIds: normalizedMeeting.projectIds,
      createdAt: normalizedMeeting.createdAt,
    };

    await this.writeStore({
      ...store,
      meetings: store.meetings.map((meeting) =>
        meeting.id === meetingId ? updatedMeeting : meeting,
      ),
    });

    return updatedMeeting;
  }

  async listDecisions(filters: DecisionListFilters = {}) {
    const store = await this.readStore();

    return store.decisions
      .map(normalizeDecision)
      .filter(
        (decision) =>
          !filters.meetingId || decision.meetingId === filters.meetingId,
      )
      .filter(
        (decision) =>
          !filters.projectId ||
          filters.projectId === "all" ||
          decision.projectId === filters.projectId ||
          decision.projectIds?.includes(filters.projectId),
      )
      .filter(
        (decision) =>
          !filters.ownerId ||
          filters.ownerId === "all" ||
          decision.ownerId === filters.ownerId,
      )
      .filter(
        (decision) =>
          !filters.status ||
          filters.status === "all" ||
          decision.status === filters.status,
      )
      .sort((a, b) =>
        (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31"),
      );
  }

  async getDecision(decisionId: string) {
    const store = await this.readStore();

    const decision = store.decisions.find((item) => item.id === decisionId);

    return decision ? normalizeDecision(decision) : undefined;
  }

  async createDecision(decision: Decision) {
    const store = await this.readStore();
    const normalizedDecision = normalizeDecision(decision);
    await this.writeStore({
      ...store,
      decisions: [normalizedDecision, ...store.decisions],
    });

    return normalizedDecision;
  }

  async updateDecision(decisionId: string, patch: Partial<Decision>) {
    const store = await this.readStore();
    const existingDecision = store.decisions.find(
      (decision) => decision.id === decisionId,
    );

    if (!existingDecision) {
      throw new Error("Không tìm thấy quyết định/action item.");
    }

    const normalizedDecision = normalizeDecision(existingDecision);
    const updatedDecision = normalizeDecision({
      ...normalizedDecision,
      ...patch,
      id: normalizedDecision.id,
      meetingId: normalizedDecision.meetingId,
      sourceType: normalizedDecision.sourceType,
      sourceId: normalizedDecision.sourceId,
      createdBy: normalizedDecision.createdBy,
      decidedBy: normalizedDecision.decidedBy,
      decidedAt: normalizedDecision.decidedAt,
      createdAt: normalizedDecision.createdAt,
    });

    await this.writeStore({
      ...store,
      decisions: store.decisions.map((decision) =>
        decision.id === decisionId ? updatedDecision : decision,
      ),
    });

    return updatedDecision;
  }

  async listDecisionVersions(decisionId: string) {
    const store = await this.readStore();

    return store.decisionVersions
      .map(normalizeDecisionVersion)
      .filter((version) => version.decisionId === decisionId)
      .sort((a, b) => a.versionNumber - b.versionNumber);
  }

  async createDecisionVersion(version: DecisionVersion) {
    const store = await this.readStore();
    const normalizedVersion = normalizeDecisionVersion(version);

    await this.writeStore({
      ...store,
      decisionVersions: [normalizedVersion, ...store.decisionVersions],
    });

    return normalizedVersion;
  }

  async deleteDecisionVersions(versionIds: string[]) {
    if (versionIds.length === 0) {
      return;
    }

    const versionIdSet = new Set(versionIds);
    const store = await this.readStore();

    await this.writeStore({
      ...store,
      decisionVersions: store.decisionVersions.filter(
        (version) => !versionIdSet.has(version.id),
      ),
    });
  }

  async listDecisionAssignments(filters: DecisionAssignmentListFilters = {}) {
    const store = await this.readStore();

    return store.decisionAssignments
      .map(normalizeDecisionAssignment)
      .filter(
        (assignment) =>
          !filters.decisionId || assignment.decisionId === filters.decisionId,
      )
      .filter(
        (assignment) => !filters.taskId || assignment.taskId === filters.taskId,
      )
      .filter(
        (assignment) =>
          !filters.projectId ||
          filters.projectId === "all" ||
          assignment.projectId === filters.projectId,
      )
      .filter(
        (assignment) =>
          !filters.assigneeId ||
          filters.assigneeId === "all" ||
          assignment.assigneeId === filters.assigneeId,
      )
      .filter(
        (assignment) =>
          !filters.status ||
          filters.status === "all" ||
          assignment.status === filters.status,
      )
      .sort((a, b) =>
        (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31"),
      );
  }

  async createDecisionAssignments(assignments: DecisionAssignment[]) {
    const store = await this.readStore();
    const normalizedAssignments = assignments.map(normalizeDecisionAssignment);

    await this.writeStore({
      ...store,
      decisionAssignments: [
        ...normalizedAssignments,
        ...store.decisionAssignments,
      ],
    });

    return normalizedAssignments;
  }

  async getDecisionAssignment(assignmentId: string) {
    const store = await this.readStore();
    const assignment = store.decisionAssignments.find(
      (item) => item.id === assignmentId,
    );

    return assignment ? normalizeDecisionAssignment(assignment) : undefined;
  }

  async updateDecisionAssignment(
    assignmentId: string,
    patch: Partial<DecisionAssignment>,
  ) {
    const store = await this.readStore();
    const existingAssignment = store.decisionAssignments.find(
      (assignment) => assignment.id === assignmentId,
    );

    if (!existingAssignment) {
      throw new Error("Khong tim thay assignment cua decision.");
    }

    const normalizedAssignment = normalizeDecisionAssignment(existingAssignment);
    const updatedAssignment = normalizeDecisionAssignment({
      ...normalizedAssignment,
      ...patch,
      id: normalizedAssignment.id,
      decisionId: normalizedAssignment.decisionId,
      taskId: normalizedAssignment.taskId,
      organizationId: normalizedAssignment.organizationId,
      projectId: normalizedAssignment.projectId,
      createdBy: normalizedAssignment.createdBy,
      createdAt: normalizedAssignment.createdAt,
    });

    await this.writeStore({
      ...store,
      decisionAssignments: store.decisionAssignments.map((assignment) =>
        assignment.id === assignmentId ? updatedAssignment : assignment,
      ),
    });

    return updatedAssignment;
  }

  async deleteDecisionAssignments(assignmentIds: string[]) {
    if (assignmentIds.length === 0) {
      return;
    }

    const assignmentIdSet = new Set(assignmentIds);
    const store = await this.readStore();

    await this.writeStore({
      ...store,
      decisionAssignments: store.decisionAssignments.filter(
        (assignment) => !assignmentIdSet.has(assignment.id),
      ),
    });
  }

  private async readStore(): Promise<MeetingStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<MeetingStore>;

      return {
        meetings: parsed.meetings ?? [],
        decisions: parsed.decisions ?? [],
        decisionAssignments: parsed.decisionAssignments ?? [],
        decisionVersions: parsed.decisionVersions ?? [],
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return emptyStore;
      }

      throw error;
    }
  }

  private async writeStore(store: MeetingStore) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.${process.pid}.${randomUUID()}.tmp`;
    const payload = `${JSON.stringify(store, null, 2)}\n`;

    await writeFile(tempPath, payload, "utf8");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        await rename(tempPath, this.filePath);
        return;
      } catch (error) {
        if (!isWriteContention(error)) {
          await unlink(tempPath).catch(() => undefined);
          throw error;
        }

        if (attempt < 4) {
          await delay(20 * (attempt + 1));
          continue;
        }

        await writeFile(this.filePath, payload, "utf8");
        await unlink(tempPath).catch(() => undefined);
        return;
      }
    }
  }
}

type MeetingRow = {
  id: string;
  organization_id?: string | null;
  project_id: string | null;
  project_ids?: string[] | null;
  axis_id?: string | null;
  department_id?: string | null;
  title: string;
  meeting_type?: Meeting["meetingType"] | null;
  visibility?: Meeting["visibility"] | null;
  participant_scope?: Meeting["participantScope"] | null;
  status?: Meeting["status"] | null;
  meeting_date: string;
  start_time?: string | null;
  end_time?: string | null;
  host_id?: string | null;
  participants?: string[] | null;
  external_participants?: string[] | null;
  room_id?: string | null;
  agenda?: string | null;
  attachments?: MeetingAttachment[] | null;
  transcript?: string | null;
  ai_summary?: MeetingAiSummary | null;
  meeting_minutes?: string | null;
  meeting_minutes_approval?: MeetingMinutesApproval | null;
  decisions?: MeetingDecisionTracking[] | null;
  follow_up_actions?: MeetingFollowUpAction[] | null;
  related_approvals?: string[] | null;
  related_tasks?: string[] | null;
  related_records?: MeetingRelatedRecord[] | null;
  audit_log?: MeetingAuditEntry[] | null;
  summary: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type DecisionRow = {
  id: string;
  title?: string | null;
  organization_id?: string | null;
  meeting_id: string | null;
  project_id: string | null;
  project_ids?: string[] | null;
  axis_id?: string | null;
  workstream_id?: string | null;
  module_id?: string | null;
  decision_text: string;
  source_type?: Decision["sourceType"] | null;
  source_id?: string | null;
  linked_records?: Decision["linkedRecords"] | null;
  owner_id: string | null;
  priority?: Decision["priority"] | null;
  kpi?: string | null;
  due_date: string | null;
  status: Decision["status"];
  task_id?: string | null;
  created_by?: string | null;
  decided_by?: string | null;
  decided_at?: string | null;
  created_at: string;
  updated_at: string;
};

type DecisionVersionRow = {
  id: string;
  decision_id: string;
  version_number: number;
  changed_fields: DecisionVersion["changedFields"];
  previous_value: DecisionVersion["previousValue"] | null;
  new_value: DecisionVersion["newValue"] | null;
  reason?: string | null;
  created_by: string;
  created_at: string;
  updated_at?: string | null;
};

type DecisionAssignmentRow = {
  id: string;
  decision_id: string;
  task_id?: string | null;
  organization_id?: string | null;
  project_id: string;
  assignee_type: DecisionAssignment["assigneeType"];
  assignee_id?: string | null;
  department_id?: string | null;
  title: string;
  description?: string | null;
  kpi?: string | null;
  due_date?: string | null;
  priority: DecisionAssignment["priority"];
  status: DecisionAssignment["status"];
  created_by: string;
  created_at: string;
  updated_at: string;
};

function toMeeting(row: MeetingRow): Meeting {
  return normalizeMeeting({
    id: row.id,
    organizationId: row.organization_id ?? undefined,
    projectId: row.project_id ?? undefined,
    projectIds: row.project_ids ?? undefined,
    axisId: row.axis_id ?? undefined,
    departmentId: row.department_id ?? undefined,
    title: row.title,
    meetingType: row.meeting_type ?? undefined,
    visibility: row.visibility ?? undefined,
    participantScope: row.participant_scope ?? undefined,
    status: row.status ?? undefined,
    meetingDate: row.meeting_date,
    startTime: row.start_time ?? row.meeting_date,
    endTime: row.end_time ?? undefined,
    hostId: row.host_id ?? undefined,
    participants: row.participants ?? undefined,
    externalParticipants: row.external_participants ?? undefined,
    roomId: row.room_id ?? undefined,
    agenda: row.agenda ?? undefined,
    attachments: row.attachments ?? undefined,
    transcript: row.transcript ?? undefined,
    aiSummary: row.ai_summary ?? undefined,
    meetingMinutes: row.meeting_minutes ?? undefined,
    meetingMinutesApproval: row.meeting_minutes_approval ?? undefined,
    decisions: row.decisions ?? undefined,
    followUpActions: row.follow_up_actions ?? undefined,
    relatedApprovals: row.related_approvals ?? undefined,
    relatedTasks: row.related_tasks ?? undefined,
    relatedRecords: Array.isArray(row.related_records)
      ? row.related_records
      : undefined,
    auditLog: row.audit_log ?? undefined,
    summary: row.summary ?? undefined,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function toDecision(row: DecisionRow): Decision {
  return normalizeDecision({
    id: row.id,
    title: row.title ?? undefined,
    organizationId: row.organization_id ?? undefined,
    meetingId: row.meeting_id ?? undefined,
    projectId: row.project_id ?? undefined,
    projectIds: row.project_ids ?? undefined,
    axisId: row.axis_id ?? undefined,
    workstreamId: row.workstream_id ?? undefined,
    moduleId: row.module_id ?? undefined,
    decisionText: row.decision_text,
    sourceType: row.source_type ?? undefined,
    sourceId: row.source_id ?? undefined,
    linkedRecords: row.linked_records ?? undefined,
    ownerId: row.owner_id ?? undefined,
    priority: row.priority ?? undefined,
    kpi: row.kpi ?? undefined,
    dueDate: row.due_date ?? undefined,
    status: row.status,
    taskId: row.task_id ?? undefined,
    createdBy: row.created_by ?? undefined,
    decidedBy: row.decided_by ?? undefined,
    decidedAt: row.decided_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function toDecisionVersion(row: DecisionVersionRow): DecisionVersion {
  return normalizeDecisionVersion({
    id: row.id,
    decisionId: row.decision_id,
    versionNumber: row.version_number,
    changedFields: row.changed_fields,
    previousValue: row.previous_value ?? {},
    newValue: row.new_value ?? {},
    reason: row.reason ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  });
}

function toDecisionAssignment(row: DecisionAssignmentRow): DecisionAssignment {
  return normalizeDecisionAssignment({
    id: row.id,
    decisionId: row.decision_id,
    taskId: row.task_id ?? undefined,
    organizationId: row.organization_id ?? undefined,
    projectId: row.project_id,
    assigneeType: row.assignee_type,
    assigneeId: row.assignee_id ?? undefined,
    departmentId: row.department_id ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    kpi: row.kpi ?? undefined,
    dueDate: row.due_date ?? undefined,
    priority: row.priority,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function meetingToRow(meeting: Meeting) {
  return {
    id: meeting.id,
    organization_id: meeting.organizationId ?? null,
    project_id: meeting.projectId ?? null,
    project_ids: meeting.projectIds ?? [],
    axis_id: meeting.axisId ?? null,
    department_id: meeting.departmentId ?? null,
    title: meeting.title,
    meeting_type: meeting.meetingType,
    visibility: meeting.visibility,
    participant_scope: meeting.participantScope,
    status: meeting.status,
    meeting_date: meeting.meetingDate,
    start_time: meeting.startTime,
    end_time: meeting.endTime ?? null,
    host_id: meeting.hostId ?? null,
    participants: meeting.participants,
    external_participants: meeting.externalParticipants,
    room_id: meeting.roomId ?? null,
    agenda: meeting.agenda ?? null,
    attachments: meeting.attachments,
    transcript: meeting.transcript ?? null,
    ai_summary: meeting.aiSummary,
    meeting_minutes: meeting.meetingMinutes ?? null,
    meeting_minutes_approval: meeting.meetingMinutesApproval,
    decisions: meeting.decisions,
    follow_up_actions: meeting.followUpActions,
    related_approvals: meeting.relatedApprovals,
    related_tasks: meeting.relatedTasks,
    related_records: meeting.relatedRecords,
    audit_log: meeting.auditLog,
    summary: meeting.summary ?? null,
    created_by: meeting.createdBy ?? null,
    created_at: meeting.createdAt,
    updated_at: meeting.updatedAt,
  };
}

function decisionToRow(decision: Decision) {
  return {
    id: decision.id,
    title: decision.title ?? decision.decisionText,
    organization_id: decision.organizationId ?? null,
    meeting_id: decision.meetingId ?? null,
    project_id: decision.projectId ?? null,
    project_ids:
      decision.projectIds ?? (decision.projectId ? [decision.projectId] : []),
    axis_id: decision.axisId ?? null,
    workstream_id: decision.workstreamId ?? null,
    module_id: decision.moduleId ?? null,
    decision_text: decision.decisionText,
    source_type:
      decision.sourceType ?? (decision.meetingId ? "meeting" : "independent"),
    source_id: decision.sourceId ?? decision.meetingId ?? null,
    linked_records: decision.linkedRecords ?? [],
    owner_id: decision.ownerId ?? null,
    priority: decision.priority ?? "medium",
    kpi: decision.kpi ?? null,
    due_date: decision.dueDate ?? null,
    status: decision.status,
    task_id: decision.taskId ?? null,
    created_by: decision.createdBy ?? null,
    decided_by: decision.decidedBy ?? decision.createdBy ?? null,
    decided_at: decision.decidedAt ?? decision.createdAt,
    created_at: decision.createdAt,
    updated_at: decision.updatedAt,
  };
}

function decisionVersionToRow(version: DecisionVersion) {
  return {
    id: version.id,
    decision_id: version.decisionId,
    version_number: version.versionNumber,
    changed_fields: version.changedFields,
    previous_value: version.previousValue,
    new_value: version.newValue,
    reason: version.reason ?? null,
    created_by: version.createdBy,
    created_at: version.createdAt,
    updated_at: version.updatedAt,
  };
}

function auditLogInputToRow(auditLog: Omit<AuditLog, "id" | "createdAt">) {
  return {
    actor_id: auditLog.actorId,
    entity_type: auditLog.entityType,
    entity_id: auditLog.entityId,
    action: auditLog.action,
    old_value: auditLog.oldValue ?? null,
    new_value: auditLog.newValue ?? null,
  };
}

function decisionAssignmentToRow(assignment: DecisionAssignment) {
  return {
    id: assignment.id,
    decision_id: assignment.decisionId,
    task_id: assignment.taskId ?? null,
    organization_id: assignment.organizationId ?? null,
    project_id: assignment.projectId,
    assignee_type: assignment.assigneeType,
    assignee_id: assignment.assigneeId ?? null,
    department_id: assignment.departmentId ?? null,
    title: assignment.title,
    description: assignment.description ?? null,
    kpi: assignment.kpi ?? null,
    due_date: assignment.dueDate ?? null,
    priority: assignment.priority,
    status: assignment.status,
    created_by: assignment.createdBy,
    created_at: assignment.createdAt,
    updated_at: assignment.updatedAt,
  };
}

function hasPatchField<T extends object>(
  patch: T,
  key: keyof T,
) {
  return Object.prototype.hasOwnProperty.call(patch, key);
}

function meetingPatchToRow(patch: Partial<Meeting>) {
  return {
    ...(hasPatchField(patch, "organizationId")
      ? { organization_id: patch.organizationId ?? null }
      : {}),
    ...(hasPatchField(patch, "axisId")
      ? { axis_id: patch.axisId ?? null }
      : {}),
    ...(hasPatchField(patch, "departmentId")
      ? { department_id: patch.departmentId ?? null }
      : {}),
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.meetingType !== undefined
      ? { meeting_type: patch.meetingType }
      : {}),
    ...(patch.visibility !== undefined ? { visibility: patch.visibility } : {}),
    ...(patch.participantScope !== undefined
      ? { participant_scope: patch.participantScope }
      : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.meetingDate !== undefined
      ? { meeting_date: patch.meetingDate }
      : {}),
    ...(patch.startTime !== undefined ? { start_time: patch.startTime } : {}),
    ...(hasPatchField(patch, "endTime")
      ? { end_time: patch.endTime ?? null }
      : {}),
    ...(hasPatchField(patch, "hostId")
      ? { host_id: patch.hostId ?? null }
      : {}),
    ...(patch.participants !== undefined
      ? { participants: patch.participants }
      : {}),
    ...(patch.externalParticipants !== undefined
      ? { external_participants: patch.externalParticipants }
      : {}),
    ...(hasPatchField(patch, "roomId")
      ? { room_id: patch.roomId ?? null }
      : {}),
    ...(hasPatchField(patch, "agenda")
      ? { agenda: patch.agenda ?? null }
      : {}),
    ...(patch.attachments !== undefined
      ? { attachments: patch.attachments }
      : {}),
    ...(hasPatchField(patch, "transcript")
      ? { transcript: patch.transcript ?? null }
      : {}),
    ...(patch.aiSummary !== undefined ? { ai_summary: patch.aiSummary } : {}),
    ...(hasPatchField(patch, "meetingMinutes")
      ? { meeting_minutes: patch.meetingMinutes ?? null }
      : {}),
    ...(patch.meetingMinutesApproval !== undefined
      ? { meeting_minutes_approval: patch.meetingMinutesApproval }
      : {}),
    ...(patch.decisions !== undefined ? { decisions: patch.decisions } : {}),
    ...(patch.followUpActions !== undefined
      ? { follow_up_actions: patch.followUpActions }
      : {}),
    ...(patch.relatedApprovals !== undefined
      ? { related_approvals: patch.relatedApprovals }
      : {}),
    ...(patch.relatedTasks !== undefined
      ? { related_tasks: patch.relatedTasks }
      : {}),
    ...(patch.relatedRecords !== undefined
      ? { related_records: patch.relatedRecords }
      : {}),
    ...(patch.auditLog !== undefined ? { audit_log: patch.auditLog } : {}),
    ...(hasPatchField(patch, "summary")
      ? { summary: patch.summary ?? null }
      : {}),
    ...(patch.updatedAt !== undefined ? { updated_at: patch.updatedAt } : {}),
  };
}

function decisionPatchToRow(patch: Partial<Decision>) {
  return {
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.organizationId !== undefined
      ? { organization_id: patch.organizationId ?? null }
      : {}),
    ...(patch.meetingId !== undefined
      ? { meeting_id: patch.meetingId ?? null }
      : {}),
    ...(patch.projectId !== undefined
      ? { project_id: patch.projectId ?? null }
      : {}),
    ...(patch.projectIds !== undefined
      ? { project_ids: patch.projectIds }
      : {}),
    ...(patch.axisId !== undefined ? { axis_id: patch.axisId ?? null } : {}),
    ...(patch.workstreamId !== undefined
      ? { workstream_id: patch.workstreamId ?? null }
      : {}),
    ...(patch.moduleId !== undefined
      ? { module_id: patch.moduleId ?? null }
      : {}),
    ...(patch.decisionText !== undefined
      ? { decision_text: patch.decisionText }
      : {}),
    ...(patch.sourceType !== undefined
      ? { source_type: patch.sourceType }
      : {}),
    ...(patch.sourceId !== undefined
      ? { source_id: patch.sourceId ?? null }
      : {}),
    ...(patch.linkedRecords !== undefined
      ? { linked_records: patch.linkedRecords }
      : {}),
    ...(patch.ownerId !== undefined ? { owner_id: patch.ownerId ?? null } : {}),
    ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
    ...(patch.kpi !== undefined ? { kpi: patch.kpi ?? null } : {}),
    ...(patch.dueDate !== undefined ? { due_date: patch.dueDate ?? null } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.taskId !== undefined ? { task_id: patch.taskId ?? null } : {}),
    ...(patch.createdBy !== undefined
      ? { created_by: patch.createdBy ?? null }
      : {}),
    ...(patch.decidedBy !== undefined
      ? { decided_by: patch.decidedBy ?? null }
      : {}),
    ...(patch.decidedAt !== undefined
      ? { decided_at: patch.decidedAt ?? null }
      : {}),
    ...(patch.updatedAt !== undefined ? { updated_at: patch.updatedAt } : {}),
  };
}

function decisionAssignmentPatchToRow(patch: Partial<DecisionAssignment>) {
  return {
    ...(patch.decisionId !== undefined
      ? { decision_id: patch.decisionId }
      : {}),
    ...(patch.taskId !== undefined ? { task_id: patch.taskId ?? null } : {}),
    ...(patch.organizationId !== undefined
      ? { organization_id: patch.organizationId ?? null }
      : {}),
    ...(patch.projectId !== undefined ? { project_id: patch.projectId } : {}),
    ...(patch.assigneeType !== undefined
      ? { assignee_type: patch.assigneeType }
      : {}),
    ...(patch.assigneeId !== undefined
      ? { assignee_id: patch.assigneeId ?? null }
      : {}),
    ...(patch.departmentId !== undefined
      ? { department_id: patch.departmentId ?? null }
      : {}),
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.description !== undefined
      ? { description: patch.description ?? null }
      : {}),
    ...(patch.kpi !== undefined ? { kpi: patch.kpi ?? null } : {}),
    ...(patch.dueDate !== undefined ? { due_date: patch.dueDate ?? null } : {}),
    ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.createdBy !== undefined ? { created_by: patch.createdBy } : {}),
    ...(patch.createdAt !== undefined ? { created_at: patch.createdAt } : {}),
    ...(patch.updatedAt !== undefined ? { updated_at: patch.updatedAt } : {}),
  };
}

export class SupabaseMeetingRepository implements MeetingRepository {
  async listMeetings(filters: MeetingListFilters = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("meetings").select("*");
    const projectId = activeFilterValue(filters.projectId);

    if (projectId) {
      if (!isSupabaseUuid(projectId)) {
        return [];
      }

      query = query.or(
        `project_id.eq.${projectId},project_ids.cs.{${projectId}}`,
      );
    }

    if (filters.organizationId && filters.organizationId !== "all") {
      query = query.eq("organization_id", filters.organizationId);
    }

    if (filters.axisId && filters.axisId !== "all") {
      query = query.eq("axis_id", filters.axisId);
    }

    if (filters.departmentId && filters.departmentId !== "all") {
      query = query.eq("department_id", filters.departmentId);
    }

    if (filters.meetingType && filters.meetingType !== "all") {
      query = query.eq("meeting_type", filters.meetingType);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.visibility && filters.visibility !== "all") {
      query = query.eq("visibility", filters.visibility);
    }

    const participantId = activeFilterValue(filters.participantId);

    if (participantId) {
      if (!isSupabaseUuid(participantId)) {
        return [];
      }

      query = query.or(
        `host_id.eq.${participantId},participants.cs.{${participantId}}`,
      );
    }

    const dateFrom = normalizeDateRangeStart(filters.dateFrom);
    const dateTo = normalizeDateRangeEnd(filters.dateTo);

    if (dateFrom) {
      query = query.gte("start_time", dateFrom);
    }

    if (dateTo) {
      query = query.lte("start_time", dateTo);
    }

    const { data, error } = await query.order("start_time", {
      ascending: false,
    });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as MeetingRow[]).map(toMeeting);
  }

  async getMeeting(meetingId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", meetingId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toMeeting(data as MeetingRow) : undefined;
  }

  async createMeeting(meeting: Meeting) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("meetings")
      .insert(meetingToRow(meeting))
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toMeeting(data as MeetingRow);
  }

  async updateMeeting(meetingId: string, patch: Partial<Meeting>) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("meetings")
      .update(meetingPatchToRow(patch))
      .eq("id", meetingId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toMeeting(data as MeetingRow);
  }

  async listDecisions(filters: DecisionListFilters = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("decisions").select("*");

    if (filters.meetingId) {
      query = query.eq("meeting_id", filters.meetingId);
    }

    if (filters.projectId && filters.projectId !== "all") {
      query = query.or(
        `project_id.eq.${filters.projectId},project_ids.cs.{${filters.projectId}}`,
      );
    }

    if (filters.ownerId && filters.ownerId !== "all") {
      query = query.eq("owner_id", filters.ownerId);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query.order("due_date", {
      ascending: true,
      nullsFirst: false,
    });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as DecisionRow[]).map(toDecision);
  }

  async getDecision(decisionId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("decisions")
      .select("*")
      .eq("id", decisionId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toDecision(data as DecisionRow) : undefined;
  }

  async createDecision(decision: Decision) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("decisions")
      .insert(decisionToRow(decision))
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toDecision(data as DecisionRow);
  }

  async updateDecision(decisionId: string, patch: Partial<Decision>) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("decisions")
      .update(decisionPatchToRow(patch))
      .eq("id", decisionId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toDecision(data as DecisionRow);
  }

  async listDecisionVersions(decisionId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("decision_versions")
      .select("*")
      .eq("decision_id", decisionId)
      .order("version_number", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as DecisionVersionRow[]).map(toDecisionVersion);
  }

  async createDecisionVersion(version: DecisionVersion) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("decision_versions")
      .insert(decisionVersionToRow(version))
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toDecisionVersion(data as DecisionVersionRow);
  }

  async deleteDecisionVersions(versionIds: string[]) {
    if (versionIds.length === 0) {
      return;
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("decision_versions")
      .delete()
      .in("id", versionIds);

    if (error) {
      throw new Error(error.message);
    }
  }

  async updateDecisionWithVersionAndAudit(
    input: DecisionUpdateTransactionInput,
  ) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc(
      "update_decision_with_version_and_audit",
      {
        p_decision_id: input.decisionId,
        p_decision_patch: decisionPatchToRow(input.patch),
        p_decision_version: input.version
          ? decisionVersionToRow(input.version)
          : null,
        p_audit_log: auditLogInputToRow(input.auditLog),
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    return toDecision(data as DecisionRow);
  }

  async listDecisionAssignments(filters: DecisionAssignmentListFilters = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("decision_assignments").select("*");

    if (filters.decisionId) {
      query = query.eq("decision_id", filters.decisionId);
    }

    if (filters.taskId) {
      query = query.eq("task_id", filters.taskId);
    }

    if (filters.projectId && filters.projectId !== "all") {
      query = query.eq("project_id", filters.projectId);
    }

    if (filters.assigneeId && filters.assigneeId !== "all") {
      query = query.eq("assignee_id", filters.assigneeId);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query.order("due_date", {
      ascending: true,
      nullsFirst: false,
    });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as DecisionAssignmentRow[]).map(toDecisionAssignment);
  }

  async createDecisionAssignments(assignments: DecisionAssignment[]) {
    if (assignments.length === 0) {
      return [];
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("decision_assignments")
      .insert(assignments.map(decisionAssignmentToRow))
      .select("*");

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as DecisionAssignmentRow[]).map(toDecisionAssignment);
  }

  async getDecisionAssignment(assignmentId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("decision_assignments")
      .select("*")
      .eq("id", assignmentId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toDecisionAssignment(data as DecisionAssignmentRow) : undefined;
  }

  async updateDecisionAssignment(
    assignmentId: string,
    patch: Partial<DecisionAssignment>,
  ) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("decision_assignments")
      .update(decisionAssignmentPatchToRow(patch))
      .eq("id", assignmentId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toDecisionAssignment(data as DecisionAssignmentRow);
  }

  async deleteDecisionAssignments(assignmentIds: string[]) {
    if (assignmentIds.length === 0) {
      return;
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("decision_assignments")
      .delete()
      .in("id", assignmentIds);

    if (error) {
      throw new Error(error.message);
    }
  }
}

function normalizeMeeting(
  meeting: Partial<Meeting> &
    Pick<Meeting, "id" | "title" | "meetingDate" | "createdAt" | "updatedAt">,
): Meeting {
  const startTime = meeting.startTime ?? meeting.meetingDate;

  return {
    id: meeting.id,
    organizationId: meeting.organizationId ?? undefined,
    projectId: meeting.projectId ?? undefined,
    projectIds:
      meeting.projectIds ?? (meeting.projectId ? [meeting.projectId] : []),
    axisId: meeting.axisId ?? (meeting.projectId ? "axis-1" : undefined),
    departmentId: meeting.departmentId ?? undefined,
    title: meeting.title,
    meetingType: meeting.meetingType ?? "PROJECT_MEETING",
    visibility:
      meeting.visibility ?? (meeting.projectId ? "project" : "organization"),
    participantScope:
      meeting.participantScope ??
      (meeting.projectId ? "project_team" : "all_leadership"),
    status: meeting.status ?? "COMPLETED",
    meetingDate: meeting.meetingDate,
    startTime,
    endTime: meeting.endTime ?? undefined,
    hostId: meeting.hostId ?? meeting.createdBy ?? undefined,
    participants: meeting.participants ?? [],
    externalParticipants: meeting.externalParticipants ?? [],
    roomId: meeting.roomId ?? undefined,
    agenda: meeting.agenda ?? undefined,
    attachments: meeting.attachments ?? [],
    transcript: meeting.transcript ?? undefined,
    aiSummary: meeting.aiSummary ?? { status: "DRAFT" },
    meetingMinutes: meeting.meetingMinutes ?? undefined,
    meetingMinutesApproval: meeting.meetingMinutesApproval ?? {
      status: "DRAFT",
    },
    decisions: meeting.decisions ?? [],
    followUpActions: meeting.followUpActions ?? [],
    relatedApprovals: meeting.relatedApprovals ?? [],
    relatedTasks: meeting.relatedTasks ?? [],
    relatedRecords: Array.isArray(meeting.relatedRecords)
      ? meeting.relatedRecords
      : [],
    auditLog: meeting.auditLog ?? [],
    summary: meeting.summary ?? undefined,
    createdBy: meeting.createdBy ?? undefined,
    createdAt: meeting.createdAt,
    updatedAt: meeting.updatedAt,
  };
}

function normalizeDecision(decision: Decision): Decision {
  const projectIds = [
    decision.projectId,
    ...(decision.projectIds ?? []),
  ].filter((projectId): projectId is string => Boolean(projectId));
  const uniqueProjectIds = [...new Set(projectIds)];
  const sourceType =
    decision.sourceType ?? (decision.meetingId ? "meeting" : "independent");
  const sourceId =
    decision.sourceId ??
    (sourceType === "meeting" ? decision.meetingId : undefined);

  return {
    ...decision,
    title: decision.title ?? decision.decisionText,
    projectIds: uniqueProjectIds,
    sourceType,
    sourceId,
    linkedRecords: decision.linkedRecords ?? [],
    priority: decision.priority ?? "medium",
    decidedBy: decision.decidedBy ?? decision.createdBy,
    decidedAt: decision.decidedAt ?? decision.createdAt,
  };
}

function normalizeDecisionVersion(version: DecisionVersion): DecisionVersion {
  return {
    ...version,
    changedFields: [...new Set(version.changedFields)],
    previousValue: version.previousValue ?? {},
    newValue: version.newValue ?? {},
    updatedAt: version.updatedAt ?? version.createdAt,
  };
}

function normalizeDecisionAssignment(
  assignment: DecisionAssignment,
): DecisionAssignment {
  return {
    ...assignment,
    status: assignment.status ?? "assigned",
    priority: assignment.priority ?? "medium",
  };
}

function matchesMeetingFilters(meeting: Meeting, filters: MeetingListFilters) {
  const participantId = activeFilterValue(filters.participantId);
  const dateFrom = normalizeDateRangeStart(filters.dateFrom);
  const dateTo = normalizeDateRangeEnd(filters.dateTo);
  const meetingStart =
    activeFilterValue(meeting.startTime) ??
    activeFilterValue(meeting.meetingDate) ??
    "";

  return (
    (!filters.projectId ||
      filters.projectId === "all" ||
      meeting.projectId === filters.projectId ||
      meeting.projectIds?.includes(filters.projectId)) &&
    (!filters.organizationId ||
      filters.organizationId === "all" ||
      meeting.organizationId === filters.organizationId) &&
    (!filters.axisId ||
      filters.axisId === "all" ||
      meeting.axisId === filters.axisId) &&
    (!filters.departmentId ||
      filters.departmentId === "all" ||
      meeting.departmentId === filters.departmentId) &&
    (!participantId ||
      meeting.hostId === participantId ||
      meeting.participants.includes(participantId)) &&
    (!filters.meetingType ||
      filters.meetingType === "all" ||
      meeting.meetingType === filters.meetingType) &&
    (!filters.status ||
      filters.status === "all" ||
      meeting.status === filters.status) &&
    (!filters.visibility ||
      filters.visibility === "all" ||
      meeting.visibility === filters.visibility) &&
    (!dateFrom || meetingStart >= dateFrom) &&
    (!dateTo || meetingStart <= dateTo)
  );
}

export const jsonMeetingRepository = new JsonMeetingRepository();
export const supabaseMeetingRepository = new SupabaseMeetingRepository();
export const meetingRepository = selectRepository<MeetingRepository>({
  mock: jsonMeetingRepository,
  supabase: supabaseMeetingRepository,
});
