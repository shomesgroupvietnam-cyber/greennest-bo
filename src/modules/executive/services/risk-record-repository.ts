import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { selectRepository } from "@/lib/db/repository-mode";
import type {
  ExecutiveRiskRecord,
  ExecutiveRiskRecordStatus,
  ExecutiveRiskRecordType,
  RiskStatusKey,
  RiskSignalSourceType,
} from "@/modules/executive/types";

type RiskRecordStore = {
  records: ExecutiveRiskRecord[];
};

export type ExecutiveRiskRecordListFilters = {
  includeClosed?: boolean;
  projectId?: string;
  ownerId?: string;
  status?: ExecutiveRiskRecordStatus | "all";
  recordType?: ExecutiveRiskRecordType | "all";
};

export type RiskRecordRepository = {
  listRiskRecords(
    filters?: ExecutiveRiskRecordListFilters,
  ): Promise<ExecutiveRiskRecord[]>;
  getRiskRecord(riskId: string): Promise<ExecutiveRiskRecord | undefined>;
  createRiskRecord(record: ExecutiveRiskRecord): Promise<ExecutiveRiskRecord>;
  updateRiskRecord(
    riskId: string,
    patch: Partial<ExecutiveRiskRecord>,
  ): Promise<ExecutiveRiskRecord>;
  deleteRiskRecord(riskId: string): Promise<void>;
};

const emptyStore: RiskRecordStore = {
  records: [],
};
const terminalRiskStatuses = new Set<ExecutiveRiskRecordStatus>([
  "closed",
  "resolved",
]);

function isTerminalRiskStatus(status: ExecutiveRiskRecordStatus) {
  return terminalRiskStatuses.has(status);
}

