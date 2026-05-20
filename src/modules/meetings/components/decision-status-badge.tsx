import { DECISION_STATUSES, type DecisionStatus } from "@/constants/statuses";

const statusClassName: Record<DecisionStatus, string> = {
  open: "bg-slate-100 text-slate-700",
  in_progress: "bg-amber-100 text-amber-800",
  done: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-200 text-slate-600"
};

export function DecisionStatusBadge({ status }: { status: DecisionStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClassName[status]}`}>
      {DECISION_STATUSES[status]}
    </span>
  );
}
