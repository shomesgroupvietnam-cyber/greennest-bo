import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ExternalSearchProvider } from "@/modules/knowledge/services/external-search-provider";
import { JsonKnowledgeCandidateRepository } from "@/modules/knowledge/services/knowledge-candidate-repository";
import { JsonKnowledgeDiscoveryRepository } from "@/modules/knowledge/services/knowledge-discovery-repository";
import {
  createKnowledgeDiscoveryTopic,
  runKnowledgeDiscoveryTopicNow,
  updateKnowledgeDiscoveryTopic
} from "@/modules/knowledge/services/knowledge-discovery-service";
import {
  isKnowledgeDiscoveryTopicDue,
  listDueKnowledgeDiscoveryTopics,
  runDueKnowledgeDiscoveryTopics
} from "@/modules/knowledge/services/knowledge-discovery-scheduler";
import { JsonSourceRegistrySettingsRepository } from "@/modules/settings/services/source-registry-settings-repository";
import type { KnowledgeCandidate } from "@/modules/knowledge/types";

let tempDir: string;
let discoveryRepository: JsonKnowledgeDiscoveryRepository;
let candidateRepository: JsonKnowledgeCandidateRepository;
let sourceRegistryRepository: JsonSourceRegistrySettingsRepository;

const admin = { id: "admin-01", role: "admin" } as const;
const viewer = { id: "viewer-01", role: "viewer" } as const;

