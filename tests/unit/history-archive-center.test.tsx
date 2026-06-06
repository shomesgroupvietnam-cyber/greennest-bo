import { fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { HistoryArchiveCenter } from "@/modules/reports/components/history-archive-center";
import { HistoryArchiveCenterSkeleton } from "@/modules/reports/components/history-archive-center";
import type { HistoryArchiveCenterData } from "@/modules/reports/types";

function historyData(
  overrides: Partial<HistoryArchiveCenterData["archive"]> = {},
): HistoryArchiveCenterData {
  return {
    archive: {
      filters: {
        limit: 100,
        query: "DX-001",
        severity: "critical",
      },
      generatedAt: "2026-06-03T08:00:00.000Z",
      items: [
        {
          actorId: "leader-01",
          href: "/approvals/proposal/proposal-01",
          id: "approval:proposal-decision-01",
          module: "approvals",
          occurredAt: "2026-06-03T07:00:00.000Z",
          scope: {
            projectId: "project-a",
            recordId: "proposal-01",
          },
          severity: "critical",
          source: {
            metadata: {
              approvalLevel: "CEO",
              forbiddenRawPayload: "RAW_AUDIT_SENTINEL",
            },
            sourceId: "proposal-01",
            sourceLabel: "DX-001 - Budget approval",
            sourceType: "proposal",
          },
          status: "approved",
          summary: "De xuat DX-001 da duyet an toan.",
          type: "approval",
        },
        {
          actorId: "leader-02",
          href: "https://unsafe.example/audit",
          id: "audit:audit-01",
          module: "audit",
          occurredAt: "2026-06-03T06:00:00.000Z",
          scope: {
            recordId: "audit-01",
          },
          severity: "warning",
          source: {
            metadata: {
              changedFields: "status",
            },
            sourceId: "audit-01",
            sourceType: "audit",
          },
          status: "updated",
          summary: "Audit status updated.",
          type: "audit",
        },
      ],
      permissions: {
        canView: true,
        canViewAudit: true,
        canViewSearchHistory: true,
      },
      sourceCounts: {
        approval: 1,
        audit: 1,
      },
      total: 2,
      ...overrides,
    },
    filterOptions: {
      actors: [{ id: "leader-01", label: "leader-01" }],
      modules: [{ label: "Approvals", value: "approvals" }],
      projects: [{ id: "project-a", label: "P-A - Green Nest A" }],
      severities: [{ label: "Critical", value: "critical" }],
      statuses: ["approved"],
      types: [{ label: "Approval", value: "approval" }],
    },
    preservedParams: {
      scopeId: "scope-a",
      view: "executive-history",
    },
  };
}

describe("HistoryArchiveCenter", () => {
  it("renders filters and timeline events without raw metadata leakage", () => {
    render(<HistoryArchiveCenter data={historyData()} />);

    expect(screen.getByRole("search", { name: "Bo loc lich su" })).toBeInTheDocument();
    expect(screen.getByText("DX-001")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Limit" })).toHaveValue("100");
    expect(screen.getByText(/Approval: 1/)).toBeInTheDocument();
    expect(screen.getByText(/Audit: 1/)).toBeInTheDocument();

    const timeline = screen.getByRole("list", { name: "Lich su dieu hanh" });
    const items = within(timeline).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("De xuat DX-001 da duyet an toan.");
    expect(items[0]).toHaveTextContent("Actor: leader-01");
    expect(items[0]).toHaveTextContent("critical");
    expect(items[1]).toHaveTextContent("Audit status updated.");
    expect(screen.queryByText("RAW_AUDIT_SENTINEL")).not.toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Mo nguon DX-001 - Budget approval" }),
    ).toHaveAttribute("href", "/approvals/proposal/proposal-01");
    expect(screen.queryByRole("link", { name: /audit-01/i })).not.toBeInTheDocument();
  });

  it("preserves non-default limit as URL state and active filter context", () => {
    render(
      <HistoryArchiveCenter
        data={historyData({
          filters: {
            limit: 50,
            query: "DX-001",
          },
        })}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Limit" })).toHaveValue("50");
    expect(screen.getByRole("link", { name: /Limit:\s*50/i })).toHaveAttribute(
      "href",
      expect.stringContaining("query=DX-001"),
    );
    expect(screen.getByRole("link", { name: /Search:\s*DX-001/i })).toHaveAttribute(
      "href",
      expect.stringContaining("limit=50"),
    );
  });

  it("renders export controls from server permissions and preserves filter context", () => {
    const { rerender } = render(
      <HistoryArchiveCenter
        data={historyData({
          permissions: {
            canExport: true,
            canView: true,
            canViewAudit: false,
            canViewSearchHistory: true,
            exportTargets: ["dashboard", "approval_history"],
          },
        })}
      />,
    );

    const approvalExport = screen.getByRole("button", { name: "Approvals CSV" });
    const filterForm = screen.getByRole("search", { name: "Bo loc lich su" });
    const searchInput = screen.getByRole("searchbox", { name: "Search" });

    expect(screen.getByRole("button", { name: "Dashboard JSON" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Audit CSV" })).not.toBeInTheDocument();
    expect(filterForm).toHaveAttribute("action", "/command-center");
    expect(filterForm).toHaveAttribute("method", "get");
    expect(approvalExport).toHaveAttribute("formaction", "/reports/export");
    expect(filterForm.querySelector('input[name="scopeId"]')).toHaveValue("scope-a");
    expect(searchInput).toHaveValue("DX-001");

    fireEvent.change(searchInput, { target: { value: "narrowed export" } });
    fireEvent.mouseDown(approvalExport);

    expect(filterForm.querySelector('input[name="target"]')).toHaveValue("approval_history");
    expect(filterForm.querySelector('input[name="format"]')).toHaveValue("csv");
    expect(searchInput).toHaveValue("narrowed export");
    expect(screen.getByRole("combobox", { name: "Severity" })).toHaveValue("critical");
    expect(screen.getByRole("combobox", { name: "Limit" })).toHaveValue("100");

    rerender(
      <HistoryArchiveCenter
        data={historyData({
          permissions: {
            canExport: true,
            canView: true,
            canViewAudit: true,
            canViewSearchHistory: true,
            exportTargets: ["dashboard", "approval_history", "audit_log"],
          },
        })}
      />,
    );

    expect(screen.getByRole("button", { name: "Audit CSV" })).toBeInTheDocument();
  });

  it("orders focusable controls as filters, active chips, export controls and timeline", () => {
    render(
      <HistoryArchiveCenter
        data={historyData({
          permissions: {
            canExport: true,
            canView: true,
            canViewAudit: true,
            canViewSearchHistory: true,
            exportTargets: ["dashboard", "approval_history"],
          },
        })}
      />,
    );

    const filterForm = screen.getByRole("search", { name: "Bo loc lich su" });
    const chip = screen.getByRole("link", { name: /Search:\s*DX-001/i });
    const exportButton = screen.getByRole("button", { name: "Approvals CSV" });
    const timeline = screen.getByRole("list", { name: "Lich su dieu hanh" });

    expect(filterForm.compareDocumentPosition(chip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(chip.compareDocumentPosition(exportButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(exportButton.compareDocumentPosition(timeline) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders no-access and empty states distinctly", () => {
    const { rerender } = render(
      <HistoryArchiveCenter
        data={historyData({
          items: [],
          permissions: {
            canView: false,
            canViewAudit: false,
            canViewSearchHistory: false,
          },
          total: 0,
        })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Khong co quyen xem History & Archive" }),
    ).toBeInTheDocument();

    rerender(
      <HistoryArchiveCenter
        data={historyData({
          filters: { limit: 100, query: "nothing" },
          items: [],
          total: 0,
        })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Khong co ket qua theo filter" }),
    ).toBeInTheDocument();
  });

  it("renders empty scope without suggesting impossible clear-filter action", () => {
    render(
      <HistoryArchiveCenter
        data={historyData({
          filters: { limit: 100 },
          items: [],
          sourceCounts: {},
          total: 0,
        })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Khong co du lieu trong scope" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Clear active history filters" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Clear filters" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Approval: 1/)).not.toBeInTheDocument();
  });

  it("renders filtered empty state with clear action that preserves scope context", () => {
    render(
      <HistoryArchiveCenter
        data={historyData({
          filters: { limit: 100, query: "nothing" },
          items: [],
          total: 0,
        })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Khong co ket qua theo filter" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Clear active history filters" }),
    ).toHaveAttribute(
      "href",
      "/command-center?view=executive-history&scopeId=scope-a",
    );
  });

  it("keeps unauthorized state free of history counts, filters and export controls", () => {
    render(
      <HistoryArchiveCenter
        data={historyData({
          items: [],
          permissions: {
            canExport: true,
            canView: false,
            canViewAudit: true,
            canViewSearchHistory: false,
            exportTargets: ["dashboard", "approval_history", "audit_log"],
          },
          sourceCounts: {
            approval: 9,
            audit: 4,
          },
          total: 13,
        })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Khong co quyen xem History & Archive" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/13 events/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("search", { name: "Bo loc lich su" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Dashboard JSON" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Audit CSV" })).not.toBeInTheDocument();
  });

  it("does not render export controls when export permission is absent", () => {
    render(
      <HistoryArchiveCenter
        data={historyData({
          permissions: {
            canExport: false,
            canView: true,
            canViewAudit: true,
            canViewSearchHistory: true,
            exportTargets: ["dashboard", "approval_history", "audit_log"],
          },
        })}
      />,
    );

    expect(screen.queryByRole("button", { name: "Dashboard JSON" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approvals CSV" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Audit CSV" })).not.toBeInTheDocument();
  });

  it("renders shared loading and safe error states without raw sentinel text", () => {
    render(
      <>
        <LoadingState description="Dang tai History Center" title="Dang tai lich su" />
        <ErrorState
          action={<a href="/command-center">Retry history</a>}
          backHref="/command-center"
          backLabel="Back to command center"
          description="Khong the tai History Center luc nay."
          rawErrorForLogging="RAW_STACK_SENTINEL"
          title="Khong the tai lich su"
        />
        <HistoryArchiveCenterSkeleton />
      </>,
    );

    expect(screen.getByRole("status", { name: "Dang tai lich su" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Khong the tai lich su" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retry history" })).toHaveAttribute(
      "href",
      "/command-center",
    );
    expect(screen.getByRole("link", { name: "Back to command center" })).toHaveAttribute(
      "href",
      "/command-center",
    );
    expect(screen.getByRole("status", { name: "Dang tai History & Archive" })).toBeInTheDocument();
    expect(screen.queryByText("RAW_STACK_SENTINEL")).not.toBeInTheDocument();
  });
});
