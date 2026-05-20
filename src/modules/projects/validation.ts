import { z } from "zod";

import { PROJECT_STATUSES } from "@/constants/statuses";

const projectStatusKeys = Object.keys(PROJECT_STATUSES) as [keyof typeof PROJECT_STATUSES, ...Array<keyof typeof PROJECT_STATUSES>];

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

const optionalPositiveNumber = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    return Number(value);
  },
  z.number().positive("Diện tích phải lớn hơn 0.").optional()
);

export const projectInputSchema = z.object({
  code: optionalText,
  name: z.string().trim().min(1, "Tên dự án là bắt buộc."),
  location: optionalText,
  area: optionalPositiveNumber,
  projectType: optionalText,
  investor: optionalText,
  status: z.enum(projectStatusKeys),
  ownerName: optionalText
});

export const projectUpdateSchema = projectInputSchema.extend({
  name: z.string().trim().min(1, "Tên dự án là bắt buộc.")
});

export type ProjectInputSchema = z.infer<typeof projectInputSchema>;
export type ProjectUpdateSchema = z.infer<typeof projectUpdateSchema>;
