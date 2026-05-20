import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { JsonKnowledgeRepository } from "@/modules/knowledge/services/knowledge-repository";
import {
  approveKnowledgeItem,
  createKnowledgeItem,
  listKnowledgeItems,
  markKnowledgeItemExpired,
  markKnowledgeItemSuperseded,
  rejectKnowledgeItem,
  submitKnowledgeItemForReview
} from "@/modules/knowledge/services/knowledge-service";

let tempDir: string;
let repository: JsonKnowledgeRepository;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-knowledge-"));
  repository = new JsonKnowledgeRepository(path.join(tempDir, "knowledge-center.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("knowledge service", () => {
  it("creates, submits and approves a RAG-eligible knowledge item", async () => {
    const item = await createKnowledgeItem(
      {
        title: "Luật Đất đai 2024",
        sourceUrl: "https://example.com/legal/land-law",
        sourceType: "law",
        module: "legal",
        jurisdiction: "Việt Nam",
        effectiveDate: "2025-01-01",
        confidence: "official",
        tags: ["pháp lý", "đất đai"],
        summary: "Nguồn pháp lý cần review trước khi đưa vào RAG."
      },
      "legal-manager",
      repository
    );

    expect(item.status).toBe("imported");
    expect(item.isRagEligible).toBe(false);

    const submitted = await submitKnowledgeItemForReview(item.id, repository);
    expect(submitted.status).toBe("pending_review");
    expect(submitted.isRagEligible).toBe(false);

    const approved = await approveKnowledgeItem(item.id, "project-director-01", { notes: "Đã kiểm tra nguồn." }, repository);
    expect(approved.status).toBe("approved");
    expect(approved.reviewedBy).toBe("project-director-01");
    expect(approved.approvedBy).toBe("project-director-01");
    expect(approved.isRagEligible).toBe(true);
  });

  it("rejects pending review items and keeps them out of RAG", async () => {
    const item = await createKnowledgeItem(
      {
        title: "Mẫu báo cáo tuần cần chỉnh",
        sourceType: "template",
        module: "reports",
        status: "pending_review",
        confidence: "internal_approved",
        tags: ["báo cáo"]
      },
      "assistant-01",
      repository
    );

    const rejected = await rejectKnowledgeItem(item.id, "executive-01", { notes: "Thiếu phần quyết định tồn đọng." }, repository);

    expect(rejected.status).toBe("rejected");
    expect(rejected.reviewedBy).toBe("executive-01");
    expect(rejected.approvedBy).toBeUndefined();
    expect(rejected.isRagEligible).toBe(false);
  });

  it("marks approved items expired or superseded and removes RAG eligibility", async () => {
    const item = await createKnowledgeItem(
      {
        title: "Quy định nội bộ cũ",
        sourceType: "policy",
        module: "documents",
        status: "pending_review",
        confidence: "internal_approved",
        tags: ["hồ sơ"]
      },
      "assistant-01",
      repository
    );

    await approveKnowledgeItem(item.id, "pm-01", {}, repository);
    const expired = await markKnowledgeItemExpired(item.id, "pm-01", { notes: "Đã hết hiệu lực." }, repository);

    expect(expired.status).toBe("expired");
    expect(expired.isRagEligible).toBe(false);

    const replacement = await createKnowledgeItem(
      {
        title: "Quy định nội bộ mới",
        sourceType: "policy",
        module: "documents",
        status: "pending_review",
        confidence: "internal_approved",
        tags: ["hồ sơ"]
      },
      "assistant-01",
      repository
    );

    await approveKnowledgeItem(replacement.id, "pm-01", {}, repository);
    const superseded = await markKnowledgeItemSuperseded(replacement.id, "pm-01", { notes: "Đã có bản thay thế." }, repository);

    expect(superseded.status).toBe("superseded");
    expect(superseded.isRagEligible).toBe(false);
  });

  it("filters by module, source type, status, confidence and query", async () => {
    await createKnowledgeItem(
      {
        title: "Checklist thiết kế cơ sở",
        sourceType: "template",
        module: "design",
        confidence: "internal_approved",
        tags: ["thiết kế", "review"]
      },
      "designer",
      repository
    );
    await createKnowledgeItem(
      {
        title: "Hướng dẫn thanh toán nhà thầu",
        sourceType: "internal_note",
        module: "finance",
        confidence: "unknown",
        tags: ["tài chính"]
      },
      "accountant",
      repository
    );

    const filtered = await listKnowledgeItems(
      {
        module: "design",
        sourceType: "template",
        status: "imported",
        confidence: "internal_approved",
        query: "review"
      },
      repository
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toBe("Checklist thiết kế cơ sở");
  });

  it("does not allow creating an item directly as approved", async () => {
    await expect(
      createKnowledgeItem(
        {
          title: "Nguồn chưa review",
          sourceType: "law",
          module: "legal",
          status: "approved" as never,
          confidence: "official",
          tags: ["pháp lý"]
        },
        "legal-manager",
        repository
      )
    ).rejects.toThrow();
  });
});
