import type { Role } from "@/constants/roles";
import type { EntityId, TimestampFields } from "@/types/common";

export type User = TimestampFields & {
  id: EntityId;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: Role;
};

export type UserInput = {
  fullName: string;
  email: string;
  role: Role;
};

export type ProjectMembership = TimestampFields & {
  id: EntityId;
  projectId: EntityId;
  userId: EntityId;
  role: Role;
};

export type ProjectMembershipInput = {
  projectId: EntityId;
  userId: EntityId;
  role: Role;
};

export type AuditLog = {
  id: EntityId;
  actorId: EntityId;
  entityType: string;
  entityId: EntityId;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
  createdAt: string;
};
