import type { AppSessionUser } from "@/lib/auth/session";
import type {
  InvestmentPlanStatus,
  StrategicInvestmentPlan,
} from "@/modules/executive/types";
import {
  investmentPlanInputSchema,
  type InvestmentPlanInputSchema,
} from "@/modules/executive/validation";

export type InvestmentPlanFormValues = {
  title: string;
  year: string;
  quarter: InvestmentPlanInputSchema["quarter"];
  targetArea: string;
  projectType: string;
  budgetRange: string;
  priority: InvestmentPlanInputSchema["priority"];
  status: InvestmentPlanStatus;
};

export function defaultInvestmentPlanFormValues(): InvestmentPlanFormValues {
  return {
    title: "",
    year: "2026",
    quarter: "Q3",
    targetArea: "",
    projectType: "",
    budgetRange: "",
    priority: "high",
    status: "draft",
  };
}

export function investmentPlanToFormValues(
  plan: StrategicInvestmentPlan,
): InvestmentPlanFormValues {
  return {
    title: plan.title,
    year: String(plan.year),
    quarter: plan.quarter,
    targetArea: plan.targetArea,
    projectType: plan.projectType,
    budgetRange: plan.budgetRange,
    priority: plan.priority,
    status: plan.status,
  };
}

export function parseInvestmentPlanFormValues(
  values: InvestmentPlanFormValues,
): InvestmentPlanInputSchema {
  return investmentPlanInputSchema.parse(values);
}

export function createInvestmentPlanFromInput({
  input,
  sequence,
  user,
}: {
  input: InvestmentPlanInputSchema;
  sequence: number;
  user: AppSessionUser;
}): StrategicInvestmentPlan {
  const timestamp = new Date().toISOString();
  const targetAreas = input.targetArea
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    id: `plan-mock-${Date.now()}-${sequence}`,
    title: input.title,
    year: input.year,
    quarter: input.quarter,
    targetArea: input.targetArea,
    projectType: input.projectType,
    budgetRange: input.budgetRange,
    priority: input.priority,
    status: input.status,
    createdBy: user.id,
    createdAt: timestamp,
    updatedAt: timestamp,
    period:
      input.quarter === "FY"
        ? String(input.year)
        : `${input.quarter}/${input.year}`,
    regionFocus: input.targetArea,
    segmentFocus: input.projectType,
    budgetLabel: input.budgetRange,
    allocatedBudget: estimateBudgetValue(input.budgetRange),
    committedBudget: 0,
    ownerName: user.fullName,
    priorities: priorityLabels[input.priority],
    targetAreas: targetAreas.length > 0 ? targetAreas : [input.targetArea],
    projectTypes: [input.projectType],
  };
}

export function updateInvestmentPlanFromInput({
  input,
  plan,
}: {
  input: InvestmentPlanInputSchema;
  plan: StrategicInvestmentPlan;
}): StrategicInvestmentPlan {
  const targetAreas = input.targetArea
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    ...plan,
    title: input.title,
    year: input.year,
    quarter: input.quarter,
    targetArea: input.targetArea,
    projectType: input.projectType,
    budgetRange: input.budgetRange,
    priority: input.priority,
    status: input.status,
    updatedAt: new Date().toISOString(),
    period:
      input.quarter === "FY"
        ? String(input.year)
        : `${input.quarter}/${input.year}`,
    regionFocus: input.targetArea,
    segmentFocus: input.projectType,
    budgetLabel: input.budgetRange,
    allocatedBudget: estimateBudgetValue(input.budgetRange),
    priorities: priorityLabels[input.priority],
    targetAreas: targetAreas.length > 0 ? targetAreas : [input.targetArea],
    projectTypes: [input.projectType],
  };
}

export function updateInvestmentPlanStatus({
  plan,
  status,
}: {
  plan: StrategicInvestmentPlan;
  status: InvestmentPlanStatus;
}): StrategicInvestmentPlan {
  return {
    ...plan,
    status,
    updatedAt: new Date().toISOString(),
  };
}

const priorityLabels: Record<InvestmentPlanInputSchema["priority"], string[]> =
  {
    low: ["Theo dõi cơ hội", "Chưa ưu tiên ngân sách lớn"],
    medium: ["Có tiềm năng danh mục", "Cần bổ sung dữ liệu thị trường"],
    high: ["Ưu tiên pháp lý đất sạch", "Có kịch bản dòng tiền"],
    strategic: ["Ưu tiên chiến lược", "Cần theo dõi cấp lãnh đạo"],
  };

function estimateBudgetValue(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const match = normalized.match(/\d+(\.\d+)?/);

  return match ? Number(match[0]) : 0;
}
