import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { selectRepository } from "@/lib/db/repository-mode";
import type { DocumentRequirementListFilters, DocumentRequirementTemplate } from "@/modules/documents/types";

type DocumentRequirementStore = {
  requirements: DocumentRequirementTemplate[];
};

const emptyStore: DocumentRequirementStore = {
  requirements: []
};

export type DocumentRequirementRepository = {
  listRequirements(filters?: DocumentRequirementListFilters): Promise<DocumentRequirementTemplate[]>;
  upsertRequirement(requirement: DocumentRequirementTemplate): Promise<DocumentRequirementTemplate>;
};

export class JsonDocumentRequirementRepository implements DocumentRequirementRepository {
  constructor(private readonly filePath = path.join(process.cwd(), ".mock-data", "document-requirements.json")) {}

  async listRequirements(filters: DocumentRequirementListFilters = {}) {
    const store = await this.readStore();

    return store.requirements
      .filter((requirement) => !filters.projectType || filters.projectType === "all" || requirement.projectType === filters.projectType)
      .filter((requirement) => !filters.docType || filters.docType === "all" || requirement.docType === filters.docType)
      .filter((requirement) => filters.isRequired === undefined || filters.isRequired === "all" || requirement.isRequired === filters.isRequired)
      .sort((a, b) => a.orderIndex - b.orderIndex || a.requirementName.localeCompare(b.requirementName, "vi"));
  }

  async upsertRequirement(requirement: DocumentRequirementTemplate) {
    const store = await this.readStore();
    const nextRequirements = store.requirements.filter((existing) => existing.id !== requirement.id);

    await this.writeStore({
      requirements: [requirement, ...nextRequirements]
    });

    return requirement;
  }

  private async readStore(): Promise<DocumentRequirementStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<DocumentRequirementStore>;

      return {
        requirements: parsed.requirements ?? []
      };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (code === "ENOENT") {
        return emptyStore;
      }

      throw error;
    }
  }

  private async writeStore(store: DocumentRequirementStore) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  }
}

type DocumentRequirementRow = {
  id: string;
  project_type: string;
  requirement_code: string;
  requirement_name: string;
  doc_type: string;
  required_phase: string | null;
  legal_step_code: string | null;
  is_required: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
};

function toRequirement(row: DocumentRequirementRow): DocumentRequirementTemplate {
  return {
    id: row.id,
    projectType: row.project_type,
    requirementCode: row.requirement_code,
    requirementName: row.requirement_name,
    docType: row.doc_type,
    requiredPhase: row.required_phase ?? undefined,
    legalStepCode: row.legal_step_code ?? undefined,
    isRequired: row.is_required,
    orderIndex: row.order_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function requirementToRow(requirement: DocumentRequirementTemplate) {
  return {
    id: requirement.id,
    project_type: requirement.projectType,
    requirement_code: requirement.requirementCode,
    requirement_name: requirement.requirementName,
    doc_type: requirement.docType,
    required_phase: requirement.requiredPhase ?? null,
    legal_step_code: requirement.legalStepCode ?? null,
    is_required: requirement.isRequired,
    order_index: requirement.orderIndex,
    created_at: requirement.createdAt,
    updated_at: requirement.updatedAt
  };
}

export class SupabaseDocumentRequirementRepository implements DocumentRequirementRepository {
  async listRequirements(filters: DocumentRequirementListFilters = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("document_requirements").select("*");

    if (filters.projectType && filters.projectType !== "all") {
      query = query.eq("project_type", filters.projectType);
    }

    if (filters.docType && filters.docType !== "all") {
      query = query.eq("doc_type", filters.docType);
    }

    if (filters.isRequired !== undefined && filters.isRequired !== "all") {
      query = query.eq("is_required", filters.isRequired);
    }

    const { data, error } = await query.order("order_index", { ascending: true }).order("requirement_name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as DocumentRequirementRow[]).map(toRequirement);
  }

  async upsertRequirement(requirement: DocumentRequirementTemplate) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("document_requirements")
      .upsert(requirementToRow(requirement), { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toRequirement(data as DocumentRequirementRow);
  }
}

export const jsonDocumentRequirementRepository = new JsonDocumentRequirementRepository();
export const supabaseDocumentRequirementRepository = new SupabaseDocumentRequirementRepository();
export const documentRequirementRepository = selectRepository<DocumentRequirementRepository>({
  mock: jsonDocumentRequirementRepository,
  supabase: supabaseDocumentRequirementRepository
});
