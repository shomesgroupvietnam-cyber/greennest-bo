export const DEFAULT_LEGAL_STEPS = [
  { code: "land_survey", name: "Khảo sát quỹ đất" },
  { code: "planning_analysis", name: "Phân tích quy hoạch" },
  { code: "investment_proposal", name: "Hồ sơ đề xuất đầu tư" },
  { code: "investment_policy", name: "Chủ trương đầu tư" },
  { code: "planning_1_500", name: "Quy hoạch chi tiết 1/500" },
  { code: "basic_design", name: "Thiết kế cơ sở" },
  { code: "feasibility_report", name: "Báo cáo nghiên cứu khả thi" },
  { code: "environmental_approval", name: "Đánh giá môi trường" },
  { code: "fire_safety", name: "PCCC" },
  { code: "land_allocation", name: "Giao đất/thuê đất" },
  { code: "investor_recognition", name: "Chấp nhận chủ đầu tư" },
  { code: "construction_permit", name: "Giấy phép xây dựng" }
] as const;

export type LegalStepCode = (typeof DEFAULT_LEGAL_STEPS)[number]["code"];
