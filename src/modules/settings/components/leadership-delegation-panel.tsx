import {
  Ban,
  CheckCircle2,
  Handshake,
  Plus,
  Save,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  setLeadershipDelegationActiveAction,
  upsertLeadershipDelegationAction,
} from "@/modules/settings/actions";
import {
  getLeadershipDelegationStatus,
  listDelegatablePermissionCatalogItems,
} from "@/modules/settings/services/leadership-delegation-service";
import type { Project } from "@/modules/projects/types";
import type {
  LeadershipDelegation,
  PermissionCatalogItem,
  RolePermissionCatalog,
} from "@/modules/settings/types";
import type { User } from "@/modules/users/types";

const statusLabels = {
  active: "Dang hieu luc",
  inactive: "Da tat",
  scheduled: "Chua bat dau",
  expired: "Het han",
};

const moduleLabels: Record<string, string> = {
  axis1: "Truc 1",
  project: "Du an",
  task: "Cong viec",
  document: "Ho so",
  legal: "Phap ly",
  meeting: "Hop/Quyet dinh",
  finance: "Tai chinh",
  proposal: "De xuat",
  investment: "Dau tu",
  contract: "Hop dong",
  user: "Nguoi dung",
  settings: "Cai dat",
  delegation: "Uy quyen",
  audit: "Audit",
  ai: "AI",
};

function badgeClassName(tone: "green" | "slate" | "amber" | "red" | "blue") {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    red: "bg-rose-50 text-rose-700 ring-rose-200",
    blue: "bg-cyan-50 text-cyan-800 ring-cyan-200",
  };

  return `rounded-full px-2 py-1 text-xs font-medium ring-1 ${tones[tone]}`;
}

function statusTone(status: keyof typeof statusLabels) {
  if (status === "active") {
    return "green";
  }

  if (status === "scheduled") {
    return "amber";
  }

  if (status === "expired") {
    return "red";
  }

  return "slate";
}

function userLabel(users: User[], userId: string) {
  const user = users.find((item) => item.id === userId);

  return user ? `${user.fullName} (${user.email})` : userId;
}

function moduleLabel(module: string) {
  return moduleLabels[module] ?? module;
}

function permissionLabel(permissions: PermissionCatalogItem[], permissionKey: string) {
  return permissions.find((permission) => permission.key === permissionKey)?.labelVi ?? permissionKey;
}

function moduleOptions(permissions: PermissionCatalogItem[]) {
  return Array.from(new Set(permissions.map((permission) => permission.module))).sort();
}

