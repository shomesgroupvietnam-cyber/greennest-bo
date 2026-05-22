import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import type { AppSessionUser } from "@/lib/auth/session";
import type { StrategicInvestmentPlan } from "@/modules/executive/types";
import {
  createInvestmentPlanFromInput,
  defaultInvestmentPlanFormValues,
  investmentPlanToFormValues,
  parseInvestmentPlanFormValues,
  updateInvestmentPlanFromInput,
  updateInvestmentPlanStatus,
} from "@/modules/executive/services/investment-plan-service";

const mockUser: AppSessionUser = {
  id: "user-ceo",
  email: "ceo@greennest.test",
  fullName: "Nguyen Van A",
  role: "tong_giam_doc",
  status: "active",
};

const baseInput = parseInvestmentPlanFormValues({
  title: "Ke hoach dau tu khu Dong 2026",
  year: "2026",
  quarter: "Q2",
  targetArea: "Ha Noi, Hung Yen",
  projectType: "Do thi xanh",
  budgetRange: "1.200 ty",
  priority: "strategic",
  status: "draft",
});

function createPlan(): StrategicInvestmentPlan {
  return createInvestmentPlanFromInput({
    input: baseInput,
    sequence: 4,
    user: mockUser,
  });
}

describe("executive investment plan service", () => {
  it("creates a strategic investment plan from validated form input", () => {
    const plan = createPlan();

    expect(plan.id).toMatch(/^plan-mock-/);
    expect(plan.title).toBe(baseInput.title);
    expect(plan.year).toBe(2026);
    expect(plan.quarter).toBe("Q2");
    expect(plan.targetArea).toBe("Ha Noi, Hung Yen");
    expect(plan.targetAreas).toEqual(["Ha Noi", "Hung Yen"]);
    expect(plan.projectType).toBe("Do thi xanh");
    expect(plan.projectTypes).toEqual(["Do thi xanh"]);
    expect(plan.createdBy).toBe(mockUser.id);
    expect(plan.ownerName).toBe(mockUser.fullName);
    expect(plan.status).toBe("draft");
    expect(plan.createdAt).toEqual(expect.any(String));
    expect(plan.updatedAt).toEqual(expect.any(String));
  });

  it("converts an existing plan back to editable form values", () => {
    const plan = createPlan();

    expect(investmentPlanToFormValues(plan)).toEqual({
      title: plan.title,
      year: "2026",
      quarter: "Q2",
      targetArea: plan.targetArea,
      projectType: plan.projectType,
      budgetRange: plan.budgetRange,
      priority: "strategic",
      status: "draft",
    });
  });

  it("updates mutable investment plan fields while preserving identity", () => {
    const plan = createPlan();
    const updatedInput = parseInvestmentPlanFormValues({
      ...defaultInvestmentPlanFormValues(),
      title: "Ke hoach dau tu quy 3",
      year: "2027",
      quarter: "Q3",
      targetArea: "Da Nang",
      projectType: "Can ho dich vu",
      budgetRange: "850 ty",
      priority: "high",
      status: "reviewing",
    });

    const updatedPlan = updateInvestmentPlanFromInput({
      input: updatedInput,
      plan,
    });

    expect(updatedPlan.id).toBe(plan.id);
    expect(updatedPlan.createdAt).toBe(plan.createdAt);
    expect(updatedPlan.title).toBe("Ke hoach dau tu quy 3");
    expect(updatedPlan.year).toBe(2027);
    expect(updatedPlan.status).toBe("reviewing");
    expect(updatedPlan.targetAreas).toEqual(["Da Nang"]);
    expect(Date.parse(updatedPlan.updatedAt)).toBeGreaterThanOrEqual(
      Date.parse(plan.updatedAt),
    );
  });

  it("updates investment plan status for approval review actions", () => {
    const plan = createPlan();
    const reviewedPlan = updateInvestmentPlanStatus({
      plan,
      status: "approved",
    });

    expect(reviewedPlan.id).toBe(plan.id);
    expect(reviewedPlan.status).toBe("approved");
    expect(Date.parse(reviewedPlan.updatedAt)).toBeGreaterThanOrEqual(
      Date.parse(plan.updatedAt),
    );
  });

  it("rejects invalid form values before creating a plan", () => {
    expect(() =>
      parseInvestmentPlanFormValues({
        ...defaultInvestmentPlanFormValues(),
        title: "",
      }),
    ).toThrow(ZodError);
  });
});
