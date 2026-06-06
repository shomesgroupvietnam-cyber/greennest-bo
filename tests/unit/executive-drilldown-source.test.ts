import { describe, expect, it } from "vitest";

import {
  enrichExecutiveSourceItem,
  safeInternalHref,
} from "@/modules/dashboard/services/executive-drilldown-source";

const basePermissions = {
  canDrillDown: true,
  canViewDecisions: true,
  canViewFinance: false,
  canViewMeetings: true,
  canViewProjects: true,
  canViewProposals: true,
  canViewRisk: true,
  canCreateRisk: false,
  canUpdateRisk: false,
  canOverrideRisk: false,
  canCloseRisk: false,
  canCloseHighRisk: false,
};

describe("executive drill-down source helpers", () => {
  it("keeps only safe internal hrefs", () => {
    expect(safeInternalHref("/projects/demo-project-riverside")).toBe(
      "/projects/demo-project-riverside",
    );
    expect(safeInternalHref("https://example.test/unsafe")).toBeUndefined();
    expect(safeInternalHref("//example.test/unsafe")).toBeUndefined();
    expect(safeInternalHref("javascript:alert(1)")).toBeUndefined();
  });

  it("enriches source metadata and strips finance fields when finance is denied", () => {
    const item = enrichExecutiveSourceItem(
      {
        amount: 9999000000,
        amountLabel: "SECRET_BUDGET_SENTINEL",
        financialAccess: "no_permission",
        id: "approval-secret",
        projectId: "demo-project-riverside",
        reason: "Approval needs review",
        sourceId: "proposal-secret",
        sourceType: "proposal",
        status: "pending",
        title: "Proposal source",
        tone: "amber",
      },
      {
        permissions: basePermissions,
        scopeLabel: "Riverside scope",
      },
    );

    expect(JSON.stringify(item)).not.toContain("SECRET_BUDGET_SENTINEL");
    expect(JSON.stringify(item)).not.toContain("9999000000");
    expect(item.href).toBe("/proposals/proposal-secret");
    expect(item.scopeLabel).toBe("Riverside scope");
    expect(item.permissionState).toBe("allowed");
    expect(item.linkedRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: "/projects/demo-project-riverside",
          permissionState: "allowed",
          title: "Project demo-project-riverside",
        }),
      ]),
    );
    expect(item.availableActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          enabled: true,
          href: "/proposals/proposal-secret",
          label: "Mo nguon",
        }),
      ]),
    );
    expect(item.timeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Trang thai hien tai",
          status: "pending",
        }),
      ]),
    );
  });
});