function scopeSummary(delegation: LeadershipDelegation, projects: Project[]) {
  const projectName = delegation.projectId
    ? delegation.projectId === "*"
      ? "Tat ca project (*)"
      : projects.find((project) => project.id === delegation.projectId)?.name ?? delegation.projectId
    : undefined;
  const parts = [
    delegation.organizationId ? `Org ${delegation.organizationId}` : undefined,
    projectName ? `Project ${projectName}` : undefined,
    delegation.axisId ? `Axis ${delegation.axisId}` : undefined,
    delegation.workstreamId ? `Workstream ${delegation.workstreamId}` : undefined,
    delegation.moduleId ? `Module ${delegation.moduleId}` : undefined,
    delegation.recordId ? `Record ${delegation.recordId}` : undefined,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : "-";
}

function ActionCheckboxes({
  permissions,
  selectedKeys,
}: {
  permissions: PermissionCatalogItem[];
  selectedKeys: Set<string>;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-700">
      <span>Action duoc uy quyen *</span>
      <select
        className="min-h-40 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        multiple
        name="actionKeys"
        required
        defaultValue={[...selectedKeys]}
      >
        {permissions.map((permission) => (
          <option key={permission.key} value={permission.key}>
            {moduleLabel(permission.module)} - {permission.labelVi} ({permission.key})
          </option>
        ))}
      </select>
      <span className="block text-xs font-normal text-slate-500">
        Dung Ctrl/Cmd de chon nhieu action. Action approval/admin/export nhay cam khong hien trong danh sach.
      </span>
    </label>
  );
}

function ScopeFields({
  delegation,
  projects,
  modules,
}: {
  delegation?: LeadershipDelegation;
  projects: Project[];
  modules: string[];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Organization</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="organizationId"
          defaultValue={delegation?.organizationId}
          placeholder="org-green-nest"
        />
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Project *</span>
        <select
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="projectId"
          defaultValue={delegation?.projectId ?? ""}
        >
          <option value="">Khong chon</option>
          <option value="*">Tat ca project (*)</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.code} - {project.name}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Axis</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="axisId"
          defaultValue={delegation?.axisId}
          placeholder="project_management"
        />
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Workstream</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="workstreamId"
          defaultValue={delegation?.workstreamId}
          placeholder="legal_review"
        />
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Module *</span>
        <select
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="moduleId"
          defaultValue={delegation?.moduleId ?? "proposal"}
        >
          <option value="">Khong chon</option>
          <option value="*">Tat ca module (*)</option>
          {modules.map((module) => (
            <option key={module} value={module}>
              {moduleLabel(module)}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Record</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="recordId"
          defaultValue={delegation?.recordId}
          placeholder="record id"
        />
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Bat dau</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="startsAt"
          type="datetime-local"
          defaultValue={delegation?.startsAt?.slice(0, 16)}
        />
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Ket thuc</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="endsAt"
          type="datetime-local"
          defaultValue={delegation?.endsAt?.slice(0, 16)}
        />
      </label>
    </div>
  );
}

export function LeadershipDelegationPanel({
  delegations,
  catalog,
  projects,
  users,
}: {
  delegations: LeadershipDelegation[];
  catalog: RolePermissionCatalog;
  projects: Project[];
  users: User[];
}) {
  const delegatablePermissions = listDelegatablePermissionCatalogItems(catalog);
  const modules = moduleOptions(delegatablePermissions);
  const activeDelegations = delegations.filter((delegation) => getLeadershipDelegationStatus(delegation) === "active").length;

  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm" id="leadership-delegations">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
            <Handshake className="h-5 w-5 text-emerald-700" aria-hidden="true" />
            Uy quyen lanh dao
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            Cau hinh nguoi duoc thao tac thay lanh dao theo project, module, action va thoi han. Action approval/admin nhay cam bi chan o service.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-slate-700">
          <span className="rounded-md bg-slate-50 px-3 py-2">{activeDelegations}/{delegations.length} dang hieu luc</span>
          <span className="rounded-md bg-slate-50 px-3 py-2">{delegatablePermissions.length} action an toan</span>
        </div>
      </div>

      <form action={upsertLeadershipDelegationAction} className="mt-5 space-y-4 border-t border-slate-200 pt-4">
        <input type="hidden" name="active" value="true" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-sm font-medium text-slate-700">
            <span>Lanh dao *</span>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              name="principalUserId"
              required
            >
              <option value="">Chon lanh dao</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} - {user.email}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700">
            <span>Nguoi duoc uy quyen *</span>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              name="delegateUserId"
              required
            >
              <option value="">Chon user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} - {user.email}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700 md:col-span-2">
            <span>Ghi chu</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              name="note"
              placeholder="VD: Tao va trinh de xuat thay CEO trong project A"
            />
          </label>
        </div>
        <ScopeFields projects={projects} modules={modules} />
        <details className="border-t border-slate-200 pt-3" open>
          <summary className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Chon action duoc uy quyen
          </summary>
          <div className="mt-3">
            <ActionCheckboxes permissions={delegatablePermissions} selectedKeys={new Set(["proposal.create"])} />
          </div>
        </details>
        <Button type="submit" size="sm">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Tao delegation
        </Button>
      </form>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Lanh dao</th>
              <th className="px-3 py-2">Nguoi duoc uy quyen</th>
              <th className="px-3 py-2">Scope</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Trang thai</th>
              <th className="px-3 py-2">Thoi han</th>
              <th className="px-3 py-2">Cap nhat</th>
              <th className="px-3 py-2">Thao tac</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {delegations.map((delegation) => {
              const status = getLeadershipDelegationStatus(delegation);
              const selectedKeys = new Set(delegation.actionKeys);

              return (
                <tr className={delegation.active ? "align-top" : "align-top bg-slate-50/70"} key={delegation.id}>
                  <td className="min-w-56 px-3 py-3 font-semibold text-slate-950">
                    {userLabel(users, delegation.principalUserId)}
                  </td>
                  <td className="min-w-56 px-3 py-3 text-slate-700">
                    {userLabel(users, delegation.delegateUserId)}
                  </td>
                  <td className="min-w-72 px-3 py-3 text-slate-700">{scopeSummary(delegation, projects)}</td>
                  <td className="min-w-64 px-3 py-3 text-slate-700">
                    <p className="font-medium text-slate-900">{delegation.actionKeys.length} action</p>
                    <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                      {delegation.actionKeys.map((key) => permissionLabel(catalog.permissions, key)).join(", ")}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={badgeClassName(statusTone(status))}>{statusLabels[status]}</span>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    <p>{delegation.startsAt ?? "-"}</p>
                    <p>{delegation.endsAt ?? "-"}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    <p>{delegation.updatedBy ?? "-"}</p>
                    <p className="text-xs text-slate-500">{delegation.updatedAt}</p>
                  </td>
                  <td className="min-w-[30rem] px-3 py-3">
                    <details>
                      <summary className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
                        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                        Chinh sua
                      </summary>
                      <div className="mt-3 space-y-4 border-t border-slate-200 pt-3">
                        <form action={upsertLeadershipDelegationAction} className="space-y-4">
                          <input type="hidden" name="delegationId" value={delegation.id} />
                          <input type="hidden" name="active" value={String(delegation.active)} />
                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="space-y-1 text-sm font-medium text-slate-700">
                              <span>Lanh dao</span>
                              <select
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                                name="principalUserId"
                                defaultValue={delegation.principalUserId}
                                required
                              >
                                {users.map((user) => (
                                  <option key={user.id} value={user.id}>
                                    {user.fullName} - {user.email}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="space-y-1 text-sm font-medium text-slate-700">
                              <span>Nguoi duoc uy quyen</span>
                              <select
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                                name="delegateUserId"
                                defaultValue={delegation.delegateUserId}
                                required
                              >
                                {users.map((user) => (
                                  <option key={user.id} value={user.id}>
                                    {user.fullName} - {user.email}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <ScopeFields delegation={delegation} projects={projects} modules={modules} />
                          <label className="space-y-1 text-sm font-medium text-slate-700">
                            <span>Ghi chu</span>
                            <input
                              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                              name="note"
                              defaultValue={delegation.note}
                            />
                          </label>
                          <ActionCheckboxes permissions={delegatablePermissions} selectedKeys={selectedKeys} />
                          <Button type="submit" size="sm">
                            <Save className="h-4 w-4" aria-hidden="true" />
                            Luu delegation
                          </Button>
                        </form>

                        <details className="border-t border-rose-100 pt-3">
                          <summary className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50">
                            <Ban className="h-4 w-4" aria-hidden="true" />
                            {delegation.active ? "Vo hieu hoa" : "Bat lai"}
                          </summary>
                          <form action={setLeadershipDelegationActiveAction} className="mt-3">
                            <input type="hidden" name="delegationId" value={delegation.id} />
                            <input type="hidden" name="active" value={delegation.active ? "false" : "true"} />
                            <Button type="submit" size="sm" variant="outline">
                              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                              Xac nhan
                            </Button>
                          </form>
                        </details>
                      </div>
                    </details>
                  </td>
                </tr>
              );
            })}
            {delegations.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-slate-500" colSpan={8}>
                  Chua co delegation nao.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
