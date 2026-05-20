import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { selectRepository } from "@/lib/db/repository-mode";
import type { KnowledgeChunk, KnowledgeItem, KnowledgeListFilters } from "@/modules/knowledge/types";

type KnowledgeStore = {
  items: KnowledgeItem[];
  chunks?: KnowledgeChunk[];
};

const emptyStore: KnowledgeStore = {
  items: [],
  chunks: []
};

export type KnowledgeRepository = {
  listKnowledgeItems(filters?: KnowledgeListFilters): Promise<KnowledgeItem[]>;
  getKnowledgeItem(itemId: string): Promise<KnowledgeItem | undefined>;
  createKnowledgeItem(item: KnowledgeItem): Promise<KnowledgeItem>;
  updateKnowledgeItem(itemId: string, patch: Partial<KnowledgeItem>): Promise<KnowledgeItem>;
};

export class JsonKnowledgeRepository implements KnowledgeRepository {
  constructor(private readonly filePath = path.join(process.cwd(), ".mock-data", "knowledge-center.json")) {}

  async listKnowledgeItems(filters: KnowledgeListFilters = {}) {
    const store = await this.readStore();
    const query = filters.query?.trim().toLowerCase();

    return store.items
      .filter((item) => !filters.module || filters.module === "all" || item.module === filters.module)
      .filter((item) => !filters.sourceType || filters.sourceType === "all" || item.sourceType === filters.sourceType)
      .filter((item) => !filters.status || filters.status === "all" || item.status === filters.status)
      .filter((item) => !filters.confidence || filters.confidence === "all" || item.confidence === filters.confidence)
      .filter((item) => {
        if (!query) {
          return true;
        }

        return [item.title, item.summary, item.notes, item.jurisdiction, item.sourceUrl, ...item.tags]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query));
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getKnowledgeItem(itemId: string) {
    const store = await this.readStore();

    return store.items.find((item) => item.id === itemId);
  }

  async createKnowledgeItem(item: KnowledgeItem) {
    const store = await this.readStore();
    await this.writeStore({ ...store, items: [item, ...store.items] });

    return item;
  }

  async updateKnowledgeItem(itemId: string, patch: Partial<KnowledgeItem>) {
    const store = await this.readStore();
    const existingItem = store.items.find((item) => item.id === itemId);

    if (!existingItem) {
      throw new Error("Không tìm thấy nguồn tri thức.");
    }

    const updatedItem = {
      ...existingItem,
      ...patch,
      id: existingItem.id,
      createdAt: existingItem.createdAt
    };

    await this.writeStore({
      ...store,
      items: store.items.map((item) => (item.id === itemId ? updatedItem : item))
    });

    return updatedItem;
  }

  private async readStore(): Promise<KnowledgeStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<KnowledgeStore>;

      return {
        items: (parsed.items ?? []).map(normalizeKnowledgeItem),
        chunks: parsed.chunks ?? []
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return emptyStore;
      }

      throw error;
    }
  }

  private async writeStore(store: KnowledgeStore) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  }
}

type KnowledgeItemRow = {
  id: string;
  title: string;
  source_url: string | null;
  source_file_id: string | null;
  source_type: KnowledgeItem["sourceType"];
  module: KnowledgeItem["module"];
  jurisdiction: string | null;
  effective_date: string | null;
  expiry_date: string | null;
  status: KnowledgeItem["status"];
  confidence: KnowledgeItem["confidence"];
  tags: string[] | null;
  summary: string | null;
  notes: string | null;
  reviewed_by: string | null;
  approved_by: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  created_by: string | null;
  is_rag_eligible: boolean;
  created_at: string;
  updated_at: string;
};

function normalizeKnowledgeItem(item: KnowledgeItem): KnowledgeItem {
  return {
    ...item,
    tags: item.tags ?? [],
    isRagEligible: item.status === "approved" && item.isRagEligible === true
  };
}

