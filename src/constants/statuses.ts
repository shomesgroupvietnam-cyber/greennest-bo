export const PROJECT_STATUSES = {
  planning: "Đang chuẩn bị",
  active: "Đang triển khai",
  paused: "Tạm dừng",
  completed: "Hoàn thành",
  archived: "Lưu trữ"
} as const;

export const TASK_STATUSES = {
  todo: "Chưa bắt đầu",
  in_progress: "Đang làm",
  waiting: "Đang chờ",
  done: "Đã xong",
  blocked: "Bị vướng"
} as const;

export const TASK_PRIORITIES = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  urgent: "Khẩn cấp"
} as const;

export const DOCUMENT_STATUSES = {
  missing: "Thiếu",
  draft: "Bản nháp",
  in_review: "Đang kiểm tra",
  complete: "Đủ",
  needs_update: "Cần bổ sung"
} as const;

export const DOCUMENT_APPROVAL_STATUSES = {
  not_submitted: "Chưa gửi duyệt",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Yêu cầu cập nhật"
} as const;

export const LEGAL_STATUSES = {
  not_started: "Chưa bắt đầu",
  in_progress: "Đang làm",
  waiting_authority: "Chờ cơ quan",
  done: "Đã xong",
  blocked: "Bị vướng"
} as const;

export const DECISION_STATUSES = {
  open: "Chưa xử lý",
  in_progress: "Đang xử lý",
  done: "Đã xong",
  cancelled: "Hủy"
} as const;

export type ProjectStatus = keyof typeof PROJECT_STATUSES;
export type TaskStatus = keyof typeof TASK_STATUSES;
export type TaskPriority = keyof typeof TASK_PRIORITIES;
export type DocumentStatus = keyof typeof DOCUMENT_STATUSES;
export type DocumentApprovalStatus = keyof typeof DOCUMENT_APPROVAL_STATUSES;
export type LegalStatus = keyof typeof LEGAL_STATUSES;
export type DecisionStatus = keyof typeof DECISION_STATUSES;
