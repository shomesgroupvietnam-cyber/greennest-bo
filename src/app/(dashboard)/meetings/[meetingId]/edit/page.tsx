import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import {
  getScopedMeeting,
  listScopedDecisions,
  listScopedDocuments,
  listScopedExecutiveRiskRecords,
  listScopedProjects,
  listScopedProposals,
  listScopedTasks,
} from "@/lib/permissions/scoped-resources";
import { updateMeetingAction } from "@/modules/meetings/actions";
import { MeetingForm } from "@/modules/meetings/components/meeting-form";
import { buildMeetingRelatedRecordOptions } from "@/modules/meetings/services/meeting-related-record-options";
import { getMeeting } from "@/modules/meetings/services/meeting-service";

type EditMeetingPageProps = {
  params: Promise<{ meetingId: string }>;
};

export default async function EditMeetingPage({
  params,
}: EditMeetingPageProps) {
  const { meetingId } = await params;
  const currentUser = await getCurrentUser();
  const meeting = await getScopedMeeting(currentUser, meetingId);

  if (!meeting) {
    const rawMeeting = await getMeeting(meetingId);

    if (!rawMeeting) {
      notFound();
    }

    return (
      <PageShell
        title="Không có quyền truy cập"
        description="Cuộc họp này không nằm trong phạm vi được giao của bạn."
      >
        <UnauthorizedState
          backHref="/meetings"
          backLabel="Về danh sách họp"
          title="Bạn không có quyền sửa cuộc họp này"
        />
      </PageShell>
    );
  }

  const projects = await listScopedProjects(currentUser);

  if (!can(currentUser, "meeting.update", meeting)) {
    return (
      <PageShell title="Sửa biên bản họp" description={meeting.title}>
        <UnauthorizedState
          backHref={`/meetings/${meeting.id}`}
          backLabel="Về chi tiết họp"
          title="Bạn không có quyền sửa biên bản"
        />
      </PageShell>
    );
  }

  const [proposals, tasks, documents, decisions, risks] = await Promise.all([
    listScopedProposals(currentUser),
    listScopedTasks(currentUser),
    listScopedDocuments(currentUser),
    listScopedDecisions(currentUser),
    listScopedExecutiveRiskRecords(currentUser),
  ]);
  const relatedRecordOptions = buildMeetingRelatedRecordOptions({
    decisions,
    documents,
    proposals,
    risks,
    tasks,
  });

  return (
    <PageShell title="Sửa biên bản họp" description={meeting.title}>
      <MeetingForm
        action={updateMeetingAction.bind(null, meeting.id)}
        meeting={meeting}
        projects={projects}
        relatedRecordOptions={relatedRecordOptions}
        submitLabel="Lưu biên bản"
      />
    </PageShell>
  );
}
