import { z } from "zod";

import { LEGAL_STATUSES } from "@/constants/statuses";

const legalStatusValues = Object.keys(LEGAL_STATUSES) as [keyof typeof LEGAL_STATUSES, ...Array<keyof typeof LEGAL_STATUSES>];

const optionalTextSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional()
);

const optionalDateSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ.").optional()
);

export const legalStepUpdateSchema = z
  .object({
    status: z.enum(legalStatusValues),
    assigneeId: optionalTextSchema,
    dueDate: optionalDateSchema,
    completedDate: optionalDateSchema,
    notes: optionalTextSchema,
    relatedDocumentIds: z.array(z.string().trim().min(1)).optional()
  })
  .refine((input) => input.status !== "blocked" || Boolean(input.notes), {
    message: "Vui lòng nhập ghi chú khi bước pháp lý bị vướng.",
    path: ["notes"]
  });

