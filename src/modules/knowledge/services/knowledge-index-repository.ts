import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { selectRepository } from "@/lib/db/repository-mode";
import type { KnowledgeChunk, KnowledgeChunkFilters } from "@/modules/knowledge/types";

type KnowledgeIndexStore = {
  items?: unknown[];
  chunks: KnowledgeChunk[];
};

const emptyStore: KnowledgeIndexStore = {
  items: [],
  chunks: []
};

export type KnowledgeIndexRepository = {
  listKnowledgeChunks(filters?: KnowledgeChunkFilters): Promise<KnowledgeChunk[]>;
  listKnowledgeChunksByItem(knowledgeItemId: string): Promise<KnowledgeChunk[]>;
  replaceKnowledgeChunksForItem(knowledgeItemId: string, chunks: KnowledgeChunk[]): Promise<KnowledgeChunk[]>;
  updateKnowledgeChunk(chunkId: string, patch: Partial<KnowledgeChunk>): Promise<KnowledgeChunk>;
  deleteKnowledgeChunksForItem(knowledgeItemId: string): Promise<void>;
};

export class JsonKnowledgeIndexRepository implements KnowledgeIndexRepository {
  constructor(private readonly filePath = path.join(process.cwd(), ".mock-data", "knowledge-center.json")) {}

  async listKnowledgeChunks(filters: KnowledgeChunkFilters = {}) {
    const store = await this.readStore();
    const query = filters.query?.trim().toLowerCase();
    const allowedAccessLevels = filters.accessLevels ? new Set(filters.accessLevels) : undefined;

    return store.chunks
      .filter((chunk) => !filters.knowledgeItemId || chunk.knowledgeItemId === filters.knowledgeItemId)
      .filter((chunk) => !filters.module || filters.module === "all" || chunk.module === filters.module)
      .filter((chunk) => !filters.status || filters.status === "all" || chunk.status === filters.status)
      .filter((chunk) => !allowedAccessLevels || allowedAccessLevels.has(chunk.accessLevel))
      .filter((chunk) => !filters.sourceTypes?.length || filters.sourceTypes.includes(chunk.sourceType))
      .filter((chunk) => !query || chunk.chunkText.toLowerCase().includes(query) || chunk.citation.knowledgeTitle.toLowerCase().includes(query))
      .sort((a, b) => {
        const itemOrder = a.knowledgeItemId.localeCompare(b.knowledgeItemId);

        return itemOrder === 0 ? a.chunkOrder - b.chunkOrder : itemOrder;
      });
  }

  async listKnowledgeChunksByItem(knowledgeItemId: string) {
    return this.listKnowledgeChunks({ knowledgeItemId });
  }

  async replaceKnowledgeChunksForItem(knowledgeItemId: string, chunks: KnowledgeChunk[]) {
    const store = await this.readStore();
    const remainingChunks = store.chunks.filter((chunk) => chunk.knowledgeItemId !== knowledgeItemId);

    await this.writeStore({
      ...store,
      chunks: [...remainingChunks, ...chunks]
    });

    return chunks;
  }

  async updateKnowledgeChunk(chunkId: string, patch: Partial<KnowledgeChunk>) {
    const store = await this.readStore();
    const existing = store.chunks.find((chunk) => chunk.id === chunkId);

    if (!existing) {
      throw new Error("Khong tim thay knowledge chunk.");
    }

    const updated = normalizeKnowledgeChunk({ ...existing, ...patch, id: existing.id, createdAt: existing.createdAt });

    await this.writeStore({
      ...store,
      chunks: store.chunks.map((chunk) => (chunk.id === chunkId ? updated : chunk))
    });

    return updated;
  }

  async deleteKnowledgeChunksForItem(knowledgeItemId: string) {
    const store = await this.readStore();

    await this.writeStore({
      ...store,
      chunks: store.chunks.filter((chunk) => chunk.knowledgeItemId !== knowledgeItemId)
    });
  }

  private async readStore(): Promise<KnowledgeIndexStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<KnowledgeIndexStore>;

      return {
        items: parsed.items ?? [],
        chunks: (parsed.chunks ?? []).map(normalizeKnowledgeChunk)
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return emptyStore;
      }

      throw error;
    }
  }

  private async writeStore(store: KnowledgeIndexStore) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  }
}

type KnowledgeChunkRow = {
  id: string;
  knowledge_item_id: string;
  module: KnowledgeChunk["module"];
  chunk_text: string;
  chunk_order: number;
  source_type: KnowledgeChunk["sourceType"];
  status: KnowledgeChunk["status"];
  effective_date: string | null;
  expires_at: string | null;
  access_level: KnowledgeChunk["accessLevel"];
  citation: KnowledgeChunk["citation"];
  embedding: number[] | null;
  embedding_model: string | null;
  embedded_at: string | null;
  created_at: string;
  updated_at: string;
};

function normalizeKnowledgeChunk(chunk: KnowledgeChunk): KnowledgeChunk {
  return {
    ...chunk,
    citation: {
      ...chunk.citation,
      expiresAt: chunk.citation.expiresAt ?? chunk.expiresAt,
      effectiveDate: chunk.citation.effectiveDate ?? chunk.effectiveDate
    }
  };
}

