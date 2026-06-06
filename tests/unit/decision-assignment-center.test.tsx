import { render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { DecisionAssignmentCenter } from "@/modules/executive/components/decision-assignment-center";
import type { DecisionAssignmentCenterData } from "@/modules/executive/types";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("view=executive-decision-log"),
}));

const data: DecisionAssignmentCenterData = {
  generatedAt: "2026-05-31T09:00:00.000Z",
  scopeLabel: "Decision & Assignment Center",
  summary: {
    dueSoonAssignments: 1,
    highPriorityDecisions: 1,
    openAssignments: 1,
    overdueAssignments: 0,
    totalDecisions: 1,
  },
  permissions: {
    canAssignDecision: true,
    canCreateDecision: true,
    canUpdateDecision: true,
    canView: true,
    canViewAudit: true,
  },
  filters: {},
  items: [
    {
      assignmentCount: 1,
      decisionId: "decision-01",
      dueDate: "2026-06-05",
      kpi: "Clear blocker in 5 days",
      latestVersionNumber: 2,
      openAssignmentCount: 1,
      ownerId: "owner-01",
      priority: "high",
      projectId: "project-a",
      projectIds: ["project-a"],
      source: {
        href: "/meetings/meeting-01",
        id: "meeting-01",
        label: "Weekly leadership meeting",
        type: "meeting",
      },
      status: "open",
      summary: "Move site priority to legal clearance.",
      title: "Approve site priority",
      updatedAt: "2026-05-31T07:00:00.000Z",
    },
  ],
  selectedDecision: {
    assignmentCount: 1,
    assignments: [
      {
        assigneeId: "owner-01",
        assigneeType: "user",
        assignmentId: "assignment-01",
        createdAt: "2026-05-31T07:05:00.000Z",
        decisionId: "decision-01",
        dueDate: "2026-06-03",
        executionStatus: "in_progress",
        kpi: "Plan ready by due date",
        priority: "high",
        projectId: "project-a",
        status: "assigned",
        taskHref: "/tasks/task-01",
        taskId: "task-01",
        title: "Prepare legal clearance plan",
        updatedAt: "2026-05-31T07:05:00.000Z",
      },
    ],
    createdBy: "leader-01",
    decidedAt: "2026-05-31T07:00:00.000Z",
    decidedBy: "leader-01",
    decisionId: "decision-01",
    decisionText: "Move site priority to legal clearance.",
    dueDate: "2026-06-05",
    history: [
      {
        action: "decision.updated",
        actorId: "leader-01",
        createdAt: "2026-05-31T08:05:00.000Z",
        id: "audit-01",
        summary: "Decision deadline updated",
        type: "audit",
      },
      {
        actorId: "leader-01",
        changedFields: ["dueDate", "decisionText"],
        createdAt: "2026-05-31T08:00:00.000Z",
        id: "version-01",
        newValue: {
          decisionText: "[noi dung da an]",
          dueDate: "2026-06-05",
        },
        previousValue: {
          decisionText: "[noi dung da an]",
          dueDate: "2026-06-01",
        },
        reason: "Extend deadline.",
        type: "version",
        versionNumber: 2,
      },
    ],
    kpi: "Clear blocker in 5 days",
    latestVersionNumber: 2,
    linkedSources: [
      {
        entityId: "meeting-01",
        href: "/meetings/meeting-01",
        id: "meeting-meeting-01-source",
        label: "Weekly leadership meeting",
        relationType: "source",
        state: "linked",
        type: "meeting",
      },
    ],
    openAssignmentCount: 1,
    ownerId: "owner-01",
    priority: "high",
    projectId: "project-a",
    projectIds: ["project-a"],
    source: {
      href: "/meetings/meeting-01",
      id: "meeting-01",
      label: "Weekly leadership meeting",
      type: "meeting",
    },
    status: "open",
    summary: "Move site priority to legal clearance.",
    title: "Approve site priority",
    updatedAt: "2026-05-31T07:00:00.000Z",
  },
};

describe("DecisionAssignmentCenter", () => {
  it("renders list, selected detail, assignments and sanitized timeline", () => {
    render(<DecisionAssignmentCenter data={data} />);

    expect(
      screen.getByRole("heading", { name: "Decision & Assignment Center" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Decision list" })).toBeInTheDocument();

    const detail = screen.getByRole("region", { name: "Decision detail" });
    expect(within(detail).getByText("Approve site priority")).toBeInTheDocument();
    expect(within(detail).getByText("Weekly leadership meeting")).toBeInTheDocument();
    expect(within(detail).getByText("Prepare legal clearance plan")).toBeInTheDocument();
    expect(within(detail).getByText("decision.updated")).toBeInTheDocument();
    expect(within(detail).getByText("Version 2")).toBeInTheDocument();
    expect(within(detail).getByText(/noi dung da an/i)).toBeInTheDocument();
    expect(screen.queryByText("Sensitive previous instruction")).not.toBeInTheDocument();
  });

  it("renders no-access and empty states", () => {
    const noAccess = {
      ...data,
      items: [],
      permissions: { ...data.permissions, canView: false },
      selectedDecision: undefined,
    };

    const { rerender } = render(<DecisionAssignmentCenter data={noAccess} />);
    expect(screen.getByText(/Khong co quyen/i)).toBeInTheDocument();

    rerender(
      <DecisionAssignmentCenter
        data={{
          ...data,
          items: [],
          selectedDecision: undefined,
        }}
      />,
    );
    expect(screen.getByText(/Chua co decision/i)).toBeInTheDocument();
  });
});
