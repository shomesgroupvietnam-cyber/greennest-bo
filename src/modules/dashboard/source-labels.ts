import type {
  ExecutiveDashboardSourceType,
  ExecutiveDrilldownLinkedRecordType,
  ExecutiveDrilldownPermissionState,
} from "@/modules/dashboard/types";

const sourceTypeLabels: Record<ExecutiveDrilldownLinkedRecordType, string> = {
  decision: "Quyết định",
  document: "Tài liệu",
  executive_action: "Chỉ đạo điều hành",
  leadership_approval: "Phê duyệt lãnh đạo",
  legal: "Pháp lý",
  meeting: "Cuộc họp",
  module: "Module",
  project: "Dự án",
  proposal: "Đề xuất",
  risk: "Rủi ro",
  task: "Công việc",
};

const permissionStateLabels: Record<ExecutiveDrilldownPermissionState, string> = {
  allowed: "Được mở",
  denied: "Không có quyền",
  read_only: "Chỉ xem",
};

export function executiveSourceTypeLabel(
  sourceType?: ExecutiveDashboardSourceType | ExecutiveDrilldownLinkedRecordType | string,
) {
  if (!sourceType) {
    return "Không xác định";
  }

  return sourceTypeLabels[sourceType as ExecutiveDrilldownLinkedRecordType] ?? sourceType;
}

export function executivePermissionStateLabel(
  state?: ExecutiveDrilldownPermissionState,
) {
  if (!state) {
    return permissionStateLabels.read_only;
  }

  return permissionStateLabels[state] ?? state;
}
