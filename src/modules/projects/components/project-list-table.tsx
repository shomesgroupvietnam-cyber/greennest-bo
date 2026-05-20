import { Eye, Pencil } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import type { Project } from "@/modules/projects/types";

import { ProjectStatusBadge } from "./project-status-badge";

type ProjectListTableProps = {
  canCreate?: boolean;
  canUpdate?: boolean;
  projects: Project[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function ProjectListTable({ canCreate = true, canUpdate = true, projects }: ProjectListTableProps) {
  if (projects.length === 0) {
    return (
      <EmptyState
        action={
          canCreate ? (
            <Button asChild>
              <Link href="/projects/new">Tạo dự án</Link>
            </Button>
          ) : undefined
        }
        description="Tạo dự án đầu tiên hoặc điều chỉnh bộ lọc để xem dữ liệu đang được lưu trong mock repository."
        title="Chưa có dự án phù hợp"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Tên dự án</th>
              <th className="px-4 py-3">Địa điểm</th>
              <th className="px-4 py-3">Loại hình</th>
              <th className="px-4 py-3">Chủ đầu tư</th>
              <th className="px-4 py-3">Phụ trách</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Cập nhật</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((project) => (
              <tr className="align-top hover:bg-slate-50" key={project.id}>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{project.code}</td>
                <td className="min-w-56 px-4 py-3">
                  <Link className="font-medium text-emerald-700 hover:text-emerald-800" href={`/projects/${project.id}`}>
                    {project.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{project.location ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">{project.projectType ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">{project.investor ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">{project.ownerName ?? "-"}</td>
                <td className="px-4 py-3">
                  <ProjectStatusBadge status={project.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(project.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/projects/${project.id}`}>
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        Xem
                      </Link>
                    </Button>
                    {canUpdate ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/projects/${project.id}/edit`}>
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                          Sửa
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
