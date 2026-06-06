import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/(dashboard)/reports/export/route";
import { getCurrentUser } from "@/lib/auth/session";
import type { AppSessionUser } from "@/lib/auth/session";
import { exportReportData } from "@/modules/reports/services/report-export-service";

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/modules/reports/services/report-export-service", () => ({
  exportReportData: vi.fn(),
}));

const routeUser: AppSessionUser = {
  email: "exporter@example.test",
  fullName: "Export User",
  id: "exporter-01",
  permissions: ["report.export", "report.view"],
  permissionsMode: "replace",
  role: "viewer",
  status: "active",
};

describe("report export route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue(routeUser);
  });

  it("returns export content with sensitive-download headers", async () => {
    vi.mocked(exportReportData).mockResolvedValueOnce({
      content: "id,summary\napproval-01,Safe summary",
      exportId: "export-01",
      filename: "approval-history.csv",
      format: "csv",
      generatedAt: "2026-06-04T00:00:00.000Z",
      mimeType: "text/csv; charset=utf-8",
      summary: {
        exportId: "export-01",
        format: "csv",
        itemCount: 1,
        redactedFields: [],
        sensitiveIncluded: false,
        target: "approval_history",
        total: 1,
      },
      target: "approval_history",
    });

    const response = await GET(
      new Request("http://localhost/reports/export?target=approval_history&format=csv"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store, private");
    expect(response.headers.get("pragma")).toBe("no-cache");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="approval-history.csv"',
    );
    expect(await response.text()).toContain("Safe summary");
  });

  it("returns a safe 403 body for permission failures without raw error details", async () => {
    vi.mocked(exportReportData).mockRejectedValueOnce(
      new Error("Ban khong co quyen xuat audit log."),
    );

    const response = await GET(
      new Request("http://localhost/reports/export?target=audit_log&format=csv"),
    );
    const body = await response.text();

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store, private");
    expect(response.headers.get("pragma")).toBe("no-cache");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(body).toBe("Ban khong co quyen xuat du lieu.");
  });

  it("returns a safe 400 body for missing direct download params without loading export data", async () => {
    const response = await GET(
      new Request("http://localhost/reports/export?query=RAW_ZOD_SENTINEL"),
    );
    const body = await response.text();

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(body).toBe("Khong the xuat du lieu voi yeu cau hien tai.");
    expect(body).not.toContain("RAW_ZOD_SENTINEL");
    expect(getCurrentUser).not.toHaveBeenCalled();
    expect(exportReportData).not.toHaveBeenCalled();
  });

  it("returns a safe 400 body for invalid export requests before calling export service", async () => {
    const response = await GET(
      new Request("http://localhost/reports/export?target=approval_history&format=csv&dateFrom=2026-02-31"),
    );
    const body = await response.text();

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(body).toBe("Khong the xuat du lieu voi yeu cau hien tai.");
    expect(body).not.toContain("RAW_ZOD_SENTINEL");
    expect(getCurrentUser).not.toHaveBeenCalled();
    expect(exportReportData).not.toHaveBeenCalled();
  });

  it("returns a safe 500 body for unexpected export failures without raw details", async () => {
    vi.mocked(exportReportData).mockRejectedValueOnce(
      new Error("Database timeout RAW_SERVER_SENTINEL"),
    );

    const response = await GET(
      new Request("http://localhost/reports/export?target=approval_history&format=csv"),
    );
    const body = await response.text();

    expect(response.status).toBe(500);
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(body).toBe("Khong the xuat du lieu luc nay.");
    expect(body).not.toContain("RAW_SERVER_SENTINEL");
  });
});
