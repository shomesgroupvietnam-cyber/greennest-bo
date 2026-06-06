import { isValidDateOnly } from "@/lib/date/business-day";
import {
  MEETING_STATUSES,
  MEETING_TYPES,
  MEETING_VISIBILITIES,
  type MeetingStatus,
  type MeetingType,
  type MeetingVisibility,
} from "@/modules/meetings/constants";
import type { Meeting, MeetingListFilters } from "@/modules/meetings/types";
import type { Project } from "@/modules/projects/types";
import type { User } from "@/modules/users/types";

const allValue = "all" as const;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export type MeetingListFilterKey =
  | "projectId"
  | "organizationId"
  | "axisId"
  | "departmentId"
  | "participantId"
  | "meetingType"
  | "status"
  | "visibility"
  | "dateFrom"
  | "dateTo";

export type MeetingListFilterState = {
  projectId: string | typeof allValue;
  organizationId: string | typeof allValue;
  axisId: string | typeof allValue;
  departmentId: string | typeof allValue;
  participantId: string | typeof allValue;
  meetingType: MeetingType | typeof allValue;
  status: MeetingStatus | typeof allValue;
  visibility: MeetingVisibility | typeof allValue;
  dateFrom: string;
  dateTo: string;
};

export type MeetingFilterOption = {
  label: string;
  value: string;
};

export type MeetingListFilterOptions = {
  axes: MeetingFilterOption[];
  departments: MeetingFilterOption[];
  organizations: MeetingFilterOption[];
  participants: MeetingFilterOption[];
  projects: MeetingFilterOption[];
};

export type ActiveMeetingFilter = {
  href: string;
  key: MeetingListFilterKey;
  label: string;
  valueLabel: string;
};

export type MeetingListEmptyState = "filtered" | "scoped";

type RawSearchParams = Record<string, string | string[] | undefined>;

const serializableKeys: MeetingListFilterKey[] = [
  "projectId",
  "organizationId",
  "axisId",
  "departmentId",
  "participantId",
  "meetingType",
  "status",
  "visibility",
  "dateFrom",
  "dateTo",
];

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanParam(value: string | undefined) {
  const normalized = value?.trim();

  return normalized && normalized !== allValue ? normalized : allValue;
}

function cleanDateParam(value: string | undefined) {
  const normalized = value?.trim();

  return normalized && datePattern.test(normalized) && isValidDateOnly(normalized) ? normalized : "";
}

function knownEnumValue<T extends Record<string, string>>(value: string | undefined, labels: T) {
  if (!value || value === allValue) {
    return allValue;
  }

  return Object.prototype.hasOwnProperty.call(labels, value) ? value : allValue;
}

function optionList(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({ label: value, value }));
}

