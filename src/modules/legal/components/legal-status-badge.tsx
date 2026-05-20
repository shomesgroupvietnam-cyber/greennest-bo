import { LEGAL_STATUSES, type LegalStatus } from "@/constants/statuses";
import { cn } from "@/lib/utils";

const statusClasses: Record<LegalStatus, string> = {
  not_started: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-50 text-blue-700",
  waiting_authority: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  done: "bg-emerald-50 text-emerald-700",
  blocked: "bg-red-50 text-red-700 ring-1 ring-red-200"
};

type LegalStatusBadgeProps = {
  status: LegalStatus;
};

export function LegalStatusBadge({ status }: LegalStatusBadgeProps) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", statusClasses[status])}>
      {LEGAL_STATUSES[status]}
    </span>
  );
}

