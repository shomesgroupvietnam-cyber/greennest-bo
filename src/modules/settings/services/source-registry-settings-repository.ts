import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { selectRepository } from "@/lib/db/repository-mode";
import type { ManagedSourceRegistryEntry } from "@/modules/knowledge/types";

import { createDefaultManagedSourceRegistry } from "@/modules/knowledge/services/source-registry";

type SourceRegistryStore = {
  entries: ManagedSourceRegistryEntry[];
};

export type SourceRegistrySettingsRepository = {
  listEntries(): Promise<ManagedSourceRegistryEntry[]>;
  getEntry(entryId: string): Promise<ManagedSourceRegistryEntry | undefined>;
  upsertEntry(entry: ManagedSourceRegistryEntry): Promise<ManagedSourceRegistryEntry>;
  setEntryEnabled(entryId: string, enabled: boolean, updatedBy: string, updatedAt: string): Promise<ManagedSourceRegistryEntry>;
};

export class JsonSourceRegistrySettingsRepository implements SourceRegistrySettingsRepository {
  constructor(private readonly filePath = path.join(process.cwd(), ".mock-data", "source-registry-settings.json")) {}

  async listEntries() {
    const store = await this.readStore();

    return store.entries.sort((a, b) => a.domain.localeCompare(b.domain));
  }

  async getEntry(entryId: string) {
    const store = await this.readStore();

    return store.entries.find((entry) => entry.id === entryId);
  }

  async upsertEntry(entry: ManagedSourceRegistryEntry) {
    const store = await this.readStore();
    const existing = store.entries.find((item) => item.id === entry.id || item.domain === entry.domain);
    const nextEntry = existing ? { ...existing, ...entry, id: existing.id, createdAt: existing.createdAt } : entry;

    await this.writeStore({
      entries: existing
        ? store.entries.map((item) => (item.id === existing.id ? nextEntry : item))
        : [...store.entries, nextEntry]
    });

    return nextEntry;
  }

  async setEntryEnabled(entryId: string, enabled: boolean, updatedBy: string, updatedAt: string) {
    const store = await this.readStore();
    const existing = store.entries.find((entry) => entry.id === entryId);

    if (!existing) {
      throw new Error("Khong tim thay source registry entry.");
    }

    const updatedEntry = {
      ...existing,
      enabled,
      updatedBy,
      updatedAt
    };

    await this.writeStore({
      entries: store.entries.map((entry) => (entry.id === entryId ? updatedEntry : entry))
    });

    return updatedEntry;
  }

  private async readStore(): Promise<SourceRegistryStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<SourceRegistryStore>;

      return { entries: parsed.entries ?? createDefaultManagedSourceRegistry() };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (code === "ENOENT") {
        return { entries: createDefaultManagedSourceRegistry() };
      }

      throw error;
    }
  }

  private async writeStore(store: SourceRegistryStore) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  }
}

type SourceRegistryEntryRow = {
  id: string;
  domain: string;
  source_category: ManagedSourceRegistryEntry["sourceCategory"];
  module: ManagedSourceRegistryEntry["module"];
  source_type: ManagedSourceRegistryEntry["sourceType"];
  confidence: ManagedSourceRegistryEntry["confidence"];
  tags: string[] | null;
  enabled: boolean;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

function toEntry(row: SourceRegistryEntryRow): ManagedSourceRegistryEntry {
  return {
    id: row.id,
    domain: row.domain,
    sourceCategory: row.source_category,
    module: row.module,
    sourceType: row.source_type,
    confidence: row.confidence,
    tags: row.tags ?? [],
    enabled: row.enabled,
    notes: row.notes ?? undefined,
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toRow(entry: ManagedSourceRegistryEntry) {
  return {
    id: entry.id,
    domain: entry.domain,
    source_category: entry.sourceCategory,
    module: entry.module,
    source_type: entry.sourceType,
    confidence: entry.confidence,
    tags: entry.tags,
    enabled: entry.enabled,
    notes: entry.notes ?? null,
    created_by: entry.createdBy ?? null,
    updated_by: entry.updatedBy ?? null,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt
  };
}

export class SupabaseSourceRegistrySettingsRepository implements SourceRegistrySettingsRepository {
  async listEntries() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("source_registry_entries").select("*").order("domain", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as SourceRegistryEntryRow[];

    return rows.length > 0 ? rows.map(toEntry) : createDefaultManagedSourceRegistry();
  }

  async getEntry(entryId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("source_registry_entries").select("*").eq("id", entryId).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toEntry(data as SourceRegistryEntryRow) : undefined;
  }

  async upsertEntry(entry: ManagedSourceRegistryEntry) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("source_registry_entries").upsert(toRow(entry), { onConflict: "domain" }).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    return toEntry(data as SourceRegistryEntryRow);
  }

  async setEntryEnabled(entryId: string, enabled: boolean, updatedBy: string, updatedAt: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("source_registry_entries")
      .update({ enabled, updated_by: updatedBy, updated_at: updatedAt })
      .eq("id", entryId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toEntry(data as SourceRegistryEntryRow);
  }
}

export const jsonSourceRegistrySettingsRepository = new JsonSourceRegistrySettingsRepository();
export const supabaseSourceRegistrySettingsRepository = new SupabaseSourceRegistrySettingsRepository();
export const sourceRegistrySettingsRepository = selectRepository<SourceRegistrySettingsRepository>({
  mock: jsonSourceRegistrySettingsRepository,
  supabase: supabaseSourceRegistrySettingsRepository
});
