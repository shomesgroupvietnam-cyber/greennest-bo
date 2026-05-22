export const DOCUMENT_TYPES = {
  land_certificate: "Giấy chứng nhận quyền sử dụng đất",
  land_record: "Hồ sơ pháp lý quỹ đất",
  construction_permit: "Giấy phép xây dựng",
  design_drawing: "Bản vẽ thiết kế",
  contract: "Hợp đồng",
  invoice: "Hóa đơn - chứng từ",
  legal_submission: "Hồ sơ nộp cơ quan",
  acceptance_record: "Biên bản nghiệm thu",
  contractor_submission: "Hồ sơ nhà thầu",
  consultant_review: "Phiếu tư vấn/review",
  other: "Khác"
} as const;

export const DOCUMENT_CLASSIFICATIONS = {
  PUBLIC: "PUBLIC",
  INTERNAL: "INTERNAL",
  CONFIDENTIAL: "CONFIDENTIAL",
  RESTRICTED: "RESTRICTED",
} as const;

export const DOCUMENT_CLASSIFICATION_LABELS: Record<
  keyof typeof DOCUMENT_CLASSIFICATIONS,
  string
> = {
  PUBLIC: "PUBLIC - Công khai",
  INTERNAL: "INTERNAL - Nội bộ",
  CONFIDENTIAL: "CONFIDENTIAL - Bảo mật",
  RESTRICTED: "RESTRICTED - Hạn chế truy cập",
};

export const DEFAULT_DOCUMENT_CLASSIFICATION = "INTERNAL" as const;

export const DEFAULT_DOCUMENT_OWNER_ID = "mock-founder";
