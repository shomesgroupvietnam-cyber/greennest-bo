import { describe, expect, it } from "vitest";

import { can } from "@/lib/permissions/can";
import {
  getAxisOneDashboardSummary,
  getAxisOneMissingDocuments,
  getAxisOneOpenTasks,
  getAxisOneRiskAlerts,
  getAxisOneStageById,
  getAxisOneStages,
} from "@/modules/axis-1/services/axis-one-service";

describe("axis one service", () => {
  it("returns the 12 project development stages with project scope", () => {
    const stages = getAxisOneStages();

    expect(stages).toHaveLength(12);
    expect(stages.map((stage) => stage.title)).toEqual([
      "Ý tưởng dự án",
      "Hồ sơ quỹ đất",
      "Kiểm tra quy hoạch",
      "Điều kiện phát triển NƠXH",
      "Phân tích tiền khả thi",
      "Hồ sơ năng lực chủ đầu tư",
      "Chấp thuận chủ trương đầu tư",
      "Quy hoạch chi tiết 1/500",
      "Thiết kế cơ sở",
      "Báo cáo nghiên cứu khả thi",
      "Chấp thuận chủ đầu tư",
      "Giao đất / cho thuê đất",
    ]);
    expect(stages.every((stage) => stage.projectId)).toBe(true);
    expect(stages.every((stage) => stage.requiredDocuments.length > 0)).toBe(
      true,
    );
  });

  it("builds dashboard counters from stage mock data", () => {
    const summary = getAxisOneDashboardSummary();

    expect(summary.totalStages).toBe(12);
    expect(summary.completionRate).toBeGreaterThan(0);
    expect(summary.missingDocuments).toBe(getAxisOneMissingDocuments().length);
    expect(summary.openTasks).toBe(getAxisOneOpenTasks().length);
    expect(summary.highRiskStages).toBe(getAxisOneRiskAlerts().length);
  });

  it("resolves stage detail by id", () => {
    expect(getAxisOneStageById("planning-check")?.title).toBe(
      "Kiểm tra quy hoạch",
    );
    expect(getAxisOneStageById("unknown-stage")).toBeNull();
  });

  it("keeps axis one hidden from viewer role", () => {
    expect(can("tong_giam_doc", "axis1.view")).toBe(true);
    expect(can("dau_tu_phat_trien", "axis1.view")).toBe(true);
    expect(can("viewer", "axis1.view")).toBe(false);
    expect(can("pending", "axis1.view")).toBe(false);
  });
});