const provider: ExternalSearchProvider = {
  key: "mock_web",
  metadata: {
    provider: "mock_web",
    maxResults: 3,
    timeoutMs: 100
  },
  async search() {
    return [
      {
        title: "Nguon hop le moi",
        url: "https://chinhphu.vn/van-ban/moi",
        provider: "mock_web",
        retrievedAt: "2026-05-17T00:00:00.000Z",
        snippet: "Nguon chinh phu can review."
      },
      {
        title: "Nguon trung lap",
        url: "https://moc.gov.vn/quy-chuan/demo?a=1&b=2#section",
        provider: "mock_web",
        retrievedAt: "2026-05-17T00:00:00.000Z",
        snippet: "Nguon bo xay dung da co candidate."
      },
      {
        title: "Nguon ngoai allowlist",
        url: "https://not-allowed.example.org/demo",
        provider: "mock_web",
        retrievedAt: "2026-05-17T00:00:00.000Z",
        snippet: "Nguon khong duoc phep import."
      }
    ];
  }
};

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-knowledge-discovery-"));
  discoveryRepository = new JsonKnowledgeDiscoveryRepository(path.join(tempDir, "knowledge-discovery.json"));
  candidateRepository = new JsonKnowledgeCandidateRepository(path.join(tempDir, "knowledge-candidates.json"));
  sourceRegistryRepository = new JsonSourceRegistrySettingsRepository(path.join(tempDir, "source-registry-settings.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("knowledge discovery jobs", () => {
  it("creates and updates discovery topics with managed permissions", async () => {
    const topic = await createKnowledgeDiscoveryTopic(
      {
        module: "legal",
        query: "quy dinh du an nha o",
        frequency: "weekly"
      },
      admin,
      discoveryRepository
    );
    const updated = await updateKnowledgeDiscoveryTopic(
      topic.id,
      {
        module: "documents",
        query: "ho so nghiem thu",
        enabled: false,
        frequency: "manual",
        ownerId: "owner-01",
        reviewerId: "reviewer-01"
      },
      admin,
      discoveryRepository
    );

    expect(topic.lastRunStatus).toBe("never_run");
    expect(updated.module).toBe("documents");
    expect(updated.enabled).toBe(false);
    expect(updated.ownerId).toBe("owner-01");
    expect(updated.reviewerId).toBe("reviewer-01");
  });

  it("runs a topic now, imports allowed unique candidates and logs skipped results", async () => {
    const topic = await createKnowledgeDiscoveryTopic(
      {
        module: "legal",
        query: "cap nhat phap ly"
      },
      admin,
      discoveryRepository
    );

    await candidateRepository.createKnowledgeCandidate(existingCandidate("https://moc.gov.vn/quy-chuan/demo?b=2&a=1"));

    const result = await runKnowledgeDiscoveryTopicNow(topic.id, admin, {
      discoveryRepository,
      candidateRepository,
      provider,
      sourceRegistryRepository
    });
    const candidates = await candidateRepository.listKnowledgeCandidates({ sourceType: "web_search", status: "all" });
    const logs = await discoveryRepository.listRunLogs({ topicId: topic.id });

    expect(result.imported).toHaveLength(1);
    expect(result.imported[0]?.status).toBe("pending_review");
    expect(result.imported[0]?.sourceRefId).toBe("https://chinhphu.vn/van-ban/moi");
    expect(result.runLog).toMatchObject({
      resultCount: 3,
      importedCount: 1,
      skippedDuplicateCount: 1,
      skippedDisallowedCount: 1,
      provider: "mock_web",
      status: "partial"
    });
    expect(result.topic.lastRunStatus).toBe("partial");
    expect(candidates).toHaveLength(2);
    expect(logs).toHaveLength(1);
    expect(logs[0]?.providerMetadata?.provider).toBe("mock_web");
  });

  it("records a failed run log when provider search fails", async () => {
    const topic = await createKnowledgeDiscoveryTopic(
      {
        module: "general",
        query: "nguon loi"
      },
      admin,
      discoveryRepository
    );
    const failingProvider: ExternalSearchProvider = {
      ...provider,
      async search() {
        throw new Error("Provider unavailable");
      }
    };

    const result = await runKnowledgeDiscoveryTopicNow(topic.id, admin, {
      discoveryRepository,
      candidateRepository,
      provider: failingProvider,
      sourceRegistryRepository
    });

    expect(result.imported).toEqual([]);
    expect(result.runLog.status).toBe("failed");
    expect(result.runLog.errorMessage).toContain("Provider unavailable");
    expect(result.topic.lastRunStatus).toBe("failed");
  });

  it("blocks unauthorized topic creation and manual runs", async () => {
    const topic = await createKnowledgeDiscoveryTopic(
      {
        module: "legal",
        query: "topic hop le"
      },
      admin,
      discoveryRepository
    );

    await expect(
      createKnowledgeDiscoveryTopic(
        {
          module: "legal",
          query: "nguoi xem tao topic"
        },
        viewer,
        discoveryRepository
      )
    ).rejects.toThrow("khong co quyen");
    await expect(
      runKnowledgeDiscoveryTopicNow(topic.id, viewer, {
        discoveryRepository,
        candidateRepository,
        provider,
        sourceRegistryRepository
      })
    ).rejects.toThrow("khong co quyen");
  });

  it("selects due enabled daily and weekly topics while skipping manual, disabled and locked topics", async () => {
    const referenceDate = new Date("2026-05-17T00:00:00.000Z");
    const dueDaily = await createDiscoveryTopic("daily", "2026-05-15T00:00:00.000Z");
    const dueWeekly = await createDiscoveryTopic("weekly", "2026-05-09T00:00:00.000Z");
    const freshDaily = await createDiscoveryTopic("daily", "2026-05-16T12:00:00.000Z");
    const manual = await createDiscoveryTopic("manual");
    const disabled = await createDiscoveryTopic("daily", "2026-05-15T00:00:00.000Z", { enabled: false });
    const locked = await createDiscoveryTopic("daily", "2026-05-15T00:00:00.000Z", {
      lockedAt: "2026-05-16T23:55:00.000Z",
      lockedBy: "other-runner"
    });

    const dueTopics = await listDueKnowledgeDiscoveryTopics(referenceDate, discoveryRepository);

    expect(dueTopics.map((topic) => topic.id)).toEqual(expect.arrayContaining([dueDaily.id, dueWeekly.id]));
    expect(isKnowledgeDiscoveryTopicDue(freshDaily, referenceDate)).toBe(false);
    expect(isKnowledgeDiscoveryTopicDue(manual, referenceDate)).toBe(false);
    expect(isKnowledgeDiscoveryTopicDue(disabled, referenceDate)).toBe(false);
    expect(isKnowledgeDiscoveryTopicDue(locked, referenceDate)).toBe(false);
  });

  it("locks due topics while running and releases the lock after success", async () => {
    const referenceDate = new Date("2026-05-17T00:00:00.000Z");
    const topic = await createDiscoveryTopic("daily", "2026-05-15T00:00:00.000Z");

    const result = await runDueKnowledgeDiscoveryTopics({
      now: referenceDate,
      runnerId: "runner-01",
      discoveryRepository,
      candidateRepository,
      sourceRegistryRepository,
      provider: oneAllowedResultProvider,
      user: admin
    });
    const updatedTopic = await discoveryRepository.getTopic(topic.id);

    expect(result).toMatchObject({
      dueCount: 1,
      attemptedCount: 1,
      succeededCount: 1,
      failedCount: 0,
      importedCount: 1
    });
    expect(updatedTopic?.lockedAt).toBeUndefined();
    expect(updatedTopic?.lockedBy).toBeUndefined();
    expect(updatedTopic?.retryCount).toBe(0);
  });

  it("records retry metadata after failures and stops retrying after max retries", async () => {
    const referenceDate = new Date("2026-05-17T00:00:00.000Z");
    const topic = await createDiscoveryTopic("daily", undefined, { maxRetries: 2 });
    const failingProvider: ExternalSearchProvider = {
      ...provider,
      async search() {
        throw new Error("Provider unavailable");
      }
    };

    const firstRun = await runDueKnowledgeDiscoveryTopics({
      now: referenceDate,
      runnerId: "runner-retry-01",
      discoveryRepository,
      candidateRepository,
      sourceRegistryRepository,
      provider: failingProvider,
      user: admin
    });
    const afterFirstRun = await discoveryRepository.getTopic(topic.id);
    const secondRun = await runDueKnowledgeDiscoveryTopics({
      now: new Date(afterFirstRun?.nextRetryAt ?? referenceDate.toISOString()),
      runnerId: "runner-retry-02",
      discoveryRepository,
      candidateRepository,
      sourceRegistryRepository,
      provider: failingProvider,
      user: admin
    });
    const afterSecondRun = await discoveryRepository.getTopic(topic.id);

    expect(firstRun.failedCount).toBe(1);
    expect(afterFirstRun?.retryCount).toBe(1);
    expect(afterFirstRun?.nextRetryAt).toBe("2026-05-17T00:15:00.000Z");
    expect(afterFirstRun?.errorCode).toBe("unknown");
    expect(secondRun.failedCount).toBe(1);
    expect(afterSecondRun?.retryCount).toBe(2);
    expect(afterSecondRun?.nextRetryAt).toBeUndefined();
    expect(isKnowledgeDiscoveryTopicDue(afterSecondRun!, new Date("2026-05-18T00:00:00.000Z"))).toBe(false);
  });

  it("does not create duplicate candidates when the scheduler retries or reruns a topic", async () => {
    const referenceDate = new Date("2026-05-17T00:00:00.000Z");
    const topic = await createDiscoveryTopic("daily", "2026-05-15T00:00:00.000Z");

    await runDueKnowledgeDiscoveryTopics({
      now: referenceDate,
      runnerId: "runner-duplicate-01",
      discoveryRepository,
      candidateRepository,
      sourceRegistryRepository,
      provider: oneAllowedResultProvider,
      user: admin
    });
    await discoveryRepository.updateTopic(topic.id, {
      lastRunAt: "2026-05-15T00:00:00.000Z",
      lastRunStatus: "succeeded",
      updatedAt: "2026-05-17T00:01:00.000Z"
    });
    const secondRun = await runDueKnowledgeDiscoveryTopics({
      now: new Date("2026-05-18T00:00:00.000Z"),
      runnerId: "runner-duplicate-02",
      discoveryRepository,
      candidateRepository,
      sourceRegistryRepository,
      provider: oneAllowedResultProvider,
      user: admin
    });
    const candidates = await candidateRepository.listKnowledgeCandidates({ sourceType: "web_search", status: "all" });

    expect(secondRun.importedCount).toBe(0);
    expect(secondRun.results[0]?.status).toBe("partial");
    expect(candidates).toHaveLength(1);
  });
});

