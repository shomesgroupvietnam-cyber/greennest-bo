import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { selectRepository } from "@/lib/db/repository-mode";
import { getRolePermissions, PERMISSIONS, type PermissionAction } from "@/lib/permissions/can";
import type {
  ScopeAssignment,
  ScopeAssignmentScopeType,
} from "@/modules/settings/types";

type ScopeAssignmentStore = {
  assignments: ScopeAssignment[];
};

export type ScopeAssignmentListFilters = {
  userId?: string;
  active?: boolean;
};

export type ScopeAssignmentRepository = {
  listAssignments(filters?: ScopeAssignmentListFilters): Promise<ScopeAssignment[]>;
  getAssignment(assignmentId: string): Promise<ScopeAssignment | undefined>;
  upsertAssignment(assignment: ScopeAssignment): Promise<ScopeAssignment>;
  disableAssignment(assignmentId: string, updatedBy: string, updatedAt: string): Promise<ScopeAssignment>;
};

function now() {
  return new Date().toISOString();
}

function isPermissionAction(value: string): value is PermissionAction {
  return PERMISSIONS.includes(value as PermissionAction);
}

function uniquePermissionKeys(permissionKeys: string[]) {
  const order = new Map(PERMISSIONS.map((permission, index) => [permission, index]));

  return Array.from(new Set(permissionKeys))
    .filter(isPermissionAction)
    .sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
}

function normalizeAssignment(assignment: ScopeAssignment): ScopeAssignment {
  return {
    ...assignment,
    permissionKeys: uniquePermissionKeys(assignment.permissionKeys),
    scopeType: assignment.scopeType ?? "scoped",
    active: assignment.active ?? true,
  };
}

function createDefaultScopeAssignments(): ScopeAssignment[] {
  const timestamp = now();

  return [
    {
      id: "scope-assignment-demo-admin-global",
      userId: "mock-founder",
      roleKey: "admin",
      permissionKeys: getRolePermissions("admin"),
      scopeType: "global",
      active: true,
      createdBy: "system",
      updatedBy: "system",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
}

function normalizeStore(store: Partial<ScopeAssignmentStore>): ScopeAssignmentStore {
  return {
    assignments: (store.assignments ?? createDefaultScopeAssignments()).map(normalizeAssignment),
  };
}

function applyFilters(assignments: ScopeAssignment[], filters: ScopeAssignmentListFilters = {}) {
  return assignments.filter((assignment) => {
    if (filters.userId && assignment.userId !== filters.userId) {
      return false;
    }

    if (filters.active !== undefined && assignment.active !== filters.active) {
      return false;
    }

    return true;
  });
}

export class JsonScopeAssignmentRepository implements ScopeAssignmentRepository {
  constructor(
    private readonly filePath = path.join(process.cwd(), ".mock-data", "scope-assignments.json"),
  ) {}

  async listAssignments(filters: ScopeAssignmentListFilters = {}) {
    const store = await this.readStore();

    return applyFilters(store.assignments, filters).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getAssignment(assignmentId: string) {
    const store = await this.readStore();

    return store.assignments.find((assignment) => assignment.id === assignmentId);
  }

  async upsertAssignment(assignment: ScopeAssignment) {
    const store = await this.readStore();
    const normalizedAssignment = normalizeAssignment(assignment);
    const existing = store.assignments.find((item) => item.id === assignment.id);

    await this.writeStore({
      assignments: existing
        ? store.assignments.map((item) => (item.id === assignment.id ? normalizedAssignment : item))
        : [normalizedAssignment, ...store.assignments],
    });

    return normalizedAssignment;
  }

  async disableAssignment(assignmentId: string, updatedBy: string, updatedAt: string) {
    const existing = await this.getAssignment(assignmentId);

    if (!existing) {
      throw new Error("Khong tim thay scope assignment.");
    }

    return this.upsertAssignment({
      ...existing,
      active: false,
      updatedBy,
      updatedAt,
    });
  }

  private async readStore(): Promise<ScopeAssignmentStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<ScopeAssignmentStore>;

      return normalizeStore(parsed);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (code === "ENOENT") {
        return normalizeStore({});
      }

      throw error;
    }
  }

  private async writeStore(store: ScopeAssignmentStore) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  }
}

