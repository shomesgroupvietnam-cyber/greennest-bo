import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { selectRepository } from "@/lib/db/repository-mode";
import type {
  AuditLog,
  AuditLogListFilters,
  ProjectMembership,
  User,
} from "@/modules/users/types";

type UserStore = {
  users: User[];
  projectMemberships: ProjectMembership[];
  auditLogs: AuditLog[];
};

function now() {
  return new Date().toISOString();
}

function isWriteContention(error: unknown) {
  const code = (error as NodeJS.ErrnoException).code;

  return code === "EPERM" || code === "EBUSY" || code === "EACCES";
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function defaultStore(): UserStore {
  const createdAt = now();

  return {
    users: [
      {
        id: "mock-founder",
        fullName: "Người dùng mô phỏng",
        email: "mock.user@greennest.vn",
        role: "admin",
        status: "active",
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "legal-manager",
        fullName: "Phụ trách pháp lý",
        email: "legal@greennest.vn",
        role: "phap_ly",
        status: "active",
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "designer",
        fullName: "Quản lý thiết kế",
        email: "design@greennest.vn",
        role: "thiet_ke",
        status: "active",
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "accountant",
        fullName: "Kế toán dự án",
        email: "accounting@greennest.vn",
        role: "ke_toan",
        status: "active",
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "viewer",
        fullName: "Người xem",
        email: "viewer@greennest.vn",
        role: "viewer",
        status: "active",
        createdAt,
        updatedAt: createdAt,
      },
    ],
    projectMemberships: [],
    auditLogs: [],
  };
}

export type UserRepository = {
  listUsers(): Promise<User[]>;
  getUser(userId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: User): Promise<User>;
  updateUser(userId: string, patch: Partial<User>): Promise<User>;
  listProjectMemberships(projectId?: string): Promise<ProjectMembership[]>;
  upsertProjectMembership(
    membership: ProjectMembership,
  ): Promise<ProjectMembership>;
  createAuditLog(auditLog: AuditLog): Promise<AuditLog>;
  listAuditLogs(filters?: AuditLogListFilters): Promise<AuditLog[]>;
};

export class JsonUserRepository implements UserRepository {
  constructor(
    private readonly filePath = path.join(
      process.cwd(),
      ".mock-data",
      "users.json",
    ),
  ) {}

  async listUsers() {
    const store = await this.readStore();

    return store.users.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  async getUser(userId: string) {
    const store = await this.readStore();

    return store.users.find((user) => user.id === userId);
  }

  async getUserByEmail(email: string) {
    const store = await this.readStore();
    const normalizedEmail = email.trim().toLowerCase();

    return store.users.find(
      (user) => user.email.toLowerCase() === normalizedEmail,
    );
  }

  async createUser(user: User) {
    const store = await this.readStore();

    if (
      store.users.some(
        (existingUser) =>
          existingUser.email.toLowerCase() === user.email.toLowerCase(),
      )
    ) {
      throw new Error("Email người dùng đã tồn tại.");
    }

    await this.writeStore({
      ...store,
      users: [user, ...store.users],
    });

    return user;
  }

  async updateUser(userId: string, patch: Partial<User>) {
    const store = await this.readStore();
    const existingUser = store.users.find((user) => user.id === userId);

    if (!existingUser) {
      throw new Error("Không tìm thấy người dùng.");
    }

    const updatedUser = {
      ...existingUser,
      ...patch,
      id: existingUser.id,
      email: existingUser.email,
      createdAt: existingUser.createdAt,
    };

    await this.writeStore({
      ...store,
      users: store.users.map((user) =>
        user.id === userId ? updatedUser : user,
      ),
    });

    return updatedUser;
  }

  async listProjectMemberships(projectId?: string) {
    const store = await this.readStore();

    return store.projectMemberships.filter(
      (membership) => !projectId || membership.projectId === projectId,
    );
  }

  async upsertProjectMembership(membership: ProjectMembership) {
    const store = await this.readStore();
    const existingMembership = store.projectMemberships.find(
      (item) =>
        item.projectId === membership.projectId &&
        item.userId === membership.userId,
    );
    const nextMembership = existingMembership
      ? {
          ...existingMembership,
          role: membership.role,
          updatedAt: membership.updatedAt,
        }
      : membership;

    await this.writeStore({
      ...store,
      projectMemberships: existingMembership
        ? store.projectMemberships.map((item) =>
            item.id === existingMembership.id ? nextMembership : item,
          )
        : [membership, ...store.projectMemberships],
    });

    return nextMembership;
  }

  async createAuditLog(auditLog: AuditLog) {
    const store = await this.readStore();

    await this.writeStore({
      ...store,
      auditLogs: [auditLog, ...store.auditLogs],
    });

    return auditLog;
  }

  async listAuditLogs(filters: AuditLogListFilters = {}) {
    const store = await this.readStore();

    return store.auditLogs
      .filter((auditLog) => !filters.action || auditLog.action === filters.action)
      .filter((auditLog) => !filters.actorId || auditLog.actorId === filters.actorId)
      .filter((auditLog) => !filters.entityId || auditLog.entityId === filters.entityId)
      .filter((auditLog) => !filters.entityType || auditLog.entityType === filters.entityType)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private async readStore(): Promise<UserStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      if (!raw.trim()) {
        return defaultStore();
      }
      const parsed = JSON.parse(raw) as Partial<UserStore>;

      return {
        users: parsed.users ?? defaultStore().users,
        projectMemberships: parsed.projectMemberships ?? [],
        auditLogs: parsed.auditLogs ?? [],
      };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (error instanceof SyntaxError) {
        return defaultStore();
      }

      if (code === "ENOENT") {
        return defaultStore();
      }

      throw error;
    }
  }

  private async writeStore(store: UserStore) {
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

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: User["role"];
  status: User["status"];
  created_at: string;
  updated_at: string;
};

type ProjectMemberRow = {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectMembership["role"];
  created_at: string;
  updated_at: string;
};

type AuditLogRow = {
  id: string;
  actor_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_value: unknown;
  new_value: unknown;
  created_at: string;
};

function toUser(row: UserRow): User {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    avatarUrl: row.avatar_url ?? undefined,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function userToRow(user: User) {
  return {
    id: user.id,
    full_name: user.fullName,
    email: user.email,
    avatar_url: user.avatarUrl ?? null,
    role: user.role,
    status: user.status,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

function userPatchToRow(patch: Partial<User>) {
  return {
    ...(patch.fullName !== undefined ? { full_name: patch.fullName } : {}),
    ...(patch.avatarUrl !== undefined
      ? { avatar_url: patch.avatarUrl ?? null }
      : {}),
    ...(patch.role !== undefined ? { role: patch.role } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.updatedAt !== undefined ? { updated_at: patch.updatedAt } : {}),
  };
}

function toProjectMembership(row: ProjectMemberRow): ProjectMembership {
  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function projectMembershipToRow(membership: ProjectMembership) {
  return {
    id: membership.id,
    project_id: membership.projectId,
    user_id: membership.userId,
    role: membership.role,
    created_at: membership.createdAt,
    updated_at: membership.updatedAt,
  };
}

function toAuditLog(row: AuditLogRow): AuditLog {
  return {
    id: row.id,
    actorId: row.actor_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    oldValue: row.old_value ?? undefined,
    newValue: row.new_value ?? undefined,
    createdAt: row.created_at,
  };
}

function auditLogToRow(auditLog: AuditLog) {
  return {
    id: auditLog.id,
    actor_id: auditLog.actorId,
    entity_type: auditLog.entityType,
    entity_id: auditLog.entityId,
    action: auditLog.action,
    old_value: auditLog.oldValue ?? null,
    new_value: auditLog.newValue ?? null,
    created_at: auditLog.createdAt,
  };
}

export class SupabaseUserRepository implements UserRepository {
  async listUsers() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("full_name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as UserRow[]).map(toUser);
  }

  async getUser(userId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toUser(data as UserRow) : undefined;
  }

  async getUserByEmail(email: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toUser(data as UserRow) : undefined;
  }

  async createUser(user: User) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("users")
      .insert(userToRow(user))
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toUser(data as UserRow);
  }

  async updateUser(userId: string, patch: Partial<User>) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("users")
      .update(userPatchToRow(patch))
      .eq("id", userId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toUser(data as UserRow);
  }

  async listProjectMemberships(projectId?: string) {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("project_members")
      .select("*")
      .order("created_at", { ascending: false });

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as ProjectMemberRow[]).map(toProjectMembership);
  }

  async upsertProjectMembership(membership: ProjectMembership) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("project_members")
      .upsert(projectMembershipToRow(membership), {
        onConflict: "project_id,user_id",
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toProjectMembership(data as ProjectMemberRow);
  }

  async createAuditLog(auditLog: AuditLog) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .insert(auditLogToRow(auditLog))
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toAuditLog(data as AuditLogRow);
  }

  async listAuditLogs(filters: AuditLogListFilters = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("audit_logs").select("*");

    if (filters.action) {
      query = query.eq("action", filters.action);
    }

    if (filters.actorId) {
      query = query.eq("actor_id", filters.actorId);
    }

    if (filters.entityId) {
      query = query.eq("entity_id", filters.entityId);
    }

    if (filters.entityType) {
      query = query.eq("entity_type", filters.entityType);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as AuditLogRow[]).map(toAuditLog);
  }
}

export const jsonUserRepository = new JsonUserRepository();
export const supabaseUserRepository = new SupabaseUserRepository();
export const userRepository = selectRepository<UserRepository>({
  mock: jsonUserRepository,
  supabase: supabaseUserRepository,
});
