import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { selectRepository } from "@/lib/db/repository-mode";
import type { KnowledgeDiscoveryRunLog, KnowledgeDiscoveryTopic } from "@/modules/knowledge/types";

type KnowledgeDiscoveryStore = {
  topics: KnowledgeDiscoveryTopic[];
  runLogs: KnowledgeDiscoveryRunLog[];
};

const emptyStore: KnowledgeDiscoveryStore = {
  topics: [],
  runLogs: []
};

export type KnowledgeDiscoveryRepository = {
  listTopics(): Promise<KnowledgeDiscoveryTopic[]>;
  getTopic(topicId: string): Promise<KnowledgeDiscoveryTopic | undefined>;
  createTopic(topic: KnowledgeDiscoveryTopic): Promise<KnowledgeDiscoveryTopic>;
  updateTopic(topicId: string, patch: Partial<KnowledgeDiscoveryTopic>): Promise<KnowledgeDiscoveryTopic>;
  tryLockTopic(topicId: string, lockedBy: string, lockedAt: string, lockExpiresBefore: string): Promise<KnowledgeDiscoveryTopic | undefined>;
  releaseTopicLock(topicId: string, lockedBy: string, patch?: Partial<KnowledgeDiscoveryTopic>): Promise<KnowledgeDiscoveryTopic>;
  createRunLog(log: KnowledgeDiscoveryRunLog): Promise<KnowledgeDiscoveryRunLog>;
  listRunLogs(filters?: { topicId?: string }): Promise<KnowledgeDiscoveryRunLog[]>;
};

export class JsonKnowledgeDiscoveryRepository implements KnowledgeDiscoveryRepository {
  constructor(private readonly filePath = path.join(process.cwd(), ".mock-data", "knowledge-discovery.json")) {}

  async listTopics() {
    const store = await this.readStore();

    return store.topics.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getTopic(topicId: string) {
    const store = await this.readStore();

    return store.topics.find((topic) => topic.id === topicId);
  }

  async createTopic(topic: KnowledgeDiscoveryTopic) {
    const store = await this.readStore();
    await this.writeStore({ ...store, topics: [normalizeTopic(topic), ...store.topics] });

    return normalizeTopic(topic);
  }

  async updateTopic(topicId: string, patch: Partial<KnowledgeDiscoveryTopic>) {
    const store = await this.readStore();
    const existing = store.topics.find((topic) => topic.id === topicId);

    if (!existing) {
      throw new Error("Khong tim thay discovery topic.");
    }

    const updated = normalizeTopic({ ...existing, ...patch, id: existing.id, createdAt: existing.createdAt });

    await this.writeStore({
      ...store,
      topics: store.topics.map((topic) => (topic.id === topicId ? updated : topic))
    });

    return updated;
  }

  async tryLockTopic(topicId: string, lockedBy: string, lockedAt: string, lockExpiresBefore: string) {
    const store = await this.readStore();
    const existing = store.topics.find((topic) => topic.id === topicId);

    if (!existing || (existing.lockedAt && existing.lockedAt > lockExpiresBefore)) {
      return undefined;
    }

    const updated = normalizeTopic({ ...existing, lockedAt, lockedBy, updatedAt: lockedAt });

    await this.writeStore({
      ...store,
      topics: store.topics.map((topic) => (topic.id === topicId ? updated : topic))
    });

    return updated;
  }

  async releaseTopicLock(topicId: string, lockedBy: string, patch: Partial<KnowledgeDiscoveryTopic> = {}) {
    const store = await this.readStore();
    const existing = store.topics.find((topic) => topic.id === topicId);

    if (!existing) {
      throw new Error("Khong tim thay discovery topic.");
    }

    if (existing.lockedBy && existing.lockedBy !== lockedBy) {
      throw new Error("Discovery topic dang duoc lock boi runner khac.");
    }

    const updated = normalizeTopic({
      ...existing,
      ...patch,
      id: existing.id,
      createdAt: existing.createdAt,
      lockedAt: undefined,
      lockedBy: undefined
    });

    await this.writeStore({
      ...store,
      topics: store.topics.map((topic) => (topic.id === topicId ? updated : topic))
    });

    return updated;
  }

  async createRunLog(log: KnowledgeDiscoveryRunLog) {
    const store = await this.readStore();
    await this.writeStore({ ...store, runLogs: [log, ...store.runLogs] });

    return log;
  }

  async listRunLogs(filters: { topicId?: string } = {}) {
    const store = await this.readStore();

    return store.runLogs
      .filter((log) => !filters.topicId || log.topicId === filters.topicId)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  private async readStore(): Promise<KnowledgeDiscoveryStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<KnowledgeDiscoveryStore>;

      return {
        topics: (parsed.topics ?? []).map(normalizeTopic),
        runLogs: parsed.runLogs ?? []
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return emptyStore;
      }

      throw error;
    }
  }

