import { Eye, Pencil } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import type { Meeting } from "@/modules/meetings/types";
import type { Project } from "@/modules/projects/types";

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
              <Link href="/meetings/new">Táº¡o biÃªn báº£n há»p</Link>
            </Button>
          ) : undefined
        }
        description="Táº¡o meeting note Ä‘á»ƒ lÆ°u láº¡i thÃ´ng tin há»p, quyáº¿t Ä‘á»‹nh vÃ  action item theo dá»± Ã¡n."
        title="ChÆ°a cÃ³ cuá»™c há»p phÃ¹ há»£p"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Cuá»™c há»p</th>
              <th className="px-4 py-3">Dá»± Ã¡n</th>
              <th className="px-4 py-3">Thá»i gian</th>
              <th className="px-4 py-3">NgÆ°á»i táº¡o</th>
              <th className="px-4 py-3 text-right">Thao tÃ¡c</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {meetings.map((meeting) => {
              const project = projectById.get(meeting.projectId);

              return (
                <tr className="align-top hover:bg-slate-50" key={meeting.id}>
                  <td className="min-w-64 px-4 py-3">
                    <Link className="font-medium text-emerald-700 hover:text-emerald-800" href={`/meetings/${meeting.id}`}>
                      {meeting.title}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{meeting.summary ?? "ChÆ°a cÃ³ tá»‘m táº¯t."}</p>
                  </td>
                  <td className="min-w-56 px-4 py-3 text-slate-600">
                    {project ? (
                      <Link className="text-slate-700 hover:text-emerald-700" href={`/projects/${project.id}`}>
                        {project.code} - {project.name}
                      </Link>
                    ) : (
                      "KhÃ´ng rÃµ"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(meeting.meetingDate)}</td>
                  <td className="px-4 py-3 text-slate-600">{meeting.createdBy ?? "-"}</td>
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
                            Sá»­a
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
