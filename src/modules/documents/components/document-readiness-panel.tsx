import { AlertTriangle, CheckCircle2, FileText, LinkIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DOCUMENT_TYPES } from "@/modules/documents/constants";
import type { ProjectDocumentReadiness } from "@/modules/documents/types";

type DocumentReadinessPanelProps = {
  readiness: ProjectDocumentReadiness;
  canCreateDocument?: boolean;
  compact?: boolean;
};

const readinessLabels = {
  complete: "Đã đủ",
  submitted: "Đã nộp, chưa hoàn tất",
  missing: "Thiếu",
  needs_update: "Cần bổ sung",
  optional_missing: "Chưa có"
};

const readinessClasses = {
  complete: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  submitted: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  missing: "bg-red-50 text-red-700 ring-1 ring-red-200",
  needs_update: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  optional_missing: "bg-slate-100 text-slate-700"
};

function documentTypeLabel(value: string) {
  return DOCUMENT_TYPES[value as keyof typeof DOCUMENT_TYPES] ?? value;
}

export function DocumentReadinessPanel({ readiness, canCreateDocument = false, compact = false }: DocumentReadinessPanelProps) {
  const attentionItems = readiness.items.filter((item) => item.status === "missing" || item.status === "needs_update");
  const visibleItems = compact ? attentionItems.slice(0, 5) : readiness.items;

  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Mức sẵn sàng hồ sơ</h2>
          <p className="mt-1 text-sm text-slate-600">
            Đối chiếu hồ sơ đã nộp với checklist bắt buộc theo loại dự án{readiness.projectType ? `: ${readiness.projectType}` : "."}
          </p>
        </div>
        <div className="min-w-32 rounded-md bg-slate-50 px-4 py-3 text-right">
          <p className="text-xs font-medium text-slate-500">Hoàn tất</p>
          <p className="text-2xl font-semibold text-slate-950">{readiness.completionRatio}%</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-slate-200 p-3">
          <p className="text-xs font-medium text-slate-500">Bắt buộc</p>
          <p className="mt-1 text-xl font-semibold text-slate-950">{readiness.requiredCount}</p>
        </div>
        <div className="rounded-md border border-red-100 bg-red-50/60 p-3">
          <p className="text-xs font-medium text-red-700">Thiếu</p>
          <p className="mt-1 text-xl font-semibold text-red-800">{readiness.missingRequirements.length}</p>
        </div>
        <div className="rounded-md border border-amber-100 bg-amber-50/70 p-3">
          <p className="text-xs font-medium text-amber-700">Cần bổ sung</p>
          <p className="mt-1 text-xl font-semibold text-amber-800">{readiness.needsUpdateRequirements.length}</p>
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed p-4 text-sm text-slate-600">
          Chưa có checklist hồ sơ cho loại dự án này. Bổ sung template để hệ thống tự phát hiện hồ sơ còn thiếu.
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-100">
          {visibleItems.map((item) => {
            const isAttention = item.status === "missing" || item.status === "needs_update";

            return (
              <div className={isAttention ? "bg-amber-50/40 px-3 py-3" : "px-3 py-3"} key={item.requirement.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.status === "complete" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                      ) : isAttention ? (
                        <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                      ) : (
                        <FileText className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      )}
                      <p className="text-sm font-medium text-slate-950">{item.requirement.requirementName}</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {documentTypeLabel(item.requirement.docType)}
                      {item.requirement.requiredPhase ? ` · Giai đoạn: ${item.requirement.requiredPhase}` : ""}
                      {item.relatedLegalStepName ? ` · Pháp lý: ${item.relatedLegalStepName}` : ""}
                    </p>
                    {item.matchingDocuments.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.matchingDocuments.slice(0, 3).map((document) => (
                          <Link
                            className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100 hover:text-emerald-800"
                            href={`/documents/${document.id}`}
                            key={document.id}
                          >
                            <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            {document.title}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${readinessClasses[item.status]}`}>
                      {readinessLabels[item.status]}
                    </span>
                    {canCreateDocument && isAttention ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/documents/new?projectId=${readiness.projectId}&docType=${item.requirement.docType}`}>Bổ sung</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {compact && readiness.items.length > visibleItems.length ? (
        <Button asChild className="mt-4" variant="outline">
          <Link href={`/documents/requirements?projectId=${readiness.projectId}`}>Xem checklist hồ sơ</Link>
        </Button>
      ) : null}
    </section>
  );
}
