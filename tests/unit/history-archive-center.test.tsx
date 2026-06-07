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

    expect(screen.getByRole("search", { name: /B. l.c l.ch s./i })).toBeInTheDocument();
    expect(screen.getByText("DX-001")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /S. d.ng/i })).toHaveValue("100");
    expect(screen.getByText(/Ph. duy.t: 1/)).toBeInTheDocument();
    expect(screen.getByText(/Ki.m to.n: 1/)).toBeInTheDocument();

    const timeline = screen.getByRole("list", { name: /L.ch s. .i.u h.nh/i });
    const items = within(timeline).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("De xuat DX-001 da duyet an toan.");
    expect(items[0]).toHaveTextContent(/Ng..i th.c hi.n: leader-01/);
    expect(items[0]).toHaveTextContent("critical");
    expect(items[1]).toHaveTextContent("Audit status updated.");
    expect(screen.queryByText("RAW_AUDIT_SENTINEL")).not.toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /M. ngu.n DX-001 - Budget approval/i }),
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

    expect(screen.getByRole("combobox", { name: /S. d.ng/i })).toHaveValue("50");
    expect(screen.getByRole("link", { name: /S.* d.*ng:\s*50/i })).toHaveAttribute(
      "href",
      expect.stringContaining("query=DX-001"),
    );
    expect(screen.getByRole("link", { name: /T.*m ki.*m:\s*DX-001/i })).toHaveAttribute(
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

    const approvalExport = screen.getByRole("button", { name: /L.*ch s.* ph.* duy.*t.*CSV/i });
    const filterForm = screen.getByRole("search", { name: /B. l.c l.ch s./i });
    const searchInput = screen.getByRole("searchbox", { name: /T.*m ki.*m/i });

    expect(screen.getByRole("button", { name: /D.*li.*u Dashboard.*JSON/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Nh.*t k.* ki.*m to.*n.*CSV/i })).not.toBeInTheDocument();
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
    expect(screen.getByRole("combobox", { name: /M.c/i })).toHaveValue("critical");
    expect(screen.getByRole("combobox", { name: /S. d.ng/i })).toHaveValue("100");

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

    expect(screen.getByRole("button", { name: /Nh.*t k.* ki.*m to.*n.*CSV/i })).toBeInTheDocument();
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

    const filterForm = screen.getByRole("search", { name: /B. l.c l.ch s./i });
    const chip = screen.getByRole("link", { name: /T.*m ki.*m:\s*DX-001/i });
    const exportButton = screen.getByRole("button", { name: /L.*ch s.* ph.* duy.*t.*CSV/i });
    const timeline = screen.getByRole("list", { name: /L.ch s. .i.u h.nh/i });

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
      screen.getByRole("heading", { name: /Kh.*ng c.* quy.*n xem L.*ch S.* V.* L.*u Tr.*/i }),
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
      screen.getByRole("heading", { name: /Kh.*ng c.* k.*t qu.* theo b.* l.*c/i }),
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
      screen.getByRole("heading", { name: /Kh.*ng c.* d.* li.*u trong ph.*m vi/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /X.*a b.* l.*c l.*ch s.* .ang .p d.ng/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /X.*a b.* l.*c/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Ph. duy.t: 1/)).not.toBeInTheDocument();
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
      screen.getByRole("heading", { name: /Kh.*ng c.* k.*t qu.* theo b.* l.*c/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /X.*a b.* l.*c l.*ch s.* .ang .p d.ng/i }),
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
      screen.getByRole("heading", { name: /Kh.*ng c.* quy.*n xem L.*ch S.* V.* L.*u Tr.*/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/13 events/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("search", { name: /B. l.c l.ch s./i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /D.*li.*u Dashboard.*JSON/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Nh.*t k.* ki.*m to.*n.*CSV/i })).not.toBeInTheDocument();
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

    expect(screen.queryByRole("button", { name: /D.*li.*u Dashboard.*JSON/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /L.*ch s.* ph.* duy.*t.*CSV/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Nh.*t k.* ki.*m to.*n.*CSV/i })).not.toBeInTheDocument();
  });

  it("renders shared loading and safe error states without raw sentinel text", () => {
    render(
      <>
        <LoadingState description="Dang tai Lich Su Va Luu Tru" title="Dang tai lich su" />
        <ErrorState
          action={<a href="/command-center">Retry history</a>}
          backHref="/command-center"
          backLabel="Back to command center"
          description="Khong the tai Lich Su Va Luu Tru luc nay."
          rawErrorForLogging="RAW_STACK_SENTINEL"
          title="Khong the tai lich su"
        />
        <HistoryArchiveCenterSkeleton />
      </>,
    );

    expect(screen.getByRole("status", { name: /Dang tai lich su/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Khong the tai lich su" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retry history" })).toHaveAttribute(
      "href",
      "/command-center",
    );
    expect(screen.getByRole("link", { name: "Back to command center" })).toHaveAttribute(
      "href",
      "/command-center",
    );
    expect(screen.getByRole("status", { name: /.*ng t.*i L.*ch S.* V.* L.*u Tr.*/i })).toBeInTheDocument();
    expect(screen.queryByText("RAW_STACK_SENTINEL")).not.toBeInTheDocument();
  });
});
