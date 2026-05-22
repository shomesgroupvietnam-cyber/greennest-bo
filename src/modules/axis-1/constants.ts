import type {
  AxisOneDocumentStatus,
  AxisOneRiskLevel,
  AxisOneStageStatus,
  AxisOneTaskStatus,
} from "@/modules/axis-1/types";

export const AXIS_ONE_TITLE = "Dự án | Project Management";

export const AXIS_ONE_STAGE_STATUS_LABELS: Record<AxisOneStageStatus, string> = {
  not_started: "Chưa bắt đầu",
  in_progress: "Đang xử lý",
  waiting_review: "Chờ rà soát",
  blocked: "Đang vướng",
  completed: "Hoàn thành",
};

export const AXIS_ONE_STAGE_STATUS_TONES: Record<AxisOneStageStatus, string> = {
  not_started: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-50 text-blue-700",
  waiting_review: "bg-amber-50 text-amber-700",
  blocked: "bg-red-50 text-red-700",
  completed: "bg-emerald-50 text-emerald-700",
};

export const AXIS_ONE_RISK_LABELS: Record<AxisOneRiskLevel, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Nghiêm trọng",
};

export const AXIS_ONE_RISK_TONES: Record<AxisOneRiskLevel, string> = {
  low: "bg-emerald-50 text-emerald-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-orange-50 text-orange-700",
  critical: "bg-red-50 text-red-700",
};

export const AXIS_ONE_DOCUMENT_STATUS_LABELS: Record<
  AxisOneDocumentStatus,
  string
> = {
  missing: "Thiếu",
  draft: "Bản nháp",
  submitted: "Đã nộp",
  approved: "Đã duyệt",
};

export const AXIS_ONE_DOCUMENT_STATUS_TONES: Record<
  AxisOneDocumentStatus,
  string
> = {
  missing: "bg-red-50 text-red-700",
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-blue-50 text-blue-700",
  approved: "bg-emerald-50 text-emerald-700",
};

export const AXIS_ONE_TASK_STATUS_LABELS: Record<AxisOneTaskStatus, string> = {
  open: "Mở",
  in_progress: "Đang làm",
  blocked: "Bị vướng",
  done: "Hoàn tất",
};

export const AXIS_ONE_STAGE_IDS = [
  "project-idea",
  "land-bank-dossier",
  "planning-check",
  "social-housing-conditions",
  "pre-feasibility-analysis",
  "investor-capacity-dossier",
  "investment-policy-approval",
  "detailed-planning-1-500",
  "basic-design",
  "feasibility-study-report",
  "investor-approval",
  "land-allocation-lease",
] as const;
