"use client";

import Link from "next/link";
import React, { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  MEETING_PARTICIPANT_SCOPES,
  MEETING_STATUSES,
  MEETING_TYPES,
  MEETING_VISIBILITIES,
} from "@/modules/meetings/constants";
import type { Meeting } from "@/modules/meetings/types";
import {
  emptyMeetingRelatedRecordOptions,
  type MeetingRelatedRecordOption,
  type MeetingRelatedRecordOptions,
} from "@/modules/meetings/services/meeting-related-record-options";
import type { Project } from "@/modules/projects/types";

type MeetingFormProps = {
  action: MeetingFormAction;
  defaultProjectId?: string;
  meeting?: Meeting;
  projects: Project[];
  relatedRecordOptions?: MeetingRelatedRecordOptions;
  submitLabel: string;
};

type MeetingFormActionState = {
  fieldErrors?: Record<string, string>;
  message?: string;
  status: "idle" | "error";
  values?: Record<string, string | string[]>;
};

type MeetingFormAction = (
  state: MeetingFormActionState,
  formData: FormData,
) => MeetingFormActionState | Promise<MeetingFormActionState>;

const initialMeetingFormActionState: MeetingFormActionState = {
  status: "idle",
};

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

function toDateTimeInput(value?: string) {
  if (!value) {
    return "";
  }

  return value.slice(0, 16);
}

function stateStringValue(
  state: MeetingFormActionState,
  field: string,
  fallback = "",
) {
  const value = state.values?.[field];

  return typeof value === "string" ? value : fallback;
}

function stateArrayValue(
  state: MeetingFormActionState,
  field: string,
  fallback: string[] = [],
) {
  const value = state.values?.[field];

  if (Array.isArray(value)) {
    return value;
  }

  return typeof value === "string" ? [value] : fallback;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-red-600">{message}</p> : null;
}

function relatedIds(
  meeting: Meeting | undefined,
  type: "approval" | "decision" | "document" | "risk" | "task",
) {
  if (!meeting) {
    return [];
  }

  const fromGenericRecords = (meeting.relatedRecords ?? [])
    .filter(
      (record) =>
        record.type === type ||
        (type === "approval" && record.type === "proposal"),
    )
    .map((record) => record.id);

  if (type === "approval") {
    return [
      ...new Set([...fromGenericRecords, ...(meeting.relatedApprovals ?? [])]),
    ];
  }

  if (type === "task") {
    return [
      ...new Set([...fromGenericRecords, ...(meeting.relatedTasks ?? [])]),
    ];
  }

  return [...new Set(fromGenericRecords)];
}

function projectScopeLabel(projects: Project[], projectIds: string[]) {
  if (projectIds.length === 0) {
    return "Không gắn dự án cụ thể";
  }

  return projectIds
    .map((projectId) => {
      const project = projects.find((item) => item.id === projectId);

      return project ? `${project.code} - ${project.name}` : projectId;
    })
    .join(", ");
}

function RelatedRecordSelect({
  label,
  name,
  options,
  selectedIds,
}: {
  label: string;
  name: string;
  options: MeetingRelatedRecordOption[];
  selectedIds: string[];
}) {
  const selectSize = Math.min(Math.max(options.length, 2), 5);
  const optionIds = new Set(options.map((option) => option.id));
  const hiddenSelectedCount = selectedIds.filter(
    (selectedId) => !optionIds.has(selectedId),
  ).length;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-800" htmlFor={name}>
        {label}
      </label>
      <input name={`${name}__present`} type="hidden" value="1" />
      {options.map((option) => (
        <input
          key={`${option.id}:visible`}
          name={`${name}__visible`}
          type="hidden"
          value={option.id}
        />
      ))}
      {options.length > 0 ? (
        <select
          className={fieldClass}
          defaultValue={selectedIds}
          id={name}
          multiple
          name={name}
          size={selectSize}
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.helper
                ? `${option.label} (${option.helper})`
                : option.label}
            </option>
          ))}
        </select>
      ) : (
        <>
          <p className="rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500">
            Không có record trong scope hiện tại.
          </p>
        </>
      )}
      {hiddenSelectedCount > 0 ? (
        <p className="text-sm text-slate-500">
          {hiddenSelectedCount} lien ket hien co dang an ngoai scope va se duoc
          giu nguyen khi luu.
        </p>
      ) : null}
    </div>
  );
}

