import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { JsonKnowledgeCandidateRepository } from "@/modules/knowledge/services/knowledge-candidate-repository";
import {
  approveKnowledgeCandidateIntoKnowledgeItem,
  createKnowledgeCandidate,
  isKnowledgeCandidateRagEligible,
  listKnowledgeCandidates,
  rejectKnowledgeCandidate,
  submitKnowledgeCandidateForReview
} from "@/modules/knowledge/services/knowledge-candidate-service";
import { JsonKnowledgeIndexRepository } from "@/modules/knowledge/services/knowledge-index-repository";
import { indexKnowledgeItem, listKnowledgeChunksByItem } from "@/modules/knowledge/services/knowledge-indexing-service";
import { JsonKnowledgeRepository } from "@/modules/knowledge/services/knowledge-repository";
import { listKnowledgeItems } from "@/modules/knowledge/services/knowledge-service";

let tempDir: string;
let candidateRepository: JsonKnowledgeCandidateRepository;
let knowledgeRepository: JsonKnowledgeRepository;
let indexRepository: JsonKnowledgeIndexRepository;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-knowledge-candidate-"));
  candidateRepository = new JsonKnowledgeCandidateRepository(path.join(tempDir, "knowledge-candidates.json"));
  knowledgeRepository = new JsonKnowledgeRepository(path.join(tempDir, "knowledge-center.json"));
  indexRepository = new JsonKnowledgeIndexRepository(path.join(tempDir, "knowledge-center.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("knowledge candidate promotion", () => {
  it("keeps chat/search/upload-like content out of Knowledge Center until promoted", async () => {
    const candidate = await createKnowledgeCandidate(
      {
        sourceType: "chat",
        sourceRefId: "chat-demo-001",
        module: "general",
        title: "Ghi chú từ chat cần review",
        extractedText: "Nội dung chat chỉ là working context, chưa phải knowledge.",
        notes: "Submit as candidate only."
      },
      { id: "assistant-01", role: "thu_ky_tro_ly" },
      candidateRepository
    );
    const items = await listKnowledgeItems({}, knowledgeRepository);

    expect(candidate.status).toBe("candidate");
    expect(isKnowledgeCandidateRagEligible(candidate)).toBe(false);
    expect(items).toEqual([]);
  });

  it("creates, submits and approves a candidate into a pending Knowledge Item", async () => {
    const candidate = await createKnowledgeCandidate(
      {
        sourceType: "upload",
        sourceRefId: "upload-001",
        module: "documents",
        title: "Quy ước đặt tên hồ sơ",
        extractedText: "File upload demo nêu quy ước đặt tên hồ sơ theo dự án, giai đoạn và loại hồ sơ."
      },
      { id: "assistant-01", role: "thu_ky_tro_ly" },
      candidateRepository
    );

    const submitted = await submitKnowledgeCandidateForReview(candidate.id, { id: "pm-01", role: "quan_ly_du_an" }, candidateRepository);
    expect(submitted.status).toBe("pending_review");

    const { candidate: approvedCandidate, item } = await approveKnowledgeCandidateIntoKnowledgeItem(
      candidate.id,
      { id: "pm-01", role: "quan_ly_du_an" },
      { notes: "Đủ điều kiện promote vào Knowledge Center để review tiếp." },
      candidateRepository,
      knowledgeRepository
    );

    expect(approvedCandidate.status).toBe("approved");
    expect(approvedCandidate.promotedKnowledgeItemId).toBe(item.id);
    expect(item.status).toBe("pending_review");
    expect(item.isRagEligible).toBe(false);
    expect(item.summary).toContain("quy ước đặt tên hồ sơ");
  });

  it("does not index a promoted candidate before the Knowledge Item approval path", async () => {
    const candidate = await createKnowledgeCandidate(
      {
        sourceType: "web_search",
        sourceRefId: "search-001",
        module: "legal",
        title: "Nguồn web search về pháp lý",
        extractedText: "Nguồn web search demo phải được review và approve ở Knowledge Item trước khi RAG dùng."
      },
      { id: "legal-manager", role: "phap_ly" },
      candidateRepository
    );

    await submitKnowledgeCandidateForReview(candidate.id, { id: "legal-manager", role: "phap_ly" }, candidateRepository);
    const { item } = await approveKnowledgeCandidateIntoKnowledgeItem(
      candidate.id,
      { id: "legal-manager", role: "phap_ly" },
      {},
      candidateRepository,
      knowledgeRepository
    );
    const chunks = await indexKnowledgeItem(item.id, {}, knowledgeRepository, indexRepository);
    const persistedChunks = await listKnowledgeChunksByItem(item.id, indexRepository);

    expect(item.status).toBe("pending_review");
    expect(item.isRagEligible).toBe(false);
    expect(chunks).toEqual([]);
    expect(persistedChunks).toEqual([]);
  });

  it("blocks unauthorized approval", async () => {
    const candidate = await createKnowledgeCandidate(
      {
        sourceType: "manual",
        module: "reports",
        title: "Mẫu ghi chú báo cáo",
        extractedText: "Nội dung candidate cho báo cáo."
      },
      { id: "assistant-01", role: "thu_ky_tro_ly" },
      candidateRepository
    );

    await submitKnowledgeCandidateForReview(candidate.id, { id: "pm-01", role: "quan_ly_du_an" }, candidateRepository);

    await expect(
      approveKnowledgeCandidateIntoKnowledgeItem(
        candidate.id,
        { id: "viewer", role: "viewer" },
        {},
        candidateRepository,
        knowledgeRepository
      )
    ).rejects.toThrow("Knowledge Candidate");
  });

  it("rejects a candidate without creating a Knowledge Item", async () => {
    const candidate = await createKnowledgeCandidate(
      {
        sourceType: "ai_response",
        module: "project",
        title: "AI draft chưa đủ nguồn",
        extractedText: "AI draft này thiếu citation nên không được promote."
      },
      { id: "pm-01", role: "quan_ly_du_an" },
      candidateRepository
    );

    const rejected = await rejectKnowledgeCandidate(
      candidate.id,
      { id: "pm-01", role: "quan_ly_du_an" },
      { notes: "Thiếu citation." },
      candidateRepository
    );
    const candidates = await listKnowledgeCandidates({}, candidateRepository);
    const items = await listKnowledgeItems({}, knowledgeRepository);

    expect(rejected.status).toBe("rejected");
    expect(candidates).toHaveLength(1);
    expect(items).toEqual([]);
  });
});
