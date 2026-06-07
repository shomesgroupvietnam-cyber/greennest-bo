import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PermissionUser } from "@/lib/permissions/can";
import { JsonLeadershipDelegationRepository } from "@/modules/settings/services/leadership-delegation-repository";
import type { DocumentRepository } from "@/modules/documents/services/document-repository";
import { upsertLeadershipDelegation } from "@/modules/settings/services/leadership-delegation-service";
import { JsonPolicySettingsRepository } from "@/modules/settings/services/policy-settings-repository";
import { JsonProposalRepository } from "@/modules/proposals/services/proposal-repository";
import { JsonUserRepository } from "@/modules/users/services/user-repository";
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
let policyRepository: JsonPolicySettingsRepository;
let delegationRepository: JsonLeadershipDelegationRepository;
let userRepository: JsonUserRepository;

const investmentUser: PermissionUser = { id: "investment-user", role: "dau_tu_phat_trien" };
const financeManager: PermissionUser = { id: "finance-manager", role: "quan_ly_tai_chinh" };
const systemAdmin: PermissionUser = { id: "admin-user", role: "admin" };
const viewer: PermissionUser = { id: "viewer-user", role: "viewer" };
const assistant: PermissionUser = { id: "viewer", role: "thu_ky_tro_ly" };
const qaReviewer: PermissionUser = { id: "qa-reviewer", role: "qa_qc_chat_luong" };
const documentRepository = {
  async listDocuments() {
    return [];
  },
  async getDocument(documentId: string) {
    if (["document-contract-01", "document-complete-01"].includes(documentId)) {
      return {
        id: documentId,
        projectId: "project-01",
        title: documentId,
        docType: "approval",
        version: "v1",
        status: "complete" as const,
        createdAt: "2026-05-23T00:00:00.000Z",
        updatedAt: "2026-05-23T00:00:00.000Z",
      };
    }

    return undefined;
  },
  async listDocumentVersions() {
    return [];
  },
  async createDocument(document) {
    return document;
  },
  async updateDocument(_documentId, patch) {
    return {
      id: _documentId,
      projectId: "project-01",
      title: "updated",
      docType: "approval",
      version: "v1",
      status: "complete" as const,
      createdAt: "2026-05-23T00:00:00.000Z",
      updatedAt: "2026-05-23T00:00:00.000Z",
      ...patch,
    };
  },
} satisfies DocumentRepository;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-proposals-"));
  repository = new JsonProposalRepository(path.join(tempDir, "proposals.json"));
  policyRepository = new JsonPolicySettingsRepository(path.join(tempDir, "policy-settings.json"));
  delegationRepository = new JsonLeadershipDelegationRepository(path.join(tempDir, "leadership-delegations.json"));
  userRepository = new JsonUserRepository(path.join(tempDir, "users.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("proposal service", () => {
  it("creates, lists and submits a proposal for review", async () => {
    await policyRepository.upsertApprovalThresholdPolicy({
      id: "policy-investment-300m-500m",
      policyKey: "investment_300m_500m",
      labelVi: "Dau tu 300m den 500m",
      targetType: "investment",
      amountMin: 300_000_000,
      amountMax: 500_000_000,
      currency: "VND",
      approvalLevel: "CEO",
      approverRoleKey: "tong_giam_doc",
      requiredPermissionKey: "proposal.approve",
      escalateOnRiskLevels: ["high", "critical"],
      active: true,
      priority: 1,
      createdAt: "2026-05-23T00:00:00.000Z",
      updatedAt: "2026-05-23T00:00:00.000Z",
    });

    const detail = await createProposal(
      {
        title: "De xuat nghien cuu quy dat moi",
        type: "investment",
        projectId: "project-01",
        priority: "high",
        amount: 320_000_000,
        attachments: [
          {
            name: "Ho so nghien cuu.pdf",
            url: "https://example.com/ho-so-nghien-cuu.pdf",
          },
        ],
        dueDate: "2026-05-29",
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
    expect(detail.attachments).toEqual([
      expect.objectContaining({
        name: "Ho so nghien cuu.pdf",
        source: "external_url",
        url: "https://example.com/ho-so-nghien-cuu.pdf",
      }),
    ]);

    const submitted = await submitProposal(detail.proposal.id, investmentUser, repository, policyRepository);
    const submittedDetail = await getProposalDetail(submitted.id, financeManager, repository);

    expect(submitted.status).toBe("in_review");
    expect(submitted.currentStepId).toBeDefined();
    expect(submittedDetail?.steps).toHaveLength(1);
    expect(submittedDetail?.steps[0]).toMatchObject({
      approverRole: "tong_giam_doc",
      requiredPermission: "proposal.approve",
      thresholdPolicyId: "policy-investment-300m-500m",
      thresholdLabel: "Dau tu 300m den 500m",
      approvalLevel: "CEO",
    });
    expect(submittedDetail?.decisions.map((decision) => decision.decision)).toContain("submitted");
  });

  it("supports request-change, approve and reject decisions", async () => {
    const first = await createProposal(
      {
        amount: 50_000_000,
        title: "De xuat dieu chinh ngan sach",
        type: "finance",
        priority: "normal",
        attachments: [
          {
            name: "Bang dong tien.pdf",
            url: "https://example.com/bang-dong-tien.pdf",
          },
        ],
        dueDate: "2026-05-29",
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
        amount: 50_000_000,
        title: "De xuat hop dong phu",
        type: "contract",
        projectId: "project-01",
        priority: "normal",
        attachments: [
          {
            documentId: "document-contract-01",
            name: "Hop dong phu.pdf",
          },
        ],
        dueDate: "2026-05-29",
      },
      { id: "contract-user", role: "quan_ly_hop_dong" },
      repository,
      undefined,
      documentRepository,
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

  it("redacts proposal amounts for users without finance permission", async () => {
    const detail = await createProposal(
      {
        title: "De xuat co gia tri nhay cam",
        type: "finance",
        priority: "normal",
        amount: 9_999_000_000,
      },
      financeManager,
      repository,
    );

    const sanitizedDetail = await getProposalDetail(detail.proposal.id, qaReviewer, repository);
    const sanitizedList = await listProposals({}, qaReviewer, repository);
    const rawDetail = await repository.getProposalDetail(detail.proposal.id);

    expect(sanitizedDetail?.proposal.amount).toBeUndefined();
    expect(sanitizedList[0]?.amount).toBeUndefined();
    expect(JSON.stringify(sanitizedDetail)).not.toContain("9999000000");
    expect(JSON.stringify(sanitizedList)).not.toContain("9999000000");
    expect(rawDetail?.proposal.amount).toBe(9_999_000_000);
  });

  it("does not let proposal.review bypass proposal.request_change", async () => {
    const detail = await createProposal(
      {
        attachments: [
          {
            name: "Ho so can dieu chinh.pdf",
            url: "https://example.com/ho-so-can-dieu-chinh.pdf",
          },
        ],
        dueDate: "2026-05-29",
        title: "De xuat can dieu chinh",
        type: "finance",
        priority: "normal"
      },
      financeManager,
      repository
    );
    await submitProposal(detail.proposal.id, financeManager, repository);

    await expect(
      requestProposalChange(detail.proposal.id, systemAdmin, "Admin khong co request_change.", repository),
    ).rejects.toThrow();
  });

  it("lets an assistant create and submit a proposal on behalf without broad proposal.create", async () => {
    const delegation = await upsertLeadershipDelegation(
      {
        principalUserId: "mock-founder",
        delegateUserId: assistant.id,
        actionKeys: ["proposal.create"],
        projectId: "*",
        moduleId: "proposal",
      },
      systemAdmin,
      { repository: delegationRepository, userRepository },
    );

    const detail = await createProposal(
      {
        title: "De xuat thay lanh dao",
        type: "general",
        projectId: "project-01",
        module: "proposal",
        priority: "normal",
        attachments: [
          {
            name: "Ho so thay lanh dao.pdf",
            url: "https://example.com/ho-so-thay-lanh-dao.pdf",
          },
        ],
        dueDate: "2026-05-29",
        summary: "Thu ky tao de xuat trong scope duoc uy quyen.",
        onBehalfOf: "mock-founder",
      },
      assistant,
      repository,
      delegationRepository,
    );

    expect(detail.proposal).toMatchObject({
      requestedBy: "mock-founder",
      submittedBy: assistant.id,
      onBehalfOf: "mock-founder",
      delegationId: delegation.delegation.id,
    });

    const submitted = await submitProposal(
      detail.proposal.id,
      assistant,
      repository,
      undefined,
      delegationRepository,
    );
    const submittedDetail = await getProposalDetail(submitted.id, financeManager, repository);

    expect(submitted).toMatchObject({
      status: "in_review",
      requestedBy: "mock-founder",
      submittedBy: assistant.id,
      onBehalfOf: "mock-founder",
      delegationId: delegation.delegation.id,
    });
    expect(submittedDetail?.decisions[0]).toMatchObject({
      decision: "submitted",
      decidedBy: assistant.id,
    });
  });

  it("blocks delegated create outside scope and delegated approval actions in MVP", async () => {
    await expect(
      createProposal(
        {
          title: "Khong co delegation hop le",
          type: "general",
          projectId: "project-01",
          module: "proposal",
          priority: "normal",
          onBehalfOf: "mock-founder",
        },
        assistant,
        repository,
        delegationRepository,
      ),
    ).rejects.toThrow(/uy quyen|delegation|proposal\.create|quyen/i);

    const detail = await createProposal(
      {
        title: "De xuat can duyet",
        type: "finance",
        priority: "normal",
        attachments: [
          {
            name: "Ho so can duyet.pdf",
            url: "https://example.com/ho-so-can-duyet.pdf",
          },
        ],
        dueDate: "2026-05-29",
      },
      financeManager,
      repository,
    );
    await submitProposal(detail.proposal.id, financeManager, repository);

    await expect(
      requestProposalChange(detail.proposal.id, financeManager, "Thay lanh dao", repository, {
        onBehalfOf: "mock-founder",
        delegationId: "delegation-a",
      }),
    ).rejects.toThrow(/MVP|approve|duyet|thay/i);
    await expect(
      approveProposal(detail.proposal.id, financeManager, "Thay lanh dao", repository, {
        onBehalfOf: "mock-founder",
        delegationId: "delegation-a",
      }),
    ).rejects.toThrow(/MVP|approve|duyet|thay/i);
    await expect(
      rejectProposal(detail.proposal.id, financeManager, "Thay lanh dao", repository, {
        onBehalfOf: "mock-founder",
        delegationId: "delegation-a",
      }),
    ).rejects.toThrow(/MVP|approve|duyet|thay/i);
  });

  it("requires deadline and attachment metadata before a proposal enters approval queue", async () => {
    const missingDeadline = await createProposal(
      {
        attachments: [
          {
            name: "Ho so thieu deadline.pdf",
            url: "https://example.com/ho-so-thieu-deadline.pdf",
          },
        ],
        title: "Thieu deadline",
        type: "general",
      },
      investmentUser,
      repository,
    );
    const missingAttachment = await createProposal(
      {
        dueDate: "2026-05-29",
        title: "Thieu attachment",
        type: "general",
      },
      investmentUser,
      repository,
    );
    const complete = await createProposal(
      {
        attachments: [
          {
            documentId: "document-complete-01",
            name: "Ho so day du.pdf",
          },
        ],
        dueDate: "2026-05-29",
        projectId: "project-01",
        title: "Day du metadata",
        type: "general",
      },
      investmentUser,
      repository,
      undefined,
      documentRepository,
    );

    await expect(
      submitProposal(missingDeadline.proposal.id, investmentUser, repository),
    ).rejects.toThrow(/deadline|han xu ly/i);
    await expect(
      submitProposal(missingAttachment.proposal.id, investmentUser, repository),
    ).rejects.toThrow(/file|attachment|dinh kem/i);

    const submitted = await submitProposal(
      complete.proposal.id,
      investmentUser,
      repository,
    );

    expect(submitted.status).toBe("in_review");
  });

  it("keeps proposal attachment migration aligned with the metadata contract", async () => {
    const migration = await readFile(
      "database/migrations/202606070002_add_proposal_attachments.sql",
      "utf8",
    );

    expect(migration).toContain("public.proposal_attachments");
    expect(migration).toContain("proposal_id");
    expect(migration).toContain("document_id");
    expect(migration).toContain("external_url");
    expect(migration).toContain("proposal_attachments_reference_by_source_check");
    expect(migration).toContain("current_user_can_read_proposal_attachment");
    expect(migration).toContain("attachment_ids");
    expect(migration).toContain("on delete cascade");
  });
});
