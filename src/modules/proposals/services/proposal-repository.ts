import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { selectRepository } from "@/lib/db/repository-mode";
import type {
  Proposal,
  ProposalAiReviewStatus,
  ProposalAttachment,
  ProposalAttachmentSource,
  ProposalDecision,
  ProposalDetail,
  ProposalLink,
  ProposalListFilters,
  ProposalPriority,
  ProposalStep,
  ProposalStatus,
  ProposalType,
} from "@/modules/proposals/types";

type ProposalStore = {
  proposals: Proposal[];
  attachments: ProposalAttachment[];
  steps: ProposalStep[];
  links: ProposalLink[];
  decisions: ProposalDecision[];
};

export type ProposalApprovalMutation = {
  decision: ProposalDecision;
  generatedLink?: ProposalLink;
  newStep?: ProposalStep;
  proposalId: string;
  proposalPatch: Partial<Proposal>;
  stepPatch?: {
    patch: Partial<ProposalStep>;
    stepId: string;
  };
};

export type ProposalApprovalMutationResult = {
  decision: ProposalDecision;
  generatedLink?: ProposalLink;
  newStep?: ProposalStep;
  proposal: Proposal;
  step?: ProposalStep;
};

const emptyStore: ProposalStore = {
  proposals: [],
  attachments: [],
  steps: [],
  links: [],
  decisions: []
};

