import { ExternalLink, Eye, Pencil } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DEFAULT_DOCUMENT_CLASSIFICATION,
  DOCUMENT_CLASSIFICATION_LABELS,
  DOCUMENT_TYPES,
} from "@/modules/documents/constants";
import type { Document } from "@/modules/documents/types";
import type { Project } from "@/modules/projects/types";

import { DocumentApprovalStatusBadge, DocumentStatusBadge } from "./document-badges";

type DocumentListTableProps = {
  documents: Document[];
  projects: Project[];
  canUpdate?: boolean;
  canCreate?: boolean;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short"
  }).format(new Date(value));
}

function documentTypeLabel(value: string) {
  return DOCUMENT_TYPES[value as keyof typeof DOCUMENT_TYPES] ?? value;
}

function documentClassificationLabel(value: Document["classification"]) {
  return DOCUMENT_CLASSIFICATION_LABELS[value ?? DEFAULT_DOCUMENT_CLASSIFICATION];
}

export function DocumentListTable({ documents, projects, canUpdate = true, canCreate = true }: DocumentListTableProps) {
  const projectById = new Map(projects.map((project) => [project.id, project]));

  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-white p-8 text-center">
        <h2 className="text-base font-semibold text-slate-950">Chưa có hồ sơ phù hợp</h2>
        <p className="mt-2 text-sm text-slate-600">Tạo hồ sơ mới hoặc điều chỉnh bộ lọc.</p>
        {canCreate ? (
          <Button asChild className="mt-4">
            <Link href="/documents/new">Tạo hồ sơ</Link>
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Hồ sơ</th>
              <th className="px-4 py-3">Dự án</th>
              <th className="px-4 py-3">Loại</th>
              <th className="px-4 py-3">Phân loại</th>
              <th className="px-4 py-3">Phiên bản</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Phê duyệt</th>
              <th className="px-4 py-3">Phụ trách</th>
              <th className="px-4 py-3">Cập nhật</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.map((document) => {
              const project = projectById.get(document.projectId);
              const requiresAttention = document.status === "missing" || document.status === "needs_update" || document.approvalStatus === "rejected";

              return (
                <tr className={requiresAttention ? "align-top bg-amber-50/40 hover:bg-amber-50" : "align-top hover:bg-slate-50"} key={document.id}>
                  <td className="min-w-64 px-4 py-3">
                    <Link className="font-medium text-emerald-700 hover:text-emerald-800" href={`/documents/${document.id}`}>
                      {document.title}
                    </Link>
                    {requiresAttention ? (
                      <p className="mt-1 text-xs font-medium text-amber-800">Cần xử lý trước khi hồ sơ được xem là đầy đủ.</p>
                    ) : null}
                    {document.externalUrl ? (
                      <a
                        className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-700"
                        href={document.externalUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        Mở liên kết ngoài
                      </a>
                    ) : null}
                  </td>
                  <td className="min-w-56 px-4 py-3 text-slate-600">
                    {project ? (
                      <Link className="text-slate-700 hover:text-emerald-700" href={`/projects/${project.id}`}>
                        {project.code} - {project.name}
                      </Link>
                    ) : (
                      "Không rõ"
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{documentTypeLabel(document.docType)}</td>
                  <td className="px-4 py-3 text-slate-600">{documentClassificationLabel(document.classification)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{document.version}</td>
                  <td className="px-4 py-3">
                    <DocumentStatusBadge status={document.status} />
                  </td>
                  <td className="px-4 py-3">
                    <DocumentApprovalStatusBadge status={document.approvalStatus} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{document.ownerId ?? "-"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(document.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/documents/${document.id}`}>
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          Xem
                        </Link>
                      </Button>
                      {canUpdate ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/documents/${document.id}/edit`}>
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            Sửa
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
