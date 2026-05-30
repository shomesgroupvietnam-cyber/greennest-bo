import {
  Ban,
  CheckCircle2,
  KeyRound,
  Plus,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { BUSINESS_APPROVAL_PERMISSIONS, type PermissionAction } from "@/lib/permissions/can";
import {
  addRoleTemplateAction,
  renameRoleTemplateAction,
  setRoleTemplateActiveAction,
  updateRolePermissionMappingAction,
} from "@/modules/settings/actions";
import { groupPermissionCatalogByModule } from "@/modules/settings/services/role-permission-catalog-service";
import type {
  PermissionActionType,
  PermissionCatalogItem,
  RolePermissionCatalog,
  RoleScope,
} from "@/modules/settings/types";

const scopeLabels = {
  system: "Hệ thống",
  project: "Dự án",
  external: "Đối tác",
} satisfies Record<RoleScope, string>;

const actionTypeLabels = {
  view: "Xem",
  create: "Tạo",
  update: "Cập nhật",
  approve: "Duyệt",
  export: "Xuất",
  audit: "Audit",
  admin: "Quản trị",
  ai: "AI",
} satisfies Record<PermissionActionType, string>;

const moduleLabels: Record<string, string> = {
  axis1: "Trục 1",
  project: "Dự án",
  task: "Công việc",
  document: "Hồ sơ",
  legal: "Pháp lý",
  meeting: "Họp/Quyết định",
  knowledge: "Tri thức",
  report: "Báo cáo",
  design: "Thiết kế",
  construction: "Thi công",
  finance: "Tài chính",
  proposal: "Đề xuất",
  investment: "Đầu tư",
  contract: "Hợp đồng",
  hr: "Nhân sự",
  qa: "QA/QC",
  safety: "An toàn",
  compliance: "Tuân thủ",
  internal_audit: "Kiểm toán",
  user: "Người dùng",
  settings: "Cài đặt",
  audit: "Audit",
  ai: "AI",
};

function badgeClassName(kind: "scope" | "status" | "sensitive" | "action", active = true) {
  if (kind === "scope") {
    return "rounded-full bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-800 ring-1 ring-cyan-200";
  }

  if (kind === "sensitive") {
    return "rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200";
  }

  if (kind === "action") {
    return "rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-800 ring-1 ring-indigo-200";
  }

  return active
    ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200"
    : "rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200";
}

function moduleLabel(module: string) {
  return moduleLabels[module] ?? module;
}

function PermissionGroup({
  permissions,
  selectedKeys,
  disabledKeys = new Set(),
}: {
  permissions: PermissionCatalogItem[];
  selectedKeys: Set<string>;
  disabledKeys?: Set<string>;
}) {
  const groupedPermissions = groupPermissionCatalogByModule(permissions);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
        <fieldset className="border-t border-slate-200 pt-3" key={module}>
          <legend className="mb-2 text-sm font-semibold text-slate-950">{moduleLabel(module)}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {modulePermissions.map((permission) => (
              <label className="flex min-h-12 items-start gap-2 text-sm text-slate-700" key={permission.key}>
                {disabledKeys.has(permission.key) && selectedKeys.has(permission.key) ? (
                  <input type="hidden" name="permissionKeys" value={permission.key} />
                ) : null}
                <input
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                  type="checkbox"
                  name="permissionKeys"
                  value={permission.key}
                  defaultChecked={selectedKeys.has(permission.key)}
                  disabled={disabledKeys.has(permission.key)}
                />
                <span>
                  <span className="block font-medium text-slate-900">{permission.labelVi}</span>
                  <span className="block text-xs text-slate-500">{permission.key}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

export function RolePermissionCatalogPanel({
  catalog,
  currentRole,
}: {
  catalog: RolePermissionCatalog;
  currentRole: string;
}) {
  const activeRoles = catalog.roles.filter((role) => role.active).length;
  const sensitivePermissions = catalog.permissions.filter((permission) => permission.sensitive).length;
  const groupedPermissions = groupPermissionCatalogByModule(catalog.permissions);
  const currentUserCanEditBusinessApprovals = currentRole === "super_admin";

  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm" id="role-permission-catalog">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
            <ShieldCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" />
            Role & Permission Catalog
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            Quản lý role template, trạng thái và mapping permission dùng cho các workspace điều hành. Mutation luôn chạy qua server action và audit log.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-slate-700">
          <span className="rounded-md bg-slate-50 px-3 py-2">{activeRoles}/{catalog.roles.length} role đang bật</span>
          <span className="rounded-md bg-slate-50 px-3 py-2">{catalog.permissions.length} permission</span>
          <span className="rounded-md bg-slate-50 px-3 py-2">{sensitivePermissions} nhạy cảm</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        <a className="rounded-md border border-slate-300 px-3 py-2 font-medium text-slate-800 hover:bg-slate-50" href="#catalog-roles">
          Roles
        </a>
        <a className="rounded-md border border-slate-300 px-3 py-2 font-medium text-slate-800 hover:bg-slate-50" href="#catalog-permissions">
          Permissions
        </a>
      </div>

      <div className="mt-6" id="catalog-roles">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-slate-700" aria-hidden="true" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Role templates</h3>
        </div>

        <form action={addRoleTemplateAction} className="mt-4 grid gap-3 border-t border-slate-200 pt-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-1 text-sm font-medium text-slate-700">
            <span>Role key</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              name="key"
              placeholder="truong_bo_phan"
              required
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700">
            <span>Tên hiển thị</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              name="labelVi"
              placeholder="Trưởng bộ phận"
              required
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700">
            <span>Scope</span>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              name="scope"
              defaultValue="system"
            >
              {Object.entries(scopeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700 xl:col-span-2">
            <span>Mô tả</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              name="description"
              placeholder="Phạm vi vận hành của role"
            />
          </label>
          <div className="md:col-span-2 xl:col-span-5">
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Thêm role
            </Button>
          </div>
        </form>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Scope</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2">Permissions</th>
                <th className="px-3 py-2">Default screen</th>
                <th className="px-3 py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {catalog.roles.map((role) => {
                const selectedKeys = new Set(role.permissionKeys);
                const isCurrentRole = role.key === currentRole;

                return (
                  <tr className={role.active ? "align-top" : "align-top bg-slate-50/70"} key={role.key}>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-slate-950">{role.labelVi}</p>
                      <p className="mt-1 text-xs text-slate-500">{role.key}</p>
                      {role.description ? <p className="mt-1 max-w-xs text-slate-600">{role.description}</p> : null}
                    </td>
                    <td className="px-3 py-3">
                      <span className={badgeClassName("scope")}>{scopeLabels[role.scope]}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={badgeClassName("status", role.active)}>{role.active ? "Đang bật" : "Đã tắt"}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{role.permissionKeys.length}</td>
                    <td className="px-3 py-3 text-slate-600">
                      {role.defaultScreenLabel ? (
                        <>
                          <span className="block font-medium text-slate-800">{role.defaultScreenLabel}</span>
                          <span className="text-xs text-slate-500">{role.defaultScreenHref}</span>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="min-w-80 px-3 py-3">
                      <details>
                        <summary className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
                          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                          Chỉnh sửa
                        </summary>
                        <div className="mt-3 space-y-4 border-t border-slate-200 pt-3">
                          <form action={renameRoleTemplateAction} className="grid gap-3 md:grid-cols-2">
                            <input type="hidden" name="roleKey" value={role.key} />
                            <label className="space-y-1 text-sm font-medium text-slate-700">
                              <span>Tên role</span>
                              <input
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                                name="labelVi"
                                defaultValue={role.labelVi}
                                required
                              />
                            </label>
                            <label className="space-y-1 text-sm font-medium text-slate-700">
                              <span>Mô tả</span>
                              <input
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                                name="description"
                                defaultValue={role.description}
                              />
                            </label>
                            <div className="md:col-span-2">
                              <Button type="submit" size="sm" variant="outline">
                                <Save className="h-4 w-4" aria-hidden="true" />
                                Lưu tên role
                              </Button>
                            </div>
                          </form>

                          <form action={setRoleTemplateActiveAction}>
                            <input type="hidden" name="roleKey" value={role.key} />
                            <input type="hidden" name="active" value={role.active ? "false" : "true"} />
                            <Button type="submit" size="sm" variant="outline" disabled={isCurrentRole && role.active}>
                              {role.active ? (
                                <ToggleLeft className="h-4 w-4" aria-hidden="true" />
                              ) : (
                                <ToggleRight className="h-4 w-4" aria-hidden="true" />
                              )}
                              {role.active ? "Vô hiệu hóa" : "Bật lại"}
                            </Button>
                          </form>

                          <form action={updateRolePermissionMappingAction} className="space-y-3">
                            <input type="hidden" name="roleKey" value={role.key} />
                            <PermissionGroup
                              permissions={catalog.permissions}
                              selectedKeys={selectedKeys}
                              disabledKeys={
                                currentUserCanEditBusinessApprovals
                                  ? new Set<PermissionAction>()
                                  : new Set(BUSINESS_APPROVAL_PERMISSIONS)
                              }
                            />
                            <Button type="submit" size="sm">
                              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                              Lưu permission mapping
                            </Button>
                          </form>
                        </div>
                      </details>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-6" id="catalog-permissions">
        <div className="flex items-center gap-2">
          <Ban className="h-5 w-5 text-slate-700" aria-hidden="true" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Permission catalog</h3>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {Object.entries(groupedPermissions).map(([module, permissions]) => (
            <div className="border-t border-slate-200 pt-3" key={module}>
              <h4 className="text-sm font-semibold text-slate-950">{moduleLabel(module)}</h4>
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {permissions.map((permission) => (
                      <tr key={permission.key}>
                        <td className="py-2 pr-3">
                          <p className="font-medium text-slate-900">{permission.labelVi}</p>
                          <p className="text-xs text-slate-500">{permission.key}</p>
                        </td>
                        <td className="py-2 pr-3">
                          <span className={badgeClassName("action")}>{actionTypeLabels[permission.actionType]}</span>
                        </td>
                        <td className="py-2">
                          {permission.sensitive ? <span className={badgeClassName("sensitive")}>Nhạy cảm</span> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
