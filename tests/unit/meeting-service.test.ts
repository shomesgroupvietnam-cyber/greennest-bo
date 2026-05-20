import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { JsonMeetingRepository } from "@/modules/meetings/services/meeting-repository";
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
