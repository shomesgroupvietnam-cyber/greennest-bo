import type { WorkspaceDefinition } from "@/modules/workspaces/config";
import type { DashboardData } from "@/modules/dashboard/types";
import type { Document } from "@/modules/documents/types";
import type { LegalStep } from "@/modules/legal/types";
import type { Decision, Meeting } from "@/modules/meetings/types";
import type { Project } from "@/modules/projects/types";
import type { Task } from "@/modules/tasks/types";
import type { AuditLog, ProjectMembership, User } from "@/modules/users/types";

export type WorkspaceScopedData = {
  projects: Project[];
  tasks: Task[];
  documents: Document[];
  legalSteps: LegalStep[];
  meetings: Meeting[];
  decisions: Decision[];
  users: User[];
  auditLogs: AuditLog[];
  memberships: ProjectMembership[];
};

export type RoleWorkspaceData = {
  definition: WorkspaceDefinition;
  dashboard: DashboardData;
  scoped: WorkspaceScopedData;
  kpis: Array<{
    label: string;
    value: string | number;
    href?: string;
  }>;
  actionItems: Array<{
    title: string;
    meta: string;
    href?: string;
    tone?: "default" | "danger" | "warning";
  }>;
};
