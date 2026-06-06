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

export type ReportExportTarget = "dashboard" | "approval_history" | "audit_log";
export type ReportExportFormat = "json" | "csv";

export type ReportExportRequest = {
  target: ReportExportTarget;
  format: ReportExportFormat;
  filters?: HistoryArchiveFilters;
  scopeId?: string;
};

export type ReportExportSummary = {
  exportId: EntityId;
  target: ReportExportTarget;
  format: ReportExportFormat;
  filters?: HistoryArchiveFilters;
  scopeId?: string;
  itemCount: number;
  total?: number;
  sensitiveIncluded: boolean;
  redactedFields: string[];
};

export type ReportExportResult = {
  exportId: EntityId;
  target: ReportExportTarget;
  format: ReportExportFormat;
  filename: string;
  mimeType: string;
  content: string;
  generatedAt: string;
  summary: ReportExportSummary;
};

export type ReportListFilters = {
  projectId?: EntityId | "all";
  reportType?: ReportType | "all";
};

export const HISTORY_ARCHIVE_EVENT_TYPES = [
  "approval",
  "assignment",
  "audit",
  "decision",
  "document_version",
  "meeting",
  "search"
] as const;

export const HISTORY_ARCHIVE_MODULES = [
  "approvals",
  "audit",
  "decisions",
  "documents",
  "knowledge",
  "meetings",
  "reports"
] as const;

export const HISTORY_ARCHIVE_SEVERITIES = [
  "info",
  "warning",
  "critical"
] as const;

export type HistoryArchiveEventType = (typeof HISTORY_ARCHIVE_EVENT_TYPES)[number];
export type HistoryArchiveModule = (typeof HISTORY_ARCHIVE_MODULES)[number];
export type HistoryArchiveSeverity = (typeof HISTORY_ARCHIVE_SEVERITIES)[number];

export type HistoryArchiveScope = {
  organizationId?: EntityId;
  projectId?: EntityId;
  projectIds?: EntityId[];
  axisId?: string;
  workstreamId?: string;
  moduleId?: string;
  recordId: EntityId;
};

export type HistoryArchiveSource = {
  sourceType: string;
  sourceId: EntityId;
  sourceLabel?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type HistoryArchiveEvent = {
  id: EntityId;
  type: HistoryArchiveEventType;
  module: HistoryArchiveModule;
  actorId?: EntityId;
  occurredAt: string;
  scope: HistoryArchiveScope;
  summary: string;
  status?: string;
  source: HistoryArchiveSource;
  severity?: HistoryArchiveSeverity;
  href?: string;
};

export type HistoryArchiveFilters = {
  projectId?: EntityId | "all";
  module?: HistoryArchiveModule | "all";
  type?: HistoryArchiveEventType | "all";
  actorId?: EntityId | "all";
  status?: string | "all";
  severity?: HistoryArchiveSeverity | "all";
  dateFrom?: string;
  dateTo?: string;
  query?: string;
  limit?: number;
};

export type HistoryArchiveData = {
  generatedAt: string;
  filters: HistoryArchiveFilters;
  permissions: {
    canExport?: boolean;
    canView: boolean;
    canViewAudit: boolean;
    canViewSearchHistory: boolean;
    exportTargets?: ReportExportTarget[];
  };
  sourceCounts: Partial<Record<HistoryArchiveEventType, number>>;
  total: number;
  items: HistoryArchiveEvent[];
};

export type HistoryArchiveSelectOption<TValue extends string = string> = {
  label: string;
  value: TValue;
};

export type HistoryArchiveEntityOption = {
  id: EntityId;
  label: string;
};

export type HistoryArchiveFilterOptions = {
  actors: HistoryArchiveEntityOption[];
  modules: Array<HistoryArchiveSelectOption<HistoryArchiveModule>>;
  projects: HistoryArchiveEntityOption[];
  severities: Array<HistoryArchiveSelectOption<HistoryArchiveSeverity>>;
  statuses: string[];
  types: Array<HistoryArchiveSelectOption<HistoryArchiveEventType>>;
};

export type HistoryArchiveCenterData = {
  archive: HistoryArchiveData;
  filterOptions: HistoryArchiveFilterOptions;
  preservedParams?: Record<string, string>;
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
