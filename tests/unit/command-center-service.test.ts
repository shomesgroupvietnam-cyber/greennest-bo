import { describe, expect, it } from "vitest";

import type { PermissionUser } from "@/lib/permissions/can";
import { getCommandCenterData } from "@/modules/command-center/services/command-center-service";

const founder: PermissionUser = { id: "founder-user", role: "tong_giam_doc" };
const employee: PermissionUser = { id: "employee-user", role: "ke_toan" };

describe("command center service", () => {
  it("returns all three axes and executive dashboard sections", async () => {
    const data = await getCommandCenterData(founder);

    expect(data.axes.map((axis) => axis.title)).toEqual([
      "Dự án | Project Management",
      "Kiến tạo | Build Management",
      "Điều hành | Operations & Analytics",
    ]);
    expect(data.axes[0].items.map((item) => item.label)).toContain(
      "Ban lãnh đạo",
    );
    expect(data.axes[0].items.map((item) => item.label)).toContain(
      "Đề xuất - Họp - Phê duyệt nội bộ",
    );
    const executiveItem = data.axes[0].items.find((item) => item.code === "01");

    expect(executiveItem?.href).toBe(
      "/command-center?view=executive-dashboard",
    );
    expect(executiveItem?.children).toBeUndefined();
    expect(
      data.axes.flatMap((axis) => axis.items).every((item) => item.viewKey),
    ).toBe(true);
    expect(data.kpis.length).toBeGreaterThanOrEqual(5);
    expect(data.projects.length).toBeGreaterThan(0);
    expect(data.overdueTasks.length).toBeGreaterThan(0);
    expect(data.schedule.length).toBeGreaterThan(0);
    expect(data.aiSuggestions.length).toBeGreaterThan(0);
    expect(data.executiveWorkspace.globalStatusItems.length).toBeGreaterThan(0);
    expect(data.executiveWorkspace.access?.operatingRole).toBe("CEO");
    expect(data.executiveWorkspace.axisDefinitions.map((axis) => axis.id)).toEqual([
      "project_management",
      "build_management",
      "operations_analytics",
    ]);
    expect(data.executiveWorkspace.roleDefinitions.map((role) => role.role)).toEqual(
      expect.arrayContaining(["CHAIRMAN", "CEO", "PROJECT_DIRECTOR"]),
    );
    expect(data.executiveWorkspace.strategicPlans.length).toBeGreaterThan(0);
    expect(data.executiveWorkspace.leadershipTeam.length).toBeGreaterThan(0);
    expect(data.executiveWorkspace.directives.length).toBeGreaterThan(0);
    expect(data.executiveWorkspace.meetings.length).toBeGreaterThan(0);
    expect(data.executiveWorkspace.approvals.length).toBeGreaterThan(0);
    expect(data.executiveWorkspace.decisionLog.length).toBeGreaterThan(0);
    expect(data.executiveWorkspace.auditLog.length).toBeGreaterThan(0);
    expect(data.executiveWorkspace.aiInsights.length).toBeGreaterThan(0);
    expect(data.executiveWorkspace.overviewCards).toHaveLength(5);
    expect(
      data.executiveWorkspace.commandCenterSnapshot.notes.length,
    ).toBeGreaterThan(0);
    expect(
      data.executiveWorkspace.commandCenterSnapshot.quickReports.length,
    ).toBeGreaterThanOrEqual(5);
    expect(
      data.executiveWorkspace.leadershipActionItems.length,
    ).toBeGreaterThan(0);
    expect(
      new Set(
        data.executiveWorkspace.leadershipActionItems.map((item) => item.axis),
      ),
    ).toEqual(
      new Set([
        "project_management",
        "build_management",
        "operations_analytics",
      ]),
    );
    expect(
      data.executiveWorkspace.aiLeadershipSummary.weeklyPriorities.length,
    ).toBeGreaterThan(0);
  });

  it("does not expose executive dashboard data to non-leadership employees", async () => {
    const data = await getCommandCenterData(employee);

    expect(
      data.axes
        .flatMap((axis) => axis.items)
        .some((item) => item.viewKey === "executive-dashboard"),
    ).toBe(false);
    expect(data.executiveWorkspace.overviewCards).toEqual([]);
    expect(data.executiveWorkspace.access).toBeNull();
    expect(data.executiveWorkspace.axisDefinitions).toEqual([]);
    expect(data.executiveWorkspace.leadershipActionItems).toEqual([]);
    expect(data.executiveWorkspace.commandCenterSnapshot.quickReports).toEqual(
      [],
    );
  });
});
