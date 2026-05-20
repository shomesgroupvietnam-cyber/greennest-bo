import { PROPOSAL_STATUSES, type ProposalStatus } from "@/modules/proposals/types";

const statusClass: Record<ProposalStatus, string> = {
  draft: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  submitted: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  in_review: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  change_requested: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  approved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-1 ring-red-200",
  archived: "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
};

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass[status]}`}>{PROPOSAL_STATUSES[status]}</span>;
}
