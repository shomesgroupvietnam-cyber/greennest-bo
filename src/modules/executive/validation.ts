import { z } from "zod";

import { ROLES } from "@/constants/roles";

const roleValues = Object.keys(ROLES) as [
  keyof typeof ROLES,
  ...Array<keyof typeof ROLES>,
];
const optionalTextSchema = z.string().trim().optional();

export const investmentPlanSchema = z.object({
  id: z.string().min(1),
  projectId: optionalTextSchema,
  title: z.string().min(1),
  year: z.number().int().min(2000),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4", "FY"]),
  targetArea: z.string().min(1),
  projectType: z.string().min(1),
  budgetRange: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "strategic"]),
  status: z.enum(["draft", "reviewing", "approved"]),
  createdBy: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const investmentPlanInputSchema = z.object({
  title: z.string().trim().min(1, "Vui lòng nhập tên kế hoạch."),
  year: z.coerce.number().int().min(2000, "Năm không hợp lệ."),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4", "FY"]),
  targetArea: z.string().trim().min(1, "Vui lòng nhập khu vực mục tiêu."),
  projectType: z.string().trim().min(1, "Vui lòng nhập loại dự án."),
  budgetRange: z.string().trim().min(1, "Vui lòng nhập ngân sách."),
  priority: z.enum(["low", "medium", "high", "strategic"]),
  status: z.enum(["draft", "reviewing", "approved"]),
});

export const leadershipMemberSchema = z.object({
  id: z.string().min(1),
  fullName: z.string().min(1),
  position: z.string().min(1),
  role: z.enum(roleValues),
  email: z.string().email(),
  phone: z.string().min(1),
  approvalLevel: z.enum(["none", "review", "department", "company", "final"]),
  isActive: z.boolean(),
});

export const executiveDirectiveSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  projectId: optionalTextSchema,
  assignedTo: z.string().min(1),
  dueDate: z.string().min(1),
  priority: z.enum(["normal", "high", "urgent"]),
  status: z.enum(["open", "in_progress", "blocked", "done"]),
  createdBy: z.string().min(1),
  createdAt: z.string().min(1),
});

export const leadershipMeetingSchema = z.object({
  id: z.string().min(1),
  projectId: optionalTextSchema,
  title: z.string().min(1),
  meetingDate: z.string().min(1),
  participants: z.array(z.string().min(1)),
  agenda: z.array(z.string().min(1)),
  summary: z.string().min(1),
  aiSummary: z.string().min(1),
  actionItems: z.array(z.string().min(1)),
  status: z.enum(["scheduled", "completed"]),
});

export const approvalRequestSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(["investment", "finance", "design", "legal", "operation"]),
  projectId: optionalTextSchema,
  requestedBy: z.string().min(1),
  amount: z.number().optional(),
  reason: z.string().min(1),
  attachments: z.array(z.string().min(1)),
  status: z.enum(["pending", "approved", "rejected", "revision_required"]),
  approverId: optionalTextSchema,
  decisionReason: optionalTextSchema,
  decidedAt: optionalTextSchema,
});

export const decisionLogSchema = z.object({
  id: z.string().min(1),
  entityType: z.enum([
    "investment_plan",
    "directive",
    "meeting",
    "approval",
    "decision",
  ]),
  entityId: z.string().min(1),
  decision: z.string().min(1),
  reason: z.string().min(1),
  decidedBy: z.string().min(1),
  decidedAt: z.string().min(1),
  aiRecommendation: optionalTextSchema,
});

export type InvestmentPlanSchema = z.infer<typeof investmentPlanSchema>;
export type InvestmentPlanInputSchema = z.infer<
  typeof investmentPlanInputSchema
>;
export type LeadershipMemberSchema = z.infer<typeof leadershipMemberSchema>;
export type ExecutiveDirectiveSchema = z.infer<typeof executiveDirectiveSchema>;
export type LeadershipMeetingSchema = z.infer<typeof leadershipMeetingSchema>;
export type ApprovalRequestSchema = z.infer<typeof approvalRequestSchema>;
export type DecisionLogSchema = z.infer<typeof decisionLogSchema>;
