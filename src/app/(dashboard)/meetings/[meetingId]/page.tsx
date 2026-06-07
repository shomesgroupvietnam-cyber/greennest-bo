import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import {
  getScopedDecision,
  getScopedDocument,
  getScopedExecutiveRiskRecord,
  getScopedMeeting,
  getScopedProject,
  getScopedProposal,
  getScopedTask,
} from "@/lib/permissions/scoped-resources";
import {
  addMeetingAttachmentAction,
  addMeetingFollowUpActionAction,
  approveMeetingAiSummaryAction,
  approveMeetingMinutesAction,
  createMeetingFollowUpTaskAction,
  createDecisionAction,
  generateMeetingAiSummaryDraftAction,
  linkMeetingDecisionTrackingAction,
  removeMeetingAttachmentAction,
  updateMeetingFollowUpActionStatusAction,
  updateMeetingAiSummaryDraftAction,
  updateMeetingMinutesAction,
} from "@/modules/meetings/actions";
import {
  MeetingParticipantScopeLabel,
  MeetingStatusBadge,
  MeetingTypeBadge,
  MeetingVisibilityBadge,
} from "@/modules/meetings/components/meeting-badges";
import {
  MeetingAiSummaryPanel,
  MeetingAttachmentsPanel,
  MeetingDecisionTrackingPanel,
  MeetingFollowUpActionsPanel,
  type MeetingFollowUpActionPanelItem,
  type MeetingFollowUpTaskLink,
  MeetingMinutesPanel,
} from "@/modules/meetings/components/meeting-detail-panels";
import { buildAiMeetingSummaryDraft } from "@/modules/ai/services/ai-meeting-summary-service";
import { getMeetingDecisionTrackingData } from "@/modules/meetings/services/meeting-decision-tracking-service";
import { getMeeting } from "@/modules/meetings/services/meeting-service";
import type {
  Meeting,
  MeetingAttachment,
  MeetingRelatedRecord,
} from "@/modules/meetings/types";

