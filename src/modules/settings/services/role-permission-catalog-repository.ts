import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { ROLES, ROLE_DEFAULT_SCREENS, type Role } from "@/constants/roles";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import {
  BUSINESS_APPROVAL_PERMISSIONS,
  PERMISSIONS,
  getRolePermissions,
  type PermissionAction,
} from "@/lib/permissions/can";
import { selectRepository } from "@/lib/db/repository-mode";
import type {
  PermissionActionType,
  PermissionCatalogItem,
  RolePermissionAssignment,
  RolePermissionCatalog,
  RoleScope,
  RoleTemplate,
} from "@/modules/settings/types";

type RolePermissionCatalogStore = {
  roles: RoleTemplate[];
  permissions: PermissionCatalogItem[];
};

const roleScopes = {
  chu_tich: "system",
  super_admin: "system",
  admin: "system",
  tong_giam_doc: "system",
  pho_tong_giam_doc: "system",
  giam_doc_du_an: "project",
  quan_ly_du_an: "project",
  to_truong: "project",
  phap_ly: "system",
  ke_toan: "system",
  thiet_ke: "system",
  ky_thuat: "system",
  thi_cong: "system",
  mua_hang: "system",
  dau_tu_phat_trien: "system",
  quan_ly_tai_chinh: "system",
  hanh_chinh_nhan_su: "system",
  qa_qc_chat_luong: "system",
  an_toan_lao_dong: "system",
  kiem_toan_noi_bo: "system",
  quan_ly_hop_dong: "system",
  thu_ky_tro_ly: "system",
  kiem_soat_noi_bo: "system",
  nha_thau: "external",
  tu_van: "external",
  viewer: "system",
  pending: "system",
} satisfies Record<Role, RoleScope>;

const permissionLabels: Partial<Record<PermissionAction, string>> = {
  "axis1.view": "Xem tổng hợp Trục 1",
  "project.view": "Xem tổng hợp dự án",
  "project.create": "Tạo dự án",
  "project.update": "Cập nhật dự án",
  "project.archive": "Lưu trữ dự án",
  "project.assign_member": "Phân công thành viên dự án",
  "task.view": "Xem công việc",
  "task.create": "Giao việc",
  "task.update": "Cập nhật công việc",
  "task.update_own": "Cập nhật công việc được giao",
  "task.archive": "Lưu trữ công việc",
  "document.view": "Xem hồ sơ",
  "document.create": "Tạo hồ sơ",
  "document.update": "Cập nhật hồ sơ",
  "document.approve": "Duyệt hồ sơ",
  "document.archive": "Lưu trữ hồ sơ",
  "legal.view": "Xem pháp lý",
  "legal.update": "Cập nhật pháp lý",
  "legal.approve": "Duyệt pháp lý",
  "legal.configure_template": "Cấu hình mẫu pháp lý",
  "meeting.view": "Xem cuộc họp",
  "meeting.create": "Tạo cuộc họp",
  "meeting.update": "Cập nhật cuộc họp",
  "decision.create": "Tạo quyết định",
  "decision.approve": "Duyệt quyết định",
  "finance.view": "Xem tài chính nhạy cảm",
  "finance.create": "Tạo dữ liệu tài chính",
  "finance.update": "Cập nhật tài chính",
  "finance.approve": "Duyệt tài chính",
  "payment.request": "Đề nghị thanh toán",
  "payment.approve": "Duyệt thanh toán",
  "proposal.view": "Xem đề xuất",
  "proposal.create": "Tạo đề xuất",
  "proposal.update": "Cập nhật đề xuất",
  "proposal.review": "Thẩm định đề xuất",
  "proposal.approve": "Duyệt đề xuất",
  "proposal.reject": "Trả lại đề xuất",
  "proposal.request_change": "Yêu cầu chỉnh sửa đề xuất",
  "proposal.configure_flow": "Cấu hình luồng đề xuất",
  "proposal.archive": "Lưu trữ đề xuất",
  "investment.view": "Xem đầu tư",
  "investment.create": "Tạo hồ sơ đầu tư",
  "investment.update": "Cập nhật đầu tư",
  "investment.review": "Thẩm định đầu tư",
  "investment.approve": "Duyệt đầu tư",
  "contract.view": "Xem hợp đồng",
  "contract.create": "Tạo hợp đồng",
  "contract.update": "Cập nhật hợp đồng",
  "contract.review": "Rà soát hợp đồng",
  "contract.approve": "Duyệt hợp đồng",
  "contract.archive": "Lưu trữ hợp đồng",
  "report.view": "Xem báo cáo",
  "report.create": "Xuất dữ liệu/báo cáo",
  "audit.view": "Xem audit",
  "settings.manage": "Quản lý cấu hình hệ thống",
  "delegation.manage": "Quản lý ủy quyền lãnh đạo",
  "user.view": "Xem người dùng",
  "user.invite": "Mời người dùng",
  "user.update_role": "Cập nhật vai trò người dùng",
  "ai.use": "Sử dụng AI",
  "ai.ask": "Hỏi AI",
  "ai.use_rag": "Dùng RAG đã duyệt",
  "ai.view_insight": "Xem insight AI",
  "ai.create_draft": "Tạo bản nháp AI",
  "ai.propose_action": "Đề xuất hành động AI",
  "ai.confirm_action": "Xác nhận hành động AI",
  "ai.configure": "Cấu hình AI",
};

