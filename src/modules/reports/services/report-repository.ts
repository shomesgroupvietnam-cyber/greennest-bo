import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { selectRepository } from "@/lib/db/repository-mode";
import type { ReportListFilters, ReportRun, ReportSnapshot, ReportType } from "@/modules/reports/types";

type ReportStore = {
  reports: ReportRun[];
};

const emptyStore: ReportStore = {
  reports: []
};

export type ReportRepository = {
  listReports(filters?: ReportListFilters): Promise<ReportRun[]>;
  getReport(reportId: string): Promise<ReportRun | undefined>;
  createReport(report: ReportRun): Promise<ReportRun>;
};

export class JsonReportRepository implements ReportRepository {
  constructor(private readonly filePath = path.join(process.cwd(), ".mock-data", "reports.json")) {}

  async listReports(filters: ReportListFilters = {}) {
    const store = await this.readStore();

    return store.reports
      .filter((report) => !filters.projectId || filters.projectId === "all" || report.projectId === filters.projectId)
      .filter((report) => !filters.reportType || filters.reportType === "all" || report.reportType === filters.reportType)
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  }

  async getReport(reportId: string) {
    const store = await this.readStore();

    return store.reports.find((report) => report.id === reportId);
  }

  async createReport(report: ReportRun) {
    const store = await this.readStore();

    await this.writeStore({
      reports: [report, ...store.reports]
    });

    return report;
  }

  private async readStore(): Promise<ReportStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<ReportStore>;

      return {
        reports: parsed.reports ?? []
      };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (code === "ENOENT") {
        return emptyStore;
      }

      throw error;
    }
  }

  private async writeStore(store: ReportStore) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  }
}

type ReportRunRow = {
  id: string;
  project_id: string;
  report_type: ReportType;
  title: string;
  generated_by: string | null;
  generated_at: string;
  snapshot: ReportSnapshot;
};

function toReport(row: ReportRunRow): ReportRun {
  return {
    id: row.id,
    projectId: row.project_id,
    reportType: row.report_type,
    title: row.title,
    generatedBy: row.generated_by ?? "unknown",
    generatedAt: row.generated_at,
    snapshot: row.snapshot
  };
}

function reportToRow(report: ReportRun) {
  return {
    id: report.id,
    project_id: report.projectId,
    report_type: report.reportType,
    title: report.title,
    generated_by: report.generatedBy,
    generated_at: report.generatedAt,
    snapshot: report.snapshot
  };
}

export class SupabaseReportRepository implements ReportRepository {
  async listReports(filters: ReportListFilters = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("report_runs").select("*");

    if (filters.projectId && filters.projectId !== "all") {
      query = query.eq("project_id", filters.projectId);
    }

    if (filters.reportType && filters.reportType !== "all") {
      query = query.eq("report_type", filters.reportType);
    }

    const { data, error } = await query.order("generated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as ReportRunRow[]).map(toReport);
  }

  async getReport(reportId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("report_runs").select("*").eq("id", reportId).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toReport(data as ReportRunRow) : undefined;
  }

  async createReport(report: ReportRun) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("report_runs").insert(reportToRow(report)).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    return toReport(data as ReportRunRow);
  }
}

export const jsonReportRepository = new JsonReportRepository();
export const supabaseReportRepository = new SupabaseReportRepository();
export const reportRepository = selectRepository<ReportRepository>({
  mock: jsonReportRepository,
  supabase: supabaseReportRepository
});
