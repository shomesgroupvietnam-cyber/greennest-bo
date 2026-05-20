import type { PermissionUser } from "@/lib/permissions/can";
import { can } from "@/lib/permissions/can";
import {
  documentRequirementRepository,
  type DocumentRequirementRepository
} from "@/modules/documents/services/document-requirement-repository";
import { documentRepository, type DocumentRepository } from "@/modules/documents/services/document-repository";
import { listDocuments } from "@/modules/documents/services/document-service";
import {
  calculateProjectDocumentReadiness,
  listDocumentRequirements
} from "@/modules/documents/services/document-readiness-service";
import { legalRepository, type LegalRepository } from "@/modules/legal/services/legal-repository";
import { listLegalSteps } from "@/modules/legal/services/legal-service";
import { projectRepository, type ProjectRepository } from "@/modules/projects/services/project-repository";
import { listProjects } from "@/modules/projects/services/project-service";
import { taskRepository, type TaskRepository } from "@/modules/tasks/services/task-repository";
import { isTaskOverdue, isTaskUpcoming, listTasks } from "@/modules/tasks/services/task-service";

import type { DashboardData, DashboardPermissions, DashboardSummary } from "../types";

export const DASHBOARD_PROGRESS_FORMULA =
  "overallProgress = trung bình các tỷ lệ hoàn thành của domain user có quyền xem: task done/total tasks, document complete/total documents, legal done/total legal steps.";

type DashboardRepositories = {
  projects?: ProjectRepository;
  tasks?: TaskRepository;
  documents?: DocumentRepository;
  requirements?: DocumentRequirementRepository;
  legal?: LegalRepository;
};

function roundPercentage(value: number) {
  return Math.round(value * 100);
}

function ratio(done: number, total: number) {
  return total > 0 ? done / total : undefined;
}

function resolvePermissions(user: PermissionUser): DashboardPermissions {
  return {
    canViewProjects: can(user, "project.view"),
    canViewTasks: can(user, "task.view"),
    canViewDocuments: can(user, "document.view"),
    canViewLegal: can(user, "legal.view"),
    canViewFinance: can(user, "finance.view"),
    canViewDesign: can(user, "design.view"),
    canViewConstruction: can(user, "construction.view")
  };
}

export async function getDashboardData(
  user: PermissionUser,
  options: {
    today?: Date;
    upcomingWindowDays?: number;
    repositories?: DashboardRepositories;
  } = {}
): Promise<DashboardData> {
  const permissions = resolvePermissions(user);
  const repositories = {
    projects: options.repositories?.projects ?? projectRepository,
    tasks: options.repositories?.tasks ?? taskRepository,
    documents: options.repositories?.documents ?? documentRepository,
    requirements: options.repositories?.requirements ?? documentRequirementRepository,
    legal: options.repositories?.legal ?? legalRepository
  };
  const today = options.today ?? new Date();
  const upcomingWindowDays = options.upcomingWindowDays ?? 7;

  const projects = permissions.canViewProjects ? await listProjects({}, repositories.projects) : [];
  const tasks = permissions.canViewTasks ? await listTasks({}, repositories.tasks) : [];
  const documents = permissions.canViewDocuments ? await listDocuments({}, repositories.documents) : [];
  const legalSteps = permissions.canViewLegal
    ? await listLegalSteps({}, repositories.legal, repositories.projects)
    : [];
  const documentRequirements = permissions.canViewDocuments ? await listDocumentRequirements({}, repositories.requirements) : [];

  const overdueTasks = tasks.filter((task) => isTaskOverdue(task, today));
  const upcomingTasks = tasks.filter((task) => isTaskUpcoming(task, today, upcomingWindowDays));
  const missingDocuments = documents.filter((document) => document.status === "missing");
  const needsUpdateDocuments = documents.filter((document) => document.status === "needs_update");
  const missingRequiredDocuments = permissions.canViewDocuments
    ? projects.flatMap((project) =>
        calculateProjectDocumentReadiness({
          project,
          requirements: documentRequirements,
          documents: documents.filter((document) => document.projectId === project.id),
          legalSteps: legalSteps.filter((step) => step.projectId === project.id)
        }).missingRequirements
      )
    : [];
  const blockedLegalSteps = legalSteps.filter((step) => step.status === "blocked");
  const waitingAuthorityLegalSteps = legalSteps.filter((step) => step.status === "waiting_authority");
  const progressParts = [
    permissions.canViewTasks ? ratio(tasks.filter((task) => task.status === "done").length, tasks.length) : undefined,
    permissions.canViewDocuments
      ? ratio(documents.filter((document) => document.status === "complete").length, documents.length)
      : undefined,
    permissions.canViewLegal ? ratio(legalSteps.filter((step) => step.status === "done").length, legalSteps.length) : undefined
  ].filter((part) => part !== undefined);

  const summary: DashboardSummary = {
    totalProjects: projects.length,
    activeProjects: projects.filter((project) => project.status === "active").length,
    overdueTasks: overdueTasks.length,
    upcomingTasks: upcomingTasks.length,
    missingDocuments: missingDocuments.length,
    missingRequiredDocuments: missingRequiredDocuments.length,
    needsUpdateDocuments: needsUpdateDocuments.length,
    blockedLegalSteps: blockedLegalSteps.length,
    waitingAuthorityLegalSteps: waitingAuthorityLegalSteps.length,
    overallProgress:
      progressParts.length > 0
        ? roundPercentage(progressParts.reduce((total, current) => total + current, 0) / progressParts.length)
        : 0
  };

  return {
    summary,
    permissions,
    projects,
    overdueTasks,
    upcomingTasks,
    tasksDueThisWeek: upcomingTasks,
    missingDocuments,
    missingRequiredDocuments,
    needsUpdateDocuments,
    blockedLegalSteps,
    waitingAuthorityLegalSteps,
    generatedAt: new Date().toISOString(),
    progressFormula: DASHBOARD_PROGRESS_FORMULA
  };
}
