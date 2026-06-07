import { render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import type { MeetingActionState } from "@/modules/meetings/actions";
import {
  MeetingAiSummaryPanel,
  MeetingAttachmentsPanel,
  MeetingDecisionTrackingPanel,
  MeetingFollowUpActionsPanel,
  MeetingMinutesPanel,
} from "@/modules/meetings/components/meeting-detail-panels";
import type { Meeting } from "@/modules/meetings/types";

const noopAction = async (
  state: MeetingActionState,
): Promise<MeetingActionState> => state;

function buildMeeting(patch: Partial<Meeting> = {}): Meeting {
  return {
    aiSummary: { status: "DRAFT" },
    attachments: [],
    auditLog: [],
    createdAt: "2026-06-01T00:00:00.000Z",
    decisions: [],
    externalParticipants: [],
    followUpActions: [],
    id: "meeting-01",
    meetingDate: "2026-06-05T09:00:00.000Z",
    meetingMinutesApproval: { status: "DRAFT" },
    meetingType: "PROJECT_MEETING",
    organizationId: "org-green-nest",
    participants: ["leader-01"],
    participantScope: "project_team",
    projectId: "project-a",
    projectIds: ["project-a"],
    relatedApprovals: [],
    relatedRecords: [],
    relatedTasks: [],
    startTime: "2026-06-05T09:00:00.000Z",
    status: "SCHEDULED",
    title: "Weekly meeting",
    updatedAt: "2026-06-01T00:00:00.000Z",
    visibility: "project",
    ...patch,
  };
}

describe("Meeting detail panels", () => {
  it("renders editable minutes with draft status and approve action", () => {
    render(
      <MeetingMinutesPanel
        approveAction={noopAction}
        canUpdate
        meeting={buildMeeting({
          meetingMinutes: "Draft minutes",
          summary: "Safe summary",
        })}
        updateAction={noopAction}
      />,
    );

    expect(screen.getByText("Bản nháp")).toBeInTheDocument();
    expect(screen.getByLabelText("Meeting minutes chính thức")).toHaveValue(
      "Draft minutes",
    );
    expect(screen.getByLabelText("Tóm tắt an toàn")).toHaveValue(
      "Safe summary",
    );
    expect(
      screen.getByRole("button", { name: "Duyệt biên bản" }),
    ).toBeInTheDocument();
  });

  it("renders approved minutes metadata without edit controls when read-only", () => {
    render(
      <MeetingMinutesPanel
        approveAction={noopAction}
        canUpdate={false}
        meeting={buildMeeting({
          meetingMinutes: "Official minutes",
          meetingMinutesApproval: {
            approvedAt: "2026-06-05T10:00:00.000Z",
            approvedBy: "leader-01",
            status: "APPROVED",
          },
        })}
        updateAction={noopAction}
      />,
    );

    expect(screen.getByText("Đã duyệt")).toBeInTheDocument();
    expect(screen.getByText(/leader-01/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Meeting minutes chính thức")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Duyệt biên bản" }),
    ).toBeNull();
  });

  it("renders attachment list and metadata-only add form", () => {
    render(
      <MeetingAttachmentsPanel
        addAction={noopAction}
        canUpdate
        meeting={buildMeeting({
          attachments: [
            {
              id: "attachment-01",
              name: "Deck.pdf",
              source: "external_url",
              url: "https://example.com/deck.pdf",
            },
          ],
        })}
        removeAction={noopAction}
      />,
    );

    expect(screen.getByRole("link", { name: "Deck.pdf" })).toHaveAttribute(
      "href",
      "https://example.com/deck.pdf",
    );
    expect(screen.getByLabelText("Tên attachment")).toBeInTheDocument();
    expect(screen.getByLabelText("External URL")).toBeInTheDocument();
    expect(screen.getByLabelText("Document ID")).toBeInTheDocument();
    expect(screen.queryByLabelText("Upload file")).toBeNull();
    expect(
      screen.getByText(/Chỉ hỗ trợ external URL hoặc documentId/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Gỡ Deck.pdf/ })).toBeInTheDocument();
  });

  it("renders attachment empty state without mutation controls when read-only", () => {
    render(
      <MeetingAttachmentsPanel
        addAction={noopAction}
        canUpdate={false}
        meeting={buildMeeting()}
        removeAction={noopAction}
      />,
    );

    expect(
      screen.getByText("Chưa có attachment trong scope được phép xem."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Tên attachment")).toBeNull();
  });

  it("renders AI summary as draft suggestion until approved", () => {
    const { container } = render(
      <MeetingAiSummaryPanel
        approveAction={noopAction}
        canUpdate
        generateAction={noopAction}
        aiMeetingSummary={{
          actionProposals: [
            {
              actionKey: "create_meeting_action_item",
              affectedFields: ["decisions"],
              id: "proposal-01",
              previewTitle: "Tao action item tu AI",
              requiredPermission: "decision.create",
              returnToHref: "/meetings/meeting-01",
              sourceCitationIds: ["meeting-source-meeting-01"],
              status: "proposed",
              targetEntityId: "meeting-01",
              targetEntityType: "meeting",
              workflowStatus: "DRAFT",
            },
          ],
          citations: [
            {
              id: "meeting-source-meeting-01",
              sourceId: "meeting-01",
              sourceType: "meeting",
              title: "Weekly meeting",
            },
          ],
          generatedFrom: ["meeting", "minutes"],
          status: "draft",
          text: "AI draft summary",
          updatedAt: "2026-06-04T01:00:00.000Z",
        }}
        meeting={buildMeeting({
          aiSummary: { content: "AI draft summary", status: "DRAFT" },
        })}
        returnToHref="/meetings/meeting-01?scopeId=scope-a"
        updateDraftAction={noopAction}
      />,
    );

    expect(screen.getByText("Bản nháp AI")).toBeInTheDocument();
    expect(screen.getByLabelText("AI summary draft")).toHaveValue(
      "AI draft summary",
    );
    expect(
      screen.getByRole("button", { name: "Duyệt AI summary" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("meeting-ai-summary-panel")).getByText(
        /AI chỉ là gợi ý/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Weekly meeting")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Tao ban nhap AI/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tao action item tu AI")).toBeInTheDocument();
    expect(screen.getByText("decision.create")).toBeInTheDocument();
    expect(
      container.querySelector('input[name="returnTo"]'),
    ).toHaveAttribute("value", "/meetings/meeting-01?scopeId=scope-a");
  });

  it("renders AI summary placeholder states without mutation controls for read-only users", () => {
    render(
      <MeetingAiSummaryPanel
        approveAction={noopAction}
        canUpdate={false}
        generateAction={noopAction}
        aiMeetingSummary={{
          actionProposals: [],
          citations: [],
          generatedFrom: [],
          status: "insufficient_context",
          text: "Khong co du lieu trong scope hoac citation hop le.",
          updatedAt: "2026-06-04T01:00:00.000Z",
        }}
        meeting={buildMeeting()}
        updateDraftAction={noopAction}
      />,
    );

    expect(screen.getByText(/Khong co du lieu trong scope/)).toBeInTheDocument();
    expect(screen.queryByLabelText("AI summary draft")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Tao ban nhap AI/ }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Duyệt AI summary" }),
    ).toBeNull();
  });

  it("renders follow-up actions, scoped task links and overdue status", () => {
    render(
      <MeetingFollowUpActionsPanel
        addAction={noopAction}
        canCreateTask
        canUpdate
        createTaskAction={noopAction}
        followUpActions={[
          {
            dueDate: "2026-05-20",
            id: "follow-up-overdue",
            ownerId: "owner-01",
            relatedTaskId: "task-visible",
            status: "open",
            title: "Submit follow-up minutes",
          },
          {
            dueDate: "2026-05-19",
            hasHiddenRelatedTask: true,
            id: "follow-up-done",
            status: "done",
            title: "Completed follow-up",
          },
        ]}
        needsTaskProjectInput={false}
        today={new Date("2026-05-24T00:00:00.000Z")}
        updateStatusAction={noopAction}
        visibleTaskLinks={[
          {
            href: "/tasks/task-visible",
            id: "task-visible",
            title: "Visible linked task",
          },
        ]}
      />,
    );

    expect(screen.getByText("Follow-up actions")).toBeInTheDocument();
    expect(screen.getByText("Submit follow-up minutes")).toBeInTheDocument();
    expect(screen.getByText("Quá hạn")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Visible linked task" }),
    ).toHaveAttribute("href", "/tasks/task-visible");
    expect(
      screen.getByText(/Task li.+ngo.+ph.+m vi hi.+n th/),
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText("Trạng thái follow-up")).toHaveLength(2);
    expect(screen.getByLabelText("Tiêu đề follow-up")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /task/i })).toBeInTheDocument();
  });

  it("allows follow-up creation without task controls when task.create is unavailable", () => {
    render(
      <MeetingFollowUpActionsPanel
        addAction={noopAction}
        canCreateTask={false}
        canUpdate
        createTaskAction={noopAction}
        followUpActions={[]}
        needsTaskProjectInput={false}
        updateStatusAction={noopAction}
        visibleTaskLinks={[]}
      />,
    );

    expect(
      screen.getByText("Chưa có follow-up action sau họp."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Tiêu đề follow-up")).toBeInTheDocument();
    expect(screen.queryByLabelText("Tạo task liên kết")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Tạo task" }),
    ).toBeNull();
  });

  it("renders official decision tracking with assignments, hidden task state and sanitized history", () => {
    render(
      <MeetingDecisionTrackingPanel
        createDecisionAction={noopAction}
        data={{
          generatedAt: "2026-06-03T00:00:00.000Z",
          items: [
            {
              assignmentCount: 2,
              assignments: [
                {
                  assigneeId: "owner-01",
                  assignmentId: "assignment-01",
                  dueDate: "2026-06-02",
                  executionStatus: "in_progress",
                  hasHiddenTask: false,
                  kpi: "Plan approved by Friday",
                  priority: "high",
                  projectId: "project-a",
                  status: "assigned",
                  taskHref: "/tasks/task-visible",
                  taskId: "task-visible",
                  taskTitle: "Visible execution task",
                  title: "Prepare acceleration plan",
                },
                {
                  assignmentId: "assignment-hidden",
                  dueDate: "2026-06-01",
                  hasHiddenTask: true,
                  priority: "medium",
                  projectId: "project-b",
                  status: "assigned",
                  title: "Hidden task assignment",
                },
              ],
              decisionId: "decision-01",
              decisionHref:
                "/command-center?decisionId=decision-01&view=executive-decision-log",
              dueDate: "2026-06-10",
              dueSoonAssignmentCount: 1,
              history: [
                {
                  action: "decision.updated",
                  actorId: "leader-01",
                  createdAt: "2026-06-01T03:05:00.000Z",
                  id: "audit-01",
                  summary: "Decision instruction updated",
                  type: "audit",
                },
              ],
              openAssignmentCount: 2,
              overdueAssignmentCount: 2,
              ownerId: "owner-01",
              priority: "high",
              relation: "source",
              status: "open",
              title: "Approve contractor acceleration",
              updatedAt: "2026-06-01T02:00:00.000Z",
            },
          ],
          permissions: {
            canCreateDecision: true,
            canLinkDecision: true,
            canViewAudit: true,
          },
        }}
        linkDecisionAction={noopAction}
      />,
    );

    expect(screen.getByText("Decision tracking sau họp")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Approve contractor acceleration" }),
    ).toHaveAttribute(
      "href",
      "/command-center?decisionId=decision-01&view=executive-decision-log",
    );
    expect(screen.getByText("2 giao việc")).toBeInTheDocument();
    expect(screen.getByText("1 sắp đến hạn")).toBeInTheDocument();
    expect(screen.getByText("2 quá hạn")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Visible execution task" }),
    ).toHaveAttribute("href", "/tasks/task-visible");
    expect(
      screen.getByText(/Task liên kết ngoài phạm vi hiển thị/),
    ).toBeInTheDocument();
    expect(screen.getByText("decision.updated")).toBeInTheDocument();
    expect(screen.getByText("Decision instruction updated")).toBeInTheDocument();
    expect(screen.getByLabelText("Nội dung quyết định")).toBeInTheDocument();
    expect(screen.getByLabelText("Decision ID cần liên kết")).toBeInTheDocument();
  });

  it("hides decision tracking mutation controls when permissions are unavailable", () => {
    render(
      <MeetingDecisionTrackingPanel
        createDecisionAction={noopAction}
        data={{
          generatedAt: "2026-06-03T00:00:00.000Z",
          items: [],
          permissions: {
            canCreateDecision: false,
            canLinkDecision: false,
            canViewAudit: false,
          },
        }}
        linkDecisionAction={noopAction}
      />,
    );

    expect(
      screen.getByText("Chưa có official decision nào được liên kết với cuộc họp này."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Nội dung quyết định")).toBeNull();
    expect(screen.queryByLabelText("Decision ID cần liên kết")).toBeNull();
  });
});
