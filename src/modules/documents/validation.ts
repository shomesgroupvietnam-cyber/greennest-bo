import { z } from "zod";

import { DOCUMENT_STATUSES } from "@/constants/statuses";
const documentStatusValues = Object.keys(DOCUMENT_STATUSES) as [keyof typeof DOCUMENT_STATUSES, ...Array<keyof typeof DOCUMENT_STATUSES>];

const optionalTextSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional()
);

const optionalUrlSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().url("URL không hợp lệ.").optional()
);

export const documentInputSchema = z
  .object({
    projectId: z.string().trim().min(1, "Vui lòng chọn dự án."),
    title: z.string().trim().min(1, "Vui lòng nhập tên hồ sơ."),
    docType: z.string().trim().min(1, "Vui lòng chọn loại hồ sơ."),
    fileUrl: optionalUrlSchema,
    externalUrl: optionalUrlSchema,
    version: z.string().trim().min(1, "Vui lòng nhập phiên bản."),
    status: z.enum(documentStatusValues),
    ownerId: optionalTextSchema
  })
  .refine((input) => input.status === "missing" || Boolean(input.fileUrl || input.externalUrl), {
    message: "Hồ sơ chưa thiếu phải có external URL hoặc file URL.",
    path: ["externalUrl"]
  });

export const documentUpdateSchema = documentInputSchema;

export const documentApprovalSchema = z.object({
  reviewerId: z.string().trim().min(1, "Thiếu người duyệt."),
  approvalNotes: optionalTextSchema
});

export const documentRejectionSchema = z.object({
  reviewerId: z.string().trim().min(1, "Thiếu người duyệt."),
  approvalNotes: z.string().trim().min(1, "Vui lòng nhập ghi chú khi yêu cầu cập nhật hồ sơ.")
});
