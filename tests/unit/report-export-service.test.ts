import { describe, expect, it, vi } from "vitest";

import { exportReportData } from "@/modules/reports/services/report-export-service";
import type { PermissionUser } from "@/lib/permissions/can";
import type { ExecutiveDashboardData } from "@/modules/dashboard/types";
import type { HistoryArchiveData, HistoryArchiveEvent } from "@/modules/reports/types";
import type { RolePermissionCatalog, ScopeAssignment } from "@/modules/settings/types";
import type { AuditLog } from "@/modules/users/types";

const generatedAt = "2026-06-03T10:00:00.000Z";
const exporter: PermissionUser = {
  id: "exporter-01",
  role: "viewer",
  permissions: ["report.export", "report.view"],
  permissionsMode: "replace",
};
const exportScope: ScopeAssignment = {
  active: true,
  createdAt: "2026-06-01T00:00:00.000Z",
  id: "scope-riverside",
  permissionKeys: ["report.export", "report.view", "audit.view"],
  projectId: "project-visible",
  roleKey: "viewer",
  scopeType: "scoped",
  updatedAt: "2026-06-01T00:00:00.000Z",
  userId: exporter.id,
};

function roleCatalog(permissionKeys = exportScope.permissionKeys): RolePermissionCatalog {
  return {
    assignments: [],
    permissions: [],
    roles: [
      {
        active: true,
        key: "viewer",
        labelVi: "Viewer",
        permissionKeys,
        scope: "project",
      },
    ],
  };
}

function auditWriter() {
  return vi.fn(async (input: Omit<AuditLog, "id" | "createdAt">) => ({
    ...input,
    id: "audit-export-01",
    createdAt: generatedAt,
  }));
}

function historyEvent(overrides: Partial<HistoryArchiveEvent> = {}): HistoryArchiveEvent {
  return {
    id: "approval:visible-01",
    type: "approval",
    module: "approvals",
    actorId: "approver-01",
    occurredAt: "2026-06-02T09:00:00.000Z",
    scope: {
      projectId: "project-visible",
      recordId: "proposal-visible",
    },
    summary: "De xuat trong scope da duoc duyet.",
    status: "approved",
    source: {
      sourceType: "proposal",
      sourceId: "proposal-visible",
      sourceLabel: "Proposal visible",
      metadata: {
        approvalLevel: "CEO",
      },
    },
    severity: "info",
    ...overrides,
  };
}

function historyData(items: HistoryArchiveEvent[]): HistoryArchiveData {
  return {
    generatedAt,
    filters: {
      projectId: "project-visible",
      type: "approval",
      limit: 50,
    },
    permissions: {
      canView: true,
      canViewAudit: true,
      canViewSearchHistory: false,
    },
    sourceCounts: {
      approval: items.filter((item) => item.type === "approval").length,
      audit: items.filter((item) => item.type === "audit").length,
    },
    total: items.length,
    items,
  };
}

function dashboardData(overrides: Partial<ExecutiveDashboardData> = {}): ExecutiveDashboardData {
  return {
    generatedAt,
    scope: {
      selectedScopeId: "scope-riverside",
      scopeLabel: "Riverside",
      organizationIds: [],
      projectIds: ["project-visible"],
      axisIds: [],
      moduleIds: [],
    },
    permissions: {
      canViewProjects: true,
      canViewProposals: true,
      canViewMeetings: true,
      canViewDecisions: true,
      canViewRisk: true,
      canCreateRisk: false,
      canUpdateRisk: false,
      canOverrideRisk: false,
      canCloseRisk: false,
      canCloseHighRisk: false,
      canViewFinance: false,
      canDrillDown: true,
    },
    projectPortfolio: {
      total: 1,
      active: 1,
      red: 0,
      yellow: 1,
      green: 0,
      items: [
        {
          id: "project-project-visible",
          sourceType: "project",
          sourceId: "project-visible",
          projectId: "project-visible",
          title: "Riverside",
          status: "yellow",
          tone: "amber",
          health: "yellow",
          financialAccess: "no_permission",
          cashFlowLabel: "999999999 VND",
        },
      ],
    },
    kpis: [
      {
        id: "pending-approvals",
        label: "Cho duyet",
        value: 1,
        tone: "amber",
      },
    ],
    financialSummary: {
      state: "no_permission",
      reason: "User does not have finance.view.",
    },
    approvalSummary: {
      pending: 1,
      overdue: 0,
      highRisk: 0,
      items: [
        {
          id: "approval-sensitive",
          sourceType: "proposal",
          sourceId: "proposal-sensitive",
          projectId: "project-visible",
          title: "Proposal sensitive",
          status: "in_review",
          tone: "amber",
          financialAccess: "no_permission",
          amount: 999999999,
          amountLabel: "999999999 VND",
        },
      ],
    },
    riskSummary: {
      critical: 0,
      high: 0,
      byCategory: {},
      riskMap: {
        total: 0,
        affectedProjectCount: 0,
        categories: [],
        matrix: [],
      },
      items: [],
    },
    riskMutationOptions: {
      categories: [],
      projects: [],
      owners: [],
      delegations: [],
    },
    todayDeadlines: {
      overdue: 0,
      today: 0,
      items: [],
    },
    recentDecisions: {
      items: [],
    },
    meetingSnapshot: {
      total: 0,
      today: 0,
      upcoming: 0,
      followUpsOverdue: 0,
      items: [],
    },
    sourceCounts: {
      projects: 1,
      proposals: 1,
      leadershipApprovals: 0,
      executiveActions: 0,
      meetings: 0,
      decisions: 0,
    },
    ...overrides,
  };
}

