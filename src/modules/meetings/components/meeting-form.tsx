import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  MEETING_PARTICIPANT_SCOPES,
  MEETING_STATUSES,
  MEETING_TYPES,
  MEETING_VISIBILITIES
} from "@/modules/meetings/constants";
import type { Meeting } from "@/modules/meetings/types";
import type { Project } from "@/modules/projects/types";

type MeetingFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  defaultProjectId?: string;
  meeting?: Meeting;
  projects: Project[];
  submitLabel: string;
};

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

function toDateTimeInput(value?: string) {
  if (!value) {
    return "";
  }

  return value.slice(0, 16);
}

export function MeetingForm({ action, defaultProjectId, meeting, projects, submitLabel }: MeetingFormProps) {
  const selectedProjectId = meeting?.projectId ?? defaultProjectId ?? "";

  return (
    <form action={action} className="space-y-6 rounded-lg border bg-white p-5 shadow-sm">
      <section className="rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
        <p className="font-medium">One Meeting Engine</p>
        <p className="mt-1">
          Một hệ thống họp chung, phân loại động theo loại họp, tổ chức, dự án, trục, phòng ban, visibility và participant scope.
          Video call, transcript và AI summary thật chưa triển khai ở bước này.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="title">
            Tiêu đề cuộc họp <span className="text-red-600">*</span>
          </label>
          <input className={fieldClass} defaultValue={meeting?.title} id="title" name="title" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="meetingType">
            Loại cuộc họp
          </label>
          <select className={fieldClass} defaultValue={meeting?.meetingType ?? "PROJECT_MEETING"} id="meetingType" name="meetingType">
            {Object.entries(MEETING_TYPES).map(([type, label]) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="status">
            Trạng thái workflow
          </label>
          <select className={fieldClass} defaultValue={meeting?.status ?? "SCHEDULED"} id="status" name="status">
            {Object.entries(MEETING_STATUSES).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {!meeting ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="projectId">
              Dự án
            </label>
            <select className={fieldClass} defaultValue={selectedProjectId} id="projectId" name="projectId">
              <option value="">Không gắn dự án cụ thể</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="meetingDate">
            Bắt đầu <span className="text-red-600">*</span>
          </label>
          <input
            className={fieldClass}
            defaultValue={toDateTimeInput(meeting?.meetingDate)}
            id="meetingDate"
            name="meetingDate"
            required
            type="datetime-local"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="endTime">
            Kết thúc
          </label>
          <input className={fieldClass} defaultValue={toDateTimeInput(meeting?.endTime)} id="endTime" name="endTime" type="datetime-local" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="visibility">
            Visibility
          </label>
          <select className={fieldClass} defaultValue={meeting?.visibility ?? "project"} id="visibility" name="visibility">
            {Object.entries(MEETING_VISIBILITIES).map(([visibility, label]) => (
              <option key={visibility} value={visibility}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="participantScope">
            Participant scope
          </label>
          <select className={fieldClass} defaultValue={meeting?.participantScope ?? "project_team"} id="participantScope" name="participantScope">
            {Object.entries(MEETING_PARTICIPANT_SCOPES).map(([scope, label]) => (
              <option key={scope} value={scope}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="organizationId">
            Organization ID
          </label>
          <input className={fieldClass} defaultValue={meeting?.organizationId} id="organizationId" name="organizationId" placeholder="org-green-nest" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="axisId">
            Trục
          </label>
          <input className={fieldClass} defaultValue={meeting?.axisId} id="axisId" name="axisId" placeholder="axis-1" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="departmentId">
            Department ID
          </label>
          <input className={fieldClass} defaultValue={meeting?.departmentId} id="departmentId" name="departmentId" placeholder="legal / investment / design" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="roomId">
            Room ID placeholder
          </label>
          <input className={fieldClass} defaultValue={meeting?.roomId} id="roomId" name="roomId" placeholder="room-board-01 hoặc online-placeholder" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="participants">
            Participants nội bộ
          </label>
          <input
            className={fieldClass}
            defaultValue={meeting?.participants.join(", ")}
            id="participants"
            name="participants"
            placeholder="user-a, user-b, user-c"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="externalParticipants">
            External participants
          </label>
          <input
            className={fieldClass}
            defaultValue={meeting?.externalParticipants.join(", ")}
            id="externalParticipants"
            name="externalParticipants"
            placeholder="UBND, Sở Xây dựng, Tư vấn A, Nhà thầu B"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="agenda">
            Agenda
          </label>
          <textarea className={fieldClass} defaultValue={meeting?.agenda} id="agenda" name="agenda" rows={4} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="summary">
            Tóm tắt/biên bản
          </label>
          <textarea className={fieldClass} defaultValue={meeting?.summary} id="summary" name="summary" rows={8} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="meetingMinutes">
            Meeting minutes chính thức
          </label>
          <textarea className={fieldClass} defaultValue={meeting?.meetingMinutes} id="meetingMinutes" name="meetingMinutes" rows={5} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">
          {submitLabel}
        </Button>
        <Button asChild type="button" variant="outline">
          <Link href={meeting ? `/meetings/${meeting.id}` : "/meetings"}>Hủy</Link>
        </Button>
      </div>
    </form>
  );
}
