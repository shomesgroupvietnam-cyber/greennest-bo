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
import {
  MeetingParticipantScopeLabel,
  MeetingStatusBadge,
  MeetingTypeBadge,
  MeetingVisibilityBadge
} from "@/modules/meetings/components/meeting-badges";
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
    meeting.projectId ? getScopedProject(currentUser, meeting.projectId) : Promise.resolve(undefined),
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
          <p className="text-sm text-slate-500">Dự án / scope</p>
          <p className="mt-2 text-sm font-medium text-slate-950">
            {project ? (
              <Link className="text-emerald-700 hover:text-emerald-800" href={`/projects/${project.id}`}>
                {project.code} - {project.name}
              </Link>
            ) : (
              "Không gắn dự án cụ thể"
            )}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Org: {meeting.organizationId ?? "-"} · Trục: {meeting.axisId ?? "-"} · Phòng ban: {meeting.departmentId ?? "-"}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Thời gian</p>
          <p className="mt-2 text-sm font-medium text-slate-950">{formatDateTime(meeting.startTime)}</p>
          <p className="mt-2 text-xs text-slate-500">Kết thúc: {meeting.endTime ? formatDateTime(meeting.endTime) : "-"}</p>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Meeting Engine</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <MeetingTypeBadge meetingType={meeting.meetingType} />
            <MeetingStatusBadge status={meeting.status} />
            <MeetingVisibilityBadge visibility={meeting.visibility} />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Participant scope: <MeetingParticipantScopeLabel participantScope={meeting.participantScope} />
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Metadata phân loại động</h2>
            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="text-slate-500">Host</dt>
                <dd className="font-medium text-slate-900">{meeting.hostId ?? meeting.createdBy ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Room placeholder</dt>
                <dd className="font-medium text-slate-900">{meeting.roomId ?? "Chưa đặt phòng"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Participants nội bộ</dt>
                <dd className="font-medium text-slate-900">{meeting.participants.length > 0 ? meeting.participants.join(", ") : "-"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">External participants</dt>
                <dd className="font-medium text-slate-900">
                  {meeting.externalParticipants.length > 0 ? meeting.externalParticipants.join(", ") : "-"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Agenda</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{meeting.agenda ?? "Chưa có agenda."}</p>
          </section>

          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Biên bản/tóm tắt</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
              {meeting.meetingMinutes ?? meeting.summary ?? "Chưa có nội dung tóm tắt."}
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">AI summary</h2>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-amber-700">Placeholder · {meeting.aiSummary.status}</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                {meeting.aiSummary.content ?? "AI summary thật chưa triển khai. Nội dung AI luôn là draft cho tới khi được duyệt."}
              </p>
            </div>
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">Transcript</h2>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">Placeholder</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                {meeting.transcript ?? "Transcript thật chưa triển khai trong scope này."}
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Decision tracking và follow-up task</h2>
              <p className="mt-1 text-sm text-slate-600">
                Action item có thể sinh task khi cần. Decision tracking chính thức hiện dùng danh sách quyết định/action item hiện hữu.
              </p>
            </div>
            <DecisionList canConvertToTask={canCreateTask} decisions={decisions} />
          </section>
        </div>

        {canCreateDecision && meeting.projectId ? (
          <DecisionForm action={decisionAction} />
        ) : (
          <div className="rounded-lg border border-dashed bg-white p-5 text-sm text-slate-600">
            Follow-up task cần một dự án cụ thể để sinh task. Cuộc họp cấp tổ chức/portfolio có thể theo dõi decision ở phần metadata,
            nhưng chưa tạo task tự động trong scope placeholder này.
          </div>
        )}
      </section>
    </PageShell>
  );
}
