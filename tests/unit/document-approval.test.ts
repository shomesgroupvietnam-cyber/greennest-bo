import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { can } from "@/lib/permissions/can";
import { JsonDocumentRequirementRepository } from "@/modules/documents/services/document-requirement-repository";
import { JsonDocumentRepository } from "@/modules/documents/services/document-repository";
import {
  approveDocument,
  createDocument,
  listDocumentVersions,
  rejectDocument,
  submitDocumentForReview
} from "@/modules/documents/services/document-service";
import { getProjectDocumentReadiness } from "@/modules/documents/services/document-readiness-service";
import type { DocumentRequirementTemplate } from "@/modules/documents/types";
import { JsonProjectRepository } from "@/modules/projects/services/project-repository";
import { createProject } from "@/modules/projects/services/project-service";

let tempDir: string;
let projectRepository: JsonProjectRepository;
let documentRepository: JsonDocumentRepository;
let requirementRepository: JsonDocumentRequirementRepository;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-doc-approval-"));
  projectRepository = new JsonProjectRepository(path.join(tempDir, "project-core.json"));
  documentRepository = new JsonDocumentRepository(path.join(tempDir, "document-center.json"));
  requirementRepository = new JsonDocumentRequirementRepository(path.join(tempDir, "document-requirements.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

function requirement(patch: Partial<DocumentRequirementTemplate>): DocumentRequirementTemplate {
  const now = "2026-05-17T00:00:00.000Z";

  return {
    id: patch.id ?? crypto.randomUUID(),
    projectType: patch.projectType ?? "default",
    requirementCode: patch.requirementCode ?? "REQ",
    requirementName: patch.requirementName ?? "Hồ sơ bắt buộc",
    docType: patch.docType ?? "legal_submission",
    isRequired: patch.isRequired ?? true,
    orderIndex: patch.orderIndex ?? 1,
    createdAt: now,
    updatedAt: now
  };
}

describe("document approval workflow", () => {
  it("submits, approves and records version history", async () => {
    const project = await createProject({ name: "GreenNest Approval", status: "active" }, projectRepository);
    const document = await createDocument(
      {
        projectId: project.id,
        title: "Hồ sơ xin phép",
        docType: "construction_permit",
        externalUrl: "https://example.com/permit.pdf",
        version: "v1",
        status: "draft",
        ownerId: "assistant-01"
      },
      documentRepository,
      projectRepository
    );

    const submittedDocument = await submitDocumentForReview(document.id, undefined, documentRepository);
    const approvedDocument = await approveDocument(
      document.id,
      {
        reviewerId: "admin",
        approvalNotes: "Đã kiểm tra metadata và link."
      },
      documentRepository
    );
    const versions = await listDocumentVersions(document.id, documentRepository);

    expect(submittedDocument.status).toBe("in_review");
    expect(submittedDocument.approvalStatus).toBe("pending");
    expect(approvedDocument.status).toBe("complete");
    expect(approvedDocument.approvalStatus).toBe("approved");
    expect(approvedDocument.reviewerId).toBe("admin");
    expect(approvedDocument.reviewedAt).toBeDefined();
    expect(versions.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects with notes and keeps readiness incomplete until an approved document exists", async () => {
    const project = await createProject({ name: "GreenNest Readiness", status: "active" }, projectRepository);
    await requirementRepository.upsertRequirement(
      requirement({
        requirementCode: "PERMIT",
        requirementName: "Giấy phép xây dựng",
        docType: "construction_permit"
      })
    );
    const document = await createDocument(
      {
        projectId: project.id,
        title: "Giấy phép cần sửa",
        docType: "construction_permit",
        externalUrl: "https://example.com/permit.pdf",
        version: "v1",
        status: "draft"
      },
      documentRepository,
      projectRepository
    );

    await rejectDocument(
      document.id,
      {
        reviewerId: "admin",
        approvalNotes: "Thiếu trang xác nhận của cơ quan."
      },
      documentRepository
    );
    const readiness = await getProjectDocumentReadiness(project.id, {
      projects: projectRepository,
      documents: documentRepository,
      requirements: requirementRepository
    });

    expect(readiness.completedRequiredCount).toBe(0);
    expect(readiness.needsUpdateRequirements.map((item) => item.requirement.requirementCode)).toEqual(["PERMIT"]);
    expect(readiness.completionRatio).toBe(0);
  });

  it("requires document.approve permission for approval decisions", () => {
    expect(can({ id: "super-admin", role: "super_admin" }, "document.approve")).toBe(true);
    expect(can({ id: "ceo", role: "tong_giam_doc" }, "document.approve")).toBe(true);
    expect(can({ id: "admin", role: "admin" }, "document.approve")).toBe(false);
    expect(can({ id: "viewer", role: "viewer" }, "document.approve")).toBe(false);
    expect(can({ id: "assistant", role: "thu_ky_tro_ly" }, "document.approve")).toBe(false);
  });
});
