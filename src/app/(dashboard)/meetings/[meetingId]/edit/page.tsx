import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { getScopedMeeting, listScopedProjects } from "@/lib/permissions/scoped-resources";
import { updateMeetingAction } from "@/modules/meetings/actions";
import { MeetingForm } from "@/modules/meetings/components/meeting-form";
import { getMeeting } from "@/modules/meetings/services/meeting-service";

type EditMeetingPageProps = {
  params: Promise<{ meetingId: string }>;
};

export default async function EditMeetingPage({ params }: EditMeetingPageProps) {
  const { meetingId } = await params;
  const currentUser = await getCurrentUser();
  const rawMeeting = await getMeeting(meetingId);

  if (!rawMeeting) {
    notFound();
  }

  const [meeting, projects] = await Promise.all([getScopedMeeting(currentUser, meetingId), listScopedProjects(currentUser)]);

  if (!meeting) {
    return (
      <PageShell title="Không có quyền truy cập" description="Cuộc họp này không nằm trong phạm vi được giao của bạn.">
        <UnauthorizedState backHref="/meetings" backLabel="Về danh sách họp" title="Bạn không có quyền sửa cuộc họp này" />
      </PageShell>
    );
  }

  if (!can(currentUser, "meeting.update", meeting)) {
    return (
      <PageShell title="Sửa biên bản họp" description={meeting.title}>
        <UnauthorizedState backHref={`/meetings/${meeting.id}`} backLabel="Về chi tiết họp" title="Bạn không có quyền sửa biên bản" />
      </PageShell>
    );
  }

  return (
    <PageShell title="Sửa biên bản họp" description={meeting.title}>
      <MeetingForm action={updateMeetingAction.bind(null, meeting.id)} meeting={meeting} projects={projects} submitLabel="Lưu biên bản" />
    </PageShell>
  );
}
