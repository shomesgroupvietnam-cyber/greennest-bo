import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PermissionAction, PermissionUser } from "@/lib/permissions/can";
import { JsonProjectRepository } from "@/modules/projects/services/project-repository";
import { JsonLeadershipDelegationRepository } from "@/modules/settings/services/leadership-delegation-repository";
import { JsonScopeAssignmentRepository } from "@/modules/settings/services/scope-assignment-repository";
import {
  leadershipDelegationAuditValue,
  listActiveDelegationsForDelegate,
  resolveDelegatedAction,
  setLeadershipDelegationActive,
  upsertLeadershipDelegation,
} from "@/modules/settings/services/leadership-delegation-service";
import { JsonRolePermissionCatalogRepository } from "@/modules/settings/services/role-permission-catalog-repository";
import { JsonUserRepository } from "@/modules/users/services/user-repository";

let tempDir: string;
let repository: JsonLeadershipDelegationRepository;
let catalogRepository: JsonRolePermissionCatalogRepository;
let projectRepository: JsonProjectRepository;
let scopeAssignmentRepository: JsonScopeAssignmentRepository;
let userRepository: JsonUserRepository;

const settingsManager: PermissionUser = { id: "mock-founder", role: "admin" };
const delegatedManager: PermissionUser = {
  id: "viewer",
  role: "viewer",
  permissions: ["delegation.manage"] as PermissionAction[],
};
const assistant: PermissionUser = { id: "viewer", role: "thu_ky_tro_ly" };

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-leadership-delegation-"));
  repository = new JsonLeadershipDelegationRepository(path.join(tempDir, "leadership-delegations.json"));
  catalogRepository = new JsonRolePermissionCatalogRepository(path.join(tempDir, "role-permission-catalog.json"));
  projectRepository = new JsonProjectRepository(path.join(tempDir, "project-core.json"));
  scopeAssignmentRepository = new JsonScopeAssignmentRepository(path.join(tempDir, "scope-assignments.json"));
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

