import {
  KNOWLEDGE_CONFIDENCE_LEVELS,
  KNOWLEDGE_STATUSES,
  type KnowledgeConfidence,
  type KnowledgeStatus
} from "@/modules/knowledge/types";
import { cn } from "@/lib/utils";

const statusClasses: Record<KnowledgeStatus, string> = {
  discovered: "bg-slate-100 text-slate-700",
  imported: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  pending_review: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-1 ring-red-200",
  expired: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  superseded: "bg-purple-50 text-purple-700 ring-1 ring-purple-200"
};

const confidenceClasses: Record<KnowledgeConfidence, string> = {
  official: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  internal_approved: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  external_reference: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  unknown: "bg-slate-100 text-slate-700"
};

export function KnowledgeStatusBadge({ status }: { status: KnowledgeStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", statusClasses[status])}>
      {KNOWLEDGE_STATUSES[status]}
    </span>
  );
}

export function KnowledgeConfidenceBadge({ confidence }: { confidence: KnowledgeConfidence }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", confidenceClasses[confidence])}>
      {KNOWLEDGE_CONFIDENCE_LEVELS[confidence]}
    </span>
  );
}

export function RagEligibilityBadge({ eligible }: { eligible: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        eligible ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-700"
      )}
    >
      {eligible ? "Được đưa vào RAG" : "Chưa vào RAG"}
    </span>
  );
}