const oneAllowedResultProvider: ExternalSearchProvider = {
  key: "mock_web",
  metadata: {
    provider: "mock_web",
    maxResults: 1,
    timeoutMs: 100
  },
  async search() {
    return [
      {
        title: "Nguon hop le duy nhat",
        url: "https://chinhphu.vn/van-ban/scheduler",
        provider: "mock_web",
        retrievedAt: "2026-05-17T00:00:00.000Z",
        snippet: "Nguon chinh phu cho scheduler."
      }
    ];
  }
};

async function createDiscoveryTopic(
  frequency: "manual" | "daily" | "weekly",
  lastRunAt?: string,
  patch: Partial<Awaited<ReturnType<typeof createKnowledgeDiscoveryTopic>>> = {}
) {
  const topic = await createKnowledgeDiscoveryTopic(
    {
      module: "legal",
      query: `topic ${frequency} ${crypto.randomUUID()}`,
      frequency,
      enabled: true,
      maxRetries: 3
    },
    admin,
    discoveryRepository
  );

  return discoveryRepository.updateTopic(topic.id, {
    lastRunAt,
    updatedAt: "2026-05-16T00:00:00.000Z",
    ...patch
  });
}

function existingCandidate(sourceRefId: string): KnowledgeCandidate {
  const timestamp = "2026-05-17T00:00:00.000Z";

  return {
    id: "candidate-existing",
    sourceType: "web_search",
    sourceRefId,
    module: "construction",
    title: "Candidate da ton tai",
    extractedText: "Noi dung da co san.",
    submittedBy: "admin-01",
    status: "pending_review",
    createdAt: timestamp,
    updatedAt: timestamp
  };
}
