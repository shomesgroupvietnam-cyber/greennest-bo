import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { JsonDocumentRequirementRepository } from "@/modules/documents/services/document-requirement-repository";
import { JsonDocumentRepository } from "@/modules/documents/services/document-repository";
import { createDocument, rejectDocument } from "@/modules/documents/services/document-service";
import type { DocumentRequirementTemplate } from "@/modules/documents/types";
import { JsonLegalRepository } from "@/modules/legal/services/legal-repository";
import { listLegalSteps, updateLegalStep } from "@/modules/legal/services/legal-service";
import { JsonMeetingRepository } from "@/modules/meetings/services/meeting-repository";
import { createDecision, createMeeting } from "@/modules/meetings/services/meeting-service";
import { JsonProjectRepository } from "@/modules/projects/services/project-repository";
import { createProject } from "@/modules/projects/services/project-service";
import { JsonReportRepository } from "@/modules/reports/services/report-repository";
import { buildReportSnapshot, generateReport } from "@/modules/reports/services/report-service";
import { JsonTaskRepository } from "@/modules/tasks/services/task-repository";
import { createTask } from "@/modules/tasks/services/task-service";

let tempDir: string;
let projectRepository: JsonProjectRepository;
let taskRepository: JsonTaskRepository;
let documentRepository: JsonDocumentRepository;
let requirementRepository: JsonDocumentRequirementRepository;
let legalRepository: JsonLegalRepository;
let meetingRepository: JsonMeetingRepository;
let reportRepository: JsonReportRepository;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-reports-"));
  projectRepository = new JsonProjectRepository(path.join(tempDir, "project-core.json"));
  taskRepository = new JsonTaskRepository(path.join(tempDir, "task-management.json"));
  documentRepository = new JsonDocumentRepository(path.join(tempDir, "document-center.json"));
  requirementRepository = new JsonDocumentRequirementRepository(path.join(tempDir, "document-requirements.json"));
  legalRepository = new JsonLegalRepository(path.join(tempDir, "project-core.json"));
  meetingRepository = new JsonMeetingRepository(path.join(tempDir, "meetings-decisions.json"));
  reportRepository = new JsonReportRepository(path.join(tempDir, "reports.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

const repositories = () => ({
  projects: projectRepository,
  tasks: taskRepository,
  documents: documentRepository,
  requirements: requirementRepository,
  legal: legalRepository,
  meetings: meetingRepository,
  reports: reportRepository
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

async function seedReportData() {
  const project = await createProject({ name: "GreenNest Reporting", status: "active", projectType: "lowrise" }, projectRepository);

  await requirementRepository.upsertRequirement(
    requirement({
      projectType: "lowrise",
      requirementCode: "LAND",
      requirementName: "Hồ sơ pháp lý quỹ đất",
      docType: "land_record",
      orderIndex: 1
    })
  );
  await requirementRepository.upsertRequirement(
    requirement({
      projectType: "lowrise",
      requirementCode: "DESIGN",
      requirementName: "Bản vẽ thiết kế cơ sở",
      docType: "design_drawing",
      orderIndex: 2
    })
  );

  await createTask(
    {
      projectId: project.id,
      title: "Việc quá hạn",
      dueDate: "2026-05-10",
      status: "in_progress",
      priority: "urgent"
    },
    taskRepository,
    projectRepository
  );
  await createTask(
    {
      projectId: project.id,
      title: "Việc sắp đến hạn",
      dueDate: "2026-05-18",
      status: "todo",
      priority: "high"
    },
    taskRepository,
    projectRepository
  );

  const needsUpdateDocument = await createDocument(
    {
      projectId: project.id,
      title: "Hồ sơ cần cập nhật",
      docType: "land_record",
      externalUrl: "https://example.com/land.pdf",
      version: "v1",
      status: "needs_update"
    },
    documentRepository,
    projectRepository
  );
  await rejectDocument(
    needsUpdateDocument.id,
    {
      reviewerId: "director-01",
      approvalNotes: "Cần bổ sung trước khi tính hoàn tất."
    },
    documentRepository
  );

  const legalSteps = await listLegalSteps({ projectId: project.id }, legalRepository, projectRepository);
  await updateLegalStep(
    legalSteps[0].id,
    { status: "blocked", notes: "Thiếu phản hồi từ cơ quan thẩm định." },
    legalRepository,
    projectRepository,
    documentRepository
  );
  await updateLegalStep(
    legalSteps[1].id,
    { status: "waiting_authority" },
    legalRepository,
    projectRepository,
    documentRepository
  );

  const meeting = await createMeeting(
    {
      projectId: project.id,
      title: "Họp giao ban tuần",
      meetingDate: "2026-05-16T09:00",
      summary: "Rà soát pháp lý và hồ sơ."
    },
    "assistant-01",
    meetingRepository,
    projectRepository
  );
  await createDecision(
    {
      meetingId: meeting.id,
      decisionText: "Bổ sung hồ sơ đất.",
      ownerId: "legal-01",
      dueDate: "2026-05-20",
      status: "open"
    },
    meetingRepository
  );

  return project;
}

describe("report service", () => {
  it("builds report snapshots from existing structured data", async () => {
    const project = await seedReportData();

    const snapshot = await buildReportSnapshot(project.id, repositories(), {
      today: new Date(2026, 4, 16)
    });

    expect(snapshot.summary.totalTasks).toBe(2);
    expect(snapshot.summary.overdueTasks).toBe(1);
    expect(snapshot.summary.upcomingTasks).toBe(1);
    expect(snapshot.summary.missingDocuments).toBe(1);
    expect(snapshot.summary.needsUpdateDocuments).toBe(1);
    expect(snapshot.summary.rejectedDocuments).toBe(1);
    expect(snapshot.summary.blockedLegalSteps).toBe(1);
    expect(snapshot.summary.waitingAuthorityLegalSteps).toBe(1);
    expect(snapshot.summary.meetings).toBe(1);
    expect(snapshot.summary.pendingDecisions).toBe(1);
    expect(snapshot.documents.readiness.completionRatio).toBe(0);
  });

  it("generates each supported report type and persists the snapshot", async () => {
    const project = await seedReportData();

    const weeklyReport = await generateReport(
      { projectId: project.id, reportType: "weekly_project_summary" },
      "admin",
      repositories(),
      { today: new Date(2026, 4, 16) }
    );
    const documentReport = await generateReport(
      { projectId: project.id, reportType: "document_readiness_report" },
      "admin",
      repositories(),
      { today: new Date(2026, 4, 16) }
    );
    const legalReport = await generateReport(
      { projectId: project.id, reportType: "legal_status_report" },
      "admin",
      repositories(),
      { today: new Date(2026, 4, 16) }
    );

    const reports = await reportRepository.listReports({ projectId: project.id });

    expect(weeklyReport.title).toContain(project.name);
    expect(documentReport.reportType).toBe("document_readiness_report");
    expect(legalReport.reportType).toBe("legal_status_report");
    expect(reports).toHaveLength(3);
    expect(reports.map((report) => report.snapshot.project.id)).toEqual([project.id, project.id, project.id]);
  });

  it("keeps generated report detail unchanged after source data changes", async () => {
    const project = await seedReportData();
    const report = await generateReport(
      { projectId: project.id, reportType: "weekly_project_summary" },
      "admin",
      repositories(),
      { today: new Date(2026, 4, 16) }
    );

    await createTask(
      {
        projectId: project.id,
        title: "Việc quá hạn sau khi tạo báo cáo",
        dueDate: "2026-05-11",
        status: "todo",
        priority: "high"
      },
      taskRepository,
      projectRepository
    );

    const storedReport = await reportRepository.getReport(report.id);
    const freshSnapshot = await buildReportSnapshot(project.id, repositories(), {
      today: new Date(2026, 4, 16)
    });

    expect(storedReport?.snapshot.summary.overdueTasks).toBe(1);
    expect(freshSnapshot.summary.overdueTasks).toBe(2);
  });
});
