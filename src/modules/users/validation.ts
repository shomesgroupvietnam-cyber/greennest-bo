import { z } from "zod";

export const roleSchema = z
  .string()
  .trim()
  .min(2, "Role key la bat buoc.")
  .max(64, "Role key qua dai.")
  .regex(
    /^[a-z][a-z0-9_]*$/,
    "Role key chi duoc gom chu thuong, so va dau gach duoi.",
  );

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
