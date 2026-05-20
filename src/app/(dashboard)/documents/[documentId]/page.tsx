import { ArrowLeft, ExternalLink, FileText, Pencil, Send, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { getScopedDocument, getScopedProject } from "@/lib/permissions/scoped-resources";
import {
  approveDocumentAction,
  rejectDocumentAction,
  submitDocumentForReviewAction
} from "@/modules/documents/actions";
import { DOCUMENT_TYPES } from "@/modules/documents/constants";
import { DocumentApprovalStatusBadge, DocumentStatusBadge } from "@/modules/documents/components/document-badges";
import { getDocument, listDocumentVersions } from "@/modules/documents/services/document-service";
import { getProject } from "@/modules/projects/services/project-service";

type DocumentDetailPageProps = {
  params: Promise<{ documentId: string }>;
};

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function documentTypeLabel(value: string) {
  return DOCUMENT_TYPES[value as keyof typeof DOCUMENT_TYPES] ?? value;
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const { documentId } = await params;
  const currentUser = await getCurrentUser();
  const rawDocument = await getDocument(documentId);

  if (!rawDocument) {
    notFound();
  }

  const document = await getScopedDocument(currentUser, documentId);

  if (!document) {
    return (
      <PageShell title="Không có quyền truy cập" description="Hồ sơ này không nằm trong phạm vi được giao của bạn.">
        <UnauthorizedState backHref="/documents" backLabel="Về danh sách hồ sơ" title="Bạn không có quyền xem hồ sơ này" />
      </PageShell>
    );
  }

  const [project, versions] = await Promise.all([
    (await getScopedProject(currentUser, document.projectId)) ?? getProject(document.projectId),
    listDocumentVersions(document.id)
  ]);
  const canUpdateDocument = can(currentUser, "document.update", document);
  const canApproveDocument = can(currentUser, "document.approve", document);
  const requiresAttention = document.status === "missing" || document.status === "needs_update" || document.approvalStatus === "rejected";
  const submitAction = submitDocumentForReviewAction.bind(null, document.id);
  const approveAction = approveDocumentAction.bind(null, document.id);
  const rejectAction = rejectDocumentAction.bind(null, document.id);

  return (
    <PageShell title={document.title} description="Chi tiết hồ sơ dự án, trạng thái, phê duyệt, phiên bản và liên kết tài liệu.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href="/documents">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Danh sách hồ sơ
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          {canUpdateDocument ? (
            <Button asChild variant="outline">
              <Link href={`/documents/${document.id}/edit`}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Sửa hồ sơ
              </Link>
            </Button>
          ) : null}
          {canUpdateDocument && document.approvalStatus !== "pending" && document.status !== "missing" ? (
            <form action={submitAction}>
              <Button type="submit" variant="outline">
                <Send className="h-4 w-4" aria-hidden="true" />
                Gửi duyệt
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      {requiresAttention ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            Hồ sơ này đang {document.approvalStatus === "rejected" ? "bị yêu cầu cập nhật" : document.status === "missing" ? "thiếu" : "cần bổ sung"}.
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Cập nhật link, phiên bản, ghi chú hoặc gửi lại duyệt khi có tài liệu mới.
          </p>
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Trạng thái hồ sơ</p>
          <div className="mt-2">
            <DocumentStatusBadge status={document.status} />
          </div>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Phê duyệt</p>
          <div className="mt-2">
            <DocumentApprovalStatusBadge status={document.approvalStatus} />
          </div>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Phiên bản</p>
          <p className="mt-2 text-sm font-medium text-slate-950">{document.version}</p>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Loại hồ sơ</p>
          <p className="mt-2 text-sm font-medium text-slate-950">{documentTypeLabel(document.docType)}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Thông tin hồ sơ</h2>
            <dl className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-500">Dự án</dt>
                <dd className="mt-1 text-sm font-medium text-slate-950">
                  {project ? (
                    <Link className="text-emerald-700 hover:text-emerald-800" href={`/projects/${project.id}`}>
                      {project.code} - {project.name}
                    </Link>
                  ) : (
                    "Không rõ"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Người phụ trách</dt>
                <dd className="mt-1 text-sm font-medium text-slate-950">{document.ownerId ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Người duyệt</dt>
                <dd className="mt-1 text-sm font-medium text-slate-950">{document.reviewerId ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Ngày duyệt</dt>
                <dd className="mt-1 text-sm font-medium text-slate-950">{formatDateTime(document.reviewedAt)}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Ngày tạo</dt>
                <dd className="mt-1 text-sm font-medium text-slate-950">{formatDateTime(document.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Cập nhật</dt>
                <dd className="mt-1 text-sm font-medium text-slate-950">{formatDateTime(document.updatedAt)}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-sm text-slate-500">Ghi chú duyệt</dt>
                <dd className="mt-1 text-sm font-medium text-slate-950">{document.approvalNotes ?? "-"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Lịch sử phiên bản</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {versions.map((version) => (
                <div className="flex flex-wrap items-start justify-between gap-3 py-3" key={version.id}>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{version.version}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Cập nhật: {formatDateTime(version.uploadedAt)} · Người cập nhật: {version.uploadedBy ?? "-"}
                    </p>
                    {version.notes ? <p className="mt-1 text-xs text-slate-600">{version.notes}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {version.externalUrl ? (
                      <Button asChild size="sm" variant="outline">
                        <a href={version.externalUrl} rel="noreferrer" target="_blank">External URL</a>
                      </Button>
                    ) : null}
                    {version.fileUrl ? (
                      <Button asChild size="sm" variant="outline">
                        <a href={version.fileUrl} rel="noreferrer" target="_blank">File URL</a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
              {versions.length === 0 ? <p className="py-3 text-sm text-slate-600">Chưa có lịch sử phiên bản.</p> : null}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Liên kết tài liệu</h2>
            {document.externalUrl ? (
              <Button asChild className="mt-4" variant="outline">
                <a href={document.externalUrl} rel="noreferrer" target="_blank">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Mở external URL
                </a>
              </Button>
            ) : null}
            {document.fileUrl ? (
              <Button asChild className="mt-4" variant="outline">
                <a href={document.fileUrl} rel="noreferrer" target="_blank">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Mở file URL
                </a>
              </Button>
            ) : null}
            {!document.externalUrl && !document.fileUrl ? (
              <p className="mt-3 text-sm text-slate-600">Chưa có link tài liệu. Supabase Storage vẫn là luồng chuẩn bị, chưa upload thật.</p>
            ) : null}
            {project ? (
              <Button asChild className="mt-4" variant="ghost">
                <Link href={`/documents?projectId=${project.id}`}>Xem hồ sơ cùng dự án</Link>
              </Button>
            ) : null}
          </section>

          {canApproveDocument ? (
            <section className="rounded-lg border bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">Duyệt hồ sơ</h2>
              <form action={approveAction} className="mt-4 space-y-3">
                <textarea
                  className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  name="approvalNotes"
                  placeholder="Ghi chú duyệt nếu có"
                />
                <Button type="submit">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Duyệt hồ sơ
                </Button>
              </form>
              <form action={rejectAction} className="mt-5 space-y-3 border-t pt-4">
                <textarea
                  className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  name="approvalNotes"
                  placeholder="Lý do yêu cầu cập nhật"
                  required
                />
                <Button type="submit" variant="outline">
                  <XCircle className="h-4 w-4" aria-hidden="true" />
                  Yêu cầu cập nhật
                </Button>
              </form>
            </section>
          ) : null}
        </div>
      </section>
    </PageShell>
  );
}
