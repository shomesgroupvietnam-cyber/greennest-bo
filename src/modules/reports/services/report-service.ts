import { documentRequirementRepository, type DocumentRequirementRepository } from "@/modules/documents/services/document-requirement-repository";
import { documentRepository, type DocumentRepository } from "@/modules/documents/services/document-repository";
import { calculateProjectDocumentReadiness, listDocumentRequirements } from "@/modules/documents/services/document-readiness-service";
import { legalRepository, type LegalRepository } from "@/modules/legal/services/legal-repository";
import { listLegalSteps } from "@/modules/legal/services/legal-service";
import { meetingRepository, type MeetingRepository } from "@/modules/meetings/services/meeting-repository";
import { listDecisions, listMeetings } from "@/modules/meetings/services/meeting-service";
import { projectRepository, type ProjectRepository } from "@/modules/projects/services/project-repository";
import { getProject } from "@/modules/projects/services/project-service";
import { reportInputSchema } from "@/modules/reports/validation";
import type { ReportInput, ReportListFilters, ReportRun, ReportSnapshot, ReportType } from "@/modules/reports/types";
import { taskRepository, type TaskRepository } from "@/modules/tasks/services/task-repository";
import { isTaskOverdue, isTaskUpcoming, listTasks } from "@/modules/tasks/services/task-service";

import { reportRepository, type ReportRepository } from "./report-repository";

type ReportRepositories = {
  projects?: ProjectRepository;
  tasks?: TaskRepository;
  documents?: DocumentRepository;
  requirements?: DocumentRequirementRepository;
  legal?: LegalRepository;
  meetings?: MeetingRepository;
  reports?: ReportRepository;
};

function createId() {
  return crypto.randomUUID();
}

function reportTitle(reportType: ReportType, projectName: string, generatedAt: string) {
  const date = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(new Date(generatedAt));
  const labels: Record<ReportType, string> = {
    weekly_project_summary: "Báo cáo tuần",
    document_readiness_report: "Báo cáo sẵn sàng hồ sơ",
    legal_status_report: "Báo cáo pháp lý"
  };

  return `${labels[reportType]} - ${projectName} - ${date}`;
}

export async function listReports(filters: ReportListFilters = {}, repository: ReportRepository = reportRepository) {
  return repository.listReports(filters);
}

export async function getReport(reportId: string, repository: ReportRepository = reportRepository) {
  return repository.getReport(reportId);
}

export async function buildReportSnapshot(
  projectId: string,
  repositories: ReportRepositories = {},
  options: { today?: Date } = {}
): Promise<ReportSnapshot> {
  const projects = repositories.projects ?? projectRepository;
  const tasksRepository = repositories.tasks ?? taskRepository;
  const documentsRepository = repositories.documents ?? documentRepository;
  const requirementsRepository = repositories.requirements ?? documentRequirementRepository;
  const legalStepsRepository = repositories.legal ?? legalRepository;
  const meetingsRepository = repositories.meetings ?? meetingRepository;
  const today = options.today ?? new Date();
  const project = await getProject(projectId, projects);

  if (!project || project.archivedAt) {
    throw new Error("Dự án không tồn tại hoặc đã được lưu trữ.");
  }

  const [tasks, documents, requirements, legalSteps, meetings, decisions] = await Promise.all([
    listTasks({ projectId }, tasksRepository),
    documentsRepository.listDocuments({ projectId }),
    listDocumentRequirements({}, requirementsRepository),
    listLegalSteps({ projectId }, legalStepsRepository, projects),
    listMeetings({ projectId }, meetingsRepository),
    listDecisions({ projectId }, meetingsRepository)
  ]);
  const readiness = calculateProjectDocumentReadiness({
    project,
    requirements,
    documents,
    legalSteps
  });
  const overdueTasks = tasks.filter((task) => isTaskOverdue(task, today));
  const upcomingTasks = tasks.filter((task) => isTaskUpcoming(task, today, 7));
  const missingDocuments = readiness.missingRequirements;
  const needsUpdateDocuments = readiness.needsUpdateRequirements;
  const rejectedOrNeedsUpdateRecords = documents
    .filter((document) => document.status === "missing" || document.status === "needs_update" || document.approvalStatus === "rejected")
    .map((document) => ({
      id: document.id,
      title: document.title,
      docType: document.docType,
      status: document.status,
      approvalStatus: document.approvalStatus,
      ownerId: document.ownerId,
      version: document.version
    }));
  const blockedLegalSteps = legalSteps.filter((step) => step.status === "blocked");
  const waitingAuthorityLegalSteps = legalSteps.filter((step) => step.status === "waiting_authority");
  const pendingDecisions = decisions.filter((decision) => decision.status !== "done" && decision.status !== "cancelled");
  const meetingsWithDecisions = meetings.map((meeting) => ({
    ...meeting,
    decisions: decisions.filter((decision) => decision.meetingId === meeting.id)
  }));

  return {
    project,
    summary: {
      totalTasks: tasks.length,
      overdueTasks: overdueTasks.length,
      upcomingTasks: upcomingTasks.length,
      missingDocuments: missingDocuments.length,
      needsUpdateDocuments: needsUpdateDocuments.length,
      rejectedDocuments: documents.filter((document) => document.approvalStatus === "rejected").length,
      documentReadinessRatio: readiness.completionRatio,
      blockedLegalSteps: blockedLegalSteps.length,
      waitingAuthorityLegalSteps: waitingAuthorityLegalSteps.length,
      meetings: meetings.length,
      pendingDecisions: pendingDecisions.length
    },
    tasks: {
      overdue: overdueTasks,
      upcoming: upcomingTasks
    },
    documents: {
      missing: missingDocuments,
      needsUpdate: needsUpdateDocuments,
      rejectedOrNeedsUpdateRecords,
      readiness
    },
    legal: {
      blocked: blockedLegalSteps,
      waitingAuthority: waitingAuthorityLegalSteps
    },
    meetings: meetingsWithDecisions,
    generatedFrom: {
      taskCount: tasks.length,
      documentCount: documents.length,
      legalStepCount: legalSteps.length,
      meetingCount: meetings.length,
      decisionCount: decisions.length
    }
  };
}

export async function generateReport(
  input: ReportInput,
  generatedBy: string,
  repositories: ReportRepositories = {},
  options: { today?: Date } = {}
) {
  const parsedInput = reportInputSchema.parse(input);
  const reports = repositories.reports ?? reportRepository;
  const generatedAt = new Date().toISOString();
  const snapshot = await buildReportSnapshot(parsedInput.projectId, repositories, options);
  const report: ReportRun = {
    id: createId(),
    projectId: parsedInput.projectId,
    reportType: parsedInput.reportType,
    title: reportTitle(parsedInput.reportType, snapshot.project.name, generatedAt),
    generatedBy,
    generatedAt,
    snapshot
  };

  return reports.createReport(report);
}
