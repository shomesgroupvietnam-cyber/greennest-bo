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
      <PageShell title="KhÃ´ng cÃ³ quyá»n truy cáº­p" description="Cuá»™c há»p nÃ y khÃ´ng náº±m trong pháº¡m vi Ä‘Æ°á»£c giao cá»§a báº¡n.">
        <UnauthorizedState backHref="/meetings" backLabel="Vá» danh sÃ¡ch há»p" title="Báº¡n khÃ´ng cÃ³ quyá»n xem cuá»™c há»p nÃ y" />
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
    <PageShell title={meeting.title} description="Chi tiáº¿t biÃªn báº£n há»p, quyáº¿t Ä‘á»‹nh vÃ  action item.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href="/meetings">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Danh sÃ¡ch há»p
          </Link>
        </Button>
        {canUpdateMeeting ? (
          <Button asChild variant="outline">
            <Link href={`/meetings/${meeting.id}/edit`}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Sá»­a biÃªn báº£n
            </Link>
          </Button>
        ) : null}
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Dá»± Ã¡n</p>
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
          <p className="text-sm text-slate-500">Thá»i gian</p>
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
            <h2 className="text-base font-semibold text-slate-950">BiÃªn báº£n/tá»‘m táº¯t</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{meeting.summary ?? "ChÆ°a cÃ³ ná»™i dung tá»‘m táº¯t."}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-950">Quyáº¿t Ä‘á»‹nh vÃ  action item</h2>
            <DecisionList canConvertToTask={canCreateTask} decisions={decisions} />
          </section>
        </div>

        {canCreateDecision ? <DecisionForm action={decisionAction} /> : null}
      </section>
    </PageShell>
  );
}
