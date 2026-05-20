import { FileText } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Document } from "@/modules/documents/types";
import { updateLegalStepAction } from "@/modules/legal/actions";
import type { LegalStep } from "@/modules/legal/types";
import type { Project } from "@/modules/projects/types";

import { LegalStatusBadge } from "./legal-status-badge";
import { LegalStepUpdateForm } from "./legal-step-update-form";

type LegalChecklistListProps = {
  canUpdate?: boolean;
  documents: Document[];
  projects: Project[];
  steps: LegalStep[];
};

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short"
  }).format(new Date(value));
}

export function LegalChecklistList({ canUpdate = true, documents, projects, steps }: LegalChecklistListProps) {
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const documentsByProjectId = new Map<string, Document[]>();
  const documentById = new Map(documents.map((document) => [document.id, document]));

  for (const document of documents) {
    const projectDocuments = documentsByProjectId.get(document.projectId) ?? [];
    projectDocuments.push(document);
    documentsByProjectId.set(document.projectId, projectDocuments);
  }

  if (steps.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-white p-8 text-center">
        <h2 className="text-base font-semibold text-slate-950">Chưa có bước pháp lý phù hợp</h2>
        <p className="mt-2 text-sm text-slate-600">Tạo dự án mới để khởi tạo checklist 12 bước mặc định.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/projects/new">Tạo dự án</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const project = projectById.get(step.projectId);
        const projectDocuments = documentsByProjectId.get(step.projectId) ?? [];
        const relatedDocuments = (step.relatedDocumentIds ?? [])
          .map((documentId) => documentById.get(documentId))
          .filter((document) => document !== undefined);
        const requiresAttention = step.status === "blocked" || step.status === "waiting_authority";
        const updateAction = updateLegalStepAction.bind(null, step.id);

        return (
          <article
            className={
              requiresAttention
                ? "rounded-lg border border-amber-200 bg-amber-50/50 p-4 shadow-sm"
                : "rounded-lg border bg-white p-4 shadow-sm"
            }
            key={step.id}
          >
            <div className="grid gap-4 lg:grid-cols-[48px_minmax(0,1fr)_160px_140px_140px]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                {index + 1}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-950">{step.stepName}</h2>
                  <LegalStatusBadge status={step.status} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {project ? (
                    <Link className="text-emerald-700 hover:text-emerald-800" href={`/projects/${project.id}`}>
                      {project.code} - {project.name}
                    </Link>
                  ) : (
                    "Dự án không rõ"
                  )}
                </p>
                {requiresAttention ? (
                  <p className="mt-2 text-xs font-medium text-amber-800">
                    {step.status === "blocked" ? "Bước này đang bị vướng." : "Đang chờ phản hồi từ cơ quan."}
                  </p>
                ) : null}
              </div>
              <div>
                <p className="text-xs text-slate-500">Phụ trách</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{step.assigneeId ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Deadline</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{formatDate(step.dueDate)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Hoàn thành</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{formatDate(step.completedDate)}</p>
              </div>
            </div>

            {step.notes ? <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{step.notes}</p> : null}

            {relatedDocuments.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {relatedDocuments.map((document) => (
                  <Button asChild key={document.id} size="sm" variant="outline">
                    <Link href={`/documents/${document.id}`}>
                      <FileText className="h-4 w-4" aria-hidden="true" />
                      {document.title}
                    </Link>
                  </Button>
                ))}
              </div>
            ) : null}

            {canUpdate ? (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-emerald-700 hover:text-emerald-800">
                  Cập nhật bước pháp lý
                </summary>
                <LegalStepUpdateForm action={updateAction} documents={projectDocuments} step={step} />
              </details>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

