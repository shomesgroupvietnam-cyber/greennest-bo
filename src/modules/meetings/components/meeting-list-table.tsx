import { Eye, Pencil } from "lucide-react";
import Link from "next/link";
import React from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { isBeforeBusinessDay } from "@/lib/date/business-day";
import type { Meeting } from "@/modules/meetings/types";
import type { Project } from "@/modules/projects/types";

import { MeetingStatusBadge, MeetingTypeBadge, MeetingVisibilityBadge } from "./meeting-badges";

type MeetingListTableProps = {
  canCreate?: boolean;
  canUpdate?: boolean;
  emptyState?: "filtered" | "scoped";
  meetings: Meeting[];
  projects: Project[];
};

const terminalFollowUpStatuses = new Set(["cancelled", "closed", "done"]);

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function hasOverdueFollowUp(meeting: Meeting) {
  const today = new Date();

  return meeting.followUpActions.some((action) => {
    if (!action.dueDate || terminalFollowUpStatuses.has(String(action.status))) {
      return false;
    }

    return isBeforeBusinessDay(action.dueDate, today);
  });
}

function isExecutiveMeeting(meeting: Meeting) {
  return (
    meeting.visibility === "executive" ||
    meeting.meetingType === "EXECUTIVE_MEETING" ||
    meeting.meetingType === "EXECUTIVE_OPERATIONAL_MEETING"
  );
}

function participantCount(meeting: Meeting) {
  return new Set([meeting.hostId, ...meeting.participants].filter(Boolean)).size;
}

function meetingProjectIds(meeting: Meeting) {
  return [...new Set([meeting.projectId, ...(meeting.projectIds ?? [])].filter((projectId): projectId is string => Boolean(projectId)))];
}

function MeetingSignalBadge({ label, tone }: { label: string; tone: "emerald" | "red" }) {
  const toneClassName = {
    emerald: "bg-emerald-50 text-emerald-800",
    red: "bg-red-50 text-red-800",
  }[tone];

  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${toneClassName}`}>{label}</span>;
}

export function MeetingListTable({
  canCreate = true,
  canUpdate = true,
  emptyState = "scoped",
  meetings,
  projects,
}: MeetingListTableProps) {
  const projectById = new Map(projects.map((project) => [project.id, project]));

  if (meetings.length === 0) {
    const content =
      emptyState === "filtered"
        ? {
            description: "Thu bo bot filter hoac dat lai bo loc de xem cac meeting khac trong pham vi cua ban.",
            title: "Khong co meeting khop bo loc",
          }
        : {
            description: "Meeting Center chi hien thi cac cuoc hop ban co quyen xem theo role, project, department hoac participant scope.",
            title: "Chua co meeting trong pham vi cua ban",
          };

    return (
      <EmptyState
        action={
          canCreate && emptyState === "scoped" ? (
            <Button asChild>
              <Link href="/meetings/new">Tao cuoc hop</Link>
            </Button>
          ) : undefined
        }
        description={content.description}
        title={content.title}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Cuoc hop</th>
              <th className="px-4 py-3">Phan loai</th>
              <th className="px-4 py-3">Du an</th>
              <th className="px-4 py-3">Thoi gian</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3 text-right">Thao tac</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {meetings.map((meeting) => {
              const projectIds = meetingProjectIds(meeting);
              const visibleProjects = projectIds
                .map((projectId) => projectById.get(projectId))
                .filter((project): project is Project => Boolean(project));
              const signals = [
                ...(isExecutiveMeeting(meeting) ? [{ label: "Hop lanh dao / chien luoc", tone: "emerald" as const }] : []),
                ...(hasOverdueFollowUp(meeting) ? [{ label: "Follow-up qua han", tone: "red" as const }] : []),
              ];

              return (
                <tr className="align-top hover:bg-slate-50" key={meeting.id}>
                  <td className="min-w-64 px-4 py-3">
                    <Link className="font-medium text-emerald-700 hover:text-emerald-800" href={`/meetings/${meeting.id}`}>
                      {meeting.title}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{meeting.summary ?? meeting.agenda ?? "Chua co tom tat."}</p>
                    {signals.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {signals.map((signal) => (
                          <MeetingSignalBadge key={signal.label} label={signal.label} tone={signal.tone} />
                        ))}
                      </div>
                    ) : null}
                  </td>
                  <td className="min-w-48 px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <MeetingTypeBadge meetingType={meeting.meetingType} />
                      <MeetingStatusBadge status={meeting.status} />
                    </div>
                  </td>
                  <td className="min-w-56 px-4 py-3 text-slate-600">
                    {visibleProjects.length > 0 ? (
                      <div className="space-y-1">
                        {visibleProjects.map((project) => (
                          <Link className="block text-slate-700 hover:text-emerald-700" href={`/projects/${project.id}`} key={project.id}>
                            {project.code} - {project.name}
                          </Link>
                        ))}
                      </div>
                    ) : projectIds.length > 0 ? (
                      `Da gan ${projectIds.length} du an`
                    ) : (
                      "Khong gan du an"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(meeting.startTime)}</td>
                  <td className="min-w-56 px-4 py-3 text-xs text-slate-600">
                    <div className="space-y-1">
                      <MeetingVisibilityBadge visibility={meeting.visibility} />
                      <p>{participantCount(meeting)} nguoi tham gia</p>
                      <p>Chu tri: {meeting.hostId ?? "-"}</p>
                      <p>Org: {meeting.organizationId ?? "-"}</p>
                      <p>Truc: {meeting.axisId ?? "-"}</p>
                      <p>Phong ban: {meeting.departmentId ?? "-"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/meetings/${meeting.id}`}>
                          <Eye aria-hidden="true" className="h-4 w-4" />
                          Xem
                        </Link>
                      </Button>
                      {canUpdate ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/meetings/${meeting.id}/edit`}>
                            <Pencil aria-hidden="true" className="h-4 w-4" />
                            Sua
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
