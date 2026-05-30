export const MEETING_TYPES = {
  EXECUTIVE_MEETING: "Họp lãnh đạo",
  EXECUTIVE_OPERATIONAL_MEETING: "Họp điều hành lãnh đạo",
  DEPARTMENT_INTERNAL_MEETING: "Họp nội bộ phòng ban",
  PROJECT_MEETING: "Họp dự án",
  EXTERNAL_PARTNER_MEETING: "Họp đối tác bên ngoài",
  GOVERNMENT_MEETING: "Họp cơ quan chức năng"
} as const;

export const MEETING_TYPE_DESCRIPTIONS = {
  EXECUTIVE_MEETING: "HĐQT, ban TGĐ, chiến lược, KPI, risk.",
  EXECUTIVE_OPERATIONAL_MEETING: "Lãnh đạo làm việc với đầu tư, pháp lý, thiết kế, tài chính, nhà thầu.",
  DEPARTMENT_INTERNAL_MEETING: "Họp nội bộ phòng ban.",
  PROJECT_MEETING: "Họp dự án, tiến độ, nghiệm thu, triển khai.",
  EXTERNAL_PARTNER_MEETING: "Họp tư vấn, nhà thầu, đối tác.",
  GOVERNMENT_MEETING: "Họp UBND, Sở, cơ quan chức năng."
} as const;

export const MEETING_VISIBILITIES = {
  executive: "Lãnh đạo",
  organization: "Toàn tổ chức",
  project: "Theo dự án",
  department: "Theo phòng ban",
  private: "Riêng tư",
  external: "Có bên ngoài"
} as const;

export const MEETING_PARTICIPANT_SCOPES = {
  all_leadership: "Toàn bộ lãnh đạo",
  organization: "Theo tổ chức",
  project_team: "Theo đội dự án",
  department: "Theo phòng ban",
  invited_only: "Chỉ người được mời",
  external: "Có người ngoài"
} as const;

export const MEETING_STATUSES = {
  SCHEDULED: "Đã lên lịch",
  CONFIRMED: "Đã xác nhận",
  IN_PROGRESS: "Đang họp",
  COMPLETED: "Đã hoàn tất",
  CANCELLED: "Đã hủy",
  FOLLOW_UP_PENDING: "Chờ follow-up",
  CLOSED: "Đã đóng"
} as const;

export const AI_SUMMARY_STATUSES = {
  DRAFT: "Bản nháp",
  APPROVED: "Đã duyệt"
} as const;

export type MeetingType = keyof typeof MEETING_TYPES;
export type MeetingVisibility = keyof typeof MEETING_VISIBILITIES;
export type MeetingParticipantScope = keyof typeof MEETING_PARTICIPANT_SCOPES;
export type MeetingStatus = keyof typeof MEETING_STATUSES;
export type AiSummaryStatus = keyof typeof AI_SUMMARY_STATUSES;

