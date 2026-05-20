import { Plus } from "lucide-react";
import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";
import { PROJECT_STATUSES, type ProjectStatus } from "@/constants/statuses";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { listScopedProjects } from "@/lib/permissions/scoped-resources";
import { ProjectListTable } from "@/modules/projects/components/project-list-table";

type ProjectsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = searchParams ? await searchParams : {};
  const query = readParam(params.q) ?? "";
  const status = (readParam(params.status) ?? "all") as ProjectStatus | "all";
  const includeArchived = readParam(params.archived) === "1";
  const currentUser = await getCurrentUser();
  const canCreateProject = can(currentUser, "project.create");
  const canUpdateProject = can(currentUser, "project.update");
  const projects = await listScopedProjects(currentUser, {
    query,
    status,
    includeArchived
  });

  return (
    <PageShell title="Dự án" description="Quản lý danh mục dự án, trạng thái và thông tin điều hành cốt lõi.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="grid flex-1 gap-3 rounded-lg border bg-white p-4 shadow-sm md:grid-cols-[minmax(220px,1fr)_220px_160px_auto]">
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            defaultValue={query}
            name="q"
            placeholder="Tìm theo mã, tên, địa điểm..."
          />
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            defaultValue={status}
            name="status"
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(PROJECT_STATUSES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
            <input defaultChecked={includeArchived} name="archived" type="checkbox" value="1" />
            Gồm lưu trữ
          </label>
          <Button type="submit" variant="secondary">
            Lọc
          </Button>
        </form>
        {canCreateProject ? (
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Tạo dự án
            </Link>
          </Button>
        ) : null}
      </div>

      <ProjectListTable canCreate={canCreateProject} canUpdate={canUpdateProject} projects={projects} />
    </PageShell>
  );
}