function toKnowledgeItem(row: KnowledgeItemRow): KnowledgeItem {
  return {
    id: row.id,
    title: row.title,
    sourceUrl: row.source_url ?? undefined,
    sourceFileId: row.source_file_id ?? undefined,
    sourceType: row.source_type,
    module: row.module,
    jurisdiction: row.jurisdiction ?? undefined,
    effectiveDate: row.effective_date ?? undefined,
    expiryDate: row.expiry_date ?? undefined,
    status: row.status,
    confidence: row.confidence,
    tags: row.tags ?? [],
    summary: row.summary ?? undefined,
    notes: row.notes ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    approvedBy: row.approved_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    createdBy: row.created_by ?? undefined,
    isRagEligible: row.is_rag_eligible,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function knowledgeItemToRow(item: KnowledgeItem) {
  return {
    id: item.id,
    title: item.title,
    source_url: item.sourceUrl ?? null,
    source_file_id: item.sourceFileId ?? null,
    source_type: item.sourceType,
    module: item.module,
    jurisdiction: item.jurisdiction ?? null,
    effective_date: item.effectiveDate ?? null,
    expiry_date: item.expiryDate ?? null,
    status: item.status,
    confidence: item.confidence,
    tags: item.tags,
    summary: item.summary ?? null,
    notes: item.notes ?? null,
    reviewed_by: item.reviewedBy ?? null,
    approved_by: item.approvedBy ?? null,
    reviewed_at: item.reviewedAt ?? null,
    approved_at: item.approvedAt ?? null,
    created_by: item.createdBy ?? null,
    is_rag_eligible: item.isRagEligible,
    created_at: item.createdAt,
    updated_at: item.updatedAt
  };
}

function knowledgePatchToRow(patch: Partial<KnowledgeItem>) {
  const has = (key: keyof KnowledgeItem) => Object.prototype.hasOwnProperty.call(patch, key);

  return {
    ...(has("title") ? { title: patch.title } : {}),
    ...(has("sourceUrl") ? { source_url: patch.sourceUrl ?? null } : {}),
    ...(has("sourceFileId") ? { source_file_id: patch.sourceFileId ?? null } : {}),
    ...(has("sourceType") ? { source_type: patch.sourceType } : {}),
    ...(has("module") ? { module: patch.module } : {}),
    ...(has("jurisdiction") ? { jurisdiction: patch.jurisdiction ?? null } : {}),
    ...(has("effectiveDate") ? { effective_date: patch.effectiveDate ?? null } : {}),
    ...(has("expiryDate") ? { expiry_date: patch.expiryDate ?? null } : {}),
    ...(has("status") ? { status: patch.status } : {}),
    ...(has("confidence") ? { confidence: patch.confidence } : {}),
    ...(has("tags") ? { tags: patch.tags } : {}),
    ...(has("summary") ? { summary: patch.summary ?? null } : {}),
    ...(has("notes") ? { notes: patch.notes ?? null } : {}),
    ...(has("reviewedBy") ? { reviewed_by: patch.reviewedBy ?? null } : {}),
    ...(has("approvedBy") ? { approved_by: patch.approvedBy ?? null } : {}),
    ...(has("reviewedAt") ? { reviewed_at: patch.reviewedAt ?? null } : {}),
    ...(has("approvedAt") ? { approved_at: patch.approvedAt ?? null } : {}),
    ...(has("isRagEligible") ? { is_rag_eligible: patch.isRagEligible } : {}),
    ...(has("updatedAt") ? { updated_at: patch.updatedAt } : {})
  };
}

export class SupabaseKnowledgeRepository implements KnowledgeRepository {
  async listKnowledgeItems(filters: KnowledgeListFilters = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("knowledge_items").select("*");

    if (filters.module && filters.module !== "all") {
      query = query.eq("module", filters.module);
    }

    if (filters.sourceType && filters.sourceType !== "all") {
      query = query.eq("source_type", filters.sourceType);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.confidence && filters.confidence !== "all") {
      query = query.eq("confidence", filters.confidence);
    }

    if (filters.query?.trim()) {
      const search = filters.query.trim().replaceAll(",", " ");
      query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%,notes.ilike.%${search}%,jurisdiction.ilike.%${search}%`);
    }

    const { data, error } = await query.order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as KnowledgeItemRow[]).map(toKnowledgeItem);
  }

  async getKnowledgeItem(itemId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("knowledge_items").select("*").eq("id", itemId).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toKnowledgeItem(data as KnowledgeItemRow) : undefined;
  }

  async createKnowledgeItem(item: KnowledgeItem) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("knowledge_items").insert(knowledgeItemToRow(item)).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    return toKnowledgeItem(data as KnowledgeItemRow);
  }

  async updateKnowledgeItem(itemId: string, patch: Partial<KnowledgeItem>) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("knowledge_items")
      .update(knowledgePatchToRow(patch))
      .eq("id", itemId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toKnowledgeItem(data as KnowledgeItemRow);
  }
}

export const jsonKnowledgeRepository = new JsonKnowledgeRepository();
export const supabaseKnowledgeRepository = new SupabaseKnowledgeRepository();
export const knowledgeRepository = selectRepository<KnowledgeRepository>({
  mock: jsonKnowledgeRepository,
  supabase: supabaseKnowledgeRepository
});
