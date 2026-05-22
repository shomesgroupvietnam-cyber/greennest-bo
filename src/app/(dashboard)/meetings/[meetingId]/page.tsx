import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { getScopedMeeting, getScopedProject, listScopedDecisions } from "@/lib/permissions/scoped-resources";
import { createDecisionAction } from "@/modules/meetings/actions";
import { DecisionForm } from "@/modules/meetings/components/decision-form";
import { DecisionList } from "@/modules/meetings/components/decision-list";
import { getMeeting } from "@/modules/meetings/services/meeting-service";

type MeetingDetailPageProps = {
  params: Promise<{ meetingId: string }>;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { meetingId } = await params;
  const currentUser = await getCurrentUser();
  const rawMeeting = await getMeeting(meetingId);

  if (!rawMeeting) {
    notFound();
  }

  const meeting = await getScopedMeeting(currentUser, meetingId);

  if (!meeting) {
    return (
      <PageShell title="Không có quyền truy cập" description="Cuộc họp này không nằm trong phạm vi được giao của bạn.">
        <UnauthorizedState backHref="/meetings" backLabel="Về danh sách họp" title="Bạn không có quyền xem cuộc họp này" />
      </PageShell>
    );
  }

  const [project, decisions] = await Promise.all([
    getScopedProject(currentUser, meeting.projectId),
    listScopedDecisions(currentUser, { meetingId: meeting.id })
  ]);
  const canUpdateMeeting = can(currentUser, "meeting.update", meeting);
  const canCreateDecision = can(currentUser, "decision.create");
  const canCreateTask = can(currentUser, "task.create");
  const decisionAction = createDecisionAction.bind(null, meeting.id);

  return (
    <PageShell title={meeting.title} description="Chi tiết biên bản họp, quyết định và action item.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href="/meetings">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Danh sách họp
          </Link>
        </Button>
        {canUpdateMeeting ? (
          <Button asChild variant="outline">
            <Link href={`/meetings/${meeting.id}/edit`}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Sửa biên bản
            </Link>
          </Button>
        ) : null}
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Dự án</p>
          <p className="mt-2 text-sm font-medium text-slate-950">
            {project ? (
              <Link className="text-emerald-700 hover:text-emerald-800" href={`/projects/${project.id}`}>
                {project.code} - {project.name}
              </Link>
            ) : (
              meeting.projectId
            )}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Thời gian</p>
          <p className="mt-2 text-sm font-medium text-slate-950">{formatDateTime(meeting.meetingDate)}</p>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Action item</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{decisions.length}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Biên bản/tốm tắt</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{meeting.summary ?? "Chưa có nội dung tốm tắt."}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-950">Quyết định và action item</h2>
            <DecisionList canConvertToTask={canCreateTask} decisions={decisions} />
          </section>
        </div>

        {canCreateDecision ? <DecisionForm action={decisionAction} /> : null}
      </section>
    </PageShell>
  );
}
