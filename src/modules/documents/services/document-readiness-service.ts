import type { LegalStep } from "@/modules/legal/types";
import type { ProjectRepository } from "@/modules/projects/services/project-repository";
import { projectRepository } from "@/modules/projects/services/project-repository";
import type { Project } from "@/modules/projects/types";
import type {
  Document,
  DocumentRequirementListFilters,
  DocumentRequirementReadinessItem,
  DocumentRequirementTemplate,
  ProjectDocumentReadiness
} from "@/modules/documents/types";
import { documentRepository, type DocumentRepository } from "./document-repository";
import {
  documentRequirementRepository,
  type DocumentRequirementRepository
} from "./document-requirement-repository";

export const DEFAULT_DOCUMENT_REQUIREMENT_PROJECT_TYPE = "default";

type ReadinessInput = {
  project: Project;
  requirements: DocumentRequirementTemplate[];
  documents: Document[];
  legalSteps?: LegalStep[];
};

type ReadinessRepositories = {
  projects?: ProjectRepository;
  documents?: DocumentRepository;
  requirements?: DocumentRequirementRepository;
};

function matchesProjectType(requirement: DocumentRequirementTemplate, projectType?: string) {
  return (
    requirement.projectType === DEFAULT_DOCUMENT_REQUIREMENT_PROJECT_TYPE ||
    (Boolean(projectType) && requirement.projectType.trim().toLowerCase() === projectType?.trim().toLowerCase())
  );
}

function resolveItemStatus(requirement: DocumentRequirementTemplate, matchingDocuments: Document[]) {
  if (matchingDocuments.some((document) => document.status === "complete" && document.approvalStatus === "approved")) {
    return "complete";
  }

  if (matchingDocuments.some((document) => document.status === "needs_update" || document.approvalStatus === "rejected")) {
    return "needs_update";
  }

  if (matchingDocuments.length > 0) {
    return "submitted";
  }

  return requirement.isRequired ? "missing" : "optional_missing";
}

export function calculateProjectDocumentReadiness({
  project,
  requirements,
  documents,
  legalSteps = []
}: ReadinessInput): ProjectDocumentReadiness {
  const legalStepByCode = new Map<string, string>(legalSteps.map((step) => [step.stepCode, step.stepName]));
  const projectRequirements = requirements
    .filter((requirement) => matchesProjectType(requirement, project.projectType))
    .sort((a, b) => a.orderIndex - b.orderIndex || a.requirementName.localeCompare(b.requirementName, "vi"));

  const items: DocumentRequirementReadinessItem[] = projectRequirements.map((requirement) => {
    const matchingDocuments = documents.filter((document) => document.projectId === project.id && document.docType === requirement.docType);

    return {
      requirement,
      matchingDocuments,
      status: resolveItemStatus(requirement, matchingDocuments),
      relatedLegalStepName: requirement.legalStepCode ? legalStepByCode.get(requirement.legalStepCode) : undefined
    };
  });
  const requiredItems = items.filter((item) => item.requirement.isRequired);
  const completedRequiredCount = requiredItems.filter((item) => item.status === "complete").length;
  const submittedRequiredCount = requiredItems.filter((item) => item.matchingDocuments.length > 0).length;

  return {
    projectId: project.id,
    projectType: project.projectType,
    requiredCount: requiredItems.length,
    completedRequiredCount,
    submittedRequiredCount,
    missingRequirements: requiredItems.filter((item) => item.status === "missing"),
    needsUpdateRequirements: requiredItems.filter((item) => item.status === "needs_update"),
    items,
    completionRatio: requiredItems.length > 0 ? Math.round((completedRequiredCount / requiredItems.length) * 100) : 0
  };
}

export async function listDocumentRequirements(
  filters: DocumentRequirementListFilters = {},
  repository: DocumentRequirementRepository = documentRequirementRepository
) {
  return repository.listRequirements(filters);
}

export async function getProjectDocumentReadiness(
  projectId: string,
  repositories: ReadinessRepositories = {}
) {
  const projects = repositories.projects ?? projectRepository;
  const documents = repositories.documents ?? documentRepository;
  const requirements = repositories.requirements ?? documentRequirementRepository;
  const project = await projects.getProject(projectId);

  if (!project || project.archivedAt) {
    throw new Error("Du an khong ton tai hoac da duoc luu tru.");
  }

  const [projectDocuments, legalSteps, requirementTemplates] = await Promise.all([
    documents.listDocuments({ projectId }),
    projects.listLegalSteps(projectId),
    requirements.listRequirements()
  ]);

  return calculateProjectDocumentReadiness({
    project,
    requirements: requirementTemplates,
    documents: projectDocuments,
    legalSteps
  });
}
