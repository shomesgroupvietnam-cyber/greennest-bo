import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { selectRepository } from "@/lib/db/repository-mode";
import type {
  KnowledgeCandidate,
  KnowledgeCandidateListFilters
} from "@/modules/knowledge/types";

type KnowledgeCandidateStore = {
  candidates: KnowledgeCandidate[];
};

const emptyStore: KnowledgeCandidateStore = {
  candidates: []
};

export type KnowledgeCandidateRepository = {
  listKnowledgeCandidates(filters?: KnowledgeCandidateListFilters): Promise<KnowledgeCandidate[]>;
  getKnowledgeCandidate(candidateId: string): Promise<KnowledgeCandidate | undefined>;
  createKnowledgeCandidate(candidate: KnowledgeCandidate): Promise<KnowledgeCandidate>;
  updateKnowledgeCandidate(candidateId: string, patch: Partial<KnowledgeCandidate>): Promise<KnowledgeCandidate>;
};

export class JsonKnowledgeCandidateRepository implements KnowledgeCandidateRepository {
  constructor(private readonly filePath = path.join(process.cwd(), ".mock-data", "knowledge-candidates.json")) {}

  async listKnowledgeCandidates(filters: KnowledgeCandidateListFilters = {}) {
    const store = await this.readStore();
    const query = filters.query?.trim().toLowerCase();

    return store.candidates
      .filter((candidate) => !filters.module || filters.module === "all" || candidate.module === filters.module)
      .filter((candidate) => !filters.sourceType || filters.sourceType === "all" || candidate.sourceType === filters.sourceType)
      .filter((candidate) => !filters.status || filters.status === "all" || candidate.status === filters.status)
      .filter((candidate) => {
        if (!query) {
          return true;
        }

        return [candidate.title, candidate.extractedText, candidate.notes, candidate.sourceRefId]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query));
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getKnowledgeCandidate(candidateId: string) {
    const store = await this.readStore();

    return store.candidates.find((candidate) => candidate.id === candidateId);
  }

  async createKnowledgeCandidate(candidate: KnowledgeCandidate) {
    const store = await this.readStore();
    await this.writeStore({ candidates: [candidate, ...store.candidates] });

    return candidate;
  }

  async updateKnowledgeCandidate(candidateId: string, patch: Partial<KnowledgeCandidate>) {
    const store = await this.readStore();
    const existingCandidate = store.candidates.find((candidate) => candidate.id === candidateId);

    if (!existingCandidate) {
      throw new Error("KhÃ´ng tÃ¬m tháº¥y Knowledge Candidate.");
    }

    const updatedCandidate = {
      ...existingCandidate,
      ...patch,
      id: existingCandidate.id,
      createdAt: existingCandidate.createdAt
    };

    await this.writeStore({
      candidates: store.candidates.map((candidate) => (candidate.id === candidateId ? updatedCandidate : candidate))
    });

    return updatedCandidate;
  }

  private async readStore(): Promise<KnowledgeCandidateStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<KnowledgeCandidateStore>;

      return { candidates: (parsed.candidates ?? []).map(normalizeKnowledgeCandidate) };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return emptyStore;
      }

      throw error;
    }
  }

  private async writeStore(store: KnowledgeCandidateStore) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  }
}

