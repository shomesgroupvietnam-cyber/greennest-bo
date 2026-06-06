import { Plus } from "lucide-react";
import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/guard";
import { listScopedMeetings, listScopedProjects } from "@/lib/permissions/scoped-resources";
import { MeetingListFilters } from "@/modules/meetings/components/meeting-list-filters";
import { MeetingListTable } from "@/modules/meetings/components/meeting-list-table";
import {
  buildActiveMeetingFilters,
  buildMeetingFilterOptions,
  hasActiveMeetingFilters,
  meetingListFiltersFromState,
  parseMeetingListFilterState,
  resolveMeetingListEmptyState,
} from "@/modules/meetings/services/meeting-list-filter-service";
import { listUsers } from "@/modules/users/services/user-service";

type MeetingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MeetingsPage({ searchParams }: MeetingsPageProps) {
  const params = searchParams ? await searchParams : {};
  const filterState = parseMeetingListFilterState(params);
  const repositoryFilters = meetingListFiltersFromState(filterState);
  const session = await requirePermission("meeting.view", { route: "/meetings" });
  const currentUser = session.user;
  const canCreateMeeting = can(currentUser, "meeting.create");
  const canUpdateMeeting = can(currentUser, "meeting.update");
  const [projects, scopedMeetings, users] = await Promise.all([
    listScopedProjects(currentUser),
    listScopedMeetings(currentUser),
    listUsers(),
  ]);
  const hasActiveFilters = hasActiveMeetingFilters(filterState);
  const meetings = hasActiveFilters && scopedMeetings.length > 0 ? await listScopedMeetings(currentUser, repositoryFilters) : scopedMeetings;
  const filterOptions = buildMeetingFilterOptions({
    meetings: scopedMeetings,
    projects,
    users,
  });
  const activeFilters = buildActiveMeetingFilters(filterState, filterOptions);
  const emptyState = resolveMeetingListEmptyState({
    activeFilterCount: activeFilters.length,
    scopedMeetingCount: scopedMeetings.length,
  });

  return (
    <PageShell
      title="Meeting Center"
      description="One Meeting Engine: phan loai theo loai hop, scope, visibility va follow-up."
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <MeetingListFilters activeFilters={activeFilters} filters={filterState} options={filterOptions} />
        </div>
        {canCreateMeeting ? (
          <Button asChild>
            <Link href="/meetings/new">
              <Plus aria-hidden="true" className="h-4 w-4" />
              Tao cuoc hop
            </Link>
          </Button>
        ) : null}
      </div>

      <MeetingListTable
        canCreate={canCreateMeeting}
        canUpdate={canUpdateMeeting}
        emptyState={emptyState}
        meetings={meetings}
        projects={projects}
      />
    </PageShell>
  );
}
