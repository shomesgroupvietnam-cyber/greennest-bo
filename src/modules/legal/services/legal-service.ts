import type { DocumentRepository } from "@/modules/documents/services/document-repository";
import { documentRepository } from "@/modules/documents/services/document-repository";
import type { LegalStepListFilters, LegalStepUpdateInput } from "@/modules/legal/types";
import { legalStepUpdateSchema } from "@/modules/legal/validation";
import type { ProjectRepository } from "@/modules/projects/services/project-repository";
import { projectRepository } from "@/modules/projects/services/project-repository";

import { legalRepository, type LegalRepository } from "./legal-repository";

async function assertActiveProject(projectId: string, projects: ProjectRepository) {
  const project = await projects.getProject(projectId);

  if (!project || project.archivedAt) {
    throw new Error("Dự án không tồn tại hoặc đã được lưu trữ.");
  }

  return project;
}

async function assertProjectDocuments(projectId: string, documentIds: string[], documents: DocumentRepository) {
  const uniqueDocumentIds = [...new Set(documentIds)];

  for (const documentId of uniqueDocumentIds) {
    const document = await documents.getDocument(documentId);

    if (!document || document.projectId !== projectId) {
      throw new Error("Hồ sơ liên kết không thuộc dự án của bước pháp lý.");
    }
  }

  return uniqueDocumentIds;
}

export async function listLegalSteps(
  filters: LegalStepListFilters = {},
  repository: LegalRepository = legalRepository,
  projects: ProjectRepository = projectRepository
) {
  const steps = await repository.listLegalSteps(filters);
  const projectCache = new Map<string, boolean>();

  const validSteps = await Promise.all(
    steps.map(async (step) => {
      if (!projectCache.has(step.projectId)) {
        projectCache.set(step.projectId, Boolean(await projects.getProject(step.projectId)));
      }

      return projectCache.get(step.projectId) ? step : undefined;
    })
  );

  return validSteps.filter((step) => step !== undefined);
}

export async function getLegalStep(stepId: string, repository: LegalRepository = legalRepository) {
  return repository.getLegalStep(stepId);
}

export async function getBlockedLegalSteps(filters: LegalStepListFilters = {}, repository: LegalRepository = legalRepository) {
  return repository.listLegalSteps({ ...filters, status: "blocked" });
}

export async function updateLegalStep(
  stepId: string,
  input: LegalStepUpdateInput,
  repository: LegalRepository = legalRepository,
  projects: ProjectRepository = projectRepository,
  documents: DocumentRepository = documentRepository
) {
  const parsedInput = legalStepUpdateSchema.parse(input);
  const existingStep = await repository.getLegalStep(stepId);

  if (!existingStep) {
    throw new Error("Không tìm thấy bước pháp lý.");
  }

  await assertActiveProject(existingStep.projectId, projects);
  const relatedDocumentIds = parsedInput.relatedDocumentIds
    ? await assertProjectDocuments(existingStep.projectId, parsedInput.relatedDocumentIds, documents)
    : [];

  return repository.updateLegalStep(stepId, {
    status: parsedInput.status,
    assigneeId: parsedInput.assigneeId,
    dueDate: parsedInput.dueDate,
    completedDate: parsedInput.completedDate,
    notes: parsedInput.notes,
    relatedDocumentIds,
    updatedAt: new Date().toISOString()
  });
}

