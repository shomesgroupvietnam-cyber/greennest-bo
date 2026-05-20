import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createProject, archiveProject, listProjectLegalSteps, updateProject } from "@/modules/projects/services/project-service";
import { JsonProjectRepository } from "@/modules/projects/services/project-repository";

let tempDir: string;
let repository: JsonProjectRepository;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-projects-"));
  repository = new JsonProjectRepository(path.join(tempDir, "project-core.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("project service", () => {
  it("creates a project with generated unique code and default legal checklist", async () => {
    const project = await createProject(
      {
        name: "GreenNest Riverside",
        location: "TP. Thủ Đức",
        status: "planning"
      },
      repository
    );

    const legalSteps = await listProjectLegalSteps(project.id, repository);

    expect(project.code).toMatch(/^GN-\d{4}-001$/);
    expect(legalSteps).toHaveLength(12);
    expect(legalSteps.every((step) => step.projectId === project.id)).toBe(true);
    expect(legalSteps.every((step) => step.status === "not_started")).toBe(true);
  });

  it("updates project info and archives without hard delete", async () => {
    const project = await createProject(
      {
        code: "gn custom 01",
        name: "Dự án ban đầu",
        status: "planning"
      },
      repository
    );

    const updatedProject = await updateProject(
      project.id,
      {
        code: "GN-CUSTOM-01",
        name: "Dự án cập nhật",
        investor: "GreenNest",
        status: "active"
      },
      repository
    );

    const archivedProject = await archiveProject(project.id, repository);
    const legalSteps = await listProjectLegalSteps(project.id, repository);

    expect(updatedProject.name).toBe("Dự án cập nhật");
    expect(updatedProject.status).toBe("active");
    expect(archivedProject.archivedAt).toBeDefined();
    expect(archivedProject.status).toBe("archived");
    expect(await repository.getProject(project.id)).toBeDefined();
    expect(legalSteps).toHaveLength(12);
  });
});
