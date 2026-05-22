"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { assertCan } from "@/lib/permissions/can";
import { getScopedDocument, getScopedProject } from "@/lib/permissions/scoped-resources";
import {
  approveDocument,
  createDocument,
  getDocument,
  rejectDocument,
  submitDocumentForReview,
  updateDocument
} from "@/modules/documents/services/document-service";
import type { DocumentInput, DocumentUpdateInput } from "@/modules/documents/types";
import { createAuditLog } from "@/modules/users/services/user-service";

function readOptionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  return value.length > 0 ? value : undefined;
}

function formDataToDocumentInput(formData: FormData): DocumentInput {
  return {
    projectId: String(formData.get("projectId") ?? ""),
    title: String(formData.get("title") ?? ""),
    docType: String(formData.get("docType") ?? ""),
    classification: String(formData.get("classification") ?? "INTERNAL") as DocumentInput["classification"],
    fileUrl: readOptionalString(formData, "fileUrl"),
    externalUrl: readOptionalString(formData, "externalUrl"),
    version: String(formData.get("version") ?? "v1"),
    status: String(formData.get("status") ?? "draft") as DocumentInput["status"],
    ownerId: readOptionalString(formData, "ownerId")
  };
}

export async function createDocumentAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "document.create");
  const input = formDataToDocumentInput(formData);

  if (!(await getScopedProject(currentUser, input.projectId))) {
    throw new Error("Bạn không có quyền tạo hồ sơ cho dự án này.");
  }

  const document = await createDocument(input);
  await createAuditLog({
    actorId: currentUser.id,
    entityType: "document",
    entityId: document.id,
    action: "document.create",
    newValue: {
      projectId: document.projectId,
      status: document.status,
      approvalStatus: document.approvalStatus,
      classification: document.classification,
    }
  });

  revalidatePath("/documents");
  revalidatePath(`/projects/${document.projectId}`);
  redirect(`/documents/${document.id}`);
}

export async function updateDocumentAction(documentId: string, formData: FormData) {
  const currentUser = await getCurrentUser();
  const existingDocument = await getDocument(documentId);
  const scopedDocument = await getScopedDocument(currentUser, documentId);
  assertCan(currentUser, "document.update", existingDocument);
  const input = formDataToDocumentInput(formData);

  if (!scopedDocument || !(await getScopedProject(currentUser, input.projectId))) {
    throw new Error("Bạn không có quyền cập nhật hồ sơ hoặc dự án đích không thuộc phạm vi của bạn.");
  }

  const document = await updateDocument(documentId, input as DocumentUpdateInput);
  await createAuditLog({
    actorId: currentUser.id,
    entityType: "document",
    entityId: document.id,
    action: "document.update",
    oldValue: existingDocument,
    newValue: {
      status: document.status,
      version: document.version,
      approvalStatus: document.approvalStatus,
      classification: document.classification,
    }
  });

  revalidatePath("/documents");
  revalidatePath(`/documents/${document.id}`);
  revalidatePath(`/projects/${document.projectId}`);
  redirect(`/documents/${document.id}`);
}

export async function submitDocumentForReviewAction(documentId: string) {
  const currentUser = await getCurrentUser();
  const existingDocument = await getDocument(documentId);
  const scopedDocument = await getScopedDocument(currentUser, documentId);

  assertCan(currentUser, "document.update", existingDocument);

  if (!scopedDocument) {
    throw new Error("Bạn không có quyền gửi duyệt hồ sơ này.");
  }

  const document = await submitDocumentForReview(documentId);
  await createAuditLog({
    actorId: currentUser.id,
    entityType: "document",
    entityId: document.id,
    action: "document.submit_for_review",
    oldValue: { status: existingDocument?.status, approvalStatus: existingDocument?.approvalStatus },
    newValue: { status: document.status, approvalStatus: document.approvalStatus }
  });

  revalidatePath("/documents");
  revalidatePath(`/documents/${document.id}`);
  revalidatePath(`/projects/${document.projectId}`);
  redirect(`/documents/${document.id}`);
}

export async function approveDocumentAction(documentId: string, formData: FormData) {
  const currentUser = await getCurrentUser();
  const existingDocument = await getDocument(documentId);
  const scopedDocument = await getScopedDocument(currentUser, documentId);

  assertCan(currentUser, "document.approve", existingDocument);

  if (!scopedDocument) {
    throw new Error("Bạn không có quyền duyệt hồ sơ này.");
  }

  const document = await approveDocument(documentId, {
    reviewerId: currentUser.id,
    approvalNotes: readOptionalString(formData, "approvalNotes")
  });
  await createAuditLog({
    actorId: currentUser.id,
    entityType: "document",
    entityId: document.id,
    action: "document.approve",
    oldValue: { status: existingDocument?.status, approvalStatus: existingDocument?.approvalStatus },
    newValue: { status: document.status, approvalStatus: document.approvalStatus, approvalNotes: document.approvalNotes }
  });

  revalidatePath("/documents");
  revalidatePath(`/documents/${document.id}`);
  revalidatePath(`/projects/${document.projectId}`);
  redirect(`/documents/${document.id}`);
}

export async function rejectDocumentAction(documentId: string, formData: FormData) {
  const currentUser = await getCurrentUser();
  const existingDocument = await getDocument(documentId);
  const scopedDocument = await getScopedDocument(currentUser, documentId);

  assertCan(currentUser, "document.approve", existingDocument);

  if (!scopedDocument) {
    throw new Error("Bạn không có quyền yêu cầu cập nhật hồ sơ này.");
  }

  const document = await rejectDocument(documentId, {
    reviewerId: currentUser.id,
    approvalNotes: String(formData.get("approvalNotes") ?? "")
  });
  await createAuditLog({
    actorId: currentUser.id,
    entityType: "document",
    entityId: document.id,
    action: "document.reject",
    oldValue: { status: existingDocument?.status, approvalStatus: existingDocument?.approvalStatus },
    newValue: { status: document.status, approvalStatus: document.approvalStatus, approvalNotes: document.approvalNotes }
  });

  revalidatePath("/documents");
  revalidatePath(`/documents/${document.id}`);
  revalidatePath(`/projects/${document.projectId}`);
  redirect(`/documents/${document.id}`);
}