function optionLabel(options: MeetingFilterOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function userLabelById(users: User[]) {
  return new Map(users.map((user) => [user.id, user.fullName || user.email || user.id]));
}

function isActiveValue(value: string | typeof allValue) {
  return value !== allValue && value !== "";
}

export function parseMeetingListFilterState(params: RawSearchParams = {}): MeetingListFilterState {
  return {
    axisId: cleanParam(readParam(params.axisId)),
    dateFrom: cleanDateParam(readParam(params.dateFrom)),
    dateTo: cleanDateParam(readParam(params.dateTo)),
    departmentId: cleanParam(readParam(params.departmentId)),
    meetingType: knownEnumValue(readParam(params.meetingType), MEETING_TYPES) as MeetingType | typeof allValue,
    organizationId: cleanParam(readParam(params.organizationId)),
    participantId: cleanParam(readParam(params.participantId)),
    projectId: cleanParam(readParam(params.projectId)),
    status: knownEnumValue(readParam(params.status), MEETING_STATUSES) as MeetingStatus | typeof allValue,
    visibility: knownEnumValue(readParam(params.visibility), MEETING_VISIBILITIES) as MeetingVisibility | typeof allValue,
  };
}

export function meetingListFiltersFromState(state: MeetingListFilterState): MeetingListFilters {
  return {
    ...(isActiveValue(state.projectId) ? { projectId: state.projectId } : {}),
    ...(isActiveValue(state.organizationId) ? { organizationId: state.organizationId } : {}),
    ...(isActiveValue(state.axisId) ? { axisId: state.axisId } : {}),
    ...(isActiveValue(state.departmentId) ? { departmentId: state.departmentId } : {}),
    ...(isActiveValue(state.participantId) ? { participantId: state.participantId } : {}),
    ...(isActiveValue(state.meetingType) ? { meetingType: state.meetingType } : {}),
    ...(isActiveValue(state.status) ? { status: state.status } : {}),
    ...(isActiveValue(state.visibility) ? { visibility: state.visibility } : {}),
    ...(state.dateFrom ? { dateFrom: state.dateFrom } : {}),
    ...(state.dateTo ? { dateTo: state.dateTo } : {}),
  };
}

export function hasActiveMeetingFilters(state: MeetingListFilterState) {
  return serializableKeys.some((key) => isActiveValue(String(state[key])));
}

export function resolveMeetingListEmptyState(input: {
  activeFilterCount: number;
  scopedMeetingCount: number;
}): MeetingListEmptyState {
  return input.activeFilterCount > 0 && input.scopedMeetingCount > 0 ? "filtered" : "scoped";
}

export function buildMeetingFilterOptions(input: {
  meetings: Meeting[];
  projects: Project[];
  users: User[];
}): MeetingListFilterOptions {
  const labelsByUserId = userLabelById(input.users);
  const participantIds = new Set<string>();

  for (const meeting of input.meetings) {
    if (meeting.hostId) {
      participantIds.add(meeting.hostId);
    }

    for (const participantId of meeting.participants) {
      participantIds.add(participantId);
    }
  }

  return {
    axes: optionList(input.meetings.map((meeting) => meeting.axisId)),
    departments: optionList(input.meetings.map((meeting) => meeting.departmentId)),
    organizations: optionList(input.meetings.map((meeting) => meeting.organizationId)),
    participants: [...participantIds]
      .map((participantId) => ({
        label: labelsByUserId.get(participantId) ?? participantId,
        value: participantId,
      }))
      .sort((left, right) => left.label.localeCompare(right.label)),
    projects: input.projects
      .map((project) => ({
        label: `${project.code} - ${project.name}`,
        value: project.id,
      }))
      .sort((left, right) => left.label.localeCompare(right.label)),
  };
}

export function meetingFilterHref(state: MeetingListFilterState, removeKey?: MeetingListFilterKey) {
  const params = new URLSearchParams();

  for (const key of serializableKeys) {
    if (key === removeKey) {
      continue;
    }

    const value = String(state[key]);

    if (!isActiveValue(value)) {
      continue;
    }

    params.set(key, value);
  }

  const query = params.toString();

  return query ? `/meetings?${query}` : "/meetings";
}

export function buildActiveMeetingFilters(
  state: MeetingListFilterState,
  options: MeetingListFilterOptions,
): ActiveMeetingFilter[] {
  const activeFilters: ActiveMeetingFilter[] = [];
  const addFilter = (key: MeetingListFilterKey, label: string, value: string, valueLabel: string) => {
    if (!isActiveValue(value)) {
      return;
    }

    activeFilters.push({
      href: meetingFilterHref(state, key),
      key,
      label,
      valueLabel,
    });
  };

  addFilter("projectId", "Du an", state.projectId, optionLabel(options.projects, state.projectId));
  addFilter("organizationId", "To chuc", state.organizationId, optionLabel(options.organizations, state.organizationId));
  addFilter("axisId", "Truc", state.axisId, optionLabel(options.axes, state.axisId));
  addFilter("departmentId", "Phong ban", state.departmentId, optionLabel(options.departments, state.departmentId));
  addFilter("participantId", "Nguoi tham gia", state.participantId, optionLabel(options.participants, state.participantId));
  addFilter("meetingType", "Loai hop", state.meetingType, state.meetingType === allValue ? allValue : MEETING_TYPES[state.meetingType]);
  addFilter("status", "Trang thai", state.status, state.status === allValue ? allValue : MEETING_STATUSES[state.status]);
  addFilter("visibility", "Visibility", state.visibility, state.visibility === allValue ? allValue : MEETING_VISIBILITIES[state.visibility]);
  addFilter("dateFrom", "Tu ngay", state.dateFrom, state.dateFrom);
  addFilter("dateTo", "Den ngay", state.dateTo, state.dateTo);

  return activeFilters;
}
