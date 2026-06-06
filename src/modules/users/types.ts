import type { EntityId, TimestampFields } from "@/types/common";

export type User = TimestampFields & {
  id: EntityId;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: string;
  status: "pending" | "active" | "suspended";
};

export type UserInput = {
  fullName: string;
  email: string;
  role: string;
};

export type ProjectMembership = TimestampFields & {
  id: EntityId;
  projectId: EntityId;
  userId: EntityId;
  role: string;
};

export type ProjectMembershipInput = {
  projectId: EntityId;
  userId: EntityId;
  role: string;
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

export type AuditLogListFilters = {
  action?: string;
  actorId?: EntityId;
  entityId?: EntityId;
  entityType?: string;
};
