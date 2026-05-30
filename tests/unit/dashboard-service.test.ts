import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getRolePermissions } from "@/lib/permissions/can";
import { JsonDocumentRepository } from "@/modules/documents/services/document-repository";
import { createDocument } from "@/modules/documents/services/document-service";
import { getDashboardData } from "@/modules/dashboard/services/dashboard-service";
import { JsonLegalRepository } from "@/modules/legal/services/legal-repository";
import { listLegalSteps, updateLegalStep } from "@/modules/legal/services/legal-service";
import { JsonProjectRepository } from "@/modules/projects/services/project-repository";
import { createProject } from "@/modules/projects/services/project-service";
import type { ScopeAssignment } from "@/modules/settings/types";
import { JsonTaskRepository } from "@/modules/tasks/services/task-repository";
import { createTask } from "@/modules/tasks/services/task-service";

let tempDir: string;
let projectRepository: JsonProjectRepository;
let taskRepository: JsonTaskRepository;
let documentRepository: JsonDocumentRepository;
let legalRepository: JsonLegalRepository;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-dashboard-"));
  projectRepository = new JsonProjectRepository(path.join(tempDir, "project-core.json"));
  taskRepository = new JsonTaskRepository(path.join(tempDir, "task-management.json"));
  documentRepository = new JsonDocumentRepository(path.join(tempDir, "document-center.json"));
  legalRepository = new JsonLegalRepository(path.join(tempDir, "project-core.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

async function seedDashboardData() {
  const project = await createProject({ name: "GreenNest Dashboard", status: "active" }, projectRepository);

  await createTask(
    {
      projectId: project.id,
      title: "Việc quá hạn",
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
      title: "Việc trong tuần",
      dueDate: "2026-05-18",
      status: "todo",
      priority: "high"
    },
    taskRepository,
    projectRepository
  );
  await createTask(
    {
      projectId: project.id,
      title: "Việc đã xong",
      dueDate: "2026-05-12",
      status: "done",
      priority: "medium"
    },
    taskRepository,
    projectRepository
  );

  await createDocument(
    {
      projectId: project.id,
      title: "Hồ sơ thiếu",
      docType: "legal_submission",
      version: "v1",
      status: "missing"
    },
    documentRepository,
    projectRepository
  );
  await createDocument(
    {
      projectId: project.id,
      title: "Hồ sơ cần bổ sung",
      docType: "construction_permit",
      externalUrl: "https://example.com/update.pdf",
      version: "v1",
      status: "needs_update"
    },
    documentRepository,
    projectRepository
  );
  await createDocument(
    {
      projectId: project.id,
      title: "Hồ sơ đầy đủ",
      docType: "contract",
      externalUrl: "https://example.com/complete.pdf",
      version: "v1",
      status: "complete"
    },
    documentRepository,
    projectRepository
  );

  const legalSteps = await listLegalSteps({ projectId: project.id }, legalRepository, projectRepository);
  await updateLegalStep(
    legalSteps[0].id,
    {
      status: "done"
    },
    legalRepository,
    projectRepository,
    documentRepository
  );
  await updateLegalStep(
    legalSteps[1].id,
    {
      status: "blocked",
      notes: "Chờ bổ sung hồ sơ quy hoạch."
    },
    legalRepository,
    projectRepository,
    documentRepository
  );
  await updateLegalStep(
    legalSteps[2].id,
    {
      status: "waiting_authority"
    },
    legalRepository,
    projectRepository,
    documentRepository
  );

  return project;
}

function globalScopeAssignment(userId: string, roleKey: string): ScopeAssignment {
  return {
    id: `assignment-${userId}`,
    userId,
    roleKey,
    permissionKeys: getRolePermissions(roleKey),
    active: true,
    scopeType: "global",
    createdAt: "",
    updatedAt: "",
  };
}

describe("dashboard service", () => {
  it("calculates dashboard KPIs from project, task, document and legal repositories", async () => {
    await seedDashboardData();

    const dashboard = await getDashboardData(
      { id: "admin", role: "admin" },
      {
        today: new Date(2026, 4, 16),
        repositories: {
          projects: projectRepository,
          tasks: taskRepository,
          documents: documentRepository,
          legal: legalRepository
        },
        scopeAssignments: [globalScopeAssignment("admin", "admin")],
      }
    );

    expect(dashboard.summary.totalProjects).toBe(1);
    expect(dashboard.summary.activeProjects).toBe(1);
    expect(dashboard.summary.overdueTasks).toBe(1);
    expect(dashboard.summary.upcomingTasks).toBe(1);
    expect(dashboard.summary.missingDocuments).toBe(1);
    expect(dashboard.summary.needsUpdateDocuments).toBe(1);
    expect(dashboard.summary.blockedLegalSteps).toBe(1);
    expect(dashboard.summary.waitingAuthorityLegalSteps).toBe(1);
    expect(dashboard.summary.overallProgress).toBe(25);
    expect(dashboard.progressFormula).toContain("task done/total tasks");
  });

  it("returns linked alert lists for dashboard quick sections", async () => {
    await seedDashboardData();

    const dashboard = await getDashboardData(
      { id: "admin", role: "admin" },
      {
        today: new Date(2026, 4, 16),
        repositories: {
          projects: projectRepository,
          tasks: taskRepository,
          documents: documentRepository,
          legal: legalRepository
        },
        scopeAssignments: [globalScopeAssignment("admin", "admin")],
      }
    );

    expect(dashboard.overdueTasks.map((task) => task.title)).toEqual(["Việc quá hạn"]);
    expect(dashboard.tasksDueThisWeek.map((task) => task.title)).toEqual(["Việc trong tuần"]);
    expect(dashboard.missingDocuments.map((document) => document.title)).toEqual(["Hồ sơ thiếu"]);
    expect(dashboard.needsUpdateDocuments.map((document) => document.title)).toEqual(["Hồ sơ cần bổ sung"]);
    expect(dashboard.blockedLegalSteps.map((step) => step.status)).toEqual(["blocked"]);
  });

  it("respects current role permissions when resolving dashboard data", async () => {
    await seedDashboardData();

    const dashboard = await getDashboardData(
      { id: "site-user", role: "thi_cong" },
      {
        today: new Date(2026, 4, 16),
        repositories: {
          projects: projectRepository,
          tasks: taskRepository,
          documents: documentRepository,
          legal: legalRepository
        },
        scopeAssignments: [globalScopeAssignment("site-user", "thi_cong")],
      }
    );

    expect(dashboard.permissions.canViewTasks).toBe(true);
    expect(dashboard.permissions.canViewDocuments).toBe(true);
    expect(dashboard.permissions.canViewLegal).toBe(false);
    expect(dashboard.summary.overdueTasks).toBe(1);
    expect(dashboard.summary.missingDocuments).toBe(1);
    expect(dashboard.summary.blockedLegalSteps).toBe(0);
    expect(dashboard.blockedLegalSteps).toEqual([]);
  });

  it("filters dashboard DTOs by explicit scope assignments", async () => {
    const projectA = await seedDashboardData();
    const projectB = await createProject({ name: "GreenNest Hidden", status: "active" }, projectRepository);
    await createTask(
      {
        projectId: projectB.id,
        title: "Hidden overdue",
        dueDate: "2026-05-10",
        status: "in_progress",
        priority: "urgent",
      },
      taskRepository,
      projectRepository,
    );
    await createDocument(
      {
        projectId: projectB.id,
        title: "Hidden missing document",
        docType: "legal_submission",
        version: "v1",
        status: "missing",
      },
      documentRepository,
      projectRepository,
    );

    const scopeAssignments: ScopeAssignment[] = [
      {
        id: "assignment-dashboard-a",
        userId: "operator",
        roleKey: "viewer",
        permissionKeys: ["project.view", "task.view", "document.view", "legal.view"],
        projectId: projectA.id,
        active: true,
        scopeType: "scoped",
        createdAt: "",
        updatedAt: "",
      },
    ];
    const dashboard = await getDashboardData(
      { id: "operator", role: "admin" },
      {
        today: new Date(2026, 4, 16),
        repositories: {
          projects: projectRepository,
          tasks: taskRepository,
          documents: documentRepository,
          legal: legalRepository,
        },
        scopeAssignments,
      },
    );

    expect(dashboard.projects.map((project) => project.id)).toEqual([projectA.id]);
    expect(dashboard.overdueTasks.map((task) => task.title)).toEqual(["Việc quá hạn"]);
    expect(dashboard.missingDocuments.map((document) => document.title)).toEqual(["Hồ sơ thiếu"]);
    expect(dashboard.summary.totalProjects).toBe(1);
  });

  it("loads dashboard DTOs when a scoped assignment grants view permissions to a base role without them", async () => {
    const project = await seedDashboardData();
    const scopeAssignments: ScopeAssignment[] = [
      {
        id: "assignment-pending-dashboard",
        userId: "operator",
        roleKey: "viewer",
        permissionKeys: ["project.view", "task.view", "document.view", "legal.view"],
        projectId: project.id,
        active: true,
        scopeType: "scoped",
        createdAt: "",
        updatedAt: "",
      },
    ];
    const dashboard = await getDashboardData(
      { id: "operator", role: "pending" },
      {
        today: new Date(2026, 4, 16),
        repositories: {
          projects: projectRepository,
          tasks: taskRepository,
          documents: documentRepository,
          legal: legalRepository,
        },
        scopeAssignments,
      },
    );

    expect(dashboard.permissions.canViewProjects).toBe(true);
    expect(dashboard.summary.totalProjects).toBe(1);
    expect(dashboard.overdueTasks.map((task) => task.title)).toEqual(["Việc quá hạn"]);
    expect(dashboard.missingDocuments.map((document) => document.title)).toEqual(["Hồ sơ thiếu"]);
  });
});
