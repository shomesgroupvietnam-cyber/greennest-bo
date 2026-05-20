import type { ProjectStatus } from "@/constants/statuses";
import type { EntityId, TimestampFields } from "@/types/common";

export type Project = TimestampFields & {
  id: EntityId;
  code: string;
  name: string;
  location?: string;
  area?: number;
  projectType?: string;
  investor?: string;
  status: ProjectStatus;
  ownerName?: string;
  ownerId?: EntityId;
  archivedAt?: string;
};

export type ProjectInput = {
  code?: string;
  name: string;
  location?: string;
  area?: number;
  projectType?: string;
  investor?: string;
  status: ProjectStatus;
  ownerName?: string;
};

export type ProjectUpdateInput = Partial<ProjectInput> & {
  name: string;
  status: ProjectStatus;
};

export type ProjectListFilters = {
  query?: string;
  status?: ProjectStatus | "all";
  includeArchived?: boolean;
};
