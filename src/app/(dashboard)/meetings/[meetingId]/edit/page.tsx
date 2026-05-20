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
      <PageShell title="KhÃ´ng cÃ³ quyá»n truy cáº­p" description="Cuá»™c há»p nÃ y khÃ´ng náº±m trong pháº¡m vi Ä‘Æ°á»£c giao cá»§a báº¡n.">
        <UnauthorizedState backHref="/meetings" backLabel="Vá» danh sÃ¡ch há»p" title="Báº¡n khÃ´ng cÃ³ quyá»n sá»­a cuá»™c há»p nÃ y" />
      </PageShell>
    );
  }

  if (!can(currentUser, "meeting.update", meeting)) {
    return (
      <PageShell title="Sá»­a biÃªn báº£n há»p" description={meeting.title}>
        <UnauthorizedState backHref={`/meetings/${meeting.id}`} backLabel="Vá» chi tiáº¿t há»p" title="Báº¡n khÃ´ng cÃ³ quyá»n sá»­a biÃªn báº£n" />
      </PageShell>
    );
  }

  return (
    <PageShell title="Sá»­a biÃªn báº£n há»p" description={meeting.title}>
      <MeetingForm action={updateMeetingAction.bind(null, meeting.id)} meeting={meeting} projects={projects} submitLabel="LÆ°u biÃªn báº£n" />
    </PageShell>
  );
}
