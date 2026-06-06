import {
  MEETING_PARTICIPANT_SCOPES,
  MEETING_STATUSES,
  MEETING_TYPES,
  MEETING_VISIBILITIES,
  type MeetingParticipantScope,
  type MeetingStatus,
  type MeetingType,
  type MeetingVisibility
} from "@/modules/meetings/constants";
import React from "react";

const statusClassName: Record<MeetingStatus, string> = {
  SCHEDULED: "bg-sky-100 text-sky-800",
  CONFIRMED: "bg-indigo-100 text-indigo-800",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-slate-200 text-slate-600",
  FOLLOW_UP_PENDING: "bg-orange-100 text-orange-800",
  CLOSED: "bg-slate-100 text-slate-700"
};

export function MeetingTypeBadge({ meetingType }: { meetingType: MeetingType }) {
  return <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">{MEETING_TYPES[meetingType]}</span>;
}

export function MeetingStatusBadge({ status }: { status: MeetingStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClassName[status]}`}>{MEETING_STATUSES[status]}</span>;
}

export function MeetingVisibilityBadge({ visibility }: { visibility: MeetingVisibility }) {
  return <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{MEETING_VISIBILITIES[visibility]}</span>;
}

export function MeetingParticipantScopeLabel({ participantScope }: { participantScope: MeetingParticipantScope }) {
  return <span>{MEETING_PARTICIPANT_SCOPES[participantScope]}</span>;
}
