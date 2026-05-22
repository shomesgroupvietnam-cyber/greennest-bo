import { Shield, UserPlus } from "lucide-react";

import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/constants/roles";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/guard";
import { listProjects } from "@/modules/projects/services/project-service";
import { inviteUserAction, updateUserRoleAction, upsertProjectMembershipAction } from "@/modules/users/actions";
import { listAuditLogs, listProjectMemberships, listRoles, listUsers } from "@/modules/users/services/user-service";

export default async function UsersPage() {
  const session = await requirePermission("user.view", { route: "/users" });
  const currentUser = session.user;
  const canInviteUser = can(currentUser, "user.invite");
  const canUpdateRole = can(currentUser, "user.update_role");
  const canAssignMember = can(currentUser, "project.assign_member");

  const [users, roles, projects, memberships, auditLogs] = await Promise.all([
    listUsers(),
    listRoles(),
    listProjects(),
    listProjectMemberships(),
    listAuditLogs()
  ]);

  return (
    <PageShell
      title="Người dùng"
      description="Quản lý người dùng mô phỏng, vai trò mặc định và thành viên dự án trong giai đoạn chưa bật Supabase Auth."
    >
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="border-b px-5 py-4">
              <h2 className="text-base font-semibold text-slate-950">Danh sách người dùng</h2>
              <p className="mt-1 text-sm text-slate-600">Vai trò lấy từ bộ hằng số RBAC trung tâm.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {users.map((user) => {
                const updateRole = updateUserRoleAction.bind(null, user.id);

                return (
                  <div className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_260px]" key={user.id}>
                    <div>
                      <p className="font-medium text-slate-950">{user.fullName}</p>
                      <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                      <p className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {ROLES[user.role].label}
                      </p>
                    </div>
                    {canUpdateRole ? (
                      <form action={updateRole} className="flex items-center gap-2">
                        <select
                          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                          defaultValue={user.role}
                          name="role"
                        >
                          {roles.map((role) => (
                            <option key={role.key} value={role.key}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                        <Button size="sm" type="submit" variant="outline">
                          Lưu
                        </Button>
                      </form>
                    ) : (
                      <p className="text-sm text-slate-500">Không có quyền đổi vai trò.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              <h2 className="text-base font-semibold text-slate-950">Thành viên dự án</h2>
            </div>
            {canAssignMember ? (
              <form action={upsertProjectMembershipAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_180px_auto]">
                <select
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  name="projectId"
                >
                  <option value="">Chọn dự án</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.code} - {project.name}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  name="userId"
                >
                  <option value="">Chọn người dùng</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  name="role"
                >
                  {roles.map((role) => (
                    <option key={role.key} value={role.key}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <Button type="submit">Gán</Button>
              </form>
            ) : (
              <p className="mt-3 text-sm text-slate-600">Vai trò hiện tại không có quyền gán thành viên dự án.</p>
            )}

            <div className="mt-4 divide-y divide-slate-100">
              {memberships.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có thành viên dự án mô phỏng.</p>
              ) : (
                memberships.map((membership) => {
                  const project = projects.find((item) => item.id === membership.projectId);
                  const user = users.find((item) => item.id === membership.userId);

                  return (
                    <div className="py-3 text-sm" key={membership.id}>
                      <p className="font-medium text-slate-950">{project?.name ?? membership.projectId}</p>
                      <p className="mt-1 text-slate-500">
                        {user?.fullName ?? membership.userId} · {ROLES[membership.role].label}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              <h2 className="text-base font-semibold text-slate-950">Mời người dùng</h2>
            </div>
            {canInviteUser ? (
              <form action={inviteUserAction} className="mt-4 space-y-3">
                <input
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  name="fullName"
                  placeholder="Họ tên"
                />
                <input
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  name="email"
                  placeholder="email@greennest.vn"
                  type="email"
                />
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  defaultValue="viewer"
                  name="role"
                >
                  {roles.map((role) => (
                    <option key={role.key} value={role.key}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <Button className="w-full" type="submit">
                  Tạo lời mời mô phỏng
                </Button>
              </form>
            ) : (
              <p className="mt-3 text-sm text-slate-600">Bạn không có quyền mời người dùng.</p>
            )}
          </div>

          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Audit vai trò</h2>
            <div className="mt-4 space-y-3">
              {auditLogs.slice(0, 8).length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có bản ghi audit.</p>
              ) : (
                auditLogs.slice(0, 8).map((auditLog) => (
                  <div className="rounded-md bg-slate-50 p-3 text-sm" key={auditLog.id}>
                    <p className="font-medium text-slate-950">{auditLog.action}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Actor: {auditLog.actorId} · Entity: {auditLog.entityType}/{auditLog.entityId}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </section>
    </PageShell>
  );
}