type ProposalRow = {
  id: string;
  code: string;
  title: string;
  type: ProposalType;
  project_id: string | null;
  module: string;
  requested_by: string | null;
  submitted_by?: string | null;
  on_behalf_of?: string | null;
  delegation_id?: string | null;
  owner_id: string | null;
  current_step_id: string | null;
  status: ProposalStatus;
  priority: ProposalPriority;
  amount: number | string | null;
  due_date: string | null;
  summary: string | null;
  ai_review_status: ProposalAiReviewStatus;
  ai_review_summary: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

type ProposalStepRow = {
  id: string;
  proposal_id: string;
  step_order: number;
  approver_role: string | null;
  approver_user_id: string | null;
  required_permission?: string | null;
  threshold_policy_id?: string | null;
  threshold_label?: string | null;
  approval_level?: string | null;
  status: ProposalStep["status"];
  decided_by: string | null;
  decided_at: string | null;
  decision_notes: string | null;
  created_at: string;
  updated_at: string;
};

type ProposalLinkRow = {
  id: string;
  proposal_id: string;
  entity_type: string;
  entity_id: string;
  relation_type: ProposalLink["relationType"];
  created_at: string;
};

type ProposalDecisionRow = {
  id: string;
  proposal_id: string;
  step_id: string | null;
  decision: ProposalDecision["decision"];
  decided_by: string | null;
  decided_at: string;
  notes: string | null;
  version?: number | null;
  previous_status?: ProposalStatus | null;
  next_status?: ProposalStatus | null;
  previous_step_status?: ProposalStep["status"] | null;
  next_step_status?: ProposalStep["status"] | null;
  attachment_ids?: string[] | null;
};

type ProposalAttachmentRow = {
  id: string;
  proposal_id: string;
  name: string;
  source: ProposalAttachmentSource;
  url: string | null;
  external_url: string | null;
  document_id: string | null;
  uploaded_by: string | null;
  uploaded_at: string | null;
  created_at: string;
};

export type ProposalRepository = {
  listProposals(filters?: ProposalListFilters): Promise<Proposal[]>;
  getProposalDetail(proposalId: string): Promise<ProposalDetail | undefined>;
  createProposal(proposal: Proposal, links?: ProposalLink[], attachments?: ProposalAttachment[]): Promise<ProposalDetail>;
  updateProposal(proposalId: string, patch: Partial<Proposal>): Promise<Proposal>;
  addStep(step: ProposalStep): Promise<ProposalStep>;
  updateStep(stepId: string, patch: Partial<ProposalStep>): Promise<ProposalStep>;
  addDecision(decision: ProposalDecision): Promise<ProposalDecision>;
  addLink(link: ProposalLink): Promise<ProposalLink>;
  applyApprovalMutation(mutation: ProposalApprovalMutation): Promise<ProposalApprovalMutationResult>;
};

export class JsonProposalRepository implements ProposalRepository {
  constructor(private readonly filePath = path.join(process.cwd(), ".mock-data", "proposals.json")) {}

  async listProposals(filters: ProposalListFilters = {}) {
    const store = await this.readStore();
    const query = filters.query?.trim().toLowerCase();

    return store.proposals
      .filter((proposal) => !proposal.archivedAt || filters.status === "archived")
      .filter((proposal) => !filters.projectId || filters.projectId === "all" || proposal.projectId === filters.projectId)
      .filter((proposal) => !filters.type || filters.type === "all" || proposal.type === filters.type)
      .filter((proposal) => !filters.status || filters.status === "all" || proposal.status === filters.status)
      .filter((proposal) => !filters.ownerId || filters.ownerId === "all" || proposal.ownerId === filters.ownerId)
      .filter((proposal) => !filters.requestedBy || filters.requestedBy === "all" || proposal.requestedBy === filters.requestedBy)
      .filter((proposal) => {
        if (!query) {
          return true;
        }

        return [proposal.code, proposal.title, proposal.summary, proposal.module].filter(Boolean).some((value) => value?.toLowerCase().includes(query));
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getProposalDetail(proposalId: string) {
    const store = await this.readStore();
    const proposal = store.proposals.find((item) => item.id === proposalId);

    if (!proposal) {
      return undefined;
    }

    return {
      proposal,
      steps: store.steps.filter((step) => step.proposalId === proposalId).sort((a, b) => a.stepOrder - b.stepOrder),
      links: store.links.filter((link) => link.proposalId === proposalId),
      attachments: store.attachments.filter((attachment) => attachment.proposalId === proposalId),
      decisions: store.decisions.filter((decision) => decision.proposalId === proposalId).sort((a, b) => b.decidedAt.localeCompare(a.decidedAt))
    };
  }

  async createProposal(
    proposal: Proposal,
    links: ProposalLink[] = [],
    attachments: ProposalAttachment[] = [],
  ) {
    const store = await this.readStore();

    await this.writeStore({
      ...store,
      proposals: [proposal, ...store.proposals],
      attachments: [...attachments, ...store.attachments],
      links: [...links, ...store.links]
    });

    return {
      proposal,
      steps: [],
      links,
      attachments,
      decisions: []
    };
  }

  async updateProposal(proposalId: string, patch: Partial<Proposal>) {
    const store = await this.readStore();
    const existing = store.proposals.find((proposal) => proposal.id === proposalId);

    if (!existing) {
      throw new Error("Không tìm thấy đề xuất.");
    }

    const updated = {
      ...existing,
      ...patch,
      id: existing.id,
      createdAt: existing.createdAt
    };

    await this.writeStore({
      ...store,
      proposals: store.proposals.map((proposal) => (proposal.id === proposalId ? updated : proposal))
    });

    return updated;
  }

  async addStep(step: ProposalStep) {
    const store = await this.readStore();

    await this.writeStore({ ...store, steps: [step, ...store.steps] });

    return step;
  }

  async updateStep(stepId: string, patch: Partial<ProposalStep>) {
    const store = await this.readStore();
    const existing = store.steps.find((step) => step.id === stepId);

    if (!existing) {
      throw new Error("Không tìm thấy bước duyệt.");
    }

    const updated = { ...existing, ...patch, id: existing.id, createdAt: existing.createdAt };

    await this.writeStore({
      ...store,
      steps: store.steps.map((step) => (step.id === stepId ? updated : step))
    });

    return updated;
  }

  async addDecision(decision: ProposalDecision) {
    const store = await this.readStore();

    await this.writeStore({ ...store, decisions: [decision, ...store.decisions] });

    return decision;
  }

  async addLink(link: ProposalLink) {
    const store = await this.readStore();

    await this.writeStore({ ...store, links: [link, ...store.links] });

    return link;
  }

  async applyApprovalMutation(mutation: ProposalApprovalMutation) {
    const store = await this.readStore();
    const existingProposal = store.proposals.find(
      (proposal) => proposal.id === mutation.proposalId,
    );

    if (!existingProposal) {
      throw new Error("KhÃ´ng tÃ¬m tháº¥y Ä‘á» xuáº¥t.");
    }

    const updatedProposal = {
      ...existingProposal,
      ...mutation.proposalPatch,
      id: existingProposal.id,
      createdAt: existingProposal.createdAt
    };
    let updatedStep: ProposalStep | undefined;

    if (mutation.stepPatch) {
      const existingStep = store.steps.find(
        (step) => step.id === mutation.stepPatch?.stepId,
      );

      if (!existingStep) {
        throw new Error("KhÃ´ng tÃ¬m tháº¥y bÆ°á»›c duyá»‡t.");
      }

      updatedStep = {
        ...existingStep,
        ...mutation.stepPatch.patch,
        id: existingStep.id,
        createdAt: existingStep.createdAt
      };
    }

    await this.writeStore({
      ...store,
      decisions: [mutation.decision, ...store.decisions],
      links: mutation.generatedLink
        ? [mutation.generatedLink, ...store.links]
        : store.links,
      proposals: store.proposals.map((proposal) =>
        proposal.id === mutation.proposalId ? updatedProposal : proposal,
      ),
      steps: [
        ...(mutation.newStep ? [mutation.newStep] : []),
        ...store.steps.map((step) =>
          step.id === mutation.stepPatch?.stepId && updatedStep
            ? updatedStep
            : step,
        ),
      ],
    });

    return {
      decision: mutation.decision,
      generatedLink: mutation.generatedLink,
      newStep: mutation.newStep,
      proposal: updatedProposal,
      step: updatedStep,
    };
  }

  private async readStore(): Promise<ProposalStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<ProposalStore>;

      return {
        proposals: parsed.proposals ?? [],
        attachments: parsed.attachments ?? [],
        steps: parsed.steps ?? [],
        links: parsed.links ?? [],
        decisions: parsed.decisions ?? []
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return emptyStore;
      }

      throw error;
    }
  }

  private async writeStore(store: ProposalStore) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  }
}

function toProposal(row: ProposalRow): Proposal {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    type: row.type,
    projectId: row.project_id ?? undefined,
    module: row.module,
    requestedBy: row.requested_by ?? "",
    submittedBy: row.submitted_by ?? row.requested_by ?? undefined,
    onBehalfOf: row.on_behalf_of ?? undefined,
    delegationId: row.delegation_id ?? undefined,
    ownerId: row.owner_id ?? undefined,
    currentStepId: row.current_step_id ?? undefined,
    status: row.status,
    priority: row.priority,
    amount: row.amount === null ? undefined : Number(row.amount),
    dueDate: row.due_date ?? undefined,
    summary: row.summary ?? undefined,
    aiReviewStatus: row.ai_review_status,
    aiReviewSummary: row.ai_review_summary ?? undefined,
    archivedAt: row.archived_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toProposalStep(row: ProposalStepRow): ProposalStep {
  return {
    id: row.id,
    proposalId: row.proposal_id,
    stepOrder: row.step_order,
    approverRole: row.approver_role ?? undefined,
    approverUserId: row.approver_user_id ?? undefined,
    requiredPermission: row.required_permission ?? undefined,
    thresholdPolicyId: row.threshold_policy_id ?? undefined,
    thresholdLabel: row.threshold_label ?? undefined,
    approvalLevel: row.approval_level ?? undefined,
    status: row.status,
    decidedBy: row.decided_by ?? undefined,
    decidedAt: row.decided_at ?? undefined,
    decisionNotes: row.decision_notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toProposalLink(row: ProposalLinkRow): ProposalLink {
  return {
    id: row.id,
    proposalId: row.proposal_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    relationType: row.relation_type,
    createdAt: row.created_at,
  };
}

function toProposalDecision(row: ProposalDecisionRow): ProposalDecision {
  return {
    id: row.id,
    proposalId: row.proposal_id,
    stepId: row.step_id ?? undefined,
    decision: row.decision,
    decidedBy: row.decided_by ?? "",
    decidedAt: row.decided_at,
    notes: row.notes ?? undefined,
    version: row.version ?? undefined,
    previousStatus: row.previous_status ?? undefined,
    nextStatus: row.next_status ?? undefined,
    previousStepStatus: row.previous_step_status ?? undefined,
    nextStepStatus: row.next_step_status ?? undefined,
    attachmentIds: row.attachment_ids ?? undefined,
  };
}

function toProposalAttachment(row: ProposalAttachmentRow): ProposalAttachment {
  return {
    id: row.id,
    proposalId: row.proposal_id,
    name: row.name,
    source: row.source,
    url: row.url ?? undefined,
    externalUrl: row.external_url ?? undefined,
    documentId: row.document_id ?? undefined,
    uploadedBy: row.uploaded_by ?? undefined,
    uploadedAt: row.uploaded_at ?? undefined,
    createdAt: row.created_at,
  };
}

function proposalToRow(proposal: Proposal) {
  return {
    id: proposal.id,
    code: proposal.code,
    title: proposal.title,
    type: proposal.type,
    project_id: proposal.projectId ?? null,
    module: proposal.module,
    requested_by: proposal.requestedBy || null,
    submitted_by: proposal.submittedBy ?? null,
    on_behalf_of: proposal.onBehalfOf ?? null,
    delegation_id: proposal.delegationId ?? null,
    owner_id: proposal.ownerId ?? null,
    current_step_id: proposal.currentStepId ?? null,
    status: proposal.status,
    priority: proposal.priority,
    amount: proposal.amount ?? null,
    due_date: proposal.dueDate ?? null,
    summary: proposal.summary ?? null,
    ai_review_status: proposal.aiReviewStatus,
    ai_review_summary: proposal.aiReviewSummary ?? null,
    archived_at: proposal.archivedAt ?? null,
    created_at: proposal.createdAt,
    updated_at: proposal.updatedAt,
  };
}

function proposalPatchToRow(patch: Partial<Proposal>) {
  return {
    ...(patch.code !== undefined ? { code: patch.code } : {}),
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.type !== undefined ? { type: patch.type } : {}),
    ...(patch.projectId !== undefined ? { project_id: patch.projectId ?? null } : {}),
    ...(patch.module !== undefined ? { module: patch.module } : {}),
    ...(patch.requestedBy !== undefined ? { requested_by: patch.requestedBy || null } : {}),
    ...(patch.submittedBy !== undefined ? { submitted_by: patch.submittedBy ?? null } : {}),
    ...(patch.onBehalfOf !== undefined ? { on_behalf_of: patch.onBehalfOf ?? null } : {}),
    ...(patch.delegationId !== undefined ? { delegation_id: patch.delegationId ?? null } : {}),
    ...(patch.ownerId !== undefined ? { owner_id: patch.ownerId ?? null } : {}),
    ...(patch.currentStepId !== undefined ? { current_step_id: patch.currentStepId ?? null } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
    ...(patch.amount !== undefined ? { amount: patch.amount ?? null } : {}),
    ...(patch.dueDate !== undefined ? { due_date: patch.dueDate ?? null } : {}),
    ...(patch.summary !== undefined ? { summary: patch.summary ?? null } : {}),
    ...(patch.aiReviewStatus !== undefined ? { ai_review_status: patch.aiReviewStatus } : {}),
    ...(patch.aiReviewSummary !== undefined ? { ai_review_summary: patch.aiReviewSummary ?? null } : {}),
    ...(patch.archivedAt !== undefined ? { archived_at: patch.archivedAt ?? null } : {}),
    ...(patch.updatedAt !== undefined ? { updated_at: patch.updatedAt } : {}),
  };
}

function proposalStepToRow(step: ProposalStep) {
  return {
    id: step.id,
    proposal_id: step.proposalId,
    step_order: step.stepOrder,
    approver_role: step.approverRole ?? null,
    approver_user_id: step.approverUserId ?? null,
    required_permission: step.requiredPermission ?? null,
    threshold_policy_id: step.thresholdPolicyId ?? null,
    threshold_label: step.thresholdLabel ?? null,
    approval_level: step.approvalLevel ?? null,
    status: step.status,
    decided_by: step.decidedBy ?? null,
    decided_at: step.decidedAt ?? null,
    decision_notes: step.decisionNotes ?? null,
    created_at: step.createdAt,
    updated_at: step.updatedAt,
  };
}

function proposalStepPatchToRow(patch: Partial<ProposalStep>) {
  return {
    ...(patch.stepOrder !== undefined ? { step_order: patch.stepOrder } : {}),
    ...(patch.approverRole !== undefined ? { approver_role: patch.approverRole ?? null } : {}),
    ...(patch.approverUserId !== undefined ? { approver_user_id: patch.approverUserId ?? null } : {}),
    ...(patch.requiredPermission !== undefined ? { required_permission: patch.requiredPermission ?? null } : {}),
    ...(patch.thresholdPolicyId !== undefined ? { threshold_policy_id: patch.thresholdPolicyId ?? null } : {}),
    ...(patch.thresholdLabel !== undefined ? { threshold_label: patch.thresholdLabel ?? null } : {}),
    ...(patch.approvalLevel !== undefined ? { approval_level: patch.approvalLevel ?? null } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.decidedBy !== undefined ? { decided_by: patch.decidedBy ?? null } : {}),
    ...(patch.decidedAt !== undefined ? { decided_at: patch.decidedAt ?? null } : {}),
    ...(patch.decisionNotes !== undefined ? { decision_notes: patch.decisionNotes ?? null } : {}),
    ...(patch.updatedAt !== undefined ? { updated_at: patch.updatedAt } : {}),
  };
}

function proposalLinkToRow(link: ProposalLink) {
  return {
    id: link.id,
    proposal_id: link.proposalId,
    entity_type: link.entityType,
    entity_id: link.entityId,
    relation_type: link.relationType,
    created_at: link.createdAt,
  };
}

function proposalDecisionToRow(decision: ProposalDecision) {
  return {
    id: decision.id,
    proposal_id: decision.proposalId,
    step_id: decision.stepId ?? null,
    decision: decision.decision,
    decided_by: decision.decidedBy || null,
    decided_at: decision.decidedAt,
    notes: decision.notes ?? null,
    version: decision.version ?? null,
    previous_status: decision.previousStatus ?? null,
    next_status: decision.nextStatus ?? null,
    previous_step_status: decision.previousStepStatus ?? null,
    next_step_status: decision.nextStepStatus ?? null,
    attachment_ids: decision.attachmentIds ?? [],
  };
}

function proposalAttachmentToRow(attachment: ProposalAttachment) {
  return {
    id: attachment.id,
    proposal_id: attachment.proposalId,
    name: attachment.name,
    source: attachment.source,
    url: attachment.url ?? null,
    external_url: attachment.externalUrl ?? null,
    document_id: attachment.documentId ?? null,
    uploaded_by: attachment.uploadedBy ?? null,
    uploaded_at: attachment.uploadedAt ?? null,
    created_at: attachment.createdAt,
  };
}

function assertNoSupabaseError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

export class SupabaseProposalRepository implements ProposalRepository {
  async listProposals(filters: ProposalListFilters = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("proposals").select("*");

    if (filters.status !== "archived") {
      query = query.is("archived_at", null);
    }

    if (filters.projectId && filters.projectId !== "all") {
      query = query.eq("project_id", filters.projectId);
    }

    if (filters.type && filters.type !== "all") {
      query = query.eq("type", filters.type);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.ownerId && filters.ownerId !== "all") {
      query = query.eq("owner_id", filters.ownerId);
    }

    if (filters.requestedBy && filters.requestedBy !== "all") {
      query = query.eq("requested_by", filters.requestedBy);
    }

    const { data, error } = await query.order("updated_at", { ascending: false });

    assertNoSupabaseError(error);

    const queryText = filters.query?.trim().toLowerCase();

    return ((data ?? []) as ProposalRow[])
      .map(toProposal)
      .filter((proposal) => {
        if (!queryText) {
          return true;
        }

        return [proposal.code, proposal.title, proposal.summary, proposal.module]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(queryText));
      });
  }

  async getProposalDetail(proposalId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: proposalData, error: proposalError } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .maybeSingle();

    assertNoSupabaseError(proposalError);

    if (!proposalData) {
      return undefined;
    }

    const [
      { data: stepData, error: stepError },
      { data: linkData, error: linkError },
      { data: attachmentData, error: attachmentError },
      { data: decisionData, error: decisionError },
    ] = await Promise.all([
      supabase
        .from("proposal_steps")
        .select("*")
        .eq("proposal_id", proposalId)
        .order("step_order", { ascending: true }),
      supabase.from("proposal_links").select("*").eq("proposal_id", proposalId),
      supabase.from("proposal_attachments").select("*").eq("proposal_id", proposalId),
      supabase
        .from("proposal_decisions")
        .select("*")
        .eq("proposal_id", proposalId)
        .order("decided_at", { ascending: false }),
    ]);

    assertNoSupabaseError(stepError);
    assertNoSupabaseError(linkError);
    assertNoSupabaseError(attachmentError);
    assertNoSupabaseError(decisionError);

    return {
      proposal: toProposal(proposalData as ProposalRow),
      steps: ((stepData ?? []) as ProposalStepRow[]).map(toProposalStep),
      links: ((linkData ?? []) as ProposalLinkRow[]).map(toProposalLink),
      attachments: ((attachmentData ?? []) as ProposalAttachmentRow[]).map(toProposalAttachment),
      decisions: ((decisionData ?? []) as ProposalDecisionRow[]).map(toProposalDecision),
    };
  }

  async createProposal(
    proposal: Proposal,
    links: ProposalLink[] = [],
    attachments: ProposalAttachment[] = [],
  ) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("proposals")
      .insert(proposalToRow(proposal))
      .select("*")
      .single();

    assertNoSupabaseError(error);

    if (links.length > 0) {
      const { error: linkError } = await supabase
        .from("proposal_links")
        .insert(links.map(proposalLinkToRow));

      assertNoSupabaseError(linkError);
    }

    if (attachments.length > 0) {
      const { error: attachmentError } = await supabase
        .from("proposal_attachments")
        .insert(attachments.map(proposalAttachmentToRow));

      assertNoSupabaseError(attachmentError);
    }

    return {
      proposal: toProposal(data as ProposalRow),
      steps: [],
      links,
      attachments,
      decisions: [],
    };
  }

  async updateProposal(proposalId: string, patch: Partial<Proposal>) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("proposals")
      .update(proposalPatchToRow(patch))
      .eq("id", proposalId)
      .select("*")
      .single();

    assertNoSupabaseError(error);

    return toProposal(data as ProposalRow);
  }

  async addStep(step: ProposalStep) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("proposal_steps")
      .insert(proposalStepToRow(step))
      .select("*")
      .single();

    assertNoSupabaseError(error);

    return toProposalStep(data as ProposalStepRow);
  }

  async updateStep(stepId: string, patch: Partial<ProposalStep>) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("proposal_steps")
      .update(proposalStepPatchToRow(patch))
      .eq("id", stepId)
      .select("*")
      .single();

    assertNoSupabaseError(error);

    return toProposalStep(data as ProposalStepRow);
  }

  async addDecision(decision: ProposalDecision) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("proposal_decisions")
      .insert(proposalDecisionToRow(decision))
      .select("*")
      .single();

    assertNoSupabaseError(error);

    return toProposalDecision(data as ProposalDecisionRow);
  }

  async addLink(link: ProposalLink) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("proposal_links")
      .insert(proposalLinkToRow(link))
      .select("*")
      .single();

    assertNoSupabaseError(error);

    return toProposalLink(data as ProposalLinkRow);
  }

  async applyApprovalMutation(mutation: ProposalApprovalMutation) {
    const supabase = await createSupabaseServerClient();
    let updatedStep: ProposalStep | undefined;
    let newStep: ProposalStep | undefined;
    let generatedLink: ProposalLink | undefined;

    if (mutation.stepPatch) {
      const { data, error } = await supabase
        .from("proposal_steps")
        .update(proposalStepPatchToRow(mutation.stepPatch.patch))
        .eq("id", mutation.stepPatch.stepId)
        .select("*")
        .single();

      assertNoSupabaseError(error);
      updatedStep = toProposalStep(data as ProposalStepRow);
    }

    if (mutation.newStep) {
      newStep = await this.addStep(mutation.newStep);
    }

    if (mutation.generatedLink) {
      generatedLink = await this.addLink(mutation.generatedLink);
    }

    const decision = await this.addDecision(mutation.decision);
    const proposal = await this.updateProposal(mutation.proposalId, mutation.proposalPatch);

    return {
      decision,
      generatedLink,
      newStep,
      proposal,
      step: updatedStep,
    };
  }
}

export const jsonProposalRepository = new JsonProposalRepository();
export const supabaseProposalRepository = new SupabaseProposalRepository();
export const proposalRepository = selectRepository<ProposalRepository>({
  mock: jsonProposalRepository,
  supabase: supabaseProposalRepository,
});