function toKnowledgeChunk(row: KnowledgeChunkRow): KnowledgeChunk {
  return {
    id: row.id,
    knowledgeItemId: row.knowledge_item_id,
    module: row.module,
    chunkText: row.chunk_text,
    chunkOrder: row.chunk_order,
    sourceType: row.source_type,
    status: row.status,
    effectiveDate: row.effective_date ?? undefined,
    expiresAt: row.expires_at ?? undefined,
    accessLevel: row.access_level,
    citation: row.citation,
    embedding: row.embedding ?? undefined,
    embeddingModel: row.embedding_model ?? undefined,
    embeddedAt: row.embedded_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function knowledgeChunkToRow(chunk: KnowledgeChunk) {
  return {
    id: chunk.id,
    knowledge_item_id: chunk.knowledgeItemId,
    module: chunk.module,
    chunk_text: chunk.chunkText,
    chunk_order: chunk.chunkOrder,
    source_type: chunk.sourceType,
    status: chunk.status,
    effective_date: chunk.effectiveDate ?? null,
    expires_at: chunk.expiresAt ?? null,
    access_level: chunk.accessLevel,
    citation: chunk.citation,
    embedding: chunk.embedding ?? null,
    embedding_model: chunk.embeddingModel ?? null,
    embedded_at: chunk.embeddedAt ?? null,
    created_at: chunk.createdAt,
    updated_at: chunk.updatedAt
  };
}

export class SupabaseKnowledgeIndexRepository implements KnowledgeIndexRepository {
  async listKnowledgeChunks(filters: KnowledgeChunkFilters = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("knowledge_chunks").select("*");

    if (filters.knowledgeItemId) {
      query = query.eq("knowledge_item_id", filters.knowledgeItemId);
    }

    if (filters.module && filters.module !== "all") {
      query = query.eq("module", filters.module);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.accessLevels?.length) {
      query = query.in("access_level", filters.accessLevels);
    }

    if (filters.sourceTypes?.length) {
      query = query.in("source_type", filters.sourceTypes);
    }

    if (filters.query?.trim()) {
      const search = filters.query.trim().replaceAll(",", " ");
      query = query.ilike("chunk_text", `%${search}%`);
    }

    const { data, error } = await query.order("knowledge_item_id").order("chunk_order");

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as KnowledgeChunkRow[]).map(toKnowledgeChunk);
  }

  async listKnowledgeChunksByItem(knowledgeItemId: string) {
    return this.listKnowledgeChunks({ knowledgeItemId });
  }

  async replaceKnowledgeChunksForItem(knowledgeItemId: string, chunks: KnowledgeChunk[]) {
    const supabase = await createSupabaseServerClient();
    const { error: deleteError } = await supabase.from("knowledge_chunks").delete().eq("knowledge_item_id", knowledgeItemId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    if (chunks.length === 0) {
      return [];
    }

    const { data, error } = await supabase.from("knowledge_chunks").insert(chunks.map(knowledgeChunkToRow)).select("*");

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as KnowledgeChunkRow[]).map(toKnowledgeChunk);
  }

  async updateKnowledgeChunk(chunkId: string, patch: Partial<KnowledgeChunk>) {
    const supabase = await createSupabaseServerClient();
    const rowPatch = knowledgeChunkPatchToRow(patch);
    const { data, error } = await supabase.from("knowledge_chunks").update(rowPatch).eq("id", chunkId).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    return toKnowledgeChunk(data as KnowledgeChunkRow);
  }

  async deleteKnowledgeChunksForItem(knowledgeItemId: string) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("knowledge_chunks").delete().eq("knowledge_item_id", knowledgeItemId);

    if (error) {
      throw new Error(error.message);
    }
  }
}

function knowledgeChunkPatchToRow(patch: Partial<KnowledgeChunk>) {
  const rowPatch: Record<string, unknown> = {};

  if (Object.prototype.hasOwnProperty.call(patch, "chunkText")) {
    rowPatch.chunk_text = patch.chunkText;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "chunkOrder")) {
    rowPatch.chunk_order = patch.chunkOrder;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "status")) {
    rowPatch.status = patch.status;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "effectiveDate")) {
    rowPatch.effective_date = patch.effectiveDate ?? null;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "expiresAt")) {
    rowPatch.expires_at = patch.expiresAt ?? null;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "accessLevel")) {
    rowPatch.access_level = patch.accessLevel;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "citation")) {
    rowPatch.citation = patch.citation;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "embedding")) {
    rowPatch.embedding = patch.embedding ?? null;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "embeddingModel")) {
    rowPatch.embedding_model = patch.embeddingModel ?? null;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "embeddedAt")) {
    rowPatch.embedded_at = patch.embeddedAt ?? null;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "updatedAt")) {
    rowPatch.updated_at = patch.updatedAt;
  }

  return rowPatch;
}

export const jsonKnowledgeIndexRepository = new JsonKnowledgeIndexRepository();
export const supabaseKnowledgeIndexRepository = new SupabaseKnowledgeIndexRepository();
export const knowledgeIndexRepository = selectRepository<KnowledgeIndexRepository>({
  mock: jsonKnowledgeIndexRepository,
  supabase: supabaseKnowledgeIndexRepository
});
