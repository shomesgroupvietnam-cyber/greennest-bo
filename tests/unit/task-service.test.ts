import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { JsonProjectRepository } from "@/modules/projects/services/project-repository";
import { createProject } from "@/modules/projects/services/project-service";
import { JsonTaskRepository } from "@/modules/tasks/services/task-repository";
import { createTask, getOverdueTasks, getUpcomingTasks, updateTask } from "@/modules/tasks/services/task-service";

let tempDir: string;
let projectRepository: JsonProjectRepository;
let taskRepository: JsonTaskRepository;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-tasks-"));
  projectRepository = new JsonProjectRepository(path.join(tempDir, "project-core.json"));
  taskRepository = new JsonTaskRepository(path.join(tempDir, "task-management.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("task service", () => {
  it("creates a task linked to an existing project", async () => {
    const project = await createProject({ name: "GreenNest Central", status: "planning" }, projectRepository);

    const task = await createTask(
      {
        projectId: project.id,
        title: "Chuẩn bị hồ sơ pháp lý",
        assigneeId: "mock-founder",
        dueDate: "2026-05-20",
        status: "todo",
        priority: "high",
        category: "Pháp lý"
      },
      taskRepository,
      projectRepository,
      {
        linkedEntityType: "decision",
        linkedEntityId: "decision-01",
        createdBy: "leader-01"
      }
    );

    expect(task.projectId).toBe(project.id);
    expect(task.title).toBe("Chuẩn bị hồ sơ pháp lý");
    expect(task).toMatchObject({
      linkedEntityType: "decision",
      linkedEntityId: "decision-01",
      createdBy: "leader-01"
    });
    await expect(
      createTask(
        {
          projectId: "missing-project",
          title: "Không hợp lệ",
          status: "todo",
          priority: "medium"
        },
        taskRepository,
        projectRepository
      )
    ).rejects.toThrow("Dự án không tồn tại");
  });

  it("requires date-only due dates and complete linked entity metadata", async () => {
    const project = await createProject({ name: "GreenNest Linkage", status: "active" }, projectRepository);

    await expect(
      createTask(
        {
          projectId: project.id,
          title: "Invalid datetime",
          dueDate: "2026-05-20T00:00:00.000Z",
          status: "todo",
          priority: "medium"
        },
        taskRepository,
        projectRepository
      )
    ).rejects.toThrow("Deadline");

    await expect(
      createTask(
        {
          projectId: project.id,
          title: "Half linked",
          status: "todo",
          priority: "medium"
        },
        taskRepository,
        projectRepository,
        { linkedEntityType: "decision" }
      )
    ).rejects.toThrow("linkedEntityId");
  });

  it("creates a task linked directly to a meeting follow-up workflow", async () => {
    const project = await createProject(
      { name: "GreenNest Meeting Link", status: "active" },
      projectRepository
    );

    const task = await createTask(
      {
        projectId: project.id,
        title: "Follow up meeting action",
        status: "todo",
        priority: "medium",
        category: "meeting"
      },
      taskRepository,
      projectRepository,
      {
        linkedEntityType: "meeting",
        linkedEntityId: "meeting-01",
        createdBy: "assistant-01"
      }
    );

    expect(task).toMatchObject({
      linkedEntityType: "meeting",
      linkedEntityId: "meeting-01",
      createdBy: "assistant-01"
    });
  });

  it("filters overdue and upcoming tasks from due date and status", async () => {
    const project = await createProject({ name: "GreenNest River", status: "active" }, projectRepository);

    await createTask(
      {
        projectId: project.id,
        title: "Quá hạn",
        dueDate: "2026-05-10",
        status: "in_progress",
        priority: "urgent"
      },
      taskRepository,
      projectRepository
    );
    await createTask(
      {
        projectId: project.id,
        title: "Sắp đến hạn",
        dueDate: "2026-05-18",
        status: "todo",
        priority: "medium"
      },
      taskRepository,
      projectRepository
    );
    await createTask(
      {
        projectId: project.id,
        title: "Đã xong không tính quá hạn",
        dueDate: "2026-05-09",
        status: "done",
        priority: "low"
      },
      taskRepository,
      projectRepository
    );

    const today = new Date(2026, 4, 16);
    const overdueTasks = await getOverdueTasks({ today }, taskRepository);
    const upcomingTasks = await getUpcomingTasks({ today, upcomingWindowDays: 7 }, taskRepository);

    expect(overdueTasks.map((task) => task.title)).toEqual(["Quá hạn"]);
    expect(upcomingTasks.map((task) => task.title)).toEqual(["Sắp đến hạn"]);
  });

  it("updates status, priority, assignee and due date", async () => {
    const project = await createProject({ name: "GreenNest Garden", status: "active" }, projectRepository);
    const task = await createTask(
      {
        projectId: project.id,
        title: "Kiểm tra bản vẽ",
        status: "todo",
        priority: "medium"
      },
      taskRepository,
      projectRepository
    );

    const updatedTask = await updateTask(
      task.id,
      {
        projectId: project.id,
        title: "Kiểm tra bản vẽ",
        assigneeId: "legal-manager",
        dueDate: "2026-05-22",
        status: "in_progress",
        priority: "high",
        category: "Thiết kế"
      },
      taskRepository,
      projectRepository
    );

    expect(updatedTask.status).toBe("in_progress");
    expect(updatedTask.priority).toBe("high");
    expect(updatedTask.assigneeId).toBe("legal-manager");
    expect(updatedTask.dueDate).toBe("2026-05-22");
  });

  it("preserves decision linkage and creator metadata when updating normal task fields", async () => {
    const project = await createProject({ name: "GreenNest Decisions", status: "active" }, projectRepository);
    const task = await createTask(
      {
        projectId: project.id,
        title: "Follow decision",
        status: "todo",
        priority: "medium",
        category: "decision"
      },
      taskRepository,
      projectRepository,
      {
        linkedEntityType: "decision",
        linkedEntityId: "decision-01",
        createdBy: "leader-01"
      }
    );

    const updatedTask = await updateTask(
      task.id,
      {
        projectId: project.id,
        title: "Follow decision",
        assigneeId: "legal-manager",
        dueDate: "2026-05-22",
        status: "in_progress",
        priority: "high",
        category: "decision"
      },
      taskRepository,
      projectRepository
    );

    expect(updatedTask).toMatchObject({
      linkedEntityType: "decision",
      linkedEntityId: "decision-01",
      createdBy: "leader-01"
    });
  });
});
