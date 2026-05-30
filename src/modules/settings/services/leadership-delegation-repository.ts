import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { selectRepository } from "@/lib/db/repository-mode";
import { PERMISSIONS, type PermissionAction } from "@/lib/permissions/can";
import type { LeadershipDelegation } from "@/modules/settings/types";

type LeadershipDelegationStore = {
  delegations: LeadershipDelegation[];
};

export type LeadershipDelegationListFilters = {
  principalUserId?: string;
  delegateUserId?: string;
  active?: boolean;
};

export type LeadershipDelegationRepository = {
  listDelegations(filters?: LeadershipDelegationListFilters): Promise<LeadershipDelegation[]>;
  getDelegation(delegationId: string): Promise<LeadershipDelegation | undefined>;
  upsertDelegation(delegation: LeadershipDelegation): Promise<LeadershipDelegation>;
  setDelegationActive(
    delegationId: string,
    active: boolean,
    updatedBy: string,
    updatedAt: string,
  ): Promise<LeadershipDelegation>;
};

function isPermissionAction(value: string): value is PermissionAction {
  return PERMISSIONS.includes(value as PermissionAction);
}

function uniqueActionKeys(actionKeys: string[]) {
  const order = new Map(PERMISSIONS.map((permission, index) => [permission, index]));

  return Array.from(new Set(actionKeys))
    .filter(isPermissionAction)
    .sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
}

function normalizeDelegation(delegation: LeadershipDelegation): LeadershipDelegation {
  return {
    ...delegation,
    actionKeys: uniqueActionKeys(delegation.actionKeys),
    active: delegation.active ?? true,
  };
}

function normalizeStore(store: Partial<LeadershipDelegationStore>): LeadershipDelegationStore {
  return {
    delegations: (store.delegations ?? []).map(normalizeDelegation),
  };
}

function applyFilters(
  delegations: LeadershipDelegation[],
  filters: LeadershipDelegationListFilters = {},
) {
  return delegations.filter((delegation) => {
    if (filters.principalUserId && delegation.principalUserId !== filters.principalUserId) {
      return false;
    }

    if (filters.delegateUserId && delegation.delegateUserId !== filters.delegateUserId) {
      return false;
    }

    if (filters.active !== undefined && delegation.active !== filters.active) {
      return false;
    }

    return true;
  });
}

export class JsonLeadershipDelegationRepository implements LeadershipDelegationRepository {
  constructor(
    private readonly filePath = path.join(process.cwd(), ".mock-data", "leadership-delegations.json"),
  ) {}

  async listDelegations(filters: LeadershipDelegationListFilters = {}) {
    const store = await this.readStore();

    return applyFilters(store.delegations, filters).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getDelegation(delegationId: string) {
    const store = await this.readStore();

    return store.delegations.find((delegation) => delegation.id === delegationId);
  }

  async upsertDelegation(delegation: LeadershipDelegation) {
    const store = await this.readStore();
    const normalizedDelegation = normalizeDelegation(delegation);
    const existing = store.delegations.find((item) => item.id === delegation.id);

    await this.writeStore({
      delegations: existing
        ? store.delegations.map((item) => (item.id === delegation.id ? normalizedDelegation : item))
        : [normalizedDelegation, ...store.delegations],
    });

    return normalizedDelegation;
  }

  async setDelegationActive(
    delegationId: string,
    active: boolean,
    updatedBy: string,
    updatedAt: string,
  ) {
    const existing = await this.getDelegation(delegationId);

    if (!existing) {
      throw new Error("Khong tim thay delegation.");
    }

    return this.upsertDelegation({
      ...existing,
      active,
      updatedBy,
      updatedAt,
    });
  }

  private async readStore(): Promise<LeadershipDelegationStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<LeadershipDelegationStore>;

      return normalizeStore(parsed);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (code === "ENOENT") {
        return normalizeStore({});
      }

      throw error;
    }
  }

  private async writeStore(store: LeadershipDelegationStore) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  }
}

type LeadershipDelegationRow = {
  id: string;
  principal_user_id: string;
  delegate_user_id: string;
  organization_id: string | null;
  project_id: string | null;
  axis_id: string | null;
  workstream_id: string | null;
  module_id: string | null;
  record_id: string | null;
  action_keys: string[] | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  note: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

function toDelegation(row: LeadershipDelegationRow): LeadershipDelegation {
  return normalizeDelegation({
    id: row.id,
    principalUserId: row.principal_user_id,
    delegateUserId: row.delegate_user_id,
    organizationId: row.organization_id ?? undefined,
    projectId: row.project_id ?? undefined,
    axisId: row.axis_id ?? undefined,
    workstreamId: row.workstream_id ?? undefined,
    moduleId: row.module_id ?? undefined,
    recordId: row.record_id ?? undefined,
    actionKeys: uniqueActionKeys(row.action_keys ?? []),
    active: row.is_active,
    startsAt: row.starts_at ?? undefined,
    endsAt: row.ends_at ?? undefined,
    note: row.note ?? undefined,
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function toRow(delegation: LeadershipDelegation) {
  return {
    id: delegation.id,
    principal_user_id: delegation.principalUserId,
    delegate_user_id: delegation.delegateUserId,
    organization_id: delegation.organizationId ?? null,
    project_id: delegation.projectId ?? null,
    axis_id: delegation.axisId ?? null,
    workstream_id: delegation.workstreamId ?? null,
    module_id: delegation.moduleId ?? null,
    record_id: delegation.recordId ?? null,
    action_keys: uniqueActionKeys(delegation.actionKeys),
    is_active: delegation.active,
    starts_at: delegation.startsAt ?? null,
    ends_at: delegation.endsAt ?? null,
    note: delegation.note ?? null,
    created_by: delegation.createdBy ?? null,
    updated_by: delegation.updatedBy ?? null,
    created_at: delegation.createdAt,
    updated_at: delegation.updatedAt,
  };
}

export class SupabaseLeadershipDelegationRepository implements LeadershipDelegationRepository {
  async listDelegations(filters: LeadershipDelegationListFilters = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("leadership_delegations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (filters.principalUserId) {
      query = query.eq("principal_user_id", filters.principalUserId);
    }

    if (filters.delegateUserId) {
      query = query.eq("delegate_user_id", filters.delegateUserId);
    }

    if (filters.active !== undefined) {
      query = query.eq("is_active", filters.active);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as LeadershipDelegationRow[]).map(toDelegation);
  }

  async getDelegation(delegationId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("leadership_delegations")
      .select("*")
      .eq("id", delegationId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toDelegation(data as LeadershipDelegationRow) : undefined;
  }

  async upsertDelegation(delegation: LeadershipDelegation) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("leadership_delegations")
      .upsert(toRow(normalizeDelegation(delegation)), { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toDelegation(data as LeadershipDelegationRow);
  }

  async setDelegationActive(
    delegationId: string,
    active: boolean,
    updatedBy: string,
    updatedAt: string,
  ) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("leadership_delegations")
      .update({ is_active: active, updated_by: updatedBy, updated_at: updatedAt })
      .eq("id", delegationId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toDelegation(data as LeadershipDelegationRow);
  }
}

export const jsonLeadershipDelegationRepository = new JsonLeadershipDelegationRepository();
export const supabaseLeadershipDelegationRepository = new SupabaseLeadershipDelegationRepository();
export const leadershipDelegationRepository = selectRepository<LeadershipDelegationRepository>({
  mock: jsonLeadershipDelegationRepository,
  supabase: supabaseLeadershipDelegationRepository,
});
