import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DecisionHistoryTimeline } from "@/modules/executive/components/decision-history-timeline";

describe("DecisionHistoryTimeline", () => {
  it("renders decision history in reverse chronological order with sanitized values", () => {
    render(
      <DecisionHistoryTimeline
        events={[
          {
            id: "audit-01",
            type: "audit",
            actorId: "leader-01",
            createdAt: "2026-05-31T08:00:00.000Z",
            action: "decision.updated",
            summary: "Cap nhat hien thi"
          },
          {
            id: "version-01",
            type: "version",
            actorId: "leader-02",
            createdAt: "2026-05-31T09:00:00.000Z",
            versionNumber: 2,
            changedFields: ["dueDate", "decisionText"],
            reason: "Gia han.",
            previousValue: { dueDate: "2026-06-01", decisionText: "Sensitive raw instruction" },
            newValue: { dueDate: "2026-06-10", decisionText: "Another sensitive instruction" }
          }
        ]}
      />
    );

    const items = screen.getAllByRole("listitem");

    expect(within(items[0]).getByText(/version 2/i)).toBeInTheDocument();
    expect(within(items[0]).getByText(/dueDate/i)).toBeInTheDocument();
    expect(within(items[0]).getByText(/2026-06-01 -> 2026-06-10/i)).toBeInTheDocument();
    expect(screen.getByText(/Gia han/i)).toBeInTheDocument();
    expect(screen.queryByText(/Sensitive raw instruction/i)).not.toBeInTheDocument();
    expect(within(items[1]).getByText(/decision.updated/i)).toBeInTheDocument();
  });

  it("renders a compact empty state", () => {
    render(<DecisionHistoryTimeline events={[]} />);

    expect(screen.getByText(/Chưa có lịch sử thay đổi/i)).toBeInTheDocument();
  });
});
