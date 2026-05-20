import { ROLES, type Role } from "@/constants/roles";
import { projectRepository, type ProjectRepository } from "@/modules/projects/services/project-repository";
import { projectMembershipInputSchema, roleSchema, userInputSchema } from "@/modules/users/validation";
import type { AuditLog, ProjectMembership, ProjectMembershipInput, User, UserInput } from "@/modules/users/types";

import { userRepository, type UserRepository } from "./user-repository";

function createId() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

export function listRoles() {
  return Object.entries(ROLES).map(([key, value]) => ({
    key: key as Role,
    label: value.label,
    description: value.description
  }));
}

export async function listUsers(repository: UserRepository = userRepository) {
  return repository.listUsers();
}

export async function getUser(userId: string, repository: UserRepository = userRepository) {
  return repository.getUser(userId);
}

export async function getUserByEmail(email: string, repository: UserRepository = userRepository) {
  return repository.getUserByEmail(email);
}

export async function inviteUser(input: UserInput, actorId: string, repository: UserRepository = userRepository) {
  const parsedInput = userInputSchema.parse(input);
  const timestamp = now();
  const user: User = {
    id: createId(),
    fullName: parsedInput.fullName,
    email: parsedInput.email,
    role: parsedInput.role,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const createdUser = await repository.createUser(user);
  await createAuditLog(
    {
      actorId,
      entityType: "user",
      entityId: createdUser.id,
      action: "user.invite",
      newValue: { email: createdUser.email, role: createdUser.role }
    },
    repository
  );

  return createdUser;
}

export async function updateUserRole(
  userId: string,
  role: Role,
  actorId: string,
  repository: UserRepository = userRepository
) {
  const parsedRole = roleSchema.parse(role);
  const existingUser = await repository.getUser(userId);

  if (!existingUser) {
    throw new Error("Không tìm thấy người dùng.");
  }

  const updatedUser = await repository.updateUser(userId, {
    role: parsedRole,
    updatedAt: now()
  });

  await createAuditLog(
    {
      actorId,
      entityType: "user",
      entityId: userId,
      action: "user.update_role",
      oldValue: { role: existingUser.role },
      newValue: { role: updatedUser.role }
    },
    repository
  );

  return updatedUser;
}

export async function listProjectMemberships(projectId?: string, repository: UserRepository = userRepository) {
  return repository.listProjectMemberships(projectId);
}

export async function upsertProjectMembership(
  input: ProjectMembershipInput,
  actorId: string,
  repository: UserRepository = userRepository,
  projects: ProjectRepository = projectRepository
) {
  const parsedInput = projectMembershipInputSchema.parse(input);
  const [project, user] = await Promise.all([
    projects.getProject(parsedInput.projectId),
    repository.getUser(parsedInput.userId)
  ]);

  if (!project || project.archivedAt) {
    throw new Error("Dự án không tồn tại hoặc đã được lưu trữ.");
  }

  if (!user) {
    throw new Error("Không tìm thấy người dùng.");
  }

  const timestamp = now();
  const membership: ProjectMembership = {
    id: createId(),
    projectId: parsedInput.projectId,
    userId: parsedInput.userId,
    role: parsedInput.role,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const savedMembership = await repository.upsertProjectMembership(membership);

  await createAuditLog(
    {
      actorId,
      entityType: "project_membership",
      entityId: savedMembership.id,
      action: "project.assign_member",
      newValue: {
        projectId: savedMembership.projectId,
        userId: savedMembership.userId,
        role: savedMembership.role
      }
    },
    repository
  );

  return savedMembership;
}

export async function createAuditLog(
  input: Omit<AuditLog, "id" | "createdAt">,
  repository: UserRepository = userRepository
) {
  return repository.createAuditLog({
    id: createId(),
    createdAt: now(),
    ...input
  });
}

export async function listAuditLogs(repository: UserRepository = userRepository) {
  return repository.listAuditLogs();
}
