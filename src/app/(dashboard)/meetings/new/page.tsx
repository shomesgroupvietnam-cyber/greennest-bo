import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import {
  listScopedDecisions,
  listScopedDocuments,
  listScopedExecutiveRiskRecords,
  listScopedProjects,
  listScopedProposals,
  listScopedTasks,
} from "@/lib/permissions/scoped-resources";
import { createMeetingAction } from "@/modules/meetings/actions";
import { MeetingForm } from "@/modules/meetings/components/meeting-form";
import { buildMeetingRelatedRecordOptions } from "@/modules/meetings/services/meeting-related-record-options";

type NewMeetingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewMeetingPage({
  searchParams,
}: NewMeetingPageProps) {
  const currentUser = await getCurrentUser();
  const params = searchParams ? await searchParams : {};
  const defaultProjectId = readParam(params.projectId);
  const [projects, proposals, tasks, documents, decisions, risks] =
    await Promise.all([
      listScopedProjects(currentUser),
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
    <PageShell
      title="Tạo cuộc họp"
      description="Tạo meeting record trong One Meeting Engine; có thể gắn dự án hoặc chỉ nằm ở scope điều hành."
    >
      {!can(currentUser, "meeting.create") ? (
        <UnauthorizedState
          backHref="/meetings"
          backLabel="Về danh sách họp"
          title="Bạn không có quyền tạo cuộc họp"
        />
      ) : (
        <MeetingForm
          action={createMeetingAction}
          defaultProjectId={defaultProjectId}
          projects={projects}
          relatedRecordOptions={relatedRecordOptions}
          submitLabel="Tạo biên bản họp"
        />
      )}
    </PageShell>
  );
}
