import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Proposal, ProposalDecision, ProposalDetail, ProposalLink, ProposalListFilters, ProposalStep } from "@/modules/proposals/types";

type ProposalStore = {
  proposals: Proposal[];
  steps: ProposalStep[];
  links: ProposalLink[];
  decisions: ProposalDecision[];
};

const emptyStore: ProposalStore = {
  proposals: [],
  steps: [],
  links: [],
  decisions: []
};

export type ProposalRepository = {
  listProposals(filters?: ProposalListFilters): Promise<Proposal[]>;
  getProposalDetail(proposalId: string): Promise<ProposalDetail | undefined>;
  createProposal(proposal: Proposal, links?: ProposalLink[]): Promise<ProposalDetail>;
  updateProposal(proposalId: string, patch: Partial<Proposal>): Promise<Proposal>;
  addStep(step: ProposalStep): Promise<ProposalStep>;
  updateStep(stepId: string, patch: Partial<ProposalStep>): Promise<ProposalStep>;
  addDecision(decision: ProposalDecision): Promise<ProposalDecision>;
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
      decisions: store.decisions.filter((decision) => decision.proposalId === proposalId).sort((a, b) => b.decidedAt.localeCompare(a.decidedAt))
    };
  }

  async createProposal(proposal: Proposal, links: ProposalLink[] = []) {
    const store = await this.readStore();

    await this.writeStore({
      ...store,
      proposals: [proposal, ...store.proposals],
      links: [...links, ...store.links]
    });

    return {
      proposal,
      steps: [],
      links,
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

  private async readStore(): Promise<ProposalStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<ProposalStore>;

      return {
        proposals: parsed.proposals ?? [],
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

export const proposalRepository = new JsonProposalRepository();
