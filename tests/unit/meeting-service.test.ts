import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMock = vi.hoisted(() => {
  type TableName = "meetings" | "decisions" | "decision_assignments";
  type Row = Record<string, unknown>;
  const tables: Record<TableName, Row[]> = {
    decisions: [],
    decision_assignments: [],
    meetings: [],
  };
  const orExpressions: string[] = [];

  function createQuery(table: TableName) {
    let rows = [...tables[table]];
    let pendingInsert: Row[] | undefined;
    let pendingUpdate: Row | undefined;
    const query = {
      eq(column: string, value: unknown) {
        rows = rows.filter((row) => row[column] === value);

        return query;
      },
      gte(column: string, value: unknown) {
        rows = rows.filter((row) => String(row[column] ?? "") >= String(value));

        return query;
      },
      lte(column: string, value: unknown) {
        rows = rows.filter((row) => String(row[column] ?? "") <= String(value));

        return query;
      },
      or(expression: string) {
        orExpressions.push(expression);
        const clauses = expression.split(",");

        rows = rows.filter((row) =>
          clauses.some((clause) => {
            const [column, operator, rawValue] = clause.split(".");
            const value = rawValue?.replace(/^\{|\}$/g, "");

            if (operator === "eq") {
              return row[column] === value;
            }

            if (operator === "cs") {
              return Array.isArray(row[column]) && row[column].includes(value);
            }

            return false;
          }),
        );

        return query;
      },
      order(
        column: string,
        options: { ascending?: boolean; nullsFirst?: boolean } = {},
      ) {
        const sorted = [...rows].sort((left, right) => {
          const leftValue = left[column];
          const rightValue = right[column];

          if (leftValue == null && rightValue == null) {
            return 0;
          }

          if (leftValue == null) {
            return options.nullsFirst ? -1 : 1;
          }

          if (rightValue == null) {
            return options.nullsFirst ? 1 : -1;
          }

          const direction = options.ascending === false ? -1 : 1;

          return (
            String(leftValue).localeCompare(String(rightValue)) * direction
          );
        });

        return Promise.resolve({ data: sorted, error: null });
      },
      insert(row: Row | Row[]) {
        pendingInsert = Array.isArray(row) ? row : [row];
        rows = pendingInsert;

        return query;
      },
      maybeSingle() {
        return Promise.resolve({
          data: rows[0] ?? null,
          error: null,
        });
      },
      select() {
        return query;
      },
      single() {
        if (pendingInsert) {
          tables[table] = [...pendingInsert, ...tables[table]];

          return Promise.resolve({ data: pendingInsert[0], error: null });
        }

        if (pendingUpdate) {
          const updatedRows: Row[] = [];

          tables[table] = tables[table].map((row) => {
            if (!rows.includes(row)) {
              return row;
            }

            const updatedRow = { ...row, ...pendingUpdate };
            updatedRows.push(updatedRow);

            return updatedRow;
          });
          rows = updatedRows;

          return Promise.resolve({ data: updatedRows[0] ?? null, error: null });
        }

        return Promise.resolve({ data: rows[0] ?? null, error: null });
      },
      update(patch: Row) {
        pendingUpdate = patch;

        return query;
      },
    };

    return query;
  }

  return {
    createSupabaseServerClient: vi.fn(async () => ({
      from: (table: TableName) => createQuery(table),
    })),
    orExpressions,
    tables,
  };
});

vi.mock("@/lib/auth/supabase-server", () => ({
  createSupabaseServerClient: supabaseMock.createSupabaseServerClient,
  isSupabaseAuthConfigured: () => false,
}));

import {
  JsonMeetingRepository,
  SupabaseMeetingRepository,
} from "@/modules/meetings/services/meeting-repository";
import {
  addMeetingAttachment,
  addMeetingFollowUpAction,
  approveMeetingAiSummary,
  approveMeetingMinutes,
  convertDecisionToTask,
  createMeetingFollowUpTask,
  createDecision,
  createMeeting,
  linkMeetingDecisionTracking,
  listDecisions,
  listMeetings,
  removeMeetingAttachment,
  updateMeetingFollowUpActionStatus,
  updateMeetingAiSummaryDraft,
  updateMeeting,
  updateMeetingMinutes,
} from "@/modules/meetings/services/meeting-service";
import { MEETING_STATUSES, MEETING_TYPES } from "@/modules/meetings/constants";
import {
  meetingFollowUpActionInputSchema,
  meetingFollowUpTaskInputSchema,
  meetingInputSchema,
} from "@/modules/meetings/validation";
import { JsonProjectRepository } from "@/modules/projects/services/project-repository";
import {
  archiveProject,
  createProject,
} from "@/modules/projects/services/project-service";
import { JsonTaskRepository } from "@/modules/tasks/services/task-repository";

let tempDir: string;
let projectRepository: JsonProjectRepository;
let meetingRepository: JsonMeetingRepository;
let taskRepository: JsonTaskRepository;

class FailingUpdateMeetingRepository extends JsonMeetingRepository {
  async updateMeeting(): Promise<never> {
    throw new Error("meeting write failed");
  }
}