const sensitivePermissions = new Set<PermissionAction>([
  "finance.view",
  "finance.create",
  "finance.update",
  "finance.approve",
  "payment.request",
  "payment.approve",
  "audit.view",
  "delegation.manage",
  "ai.use_rag",
  "ai.view_insight",
]);

function now() {
  return new Date().toISOString();
}

function isPermissionAction(value: string): value is PermissionAction {
  return PERMISSIONS.includes(value as PermissionAction);
}

function inferActionType(key: PermissionAction): PermissionActionType {
  if ((BUSINESS_APPROVAL_PERMISSIONS as readonly PermissionAction[]).includes(key) || key.includes(".approve")) {
    return "approve";
  }

  if (key === "audit.view") {
    return "audit";
  }

  if (key.startsWith("ai.")) {
    return "ai";
  }

  if (
    key.includes(".configure") ||
    key.includes(".manage") ||
    key.includes(".archive") ||
    key.includes(".assign_") ||
    key.includes(".invite") ||
    key.includes(".update_role")
  ) {
    return "admin";
  }

  if (key.includes(".create") || key.includes(".request")) {
    return "create";
  }

  if (key.includes(".update") || key.includes(".review") || key.includes(".promote")) {
    return "update";
  }

  if (key.includes(".export") || key === "report.create") {
    return "export";
  }

  return "view";
}

function moduleFromPermission(key: PermissionAction) {
  if (key.startsWith("payment.")) {
    return "finance";
  }

  if (key.startsWith("decision.")) {
    return "meeting";
  }

  if (key.startsWith("site_diary.") || key.startsWith("quality.") || key.startsWith("acceptance.")) {
    return "construction";
  }

  if (key.startsWith("internal_audit.")) {
    return "internal_audit";
  }

  return key.split(".")[0];
}

function fallbackPermissionLabel(key: PermissionAction) {
  const [module, action] = key.split(".");

  return `${action.replaceAll("_", " ")} ${module.replaceAll("_", " ")}`;
}

export function createDefaultPermissionCatalog(): PermissionCatalogItem[] {
  return PERMISSIONS.map((key) => ({
    key,
    module: moduleFromPermission(key),
    labelVi: permissionLabels[key] ?? fallbackPermissionLabel(key),
    description: permissionLabels[key] ?? fallbackPermissionLabel(key),
    sensitive: sensitivePermissions.has(key),
    actionType: inferActionType(key),
  }));
}