  private async writeStore(store: KnowledgeDiscoveryStore) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  }
}

type DiscoveryTopicRow = {
  id: string;
  module: KnowledgeDiscoveryTopic["module"];
  query: string;
  enabled: boolean;
  frequency: KnowledgeDiscoveryTopic["frequency"];
  owner_id: string | null;
  reviewer_id: string | null;
  last_run_at: string | null;
  last_run_status: KnowledgeDiscoveryTopic["lastRunStatus"];
  retry_count: number | null;
  max_retries: number | null;
  next_retry_at: string | null;
  error_code: KnowledgeDiscoveryTopic["errorCode"] | null;
  error_message: string | null;
  locked_at: string | null;
  locked_by: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type DiscoveryRunLogRow = {
  id: string;
  topic_id: string;
  run_by: string;
  query: string;
  provider: string;
  provider_metadata: Record<string, unknown> | null;
  status: KnowledgeDiscoveryRunLog["status"];
  result_count: number;
  imported_count: number;
  skipped_duplicate_count: number;
  skipped_disallowed_count: number;
  retry_count: number | null;
  max_retries: number | null;
  next_retry_at: string | null;
  error_code: KnowledgeDiscoveryRunLog["errorCode"] | null;
  error_message: string | null;
  started_at: string;
  finished_at: string;
};

function normalizeTopic(topic: KnowledgeDiscoveryTopic): KnowledgeDiscoveryTopic {
  return {
    ...topic,
    retryCount: topic.retryCount ?? 0,
    maxRetries: topic.maxRetries ?? 3
  };
}

function toTopic(row: DiscoveryTopicRow): KnowledgeDiscoveryTopic {
  return normalizeTopic({
    id: row.id,
    module: row.module,
    query: row.query,
    enabled: row.enabled,
    frequency: row.frequency,
    ownerId: row.owner_id ?? undefined,
    reviewerId: row.reviewer_id ?? undefined,
    lastRunAt: row.last_run_at ?? undefined,
    lastRunStatus: row.last_run_status,
    retryCount: row.retry_count ?? 0,
    maxRetries: row.max_retries ?? 3,
    nextRetryAt: row.next_retry_at ?? undefined,
    errorCode: row.error_code ?? undefined,
    errorMessage: row.error_message ?? undefined,
    lockedAt: row.locked_at ?? undefined,
    lockedBy: row.locked_by ?? undefined,
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });
}

function topicToRow(topic: KnowledgeDiscoveryTopic) {
  const normalized = normalizeTopic(topic);

  return {
    id: normalized.id,
    module: normalized.module,
    query: normalized.query,
    enabled: normalized.enabled,
    frequency: normalized.frequency,
    owner_id: normalized.ownerId ?? null,
    reviewer_id: normalized.reviewerId ?? null,
    last_run_at: normalized.lastRunAt ?? null,
    last_run_status: normalized.lastRunStatus,
    retry_count: normalized.retryCount,
    max_retries: normalized.maxRetries,
    next_retry_at: normalized.nextRetryAt ?? null,
    error_code: normalized.errorCode ?? null,
    error_message: normalized.errorMessage ?? null,
    locked_at: normalized.lockedAt ?? null,
    locked_by: normalized.lockedBy ?? null,
    created_by: normalized.createdBy ?? null,
    updated_by: normalized.updatedBy ?? null,
    created_at: normalized.createdAt,
    updated_at: normalized.updatedAt
  };
}

function topicPatchToRow(patch: Partial<KnowledgeDiscoveryTopic>) {
  const has = (key: keyof KnowledgeDiscoveryTopic) => Object.prototype.hasOwnProperty.call(patch, key);

  return {
    ...(has("module") ? { module: patch.module } : {}),
    ...(has("query") ? { query: patch.query } : {}),
    ...(has("enabled") ? { enabled: patch.enabled } : {}),
    ...(has("frequency") ? { frequency: patch.frequency } : {}),
    ...(has("ownerId") ? { owner_id: patch.ownerId ?? null } : {}),
    ...(has("reviewerId") ? { reviewer_id: patch.reviewerId ?? null } : {}),
    ...(has("lastRunAt") ? { last_run_at: patch.lastRunAt ?? null } : {}),
    ...(has("lastRunStatus") ? { last_run_status: patch.lastRunStatus } : {}),
    ...(has("retryCount") ? { retry_count: patch.retryCount } : {}),
    ...(has("maxRetries") ? { max_retries: patch.maxRetries } : {}),
    ...(has("nextRetryAt") ? { next_retry_at: patch.nextRetryAt ?? null } : {}),
    ...(has("errorCode") ? { error_code: patch.errorCode ?? null } : {}),
    ...(has("errorMessage") ? { error_message: patch.errorMessage ?? null } : {}),
    ...(has("lockedAt") ? { locked_at: patch.lockedAt ?? null } : {}),
    ...(has("lockedBy") ? { locked_by: patch.lockedBy ?? null } : {}),
    ...(has("updatedBy") ? { updated_by: patch.updatedBy ?? null } : {}),
    ...(has("updatedAt") ? { updated_at: patch.updatedAt } : {})
  };
}

function toRunLog(row: DiscoveryRunLogRow): KnowledgeDiscoveryRunLog {
  return {
    id: row.id,
    topicId: row.topic_id,
    runBy: row.run_by,
    query: row.query,
    provider: row.provider,
    providerMetadata: row.provider_metadata ?? undefined,
    status: row.status,
    resultCount: row.result_count,
    importedCount: row.imported_count,
    skippedDuplicateCount: row.skipped_duplicate_count,
    skippedDisallowedCount: row.skipped_disallowed_count,
    retryCount: row.retry_count ?? undefined,
    maxRetries: row.max_retries ?? undefined,
    nextRetryAt: row.next_retry_at ?? undefined,
    errorCode: row.error_code ?? undefined,
    errorMessage: row.error_message ?? undefined,
    startedAt: row.started_at,
    finishedAt: row.finished_at
  };
}

function runLogToRow(log: KnowledgeDiscoveryRunLog) {
  return {
    id: log.id,
    topic_id: log.topicId,
    run_by: log.runBy,
    query: log.query,
    provider: log.provider,
    provider_metadata: log.providerMetadata ?? null,
    status: log.status,
    result_count: log.resultCount,
    imported_count: log.importedCount,
    skipped_duplicate_count: log.skippedDuplicateCount,
    skipped_disallowed_count: log.skippedDisallowedCount,
    retry_count: log.retryCount ?? null,
    max_retries: log.maxRetries ?? null,
    next_retry_at: log.nextRetryAt ?? null,
    error_code: log.errorCode ?? null,
    error_message: log.errorMessage ?? null,
    started_at: log.startedAt,
    finished_at: log.finishedAt
  };
}

export class SupabaseKnowledgeDiscoveryRepository implements KnowledgeDiscoveryRepository {
  async listTopics() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("knowledge_discovery_topics").select("*").order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as DiscoveryTopicRow[]).map(toTopic);
  }

  async getTopic(topicId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("knowledge_discovery_topics").select("*").eq("id", topicId).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toTopic(data as DiscoveryTopicRow) : undefined;
  }

  async createTopic(topic: KnowledgeDiscoveryTopic) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("knowledge_discovery_topics").insert(topicToRow(topic)).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    return toTopic(data as DiscoveryTopicRow);
  }

  async updateTopic(topicId: string, patch: Partial<KnowledgeDiscoveryTopic>) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("knowledge_discovery_topics")
      .update(topicPatchToRow(patch))
      .eq("id", topicId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toTopic(data as DiscoveryTopicRow);
  }

  async tryLockTopic(topicId: string, lockedBy: string, lockedAt: string, lockExpiresBefore: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("knowledge_discovery_topics")
      .update({ locked_at: lockedAt, locked_by: lockedBy, updated_at: lockedAt })
      .eq("id", topicId)
      .or(`locked_at.is.null,locked_at.lt.${lockExpiresBefore}`)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toTopic(data as DiscoveryTopicRow) : undefined;
  }

  async releaseTopicLock(topicId: string, lockedBy: string, patch: Partial<KnowledgeDiscoveryTopic> = {}) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("knowledge_discovery_topics")
      .update({ ...topicPatchToRow(patch), locked_at: null, locked_by: null })
      .eq("id", topicId)
      .eq("locked_by", lockedBy)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toTopic(data as DiscoveryTopicRow);
  }

  async createRunLog(log: KnowledgeDiscoveryRunLog) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("knowledge_discovery_run_logs").insert(runLogToRow(log)).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    return toRunLog(data as DiscoveryRunLogRow);
  }

  async listRunLogs(filters: { topicId?: string } = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("knowledge_discovery_run_logs").select("*");

    if (filters.topicId) {
      query = query.eq("topic_id", filters.topicId);
    }

    const { data, error } = await query.order("started_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as DiscoveryRunLogRow[]).map(toRunLog);
  }
}

export const jsonKnowledgeDiscoveryRepository = new JsonKnowledgeDiscoveryRepository();
export const supabaseKnowledgeDiscoveryRepository = new SupabaseKnowledgeDiscoveryRepository();
export const knowledgeDiscoveryRepository = selectRepository<KnowledgeDiscoveryRepository>({
  mock: jsonKnowledgeDiscoveryRepository,
  supabase: supabaseKnowledgeDiscoveryRepository
});