type ScopeAssignmentRow = {
  id: string;
  user_id: string;
  role_key: string;
  organization_id: string | null;
  project_id: string | null;
  axis_id: string | null;
  workstream_id: string | null;
  module_id: string | null;
  record_id: string | null;
  permission_keys: string[] | null;
  scope_type: ScopeAssignmentScopeType | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

function toAssignment(row: ScopeAssignmentRow): ScopeAssignment {
  return normalizeAssignment({
    id: row.id,
    userId: row.user_id,
    roleKey: row.role_key,
    organizationId: row.organization_id ?? undefined,
    projectId: row.project_id ?? undefined,
    axisId: row.axis_id ?? undefined,
    workstreamId: row.workstream_id ?? undefined,
    moduleId: row.module_id ?? undefined,
    recordId: row.record_id ?? undefined,
    permissionKeys: uniquePermissionKeys(row.permission_keys ?? []),
    scopeType: row.scope_type ?? "scoped",
    active: row.is_active,
    startsAt: row.starts_at ?? undefined,
    endsAt: row.ends_at ?? undefined,
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function toRow(assignment: ScopeAssignment) {
  return {
    id: assignment.id,
    user_id: assignment.userId,
    role_key: assignment.roleKey,
    organization_id: assignment.organizationId ?? null,
    project_id: assignment.projectId ?? null,
    axis_id: assignment.axisId ?? null,
    workstream_id: assignment.workstreamId ?? null,
    module_id: assignment.moduleId ?? null,
    record_id: assignment.recordId ?? null,
    permission_keys: uniquePermissionKeys(assignment.permissionKeys),
    scope_type: assignment.scopeType,
    is_active: assignment.active,
    starts_at: assignment.startsAt ?? null,
    ends_at: assignment.endsAt ?? null,
    created_by: assignment.createdBy ?? null,
    updated_by: assignment.updatedBy ?? null,
    created_at: assignment.createdAt,
    updated_at: assignment.updatedAt,
  };
}

export class SupabaseScopeAssignmentRepository implements ScopeAssignmentRepository {
  async listAssignments(filters: ScopeAssignmentListFilters = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("access_scope_assignments")
      .select("*")
      .order("updated_at", { ascending: false });

    if (filters.userId) {
      query = query.eq("user_id", filters.userId);
    }

    if (filters.active !== undefined) {
      query = query.eq("is_active", filters.active);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as ScopeAssignmentRow[];

    if (rows.length > 0) {
      return rows.map(toAssignment);
    }

    return [];
  }

  async getAssignment(assignmentId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("access_scope_assignments")
      .select("*")
      .eq("id", assignmentId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toAssignment(data as ScopeAssignmentRow) : undefined;
  }

  async upsertAssignment(assignment: ScopeAssignment) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("access_scope_assignments")
      .upsert(toRow(normalizeAssignment(assignment)), { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toAssignment(data as ScopeAssignmentRow);
  }

  async disableAssignment(assignmentId: string, updatedBy: string, updatedAt: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("access_scope_assignments")
      .update({ is_active: false, updated_by: updatedBy, updated_at: updatedAt })
      .eq("id", assignmentId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toAssignment(data as ScopeAssignmentRow);
  }
}

export const jsonScopeAssignmentRepository = new JsonScopeAssignmentRepository();
export const supabaseScopeAssignmentRepository = new SupabaseScopeAssignmentRepository();
export const scopeAssignmentRepository = selectRepository<ScopeAssignmentRepository>({
  mock: jsonScopeAssignmentRepository,
  supabase: supabaseScopeAssignmentRepository,
});
