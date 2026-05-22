import { Plus } from "lucide-react";
import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/guard";
import { listScopedMeetings, listScopedProjects } from "@/lib/permissions/scoped-resources";
import { MeetingListTable } from "@/modules/meetings/components/meeting-list-table";

type MeetingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MeetingsPage({ searchParams }: MeetingsPageProps) {
  const params = searchParams ? await searchParams : {};
  const projectId = readParam(params.projectId) ?? "all";
  const session = await requirePermission("meeting.view", { route: "/meetings" });
  const currentUser = session.user;
  const canCreateMeeting = can(currentUser, "meeting.create");
  const canUpdateMeeting = can(currentUser, "meeting.update");
  const [projects, meetings] = await Promise.all([
    listScopedProjects(currentUser),
    listScopedMeetings(currentUser, { projectId })
  ]);

  return (
    <PageShell title="Cuộc họp" description="Biên bản họp, quyết định và action item theo dự án.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="grid flex-1 gap-3 rounded-lg border bg-white p-4 shadow-sm md:grid-cols-[minmax(220px,1fr)_auto]">
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
          <Button type="submit" variant="secondary">
            Lọc
          </Button>
        </form>
        {canCreateMeeting ? (
          <Button asChild>
            <Link href="/meetings/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Tạo biên bản họp
            </Link>
          </Button>
        ) : null}
      </div>

      <MeetingListTable canCreate={canCreateMeeting} canUpdate={canUpdateMeeting} meetings={meetings} projects={projects} />
    </PageShell>
  );
}
