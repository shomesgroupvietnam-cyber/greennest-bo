import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { getScopedDocument, listScopedProjects } from "@/lib/permissions/scoped-resources";
import { updateDocumentAction } from "@/modules/documents/actions";
import { DocumentForm } from "@/modules/documents/components/document-form";
import { getDocument } from "@/modules/documents/services/document-service";

type EditDocumentPageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function EditDocumentPage({ params }: EditDocumentPageProps) {
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

  const canUpdateDocument = can(currentUser, "document.update", document);
  const projects = await listScopedProjects(currentUser);
  const updateAction = updateDocumentAction.bind(null, document.id);

  return (
    <PageShell title="Sửa hồ sơ" description="Cập nhật metadata, trạng thái, phiên bản và liên kết tài liệu.">
      {!canUpdateDocument ? (
        <div className="rounded-lg border border-dashed bg-white p-8 text-center">
          <h2 className="text-base font-semibold text-slate-950">Bạn không có quyền sửa hồ sơ</h2>
          <p className="mt-2 text-sm text-slate-600">Server action cũng sẽ từ chối mọi cập nhật khi thiếu quyền.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href={`/documents/${document.id}`}>Quay lại chi tiết</Link>
          </Button>
        </div>
      ) : (
        <DocumentForm action={updateAction} document={document} projects={projects} submitLabel="Lưu thay đổi" />
      )}
    </PageShell>
  );
}
