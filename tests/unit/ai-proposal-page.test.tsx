import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AiActionProposal } from "@/modules/ai/types";

const mocks = vi.hoisted(() => ({
  getAiActionProposal: vi.fn(),
  getCurrentUser: vi.fn(),
  getProject: vi.fn(),
  getScopedMeeting: vi.fn(),
  isTechnicalAiDetailAllowed: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));

vi.mock("@/components/shared/page-shell", () => ({
  PageShell: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <section>
      <h1>{title}</h1>
      {children}
    </section>
  ),
}));

vi.mock("@/components/shared/unauthorized-state", () => ({
  UnauthorizedState: ({ description }: { description: string }) => (
    <p>{description}</p>
  ),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/lib/permissions/scoped-resources", () => ({
  getScopedMeeting: mocks.getScopedMeeting,
}));

vi.mock("@/modules/ai/components/ai-proposal-detail", () => ({
  AiProposalDetail: ({ proposal }: { proposal: AiActionProposal }) => (
    <div>proposal detail {proposal.id}</div>
  ),
}));

vi.mock("@/modules/ai/services/ai-action-proposal-service", () => ({
  getAiActionProposal: mocks.getAiActionProposal,
}));

vi.mock("@/modules/ai/services/ai-ux-service", () => ({
  isTechnicalAiDetailAllowed: mocks.isTechnicalAiDetailAllowed,
}));

vi.mock("@/modules/projects/services/project-repository", () => ({
  projectRepository: {
    getProject: mocks.getProject,
  },
}));

describe("AiProposalPage", () => {
  beforeEach(() => {
    (globalThis as typeof globalThis & { React: typeof React }).React = React;
    vi.clearAllMocks();
    mocks.notFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
    mocks.isTechnicalAiDetailAllowed.mockReturnValue(false);
  });

  it("blocks meeting proposal details when the target meeting is out of scope", async () => {
    const currentUser = { id: "reviewer-01", role: "pending" as const };
    mocks.getCurrentUser.mockResolvedValue(currentUser);
    mocks.getAiActionProposal.mockResolvedValue(
      buildProposal({
        requestedBy: currentUser.id,
        targetEntityId: "meeting-01",
        targetEntityType: "meeting",
      }),
    );
    mocks.getScopedMeeting.mockResolvedValue(undefined);
    const { default: AiProposalPage } = await import(
      "@/app/(dashboard)/ai/proposals/[proposalId]/page"
    );

    render(
      await AiProposalPage({
        params: Promise.resolve({ proposalId: "proposal-01" }),
      }),
    );

    expect(mocks.getScopedMeeting).toHaveBeenCalledWith(
      currentUser,
      "meeting-01",
    );
    expect(mocks.getProject).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "Cuoc hop cua de xuat AI khong nam trong pham vi cua ban.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/proposal detail/)).not.toBeInTheDocument();
  });
});

function buildProposal(patch: Partial<AiActionProposal> = {}): AiActionProposal {
  const timestamp = "2026-06-04T00:00:00.000Z";

  return {
    actionKey: "create_meeting_action_item",
    createdAt: timestamp,
    id: "proposal-01",
    interactionId: "interaction-01",
    jobId: "job-01",
    module: "meetings",
    proposedPayload: {},
    requestedBy: "reviewer-01",
    requiredPermission: "decision.create",
    status: "proposed",
    targetEntityId: "meeting-01",
    targetEntityType: "meeting",
    updatedAt: timestamp,
    ...patch,
  };
}
