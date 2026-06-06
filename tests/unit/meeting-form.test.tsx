import { render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { MeetingForm } from "@/modules/meetings/components/meeting-form";
import type { Meeting } from "@/modules/meetings/types";
import type { Project } from "@/modules/projects/types";

const project: Project = {
  code: "GN-001",
  createdAt: "2026-06-01T00:00:00.000Z",
  id: "project-a",
  name: "GreenNest One",
  status: "active",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

const noopAction = async (state: {
  status: "idle" | "error";
  fieldErrors?: Record<string, string>;
  message?: string;
  values?: Record<string, string | string[]>;
}) => state;

function buildMeeting(patch: Partial<Meeting> = {}): Meeting {
  return {
    aiSummary: { status: "DRAFT" },
    attachments: [],
    auditLog: [],
    createdAt: "2026-06-01T00:00:00.000Z",
    decisions: [],
    externalParticipants: ["UBND"],
    followUpActions: [],
    id: "meeting-01",
    meetingDate: "2026-06-05T09:00:00.000Z",
    meetingType: "PROJECT_MEETING",
    organizationId: "org-green-nest",
    participants: ["leader-01"],
    participantScope: "project_team",
    projectId: "project-a",
    projectIds: ["project-a"],
    relatedApprovals: ["proposal-a"],
    relatedRecords: [
      {
        id: "proposal-a",
        relationType: "context",
        title: "Approval A",
        type: "approval",
      },
    ],
    relatedTasks: [],
    startTime: "2026-06-05T09:00:00.000Z",
    status: "SCHEDULED",
    title: "Weekly meeting",
    updatedAt: "2026-06-01T00:00:00.000Z",
    visibility: "project",
    ...patch,
  };
}

describe("MeetingForm", () => {
  it("renders related record pickers with scoped options", () => {
    render(
      <MeetingForm
        action={noopAction}
        projects={[project]}
        relatedRecordOptions={{
          approvals: [
            { id: "proposal-a", label: "Approval A", helper: "Project A" },
          ],
          decisions: [{ id: "decision-a", label: "Decision A" }],
          documents: [{ id: "document-a", label: "Document A" }],
          risks: [{ id: "risk-a", label: "Risk A" }],
          tasks: [{ id: "task-a", label: "Task A" }],
        }}
        submitLabel="Tạo biên bản họp"
      />,
    );

    expect(
      within(screen.getByLabelText("Approval/Proposal liên quan")).getByRole(
        "option",
        { name: /Approval A/ },
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByLabelText("Risk/Blocker liên quan")).getByRole(
        "option",
        { name: /Risk A/ },
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByLabelText("Document liên quan")).getByRole("option", {
        name: /Document A/,
      }),
    ).toBeInTheDocument();
  });

  it("renders meeting scope as read-only on edit while preserving related defaults", () => {
    render(
      <MeetingForm
        action={noopAction}
        meeting={buildMeeting()}
        projects={[project]}
        relatedRecordOptions={{
          approvals: [{ id: "proposal-a", label: "Approval A" }],
          decisions: [],
          documents: [],
          risks: [],
          tasks: [],
        }}
        submitLabel="Lưu biên bản"
      />,
    );

    expect(screen.getByText("Scope cuộc họp")).toBeInTheDocument();
    expect(screen.getByText(/org-green-nest/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Organization ID")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Trục")).not.toBeInTheDocument();

    const approvalSelect = screen.getByLabelText(
      "Approval/Proposal liên quan",
    ) as HTMLSelectElement;
    expect(approvalSelect.selectedOptions[0]?.value).toBe("proposal-a");
  });

  it("does not render hidden inputs for selected related records outside visible options", () => {
    const hiddenMeeting = buildMeeting({
      relatedApprovals: ["proposal-hidden"],
      relatedRecords: [
        {
          id: "proposal-hidden",
          relationType: "context",
          title: "Hidden Approval",
          type: "approval",
        },
      ],
    });
    const { container } = render(
      <MeetingForm
        action={noopAction}
        meeting={hiddenMeeting}
        projects={[project]}
        relatedRecordOptions={{
          approvals: [],
          decisions: [],
          documents: [],
          risks: [],
          tasks: [],
        }}
        submitLabel="LÆ°u biÃªn báº£n"
      />,
    );

    expect(
      container.querySelector(
        'input[name="relatedApprovals"][value="proposal-hidden"]',
      ),
    ).toBeNull();
    expect(screen.getByText(/1 lien ket hien co/)).toBeInTheDocument();
  });
});
