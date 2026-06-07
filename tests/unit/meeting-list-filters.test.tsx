import { render, screen, within } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MeetingListFilters } from "@/modules/meetings/components/meeting-list-filters";
import { MeetingListTable } from "@/modules/meetings/components/meeting-list-table";
import {
  buildActiveMeetingFilters,
  buildMeetingFilterOptions,
  meetingListFiltersFromState,
  parseMeetingListFilterState,
  resolveMeetingListEmptyState,
} from "@/modules/meetings/services/meeting-list-filter-service";
import type { Meeting } from "@/modules/meetings/types";
import type { Project } from "@/modules/projects/types";
import type { User } from "@/modules/users/types";

const project: Project = {
  code: "GN-001",
  createdAt: "2026-05-20T00:00:00.000Z",
  id: "project-a",
  name: "GreenNest One",
  status: "active",
  updatedAt: "2026-05-20T00:00:00.000Z",
};

const users: User[] = [
  {
    createdAt: "2026-05-20T00:00:00.000Z",
    email: "leader@example.com",
    fullName: "Leader One",
    id: "leader-01",
    role: "tong_giam_doc",
    status: "active",
    updatedAt: "2026-05-20T00:00:00.000Z",
  },
];

const projectB: Project = {
  code: "GN-002",
  createdAt: "2026-05-20T00:00:00.000Z",
  id: "project-b",
  name: "GreenNest Two",
  status: "active",
  updatedAt: "2026-05-20T00:00:00.000Z",
};

function buildMeeting(patch: Partial<Meeting> = {}): Meeting {
  return {
    aiSummary: { status: "DRAFT" },
    attachments: [],
    auditLog: [],
    createdAt: "2026-05-20T00:00:00.000Z",
    decisions: [],
    externalParticipants: [],
    followUpActions: [],
    id: "meeting-01",
    meetingDate: "2026-05-21T09:00:00.000Z",
    meetingType: "PROJECT_MEETING",
    participants: [],
    participantScope: "project_team",
    relatedApprovals: [],
    relatedTasks: [],
    startTime: "2026-05-21T09:00:00.000Z",
    status: "SCHEDULED",
    title: "Weekly meeting",
    updatedAt: "2026-05-20T00:00:00.000Z",
    visibility: "project",
    ...patch,
  };
}

