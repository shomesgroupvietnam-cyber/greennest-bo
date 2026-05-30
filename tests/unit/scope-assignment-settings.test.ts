import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { JsonRolePermissionCatalogRepository } from "@/modules/settings/services/role-permission-catalog-repository";
import { JsonProjectRepository } from "@/modules/projects/services/project-repository";
import {
  createScopeAssignment,
  disableScopeAssignment,
  listScopeAssignments,
  updateScopeAssignment,
} from "@/modules/settings/services/scope-assignment-service";
import { JsonScopeAssignmentRepository } from "@/modules/settings/services/scope-assignment-repository";
import { JsonUserRepository } from "@/modules/users/services/user-repository";

let tempDir: string;
let repository: JsonScopeAssignmentRepository;
let catalogRepository: JsonRolePermissionCatalogRepository;
let projectRepository: JsonProjectRepository;
let userRepository: JsonUserRepository;

const settingsManager = { id: "mock-founder", role: "admin" } as const;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-scope-assignment-"));
  repository = new JsonScopeAssignmentRepository(path.join(tempDir, "scope-assignments.json"));
  catalogRepository = new JsonRolePermissionCatalogRepository(path.join(tempDir, "role-permission-catalog.json"));
  projectRepository = new JsonProjectRepository(path.join(tempDir, "project-core.json"));
  userRepository = new JsonUserRepository(path.join(tempDir, "users.json"));
  await projectRepository.createProject(
    {
      id: "project-a",
      code: "A",
      name: "Project A",
      status: "active",
      createdAt: "",
      updatedAt: "",
    },
    [],
  );
  await projectRepository.createProject(
    {
      id: "project-b",
      code: "B",
      name: "Project B",
      status: "active",
      createdAt: "",
      updatedAt: "",
    },
    [],
  );
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("scope assignment settings service", () => {
  it("creates, updates and disables scoped assignments", async () => {
    const created = await createScopeAssignment(
      {
        userId: "viewer",
        roleKey: "viewer",
        permissionKeys: ["project.view", "document.view"],
        projectId: "project-a",
        moduleId: "project",
      },
      settingsManager,
      { repository, catalogRepository, projectRepository, userRepository },
    );

    expect(created.assignment).toMatchObject({
      userId: "viewer",
      roleKey: "viewer",
      projectId: "project-a",
      moduleId: "project",
      active: true,
      scopeType: "scoped",
    });
    expect(created.assignment.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    const updated = await updateScopeAssignment(
      created.assignment.id,
      {
        userId: "viewer",
        roleKey: "viewer",
        permissionKeys: ["project.view", "task.view"],
        projectId: "project-b",
        axisId: "axis-1",
      },
      settingsManager,
      { repository, catalogRepository, projectRepository, userRepository },
    );

    expect(updated.previousAssignment?.projectId).toBe("project-a");
    expect(updated.assignment).toMatchObject({
      projectId: "project-b",
      axisId: "axis-1",
      moduleId: undefined,
      permissionKeys: ["project.view", "task.view"],
    });

    const disabled = await disableScopeAssignment(created.assignment.id, settingsManager, {
      repository,
    });

    expect(disabled.previousAssignment?.active).toBe(true);
    expect(disabled.assignment.active).toBe(false);
    expect((await listScopeAssignments(repository)).some((assignment) => assignment.id === created.assignment.id)).toBe(true);
  });

  it("rejects unknown users, roles, permissions and implicit global scope", async () => {
    await expect(
      createScopeAssignment(
        {
          userId: "missing-user",
          roleKey: "viewer",
          permissionKeys: ["project.view"],
          projectId: "project-a",
        },
        settingsManager,
        { repository, catalogRepository, projectRepository, userRepository },
      ),
    ).rejects.toThrow(/user|nguoi dung/i);

    await expect(
      createScopeAssignment(
        {
          userId: "viewer",
          roleKey: "missing_role",
          permissionKeys: ["project.view"],
          projectId: "project-a",
        },
        settingsManager,
        { repository, catalogRepository, projectRepository, userRepository },
      ),
    ).rejects.toThrow(/role/i);

    await expect(
      createScopeAssignment(
        {
          userId: "viewer",
          roleKey: "viewer",
          permissionKeys: ["unknown.view"],
          projectId: "project-a",
        },
        settingsManager,
        { repository, catalogRepository, projectRepository, userRepository },
      ),
    ).rejects.toThrow(/permission/i);

    await expect(
      createScopeAssignment(
        {
          userId: "viewer",
          roleKey: "viewer",
          permissionKeys: ["project.view"],
        },
        settingsManager,
        { repository, catalogRepository, projectRepository, userRepository },
      ),
    ).rejects.toThrow(/scope|pham vi/i);

    await expect(
      createScopeAssignment(
        {
          userId: "viewer",
          roleKey: "viewer",
          permissionKeys: ["settings.manage"],
          scopeType: "global",
        },
        settingsManager,
        { repository, catalogRepository, projectRepository, userRepository },
      ),
    ).rejects.toThrow(/role|permission/i);

    await expect(
      createScopeAssignment(
        {
          userId: "viewer",
          roleKey: "viewer",
          permissionKeys: ["project.view"],
          scopeType: "global",
          projectId: "project-a",
        },
        settingsManager,
        { repository, catalogRepository, projectRepository, userRepository },
      ),
    ).rejects.toThrow(/global|scope/i);

    await expect(
      createScopeAssignment(
        {
          userId: "viewer",
          roleKey: "viewer",
          permissionKeys: ["project.view"],
          projectId: "missing-project",
        },
        settingsManager,
        { repository, catalogRepository, projectRepository, userRepository },
      ),
    ).rejects.toThrow(/project/i);

    await expect(
      createScopeAssignment(
        {
          userId: "viewer",
          roleKey: "viewer",
          permissionKeys: ["project.view"],
          projectId: "project-a",
          moduleId: "missing-module",
        },
        settingsManager,
        { repository, catalogRepository, projectRepository, userRepository },
      ),
    ).rejects.toThrow(/module/i);

    await expect(
      createScopeAssignment(
        {
          userId: "viewer",
          roleKey: "viewer",
          permissionKeys: ["project.view"],
          projectId: "project-a",
          startsAt: "not-a-date",
        },
        settingsManager,
        { repository, catalogRepository, projectRepository, userRepository },
      ),
    ).rejects.toThrow(/thoi gian|date|invalid/i);

    const global = await createScopeAssignment(
      {
        userId: "viewer",
        roleKey: "viewer",
        permissionKeys: ["project.view"],
        scopeType: "global",
      },
      settingsManager,
      { repository, catalogRepository, projectRepository, userRepository },
    );

    expect(global.assignment.scopeType).toBe("global");
  });

  it("requires settings.manage and guards the current management assignment", async () => {
    await expect(
      createScopeAssignment(
        {
          userId: "viewer",
          roleKey: "viewer",
          permissionKeys: ["project.view"],
          projectId: "project-a",
        },
        { id: "viewer", role: "viewer" },
        { repository, catalogRepository, projectRepository, userRepository },
      ),
    ).rejects.toThrow(/quyen|permission/i);

    const managementAssignment = await createScopeAssignment(
      {
        userId: "mock-founder",
        roleKey: "admin",
        permissionKeys: ["settings.manage"],
        scopeType: "global",
      },
      settingsManager,
      { repository, catalogRepository, projectRepository, userRepository },
    );

    await expect(
      disableScopeAssignment(managementAssignment.assignment.id, settingsManager, {
        repository,
      }),
    ).rejects.toThrow(/quan tri|settings\.manage|current/i);

    await expect(
      updateScopeAssignment(
        managementAssignment.assignment.id,
        {
          userId: "mock-founder",
          roleKey: "admin",
          permissionKeys: ["project.view"],
          scopeType: "global",
        },
        settingsManager,
        { repository, catalogRepository, projectRepository, userRepository },
      ),
    ).rejects.toThrow(/settings\.manage|quan tri/i);
  });
});