type KnowledgeCandidateRow = {
  id: string;
  source_type: KnowledgeCandidate["sourceType"];
  source_ref_id: string | null;
  module: KnowledgeCandidate["module"];
  title: string;
  extracted_text: string;
  submitted_by: string;
  status: KnowledgeCandidate["status"];
  promoted_knowledge_item_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function normalizeKnowledgeCandidate(candidate: KnowledgeCandidate): KnowledgeCandidate {
  return {
    ...candidate,
    status: candidate.status ?? "candidate"
  };
}

function toKnowledgeCandidate(row: KnowledgeCandidateRow): KnowledgeCandidate {
  return {
    id: row.id,
    sourceType: row.source_type,
    sourceRefId: row.source_ref_id ?? undefined,
    module: row.module,
    title: row.title,
    extractedText: row.extracted_text,
    submittedBy: row.submitted_by,
    status: row.status,
    promotedKnowledgeItemId: row.promoted_knowledge_item_id ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function candidateToRow(candidate: KnowledgeCandidate) {
  return {
    id: candidate.id,
    source_type: candidate.sourceType,
    source_ref_id: candidate.sourceRefId ?? null,
    module: candidate.module,
    title: candidate.title,
    extracted_text: candidate.extractedText,
    submitted_by: candidate.submittedBy,
    status: candidate.status,
    promoted_knowledge_item_id: candidate.promotedKnowledgeItemId ?? null,
    reviewed_by: candidate.reviewedBy ?? null,
    reviewed_at: candidate.reviewedAt ?? null,
    notes: candidate.notes ?? null,
    created_at: candidate.createdAt,
    updated_at: candidate.updatedAt
  };
}

function candidatePatchToRow(patch: Partial<KnowledgeCandidate>) {
  const has = (key: keyof KnowledgeCandidate) => Object.prototype.hasOwnProperty.call(patch, key);

  return {
    ...(has("sourceType") ? { source_type: patch.sourceType } : {}),
    ...(has("sourceRefId") ? { source_ref_id: patch.sourceRefId ?? null } : {}),
    ...(has("module") ? { module: patch.module } : {}),
    ...(has("title") ? { title: patch.title } : {}),
    ...(has("extractedText") ? { extracted_text: patch.extractedText } : {}),
    ...(has("submittedBy") ? { submitted_by: patch.submittedBy } : {}),
    ...(has("status") ? { status: patch.status } : {}),
    ...(has("promotedKnowledgeItemId") ? { promoted_knowledge_item_id: patch.promotedKnowledgeItemId ?? null } : {}),
    ...(has("reviewedBy") ? { reviewed_by: patch.reviewedBy ?? null } : {}),
    ...(has("reviewedAt") ? { reviewed_at: patch.reviewedAt ?? null } : {}),
    ...(has("notes") ? { notes: patch.notes ?? null } : {}),
    ...(has("updatedAt") ? { updated_at: patch.updatedAt } : {})
  };
}

export class SupabaseKnowledgeCandidateRepository implements KnowledgeCandidateRepository {
  async listKnowledgeCandidates(filters: KnowledgeCandidateListFilters = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("knowledge_candidates").select("*");

    if (filters.module && filters.module !== "all") {
      query = query.eq("module", filters.module);
    }

    if (filters.sourceType && filters.sourceType !== "all") {
      query = query.eq("source_type", filters.sourceType);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.query?.trim()) {
      const search = filters.query.trim().replaceAll(",", " ");
      query = query.or(`title.ilike.%${search}%,extracted_text.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    const { data, error } = await query.order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as KnowledgeCandidateRow[]).map(toKnowledgeCandidate);
  }

  async getKnowledgeCandidate(candidateId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("knowledge_candidates").select("*").eq("id", candidateId).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toKnowledgeCandidate(data as KnowledgeCandidateRow) : undefined;
  }

  async createKnowledgeCandidate(candidate: KnowledgeCandidate) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("knowledge_candidates").insert(candidateToRow(candidate)).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    return toKnowledgeCandidate(data as KnowledgeCandidateRow);
  }

  async updateKnowledgeCandidate(candidateId: string, patch: Partial<KnowledgeCandidate>) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("knowledge_candidates")
      .update(candidatePatchToRow(patch))
      .eq("id", candidateId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toKnowledgeCandidate(data as KnowledgeCandidateRow);
  }
}

export const jsonKnowledgeCandidateRepository = new JsonKnowledgeCandidateRepository();
export const supabaseKnowledgeCandidateRepository = new SupabaseKnowledgeCandidateRepository();
export const knowledgeCandidateRepository = selectRepository<KnowledgeCandidateRepository>({
  mock: jsonKnowledgeCandidateRepository,
  supabase: supabaseKnowledgeCandidateRepository
});