describe("report export service", () => {
  it("exports approval history from visible scoped archive data and writes safe audit summary", async () => {
    const writer = auditWriter();
    const historyArchiveLoader = vi.fn(async () =>
      historyData([historyEvent()]),
    );

    const result = await exportReportData(
      exporter,
      {
        target: "approval_history",
        format: "json",
        filters: {
          projectId: "project-visible",
          query: "duyet",
          limit: 50,
        },
        scopeId: "scope-riverside",
      },
      {
        auditWriter: writer,
        historyArchiveLoader,
        idGenerator: () => "export-approval-01",
        now: () => generatedAt,
        rolePermissionCatalog: roleCatalog(),
        scopeAssignments: [exportScope],
      },
    );

    expect(historyArchiveLoader).toHaveBeenCalledWith(
      exporter,
      expect.objectContaining({
        projectId: "project-visible",
        module: "approvals",
        type: "approval",
        query: "duyet",
        limit: 50,
      }),
      expect.any(Object),
    );
    const firstHistoryCall = historyArchiveLoader.mock.calls[0] as unknown as [
      PermissionUser,
      unknown,
      unknown,
    ];

    expect(firstHistoryCall[2]).toMatchObject({
      scopeAssignments: [exportScope],
    });
    expect(result.summary).toMatchObject({
      itemCount: 1,
      total: 1,
      scopeId: "scope-riverside",
      sensitiveIncluded: false,
      redactedFields: [],
    });
    expect(JSON.parse(result.content).items).toHaveLength(1);
    expect(writer).toHaveBeenCalledWith({
      actorId: exporter.id,
      entityType: "report_export",
      entityId: "export-approval-01",
      action: "report.export",
      newValue: result.summary,
    });
    expect(JSON.stringify(writer.mock.calls[0][0].newValue)).not.toContain(
      "De xuat trong scope",
    );
  });

  it("does not let scoped export grants apply outside the requested scope", async () => {
    const writer = auditWriter();
    const scopedUser: PermissionUser = {
      id: "scoped-exporter-01",
      role: "pending",
      permissions: [],
      permissionsMode: "replace",
    };
    const scopeA: ScopeAssignment = {
      ...exportScope,
      id: "scope-a",
      permissionKeys: ["report.export", "report.view"],
      projectId: "project-a",
      userId: scopedUser.id,
    };
    const historyArchiveLoader = vi.fn(async () =>
      historyData([historyEvent({ scope: { projectId: "project-a", recordId: "proposal-a" } })]),
    );

    await expect(
      exportReportData(
        scopedUser,
        {
          target: "approval_history",
          format: "json",
          scopeId: "scope-b",
        },
        {
          auditWriter: writer,
          historyArchiveLoader,
          rolePermissionCatalog: roleCatalog(["report.export", "report.view"]),
          scopeAssignments: [scopeA],
        },
      ),
    ).rejects.toThrow(/scope/i);
    expect(historyArchiveLoader).not.toHaveBeenCalled();
    expect(writer).not.toHaveBeenCalled();

    const result = await exportReportData(
      scopedUser,
      {
        target: "approval_history",
        format: "json",
        scopeId: "scope-a",
      },
      {
        auditWriter: writer,
        historyArchiveLoader,
        idGenerator: () => "export-scoped-01",
        now: () => generatedAt,
        rolePermissionCatalog: roleCatalog(["report.export", "report.view"]),
        scopeAssignments: [scopeA],
      },
    );

    const lastHistoryCall = historyArchiveLoader.mock.calls.at(-1) as unknown as [
      PermissionUser,
      unknown,
      unknown,
    ];

    expect(result.summary.scopeId).toBe("scope-a");
    expect(lastHistoryCall[2]).toMatchObject({
      scopeAssignments: [scopeA],
    });
  });

  it("rejects inactive users even when they still have scoped export assignments", async () => {
    const writer = auditWriter();
    const inactiveUser: PermissionUser = {
      id: "inactive-exporter-01",
      role: "pending",
      permissions: [],
      permissionsMode: "replace",
      roleActive: false,
    };
    const inactiveScope: ScopeAssignment = {
      ...exportScope,
      id: "scope-inactive",
      permissionKeys: ["report.export", "report.view"],
      userId: inactiveUser.id,
    };
    const historyArchiveLoader = vi.fn(async () => historyData([]));

    await expect(
      exportReportData(
        inactiveUser,
        {
          target: "approval_history",
          format: "json",
          scopeId: "scope-inactive",
        },
        {
          auditWriter: writer,
          historyArchiveLoader,
          rolePermissionCatalog: roleCatalog(["report.export", "report.view"]),
          scopeAssignments: [inactiveScope],
        },
      ),
    ).rejects.toThrow(/quyen|permission|export/i);

    expect(historyArchiveLoader).not.toHaveBeenCalled();
    expect(writer).not.toHaveBeenCalled();
  });

  it("rejects before loading sources or audit when user lacks report.export", async () => {
    const writer = auditWriter();
    const historyArchiveLoader = vi.fn(async () => historyData([]));

    await expect(
      exportReportData(
        {
          id: "viewer-01",
          role: "viewer",
          permissions: ["report.view"],
          permissionsMode: "replace",
        },
        {
          target: "approval_history",
          format: "json",
        },
        {
          auditWriter: writer,
          historyArchiveLoader,
        },
      ),
    ).rejects.toThrow(/quyen|permission|export/i);

    expect(historyArchiveLoader).not.toHaveBeenCalled();
    expect(writer).not.toHaveBeenCalled();
  });

  it("blocks audit_log target without audit.view before creating payload or audit success", async () => {
    const writer = auditWriter();
    const historyArchiveLoader = vi.fn(async () => historyData([]));

    await expect(
      exportReportData(
        exporter,
        {
          target: "audit_log",
          format: "json",
        },
        {
          auditWriter: writer,
          historyArchiveLoader,
        },
      ),
    ).rejects.toThrow(/audit|quyen|permission/i);

    expect(historyArchiveLoader).not.toHaveBeenCalled();
    expect(writer).not.toHaveBeenCalled();
  });

  it("redacts dashboard finance fields for users without finance.view", async () => {
    const writer = auditWriter();
    const dashboardLoader = vi.fn(async () => dashboardData());

    const result = await exportReportData(
      exporter,
      {
        target: "dashboard",
        format: "json",
        scopeId: "scope-riverside",
      },
      {
        auditWriter: writer,
        dashboardLoader,
        idGenerator: () => "export-dashboard-01",
        now: () => generatedAt,
        rolePermissionCatalog: roleCatalog(),
        scopeAssignments: [exportScope],
      },
    );
    const content = result.content;

    expect(dashboardLoader).toHaveBeenCalledWith(
      exporter,
      expect.objectContaining({
        selectedScopeId: "scope-riverside",
      }),
    );
    expect(content).toContain('"state":"no_permission"');
    expect(content).not.toContain("999999999");
    expect(content).not.toContain("amountLabel");
    expect(content).not.toContain("cashFlowLabel");
    expect(result.summary.redactedFields).toEqual(
      expect.arrayContaining(["financialSummary", "amount", "amountLabel", "cashFlowLabel"]),
    );
  });

  it("applies dashboard export filters before serializing the payload", async () => {
    const writer = auditWriter();
    const baseDashboard = dashboardData();
    const dashboardLoader = vi.fn(async () =>
      dashboardData({
        approvalSummary: {
          ...baseDashboard.approvalSummary,
          items: [
            ...baseDashboard.approvalSummary.items,
            {
              ...baseDashboard.approvalSummary.items[0],
              id: "approval-hidden",
              projectId: "project-hidden",
              sourceId: "proposal-hidden",
              title: "Hidden proposal",
            },
          ],
          pending: 2,
        },
        projectPortfolio: {
          ...baseDashboard.projectPortfolio,
          active: 2,
          items: [
            ...baseDashboard.projectPortfolio.items,
            {
              ...baseDashboard.projectPortfolio.items[0],
              id: "project-hidden",
              projectId: "project-hidden",
              sourceId: "project-hidden",
              title: "Hidden project",
            },
          ],
          total: 2,
          yellow: 2,
        },
      }),
    );

    const result = await exportReportData(
      exporter,
      {
        target: "dashboard",
        format: "json",
        filters: {
          limit: 1,
          projectId: "project-visible",
          query: "Proposal sensitive",
          type: "approval",
        },
        scopeId: "scope-riverside",
      },
      {
        auditWriter: writer,
        dashboardLoader,
        idGenerator: () => "export-dashboard-filtered-01",
        now: () => generatedAt,
        rolePermissionCatalog: roleCatalog(),
        scopeAssignments: [exportScope],
      },
    );
    const content = JSON.parse(result.content);

    expect(content.data.approvalSummary.items).toHaveLength(1);
    expect(content.data.approvalSummary.items[0].id).toBe("approval-sensitive");
    expect(content.data.projectPortfolio.items).toEqual([]);
    expect(result.summary.itemCount).toBe(1);
    expect(result.content).not.toContain("Hidden proposal");
    expect(result.content).not.toContain("Hidden project");
  });

  it("rejects invalid export filters instead of widening the export", async () => {
    const writer = auditWriter();
    const historyArchiveLoader = vi.fn(async () => historyData([]));

    await expect(
      exportReportData(
        exporter,
        {
          target: "approval_history",
          format: "json",
          filters: {
            dateFrom: "2026-02-31",
          },
        },
        {
          auditWriter: writer,
          historyArchiveLoader,
        },
      ),
    ).rejects.toThrow(/Invalid date filter/i);

    expect(historyArchiveLoader).not.toHaveBeenCalled();
    expect(writer).not.toHaveBeenCalled();
  });

  it("serializes CSV/JSON without raw audit values, meeting minutes, AI output, document URLs or provider metadata", async () => {
    const writer = auditWriter();
    const auditor: PermissionUser = {
      ...exporter,
      permissions: ["report.export", "report.view", "audit.view"],
    };
    const historyArchiveLoader = vi.fn(async () =>
      historyData([
        historyEvent({
          id: "audit:sensitive",
          type: "audit",
          module: "audit",
          summary: "Audit da sanitize",
          source: {
            sourceType: "audit",
            sourceId: "audit-sensitive",
            metadata: {
              changedFields: "status",
              oldValue: "raw-old-secret",
              newValue: "raw-new-secret",
              meetingMinutes: "raw meeting minutes",
              aiText: "raw ai output",
              documentUrl: "https://storage.example/raw.pdf",
              providerMetadata: "raw provider metadata",
              provider: "raw-provider",
            },
          },
        }),
      ]),
    );

    const csv = await exportReportData(
      auditor,
      {
        target: "audit_log",
        format: "csv",
      },
      {
        auditWriter: writer,
        historyArchiveLoader,
        idGenerator: () => "export-audit-01",
        now: () => generatedAt,
      },
    );
    const json = await exportReportData(
      auditor,
      {
        target: "audit_log",
        format: "json",
      },
      {
        auditWriter: writer,
        historyArchiveLoader,
        idGenerator: () => "export-audit-02",
        now: () => generatedAt,
      },
    );
    const combined = `${csv.content}\n${json.content}`;

    expect(combined).toContain("changedFields");
    for (const forbidden of [
      "raw-old-secret",
      "raw-new-secret",
      "raw meeting minutes",
      "raw ai output",
      "storage.example",
      "raw provider metadata",
      "raw-provider",
      "oldValue",
      "newValue",
      "documentUrl",
      "providerMetadata",
    ]) {
      expect(combined).not.toContain(forbidden);
    }
  });

  it("redacts free-text audit summaries from export payloads", async () => {
    const writer = auditWriter();
    const auditor: PermissionUser = {
      ...exporter,
      permissions: ["report.export", "report.view", "audit.view"],
    };
    const historyArchiveLoader = vi.fn(async () =>
      historyData([
        historyEvent({
          id: "audit:free-text",
          module: "audit",
          source: {
            sourceId: "audit-free-text",
            sourceType: "audit",
          },
          summary: "secret free-text reason should not leave the service",
          type: "audit",
        }),
      ]),
    );

    const result = await exportReportData(
      auditor,
      {
        target: "audit_log",
        format: "json",
      },
      {
        auditWriter: writer,
        historyArchiveLoader,
        idGenerator: () => "export-audit-redacted-01",
        now: () => generatedAt,
      },
    );

    expect(result.content).not.toContain("secret free-text reason");
    expect(result.summary.redactedFields).toContain("summary");
  });

  it("neutralizes spreadsheet formulas in CSV cells", async () => {
    const writer = auditWriter();
    const historyArchiveLoader = vi.fn(async () =>
      historyData([
        historyEvent({
          summary: "=HYPERLINK(\"https://example.invalid\")",
        }),
      ]),
    );

    const result = await exportReportData(
      exporter,
      {
        target: "approval_history",
        format: "csv",
      },
      {
        auditWriter: writer,
        historyArchiveLoader,
        idGenerator: () => "export-csv-safe-01",
        now: () => generatedAt,
      },
    );

    expect(result.content).toContain("'=HYPERLINK");
    expect(result.content).not.toContain("\n=HYPERLINK");
  });
});
