import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { selectRepository } from "@/lib/db/repository-mode";
import type { LegalStep, LegalStepListFilters } from "@/modules/legal/types";
import type { Project } from "@/modules/projects/types";

type ProjectStore = {
  projects: Project[];
  legalSteps: LegalStep[];
};

const emptyStore: ProjectStore = {
  projects: [],
  legalSteps: []
};

export type LegalRepository = {
  listLegalSteps(filters?: LegalStepListFilters): Promise<LegalStep[]>;
  getLegalStep(stepId: string): Promise<LegalStep | undefined>;
  updateLegalStep(stepId: string, patch: Partial<LegalStep>): Promise<LegalStep>;
};

export class JsonLegalRepository implements LegalRepository {
  constructor(private readonly filePath = path.join(process.cwd(), ".mock-data", "project-core.json")) {}

  async listLegalSteps(filters: LegalStepListFilters = {}) {
    const store = await this.readStore();

    return store.legalSteps
      .filter((step) => !filters.projectId || filters.projectId === "all" || step.projectId === filters.projectId)
      .filter((step) => !filters.status || filters.status === "all" || step.status === filters.status)
      .filter((step) => !filters.assigneeId || filters.assigneeId === "all" || step.assigneeId === filters.assigneeId)
      .sort((a, b) => {
        const projectCompare = a.projectId.localeCompare(b.projectId);

        return projectCompare === 0 ? a.createdAt.localeCompare(b.createdAt) : projectCompare;
      });
  }

  async getLegalStep(stepId: string) {
    const store = await this.readStore();

    return store.legalSteps.find((step) => step.id === stepId);
  }

  async updateLegalStep(stepId: string, patch: Partial<LegalStep>) {
    const store = await this.readStore();
    const existingStep = store.legalSteps.find((step) => step.id === stepId);

    if (!existingStep) {
      throw new Error("Không tìm thấy bước pháp lý.");
    }

    const updatedStep = {
      ...existingStep,
      ...patch,
      id: existingStep.id,
      projectId: existingStep.projectId,
      stepCode: existingStep.stepCode,
      stepName: existingStep.stepName,
      createdAt: existingStep.createdAt
    };

    await this.writeStore({
      ...store,
      legalSteps: store.legalSteps.map((step) => (step.id === stepId ? updatedStep : step))
    });

    return updatedStep;
  }

  private async readStore(): Promise<ProjectStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<ProjectStore>;

      return {
        projects: parsed.projects ?? [],
        legalSteps: parsed.legalSteps ?? []
      };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (code === "ENOENT") {
        return emptyStore;
      }

      throw error;
    }
  }

  private async writeStore(store: ProjectStore) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  }
}

type LegalStepRow = {
  id: string;
  project_id: string;
  step_code: LegalStep["stepCode"];
  step_name: string;
  status: LegalStep["status"];
  assignee_id: string | null;
  due_date: string | null;
  completed_date: string | null;
  notes: string | null;
  related_document_ids: string[] | null;
  created_at: string;
  updated_at: string;
};

function toLegalStep(row: LegalStepRow): LegalStep {
  return {
    id: row.id,
    projectId: row.project_id,
    stepCode: row.step_code,
    stepName: row.step_name,
    status: row.status,
    assigneeId: row.assignee_id ?? undefined,
    dueDate: row.due_date ?? undefined,
    completedDate: row.completed_date ?? undefined,
    notes: row.notes ?? undefined,
    relatedDocumentIds: row.related_document_ids ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function legalStepPatchToRow(patch: Partial<LegalStep>) {
  return {
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.assigneeId !== undefined ? { assignee_id: patch.assigneeId ?? null } : {}),
    ...(patch.dueDate !== undefined ? { due_date: patch.dueDate ?? null } : {}),
    ...(patch.completedDate !== undefined ? { completed_date: patch.completedDate ?? null } : {}),
    ...(patch.notes !== undefined ? { notes: patch.notes ?? null } : {}),
    ...(patch.relatedDocumentIds !== undefined ? { related_document_ids: patch.relatedDocumentIds ?? [] } : {}),
    ...(patch.updatedAt !== undefined ? { updated_at: patch.updatedAt } : {})
  };
}

export class SupabaseLegalRepository implements LegalRepository {
  async listLegalSteps(filters: LegalStepListFilters = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("legal_steps").select("*");

    if (filters.projectId && filters.projectId !== "all") {
      query = query.eq("project_id", filters.projectId);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.assigneeId && filters.assigneeId !== "all") {
      query = query.eq("assignee_id", filters.assigneeId);
    }

    const { data, error } = await query
      .order("project_id", { ascending: true })
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as LegalStepRow[]).map(toLegalStep);
  }

  async getLegalStep(stepId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("legal_steps").select("*").eq("id", stepId).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toLegalStep(data as LegalStepRow) : undefined;
  }

  async updateLegalStep(stepId: string, patch: Partial<LegalStep>) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("legal_steps").update(legalStepPatchToRow(patch)).eq("id", stepId).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    return toLegalStep(data as LegalStepRow);
  }
}

export const jsonLegalRepository = new JsonLegalRepository();
export const supabaseLegalRepository = new SupabaseLegalRepository();
export const legalRepository = selectRepository<LegalRepository>({
  mock: jsonLegalRepository,
  supabase: supabaseLegalRepository
});
