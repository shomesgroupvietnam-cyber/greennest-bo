import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { AiAskForm } from "@/modules/ai/components/ai-ask-form";
import { AiJobDetail } from "@/modules/ai/components/ai-job-detail";
import { AiProposalDetail } from "@/modules/ai/components/ai-proposal-detail";
import {
  buildAiAskInputFromFormData,
  getFriendlyAiFailureMessage,
  isTechnicalAiDetailAllowed
} from "@/modules/ai/services/ai-ux-service";
import type { AiActionProposal, AiAskResult } from "@/modules/ai/types";
import type { Project } from "@/modules/projects/types";

vi.mock("@/modules/ai/actions", () => ({
  acceptAiActionProposalAction: vi.fn(),
  processAiJobAction: vi.fn(),
  rejectAiActionProposalAction: vi.fn(),
  submitAiQuestionAction: vi.fn()
}));

const admin = { id: "admin-01", role: "admin" as const };
const accountant = { id: "accountant-01", role: "ke_toan" as const };
const viewer = { id: "viewer-01", role: "viewer" as const };

describe("AI Assistant UX simplification", () => {
  it("defaults simplified asks to fast mode and normal priority", () => {
    const formData = new FormData();
    formData.set("preset", "finance");
    formData.set("prompt", "Kiểm tra hồ sơ thanh toán");

    const input = buildAiAskInputFromFormData(formData, accountant);

    expect(input.mode).toBe("fast");
    expect(input.priority).toBe("normal");
    expect(input.module).toBe("finance");
    expect(input.intent).toContain("thanh toán");
  });

  it("uses project dropdown submission and keeps approved RAG enabled for permitted roles", () => {
    const formData = new FormData();
    formData.set("preset", "legal");
    formData.set("projectId", "project-001");
    formData.set("prompt", "Kiểm tra pháp lý");
    formData.set("useRag", "on");

    const input = buildAiAskInputFromFormData(formData, admin);

    expect(input.projectId).toBe("project-001");
    expect(input.module).toBe("legal");
    expect(input.useRag).toBe(true);
  });

  it("falls back to a business preset intent when intent is blank", () => {
    const formData = new FormData();
    formData.set("preset", "documents");
    formData.set("intent", "");
    formData.set("prompt", "Hồ sơ nào còn thiếu?");

    const input = buildAiAskInputFromFormData(formData, admin);

    expect(input.intent).toBe("Kiểm tra hồ sơ thiếu và hồ sơ cần cập nhật");
  });

  it("renders a project dropdown with code and name", () => {
    render(<AiAskForm projects={[project]} canUseRag />);

    expect(screen.getByRole("combobox", { name: "Dự án" })).toHaveTextContent("GN-001 - GreenNest Test");
    expect(screen.queryByText("Chế độ")).not.toBeInTheDocument();
    expect(screen.queryByText("Ưu tiên")).not.toBeInTheDocument();
  });

  it("shows a friendly queued state without worker wording", () => {
    render(<AiJobDetail result={queuedResult} />);

    expect(screen.getAllByText(/Đang xử lý/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Thử xử lý lại" })).toBeInTheDocument();
    expect(screen.queryByText(/worker mock/i)).not.toBeInTheDocument();
  });

  it("hides technical details for non-admin users and keeps friendly provider errors", () => {
    render(<AiJobDetail result={failedResult} showTechnicalDetails={isTechnicalAiDetailAllowed(viewer)} />);

    expect(screen.queryByText("Chi tiết kỹ thuật")).not.toBeInTheDocument();
    expect(screen.queryByText("Rate limit key")).not.toBeInTheDocument();
    expect(screen.getByText(/API key hết quota hoặc chưa bật billing/)).toBeInTheDocument();
    expect(getFriendlyAiFailureMessage("missing_config")).toContain("Tạm thời chuyển sang mock");
  });

  it("shows project code and name on AI result when project exists", () => {
    render(<AiJobDetail result={queuedResult} projectLabel="GN-001 - GreenNest Test" />);

    expect(screen.getByText("GN-001 - GreenNest Test")).toBeInTheDocument();
    expect(screen.queryByText("Dự án project-001")).not.toBeInTheDocument();
  });
});

describe("AI proposal detail polish", () => {
  it("hides raw payload from non-admin proposal review", () => {
    render(<AiProposalDetail proposal={buildProposal()} project={project} />);

    expect(screen.getByText("AI đề xuất làm gì")).toBeInTheDocument();
    expect(screen.getByText("Tạo công việc")).toBeInTheDocument();
    expect(screen.getByText("GN-001 - GreenNest Test")).toBeInTheDocument();
    expect(screen.queryByText("Chi tiết kỹ thuật")).not.toBeInTheDocument();
    expect(screen.queryByText(/"title"/)).not.toBeInTheDocument();
  });

  it("shows technical payload for admin proposal review", () => {
    render(<AiProposalDetail proposal={buildProposal()} project={project} showTechnicalDetails />);

    expect(screen.getByText("Chi tiết kỹ thuật")).toBeInTheDocument();
    expect(screen.getByText(/"title"/)).toBeInTheDocument();
  });

  it("uses friendly accepted, rejected and failed state labels", () => {
    render(
      <div>
        <AiProposalDetail proposal={buildProposal({ id: "accepted", status: "accepted" })} project={project} />
        <AiProposalDetail proposal={buildProposal({ id: "rejected", status: "rejected" })} project={project} />
        <AiProposalDetail proposal={buildProposal({ id: "failed", status: "failed" })} project={project} />
      </div>
    );

    expect(screen.getAllByText("Đã chấp nhận và thực thi").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Đã từ chối").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Thực thi thất bại").length).toBeGreaterThan(0);
  });
});

const project: Project = {
  id: "project-001",
  code: "GN-001",
  name: "GreenNest Test",
  status: "active",
  createdAt: "2026-05-17T00:00:00.000Z",
  updatedAt: "2026-05-17T00:00:00.000Z"
};

const queuedResult = buildResult({ status: "queued" });
const failedResult = buildResult({ status: "failed", errorCode: "rate_limited", errorMessage: "quota exceeded" });

function buildResult(jobPatch: Partial<AiAskResult["job"]>): AiAskResult {
  const timestamp = "2026-05-17T00:00:00.000Z";

  return {
    interaction: {
      id: "interaction-001",
      requestedBy: "admin-01",
      projectId: "project-001",
      module: "project",
      intent: "Tổng hợp rủi ro dự án",
      mode: "fast",
      promptSummary: "Rủi ro tuần này là gì?",
      modelProvider: "mock",
      modelName: "mock",
      status: "queued",
      scopeSnapshot: {
        userId: "admin-01",
        role: "admin",
        permissions: [],
        scopeKind: "internal_full",
        module: "project",
        projectId: "project-001",
        resourceRefs: [],
        capturedAt: timestamp
      },
      createdAt: timestamp,
      updatedAt: timestamp
    },
    job: {
      id: "job-001",
      interactionId: "interaction-001",
      requestedBy: "admin-01",
      projectId: "project-001",
      module: "project",
      intent: "Tổng hợp rủi ro dự án",
      mode: "fast",
      priority: "normal",
      status: "queued",
      scopeSnapshot: {
        userId: "admin-01",
        role: "admin",
        permissions: [],
        scopeKind: "internal_full",
        module: "project",
        projectId: "project-001",
        resourceRefs: [],
        capturedAt: timestamp
      },
      rateLimitKey: "user:admin-01:role:admin",
      payload: {
        prompt: "Rủi ro tuần này là gì?",
        intent: "Tổng hợp rủi ro dự án",
        useRag: true,
        wantsActionProposal: false,
        knowledgeModule: "project"
      },
      createdAt: timestamp,
      updatedAt: timestamp,
      ...jobPatch
    },
    citations: [],
    actionProposals: []
  };
}

function buildProposal(patch: Partial<AiActionProposal> = {}): AiActionProposal {
  const timestamp = "2026-05-17T00:00:00.000Z";

  return {
    id: "proposal-001",
    interactionId: "interaction-001",
    jobId: "job-001",
    requestedBy: "admin-01",
    projectId: "project-001",
    module: "tasks",
    actionKey: "create_task",
    targetEntityType: "task",
    proposedPayload: {
      projectId: "project-001",
      title: "Thanh toán đợt 1",
      description: "Kiểm tra hồ sơ thanh toán trước khi gửi duyệt.",
      assigneeId: "accountant"
    },
    rationale: "Hồ sơ thanh toán cần được kiểm tra.",
    requiredPermission: "task.create",
    status: "proposed",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...patch
  };
}
