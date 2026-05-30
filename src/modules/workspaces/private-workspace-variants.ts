import type { ExecutivePrivateWorkspaceVariant } from "@/modules/workspaces/types";

export type PrivateWorkspaceVariantConfig = {
  label: string;
  description: string;
  priorityGroups: string[];
};

export const PRIVATE_WORKSPACE_VARIANTS: Record<
  ExecutivePrivateWorkspaceVariant,
  PrivateWorkspaceVariantConfig
> = {
  chairman: {
    label: "Chairman Command",
    description: "Portfolio KPI, critical risk, overdue approval and strategic decisions.",
    priorityGroups: ["Portfolio", "Risk", "Approval", "Decision", "Finance"],
  },
  ceo: {
    label: "CEO Operations Control",
    description: "Operation KPI, approval queue, escalation and cross-project deadlines.",
    priorityGroups: ["Operation", "Approval", "Risk", "Deadline", "Meeting"],
  },
  project_director: {
    label: "Project War Room",
    description: "Assigned projects, project health, approval, blocker and project deadlines.",
    priorityGroups: ["Assigned project", "Risk", "Approval", "Deadline", "Meeting"],
  },
  department_head: {
    label: "Department Workflow",
    description: "Workstream scope, specialist dossiers, approvals and department meetings.",
    priorityGroups: ["Department", "Approval", "Risk", "Deadline", "Meeting"],
  },
  secretary_assistant: {
    label: "Secretary Briefing Desk",
    description: "Principal schedule, submission dossiers, meeting documents and reminders.",
    priorityGroups: ["Schedule", "Submission", "Meeting", "Reminder"],
  },
  viewer: {
    label: "Read-only Viewer",
    description: "Read-only summary and allowed source links.",
    priorityGroups: ["Summary", "Project", "Meeting", "Decision"],
  },
};

export function getPrivateWorkspaceVariantConfig(
  variant: ExecutivePrivateWorkspaceVariant,
) {
  return PRIVATE_WORKSPACE_VARIANTS[variant];
}
