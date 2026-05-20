import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { JsonDocumentRepository } from "@/modules/documents/services/document-repository";
import {
  createDocument,
  listDocuments,
  listMissingOrNeedsUpdateDocuments,
  updateDocument
} from "@/modules/documents/services/document-service";
import { JsonProjectRepository } from "@/modules/projects/services/project-repository";
import { archiveProject, createProject } from "@/modules/projects/services/project-service";

let tempDir: string;
let projectRepository: JsonProjectRepository;
let documentRepository: JsonDocumentRepository;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-documents-"));
  projectRepository = new JsonProjectRepository(path.join(tempDir, "project-core.json"));
  documentRepository = new JsonDocumentRepository(path.join(tempDir, "document-center.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("document service", () => {
  it("creates an external URL document linked to an existing project", async () => {
    const project = await createProject({ name: "GreenNest Central", status: "planning" }, projectRepository);

    const document = await createDocument(
      {
        projectId: project.id,
        title: "Giấy phép xây dựng",
        docType: "construction_permit",
        externalUrl: "https://example.com/permit.pdf",
        version: "v1",
        status: "draft",
        ownerId: "legal-manager"
      },
      documentRepository,
      projectRepository
    );

    expect(document.projectId).toBe(project.id);
    expect(document.externalUrl).toBe("https://example.com/permit.pdf");
    expect(document.ownerId).toBe("legal-manager");
  });

  it("rejects documents for missing or archived projects", async () => {
    await expect(
      createDocument(
        {
          projectId: "missing-project",
          title: "Hồ sơ sai dự án",
          docType: "legal_submission",
          externalUrl: "https://example.com/document.pdf",
          version: "v1",
          status: "draft"
        },
        documentRepository,
        projectRepository
      )
    ).rejects.toThrow("Dự án không tồn tại");

    const project = await createProject({ name: "GreenNest Archive", status: "active" }, projectRepository);
    await archiveProject(project.id, projectRepository);

    await expect(
      createDocument(
        {
          projectId: project.id,
          title: "Hồ sơ dự án lưu trữ",
          docType: "legal_submission",
          externalUrl: "https://example.com/document.pdf",
          version: "v1",
          status: "draft"
        },
        documentRepository,
        projectRepository
      )
    ).rejects.toThrow("Dự án không tồn tại");
  });

  it("filters documents by project, status, type and owner", async () => {
    const firstProject = await createProject({ name: "GreenNest One", status: "active" }, projectRepository);
    const secondProject = await createProject({ name: "GreenNest Two", status: "active" }, projectRepository);

    await createDocument(
      {
        projectId: firstProject.id,
        title: "Bản vẽ cần cập nhật",
        docType: "design_drawing",
        externalUrl: "https://example.com/design.pdf",
        version: "v2",
        status: "needs_update",
        ownerId: "designer"
      },
      documentRepository,
      projectRepository
    );
    await createDocument(
      {
        projectId: secondProject.id,
        title: "Hợp đồng đã đủ",
        docType: "contract",
        externalUrl: "https://example.com/contract.pdf",
        version: "v1",
        status: "complete",
        ownerId: "accountant"
      },
      documentRepository,
      projectRepository
    );

    const filtered = await listDocuments(
      {
        projectId: firstProject.id,
        status: "needs_update",
        docType: "design_drawing",
        ownerId: "designer"
      },
      documentRepository
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toBe("Bản vẽ cần cập nhật");
  });

  it("updates metadata and highlights missing or needs-update documents", async () => {
    const project = await createProject({ name: "GreenNest Garden", status: "active" }, projectRepository);
    const missingDocument = await createDocument(
      {
        projectId: project.id,
        title: "Hồ sơ còn thiếu",
        docType: "legal_submission",
        version: "v1",
        status: "missing"
      },
      documentRepository,
      projectRepository
    );

    const updatedDocument = await updateDocument(
      missingDocument.id,
      {
        projectId: project.id,
        title: "Hồ sơ đã bổ sung",
        docType: "legal_submission",
        externalUrl: "https://example.com/submission.pdf",
        version: "v2",
        status: "needs_update",
        ownerId: "legal-manager"
      },
      documentRepository,
      projectRepository
    );
    const attentionDocuments = await listMissingOrNeedsUpdateDocuments({ projectId: project.id }, documentRepository);

    expect(updatedDocument.version).toBe("v2");
    expect(updatedDocument.status).toBe("needs_update");
    expect(attentionDocuments.map((document) => document.id)).toEqual([missingDocument.id]);
  });
});

