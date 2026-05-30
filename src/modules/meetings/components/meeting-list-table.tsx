import { Eye, Pencil } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import type { Meeting } from "@/modules/meetings/types";
import type { Project } from "@/modules/projects/types";

import { MeetingStatusBadge, MeetingTypeBadge, MeetingVisibilityBadge } from "./meeting-badges";

type MeetingListTableProps = {
  canCreate?: boolean;
  canUpdate?: boolean;
  meetings: Meeting[];
  projects: Project[];
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function MeetingListTable({ canCreate = true, canUpdate = true, meetings, projects }: MeetingListTableProps) {
  const projectById = new Map(projects.map((project) => [project.id, project]));

  if (meetings.length === 0) {
    return (
      <EmptyState
        action={
          canCreate ? (
            <Button asChild>
              <Link href="/meetings/new">Tạo biên bản họp</Link>
            </Button>
          ) : undefined
        }
        description="Tạo meeting note để lưu lại thông tin họp, quyết định và action item theo dự án."
        title="Chưa có cuộc họp phù hợp"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Cuộc họp</th>
              <th className="px-4 py-3">Phân loại</th>
              <th className="px-4 py-3">Dự án</th>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {meetings.map((meeting) => {
              const project = meeting.projectId ? projectById.get(meeting.projectId) : undefined;

              return (
                <tr className="align-top hover:bg-slate-50" key={meeting.id}>
                  <td className="min-w-64 px-4 py-3">
                    <Link className="font-medium text-emerald-700 hover:text-emerald-800" href={`/meetings/${meeting.id}`}>
                      {meeting.title}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{meeting.summary ?? meeting.agenda ?? "Chưa có tóm tắt."}</p>
                  </td>
                  <td className="min-w-48 px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <MeetingTypeBadge meetingType={meeting.meetingType} />
                      <MeetingStatusBadge status={meeting.status} />
                    </div>
                  </td>
                  <td className="min-w-56 px-4 py-3 text-slate-600">
                    {project ? (
                      <Link className="text-slate-700 hover:text-emerald-700" href={`/projects/${project.id}`}>
                        {project.code} - {project.name}
                      </Link>
                    ) : (
                      "Không gắn dự án"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(meeting.startTime)}</td>
                  <td className="min-w-48 px-4 py-3 text-xs text-slate-600">
                    <div className="space-y-1">
                      <MeetingVisibilityBadge visibility={meeting.visibility} />
                      <p>Org: {meeting.organizationId ?? "-"}</p>
                      <p>Trục: {meeting.axisId ?? "-"}</p>
                      <p>Phòng ban: {meeting.departmentId ?? "-"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/meetings/${meeting.id}`}>
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          Xem
                        </Link>
                      </Button>
                      {canUpdate ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/meetings/${meeting.id}/edit`}>
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            Sửa
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
