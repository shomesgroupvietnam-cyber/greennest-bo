import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PermissionUser } from "@/lib/permissions/can";
import {
  applyProposalApprovalAction,
  createProposal,
  submitProposal,
} from "@/modules/proposals/services/proposal-service";
import { JsonProposalRepository } from "@/modules/proposals/services/proposal-repository";
import type { ScopeAssignment } from "@/modules/settings/types";

let tempDir: string;
let repository: JsonProposalRepository;

const requester: PermissionUser = { id: "requester-01", role: "dau_tu_phat_trien" };
const approver: PermissionUser = { id: "approver-01", role: "tong_giam_doc" };
const contractApprover: PermissionUser = {
  id: "contract-approver",
  role: "quan_ly_hop_dong",
};
const financeApprover: PermissionUser = {
  id: "finance-approver",
  role: "quan_ly_tai_chinh",
};
const reviewOnlyUser: PermissionUser = {
  id: "review-only",
  permissions: ["proposal.view", "proposal.review"],
  permissionsMode: "replace",
  role: "viewer",
};

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-proposal-actions-"));
  repository = new JsonProposalRepository(path.join(tempDir, "proposals.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

async function createSubmittedProposal(title: string, projectId = "project-a") {
  const detail = await createProposal(
    {
      module: "proposal",
      priority: "high",
      projectId,
      summary: `${title} summary`,
      title,
      type: "investment",
    },
    requester,
    repository,
  );

  const submitted = await submitProposal(detail.proposal.id, requester, repository);

  if (submitted.currentStepId) {
    await repository.updateStep(submitted.currentStepId, {
      approverRole: approver.role,
    });
  }

  return detail.proposal.id;
}

async function expectRawStatus(proposalId: string, status: string) {
  const raw = await repository.getProposalDetail(proposalId);

  expect(raw?.proposal.status).toBe(status);

  return raw;
}

describe("proposal approval actions", () => {
  it("applies approve, reject, request-change, forward, ask-meeting, hold and cancel outcomes", async () => {
    const approvedId = await createSubmittedProposal("Approve outcome");
    const approved = await applyProposalApprovalAction(
      approvedId,
      { action: "approve", notes: "Dong y phe duyet." },
      approver,
      { repository },
    );
    const approvedRaw = await expectRawStatus(approvedId, "approved");

    expect(approved.proposal.status).toBe("approved");
    expect(approved.decision).toMatchObject({
      decision: "approved",
      nextStatus: "approved",
      nextStepStatus: "approved",
      previousStatus: "in_review",
      previousStepStatus: "in_review",
      version: 2,
    });
    expect(approvedRaw?.steps[0]).toMatchObject({ status: "approved" });
    expect(approvedRaw?.decisions.map((decision) => decision.decision)).toContain("approved");
    expect(approvedRaw?.decisions.find((decision) => decision.decision === "submitted")).toMatchObject({
      nextStatus: "in_review",
      nextStepStatus: "in_review",
      previousStatus: "draft",
      version: 1,
    });

    const rejectedId = await createSubmittedProposal("Reject outcome");
    await applyProposalApprovalAction(
      rejectedId,
      { action: "reject", reason: "Chua du can cu dau tu." },
      approver,
      { repository },
    );
    const rejectedRaw = await expectRawStatus(rejectedId, "rejected");

    expect(rejectedRaw?.steps[0]).toMatchObject({ status: "rejected" });
    expect(rejectedRaw?.decisions[0]).toMatchObject({
      decision: "rejected",
      notes: "Chua du can cu dau tu.",
    });

    const changeId = await createSubmittedProposal("Request change outcome");
    await applyProposalApprovalAction(
      changeId,
      { action: "request_change", reason: "Bo sung bang dong tien." },
      approver,
      { repository },
    );
    const changeRaw = await expectRawStatus(changeId, "change_requested");

    expect(changeRaw?.steps[0]).toMatchObject({ status: "change_requested" });
    expect(changeRaw?.decisions[0]).toMatchObject({
      decision: "change_requested",
      notes: "Bo sung bang dong tien.",
    });

    const forwardedId = await createSubmittedProposal("Forward outcome");
    await applyProposalApprovalAction(
      forwardedId,
      {
        action: "forward",
        notes: "Chuyen CEO xem tiep.",
        targetLabel: "Tong giam doc",
        targetRole: "tong_giam_doc",
      },
      approver,
      { repository },
    );
    const forwardedRaw = await expectRawStatus(forwardedId, "in_review");

    expect(forwardedRaw?.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: "forwarded", stepOrder: 1 }),
        expect.objectContaining({
          approverRole: "tong_giam_doc",
          status: "in_review",
          stepOrder: 2,
        }),
      ]),
    );
    expect(forwardedRaw?.proposal.currentStepId).toBe(
      forwardedRaw?.steps.find((step) => step.stepOrder === 2)?.id,
    );
    expect(forwardedRaw?.decisions[0]).toMatchObject({ decision: "forwarded" });

    const meetingId = await createSubmittedProposal("Ask meeting outcome");
    await applyProposalApprovalAction(
      meetingId,
      {
        action: "ask_meeting",
        agendaDraft: "Chot rui ro phap ly va dong tien.",
        meetingType: "risk-review",
      },
      approver,
      { repository },
    );
    const meetingRaw = await expectRawStatus(meetingId, "in_review");

    expect(meetingRaw?.decisions[0]).toMatchObject({
      decision: "meeting_requested",
      notes: "Chot rui ro phap ly va dong tien.",
    });
    expect(meetingRaw?.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityType: "meeting_request",
          relationType: "generated_action",
        }),
      ]),
    );

    const heldId = await createSubmittedProposal("Hold outcome");
    await applyProposalApprovalAction(
      heldId,
      { action: "hold", notes: "Tam giu de doi ho so phap ly." },
      approver,
      { repository },
    );
    const heldRaw = await expectRawStatus(heldId, "on_hold");

    expect(heldRaw?.steps[0]).toMatchObject({ status: "held" });
    expect(heldRaw?.decisions[0]).toMatchObject({ decision: "held" });

    const cancelledId = await createSubmittedProposal("Cancel outcome");
    await applyProposalApprovalAction(
      cancelledId,
      { action: "cancel", reason: "Khong con nhu cau phe duyet." },
      approver,
      { repository },
    );
    const cancelledRaw = await expectRawStatus(cancelledId, "cancelled");

    expect(cancelledRaw?.steps[0]).toMatchObject({ status: "cancelled" });
    expect(cancelledRaw?.decisions[0]).toMatchObject({
      decision: "cancelled",
      notes: "Khong con nhu cau phe duyet.",
    });
  });

  it("validates action payloads before mutating proposal state", async () => {
    const proposalId = await createSubmittedProposal("Validation no mutation");

    await expect(
      applyProposalApprovalAction(
        proposalId,
        { action: "reject", reason: "" },
        approver,
        { repository },
      ),
    ).rejects.toThrow(/reason|ly do/i);

    const raw = await expectRawStatus(proposalId, "in_review");

    expect(raw?.steps[0]).toMatchObject({ status: "in_review" });
    expect(raw?.decisions.map((decision) => decision.decision)).not.toContain("rejected");
  });

  it("requires a valid current step before mutating approval actions", async () => {
    const proposalId = await createSubmittedProposal("Missing current step");

    await repository.updateProposal(proposalId, {
      currentStepId: "missing-step",
    });

    await expect(
      applyProposalApprovalAction(
        proposalId,
        { action: "approve", notes: "No current step." },
        approver,
        { repository },
      ),
    ).rejects.toThrow(/current approval step|buoc duyet/i);

    const raw = await expectRawStatus(proposalId, "in_review");

    expect(raw?.decisions.map((decision) => decision.decision)).not.toContain("approved");
  });

  it("does not let proposal.approve bypass a stricter current-step permission", async () => {
    const proposalId = await createSubmittedProposal("Required permission");
    const raw = await repository.getProposalDetail(proposalId);
    const step = raw?.steps[0];

    expect(step).toBeDefined();
    await repository.updateStep(step?.id ?? "", {
      approverRole: contractApprover.role,
      requiredPermission: "finance.approve",
    });

    await expect(
      applyProposalApprovalAction(
        proposalId,
        { action: "approve", notes: "Only proposal approve." },
        contractApprover,
        { repository },
      ),
    ).rejects.toThrow(/approve|quyen|permission/i);

    await expectRawStatus(proposalId, "in_review");
  });

  it("accepts targetLabel-only forwarding and enforces the forwarded approver role", async () => {
    const labelOnlyId = await createSubmittedProposal("Forward label only");

    await applyProposalApprovalAction(
      labelOnlyId,
      {
        action: "forward",
        notes: "Manual escalation.",
        targetLabel: "Nguoi duyet duoc chi dinh",
      },
      approver,
      { repository },
    );

    const labelOnlyRaw = await expectRawStatus(labelOnlyId, "in_review");

    expect(labelOnlyRaw?.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: "in_review",
          thresholdLabel: "Nguoi duyet duoc chi dinh",
        }),
      ]),
    );

    const roleForwardedId = await createSubmittedProposal("Forward role enforced");

    await applyProposalApprovalAction(
      roleForwardedId,
      {
        action: "forward",
        targetLabel: "Quan ly tai chinh",
        targetRole: financeApprover.role,
      },
      approver,
      { repository },
    );

    await expect(
      applyProposalApprovalAction(
        roleForwardedId,
        { action: "approve", notes: "Wrong role." },
        approver,
        { repository },
      ),
    ).rejects.toThrow(/vai tro|duyet|assigned/i);

    const final = await applyProposalApprovalAction(
      roleForwardedId,
      { action: "approve", notes: "Correct role." },
      financeApprover,
      { repository },
    );

    expect(final.proposal.status).toBe("approved");
  });

  it("blocks users without scoped action permission before mutating proposal state", async () => {
    const proposalId = await createSubmittedProposal("Scoped permission block", "project-b");
    const scopeAssignments: ScopeAssignment[] = [
      {
        active: true,
        axisId: "project_management",
        createdAt: "2026-05-29T00:00:00.000Z",
        id: "scope-project-a",
        permissionKeys: ["proposal.view", "proposal.approve"],
        projectId: "project-a",
        roleKey: "tong_giam_doc",
        scopeType: "scoped",
        updatedAt: "2026-05-29T00:00:00.000Z",
        userId: "scoped-approver",
      },
    ];

    await expect(
      applyProposalApprovalAction(
        proposalId,
        { action: "approve", notes: "Out of scope." },
        { id: "scoped-approver", role: "viewer" },
        {
          repository,
          requireScopeAssignments: true,
          scopeAssignments,
        },
      ),
    ).rejects.toThrow(/scope|quyen|permission/i);

    await expectRawStatus(proposalId, "in_review");
  });

  it("keeps review-only users and delegated approval contexts from mutating actions", async () => {
    const proposalId = await createSubmittedProposal("Review-only permission block");

    await expect(
      applyProposalApprovalAction(
        proposalId,
        { action: "approve", notes: "QA only review." },
        reviewOnlyUser,
        { repository },
      ),
    ).rejects.toThrow(/approve|quyen|permission/i);

    await expect(
      applyProposalApprovalAction(
        proposalId,
        { action: "approve", notes: "Acting on behalf." },
        approver,
        {
          delegatedContext: {
            delegationId: "delegation-a",
            onBehalfOf: "mock-founder",
          },
          repository,
        },
      ),
    ).rejects.toThrow(/MVP|approve|duyet|thay/i);

    await expectRawStatus(proposalId, "in_review");
  });
});