describe("meeting list filters", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("parses URL params with allowlists and emits compact repository filters", () => {
    const state = parseMeetingListFilterState({
      dateFrom: "invalid-date",
      dateTo: "2026-02-31",
      meetingType: "INVALID_TYPE",
      participantId: "leader-01",
      projectId: "project-a",
      status: "SCHEDULED",
      visibility: "executive",
    });

    expect(state).toMatchObject({
      dateFrom: "",
      dateTo: "",
      meetingType: "all",
      participantId: "leader-01",
      projectId: "project-a",
      status: "SCHEDULED",
      visibility: "executive",
    });
    expect(meetingListFiltersFromState(state)).toEqual({
      participantId: "leader-01",
      projectId: "project-a",
      status: "SCHEDULED",
      visibility: "executive",
    });
  });

  it("builds options only from scoped meetings and renders removable active filters", () => {
    const scopedMeeting = buildMeeting({
      axisId: "axis-1",
      departmentId: "legal",
      hostId: "leader-01",
      organizationId: "org-green-nest",
      participants: ["assistant-01"],
      projectId: "project-a",
    });
    const options = buildMeetingFilterOptions({
      meetings: [scopedMeeting],
      projects: [project],
      users,
    });
    const state = parseMeetingListFilterState({
      dateTo: "2026-05-31",
      organizationId: "org-green-nest",
      participantId: "leader-01",
      projectId: "project-a",
      status: "SCHEDULED",
    });
    const activeFilters = buildActiveMeetingFilters(state, options);

    expect(options.organizations).toEqual([{ label: "org-green-nest", value: "org-green-nest" }]);
    expect(options.departments).toEqual([{ label: "legal", value: "legal" }]);

    render(
      <MeetingListFilters
        activeFilters={activeFilters}
        filters={state}
        options={options}
      />,
    );

    expect(screen.getByLabelText("Du an")).toHaveValue("project-a");
    expect(screen.getByLabelText("Nguoi tham gia")).toHaveValue("leader-01");
    expect(screen.getByRole("link", { name: "Bo loc Du an: GN-001 - GreenNest One" })).toHaveAttribute(
      "href",
      "/meetings?organizationId=org-green-nest&participantId=leader-01&status=SCHEDULED&dateTo=2026-05-31",
    );
    expect(screen.getByRole("link", { name: "Dat lai bo loc" })).toHaveAttribute("href", "/meetings");
  });

  it("renders filtered and scoped empty states without leaking hidden counts", () => {
    const { rerender } = render(
      <MeetingListTable
        canCreate={false}
        emptyState="filtered"
        meetings={[]}
        projects={[]}
      />,
    );

    expect(screen.getByText("Khong co meeting khop bo loc")).toBeInTheDocument();
    expect(screen.queryByText(/hidden/i)).not.toBeInTheDocument();

    rerender(
      <MeetingListTable
        canCreate={false}
        emptyState="scoped"
        meetings={[]}
        projects={[]}
      />,
    );

    expect(screen.getByText("Chưa có cuộc họp trong phạm vi của bạn")).toBeInTheDocument();
  });

  it("keeps scoped-empty state when filters are active but the scoped list is already empty", () => {
    expect(resolveMeetingListEmptyState({ activeFilterCount: 1, scopedMeetingCount: 0 })).toBe("scoped");
    expect(resolveMeetingListEmptyState({ activeFilterCount: 1, scopedMeetingCount: 2 })).toBe("filtered");
  });

  it("renders executive and overdue follow-up badges with participant metadata", () => {
    const meeting = buildMeeting({
      followUpActions: [
        {
          dueDate: "2026-05-20",
          id: "follow-up-01",
          status: "open",
          title: "Send minutes",
        },
      ],
      hostId: "leader-01",
      meetingType: "EXECUTIVE_MEETING",
      participants: ["assistant-01"],
      projectId: "project-a",
      visibility: "executive",
    });

    render(<MeetingListTable meetings={[meeting]} projects={[project]} />);

    const row = screen.getByRole("row", { name: /Weekly meeting/i });
    expect(within(row).getByText("Hop lanh dao / chien luoc")).toBeInTheDocument();
    expect(within(row).getByText("Follow-up qua han")).toBeInTheDocument();
    expect(within(row).getByText("2 nguoi tham gia")).toBeInTheDocument();
  });

  it("uses Vietnam business day for overdue follow-up badges", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T18:00:00.000Z"));

    const meeting = buildMeeting({
      followUpActions: [
        {
          dueDate: "2026-06-01",
          id: "follow-up-01",
          status: "open",
          title: "Send minutes",
        },
      ],
      projectId: "project-a",
    });

    render(<MeetingListTable meetings={[meeting]} projects={[project]} />);

    expect(screen.getByText("Follow-up qua han")).toBeInTheDocument();
  });

  it("renders scoped project names for multi-project-only meetings", () => {
    const meeting = buildMeeting({
      projectId: undefined,
      projectIds: ["project-a", "project-b"],
    });

    render(<MeetingListTable meetings={[meeting]} projects={[project, projectB]} />);

    expect(screen.getByRole("link", { name: "GN-001 - GreenNest One" })).toHaveAttribute("href", "/projects/project-a");
    expect(screen.getByRole("link", { name: "GN-002 - GreenNest Two" })).toHaveAttribute("href", "/projects/project-b");
    expect(screen.queryByText("Khong gan du an")).not.toBeInTheDocument();
  });
});