type MeetingDetailPageProps = {
  params: Promise<{ meetingId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const followUpReadyStatuses = new Set(["COMPLETED", "FOLLOW_UP_PENDING"]);

function meetingProjectIds(meeting: Pick<Meeting, "projectId" | "projectIds">) {
  return [
    ...new Set(
      [meeting.projectId, ...(meeting.projectIds ?? [])].filter(
        (projectId): projectId is string => Boolean(projectId),
      ),
    ),
  ];
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function meetingReturnToHref(meetingId: string, scopeId?: string) {
  const baseHref = `/meetings/${meetingId}`;
  const normalizedScopeId = scopeId?.trim();

  return normalizedScopeId
    ? `${baseHref}?scopeId=${encodeURIComponent(normalizedScopeId)}`
    : baseHref;
}

type VisibleRelatedRecord = {
  href?: string;
  id: string;
  label: string;
  type: string;
  typeLabel: string;
};

function normalizedMeetingRelatedRecords(meeting: Meeting) {
  const records: MeetingRelatedRecord[] = [];
  const seen = new Set<string>();

  function add(record: MeetingRelatedRecord) {
    const key = `${record.type}:${record.id}`;

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    records.push(record);
  }

  for (const record of meeting.relatedRecords ?? []) {
    add(record);
  }

  for (const approvalId of meeting.relatedApprovals ?? []) {
    add({ type: "approval", id: approvalId, relationType: "context" });
  }

  for (const taskId of meeting.relatedTasks ?? []) {
    add({ type: "task", id: taskId, relationType: "context" });
  }

  return records;
}

async function resolveVisibleRelatedRecord(
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>,
  record: MeetingRelatedRecord,
): Promise<VisibleRelatedRecord | undefined> {
  if (record.type === "approval" || record.type === "proposal") {
    const detail = await getScopedProposal(currentUser, record.id);

    return detail
      ? {
          href: `/proposals/${detail.proposal.id}`,
          id: detail.proposal.id,
          label: `${detail.proposal.code} - ${detail.proposal.title}`,
          type: record.type,
          typeLabel: "Phê duyệt/Đề xuất",
        }
      : undefined;
  }

  if (record.type === "task") {
    const task = await getScopedTask(currentUser, record.id);

    return task
      ? {
          href: `/tasks/${task.id}`,
          id: task.id,
          label: task.title,
          type: record.type,
          typeLabel: "Task",
        }
      : undefined;
  }

  if (record.type === "document") {
    const document = await getScopedDocument(currentUser, record.id);

    return document
      ? {
          href: `/documents/${document.id}`,
          id: document.id,
          label: document.title,
          type: record.type,
          typeLabel: "Document",
        }
      : undefined;
  }

  if (record.type === "decision") {
    const decision = await getScopedDecision(currentUser, record.id);

    return decision
      ? {
          id: decision.id,
          label: decision.title ?? decision.decisionText,
          type: record.type,
          typeLabel: "Quyết định",
        }
      : undefined;
  }

  if (record.type === "risk") {
    const risk = await getScopedExecutiveRiskRecord(currentUser, record.id);

    return risk
      ? {
          id: risk.id,
          label: risk.title,
          type: record.type,
          typeLabel: "Rủi ro/Vướng mắc",
        }
      : undefined;
  }

  if (record.type === "project") {
    const project = await getScopedProject(currentUser, record.id);

    return project
      ? {
          href: `/projects/${project.id}`,
          id: project.id,
          label: `${project.code} - ${project.name}`,
          type: record.type,
          typeLabel: "Dự án",
        }
      : undefined;
  }

  return {
    id: record.id,
    label: record.title ?? record.id,
    type: record.type,
    typeLabel: "Custom",
  };
}

async function resolveVisibleMeetingAttachment(
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>,
  attachment: MeetingAttachment,
) {
  if (!attachment.documentId) {
    return attachment;
  }

  const document = await getScopedDocument(currentUser, attachment.documentId);

  return document ? attachment : undefined;
}

async function resolveVisibleMeetingProjectIds(
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>,
  meeting: Pick<Meeting, "projectId" | "projectIds">,
) {
  const visibleProjectIds = await Promise.all(
    meetingProjectIds(meeting).map(async (projectId) =>
      (await getScopedProject(currentUser, projectId)) ? projectId : undefined,
    ),
  );

  return visibleProjectIds.filter((projectId): projectId is string =>
    Boolean(projectId),
  );
}

async function resolveVisibleFollowUpTaskLink(
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>,
  taskId: string,
): Promise<MeetingFollowUpTaskLink | undefined> {
  const task = await getScopedTask(currentUser, taskId);

  return task
    ? {
        href: `/tasks/${task.id}`,
        id: task.id,
        title: task.title,
      }
    : undefined;
}

export default async function MeetingDetailPage({
  params,
  searchParams,
}: MeetingDetailPageProps) {
  const { meetingId } = await params;
  const query = (await searchParams) ?? {};
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
          title="Bạn không có quyền xem cuộc họp này"
        />
      </PageShell>
    );
  }

  const [
    project,
    decisionTrackingData,
    visibleRelatedRecords,
    visibleAttachments,
    visibleProjectIds,
    visibleFollowUpTaskLinks,
  ] =
    await Promise.all([
      meeting.projectId
        ? getScopedProject(currentUser, meeting.projectId)
        : Promise.resolve(undefined),
      getMeetingDecisionTrackingData(currentUser, meeting),
      Promise.all(
        normalizedMeetingRelatedRecords(meeting).map((record) =>
          resolveVisibleRelatedRecord(currentUser, record),
        ),
      ).then((records) =>
        records.filter((record): record is VisibleRelatedRecord =>
          Boolean(record),
        ),
      ),
      Promise.all(
        meeting.attachments.map((attachment) =>
          resolveVisibleMeetingAttachment(currentUser, attachment),
        ),
      ).then((attachments) =>
        attachments.filter((attachment): attachment is MeetingAttachment =>
          Boolean(attachment),
        ),
      ),
      resolveVisibleMeetingProjectIds(currentUser, meeting),
      Promise.all(
        [
          ...new Set(
            meeting.followUpActions
              .map((action) => action.relatedTaskId)
              .filter((taskId): taskId is string => Boolean(taskId)),
          ),
        ].map((taskId) =>
          resolveVisibleFollowUpTaskLink(currentUser, taskId),
        ),
      ).then((tasks) =>
        tasks.filter((task): task is MeetingFollowUpTaskLink => Boolean(task)),
      ),
    ]);
  const canUpdateMeeting = can(currentUser, "meeting.update", meeting);
  const canCreateTask = can(currentUser, "task.create");
  const createDecisionFromMeetingAction = createDecisionAction.bind(
    null,
    meeting.id,
  );
  const linkDecisionTrackingAction = linkMeetingDecisionTrackingAction.bind(
    null,
    meeting.id,
  );
  const canUpdateFollowUps =
    canUpdateMeeting && followUpReadyStatuses.has(meeting.status);
  const visibleFollowUpTaskIds = new Set(
    visibleFollowUpTaskLinks.map((task) => task.id),
  );
  const followUpActionsForPanel: MeetingFollowUpActionPanelItem[] =
    meeting.followUpActions.map((action) => ({
      dueDate: action.dueDate,
      hasHiddenRelatedTask: Boolean(
        action.relatedTaskId && !visibleFollowUpTaskIds.has(action.relatedTaskId),
      ),
      id: action.id,
      ownerId: action.ownerId,
      relatedTaskId:
        action.relatedTaskId && visibleFollowUpTaskIds.has(action.relatedTaskId)
          ? action.relatedTaskId
          : undefined,
      status: action.status,
      title: action.title,
    }));
  const minutesPanelMeeting = {
    meetingMinutes: meeting.meetingMinutes,
    meetingMinutesApproval: meeting.meetingMinutesApproval,
    summary: meeting.summary,
  };
  const attachmentsPanelMeeting = { attachments: visibleAttachments };
  const aiSummaryPanelMeeting = { aiSummary: meeting.aiSummary };
  const returnToHref = meetingReturnToHref(
    meeting.id,
    firstSearchParam(query.scopeId),
  );
  const aiMeetingSummary = await buildAiMeetingSummaryDraft(
    currentUser,
    {
      generatedAt: new Date().toISOString(),
      meeting,
      returnToHref,
      visibleAttachments,
      visibleProjectIds,
      visibleRelatedRecords: visibleRelatedRecords.map((record) => ({
        href: record.href,
        id: record.id,
        label: record.label,
        type: record.type,
      })),
    },
    { useProvider: false },
  );
  const needsFollowUpTaskProjectInput = meetingProjectIds(meeting).length !== 1;
  const updateMinutesAction = updateMeetingMinutesAction.bind(null, meeting.id);
  const approveMinutesAction = approveMeetingMinutesAction.bind(
    null,
    meeting.id,
  );
  const addAttachmentAction = addMeetingAttachmentAction.bind(null, meeting.id);
  const removeAttachmentAction = removeMeetingAttachmentAction.bind(
    null,
    meeting.id,
  );
  const updateAiSummaryAction = updateMeetingAiSummaryDraftAction.bind(
    null,
    meeting.id,
  );
  const generateAiSummaryAction = generateMeetingAiSummaryDraftAction.bind(
    null,
    meeting.id,
  );
  const approveAiSummaryAction = approveMeetingAiSummaryAction.bind(
    null,
    meeting.id,
  );
  const addFollowUpAction = addMeetingFollowUpActionAction.bind(null, meeting.id);
  const createFollowUpTaskAction = createMeetingFollowUpTaskAction.bind(
    null,
    meeting.id,
  );
  const updateFollowUpStatusAction =
    updateMeetingFollowUpActionStatusAction.bind(null, meeting.id);

  return (
    <PageShell
      title={meeting.title}
      description="Chi tiết biên bản họp, quyết định và action item."
    >
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
              <Link
                className="text-emerald-700 hover:text-emerald-800"
                href={`/projects/${project.id}`}
              >
                {project.code} - {project.name}
              </Link>
            ) : (
              "Không gắn dự án cụ thể"
            )}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Org: {meeting.organizationId ?? "-"} · Trục: {meeting.axisId ?? "-"}{" "}
            · Phòng ban: {meeting.departmentId ?? "-"}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Thời gian</p>
          <p className="mt-2 text-sm font-medium text-slate-950">
            {formatDateTime(meeting.startTime)}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Kết thúc: {meeting.endTime ? formatDateTime(meeting.endTime) : "-"}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Bộ xử lý cuộc họp</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <MeetingTypeBadge meetingType={meeting.meetingType} />
            <MeetingStatusBadge status={meeting.status} />
            <MeetingVisibilityBadge visibility={meeting.visibility} />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Phạm vi người tham dự:{" "}
            <MeetingParticipantScopeLabel
              participantScope={meeting.participantScope}
            />
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              Metadata phân loại động
            </h2>
            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="text-slate-500">Host</dt>
                <dd className="font-medium text-slate-900">
                  {meeting.hostId ?? meeting.createdBy ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Room placeholder</dt>
                <dd className="font-medium text-slate-900">
                  {meeting.roomId ?? "Chưa đặt phòng"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Participants nội bộ</dt>
                <dd className="font-medium text-slate-900">
                  {meeting.participants.length > 0
                    ? meeting.participants.join(", ")
                    : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">External participants</dt>
                <dd className="font-medium text-slate-900">
                  {meeting.externalParticipants.length > 0
                    ? meeting.externalParticipants.join(", ")
                    : "-"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              Related records
            </h2>
            {visibleRelatedRecords.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {visibleRelatedRecords.map((record) => (
                  <li
                    key={`${record.typeLabel}:${record.id}`}
                    className="flex flex-wrap items-center gap-2 text-sm"
                  >
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {record.typeLabel}
                    </span>
                    {record.href ? (
                      <Link
                        className="font-medium text-emerald-700 hover:text-emerald-800"
                        href={record.href}
                      >
                        {record.label}
                      </Link>
                    ) : (
                      <span className="font-medium text-slate-900">
                        {record.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                Chưa có related record trong scope được phép xem.
              </p>
            )}
          </section>

          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Agenda</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
              {meeting.agenda ?? "Chưa có agenda."}
            </p>
          </section>

          <MeetingMinutesPanel
            approveAction={approveMinutesAction}
            canUpdate={canUpdateMeeting}
            meeting={minutesPanelMeeting}
            updateAction={updateMinutesAction}
          />

          <MeetingAttachmentsPanel
            addAction={addAttachmentAction}
            canUpdate={canUpdateMeeting}
            meeting={attachmentsPanelMeeting}
            removeAction={removeAttachmentAction}
          />

            <MeetingAiSummaryPanel
              aiMeetingSummary={aiMeetingSummary}
              approveAction={approveAiSummaryAction}
              canUpdate={canUpdateMeeting}
              generateAction={generateAiSummaryAction}
              meeting={aiSummaryPanelMeeting}
              returnToHref={returnToHref}
              updateDraftAction={updateAiSummaryAction}
            />

          <MeetingFollowUpActionsPanel
            addAction={addFollowUpAction}
            canCreateTask={canCreateTask}
            canUpdate={canUpdateFollowUps}
            createTaskAction={createFollowUpTaskAction}
            followUpActions={followUpActionsForPanel}
            needsTaskProjectInput={needsFollowUpTaskProjectInput}
            updateStatusAction={updateFollowUpStatusAction}
            visibleTaskLinks={visibleFollowUpTaskLinks}
          />

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">
                Transcript
              </h2>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                Placeholder
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                {meeting.transcript ??
                  "Transcript thật chưa triển khai trong scope này."}
              </p>
            </div>
          </section>

        </div>

        <div className="space-y-6">
          <MeetingDecisionTrackingPanel
            createDecisionAction={createDecisionFromMeetingAction}
            data={decisionTrackingData}
            linkDecisionAction={linkDecisionTrackingAction}
          />
        </div>
      </section>
    </PageShell>
  );
}
