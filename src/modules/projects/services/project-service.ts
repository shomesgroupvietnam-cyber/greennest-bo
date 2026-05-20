import { DEFAULT_LEGAL_STEPS } from "@/constants/legal-steps";
import type { LegalStep } from "@/modules/legal/types";
import type { Project, ProjectInput, ProjectListFilters, ProjectUpdateInput } from "@/modules/projects/types";
import { projectInputSchema, projectUpdateSchema } from "@/modules/projects/validation";

import { projectRepository, type ProjectRepository } from "./project-repository";

function normalizeProjectCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "-");
}

function createId() {
  return crypto.randomUUID();
}

export async function generateProjectCode(repository: ProjectRepository = projectRepository) {
  const year = new Date().getFullYear();
  const projects = await repository.listProjects({ includeArchived: true });
  let sequence = projects.length + 1;

  while (await repository.isProjectCodeTaken(`GN-${year}-${String(sequence).padStart(3, "0")}`)) {
    sequence += 1;
  }

  return `GN-${year}-${String(sequence).padStart(3, "0")}`;
}

export async function listProjects(filters: ProjectListFilters = {}, repository: ProjectRepository = projectRepository) {
  return repository.listProjects(filters);
}

export async function getProject(projectId: string, repository: ProjectRepository = projectRepository) {
  return repository.getProject(projectId);
}

export async function listProjectLegalSteps(projectId: string, repository: ProjectRepository = projectRepository) {
  return repository.listLegalSteps(projectId);
}

export async function createProject(input: ProjectInput, repository: ProjectRepository = projectRepository) {
  const parsedInput = projectInputSchema.parse(input);
  const now = new Date().toISOString();
  const code = parsedInput.code ? normalizeProjectCode(parsedInput.code) : await generateProjectCode(repository);

  if (await repository.isProjectCodeTaken(code)) {
    throw new Error("Mã dự án đã tồn tại.");
  }

  const project: Project = {
    id: createId(),
    code,
    name: parsedInput.name,
    location: parsedInput.location,
    area: parsedInput.area,
    projectType: parsedInput.projectType,
    investor: parsedInput.investor,
    status: parsedInput.status,
    ownerName: parsedInput.ownerName,
    createdAt: now,
    updatedAt: now
  };

  const legalSteps = buildDefaultLegalSteps(project.id, now);

  return repository.createProject(project, legalSteps);
}

export async function updateProject(
  projectId: string,
  input: ProjectUpdateInput,
  repository: ProjectRepository = projectRepository
) {
  const parsedInput = projectUpdateSchema.parse(input);
  const existingProject = await repository.getProject(projectId);

  if (!existingProject) {
    throw new Error("Không tìm thấy dự án.");
  }

  const nextCode = parsedInput.code ? normalizeProjectCode(parsedInput.code) : existingProject.code;

  if (await repository.isProjectCodeTaken(nextCode, projectId)) {
    throw new Error("Mã dự án đã tồn tại.");
  }

  return repository.updateProject(projectId, {
    code: nextCode,
    name: parsedInput.name,
    location: parsedInput.location,
    area: parsedInput.area,
    projectType: parsedInput.projectType,
    investor: parsedInput.investor,
    status: parsedInput.status,
    ownerName: parsedInput.ownerName,
    updatedAt: new Date().toISOString()
  });
}

export async function archiveProject(projectId: string, repository: ProjectRepository = projectRepository) {
  const existingProject = await repository.getProject(projectId);

  if (!existingProject) {
    throw new Error("Không tìm thấy dự án.");
  }

  return repository.archiveProject(projectId, new Date().toISOString());
}

function buildDefaultLegalSteps(projectId: string, now: string): LegalStep[] {
  return DEFAULT_LEGAL_STEPS.map((step) => ({
    id: createId(),
    projectId,
    stepCode: step.code,
    stepName: step.name,
    status: "not_started",
    createdAt: now,
    updatedAt: now
  }));
}