describe("leadership delegation service", () => {
  it("creates, updates, disables and audits scoped delegations", async () => {
    const created = await upsertLeadershipDelegation(
      {
        principalUserId: "mock-founder",
        delegateUserId: "viewer",
        actionKeys: ["proposal.create"],
        projectId: "project-a",
        moduleId: "proposal",
        note: "Tao de xuat thay lanh dao",
      },
      settingsManager,
      { repository, catalogRepository, projectRepository, userRepository },
    );

    expect(created.delegation).toMatchObject({
      principalUserId: "mock-founder",
      delegateUserId: "viewer",
      actionKeys: ["proposal.create"],
      projectId: "project-a",
      moduleId: "proposal",
      active: true,
      createdBy: "mock-founder",
      updatedBy: "mock-founder",
    });
    expect(created.delegation.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(leadershipDelegationAuditValue(created.delegation)).toMatchObject({
      id: created.delegation.id,
      principalUserId: "mock-founder",
      delegateUserId: "viewer",
      actionKeys: ["proposal.create"],
      projectId: "project-a",
    });

    const resolved = await resolveDelegatedAction(
      {
        actor: assistant,
        principalUserId: "mock-founder",
        actionKey: "proposal.create",
        scope: { projectId: "project-a", moduleId: "proposal" },
      },
      { repository, catalogRepository },
    );

    expect(resolved).toMatchObject({
      delegationId: created.delegation.id,
      principalUserId: "mock-founder",
      delegateUserId: "viewer",
      actionKey: "proposal.create",
      scope: { projectId: "project-a", moduleId: "proposal" },
    });

    const updated = await upsertLeadershipDelegation(
      {
        id: created.delegation.id,
        principalUserId: "mock-founder",
        delegateUserId: "viewer",
        actionKeys: ["proposal.create"],
        projectId: "project-b",
        moduleId: "proposal",
        active: true,
      },
      settingsManager,
      { repository, catalogRepository, projectRepository, userRepository },
    );

    expect(updated.previousDelegation?.projectId).toBe("project-a");
    expect(updated.delegation).toMatchObject({
      id: created.delegation.id,
      projectId: "project-b",
      moduleId: "proposal",
    });

    const disabled = await setLeadershipDelegationActive(
      created.delegation.id,
      false,
      settingsManager,
      { repository },
    );

    expect(disabled.previousDelegation?.active).toBe(true);
    expect(disabled.delegation.active).toBe(false);
    expect(await listActiveDelegationsForDelegate("viewer", repository)).toEqual([]);
  });

  it("requires delegation management permission and validates users/actions/scope", async () => {
    await expect(
      upsertLeadershipDelegation(
        {
          principalUserId: "mock-founder",
          delegateUserId: "viewer",
          actionKeys: ["proposal.create"],
          projectId: "project-a",
          moduleId: "proposal",
        },
        { id: "viewer", role: "viewer" },
        { repository, catalogRepository, projectRepository, userRepository },
      ),
    ).rejects.toThrow(/quyen|permission/i);

    await expect(
      upsertLeadershipDelegation(
        {
          principalUserId: "viewer",
          delegateUserId: "viewer",
          actionKeys: ["proposal.create"],
          projectId: "project-a",
          moduleId: "proposal",
        },
        delegatedManager,
        { repository, catalogRepository, projectRepository, userRepository },
      ),
    ).rejects.toThrow(/khac|different|principal/i);

    await expect(
      upsertLeadershipDelegation(
        {
          principalUserId: "missing-user",
          delegateUserId: "viewer",
          actionKeys: ["proposal.create"],
          projectId: "project-a",
          moduleId: "proposal",
        },
        delegatedManager,
        { repository, catalogRepository, projectRepository, userRepository },
      ),
    ).rejects.toThrow(/user|nguoi dung/i);

    await expect(
      upsertLeadershipDelegation(
        {
          principalUserId: "mock-founder",
          delegateUserId: "viewer",
          actionKeys: ["proposal.approve"],
          projectId: "project-a",
          moduleId: "proposal",
        },
        delegatedManager,
        { repository, catalogRepository, projectRepository, userRepository },
      ),
    ).rejects.toThrow(/approval|admin|nhay cam|khong duoc/i);

    await expect(
      upsertLeadershipDelegation(
        {
          principalUserId: "mock-founder",
          delegateUserId: "viewer",
          actionKeys: ["settings.manage"],
          projectId: "project-a",
          moduleId: "proposal",
        },
        delegatedManager,
        { repository, catalogRepository, projectRepository, userRepository },
      ),
    ).rejects.toThrow(/approval|admin|nhay cam|khong duoc/i);

    await expect(
      upsertLeadershipDelegation(
        {
          principalUserId: "mock-founder",
          delegateUserId: "viewer",
          actionKeys: ["proposal.create"],
        },
        delegatedManager,
        { repository, catalogRepository, projectRepository, userRepository },
      ),
    ).rejects.toThrow(/scope|pham vi/i);
  });

  it("allows global scope-assigned delegation management permission", async () => {
    await scopeAssignmentRepository.upsertAssignment({
      id: "assignment-delegation-manager",
      userId: "viewer",
      roleKey: "pho_tong_giam_doc",
      permissionKeys: ["delegation.manage"],
      scopeType: "global",
      active: true,
      createdAt: "",
      updatedAt: "",
    });

    const created = await upsertLeadershipDelegation(
      {
        principalUserId: "mock-founder",
        delegateUserId: "viewer",
        actionKeys: ["proposal.create"],
        projectId: "project-a",
        moduleId: "proposal",
      },
      { id: "viewer", role: "viewer" },
      {
        repository,
        catalogRepository,
        projectRepository,
        scopeAssignmentRepository,
        userRepository,
      },
    );

    expect(created.delegation).toMatchObject({
      principalUserId: "mock-founder",
      delegateUserId: "viewer",
      projectId: "project-a",
      moduleId: "proposal",
    });
  });

  it("matches wildcard scope and ignores inactive or expired delegations", async () => {
    const active = await upsertLeadershipDelegation(
      {
        principalUserId: "mock-founder",
        delegateUserId: "viewer",
        actionKeys: ["proposal.create"],
        projectId: "*",
        moduleId: "proposal",
        startsAt: "2026-01-01T00:00:00.000Z",
        endsAt: "2026-12-31T23:59:59.000Z",
      },
      delegatedManager,
      { repository, catalogRepository, projectRepository, userRepository },
    );

    await upsertLeadershipDelegation(
      {
        principalUserId: "mock-founder",
        delegateUserId: "viewer",
        actionKeys: ["proposal.create"],
        projectId: "project-a",
        moduleId: "proposal",
        endsAt: "2026-01-01T00:00:00.000Z",
      },
      delegatedManager,
      { repository, catalogRepository, projectRepository, userRepository },
    );

    await upsertLeadershipDelegation(
      {
        principalUserId: "mock-founder",
        delegateUserId: "viewer",
        actionKeys: ["proposal.create"],
        projectId: "project-b",
        moduleId: "proposal",
        active: false,
      },
      delegatedManager,
      { repository, catalogRepository, projectRepository, userRepository },
    );

    await expect(
      resolveDelegatedAction(
        {
          actor: assistant,
          principalUserId: "mock-founder",
          actionKey: "proposal.create",
          scope: { projectId: "project-b", moduleId: "proposal" },
        },
        { repository, catalogRepository, now: new Date("2026-05-24T00:00:00.000Z") },
      ),
    ).resolves.toMatchObject({ delegationId: active.delegation.id });

    await expect(
      resolveDelegatedAction(
        {
          actor: assistant,
          principalUserId: "mock-founder",
          actionKey: "proposal.create",
          scope: { projectId: "project-b", moduleId: "finance" },
        },
        { repository, catalogRepository, now: new Date("2026-05-24T00:00:00.000Z") },
      ),
    ).resolves.toBeUndefined();
  });
});
