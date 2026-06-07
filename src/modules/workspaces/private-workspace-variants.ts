import type { ExecutivePrivateWorkspaceVariant } from "@/modules/workspaces/types";

export type PrivateWorkspaceVariantConfig = {
  label: string;
  description: string;
  priorityGroups: string[];
};

export const PRIVATE_WORKSPACE_VARIANTS: Record<
  ExecutivePrivateWorkspaceVariant,
  PrivateWorkspaceVariantConfig
> = {
  chairman: {
    label: "Không Gian Chủ Tịch",
    description: "KPI danh mục, rủi ro nghiêm trọng, phê duyệt quá hạn và quyết định chiến lược.",
    priorityGroups: ["Danh mục", "Rủi ro", "Phê duyệt", "Quyết định", "Tài chính"],
  },
  ceo: {
    label: "Không Gian Tổng Giám Đốc",
    description: "KPI vận hành, hàng đợi phê duyệt, leo thang và hạn xử lý liên dự án.",
    priorityGroups: ["Vận hành", "Phê duyệt", "Rủi ro", "Hạn xử lý", "Cuộc họp"],
  },
  project_director: {
    label: "Không Gian Giám Đốc Dự Án",
    description: "Dự án được giao, sức khỏe dự án, phê duyệt, điểm chặn và hạn xử lý dự án.",
    priorityGroups: ["Dự án được giao", "Rủi ro", "Phê duyệt", "Hạn xử lý", "Cuộc họp"],
  },
  department_head: {
    label: "Không Gian Trưởng Bộ Phận",
    description: "Phạm vi chuyên môn, hồ sơ chuyên môn, phê duyệt và cuộc họp bộ phận.",
    priorityGroups: ["Bộ phận", "Phê duyệt", "Rủi ro", "Hạn xử lý", "Cuộc họp"],
  },
  secretary_assistant: {
    label: "Không Gian Thư Ký/Trợ Lý",
    description: "Lịch lãnh đạo, hồ sơ trình, tài liệu họp và nhắc việc.",
    priorityGroups: ["Lịch", "Hồ sơ trình", "Cuộc họp", "Nhắc việc"],
  },
  viewer: {
    label: "Không Gian Người Xem",
    description: "Tóm tắt chỉ đọc và các liên kết nguồn được phép.",
    priorityGroups: ["Tóm tắt", "Dự án", "Cuộc họp", "Quyết định"],
  },
};

export function getPrivateWorkspaceVariantConfig(
  variant: ExecutivePrivateWorkspaceVariant,
) {
  return PRIVATE_WORKSPACE_VARIANTS[variant];
}
