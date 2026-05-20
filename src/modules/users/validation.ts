import { z } from "zod";

import { ROLES } from "@/constants/roles";

const roleValues = Object.keys(ROLES) as [keyof typeof ROLES, ...Array<keyof typeof ROLES>];

export const roleSchema = z.enum(roleValues);

export const userInputSchema = z.object({
  fullName: z.string().trim().min(1, "Vui lòng nhập họ tên."),
  email: z.string().trim().email("Email không hợp lệ."),
  role: roleSchema
});

export const projectMembershipInputSchema = z.object({
  projectId: z.string().trim().min(1, "Vui lòng chọn dự án."),
  userId: z.string().trim().min(1, "Vui lòng chọn người dùng."),
  role: roleSchema
});
