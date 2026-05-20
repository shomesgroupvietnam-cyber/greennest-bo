import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { JsonDocumentRepository } from "@/modules/documents/services/document-repository";
import { createDocument } from "@/modules/documents/services/document-service";
import { JsonLegalRepository } from "@/modules/legal/services/legal-repository";
import { getBlockedLegalSteps, listLegalSteps, updateLegalStep } from "@/modules/legal/services/legal-service";
import { JsonProjectRepository } from "@/modules/projects/services/project-repository";
import { archiveProject, createProject, listProjectLegalSteps } from "@/modules/projects/services/project-service";

let tempDir: string;
let projectRepository: JsonProjectRepository;
let legalRepository: JsonLegalRepository;
let documentRepository: JsonDocumentRepository;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-legal-"));
  projectRepository = new JsonProjectRepository(path.join(tempDir, "project-core.json"));
  legalRepository = new JsonLegalRepository(path.join(tempDir, "project-core.json"));
  documentRepository = new JsonDocumentRepository(path.join(tempDir, "document-center.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("legal service", () => {
  it("reuses the 12 default legal steps initialized by project creation", async () => {
    const project = await createProject({ name: "GreenNest Legal", status: "planning" }, projectRepository);

    const stepsFromProject = await listProjectLegalSteps(project.id, projectRepository);
    const stepsFromLegal = await listLegalSteps({ projectId: project.id }, legalRepository, projectRepository);

    expect(stepsFromProject).toHaveLength(12);
    expect(stepsFromLegal).toHaveLength(12);
    expect(stepsFromLegal.map((step) => step.stepCode)).toEqual(stepsFromProject.map((step) => step.stepCode));
  });

  it("updates status, assignee, dates, notes and linked project documents", async () => {
    const project = await createProject({ name: "GreenNest Riverside", status: "active" }, projectRepository);
    const [step] = await listLegalSteps({ projectId: project.id }, legalRepository, projectRepository);
    const document = await createDocument(
      {
        projectId: project.id,
        title: "Hồ sơ pháp lý",
        docType: "legal_submission",
        externalUrl: "https://example.com/legal.pdf",
        version: "v1",
        status: "complete"
      },
      documentRepository,
      projectRepository
    );

    const updatedStep = await updateLegalStep(
      step.id,
      {
        status: "in_progress",
        assigneeId: "legal-manager",
        dueDate: "2026-06-01",
        completedDate: "2026-06-10",
        notes: "Đã nộp hồ sơ lần 1.",
        relatedDocumentIds: [document.id]
      },
      legalRepository,
      projectRepository,
      documentRepository
    );

    expect(updatedStep.status).toBe("in_progress");
    expect(updatedStep.assigneeId).toBe("legal-manager");
    expect(updatedStep.dueDate).toBe("2026-06-01");
    expect(updatedStep.completedDate).toBe("2026-06-10");
    expect(updatedStep.relatedDocumentIds).toEqual([document.id]);
  });

  it("requires notes when a legal step is blocked", async () => {
    const project = await createProject({ name: "GreenNest Blocked", status: "active" }, projectRepository);
    const [step] = await listLegalSteps({ projectId: project.id }, legalRepository, projectRepository);

    await expect(
      updateLegalStep(
        step.id,
        {
          status: "blocked"
        },
        legalRepository,
        projectRepository,
        documentRepository
      )
    ).rejects.toThrow("ghi chú");
  });

  it("filters by project, status and assignee and exposes blocked steps", async () => {
    const firstProject = await createProject({ name: "GreenNest One", status: "active" }, projectRepository);
    const secondProject = await createProject({ name: "GreenNest Two", status: "active" }, projectRepository);
    const [firstStep] = await listLegalSteps({ projectId: firstProject.id }, legalRepository, projectRepository);
    const [secondStep] = await listLegalSteps({ projectId: secondProject.id }, legalRepository, projectRepository);

    await updateLegalStep(
      firstStep.id,
      {
        status: "blocked",
        assigneeId: "legal-manager",
        notes: "Chờ bổ sung quy hoạch."
      },
      legalRepository,
      projectRepository,
      documentRepository
    );
    await updateLegalStep(
      secondStep.id,
      {
        status: "waiting_authority",
        assigneeId: "assistant"
      },
      legalRepository,
      projectRepository,
      documentRepository
    );

    const filteredSteps = await listLegalSteps(
      {
        projectId: firstProject.id,
        status: "blocked",
        assigneeId: "legal-manager"
      },
      legalRepository,
      projectRepository
    );
    const blockedSteps = await getBlockedLegalSteps({ projectId: firstProject.id }, legalRepository);

    expect(filteredSteps.map((step) => step.id)).toEqual([firstStep.id]);
    expect(blockedSteps.map((step) => step.id)).toEqual([firstStep.id]);
  });

  it("rejects updates for archived projects and documents from another project", async () => {
    const firstProject = await createProject({ name: "GreenNest Active", status: "active" }, projectRepository);
    const secondProject = await createProject({ name: "GreenNest Other", status: "active" }, projectRepository);
    const [firstStep] = await listLegalSteps({ projectId: firstProject.id }, legalRepository, projectRepository);
    const [secondStep] = await listLegalSteps({ projectId: secondProject.id }, legalRepository, projectRepository);
    const otherDocument = await createDocument(
      {
        projectId: secondProject.id,
        title: "Hồ sơ dự án khác",
        docType: "legal_submission",
        externalUrl: "https://example.com/other.pdf",
        version: "v1",
        status: "complete"
      },
      documentRepository,
      projectRepository
    );

    await expect(
      updateLegalStep(
        firstStep.id,
        {
          status: "in_progress",
          relatedDocumentIds: [otherDocument.id]
        },
        legalRepository,
        projectRepository,
        documentRepository
      )
    ).rejects.toThrow("không thuộc dự án");

    await archiveProject(secondProject.id, projectRepository);

    await expect(
      updateLegalStep(
        secondStep.id,
        {
          status: "in_progress"
        },
        legalRepository,
        projectRepository,
        documentRepository
      )
    ).rejects.toThrow("Dự án không tồn tại");
  });
});

