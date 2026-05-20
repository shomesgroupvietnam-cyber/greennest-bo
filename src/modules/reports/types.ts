import type { DocumentRequirementReadinessItem, ProjectDocumentReadiness } from "@/modules/documents/types";
import type { LegalStep } from "@/modules/legal/types";
import type { Decision, Meeting } from "@/modules/meetings/types";
import type { Project } from "@/modules/projects/types";
import type { Task } from "@/modules/tasks/types";
import type { EntityId } from "@/types/common";

export const REPORT_TYPES = {
  weekly_project_summary: "Báo cáo tuần dự án",
  document_readiness_report: "Báo cáo sẵn sàng hồ sơ",
  legal_status_report: "Báo cáo tình trạng pháp lý"
} as const;

export type ReportType = keyof typeof REPORT_TYPES;

export type ReportRun = {
  id: EntityId;
  projectId: EntityId;
  reportType: ReportType;
  title: string;
  generatedBy: EntityId;
  generatedAt: string;
  snapshot: ReportSnapshot;
};

export type ReportInput = {
  projectId: EntityId;
  reportType: ReportType;
};

export type ReportListFilters = {
  projectId?: EntityId | "all";
  reportType?: ReportType | "all";
};

export type ReportSnapshot = {
  project: Project;
  summary: {
    totalTasks: number;
    overdueTasks: number;
    upcomingTasks: number;
    missingDocuments: number;
    needsUpdateDocuments: number;
    rejectedDocuments: number;
    documentReadinessRatio: number;
    blockedLegalSteps: number;
    waitingAuthorityLegalSteps: number;
    meetings: number;
    pendingDecisions: number;
  };
  tasks: {
    overdue: Task[];
    upcoming: Task[];
  };
  documents: {
    missing: DocumentRequirementReadinessItem[];
    needsUpdate: DocumentRequirementReadinessItem[];
    rejectedOrNeedsUpdateRecords: Array<{
      id: EntityId;
      title: string;
      docType: string;
      status: string;
      approvalStatus?: string;
      ownerId?: EntityId;
      version: string;
    }>;
    readiness: ProjectDocumentReadiness;
  };
  legal: {
    blocked: LegalStep[];
    waitingAuthority: LegalStep[];
  };
  meetings: Array<Meeting & { decisions: Decision[] }>;
  generatedFrom: {
    taskCount: number;
    documentCount: number;
    legalStepCount: number;
    meetingCount: number;
    decisionCount: number;
  };
};
