import { Plus } from "lucide-react";
import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/guard";
import { listScopedMeetings, listScopedProjects } from "@/lib/permissions/scoped-resources";
import { MeetingListTable } from "@/modules/meetings/components/meeting-list-table";
import { MEETING_STATUSES, MEETING_TYPES, MEETING_VISIBILITIES } from "@/modules/meetings/constants";
import type { MeetingListFilters } from "@/modules/meetings/types";

type MeetingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MeetingsPage({ searchParams }: MeetingsPageProps) {
  const params = searchParams ? await searchParams : {};
  const projectId = readParam(params.projectId) ?? "all";
  const meetingType = readParam(params.meetingType) ?? "all";
  const status = readParam(params.status) ?? "all";
  const visibility = readParam(params.visibility) ?? "all";
  const session = await requirePermission("meeting.view", { route: "/meetings" });
  const currentUser = session.user;
  const canCreateMeeting = can(currentUser, "meeting.create");
  const canUpdateMeeting = can(currentUser, "meeting.update");
  const [projects, meetings] = await Promise.all([
    listScopedProjects(currentUser),
    listScopedMeetings(currentUser, {
      projectId,
      meetingType: meetingType as MeetingListFilters["meetingType"],
      status: status as MeetingListFilters["status"],
      visibility: visibility as MeetingListFilters["visibility"]
    })
  ]);

  return (
    <PageShell title="Meeting Center" description="One Meeting Engine: phân loại động theo loại họp, scope, visibility và follow-up.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="grid flex-1 gap-3 rounded-lg border bg-white p-4 shadow-sm md:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(160px,1fr)_minmax(160px,1fr)_auto]">
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            defaultValue={projectId}
            name="projectId"
          >
            <option value="all">Tất cả dự án</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} - {project.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            defaultValue={meetingType}
            name="meetingType"
          >
            <option value="all">Tất cả loại họp</option>
            {Object.entries(MEETING_TYPES).map(([type, label]) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            defaultValue={status}
            name="status"
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(MEETING_STATUSES).map(([statusKey, label]) => (
              <option key={statusKey} value={statusKey}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            defaultValue={visibility}
            name="visibility"
          >
            <option value="all">Tất cả visibility</option>
            {Object.entries(MEETING_VISIBILITIES).map(([visibilityKey, label]) => (
              <option key={visibilityKey} value={visibilityKey}>
                {label}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary">
            Lọc
          </Button>
        </form>
        {canCreateMeeting ? (
          <Button asChild>
            <Link href="/meetings/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Tạo cuộc họp
            </Link>
          </Button>
        ) : null}
      </div>

      <MeetingListTable canCreate={canCreateMeeting} canUpdate={canUpdateMeeting} meetings={meetings} projects={projects} />
    </PageShell>
  );
}
