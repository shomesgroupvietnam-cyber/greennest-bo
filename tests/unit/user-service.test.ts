import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createProject } from "@/modules/projects/services/project-service";
import { JsonProjectRepository } from "@/modules/projects/services/project-repository";
import {
  inviteUser,
  listAuditLogs,
  listProjectMemberships,
  listUsers,
  updateUserRole,
  upsertProjectMembership
} from "@/modules/users/services/user-service";
import { JsonUserRepository } from "@/modules/users/services/user-repository";

let tempDir: string;
let userRepository: JsonUserRepository;
let projectRepository: JsonProjectRepository;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-users-"));
  userRepository = new JsonUserRepository(path.join(tempDir, "users.json"));
  projectRepository = new JsonProjectRepository(path.join(tempDir, "projects.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("user service", () => {
  it("seeds mock users from file-backed repository", async () => {
    const users = await listUsers(userRepository);

    expect(users.map((user) => user.role)).toEqual(expect.arrayContaining(["admin", "phap_ly", "thiet_ke", "viewer"]));
  });

  it("invites users and records audit entries", async () => {
    const invitedUser = await inviteUser(
      {
        fullName: "Quản lý mới",
        email: "new.pm@greennest.vn",
        role: "quan_ly_du_an"
      },
      "mock-founder",
      userRepository
    );
    const auditLogs = await listAuditLogs(userRepository);

    expect(invitedUser.email).toBe("new.pm@greennest.vn");
    expect(auditLogs[0]).toMatchObject({
      actorId: "mock-founder",
      entityType: "user",
      entityId: invitedUser.id,
      action: "user.invite"
    });
  });

  it("updates user role and records old/new role audit", async () => {
    const invitedUser = await inviteUser(
      {
        fullName: "Người kiểm thử",
        email: "tester@greennest.vn",
        role: "viewer"
      },
      "mock-founder",
      userRepository
    );

    const updatedUser = await updateUserRole(invitedUser.id, "ke_toan", "mock-founder", userRepository);
    const auditLogs = await listAuditLogs(userRepository);

    expect(updatedUser.role).toBe("ke_toan");
    expect(auditLogs[0]).toMatchObject({
      action: "user.update_role",
      oldValue: { role: "viewer" },
      newValue: { role: "ke_toan" }
    });
  });

  it("upserts project memberships for valid users and projects", async () => {
    const project = await createProject(
      {
        name: "GreenNest Membership Test",
        status: "planning"
      },
      projectRepository
    );

    const membership = await upsertProjectMembership(
      {
        projectId: project.id,
        userId: "legal-manager",
        role: "phap_ly"
      },
      "mock-founder",
      userRepository,
      projectRepository
    );
    const memberships = await listProjectMemberships(project.id, userRepository);

    expect(membership.projectId).toBe(project.id);
    expect(memberships).toHaveLength(1);
    expect(memberships[0].userId).toBe("legal-manager");
  });
});
