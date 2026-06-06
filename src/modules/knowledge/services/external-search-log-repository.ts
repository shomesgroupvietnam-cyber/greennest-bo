import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { selectRepository } from "@/lib/db/repository-mode";
import type { ExternalSearchLog } from "@/modules/knowledge/types";

type ExternalSearchLogStore = {
  logs: ExternalSearchLog[];
};

const emptyStore: ExternalSearchLogStore = {
  logs: []
};

export type ExternalSearchLogRepository = {
  createLog(log: ExternalSearchLog): Promise<ExternalSearchLog>;
  listLogs(filters?: ExternalSearchLogListFilters): Promise<ExternalSearchLog[]>;
};

export type ExternalSearchLogListFilters = {
  userId?: string;
};

export class JsonExternalSearchLogRepository implements ExternalSearchLogRepository {
  constructor(private readonly filePath = path.join(process.cwd(), ".mock-data", "external-search-logs.json")) {}

  async createLog(log: ExternalSearchLog) {
    const store = await this.readStore();

    await this.writeStore({ logs: [log, ...store.logs] });

    return log;
  }

  async listLogs(filters: ExternalSearchLogListFilters = {}) {
    const store = await this.readStore();

    return store.logs
      .filter((log) => !filters.userId || log.userId === filters.userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private async readStore(): Promise<ExternalSearchLogStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<ExternalSearchLogStore>;

      return {
        logs: parsed.logs ?? []
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return emptyStore;
      }

      throw error;
    }
  }

  private async writeStore(store: ExternalSearchLogStore) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  }
}

type ExternalSearchLogRow = {
  id: string;
  user_id: string;
  query: string;
  provider: string;
  provider_metadata: Record<string, unknown> | null;
  result_count: number;
  created_at: string;
};

function toExternalSearchLog(row: ExternalSearchLogRow): ExternalSearchLog {
  return {
    id: row.id,
    userId: row.user_id,
    query: row.query,
    provider: row.provider,
    providerMetadata: row.provider_metadata ?? undefined,
    resultCount: row.result_count,
    createdAt: row.created_at
  };
}

function externalSearchLogToRow(log: ExternalSearchLog) {
  return {
    id: log.id,
    user_id: log.userId,
    query: log.query,
    provider: log.provider,
    provider_metadata: log.providerMetadata ?? null,
    result_count: log.resultCount,
    created_at: log.createdAt
  };
}

export class SupabaseExternalSearchLogRepository implements ExternalSearchLogRepository {
  async createLog(log: ExternalSearchLog) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("external_search_logs").insert(externalSearchLogToRow(log)).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    return toExternalSearchLog(data as ExternalSearchLogRow);
  }

  async listLogs(filters: ExternalSearchLogListFilters = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("external_search_logs").select("*");

    if (filters.userId) {
      query = query.eq("user_id", filters.userId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as ExternalSearchLogRow[]).map(toExternalSearchLog);
  }
}

export const jsonExternalSearchLogRepository = new JsonExternalSearchLogRepository();
export const supabaseExternalSearchLogRepository = new SupabaseExternalSearchLogRepository();
export const externalSearchLogRepository = selectRepository<ExternalSearchLogRepository>({
  mock: jsonExternalSearchLogRepository,
  supabase: supabaseExternalSearchLogRepository
});
