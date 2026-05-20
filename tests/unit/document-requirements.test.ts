import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { JsonDocumentRequirementRepository } from "@/modules/documents/services/document-requirement-repository";
import { JsonDocumentRepository } from "@/modules/documents/services/document-repository";
import { approveDocument, createDocument } from "@/modules/documents/services/document-service";
import {
  calculateProjectDocumentReadiness,
  getProjectDocumentReadiness
} from "@/modules/documents/services/document-readiness-service";
import type { DocumentRequirementTemplate } from "@/modules/documents/types";
import { JsonProjectRepository } from "@/modules/projects/services/project-repository";
import { createProject } from "@/modules/projects/services/project-service";

let tempDir: string;
let projectRepository: JsonProjectRepository;
let documentRepository: JsonDocumentRepository;
let requirementRepository: JsonDocumentRequirementRepository;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-doc-requirements-"));
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
    requiredPhase: patch.requiredPhase,
    legalStepCode: patch.legalStepCode,
    isRequired: patch.isRequired ?? true,
    orderIndex: patch.orderIndex ?? 1,
    createdAt: now,
    updatedAt: now
  };
}

describe("document requirement readiness", () => {
  it("maps project type requirements and detects missing required documents", async () => {
    const project = await createProject(
      { name: "GreenNest Legal", status: "active", projectType: "Khu nhà ở thấp tầng" },
      projectRepository
    );
    await requirementRepository.upsertRequirement(
      requirement({
        projectType: "Khu nhà ở thấp tầng",
        requirementCode: "PERMIT",
        requirementName: "Giấy phép xây dựng",
        docType: "construction_permit"
      })
    );

    const readiness = await getProjectDocumentReadiness(project.id, {
      projects: projectRepository,
      documents: documentRepository,
      requirements: requirementRepository
    });

    expect(readiness.requiredCount).toBe(1);
    expect(readiness.missingRequirements.map((item) => item.requirement.requirementCode)).toEqual(["PERMIT"]);
    expect(readiness.completionRatio).toBe(0);
  });

  it("treats an existing complete document as satisfying a requirement by docType", async () => {
    const project = await createProject(
      { name: "GreenNest Complete", status: "active", projectType: "Chung cư trung tầng" },
      projectRepository
    );
    await requirementRepository.upsertRequirement(
      requirement({
        projectType: "Chung cư trung tầng",
        requirementCode: "LAND",
        requirementName: "Giấy chứng nhận quyền sử dụng đất",
        docType: "land_certificate"
      })
    );
    const document = await createDocument(
      {
        projectId: project.id,
        title: "Sổ đỏ dự án",
        docType: "land_certificate",
        externalUrl: "https://example.com/land.pdf",
        version: "v1",
        status: "complete"
      },
      documentRepository,
      projectRepository
    );
    await approveDocument(document.id, { reviewerId: "admin" }, documentRepository);

    const readiness = await getProjectDocumentReadiness(project.id, {
      projects: projectRepository,
      documents: documentRepository,
      requirements: requirementRepository
    });

    expect(readiness.completedRequiredCount).toBe(1);
    expect(readiness.missingRequirements).toEqual([]);
    expect(readiness.completionRatio).toBe(100);
  });

  it("surfaces needs-update requirements and keeps default requirements available", async () => {
    const project = await createProject({ name: "GreenNest Update", status: "active", projectType: "Nhà phố" }, projectRepository);
    await requirementRepository.upsertRequirement(
      requirement({
        projectType: "default",
        requirementCode: "DESIGN",
        requirementName: "Bản vẽ thiết kế",
        docType: "design_drawing"
      })
    );
    await createDocument(
      {
        projectId: project.id,
        title: "Bản vẽ cần cập nhật",
        docType: "design_drawing",
        externalUrl: "https://example.com/design.pdf",
        version: "v1",
        status: "needs_update"
      },
      documentRepository,
      projectRepository
    );

    const readiness = await getProjectDocumentReadiness(project.id, {
      projects: projectRepository,
      documents: documentRepository,
      requirements: requirementRepository
    });

    expect(readiness.submittedRequiredCount).toBe(1);
    expect(readiness.needsUpdateRequirements.map((item) => item.requirement.requirementCode)).toEqual(["DESIGN"]);
    expect(readiness.completionRatio).toBe(0);
  });

  it("links legal step names when requirement references a legal step", async () => {
    const project = await createProject({ name: "GreenNest Legal Link", status: "active" }, projectRepository);
    const legalSteps = await projectRepository.listLegalSteps(project.id);

    const readiness = calculateProjectDocumentReadiness({
      project,
      requirements: [
        requirement({
          requirementCode: "LEGAL-SUBMISSION",
          requirementName: "Hồ sơ nộp cơ quan",
          docType: "legal_submission",
          legalStepCode: legalSteps[0]?.stepCode
        })
      ],
      documents: [],
      legalSteps
    });

    expect(readiness.items[0]?.relatedLegalStepName).toBe(legalSteps[0]?.stepName);
  });
});
