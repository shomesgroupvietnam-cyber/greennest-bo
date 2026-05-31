import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMock = vi.hoisted(() => {
  type TableName = "meetings" | "decisions";
  type Row = Record<string, unknown>;
  const tables: Record<TableName, Row[]> = {
    decisions: [],
    meetings: [],
  };

  function createQuery(table: TableName) {
    let rows = [...tables[table]];
    const query = {
      eq(column: string, value: unknown) {
        rows = rows.filter((row) => row[column] === value);

        return query;
      },
      or(expression: string) {
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
      order(column: string, options: { ascending?: boolean; nullsFirst?: boolean } = {}) {
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

          return String(leftValue).localeCompare(String(rightValue)) * direction;
        });

        return Promise.resolve({ data: sorted, error: null });
      },
      select() {
        return query;
      },
    };

    return query;
  }

  return {
    createSupabaseServerClient: vi.fn(async () => ({
      from: (table: TableName) => createQuery(table),
    })),
    tables,
  };
});

vi.mock("@/lib/auth/supabase-server", () => ({
  createSupabaseServerClient: supabaseMock.createSupabaseServerClient,
  isSupabaseAuthConfigured: () => false,
}));

import { JsonMeetingRepository, SupabaseMeetingRepository } from "@/modules/meetings/services/meeting-repository";
import { convertDecisionToTask, createDecision, createMeeting, listDecisions, updateMeeting } from "@/modules/meetings/services/meeting-service";
import { JsonProjectRepository } from "@/modules/projects/services/project-repository";
import { createProject } from "@/modules/projects/services/project-service";
import { JsonTaskRepository } from "@/modules/tasks/services/task-repository";

let tempDir: string;
let projectRepository: JsonProjectRepository;
let meetingRepository: JsonMeetingRepository;
let taskRepository: JsonTaskRepository;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-meetings-"));
  projectRepository = new JsonProjectRepository(path.join(tempDir, "project-core.json"));
  meetingRepository = new JsonMeetingRepository(path.join(tempDir, "meetings-decisions.json"));
  taskRepository = new JsonTaskRepository(path.join(tempDir, "task-management.json"));
  supabaseMock.tables.meetings = [];
  supabaseMock.tables.decisions = [];
  supabaseMock.createSupabaseServerClient.mockClear();
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("meeting service", () => {
  it("creates and updates a meeting linked to an existing project", async () => {
    const project = await createProject({ name: "GreenNest Meeting", status: "active" }, projectRepository);
    const meeting = await createMeeting(
      {
        projectId: project.id,
        title: "Họp điều phối tuần",
        meetingDate: "2026-05-20T09:00",
        summary: "Rà soát pháp lý và hồ sơ."
      },
      "pm-01",
      meetingRepository,
      projectRepository
    );

    expect(meeting.projectId).toBe(project.id);
    expect(meeting.createdBy).toBe("pm-01");

    const updatedMeeting = await updateMeeting(
      meeting.id,
      {
        title: "Họp điều phối tuần 21",
        meetingDate: "2026-05-21T09:00",
        summary: "Cập nhật thêm quyết định mới."
      },
      meetingRepository
    );

    expect(updatedMeeting.title).toBe("Họp điều phối tuần 21");
    await expect(
      createMeeting(
        {
          projectId: "missing-project",
          title: "Không hợp lệ",
          meetingDate: "2026-05-20T09:00"
        },
        "pm-01",
        meetingRepository,
        projectRepository
      )
    ).rejects.toThrow();
  });

  it("creates decisions under a meeting", async () => {
    const project = await createProject({ name: "GreenNest Decisions", status: "active" }, projectRepository);
    const meeting = await createMeeting(
      {
        projectId: project.id,
        title: "Họp xử lý hồ sơ",
        meetingDate: "2026-05-20T10:00"
      },
      "assistant-01",
      meetingRepository,
      projectRepository
    );

    const decision = await createDecision(
      {
        meetingId: meeting.id,
        decisionText: "Bổ sung hồ sơ PCCC trước thứ Sáu",
        ownerId: "legal-01",
        dueDate: "2026-05-22",
        status: "open"
      },
      meetingRepository
    );

    const decisions = await listDecisions({ meetingId: meeting.id }, meetingRepository);

    expect(decision.projectId).toBe(project.id);
    expect(decisions).toHaveLength(1);
    expect(decisions[0].ownerId).toBe("legal-01");
  });

  it("maps Supabase meeting and decision rows to camelCase domain records", async () => {
    supabaseMock.tables.meetings = [
      {
        id: "meeting-supabase",
        organization_id: "org-green-nest",
        project_id: "project-a",
        project_ids: ["project-a", "project-b"],
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
        project_id: "project-a",
        project_ids: ["project-a", "project-b"],
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
        project_ids: ["project-a", "project-b"],
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
    const repository = new SupabaseMeetingRepository();

    const [meetings, decisions] = await Promise.all([
      repository.listMeetings({ projectId: "project-a" }),
      repository.listDecisions({ projectId: "project-a" }),
    ]);

    expect(meetings).toHaveLength(1);
    expect(meetings[0]).toMatchObject({
      id: "meeting-supabase",
      organizationId: "org-green-nest",
      projectId: "project-a",
      projectIds: ["project-a", "project-b"],
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
    });
    expect(decisions).toEqual([
      expect.objectContaining({
        id: "decision-supabase",
        title: "Approve Supabase parity",
        organizationId: "org-green-nest",
        meetingId: "meeting-supabase",
        projectId: "project-a",
        projectIds: ["project-a", "project-b"],
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
        projectIds: ["project-a", "project-b"],
        sourceType: "independent",
      }),
    ]);
    expect(JSON.stringify({ decisions, meetings })).not.toMatch(
      /project_id|meeting_id|decision_text|owner_id|created_at|updated_at/,
    );
  });

  it("converts a decision/action item to a task", async () => {
    const project = await createProject({ name: "GreenNest Action", status: "active" }, projectRepository);
    const meeting = await createMeeting(
      {
        projectId: project.id,
        title: "Họp giao việc",
        meetingDate: "2026-05-20T11:00"
      },
      "pm-01",
      meetingRepository,
      projectRepository
    );
    const decision = await createDecision(
      {
        meetingId: meeting.id,
        decisionText: "Kiểm tra bản vẽ tổng mặt bằng",
        ownerId: "design-01",
        dueDate: "2026-05-25",
        status: "open"
      },
      meetingRepository
    );

    const task = await convertDecisionToTask(decision.id, meetingRepository, taskRepository, projectRepository);
    const updatedDecisions = await listDecisions({ meetingId: meeting.id }, meetingRepository);

    expect(task.projectId).toBe(project.id);
    expect(task.title).toBe("Kiểm tra bản vẽ tổng mặt bằng");
    expect(task.assigneeId).toBe("design-01");
    expect(updatedDecisions[0].taskId).toBe(task.id);
    await expect(convertDecisionToTask(decision.id, meetingRepository, taskRepository, projectRepository)).rejects.toThrow();
  });
});
