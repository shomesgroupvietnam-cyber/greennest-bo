import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { selectRepository } from "@/lib/db/repository-mode";
import type { AiActionProposal, AiCitation, AiInteraction, AiJob, AiListFilters } from "@/modules/ai/types";

type AiStore = {
  interactions: AiInteraction[];
  jobs: AiJob[];
  citations: AiCitation[];
  actionProposals: AiActionProposal[];
};

const emptyStore: AiStore = {
  interactions: [],
  jobs: [],
  citations: [],
  actionProposals: []
};

export type AiRepository = {
  listInteractions(filters?: AiListFilters): Promise<AiInteraction[]>;
  getInteraction(interactionId: string): Promise<AiInteraction | undefined>;
  createInteraction(interaction: AiInteraction): Promise<AiInteraction>;
  updateInteraction(interactionId: string, patch: Partial<AiInteraction>): Promise<AiInteraction>;
  listJobs(filters?: { interactionId?: string; requestedBy?: string; status?: AiJob["status"] | "all" }): Promise<AiJob[]>;
  getJob(jobId: string): Promise<AiJob | undefined>;
  createJob(job: AiJob): Promise<AiJob>;
  updateJob(jobId: string, patch: Partial<AiJob>): Promise<AiJob>;
  createCitations(citations: AiCitation[]): Promise<AiCitation[]>;
  listCitations(filters?: { interactionId?: string; jobId?: string }): Promise<AiCitation[]>;
  createActionProposals(proposals: AiActionProposal[]): Promise<AiActionProposal[]>;
  getActionProposal(proposalId: string): Promise<AiActionProposal | undefined>;
  updateActionProposal(proposalId: string, patch: Partial<AiActionProposal>): Promise<AiActionProposal>;
  listActionProposals(filters?: { interactionId?: string; jobId?: string }): Promise<AiActionProposal[]>;
};

export class JsonAiRepository implements AiRepository {
  constructor(private readonly filePath = path.join(process.cwd(), ".mock-data", "ai-jobs.json")) {}