function isWriteContention(error: unknown) {
  const code = (error as NodeJS.ErrnoException).code;

  return code === "EPERM" || code === "EBUSY" || code === "EACCES";
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function applyFilters(
  records: ExecutiveRiskRecord[],
  filters: ExecutiveRiskRecordListFilters = {},
) {
  return records
    .filter((record) =>
      filters.includeClosed || (filters.status && filters.status !== "all")
        ? true
        : !isTerminalRiskStatus(record.status),
    )
    .filter((record) => !filters.projectId || record.projectId === filters.projectId)
    .filter((record) => !filters.ownerId || record.ownerId === filters.ownerId)
    .filter((record) => !filters.status || filters.status === "all" || record.status === filters.status)
    .filter((record) => !filters.recordType || filters.recordType === "all" || record.recordType === filters.recordType)
    .sort(
      (left, right) =>
        Number(isTerminalRiskStatus(left.status)) -
          Number(isTerminalRiskStatus(right.status)) ||
        (left.deadline ?? "9999-12-31").localeCompare(right.deadline ?? "9999-12-31") ||
        right.updatedAt.localeCompare(left.updatedAt) ||
        left.status.localeCompare(right.status),
    );
}

export class JsonRiskRecordRepository implements RiskRecordRepository {
  constructor(
    private readonly filePath = path.join(
      process.cwd(),
      ".mock-data",
      "executive-risk-records.json",
    ),
  ) {}

  async listRiskRecords(filters: ExecutiveRiskRecordListFilters = {}) {
    const store = await this.readStore();

    return applyFilters(store.records, filters);
  }

  async getRiskRecord(riskId: string) {
    const store = await this.readStore();

    return store.records.find((record) => record.id === riskId);
  }

  async createRiskRecord(record: ExecutiveRiskRecord) {
    const store = await this.readStore();

    await this.writeStore({
      records: [record, ...store.records],
    });

    return record;
  }

  async updateRiskRecord(riskId: string, patch: Partial<ExecutiveRiskRecord>) {
    const store = await this.readStore();
    const existingRecord = store.records.find((record) => record.id === riskId);

    if (!existingRecord) {
      throw new Error("Khong tim thay risk/blocker.");
    }

    const updatedRecord: ExecutiveRiskRecord = {
      ...existingRecord,
      ...patch,
      id: existingRecord.id,
      createdAt: existingRecord.createdAt,
      createdBy: existingRecord.createdBy,
    };

    await this.writeStore({
      records: store.records.map((record) =>
        record.id === riskId ? updatedRecord : record,
      ),
    });

    return updatedRecord;
  }

  async deleteRiskRecord(riskId: string) {
    const store = await this.readStore();

    await this.writeStore({
      records: store.records.filter((record) => record.id !== riskId),
    });
  }

  private async readStore(): Promise<RiskRecordStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<RiskRecordStore>;

      return {
        records: parsed.records ?? [],
      };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (code === "ENOENT") {
        return emptyStore;
      }

      throw error;
    }
  }

  private async writeStore(store: RiskRecordStore) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.${process.pid}.${randomUUID()}.tmp`;
    const payload = `${JSON.stringify(store, null, 2)}\n`;

    await writeFile(tempPath, payload, "utf8");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        await rename(tempPath, this.filePath);
        return;
      } catch (error) {
        if (!isWriteContention(error)) {
          await unlink(tempPath).catch(() => undefined);
          throw error;
        }

        if (attempt < 4) {
          await delay(20 * (attempt + 1));
          continue;
        }

        await writeFile(this.filePath, payload, "utf8");
        await unlink(tempPath).catch(() => undefined);
        return;
      }
    }
  }
}

export type ExecutiveRiskRecordRow = {
  id: string;
  record_type: ExecutiveRiskRecordType;
  title: string;
  category_key: string;
  level: ExecutiveRiskRecord["level"];
  reason: string;
  description: string | null;
  organization_id: string | null;
  project_id: string | null;
  axis_id: string | null;
  workstream_id: string | null;
  module_id: string | null;
  owner_id: string;
  owner_name: string | null;
  deadline: string;
  next_action: string;
  status: ExecutiveRiskRecordStatus;
  status_override: RiskStatusKey | null;
  status_override_reason: string | null;
  status_override_by: string | null;
  status_override_at: string | null;
  status_override_source_status: RiskStatusKey | null;
  closed_reason: string | null;
  closed_by: string | null;
  closed_at: string | null;
  source_type: RiskSignalSourceType | null;
  source_id: string | null;
  created_by: string;
  updated_by: string;
  on_behalf_of: string | null;
  delegation_id: string | null;
  created_at: string;
  updated_at: string;
};

export function toExecutiveRiskRecord(row: ExecutiveRiskRecordRow): ExecutiveRiskRecord {
  return {
    axisId: row.axis_id ?? undefined,
    categoryKey: row.category_key,
    createdAt: row.created_at,
    createdBy: row.created_by,
    deadline: row.deadline,
    delegationId: row.delegation_id ?? undefined,
    description: row.description ?? undefined,
    id: row.id,
    level: row.level,
    moduleId: row.module_id ?? undefined,
    nextAction: row.next_action,
    onBehalfOf: row.on_behalf_of ?? undefined,
    organizationId: row.organization_id ?? undefined,
    ownerId: row.owner_id,
    ownerName: row.owner_name ?? undefined,
    projectId: row.project_id ?? undefined,
    reason: row.reason,
    recordType: row.record_type,
    sourceId: row.source_id ?? undefined,
    sourceType: row.source_type ?? undefined,
    status: row.status,
    statusOverride: row.status_override ?? undefined,
    statusOverrideAt: row.status_override_at ?? undefined,
    statusOverrideBy: row.status_override_by ?? undefined,
    statusOverrideReason: row.status_override_reason ?? undefined,
    statusOverrideSourceStatus: row.status_override_source_status ?? undefined,
    closedAt: row.closed_at ?? undefined,
    closedBy: row.closed_by ?? undefined,
    closedReason: row.closed_reason ?? undefined,
    title: row.title,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    workstreamId: row.workstream_id ?? undefined,
  };
}

export function executiveRiskRecordToRow(
  record: ExecutiveRiskRecord,
): ExecutiveRiskRecordRow {
  return {
    axis_id: record.axisId ?? null,
    category_key: record.categoryKey,
    created_at: record.createdAt,
    created_by: record.createdBy,
    deadline: record.deadline,
    delegation_id: record.delegationId ?? null,
    description: record.description ?? null,
    id: record.id,
    level: record.level,
    module_id: record.moduleId ?? null,
    next_action: record.nextAction,
    on_behalf_of: record.onBehalfOf ?? null,
    organization_id: record.organizationId ?? null,
    owner_id: record.ownerId,
    owner_name: record.ownerName ?? null,
    project_id: record.projectId ?? null,
    reason: record.reason,
    record_type: record.recordType,
    source_id: record.sourceId ?? null,
    source_type: record.sourceType ?? null,
    status: record.status,
    status_override: record.statusOverride ?? null,
    status_override_at: record.statusOverrideAt ?? null,
    status_override_by: record.statusOverrideBy ?? null,
    status_override_reason: record.statusOverrideReason ?? null,
    status_override_source_status: record.statusOverrideSourceStatus ?? null,
    closed_at: record.closedAt ?? null,
    closed_by: record.closedBy ?? null,
    closed_reason: record.closedReason ?? null,
    title: record.title,
    updated_at: record.updatedAt,
    updated_by: record.updatedBy,
    workstream_id: record.workstreamId ?? null,
  };
}

function hasPatchField<K extends keyof ExecutiveRiskRecord>(
  patch: Partial<ExecutiveRiskRecord>,
  key: K,
) {
  return Object.prototype.hasOwnProperty.call(patch, key);
}

export function riskRecordPatchToRow(patch: Partial<ExecutiveRiskRecord>) {
  return {
    ...(hasPatchField(patch, "recordType") ? { record_type: patch.recordType } : {}),
    ...(hasPatchField(patch, "title") ? { title: patch.title } : {}),
    ...(hasPatchField(patch, "categoryKey") ? { category_key: patch.categoryKey } : {}),
    ...(hasPatchField(patch, "level") ? { level: patch.level } : {}),
    ...(hasPatchField(patch, "reason") ? { reason: patch.reason } : {}),
    ...(hasPatchField(patch, "description") ? { description: patch.description ?? null } : {}),
    ...(hasPatchField(patch, "organizationId") ? { organization_id: patch.organizationId ?? null } : {}),
    ...(hasPatchField(patch, "projectId") ? { project_id: patch.projectId ?? null } : {}),
    ...(hasPatchField(patch, "axisId") ? { axis_id: patch.axisId ?? null } : {}),
    ...(hasPatchField(patch, "workstreamId") ? { workstream_id: patch.workstreamId ?? null } : {}),
    ...(hasPatchField(patch, "moduleId") ? { module_id: patch.moduleId ?? null } : {}),
    ...(hasPatchField(patch, "ownerId") ? { owner_id: patch.ownerId } : {}),
    ...(hasPatchField(patch, "ownerName") ? { owner_name: patch.ownerName ?? null } : {}),
    ...(hasPatchField(patch, "deadline") ? { deadline: patch.deadline } : {}),
    ...(hasPatchField(patch, "nextAction") ? { next_action: patch.nextAction } : {}),
    ...(hasPatchField(patch, "status") ? { status: patch.status } : {}),
    ...(hasPatchField(patch, "statusOverride") ? { status_override: patch.statusOverride ?? null } : {}),
    ...(hasPatchField(patch, "statusOverrideReason") ? { status_override_reason: patch.statusOverrideReason ?? null } : {}),
    ...(hasPatchField(patch, "statusOverrideBy") ? { status_override_by: patch.statusOverrideBy ?? null } : {}),
    ...(hasPatchField(patch, "statusOverrideAt") ? { status_override_at: patch.statusOverrideAt ?? null } : {}),
    ...(hasPatchField(patch, "statusOverrideSourceStatus") ? { status_override_source_status: patch.statusOverrideSourceStatus ?? null } : {}),
    ...(hasPatchField(patch, "closedReason") ? { closed_reason: patch.closedReason ?? null } : {}),
    ...(hasPatchField(patch, "closedBy") ? { closed_by: patch.closedBy ?? null } : {}),
    ...(hasPatchField(patch, "closedAt") ? { closed_at: patch.closedAt ?? null } : {}),
    ...(hasPatchField(patch, "sourceType") ? { source_type: patch.sourceType ?? null } : {}),
    ...(hasPatchField(patch, "sourceId") ? { source_id: patch.sourceId ?? null } : {}),
    ...(hasPatchField(patch, "updatedBy") ? { updated_by: patch.updatedBy } : {}),
    ...(hasPatchField(patch, "onBehalfOf") ? { on_behalf_of: patch.onBehalfOf ?? null } : {}),
    ...(hasPatchField(patch, "delegationId") ? { delegation_id: patch.delegationId ?? null } : {}),
    ...(hasPatchField(patch, "updatedAt") ? { updated_at: patch.updatedAt } : {}),
  };
}

export class SupabaseRiskRecordRepository implements RiskRecordRepository {
  async listRiskRecords(filters: ExecutiveRiskRecordListFilters = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("executive_risk_records")
      .select("*")
      .order("deadline", { ascending: true })
      .order("updated_at", { ascending: false });

    if (filters.projectId) {
      query = query.eq("project_id", filters.projectId);
    }

    if (filters.ownerId) {
      query = query.eq("owner_id", filters.ownerId);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    } else if (!filters.includeClosed) {
      query = query.not("status", "in", "(closed,resolved)");
    }

    if (filters.recordType && filters.recordType !== "all") {
      query = query.eq("record_type", filters.recordType);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error("Khong the tai danh sach risk/blocker.");
    }

    return ((data ?? []) as ExecutiveRiskRecordRow[]).map(toExecutiveRiskRecord);
  }

  async getRiskRecord(riskId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("executive_risk_records")
      .select("*")
      .eq("id", riskId)
      .maybeSingle();

    if (error) {
      throw new Error("Khong the tai risk/blocker.");
    }

    return data ? toExecutiveRiskRecord(data as ExecutiveRiskRecordRow) : undefined;
  }

  async createRiskRecord(record: ExecutiveRiskRecord) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("executive_risk_records")
      .insert(executiveRiskRecordToRow(record))
      .select("*")
      .single();

    if (error) {
      throw new Error("Khong the tao risk/blocker.");
    }

    return toExecutiveRiskRecord(data as ExecutiveRiskRecordRow);
  }

  async updateRiskRecord(riskId: string, patch: Partial<ExecutiveRiskRecord>) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("executive_risk_records")
      .update(riskRecordPatchToRow(patch))
      .eq("id", riskId)
      .select("*")
      .single();

    if (error) {
      throw new Error("Khong the cap nhat risk/blocker.");
    }

    return toExecutiveRiskRecord(data as ExecutiveRiskRecordRow);
  }

  async deleteRiskRecord(riskId: string) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("executive_risk_records")
      .delete()
      .eq("id", riskId);

    if (error) {
      throw new Error("Khong the rollback risk/blocker.");
    }
  }
}

export const jsonRiskRecordRepository = new JsonRiskRecordRepository();
export const supabaseRiskRecordRepository = new SupabaseRiskRecordRepository();
export const riskRecordRepository = selectRepository<RiskRecordRepository>({
  mock: jsonRiskRecordRepository,
  supabase: supabaseRiskRecordRepository,
});
