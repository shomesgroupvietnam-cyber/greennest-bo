import { getStaticRoleLabel } from "@/constants/roles";
import {
  projectRepository,
  type ProjectRepository,
} from "@/modules/projects/services/project-repository";
import {
  projectMembershipInputSchema,
  roleSchema,
  userInputSchema,
} from "@/modules/users/validation";
import type {
  AuditLog,
  AuditLogListFilters,
  ProjectMembership,
  ProjectMembershipInput,
  User,
  UserInput,
} from "@/modules/users/types";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";

import { userRepository, type UserRepository } from "./user-repository";

function createId() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

export async function listRoles() {
  const catalog = await listRolePermissionCatalog();

  return catalog.roles
    .filter((role) => role.active)
    .map((role) => ({
      key: role.key,
      label: role.labelVi || getStaticRoleLabel(role.key),
      description: role.description,
    }));
}

async function assertAssignableRole(roleKey: string) {
  const catalog = await listRolePermissionCatalog();
  const role = catalog.roles.find((item) => item.key === roleKey);

  if (!role?.active) {
    throw new Error("Role khong ton tai hoac da bi vo hieu hoa.");
  }

  return role;
}

export async function listUsers(repository: UserRepository = userRepository) {
  return repository.listUsers();
}

export async function getUser(
  userId: string,
  repository: UserRepository = userRepository,
) {
  return repository.getUser(userId);
}

export async function getUserByEmail(
  email: string,
  repository: UserRepository = userRepository,
) {
  return repository.getUserByEmail(email);
}

export async function inviteUser(
  input: UserInput,
  actorId: string,
  repository: UserRepository = userRepository,
) {
  const parsedInput = userInputSchema.parse(input);
  await assertAssignableRole(parsedInput.role);
  const timestamp = now();
  const user: User = {
    id: createId(),
    fullName: parsedInput.fullName,
    email: parsedInput.email,
    role: parsedInput.role,
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const createdUser = await repository.createUser(user);
  await createAuditLog(
    {
      actorId,
      entityType: "user",
      entityId: createdUser.id,
      action: "user.invite",
      newValue: { email: createdUser.email, role: createdUser.role },
    },
    repository,
  );

  return createdUser;
}

export async function updateUserRole(
  userId: string,
  role: string,
  actorId: string,
  repository: UserRepository = userRepository,
) {
  const parsedRole = roleSchema.parse(role);
  await assertAssignableRole(parsedRole);
  const existingUser = await repository.getUser(userId);

  if (!existingUser) {
    throw new Error("Không tìm thấy người dùng.");
  }

  const updatedUser = await repository.updateUser(userId, {
    role: parsedRole,
    updatedAt: now(),
  });

  await createAuditLog(
    {
      actorId,
      entityType: "user",
      entityId: userId,
      action: "user.update_role",
      oldValue: { role: existingUser.role },
      newValue: { role: updatedUser.role },
    },
    repository,
  );

  return updatedUser;
}

export async function listProjectMemberships(
  projectId?: string,
  repository: UserRepository = userRepository,
) {
  return repository.listProjectMemberships(projectId);
}

export async function upsertProjectMembership(
  input: ProjectMembershipInput,
  actorId: string,
  repository: UserRepository = userRepository,
  projects: ProjectRepository = projectRepository,
) {
  const parsedInput = projectMembershipInputSchema.parse(input);
  await assertAssignableRole(parsedInput.role);
  const [project, user] = await Promise.all([
    projects.getProject(parsedInput.projectId),
    repository.getUser(parsedInput.userId),
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
    updatedAt: timestamp,
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
        role: savedMembership.role,
      },
    },
    repository,
  );

  return savedMembership;
}

export async function createAuditLog(
  input: Omit<AuditLog, "id" | "createdAt">,
  repository: UserRepository = userRepository,
) {
  return repository.createAuditLog({
    id: createId(),
    createdAt: now(),
    ...input,
  });
}

export async function listAuditLogs(
  filtersOrRepository: AuditLogListFilters | UserRepository = {},
  repository: UserRepository = userRepository,
) {
  const filters =
    "listAuditLogs" in filtersOrRepository ? {} : filtersOrRepository;
  const resolvedRepository =
    "listAuditLogs" in filtersOrRepository ? filtersOrRepository : repository;

  return resolvedRepository.listAuditLogs(filters);
}
