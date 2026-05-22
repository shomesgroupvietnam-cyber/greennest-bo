export type AxisOneStageStatus =
  | "not_started"
  | "in_progress"
  | "waiting_review"
  | "blocked"
  | "completed";

export type AxisOneRiskLevel = "low" | "medium" | "high" | "critical";

export type AxisOneDocumentStatus = "missing" | "draft" | "submitted" | "approved";

export type AxisOneTaskStatus = "open" | "in_progress" | "blocked" | "done";

export type AxisOneRequiredDocument = {
  id: string;
  name: string;
  owner: string;
  status: AxisOneDocumentStatus;
  dueDate?: string;
  note?: string;
};

export type AxisOneTask = {
  id: string;
  title: string;
  assignee: string;
  deadline: string;
  status: AxisOneTaskStatus;
  priority: AxisOneRiskLevel;
};

export type AxisOneDevelopmentStage = {
  id: string;
  code: string;
  title: string;
  shortTitle: string;
  projectId: string;
  projectName: string;
  objective: string;
  description: string;
  status: AxisOneStageStatus;
  progress: number;
  responsiblePerson: string;
  responsibleRole: string;
  deadline: string;
  riskLevel: AxisOneRiskLevel;
  requiredDocuments: AxisOneRequiredDocument[];
  inputData: string[];
  outputData: string[];
  tasks: AxisOneTask[];
};

export type AxisOneDashboardSummary = {
  totalStages: number;
  completedStages: number;
  completionRate: number;
  missingDocuments: number;
  openTasks: number;
  blockedStages: number;
  highRiskStages: number;
};