export function createDefaultRoleTemplates(): RoleTemplate[] {
  const timestamp = now();

  return Object.entries(ROLES).map(([key, role]) => {
    const roleKey = key as Role;
    const defaultScreen = ROLE_DEFAULT_SCREENS[roleKey];

    return {
      key: roleKey,
      labelVi: role.label,
      description: role.description,
      scope: roleScopes[roleKey],
      active: roleKey !== "pending",
      defaultScreenHref: defaultScreen.href,
      defaultScreenLabel: defaultScreen.label,
      permissionKeys: [...getRolePermissions(roleKey)],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });
}

function uniquePermissions(permissionKeys: PermissionAction[]) {
  return Array.from(new Set(permissionKeys)).filter(isPermissionAction);
}

function createAssignments(roles: RoleTemplate[]): RolePermissionAssignment[] {
  return roles.flatMap((role) =>
    role.permissionKeys.map((permissionKey) => ({
      roleKey: role.key,
      permissionKey,
    })),
  );
}

function normalizeStore(store: Partial<RolePermissionCatalogStore>): RolePermissionCatalogStore {
  const defaultRoles = createDefaultRoleTemplates();
  const defaultPermissions = createDefaultPermissionCatalog();
  const rolesByKey = new Map(defaultRoles.map((role) => [role.key, role]));
  const permissionsByKey = new Map(defaultPermissions.map((permission) => [permission.key, permission]));

  for (const permission of store.permissions ?? []) {
    if (isPermissionAction(permission.key)) {
      permissionsByKey.set(permission.key, {
        ...permissionsByKey.get(permission.key),
        ...permission,
        key: permission.key,
        module: permission.module || moduleFromPermission(permission.key),
        actionType: permission.actionType || inferActionType(permission.key),
      });
    }
  }

  for (const role of store.roles ?? []) {
    if (!role.key) {
      continue;
    }

    const existing = rolesByKey.get(role.key);
    rolesByKey.set(role.key, {
      ...existing,
      ...role,
      key: role.key,
      active: role.active ?? true,
      scope: role.scope ?? existing?.scope ?? "system",
      permissionKeys: uniquePermissions(role.permissionKeys ?? existing?.permissionKeys ?? []),
    });
  }

  return {
    roles: [...rolesByKey.values()],
    permissions: [...permissionsByKey.values()],
  };
}

export function createDefaultRolePermissionCatalog(): RolePermissionCatalog {
  const store = normalizeStore({});

  return {
    ...store,
    assignments: createAssignments(store.roles),
  };
}

export type RolePermissionCatalogRepository = {
  listCatalog(): Promise<RolePermissionCatalog>;
  getRole(roleKey: string): Promise<RoleTemplate | undefined>;
  upsertRole(role: RoleTemplate): Promise<RoleTemplate>;
  setRoleActive(roleKey: string, active: boolean, updatedBy: string, updatedAt: string): Promise<RoleTemplate>;
  replaceRolePermissions(
    roleKey: string,
    permissionKeys: PermissionAction[],
    updatedBy: string,
    updatedAt: string,
  ): Promise<RoleTemplate>;
};

export class JsonRolePermissionCatalogRepository implements RolePermissionCatalogRepository {
  constructor(
    private readonly filePath = path.join(
      process.cwd(),
      ".mock-data",
      "role-permission-catalog.json",
    ),
  ) {}

  async listCatalog() {
    const store = await this.readStore();

    return {
      ...store,
      assignments: createAssignments(store.roles),
    };
  }

  async getRole(roleKey: string) {
    const catalog = await this.listCatalog();

    return catalog.roles.find((role) => role.key === roleKey);
  }

  async upsertRole(role: RoleTemplate) {
    const store = await this.readStore();
    const normalizedRole = {
      ...role,
      permissionKeys: uniquePermissions(role.permissionKeys),
    };
    const existing = store.roles.find((item) => item.key === role.key);
    const roles = existing
      ? store.roles.map((item) => (item.key === role.key ? normalizedRole : item))
      : [...store.roles, normalizedRole];

    await this.writeStore({ ...store, roles });

    return normalizedRole;
  }

  async setRoleActive(roleKey: string, active: boolean, updatedBy: string, updatedAt: string) {
    const existing = await this.getRole(roleKey);

    if (!existing) {
      throw new Error("Khong tim thay role template.");
    }

    return this.upsertRole({
      ...existing,
      active,
      updatedBy,
      updatedAt,
    });
  }

  async replaceRolePermissions(roleKey: string, permissionKeys: PermissionAction[], updatedBy: string, updatedAt: string) {
    const existing = await this.getRole(roleKey);

    if (!existing) {
      throw new Error("Khong tim thay role template.");
    }

    return this.upsertRole({
      ...existing,
      permissionKeys: uniquePermissions(permissionKeys),
      updatedBy,
      updatedAt,
    });
  }

  private async readStore(): Promise<RolePermissionCatalogStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<RolePermissionCatalogStore>;

      return normalizeStore(parsed);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (code === "ENOENT") {
        return normalizeStore({});
      }

      throw error;
    }
  }

  private async writeStore(store: RolePermissionCatalogStore) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  }
}

