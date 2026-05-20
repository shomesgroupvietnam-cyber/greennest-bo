import type { ProjectRepository } from "@/modules/projects/services/project-repository";
import { projectRepository } from "@/modules/projects/services/project-repository";
import type {
  Document,
  DocumentApprovalInput,
  DocumentInput,
  DocumentListFilters,
  DocumentRejectionInput,
  DocumentUpdateInput
} from "@/modules/documents/types";
import {
  documentApprovalSchema,
  documentInputSchema,
  documentRejectionSchema,
  documentUpdateSchema
} from "@/modules/documents/validation";

import { documentRepository, type DocumentRepository } from "./document-repository";

function createId() {
  return crypto.randomUUID();
}

async function assertActiveProject(projectId: string, projects: ProjectRepository) {
  const project = await projects.getProject(projectId);

  if (!project || project.archivedAt) {
    throw new Error("Dự án không tồn tại hoặc đã được lưu trữ.");
  }

  return project;
}

export async function listDocuments(filters: DocumentListFilters = {}, repository: DocumentRepository = documentRepository) {
  return repository.listDocuments(filters);
}

export async function getDocument(documentId: string, repository: DocumentRepository = documentRepository) {
  return repository.getDocument(documentId);
}

export async function listDocumentVersions(documentId: string, repository: DocumentRepository = documentRepository) {
  return repository.listDocumentVersions(documentId);
}

export async function listMissingOrNeedsUpdateDocuments(
  filters: DocumentListFilters = {},
  repository: DocumentRepository = documentRepository
) {
  const documents = await repository.listDocuments(filters);

  return documents.filter((document) => document.status === "missing" || document.status === "needs_update");
}

export async function createDocument(
  input: DocumentInput,
  repository: DocumentRepository = documentRepository,
  projects: ProjectRepository = projectRepository
) {
  const parsedInput = documentInputSchema.parse(input);
  await assertActiveProject(parsedInput.projectId, projects);

  const now = new Date().toISOString();
  const document: Document = {
    id: createId(),
    projectId: parsedInput.projectId,
    title: parsedInput.title,
    docType: parsedInput.docType,
    fileUrl: parsedInput.fileUrl,
    externalUrl: parsedInput.externalUrl,
    version: parsedInput.version,
    status: parsedInput.status,
    ownerId: parsedInput.ownerId,
    approvalStatus: parsedInput.status === "in_review" ? "pending" : "not_submitted",
    createdAt: now,
    updatedAt: now
  };

  return repository.createDocument(document);
}

export async function updateDocument(
  documentId: string,
  input: DocumentUpdateInput,
  repository: DocumentRepository = documentRepository,
  projects: ProjectRepository = projectRepository
) {
  const parsedInput = documentUpdateSchema.parse(input);
  const existingDocument = await repository.getDocument(documentId);

  if (!existingDocument) {
    throw new Error("Không tìm thấy hồ sơ.");
  }

  await assertActiveProject(parsedInput.projectId, projects);

  return repository.updateDocument(documentId, {
    projectId: parsedInput.projectId,
    title: parsedInput.title,
    docType: parsedInput.docType,
    fileUrl: parsedInput.fileUrl,
    externalUrl: parsedInput.externalUrl,
    version: parsedInput.version,
    status: parsedInput.status,
    ownerId: parsedInput.ownerId,
    approvalStatus: existingDocument.approvalStatus,
    reviewerId: existingDocument.reviewerId,
    reviewedAt: existingDocument.reviewedAt,
    approvalNotes: existingDocument.approvalNotes,
    updatedAt: new Date().toISOString()
  });
}

export async function submitDocumentForReview(documentId: string, reviewerId?: string, repository: DocumentRepository = documentRepository) {
  const existingDocument = await repository.getDocument(documentId);

  if (!existingDocument) {
    throw new Error("Không tìm thấy hồ sơ.");
  }

  if (existingDocument.status === "missing") {
    throw new Error("Không thể gửi duyệt hồ sơ đang thiếu.");
  }

  return repository.updateDocument(documentId, {
    status: "in_review",
    approvalStatus: "pending",
    reviewerId,
    reviewedAt: undefined,
    approvalNotes: undefined,
    updatedAt: new Date().toISOString()
  });
}

export async function approveDocument(
  documentId: string,
  input: DocumentApprovalInput,
  repository: DocumentRepository = documentRepository
) {
  const parsedInput = documentApprovalSchema.parse(input);
  const existingDocument = await repository.getDocument(documentId);

  if (!existingDocument) {
    throw new Error("Không tìm thấy hồ sơ.");
  }

  return repository.updateDocument(documentId, {
    status: "complete",
    approvalStatus: "approved",
    reviewerId: parsedInput.reviewerId,
    reviewedAt: new Date().toISOString(),
    approvalNotes: parsedInput.approvalNotes,
    updatedAt: new Date().toISOString()
  });
}

export async function rejectDocument(
  documentId: string,
  input: DocumentRejectionInput,
  repository: DocumentRepository = documentRepository
) {
  const parsedInput = documentRejectionSchema.parse(input);
  const existingDocument = await repository.getDocument(documentId);

  if (!existingDocument) {
    throw new Error("Không tìm thấy hồ sơ.");
  }

  return repository.updateDocument(documentId, {
    status: "needs_update",
    approvalStatus: "rejected",
    reviewerId: parsedInput.reviewerId,
    reviewedAt: new Date().toISOString(),
    approvalNotes: parsedInput.approvalNotes,
    updatedAt: new Date().toISOString()
  });
}
