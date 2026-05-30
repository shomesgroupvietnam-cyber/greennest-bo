import {
  Ban,
  CheckCircle2,
  Plus,
  Save,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  createScopeAssignmentAction,
  disableScopeAssignmentAction,
  updateScopeAssignmentAction,
} from "@/modules/settings/actions";
import { getScopeAssignmentStatus } from "@/modules/settings/services/scope-assignment-service";
import type {
  PermissionCatalogItem,
  RolePermissionCatalog,
  ScopeAssignment,
  ScopeAssignmentScopeType,
} from "@/modules/settings/types";
import type { Project } from "@/modules/projects/types";
import type { User } from "@/modules/users/types";

const scopeTypeLabels = {
  scoped: "Theo pham vi",
  global: "Global explicit",
} satisfies Record<ScopeAssignmentScopeType, string>;

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
  audit: "Audit",
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

function roleLabel(catalog: RolePermissionCatalog, roleKey: string) {
  return catalog.roles.find((role) => role.key === roleKey)?.labelVi ?? roleKey;
}

function permissionLabel(permissions: PermissionCatalogItem[], permissionKey: string) {
  return permissions.find((permission) => permission.key === permissionKey)?.labelVi ?? permissionKey;
}

function moduleLabel(module: string) {
  return moduleLabels[module] ?? module;
}