const supabaseProjectAId = "11111111-1111-4111-8111-111111111111";
const supabaseProjectBId = "22222222-2222-4222-8222-222222222222";
const supabaseLeaderId = "33333333-3333-4333-8333-333333333333";
const supabaseAssistantId = "44444444-4444-4444-8444-444444444444";
const supabaseHostId = "55555555-5555-4555-8555-555555555555";

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-meetings-"));
  projectRepository = new JsonProjectRepository(
    path.join(tempDir, "project-core.json"),
  );
  meetingRepository = new JsonMeetingRepository(
    path.join(tempDir, "meetings-decisions.json"),
  );
  taskRepository = new JsonTaskRepository(
    path.join(tempDir, "task-management.json"),
  );
  supabaseMock.tables.meetings = [];
  supabaseMock.tables.decisions = [];
  supabaseMock.tables.decision_assignments = [];
  supabaseMock.orExpressions.length = 0;
  supabaseMock.createSupabaseServerClient.mockClear();
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("meeting service", () => {
  it("keeps the stable meeting type and status machine-key contract", () => {
    expect(Object.keys(MEETING_TYPES)).toEqual([
      "EXECUTIVE_MEETING",
      "EXECUTIVE_OPERATIONAL_MEETING",
      "DEPARTMENT_INTERNAL_MEETING",
      "PROJECT_MEETING",
      "EXTERNAL_PARTNER_MEETING",
      "GOVERNMENT_MEETING",
    ]);
    expect(Object.keys(MEETING_STATUSES)).toEqual([
      "SCHEDULED",
      "CONFIRMED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "FOLLOW_UP_PENDING",
      "CLOSED",
    ]);
  });

  it("requires ISO timestamps for meeting start and end times", () => {
    expect(() =>
      meetingInputSchema.parse({
        title: "Date-only meeting should be rejected",
        meetingDate: "2026-05-20",
      }),
    ).toThrow();
    expect(() =>
      meetingInputSchema.parse({
        title: "Localized meeting should be rejected",
        meetingDate: "20/05/2026 09:00",
      }),
    ).toThrow();
  });

  it("creates organization-only meetings with draft AI summary and placeholder room support", async () => {
    const meeting = await createMeeting(
      {
        organizationId: "org-green-nest",
        title: "Executive organization sync",
        meetingType: "EXECUTIVE_MEETING",
        visibility: "organization",
        participantScope: "all_leadership",
        meetingDate: "2026-05-20T09:00:00.000Z",
        roomId: "room-placeholder",
      },
      "assistant-01",
      meetingRepository,
      projectRepository,
    );

    expect(meeting.projectId).toBeUndefined();
    expect(meeting.projectIds).toEqual([]);
    expect(meeting.hostId).toBe("assistant-01");
    expect(meeting.roomId).toBe("room-placeholder");
    expect(meeting.aiSummary).toEqual({ status: "DRAFT" });
    expect(meeting.meetingMinutesApproval).toEqual({ status: "DRAFT" });
    expect(meeting.attachments).toEqual([]);
    expect(meeting.decisions).toEqual([]);
    expect(meeting.followUpActions).toEqual([]);
    expect(meeting.relatedApprovals).toEqual([]);
    expect(meeting.relatedTasks).toEqual([]);
    expect(meeting.auditLog).toEqual([
      expect.objectContaining({ action: "meeting.created" }),
    ]);
  });

  it("updates and approves meeting minutes with safe audit summaries", async () => {
    const meeting = await createMeeting(
      {
        organizationId: "org-green-nest",
        title: "Minutes approval",
        meetingDate: "2026-06-05T09:00:00.000Z",
        meetingMinutes: "Initial minutes",
      },
      "assistant-01",
      meetingRepository,
      projectRepository,
    );

    const approved = await approveMeetingMinutes(
      meeting.id,
      "leader-01",
      meetingRepository,
    );

    expect(approved.meetingMinutesApproval).toMatchObject({
      approvedBy: "leader-01",
      status: "APPROVED",
    });

    const updated = await updateMeetingMinutes(
      meeting.id,
      {
        meetingMinutes: "Sensitive official minutes content",
        summary: "Executive-safe summary",
      },
      "assistant-01",
      meetingRepository,
    );

    expect(updated.meetingMinutes).toBe("Sensitive official minutes content");
    expect(updated.summary).toBe("Executive-safe summary");
    expect(updated.meetingMinutesApproval).toEqual({ status: "DRAFT" });
    expect(updated.auditLog.at(-1)).toEqual(
      expect.objectContaining({
        action: "meeting.minutes_updated",
        actorId: "assistant-01",
        note: expect.stringContaining("APPROVED->DRAFT"),
      }),
    );
    expect(updated.auditLog.at(-1)?.note).not.toContain(
      "Sensitive official minutes content",
    );
  });

  it("resets minutes approval when only the safe summary changes", async () => {
    const meeting = await createMeeting(
      {
        organizationId: "org-green-nest",
        title: "Summary approval",
        meetingDate: "2026-06-05T09:00:00.000Z",
        meetingMinutes: "Official minutes",
        summary: "Initial summary",
      },
      "assistant-01",
      meetingRepository,
      projectRepository,
    );
    await approveMeetingMinutes(meeting.id, "leader-01", meetingRepository);

    const updated = await updateMeetingMinutes(
      meeting.id,
      {
        meetingMinutes: "Official minutes",
        summary: "Updated safe summary",
      },
      "assistant-01",
      meetingRepository,
    );

    expect(updated.meetingMinutesApproval).toEqual({ status: "DRAFT" });
    expect(updated.auditLog.at(-1)).toEqual(
      expect.objectContaining({
        action: "meeting.minutes_updated",
        note: expect.stringContaining("APPROVED->DRAFT"),
      }),
    );
    expect(updated.auditLog.at(-1)?.note).not.toContain(
      "Updated safe summary",
    );
  });

  it("applies minutes approval rules when the generic edit path changes minutes content", async () => {
    const meeting = await createMeeting(
      {
        organizationId: "org-green-nest",
        title: "Generic edit approval",
        meetingDate: "2026-06-05T09:00:00.000Z",
        meetingMinutes: "Official minutes",
        summary: "Initial summary",
      },
      "assistant-01",
      meetingRepository,
      projectRepository,
    );
    await approveMeetingMinutes(meeting.id, "leader-01", meetingRepository);

    const updated = await updateMeeting(
      meeting.id,
      {
        title: "Generic edit approval updated",
        meetingDate: "2026-06-05T10:00:00.000Z",
        meetingMinutes: "Official minutes",
        summary: "Updated via generic edit",
      },
      "assistant-02",
      meetingRepository,
    );

    expect(updated.meetingMinutesApproval).toEqual({ status: "DRAFT" });
    expect(updated.auditLog).toEqual([
      expect.objectContaining({ action: "meeting.created" }),
      expect.objectContaining({ action: "meeting.minutes_approved" }),
      expect.objectContaining({ action: "meeting.updated" }),
      expect.objectContaining({
        action: "meeting.minutes_updated",
        note: expect.stringContaining("APPROVED->DRAFT"),
      }),
    ]);
    expect(updated.auditLog.at(-1)?.note).not.toContain(
      "Updated via generic edit",
    );
  });

  it("adds and removes attachments without mutating document records", async () => {
    const meeting = await createMeeting(
      {
        organizationId: "org-green-nest",
        title: "Attachment meeting",
        meetingDate: "2026-06-05T09:00:00.000Z",
      },
      "assistant-01",
      meetingRepository,
      projectRepository,
    );

    const withExternalAttachment = await addMeetingAttachment(
      meeting.id,
      {
        name: "Minutes deck.pdf",
        url: "https://example.com/minutes-deck.pdf",
      },
      "assistant-01",
      meetingRepository,
    );

    expect(withExternalAttachment.attachments).toEqual([
      expect.objectContaining({
        name: "Minutes deck.pdf",
        source: "external_url",
        uploadedBy: "assistant-01",
        url: "https://example.com/minutes-deck.pdf",
      }),
    ]);
    expect(withExternalAttachment.auditLog.at(-1)).toEqual(
      expect.objectContaining({
        action: "meeting.attachment_added",
        note: expect.stringContaining("attachments 0->1"),
      }),
    );

    await expect(
      addMeetingAttachment(
        meeting.id,
        {
          name: "Minutes deck.pdf",
          url: "https://example.com/minutes-deck.pdf",
        },
        "assistant-01",
        meetingRepository,
      ),
    ).rejects.toThrow("Attachment nay da ton tai trong cuoc hop.");

    await expect(
      addMeetingAttachment(
        meeting.id,
        {
          name: "Unsafe attachment",
          url: "javascript:alert(1)",
        },
        "assistant-01",
        meetingRepository,
      ),
    ).rejects.toThrow("Attachment URL phai la http/https hop le.");

    const withoutAttachment = await removeMeetingAttachment(
      meeting.id,
      withExternalAttachment.attachments[0].id,
      "assistant-01",
      meetingRepository,
    );

    expect(withoutAttachment.attachments).toEqual([]);
    expect(withoutAttachment.auditLog.at(-1)).toEqual(
      expect.objectContaining({
        action: "meeting.attachment_removed",
        note: expect.stringContaining("attachments 1->0"),
      }),
    );
  });

  it("keeps AI summary as draft until explicitly approved", async () => {
    const meeting = await createMeeting(
      {
        organizationId: "org-green-nest",
        title: "AI summary meeting",
        meetingDate: "2026-06-05T09:00:00.000Z",
      },
      "assistant-01",
      meetingRepository,
      projectRepository,
    );

    const draft = await updateMeetingAiSummaryDraft(
      meeting.id,
      { content: "Sensitive AI generated summary" },
      "assistant-01",
      meetingRepository,
    );

    expect(draft.aiSummary).toEqual({
      content: "Sensitive AI generated summary",
      status: "DRAFT",
    });
    expect(draft.auditLog.at(-1)?.note).not.toContain(
      "Sensitive AI generated summary",
    );

    const approved = await approveMeetingAiSummary(
      meeting.id,
      "leader-01",
      meetingRepository,
    );

    expect(approved.aiSummary).toMatchObject({
      approvedBy: "leader-01",
      content: "Sensitive AI generated summary",
      status: "APPROVED",
    });

    const revisedDraft = await updateMeetingAiSummaryDraft(
      meeting.id,
      { content: "Revised AI summary" },
      "assistant-01",
      meetingRepository,
    );

    expect(revisedDraft.aiSummary).toEqual({
      content: "Revised AI summary",
      status: "DRAFT",
    });
  });

  it("requires an actor for minutes, attachments and AI summary mutations", async () => {
    const meeting = await createMeeting(
      {
        organizationId: "org-green-nest",
        title: "Actor required",
        meetingDate: "2026-06-05T09:00:00.000Z",
        meetingMinutes: "Minutes",
      },
      "assistant-01",
      meetingRepository,
      projectRepository,
    );

    await expect(
      updateMeetingMinutes(
        meeting.id,
        { meetingMinutes: "New minutes" },
        "",
        meetingRepository,
      ),
    ).rejects.toThrow("Nguoi cap nhat cuoc hop la bat buoc.");
    await expect(
      addMeetingAttachment(
        meeting.id,
        { name: "Deck", url: "https://example.com/deck.pdf" },
        "",
        meetingRepository,
      ),
    ).rejects.toThrow("Nguoi cap nhat cuoc hop la bat buoc.");
    await expect(
      approveMeetingAiSummary(meeting.id, "", meetingRepository),
    ).rejects.toThrow("Nguoi cap nhat cuoc hop la bat buoc.");
  });

  it("returns readable errors for missing meetings in 6.4 mutations", async () => {
    await expect(
      approveMeetingMinutes("missing-meeting", "assistant-01", meetingRepository),
    ).rejects.toThrow("Khong tim thay cuoc hop.");
  });

  it("creates and updates meetings with generic related records and audit entries", async () => {
    const project = await createProject(
      { name: "GreenNest Related", status: "active" },
      projectRepository,
    );
    const meeting = await createMeeting(
      {
        projectId: project.id,
        title: "Related record planning",
        meetingDate: "2026-06-05T09:00:00.000Z",
        relatedApprovals: ["proposal-a", "proposal-a"],
        relatedTasks: ["task-a"],
        relatedRisks: ["risk-a"],
        relatedDocuments: ["document-a"],
        relatedDecisions: ["decision-a"],
        relatedRecords: [
          {
            id: "proposal-b",
            relationType: "context",
            title: "Approval B",
            type: "proposal",
          },
          {
            id: "task-a",
            relationType: "context",
            title: "Duplicate task link",
            type: "task",
          },
        ],
      },
      "assistant-01",
      meetingRepository,
      projectRepository,
    );

    expect(meeting.relatedApprovals).toEqual(["proposal-b", "proposal-a"]);
    expect(meeting.relatedTasks).toEqual(["task-a"]);
    expect(meeting.relatedRecords).toEqual([
      {
        id: "proposal-b",
        relationType: "context",
        title: "Approval B",
        type: "proposal",
      },
      {
        id: "task-a",
        relationType: "context",
        title: "Duplicate task link",
        type: "task",
      },
      {
        id: "proposal-a",
        relationType: "context",
        type: "approval",
      },
      {
        id: "risk-a",
        relationType: "context",
        type: "risk",
      },
      {
        id: "document-a",
        relationType: "context",
        type: "document",
      },
      {
        id: "decision-a",
        relationType: "context",
        type: "decision",
      },
    ]);

    const updatedMeeting = await updateMeeting(
      meeting.id,
      {
        title: "Related record planning updated",
        meetingDate: "2026-06-05T10:00:00.000Z",
        meetingType: "EXECUTIVE_MEETING",
        visibility: "executive",
        participantScope: "all_leadership",
        status: "CONFIRMED",
        hostId: "leader-01",
        participants: ["leader-01", "assistant-01"],
        externalParticipants: ["UBND"],
        roomId: "online-placeholder",
        agenda: "Review linked records",
        meetingMinutes: "Draft minutes",
        summary: "Updated summary",
        relatedApprovals: ["proposal-c"],
        relatedTasks: [],
        relatedRecords: [
          {
            id: "document-b",
            relationType: "context",
            title: "Document B",
            type: "document",
          },
        ],
      },
      "assistant-02",
      meetingRepository,
    );

    expect(updatedMeeting.projectId).toBe(project.id);
    expect(updatedMeeting.projectIds).toEqual([project.id]);
    expect(updatedMeeting.relatedApprovals).toEqual(["proposal-c"]);
    expect(updatedMeeting.relatedTasks).toEqual([]);
    expect(updatedMeeting.relatedRecords).toEqual([
      {
        id: "document-b",
        relationType: "context",
        title: "Document B",
        type: "document",
      },
      {
        id: "proposal-c",
        relationType: "context",
        type: "approval",
      },
    ]);
    expect(updatedMeeting.auditLog).toEqual([
      expect.objectContaining({
        action: "meeting.created",
        actorId: "assistant-01",
      }),
      expect.objectContaining({
        action: "meeting.updated",
        actorId: "assistant-02",
      }),
      expect.objectContaining({
        action: "meeting.minutes_updated",
        actorId: "assistant-02",
      }),
    ]);
  });

  it("preserves non-visible and unsupported related records during form-style edits", async () => {
    const project = await createProject(
      { name: "GreenNest Preserve", status: "active" },
      projectRepository,
    );
    const meeting = await createMeeting(
      {
        projectId: project.id,
        title: "Preserve related records",
        meetingDate: "2026-06-05T09:00:00.000Z",
        relatedTasks: ["task-hidden"],
        relatedRecords: [
          {
            id: "proposal-visible",
            relationType: "context",
            type: "approval",
          },
          {
            id: "proposal-hidden",
            relationType: "context",
            type: "approval",
          },
          {
            id: "project-hidden",
            relationType: "context",
            type: "project",
          },
          {
            id: "custom-hidden",
            relationType: "context",
            title: "Legacy custom link",
            type: "custom",
          },
        ],
      },
      "assistant-01",
      meetingRepository,
      projectRepository,
    );

    const updatedMeeting = await updateMeeting(
      meeting.id,
      {
        title: "Preserve related records updated",
        meetingDate: "2026-06-05T10:00:00.000Z",
        relatedApprovals: [],
        relatedTasks: [],
        visibleRelatedApprovals: ["proposal-visible"],
        visibleRelatedTasks: [],
      },
      "assistant-02",
      meetingRepository,
    );

    expect(updatedMeeting.relatedApprovals).toEqual(["proposal-hidden"]);
    expect(updatedMeeting.relatedTasks).toEqual(["task-hidden"]);
    expect(updatedMeeting.relatedRecords).toEqual([
      {
        id: "proposal-hidden",
        relationType: "context",
        type: "approval",
      },
      {
        id: "project-hidden",
        relationType: "context",
        type: "project",
      },
      {
        id: "custom-hidden",
        relationType: "context",
        title: "Legacy custom link",
        type: "custom",
      },
      {
        id: "task-hidden",
        relationType: "context",
        type: "task",
      },
    ]);
    expect(updatedMeeting.auditLog.at(-1)).toEqual(
      expect.objectContaining({
        action: "meeting.updated",
        actorId: "assistant-02",
        note: expect.stringContaining("related records +0/-1"),
      }),
    );
  });

  it("rejects meetings without organization or project scope", async () => {
    await expect(
      createMeeting(
        {
          title: "Unscoped meeting",
          meetingDate: "2026-05-20T09:00:00.000Z",
        },
        "assistant-01",
        meetingRepository,
        projectRepository,
      ),
    ).rejects.toThrow("Cuộc họp phải gắn với tổ chức hoặc ít nhất một dự án.");
  });

  it("dedupes and validates every project in multi-project meeting scope before writing", async () => {
    const projectA = await createProject(
      { name: "Project A", status: "active" },
      projectRepository,
    );
    const projectB = await createProject(
      { name: "Project B", status: "active" },
      projectRepository,
    );
    const archivedProject = await createProject(
      { name: "Archived", status: "active" },
      projectRepository,
    );
    await archiveProject(archivedProject.id, projectRepository);

    const meeting = await createMeeting(
      {
        projectId: projectA.id,
        projectIds: [projectB.id, projectA.id, projectB.id],
        title: "Multi-project executive operation",
        meetingDate: "2026-05-20T09:00:00.000Z",
      },
      "pm-01",
      meetingRepository,
      projectRepository,
    );

    expect(meeting.projectId).toBe(projectA.id);
    expect(meeting.projectIds).toEqual([projectA.id, projectB.id]);

    await expect(
      createMeeting(
        {
          projectIds: [projectA.id, "missing-project"],
          title: "Missing project",
          meetingDate: "2026-05-20T09:00:00.000Z",
        },
        "pm-01",
        meetingRepository,
        projectRepository,
      ),
    ).rejects.toThrow("Dự án không tồn tại");

    await expect(
      createMeeting(
        {
          projectIds: [archivedProject.id],
          title: "Archived project",
          meetingDate: "2026-05-20T09:00:00.000Z",
        },
        "pm-01",
        meetingRepository,
        projectRepository,
      ),
    ).rejects.toThrow("Dự án không tồn tại");
  });

  it("filters JSON meetings by single projectId and multi-project projectIds", async () => {
    const projectA = await createProject(
      { name: "Project A", status: "active" },
      projectRepository,
    );
    const projectB = await createProject(
      { name: "Project B", status: "active" },
      projectRepository,
    );
    const projectC = await createProject(
      { name: "Project C", status: "active" },
      projectRepository,
    );
    const projectAMeeting = await createMeeting(
      {
        projectId: projectA.id,
        title: "Project A only",
        meetingDate: "2026-05-20T09:00:00.000Z",
      },
      "pm-01",
      meetingRepository,
      projectRepository,
    );
    const multiProjectMeeting = await createMeeting(
      {
        projectIds: [projectB.id, projectC.id],
        title: "Multi-project portfolio",
        meetingDate: "2026-05-21T09:00:00.000Z",
      },
      "pm-01",
      meetingRepository,
      projectRepository,
    );

    const projectBMeetings = await listMeetings(
      { projectId: projectB.id },
      meetingRepository,
    );

    expect(projectBMeetings.map((meeting) => meeting.id)).toEqual([
      multiProjectMeeting.id,
    ]);
    expect(projectBMeetings.map((meeting) => meeting.id)).not.toContain(
      projectAMeeting.id,
    );
  });

  it("filters JSON meetings by participant and date range", async () => {
    const project = await createProject(
      { name: "Project Filters", status: "active" },
      projectRepository,
    );
    const hostMeeting = await createMeeting(
      {
        projectId: project.id,
        title: "Hosted in range",
        hostId: "leader-01",
        participants: ["assistant-01"],
        meetingDate: "2026-05-21T09:00:00.000Z",
      },
      "assistant-01",
      meetingRepository,
      projectRepository,
    );
    const participantMeeting = await createMeeting(
      {
        projectId: project.id,
        title: "Participating in range",
        hostId: "leader-02",
        participants: ["leader-01"],
        meetingDate: "2026-05-21T15:00:00.000Z",
      },
      "assistant-01",
      meetingRepository,
      projectRepository,
    );
    await createMeeting(
      {
        projectId: project.id,
        title: "Participating outside range",
        hostId: "leader-03",
        participants: ["leader-01"],
        meetingDate: "2026-05-23T09:00:00.000Z",
      },
      "assistant-01",
      meetingRepository,
      projectRepository,
    );

    const meetings = await listMeetings(
      {
        dateFrom: "2026-05-21",
        dateTo: "2026-05-21",
        participantId: "leader-01",
      },
      meetingRepository,
    );

    expect(meetings.map((meeting) => meeting.id)).toEqual([
      participantMeeting.id,
      hostMeeting.id,
    ]);
  });

  it("filters JSON meetings by organization, axis, department, status, and visibility", async () => {
    const project = await createProject(
      { name: "Project Full Contract", status: "active" },
      projectRepository,
    );
    const matchingMeeting = await createMeeting(
      {
        axisId: "axis-1",
        departmentId: "legal",
        meetingDate: "2026-05-21T09:00:00.000Z",
        organizationId: "org-green-nest",
        projectId: project.id,
        status: "FOLLOW_UP_PENDING",
        title: "Matching full contract",
        visibility: "executive",
      },
      "assistant-01",
      meetingRepository,
      projectRepository,
    );
    await createMeeting(
      {
        axisId: "axis-1",
        departmentId: "finance",
        meetingDate: "2026-05-21T10:00:00.000Z",
        organizationId: "org-green-nest",
        projectId: project.id,
        status: "FOLLOW_UP_PENDING",
        title: "Wrong department",
        visibility: "executive",
      },
      "assistant-01",
      meetingRepository,
      projectRepository,
    );

    const meetings = await listMeetings(
      {
        axisId: "axis-1",
        departmentId: "legal",
        organizationId: "org-green-nest",
        status: "FOLLOW_UP_PENDING",
        visibility: "executive",
      },
      meetingRepository,
    );

    expect(meetings.map((meeting) => meeting.id)).toEqual([matchingMeeting.id]);
  });

  it("filters JSON meetings by meetingDate when startTime is empty", async () => {
    const project = await createProject(
      { name: "Project Fallback Date", status: "active" },
      projectRepository,
    );
    await meetingRepository.createMeeting({
      aiSummary: { status: "DRAFT" },
      attachments: [],
      auditLog: [],
      createdAt: "2026-05-20T08:00:00.000Z",
      decisions: [],
      externalParticipants: [],
      followUpActions: [],
      hostId: "leader-01",
      id: "meeting-empty-start",
      meetingDate: "2026-05-21T10:00:00.000Z",
      meetingType: "PROJECT_MEETING",
      participants: [],
      participantScope: "project_team",
      projectId: project.id,
      projectIds: [project.id],
      relatedApprovals: [],
      relatedTasks: [],
      startTime: "",
      status: "SCHEDULED",
      title: "Empty start fallback",
      updatedAt: "2026-05-20T08:00:00.000Z",
      visibility: "project",
    });

    const meetings = await listMeetings(
      {
        dateFrom: "2026-05-21",
        dateTo: "2026-05-21",
        participantId: "leader-01",
      },
      meetingRepository,
    );

    expect(meetings.map((meeting) => meeting.id)).toEqual([
      "meeting-empty-start",
    ]);
  });

  it("creates and updates a meeting linked to an existing project", async () => {
    const project = await createProject(
      { name: "GreenNest Meeting", status: "active" },
      projectRepository,
    );
    const meeting = await createMeeting(
      {
        projectId: project.id,
        title: "Họp điều phối tuần",
        meetingDate: "2026-05-20T09:00",
        summary: "Rà soát pháp lý và hồ sơ.",
      },
      "pm-01",
      meetingRepository,
      projectRepository,
    );

    expect(meeting.projectId).toBe(project.id);
    expect(meeting.createdBy).toBe("pm-01");

    const updatedMeeting = await updateMeeting(
      meeting.id,
      {
        title: "Họp điều phối tuần 21",
        meetingDate: "2026-05-21T09:00",
        summary: "Cập nhật thêm quyết định mới.",
      },
      "pm-01",
      meetingRepository,
    );

    expect(updatedMeeting.title).toBe("Họp điều phối tuần 21");
    await expect(
      createMeeting(
        {
          projectId: "missing-project",
          title: "Không hợp lệ",
          meetingDate: "2026-05-20T09:00",
        },
        "pm-01",
        meetingRepository,
        projectRepository,
      ),
    ).rejects.toThrow();
  });

  it("creates decisions under a meeting", async () => {
    const project = await createProject(
      { name: "GreenNest Decisions", status: "active" },
      projectRepository,
    );
    const meeting = await createMeeting(
      {
        projectId: project.id,
        title: "Họp xử lý hồ sơ",
        meetingDate: "2026-05-20T10:00",
      },
      "assistant-01",
      meetingRepository,
      projectRepository,
    );

    const decision = await createDecision(
      {
        meetingId: meeting.id,
        decisionText: "Bổ sung hồ sơ PCCC trước thứ Sáu",
        ownerId: "legal-01",
        dueDate: "2026-05-22",
        status: "open",
      },
      meetingRepository,
    );

    const decisions = await listDecisions(
      { meetingId: meeting.id },
      meetingRepository,
    );

    expect(decision.projectId).toBe(project.id);
    expect(decisions).toHaveLength(1);
    expect(decisions[0].ownerId).toBe("legal-01");
  });

  it("links decision tracking records with audit and rejects duplicates", async () => {
    const project = await createProject(
      { name: "GreenNest Linked Decision", status: "active" },
      projectRepository,
    );
    const sourceMeeting = await createMeeting(
      {
        projectId: project.id,
        title: "Decision source meeting",
        meetingDate: "2026-05-20T10:00",
      },
      "assistant-01",
      meetingRepository,
      projectRepository,
    );
    const targetMeeting = await createMeeting(
      {
        projectId: project.id,
        title: "Decision tracking target meeting",
        meetingDate: "2026-05-21T10:00",
      },
      "assistant-01",
      meetingRepository,
      projectRepository,
    );
    const decision = await createDecision(
      {
        meetingId: sourceMeeting.id,
        decisionText: "Track this decision from the next meeting.",
        dueDate: "2026-05-28",
        ownerId: "assistant-01",
        status: "open",
      },
      meetingRepository,
    );

    const updatedMeeting = await linkMeetingDecisionTracking(
      targetMeeting.id,
      { decisionId: decision.id },
      "leader-01",
      meetingRepository,
    );

    expect(updatedMeeting.relatedRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: decision.id,
          relationType: "context",
          type: "decision",
        }),
      ]),
    );
    expect(updatedMeeting.auditLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "meeting.decision_tracking_updated",
          actorId: "leader-01",
        }),
      ]),
    );
    await expect(
      linkMeetingDecisionTracking(
        targetMeeting.id,
        { decisionId: decision.id },
        "leader-01",
        meetingRepository,
      ),
    ).rejects.toThrow("Decision nay da duoc lien ket voi cuoc hop.");
  });

  it("maps Supabase meeting and decision rows to camelCase domain records", async () => {
    supabaseMock.tables.meetings = [
      {
        id: "meeting-supabase",
        organization_id: "org-green-nest",
        project_id: supabaseProjectAId,
        project_ids: [supabaseProjectAId, supabaseProjectBId],
        axis_id: "axis-1",
        department_id: "legal",
        title: "Supabase contract parity",
        meeting_type: "EXECUTIVE_MEETING",
        visibility: "executive",
        participant_scope: "all_leadership",
        status: "SCHEDULED",
        meeting_date: "2026-05-24T09:00:00.000Z",
        start_time: "2026-05-24T09:00:00.000Z",
        end_time: "2026-05-24T10:00:00.000Z",
        host_id: "host-01",
        participants: ["ceo-01"],
        external_participants: ["consultant"],
        room_id: "room-a",
        agenda: "Review executive dashboard contract.",
        attachments: [{ id: "attachment-01", name: "Deck.pdf" }],
        transcript: "Transcript",
        ai_summary: { status: "APPROVED", content: "Summary" },
        meeting_minutes: "Minutes",
        meeting_minutes_approval: {
          approvedAt: "2026-05-24T09:35:00.000Z",
          approvedBy: "leader-01",
          status: "APPROVED",
        },
        decisions: [
          {
            id: "meeting-decision-01",
            decisionText: "Follow up",
            status: "open",
          },
        ],
        follow_up_actions: [
          {
            id: "follow-up-01",
            title: "Send minutes",
            dueDate: "2026-05-25",
            status: "open",
          },
        ],
        related_approvals: ["proposal-a"],
        related_tasks: ["task-a"],
        related_records: [
          {
            id: "proposal-a",
            relationType: "context",
            title: "Approval A",
            type: "approval",
          },
          {
            id: "risk-a",
            relationType: "context",
            title: "Risk A",
            type: "risk",
          },
        ],
        audit_log: [
          {
            id: "audit-01",
            action: "created",
            createdAt: "2026-05-24T08:00:00.000Z",
          },
        ],
        summary: "Supabase row summary",
        created_by: "assistant-01",
        created_at: "2026-05-24T08:00:00.000Z",
        updated_at: "2026-05-24T08:30:00.000Z",
      },
    ];
    supabaseMock.tables.decisions = [
      {
        id: "decision-supabase",
        title: "Approve Supabase parity",
        organization_id: "org-green-nest",
        meeting_id: "meeting-supabase",
        project_id: supabaseProjectAId,
        project_ids: [supabaseProjectAId, supabaseProjectBId],
        axis_id: "axis-1",
        workstream_id: "decision",
        module_id: "meeting",
        decision_text: "Approve Supabase parity",
        source_type: "meeting",
        source_id: "meeting-supabase",
        linked_records: [
          {
            type: "meeting",
            id: "meeting-supabase",
            relationType: "source",
            title: "Supabase contract parity",
          },
        ],
        owner_id: "owner-01",
        priority: "high",
        due_date: "2026-05-26",
        status: "open",
        task_id: "task-a",
        created_by: "assistant-01",
        decided_by: "director-01",
        decided_at: "2026-05-24T09:31:00.000Z",
        created_at: "2026-05-24T09:30:00.000Z",
        updated_at: "2026-05-24T09:45:00.000Z",
      },
      {
        id: "decision-supabase-multi",
        title: "Approve multi-project parity",
        organization_id: "org-green-nest",
        meeting_id: null,
        project_id: null,
        project_ids: [supabaseProjectAId, supabaseProjectBId],
        axis_id: "axis-1",
        workstream_id: "decision",
        module_id: "meeting",
        decision_text: "Approve multi-project parity",
        source_type: "independent",
        source_id: null,
        linked_records: [],
        owner_id: "owner-02",
        priority: "medium",
        due_date: "2026-05-27",
        status: "open",
        task_id: null,
        created_by: "assistant-01",
        decided_by: "director-01",
        decided_at: "2026-05-24T10:31:00.000Z",
        created_at: "2026-05-24T10:30:00.000Z",
        updated_at: "2026-05-24T10:45:00.000Z",
      },
    ];
    supabaseMock.tables.decision_assignments = [
      {
        id: "assignment-supabase",
        decision_id: "decision-supabase",
        task_id: "task-a",
        organization_id: "org-green-nest",
        project_id: supabaseProjectAId,
        assignee_type: "user",
        assignee_id: "owner-01",
        department_id: null,
        title: "Prepare implementation task",
        description: "Task assignment summary.",
        kpi: "Done by deadline.",
        due_date: "2026-05-28",
        priority: "high",
        status: "assigned",
        created_by: "assistant-01",
        created_at: "2026-05-24T11:00:00.000Z",
        updated_at: "2026-05-24T11:00:00.000Z",
      },
    ];
    const repository = new SupabaseMeetingRepository();

    const [meetings, decisions, assignments] = await Promise.all([
      repository.listMeetings({ projectId: supabaseProjectAId }),
      repository.listDecisions({ projectId: supabaseProjectAId }),
      repository.listDecisionAssignments({ decisionId: "decision-supabase" }),
    ]);

    expect(meetings).toHaveLength(1);
    expect(meetings[0]).toMatchObject({
      id: "meeting-supabase",
      organizationId: "org-green-nest",
      projectId: supabaseProjectAId,
      projectIds: [supabaseProjectAId, supabaseProjectBId],
      axisId: "axis-1",
      departmentId: "legal",
      meetingType: "EXECUTIVE_MEETING",
      visibility: "executive",
      participantScope: "all_leadership",
      hostId: "host-01",
      participants: ["ceo-01"],
      externalParticipants: ["consultant"],
      createdBy: "assistant-01",
      aiSummary: { status: "APPROVED", content: "Summary" },
      meetingMinutes: "Minutes",
      meetingMinutesApproval: {
        approvedAt: "2026-05-24T09:35:00.000Z",
        approvedBy: "leader-01",
        status: "APPROVED",
      },
      followUpActions: [
        {
          id: "follow-up-01",
          title: "Send minutes",
          dueDate: "2026-05-25",
          status: "open",
        },
      ],
      relatedApprovals: ["proposal-a"],
      relatedTasks: ["task-a"],
      relatedRecords: [
        {
          id: "proposal-a",
          relationType: "context",
          title: "Approval A",
          type: "approval",
        },
        {
          id: "risk-a",
          relationType: "context",
          title: "Risk A",
          type: "risk",
        },
      ],
    });
    expect(decisions).toEqual([
      expect.objectContaining({
        id: "decision-supabase",
        title: "Approve Supabase parity",
        organizationId: "org-green-nest",
        meetingId: "meeting-supabase",
        projectId: supabaseProjectAId,
        projectIds: [supabaseProjectAId, supabaseProjectBId],
        axisId: "axis-1",
        workstreamId: "decision",
        moduleId: "meeting",
        decisionText: "Approve Supabase parity",
        sourceType: "meeting",
        sourceId: "meeting-supabase",
        linkedRecords: [
          {
            type: "meeting",
            id: "meeting-supabase",
            relationType: "source",
            title: "Supabase contract parity",
          },
        ],
        ownerId: "owner-01",
        priority: "high",
        dueDate: "2026-05-26",
        status: "open",
        taskId: "task-a",
        createdBy: "assistant-01",
        decidedBy: "director-01",
        decidedAt: "2026-05-24T09:31:00.000Z",
      }),
      expect.objectContaining({
        id: "decision-supabase-multi",
        projectId: undefined,
        projectIds: [supabaseProjectAId, supabaseProjectBId],
        sourceType: "independent",
      }),
    ]);
    expect(assignments).toEqual([
      expect.objectContaining({
        id: "assignment-supabase",
        decisionId: "decision-supabase",
        taskId: "task-a",
        organizationId: "org-green-nest",
        projectId: supabaseProjectAId,
        assigneeType: "user",
        assigneeId: "owner-01",
        departmentId: undefined,
        title: "Prepare implementation task",
        kpi: "Done by deadline.",
        dueDate: "2026-05-28",
        priority: "high",
        status: "assigned",
        createdBy: "assistant-01",
      }),
    ]);
    expect(JSON.stringify({ assignments, decisions, meetings })).not.toMatch(
      /project_id|meeting_id|decision_id|task_id|decision_text|owner_id|created_at|updated_at/,
    );
  });

  it("defaults legacy minutes approval metadata in JSON and Supabase records", async () => {
    await meetingRepository.createMeeting({
      id: "legacy-json",
      title: "Legacy JSON",
      meetingType: "PROJECT_MEETING",
      visibility: "project",
      participantScope: "project_team",
      status: "COMPLETED",
      meetingDate: "2026-06-05T09:00:00.000Z",
      startTime: "2026-06-05T09:00:00.000Z",
      participants: [],
      externalParticipants: [],
      attachments: [],
      aiSummary: { status: "DRAFT" },
      decisions: [],
      followUpActions: [],
      relatedApprovals: [],
      relatedTasks: [],
      auditLog: [],
      createdAt: "2026-06-05T08:00:00.000Z",
      updatedAt: "2026-06-05T08:00:00.000Z",
    });
    supabaseMock.tables.meetings = [
      {
        id: "legacy-supabase-null",
        title: "Legacy Supabase null",
        meeting_type: "PROJECT_MEETING",
        visibility: "project",
        participant_scope: "project_team",
        status: "COMPLETED",
        meeting_date: "2026-06-05T09:00:00.000Z",
        start_time: "2026-06-05T09:00:00.000Z",
        meeting_minutes_approval: null,
        created_at: "2026-06-05T08:00:00.000Z",
        updated_at: "2026-06-05T08:00:00.000Z",
      },
      {
        id: "legacy-supabase-missing",
        title: "Legacy Supabase missing",
        meeting_type: "PROJECT_MEETING",
        visibility: "project",
        participant_scope: "project_team",
        status: "COMPLETED",
        meeting_date: "2026-06-05T10:00:00.000Z",
        start_time: "2026-06-05T10:00:00.000Z",
        created_at: "2026-06-05T08:00:00.000Z",
        updated_at: "2026-06-05T08:00:00.000Z",
      },
    ];

    const legacyJson = await meetingRepository.getMeeting("legacy-json");
    const legacySupabase = await new SupabaseMeetingRepository().listMeetings();

    expect(legacyJson?.meetingMinutesApproval).toEqual({ status: "DRAFT" });
    expect(
      legacySupabase.find((meeting) => meeting.id === "legacy-supabase-null")
        ?.meetingMinutesApproval,
    ).toEqual({ status: "DRAFT" });
    expect(
      legacySupabase.find((meeting) => meeting.id === "legacy-supabase-missing")
        ?.meetingMinutesApproval,
    ).toEqual({ status: "DRAFT" });
  });

  it("writes explicit minutes and summary clears as null in Supabase patches", async () => {
    supabaseMock.tables.meetings = [
      {
        id: "meeting-clear",
        title: "Clear Supabase minutes",
        meeting_type: "PROJECT_MEETING",
        visibility: "project",
        participant_scope: "project_team",
        status: "COMPLETED",
        meeting_date: "2026-06-05T09:00:00.000Z",
        start_time: "2026-06-05T09:00:00.000Z",
        meeting_minutes: "Old minutes",
        meeting_minutes_approval: {
          approvedBy: "leader-01",
          approvedAt: "2026-06-05T09:30:00.000Z",
          status: "APPROVED",
        },
        summary: "Old summary",
        audit_log: [],
        created_at: "2026-06-05T08:00:00.000Z",
        updated_at: "2026-06-05T08:00:00.000Z",
      },
    ];
    const repository = new SupabaseMeetingRepository();

    const updated = await updateMeetingMinutes(
      "meeting-clear",
      { meetingMinutes: "", summary: "" },
      "assistant-01",
      repository,
    );

    expect(updated.meetingMinutes).toBeUndefined();
    expect(updated.summary).toBeUndefined();
    expect(updated.meetingMinutesApproval).toEqual({ status: "DRAFT" });
    expect(supabaseMock.tables.meetings[0].meeting_minutes).toBeNull();
    expect(supabaseMock.tables.meetings[0].summary).toBeNull();
  });

  it("filters Supabase meetings by participant and date range", async () => {
    supabaseMock.tables.meetings = [
      {
        id: "meeting-host",
        organization_id: "org-green-nest",
        project_id: supabaseProjectAId,
        project_ids: [supabaseProjectAId],
        title: "Hosted in range",
        meeting_type: "PROJECT_MEETING",
        visibility: "project",
        participant_scope: "project_team",
        status: "SCHEDULED",
        meeting_date: "2026-05-21T09:00:00.000Z",
        start_time: "2026-05-21T09:00:00.000Z",
        host_id: supabaseLeaderId,
        participants: [supabaseAssistantId],
        summary: null,
        created_by: "assistant-01",
        created_at: "2026-05-20T08:00:00.000Z",
        updated_at: "2026-05-20T08:00:00.000Z",
      },
      {
        id: "meeting-participant",
        organization_id: "org-green-nest",
        project_id: supabaseProjectAId,
        project_ids: [supabaseProjectAId],
        title: "Participating in range",
        meeting_type: "PROJECT_MEETING",
        visibility: "project",
        participant_scope: "project_team",
        status: "SCHEDULED",
        meeting_date: "2026-05-21T15:00:00.000Z",
        start_time: "2026-05-21T15:00:00.000Z",
        host_id: supabaseHostId,
        participants: [supabaseLeaderId],
        summary: null,
        created_by: "assistant-01",
        created_at: "2026-05-20T08:00:00.000Z",
        updated_at: "2026-05-20T08:00:00.000Z",
      },
      {
        id: "meeting-outside",
        organization_id: "org-green-nest",
        project_id: supabaseProjectAId,
        project_ids: [supabaseProjectAId],
        title: "Participating outside range",
        meeting_type: "PROJECT_MEETING",
        visibility: "project",
        participant_scope: "project_team",
        status: "SCHEDULED",
        meeting_date: "2026-05-23T09:00:00.000Z",
        start_time: "2026-05-23T09:00:00.000Z",
        host_id: supabaseHostId,
        participants: [supabaseLeaderId],
        summary: null,
        created_by: "assistant-01",
        created_at: "2026-05-20T08:00:00.000Z",
        updated_at: "2026-05-20T08:00:00.000Z",
      },
    ];
    const repository = new SupabaseMeetingRepository();

    const meetings = await repository.listMeetings({
      dateFrom: "2026-05-21",
      dateTo: "2026-05-21",
      participantId: supabaseLeaderId,
    });

    expect(meetings.map((meeting) => meeting.id)).toEqual([
      "meeting-participant",
      "meeting-host",
    ]);
  });

  it("does not interpolate malformed Supabase project or participant filters", async () => {
    supabaseMock.tables.meetings = [
      {
        id: "meeting-safe",
        organization_id: "org-green-nest",
        project_id: supabaseProjectAId,
        project_ids: [supabaseProjectAId],
        title: "Safe filter target",
        meeting_type: "PROJECT_MEETING",
        visibility: "project",
        participant_scope: "project_team",
        status: "SCHEDULED",
        meeting_date: "2026-05-21T09:00:00.000Z",
        start_time: "2026-05-21T09:00:00.000Z",
        host_id: supabaseLeaderId,
        participants: [supabaseAssistantId],
        summary: null,
        created_by: "assistant-01",
        created_at: "2026-05-20T08:00:00.000Z",
        updated_at: "2026-05-20T08:00:00.000Z",
      },
    ];
    const repository = new SupabaseMeetingRepository();

    await expect(
      repository.listMeetings({
        participantId: "not-a-uuid,host_id.not.is.null",
      }),
    ).resolves.toEqual([]);
    await expect(
      repository.listMeetings({
        projectId: "not-a-uuid,project_id.not.is.null",
      }),
    ).resolves.toEqual([]);
    expect(supabaseMock.orExpressions).toEqual([]);
  });

  it("filters Supabase meetings by organization, axis, department, status, and visibility", async () => {
    supabaseMock.tables.meetings = [
      {
        id: "meeting-full-contract",
        organization_id: "org-green-nest",
        project_id: supabaseProjectAId,
        project_ids: [supabaseProjectAId],
        axis_id: "axis-1",
        department_id: "legal",
        title: "Matching full contract",
        meeting_type: "PROJECT_MEETING",
        visibility: "executive",
        participant_scope: "project_team",
        status: "FOLLOW_UP_PENDING",
        meeting_date: "2026-05-21T09:00:00.000Z",
        start_time: "2026-05-21T09:00:00.000Z",
        host_id: supabaseLeaderId,
        participants: [],
        summary: null,
        created_by: "assistant-01",
        created_at: "2026-05-20T08:00:00.000Z",
        updated_at: "2026-05-20T08:00:00.000Z",
      },
      {
        id: "meeting-wrong-visibility",
        organization_id: "org-green-nest",
        project_id: supabaseProjectAId,
        project_ids: [supabaseProjectAId],
        axis_id: "axis-1",
        department_id: "legal",
        title: "Wrong visibility",
        meeting_type: "PROJECT_MEETING",
        visibility: "project",
        participant_scope: "project_team",
        status: "FOLLOW_UP_PENDING",
        meeting_date: "2026-05-21T10:00:00.000Z",
        start_time: "2026-05-21T10:00:00.000Z",
        host_id: supabaseLeaderId,
        participants: [],
        summary: null,
        created_by: "assistant-01",
        created_at: "2026-05-20T08:00:00.000Z",
        updated_at: "2026-05-20T08:00:00.000Z",
      },
    ];
    const repository = new SupabaseMeetingRepository();

    const meetings = await repository.listMeetings({
      axisId: "axis-1",
      departmentId: "legal",
      organizationId: "org-green-nest",
      status: "FOLLOW_UP_PENDING",
      visibility: "executive",
    });

    expect(meetings.map((meeting) => meeting.id)).toEqual([
      "meeting-full-contract",
    ]);
  });

  it("uses Vietnam business day boundaries for Supabase date-only filters", async () => {
    supabaseMock.tables.meetings = [
      {
        id: "meeting-local-may-21-early",
        organization_id: "org-green-nest",
        project_id: supabaseProjectAId,
        project_ids: [supabaseProjectAId],
        title: "Early local May 21",
        meeting_type: "PROJECT_MEETING",
        visibility: "project",
        participant_scope: "project_team",
        status: "SCHEDULED",
        meeting_date: "2026-05-20T18:30:00.000Z",
        start_time: "2026-05-20T18:30:00.000Z",
        host_id: supabaseLeaderId,
        participants: [],
        summary: null,
        created_by: "assistant-01",
        created_at: "2026-05-20T08:00:00.000Z",
        updated_at: "2026-05-20T08:00:00.000Z",
      },
      {
        id: "meeting-local-may-22",
        organization_id: "org-green-nest",
        project_id: supabaseProjectAId,
        project_ids: [supabaseProjectAId],
        title: "Local May 22",
        meeting_type: "PROJECT_MEETING",
        visibility: "project",
        participant_scope: "project_team",
        status: "SCHEDULED",
        meeting_date: "2026-05-21T18:30:00.000Z",
        start_time: "2026-05-21T18:30:00.000Z",
        host_id: supabaseLeaderId,
        participants: [],
        summary: null,
        created_by: "assistant-01",
        created_at: "2026-05-20T08:00:00.000Z",
        updated_at: "2026-05-20T08:00:00.000Z",
      },
    ];
    const repository = new SupabaseMeetingRepository();

    const meetings = await repository.listMeetings({
      dateFrom: "2026-05-21",
      dateTo: "2026-05-21",
    });

    expect(meetings.map((meeting) => meeting.id)).toEqual([
      "meeting-local-may-21-early",
    ]);
  });

  it("validates follow-up action and follow-up task inputs", () => {
    expect(
      meetingFollowUpActionInputSchema.parse({
        title: "  Kiá»ƒm tra há»“ sÆ¡ sau há»p  ",
        ownerId: " owner-01 ",
        dueDate: "2026-06-10",
        status: "open",
      }),
    ).toEqual({
      title: "Kiá»ƒm tra há»“ sÆ¡ sau há»p",
      ownerId: "owner-01",
      dueDate: "2026-06-10",
      status: "open",
    });

    expect(() =>
      meetingFollowUpActionInputSchema.parse({
        title: "Invalid datetime",
        dueDate: "2026-06-10T00:00:00.000Z",
        status: "open",
      }),
    ).toThrow("dueDate");

    expect(
      meetingFollowUpTaskInputSchema.parse({
        taskProjectId: " project-a ",
      }),
    ).toEqual({ taskProjectId: "project-a" });
  });

  it("creates and updates follow-up actions only for completed or follow-up meetings", async () => {
    const meeting = await createMeeting(
      {
        organizationId: "org-green-nest",
        title: "Follow-up meeting",
        meetingDate: "2026-06-05T09:00:00.000Z",
        status: "COMPLETED",
      },
      "assistant-01",
      meetingRepository,
      projectRepository,
    );

    const withAction = await addMeetingFollowUpAction(
      meeting.id,
      {
        title: "Kiá»ƒm tra action item sau há»p",
        ownerId: "owner-01",
        dueDate: "2026-06-10",
        status: "open",
      },
      "assistant-01",
      meetingRepository,
    );

    expect(withAction.followUpActions).toHaveLength(1);
    expect(withAction.followUpActions[0]).toMatchObject({
      title: "Kiá»ƒm tra action item sau há»p",
      ownerId: "owner-01",
      dueDate: "2026-06-10",
      status: "open",
    });
    expect(withAction.auditLog.at(-1)).toEqual(
      expect.objectContaining({
        action: "meeting.follow_up_added",
        actorId: "assistant-01",
        note: "follow-up actions 0->1",
      }),
    );

    const updated = await updateMeetingFollowUpActionStatus(
      meeting.id,
      withAction.followUpActions[0].id,
      { status: "done" },
      "assistant-02",
      meetingRepository,
    );

    expect(updated.followUpActions[0].status).toBe("done");
    expect(updated.auditLog.at(-1)).toEqual(
      expect.objectContaining({
        action: "meeting.follow_up_status_updated",
        actorId: "assistant-02",
        note: "follow-up open->done",
      }),
    );

    const scheduled = await createMeeting(
      {
        organizationId: "org-green-nest",
        title: "Scheduled meeting",
        meetingDate: "2026-06-05T09:00:00.000Z",
        status: "SCHEDULED",
      },
      "assistant-01",
      meetingRepository,
      projectRepository,
    );

    await expect(
      addMeetingFollowUpAction(
        scheduled.id,
        { title: "Too early", status: "open" },
        "assistant-01",
        meetingRepository,
      ),
    ).rejects.toThrow("follow-up");

    await expect(
      addMeetingFollowUpAction(
        meeting.id,
        { title: "Missing actor", status: "open" },
        "",
        meetingRepository,
      ),
    ).rejects.toThrow("Nguoi cap nhat");
  });

  it("creates a meeting-linked task from a follow-up action and merges related task records", async () => {
    const project = await createProject(
      { name: "GreenNest Follow-up", status: "active" },
      projectRepository,
    );
    const meeting = await createMeeting(
      {
        projectId: project.id,
        title: "Follow-up task meeting",
        meetingDate: "2026-06-05T09:00:00.000Z",
        relatedRecords: [
          {
            type: "document",
            id: "document-01",
            relationType: "context",
            title: "Existing context",
          },
        ],
        status: "FOLLOW_UP_PENDING",
      },
      "assistant-01",
      meetingRepository,
      projectRepository,
    );
    const withAction = await addMeetingFollowUpAction(
      meeting.id,
      {
        title: "Ná»™p biÃªn báº£n cho chá»§ Ä‘áº§u tÆ°",
        ownerId: "owner-01",
        dueDate: "2026-06-10",
        status: "open",
      },
      "assistant-01",
      meetingRepository,
    );

    const withTask = await createMeetingFollowUpTask(
      meeting.id,
      withAction.followUpActions[0].id,
      {},
      "assistant-01",
      meetingRepository,
      taskRepository,
      projectRepository,
    );
    const taskId = withTask.followUpActions[0].relatedTaskId;
    const tasks = await taskRepository.listTasks();

    expect(taskId).toBeDefined();
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      id: taskId,
      projectId: project.id,
      title: "Ná»™p biÃªn báº£n cho chá»§ Ä‘áº§u tÆ°",
      assigneeId: "owner-01",
      dueDate: "2026-06-10",
      status: "todo",
      priority: "medium",
      category: "meeting",
      linkedEntityType: "meeting",
      linkedEntityId: meeting.id,
      createdBy: "assistant-01",
    });
    expect(tasks[0].description).toContain(meeting.title);
    expect(tasks[0].description).toContain(withAction.followUpActions[0].id);
    expect(withTask.relatedTasks).toContain(taskId);
    expect(withTask.relatedRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "document", id: "document-01" }),
        expect.objectContaining({
          type: "task",
          id: taskId,
          relationType: "generated_action",
          title: "Ná»™p biÃªn báº£n cho chá»§ Ä‘áº§u tÆ°",
        }),
      ]),
    );
    expect(withTask.auditLog.at(-1)).toEqual(
      expect.objectContaining({
        action: "meeting.follow_up_task_created",
        actorId: "assistant-01",
      }),
    );

    await expect(
      createMeetingFollowUpTask(
        meeting.id,
        withAction.followUpActions[0].id,
        {},
        "assistant-01",
        meetingRepository,
        taskRepository,
        projectRepository,
      ),
    ).rejects.toThrow("đã có task");
    expect(await taskRepository.listTasks()).toHaveLength(1);
  });

  it("rolls back a generated follow-up task when meeting link update fails", async () => {
    const project = await createProject(
      { name: "GreenNest Rollback", status: "active" },
      projectRepository,
    );
    const meeting = await createMeeting(
      {
        projectId: project.id,
        title: "Follow-up rollback meeting",
        meetingDate: "2026-06-05T09:00:00.000Z",
        status: "COMPLETED",
      },
      "assistant-01",
      meetingRepository,
      projectRepository,
    );
    const withAction = await addMeetingFollowUpAction(
      meeting.id,
      { title: "Tạo task rồi rollback", status: "open" },
      "assistant-01",
      meetingRepository,
    );
    const failingRepository = new FailingUpdateMeetingRepository(
      path.join(tempDir, "meetings-decisions.json"),
    );

    await expect(
      createMeetingFollowUpTask(
        meeting.id,
        withAction.followUpActions[0].id,
        {},
        "assistant-01",
        failingRepository,
        taskRepository,
        projectRepository,
      ),
    ).rejects.toThrow("meeting write failed");

    expect(await taskRepository.listTasks()).toHaveLength(0);
  });

  it("requires explicit target project for multi-project or organization follow-up tasks", async () => {
    const projectA = await createProject(
      { name: "GreenNest A", status: "active" },
      projectRepository,
    );
    const projectB = await createProject(
      { name: "GreenNest B", status: "active" },
      projectRepository,
    );
    const meeting = await createMeeting(
      {
        organizationId: "org-green-nest",
        projectIds: [projectA.id, projectB.id],
        title: "Multi-project follow-up",
        meetingDate: "2026-06-05T09:00:00.000Z",
        status: "COMPLETED",
      },
      "assistant-01",
      meetingRepository,
      projectRepository,
    );
    const withAction = await addMeetingFollowUpAction(
      meeting.id,
      { title: "Chá»n dá»± Ã¡n Ä‘Ã­ch", status: "open" },
      "assistant-01",
      meetingRepository,
    );

    await expect(
      createMeetingFollowUpTask(
        meeting.id,
        withAction.followUpActions[0].id,
        {},
        "assistant-01",
        meetingRepository,
        taskRepository,
        projectRepository,
      ),
    ).rejects.toThrow("dự án");
    expect(await taskRepository.listTasks()).toHaveLength(0);

    const withTask = await createMeetingFollowUpTask(
      meeting.id,
      withAction.followUpActions[0].id,
      { taskProjectId: projectB.id },
      "assistant-01",
      meetingRepository,
      taskRepository,
      projectRepository,
    );
    const [task] = await taskRepository.listTasks();

    expect(task.projectId).toBe(projectB.id);
    expect(withTask.relatedTasks).toContain(task.id);
  });

  it("converts a decision/action item to a task", async () => {
    const project = await createProject(
      { name: "GreenNest Action", status: "active" },
      projectRepository,
    );
    const meeting = await createMeeting(
      {
        projectId: project.id,
        title: "Họp giao việc",
        meetingDate: "2026-05-20T11:00",
      },
      "pm-01",
      meetingRepository,
      projectRepository,
    );
    const decision = await createDecision(
      {
        meetingId: meeting.id,
        decisionText: "Kiểm tra bản vẽ tổng mặt bằng",
        ownerId: "design-01",
        dueDate: "2026-05-25",
        status: "open",
      },
      meetingRepository,
    );

    const task = await convertDecisionToTask(
      decision.id,
      meetingRepository,
      taskRepository,
      projectRepository,
    );
    const updatedDecisions = await listDecisions(
      { meetingId: meeting.id },
      meetingRepository,
    );

    expect(task.projectId).toBe(project.id);
    expect(task.title).toBe("Kiểm tra bản vẽ tổng mặt bằng");
    expect(task.assigneeId).toBe("design-01");
    expect(updatedDecisions[0].taskId).toBe(task.id);
    await expect(
      convertDecisionToTask(
        decision.id,
        meetingRepository,
        taskRepository,
        projectRepository,
      ),
    ).rejects.toThrow();
  });

  it("keeps legacy one-task conversion limited to decisions with a single projectId", async () => {
    await meetingRepository.createDecision({
      id: "decision-multi-only",
      organizationId: "org-green-nest",
      projectIds: ["project-a", "project-b"],
      decisionText:
        "Multi-project decision cannot be converted by legacy one-task flow",
      status: "open",
      createdAt: "2026-05-20T09:00:00.000Z",
      updatedAt: "2026-05-20T09:00:00.000Z",
    });

    await expect(
      convertDecisionToTask(
        "decision-multi-only",
        meetingRepository,
        taskRepository,
        projectRepository,
      ),
    ).rejects.toThrow(
      "Chỉ decision gắn một dự án mới có thể chuyển thành task.",
    );

    await meetingRepository.createDecision({
      id: "decision-primary-and-multi",
      organizationId: "org-green-nest",
      projectId: "project-a",
      projectIds: ["project-a", "project-b"],
      decisionText:
        "Primary project plus multi-project scope cannot be converted",
      status: "open",
      createdAt: "2026-05-20T09:00:00.000Z",
      updatedAt: "2026-05-20T09:00:00.000Z",
    });

    await expect(
      convertDecisionToTask(
        "decision-primary-and-multi",
        meetingRepository,
        taskRepository,
        projectRepository,
      ),
    ).rejects.toThrow(
      "Chỉ decision gắn đúng một dự án mới có thể chuyển thành task.",
    );
  });
});