export function MeetingForm({
  action,
  defaultProjectId,
  meeting,
  projects,
  relatedRecordOptions = emptyMeetingRelatedRecordOptions,
  submitLabel,
}: MeetingFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialMeetingFormActionState,
  );
  const selectedProjectId = stateStringValue(
    state,
    "projectId",
    meeting?.projectId ?? defaultProjectId ?? "",
  );
  const selectedProjectIds = meeting
    ? [meeting.projectId, ...(meeting.projectIds ?? [])].filter(
        (item): item is string => Boolean(item),
      )
    : stateArrayValue(state, "projectIds");

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-lg border bg-white p-5 shadow-sm"
    >
      {state.status === "error" ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          <p className="font-medium">{state.message}</p>
          {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {Object.entries(state.fieldErrors).map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <section className="rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
        <p className="font-medium">One Meeting Engine</p>
        <p className="mt-1">
          Một hệ thống họp chung, phân loại động theo loại họp, tổ chức, dự án,
          trục, phòng ban, visibility và participant scope. Video call,
          transcript và AI summary thật chưa triển khai ở bước này.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="title">
            Tiêu đề cuộc họp <span className="text-red-600">*</span>
          </label>
          <input
            className={fieldClass}
            defaultValue={stateStringValue(state, "title", meeting?.title)}
            id="title"
            name="title"
            required
          />
          <FieldError message={state.fieldErrors?.title} />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="meetingType"
          >
            Loại cuộc họp
          </label>
          <select
            className={fieldClass}
            defaultValue={stateStringValue(
              state,
              "meetingType",
              meeting?.meetingType ?? "PROJECT_MEETING",
            )}
            id="meetingType"
            name="meetingType"
          >
            {Object.entries(MEETING_TYPES).map(([type, label]) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="status"
          >
            Trạng thái workflow
          </label>
          <select
            className={fieldClass}
            defaultValue={stateStringValue(
              state,
              "status",
              meeting?.status ?? "SCHEDULED",
            )}
            id="status"
            name="status"
          >
            {Object.entries(MEETING_STATUSES).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {!meeting ? (
          <>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-800"
                htmlFor="projectId"
              >
                Dự án
              </label>
              <select
                className={fieldClass}
                defaultValue={selectedProjectId}
                id="projectId"
                name="projectId"
              >
                <option value="">Không gắn dự án cụ thể</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} - {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-800"
                htmlFor="projectIds"
              >
                Dự án liên quan thêm
              </label>
              <select
                className={fieldClass}
                id="projectIds"
                multiple
                name="projectIds"
                defaultValue={selectedProjectIds}
                size={Math.min(Math.max(projects.length, 2), 5)}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} - {project.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <section className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4 md:col-span-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Scope cuộc họp
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Scope được giữ nguyên trong màn hình sửa này.
              </p>
            </div>
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="text-slate-500">Dự án</dt>
                <dd className="font-medium text-slate-900">
                  {projectScopeLabel(projects, selectedProjectIds)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Organization</dt>
                <dd className="font-medium text-slate-900">
                  {meeting.organizationId ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Trục</dt>
                <dd className="font-medium text-slate-900">
                  {meeting.axisId ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Phòng ban</dt>
                <dd className="font-medium text-slate-900">
                  {meeting.departmentId ?? "-"}
                </dd>
              </div>
            </dl>
          </section>
        )}

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="meetingDate"
          >
            Bắt đầu <span className="text-red-600">*</span>
          </label>
          <input
            className={fieldClass}
            defaultValue={stateStringValue(
              state,
              "meetingDate",
              toDateTimeInput(meeting?.meetingDate),
            )}
            id="meetingDate"
            name="meetingDate"
            required
            type="datetime-local"
          />
          <FieldError message={state.fieldErrors?.meetingDate} />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="endTime"
          >
            Kết thúc
          </label>
          <input
            className={fieldClass}
            defaultValue={stateStringValue(
              state,
              "endTime",
              toDateTimeInput(meeting?.endTime),
            )}
            id="endTime"
            name="endTime"
            type="datetime-local"
          />
          <FieldError message={state.fieldErrors?.endTime} />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="visibility"
          >
            Visibility
          </label>
          <select
            className={fieldClass}
            defaultValue={stateStringValue(
              state,
              "visibility",
              meeting?.visibility ?? "project",
            )}
            id="visibility"
            name="visibility"
          >
            {Object.entries(MEETING_VISIBILITIES).map(([visibility, label]) => (
              <option key={visibility} value={visibility}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="participantScope"
          >
            Participant scope
          </label>
          <select
            className={fieldClass}
            defaultValue={stateStringValue(
              state,
              "participantScope",
              meeting?.participantScope ?? "project_team",
            )}
            id="participantScope"
            name="participantScope"
          >
            {Object.entries(MEETING_PARTICIPANT_SCOPES).map(
              ([scope, label]) => (
                <option key={scope} value={scope}>
                  {label}
                </option>
              ),
            )}
          </select>
        </div>

        {!meeting ? (
          <>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-800"
                htmlFor="organizationId"
              >
                Organization ID
              </label>
              <input
                className={fieldClass}
                defaultValue={stateStringValue(state, "organizationId")}
                id="organizationId"
                name="organizationId"
                placeholder="org-green-nest"
              />
              <FieldError message={state.fieldErrors?.organizationId} />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-800"
                htmlFor="axisId"
              >
                Trục
              </label>
              <input
                className={fieldClass}
                defaultValue={stateStringValue(state, "axisId")}
                id="axisId"
                name="axisId"
                placeholder="axis-1"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-800"
                htmlFor="departmentId"
              >
                Department ID
              </label>
              <input
                className={fieldClass}
                defaultValue={stateStringValue(state, "departmentId")}
                id="departmentId"
                name="departmentId"
                placeholder="legal / investment / design"
              />
            </div>
          </>
        ) : null}

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="roomId"
          >
            Room ID placeholder
          </label>
          <input
            className={fieldClass}
            defaultValue={stateStringValue(state, "roomId", meeting?.roomId)}
            id="roomId"
            name="roomId"
            placeholder="room-board-01 hoặc online-placeholder"
          />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="hostId"
          >
            Host ID
          </label>
          <input
            className={fieldClass}
            defaultValue={stateStringValue(state, "hostId", meeting?.hostId)}
            id="hostId"
            name="hostId"
            placeholder="user-host-01"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="participants"
          >
            Participants nội bộ
          </label>
          <input
            className={fieldClass}
            defaultValue={stateStringValue(
              state,
              "participants",
              meeting?.participants.join(", "),
            )}
            id="participants"
            name="participants"
            placeholder="user-a, user-b, user-c"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="externalParticipants"
          >
            External participants
          </label>
          <input
            className={fieldClass}
            defaultValue={stateStringValue(
              state,
              "externalParticipants",
              meeting?.externalParticipants.join(", "),
            )}
            id="externalParticipants"
            name="externalParticipants"
            placeholder="UBND, Sở Xây dựng, Tư vấn A, Nhà thầu B"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="agenda"
          >
            Agenda
          </label>
          <textarea
            className={fieldClass}
            defaultValue={stateStringValue(state, "agenda", meeting?.agenda)}
            id="agenda"
            name="agenda"
            rows={4}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="summary"
          >
            Tóm tắt/biên bản
          </label>
          <textarea
            className={fieldClass}
            defaultValue={stateStringValue(state, "summary", meeting?.summary)}
            id="summary"
            name="summary"
            rows={8}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="meetingMinutes"
          >
            Meeting minutes chính thức
          </label>
          <textarea
            className={fieldClass}
            defaultValue={stateStringValue(
              state,
              "meetingMinutes",
              meeting?.meetingMinutes,
            )}
            id="meetingMinutes"
            name="meetingMinutes"
            rows={5}
          />
        </div>

        <section className="space-y-4 md:col-span-2">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Related records
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Chỉ hiển thị các record trong scope được phép xem.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <RelatedRecordSelect
              label="Approval/Proposal liên quan"
              name="relatedApprovals"
              options={relatedRecordOptions.approvals}
              selectedIds={stateArrayValue(
                state,
                "relatedApprovals",
                relatedIds(meeting, "approval"),
              )}
            />
            <RelatedRecordSelect
              label="Risk/Blocker liên quan"
              name="relatedRisks"
              options={relatedRecordOptions.risks}
              selectedIds={stateArrayValue(
                state,
                "relatedRisks",
                relatedIds(meeting, "risk"),
              )}
            />
            <RelatedRecordSelect
              label="Decision liên quan"
              name="relatedDecisions"
              options={relatedRecordOptions.decisions}
              selectedIds={stateArrayValue(
                state,
                "relatedDecisions",
                relatedIds(meeting, "decision"),
              )}
            />
            <RelatedRecordSelect
              label="Task liên quan"
              name="relatedTasks"
              options={relatedRecordOptions.tasks}
              selectedIds={stateArrayValue(
                state,
                "relatedTasks",
                relatedIds(meeting, "task"),
              )}
            />
            <RelatedRecordSelect
              label="Document liên quan"
              name="relatedDocuments"
              options={relatedRecordOptions.documents}
              selectedIds={stateArrayValue(
                state,
                "relatedDocuments",
                relatedIds(meeting, "document"),
              )}
            />
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={isPending} type="submit">
          {isPending ? "Dang luu..." : submitLabel}
        </Button>
        <Button asChild type="button" variant="outline">
          <Link href={meeting ? `/meetings/${meeting.id}` : "/meetings"}>
            Hủy
          </Link>
        </Button>
      </div>
    </form>
  );
}