  async listInteractions(filters: AiListFilters = {}) {
    const store = await this.readStore();

    return store.interactions
      .filter((interaction) => !filters.requestedBy || interaction.requestedBy === filters.requestedBy)
      .filter((interaction) => !filters.projectId || filters.projectId === "all" || interaction.projectId === filters.projectId)
      .filter((interaction) => !filters.module || filters.module === "all" || interaction.module === filters.module)
      .filter((interaction) => !filters.status || filters.status === "all" || interaction.status === filters.status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getInteraction(interactionId: string) {
    const store = await this.readStore();

    return store.interactions.find((interaction) => interaction.id === interactionId);
  }

  async createInteraction(interaction: AiInteraction) {
    const store = await this.readStore();
    await this.writeStore({ ...store, interactions: [interaction, ...store.interactions] });

    return interaction;
  }

  async updateInteraction(interactionId: string, patch: Partial<AiInteraction>) {
    const store = await this.readStore();
    const existing = store.interactions.find((interaction) => interaction.id === interactionId);

    if (!existing) {
      throw new Error("Khong tim thay tuong tac AI.");
    }

    const updated = { ...existing, ...patch, id: existing.id, createdAt: existing.createdAt };

    await this.writeStore({
      ...store,
      interactions: store.interactions.map((interaction) => (interaction.id === interactionId ? updated : interaction))
    });

    return updated;
  }

  async listJobs(filters: { interactionId?: string; requestedBy?: string; status?: AiJob["status"] | "all" } = {}) {
    const store = await this.readStore();

    return store.jobs
      .filter((job) => !filters.interactionId || job.interactionId === filters.interactionId)
      .filter((job) => !filters.requestedBy || job.requestedBy === filters.requestedBy)
      .filter((job) => !filters.status || filters.status === "all" || job.status === filters.status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getJob(jobId: string) {
    const store = await this.readStore();

    return store.jobs.find((job) => job.id === jobId);
  }

  async createJob(job: AiJob) {
    const store = await this.readStore();
    await this.writeStore({ ...store, jobs: [job, ...store.jobs] });

    return job;
  }

  async updateJob(jobId: string, patch: Partial<AiJob>) {
    const store = await this.readStore();
    const existing = store.jobs.find((job) => job.id === jobId);

    if (!existing) {
      throw new Error("Khong tim thay AI job.");
    }

    const updated = { ...existing, ...patch, id: existing.id, createdAt: existing.createdAt };

    await this.writeStore({
      ...store,
      jobs: store.jobs.map((job) => (job.id === jobId ? updated : job))
    });

    return updated;
  }

  async createCitations(citations: AiCitation[]) {
    if (citations.length === 0) {
      return [];
    }

    const store = await this.readStore();
    await this.writeStore({ ...store, citations: [...citations, ...store.citations] });

    return citations;
  }

  async listCitations(filters: { interactionId?: string; jobId?: string } = {}) {
    const store = await this.readStore();

    return store.citations
      .filter((citation) => !filters.interactionId || citation.interactionId === filters.interactionId)
      .filter((citation) => !filters.jobId || citation.jobId === filters.jobId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createActionProposals(proposals: AiActionProposal[]) {
    if (proposals.length === 0) {
      return [];
    }

    const store = await this.readStore();
    await this.writeStore({ ...store, actionProposals: [...proposals, ...store.actionProposals] });

    return proposals;
  }

  async getActionProposal(proposalId: string) {
    const store = await this.readStore();

    return store.actionProposals.find((proposal) => proposal.id === proposalId);
  }

  async updateActionProposal(proposalId: string, patch: Partial<AiActionProposal>) {
    const store = await this.readStore();
    const existing = store.actionProposals.find((proposal) => proposal.id === proposalId);

    if (!existing) {
      throw new Error("Khong tim thay de xuat AI.");
    }

    const updated = { ...existing, ...patch, id: existing.id, createdAt: existing.createdAt };

    await this.writeStore({
      ...store,
      actionProposals: store.actionProposals.map((proposal) => (proposal.id === proposalId ? updated : proposal))
    });

    return updated;
  }

  async listActionProposals(filters: { interactionId?: string; jobId?: string } = {}) {
    const store = await this.readStore();

    return store.actionProposals
      .filter((proposal) => !filters.interactionId || proposal.interactionId === filters.interactionId)
      .filter((proposal) => !filters.jobId || proposal.jobId === filters.jobId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private async readStore(): Promise<AiStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<AiStore>;

      return {
        interactions: parsed.interactions ?? [],
        jobs: parsed.jobs ?? [],
        citations: parsed.citations ?? [],
        actionProposals: parsed.actionProposals ?? []
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return emptyStore;
      }

      throw error;
    }
  }

  private async writeStore(store: AiStore) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  }
}

type AiInteractionRow = {
  id: string;
  requested_by: string;
  project_id: string | null;
  module: AiInteraction["module"];
  intent: string;
  mode: AiInteraction["mode"];
  prompt_summary: string;
  response_text: string | null;
  response_summary: string | null;
  model_provider: string;
  model_name: string;
  usage: AiInteraction["usage"] | null;
  response_validation: AiInteraction["responseValidation"] | null;
  workflow_status: AiInteraction["workflowStatus"] | null;
  status: AiInteraction["status"];
  scope_snapshot: AiInteraction["scopeSnapshot"];
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type AiJobRow = {
  id: string;
  interaction_id: string;
  requested_by: string;
  project_id: string | null;
  module: AiJob["module"];
  intent: string;
  mode: AiJob["mode"];
  priority: AiJob["priority"];
  status: AiJob["status"];
  scope_snapshot: AiJob["scopeSnapshot"];
  rate_limit_key: string;
  payload: AiJob["payload"];
  result_summary: string | null;
  usage: AiJob["usage"] | null;
  response_validation: AiJob["responseValidation"] | null;
  error_code: string | null;
  error_message: string | null;
  locked_by: string | null;
  locked_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

type AiCitationRow = {
  id: string;
  interaction_id: string;
  job_id: string | null;
  citation_type: AiCitation["citationType"];
  entity_type: string | null;
  entity_id: string | null;
  knowledge_item_id: string | null;
  knowledge_chunk_id: string | null;
  title: string;
  source_url: string | null;
  module: AiCitation["module"];
  project_id: string | null;
  access_level: string | null;
  created_at: string;
};

type AiActionProposalRow = {
  id: string;
  interaction_id: string;
  job_id: string | null;
  requested_by: string;
  project_id: string | null;
  module: AiActionProposal["module"];
  action_key: string;
  target_entity_type: string;
  target_entity_id: string | null;
  proposed_payload: Record<string, unknown>;
  rationale: string | null;
  required_permission: AiActionProposal["requiredPermission"];
  workflow_status: AiActionProposal["workflowStatus"] | null;
  status: AiActionProposal["status"];
  decided_by: string | null;
  decided_at: string | null;
  decision_notes: string | null;
  execution_result: unknown | null;
  created_at: string;
  updated_at: string;
};

function toInteraction(row: AiInteractionRow): AiInteraction {
  return {
    id: row.id,
    requestedBy: row.requested_by,
    projectId: row.project_id ?? undefined,
    module: row.module,
    intent: row.intent,
    mode: row.mode,
    promptSummary: row.prompt_summary,
    responseText: row.response_text ?? undefined,
    responseSummary: row.response_summary ?? undefined,
    modelProvider: row.model_provider,
    modelName: row.model_name,
    usage: row.usage ?? undefined,
    responseValidation: row.response_validation ?? undefined,
    workflowStatus: row.workflow_status ?? undefined,
    status: row.status,
    scopeSnapshot: row.scope_snapshot,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function interactionToRow(interaction: AiInteraction) {
  return {
    id: interaction.id,
    requested_by: interaction.requestedBy,
    project_id: interaction.projectId ?? null,
    module: interaction.module,
    intent: interaction.intent,
    mode: interaction.mode,
    prompt_summary: interaction.promptSummary,
    response_text: interaction.responseText ?? null,
    response_summary: interaction.responseSummary ?? null,
    model_provider: interaction.modelProvider,
    model_name: interaction.modelName,
    usage: interaction.usage ?? null,
    response_validation: interaction.responseValidation ?? null,
    workflow_status: interaction.workflowStatus ?? "DRAFT",
    status: interaction.status,
    scope_snapshot: interaction.scopeSnapshot,
    completed_at: interaction.completedAt ?? null,
    created_at: interaction.createdAt,
    updated_at: interaction.updatedAt
  };
}

function toJob(row: AiJobRow): AiJob {
  return {
    id: row.id,
    interactionId: row.interaction_id,
    requestedBy: row.requested_by,
    projectId: row.project_id ?? undefined,
    module: row.module,
    intent: row.intent,
    mode: row.mode,
    priority: row.priority,
    status: row.status,
    scopeSnapshot: row.scope_snapshot,
    rateLimitKey: row.rate_limit_key,
    payload: row.payload,
    resultSummary: row.result_summary ?? undefined,
    usage: row.usage ?? undefined,
    responseValidation: row.response_validation ?? undefined,
    errorCode: row.error_code ?? undefined,
    errorMessage: row.error_message ?? undefined,
    lockedBy: row.locked_by ?? undefined,
    lockedAt: row.locked_at ?? undefined,
    startedAt: row.started_at ?? undefined,
    finishedAt: row.finished_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function jobToRow(job: AiJob) {
  return {
    id: job.id,
    interaction_id: job.interactionId,
    requested_by: job.requestedBy,
    project_id: job.projectId ?? null,
    module: job.module,
    intent: job.intent,
    mode: job.mode,
    priority: job.priority,
    status: job.status,
    scope_snapshot: job.scopeSnapshot,
    rate_limit_key: job.rateLimitKey,
    payload: job.payload,
    result_summary: job.resultSummary ?? null,
    usage: job.usage ?? null,
    response_validation: job.responseValidation ?? null,
    error_code: job.errorCode ?? null,
    error_message: job.errorMessage ?? null,
    locked_by: job.lockedBy ?? null,
    locked_at: job.lockedAt ?? null,
    started_at: job.startedAt ?? null,
    finished_at: job.finishedAt ?? null,
    created_at: job.createdAt,
    updated_at: job.updatedAt
  };
}

function toCitation(row: AiCitationRow): AiCitation {
  return {
    id: row.id,
    interactionId: row.interaction_id,
    jobId: row.job_id ?? undefined,
    citationType: row.citation_type,
    entityType: row.entity_type ?? undefined,
    entityId: row.entity_id ?? undefined,
    knowledgeItemId: row.knowledge_item_id ?? undefined,
    knowledgeChunkId: row.knowledge_chunk_id ?? undefined,
    title: row.title,
    sourceUrl: row.source_url ?? undefined,
    module: row.module,
    projectId: row.project_id ?? undefined,
    accessLevel: row.access_level ?? undefined,
    createdAt: row.created_at
  };
}

function citationToRow(citation: AiCitation) {
  return {
    id: citation.id,
    interaction_id: citation.interactionId,
    job_id: citation.jobId ?? null,
    citation_type: citation.citationType,
    entity_type: citation.entityType ?? null,
    entity_id: citation.entityId ?? null,
    knowledge_item_id: citation.knowledgeItemId ?? null,
    knowledge_chunk_id: citation.knowledgeChunkId ?? null,
    title: citation.title,
    source_url: citation.sourceUrl ?? null,
    module: citation.module,
    project_id: citation.projectId ?? null,
    access_level: citation.accessLevel ?? null,
    created_at: citation.createdAt
  };
}

function toActionProposal(row: AiActionProposalRow): AiActionProposal {
  return {
    id: row.id,
    interactionId: row.interaction_id,
    jobId: row.job_id ?? undefined,
    requestedBy: row.requested_by,
    projectId: row.project_id ?? undefined,
    module: row.module,
    actionKey: row.action_key,
    targetEntityType: row.target_entity_type,
    targetEntityId: row.target_entity_id ?? undefined,
    proposedPayload: row.proposed_payload,
    rationale: row.rationale ?? undefined,
    requiredPermission: row.required_permission,
    workflowStatus: row.workflow_status ?? undefined,
    status: row.status,
    decidedBy: row.decided_by ?? undefined,
    decidedAt: row.decided_at ?? undefined,
    decisionNotes: row.decision_notes ?? undefined,
    executionResult: row.execution_result ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function actionProposalToRow(proposal: AiActionProposal) {
  return {
    id: proposal.id,
    interaction_id: proposal.interactionId,
    job_id: proposal.jobId ?? null,
    requested_by: proposal.requestedBy,
    project_id: proposal.projectId ?? null,
    module: proposal.module,
    action_key: proposal.actionKey,
    target_entity_type: proposal.targetEntityType,
    target_entity_id: proposal.targetEntityId ?? null,
    proposed_payload: proposal.proposedPayload,
    rationale: proposal.rationale ?? null,
    required_permission: proposal.requiredPermission,
    workflow_status: proposal.workflowStatus ?? "REVIEWING",
    status: proposal.status,
    decided_by: proposal.decidedBy ?? null,
    decided_at: proposal.decidedAt ?? null,
    decision_notes: proposal.decisionNotes ?? null,
    execution_result: proposal.executionResult ?? null,
    created_at: proposal.createdAt,
    updated_at: proposal.updatedAt
  };
}

function patchKeys<T extends object>(patch: Partial<T>, mapping: Record<keyof T, string>) {
  const rowPatch: Record<string, unknown> = {};

  for (const key of Object.keys(mapping) as Array<keyof T>) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      rowPatch[mapping[key]] = patch[key];
    }
  }

  return rowPatch;
}

export class SupabaseAiRepository implements AiRepository {
  async listInteractions(filters: AiListFilters = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("ai_interactions").select("*");

    if (filters.requestedBy) {
      query = query.eq("requested_by", filters.requestedBy);
    }

    if (filters.projectId && filters.projectId !== "all") {
      query = query.eq("project_id", filters.projectId);
    }

    if (filters.module && filters.module !== "all") {
      query = query.eq("module", filters.module);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as AiInteractionRow[]).map(toInteraction);
  }

  async getInteraction(interactionId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("ai_interactions").select("*").eq("id", interactionId).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toInteraction(data as AiInteractionRow) : undefined;
  }

  async createInteraction(interaction: AiInteraction) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("ai_interactions").insert(interactionToRow(interaction)).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    return toInteraction(data as AiInteractionRow);
  }

  async updateInteraction(interactionId: string, patch: Partial<AiInteraction>) {
    const supabase = await createSupabaseServerClient();
    const rowPatch = patchKeys<AiInteraction>(patch, {
      id: "id",
      requestedBy: "requested_by",
      projectId: "project_id",
      module: "module",
      intent: "intent",
      mode: "mode",
      promptSummary: "prompt_summary",
      responseText: "response_text",
      responseSummary: "response_summary",
      modelProvider: "model_provider",
      modelName: "model_name",
      usage: "usage",
      responseValidation: "response_validation",
      workflowStatus: "workflow_status",
      status: "status",
      scopeSnapshot: "scope_snapshot",
      completedAt: "completed_at",
      createdAt: "created_at",
      updatedAt: "updated_at"
    });
    const { data, error } = await supabase.from("ai_interactions").update(rowPatch).eq("id", interactionId).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    return toInteraction(data as AiInteractionRow);
  }

  async listJobs(filters: { interactionId?: string; requestedBy?: string; status?: AiJob["status"] | "all" } = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("ai_jobs").select("*");

    if (filters.interactionId) {
      query = query.eq("interaction_id", filters.interactionId);
    }

    if (filters.requestedBy) {
      query = query.eq("requested_by", filters.requestedBy);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as AiJobRow[]).map(toJob);
  }

  async getJob(jobId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("ai_jobs").select("*").eq("id", jobId).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toJob(data as AiJobRow) : undefined;
  }

  async createJob(job: AiJob) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("ai_jobs").insert(jobToRow(job)).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    return toJob(data as AiJobRow);
  }

  async updateJob(jobId: string, patch: Partial<AiJob>) {
    const supabase = await createSupabaseServerClient();
    const rowPatch = patchKeys<AiJob>(patch, {
      id: "id",
      interactionId: "interaction_id",
      requestedBy: "requested_by",
      projectId: "project_id",
      module: "module",
      intent: "intent",
      mode: "mode",
      priority: "priority",
      status: "status",
      scopeSnapshot: "scope_snapshot",
      rateLimitKey: "rate_limit_key",
      payload: "payload",
      resultSummary: "result_summary",
      usage: "usage",
      responseValidation: "response_validation",
      errorCode: "error_code",
      errorMessage: "error_message",
      lockedBy: "locked_by",
      lockedAt: "locked_at",
      startedAt: "started_at",
      finishedAt: "finished_at",
      createdAt: "created_at",
      updatedAt: "updated_at"
    });
    const { data, error } = await supabase.from("ai_jobs").update(rowPatch).eq("id", jobId).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    return toJob(data as AiJobRow);
  }

  async createCitations(citations: AiCitation[]) {
    if (citations.length === 0) {
      return [];
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("ai_citations").insert(citations.map(citationToRow)).select("*");

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as AiCitationRow[]).map(toCitation);
  }

  async listCitations(filters: { interactionId?: string; jobId?: string } = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("ai_citations").select("*");

    if (filters.interactionId) {
      query = query.eq("interaction_id", filters.interactionId);
    }

    if (filters.jobId) {
      query = query.eq("job_id", filters.jobId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as AiCitationRow[]).map(toCitation);
  }

  async createActionProposals(proposals: AiActionProposal[]) {
    if (proposals.length === 0) {
      return [];
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("ai_action_proposals").insert(proposals.map(actionProposalToRow)).select("*");

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as AiActionProposalRow[]).map(toActionProposal);
  }

  async getActionProposal(proposalId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("ai_action_proposals").select("*").eq("id", proposalId).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toActionProposal(data as AiActionProposalRow) : undefined;
  }

  async updateActionProposal(proposalId: string, patch: Partial<AiActionProposal>) {
    const supabase = await createSupabaseServerClient();
    const rowPatch = patchKeys<AiActionProposal>(patch, {
      id: "id",
      interactionId: "interaction_id",
      jobId: "job_id",
      requestedBy: "requested_by",
      projectId: "project_id",
      module: "module",
      actionKey: "action_key",
      targetEntityType: "target_entity_type",
      targetEntityId: "target_entity_id",
      proposedPayload: "proposed_payload",
      rationale: "rationale",
      requiredPermission: "required_permission",
      workflowStatus: "workflow_status",
      status: "status",
      decidedBy: "decided_by",
      decidedAt: "decided_at",
      decisionNotes: "decision_notes",
      executionResult: "execution_result",
      createdAt: "created_at",
      updatedAt: "updated_at"
    });
    const { data, error } = await supabase
      .from("ai_action_proposals")
      .update(rowPatch)
      .eq("id", proposalId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toActionProposal(data as AiActionProposalRow);
  }

  async listActionProposals(filters: { interactionId?: string; jobId?: string } = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("ai_action_proposals").select("*");

    if (filters.interactionId) {
      query = query.eq("interaction_id", filters.interactionId);
    }

    if (filters.jobId) {
      query = query.eq("job_id", filters.jobId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as AiActionProposalRow[]).map(toActionProposal);
  }
}

export const jsonAiRepository = new JsonAiRepository();
export const supabaseAiRepository = new SupabaseAiRepository();
export const aiRepository = selectRepository<AiRepository>({
  mock: jsonAiRepository,
  supabase: supabaseAiRepository
});