type RoleRow = {
  id: string;
  key: string;
  label_vi: string;
  description: string | null;
  scope: RoleScope;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type PermissionRow = {
  id: string;
  key: string;
  module: string;
  description: string | null;
};

type RolePermissionRow = {
  role_id: string;
  permission_id: string;
};

function toRole(row: RoleRow, permissionKeys: PermissionAction[]): RoleTemplate {
  const staticRole = row.key in ROLE_DEFAULT_SCREENS ? (row.key as Role) : undefined;
  const defaultScreen = staticRole ? ROLE_DEFAULT_SCREENS[staticRole] : undefined;

  return {
    key: row.key,
    labelVi: row.label_vi,
    description: row.description ?? undefined,
    scope: row.scope,
    active: row.is_active,
    defaultScreenHref: defaultScreen?.href,
    defaultScreenLabel: defaultScreen?.label,
    permissionKeys: uniquePermissions(permissionKeys),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPermission(row: PermissionRow): PermissionCatalogItem | undefined {
  if (!isPermissionAction(row.key)) {
    return undefined;
  }

  const defaultPermission = createDefaultPermissionCatalog().find((item) => item.key === row.key);

  return {
    key: row.key,
    module: row.module || defaultPermission?.module || moduleFromPermission(row.key),
    labelVi: defaultPermission?.labelVi ?? fallbackPermissionLabel(row.key),
    description: row.description ?? defaultPermission?.description,
    sensitive: defaultPermission?.sensitive ?? sensitivePermissions.has(row.key),
    actionType: defaultPermission?.actionType ?? inferActionType(row.key),
  };
}

export class SupabaseRolePermissionCatalogRepository implements RolePermissionCatalogRepository {
  async listCatalog() {
    const supabase = await createSupabaseServerClient();
    const [rolesResult, permissionsResult, rolePermissionsResult] = await Promise.all([
      supabase.from("roles").select("*").order("key", { ascending: true }),
      supabase.from("permissions").select("*").order("module", { ascending: true }),
      supabase.from("role_permissions").select("role_id, permission_id"),
    ]);

    if (rolesResult.error) {
      throw new Error(rolesResult.error.message);
    }

    if (permissionsResult.error) {
      throw new Error(permissionsResult.error.message);
    }

    if (rolePermissionsResult.error) {
      throw new Error(rolePermissionsResult.error.message);
    }

    const roleRows = (rolesResult.data ?? []) as RoleRow[];
    const permissionRows = (permissionsResult.data ?? []) as PermissionRow[];

    if (roleRows.length === 0 || permissionRows.length === 0) {
      return createDefaultRolePermissionCatalog();
    }

    const permissionById = new Map(permissionRows.map((permission) => [permission.id, permission]));
    const permissionCatalog = permissionRows
      .map(toPermission)
      .filter((permission): permission is PermissionCatalogItem => Boolean(permission));
    const rolePermissions = (rolePermissionsResult.data ?? []) as RolePermissionRow[];
    const permissionKeysByRoleId = new Map<string, PermissionAction[]>();

    for (const assignment of rolePermissions) {
      const permission = permissionById.get(assignment.permission_id);

      if (permission && isPermissionAction(permission.key)) {
        const permissionKeys = permissionKeysByRoleId.get(assignment.role_id) ?? [];
        permissionKeys.push(permission.key);
        permissionKeysByRoleId.set(assignment.role_id, permissionKeys);
      }
    }

    const roles = roleRows.map((role) => toRole(role, permissionKeysByRoleId.get(role.id) ?? []));

    return {
      roles,
      permissions: permissionCatalog,
      assignments: createAssignments(roles),
    };
  }

  async getRole(roleKey: string) {
    const catalog = await this.listCatalog();

    return catalog.roles.find((role) => role.key === roleKey);
  }

  async upsertRole(role: RoleTemplate) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("upsert_role_template_with_permissions", {
      target_key: role.key,
      target_label_vi: role.labelVi,
      target_description: role.description ?? null,
      target_scope: role.scope,
      target_is_active: role.active,
      target_permission_keys: uniquePermissions(role.permissionKeys),
    });

    if (error) {
      throw new Error(error.message);
    }

    const row = Array.isArray(data) ? data[0] : data;

    return toRole(row as RoleRow, role.permissionKeys);
  }

  async setRoleActive(roleKey: string, active: boolean) {
    const existing = await this.getRole(roleKey);

    if (!existing) {
      throw new Error("Khong tim thay role template.");
    }

    return this.upsertRole({
      ...existing,
      active,
    });
  }

  async replaceRolePermissions(roleKey: string, permissionKeys: PermissionAction[]) {
    const existing = await this.getRole(roleKey);

    if (!existing) {
      throw new Error("Khong tim thay role template.");
    }

    return this.upsertRole({
      ...existing,
      permissionKeys,
    });
  }
}

export const jsonRolePermissionCatalogRepository = new JsonRolePermissionCatalogRepository();
export const supabaseRolePermissionCatalogRepository = new SupabaseRolePermissionCatalogRepository();
export const rolePermissionCatalogRepository = selectRepository<RolePermissionCatalogRepository>({
  mock: jsonRolePermissionCatalogRepository,
  supabase: supabaseRolePermissionCatalogRepository,
});
