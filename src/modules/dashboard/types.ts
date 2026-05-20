import type { Document, DocumentRequirementReadinessItem } from "@/modules/documents/types";
import type { LegalStep } from "@/modules/legal/types";
import type { Project } from "@/modules/projects/types";
import type { Task } from "@/modules/tasks/types";

export type DashboardSummary = {
  totalProjects: number;
  activeProjects: number;
  overdueTasks: number;
  upcomingTasks: number;
  missingDocuments: number;
  missingRequiredDocuments: number;
  needsUpdateDocuments: number;
  blockedLegalSteps: number;
  waitingAuthorityLegalSteps: number;
  overallProgress: number;
};

export type DashboardPermissions = {
  canViewProjects: boolean;
  canViewTasks: boolean;
  canViewDocuments: boolean;
  canViewLegal: boolean;
  canViewFinance: boolean;
  canViewDesign: boolean;
  canViewConstruction: boolean;
};

export type DashboardData = {
  summary: DashboardSummary;
  permissions: DashboardPermissions;
  projects: Project[];
  overdueTasks: Task[];
  upcomingTasks: Task[];
  tasksDueThisWeek: Task[];
  missingDocuments: Document[];
  missingRequiredDocuments: DocumentRequirementReadinessItem[];
  needsUpdateDocuments: Document[];
  blockedLegalSteps: LegalStep[];
  waitingAuthorityLegalSteps: LegalStep[];
  generatedAt: string;
  progressFormula: string;
};
