import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { listScopedProjects } from "@/lib/permissions/scoped-resources";
import { createMeetingAction } from "@/modules/meetings/actions";
import { MeetingForm } from "@/modules/meetings/components/meeting-form";

type NewMeetingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewMeetingPage({ searchParams }: NewMeetingPageProps) {
  const currentUser = await getCurrentUser();
  const params = searchParams ? await searchParams : {};
  const defaultProjectId = readParam(params.projectId);
  const projects = await listScopedProjects(currentUser);

  return (
    <PageShell title="Tạo biên bản họp" description="Ghi nhận cuộc họp theo dự án và chuẩn bị action item có trạch nhiệm rõ ràng.">
      {!can(currentUser, "meeting.create") ? (
        <UnauthorizedState backHref="/meetings" backLabel="Về danh sách họp" title="Bạn không có quyền tạo cuộc họp" />
      ) : projects.length === 0 ? (
        <EmptyState
          action={
            <Button asChild>
              <Link href="/projects/new">Tạo dự án</Link>
            </Button>
          }
          description="Cuộc họp phải gắn với một dự án trong phạm vi của bạn."
          title="Cần có dự án trước"
        />
      ) : (
        <MeetingForm
          action={createMeetingAction}
          defaultProjectId={defaultProjectId}
          projects={projects}
          submitLabel="Tạo biên bản họp"
        />
      )}
    </PageShell>
  );
}