function scopeSummary(assignment: ScopeAssignment, projects: Project[]) {
  if (assignment.scopeType === "global") {
    return "Global explicit";
  }

  const projectName = assignment.projectId
    ? projects.find((project) => project.id === assignment.projectId)?.name ?? assignment.projectId
    : undefined;
  const parts = [
    assignment.organizationId ? `Org ${assignment.organizationId}` : undefined,
    projectName ? `Project ${projectName}` : undefined,
    assignment.axisId ? `Axis ${assignment.axisId}` : undefined,
    assignment.workstreamId ? `Workstream ${assignment.workstreamId}` : undefined,
    assignment.moduleId ? `Module ${assignment.moduleId}` : undefined,
    assignment.recordId ? `Record ${assignment.recordId}` : undefined,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : "-";
}

function moduleOptions(permissions: PermissionCatalogItem[]) {
  return Array.from(new Set(permissions.map((permission) => permission.module))).sort();
}

function PermissionCheckboxes({
  permissions,
  selectedKeys,
}: {
  permissions: PermissionCatalogItem[];
  selectedKeys: Set<string>;
}) {
  const groupedPermissions = permissions.reduce<Record<string, PermissionCatalogItem[]>>((groups, permission) => {
    groups[permission.module] = groups[permission.module] ?? [];
    groups[permission.module].push(permission);

    return groups;
  }, {});

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
        <fieldset className="border-t border-slate-200 pt-3" key={module}>
          <legend className="mb-2 text-sm font-semibold text-slate-950">{moduleLabel(module)}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {modulePermissions.map((permission) => (
              <label className="flex min-h-10 items-start gap-2 text-sm text-slate-700" key={permission.key}>
                <input
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                  type="checkbox"
                  name="permissionKeys"
                  value={permission.key}
                  defaultChecked={selectedKeys.has(permission.key)}
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

function ScopeFields({
  assignment,
  projects,
  modules,
}: {
  assignment?: ScopeAssignment;
  projects: Project[];
  modules: string[];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Scope type</span>
        <select
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="scopeType"
          defaultValue={assignment?.scopeType ?? "scoped"}
        >
          {Object.entries(scopeTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Organization</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="organizationId"
          defaultValue={assignment?.organizationId}
          placeholder="org-green-nest"
        />
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Project</span>
        <select
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="projectId"
          defaultValue={assignment?.projectId ?? ""}
        >
          <option value="">Khong chon</option>
          <option value="*">Tat ca project (*)</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Axis</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="axisId"
          defaultValue={assignment?.axisId}
          placeholder="project_management"
        />
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Workstream</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="workstreamId"
          defaultValue={assignment?.workstreamId}
          placeholder="legal_review"
        />
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Module</span>
        <select
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="moduleId"
          defaultValue={assignment?.moduleId ?? ""}
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
          defaultValue={assignment?.recordId}
          placeholder="record id"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Bat dau</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            name="startsAt"
            type="datetime-local"
            defaultValue={assignment?.startsAt?.slice(0, 16)}
          />
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Ket thuc</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            name="endsAt"
            type="datetime-local"
            defaultValue={assignment?.endsAt?.slice(0, 16)}
          />
        </label>
      </div>
    </div>
  );
}

export function ScopeAssignmentPanel({
  assignments,
  catalog,
  projects,
  users,
}: {
  assignments: ScopeAssignment[];
  catalog: RolePermissionCatalog;
  projects: Project[];
  users: User[];
}) {
  const modules = moduleOptions(catalog.permissions);
  const activeAssignments = assignments.filter((assignment) => getScopeAssignmentStatus(assignment) === "active").length;

  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm" id="scope-assignments">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
            <ShieldCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" />
            Pham vi dieu hanh
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            Gan role va permission theo organization, project, axis, workstream, module hoac record. Resolver service dung assignment nay de loc DTO truoc khi UI render.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-slate-700">
          <span className="rounded-md bg-slate-50 px-3 py-2">{activeAssignments}/{assignments.length} dang hieu luc</span>
          <span className="rounded-md bg-slate-50 px-3 py-2">{projects.length} project option</span>
          <span className="rounded-md bg-slate-50 px-3 py-2">{modules.length} module</span>
        </div>
      </div>

      <form action={createScopeAssignmentAction} className="mt-5 space-y-4 border-t border-slate-200 pt-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-sm font-medium text-slate-700">
            <span>User</span>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              name="userId"
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
          <label className="space-y-1 text-sm font-medium text-slate-700">
            <span>Role trong scope</span>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              name="roleKey"
              required
            >
              <option value="">Chon role</option>
              {catalog.roles
                .filter((role) => role.active)
                .map((role) => (
                  <option key={role.key} value={role.key}>
                    {role.labelVi}
                  </option>
                ))}
            </select>
          </label>
          <div className="md:col-span-2">
            <ScopeFields projects={projects} modules={modules} />
          </div>
        </div>
        <details className="border-t border-slate-200 pt-3">
          <summary className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Chon permission
          </summary>
          <div className="mt-3">
            <PermissionCheckboxes permissions={catalog.permissions} selectedKeys={new Set(["project.view"])} />
          </div>
        </details>
        <Button type="submit" size="sm">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Tao assignment
        </Button>
      </form>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">User / Role</th>
              <th className="px-3 py-2">Scope</th>
              <th className="px-3 py-2">Permission</th>
              <th className="px-3 py-2">Trang thai</th>
              <th className="px-3 py-2">Thoi han</th>
              <th className="px-3 py-2">Cap nhat</th>
              <th className="px-3 py-2">Thao tac</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assignments.map((assignment) => {
              const status = getScopeAssignmentStatus(assignment);
              const selectedKeys = new Set(assignment.permissionKeys);

              return (
                <tr className={assignment.active ? "align-top" : "align-top bg-slate-50/70"} key={assignment.id}>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-slate-950">{userLabel(users, assignment.userId)}</p>
                    <p className="mt-1 text-xs text-slate-500">{roleLabel(catalog, assignment.roleKey)}</p>
                  </td>
                  <td className="min-w-72 px-3 py-3 text-slate-700">
                    <span className={badgeClassName(assignment.scopeType === "global" ? "blue" : "slate")}>
                      {scopeTypeLabels[assignment.scopeType]}
                    </span>
                    <p className="mt-2 leading-6">{scopeSummary(assignment, projects)}</p>
                  </td>
                  <td className="min-w-64 px-3 py-3 text-slate-700">
                    <p className="font-medium text-slate-900">{assignment.permissionKeys.length} permission</p>
                    <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                      {assignment.permissionKeys.slice(0, 6).map((key) => permissionLabel(catalog.permissions, key)).join(", ")}
                      {assignment.permissionKeys.length > 6 ? "..." : ""}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={badgeClassName(statusTone(status))}>{statusLabels[status]}</span>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    <p>{assignment.startsAt ?? "-"}</p>
                    <p>{assignment.endsAt ?? "-"}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    <p>{assignment.updatedBy ?? "-"}</p>
                    <p className="text-xs text-slate-500">{assignment.updatedAt}</p>
                  </td>
                  <td className="min-w-96 px-3 py-3">
                    <details>
                      <summary className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
                        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                        Chinh sua
                      </summary>
                      <div className="mt-3 space-y-4 border-t border-slate-200 pt-3">
                        <form action={updateScopeAssignmentAction} className="space-y-4">
                          <input type="hidden" name="assignmentId" value={assignment.id} />
                          <input type="hidden" name="active" value={String(assignment.active)} />
                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="space-y-1 text-sm font-medium text-slate-700">
                              <span>User</span>
                              <select
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                                name="userId"
                                defaultValue={assignment.userId}
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
                              <span>Role</span>
                              <select
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                                name="roleKey"
                                defaultValue={assignment.roleKey}
                                required
                              >
                                {catalog.roles
                                  .filter((role) => role.active || role.key === assignment.roleKey)
                                  .map((role) => (
                                    <option key={role.key} value={role.key}>
                                      {role.labelVi}
                                    </option>
                                  ))}
                              </select>
                            </label>
                          </div>
                          <ScopeFields assignment={assignment} projects={projects} modules={modules} />
                          <PermissionCheckboxes permissions={catalog.permissions} selectedKeys={selectedKeys} />
                          <Button type="submit" size="sm">
                            <Save className="h-4 w-4" aria-hidden="true" />
                            Luu assignment
                          </Button>
                        </form>

                        {assignment.active ? (
                          <details className="border-t border-rose-100 pt-3">
                            <summary className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50">
                              <Ban className="h-4 w-4" aria-hidden="true" />
                              Vo hieu hoa
                            </summary>
                            <form action={disableScopeAssignmentAction} className="mt-3">
                              <input type="hidden" name="assignmentId" value={assignment.id} />
                              <Button type="submit" size="sm" variant="outline">
                                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                                Xac nhan vo hieu hoa
                              </Button>
                            </form>
                          </details>
                        ) : null}
                      </div>
                    </details>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
