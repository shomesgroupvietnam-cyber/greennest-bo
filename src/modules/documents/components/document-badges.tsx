import {
  DOCUMENT_APPROVAL_STATUSES,
  DOCUMENT_STATUSES,
  type DocumentApprovalStatus,
  type DocumentStatus
} from "@/constants/statuses";
import { cn } from "@/lib/utils";

const statusClasses: Record<DocumentStatus, string> = {
  missing: "bg-red-50 text-red-700 ring-1 ring-red-200",
  draft: "bg-slate-100 text-slate-700",
  in_review: "bg-blue-50 text-blue-700",
  complete: "bg-emerald-50 text-emerald-700",
  needs_update: "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
};

type DocumentStatusBadgeProps = {
  status: DocumentStatus;
};

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", statusClasses[status])}>
      {DOCUMENT_STATUSES[status]}
    </span>
  );
}

const approvalStatusClasses: Record<DocumentApprovalStatus, string> = {
  not_submitted: "bg-slate-100 text-slate-700",
  pending: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  approved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  rejected: "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
};

type DocumentApprovalStatusBadgeProps = {
  status?: DocumentApprovalStatus;
};

export function DocumentApprovalStatusBadge({ status }: DocumentApprovalStatusBadgeProps) {
  const resolvedStatus = status ?? "not_submitted";

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", approvalStatusClasses[resolvedStatus])}>
      {DOCUMENT_APPROVAL_STATUSES[resolvedStatus]}
    </span>
  );
}
