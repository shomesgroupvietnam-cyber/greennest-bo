import type { Document } from "@/modules/documents/types";
import type { ExecutiveRiskRecord } from "@/modules/executive/types";
import type { Decision } from "@/modules/meetings/types";
import type { Proposal } from "@/modules/proposals/types";
import type { Task } from "@/modules/tasks/types";

export type MeetingRelatedRecordOption = {
  id: string;
  label: string;
  helper?: string;
};

export type MeetingRelatedRecordOptions = {
  approvals: MeetingRelatedRecordOption[];
  decisions: MeetingRelatedRecordOption[];
  documents: MeetingRelatedRecordOption[];
  risks: MeetingRelatedRecordOption[];
  tasks: MeetingRelatedRecordOption[];
};

export const emptyMeetingRelatedRecordOptions: MeetingRelatedRecordOptions = {
  approvals: [],
  decisions: [],
  documents: [],
  risks: [],
  tasks: [],
};

function trimSummary(value: string, maxLength = 96) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

export function buildMeetingRelatedRecordOptions(input: {
  decisions?: Array<Pick<Decision, "decisionText" | "id" | "projectId" | "projectIds" | "status" | "title">>;
  documents?: Array<Pick<Document, "docType" | "id" | "projectId" | "status" | "title">>;
  proposals?: Array<Pick<Proposal, "code" | "id" | "projectId" | "status" | "title">>;
  risks?: Array<Pick<ExecutiveRiskRecord, "id" | "level" | "projectId" | "status" | "title">>;
  tasks?: Array<Pick<Task, "id" | "projectId" | "status" | "title">>;
}): MeetingRelatedRecordOptions {
  return {
    approvals: (input.proposals ?? []).map((proposal) => ({
      id: proposal.id,
      label: `${proposal.code} - ${proposal.title}`,
      helper: [proposal.status, proposal.projectId].filter(Boolean).join(" · ") || undefined,
    })),
    decisions: (input.decisions ?? []).map((decision) => ({
      id: decision.id,
      label: trimSummary(decision.title ?? decision.decisionText),
      helper: [decision.status, decision.projectId ?? decision.projectIds?.join(", ")].filter(Boolean).join(" · ") || undefined,
    })),
    documents: (input.documents ?? []).map((document) => ({
      id: document.id,
      label: document.title,
      helper: [document.docType, document.status, document.projectId].filter(Boolean).join(" · ") || undefined,
    })),
    risks: (input.risks ?? []).map((risk) => ({
      id: risk.id,
      label: risk.title,
      helper: [risk.level, risk.status, risk.projectId].filter(Boolean).join(" · ") || undefined,
    })),
    tasks: (input.tasks ?? []).map((task) => ({
      id: task.id,
      label: task.title,
      helper: [task.status, task.projectId].filter(Boolean).join(" · ") || undefined,
    })),
  };
}
