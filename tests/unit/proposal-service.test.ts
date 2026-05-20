import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PermissionUser } from "@/lib/permissions/can";
import { JsonProposalRepository } from "@/modules/proposals/services/proposal-repository";
import {
  approveProposal,
  createProposal,
  getProposalDetail,
  listProposals,
  rejectProposal,
  requestProposalChange,
  submitProposal
} from "@/modules/proposals/services/proposal-service";

let tempDir: string;
let repository: JsonProposalRepository;

const investmentUser: PermissionUser = { id: "investment-user", role: "dau_tu_phat_trien" };
const financeManager: PermissionUser = { id: "finance-manager", role: "quan_ly_tai_chinh" };
const viewer: PermissionUser = { id: "viewer-user", role: "viewer" };

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-proposals-"));
  repository = new JsonProposalRepository(path.join(tempDir, "proposals.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("proposal service", () => {
  it("creates, lists and submits a proposal for review", async () => {
    const detail = await createProposal(
      {
        title: "De xuat nghien cuu quy dat moi",
        type: "investment",
        projectId: "project-01",
        priority: "high",
        summary: "Can danh gia phap ly, tai chinh va kha nang trien khai."
      },
      investmentUser,
      repository
    );

    expect(detail.proposal.status).toBe("draft");
    expect(detail.proposal.requestedBy).toBe(investmentUser.id);
    expect(detail.proposal.code).toMatch(/^DX-INVESTMENT-/);

    const listed = await listProposals({ type: "investment" }, investmentUser, repository);
    expect(listed.map((proposal) => proposal.id)).toEqual([detail.proposal.id]);

    const submitted = await submitProposal(detail.proposal.id, investmentUser, repository);
    const submittedDetail = await getProposalDetail(submitted.id, financeManager, repository);

    expect(submitted.status).toBe("in_review");
    expect(submitted.currentStepId).toBeDefined();
    expect(submittedDetail?.steps).toHaveLength(1);
    expect(submittedDetail?.decisions.map((decision) => decision.decision)).toContain("submitted");
  });

  it("supports request-change, approve and reject decisions", async () => {
    const first = await createProposal(
      {
        title: "De xuat dieu chinh ngan sach",
        type: "finance",
        priority: "normal"
      },
      financeManager,
      repository
    );
    await submitProposal(first.proposal.id, financeManager, repository);

    const changed = await requestProposalChange(first.proposal.id, financeManager, "Bo sung bang dong tien.", repository);
    expect(changed.status).toBe("change_requested");

    const resubmitted = await submitProposal(first.proposal.id, financeManager, repository);
    expect(resubmitted.status).toBe("in_review");

    const approved = await approveProposal(first.proposal.id, financeManager, "Thong nhat phe duyet.", repository);
    expect(approved.status).toBe("approved");

    const second = await createProposal(
      {
        title: "De xuat hop dong phu",
        type: "contract",
        priority: "normal"
      },
      { id: "contract-user", role: "quan_ly_hop_dong" },
      repository
    );
    await submitProposal(second.proposal.id, { id: "contract-user", role: "quan_ly_hop_dong" }, repository);

    const rejected = await rejectProposal(second.proposal.id, financeManager, "Chua du can cu.", repository);
    const rejectedDetail = await getProposalDetail(second.proposal.id, financeManager, repository);

    expect(rejected.status).toBe("rejected");
    expect(rejectedDetail?.decisions.map((decision) => decision.decision)).toContain("rejected");
  });

  it("blocks roles without proposal permissions", async () => {
    await expect(
      createProposal(
        {
          title: "Viewer khong duoc tao de xuat",
          type: "general",
          priority: "normal"
        },
        viewer,
        repository
      )
    ).rejects.toThrow();

    await expect(listProposals({}, viewer, repository)).rejects.toThrow();
  });
});
