import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { selectRepository } from "@/lib/db/repository-mode";
import type { LegalStep } from "@/modules/legal/types";
import type { Project, ProjectListFilters } from "@/modules/projects/types";

type ProjectStore = {
  projects: Project[];
  legalSteps: LegalStep[];
};

const emptyStore: ProjectStore = {
  projects: [],
  legalSteps: []
};

export type ProjectRepository = {
  listProjects(filters?: ProjectListFilters): Promise<Project[]>;
  getProject(projectId: string): Promise<Project | undefined>;
  createProject(project: Project, legalSteps: LegalStep[]): Promise<Project>;
  updateProject(projectId: string, patch: Partial<Project>): Promise<Project>;
  archiveProject(projectId: string, archivedAt: string): Promise<Project>;
  listLegalSteps(projectId: string): Promise<LegalStep[]>;
  isProjectCodeTaken(code: string, excludeProjectId?: string): Promise<boolean>;
};

export class JsonProjectRepository implements ProjectRepository {
  constructor(private readonly filePath = path.join(process.cwd(), ".mock-data", "project-core.json")) {}

  async listProjects(filters: ProjectListFilters = {}) {
    const store = await this.readStore();
    const query = filters.query?.trim().toLowerCase();

    return store.projects
      .filter((project) => filters.includeArchived || !project.archivedAt)
      .filter((project) => !filters.status || filters.status === "all" || project.status === filters.status)
      .filter((project) => {
        if (!query) {
          return true;
        }

        return [project.code, project.name, project.location, project.projectType, project.investor, project.ownerName]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query));
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getProject(projectId: string) {
    const store = await this.readStore();

    return store.projects.find((project) => project.id === projectId);
  }

  async createProject(project: Project, legalSteps: LegalStep[]) {
    const store = await this.readStore();
    await this.writeStore({
      projects: [project, ...store.projects],
      legalSteps: [...legalSteps, ...store.legalSteps]
    });

    return project;
  }

  async updateProject(projectId: string, patch: Partial<Project>) {
    const store = await this.readStore();
    const existingProject = store.projects.find((project) => project.id === projectId);

    if (!existingProject) {
      throw new Error("Không tìm thấy dự án.");
    }

    const updatedProject = {
      ...existingProject,
      ...patch,
      id: existingProject.id,
      createdAt: existingProject.createdAt
    };

    await this.writeStore({
      ...store,
      projects: store.projects.map((project) => (project.id === projectId ? updatedProject : project))
    });

    return updatedProject;
  }

  async archiveProject(projectId: string, archivedAt: string) {
    return this.updateProject(projectId, {
      archivedAt,
      status: "archived",
      updatedAt: archivedAt
    });
  }

  async listLegalSteps(projectId: string) {
    const store = await this.readStore();

    return store.legalSteps
      .filter((step) => step.projectId === projectId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async isProjectCodeTaken(code: string, excludeProjectId?: string) {
    const store = await this.readStore();
    const normalizedCode = code.trim().toUpperCase();

    return store.projects.some((project) => project.code === normalizedCode && project.id !== excludeProjectId);
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

type ProjectRow = {
  id: string;
  code: string;
  name: string;
  location: string | null;
  area: number | null;
  project_type: string | null;
  investor: string | null;
  status: Project["status"];
  owner_name: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

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

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    location: row.location ?? undefined,
    area: row.area ?? undefined,
    projectType: row.project_type ?? undefined,
    investor: row.investor ?? undefined,
    status: row.status,
    ownerName: row.owner_name ?? undefined,
    ownerId: row.owner_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at ?? undefined
  };
}

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

function projectToRow(project: Project) {
  return {
    id: project.id,
    code: project.code,
    name: project.name,
    location: project.location ?? null,
    area: project.area ?? null,
    project_type: project.projectType ?? null,
    investor: project.investor ?? null,
    status: project.status,
    owner_name: project.ownerName ?? null,
    owner_id: project.ownerId ?? null,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
    archived_at: project.archivedAt ?? null
  };
}

function legalStepToRow(step: LegalStep) {
  return {
    id: step.id,
    project_id: step.projectId,
    step_code: step.stepCode,
    step_name: step.stepName,
    status: step.status,
    assignee_id: step.assigneeId ?? null,
    due_date: step.dueDate ?? null,
    completed_date: step.completedDate ?? null,
    notes: step.notes ?? null,
    related_document_ids: step.relatedDocumentIds ?? [],
    created_at: step.createdAt,
    updated_at: step.updatedAt
  };
}

export class SupabaseProjectRepository implements ProjectRepository {
  async listProjects(filters: ProjectListFilters = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("projects").select("*").order("updated_at", { ascending: false });

    if (!filters.includeArchived) {
      query = query.is("archived_at", null);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.query?.trim()) {
      const search = filters.query.trim().replaceAll(",", " ");
      query = query.or(
        `code.ilike.%${search}%,name.ilike.%${search}%,location.ilike.%${search}%,project_type.ilike.%${search}%,investor.ilike.%${search}%,owner_name.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as ProjectRow[]).map(toProject);
  }

  async getProject(projectId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toProject(data as ProjectRow) : undefined;
  }

  async createProject(project: Project, legalSteps: LegalStep[]) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("projects").insert(projectToRow(project)).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    if (legalSteps.length > 0) {
      const { error: legalError } = await supabase.from("legal_steps").insert(legalSteps.map(legalStepToRow));

      if (legalError) {
        throw new Error(legalError.message);
      }
    }

    return toProject(data as ProjectRow);
  }

  async updateProject(projectId: string, patch: Partial<Project>) {
    const supabase = await createSupabaseServerClient();
    const updatePatch = {
      ...(patch.code !== undefined ? { code: patch.code } : {}),
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.location !== undefined ? { location: patch.location ?? null } : {}),
      ...(patch.area !== undefined ? { area: patch.area ?? null } : {}),
      ...(patch.projectType !== undefined ? { project_type: patch.projectType ?? null } : {}),
      ...(patch.investor !== undefined ? { investor: patch.investor ?? null } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.ownerName !== undefined ? { owner_name: patch.ownerName ?? null } : {}),
      ...(patch.ownerId !== undefined ? { owner_id: patch.ownerId ?? null } : {}),
      ...(patch.updatedAt !== undefined ? { updated_at: patch.updatedAt } : {}),
      ...(patch.archivedAt !== undefined ? { archived_at: patch.archivedAt ?? null } : {})
    };
    const { data, error } = await supabase.from("projects").update(updatePatch).eq("id", projectId).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    return toProject(data as ProjectRow);
  }

  async archiveProject(projectId: string, archivedAt: string) {
    return this.updateProject(projectId, {
      archivedAt,
      status: "archived",
      updatedAt: archivedAt
    });
  }

  async listLegalSteps(projectId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("legal_steps")
      .select("*")
      .eq("project_id", projectId)
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as LegalStepRow[]).map(toLegalStep);
  }

  async isProjectCodeTaken(code: string, excludeProjectId?: string) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("projects").select("id").eq("code", code.trim().toUpperCase()).limit(1);

    if (excludeProjectId) {
      query = query.neq("id", excludeProjectId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return Boolean(data?.length);
  }
}

export const jsonProjectRepository = new JsonProjectRepository();
export const supabaseProjectRepository = new SupabaseProjectRepository();
export const projectRepository = selectRepository<ProjectRepository>({
  mock: jsonProjectRepository,
  supabase: supabaseProjectRepository
});
